/*
 * Copyright (c) 2024 Ecosystem Architectures. All rights reserved.
 *
 * This source code is licensed under the proprietary license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * APP_02_Agents_MultiModelOrchestrator
 * Component: Orchestrator Logic
 * Purpose: Decompose high-level intents into executable subtasks and route to optimal models.
 *
 * DISCLAIMER: This software is provided "as is" without warranty of any kind.
 * Users are responsible for compliance with local AI governance regulations.
 * No financial or legal advice is encoded herein.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  Logger,
  MetricService,
  AuditService,
  Tracer,
} from '@ecosystem/core/observability';
import {
  ModelProvider,
  ModelCapability,
  TokenUsage,
  InferenceRequest,
  InferenceResponse,
  ModelProfile,
} from '@ecosystem/shared/ai-types';
import {
  EventBus,
  SystemEvent,
  EventType,
} from '@ecosystem/core/events';
import {
  AuthContext,
  PolicyEngine,
} from '@ecosystem/core/security';
import {
  VectorStore,
  MemoryContext,
} from '@ecosystem/shared/memory';

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

export type TaskPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'BACKGROUND';
export type TaskStatus = 'PENDING' | 'PLANNING' | 'ROUTING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';

export interface OrchestrationConfig {
  maxConcurrency: number;
  defaultTimeoutMs: number;
  costBudgetLimit?: number;
  requireHumanApprovalThreshold?: number; // Confidence score below which human approval is needed
  allowedProviders: ModelProvider[];
  region: string;
  enableFailover: boolean;
}

export interface TaskRequest {
  id: string;
  intent: string;
  context: Record<string, any>;
  constraints: {
    maxCost?: number;
    maxLatencyMs?: number;
    requiredCapabilities?: ModelCapability[];
    excludedProviders?: ModelProvider[];
    privacyLevel: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  };
  priority: TaskPriority;
  traceId: string;
}

export interface SubTask {
  id: string;
  parentId: string;
  name: string;
  description: string;
  dependencies: string[]; // IDs of other subtasks
  assignedModelId?: string;
  status: TaskStatus;
  inputContext: Record<string, any>;
  outputArtifacts?: Record<string, any>;
  estimatedTokens: number;
  retryCount: number;
  maxRetries: number;
  requiredCapabilities: ModelCapability[];
}

export interface OrchestrationPlan {
  planId: string;
  originalTaskId: string;
  strategy: 'SEQUENTIAL' | 'PARALLEL' | 'DAG';
  subtasks: Map<string, SubTask>;
  estimatedTotalCost: number;
  createdAt: Date;
}

export interface ExecutionResult {
  taskId: string;
  status: TaskStatus;
  output: any;
  metrics: {
    totalDurationMs: number;
    totalTokens: TokenUsage;
    totalCost: number;
    modelCalls: number;
  };
  auditLogId: string;
  errors?: Error[];
}

// -----------------------------------------------------------------------------
// Constants & Defaults
// -----------------------------------------------------------------------------

const DEFAULT_CONFIG: OrchestrationConfig = {
  maxConcurrency: 5,
  defaultTimeoutMs: 30000,
  allowedProviders: Object.values(ModelProvider),
  region: 'us-east-1',
  enableFailover: true,
};

const MAX_RETRY_LIMIT = 3;
const PLANNING_MODEL_TIER = 'reasoning-high'; // e.g., GPT-4, Claude 3.5 Sonnet

// -----------------------------------------------------------------------------
// Core Orchestrator Class
// -----------------------------------------------------------------------------

export class MultiModelOrchestrator extends EventEmitter {
  private config: OrchestrationConfig;
  private logger: Logger;
  private metrics: MetricService;
  private audit: AuditService;
  private eventBus: EventBus;
  private policyEngine: PolicyEngine;
  private activePlans: Map<string, OrchestrationPlan>;
  private modelRegistry: ModelRegistry;

  // Self-introspection metadata
  public readonly agentMetadata = {
    purpose: 'Decompose complex tasks and route to optimal AI models based on capability, cost, and policy.',
    dependencies: ['@ecosystem/core', 'ModelRegistry', 'PolicyEngine'],
    invalidation_conditions: ['SchemaChange', 'AuthRevocation', 'BudgetExceeded'],
    adjacent_apps: ['APP_01_Inference_CostRouter', 'APP_37_Governance_AuditTrailEngine'],
  };

  constructor(
    config: Partial<OrchestrationConfig>,
    eventBus: EventBus,
    modelRegistry: ModelRegistry,
    policyEngine: PolicyEngine
  ) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.eventBus = eventBus;
    this.modelRegistry = modelRegistry;
    this.policyEngine = policyEngine;
    this.activePlans = new Map();

    this.logger = new Logger('APP_02_Orchestrator');
    this.metrics = new MetricService('APP_02_Orchestrator');
    this.audit = new AuditService('APP_02_Orchestrator');

    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    this.eventBus.subscribe(EventType.MODEL_AVAILABILITY_CHANGE, this.handleModelAvailabilityChange.bind(this));
    this.eventBus.subscribe(EventType.POLICY_UPDATE, this.handlePolicyUpdate.bind(this));
  }

  /**
   * Main entry point for processing a high-level task.
   */
  public async processTask(request: TaskRequest, auth: AuthContext): Promise<ExecutionResult> {
    const span = Tracer.startSpan('processTask', { taskId: request.id });
    this.logger.info(`Received task ${request.id}`, { intent: request.intent });

    try {
      // 1. Validate & Policy Check
      await this.validateRequest(request, auth);

      // 2. Decompose Task (Planning Phase)
      const plan = await this.createExecutionPlan(request);
      this.activePlans.set(plan.planId, plan);

      // 3. Optimize Plan (Model Selection & Cost Estimation)
      await this.optimizePlan(plan, request.constraints);

      // 4. Execute Plan
      const result = await this.executePlan(plan, auth);

      // 5. Cleanup & Audit
      this.activePlans.delete(plan.planId);
      await this.audit.logExecution(request.id, result, auth);

      return result;

    } catch (error) {
      this.logger.error(`Task processing failed for ${request.id}`, error);
      this.metrics.increment('task_failure_count');
      
      const failureResult: ExecutionResult = {
        taskId: request.id,
        status: 'FAILED',
        output: null,
        metrics: { totalDurationMs: 0, totalTokens: { prompt: 0, completion: 0, total: 0 }, totalCost: 0, modelCalls: 0 },
        auditLogId: uuidv4(),
        errors: [error instanceof Error ? error : new Error(String(error))],
      };
      
      await this.audit.logFailure(request.id, failureResult, auth);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Validates request against governance policies and budget.
   */
  private async validateRequest(request: TaskRequest, auth: AuthContext): Promise<void> {
    const policyResult = await this.policyEngine.evaluate({
      action: 'orchestrate_task',
      resource: request.intent,
      subject: auth.user,
      context: request.context,
    });

    if (!policyResult.allowed) {
      throw new Error(`Policy violation: ${policyResult.reason}`);
    }

    if (request.constraints.privacyLevel === 'RESTRICTED' && !auth.hasScope('restricted_compute')) {
      throw new Error('Insufficient permissions for RESTRICTED privacy level tasks.');
    }
  }

  /**
   * Uses a high-reasoning model to break down the intent into a DAG of subtasks.
   */
  private async createExecutionPlan(request: TaskRequest): Promise<OrchestrationPlan> {
    const plannerModel = this.modelRegistry.getBestModelForCapability('reasoning-complex');
    if (!plannerModel) throw new Error('No planning model available.');

    const prompt = `
      You are an expert system architect.
      Analyze the following user intent and decompose it into atomic, executable subtasks.
      Identify dependencies between tasks.
      
      Intent: "${request.intent}"
      Context: ${JSON.stringify(request.context)}
      
      Output JSON format:
      {
        "strategy": "SEQUENTIAL" | "PARALLEL" | "DAG",
        "subtasks": [
          {
            "id": "string",
            "name": "string",
            "description": "string",
            "dependencies": ["id_of_dependency"],
            "requiredCapabilities": ["vision", "code_generation", "etc"]
          }
        ]
      }
    `;

    const response = await this.executeInference(plannerModel, prompt, 0.1);
    const planData = this.parsePlanResponse(response.content);

    const plan: OrchestrationPlan = {
      planId: uuidv4(),
      originalTaskId: request.id,
      strategy: planData.strategy,
      subtasks: new Map(),
      estimatedTotalCost: 0,
      createdAt: new Date(),
    };

    for (const task of planData.subtasks) {
      plan.subtasks.set(task.id, {
        ...task,
        parentId: request.id,
        status: 'PENDING',
        inputContext: {},
        estimatedTokens: 1000, // Initial heuristic
        retryCount: 0,
        maxRetries: MAX_RETRY_LIMIT,
      });
    }

    this.logger.debug(`Plan created with ${plan.subtasks.size} subtasks`, { planId: plan.planId });
    return plan;
  }

  /**
   * Assigns specific models to subtasks based on constraints and capabilities.
   */
  private async optimizePlan(plan: OrchestrationPlan, constraints: TaskRequest['constraints']): Promise<void> {
    let totalEstimatedCost = 0;

    for (const [id, subtask] of plan.subtasks) {
      const candidates = this.modelRegistry.findModels({
        capabilities: subtask.requiredCapabilities,
        excludedProviders: constraints.excludedProviders,
        maxLatency: constraints.maxLatencyMs,
      });

      if (candidates.length === 0) {
        throw new Error(`No model found satisfying constraints for subtask: ${subtask.name}`);
      }

      // Scoring function: (Quality * 0.6) + (Speed * 0.2) + (CostEfficiency * 0.2)
      // This is a simplified heuristic. In a real system, this would be a configurable strategy pattern.
      const bestModel = candidates.sort((a, b) => this.scoreModel(b) - this.scoreModel(a))[0];

      subtask.assignedModelId = bestModel.id;
      
      // Estimate cost
      const cost = (subtask.estimatedTokens / 1000) * bestModel.pricing.input;
      totalEstimatedCost += cost;
    }

    plan.estimatedTotalCost = totalEstimatedCost;

    if (constraints.maxCost && totalEstimatedCost > constraints.maxCost) {
      // Re-optimize for cost: downgrade models where possible
      this.logger.warn(`Plan exceeds cost budget (${totalEstimatedCost} > ${constraints.maxCost}). Attempting cost optimization.`);
      await this.optimizeForCost(plan, constraints.maxCost);
    }
  }

  private scoreModel(model: ModelProfile): number {
    // Normalized scores 0-1
    const qualityScore = model.benchmarks.general_reasoning / 100;
    const speedScore = 1 - (model.avgLatencyMs / 5000); 
    const costScore = 1 - Math.min(model.pricing.input / 0.03, 1); // Normalize against $0.03/1k

    return (qualityScore * 0.5) + (speedScore * 0.2) + (costScore * 0.3);
  }

  private async optimizeForCost(plan: OrchestrationPlan, budget: number): Promise<void> {
    // Simple greedy algorithm: downgrade most expensive tasks first
    // Implementation omitted for brevity, but would iterate subtasks and select cheaper providers.
  }

  /**
   * Executes the DAG of subtasks.
   */
  private async executePlan(plan: OrchestrationPlan, auth: AuthContext): Promise<ExecutionResult> {
    const results = new Map<string, any>();
    const metrics = {
      totalDurationMs: 0,
      totalTokens: { prompt: 0, completion: 0, total: 0 },
      totalCost: 0,
      modelCalls: 0,
    };
    const startTime = Date.now();

    // Topological sort or simple dependency loop
    // For robustness, we use a loop that checks ready tasks
    let completedCount = 0;
    const totalTasks = plan.subtasks.size;

    while (completedCount < totalTasks) {
      const readyTasks = Array.from(plan.subtasks.values()).filter(t => 
        t.status === 'PENDING' && 
        t.dependencies.every(depId => plan.subtasks.get(depId)?.status === 'COMPLETED')
      );

      if (readyTasks.length === 0 && completedCount < totalTasks) {
        // Check for cycles or failures
        const failed = Array.from(plan.subtasks.values()).some(t => t.status === 'FAILED');
        if (failed) throw new Error('Plan execution halted due to subtask failure.');
        // If no tasks are ready and none failed, we might have a cycle or logic bug
        throw new Error('Deadlock detected in execution plan.');
      }

      // Execute ready tasks in parallel up to concurrency limit
      const batch = readyTasks.slice(0, this.config.maxConcurrency);
      
      await Promise.all(batch.map(async (task) => {
        task.status = 'EXECUTING';
        try {
          // Resolve inputs from dependencies
          const inputs = this.resolveInputs(task, results);
          
          const model = this.modelRegistry.getModel(task.assignedModelId!);
          if (!model) throw new Error(`Assigned model ${task.assignedModelId} not found`);

          const response = await this.executeSubtask(task, model, inputs, auth);
          
          results.set(task.id, response.output);
          task.status = 'COMPLETED';
          task.outputArtifacts = response.output;
          
          // Aggregate metrics
          metrics.totalTokens.prompt += response.usage.prompt;
          metrics.totalTokens.completion += response.usage.completion;
          metrics.totalTokens.total += response.usage.total;
          metrics.totalCost += response.cost;
          metrics.modelCalls++;
          completedCount++;

        } catch (err) {
          task.status = 'FAILED';
          this.logger.error(`Subtask ${task.id} failed`, err);
          // Implement retry logic here if needed
        }
      }));
    }

    metrics.totalDurationMs = Date.now() - startTime;

    // Synthesize final output
    // Usually the output of the leaf nodes or a specific final summarization task
    const finalOutput = this.synthesizeResult(plan, results);

    return {
      taskId: plan.originalTaskId,
      status: 'COMPLETED',
      output: finalOutput,
      metrics,
      auditLogId: uuidv4(),
    };
  }

  private resolveInputs(task: SubTask, results: Map<string, any>): any {
    const inputs = { ...task.inputContext };
    task.dependencies.forEach(depId => {
      inputs[depId] = results.get(depId);
    });
    return inputs;
  }

  private async executeSubtask(
    task: SubTask, 
    model: ModelProfile, 
    inputs: any, 
    auth: AuthContext
  ): Promise<{ output: any; usage: TokenUsage; cost: number }> {
    
    // Construct prompt based on task type and inputs
    // This is where prompt engineering templates would be applied
    const prompt = `
      Task: ${task.description}
      Inputs: ${JSON.stringify(inputs)}
      
      Perform the task and return the result.
    `;

    const response = await this.executeInference(model, prompt, 0.5);
    
    // Calculate cost
    const cost = (response.usage.prompt / 1000 * model.pricing.input) + 
                 (response.usage.completion / 1000 * model.pricing.output);

    return {
      output: response.content,
      usage: response.usage,
      cost
    };
  }

  private async executeInference(model: ModelProfile, prompt: string, temperature: number): Promise<InferenceResponse> {
    // This would call the actual Model Gateway App (APP_01) or an internal adapter
    // Mocking the call for this file
    this.logger.debug(`Calling model ${model.id} (${model.provider})`);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

    return {
      content: `[Simulated Output from ${model.id}]`,
      usage: { prompt: prompt.length / 4, completion: 100, total: (prompt.length / 4) + 100 },
      modelId: model.id,
      created: Date.now(),
    };
  }

  private parsePlanResponse(content: string): any {
    try {
      // Strip markdown code blocks if present
      const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      throw new Error('Failed to parse planner response as JSON');
    }
  }

  private synthesizeResult(plan: OrchestrationPlan, results: Map<string, any>): any {
    // Find tasks that are not dependencies of any other task (leaf nodes)
    const allDeps = new Set<string>();
    plan.subtasks.forEach(t => t.dependencies.forEach(d => allDeps.add(d)));
    
    const leafTasks = Array.from(plan.subtasks.values()).filter(t => !allDeps.has(t.id));
    
    if (leafTasks.length === 1) {
      return results.get(leafTasks[0].id);
    }
    
    const finalResult: Record<string, any> = {};
    leafTasks.forEach(t => {
      finalResult[t.name] = results.get(t.id);
    });
    return finalResult;
  }

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  private handleModelAvailabilityChange(event: SystemEvent) {
    this.logger.info('Model availability updated', event.payload);
    this.modelRegistry.refresh();
  }

  private handlePolicyUpdate(event: SystemEvent) {
    this.logger.info('Policy updated, clearing plan cache', event.payload);
    this.activePlans.clear(); // Force replanning on policy change
  }

  // ---------------------------------------------------------------------------
  // Introspection
  // ---------------------------------------------------------------------------

  public getIntrospectionData() {
    return {
      activePlans: this.activePlans.size,
      config: this.config,
      metadata: this.agentMetadata,
      metrics: this.metrics.getSnapshot(),
    };
  }
}

// -----------------------------------------------------------------------------
// Helper Class: Model Registry (Local Stub)
// -----------------------------------------------------------------------------

export class ModelRegistry {
  private models: Map<string, ModelProfile>;

  constructor() {
    this.models = new Map();
    this.loadDefaults();
  }

  private loadDefaults() {
    // In a real app, this loads from a database or APP_01_Inference_CostRouter
    this.register({
      id: 'gpt-4-turbo',
      provider: ModelProvider.OPENAI,
      capabilities: ['reasoning-complex', 'json_mode', 'vision'],
      pricing: { input: 0.01, output: 0.03 },
      avgLatencyMs: 800,
      benchmarks: { general_reasoning: 95 }
    });
    this.register({
      id: 'claude-3-opus',
      provider: ModelProvider.ANTHROPIC,
      capabilities: ['reasoning-complex', 'long_context'],
      pricing: { input: 0.015, output: 0.075 },
      avgLatencyMs: 1200,
      benchmarks: { general_reasoning: 96 }
    });
    this.register({
      id: 'llama-3-70b',
      provider: ModelProvider.META,
      capabilities: ['reasoning-standard', 'open_weights'],
      pricing: { input: 0.0007, output: 0.0009 }, // Hosted pricing
      avgLatencyMs: 400,
      benchmarks: { general_reasoning: 88 }
    });
  }

  public register(profile: any) {
    this.models.set(profile.id, profile as ModelProfile);
  }

  public getModel(id: string): ModelProfile | undefined {
    return this.models.get(id);
  }

  public findModels(criteria: {
    capabilities?: ModelCapability[];
    excludedProviders?: ModelProvider[];
    maxLatency?: number;
  }): ModelProfile[] {
    return Array.from(this.models.values()).filter(m => {
      if (criteria.excludedProviders?.includes(m.provider)) return false;
      if (criteria.maxLatency && m.avgLatencyMs > criteria.maxLatency) return false;
      if (criteria.capabilities) {
        const hasAll = criteria.capabilities.every(cap => m.capabilities.includes(cap));
        if (!hasAll) return false;
      }
      return true;
    });
  }

  public getBestModelForCapability(capability: string): ModelProfile | undefined {
    // Simple find, real logic would be more complex
    return Array.from(this.models.values()).find(m => m.capabilities.includes(capability as any));
  }

  public refresh() {
    // Logic to fetch latest model stats from central registry
  }
}

// -----------------------------------------------------------------------------
// Module Exports
// -----------------------------------------------------------------------------

export const orchestratorFactory = (
  config: Partial<OrchestrationConfig>,
  deps: { eventBus: EventBus; policyEngine: PolicyEngine }
) => {
  const registry = new ModelRegistry();
  return new MultiModelOrchestrator(config, deps.eventBus, registry, deps.policyEngine);
};