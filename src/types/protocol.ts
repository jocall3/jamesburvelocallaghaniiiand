/**
 * src/types/protocol.ts
 *
 * TypeScript interfaces defining the core concepts and data structures related to the '527 Protocol'
 * domains: Genesis, Sovereignty, FinOS, AI, GEIN, Assets, Transition.
 *
 * These interfaces serve as the foundational types for data exchange and state representation
 * within the 527 Protocol ecosystem.
 */

/**
 * Common utility types used across the 527 Protocol.
 */
export type ProtocolVersion = string; // e.g., "1.0.0-alpha", "2.1.5"
export type Timestamp = number; // Unix epoch milliseconds (e.g., Date.now())
export type Hash = string; // Cryptographic hash, e.g., SHA256, Keccak256
export type Address = string; // Protocol-specific address format (e.g., 0x..., 527...)
export type UUID = string; // Universally Unique Identifier (e.g., v4 UUID)
export type Signature = string; // Cryptographic signature (e.g., ECDSA signature)
export type URI = string; // Uniform Resource Identifier (e.g., https://..., ipfs://...)

/**
 * --- 1. Genesis Domain ---
 * Defines the initial configuration and foundational parameters of the 527 Protocol network.
 */
export interface IGenesisConfig {
  protocolVersion: ProtocolVersion;
  networkId: string; // Unique identifier for the specific network instance (e.g., 'mainnet', 'testnet-alpha')
  creationTimestamp: Timestamp;
  initialParameters: {
    [key: string]: any; // Flexible for various initial settings like block time, max supply, etc.
  };
  genesisBlockhash: Hash; // Hash of the very first block/state
  governanceModelRef: UUID; // Reference to the initial governance model
}

/**
 * --- 2. Sovereignty Domain ---
 * Defines identities, governance structures, and jurisdictional boundaries within the protocol.
 */
export enum IdentityType {
  Individual = 'INDIVIDUAL',
  Organization = 'ORGANIZATION',
  AutonomousAgent = 'AUTONOMOUS_AGENT',
  ProtocolEntity = 'PROTOCOL_ENTITY', // For entities managed by the protocol itself
}

export interface ISovereignIdentity {
  id: UUID; // Unique identifier for the sovereign identity
  address: Address; // Primary cryptographic address associated with the identity
  type: IdentityType;
  publicKey: string; // Public key for verifying signatures and ownership
  metadata?: {
    name?: string;
    description?: string;
    profilePictureUri?: URI;
    [key: string]: any; // Additional flexible metadata
  };
  // Potentially add reputation scores, linked identities, etc.
}

export interface IJurisdiction {
  id: UUID;
  name: string;
  description?: string;
  governanceModelRef: UUID; // Reference to the IGovernanceModel that applies
  scope: string[]; // Defines the boundaries or areas of application (e.g., ['geographic:global', 'functional:finos'])
  parentJurisdictionId?: UUID; // For hierarchical jurisdictions
  // Potentially add specific rulesets or policy references
}

export interface IGovernanceModel {
  id: UUID;
  name: string;
  description?: string;
  rulesetHash: Hash; // Hash of the governing ruleset document or smart contract code
  decisionMechanism: 'VOTING' | 'CONSENSUS' | 'DELEGATED' | 'AI_DRIVEN' | 'HYBRID';
  parameters: {
    [key: string]: any; // Parameters specific to the decision mechanism (e.g., quorum, voting period)
  };
  // Potentially add references to smart contracts implementing the governance logic
}

/**
 * --- 3. FinOS (Financial Operating System) Domain ---
 * Defines financial accounts, transactions, ledger entries, and financial instruments.
 */
export enum AccountType {
  Standard = 'STANDARD',
  Escrow = 'ESCROW',
  SmartContract = 'SMART_CONTRACT',
  Reserve = 'RESERVE',
  Vault = 'VAULT',
}

export interface IAccount {
  id: UUID; // Unique account identifier
  ownerId: UUID; // Reference to ISovereignIdentity or another protocol entity
  address: Address; // Cryptographic address of the account
  type: AccountType;
  balance: string; // Current balance, represented as a string for arbitrary precision
  currencySymbol: string; // Symbol of the currency held (e.g., '527C', 'USDt', 'ETH')
  metadata?: {
    name?: string;
    description?: string;
    [key: string]: any;
  };
  // Potentially add last activity timestamp, associated smart contracts
}

export enum TransactionType {
  Transfer = 'TRANSFER',
  Mint = 'MINT',
  Burn = 'BURN',
  Fee = 'FEE',
  ContractCall = 'CONTRACT_CALL',
  Reward = 'REWARD',
  Stake = 'STAKE',
  Unstake = 'UNSTAKE',
}

export interface ITransaction {
  id: UUID; // Unique transaction identifier (often a hash)
  timestamp: Timestamp;
  type: TransactionType;
  senderAddress: Address;
  receiverAddress: Address;
  amount: string; // Amount transferred/involved, string for precision
  currencySymbol: string;
  fee: string; // Transaction fee, string for precision
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REVERTED';
  blockNumber?: number; // Block number if confirmed on a blockchain
  metadata?: {
    memo?: string; // Optional memo or description
    contractInteraction?: {
      contractAddress: Address;
      method: string;
      args: any[];
    };
    [key: string]: any;
  };
  signature: Signature; // Signature(s) authorizing the transaction
}

export interface ILedgerEntry {
  entryId: UUID; // Unique identifier for this ledger entry
  transactionId: UUID; // Reference to the ITransaction that caused this entry
  accountId: UUID; // The account affected by this entry
  amount: string; // The amount of change, positive for credit, negative for debit
  currencySymbol: string;
  timestamp: Timestamp;
  balanceAfter: string; // The account's balance after this entry was applied
  metadata?: {
    [key: string]: any;
  };
}

export interface IFinancialInstrument {
  id: UUID; // Unique identifier for the instrument
  name: string;
  symbol: string; // Ticker symbol or short identifier
  type: 'TOKEN' | 'NFT' | 'BOND' | 'EQUITY' | 'DERIVATIVE' | 'COMMODITY';
  issuerId: UUID; // Reference to ISovereignIdentity of the issuer
  totalSupply?: string; // For fungible instruments (e.g., tokens)
  contractAddress?: Address; // If the instrument is represented by a smart contract
  metadata?: {
    description?: string;
    decimals?: number; // For tokens
    uri?: URI; // For NFTs (metadata URI)
    [key: string]: any;
  };
}

/**
 * --- 4. AI Domain ---
 * Defines AI models, agents, datasets, and compute resources within the protocol.
 */
export enum AIModelType {
  Generative = 'GENERATIVE',
  Predictive = 'PREDICTIVE',
  Discriminative = 'DISCRIMINATIVE',
  ReinforcementLearning = 'REINFORCEMENT_LEARNING',
  NaturalLanguageProcessing = 'NLP',
  ComputerVision = 'CV',
}

export interface IAIModel {
  id: UUID; // Unique identifier for the AI model
  name: string;
  version: string;
  type: AIModelType;
  ownerId: UUID; // Reference to ISovereignIdentity of the model owner
  modelHash: Hash; // Hash of the model's weights, architecture, or code
  trainingDatasetRef?: UUID; // Optional reference to the IDataset used for training
  inferenceEndpoint?: URI; // API endpoint for model inference
  costPerInference?: string; // Cost to use the model per inference, string for precision
  currencySymbol?: string; // Currency for cost
  licenseUri?: URI; // URI to the model's license
  metadata?: {
    description?: string;
    framework?: string; // e.g., 'PyTorch', 'TensorFlow'
    parameters?: { [key: string]: any };
    [key: string]: any;
  };
}

export interface IAIAgent {
  id: UUID; // Unique identifier for the AI agent
  name: string;
  ownerId: UUID; // Reference to ISovereignIdentity of the agent owner
  modelRef: UUID; // Reference to the IAIModel the agent utilizes
  purpose: string; // Description of the agent's function
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ERROR';
  permissions: string[]; // List of permissions or capabilities (e.g., 'READ_FINOS_DATA', 'EXECUTE_TRANSACTION')
  walletAddress?: Address; // Optional address if the agent manages its own funds
  metadata?: {
    [key: string]: any;
  };
}

export interface IDataset {
  id: UUID; // Unique identifier for the dataset
  name: string;
  ownerId: UUID; // Reference to ISovereignIdentity of the dataset owner
  dataHash: Hash; // Hash of the dataset content (or a manifest hash)
  sizeBytes: number;
  accessPolicy: 'PUBLIC' | 'PRIVATE' | 'LICENSED' | 'RESTRICTED';
  storageLocation: URI; // URI to the dataset's storage (e.g., IPFS hash, S3 URL)
  metadata?: {
    description?: string;
    schemaHash?: Hash; // Hash of the dataset's schema
    dataFormat?: string; // e.g., 'CSV', 'JSON', 'Parquet'
    [key: string]: any;
  };
}

export interface IComputeResource {
  id: UUID; // Unique identifier for the compute resource
  ownerId: UUID; // Reference to ISovereignIdentity of the resource owner
  type: 'CPU' | 'GPU' | 'TPU' | 'QUANTUM' | 'FPGA';
  capacity: string; // Description of capacity (e.g., '16 Cores', 'A100 GPU', '100 Qubits')
  availability: 'ONLINE' | 'OFFLINE' | 'RESERVED' | 'MAINTENANCE';
  costPerHour?: string; // Cost to use the resource per hour, string for precision
  currencySymbol?: string; // Currency for cost
  endpoint?: URI; // API endpoint for resource access
  metadata?: {
    location?: string; // Physical or virtual location
    provider?: string; // e.g., 'AWS', 'Azure', 'Decentralized Network'
    [key: string]: any;
  };
}

/**
 * --- 5. GEIN (Global Economic Information Network) Domain ---
 * Defines economic indicators, market data feeds, and oracle services.
 */
export enum EconomicIndicatorType {
  GDP = 'GDP',
  Inflation = 'INFLATION',
  Unemployment = 'UNEMPLOYMENT',
  MarketIndex = 'MARKET_INDEX',
  CommodityPrice = 'COMMODITY_PRICE',
  InterestRate = 'INTEREST_RATE',
  Custom = 'CUSTOM',
}

export interface IEconomicIndicator {
  id: UUID; // Unique identifier for the indicator
  name: string;
  type: EconomicIndicatorType;
  source: string; // Origin of the data (e.g., 'World Bank', 'BLS', 'Custom Oracle')
  unit: string; // Unit of measurement (e.g., '%', 'USD', 'Index Points')
  lastUpdateTime: Timestamp;
  currentValue: string; // Current value, string for precision
  history?: { timestamp: Timestamp; value: string }[]; // Optional historical data points
  metadata?: {
    description?: string;
    frequency?: string; // e.g., 'monthly', 'quarterly'
    [key: string]: any;
  };
}

export interface IMarketDataFeed {
  id: UUID; // Unique identifier for the data feed
  name: string;
  symbol: string; // Ticker symbol or pair (e.g., 'BTC/USD', 'AAPL')
  exchange: string; // Source exchange or market
  dataType: 'SPOT_PRICE' | 'ORDER_BOOK' | 'CANDLESTICK' | 'VOLUME';
  lastUpdateTime: Timestamp;
  currentData: any; // Flexible structure for different data types (e.g., { bid: 'X', ask: 'Y' } or { open: 'X', high: 'Y', ... })
  providerId: UUID; // Reference to ISovereignIdentity of the data provider
  metadata?: {
    [key: string]: any;
  };
}

export interface IOracleData {
  id: UUID; // Unique identifier for the oracle data point
  query: string; // The specific query that the oracle resolved
  result: string; // The resolved data (e.g., '25000.00' for BTC price, 'true' for a boolean check)
  timestamp: Timestamp;
  dataSource: URI; // URI to the external data source attested by the oracle
  attestationHash: Hash; // Hash of the attestation/proof provided by the oracle
  providerId: UUID; // Reference to ISovereignIdentity of the oracle provider
  metadata?: {
    [key: string]: any;
  };
}

/**
 * --- 6. Assets Domain ---
 * Defines general assets, their ownership, and lifecycle events.
 */
export enum AssetCategory {
  Digital = 'DIGITAL', // e.g., software licenses, digital art
  Physical = 'PHYSICAL', // e.g., real estate, machinery, commodities
  IntellectualProperty = 'INTELLECTUAL_PROPERTY', // e.g., patents, copyrights, trademarks
  Financial = 'FINANCIAL', // e.g., stocks, bonds, derivatives (distinct from FinOS instruments which are *tokenized* financial assets)
  RealEstate = 'REAL_ESTATE',
  Service = 'SERVICE', // e.g., subscription, compute service
}

export interface IAsset {
  id: UUID; // Unique identifier for the asset
  name: string;
  category: AssetCategory;
  ownerId: UUID; // Reference to ISovereignIdentity of the current owner
  currentValue?: string; // Optional, can be dynamic and require an oracle
  currencySymbol?: string; // If value is monetary
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED' | 'PENDING_TRANSFER';
  metadata?: {
    description?: string;
    location?: string; // For physical assets
    contractAddress?: Address; // If the asset is tokenized or managed by a smart contract
    uri?: URI; // For digital assets (e.g., content URI)
    [key: string]: any;
  };
}

export interface IAssetOwnership {
  assetId: UUID; // Reference to IAsset
  ownerId: UUID; // Reference to ISovereignIdentity
  ownershipPercentage?: string; // e.g., '1.0' for 100%, '0.5' for 50% (string for precision)
  acquisitionTimestamp: Timestamp;
  transferHistory?: {
    fromOwnerId: UUID;
    toOwnerId: UUID;
    timestamp: Timestamp;
    transactionId?: UUID; // Reference to ITransaction if applicable
    signature?: Signature; // Proof of transfer
  }[];
  metadata?: {
    [key: string]: any;
  };
}

export enum AssetLifecycleEventType {
  Creation = 'CREATION',
  Acquisition = 'ACQUISITION',
  Maintenance = 'MAINTENANCE',
  Upgrade = 'UPGRADE',
  Depreciation = 'DEPRECIATION',
  Transfer = 'TRANSFER',
  Disposal = 'DISPOSAL',
  Tokenization = 'TOKENIZATION',
  DeTokenization = 'DE_TOKENIZATION',
}

export interface IAssetLifecycleEvent {
  eventId: UUID; // Unique identifier for the lifecycle event
  assetId: UUID; // Reference to IAsset
  type: AssetLifecycleEventType;
  timestamp: Timestamp;
  actorId: UUID; // ISovereignIdentity who initiated/performed the event
  details?: {
    [key: string]: any; // Event-specific details (e.g., maintenance report, upgrade description)
  };
  transactionId?: UUID; // Optional reference to a FinOS transaction if applicable
}

/**
 * --- 7. Transition Domain ---
 * Defines mechanisms for protocol evolution, upgrades, and state migrations.
 */
export enum ProposalStatus {
  Draft = 'DRAFT',
  Submitted = 'SUBMITTED',
  Voting = 'VOTING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Executed = 'EXECUTED',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED',
}

export interface IProtocolUpgradeProposal {
  id: UUID; // Unique identifier for the proposal
  title: string;
  description: string;
  proposerId: UUID; // Reference to ISovereignIdentity who proposed it
  submissionTimestamp: Timestamp;
  targetVersion: ProtocolVersion; // The protocol version this upgrade aims to achieve
  changesHash: Hash; // Hash of the proposed code, configuration, or documentation changes
  status: ProposalStatus;
  votingPeriodEnd?: Timestamp;
  votes?: {
    yes: string; // Total 'yes' votes/weight, string for precision
    no: string; // Total 'no' votes/weight, string for precision
    abstain: string; // Total 'abstain' votes/weight, string for precision
  };
  executionTimestamp?: Timestamp; // When the upgrade was (or will be) executed
  metadata?: {
    [key: string]: any;
  };
}

export interface ITransitionEvent {
  eventId: UUID; // Unique identifier for the transition event
  type: 'PROTOCOL_UPGRADE' | 'DATA_MIGRATION' | 'STATE_SNAPSHOT' | 'NETWORK_FORK';
  timestamp: Timestamp;
  initiatorId: UUID; // Reference to ISovereignIdentity or ProtocolEntity that initiated
  details: {
    proposalId?: UUID; // If related to an upgrade proposal
    fromVersion?: ProtocolVersion;
    toVersion?: ProtocolVersion;
    [key: string]: any; // Event-specific details
  };
  status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ROLLBACK';
  logHash?: Hash; // Hash of the transition log or audit trail
}

export interface IMigrationPlan {
  id: UUID; // Unique identifier for the migration plan
  name: string;
  description: string;
  targetProtocolVersion: ProtocolVersion;
  creationTimestamp: Timestamp;
  authorId: UUID; // Reference to ISovereignIdentity who authored the plan
  steps: {
    stepId: number;
    description: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    executionLog?: string; // Log output for this specific step
    estimatedDurationMs?: number;
    actualDurationMs?: number;
    [key: string]: any; // Step-specific parameters
  }[];
  overallStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SUCCESS';
  metadata?: {
    [key: string]: any;
  };
}