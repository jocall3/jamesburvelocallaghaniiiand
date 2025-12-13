/**
 * @file src/index.ts
 * @license Apache-2.0
 * @copyright 2024 Aetheris PBC
 * @description Main service for APP_06_Inference_UnifiedGateway.
 * This service acts as a central, multi-provider API gateway for AI model inference.
 * It standardizes requests, routes them to the appropriate backend (e.g., Azure, Bedrock, Vertex AI),
 * and normalizes responses, providing a consistent interface for all upstream applications.
 */

// =================================================================
// AGENT METADATA
// =================================================================
/*
agent_metadata:
  purpose: >-
    To provide a unified, resilient, and observable entry point for all synchronous
    AI model inference requests across the Aetheris ecosystem. It abstracts away
    provider-specific complexities like authentication, API formats, and error handling.
  dependencies:
    - '@aetheris/core/sdk': For configuration, logging, credentials, event bus, and common types.
    - 'APP_01_Inference_CostRouter': Can be used as a downstream target for routing decisions.
    - 'APP_10_Billing_TokenAccountant': Consumes events emitted by this gateway for usage tracking.
    - 'APP_37_Governance_AuditTrailEngine': Consumes events for compliance and audit logging.
  invalidation_conditions:
    - Major breaking changes in a downstream provider's API (e.g., Azure, Bedrock).
    - Deprecation of a core model family.
    - Changes in the shared Aetheris authentication or event bus protocol.
  adjacent_apps:
    - 'APP_01_Inference_CostRouter'
    - 'APP_02_Inference_FallbackEngine'
    - 'APP_07_Inference_LoadBalancer'
    - 'APP_10_Billing_TokenAccountant'
*/

// =================================================================
// IMPORTS
// =================================================================

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  AetherisCoreSDK,
  Logger,
  ConfigManager,
  CredentialProvider,
  EventBus,
  AetherisEvent,
  UnifiedInferenceRequest,
  UnifiedInferenceResponse,
  ModelCapability,
  ProviderIdentifier,
  StandardError,
  ErrorCodes,
} from '@aetheris/core';

// =================================================================
// TYPE DEFINITIONS AND INTERFACES
// =================================================================

/**
 * Defines the contract for any AI provider adapter.
 * This allows for a plug-and-play architecture for adding new providers.
 */
interface InferenceProvider {
  readonly identifier: ProviderIdentifier;
  readonly capabilities: ModelCapability[];

  /**
   * Transforms a unified Aetheris request into the provider-specific format.
   * @param request The standardized incoming request.
   * @returns The provider-specific payload and request headers.
   */
  transformRequest(request: UnifiedInferenceRequest): Promise<{ payload: any; headers: Record<string, string> }>;

  /**
   * Executes the inference call to the provider's API endpoint.
   * @param payload The provider-specific payload.
   * @param headers The provider-specific headers.
   * @param model The specific model to target.
   * @returns The raw response from the provider.
   */
  executeInference(payload: any, headers: Record<string, string>, model: string): Promise<any>;

  /**
   * Transforms the provider's response into the unified Aetheris format.
   * @param providerResponse The raw response from the provider.
   * @param requestStartTime The timestamp when the request processing started.
   * @returns The standardized Aetheris inference response.
   */
  transformResponse(providerResponse: any, requestStartTime: number): UnifiedInferenceResponse;

  /**
   * Handles provider-specific errors and maps them to standard Aetheris errors.
   * @param error The error object.
   * @param requestId The unique ID of the request.
   * @returns A standardized Aetheris error response.
   */
  handleError(error: any, requestId: string): UnifiedInferenceResponse;
}

type ProviderRegistry = Map<ProviderIdentifier, InferenceProvider>;

// =================================================================
// PROVIDER ADAPTER IMPLEMENTATIONS
// =================================================================

// Note: In a real-world scenario, each provider would be in its own file.
// They are co-located here for the purpose of this single-file generation.

class AzureOpenAIProvider implements InferenceProvider {
  readonly identifier: ProviderIdentifier = 'azure_openai';
  readonly capabilities: ModelCapability[] = ['chat_completion', 'text_embedding', 'image_generation'];
  private readonly httpClient: AxiosInstance;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: Logger;

  constructor(credentialProvider: CredentialProvider, logger: Logger) {
    this.httpClient = axios.create();
    this.credentialProvider = credentialProvider;
    this.logger = logger;
  }

  async transformRequest(request: UnifiedInferenceRequest): Promise<{ payload: any; headers: Record<string, string> }> {
    const credentials = await this.credentialProvider.getCredentials(this.identifier, {
      resource: request.model,
    });

    if (!credentials || !credentials.apiKey || !credentials.endpoint) {
      throw new StandardError('Missing Azure OpenAI credentials', ErrorCodes.CONFIGURATION_ERROR);
    }

    const { deployment, apiVersion } = this.parseModelIdentifier(request.model);

    const payload = {
      messages: request.messages,
      max_tokens: request.parameters.max_tokens,
      temperature: request.parameters.temperature,
      top_p: request.parameters.top_p,
      stream: false, // Unified Gateway handles synchronous requests only
      ...request.provider_specific_config?.azure_openai,
    };

    const headers = {
      'Content-Type': 'application/json',
      'api-key': credentials.apiKey,
    };

    return { payload, headers };
  }

  async executeInference(payload: any, headers: Record<string, string>, model: string): Promise<any> {
    const credentials = await this.credentialProvider.getCredentials(this.identifier, { resource: model });
    const { deployment, apiVersion } = this.parseModelIdentifier(model);
    const url = `${credentials.endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    
    const response = await this.httpClient.post(url, payload, { headers });
    return response.data;
  }

  transformResponse(providerResponse: any, requestStartTime: number): UnifiedInferenceResponse {
    const finishTime = Date.now();
    const choice = providerResponse.choices[0];
    return {
      id: providerResponse.id,
      model: providerResponse.model,
      provider: this.identifier,
      created: providerResponse.created,
      usage: {
        prompt_tokens: providerResponse.usage.prompt_tokens,
        completion_tokens: providerResponse.usage.completion_tokens,
        total_tokens: providerResponse.usage.total_tokens,
      },
      content: [
        {
          type: 'text',
          text: choice.message.content,
        },
      ],
      finish_reason: choice.finish_reason,
      latency_ms: finishTime - requestStartTime,
      _raw: providerResponse,
    };
  }

  handleError(error: any, requestId: string): UnifiedInferenceResponse {
    const latency_ms = Date.now() - (error.requestStartTime || Date.now());
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const providerError = error.response?.data?.error || {};
      let errorCode: ErrorCodes;

      switch (status) {
        case 400: errorCode = ErrorCodes.INVALID_REQUEST; break;
        case 401: errorCode = ErrorCodes.AUTHENTICATION_ERROR; break;
        case 403: errorCode = ErrorCodes.PERMISSION_DENIED; break;
        case 429: errorCode = ErrorCodes.RATE_LIMIT_EXCEEDED; break;
        case 500:
        case 503:
        default:
          errorCode = ErrorCodes.PROVIDER_ERROR; break;
      }

      return {
        id: requestId,
        error: {
          code: errorCode,
          message: providerError.message || error.message,
          provider_code: providerError.code,
          provider_message: providerError.message,
        },
        latency_ms,
        provider: this.identifier,
      };
    }
    return {
      id: requestId,
      error: {
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred in the Azure provider adapter.',
      },
      latency_ms,
      provider: this.identifier,
    };
  }

  private parseModelIdentifier(model: string): { deployment: string; apiVersion: string } {
    // Example model format: "azure_openai:gpt-4o/2024-05-13"
    const parts = model.split(':').pop()?.split('/');
    if (!parts || parts.length !== 2) {
      throw new StandardError(`Invalid Azure model identifier format: ${model}`, ErrorCodes.INVALID_REQUEST);
    }
    return { deployment: parts[0], apiVersion: parts[1] };
  }
}

class AmazonBedrockProvider implements InferenceProvider {
  readonly identifier: ProviderIdentifier = 'aws_bedrock';
  readonly capabilities: ModelCapability[] = ['chat_completion', 'text_embedding'];
  private readonly httpClient: AxiosInstance;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: Logger;

  constructor(credentialProvider: CredentialProvider, logger: Logger) {
    // In a real implementation, this would use the AWS SDK for signing requests.
    // We simulate this with axios for simplicity.
    this.httpClient = axios.create();
    this.credentialProvider = credentialProvider;
    this.logger = logger;
  }

  async transformRequest(request: UnifiedInferenceRequest): Promise<{ payload: any; headers: Record<string, string> }> {
    const credentials = await this.credentialProvider.getCredentials(this.identifier, {
      model: request.model,
    });

    if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey || !credentials.region) {
      throw new StandardError('Missing AWS Bedrock credentials', ErrorCodes.CONFIGURATION_ERROR);
    }

    // Bedrock has different payload structures per model provider (e.g., Anthropic, Cohere)
    // This demonstrates the tension: standardization vs. provider-specific features.
    const modelId = request.model.split(':').pop()!;
    let payload;

    if (modelId.startsWith('anthropic')) {
      payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: request.parameters.max_tokens,
        messages: request.messages.map(m => ({ role: m.role, content: [{ type: 'text', text: m.content }]})),
        temperature: request.parameters.temperature,
        ...request.provider_specific_config?.aws_bedrock?.anthropic,
      };
    } else if (modelId.startsWith('cohere')) {
      payload = {
        prompt: request.messages.filter(m => m.role === 'user').map(m => m.content).join('\n'),
        max_tokens: request.parameters.max_tokens,
        temperature: request.parameters.temperature,
        ...request.provider_specific_config?.aws_bedrock?.cohere,
      };
    } else {
      throw new StandardError(`Unsupported Bedrock model family for model: ${modelId}`, ErrorCodes.MODEL_NOT_FOUND);
    }

    // AWS Signature V4 signing would happen here. We'll mock the headers.
    const headers = {
      'Content-Type': 'application/json',
      'X-Amz-Date': new Date().toISOString(),
      'Authorization': `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/...`, // This is a placeholder
    };

    return { payload, headers };
  }

  async executeInference(payload: any, headers: Record<string, string>, model: string): Promise<any> {
    const credentials = await this.credentialProvider.getCredentials(this.identifier, { model });
    const modelId = model.split(':').pop()!;
    const url = `https://bedrock-runtime.${credentials.region}.amazonaws.com/model/${modelId}/invoke`;
    
    // The actual AWS SDK call would be here.
    this.logger.warn('Simulating AWS Bedrock API call. Real implementation requires AWS SDK v4 signing.');
    // Mock response for demonstration
    if (modelId.startsWith('anthropic')) {
        return {
            id: `msg_${uuidv4()}`,
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: 'This is a simulated response from Bedrock/Anthropic.' }],
            model: modelId,
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: { input_tokens: 50, output_tokens: 40 },
        };
    }
    throw new StandardError('Simulation for this Bedrock model is not implemented.', ErrorCodes.NOT_IMPLEMENTED);
  }

  transformResponse(providerResponse: any, requestStartTime: number): UnifiedInferenceResponse {
    const finishTime = Date.now();
    // Response transformation is also model-family specific
    if (providerResponse.type === 'message' && providerResponse.role === 'assistant') { // Anthropic-style
      return {
        id: providerResponse.id,
        model: providerResponse.model,
        provider: this.identifier,
        created: Math.floor(Date.now() / 1000),
        usage: {
          prompt_tokens: providerResponse.usage.input_tokens,
          completion_tokens: providerResponse.usage.output_tokens,
          total_tokens: providerResponse.usage.input_tokens + providerResponse.usage.output_tokens,
        },
        content: providerResponse.content.map((c: any) => ({ type: c.type, text: c.text })),
        finish_reason: providerResponse.stop_reason,
        latency_ms: finishTime - requestStartTime,
        _raw: providerResponse,
      };
    }
    // Add transformers for other model families (Cohere, Meta, etc.) here
    throw new StandardError('Unsupported Bedrock response format.', ErrorCodes.PROVIDER_ERROR);
  }

  handleError(error: any, requestId: string): UnifiedInferenceResponse {
    // Error handling would parse AWS SDK errors
    this.logger.error({ error, requestId }, 'Error in Bedrock provider');
    return {
      id: requestId,
      error: {
        code: ErrorCodes.PROVIDER_ERROR,
        message: error.message || 'An error occurred with the AWS Bedrock provider.',
        provider_code: error.name, // e.g., 'AccessDeniedException'
      },
      latency_ms: Date.now() - (error.requestStartTime || Date.now()),
      provider: this.identifier,
    };
  }
}

// Stub for Google Vertex AI to show extensibility
class GoogleVertexAIProvider implements InferenceProvider {
    readonly identifier: ProviderIdentifier = 'gcp_vertex_ai';
    readonly capabilities: ModelCapability[] = ['chat_completion', 'text_embedding'];
    constructor(private credentialProvider: CredentialProvider, private logger: Logger) {}
    async transformRequest(request: UnifiedInferenceRequest): Promise<{ payload: any; headers: Record<string, string> }> {
        this.logger.warn('GoogleVertexAIProvider.transformRequest is not fully implemented.');
        throw new StandardError('Not Implemented', ErrorCodes.NOT_IMPLEMENTED);
    }
    async executeInference(payload: any, headers: Record<string, string>, model: string): Promise<any> {
        this.logger.warn('GoogleVertexAIProvider.executeInference is not fully implemented.');
        throw new StandardError('Not Implemented', ErrorCodes.NOT_IMPLEMENTED);
    }
    transformResponse(providerResponse: any, requestStartTime: number): UnifiedInferenceResponse {
        this.logger.warn('GoogleVertexAIProvider.transformResponse is not fully implemented.');
        throw new StandardError('Not Implemented', ErrorCodes.NOT_IMPLEMENTED);
    }
    handleError(error: any, requestId: string): UnifiedInferenceResponse {
        this.logger.warn('GoogleVertexAIProvider.handleError is not fully implemented.');
        return { id: requestId, error: { code: ErrorCodes.NOT_IMPLEMENTED, message: 'Provider not implemented.' }, provider: this.identifier };
    }
}


// =================================================================
// GATEWAY SERVICE
// =================================================================

class UnifiedGatewayService {
  private readonly app: FastifyInstance;
  private readonly logger: Logger;
  private readonly config: ConfigManager;
  private readonly eventBus: EventBus;
  private readonly providers: ProviderRegistry;

  constructor() {
    AetherisCoreSDK.initialize();
    this.logger = AetherisCoreSDK.getLogger('APP_06_Inference_UnifiedGateway');
    this.config = AetherisCoreSDK.getConfigManager();
    this.eventBus = AetherisCoreSDK.getEventBus();
    const credentialProvider = AetherisCoreSDK.getCredentialProvider();

    this.providers = new Map();
    this.registerProvider(new AzureOpenAIProvider(credentialProvider, this.logger));
    this.registerProvider(new AmazonBedrockProvider(credentialProvider, this.logger));
    this.registerProvider(new GoogleVertexAIProvider(credentialProvider, this.logger));

    this.app = Fastify({
      logger: false, // Use our custom logger
      requestIdHeader: 'x-aetheris-request-id',
      genReqId: () => uuidv4(),
    });

    this.setupRoutes();
    this.logger.info('UnifiedGatewayService initialized.');
  }

  private registerProvider(provider: InferenceProvider): void {
    if (this.providers.has(provider.identifier)) {
      this.logger.warn(`Provider with identifier '${provider.identifier}' is already registered. Overwriting.`);
    }
    this.providers.set(provider.identifier, provider);
    this.logger.info(`Registered inference provider: ${provider.identifier}`);
  }

  private setupRoutes(): void {
    this.app.addHook('onRequest', (request, reply, done) => {
      request.log.info({ req: request }, 'incoming request');
      done();
    });
    this.app.addHook('onResponse', (request, reply, done) => {
      request.log.info({ res: reply }, 'request completed');
      done();
    });

    this.app.post('/v1/inference', this.handleInferenceRequest.bind(this));

    // Self-querying agent endpoints
    this.app.get('/introspect', this.handleIntrospect.bind(this));
    this.app.get('/assumptions', this.handleAssumptions.bind(this));
    this.app.get('/failure-modes', this.handleFailureModes.bind(this));
    this.app.get('/update-triggers', this.handleUpdateTriggers.bind(this));

    this.app.get('/health', async (request, reply) => {
      return reply.code(200).send({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  private async handleInferenceRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const requestStartTime = Date.now();
    const requestId = request.id as string;
    const body = request.body as UnifiedInferenceRequest;

    try {
      // 1. Basic Validation
      if (!body.model || !body.messages) {
        const errResp = { id: requestId, error: { code: ErrorCodes.INVALID_REQUEST, message: 'Missing required fields: model, messages' } };
        reply.code(400).send(errResp);
        return;
      }

      // 2. Provider Selection
      const providerId = body.model.split(':')[0] as ProviderIdentifier;
      const provider = this.providers.get(providerId);

      if (!provider) {
        const errResp = { id: requestId, error: { code: ErrorCodes.MODEL_NOT_FOUND, message: `No provider found for model: ${body.model}` } };
        reply.code(404).send(errResp);
        return;
      }

      // 3. Request Transformation
      const { payload, headers } = await provider.transformRequest(body);

      // 4. Execute Inference
      const providerResponse = await provider.executeInference(payload, headers, body.model);

      // 5. Response Normalization
      const unifiedResponse = provider.transformResponse(providerResponse, requestStartTime);
      
      // 6. Emit Success Event
      this.emitAuditEvent('inference.success', unifiedResponse, requestId, body);

      // 7. Send Response
      reply.code(200).send(unifiedResponse);

    } catch (error: any) {
      this.logger.error({ err: error, requestId }, 'Inference request failed');
      
      const providerId = (body.model?.split(':')[0] as ProviderIdentifier) || 'unknown';
      const provider = this.providers.get(providerId);
      
      const errorResponse = provider 
        ? provider.handleError(error, requestId)
        : {
            id: requestId,
            error: {
              code: ErrorCodes.INTERNAL_SERVER_ERROR,
              message: error.message || 'An unexpected internal error occurred.',
            },
            latency_ms: Date.now() - requestStartTime,
            provider: providerId,
          };

      this.emitAuditEvent('inference.failure', errorResponse, requestId, body);
      
      const statusCode = this.mapErrorCodeToStatus(errorResponse.error?.code);
      reply.code(statusCode).send(errorResponse);
    }
  }

  private emitAuditEvent(
    eventType: 'inference.success' | 'inference.failure',
    response: UnifiedInferenceResponse,
    requestId: string,
    requestPayload: UnifiedInferenceRequest
  ): void {
    const event: AetherisEvent = {
      id: uuidv4(),
      source: 'APP_06_Inference_UnifiedGateway',
      specversion: '1.0',
      type: `com.aetheris.event.${eventType}`,
      time: new Date().toISOString(),
      subject: requestId,
      data: {
        request: {
          model: requestPayload.model,
          user: requestPayload.user,
          parameters: requestPayload.parameters,
        },
        response,
      },
      datacontenttype: 'application/json',
    };
    this.eventBus.publish('aetheris.audit.inference', event);
  }

  private mapErrorCodeToStatus(code?: ErrorCodes): number {
    switch (code) {
      case ErrorCodes.INVALID_REQUEST: return 400;
      case ErrorCodes.AUTHENTICATION_ERROR: return 401;
      case ErrorCodes.PERMISSION_DENIED: return 403;
      case ErrorCodes.MODEL_NOT_FOUND: return 404;
      case ErrorCodes.RATE_LIMIT_EXCEEDED: return 429;
      case ErrorCodes.PROVIDER_ERROR: return 502;
      case ErrorCodes.INTERNAL_SERVER_ERROR:
      default:
        return 500;
    }
  }

  public async start(): Promise<void> {
    const port = this.config.get<number>('server.port', 3006);
    const host = this.config.get<string>('server.host', '0.0.0.0');
    try {
      await this.app.listen({ port, host });
      this.logger.info(`APP_06_Inference_UnifiedGateway listening on http://${host}:${port}`);
    } catch (err) {
      this.logger.fatal({ err }, 'Failed to start server');
      process.exit(1);
    }
  }

  // --- Agent Introspection Handlers ---

  private async handleIntrospect(request: FastifyRequest, reply: FastifyReply) {
    const providerInfo = Array.from(this.providers.values()).map(p => ({
      identifier: p.identifier,
      capabilities: p.capabilities,
    }));
    reply.send({
      appName: 'APP_06_Inference_UnifiedGateway',
      purpose: 'To provide a unified, resilient, and observable entry point for all synchronous AI model inference requests across the Aetheris ecosystem.',
      architecture: {
        pattern: 'Adapter/Gateway',
        description: 'Receives standardized inference requests, uses a provider registry to select the appropriate adapter, transforms the request to the provider-specific format, executes the call, and normalizes the response. Tightly integrated with core SDK for config, auth, and eventing.',
        components: [
          'Fastify Web Server',
          'Provider Registry',
          'InferenceProvider Adapters (Azure, Bedrock, etc.)',
          'Request/Response Transformers',
          'Core SDK Integration (Config, Logger, EventBus, Credentials)',
        ],
      },
      registered_providers: providerInfo,
      api_surface: [
        { path: '/v1/inference', method: 'POST', description: 'Main endpoint for submitting inference jobs.' },
        { path: '/health', method: 'GET', description: 'Health check.' },
      ],
    });
  }

  private async handleAssumptions(request: FastifyRequest, reply: FastifyReply) {
    reply.send({
      technical_assumptions: [
        'The Aetheris Core SDK is initialized and available.',
        'Network connectivity to all downstream AI provider APIs is available.',
        'CredentialProvider can resolve valid, non-expired credentials for all configured providers.',
        'The shared Event Bus (e.g., Kafka, NATS) is available and accepting messages.',
        'Incoming requests conform to the UnifiedInferenceRequest schema.',
        'This gateway handles synchronous, request/response inference only. Streaming is handled by a different service.',
      ],
      business_assumptions: [
        'A unified API for inference provides significant value by reducing integration overhead for client applications.',
        'Centralizing inference provides critical observability for cost management, auditing, and governance.',
        'The cost of running this gateway service is less than the value it provides in terms of engineering efficiency and operational insight.',
      ],
      architectural_tensions: [
        {
          name: 'Standardization vs. Provider-Specific Features',
          description: 'The gateway prioritizes a standard API (`UnifiedInferenceRequest`), which can hide powerful, unique features of a specific provider. This is managed via the `provider_specific_config` passthrough, allowing a trade-off between portability and power.',
        },
        {
          name: 'Latency vs. Abstraction',
          description: 'Adding a gateway introduces a small amount of network and processing latency. This is assumed to be an acceptable trade-off for the benefits of centralization, security, and observability.',
        }
      ]
    });
  }

  private async handleFailureModes(request: FastifyRequest, reply: FastifyReply) {
    reply.send({
      provider_outage: {
        description: 'A downstream provider (e.g., Azure OpenAI) experiences a partial or full outage.',
        mitigation: 'This gateway does not implement automatic failover. That is the responsibility of an upstream service like APP_02_Inference_FallbackEngine. This gateway will return a 502 Provider Error, which signals the upstream to retry or reroute.',
      },
      credential_failure: {
        description: 'Credentials for a provider are expired, invalid, or lack permissions.',
        mitigation: 'The gateway will return a 401/403 error. The CredentialProvider is expected to handle automatic rotation. Failures trigger alerts for manual intervention.',
      },
      rate_limit_exceeded: {
        description: 'A provider API key hits its rate limit.',
        mitigation: 'The gateway returns a 429 error. Upstream clients are expected to implement exponential backoff. APP_07_Inference_LoadBalancer can help distribute load across multiple keys/endpoints to prevent this.',
      },
      malformed_request: {
        description: 'An incoming request does not match the UnifiedInferenceRequest schema.',
        mitigation: 'The gateway performs schema validation and returns a 400 Bad Request error immediately, preventing invalid requests from reaching downstream providers.',
      },
      event_bus_unavailability: {
        description: 'The event bus for audit/billing events is down.',
        mitigation: 'The gateway logs the failure to publish but continues to process the inference request to maintain service availability. A dead-letter queue or local buffering mechanism for events is a potential future enhancement.',
      },
    });
  }

  private async handleUpdateTriggers(request: FastifyRequest, reply: FastifyReply) {
    reply.send({
      triggers: [
        {
          event: 'New AI provider integration',
          action: 'Create a new class implementing the InferenceProvider interface, register it in the service constructor, and deploy.',
        },
        {
          event: 'Downstream provider API change (non-breaking)',
          action: 'Update the relevant provider adapter\'s transformRequest or transformResponse methods. May require a deployment.',
        },
        {
          event: 'Downstream provider API change (breaking)',
          action: 'Version the provider adapter or create a new one. Update routing logic to direct traffic to the correct version based on model identifier. Requires deployment.',
        },
        {
          event: 'Aetheris Core SDK update',
          action: 'Update npm dependencies, resolve any breaking changes in interfaces (e.g., UnifiedInferenceRequest), and redeploy.',
        },
        {
          event: 'Configuration change (e.g., new model endpoint)',
          action: 'Update configuration in the central ConfigManager. Service should pick up changes on next restart or via dynamic config loading if implemented.',
        },
      ],
    });
  }
}

// =================================================================
// SERVICE BOOTSTRAP
// =================================================================

if (require.main === module) {
  const gatewayService = new UnifiedGatewayService();
  gatewayService.start();
}

export { UnifiedGatewayService, InferenceProvider };