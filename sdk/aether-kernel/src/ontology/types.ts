/**
 * @file types.ts
 * @description Core financial and economic ontology definitions for the Aether Kernel SDK.
 * Generated from APP_04_Ontology_SchemaRegistry.
 * 
 * This module defines the strict type contracts for value exchange, resource allocation,
 * and risk assessment within the Aether ecosystem. It bridges traditional financial
 * concepts (Positions, Trades) with AI-native assets (Compute, Tokens, Model Leases).
 * 
 * @license MIT
 * @version 1.0.0
 */

// -----------------------------------------------------------------------------
// Primitive Types & Scalars
// -----------------------------------------------------------------------------

export type UUID = string;
export type ISO8601Timestamp = string;
export type BigIntString = string; // For high-precision arithmetic (e.g. wei, satoshis, token counts)
export type DecimalString = string; // For currency values to avoid floating point errors
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'BTC' | 'ETH' | 'USDC' | 'AETHER_CREDIT';

/**
 * Represents a distinct entity within the ecosystem capable of owning assets or initiating trades.
 */
export type EntityId = UUID;

/**
 * Represents a specific AI Model, Dataset, or Infrastructure Node.
 */
export type ResourceId = UUID;

// -----------------------------------------------------------------------------
// Asset & Instrument Ontology
// -----------------------------------------------------------------------------

export enum AssetClass {
  FIAT = 'FIAT',
  CRYPTO = 'CRYPTO',
  COMPUTE_UNIT = 'COMPUTE_UNIT', // e.g., H100-hour
  INFERENCE_TOKEN = 'INFERENCE_TOKEN', // e.g., 1M input tokens
  MODEL_LICENSE = 'MODEL_LICENSE', // Right to use a specific model weights
  DATASET_LEASE = 'DATASET_LEASE', // Right to train on a dataset
  SYNTHETIC_DATA_BATCH = 'SYNTHETIC_DATA_BATCH',
  PREDICTION_MARKET_SHARE = 'PREDICTION_MARKET_SHARE'
}

export enum InstrumentType {
  SPOT = 'SPOT',
  FUTURE = 'FUTURE',
  OPTION = 'OPTION',
  PERPETUAL = 'PERPETUAL',
  SUBSCRIPTION = 'SUBSCRIPTION',
  SLA_CONTRACT = 'SLA_CONTRACT' // Service Level Agreement backed by financial penalty
}

export interface InstrumentMetadata {
  provider_id: string; // e.g., "openai", "aws", "anthropic"
  region?: string;
  tier?: string;
  sla_uptime_guarantee?: number;
  compliance_flags?: string[];
}

export interface Instrument {
  id: UUID;
  symbol: string; // e.g., "GPT4-TOK-USD", "H100-SPOT-USDC"
  asset_class: AssetClass;
  type: InstrumentType;
  base_currency: CurrencyCode;
  quote_currency: CurrencyCode;
  tick_size: DecimalString;
  lot_size: DecimalString;
  metadata: InstrumentMetadata;
  created_at: ISO8601Timestamp;
  active: boolean;
}

// -----------------------------------------------------------------------------
// Order & Trade Management
// -----------------------------------------------------------------------------

export enum OrderSide {
  BUY = 'BUY', // Bid
  SELL = 'SELL' // Ask
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP_LOSS = 'STOP_LOSS',
  TAKE_PROFIT = 'TAKE_PROFIT',
  TWAP = 'TWAP', // Time-Weighted Average Price (for large compute acquisition)
  VWAP = 'VWAP'  // Volume-Weighted Average Price
}

export enum OrderStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum TimeInForce {
  GTC = 'GTC', // Good Till Cancelled
  IOC = 'IOC', // Immediate or Cancel
  FOK = 'FOK', // Fill or Kill
  GTD = 'GTD'  // Good Till Date
}

export interface Order {
  id: UUID;
  client_order_id?: string;
  instrument_id: UUID;
  owner_id: EntityId;
  side: OrderSide;
  type: OrderType;
  quantity: DecimalString;
  price?: DecimalString; // Required for LIMIT
  stop_price?: DecimalString; // Required for STOP
  time_in_force: TimeInForce;
  expire_at?: ISO8601Timestamp;
  filled_quantity: DecimalString;
  average_fill_price: DecimalString;
  status: OrderStatus;
  fees_accrued: DecimalString;
  created_at: ISO8601Timestamp;
  updated_at: ISO8601Timestamp;
  
  // AI-Specific Context
  context?: {
    project_id?: string;
    workflow_id?: string;
    priority_level?: number;
    max_latency_ms?: number;
  };
}

export interface Trade {
  id: UUID;
  order_id: UUID;
  instrument_id: UUID;
  buyer_id: EntityId;
  seller_id: EntityId;
  price: DecimalString;
  quantity: DecimalString;
  fee: DecimalString;
  fee_currency: CurrencyCode;
  executed_at: ISO8601Timestamp;
  settlement_at?: ISO8601Timestamp;
  
  // Provenance
  execution_venue: string; // e.g., "AETHER_DEX", "AWS_MARKETPLACE"
  transaction_hash?: string; // If settled on-chain
}

// -----------------------------------------------------------------------------
// Portfolio & Position Tracking
// -----------------------------------------------------------------------------

export interface Position {
  id: UUID;
  portfolio_id: UUID;
  instrument_id: UUID;
  side: 'LONG' | 'SHORT';
  quantity: DecimalString;
  cost_basis: DecimalString;
  market_value: DecimalString;
  unrealized_pnl: DecimalString;
  realized_pnl: DecimalString;
  last_updated: ISO8601Timestamp;
  
  // Risk Markers
  leverage: DecimalString;
  liquidation_price?: DecimalString;
  collateral_locked: DecimalString;
}

export interface Portfolio {
  id: UUID;
  owner_id: EntityId;
  name: string;
  base_currency: CurrencyCode;
  total_equity: DecimalString;
  available_margin: DecimalString;
  used_margin: DecimalString;
  positions: Position[];
  risk_profile: RiskProfile;
  created_at: ISO8601Timestamp;
  updated_at: ISO8601Timestamp;
}

// -----------------------------------------------------------------------------
// Risk Management & Analytics
// -----------------------------------------------------------------------------

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface RiskMetrics {
  value_at_risk_95: DecimalString; // 95% VaR
  value_at_risk_99: DecimalString; // 99% VaR
  sharpe_ratio?: DecimalString;
  max_drawdown: DecimalString;
  volatility_30d: DecimalString;
  beta_to_market: DecimalString;
  
  // AI-Specific Risk
  model_drift_score?: number; // 0.0 to 1.0
  compliance_score?: number; // 0.0 to 1.0
  dependency_concentration: number; // 0.0 to 1.0 (Vendor lock-in risk)
}

export interface RiskProfile {
  level: RiskLevel;
  max_leverage_allowed: number;
  approved_asset_classes: AssetClass[];
  approved_vendors: string[]; // Whitelist of AI providers
  stop_loss_limit_pct: number;
  daily_spend_limit: DecimalString;
}

export interface MarginCall {
  id: UUID;
  portfolio_id: UUID;
  shortfall_amount: DecimalString;
  currency: CurrencyCode;
  deadline: ISO8601Timestamp;
  status: 'OPEN' | 'RESOLVED' | 'LIQUIDATED';
  triggered_by_event_id?: string;
}

// -----------------------------------------------------------------------------
// Settlement & Billing
// -----------------------------------------------------------------------------

export enum BillingCycle {
  REAL_TIME = 'REAL_TIME', // Per token/second
  HOURLY = 'HOURLY',
  MONTHLY = 'MONTHLY',
  NET_30 = 'NET_30'
}

export interface Invoice {
  id: UUID;
  issuer_id: EntityId;
  recipient_id: EntityId;
  amount_due: DecimalString;
  currency: CurrencyCode;
  line_items: InvoiceLineItem[];
  issue_date: ISO8601Timestamp;
  due_date: ISO8601Timestamp;
  paid_at?: ISO8601Timestamp;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';
}

export interface InvoiceLineItem {
  description: string;
  quantity: DecimalString;
  unit_price: DecimalString;
  total: DecimalString;
  metadata?: {
    resource_id?: ResourceId;
    usage_start?: ISO8601Timestamp;
    usage_end?: ISO8601Timestamp;
    metric?: string; // e.g. "tokens_output", "gpu_minutes"
  };
}

// -----------------------------------------------------------------------------
// Audit & Governance
// -----------------------------------------------------------------------------

export interface AuditLogEntry {
  id: UUID;
  timestamp: ISO8601Timestamp;
  actor_id: EntityId;
  action: string; // e.g. "EXECUTE_TRADE", "MODIFY_RISK_LIMIT"
  resource_type: string;
  resource_id: string;
  changes: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  context: {
    ip_address?: string;
    user_agent?: string;
    jurisdiction?: string;
  };
  signature?: string; // Cryptographic proof of log integrity
}

/**
 * Represents the economic impact of an AI Agent's operation.
 */
export interface AgentEconomicImpact {
  agent_id: UUID;
  period_start: ISO8601Timestamp;
  period_end: ISO8601Timestamp;
  cost_incurred: DecimalString;
  value_generated: DecimalString; // Estimated or realized
  roi: DecimalString;
  currency: CurrencyCode;
  resource_consumption: {
    tokens_input: number;
    tokens_output: number;
    compute_seconds: number;
    api_calls: number;
  };
}

// -----------------------------------------------------------------------------
// Introspection & Metadata
// -----------------------------------------------------------------------------

export const ONTOLOGY_METADATA = {
  version: "1.0.0",
  domain: "FINANCE_CORE",
  schema_registry_ref: "APP_04_Ontology_SchemaRegistry",
  supported_currencies: ["USD", "EUR", "AETHER_CREDIT", "BTC", "ETH"],
  compliance_standards: ["GAAP", "IFRS", "SOC2_TYPE_II"],
  description: "Standardized types for financial instruments, trading, and risk within the Aether AI ecosystem."
};