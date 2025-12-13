/**
 * APP_62_Automation_WorkflowEngine
 *
 * License: MIT License
 *
 * Copyright (c) 2024 Your Company Name
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import express from 'express';
import { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { z } from 'zod';
import {
    CoreSDK,
    AuthService,
    EventBus,
    Logger,
    AuditLogger,
    FeatureFlagService,
    MetricService,
    Ontology,
    SharedTypes,
    APIError,
    ErrorCode,
    AuthContext,
    Permission,
    Resource,
    Action,
    Event
} from '@shared-core-sdk/main'; // Assuming a monorepo structure or npm package

// --- Configuration Management ---
interface AppConfig {
    port: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    llmProviders: {
        openai?: {
            apiKey: string;
            model: string;
            baseUrl?: string;
        };
        anthropic?: {
            apiKey: string;
            model: string;
            baseUrl?: string;
        };
        google?: {
            apiKey: string;
            model: string;
            baseUrl?: string;
        };
    };
    workflowStoreType: 'in-memory' | 'json-file' | 'database'; // For production, database is preferred
    workflowStorePath?: string; // For json-file
    eventSourceAppId: string; // ID of APP_03
    eventTriggerTopic: string; // Topic to listen for APP_03 events
    maxWorkflowExecutionTimeMs: number;
    enableNaturalLanguageWorkflowCreation: boolean;
    enableWorkflowVersioning: boolean;
    jurisdictionalControls: {
        dataResidency: string[]; // e.g., ['US', 'EU']
        aiModelUsageRestrictions: string[]; // e.g., ['no-sensitive-data-to-third-party-llm']
    };
}

const defaultConfig: AppConfig = {
    port: parseInt(process.env.PORT || '6200', 10),
    logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) || 'info',
    llmProviders: {
        openai: process.env.OPENAI_API_KEY ? {
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            baseUrl: process.env.OPENAI_BASE_URL
        } : undefined,
        anthropic: process.env.ANTHROPIC_API_KEY ? {
            apiKey: process.env.ANTHROPIC_API_KEY,
            model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
            baseUrl: process.env.ANTHROPIC_BASE_URL
        } : undefined,
        google: process.env.GOOGLE_API_KEY ? {
            apiKey: process.env.GOOGLE_API_KEY,
            model: process.env.GOOGLE_MODEL || 'gemini-pro',
            baseUrl: process.env.GOOGLE_BASE_URL
        } : undefined,
    },
    workflowStoreType: (process.env.WORKFLOW_STORE_TYPE as AppConfig['workflowStoreType']) || 'in-memory',
    workflowStorePath: process.env.WORKFLOW_STORE_PATH || './data/workflows.json',
    eventSourceAppId: process.env.EVENT_SOURCE_APP_ID || 'APP_03_Monitoring_EventStreamer',
    eventTriggerTopic: process.env.EVENT_TRIGGER_TOPIC || Ontology.EventTypes.MONITORING_ALERT_TRIGGERED,
    maxWorkflowExecutionTimeMs: parseInt(process.env.MAX_WORKFLOW_EXEC_TIME_MS || '60000', 10), // 60 seconds
    enableNaturalLanguageWorkflowCreation: process.env.ENABLE_NL_WORKFLOW_CREATION === 'true',
    enableWorkflowVersioning: process.env.ENABLE_WORKFLOW_VERSIONING === 'true',
    jurisdictionalControls: {
        dataResidency: process.env.JURISDICTION_DATA_RESIDENCY ? process.env.JURISDICTION_DATA_RESIDENCY.split(',') : ['GLOBAL'],
        aiModelUsageRestrictions: process.env.JURISDICTION_AI_MODEL_RESTRICTIONS ? process.env.JURISDICTION_AI_MODEL_RESTRICTIONS.split(',') : [],
    }
};

let appConfig: AppConfig = { ...defaultConfig };

try {
    // Attempt to load configuration from a more robust source if available
    // For this example, we'll stick to environment variables and defaults.
    // In a real system, this would involve a config service or file.
    Logger.info('APP_62_Automation_WorkflowEngine', `Configuration loaded. Port: ${appConfig.port}, LLM providers configured: ${Object.keys(appConfig.llmProviders).filter(k => appConfig.llmProviders[k as keyof typeof appConfig.llmProviders]).join(', ')}`);
} catch (error) {
    Logger.error('APP_62_Automation_WorkflowEngine', `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
}

// --- Shared Core SDK Initialization ---
const coreSDK = new CoreSDK({
    appName: 'APP_62_Automation_WorkflowEngine',
    logLevel: appConfig.logLevel,
    // Other core SDK configurations...
});
const authService = coreSDK.getAuthService();
const eventBus = coreSDK.getEventBus();
const logger = coreSDK.getLogger();
const auditLogger = coreSDK.getAuditLogger();
const featureFlagService = coreSDK.getFeatureFlagService();
const metricService = coreSDK.getMetricService();

// --- Common Types and Interfaces ---

/**
 * Represents a single task within a workflow.
 */
interface WorkflowTask {
    id: string;
    name: string;
    type: 'llm_call' | 'api_call' | 'data_transform' | 'condition' | 'event_emit' | 'human_review' | 'sub_workflow';
    description?: string;
    config: Record<string, any>; // Task-specific configuration
    next?: string | string[]; // Next task ID(s) for sequential or parallel execution
    on_success?: string; // Task ID to execute on success (for conditional/branching)
    on_failure?: string; // Task ID to execute on failure
}

/**
 * Represents a complete workflow definition.
 */
interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    status: 'draft' | 'active' | 'archived';
    trigger: {
        type: 'manual' | 'event' | 'schedule';
        config: Record<string, any>; // e.g., { eventType: 'APP_03_ALERT', filter: { severity: 'high' } }
    };
    tasks: WorkflowTask[];
    // Optional: visual layout information for the builder
    layout?: {
        nodes: Array<{ id: string; x: number; y: number }>;
        edges: Array<{ source: string; target: string }>;
    };
}

/**
 * Represents a single execution instance of a workflow.
 */
interface WorkflowExecutionLog {
    executionId: string;
    workflowId: string;
    workflowVersion: number;
    startTime: string;
    endTime?: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    inputContext: Record<string, any>;
    outputContext?: Record<string, any>;
    taskLogs: Array<{
        taskId: string;
        taskName: string;
        status: 'pending' | 'running' | 'completed' | 'failed';
        startTime: string;
        endTime?: string;
        input: Record<string, any>;
        output?: Record<string, any>;
        error?: string;
    }>;
    error?: string;
    auditTrail: SharedTypes.AuditLogEntry[];
}

// --- LLM Provider Abstraction ---

interface LLMCompletionRequest {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    stopSequences?: string[];
    model?: string; // Override default model
    responseFormat?: 'text' | 'json_object';
}

interface LLMCompletionResponse {
    text: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
}

interface ILLMProvider {
    id: string;
    name: string;
    isAvailable(): boolean;
    complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;
}

class OpenAIAdapter implements ILLMProvider {
    readonly id = 'openai';
    readonly name = 'OpenAI';
    private apiKey: string;
    private model: string;
    private baseUrl: string;

    constructor(config: { apiKey: string; model: string; baseUrl?: string }) {
        this.apiKey = config.apiKey;
        this.model = config.model;
        this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
        if (!this.apiKey) {
            logger.warn('OpenAIAdapter', 'OpenAI API key not provided. OpenAI provider will be unavailable.');
        }
    }

    isAvailable(): boolean {
        return !!this.apiKey;
    }

    async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
        if (!this.isAvailable()) {
            throw new APIError(ErrorCode.SERVICE_UNAVAILABLE, 'OpenAI API key is not configured.');
        }
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            };
            const payload: any = {
                model: request.model || this.model,
                messages: [{ role: 'user', content: request.prompt }],
                max_tokens: request.maxTokens,
                temperature: request.temperature,
                stop: request.stopSequences,
            };
            if (request.responseFormat === 'json_object') {
                payload.response_format = { type: 'json_object' };
            }

            const response = await axios.post(`${this.baseUrl}/chat/completions`, payload, { headers });

            const choice = response.data.choices[0];
            if (!choice) {
                throw new Error('No completion choice received from OpenAI.');
            }

            return {
                text: choice.message.content,
                usage: {
                    promptTokens: response.data.usage.prompt_tokens,
                    completionTokens: response.data.usage.completion_tokens,
                    totalTokens: response.data.usage.total_tokens,
                },
                model: response.data.model,
            };
        } catch (error) {
            logger.error('OpenAIAdapter', `Error during OpenAI completion: ${error instanceof Error ? error.message : String(error)}`, { error });
            metricService.increment('llm_call_failure', { provider: this.id });
            throw new APIError(ErrorCode.EXTERNAL_SERVICE_ERROR, `OpenAI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        } finally {
            metricService.increment('llm_call_total', { provider: this.id });
        }
    }
}

class AnthropicAdapter implements ILLMProvider {
    readonly id = 'anthropic';
    readonly name = 'Anthropic';
    private apiKey: string;
    private model: string;
    private baseUrl: string;

    constructor(config: { apiKey: string; model: string; baseUrl?: string }) {
        this.apiKey = config.apiKey;
        this.model = config.model;
        this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
        if (!this.apiKey) {
            logger.warn('AnthropicAdapter', 'Anthropic API key not provided. Anthropic provider will be unavailable.');
        }
    }

    isAvailable(): boolean {
        return !!this.apiKey;
    }

    async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
        if (!this.isAvailable()) {
            throw new APIError(ErrorCode.SERVICE_UNAVAILABLE, 'Anthropic API key is not configured.');
        }
        try {
            const headers = {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01', // Required Anthropic header
            };
            const payload: any = {
                model: request.model || this.model,
                messages: [{ role: 'user', content: request.prompt }],
                max_tokens: request.maxTokens || 1024, // Anthropic requires max_tokens
                temperature: request.temperature,
                stop_sequences: request.stopSequences,
            };

            const response = await axios.post(`${this.baseUrl}/messages`, payload, { headers });

            const content = response.data.content[0];
            if (!content || content.type !== 'text') {
                throw new Error('No text content received from Anthropic.');
            }

            return {
                text: content.text,
                usage: {
                    promptTokens: response.data.usage.input_tokens,
                    completionTokens: response.data.usage.output_tokens,
                    totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
                },
                model: response.data.model,
            };
        } catch (error) {
            logger.error('AnthropicAdapter', `Error during Anthropic completion: ${error instanceof Error ? error.message : String(error)}`, { error });
            metricService.increment('llm_call_failure', { provider: this.id });
            throw new APIError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Anthropic API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        } finally {
            metricService.increment('llm_call_total', { provider: this.id });
        }
    }
}

// --- LLM Orchestration Service ---
class LLMOrchestrator {
    private providers: ILLMProvider[] = [];
    private defaultProviderId: string | null = null;

    constructor(config: AppConfig['llmProviders']) {
        if (config.openai && config.openai.apiKey) {
            this.providers.push(new OpenAIAdapter(config.openai));
            if (!this.defaultProviderId) this.defaultProviderId = 'openai';
        }
        if (config.anthropic && config.anthropic.apiKey) {
            this.providers.push(new AnthropicAdapter(config.anthropic));
            if (!this.defaultProviderId) this.defaultProviderId = 'anthropic';
        }
        // Add other providers here (e.g., GoogleGeminiAdapter)
        if (!this.defaultProviderId && this.providers.length > 0) {
            this.defaultProviderId = this.providers[0].id;
        }
        if (!this.defaultProviderId) {
            logger.warn('LLMOrchestrator', 'No LLM providers are configured or available.');
        }
    }

    getProvider(providerId?: string): ILLMProvider {
        const targetId = providerId || this.defaultProviderId;
        if (!targetId) {
            throw new APIError(ErrorCode.SERVICE_UNAVAILABLE, 'No default LLM provider configured or available.');
        }
        const provider = this.providers.find(p => p.id === targetId);
        if (!provider || !provider.isAvailable()) {
            throw new APIError(ErrorCode.SERVICE_UNAVAILABLE, `LLM provider '${targetId}' is not available or configured.`);
        }
        return provider;
    }

    async complete(request: LLMCompletionRequest, preferredProviderId?: string): Promise<LLMCompletionResponse> {
        // Implement basic routing logic: try preferred, then default, then round-robin/fallback
        let provider: ILLMProvider | undefined;
        try {
            if (preferredProviderId) {
                provider = this.getProvider(preferredProviderId);
            } else {
                provider = this.getProvider(); // Get default
            }
            return await provider.complete(request);
        } catch (error) {
            logger.warn('LLMOrchestrator', `Preferred/default LLM provider failed. Attempting fallback if available. Error: ${error instanceof Error ? error.message : String(error)}`);
            // Fallback logic: try other available providers
            for (const p of this.providers) {
                if (p.id !== (provider?.id || preferredProviderId) && p.isAvailable()) {
                    try {
                        logger.info('LLMOrchestrator', `Falling back to LLM provider: ${p.name}`);
                        return await p.complete(request);
                    } catch (fallbackError) {
                        logger.error('LLMOrchestrator', `Fallback LLM provider ${p.name} also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
                    }
                }
            }
            throw new APIError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'All configured LLM providers failed to complete the request.', error);
        }
    }
}

const llmOrchestrator = new LLMOrchestrator(appConfig.llmProviders);

// --- Workflow Storage Abstraction ---

interface IWorkflowStore {
    saveWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition>;
    getWorkflow(id: string, version?: number): Promise<WorkflowDefinition | null>;
    listWorkflows(status?: 'active' | 'draft' | 'archived'): Promise<WorkflowDefinition[]>;
    updateWorkflow(id: string, workflow: Partial<WorkflowDefinition>): Promise<WorkflowDefinition>;
    deleteWorkflow(id: string): Promise<void>;
    getLatestVersion(id: string): Promise<WorkflowDefinition | null>;
}

class InMemoryWorkflowStore implements IWorkflowStore {
    private workflows: Map<string, Map<number, WorkflowDefinition>> = new Map(); // workflowId -> version -> WorkflowDefinition

    async saveWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition> {
        if (!workflow.id) {
            workflow.id = uuidv4();
        }
        if (!workflow.version || !appConfig.enableWorkflowVersioning) {
            workflow.version = 1;
        } else if (appConfig.enableWorkflowVersioning) {
            const existingVersions = this.workflows.get(workflow.id);
            if (existingVersions) {
                const latestVersion = Math.max(...Array.from(existingVersions.keys()));
                if (workflow.version <= latestVersion) {
                    workflow.version = latestVersion + 1; // Auto-increment version
                }
            }
        }

        workflow.createdAt = workflow.createdAt || new Date().toISOString();
        workflow.updatedAt = new Date().toISOString();

        if (!this.workflows.has(workflow.id)) {
            this.workflows.set(workflow.id, new Map());
        }
        this.workflows.get(workflow.id)!.set(workflow.version, workflow);
        logger.debug('InMemoryWorkflowStore', `Saved workflow: ${workflow.id} v${workflow.version}`);
        return workflow;
    }

    async getWorkflow(id: string, version?: number): Promise<WorkflowDefinition | null> {
        const versions = this.workflows.get(id);
        if (!versions) return null;

        if (version) {
            return versions.get(version) || null;
        } else {
            // Get latest version
            const latestVersion = Math.max(...Array.from(versions.keys()));
            return versions.get(latestVersion) || null;
        }
    }

    async listWorkflows(status?: 'active' | 'draft' | 'archived'): Promise<WorkflowDefinition[]> {
        const allWorkflows: WorkflowDefinition[] = [];
        for (const versions of this.workflows.values()) {
            const latestVersion = Math.max(...Array.from(versions.keys()));
            const workflow = versions.get(latestVersion);
            if (workflow && (!status || workflow.status === status)) {
                allWorkflows.push(workflow);
            }
        }
        return allWorkflows;
    }

    async updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
        const existing = await this.getLatestVersion(id);
        if (!existing) {
            throw new APIError(ErrorCode.NOT_FOUND, `Workflow with ID ${id} not found.`);
        }

        const updatedWorkflow = { ...existing, ...updates, updatedAt: new Date().toISOString() };

        // If versioning is enabled and content changes, create a new version
        if (appConfig.enableWorkflowVersioning && JSON.stringify(existing.tasks) !== JSON.stringify(updatedWorkflow.tasks)) {
            updatedWorkflow.version = existing.version + 1;
            logger.info('InMemoryWorkflowStore', `Creating new version ${updatedWorkflow.version} for workflow ${id} due to content change.`);
        } else if (appConfig.enableWorkflowVersioning && updates.version && updates.version > existing.version) {
            updatedWorkflow.version = updates.version; // Allow explicit version bump
        } else {
            updatedWorkflow.version = existing.version; // Keep same version if no content change or versioning disabled
        }

        if (!this.workflows.has(id)) {
            this.workflows.set(id, new Map());
        }
        this.workflows.get(id)!.set(updatedWorkflow.version, updatedWorkflow);
        logger.debug('InMemoryWorkflowStore', `Updated workflow: ${id} v${updatedWorkflow.version}`);
        return updatedWorkflow;
    }

    async deleteWorkflow(id: string): Promise<void> {
        if (!this.workflows.delete(id)) {
            throw new APIError(ErrorCode.NOT_FOUND, `Workflow with ID ${id} not found.`);
        }
        logger.debug('InMemoryWorkflowStore', `Deleted workflow: ${id}`);
    }

    async getLatestVersion(id: string): Promise<WorkflowDefinition | null> {
        const versions = this.workflows.get(id);
        if (!versions || versions.size === 0) return null;
        const latestVersion = Math.max(...Array.from(versions.keys()));
        return versions.get(latestVersion) || null;
    }
}

// Placeholder for other store types
// class JsonFileWorkflowStore implements IWorkflowStore { /* ... */ }
// class DatabaseWorkflowStore implements IWorkflowStore { /* ... */ }

let workflowStore: IWorkflowStore;
switch (appConfig.workflowStoreType) {
    case 'in-memory':
        workflowStore = new InMemoryWorkflowStore();
        break;
    // case 'json-file':
    //     workflowStore = new JsonFileWorkflowStore(appConfig.workflowStorePath!);
    //     break;
    // case 'database':
    //     workflowStore = new DatabaseWorkflowStore();
    //     break;
    default:
        logger.warn('APP_62_Automation_WorkflowEngine', `Unsupported workflow store type: ${appConfig.workflowStoreType}. Defaulting to in-memory.`);
        workflowStore = new InMemoryWorkflowStore();
        break;
}

// --- Workflow Validation Schemas ---
const WorkflowTaskSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    type: z.enum(['llm_call', 'api_call', 'data_transform', 'condition', 'event_emit', 'human_review', 'sub_workflow']),
    description: z.string().optional(),
    config: z.record(z.any()),
    next: z.union([z.string().uuid(), z.array(z.string().uuid())]).optional(),
    on_success: z.string().uuid().optional(),
    on_failure: z.string().uuid().optional(),
});

const WorkflowDefinitionSchema = z.object({
    id: z.string().uuid().optional(), // Optional for creation
    name: z.string().min(3).max(200),
    description: z.string().optional(),
    version: z.number().int().positive().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    createdBy: z.string().optional(),
    status: z.enum(['draft', 'active', 'archived']).default('draft'),
    trigger: z.object({
        type: z.enum(['manual', 'event', 'schedule']),
        config: z.record(z.any()),
    }),
    tasks: z.array(WorkflowTaskSchema).min(1),
    layout: z.any().optional(), // Simplified for now
});

// --- Workflow Builder Service ---
class WorkflowBuilderService {
    constructor(private llmOrchestrator: LLMOrchestrator, private workflowStore: IWorkflowStore) {}

    /**
     * Generates a workflow definition from a natural language description using an LLM.
     * @param description Natural language description of the desired workflow.
     * @param authContext The authentication context for audit logging.
     * @returns A promise that resolves to a WorkflowDefinition.
     */
    async createWorkflowFromNaturalLanguage(description: string, authContext: AuthContext): Promise<WorkflowDefinition> {
        if (!appConfig.enableNaturalLanguageWorkflowCreation) {
            throw new APIError(ErrorCode.FEATURE_DISABLED, 'Natural language workflow creation is currently disabled by feature flag.');
        }
        auditLogger.log(authContext, Action.CREATE, Resource.WORKFLOW, 'Attempting to generate workflow from natural language.', { description });

        const prompt = `You are an expert workflow designer. Your task is to convert a natural language description into a structured JSON workflow definition.
        The workflow should consist of a sequence of tasks. Each task has an 'id', 'name', 'type', 'description', 'config', and 'next' (pointing to the next task's ID or an array of IDs for parallel execution).
        Supported task types: 'llm_call', 'api_call', 'data_transform', 'condition', 'event_emit', 'human_review', 'sub_workflow'.
        For 'llm_call', config should include 'prompt_template', 'model', 'output_parser'.
        For 'api_call', config should include 'url', 'method', 'headers', 'body_template'.
        For 'data_transform', config should include 'transformation_script' (e.g., JQ or simple JS).
        For 'condition', config should include 'expression' (e.g., 'context.data.value > 10'), 'on_true', 'on_false'.
        For 'event_emit', config should include 'eventType', 'payload_template'.
        For 'human_review', config should include 'reviewer_group', 'approval_message'.
        For 'sub_workflow', config should include 'subWorkflowId', 'input_mapping'.

        The workflow should start with a 'manual' trigger by default, unless specified otherwise.
        Ensure all task IDs are unique UUIDs.

        Natural Language Description: "${description}"

        Output the JSON directly, without any additional text or markdown formatting.
        `;

        try {
            const llmResponse = await this.llmOrchestrator.complete({
                prompt: prompt,
                temperature: 0.7,
                maxTokens: 2000,
                responseFormat: 'json_object'
            });

            logger.debug('WorkflowBuilderService', 'LLM response for workflow generation:', llmResponse.text);

            const generatedWorkflow = JSON.parse(llmResponse.text);

            // Add default fields and validate
            const newWorkflow: WorkflowDefinition = {
                id: uuidv4(),
                name: generatedWorkflow.name || `Generated Workflow ${new Date().toISOString()}`,
                description: generatedWorkflow.description || description,
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: authContext.userId || 'system',
                status: 'draft',
                trigger: generatedWorkflow.trigger || { type: 'manual', config: {} },
                tasks: generatedWorkflow.tasks.map((task: any) => ({
                    id: task.id || uuidv4(), // Ensure UUIDs
                    ...task
                })),
            };

            // Basic validation
            const validationResult = WorkflowDefinitionSchema.safeParse(newWorkflow);
            if (!validationResult.success) {
                logger.error('WorkflowBuilderService', 'Generated workflow failed schema validation:', validationResult.error.errors);
                throw new APIError(ErrorCode.INVALID_INPUT, 'Generated workflow is invalid.', validationResult.error.errors);
            }

            // Save the generated workflow
            const savedWorkflow = await this.workflowStore.saveWorkflow(validationResult.data);
            auditLogger.log(authContext, Action.CREATE, Resource.WORKFLOW, `Successfully generated and saved workflow from natural language: ${savedWorkflow.id}`, { workflowId: savedWorkflow.id, name: savedWorkflow.name });
            metricService.increment('workflow_generated_from_nl');
            return savedWorkflow;

        } catch (error) {
            logger.error('WorkflowBuilderService', `Failed to generate workflow from natural language: ${error instanceof Error ? error.message : String(error)}`, { error });
            auditLogger.log(authContext, Action.CREATE, Resource.WORKFLOW, 'Failed to generate workflow from natural language.', { description, error: error instanceof Error ? error.message : String(error) }, SharedTypes.AuditLogStatus.FAILURE);
            if (error instanceof APIError) throw error;
            throw new APIError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Failed to generate workflow from natural language due to an internal LLM error.', error);
        }
    }

    /**
     * Validates a workflow definition against the schema.
     * @param workflow The workflow definition to validate.
     * @returns True if valid, throws APIError if invalid.
     */
    validateWorkflow(workflow: WorkflowDefinition): boolean {
        const validationResult = WorkflowDefinitionSchema.safeParse(workflow);
        if (!validationResult.success) {
            throw new APIError(ErrorCode.INVALID_INPUT, 'Workflow definition is invalid.', validationResult.error.errors);
        }
        // Additional semantic validation (e.g., all 'next' IDs exist, no cycles)
        const taskIds = new Set(workflow.tasks.map(t => t.id));
        for (const task of workflow.tasks) {
            const checkNext = (nextId: string) => {
                if (!taskIds.has(nextId)) {
                    throw new APIError(ErrorCode.INVALID_INPUT, `Task ${task.id} references non-existent next task ID: ${nextId}`);
                }
            };
            if (task.next) {
                if (Array.isArray(task.next)) {
                    task.next.forEach(checkNext);
                } else {
                    checkNext(task.next);
                }
            }
            if (task.on_success) checkNext(task.on_success);
            if (task.on_failure) checkNext(task.on_failure);
        }
        return true;
    }
}

const workflowBuilderService = new WorkflowBuilderService(llmOrchestrator, workflowStore);

// --- Workflow Execution Service ---
class WorkflowExecutionService {
    private activeExecutions: Map<string, WorkflowExecutionLog> = new Map(); // executionId -> log

    constructor(
        private workflowStore: IWorkflowStore,
        private llmOrchestrator: LLMOrchestrator,
        private eventBus: EventBus,
        private auditLogger: AuditLogger
    ) {}

    /**
     * Executes a given workflow.
     * @param workflowId The ID of the workflow to execute.
     * @param inputContext Initial context for the workflow execution.
     * @param authContext The authentication context for audit logging.
     * @returns A promise that resolves to the WorkflowExecutionLog.
     */
    async executeWorkflow(workflowId: string, inputContext: Record<string, any>, authContext: AuthContext): Promise<WorkflowExecutionLog> {
        const workflow = await this.workflowStore.getLatestVersion(workflowId);
        if (!workflow || workflow.status !== 'active') {
            throw new APIError(ErrorCode.NOT_FOUND, `Workflow ${workflowId} not found or not active.`);
        }

        const executionId = uuidv4();
        const executionLog: WorkflowExecutionLog = {
            executionId,
            workflowId: workflow.id,
            workflowVersion: workflow.version,
            startTime: new Date().toISOString(),
            status: 'running',
            inputContext,
            outputContext: { ...inputContext }, // Start with input context
            taskLogs: [],
            auditTrail: [],
        };
        this.activeExecutions.set(executionId, executionLog);
        auditLogger.log(authContext, Action.EXECUTE, Resource.WORKFLOW, `Starting workflow execution: ${workflow.name}`, { workflowId, executionId, inputContext }, SharedTypes.AuditLogStatus.IN_PROGRESS);
        logger.info('WorkflowExecutionService', `Starting workflow ${workflow.name} (ID: ${workflowId}, v${workflow.version}) with execution ID: ${executionId}`);
        metricService.increment('workflow_execution_started', { workflowId: workflow.id });

        try {
            await this.runWorkflowTasks(workflow, executionLog, authContext);
            executionLog.status = 'completed';
            logger.info('WorkflowExecutionService', `Workflow ${workflow.name} (ID: ${workflowId}) completed successfully. Execution ID: ${executionId}`);
            auditLogger.log(authContext, Action.EXECUTE, Resource.WORKFLOW, `Workflow execution completed successfully: ${workflow.name}`, { workflowId, executionId, outputContext: executionLog.outputContext }, SharedTypes.AuditLogStatus.SUCCESS);
            metricService.increment('workflow_execution_completed', { workflowId: workflow.id });
        } catch (error) {
            executionLog.status = 'failed';
            executionLog.error = error instanceof Error ? error.message : String(error);
            logger.error('WorkflowExecutionService', `Workflow ${workflow.name} (ID: ${workflowId}) failed. Execution ID: ${executionId}. Error: ${executionLog.error}`, { error });
            auditLogger.log(authContext, Action.EXECUTE, Resource.WORKFLOW, `Workflow execution failed: ${workflow.name}`, { workflowId, executionId, error: executionLog.error }, SharedTypes.AuditLogStatus.FAILURE);
            metricService.increment('workflow_execution_failed', { workflowId: workflow.id });
        } finally {
            executionLog.endTime = new Date().toISOString();
            this.activeExecutions.delete(executionId); // Clean up active execution
            // In a real system, this would persist the executionLog to a database
        }

        return executionLog;
    }

    private async runWorkflowTasks(workflow: WorkflowDefinition, executionLog: WorkflowExecutionLog, authContext: AuthContext): Promise<void> {
        const tasksMap = new Map(workflow.tasks.map(task => [task.id, task]));
        let currentTaskIds: string[] = [];

        // Find the starting task(s) - assuming the first task in the array is the start if no explicit start node
        if (workflow.tasks.length > 0) {
            currentTaskIds = [workflow.tasks[0].id];
        } else {
            throw new APIError(ErrorCode.INVALID_INPUT, 'Workflow has no tasks defined.');
        }

        const visitedTasks = new Set<string>();
        const executionStartTime = Date.now();

        while (currentTaskIds.length > 0) {
            if (Date.now() - executionStartTime > appConfig.maxWorkflowExecutionTimeMs) {
                throw new APIError(ErrorCode.TIMEOUT, `Workflow execution exceeded maximum allowed time of ${appConfig.maxWorkflowExecutionTimeMs / 1000} seconds.`);
            }

            const nextTaskIds: string[] = [];
            const parallelTasks = currentTaskIds.map(async (taskId) => {
                if (visitedTasks.has(taskId)) {
                    logger.warn('WorkflowExecutionService', `Skipping already visited task ${taskId} in workflow ${workflow.id}. Potential cycle or re-entry.`);
                    return; // Avoid infinite loops in simple cases
                }
                visitedTasks.add(taskId);

                const task = tasksMap.get(taskId);
                if (!task) {
                    logger.warn('WorkflowExecutionService', `Task with ID ${taskId} not found in workflow ${workflow.id}. Skipping.`);
                    return;
                }

                const taskLog = {
                    taskId: task.id,
                    taskName: task.name,
                    status: 'running' as const,
                    startTime: new Date().toISOString(),
                    input: { ...executionLog.outputContext }, // Input is current output context
                };
                executionLog.taskLogs.push(taskLog);
                logger.debug('WorkflowExecutionService', `Executing task: ${task.name} (${task.type}) for workflow ${workflow.id}, execution ${executionLog.executionId}`);
                auditLogger.log(authContext, Action.EXECUTE_TASK, Resource.WORKFLOW_TASK, `Executing task: ${task.name}`, { workflowId: workflow.id, executionId: executionLog.executionId, taskId: task.id }, SharedTypes.AuditLogStatus.IN_PROGRESS);
                metricService.increment('workflow_task_started', { workflowId: workflow.id, taskId: task.id, taskType: task.type });

                let taskSuccess = false;
                try {
                    const taskOutput = await this.executeSingleTask(task, executionLog.outputContext!, authContext);
                    executionLog.outputContext = { ...executionLog.outputContext, ...taskOutput }; // Merge task output into context
                    taskLog.output = taskOutput;
                    taskLog.status = 'completed';
                    taskLog.endTime = new Date().toISOString();
                    taskSuccess = true;
                    auditLogger.log(authContext, Action.EXECUTE_TASK, Resource.WORKFLOW_TASK, `Task completed: ${task.name}`, { workflowId: workflow.id, executionId: executionLog.executionId, taskId: task.id, output: taskOutput }, SharedTypes.AuditLogStatus.SUCCESS);
                    metricService.increment('workflow_task_completed', { workflowId: workflow.id, taskId: task.id, taskType: task.type });

                    // Determine next task(s) based on success/failure branches or default 'next'
                    if (task.on_success) {
                        nextTaskIds.push(task.on_success);
                    } else if (task.next) {
                        if (Array.isArray(task.next)) {
                            nextTaskIds.push(...task.next);
                        } else {
                            nextTaskIds.push(task.next);
                        }
                    }
                } catch (taskError) {
                    taskLog.status = 'failed';
                    taskLog.error = taskError instanceof Error ? taskError.message : String(taskError);
                    taskLog.endTime = new Date().toISOString();
                    logger.error('WorkflowExecutionService', `Task ${task.name} failed for workflow ${workflow.id}, execution ${executionLog.executionId}: ${taskLog.error}`, { taskError });
                    auditLogger.log(authContext, Action.EXECUTE_TASK, Resource.WORKFLOW_TASK, `Task failed: ${task.name}`, { workflowId: workflow.id, executionId: executionLog.executionId, taskId: task.id, error: taskLog.error }, SharedTypes.AuditLogStatus.FAILURE);
                    metricService.increment('workflow_task_failed', { workflowId: workflow.id, taskId: task.id, taskType: task.type });

                    if (task.on_failure) {
                        nextTaskIds.push(task.on_failure);
                    } else {
                        // If no specific failure path, the workflow fails
                        throw taskError;
                    }
                }
            });

            await Promise.all(parallelTasks); // Execute tasks in parallel if multiple currentTaskIds

            currentTaskIds = Array.from(new Set(nextTaskIds)); // Remove duplicates for next iteration
        }
    }

    private async executeSingleTask(task: WorkflowTask, context: Record<string, any>, authContext: AuthContext): Promise<Record<string, any>> {
        // Placeholder for context variable interpolation (e.g., using Handlebars or a simple regex)
        const interpolate = (template: string, data: Record<string, any>) => {
            return template.replace(/\{\{([^{}]+)\}\}/g, (_, key) => {
                const value = key.split('.').reduce((o, i) => (o ? o[i] : undefined), data);
                return value !== undefined ? String(value) : '';
            });
        };

        switch (task.type) {
            case 'llm_call': {
                const promptTemplate = task.config.prompt_template as string;
                const prompt = interpolate(promptTemplate, context);
                const model = task.config.model as string | undefined;
                const outputParser = task.config.output_parser as string | undefined; // e.g., 'json', 'text'

                // Check jurisdictional controls for AI model usage
                if (appConfig.jurisdictionalControls.aiModelUsageRestrictions.includes('no-sensitive-data-to-third-party-llm')) {
                    // This is a simplified check. In reality, this would involve data classification.
                    if (JSON.stringify(context).includes('sensitive_data_marker')) { // Example marker
                        throw new APIError(ErrorCode.FORBIDDEN, 'LLM call blocked due to sensitive data and jurisdictional restrictions.');
                    }
                }

                const llmResponse = await this.llmOrchestrator.complete({
                    prompt,
                    model,
                    maxTokens: task.config.max_tokens,
                    temperature: task.config.temperature,
                    responseFormat: outputParser === 'json' ? 'json_object' : 'text'
                });

                let parsedOutput: any = llmResponse.text;
                if (outputParser === 'json') {
                    try {
                        parsedOutput = JSON.parse(llmResponse.text);
                    } catch (e) {
                        logger.warn('WorkflowExecutionService', `LLM output was expected to be JSON but parsing failed for task ${task.id}. Raw output: ${llmResponse.text}`);
                        // Fallback to raw text or throw error based on strictness
                    }
                }
                return { [`${task.id}_output`]: parsedOutput, [`${task.id}_usage`]: llmResponse.usage };
            }
            case 'api_call': {
                const urlTemplate = task.config.url as string;
                const method = (task.config.method as string || 'GET').toUpperCase();
                const headersTemplate = task.config.headers as Record<string, string> || {};
                const bodyTemplate = task.config.body_template as string | undefined;

                const url = interpolate(urlTemplate, context);
                const headers: Record<string, string> = {};
                for (const key in headersTemplate) {
                    headers[key] = interpolate(headersTemplate[key], context);
                }

                let body: any;
                if (bodyTemplate) {
                    try {
                        body = JSON.parse(interpolate(bodyTemplate, context));
                    } catch (e) {
                        body = interpolate(bodyTemplate, context); // Send as plain text if not valid JSON
                    }
                }

                const response = await axios({ method, url, headers, data: body });
                return { [`${task.id}_response`]: response.data, [`${task.id}_status`]: response.status };
            }
            case 'data_transform': {
                const transformationScript = task.config.transformation_script as string;
                // For simplicity, we'll use a basic eval-like approach.
                // In production, consider a sandboxed JS engine (e.g., vm2) or a dedicated transformation language (e.g., JQ, CEL).
                try {
                    // This is highly insecure for untrusted scripts. Use with extreme caution.
                    // For a production system, this would be replaced by a safe transformation engine.
                    const transformFunction = new Function('context', `return ${transformationScript}`);
                    const transformedData = transformFunction(context);
                    return { [`${task.id}_transformed_data`]: transformedData };
                } catch (e) {
                    throw new APIError(ErrorCode.INVALID_INPUT, `Data transformation script failed for task ${task.id}: ${e instanceof Error ? e.message : String(e)}`);
                }
            }
            case 'condition': {
                const expression = task.config.expression as string;
                // Again, using Function for simplicity, but requires sandboxing for security.
                try {
                    const conditionFunction = new Function('context', `return ${expression}`);
                    const result = conditionFunction(context);
                    if (result) {
                        return { [`${task.id}_condition_met`]: true, _next_task_override: task.config.on_true };
                    } else {
                        return { [`${task.id}_condition_met`]: false, _next_task_override: task.config.on_false };
                    }
                } catch (e) {
                    throw new APIError(ErrorCode.INVALID_INPUT, `Condition expression failed for task ${task.id}: ${e instanceof Error ? e.message : String(e)}`);
                }
            }
            case 'event_emit': {
                const eventType = task.config.eventType as string;
                const payloadTemplate = task.config.payload_template as string;
                const payload = JSON.parse(interpolate(payloadTemplate, context)); // Assume JSON payload

                const event: Event = {
                    id: uuidv4(),
                    type: eventType,
                    source: coreSDK.appName,
                    timestamp: new Date().toISOString(),
                    payload: payload,
                    metadata: {
                        workflowId: context.workflowId,
                        executionId: context.executionId,
                        taskId: task.id,
                        userId: authContext.userId,
                    }
                };
                await this.eventBus.publish(eventType, event);
                logger.info('WorkflowExecutionService', `Emitted event ${eventType} from task ${task.id}.`);
                return { [`${task.id}_event_emitted`]: true, eventId: event.id };
            }
            case 'human_review': {
                // This task would typically pause the workflow and wait for an external signal.
                // For this synchronous execution model, we'll simulate a pending state or throw.
                // In a real system, this would involve:
                // 1. Creating a review request in a separate system (e.g., APP_XX_Human_ReviewQueue).
                // 2. Storing the workflow execution state.
                // 3. Resuming the workflow upon receiving an approval/rejection event.
                logger.warn('WorkflowExecutionService', `Human review task ${task.id} encountered. This task type typically requires external interaction and workflow pausing. Simulating immediate approval for demo.`);
                // For a real system, this would be a long-running task that updates the workflow state via an external callback.
                // For now, we'll just return a placeholder.
                return { [`${task.id}_review_status`]: 'approved_simulated', [`${task.id}_reviewer`]: 'system_auto_approve' };
            }
            case 'sub_workflow': {
                const subWorkflowId = task.config.subWorkflowId as string;
                const inputMapping = task.config.input_mapping as Record<string, string>; // e.g., { "sub_input_key": "context.main_workflow_data" }

                const subWorkflowInput: Record<string, any> = {};
                for (const key in inputMapping) {
                    subWorkflowInput[key] = key.startsWith('context.') ? key.split('.').slice(1).reduce((o, i) => (o ? o[i] : undefined), context) : context[key];
                }

                logger.info('WorkflowExecutionService', `Executing sub-workflow ${subWorkflowId} from task ${task.id}.`);
                const subExecutionLog = await this.executeWorkflow(subWorkflowId, subWorkflowInput, authContext);

                if (subExecutionLog.status === 'failed') {
                    throw new APIError(ErrorCode.WORKFLOW_EXECUTION_FAILED, `Sub-workflow ${subWorkflowId} failed: ${subExecutionLog.error}`);
                }
                return { [`${task.id}_sub_workflow_output`]: subExecutionLog.outputContext };
            }
            default:
                throw new APIError(ErrorCode.INVALID_INPUT, `Unknown task type: ${task.type}`);
        }
    }

    /**
     * Retrieves an active workflow execution log.
     * @param executionId The ID of the execution.
     * @returns The WorkflowExecutionLog or null if not found.
     */
    getExecutionLog(executionId: string): WorkflowExecutionLog | null {
        return this.activeExecutions.get(executionId) || null;
    }
}

const workflowExecutionService = new WorkflowExecutionService(workflowStore, llmOrchestrator, eventBus, auditLogger);

// --- Event Listener for APP_03 ---
class App03EventListener {
    constructor(private eventBus: EventBus, private workflowExecutionService: WorkflowExecutionService, private workflowStore: IWorkflowStore) {
        this.setupListeners();
    }

    private setupListeners() {
        // Listen for events from APP_03
        this.eventBus.subscribe(appConfig.eventTriggerTopic, this.handleApp03Event.bind(this));
        logger.info('App03EventListener', `Subscribed to event topic: ${appConfig.eventTriggerTopic} from ${appConfig.eventSourceAppId}`);
    }

    private async handleApp03Event(event: Event) {
        if (event.source !== appConfig.eventSourceAppId) {
            logger.debug('App03EventListener', `Ignoring event from non-APP_03 source: ${event.source}`);
            return;
        }

        logger.info('App03EventListener', `Received event from APP_03: ${event.type} (ID: ${event.id})`);
        metricService.increment('app03_event_received', { eventType: event.type });

        // Find workflows configured to trigger on this event
        const activeWorkflows = await this.workflowStore.listWorkflows('active');
        const triggeredWorkflows = activeWorkflows.filter(wf =>
            wf.trigger.type === 'event' &&
            wf.trigger.config.eventType === event.type &&
            // Basic filter matching (can be extended with more complex logic)
            (!wf.trigger.config.filter || this.matchEventFilter(event.payload, wf.trigger.config.filter))
        );

        if (triggeredWorkflows.length === 0) {
            logger.debug('App03EventListener', `No active workflows found for event type: ${event.type}`);
            return;
        }

        for (const workflow of triggeredWorkflows) {
            logger.info('App03EventListener', `Triggering workflow ${workflow.name} (ID: ${workflow.id}) due to event ${event.id}`);
            // Create a synthetic auth context for event-triggered workflows
            const systemAuthContext: AuthContext = {
                userId: 'system',
                roles: ['system', 'workflow_executor'],
                permissions: [{ resource: Resource.WORKFLOW, action: Action.EXECUTE }],
                tenantId: event.metadata?.tenantId || 'default', // Inherit tenant from event if available
            };
            try {
                await this.workflowExecutionService.executeWorkflow(workflow.id, { event: event.payload, eventMetadata: event.metadata }, systemAuthContext);
            } catch (error) {
                logger.error('App03EventListener', `Failed to execute workflow ${workflow.id} triggered by event ${event.id}: ${error instanceof Error ? error.message : String(error)}`, { error });
            }
        }
    }

    private matchEventFilter(payload: Record<string, any>, filter: Record<string, any>): boolean {
        // Simple key-value matching for now. Can be extended to support complex expressions (e.g., JQ, JSONPath).
        for (const key in filter) {
            if (payload[key] !== filter[key]) {
                return false;
            }
        }
        return true;
    }
}

const app03EventListener = new App03EventListener(eventBus, workflowExecutionService, workflowStore);

// --- Express Application Setup ---
const app = express();
app.use(bodyParser.json());
app.use(coreSDK.getAuthMiddleware()); // Apply shared auth middleware

// --- Middleware for Authorization ---
const authorize = (permission: Permission) => (req: Request, res: Response, next: NextFunction) => {
    const authContext = (req as any).authContext as AuthContext;
    if (!authContext) {
        return res.status(401).json(new APIError(ErrorCode.UNAUTHORIZED, 'Authentication context missing.').toResponse());
    }
    if (!authService.hasPermission(authContext, permission)) {
        auditLogger.log(authContext, permission.action, permission.resource, `Authorization failed for ${permission.action} on ${permission.resource}.`, { path: req.path }, SharedTypes.AuditLogStatus.FAILURE);
        return res.status(403).json(new APIError(ErrorCode.FORBIDDEN, `Access denied. Missing permission: ${permission.action} ${permission.resource}.`).toResponse());
    }
    next();
};

// --- API Routes ---

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: coreSDK.appName, version: '1.0.0' });
});

// Workflow Management
app.post('/workflows', authorize({ resource: Resource.WORKFLOW, action: Action.CREATE }), async (req: Request, res: Response) => {
    const authContext = (req as any).authContext;
    try {
        const workflowData = WorkflowDefinitionSchema.parse(req.body);
        workflowData.createdBy = authContext.userId;
        const newWorkflow = await workflowStore.saveWorkflow(workflowData);
        res.status(201).json(newWorkflow);
        auditLogger.log(authContext, Action.CREATE, Resource.WORKFLOW, `Workflow created: ${newWorkflow.id}`);
    } catch (error) {
        logger.error('API', `Error creating workflow: ${error instanceof Error ? error.message : String(error)}`, { error });
        res.status(error instanceof APIError ? error.statusCode : 400).json(APIError.fromError(error).toResponse());
        auditLogger.log(authContext, Action.CREATE, Resource.WORKFLOW, `Failed to create workflow.`, { error: error instanceof Error ? error.message : String(error) }, SharedTypes.AuditLogStatus.FAILURE);
    }
});

app.get('/workflows', authorize({ resource: Resource.WORKFLOW, action: Action.READ }), async (req: Request, res: Response) => {
    const authContext = (req as any).authContext;
    try {
        const status = req.query.status as 'active' | 'draft' | 'archived' | undefined;
        const workflows = await workflowStore.listWorkflows(status);
        res.status(200).json(workflows);
        auditLogger.log(authContext, Action.READ, Resource.WORKFLOW, `Listed workflows.`);
    } catch (error) {
        logger.error('API', `Error listing workflows: ${error instanceof Error ? error.message : String(error)}`, { error });
        res.status(error instanceof APIError ? error.statusCode : 500).json(APIError.fromError(error).toResponse());
        auditLogger.log(authContext, Action.READ, Resource.WORKFLOW, `Failed to list workflows.`, { error: error instanceof Error ? error.message : String(error) }, SharedTypes.AuditLogStatus.FAILURE);
    }
});

app.get('/workflows/:id', authorize({ resource: Resource.WORKFLOW, action: Action.READ }), async (req: Request, res: Response) => {
    const authContext = (req as any).authContext;
    try {
        const { id } = req.params;
        const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
        const workflow = await workflowStore.getWorkflow(id, version);
        if (!workflow) {
            throw new APIError(ErrorCode.NOT_FOUND, `Workflow with ID ${id} (version ${version || 'latest'}) not found.`);
        }
        res.status(200).json(workflow);
        auditLogger.log(authContext, Action.READ, Resource.WORKFLOW, `Retrieved workflow: ${id} v${version || 'latest'}`);
    } catch (error) {
        logger.error('API', `Error retrieving workflow: ${error instanceof Error ? error.message : String(error)}`, { error });
        res.status(error instanceof APIError ? error.statusCode : 500).json(APIError.fromError(error).toResponse());
        auditLogger.log(authContext, Action.READ, Resource.WORKFLOW, `Failed to retrieve workflow: ${req.params.id}.`, { error: error instanceof Error ? error.message : String(error) }, SharedTypes.AuditLogStatus.FAILURE);
    }
});

app.put('/workflows/:id', authorize({ resource: Resource.WORKFLOW, action: Action.UPDATE }), async (req: Request, res: Response) => {
    const authContext = (req as any).authContext;
    try {
        const { id } = req.params;
        const updates = WorkflowDefinitionSchema.partial().parse(req.body); // Allow partial updates
        const updatedWorkflow = await workflowStore.updateWorkflow(id, updates);
        res.status(200).json(updatedWorkflow);
        auditLogger.log(authContext, Action.UPDATE, Resource.WORKFLOW, `Workflow updated: ${id} to v${updatedWorkflow.version}`);
    } catch (error) {
        logger.error('API', `Error updating workflow: ${error instanceof Error ? error.message : String(error)}`, { error });
        res.status(error instanceof APIError ? error.statusCode : 400).json(APIError.fromError(error).toResponse());
        auditLogger.log(authContext, Action.UPDATE, Resource.WORKFLOW, `Failed to update workflow: ${req.params.id}.`, { error: error instanceof Error ? error.message : String(error) }, SharedTypes.AuditLogStatus.FAILURE);
    }
});

app.delete('/workflows/:id', authorize({ resource: Resource.WORKFLOW, action: Action.DELETE }), async (req: Request, res: Response) => {
    const authContext = (req as any).authContext;
    try {
        const { id } = req.params;
        await workflowStore.deleteWorkflow(id);
        res.status(204).send();
        auditLogger.log(authContext, Action.DELETE, Resource.WORKFLOW, `Workflow deleted: ${id}`);
    } catch (error) {
        logger.error('API', `Error deleting workflow: ${error instanceof Error ? error.message : String(error)}`, { error });
        res.status(error instanceof APIError ? error.statusCode : 500).json(APIError.fromError(error).toResponse());
        auditLogger.log(authContext, Action.DELETE, Resource.WORKFLOW, `Failed to delete workflow: ${req.params.id}.`, { error: error instanceof Error ? error.message : String(error) }, SharedTypes.AuditLogStatus.FAILURE);
    }
});

// Natural Language Workflow Creation
app.post('/workflows/generate-from-nl', authorize({ resource: Resource.WORKFLOW, action: Action.CREATE_GENERATED }), async (req: Request, res: Response) => {
    const authContext = (req as any).authContext;
    try {
        if (!featureFlagService.isEnabled('NL_WORKFLOW_CREATION')) {
            throw new APIError(ErrorCode.FEATURE_DISABLED, 'Natural language workflow creation is disabled.');
        }
        const { description } = z.object({ description: z.string().min(10) }).parse(req.body);
        const generatedWorkflow = await workflowBuilderService.createWorkflowFromNaturalLanguage(description, authContext);
        res.status(201).json(generatedWorkflow);
        auditLogger.log(authContext, Action.CREATE_GENERATED, Resource.WORKFLOW, `Generated workflow from NL: ${generatedWorkflow.id}`);
    } catch (error) {
        logger.error('API', `Error generating workflow from NL: ${error instanceof Error ? error.message : String(error)}`, { error });
        res.status(error instanceof APIError ? error.statusCode : 400).json(APIError.fromError(error).toResponse());
        auditLogger.log(authContext, Action.CREATE_GENERATED, Resource.WORKFLOW, `Failed to generate workflow from NL.`, { error: error instanceof Error ? error.message : String(error) }, SharedTypes.AuditLogStatus.FAILURE);
    }
});

// Workflow Execution
app.post('/workflows/:id/execute', authorize({ resource: Resource.WORKFLOW, action: Action.EXECUTE }), async (req: Request, res: Response) => {
    const authContext = (req as any).authContext;
    try {
        const { id } = req.params;
        const inputContext = req.body || {};
        const executionLog = await workflowExecutionService.executeWorkflow(id, inputContext, authContext);
        res.status(202).json(executionLog); // 202 Accepted for async execution
        auditLogger.log(authContext, Action.EXECUTE, Resource.WORKFLOW, `Workflow execution requested: ${id}, executionId: ${executionLog.executionId}`);
    } catch (error) {
        logger.error('API', `Error executing workflow: ${error instanceof Error ? error.message : String(error)}`, { error });
        res.status(error instanceof APIError ? error.statusCode : 500).json(APIError.fromError(error).toResponse());
        auditLogger.log(authContext, Action.EXECUTE, Resource.WORKFLOW, `Failed to execute workflow: ${req.params.id}.`, { error: error instanceof Error ? error.message : String(error) }, SharedTypes.AuditLogStatus.FAILURE);
    }
});

app.get('/executions/:executionId', authorize({ resource: Resource.WORKFLOW_EXECUTION, action: Action.READ }), async (req: Request, res: Response) => {
    const authContext = (req as any).authContext;
    try {
        const { executionId } = req.params;
        const executionLog = workflowExecutionService.getExecutionLog(executionId);
        if (!executionLog) {
            throw new APIError(ErrorCode.NOT_FOUND, `Workflow execution ${executionId} not found.`);
        }
        res.status(200).json(executionLog);
        auditLogger.log(authContext, Action.READ, Resource.WORKFLOW_EXECUTION, `Retrieved workflow execution log: ${executionId}`);
    } catch (error) {
        logger.error('API', `Error retrieving execution log: ${error instanceof Error ? error.message : String(error)}`, { error });
        res.status(error instanceof APIError ? error.statusCode : 500).json(APIError.fromError(error).toResponse());
        auditLogger.log(authContext, Action.READ, Resource.WORKFLOW_EXECUTION, `Failed to retrieve execution log: ${req.params.executionId}.`, { error: error instanceof Error ? error.message : String(error) }, SharedTypes.AuditLogStatus.FAILURE);
    }
});

// --- Self-Querying Agent Endpoints ---
app.get('/introspect', (req, res) => {
    res.status(200).json({
        serviceName: coreSDK.appName,
        description: 'A service for building, managing, and executing automated workflows, with AI assistance for creation and event-driven triggers.',
        apiEndpoints: [
            { path: '/health', method: 'GET', description: 'Service health check.' },
            { path: '/workflows', method: 'POST', description: 'Create a new workflow definition.' },
            { path: '/workflows', method: 'GET', description: 'List all workflow definitions.' },
            { path: '/workflows/:id', method: 'GET', description: 'Retrieve a specific workflow definition.' },
            { path: '/workflows/:id', method: 'PUT', description: 'Update an existing workflow definition.' },
            { path: '/workflows/:id', method: 'DELETE', description: 'Delete a workflow definition.' },
            { path: '/workflows/generate-from-nl', method: 'POST', description: 'Generate a workflow definition from natural language.' },
            { path: '/workflows/:id/execute', method: 'POST', description: 'Manually trigger a workflow execution.' },
            { path: '/executions/:executionId', method: 'GET', description: 'Retrieve the log for a specific workflow execution.' },
            { path: '/introspect', method: 'GET', description: 'Get service introspection metadata.' },
            { path: '/assumptions', method: 'GET', description: 'Get service assumptions.' },
            { path: '/failure-modes', method: 'GET', description: 'Get potential service failure modes.' },
            { path: '/update-triggers', method: 'GET', description: 'Get conditions that trigger service updates.' },
        ],
        integrations: [
            { name: 'Shared Core SDK', type: 'internal', description: 'Provides auth, event bus, logging, metrics, feature flags.' },
            { name: 'OpenAI', type: 'external', category: 'LLM Provider', capabilities: ['natural_language_to_workflow', 'llm_task_execution'] },
            { name: 'Anthropic', type: 'external', category: 'LLM Provider', capabilities: ['natural_language_to_workflow', 'llm_task_execution'] },
            { name: appConfig.eventSourceAppId, type: 'internal', category: 'Event Source', description: 'Receives events for workflow triggering.' },
            { name: 'External APIs', type: 'external', category: 'API Call Task', description: 'Workflows can call arbitrary external APIs.' },
        ],
        extensibilityHooks: [
            'LLMProvider interface for new LLM integrations.',
            'IWorkflowStore interface for different persistence layers.',
            'WorkflowTask types can be extended with new execution logic.',
            'EventBus for custom event triggers and emissions.',
            'Feature flags for granular control over functionality.',
        ],
        monetization: {
            revenueSurface: [
                'Subscription tiers based on number of active workflows.',
                'Usage-based billing for workflow executions (per task, per compute unit).',
                'Premium LLM-assisted workflow creation features.',
                'Enterprise features: advanced governance, audit trails, custom integrations.',
                'Managed service for complex workflow deployments.',
            ],
            costDrivers: [
                'LLM API costs (prompt tokens, completion tokens).',
                'Compute for workflow execution.',
                'Storage for workflow definitions and execution logs.',
                'Event bus message costs.',
                'Developer time for custom task development.',
            ],
            unitEconomics: {
                workflowExecution: {
                    costPerTask: 'estimated $0.001 - $0.1 (depending on task type, LLM usage, API calls)',
                    revenuePerExecution: 'tiered pricing, e.g., $0.01 - $1.00 per execution',
                    margin: 'high for simple tasks, lower for heavy LLM/API tasks',
                },
                nlWorkflowCreation: {
                    costPerGeneration: 'estimated $0.01 - $0.50 (LLM tokens)',
                    revenuePerGeneration: 'premium feature, e.g., $1.00 - $5.00 per generation',
                }
            },
            enterpriseUpsell: [
                'SLA-backed execution guarantees.',
                'On-premise or VPC deployment options.',
                'Advanced security and compliance features (e.g., FIPS compliance for LLM calls).',
                'Integration with enterprise identity providers (SSO).',
                'Dedicated support and professional services for complex workflow design.',
                'Custom task development and integration services.',
            ]
        },
        designTension: 'Automation Speed vs. Execution Safety & Cost Control. The system aims for rapid automation but includes hooks for human review, cost accounting, and policy enforcement to balance speed with safety and efficiency.',
        jurisdictionalControls: appConfig.jurisdictionalControls,
    });
});

app.get('/assumptions', (req, res) => {
    res.status(200).json({
        serviceName: coreSDK.appName,
        assumptions: [
            'Shared Core SDK is available and correctly configured for auth, events, logging, metrics.',
            'LLM providers (OpenAI, Anthropic, etc.) are accessible via their APIs and API keys are valid.',
            'APP_03_Monitoring_EventStreamer (or equivalent) is publishing events to the configured topic.',
            'Workflow definitions are well-formed and do not contain malicious scripts (especially for data_transform/condition tasks, which require sandboxing in production).',
            'Network connectivity to external APIs and LLM providers is stable.',
            'Underlying infrastructure (compute, storage) is scalable to handle concurrent workflow executions.',
            'Users have appropriate permissions via the shared auth model to create, manage, and execute workflows.',
            'The `context` object passed between tasks is mutable and can grow in size.',
        ],
    });
});

app.get('/failure-modes', (req, res) => {
    res.status(200).json({
        serviceName: coreSDK.appName,
        failureModes: [
            'LLM provider outages or rate limits: Workflow generation and LLM tasks will fail.',
            'External API failures: `api_call` tasks will fail, potentially halting workflows.',
            'Event bus connectivity issues: Workflows triggered by events will not start.',
            'Invalid workflow definitions: Workflows may fail at validation or during execution if tasks are malformed or logic is flawed.',
            'Infinite loops in workflow logic: Poorly designed `condition` tasks could lead to endless execution.',
            'Resource exhaustion: High concurrency of complex workflows could exhaust CPU/memory/network resources.',
            'Data transformation script vulnerabilities: If not properly sandboxed, `data_transform` tasks could execute malicious code.',
            'Auth/Permission misconfigurations: Users unable to access or manage workflows.',
            'Data residency violations: If sensitive data is processed by LLMs in restricted regions without proper controls.',
            'Cost overruns: Uncontrolled LLM usage or API calls within workflows leading to unexpected bills.',
        ],
        mitigations: [
            'LLM Orchestrator with fallback logic and cost controls.',
            'Robust error handling and retry mechanisms for external calls.',
            'Dead-letter queues for event processing failures.',
            'Strict workflow validation and versioning.',
            'Runtime monitoring for execution time and resource usage.',
            'Sandboxed execution environments for custom scripts.',
            'Granular RBAC and regular security audits.',
            'Feature flags for jurisdictional controls and data routing.',
            'Cost accounting and alerting for LLM/API usage.',
        ]
    });
});

app.get('/update-triggers', (req, res) => {
    res.status(200).json({
        serviceName: coreSDK.appName,
        updateTriggers: [
            'New LLM models or providers become available, requiring new adapters or model updates.',
            'Changes in `APP_03_Monitoring_EventStreamer` event schemas or topics.',
            'Introduction of new task types or complex workflow logic requirements.',
            'Security vulnerabilities discovered in dependencies or custom script execution.',
            'Performance bottlenecks identified during high-load workflow execution.',
            'User feedback requesting new features for workflow building or monitoring.',
            'Compliance requirements for data handling or AI governance change.',
            'Cost optimization opportunities (e.g., cheaper LLM models, more efficient execution engine).',
            'Updates to the Shared Core SDK requiring integration changes.',
        ],
    });
});

// --- Error Handling Middleware ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof APIError) {
        logger.warn('API_Error', `Handled API Error: ${err.message}`, { code: err.code, details: err.details, path: req.path });
        return res.status(err.statusCode).json(err.toResponse());
    }
    if (err instanceof z.ZodError) {
        logger.warn('Validation_Error', `Zod Validation Error: ${err.message}`, { errors: err.errors, path: req.path });
        return res.status(400).json(new APIError(ErrorCode.INVALID_INPUT, 'Request validation failed.', err.errors).toResponse());
    }
    logger.error('Unhandled_Error', `Unhandled error: ${err.message}`, { error: err, stack: err.stack, path: req.path });
    res.status(500).json(new APIError(ErrorCode.INTERNAL_SERVER_ERROR, 'An unexpected error occurred.').toResponse());
});

// --- Server Start ---
const server = app.listen(appConfig.port, () => {
    logger.info('APP_62_Automation_WorkflowEngine', `Service ${coreSDK.appName} running on port ${appConfig.port}`);
    logger.info('APP_62_Automation_WorkflowEngine', `Disclaimer: This software is provided "as is", without warranty of any kind. Use at your own risk.`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('APP_62_Automation_WorkflowEngine', 'SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('APP_62_Automation_WorkflowEngine', 'HTTP server closed');
        // Perform any other cleanup here (e.g., close database connections, stop event listeners)
        eventBus.disconnect(); // Assuming disconnect method exists
        process.exit(0);
    });
});

// --- Agent Metadata Block ---
// This block is machine-readable and provides essential information for the autonomous agent.
// It should be kept at the end of the file or in a separate, easily parsable section.
/*
agent_metadata:
  purpose: "Provides a robust, AI-assisted workflow automation engine. It allows users to define complex, multi-step processes, optionally generating them from natural language descriptions using integrated LLMs. Workflows can be triggered manually or automatically by events from other applications (e.g., APP_03_Monitoring_EventStreamer). It includes an execution engine, a pluggable storage layer, and an extensible task system."
  dependencies:
    - "@shared-core-sdk/main": "Core SDK for auth, events, logging, metrics, feature flags."
    - "express": "Web server framework for API endpoints."
    - "body-parser": "Middleware for parsing request bodies."
    - "uuid": "For generating unique IDs for workflows and executions."
    - "axios": "HTTP client for making external API calls (e.g., to LLMs, other services)."
    - "zod": "Schema validation library for API inputs and workflow definitions."
    - "APP_03_Monitoring_EventStreamer": "Source of events that can trigger workflows."
    - "OpenAI API": "External LLM service for natural language processing and task execution."
    - "Anthropic API": "External LLM service for natural language processing and task execution (alternative to OpenAI)."
  invalidation_conditions:
    - "Changes to the core SDK's API contracts (AuthService, EventBus, Logger, etc.)."
    - "Significant changes in LLM provider APIs (OpenAI, Anthropic) that break existing adapters."
    - "Changes in the event schema or topic names from APP_03 that affect workflow triggers."
    - "Security vulnerabilities in the workflow execution engine or task processing logic."
    - "Performance degradation under load, indicating a need for optimization or scaling changes."
    - "Updates to compliance regulations impacting data handling or AI model usage."
  adjacent_apps:
    - "APP_03_Monitoring_EventStreamer": "Primary event source for workflow triggers."
    - "APP_14_Agents_MultiModelOrchestrator": "Could potentially leverage this app for more advanced agentic tasks within workflows."
    - "APP_01_Inference_CostRouter": "Could integrate to route LLM calls based on cost/performance."
    - "APP_37_Governance_AuditTrailEngine": "Receives audit logs from this app."
    - "APP_58_Narrative_ModelExplainabilityUI": "Could visualize workflow execution paths and LLM decisions."
    - "APP_09_Prompt_CompilationAndVersioning": "Could store and manage prompt templates used in LLM tasks."
    - "APP_10_AI_CostAccountingAndBilling": "Receives cost metrics for LLM calls and workflow execution."
    - "APP_20_AI_MarketplaceInfrastructure": "Could offer pre-built workflows or workflow components."
*/