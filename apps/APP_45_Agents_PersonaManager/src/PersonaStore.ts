/*
 * Copyright 2024 Aetheris Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
    AuthContext,
    Logger,
    EventBus,
    AetherisError,
    DatabaseClient,
    CacheClient,
    AetherisEvent,
} from '@aetheris/sdk';
import { AIProviderFactory, TextGenerationModel } from '@aetheris/sdk/ai';

// --- Zod Schemas for Validation ---

export const PersonaToneSchema = z.enum([
    'formal', 'casual', 'humorous', 'sarcastic', 'empathetic', 'neutral', 'authoritative'
]);

export const PersonaStyleSchema = z.enum([
    'concise', 'verbose', 'socratic', 'narrative', 'technical', 'poetic'
]);

export const PersonaToolUsagePolicySchema = z.enum([
    'eager', 'cautious', 'minimal', 'never', 'always_ask'
]);

export const PersonaStatusSchema = z.enum(['draft', 'active', 'archived', 'under_review']);

export const VendorPreferencesSchema = z.object({
    text_generation: z.string().optional().describe("e.g., 'openai/gpt-4-turbo' or 'anthropic/claude-3-opus'"),
    code_generation: z.string().optional().describe("e.g., 'google/gemini-1.5-pro' or 'mistral/codestral'"),
    analysis: z.string().optional().describe("e.g., 'databricks/dbrx-instruct'"),
    evaluation: z.string().optional().describe("e.g., 'aetheris/evaluator-v1'"),
}).optional();

export const PersonaSchema = z.object({
    id: z.string().uuid(),
    version: z.number().int().positive(),
    name: z.string().min(3).max(100),
    description: z.string().max(500),
    systemPrompt: z.string().min(50).max(16000),
    tone: PersonaToneSchema,
    style: PersonaStyleSchema,
    expertiseDomains: z.array(z.string().max(50)).max(20),
    constraints: z.array(z.string().max(255)).max(50),
    toolUsagePolicy: PersonaToolUsagePolicySchema,
    vendorPreferences: VendorPreferencesSchema,
    metadata: z.record(z.string(), z.any()).optional(),
    organizationId: z.string().uuid(),
    authorId: z.string().uuid(),
    status: PersonaStatusSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
    lineageId: z.string().uuid().describe("ID shared by all versions of a persona"),
});

export type Persona = z.infer<typeof PersonaSchema>;
export type CreatePersonaInput = Omit<Persona, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'lineageId' | 'status'> & { lineageId?: string };
export type UpdatePersonaInput = Partial<Omit<Persona, 'id' | 'organizationId' | 'authorId' | 'createdAt' | 'updatedAt' | 'lineageId'>>;

// --- Custom Error Types ---

export class PersonaNotFoundError extends AetherisError {
    constructor(id: string) {
        super(`Persona with ID or lineageId '${id}' not found.`, 'NOT_FOUND');
    }
}

export class PersonaValidationError extends AetherisError {
    constructor(message: string, details?: any) {
        super(`Persona validation failed: ${message}`, 'VALIDATION_ERROR', details);
    }
}

export class PersonaSynthesisError extends AetherisError {
    constructor(message: string, vendor?: string) {
        super(`Failed to synthesize persona with vendor '${vendor}': ${message}`, 'INTEGRATION_ERROR');
    }
}

// --- Storage Abstraction ---

export interface IPersonaStore {
    create(authContext: AuthContext, personaData: Omit<Persona, 'createdAt' | 'updatedAt'>): Promise<Persona>;
    findById(authContext: AuthContext, id: string): Promise<Persona | null>;
    findByLineageId(authContext: AuthContext, lineageId: string, version?: number): Promise<Persona | null>;
    update(authContext: AuthContext, id: string, updates: UpdatePersonaInput): Promise<Persona>;
    archive(authContext: AuthContext, id: string): Promise<Persona>;
    list(authContext: AuthContext, filters: { status?: PersonaStatus; expertiseDomain?: string }, pagination: { limit: number; offset: number }): Promise<Persona[]>;
    search(authContext: AuthContext, query: string, limit: number): Promise<Persona[]>;
}

// --- Concrete Postgres Storage Implementation ---

export class PostgresPersonaStore implements IPersonaStore {
    constructor(
        private readonly db: DatabaseClient,
        private readonly logger: Logger
    ) {}

    async create(authContext: AuthContext, personaData: Omit<Persona, 'createdAt' | 'updatedAt'>): Promise<Persona> {
        this.logger.info({ message: 'Creating new persona in DB', personaName: personaData.name, orgId: authContext.organizationId });
        const query = `
            INSERT INTO agent_personas (
                id, version, name, description, system_prompt, tone, style,
                expertise_domains, constraints, tool_usage_policy, vendor_preferences,
                metadata, organization_id, author_id, status, lineage_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *;
        `;
        const params = [
            personaData.id, personaData.version, personaData.name, personaData.description,
            personaData.systemPrompt, personaData.tone, personaData.style,
            JSON.stringify(personaData.expertiseDomains), JSON.stringify(personaData.constraints),
            personaData.toolUsagePolicy, JSON.stringify(personaData.vendorPreferences || {}),
            JSON.stringify(personaData.metadata || {}), authContext.organizationId, authContext.userId,
            personaData.status, personaData.lineageId
        ];

        try {
            const result = await this.db.query(query, params);
            return this.mapRowToPersona(result.rows[0]);
        } catch (error) {
            this.logger.error({ message: 'Error creating persona in DB', error });
            throw new AetherisError('Database error during persona creation.', 'DATABASE_ERROR');
        }
    }

    async findById(authContext: AuthContext, id: string): Promise<Persona | null> {
        const query = `SELECT * FROM agent_personas WHERE id = $1 AND organization_id = $2;`;
        const result = await this.db.query(query, [id, authContext.organizationId]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapRowToPersona(result.rows[0]);
    }

    async findByLineageId(authContext: AuthContext, lineageId: string, version?: number): Promise<Persona | null> {
        let query: string;
        let params: any[];

        if (version) {
            query = `SELECT * FROM agent_personas WHERE lineage_id = $1 AND version = $2 AND organization_id = $3;`;
            params = [lineageId, version, authContext.organizationId];
        } else {
            // Get latest version
            query = `
                SELECT * FROM agent_personas
                WHERE lineage_id = $1 AND organization_id = $2
                ORDER BY version DESC
                LIMIT 1;
            `;
            params = [lineageId, authContext.organizationId];
        }

        const result = await this.db.query(query, params);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapRowToPersona(result.rows[0]);
    }

    async update(authContext: AuthContext, id: string, updates: UpdatePersonaInput): Promise<Persona> {
        const { status, ...otherUpdates } = updates;
        // Note: This implementation creates a new version for any significant change,
        // embodying a more robust, auditable approach. A simple UPDATE is also possible.
        const existingPersona = await this.findById(authContext, id);
        if (!existingPersona) {
            throw new PersonaNotFoundError(id);
        }

        const newVersion = existingPersona.version + 1;
        const newPersonaData: Persona = {
            ...existingPersona,
            ...otherUpdates,
            id: uuidv4(),
            version: newVersion,
            status: status || existingPersona.status,
            updatedAt: new Date(),
        };

        return this.create(authContext, newPersonaData);
    }

    async archive(authContext: AuthContext, id: string): Promise<Persona> {
        this.logger.info({ message: 'Archiving persona', personaId: id, orgId: authContext.organizationId });
        const query = `
            UPDATE agent_personas
            SET status = 'archived', updated_at = NOW()
            WHERE id = $1 AND organization_id = $2
            RETURNING *;
        `;
        const result = await this.db.query(query, [id, authContext.organizationId]);
        if (result.rows.length === 0) {
            throw new PersonaNotFoundError(id);
        }
        return this.mapRowToPersona(result.rows[0]);
    }

    async list(authContext: AuthContext, filters: { status?: PersonaStatus; expertiseDomain?: string }, pagination: { limit: number; offset: number }): Promise<Persona[]> {
        let query = `SELECT * FROM agent_personas WHERE organization_id = $1`;
        const params: any[] = [authContext.organizationId];
        let paramIndex = 2;

        if (filters.status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }
        if (filters.expertiseDomain) {
            query += ` AND $${paramIndex++} = ANY(expertise_domains)`;
            params.push(filters.expertiseDomain);
        }

        query += ` ORDER BY updated_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++};`;
        params.push(pagination.limit, pagination.offset);

        const result = await this.db.query(query, params);
        return result.rows.map(this.mapRowToPersona);
    }

    async search(authContext: AuthContext, query: string, limit: number): Promise<Persona[]> {
        // Using a simple LIKE search here. For production, a full-text search index (e.g., tsvector) is recommended.
        const sqlQuery = `
            SELECT * FROM agent_personas
            WHERE organization_id = $1 AND (
                name ILIKE $2 OR
                description ILIKE $2 OR
                system_prompt ILIKE $2
            )
            ORDER BY updated_at DESC
            LIMIT $3;
        `;
        const result = await this.db.query(sqlQuery, [authContext.organizationId, `%${query}%`, limit]);
        return result.rows.map(this.mapRowToPersona);
    }

    private mapRowToPersona(row: any): Persona {
        const persona = {
            ...row,
            systemPrompt: row.system_prompt,
            expertiseDomains: row.expertise_domains,
            constraints: row.constraints,
            toolUsagePolicy: row.tool_usage_policy,
            vendorPreferences: row.vendor_preferences,
            organizationId: row.organization_id,
            authorId: row.author_id,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            lineageId: row.lineage_id,
        };
        // This will throw if the data from DB is invalid, which is a good safeguard.
        return PersonaSchema.parse(persona);
    }
}

// --- Persona Manager Service ---

/**
 * @class PersonaManager
 * Manages the lifecycle and application of agent personas.
 *
 * ARCHITECTURAL TENSION: Standardization vs. Customization
 * This service embodies the tension between providing standardized, governable persona
 * templates and allowing for highly customized, AI-synthesized personas.
 * - Standardization is achieved through structured schemas (tone, style), templates,
 *   and validation rules, ensuring enterprise-grade consistency and control.
 * - Customization is enabled via the free-form `systemPrompt` and powerful
 *   `synthesizePersona` method, which leverages generative AI to create novel,
 *   task-specific personalities, providing maximum flexibility.
 * This duality allows the system to serve both large teams requiring strict governance
 * and individual power-users demanding creative freedom.
 */
export class PersonaManager {
    private readonly sessionCache: CacheClient;

    // Extensibility hooks
    private preCreateHooks: Array<(data: CreatePersonaInput) => Promise<CreatePersonaInput>> = [];
    private postCreateHooks: Array<(persona: Persona) => Promise<void>> = [];

    constructor(
        private readonly store: IPersonaStore,
        private readonly logger: Logger,
        private readonly eventBus: EventBus,
        private readonly aiProviderFactory: AIProviderFactory,
        cacheClient: CacheClient,
    ) {
        this.sessionCache = cacheClient.withPrefix('persona-manager:session:');
    }

    /**
     * Registers a hook to be executed before a persona is created.
     * @param hook A function that can modify the persona creation data.
     */
    public registerPreCreateHook(hook: (data: CreatePersonaInput) => Promise<CreatePersonaInput>) {
        this.preCreateHooks.push(hook);
    }

    /**
     * Registers a hook to be executed after a persona is created.
     * @param hook A function that receives the newly created persona.
     */
    public registerPostCreateHook(hook: (persona: Persona) => Promise<void>) {
        this.postCreateHooks.push(hook);
    }

    /**
     * Creates a new persona, optionally creating a new version of an existing one.
     */
    async createPersona(authContext: AuthContext, input: CreatePersonaInput): Promise<Persona> {
        this.logger.info({ message: 'Attempting to create persona', name: input.name, orgId: authContext.organizationId });

        let processedInput = input;
        for (const hook of this.preCreateHooks) {
            processedInput = await hook(processedInput);
        }

        const validationResult = PersonaSchema.omit({
            id: true, version: true, createdAt: true, updatedAt: true, lineageId: true, status: true
        }).safeParse(processedInput);

        if (!validationResult.success) {
            throw new PersonaValidationError('Invalid persona data provided.', validationResult.error.flatten());
        }

        const lineageId = input.lineageId || uuidv4();
        let version = 1;

        if (input.lineageId) {
            const latestVersion = await this.store.findByLineageId(authContext, input.lineageId);
            if (latestVersion) {
                version = latestVersion.version + 1;
            }
        }

        const personaData: Omit<Persona, 'createdAt' | 'updatedAt'> = {
            ...processedInput,
            id: uuidv4(),
            version,
            lineageId,
            organizationId: authContext.organizationId,
            authorId: authContext.userId,
            status: 'draft',
        };

        const newPersona = await this.store.create(authContext, personaData);

        await this.eventBus.publish(new AetherisEvent('persona.created', {
            personaId: newPersona.id,
            lineageId: newPersona.lineageId,
            version: newPersona.version,
            authorId: authContext.userId,
            organizationId: authContext.organizationId,
        }));

        for (const hook of this.postCreateHooks) {
            await hook(newPersona);
        }

        this.logger.info({ message: 'Successfully created persona', personaId: newPersona.id, name: newPersona.name });
        return newPersona;
    }

    /**
     * Retrieves a specific version of a persona by its ID.
     */
    async getPersonaById(authContext: AuthContext, id: string): Promise<Persona> {
        const persona = await this.store.findById(authContext, id);
        if (!persona) {
            throw new PersonaNotFoundError(id);
        }
        return persona;
    }

    /**
     * Retrieves a persona by its lineage ID, optionally specifying a version.
     * If no version is specified, the latest active version is returned.
     */
    async getPersonaByLineageId(authContext: AuthContext, lineageId: string, version?: number): Promise<Persona> {
        const persona = await this.store.findByLineageId(authContext, lineageId, version);
        if (!persona) {
            throw new PersonaNotFoundError(lineageId);
        }
        return persona;
    }

    /**
     * Updates a persona, which creates a new version.
     */
    async updatePersona(authContext: AuthContext, id: string, updates: UpdatePersonaInput): Promise<Persona> {
        this.logger.info({ message: 'Updating persona', personaId: id, orgId: authContext.organizationId });
        const existingPersona = await this.getPersonaById(authContext, id);

        const updatedPersona = await this.createPersona(authContext, {
            ...existingPersona,
            ...updates,
            lineageId: existingPersona.lineageId,
        });

        await this.eventBus.publish(new AetherisEvent('persona.updated', {
            previousPersonaId: id,
            newPersonaId: updatedPersona.id,
            lineageId: updatedPersona.lineageId,
            version: updatedPersona.version,
            authorId: authContext.userId,
        }));

        return updatedPersona;
    }

    /**
     * Archives a persona, making it inactive.
     */
    async archivePersona(authContext: AuthContext, id: string): Promise<Persona> {
        const archivedPersona = await this.store.archive(authContext, id);
        await this.eventBus.publish(new AetherisEvent('persona.archived', {
            personaId: id,
            lineageId: archivedPersona.lineageId,
            authorId: authContext.userId,
        }));
        return archivedPersona;
    }

    /**
     * Lists personas for an organization with filtering and pagination.
     */
    async listPersonas(authContext: AuthContext, filters: { status?: PersonaStatus; expertiseDomain?: string } = {}, pagination: { limit: number; offset: number } = { limit: 50, offset: 0 }): Promise<Persona[]> {
        return this.store.list(authContext, filters, pagination);
    }

    /**
     * Dynamically assigns a persona to an agent session.
     * This is a key function for real-time personality switching.
     * @param sessionId The unique identifier for an agent's conversation or task session.
     * @param personaId The ID of the persona to activate.
     * @param ttlSeconds Time-to-live for the session assignment in seconds.
     */
    async activatePersonaForSession(authContext: AuthContext, sessionId: string, personaId: string, ttlSeconds: number = 3600): Promise<void> {
        // Ensure the persona exists and belongs to the org before caching.
        await this.getPersonaById(authContext, personaId);
        await this.sessionCache.set(sessionId, personaId, ttlSeconds);
        this.logger.info({ message: 'Activated persona for session', sessionId, personaId, ttl: ttlSeconds });
    }

    /**
     * Retrieves the active persona for a given session.
     */
    async getActivePersonaForSession(authContext: AuthContext, sessionId: string): Promise<Persona | null> {
        const personaId = await this.sessionCache.get(sessionId);
        if (!personaId) {
            return null;
        }
        try {
            return await this.getPersonaById(authContext, personaId);
        } catch (error) {
            if (error instanceof PersonaNotFoundError) {
                this.logger.warn({ message: 'Stale persona ID in session cache', sessionId, personaId });
                await this.sessionCache.delete(sessionId);
                return null;
            }
            throw error;
        }
    }

    /**
     * Synthesizes a new persona using a generative AI model.
     * This is a powerful feature for creating highly customized personas from a simple prompt.
     * @param goal A high-level description of the desired persona.
     * @param vendor The preferred AI vendor to use for synthesis (e.g., 'anthropic', 'openai').
     */
    async synthesizePersona(authContext: AuthContext, goal: string, vendor: 'anthropic' | 'openai' | 'google' = 'anthropic'): Promise<CreatePersonaInput> {
        this.logger.info({ message: 'Synthesizing new persona', goal, vendor, orgId: authContext.organizationId });

        const model = this.aiProviderFactory.create<TextGenerationModel>({
            provider: vendor,
            // Select a powerful model for this creative task
            model: vendor === 'anthropic' ? 'claude-3-opus-20240229' : 'gpt-4-turbo',
        });

        const synthesisPrompt = this.getSynthesisPrompt(goal);

        try {
            const response = await model.generate({
                system: "You are an expert AI agent persona designer. Your task is to generate a JSON object representing a detailed and effective agent persona based on a user's goal. The JSON must strictly adhere to the provided schema.",
                prompt: synthesisPrompt,
                max_tokens: 4096,
                temperature: 0.5,
                response_format: { type: 'json_object' },
            });

            const synthesizedJson = JSON.parse(response.content);
            
            // Validate and structure the AI's output
            const parsed = z.object({
                name: z.string(),
                description: z.string(),
                systemPrompt: z.string(),
                tone: PersonaToneSchema,
                style: PersonaStyleSchema,
                expertiseDomains: z.array(z.string()),
                constraints: z.array(z.string()),
                toolUsagePolicy: PersonaToolUsagePolicySchema,
            }).parse(synthesizedJson);

            return {
                ...parsed,
                organizationId: authContext.organizationId,
                authorId: authContext.userId,
            };

        } catch (error: any) {
            this.logger.error({ message: 'Persona synthesis failed', error: error.message, vendor });
            throw new PersonaSynthesisError(error.message, vendor);
        }
    }

    private getSynthesisPrompt(goal: string): string {
        return `
            User Goal: "${goal}"

            Based on the user's goal, generate a complete persona definition as a JSON object.
            The persona should be coherent, well-defined, and optimized for driving an AI agent.
            
            Follow these instructions carefully:
            1.  **name**: A short, descriptive name (e.g., "Socratic Code Mentor", "Empathetic HR Assistant").
            2.  **description**: A one-sentence summary of the persona's purpose.
            3.  **systemPrompt**: A detailed, multi-paragraph system prompt. This is the most important part. It should establish the persona's identity, core directives, rules of engagement, and output format. Use clear, direct language.
            4.  **tone**: Choose the most appropriate tone from: ${PersonaToneSchema.options.join(', ')}.
            5.  **style**: Choose the most appropriate style from: ${PersonaStyleSchema.options.join(', ')}.
            6.  **expertiseDomains**: A JSON array of 3-5 strings representing key knowledge areas.
            7.  **constraints**: A JSON array of 3-5 strings defining strict rules or limitations (e.g., "Never provide medical advice.", "Always disclose that you are an AI.").
            8.  **toolUsagePolicy**: Choose the most appropriate policy from: ${PersonaToolUsagePolicySchema.options.join(', ')}.

            Example Output Format:
            {
              "name": "Example Name",
              "description": "Example description.",
              "systemPrompt": "You are...",
              "tone": "formal",
              "style": "concise",
              "expertiseDomains": ["domain1", "domain2"],
              "constraints": ["constraint1", "constraint2"],
              "toolUsagePolicy": "cautious"
            }

            Now, generate the JSON for the user's goal.
        `;
    }
}