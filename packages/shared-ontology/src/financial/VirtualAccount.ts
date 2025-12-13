import { z } from 'zod';

/**
 * @file VirtualAccount.ts
 * @description Defines the canonical schema for Virtual Accounts within the shared ontology.
 * This domain model handles financial tracking, usage limits, and provider-specific scoping
 * for AI resource consumption across the ecosystem.
 */

// ============================================================================
// PRIMITIVES & ENUMS
// ============================================================================

export const CurrencySchema = z.enum(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'BTC', 'ETH', 'USDC']);
export type Currency = z.infer<typeof CurrencySchema>;

export const AccountStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'SUSPENDED_MANUAL',
  'SUSPENDED_LIMIT_REACHED',
  'SUSPENDED_COMPLIANCE',
  'ARCHIVED',
  'FROZEN_LEGAL'
]);
export type AccountStatus = z.infer<typeof AccountStatusSchema>;

export const AccountTypeSchema = z.enum([
  'PREPAID',      // Balance decreases, stops at 0
  'POSTPAID',     // Balance goes negative, billed later
  'CREDIT_GRANT', // Promotional credits, distinct expiration
  'ENTERPRISE'    // Custom negotiated terms
]);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const AIProviderSchema = z.enum([
  'OPENAI', 'ANTHROPIC', 'GOOGLE_DEEPMIND', 'META_AI', 'AZURE_AI', 'AWS_BEDROCK',
  'COHERE', 'MISTRAL', 'HUGGING_FACE', 'PALANTIR', 'DATABRICKS', 'SNOWFLAKE',
  'MIDJOURNEY', 'STABILITY_AI', 'PERPLEXITY', 'PINECONE', 'WEAVIATE', 'LANGCHAIN',
  'INTERNAL_HOSTED', 'OTHER'
]);
export type AIProvider = z.infer<typeof AIProviderSchema>;

// ============================================================================
// VALUE OBJECTS
// ============================================================================

export const MoneySchema = z.object({
  amount: z.number().describe("Amount in major units (e.g., dollars)"),
  currency: CurrencySchema
}).refine(data => Number.isFinite(data.amount), { message: "Amount must be finite" });

export type Money = z.infer<typeof MoneySchema>;

export const UsageLimitSchema = z.object({
  period: z.enum(['DAILY', 'MONTHLY', 'TOTAL']),
  amount: z.number().positive(),
  action: z.enum(['NOTIFY', 'SUSPEND', 'HARD_CAP']),
  scope: z.array(AIProviderSchema).optional().describe("If set, limit applies only to these providers")
});
export type UsageLimit = z.infer<typeof UsageLimitSchema>;

export const AccountMetadataSchema = z.object({
  costCenter: z.string().optional(),
  projectId: z.string().optional(),
  environment: z.enum(['DEV', 'STAGING', 'PROD']).default('DEV'),
  tags: z.record(z.string()).default({}),
  jurisdiction: z.string().default('US-EAST'),
  complianceLevel: z.enum(['STANDARD', 'HIPAA', 'GDPR', 'FEDRAMP']).default('STANDARD')
});
export type AccountMetadata = z.infer<typeof AccountMetadataSchema>;

// ============================================================================
// DOMAIN ENTITY SCHEMA
// ============================================================================

export const VirtualAccountSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().min(1),
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  
  type: AccountTypeSchema,
  status: AccountStatusSchema,
  
  balance: MoneySchema,
  reservedFunds: MoneySchema.default({ amount: 0, currency: 'USD' }),
  
  limits: z.array(UsageLimitSchema).default([]),
  
  allowedProviders: z.union([
    z.literal('*'),
    z.array(AIProviderSchema)
  ]).describe("Whitelist of AI vendors this account can transact with"),
  
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.number().int().nonnegative().describe("Optimistic concurrency version"),
  
  metadata: AccountMetadataSchema
});

export type VirtualAccount = z.infer<typeof VirtualAccountSchema>;

// ============================================================================
// EVENT SOURCING CONTRACTS
// ============================================================================

export const VirtualAccountEventTypes = {
  CREATED: 'VirtualAccountCreated',
  FUNDS_DEPOSITED: 'FundsDeposited',
  FUNDS_RESERVED: 'FundsReserved',
  FUNDS_RELEASED: 'FundsReleased',
  USAGE_CHARGED: 'UsageCharged',
  LIMIT_UPDATED: 'LimitUpdated',
  STATUS_CHANGED: 'StatusChanged',
  PROVIDER_SCOPE_UPDATED: 'ProviderScopeUpdated'
} as const;

const BaseEventSchema = z.object({
  eventId: z.string().uuid(),
  accountId: z.string().uuid(),
  timestamp: z.date(),
  version: z.number().int()
});

export const VirtualAccountCreatedEvent = BaseEventSchema.extend({
  type: z.literal(VirtualAccountEventTypes.CREATED),
  payload: VirtualAccountSchema
});

export const FundsDepositedEvent = BaseEventSchema.extend({
  type: z.literal(VirtualAccountEventTypes.FUNDS_DEPOSITED),
  payload: z.object({
    amount: MoneySchema,
    sourceReference: z.string(),
    reason: z.string().optional()
  })
});

export const UsageChargedEvent = BaseEventSchema.extend({
  type: z.literal(VirtualAccountEventTypes.USAGE_CHARGED),
  payload: z.object({
    amount: MoneySchema,
    provider: AIProviderSchema,
    model: z.string(),
    tokens: z.object({
      prompt: z.number().int(),
      completion: z.number().int()
    }).optional(),
    requestId: z.string()
  })
});

export const StatusChangedEvent = BaseEventSchema.extend({
  type: z.literal(VirtualAccountEventTypes.STATUS_CHANGED),
  payload: z.object({
    oldStatus: AccountStatusSchema,
    newStatus: AccountStatusSchema,
    reason: z.string()
  })
});

export type VirtualAccountEvent = 
  | z.infer<typeof VirtualAccountCreatedEvent>
  | z.infer<typeof FundsDepositedEvent>
  | z.infer<typeof UsageChargedEvent>
  | z.infer<typeof StatusChangedEvent>;

// ============================================================================
// DOMAIN LOGIC & BEHAVIOR
// ============================================================================

export class VirtualAccountDomain {
  
  /**
   * Validates if a transaction can occur based on account state and rules.
   */
  static canTransact(account: VirtualAccount, amount: number, provider: AIProvider): { allowed: boolean; reason?: string } {
    // 1. Status Check
    if (account.status !== 'ACTIVE') {
      return { allowed: false, reason: `Account is ${account.status}` };
    }

    // 2. Provider Scope Check
    if (account.allowedProviders !== '*' && !account.allowedProviders.includes(provider)) {
      return { allowed: false, reason: `Provider ${provider} is not authorized for this account` };
    }

    // 3. Balance Check (for Prepaid)
    if (account.type === 'PREPAID') {
      const available = account.balance.amount - account.reservedFunds.amount;
      if (available < amount) {
        return { allowed: false, reason: `Insufficient funds. Available: ${available}, Required: ${amount}` };
      }
    }

    // 4. Currency Check (Implicit assumption of single currency for simplicity in this method)
    // In a full implementation, currency conversion logic would be injected here.

    return { allowed: true };
  }

  /**
   * Calculates the new state based on an event (Reducer pattern).
   */
  static applyEvent(currentState: VirtualAccount | null, event: VirtualAccountEvent): VirtualAccount {
    if (event.type === VirtualAccountEventTypes.CREATED) {
      if (currentState) throw new Error("Cannot create an already existing account");
      return event.payload;
    }

    if (!currentState) throw new Error(`Event ${event.type} applied to null state`);

    // Version check
    if (event.version !== currentState.version + 1) {
      // In a real system, handle out-of-order or idempotent replays
      // console.warn(`Version mismatch: expected ${currentState.version + 1}, got ${event.version}`);
    }

    const nextState = { ...currentState, version: event.version, updatedAt: event.timestamp };

    switch (event.type) {
      case VirtualAccountEventTypes.FUNDS_DEPOSITED:
        if (event.payload.amount.currency !== nextState.balance.currency) {
          throw new Error("Multi-currency deposits not yet supported in synchronous reducer");
        }
        nextState.balance = {
          ...nextState.balance,
          amount: nextState.balance.amount + event.payload.amount.amount
        };
        // If account was suspended due to limit/funds, potentially reactivate?
        // Policy decision: usually manual reactivation is safer, but auto-reactivate for prepaid is common.
        if (nextState.status === 'SUSPENDED_LIMIT_REACHED' && nextState.balance.amount > 0) {
            nextState.status = 'ACTIVE';
        }
        break;

      case VirtualAccountEventTypes.USAGE_CHARGED:
        nextState.balance = {
          ...nextState.balance,
          amount: nextState.balance.amount - event.payload.amount.amount
        };
        // Check for negative balance on prepaid
        if (nextState.type === 'PREPAID' && nextState.balance.amount <= 0) {
          nextState.status = 'SUSPENDED_LIMIT_REACHED';
        }
        break;

      case VirtualAccountEventTypes.STATUS_CHANGED:
        nextState.status = event.payload.newStatus;
        break;
    }

    return nextState;
  }

  /**
   * Factory for creating a new account with defaults.
   */
  static create(
    params: Pick<VirtualAccount, 'ownerId' | 'name' | 'currency' | 'type'> & Partial<VirtualAccount>
  ): VirtualAccount {
    const now = new Date();
    return VirtualAccountSchema.parse({
      id: crypto.randomUUID(),
      ownerId: params.ownerId,
      name: params.name,
      description: params.description,
      type: params.type,
      status: 'DRAFT',
      balance: { amount: 0, currency: params.currency || 'USD' },
      reservedFunds: { amount: 0, currency: params.currency || 'USD' },
      limits: params.limits || [],
      allowedProviders: params.allowedProviders || '*',
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: params.metadata || { environment: 'DEV', tags: {} }
    });
  }
}

// ============================================================================
// SELF-INTROSPECTION & METADATA
// ============================================================================

export const agent_metadata = {
  purpose: "Canonical definition of a Virtual Account for financial tracking of AI resource consumption.",
  dependencies: ["zod", "crypto"],
  invalidation_conditions: [
    "Schema version mismatch",
    "Currency standard changes (ISO 4217 updates)",
    "New AI provider integration requiring specific billing fields"
  ],
  adjacent_apps: [
    "APP_01_Inference_CostRouter",
    "APP_37_Governance_AuditTrailEngine",
    "APP_42_Billing_InvoiceGenerator"
  ],
  capabilities: [
    "validate_transaction",
    "apply_event",
    "check_provider_scope",
    "enforce_limits"
  ]
};