// src/types/AgentTypes.ts

/**
 * Defines the operational status of an AI Agent.
 */
export enum AgentStatus {
    ACTIVE = 'ACTIVE', // The agent is online and available for use.
    INACTIVE = 'INACTIVE', // The agent is offline and cannot be used.
    TRAINING = 'TRAINING', // The agent is currently being updated or trained and is temporarily unavailable.
    DEPRECATED = 'DEPRECATED', // The agent is outdated and will be removed soon.
    ERROR = 'ERROR', // The agent is in an error state and requires attention.
}

/**
 * Defines the billing model for an AI Agent's usage.
 */
export enum BillingModel {
    PER_CALL = 'PER_CALL',
    PER_TOKEN = 'PER_TOKEN',
    SUBSCRIPTION = 'SUBSCRIPTION',
    FREE = 'FREE',
}

/**
 * Represents a single capability or tool that an AI Agent can execute.
 */
export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    // A JSON schema representing the expected input parameters for this capability.
    inputSchema: Record<string, any>;
    // A JSON schema representing the expected output format from this capability.
    outputSchema: Record<string, any>;
}

/**
 * Base interface for agent cost structures.
 */
interface AgentCostBase {
    model: BillingModel;
}

/**
 * Cost structure for agents billed per API call.
 */
export interface PerCallCost extends AgentCostBase {
    model: BillingModel.PER_CALL;
    costPerCall: number; // Cost in USD per thousand calls.
}

/**
 * Cost structure for agents billed per token processed.
 */
export interface PerTokenCost extends AgentCostBase {
    model: BillingModel.PER_TOKEN;
    costPerInputToken: number; // Cost in USD per million input tokens.
    costPerOutputToken: number; // Cost in USD per million output tokens.
}

/**
 * Cost structure for agents available via a subscription.
 */
export interface SubscriptionCost extends AgentCostBase {
    model: BillingModel.SUBSCRIPTION;
    monthlyFee: number; // Monthly cost in USD.
    callLimit: number; // Number of calls included per month.
    overageCostPerCall?: number; // Cost per thousand calls after the limit is exceeded.
}

/**
 * Cost structure for free agents.
 */
export interface FreeCost extends AgentCostBase {
    model: BillingModel.FREE;
}

/**
 * A union type representing all possible cost models for an AI Agent.
 */
export type AgentCost = PerCallCost | PerTokenCost | SubscriptionCost | FreeCost;

/**
 * Defines a required configuration parameter for an agent, such as an API key or a setting.
 */
export interface AgentConfigurationParameter {
    key: string;
    label: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'secret';
    required: boolean;
    defaultValue?: string | number | boolean;
}

/**
 * Represents performance metrics and analytics for an AI Agent.
 */
export interface AgentAnalytics {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageLatencyMs: number;
    p95LatencyMs: number;
    costLast30Days: number;
}

/**
 * Represents the comprehensive data model for a single AI Agent in the marketplace.
 */
export interface Agent {
    id: string;
    name: string;
    description: string;
    author: string; // e.g., "Demo Bank Labs", "Community Contributor"
    avatarUrl?: string;
    version: string; // e.g., "1.2.0"
    status: AgentStatus;
    capabilities: AgentCapability[];
    cost: AgentCost;
    requiredConfig: AgentConfigurationParameter[];
    analytics?: AgentAnalytics;
    tags: string[]; // For search and filtering, e.g., ["finance", "text-generation"]
    documentationUrl?: string; // Link to more detailed documentation.
    createdAt: string; // ISO 8601 date string
    updatedAt: string; // ISO 8601 date string
}

/**
 * Represents a user's subscription to a specific agent.
 */
export interface AgentSubscription {
    agentId: string;
    userId: string;
    subscribedAt: string; // ISO 8601 date string
    expiresAt?: string; // For subscription models
    // Stores the user-provided values for the agent's requiredConfig.
    // 'secret' types should be stored securely and only referenced here.
    userConfig: Record<string, string | number | boolean>;
}