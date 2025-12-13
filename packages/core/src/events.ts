/*
 * Copyright (c) 2024, The Autonomous Architect Ecosystem
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

// --- Unified Ontology: Core Data Contracts ---

/**
 * Represents the identity of the actor (user or service) initiating an action.
 * This is crucial for audit trails and policy enforcement.
 */
export interface IdentityContext {
    /** The unique identifier for the principal (e.g., user ID, service account ID). */
    principalId: string;
    /** The type of principal. */
    principalType: 'user' | 'service_account' | 'system';
    /** The tenant or organization the principal belongs to. */
    tenantId: string;
    /** Optional list of roles or groups associated with the principal for this action. */
    roles?: string[];
    /** The IP address from which the request originated. */
    sourceIp?: string;
}

/**
 * Standardized error structure for failed operations.
 */
export interface ErrorDetails {
    /** A machine-readable error code. */
    code: string;
    /** A human-readable error message. */
    message: string;
    /** Optional stack trace or further diagnostic information. */
    details?: Record<string, any>;
    /** The service or component that was the source of the error. */
    sourceService?: string;
}

/**
 * Uniquely identifies an AI model across different providers.
 */
export interface ModelIdentifier {
    /** The name of the provider (e.g., 'openai', 'anthropic', 'google-gemini', 'local-llama'). */
    provider: string;
    /** The specific name of the model (e.g., 'gpt-4-turbo', 'claude-3-opus'). */
    modelName: string;
    /** The version of the model, if applicable. */
    version?: string;
}

/**
 * Captures the unit economics of an AI operation.
 * Essential for cost accounting, billing, and performance analysis.
 */
export interface CostAttributes {
    /** Number of input/prompt tokens. */
    inputTokens: number;
    /** Number of output/completion tokens. */
    outputTokens: number;
    /** Total tokens processed. */
    totalTokens: number;
    /** Estimated cost in micro-units of a currency (e.g., 1/1,000,000th of a USD). */
    estimatedCostMicroUnits: number;
    /** The currency used for cost estimation. */
    currency: string;
    /** Compute time in milliseconds, if applicable (e.g., for self-hosted models). */
    computeMs?: number;
    /** The pricing tier or rate card used for calculation. */
    rateId?: string;
}

/**
 * Represents a tool that can be called by an AI agent.
 */
export interface ToolDefinition {
    /** Unique name of the tool. */
    name: string;
    /** Description of what the tool does, for the model to understand. */
    description: string;
    /** JSON schema for the tool's input parameters. */
    inputSchema: Record<string, any>;
}

/**
 * Represents a specific call to a tool made by an agent.
 */
export interface ToolCall {
    /** Unique identifier for this specific tool call instance. */
    callId: string;
    /** The name of the tool being called. */
    toolName: string;
    /** The arguments provided to the tool, conforming to its inputSchema. */
    arguments: Record<string, any>;
}

// --- Event Protocol: Base Structure ---

/**
 * The common envelope for all events flowing through the ecosystem's message bus.
 * @template T The type of the event, used to discriminate the payload.
 * @template P The shape of the payload for this event type.
 */
export interface BaseEvent<T extends string, P> {
    /** A unique identifier for this specific event instance (UUID v4 recommended). */
    readonly eventId: string;
    /** The discriminated union key. A namespaced, past-tense string identifying the event. */
    readonly eventType: T;
    /** The ISO 8601 timestamp of when the event occurred (UTC). */
    readonly timestamp: string;
    /** The application that emitted the event (e.g., 'APP_01_Inference_CostRouter'). */
    readonly source: string;
    /** The version of this event's schema (e.g., '1.0.0'). */
    readonly version: string;
    /** A correlation ID to trace a workflow or request across multiple services and events. */
    readonly correlationId: string;
    /** The specific data associated with this event. */
    readonly payload: P;
    /** Optional metadata for cross-cutting concerns like security, compliance, and tenancy. */
    readonly metadata?: {
        /** The identity of the actor that triggered this event. */
        identity?: IdentityContext;
        /** Jurisdictional or data residency flags. */
        jurisdiction?: string;
        /** Data sensitivity level. */
        sensitivity?: 'public' | 'internal' | 'confidential' | 'secret';
        /** A key-value map for custom tracing or feature flagging. */
        tags?: Record<string, string | number | boolean>;
    };
}

// --- Event Definitions: Inference & Routing Domain ---

export type InferenceRequestInitiatedPayload = {
    requestId: string;
    prompt: string | object; // Can be string for simple text or object for complex/multimodal
    parameters: Record<string, any>; // Temperature, top_p, etc.
    constraints?: {
        preferredProviders?: string[];
        requiredCapabilities?: ('json_mode' | 'tool_calling' | 'vision')[];
        latencySlaMs?: number;
        costBudgetMicroUnits?: number;
    };
};
export type InferenceRequestInitiatedEvent = BaseEvent<'inference.request.initiated', InferenceRequestInitiatedPayload>;

export type InferenceRequestRoutedPayload = {
    requestId: string;
    routingDecision: {
        chosenModel: ModelIdentifier;
        reason: string; // e.g., 'lowest_cost', 'latency_optimized', 'capability_match'
        candidatesConsidered: { model: ModelIdentifier; score: number; reason?: string }[];
    };
};
export type InferenceRequestRoutedEvent = BaseEvent<'inference.request.routed', InferenceRequestRoutedPayload>;

export type InferenceRequestCompletedPayload = {
    requestId: string;
    model: ModelIdentifier;
    response: string | object;
    usage: CostAttributes;
    latencyMs: number;
    finishReason: 'stop' | 'length' | 'tool_calls' | 'error' | 'content_filter';
};
export type InferenceRequestCompletedEvent = BaseEvent<'inference.request.completed', InferenceRequestCompletedPayload>;

export type InferenceRequestFailedPayload = {
    requestId: string;
    model?: ModelIdentifier; // May not be available if routing failed
    error: ErrorDetails;
};
export type InferenceRequestFailedEvent = BaseEvent<'inference.request.failed', InferenceRequestFailedPayload>;


// --- Event Definitions: Cost & Billing Domain ---

export type CostUsageRecordedPayload = {
    usageId: string;
    associatedRequestId?: string;
    service: string; // e.g., 'inference', 'storage', 'fine-tuning'
    resourceId: string; // e.g., model name, dataset ID
    tenantId: string;
    usage: CostAttributes;
};
export type CostUsageRecordedEvent = BaseEvent<'cost.usage.recorded', CostUsageRecordedPayload>;


// --- Event Definitions: Agent & Orchestration Domain ---

export type AgentRunStartedPayload = {
    runId: string;
    agentId: string;
    input: Record<string, any>;
    trigger: 'api' | 'schedule' | 'event';
};
export type AgentRunStartedEvent = BaseEvent<'agent.run.started', AgentRunStartedPayload>;

export type AgentStepProcessedPayload = {
    runId: string;
    stepId: string;
    stepType: 'thought' | 'tool_call' | 'observation' | 'final_answer';
    details: {
        thought?: string;
        toolCall?: ToolCall;
        toolOutput?: any;
        finalAnswer?: any;
    };
    model?: ModelIdentifier;
    usage?: CostAttributes;
};
export type AgentStepProcessedEvent = BaseEvent<'agent.step.processed', AgentStepProcessedPayload>;

export type AgentRunCompletedPayload = {
    runId: string;
    status: 'succeeded' | 'failed' | 'cancelled';
    output: any;
    totalUsage: CostAttributes;
    durationMs: number;
    error?: ErrorDetails;
};
export type AgentRunCompletedEvent = BaseEvent<'agent.run.completed', AgentRunCompletedPayload>;

// --- Event Definitions: Governance & Audit Domain ---

export type AuditActionLoggedPayload = {
    auditId: string;
    action: string; // e.g., 'user.login', 'dataset.delete', 'policy.update'
    targetResource: {
        type: string;
        id: string;
    };
    outcome: 'success' | 'failure';
    actor: IdentityContext;
    details?: Record<string, any>;
    error?: ErrorDetails;
};
export type AuditActionLoggedEvent = BaseEvent<'audit.action.logged', AuditActionLoggedPayload>;

export type PolicyEvaluationCompletedPayload = {
    evaluationId: string;
    policyId: string;
    policyVersion: string;
    targetResource: {
        type: string;
        id: string;
    };
    decision: 'allow' | 'deny' | 'needs_review';
    reason: string;
    context: Record<string, any>; // The data used for the evaluation
};
export type PolicyEvaluationCompletedEvent = BaseEvent<'policy.evaluation.completed', PolicyEvaluationCompletedPayload>;


// --- Event Definitions: Dataset & Lifecycle Management Domain ---

export type DatasetCreatedPayload = {
    datasetId: string;
    name: string;
    description?: string;
    tags?: string[];
    ownerTenantId: string;
};
export type DatasetCreatedEvent = BaseEvent<'dataset.created', DatasetCreatedPayload>;

export type DatasetVersionPublishedPayload = {
    datasetId: string;
    versionId: string;
    sourceUri: string; // e.g., s3://bucket/path/to/data
    recordCount: number;
    schema: Record<string, any>;
    validationResults?: {
        status: 'passed' | 'failed' | 'warning';
        reportUri?: string;
    };
};
export type DatasetVersionPublishedEvent = BaseEvent<'dataset.version.published', DatasetVersionPublishedPayload>;


// --- Event Definitions: Evaluation & Benchmarking Domain ---

export type BenchmarkRunScheduledPayload = {
    runId: string;
    benchmarkId: string;
    models: ModelIdentifier[];
    datasets: { datasetId: string; versionId: string }[];
    evaluators: string[]; // Names of evaluation functions/services
};
export type BenchmarkRunScheduledEvent = BaseEvent<'benchmark.run.scheduled', BenchmarkRunScheduledPayload>;

export type BenchmarkResultPublishedPayload = {
    runId: string;
    benchmarkId: string;
    results: {
        model: ModelIdentifier;
        dataset: { datasetId: string; versionId: string };
        scores: { metric: string; value: number; details?: any }[];
        aggregateUsage: CostAttributes;
        avgLatencyMs: number;
    }[];
    summaryReportUri: string;
};
export type BenchmarkResultPublishedEvent = BaseEvent<'benchmark.result.published', BenchmarkResultPublishedPayload>;


// --- Event Definitions: Fine-Tuning Domain ---

export type FineTuneJobSubmittedPayload = {
    jobId: string;
    baseModel: ModelIdentifier;
    trainingDataset: { datasetId: string; versionId: string };
    validationDataset?: { datasetId: string; versionId: string };
    hyperparameters: Record<string, any>;
    customModelSuffix: string;
};
export type FineTuneJobSubmittedEvent = BaseEvent<'fine_tune.job.submitted', FineTuneJobSubmittedPayload>;

export type FineTuneJobStatusUpdatedPayload = {
    jobId: string;
    status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
    progress?: {
        step: number;
        totalSteps: number;
        loss?: number;
    };
    error?: ErrorDetails;
    result?: {
        fineTunedModel: ModelIdentifier;
        metrics: Record<string, number>;
    };
};
export type FineTuneJobStatusUpdatedEvent = BaseEvent<'fine_tune.job.status.updated', FineTuneJobStatusUpdatedPayload>;


// --- Discriminated Union of All Ecosystem Events ---

/**
 * A type union of all possible events that can be published to the event bus.
 * Consumers can use a switch statement on the `eventType` property to safely
 * access the payload with the correct type.
 */
export type EcosystemEvent =
    | InferenceRequestInitiatedEvent
    | InferenceRequestRoutedEvent
    | InferenceRequestCompletedEvent
    | InferenceRequestFailedEvent
    | CostUsageRecordedEvent
    | AgentRunStartedEvent
    | AgentStepProcessedEvent
    | AgentRunCompletedEvent
    | AuditActionLoggedEvent
    | PolicyEvaluationCompletedEvent
    | DatasetCreatedEvent
    | DatasetVersionPublishedEvent
    | BenchmarkRunScheduledEvent
    | BenchmarkResultPublishedEvent
    | FineTuneJobSubmittedEvent
    | FineTuneJobStatusUpdatedEvent;


// --- Event Utilities ---

/**
 * A type representing all possible event types in the ecosystem.
 */
export type EcosystemEventType = EcosystemEvent['eventType'];

/**
 * A factory function for creating valid ecosystem events.
 * Ensures all required fields of the BaseEvent envelope are present.
 *
 * @param eventType The type of the event.
 * @param source The name of the application emitting the event.
 * @param correlationId The ID for tracing this workflow.
 * @param payload The event-specific payload.
 * @param metadata Optional cross-cutting metadata.
 * @returns A fully-formed EcosystemEvent object.
 */
export function createEvent<T extends EcosystemEventType>(
    eventType: T,
    source: string,
    correlationId: string,
    payload: Extract<EcosystemEvent, { eventType: T }>['payload'],
    metadata?: BaseEvent<T, any>['metadata']
): Extract<EcosystemEvent, { eventType: T }> {
    // In a real implementation, this would use a robust UUID library.
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const event = {
        eventId,
        eventType,
        timestamp: new Date().toISOString(),
        source,
        version: '1.0.0', // Schema versioning starts at 1.0.0
        correlationId,
        payload,
        metadata,
    };

    // The type assertion is safe here because we've constructed the object
    // to match the discriminated union based on the eventType.
    return event as Extract<EcosystemEvent, { eventType: T }>;
}

/**
 * Type guard to check if an object is a valid EcosystemEvent.
 * This is useful for validating events received from untrusted sources.
 *
 * @param obj The object to check.
 * @returns True if the object is a valid EcosystemEvent, false otherwise.
 */
export function isEcosystemEvent(obj: any): obj is EcosystemEvent {
    if (typeof obj !== 'object' || obj === null) return false;

    return (
        typeof obj.eventId === 'string' &&
        typeof obj.eventType === 'string' &&
        typeof obj.timestamp === 'string' &&
        typeof obj.source === 'string' &&
        typeof obj.version === 'string' &&
        typeof obj.correlationId === 'string' &&
        typeof obj.payload === 'object' &&
        obj.payload !== null
    );
}

/**
 * A generic event handler type for use in event bus implementations.
 */
export type EcosystemEventHandler<T extends EcosystemEventType = EcosystemEventType> = (
    event: Extract<EcosystemEvent, { eventType: T }>
) => Promise<void> | void;

/**
 * A map of event types to their corresponding payload types.
 * Useful for generic programming over events.
 */
export type EventPayloadMap = {
    [E in EcosystemEvent as E['eventType']]: E['payload'];
};