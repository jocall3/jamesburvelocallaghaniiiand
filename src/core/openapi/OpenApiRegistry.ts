import { EventEmitter } from 'events';

/**
 * Represents the configuration for Google Authentication.
 * The system enforces that APIs must authenticate via Google login.
 */
export interface GoogleAuthConfig {
    clientId?: string;
    clientSecret?: string; // Optional: handled securely on backend if needed
    redirectUrl: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: number;
    scopes: string[];
}

/**
 * Integration settings for external services like Google Drive and GitHub.
 */
export interface ApiIntegrations {
    googleDrive?: {
        enabled: boolean;
        targetFolderId: string;
        saveResponses: boolean;
    };
    github?: {
        enabled: boolean;
        repositoryUrl: string;
        branch: string;
        syncWorkflows: boolean;
    };
}

/**
 * Definition of a workflow associated with an API.
 * Chains multiple operations together.
 */
export interface ApiWorkflow {
    id: string;
    name: string;
    description?: string;
    steps: Array<{
        stepId: string;
        operationId: string;
        parameters: Record<string, any>;
        script?: string; // Inline script for this specific step
    }>;
}

/**
 * The complete registration object for an API.
 * Includes the OpenAPI 3.1.0 schema, scripts, auth, and integrations.
 */
export interface RegisteredApi {
    id: string;
    schema: any; // Full OpenAPI 3.1.0 JSON Specification
    baseUrl: string;
    
    // Authentication
    auth: GoogleAuthConfig;

    // Scripting hooks
    scripts: {
        preRequest?: string;  // Executed before every request
        postResponse?: string; // Executed after every response
    };

    // Workflows and Integrations
    workflows: ApiWorkflow[];
    integrations: ApiIntegrations;

    // Metadata
    createdAt: Date;
    lastAccessedAt: Date;
}

/**
 * Central registry for managing OpenAPI 3.1.0 specifications.
 * Allows dynamic registration, retrieval, and management of API schemas,
 * enforcing Google Authentication and supporting extensive integrations.
 */
export class OpenApiRegistry extends EventEmitter {
    private static instance: OpenApiRegistry;
    private apis: Map<string, RegisteredApi>;

    private constructor() {
        super();
        this.apis = new Map<string, RegisteredApi>();
    }

    /**
     * Singleton accessor.
     */
    public static getInstance(): OpenApiRegistry {
        if (!OpenApiRegistry.instance) {
            OpenApiRegistry.instance = new OpenApiRegistry();
        }
        return OpenApiRegistry.instance;
    }

    /**
     * Registers a new API into the system.
     * Validates OpenAPI 3.1.0 compliance and enforces Google Auth.
     * 
     * @param id Unique identifier for the API
     * @param schema The OpenAPI 3.1.0 JSON object
     * @param config Configuration for auth, scripts, and integrations
     */
    public register(
        id: string,
        schema: any,
        config: {
            baseUrl: string;
            auth: GoogleAuthConfig;
            scripts?: { pre?: string; post?: string };
            integrations?: ApiIntegrations;
            workflows?: ApiWorkflow[];
        }
    ): void {
        // 1. Validate OpenAPI Version
        if (!schema.openapi || !schema.openapi.startsWith('3.1')) {
            throw new Error(`Registration Failed: API '${id}' must be a valid OpenAPI 3.1.0 specification.`);
        }

        // 2. Enforce Google Authentication
        if (!config.auth || !config.auth.redirectUrl) {
            throw new Error(`Registration Failed: API '${id}' requires a valid Google Auth configuration with a redirect URL.`);
        }

        // 3. Construct the Registry Entry
        const entry: RegisteredApi = {
            id,
            schema,
            baseUrl: config.baseUrl,
            auth: config.auth,
            scripts: {
                preRequest: config.scripts?.pre || '',
                postResponse: config.scripts?.post || ''
            },
            workflows: config.workflows || [],
            integrations: config.integrations || {
                googleDrive: { enabled: false, targetFolderId: '', saveResponses: false },
                github: { enabled: false, repositoryUrl: '', branch: 'main', syncWorkflows: false }
            },
            createdAt: new Date(),
            lastAccessedAt: new Date()
        };

        // 4. Store and Emit
        this.apis.set(id, entry);
        this.emit('api:registered', entry);
        
        console.log(`[OpenApiRegistry] Successfully registered API: ${schema.info?.title || id} (v${schema.info?.version})`);
    }

    /**
     * Retrieves a registered API by ID.
     */
    public get(id: string): RegisteredApi | undefined {
        const api = this.apis.get(id);
        if (api) {
            api.lastAccessedAt = new Date();
        }
        return api;
    }

    /**
     * Returns a list of all registered APIs.
     * Capable of handling 1000+ entries efficiently.
     */
    public list(): RegisteredApi[] {
        return Array.from(this.apis.values());
    }

    /**
     * Updates the authentication token for a specific API.
     */
    public updateAuthToken(id: string, token: string, refreshToken?: string): void {
        const api = this.apis.get(id);
        if (!api) throw new Error(`API '${id}' not found.`);

        api.auth.accessToken = token;
        if (refreshToken) api.auth.refreshToken = refreshToken;
        api.lastAccessedAt = new Date();
        
        this.emit('api:auth_updated', { id, token });
    }

    /**
     * Finds a specific operation definition within a registered API using its operationId.
     */
    public findOperation(apiId: string, operationId: string): any | null {
        const api = this.apis.get(apiId);
        if (!api) return null;

        const paths = api.schema.paths;
        if (!paths) return null;

        for (const pathKey of Object.keys(paths)) {
            const pathItem = paths[pathKey];
            for (const method of ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace']) {
                if (pathItem[method] && pathItem[method].operationId === operationId) {
                    return {
                        path: pathKey,
                        method: method,
                        definition: pathItem[method],
                        server: api.baseUrl
                    };
                }
            }
        }
        return null;
    }

    /**
     * Adds a workflow to an existing API.
     */
    public addWorkflow(apiId: string, workflow: ApiWorkflow): void {
        const api = this.apis.get(apiId);
        if (!api) throw new Error(`API '${apiId}' not found.`);

        api.workflows.push(workflow);
        this.emit('api:workflow_added', { apiId, workflow });
    }

    /**
     * Removes an API from the registry.
     */
    public remove(id: string): boolean {
        const exists = this.apis.has(id);
        if (exists) {
            this.apis.delete(id);
            this.emit('api:removed', id);
        }
        return exists;
    }

    /**
     * Clears all registries.
     */
    public clear(): void {
        this.apis.clear();
        this.emit('registry:cleared');
    }
}