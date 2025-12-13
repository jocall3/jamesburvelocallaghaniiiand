/*
 * Copyright 2024 Nexus Tesseract
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

import { v4 as uuidv4 } from 'uuid';
import {
    CoreSDK,
    Logger,
    EventBus,
    AuthContext,
    AppConfig,
    createClient,
    ServiceDiscovery,
    StructuredLogger,
} from '@nexus-sdk/core';
import {
    ToolRegistryClient,
    ToolDefinition,
    ToolExecutionResult,
} from '@nexus-sdk/client-app-16-tool-registry';
import {
    VectorMemoryClient,
    MemoryFragment,
    MemoryQueryResult,
} from '@nexus-sdk/client-app-20-vector-memory-grid';
import {
    InferenceRouterClient,
    ModelSelectionCriteria,
    ModelCandidate,
} from '@nexus-sdk/client-app-01-inference-cost-router';
import {
    OrchestrationState,
    OrchestrationEvent,
    OrchestrationContext,
    OrchestrationResult,
    OrchestrationOptions,
    ExecutionStep,
    AgentPlan,
    ModelProvider,
    ModelResponse,
    ToolCallRequest,
    OrchestrationStatus,
    OrchestrationHook,
    HookType,
    OrchestrationError,
    ErrorType,
} from './types';
import { ORCHESTRATION_ONTOLOGY } from './ontology';

// Design Tension: Speed vs. Safety.
// This orchestrator balances rapid execution against rigorous safety checks.
// 'executionMode' in OrchestrationOptions ('FAST' vs 'SAFE') toggles features like:
// - Tool execution sandboxing (SAFE) vs. direct execution (FAST).
// - Mandatory human-in-the-loop for sensitive operations (SAFE).
// - Model selection preference for speed vs. audited, safer models.

export class MultiModelOrchestrator {
    private readonly logger: StructuredLogger;
    private readonly eventBus: EventBus;
    private readonly config: AppConfig;
    private readonly toolRegistryClient: ToolRegistryClient;
    private readonly vectorMemoryClient: VectorMemoryClient;
    private readonly inferenceRouterClient: InferenceRouterClient;
    private readonly hooks: Map<HookType, OrchestrationHook[]>;

    constructor(sdk: CoreSDK, serviceDiscovery: ServiceDiscovery) {
        this.logger = sdk.getLogger('APP_14_Orchestrator');
        this.eventBus = sdk.getEventBus();
        this.config = sdk.getConfig();

        this.toolRegistryClient = createClient<ToolRegistryClient>(
            'APP_16_Agents_ToolRegistry',
            sdk,
            serviceDiscovery
        );
        this.vectorMemoryClient = createClient<VectorMemoryClient>(
            'APP_20_Data_VectorMemoryGrid',
            sdk,
            serviceDiscovery
        );
        this.inferenceRouterClient = createClient<InferenceRouterClient>(
            'APP_01_Inference_CostRouter',
            sdk,
            serviceDiscovery
        );

        this.hooks = new Map();
        this.logger.info('MultiModelOrchestrator initialized.', {
            dependencies: ['ToolRegistry', 'VectorMemory', 'InferenceRouter'],
        });
    }

    /**
     * Registers an extensibility hook to be called at a specific point in the orchestration lifecycle.
     * @param type The type of hook to register.
     * @param hook The hook function to execute.
     */
    public registerHook(type: HookType, hook: OrchestrationHook): void {
        if (!this.hooks.has(type)) {
            this.hooks.set(type, []);
        }
        this.hooks.get(type)?.push(hook);
        this.logger.debug(`Registered hook for type: ${type}`);
    }

    private async triggerHooks(type: HookType, context: OrchestrationContext): Promise<OrchestrationContext> {
        const hooksForType = this.hooks.get(type) || [];
        let modifiedContext = context;
        for (const hook of hooksForType) {
            try {
                modifiedContext = await hook(modifiedContext);
            } catch (error) {
                this.logger.error(`Error executing hook for type ${type}`, {
                    error,
                    runId: context.runId,
                    agentId: context.agentId,
                });
                // Depending on policy, we might halt execution or just log and continue.
                // For now, we continue.
            }
        }
        return modifiedContext;
    }

    /**
     * The main entry point to run an agent orchestration.
     * @param agentId The identifier for the agent definition to use.
     * @param initialPrompt The user's initial request.
     * @param options Runtime options for this orchestration run.
     * @param authContext The security context for this operation.
     * @returns A promise that resolves with the final result of the orchestration.
     */
    public async run(
        agentId: string,
        initialPrompt: string,
        options: OrchestrationOptions,
        authContext: AuthContext
    ): Promise<OrchestrationResult> {
        const runId = uuidv4();
        let context: OrchestrationContext = {
            runId,
            agentId,
            initialPrompt,
            options,
            authContext,
            status: OrchestrationStatus.RUNNING,
            currentState: OrchestrationState.INITIALIZING,
            history: [{ role: 'user', content: initialPrompt }],
            scratchpad: {},
            steps: [],
            cost: { tokens: 0, computeMs: 0, externalApiCost: 0 },
            maxSteps: this.config.get('orchestration.maxSteps', 50),
            currentStepIndex: 0,
        };

        this.logger.info('Starting new orchestration run.', { runId, agentId, tenantId: authContext.tenantId });
        await this.eventBus.publish(ORCHESTRATION_ONTOLOGY.RUN_STARTED, context);

        try {
            while (context.status === OrchestrationStatus.RUNNING) {
                context = await this.transition(context);
            }
        } catch (error) {
            const orchestrationError = this.handleError(error, context);
            context.status = OrchestrationStatus.FAILED;
            context.error = orchestrationError;
            this.logger.error('Orchestration failed.', { runId, error: orchestrationError });
            await this.eventBus.publish(ORCHESTRATION_ONTOLOGY.RUN_FAILED, context);
        }

        const result: OrchestrationResult = {
            runId: context.runId,
            status: context.status,
            output: context.finalAnswer,
            history: context.history,
            cost: context.cost,
            steps: context.steps,
            error: context.error,
        };

        const eventType = context.status === OrchestrationStatus.COMPLETED
            ? ORCHESTRATION_ONTOLOGY.RUN_COMPLETED
            : ORCHESTRATION_ONTOLOGY.RUN_FAILED;
        await this.eventBus.publish(eventType, context);

        return result;
    }

    /**
     * The core state machine transition logic.
     * @param context The current orchestration context.
     * @returns The updated context after the transition.
     */
    private async transition(context: OrchestrationContext): Promise<OrchestrationContext> {
        const startTime = Date.now();
        const currentState = context.currentState;
        this.logger.debug(`Transitioning from state: ${currentState}`, { runId: context.runId });

        let nextState: OrchestrationState;
        let updatedContext = { ...context };

        switch (currentState) {
            case OrchestrationState.INITIALIZING:
                updatedContext = await this.executeInitializing(updatedContext);
                nextState = OrchestrationState.PLANNING;
                break;

            case OrchestrationState.PLANNING:
                updatedContext = await this.executePlanning(updatedContext);
                nextState = updatedContext.plan && updatedContext.plan.steps.length > 0
                    ? OrchestrationState.EXECUTING_STEP
                    : OrchestrationState.RESPONDING;
                break;

            case OrchestrationState.EXECUTING_STEP:
                if (updatedContext.currentStepIndex >= updatedContext.maxSteps || updatedContext.currentStepIndex >= (updatedContext.plan?.steps.length || 0)) {
                    this.logger.warn('Max steps reached or plan completed.', { runId: updatedContext.runId });
                    nextState = OrchestrationState.RESPONDING;
                } else {
                    updatedContext = await this.executeStep(updatedContext);
                    nextState = OrchestrationState.EVALUATING_PROGRESS;
                }
                break;

            case OrchestrationState.RESOLVING_TOOL_CALL:
                updatedContext = await this.executeToolCall(updatedContext);
                nextState = OrchestrationState.UPDATING_MEMORY;
                break;

            case OrchestrationState.UPDATING_MEMORY:
                updatedContext = await this.updateMemory(updatedContext);
                updatedContext.currentStepIndex++;
                nextState = OrchestrationState.EXECUTING_STEP;
                break;

            case OrchestrationState.EVALUATING_PROGRESS:
                const isComplete = this.evaluateProgress(updatedContext);
                nextState = isComplete ? OrchestrationState.RESPONDING : OrchestrationState.EXECUTING_STEP;
                break;

            case OrchestrationState.RESPONDING:
                updatedContext = await this.generateFinalResponse(updatedContext);
                nextState = OrchestrationState.COMPLETED;
                break;

            case OrchestrationState.COMPLETED:
                updatedContext.status = OrchestrationStatus.COMPLETED;
                break;

            default:
                throw new OrchestrationError(ErrorType.INTERNAL, `Unknown state: ${currentState}`);
        }

        updatedContext.currentState = nextState;
        const duration = Date.now() - startTime;
        updatedContext.cost.computeMs += duration;
        this.logger.info(`State transition complete: ${currentState} -> ${nextState}`, { runId: updatedContext.runId, durationMs: duration });
        
        return updatedContext;
    }

    private async executeInitializing(context: OrchestrationContext): Promise<OrchestrationContext> {
        context = await this.triggerHooks(HookType.BEFORE_INITIALIZATION, context);
        
        // In a real implementation, this would fetch agent definition (personality, allowed tools, etc.)
        // from a persistent store, perhaps another app like APP_15_Agents_DefinitionRegistry.
        const agentDefinition = {
            id: context.agentId,
            personality: "You are a helpful multi-modal assistant.",
            allowedTools: ['*'], // Allow all tools for this example
        };
        context.agentDefinition = agentDefinition;

        // Retrieve relevant long-term memory
        const memoryFragments = await this.vectorMemoryClient.query(
            context.authContext,
            `session:${context.runId}`,
            context.initialPrompt,
            { topK: 5 }
        );
        context.scratchpad.initialMemory = memoryFragments;
        context.history.unshift({ role: 'system', content: `Relevant past information:\n${JSON.stringify(memoryFragments)}` });

        context = await this.triggerHooks(HookType.AFTER_INITIALIZATION, context);
        return context;
    }

    private async executePlanning(context: OrchestrationContext): Promise<OrchestrationContext> {
        context = await this.triggerHooks(HookType.BEFORE_PLANNING, context);

        const plannerModel = await this.selectModel({
            ...context,
            taskDescription: "Generate a step-by-step plan to fulfill the user's request. The plan should involve using tools if necessary.",
            capabilityFlags: ['PLANNING', 'TOOL_USE'],
        });

        const availableTools = await this.toolRegistryClient.listTools(context.authContext, context.agentDefinition?.allowedTools || []);
        const toolSchemas = availableTools.map(t => t.schema).join('\n\n');

        const planningPrompt = `
            User Request: ${context.initialPrompt}
            Available Tools:
            ${toolSchemas}
            
            Based on the user request and available tools, create a JSON plan of steps to achieve the goal.
            Each step should have a 'thought' and either a 'tool_call' or a 'final_answer' key.
            Example: { "steps": [{ "thought": "I need to find the weather.", "tool_call": { "name": "get_weather", "arguments": { "city": "San Francisco" } } }] }
        `;

        const response = await this.invokeModel(context, plannerModel, planningPrompt);
        
        try {
            const planJson = this.extractJson(response.content);
            context.plan = JSON.parse(planJson) as AgentPlan;
        } catch (error) {
            this.logger.warn('Failed to parse plan from model, proceeding with single-step execution.', { runId: context.runId });
            context.plan = { steps: [{ thought: "I will try to answer directly.", final_answer: true }] };
        }

        context = await this.triggerHooks(HookType.AFTER_PLANNING, context);
        return context;
    }

    private async executeStep(context: OrchestrationContext): Promise<OrchestrationContext> {
        const step = context.plan!.steps[context.currentStepIndex];
        if (!step) {
            throw new OrchestrationError(ErrorType.EXECUTION, 'Attempted to execute a non-existent plan step.');
        }

        context.history.push({ role: 'assistant', content: step.thought });

        if (step.tool_call) {
            context.pendingToolCall = step.tool_call;
            context.currentState = OrchestrationState.RESOLVING_TOOL_CALL;
        } else {
            // This step does not involve a tool, likely a reasoning or response generation step.
            const reasoningModel = await this.selectModel({ ...context, taskDescription: step.thought });
            const response = await this.invokeModel(context, reasoningModel, step.thought);
            context.history.push({ role: 'assistant', content: response.content });
            context.currentStepIndex++;
        }
        return context;
    }

    private async executeToolCall(context: OrchestrationContext): Promise<OrchestrationContext> {
        if (!context.pendingToolCall) {
            throw new OrchestrationError(ErrorType.INTERNAL, 'executeToolCall called without a pending tool call.');
        }
        const toolCall = context.pendingToolCall;
        context = await this.triggerHooks(HookType.BEFORE_TOOL_EXECUTION, context);

        const executionMode = context.options.executionMode || 'SAFE';
        const result = await this.toolRegistryClient.executeTool(
            context.authContext,
            toolCall.name,
            toolCall.arguments,
            {
                sandboxed: executionMode === 'SAFE',
                runId: context.runId,
            }
        );

        context.lastToolResult = result;
        context.history.push({ role: 'tool', content: JSON.stringify(result.output), tool_call_id: toolCall.name });
        context.pendingToolCall = undefined;

        // Update cost
        context.cost.externalApiCost += result.cost || 0;

        context = await this.triggerHooks(HookType.AFTER_TOOL_EXECUTION, context);
        return context;
    }

    private async updateMemory(context: OrchestrationContext): Promise<OrchestrationContext> {
        const lastHistoryItem = context.history[context.history.length - 1];
        if (lastHistoryItem && lastHistoryItem.role === 'tool') {
            const fragment: MemoryFragment = {
                content: `Tool call ${lastHistoryItem.tool_call_id} returned: ${lastHistoryItem.content}`,
                metadata: {
                    runId: context.runId,
                    step: context.currentStepIndex,
                    type: 'tool_result',
                },
            };
            await this.vectorMemoryClient.add(context.authContext, `session:${context.runId}`, [fragment]);
        }
        return context;
    }

    private evaluateProgress(context: OrchestrationContext): boolean {
        // Simple evaluation: if the last model response contains a specific marker.
        // A more advanced implementation would use an evaluation model.
        const lastResponse = context.history[context.history.length - 1]?.content;
        if (typeof lastResponse === 'string' && lastResponse.includes('FINAL_ANSWER:')) {
            context.finalAnswer = lastResponse.replace('FINAL_ANSWER:', '').trim();
            return true;
        }
        return false;
    }

    private async generateFinalResponse(context: OrchestrationContext): Promise<OrchestrationContext> {
        if (context.finalAnswer) {
            return context; // Final answer already determined
        }

        const responseModel = await this.selectModel({
            ...context,
            taskDescription: "Summarize the conversation and provide a final answer to the user's initial request.",
            capabilityFlags: ['SUMMARIZATION'],
        });

        const finalPrompt = `
            Based on the following conversation history, provide a comprehensive final answer to the user's original question: "${context.initialPrompt}".
            History:
            ${JSON.stringify(context.history)}
        `;

        const response = await this.invokeModel(context, responseModel, finalPrompt);
        context.finalAnswer = response.content;
        context.history.push({ role: 'assistant', content: context.finalAnswer });
        return context;
    }

    private async selectModel(context: {
        runId: string;
        authContext: AuthContext;
        taskDescription: string;
        capabilityFlags?: string[];
        options: OrchestrationOptions;
    }): Promise<ModelCandidate> {
        const criteria: ModelSelectionCriteria = {
            task_description: context.taskDescription,
            capabilities: context.capabilityFlags || [],
            constraints: {
                max_cost_per_1k_tokens: context.options.maxCostPer1kTokens,
                min_security_level: context.options.executionMode === 'SAFE' ? 8 : 4,
                allowed_jurisdictions: context.options.jurisdiction,
            },
            user_preferences: {
                preferred_provider: context.options.preferredProvider,
                // The core tension: speed vs quality (safety is a constraint)
                tradeoff: context.options.tradeoff || 'balanced',
            },
        };

        const candidates = await this.inferenceRouterClient.route(context.authContext, criteria);
        if (candidates.length === 0) {
            throw new OrchestrationError(ErrorType.CONFIGURATION, 'No suitable model found for the given criteria.');
        }
        return candidates[0]; // The router returns the best candidate first.
    }

    private async invokeModel(context: OrchestrationContext, model: ModelCandidate, prompt: string): Promise<ModelResponse> {
        context = await this.triggerHooks(HookType.BEFORE_MODEL_INVOCATION, context);
        
        // This is a placeholder for a generic model invocation client,
        // likely part of the core SDK or APP_02_Inference_MultiProviderGateway.
        // It would use the model.provider and model.model_name to call the correct API.
        const provider: ModelProvider = {
            invoke: async (/* provider, modelName, messages, options */) => {
                // Dummy implementation
                console.log(`Invoking ${model.provider}/${model.model_name}`);
                return {
                    content: `{"thought": "This is a mock response for ${prompt}", "final_answer": true}`,
                    usage: { input_tokens: 100, output_tokens: 50 },
                    stop_reason: 'complete',
                };
            }
        };

        const response = await provider.invoke(model.provider, model.model_name, [...context.history, { role: 'user', content: prompt }], {});
        
        context.cost.tokens += (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
        
        context = await this.triggerHooks(HookType.AFTER_MODEL_INVOCATION, context);
        return response;
    }

    private extractJson(text: string): string {
        const match = text.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
        return match ? (match[1] || match[2]) : text;
    }

    private handleError(error: any, context: OrchestrationContext): OrchestrationError {
        if (error instanceof OrchestrationError) {
            return error;
        }
        this.logger.error('An unexpected error occurred during orchestration.', {
            runId: context.runId,
            error: error.message,
            stack: error.stack,
        });
        return new OrchestrationError(ErrorType.UNKNOWN, error.message, { originalError: error });
    }
}

// Singleton instance for the application
let orchestratorInstance: MultiModelOrchestrator;

export function getOrchestrator(sdk?: CoreSDK, serviceDiscovery?: ServiceDiscovery): MultiModelOrchestrator {
    if (!orchestratorInstance && sdk && serviceDiscovery) {
        orchestratorInstance = new MultiModelOrchestrator(sdk, serviceDiscovery);
    } else if (!orchestratorInstance) {
        throw new Error("Orchestrator has not been initialized. Call getOrchestrator with SDK and ServiceDiscovery first.");
    }
    return orchestratorInstance;
}