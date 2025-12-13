/*
 * Copyright 2024 M Corp
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

/**
 * @file main.ts
 * @description Entry point for APP_57_Marketplace_AgentSkillStore.
 * This application serves as a centralized, secure marketplace for AI agent "skills".
 * It manages the lifecycle of skills, from publication and validation to discovery and acquisition.
 * The core architectural tension is Openness vs. Control: fostering a vibrant, open ecosystem
 * of third-party skills while enforcing rigorous security, safety, and quality controls
 * through an automated, multi-stage validation pipeline.
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import { z } from 'zod';
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

// --- Core SDK Imports ---
// These would be actual imports from the shared SDK package
import { CoreSDK, CoreAuth, CoreLogger, CoreEventBus, CoreConfig, AppIdentity } from '@mcorp/core-sdk';
import { Skill, SkillManifest, SkillValidationReport, SkillAcquisitionRecord } from '@mcorp/core-sdk/ontology';

// --- Agent Metadata ---
// This machine-readable block enables self-querying and ecosystem-wide reasoning.
const agent_metadata = {
  purpose: "To provide a secure and scalable marketplace for discovering, publishing, and acquiring skills for AI agents. It acts as a trusted intermediary, ensuring skills are validated and versioned.",
  dependencies: [
    "APP_03_Auth_IdentityService: For authenticating publishers and consumers.",
    "APP_11_Billing_UsageTracker: For metering skill usage and handling monetization.",
    "APP_37_Governance_AuditTrailEngine: For logging all lifecycle events of a skill.",
    "APP_42_Storage_ObjectGateway: For storing skill package artifacts.",
    "APP_25_Security_ThreatScanner: For the security validation stage of the skill publication pipeline."
  ],
  invalidation_conditions: [
    "A major vulnerability is discovered in the skill sandboxing environment.",
    "The core Skill ontology in the SDK changes in a non-backward-compatible way.",
    "Regulatory changes impose new requirements on third-party code distribution."
  ],
  adjacent_apps: [
    "APP_14_Agents_MultiModelOrchestrator: Consumes skills from this marketplace.",
    "APP_61_DevTools_SkillIDE: A development environment that publishes skills to this marketplace."
  ]
};

// --- Service Interfaces (simulating dependency injection) ---
// In a real app, these would be implemented in separate files and injected.

interface IStorageService {
  uploadSkillPackage(skillId: string, version: string, packageBuffer: Buffer): Promise<{ url: string; checksum: string }>;
  getSkillPackageDownloadUrl(skillId:string, version: string): Promise<string>;
}

interface IValidationService {
  runValidationPipeline(skillId: string, manifest: SkillManifest, packageBuffer: Buffer): Promise<SkillValidationReport>;
}

interface IDatabaseService {
  createSkill(data: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Skill>;
  findSkillById(id: string): Promise<Skill | null>;
  findSkillByNameAndPublisher(name: string, publisherId: string): Promise<Skill | null>;

  listSkills(filters: { category?: string; publisherId?: string; tags?: string[] }, pagination: { page: number; pageSize: number }): Promise<Skill[]>;
  updateSkill(id: string, data: Partial<Skill>): Promise<Skill>;
  createSkillVersion(skillId: string, versionData: any): Promise<any>;
  getSkillVersion(skillId: string, version: string): Promise<any>;
  recordAcquisition(record: Omit<SkillAcquisitionRecord, 'id' | 'acquiredAt'>): Promise<SkillAcquisitionRecord>;
  getAcquisitionsForOrg(orgId: string): Promise<SkillAcquisitionRecord[]>;
}

// --- Zod Schemas for API Validation ---

const SkillManifestSchema = z.object({
  specVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  name: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, "Name can only contain letters, numbers, underscores, and hyphens."),
  displayName: z.string().min(3).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be in semver format (e.g., 1.0.0)"),
  description: z.string().min(20).max(500),
  category: z.string(),
  tags: z.array(z.string()).max(10),
  author: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  runtime: z.enum(['wasm', 'javascript-islate', 'python-sandbox']),
  entrypoint: z.string(),
  inputSchema: z.object({}).passthrough(), // JSON Schema for input
  outputSchema: z.object({}).passthrough(), // JSON Schema for output
  requiredPermissions: z.array(z.string()),
  pricing: z.object({
    model: z.enum(['free', 'per-call', 'subscription']),
    price: z.number().nonnegative().optional(), // Price in micro-units
    currency: z.string().length(3).optional(),
  }),
});

const PublishSkillResponseSchema = z.object({
  skillId: z.string().uuid(),
  version: z.string(),
  status: z.enum(['pending_validation', 'published', 'failed_validation']),
  validationReportId: z.string().uuid().optional(),
});

const SkillSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    displayName: z.string(),
    description: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    publisherId: z.string().uuid(),
    latestVersion: z.string(),
    averageRating: z.number().min(0).max(5),
    totalAcquisitions: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

const ListSkillsResponseSchema = z.object({
    skills: z.array(SkillSchema),
    page: z.number().int(),
    pageSize: z.number().int(),
    totalPages: z.number().int(),
    totalCount: z.number().int(),
});

// --- Main Application Class ---

class AgentSkillStoreApp {
  private app: FastifyInstance;
  private logger: CoreLogger;
  private auth: CoreAuth;
  private eventBus: CoreEventBus;
  private config: CoreConfig;

  // Injected services
  private dbService: IDatabaseService;
  private storageService: IStorageService;
  private validationService: IValidationService;

  constructor() {
    this.app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
    this.app.setValidatorCompiler(validatorCompiler);
    this.app.setSerializerCompiler(serializerCompiler);

    // Initialize Core SDK components
    const appIdentity: AppIdentity = {
        name: 'APP_57_Marketplace_AgentSkillStore',
        version: '1.0.0',
        instanceId: `ass-${process.pid}-${Date.now()}`
    };
    CoreSDK.init(appIdentity);
    this.logger = CoreSDK.getLogger();
    this.auth = CoreSDK.getAuth();
    this.eventBus = CoreSDK.getEventBus();
    this.config = CoreSDK.getConfig();

    // Mock service implementations
    this.dbService = this.getDbService();
    this.storageService = this.getStorageService();
    this.validationService = this.getValidationService();

    this.setupPlugins();
    this.registerRoutes();
  }

  private setupPlugins(): void {
    this.app.register(fastifyCors, {
      origin: this.config.get('CORS_ORIGIN') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });
    this.app.register(fastifyMultipart, {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB limit for skill packages
            files: 2, // manifest + package
        }
    });

    // Add a decorator for authenticated user/org context
    this.app.decorate('authContext', null);
    this.app.addHook('preHandler', this.auth.requireAuth.bind(this.auth));
    this.app.addHook('preHandler', (req, reply, done) => {
        // This would be populated by the requireAuth hook
        // @ts-ignore
        req.authContext = req.raw.authContext;
        done();
    });
  }

  private registerRoutes(): void {
    this.logger.info('Registering routes...');

    this.app.get('/health', async (req, reply) => {
      return reply.status(200).send({ status: 'ok', app: agent_metadata.purpose });
    });

    // --- Self-Introspection Routes ---
    this.registerIntrospectionRoutes();

    // --- Skill Lifecycle Routes ---
    this.registerSkillPublicationRoutes();
    this.registerSkillDiscoveryRoutes();
    this.registerSkillManagementRoutes();

    // --- Skill Acquisition & Usage Routes ---
    this.registerSkillAcquisitionRoutes();

    this.logger.info('Routes registered.');
  }

  private registerIntrospectionRoutes(): void {
    const introspectionSchema = { hide: true }; // Hide from public OpenAPI specs
    this.app.get('/introspect', { schema: introspectionSchema }, (req, reply) => reply.send(agent_metadata));
    this.app.get('/assumptions', { schema: introspectionSchema }, (req, reply) => reply.send({
        assumptions: [
            "Skill consumers (agents) operate in a secure sandbox environment capable of enforcing permissions.",
            "The shared Core SDK Auth service provides reliable organization and user identity.",
            "Skill publishers act in good faith, but a zero-trust validation pipeline is necessary.",
            "The underlying object storage is durable and highly available.",
            "The event bus guarantees at-least-once delivery for critical events like 'skill.published'."
        ]
    }));
    this.app.get('/failure-modes', { schema: introspectionSchema }, (req, reply) => reply.send({
        failure_modes: [
            {
                mode: "Malicious Skill Bypass",
                description: "A cleverly crafted skill package bypasses the automated validation pipeline, leading to a supply chain attack on consuming agents.",
                mitigation: "Multi-layered defense: static analysis, dynamic sandboxed execution, AI-based code review, and publisher reputation scoring. Continuous updates to the validation pipeline based on new threat intelligence.",
            },
            {
                mode: "Denial of Service via Validation",
                description: "An attacker floods the publication endpoint with large or complex skill packages, consuming all validation pipeline resources.",
                mitigation: "Rate limiting, resource quotas per publisher, and an asynchronous validation process with timeouts.",
            },
            {
                mode: "Database Inconsistency",
                description: "A failure during the multi-step publication process (DB write, storage upload, event publish) leads to an inconsistent state.",
                mitigation: "Use of database transactions and idempotent operations. A reconciliation worker can periodically scan for and fix inconsistent skill states.",
            }
        ]
    }));
    this.app.get('/update-triggers', { schema: introspectionSchema }, (req, reply) => reply.send({
        update_triggers: [
            "New runtime environment for skills is introduced (e.g., 'rust-wasm').",
            "Change in the core Skill ontology from the shared SDK.",
            "Integration of a new AI vendor for the security validation stage.",
            "Updates to compliance requirements (e.g., GDPR, CCPA) affecting skill data handling."
        ]
    }));
  }

  private registerSkillPublicationRoutes(): void {
    this.app.post('/skills', {
      schema: {
        description: 'Publishes a new skill or a new version of an existing skill. This is a multipart/form-data endpoint.',
        summary: 'Publish a skill',
        tags: ['Skills'],
        consumes: ['multipart/form-data'],
        body: {
            type: 'object',
            required: ['manifest', 'package'],
            properties: {
                manifest: { type: 'string', description: 'A JSON string of the skill manifest.' },
                package: { type: 'string', format: 'binary', description: 'The skill code package (e.g., a .wasm file or .js bundle).' }
            }
        },
        response: {
          202: PublishSkillResponseSchema,
          400: z.object({ error: z.string(), details: z.any().optional() }),
          409: z.object({ error: z.string(), message: z.string() }),
        },
      }
    }, async (req, reply) => {
      // @ts-ignore
      const { orgId, userId } = req.authContext;
      const data = await req.file();
      if (!data) {
          return reply.status(400).send({ error: "Multipart request is missing file data." });
      }

      let manifest: SkillManifest;
      let skillPackage: Buffer;

      // Process multipart data
      try {
        const parts = req.parts();
        let manifestPart, packagePart;
        for await (const part of parts) {
            if (part.fieldname === 'manifest') manifestPart = part;
            if (part.fieldname === 'package') packagePart = part;
        }

        if (!manifestPart || !packagePart) {
            return reply.status(400).send({ error: "Request must include 'manifest' and 'package' parts." });
        }

        const manifestStr = (await manifestPart.toBuffer()).toString('utf-8');
        manifest = JSON.parse(manifestStr);
        skillPackage = await packagePart.toBuffer();

      } catch (err) {
        this.logger.error('Failed to parse multipart form data', { error: err });
        return reply.status(400).send({ error: 'Invalid multipart form data.' });
      }

      // 1. Validate Manifest Schema
      const validationResult = SkillManifestSchema.safeParse(manifest);
      if (!validationResult.success) {
        return reply.status(400).send({ error: 'Invalid manifest schema.', details: validationResult.error.issues });
      }
      const validManifest = validationResult.data;

      // 2. Check for existing skill with the same name/version from the same publisher
      const existingSkill = await this.dbService.findSkillByNameAndPublisher(validManifest.name, orgId);
      if (existingSkill) {
        const existingVersion = await this.dbService.getSkillVersion(existingSkill.id, validManifest.version);
        if (existingVersion) {
            return reply.status(409).send({ error: 'Conflict', message: `Version ${validManifest.version} of skill '${validManifest.name}' already exists.` });
        }
      }

      // 3. Create initial DB record in 'pending' state
      let skillId: string;
      if (existingSkill) {
        skillId = existingSkill.id;
        await this.dbService.createSkillVersion(skillId, {
            version: validManifest.version,
            manifest: validManifest,
            status: 'pending_validation',
            publisherId: orgId,
        });
      } else {
        const newSkill = await this.dbService.createSkill({
            name: validManifest.name,
            displayName: validManifest.displayName,
            description: validManifest.description,
            category: validManifest.category,
            tags: validManifest.tags,
            publisherId: orgId,
            latestVersion: validManifest.version,
            status: 'pending_validation',
            // other fields initialized
        });
        skillId = newSkill.id;
      }

      // 4. Asynchronously trigger validation pipeline
      // This is where the Openness vs. Control tension is implemented.
      // We accept the skill but don't make it available until it passes checks.
      this.triggerValidationPipeline(skillId, validManifest, skillPackage, orgId, userId);

      await this.eventBus.publish('skill.publication.pending', {
        skillId,
        version: validManifest.version,
        publisherId: orgId,
        triggeredBy: userId,
      });

      return reply.status(202).send({
        skillId,
        version: validManifest.version,
        status: 'pending_validation',
      });
    });
  }

  private async triggerValidationPipeline(skillId: string, manifest: SkillManifest, skillPackage: Buffer, orgId: string, userId: string): Promise<void> {
    this.logger.info(`Starting validation pipeline for skill ${skillId} v${manifest.version}`);
    try {
        // Step A: Upload package to secure storage for scanning
        const { url, checksum } = await this.storageService.uploadSkillPackage(skillId, manifest.version, skillPackage);
        await this.dbService.updateSkill(skillId, { packageUrl: url, packageChecksum: checksum });

        // Step B: Run the multi-stage validation service
        // This service would internally call other services like APP_25_Security_ThreatScanner,
        // and use AI models (e.g., Anthropic Claude for code safety review, OpenAI GPT-4 for description policy check).
        const report = await this.validationService.runValidationPipeline(skillId, manifest, skillPackage);

        // Step C: Update skill status based on report
        if (report.passed) {
            await this.dbService.updateSkill(skillId, { status: 'published' });
            this.logger.info(`Skill ${skillId} v${manifest.version} passed validation and is now published.`);
            await this.eventBus.publish('skill.publication.success', {
                skillId,
                version: manifest.version,
                publisherId: orgId,
                manifest,
            });
        } else {
            await this.dbService.updateSkill(skillId, { status: 'failed_validation', validationReport: report });
            this.logger.warn(`Skill ${skillId} v${manifest.version} failed validation.`, { report });
            await this.eventBus.publish('skill.publication.failed', {
                skillId,
                version: manifest.version,
                publisherId: orgId,
                reason: 'Failed validation pipeline',
                report,
            });
        }
    } catch (error) {
        this.logger.error(`Critical error in validation pipeline for skill ${skillId}`, { error });
        await this.dbService.updateSkill(skillId, { status: 'failed_validation', validationReport: { error: 'Internal pipeline error' } });
        await this.eventBus.publish('skill.publication.error', {
            skillId,
            version: manifest.version,
            publisherId: orgId,
            error: error.message,
        });
    }
  }

  private registerSkillDiscoveryRoutes(): void {
    this.app.get('/skills', {
        schema: {
            description: 'List and search for available skills.',
            summary: 'List skills',
            tags: ['Skills'],
            querystring: z.object({
                page: z.coerce.number().int().min(1).default(1),
                pageSize: z.coerce.number().int().min(1).max(100).default(20),
                category: z.string().optional(),
                publisherId: z.string().uuid().optional(),
                tags: z.string().optional().describe('Comma-separated list of tags'),
                q: z.string().optional().describe('Full-text search query'),
            }),
            response: {
                200: ListSkillsResponseSchema,
            }
        }
    }, async (req, reply) => {
        const { page, pageSize, category, publisherId, tags } = req.query;
        const filters = { category, publisherId, tags: tags?.split(',') };
        // In a real app, the dbService would handle pagination and full-text search
        const skills = await this.dbService.listSkills(filters, { page, pageSize });
        // Mocked response structure
        return reply.send({
            skills: skills,
            page,
            pageSize,
            totalPages: Math.ceil(100 / pageSize), // mocked total
            totalCount: 100, // mocked total
        });
    });

    this.app.get('/skills/:skillId', {
        schema: {
            description: 'Get detailed information about a specific skill.',
            summary: 'Get skill details',
            tags: ['Skills'],
            params: z.object({ skillId: z.string().uuid() }),
            response: {
                200: SkillSchema,
                404: z.object({ error: z.string() }),
            }
        }
    }, async (req, reply) => {
        const { skillId } = req.params;
        const skill = await this.dbService.findSkillById(skillId);
        if (!skill) {
            return reply.status(404).send({ error: 'Skill not found.' });
        }
        return reply.send(skill);
    });

    this.app.get('/skills/:skillId/versions/:version', {
        schema: {
            description: 'Get details for a specific version of a skill.',
            summary: 'Get skill version',
            tags: ['Skills'],
            params: z.object({
                skillId: z.string().uuid(),
                version: z.string().regex(/^\d+\.\d+\.\d+$/),
            }),
            response: {
                // Define a detailed version schema
                200: z.object({
                    skillId: z.string().uuid(),
                    version: z.string(),
                    manifest: SkillManifestSchema,
                    status: z.string(),
                    publishedAt: z.string().datetime(),
                    packageChecksum: z.string(),
                }),
                404: z.object({ error: z.string() }),
            }
        }
    }, async (req, reply) => {
        const { skillId, version } = req.params;
        const skillVersion = await this.dbService.getSkillVersion(skillId, version);
        if (!skillVersion) {
            return reply.status(404).send({ error: 'Skill version not found.' });
        }
        return reply.send(skillVersion);
    });
  }

  private registerSkillManagementRoutes(): void {
    // Placeholder for PUT /skills/:skillId to update metadata (e.g., description, tags)
    // Placeholder for DELETE /skills/:skillId to deprecate a skill (soft delete)
  }

  private registerSkillAcquisitionRoutes(): void {
    this.app.post('/skills/:skillId/acquire', {
        schema: {
            description: 'Acquire a skill for the authenticated organization. This creates an entitlement record.',
            summary: 'Acquire a skill',
            tags: ['Acquisition'],
            params: z.object({ skillId: z.string().uuid() }),
            response: {
                201: z.object({
                    acquisitionId: z.string().uuid(),
                    skillId: z.string().uuid(),
                    orgId: z.string().uuid(),
                    acquiredAt: z.string().datetime(),
                    status: z.string(),
                }),
                404: z.object({ error: z.string() }),
                402: z.object({ error: z.string(), message: z.string() }), // Payment Required
            }
        }
    }, async (req, reply) => {
        // @ts-ignore
        const { orgId } = req.authContext;
        const { skillId } = req.params;

        const skill = await this.dbService.findSkillById(skillId);
        if (!skill || skill.status !== 'published') {
            return reply.status(404).send({ error: 'Skill not found or is not published.' });
        }

        // Monetization Logic Hook
        // This is an enterprise upsell path. The logic could be complex.
        // It would integrate with APP_11_Billing_UsageTracker.
        if (skill.pricing.model !== 'free') {
            // Here you would check for existing subscriptions or trigger a payment flow.
            // For now, we'll simulate a "payment required" error.
            this.logger.warn(`Acquisition attempt for paid skill ${skillId} by org ${orgId} without payment method.`);
            return reply.status(402).send({ error: 'Payment Required', message: 'This is a paid skill. Please add a payment method to your organization.' });
        }

        const acquisition = await this.dbService.recordAcquisition({
            skillId,
            orgId,
            userId: req.authContext.userId,
            pricingModel: skill.pricing.model,
            priceAtAcquisition: skill.pricing.price || 0,
        });

        await this.eventBus.publish('skill.acquisition.success', {
            acquisitionId: acquisition.id,
            skillId,
            orgId,
        });

        return reply.status(201).send(acquisition);
    });

    this.app.get('/skills/:skillId/versions/:version/download', {
        schema: {
            description: 'Get a short-lived secure download URL for an acquired skill package.',
            summary: 'Download skill package',
            tags: ['Acquisition'],
            params: z.object({
                skillId: z.string().uuid(),
                version: z.string().regex(/^\d+\.\d+\.\d+$/),
            }),
            response: {
                200: z.object({ downloadUrl: z.string().url(), expiresAt: z.string().datetime() }),
                403: z.object({ error: z.string() }),
                404: z.object({ error: z.string() }),
            }
        }
    }, async (req, reply) => {
        // @ts-ignore
        const { orgId } = req.authContext;
        const { skillId, version } = req.params;

        // 1. Check if the org has acquired this skill
        const acquisitions = await this.dbService.getAcquisitionsForOrg(orgId);
        if (!acquisitions.some(a => a.skillId === skillId)) {
            return reply.status(403).send({ error: 'Forbidden. Your organization has not acquired this skill.' });
        }

        // 2. Get the secure, short-lived URL from the storage service
        try {
            const downloadUrl = await this.storageService.getSkillPackageDownloadUrl(skillId, version);
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // Expires in 5 minutes
            return reply.send({ downloadUrl, expiresAt });
        } catch (error) {
            this.logger.error(`Failed to get download URL for skill ${skillId} v${version}`, { error });
            return reply.status(404).send({ error: 'Skill package not found or an error occurred.' });
        }
    });
  }

  public async start(): Promise<void> {
    const port = this.config.get('PORT') || 3057;
    const host = this.config.get('HOST') || '0.0.0.0';
    try {
      await this.app.listen({ port, host });
      this.logger.info(`🚀 APP_57_Marketplace_AgentSkillStore running at http://${host}:${port}`);
    } catch (err) {
      this.logger.error('Failed to start server', { error: err });
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    this.logger.info('Shutting down server...');
    await this.app.close();
  }

  // --- Mock Service Implementations ---
  // In a real application, these would be in separate files and much more complex.
  private getDbService(): IDatabaseService {
    this.logger.warn('Using mock DatabaseService.');
    return {
        createSkill: async (data) => ({ id: 'uuid-goes-here', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data }),
        findSkillById: async (id) => ({ id, name: 'test-skill', displayName: 'Test Skill', description: 'A skill for testing.', category: 'testing', tags: ['test'], publisherId: 'org-uuid', latestVersion: '1.0.0', averageRating: 4.5, totalAcquisitions: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'published', pricing: { model: 'free' } }),
        findSkillByNameAndPublisher: async (name, publisherId) => null,
        listSkills: async (filters, pagination) => [],
        updateSkill: async (id, data) => ({ id, name: 'test-skill', displayName: 'Test Skill', description: 'A skill for testing.', category: 'testing', tags: ['test'], publisherId: 'org-uuid', latestVersion: '1.0.0', averageRating: 4.5, totalAcquisitions: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'published', pricing: { model: 'free' }, ...data }),
        createSkillVersion: async (skillId, versionData) => ({ skillId, ...versionData }),
        getSkillVersion: async (skillId, version) => ({ skillId, version, manifest: {}, status: 'published', publishedAt: new Date().toISOString(), packageChecksum: 'sha256-checksum' }),
        recordAcquisition: async (record) => ({ id: 'acq-uuid', acquiredAt: new Date().toISOString(), ...record }),
        getAcquisitionsForOrg: async (orgId) => [{ id: 'acq-uuid', skillId: 'uuid-goes-here', orgId, userId: 'user-uuid', acquiredAt: new Date().toISOString(), pricingModel: 'free', priceAtAcquisition: 0 }],
    };
  }

  private getStorageService(): IStorageService {
    this.logger.warn('Using mock StorageService.');
    return {
        uploadSkillPackage: async (skillId, version, buffer) => ({ url: `https://storage.example.com/skills/${skillId}/${version}.pkg`, checksum: 'sha256-checksum' }),
        getSkillPackageDownloadUrl: async (skillId, version) => `https://storage.example.com/skills/${skillId}/${version}.pkg?sig=temporary-signature`,
    };
  }

  private getValidationService(): IValidationService {
    this.logger.warn('Using mock ValidationService.');
    return {
        runValidationPipeline: async (skillId, manifest, buffer) => {
            this.logger.info(`Mock validation for ${skillId}: Simulating AI scans and static analysis.`);
            // Simulate integration with AI vendors for safety checks
            // e.g., const codeSafetyScore = await anthropic.checkCode(buffer);
            // e.g., const policyCompliance = await openai.checkDescription(manifest.description);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate async work
            
            // In a real scenario, this report would be very detailed.
            return {
                passed: true,
                details: [
                    { check: 'StaticAnalysis', passed: true, details: 'No vulnerabilities found.' },
                    { check: 'AISafetyScan (Anthropic Claude)', passed: true, details: 'Code semantics appear safe.' },
                    { check: 'AIPolicyScan (OpenAI GPT-4)', passed: true, details: 'Description complies with usage policies.' },
                    { check: 'SandboxExecution', passed: true, details: 'Skill executed without violations.' },
                ],
                engineVersion: '1.2.0',
                completedAt: new Date().toISOString(),
            };
        }
    };
  }
}

// --- Application Entry Point ---

const server = new AgentSkillStoreApp();

server.start().catch(err => {
  console.error('Failed to start application', err);
  process.exit(1);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.stop().then(() => {
    console.log('Server shut down successfully.');
    process.exit(0);
  }).catch(err => {
    console.error('Shutdown error:', err);
    process.exit(1);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));