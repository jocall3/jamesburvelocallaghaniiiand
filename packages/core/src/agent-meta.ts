/**
 * Copyright (c) 2024. All rights reserved.
 * This software is proprietary and confidential.
 * 
 * File: packages/core/src/agent-meta.ts
 * Purpose: Standardized metadata structure for self-querying agent mode.
 * 
 * This file defines the contract for the "Self-Querying Agent Mode" mandated
 * for all 75 applications in the ecosystem. It provides Zod schemas for runtime
 * validation and TypeScript interfaces for compile-time safety.
 */

import { z } from 'zod';

// ============================================================================
// Enums & Constants
// ============================================================================

export enum FailureSeverity {
  LOW = 'LOW',                 // Cosmetic or minor UX impact
  MEDIUM = 'MEDIUM',           // Partial functionality loss, workaround available
  HIGH = 'HIGH',               // Core functionality impaired, no workaround
  CRITICAL = 'CRITICAL',       // Data loss or security breach risk
  CATASTROPHIC = 'CATASTROPHIC' // System-wide cascading failure
}

export enum UpdateTriggerType {
  SCHEDULED = 'SCHEDULED',
  EVENT_DRIVEN = 'EVENT_DRIVEN',
  MANUAL = 'MANUAL',
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION',
  DATA_DRIFT = 'DATA_DRIFT',
  SECURITY_POLICY_CHANGE = 'SECURITY_POLICY_CHANGE'
}

export enum DependencyType {
  INTERNAL_APP = 'INTERNAL_APP', // Another app in the 75-app suite
  EXTERNAL_API = 'EXTERNAL_API', // e.g., OpenAI, Stripe
  INFRASTRUCTURE = 'INFRASTRUCTURE', // e.g., Redis, Postgres
  DATASET = 'DATASET', // Static or dynamic data source
  MODEL = 'MODEL' // Specific AI model weights or endpoint
}

// ============================================================================
// Schemas (Runtime Validation)
// ============================================================================

export const AgentDependencySchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  type: z.nativeEnum(DependencyType),
  criticality: z.enum(['OPTIONAL', 'REQUIRED']),
  interfaceUrl: z.string().optional().describe("URL to the dependency's API definition or documentation"),
});

/**
 * The core metadata block that every agent must expose.
 * Corresponds to the 'agent_metadata' YAML requirement.
 */
export const AgentMetadataSchema = z.object({
  appId: z.string().regex(/^APP_\d{2}_[A-Za-z]+_[A-Za-z]+$/, "Must follow APP_[NN]_[DOMAIN]_[FUNCTION] format"),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  
  // Required fields from spec
  purpose: z.string().describe("Clear, concise statement of the agent's goal"),
  dependencies: z.array(AgentDependencySchema),
  invalidationConditions: z.array(z.string()).describe("Conditions under which this agent's logic or data becomes obsolete"),
  adjacentApps: z.array(z.string()).describe("IDs of other apps in the ecosystem this agent interacts with"),
  
  // VC Diligence / Business Logic
  revenueSurface: z.array(z.string()).describe("Mechanisms by which this agent generates value/revenue"),
  costDrivers: z.array(z.string()).describe("Primary factors driving operational cost (e.g. tokens, storage)"),
  
  // Legal / Compliance
  jurisdictionCompat: z.array(z.string()).default(['US', 'EU']).describe("Jurisdictions where this agent is compliant"),
  dataClassification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']),
});

export const AssumptionSchema = z.object({
  id: z.string(),
  description: z.string(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  validationMechanism: z.string().optional().describe("How this assumption is verified at runtime"),
  fallbackBehavior: z.string().optional().describe("What happens if this assumption is violated"),
});

export const FailureModeSchema = z.object({
  id: z.string(),
  description: z.string(),
  severity: z.nativeEnum(FailureSeverity),
  probability: z.enum(['RARE', 'OCCASIONAL', 'FREQUENT']),
  detectionLogic: z.string().describe("How this failure is detected programmatically"),
  mitigationStrategy: z.string().describe("Automated or manual steps to resolve"),
  recoveryTimeObjective: z.string().optional(),
});

export const UpdateTriggerSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(UpdateTriggerType),
  condition: z.string().describe("Logic predicate for the trigger"),
  action: z.string().describe("What update process is initiated"),
  frequency: z.string().optional(),
});

export const IntrospectionResultSchema = z.object({
  appId: z.string(),
  timestamp: z.string().datetime(),
  status: z.enum(['HEALTHY', 'DEGRADED', 'MAINTENANCE', 'FAILED']),
  uptimeSeconds: z.number(),
  version: z.string(),
  metrics: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  activeConfigProfile: z.string(),
  resourceUsage: z.object({
    memoryMb: z.number(),
    cpuPercent: z.number(),
    activeRequests: z.number(),
  }).optional(),
  lastError: z.object({
    message: z.string(),
    timestamp: z.string().datetime(),
    code: z.string().optional()
  }).optional().nullable(),
});

// ============================================================================
// Types (Compile-time)
// ============================================================================

export type AgentDependency = z.infer<typeof AgentDependencySchema>;
export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;
export type Assumption = z.infer<typeof AssumptionSchema>;
export type FailureMode = z.infer<typeof FailureModeSchema>;
export type UpdateTrigger = z.infer<typeof UpdateTriggerSchema>;
export type IntrospectionResult = z.infer<typeof IntrospectionResultSchema>;

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Interface that every App in the 75-app suite must implement to satisfy
 * the Self-Querying Agent Mode requirement.
 * 
 * This ensures the ecosystem can be traversed and reasoned about programmatically.
 */
export interface SelfQueryingAgent {
  /**
   * Returns the static metadata block defining the agent's existence.
   * Used for ecosystem mapping and dependency graph generation.
   */
  getMetadata(): AgentMetadata;

  /**
   * GET /introspect
   * Returns real-time health, status, and metrics.
   */
  introspect(): Promise<IntrospectionResult>;

  /**
   * GET /assumptions
   * Returns the list of operating assumptions.
   * Used for audit trails and stability analysis.
   */
  getAssumptions(): Promise<Assumption[]>;

  /**
   * GET /failure-modes
   * Returns known failure modes and mitigation strategies.
   * Used for red-teaming and SRE planning.
   */
  getFailureModes(): Promise<FailureMode[]>;

  /**
   * GET /update-triggers
   * Returns conditions that trigger self-updates or retraining.
   * Used for orchestration and lifecycle management.
   */
  getUpdateTriggers(): Promise<UpdateTrigger[]>;
}

/**
 * Base abstract class helper for implementing SelfQueryingAgent.
 * Apps can extend this to ensure compliance.
 */
export abstract class BaseAgent implements SelfQueryingAgent {
  protected abstract metadata: AgentMetadata;

  public getMetadata(): AgentMetadata {
    return this.metadata;
  }

  public abstract introspect(): Promise<IntrospectionResult>;
  public abstract getAssumptions(): Promise<Assumption[]>;
  public abstract getFailureModes(): Promise<FailureMode[]>;
  public abstract getUpdateTriggers(): Promise<UpdateTrigger[]>;
}