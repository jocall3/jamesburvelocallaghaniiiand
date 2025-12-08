import { v4 as uuidv4 } from 'uuid';

/**
 * Types representing the OpenAPI 3.1.0 Specification structure.
 * These are minimal definitions required to generate a valid spec.
 */
export namespace OpenAPIV3_1 {
    export interface Document {
        openapi: string;
        info: Info;
        servers?: Server[];
        paths?: Paths;
        components?: Components;
        security?: SecurityRequirement[];
        tags?: Tag[];
        externalDocs?: ExternalDocumentation;
        webhooks?: Record<string, PathItem | Reference>;
        'x-workflows'?: Workflow[]; // Custom extension for workflows mentioned in prompt
    }

    export interface Info {
        title: string;
        summary?: string;
        description?: string;
        termsOfService?: string;
        contact?: Contact;
        license?: License;
        version: string;
    }

    export interface Contact {
        name?: string;
        url?: string;
        email?: string;
    }

    export interface License {
        name: string;
        identifier?: string;
        url?: string;
    }

    export interface Server {
        url: string;
        description?: string;
        variables?: Record<string, ServerVariable>;
    }

    export interface ServerVariable {
        enum?: string[];
        default: string;
        description?: string;
    }

    export interface Paths {
        [path: string]: PathItem;
    }

    export interface PathItem {
        $ref?: string;
        summary?: string;
        description?: string;
        get?: Operation;
        put?: Operation;
        post?: Operation;
        delete?: Operation;
        options?: Operation;
        head?: Operation;
        patch?: Operation;
        trace?: Operation;
        servers?: Server[];
        parameters?: (Parameter | Reference)[];
    }

    export interface Operation {
        tags?: string[];
        summary?: string;
        description?: string;
        externalDocs?: ExternalDocumentation;
        operationId?: string;
        parameters?: (Parameter | Reference)[];
        requestBody?: RequestBody | Reference;
        responses: Responses;
        callbacks?: Record<string, Callback | Reference>;
        deprecated?: boolean;
        security?: SecurityRequirement[];
        servers?: Server[];
        // Custom extensions for scripts
        'x-pre-script'?: string;
        'x-post-script'?: string;
    }

    export interface Parameter {
        name: string;
        in: 'query' | 'header' | 'path' | 'cookie';
        description?: string;
        required?: boolean;
        deprecated?: boolean;
        allowEmptyValue?: boolean;
        style?: string;
        explode?: boolean;
        allowReserved?: boolean;
        schema?: Schema | Reference;
        example?: any;
        examples?: Record<string, Example | Reference>;
    }

    export interface RequestBody {
        description?: string;
        content: Record<string, MediaType>;
        required?: boolean;
    }

    export interface MediaType {
        schema?: Schema | Reference;
        example?: any;
        examples?: Record<string, Example | Reference>;
        encoding?: Record<string, Encoding>;
    }

    export interface Encoding {
        contentType?: string;
        headers?: Record<string, Header | Reference>;
        style?: string;
        explode?: boolean;
        allowReserved?: boolean;
    }

    export interface Responses {
        [code: string]: Response | Reference;
    }

    export interface Response {
        description: string;
        headers?: Record<string, Header | Reference>;
        content?: Record<string, MediaType>;
        links?: Record<string, Link | Reference>;
    }

    export interface Callback {
        [expression: string]: PathItem;
    }

    export interface Example {
        summary?: string;
        description?: string;
        value?: any;
        externalValue?: string;
    }

    export interface Header extends Parameter {} // Simplified

    export interface Components {
        schemas?: Record<string, Schema | Reference>;
        responses?: Record<string, Response | Reference>;
        parameters?: Record<string, Parameter | Reference>;
        examples?: Record<string, Example | Reference>;
        requestBodies?: Record<string, RequestBody | Reference>;
        headers?: Record<string, Header | Reference>;
        securitySchemes?: Record<string, SecurityScheme | Reference>;
        links?: Record<string, Link | Reference>;
        callbacks?: Record<string, Callback | Reference>;
        pathItems?: Record<string, PathItem | Reference>;
    }

    export interface Schema {
        [key: string]: any; // Full JSON Schema 2020-12 support
    }

    export interface Reference {
        $ref: string;
        summary?: string;
        description?: string;
    }

    export interface SecurityScheme {
        type: 'apiKey' | 'http' | 'mutualTLS' | 'oauth2' | 'openIdConnect';
        description?: string;
        name?: string;
        in?: 'query' | 'header' | 'cookie';
        scheme?: string;
        bearerFormat?: string;
        flows?: OAuthFlows;
        openIdConnectUrl?: string;
    }

    export interface OAuthFlows {
        implicit?: OAuthFlow;
        password?: OAuthFlow;
        clientCredentials?: OAuthFlow;
        authorizationCode?: OAuthFlow;
    }

    export interface OAuthFlow {
        authorizationUrl?: string;
        tokenUrl?: string;
        refreshUrl?: string;
        scopes: Record<string, string>;
    }

    export interface SecurityRequirement {
        [name: string]: string[];
    }

    export interface Tag {
        name: string;
        description?: string;
        externalDocs?: ExternalDocumentation;
    }

    export interface ExternalDocumentation {
        description?: string;
        url: string;
    }

    export interface Link {
        operationRef?: string;
        operationId?: string;
        parameters?: Record<string, any>;
        requestBody?: any;
        description?: string;
        server?: Server;
    }

    // Custom Workflow Interface
    export interface Workflow {
        workflowId: string;
        summary?: string;
        description?: string;
        steps: WorkflowStep[];
    }

    export interface WorkflowStep {
        stepId: string;
        operationId: string;
        parameters?: Record<string, any>;
        outputs?: Record<string, string>; // Map output to variable
    }
}

/**
 * Internal configuration interfaces for generating the spec.
 */
export interface ApiRouteConfig {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace';
    operationId?: string;
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: OpenAPIV3_1.Parameter[];
    requestBodySchema?: OpenAPIV3_1.Schema;
    responseSchema?: OpenAPIV3_1.Schema;
    responseCode?: number;
    requiresAuth?: boolean;
    preScript?: string;
    postScript?: string;
}

export interface ApiGeneratorConfig {
    title: string;
    version: string;
    description?: string;
    baseUrl: string;
    googleClientId?: string;
    googleClientSecret?: string; // Note: Usually not put in public spec, but flows might need it referenced
    googleRedirectUri?: string;
    contactEmail?: string;
    termsOfService?: string;
    licenseName?: string;
    licenseUrl?: string;
}

export interface WorkflowDefinition {
    id: string;
    summary: string;
    steps: {
        operationId: string;
        params?: Record<string, any>;
    }[];
}

/**
 * SpecGenerator
 * 
 * Utility to dynamically generate OpenAPI 3.1.0 compliant JSON specs.
 * Handles Google OAuth2 configuration, schema registration, and workflow definitions.
 */
export class SpecGenerator {
    private config: ApiGeneratorConfig;
    private routes: ApiRouteConfig[] = [];
    private schemas: Record<string, OpenAPIV3_1.Schema> = {};
    private workflows: WorkflowDefinition[] = [];

    constructor(config: ApiGeneratorConfig) {
        this.config = config;
    }

    /**
     * Add a route definition to the API.
     */
    public addRoute(route: ApiRouteConfig): void {
        this.routes.push(route);
    }

    /**
     * Register a reusable schema component.
     */
    public addSchema(name: string, schema: OpenAPIV3_1.Schema): void {
        this.schemas[name] = schema;
    }

    /**
     * Define a workflow sequence.
     */
    public addWorkflow(workflow: WorkflowDefinition): void {
        this.workflows.push(workflow);
    }

    /**
     * Generates the complete OpenAPI 3.1.0 Document.
     */
    public generate(): OpenAPIV3_1.Document {
        const doc: OpenAPIV3_1.Document = {
            openapi: '3.1.0',
            info: {
                title: this.config.title,
                version: this.config.version,
                description: this.config.description || 'Automatically generated API specification.',
                termsOfService: this.config.termsOfService,
                contact: this.config.contactEmail ? { email: this.config.contactEmail } : undefined,
                license: this.config.licenseName ? { name: this.config.licenseName, url: this.config.licenseUrl } : undefined,
            },
            servers: [
                {
                    url: this.config.baseUrl,
                    description: 'Main API Server',
                }
            ],
            paths: {},
            components: {
                schemas: this.schemas,
                securitySchemes: {
                    // Enforce Google OAuth2 as requested
                    googleOAuth2: {
                        type: 'oauth2',
                        description: 'Google OAuth2 Authentication',
                        flows: {
                            authorizationCode: {
                                authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                                tokenUrl: 'https://oauth2.googleapis.com/token',
                                scopes: {
                                    'openid': 'OpenID Connect',
                                    'email': 'User Email',
                                    'profile': 'User Profile',
                                    'https://www.googleapis.com/auth/drive': 'Google Drive Access', // For Drive integration
                                    'https://www.googleapis.com/auth/drive.file': 'Google Drive File Access'
                                }
                            }
                        }
                    }
                }
            },
            security: [
                {
                    googleOAuth2: ['openid', 'email', 'profile']
                }
            ],
            'x-workflows': this.generateWorkflows()
        };

        // Process Routes
        for (const route of this.routes) {
            if (!doc.paths![route.path]) {
                doc.paths![route.path] = {};
            }

            const pathItem = doc.paths![route.path];
            const operationId = route.operationId || this.generateOperationId(route.method, route.path);

            const operation: OpenAPIV3_1.Operation = {
                operationId: operationId,
                summary: route.summary,
                description: route.description,
                tags: route.tags,
                parameters: route.parameters,
                responses: {
                    [route.responseCode || 200]: {
                        description: 'Successful operation',
                        content: route.responseSchema ? {
                            'application/json': {
                                schema: route.responseSchema
                            }
                        } : undefined
                    }
                },
                // Custom script extensions
                'x-pre-script': route.preScript,
                'x-post-script': route.postScript
            };

            // Add Request Body if schema provided
            if (route.requestBodySchema) {
                operation.requestBody = {
                    content: {
                        'application/json': {
                            schema: route.requestBodySchema
                        }
                    },
                    required: true
                };
            }

            // Security override
            if (route.requiresAuth === false) {
                operation.security = [];
            } else {
                // Default global security applies, but we can be explicit if needed
                operation.security = [{
                    googleOAuth2: ['openid', 'email', 'profile']
                }];
            }

            // Assign operation to method
            pathItem[route.method] = operation;
        }

        return doc;
    }

    /**
     * Helper to generate a unique operation ID if not provided.
     */
    private generateOperationId(method: string, path: string): string {
        const cleanPath = path.replace(/[^a-zA-Z0-9]/g, '_');
        return `${method.toLowerCase()}_${cleanPath}_${uuidv4().split('-')[0]}`;
    }

    /**
     * Converts internal workflow definitions to the extension format.
     */
    private generateWorkflows(): OpenAPIV3_1.Workflow[] {
        return this.workflows.map(wf => ({
            workflowId: wf.id,
            summary: wf.summary,
            steps: wf.steps.map((step, index) => ({
                stepId: `step_${index}`,
                operationId: step.operationId,
                parameters: step.params
            }))
        }));
    }

    /**
     * Utility to merge multiple OpenAPI specs if we are aggregating 100+ APIs.
     * This is a simplified merge strategy.
     */
    public static mergeSpecs(base: OpenAPIV3_1.Document, others: OpenAPIV3_1.Document[]): OpenAPIV3_1.Document {
        const merged = JSON.parse(JSON.stringify(base));

        for (const other of others) {
            // Merge Paths
            if (other.paths) {
                merged.paths = { ...merged.paths, ...other.paths };
            }
            // Merge Components
            if (other.components) {
                merged.components = merged.components || {};
                if (other.components.schemas) {
                    merged.components.schemas = { ...merged.components.schemas, ...other.components.schemas };
                }
                // Merge other components as needed...
            }
            // Merge Workflows
            if (other['x-workflows']) {
                merged['x-workflows'] = [...(merged['x-workflows'] || []), ...other['x-workflows']];
            }
        }

        return merged;
    }
}