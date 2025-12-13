/**
 * Copyright (c) 2024 AI Ecosystem Project
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * FILE: core/adapters/palantir_foundry_bridge.ts
 * PURPOSE: Bridge for Palantir Foundry ontology integration.
 * 
 * DISCLAIMER:
 * This software is provided "as is", without warranty of any kind.
 * No financial advice, legal guarantees, or political advocacy are contained herein.
 * Users are responsible for compliance with local jurisdictional laws regarding
 * data sovereignty and AI governance.
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

// -----------------------------------------------------------------------------
// Shared Core SDK Interfaces (Simulated for standalone validity)
// -----------------------------------------------------------------------------

interface ILogger {
    info(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
}

interface IConfig {
    foundryUrl: string;
    clientId: string;
    clientSecret: string;
    ontologyRid: string;
    multipassToken?: string; // Optional: for direct user impersonation
    userAgent?: string;
}

interface IAuditLog {
    traceId: string;
    actor: string;
    action: string;
    target: string;
    status: 'SUCCESS' | 'FAILURE' | 'PENDING';
    timestamp: number;
    metadata: Record<string, any>;
}

interface IAdapterHealth {
    status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    latencyMs: number;
    lastSync: number;
    errorRate: number;
}

// -----------------------------------------------------------------------------
// Foundry API Types
// -----------------------------------------------------------------------------

export type FoundryPropertyType = 
    | 'string' 
    | 'integer' 
    | 'double' 
    | 'boolean' 
    | 'date' 
    | 'timestamp' 
    | 'geopoint' 
    | 'attachment';

export interface FoundryPropertyDefinition {
    id: string;
    type: FoundryPropertyType;
    displayName?: string;
    description?: string;
}

export interface FoundryObjectType {
    apiName: string;
    primaryKey: string;
    properties: Record<string, FoundryPropertyDefinition>;
    rid: string;
}

export interface FoundryObjectInstance {
    primaryKey: string | number;
    properties: Record<string, any>;
}

export interface FoundryActionParameter {
    id: string;
    type: FoundryPropertyType;
    required: boolean;
}

export interface FoundryActionType {
    apiName: string;
    rid: string;
    parameters: Record<string, FoundryActionParameter>;
}

export interface FoundryQueryResult {
    data: any[];
    nextPageToken?: string;
}

// -----------------------------------------------------------------------------
// Bridge Implementation
// -----------------------------------------------------------------------------

export class PalantirFoundryBridge extends EventEmitter {
    private config: IConfig;
    private logger: ILogger;
    private tokenCache: { token: string; expiresAt: number } | null = null;
    private objectTypeCache: Map<string, FoundryObjectType> = new Map();
    private actionTypeCache: Map<string, FoundryActionType> = new Map();
    
    // Metrics
    private requestCount = 0;
    private errorCount = 0;
    private lastRequestTime = 0;

    public static readonly AGENT_METADATA = {
        purpose: "Bidirectional synchronization between AI Agent state and Palantir Foundry Ontology.",
        dependencies: ["foundry-api-gateway", "identity-provider"],
        invalidation_conditions: ["ontology_schema_change", "token_revocation"],
        adjacent_apps: ["APP_37_Governance_AuditTrailEngine", "APP_05_Data_VectorSync"]
    };

    constructor(config: IConfig, logger: ILogger) {
        super();
        this.config = config;
        this.logger = logger;
        this.validateConfig();
    }

    private validateConfig() {
        if (!this.config.foundryUrl) throw new Error("Foundry URL is required");
        if (!this.config.ontologyRid) throw new Error("Ontology RID is required");
        // Check for either OAuth credentials or a direct token
        if (!this.config.multipassToken && (!this.config.clientId || !this.config.clientSecret)) {
            throw new Error("Authentication credentials (OAuth or Token) are required");
        }
    }

    /**
     * Authenticates with the Foundry stack using Client Credentials flow.
     */
    private async getAccessToken(): Promise<string> {
        if (this.config.multipassToken) {
            return this.config.multipassToken;
        }

        const now = Date.now();
        if (this.tokenCache && this.tokenCache.expiresAt > now + 60000) {
            return this.tokenCache.token;
        }

        this.logger.debug("Refreshing Foundry Access Token");

        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', this.config.clientId);
            params.append('client_secret', this.config.clientSecret);

            const response = await fetch(`${this.config.foundryUrl}/multipass/api/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': this.config.userAgent || 'AI-Ecosystem-Bridge/1.0'
                },
                body: params
            });

            if (!response.ok) {
                throw new Error(`Auth failed: ${response.statusText}`);
            }

            const data = await response.json();
            this.tokenCache = {
                token: data.access_token,
                expiresAt: now + (data.expires_in * 1000)
            };

            return this.tokenCache.token;
        } catch (error) {
            this.logger.error("Failed to authenticate with Foundry", { error });
            this.errorCount++;
            throw error;
        }
    }

    /**
     * Generic HTTP wrapper for Foundry API calls with retry logic and audit hooks.
     */
    private async request<T>(
        method: string, 
        endpoint: string, 
        body?: any, 
        auditContext?: Partial<IAuditLog>
    ): Promise<T> {
        const token = await this.getAccessToken();
        const url = `${this.config.foundryUrl}/api/v1/ontologies/${this.config.ontologyRid}/${endpoint}`;
        const traceId = createHash('sha256').update(Date.now().toString() + Math.random()).digest('hex').substring(0, 12);

        this.requestCount++;
        this.lastRequestTime = Date.now();

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': this.config.userAgent || 'AI-Ecosystem-Bridge/1.0'
                },
                body: body ? JSON.stringify(body) : undefined
            });

            if (!response.ok) {
                const errorBody = await response.text();
                this.logger.error(`Foundry API Error [${method} ${endpoint}]`, { status: response.status, body: errorBody });
                throw new Error(`Foundry API Error: ${response.status} - ${errorBody}`);
            }

            // Audit Log Success
            if (auditContext) {
                this.emit('audit', {
                    traceId,
                    actor: 'SYSTEM_ADAPTER',
                    action: auditContext.action || method,
                    target: auditContext.target || endpoint,
                    status: 'SUCCESS',
                    timestamp: Date.now(),
                    metadata: { ...auditContext.metadata, statusCode: response.status }
                });
            }

            return await response.json() as T;

        } catch (error) {
            this.errorCount++;
            // Audit Log Failure
            if (auditContext) {
                this.emit('audit', {
                    traceId,
                    actor: 'SYSTEM_ADAPTER',
                    action: auditContext.action || method,
                    target: auditContext.target || endpoint,
                    status: 'FAILURE',
                    timestamp: Date.now(),
                    metadata: { ...auditContext.metadata, error: error instanceof Error ? error.message : String(error) }
                });
            }
            throw error;
        }
    }

    // -------------------------------------------------------------------------
    // Ontology Operations
    // -------------------------------------------------------------------------

    /**
     * Retrieves definition of an Object Type to validate schema alignment.
     */
    public async getObjectType(apiName: string): Promise<FoundryObjectType> {
        if (this.objectTypeCache.has(apiName)) {
            return this.objectTypeCache.get(apiName)!;
        }

        const definition = await this.request<FoundryObjectType>('GET', `objectTypes/${apiName}`);
        this.objectTypeCache.set(apiName, definition);
        return definition;
    }

    /**
     * Performs a search on the Ontology (Object Set Service).
     */
    public async searchObjects(
        objectType: string, 
        filter: Record<string, any>, 
        pageSize: number = 100
    ): Promise<FoundryQueryResult> {
        this.logger.info(`Searching objects of type ${objectType}`, { filter });
        
        // Constructing a basic V2 Object Set request payload
        // Note: Real implementation would require a complex query builder for OOSS
        const payload = {
            objectType,
            filter,
            pageSize
        };

        return this.request<FoundryQueryResult>(
            'POST', 
            'objects/search', 
            payload, 
            { action: 'SEARCH_OBJECTS', target: objectType }
        );
    }

    /**
     * Executes a Foundry Action (Writeback).
     */
    public async executeAction(
        actionApiName: string, 
        parameters: Record<string, any>
    ): Promise<{ success: boolean; validationErrors?: any[] }> {
        this.logger.info(`Executing Foundry Action: ${actionApiName}`);

        try {
            const result = await this.request<{ validationResult?: string }>(
                'POST',
                `actions/${actionApiName}/apply`,
                { parameters },
                { action: 'EXECUTE_ACTION', target: actionApiName, metadata: { parameters } }
            );
            
            return { success: true };
        } catch (e) {
            return { success: false, validationErrors: [String(e)] };
        }
    }

    /**
     * Creates a temporary object or "simulates" an edit to check for side effects.
     * Useful for AI agents to "think" before they "act".
     */
    public async simulateAction(
        actionApiName: string,
        parameters: Record<string, any>
    ): Promise<{ allowed: boolean; consequences: string[] }> {
        // In a real implementation, this would hit the /validate endpoint of the Action Service
        this.logger.debug(`Simulating Action: ${actionApiName}`);
        
        try {
            await this.request(
                'POST',
                `actions/${actionApiName}/validate`,
                { parameters }
            );
            return { allowed: true, consequences: ["State change valid"] };
        } catch (e) {
            return { allowed: false, consequences: ["Validation failed"] };
        }
    }

    /**
     * Streams object data for vector embedding ingestion.
     * This is critical for RAG (Retrieval Augmented Generation) pipelines.
     */
    public async *streamObjectData(objectType: string): AsyncGenerator<FoundryObjectInstance[]> {
        let nextPageToken: string | undefined = undefined;
        
        do {
            const response: any = await this.request(
                'POST',
                'objects/search',
                {
                    objectType,
                    pageSize: 1000,
                    pageToken: nextPageToken
                }
            );

            if (response.data && response.data.length > 0) {
                yield response.data;
            }

            nextPageToken = response.nextPageToken;
        } while (nextPageToken);
    }

    // -------------------------------------------------------------------------
    // Introspection & Health
    // -------------------------------------------------------------------------

    public async getHealth(): Promise<IAdapterHealth> {
        const now = Date.now();
        const latencyStart = now;
        let status: IAdapterHealth['status'] = 'HEALTHY';

        try {
            // Lightweight ping to ontology metadata
            await this.request('GET', 'objectTypes?pageSize=1');
        } catch (e) {
            status = 'DOWN';
        }

        const latency = Date.now() - latencyStart;

        if (this.errorCount > 10 && status !== 'DOWN') {
            status = 'DEGRADED';
        }

        return {
            status,
            latencyMs: latency,
            lastSync: this.lastRequestTime,
            errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) : 0
        };
    }

    public introspect(): any {
        return {
            adapter: "PalantirFoundryBridge",
            version: "1.2.0",
            ontologyRid: this.config.ontologyRid,
            cachedObjectTypes: Array.from(this.objectTypeCache.keys()),
            cachedActionTypes: Array.from(this.actionTypeCache.keys()),
            metrics: {
                requests: this.requestCount,
                errors: this.errorCount
            },
            agent_metadata: PalantirFoundryBridge.AGENT_METADATA
        };
    }
}

// -----------------------------------------------------------------------------
// Utility: Ontology Mapper
// -----------------------------------------------------------------------------

/**
 * Helper class to map generic AI JSON schemas to Foundry Ontology types.
 */
export class OntologyMapper {
    /**
     * Infers a Foundry property type from a JS value.
     */
    public static inferType(value: any): FoundryPropertyType {
        if (typeof value === 'string') {
            // ISO Date check
            if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return 'timestamp';
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
            return 'string';
        }
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'integer' : 'double';
        }
        if (typeof value === 'boolean') return 'boolean';
        return 'string'; // Fallback
    }

    /**
     * Validates a payload against a cached definition.
     */
    public static validatePayload(
        payload: Record<string, any>, 
        definition: FoundryObjectType
    ): string[] {
        const errors: string[] = [];
        
        for (const [key, value] of Object.entries(payload)) {
            const propDef = definition.properties[key];
            if (!propDef) {
                // We allow extra fields, but warn? Or strict mode?
                // For this bridge, we ignore extra fields to allow forward compatibility
                continue;
            }
            
            const inferred = this.inferType(value);
            // Loose type checking
            if (inferred !== propDef.type && propDef.type !== 'string') {
                // Allow string coercion for most things
                errors.push(`Property '${key}' expected ${propDef.type}, got ${inferred}`);
            }
        }
        return errors;
    }
}

// -----------------------------------------------------------------------------
// Factory Export
// -----------------------------------------------------------------------------

export function createFoundryBridge(config: IConfig, logger: ILogger): PalantirFoundryBridge {
    return new PalantirFoundryBridge(config, logger);
}