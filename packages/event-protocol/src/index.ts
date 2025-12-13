/*
 * Copyright (c) 2024, The Autonomous Systems Ecosytem Foundation (ASEF)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CORE PROTOCOL TYPES
// ============================================================================

/**
 * The base interface for all event payloads.
 * Each specific event payload must include a unique `eventName`.
 */
export interface EventPayload {
  eventName: string;
}

/**
 * Defines the actor (user, system, or agent) that initiated the action
 * resulting in the event. This is critical for audit and authorization.
 */
export interface Actor {
  type: 'user' | 'system' | 'agent';
  id: string; // User ID, System Service Name, or Agent ID
  tenantId: string;
  claims?: Record<string, any>; // e.g., JWT claims for fine-grained access control
}

/**
 * The envelope that wraps every event published to the event fabric.
 * It contains metadata essential for routing, tracing, and auditing.
 * @template T The specific event payload type.
 */
export interface EventEnvelope<T extends EventPayload> {
  eventId: string; // UUID v4, unique identifier for this event instance.
  eventVersion: string; // Semantic version of the event schema, e.g., "1.0.0".
  eventName: T['eventName']; // The specific name of the event, mirroring the payload.
  timestamp: string; // ISO 8601 UTC timestamp of when the event was created.
  source: string; // The application that originated the event, e.g., "APP_01_Inference_CostRouter".
  correlationId?: string; // ID to trace a logical operation across multiple services.
  causationId?: string; // The eventId of the event that caused this event to be emitted.
  actor: Actor;
  data: T; // The actual event payload.
  metadata?: Record<string, any>; // Additional, non-business-critical data (e.g., client IP, device info).
}

// ============================================================================
// PRODUCER & CONSUMER INTERFACES
// ============================================================================

/**
 * Defines the contract for publishing events to the event fabric.
 * Implementations will handle the actual connection and message sending to a broker (e.g., Kafka, NATS, RabbitMQ).
 */
export interface EventProducer {
  /**
   * Publishes a single event to a specified topic.
   * @param topic The target topic for the event.
   * @param event The event envelope to publish.
   */
  publish<E extends keyof EventMap>(
    topic: string,
    event: EventEnvelope<EventMap[E]>
  ): Promise<{ eventId: string }>;

  /**
   * Publishes a batch of events to a specified topic for efficiency.
   * @param topic The target topic for the events.
   * @param events An array of event envelopes to publish.
   */
  publishBatch<E extends keyof EventMap>(
    topic: string,
    events: EventEnvelope<EventMap[E]>[]
  ): Promise<{ eventIds: string[] }>;
}

/**
 * A function that handles a received event.
 * @template T The specific event payload type.
 */
export type EventHandler<T extends EventPayload> = (
  event: EventEnvelope<T>
) => Promise<void>;

/**
 * Defines the contract for consuming events from the event fabric.
 * Implementations will handle subscribing to topics and receiving messages from a broker.
 */
export interface EventConsumer {
  /**
   * Subscribes to a topic to receive events.
   * @param topic The topic to subscribe to (can include wildcards).
   * @param handler The function to call for each received event.
   * @param options Configuration for the subscription, like consumer group.
   * @returns A subscription object with an `unsubscribe` method.
   */
  subscribe<E extends keyof EventMap>(
    topic: string,
    handler: EventHandler<EventMap[E]>,
    options?: { consumerGroup?: string; autoAck?: boolean }
  ): Promise<{ unsubscribe: () => Promise<void> }>;
}

// ============================================================================
// EVENT CREATION HELPER
// ============================================================================

/**
 * Options for creating a new event envelope.
 */
export interface CreateEventOptions<T extends EventPayload> {
  eventName: T['eventName'];
  data: T;
  source: string;
  actor: Actor;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, any>;
  eventVersion?: string;
}

/**
 * Factory function to create a new EventEnvelope with consistent metadata.
 * @param options The details for the event to be created.
 * @returns A fully formed EventEnvelope.
 */
export function createEvent<T extends EventPayload>(
  options: CreateEventOptions<T>
): EventEnvelope<T> {
  return {
    eventId: uuidv4(),
    eventVersion: options.eventVersion || '1.0.0',
    eventName: options.eventName,
    timestamp: new Date().toISOString(),
    source: options.source,
    actor: options.actor,
    correlationId: options.correlationId,
    causationId: options.causationId,
    data: options.data,
    metadata: options.metadata,
  };
}

// ============================================================================
// TOPIC DEFINITIONS
// ============================================================================

/**
 * A centralized definition of event topics. Using a hierarchical structure
 * allows for wildcard subscriptions (e.g., `inference.*` or `governance.policy.*`).
 */
export const Topics = {
  // Inference & Model Routing
  INFERENCE: {
    REQUESTED: 'inference.request.submitted',
    ROUTED: 'inference.request.routed',
    COMPLETED: 'inference.response.completed',
    FAILED: 'inference.response.failed',
    CHUNK: 'inference.response.chunk',
  },
  // Model Lifecycle & Registry
  MODELS: {
    REGISTERED: 'models.lifecycle.registered',
    VERSION_PUBLISHED: 'models.lifecycle.version_published',
    DEPRECATED: 'models.lifecycle.deprecated',
    METADATA_UPDATED: 'models.metadata.updated',
  },
  // Cost, Billing & Usage
  BILLING: {
    USAGE_RECORDED: 'billing.usage.recorded',
    COST_CALCULATED: 'billing.cost.calculated',
    INVOICE_GENERATED: 'billing.invoice.generated',
    PAYMENT_PROCESSED: 'billing.payment.processed',
  },
  // Agent Orchestration
  AGENTS: {
    CREATED: 'agents.lifecycle.created',
    TASK_STARTED: 'agents.execution.task_started',
    TASK_COMPLETED: 'agents.execution.task_completed',
    PLAN_GENERATED: 'agents.execution.plan_generated',
    TOOL_CALLED: 'agents.execution.tool_called',
    THOUGHT_EMITTED: 'agents.observability.thought_emitted',
  },
  // Governance, Compliance & Audit
  GOVERNANCE: {
    POLICY_EVALUATED: 'governance.policy.evaluated',
    ACCESS_REQUEST: 'governance.access.request',
    AUDIT_LOGGED: 'governance.audit.logged',
    DSAR_RECEIVED: 'governance.compliance.dsar_received', // Data Subject Access Request
  },
  // Datasets & Synthetic Data
  DATASETS: {
    CREATED: 'datasets.lifecycle.created',
    VERSION_PUBLISHED: 'datasets.lifecycle.version_published',
    SYNTHETIC_JOB_STARTED: 'datasets.synthetic.job_started',
    SYNTHETIC_JOB_COMPLETED: 'datasets.synthetic.job_completed',
  },
  // Evaluation & Benchmarking
  EVALUATION: {
    RUN_STARTED: 'evaluation.run.started',
    RUN_COMPLETED: 'evaluation.run.completed',
    BENCHMARK_RESULT_PUBLISHED: 'evaluation.benchmark.result_published',
  },
  // Prompts & Versioning
  PROMPTS: {
    TEMPLATE_CREATED: 'prompts.lifecycle.template_created',
    VERSION_PUBLISHED: 'prompts.lifecycle.version_published',
    TESTED: 'prompts.testing.tested',
  },
  // Fine-Tuning
  FINETUNING: {
    JOB_SUBMITTED: 'finetuning.job.submitted',
    JOB_STATUS_UPDATED: 'finetuning.job.status_updated',
    JOB_COMPLETED: 'finetuning.job.completed',
  },
  // Observability
  OBSERVABILITY: {
    API_CALL_LOGGED: 'observability.api.call_logged',
    TRACE_SPAN_EMITTED: 'observability.tracing.span_emitted',
    METRIC_RECORDED: 'observability.metrics.recorded',
  },
  // Security & Simulation
  SECURITY: {
    FAILURE_INJECTED: 'security.simulation.failure_injected',
    THREAT_DETECTED: 'security.monitoring.threat_detected',
  },
  // Marketplace
  MARKETPLACE: {
    MODEL_LISTED: 'marketplace.listing.model_listed',
    SUBSCRIPTION_ACTIVATED: 'marketplace.subscription.activated',
  },
} as const;


// ============================================================================
// DOMAIN: INFERENCE & MODEL ROUTING
// ============================================================================

export interface InferenceRequestedPayload extends EventPayload {
  eventName: 'inference.request.submitted';
  requestId: string;
  prompt: any; // Flexible to support text, images, audio, etc.
  isStream: boolean;
  routingPreferences: {
    strategy: 'cost' | 'latency' | 'quality' | 'balanced' | 'provider_preference';
    constraints?: {
      maxCost?: number; // in USD
      maxLatency?: number; // in ms
      minQualityScore?: number; // on a scale of 0-1
      allowedProviders?: string[];
      disallowedProviders?: string[];
      requiredFeatures?: string[]; // e.g., 'json_mode', 'tool_use'
    };
  };
}

export interface InferenceRequestRoutedPayload extends EventPayload {
  eventName: 'inference.request.routed';
  requestId: string;
  decision: {
    provider: string; // e.g., 'openai', 'anthropic', 'google'
    model: string; // e.g., 'gpt-4-turbo', 'claude-3-opus-20240229'
    reason: string; // e.g., 'Lowest cost provider meeting latency constraints'
    estimatedCost?: number;
    estimatedLatency?: number;
  };
  routingTimeMs: number;
}

export interface InferenceResponseCompletedPayload extends EventPayload {
  eventName: 'inference.response.completed';
  requestId: string;
  provider: string;
  model: string;
  response: any; // The final, complete response from the model
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    processingTimeMs: number;
  };
  cost: {
    amount: number;
    currency: 'USD';
    calculationMethod: 'per_token' | 'per_character' | 'per_second';
  };
}

export interface InferenceResponseFailedPayload extends EventPayload {
  eventName: 'inference.response.failed';
  requestId: string;
  provider?: string;
  model?: string;
  error: {
    code: string; // e.g., '429', '500', 'provider_error'
    message: string;
    isRetryable: boolean;
  };
}

// ============================================================================
// DOMAIN: AGENT ORCHESTRATION
// ============================================================================

export interface AgentTaskStartedPayload extends EventPayload {
  eventName: 'agents.execution.task_started';
  agentId: string;
  taskId: string;
  goal: string;
  input: any;
}

export interface AgentPlanGeneratedPayload extends EventPayload {
  eventName: 'agents.execution.plan_generated';
  agentId: string;
  taskId: string;
  plan: {
    steps: {
      stepId: string;
      description: string;
      tool?: string;
      dependencies: string[];
    }[];
  };
}

export interface AgentToolCalledPayload extends EventPayload {
  eventName: 'agents.execution.tool_called';
  agentId: string;
  taskId: string;
  stepId: string;
  toolName: string;
  arguments: Record<string, any>;
  result?: any; // Populated when the tool call completes
  status: 'invoked' | 'completed' | 'failed';
  error?: { message: string };
}

export interface AgentTaskCompletedPayload extends EventPayload {
  eventName: 'agents.execution.task_completed';
  agentId: string;
  taskId: string;
  status: 'succeeded' | 'failed' | 'cancelled';
  output: any;
  executionSummary: {
    totalSteps: number;
    toolCalls: number;
    totalTokens: number;
    totalCost: number;
    durationMs: number;
  };
}

// ============================================================================
// DOMAIN: GOVERNANCE & AUDIT
// ============================================================================

export interface AuditEventLoggedPayload extends EventPayload {
  eventName: 'governance.audit.logged';
  service: string;
  action: string;
  outcome: 'success' | 'failure';
  resource: {
    type: string; // e.g., 'model', 'prompt', 'agent'
    id: string;
  };
  details: Record<string, any>;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface PolicyEvaluatedPayload extends EventPayload {
  eventName: 'governance.policy.evaluated';
  policyId: string;
  policyVersion: string;
  decision: 'allow' | 'deny';
  reason: string;
  context: {
    action: string;
    resource: { type: string; id: string };
    principal: Actor;
    requestData: any;
  };
}

// ============================================================================
// DOMAIN: COST & BILLING
// ============================================================================

export interface UsageRecordCreatedPayload extends EventPayload {
  eventName: 'billing.usage.recorded';
  recordId: string;
  tenantId: string;
  service: string; // e.g., 'inference', 'finetuning', 'storage'
  product: string; // e.g., 'openai/gpt-4-turbo', 'anthropic/claude-3-opus'
  metric: string; // e.g., 'tokens', 'seconds', 'images'
  quantity: number;
  timestamp: string; // Time of usage
}

export interface InferenceCostCalculatedPayload extends EventPayload {
  eventName: 'billing.cost.calculated';
  requestId: string;
  tenantId: string;
  cost: number;
  currency: 'USD';
  breakdown: {
    item: string; // e.g., 'input_tokens', 'output_tokens', 'data_transfer'
    quantity: number;
    rate: number;
    cost: number;
  }[];
}

// ============================================================================
// DOMAIN: EVALUATION & BENCHMARKING
// ============================================================================

export interface EvaluationRunStartedPayload extends EventPayload {
  eventName: 'evaluation.run.started';
  runId: string;
  suiteId: string;
  datasetId: string;
  models: { provider: string; name: string }[];
  metrics: string[]; // e.g., 'accuracy', 'latency', 'cost', 'toxicity'
}

export interface EvaluationRunCompletedPayload extends EventPayload {
  eventName: 'evaluation.run.completed';
  runId: string;
  status: 'completed' | 'failed' | 'aborted';
  summary: {
    modelScores: {
      model: { provider: string; name: string };
      scores: { metric: string; value: number | string }[];
    }[];
  };
  resultsArtifactUrl?: string; // Link to detailed results file
}

// ============================================================================
// DOMAIN: FINE-TUNING
// ============================================================================

export interface FineTuningJobSubmittedPayload extends EventPayload {
  eventName: 'finetuning.job.submitted';
  jobId: string;
  provider: string;
  baseModel: string;
  trainingDatasetId: string;
  validationDatasetId?: string;
  hyperparameters: Record<string, any>;
}

export interface FineTuningJobCompletedPayload extends EventPayload {
  eventName: 'finetuning.job.completed';
  jobId: string;
  status: 'succeeded' | 'failed' | 'cancelled';
  fineTunedModelId: string; // The ID of the newly created model
  metrics?: Record<string, number>; // e.g., { "training_loss": 0.1, "validation_accuracy": 0.95 }
  error?: { message: string };
}

// ============================================================================
// MASTER EVENT MAP
// ============================================================================

/**
 * A comprehensive map of all event names to their corresponding payload types.
 * This is the single source of truth for event schemas in the ecosystem and is
 * crucial for enabling type-safe producers and consumers.
 */
export interface EventMap {
  // Inference & Model Routing
  'inference.request.submitted': InferenceRequestedPayload;
  'inference.request.routed': InferenceRequestRoutedPayload;
  'inference.response.completed': InferenceResponseCompletedPayload;
  'inference.response.failed': InferenceResponseFailedPayload;

  // Agent Orchestration
  'agents.execution.task_started': AgentTaskStartedPayload;
  'agents.execution.plan_generated': AgentPlanGeneratedPayload;
  'agents.execution.tool_called': AgentToolCalledPayload;
  'agents.execution.task_completed': AgentTaskCompletedPayload;

  // Governance & Audit
  'governance.audit.logged': AuditEventLoggedPayload;
  'governance.policy.evaluated': PolicyEvaluatedPayload;

  // Cost & Billing
  'billing.usage.recorded': UsageRecordCreatedPayload;
  'billing.cost.calculated': InferenceCostCalculatedPayload;

  // Evaluation & Benchmarking
  'evaluation.run.started': EvaluationRunStartedPayload;
  'evaluation.run.completed': EvaluationRunCompletedPayload;

  // Fine-Tuning
  'finetuning.job.submitted': FineTuningJobSubmittedPayload;
  'finetuning.job.completed': FineTuningJobCompletedPayload;

  // ... other event types would be added here as the ecosystem grows
}

/**
 * A union type representing all possible event payloads.
 * Useful for generic event handlers or logging middleware.
 */
export type AllEventPayloads = EventMap[keyof EventMap];