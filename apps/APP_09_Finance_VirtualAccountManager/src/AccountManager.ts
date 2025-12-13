import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { 
    Logger, 
    EventBus, 
    MetricCollector, 
    AuditLogger, 
    SecureContext,
    ValidationError,
    SystemError
} from '@ecosystem/core-sdk';
import { 
    AIProviderRegistry, 
    ModelInferenceRequest, 
    ModelInferenceResponse 
} from '@ecosystem/ai-gateway';

// -----------------------------------------------------------------------------
// Domain Types & Interfaces
// -----------------------------------------------------------------------------

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'SGD' | 'USDC';

export enum AccountStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    CLOSED = 'CLOSED',
    PENDING_KYC = 'PENDING_KYC'
}

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',
    FEE = 'FEE',
    INTEREST = 'INTEREST'
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    CLEARED = 'CLEARED',
    FAILED = 'FAILED',
    FLAGGED_FOR_REVIEW = 'FLAGGED_FOR_REVIEW'
}

export interface VirtualAccount {
    id: string;
    tenantId: string;
    name: string;
    currency: CurrencyCode;
    balance: bigint; // Stored in minor units (cents)
    reservedBalance: bigint;
    status: AccountStatus;
    metadata: Record<string, any>;
    jurisdiction: string;
    createdAt: Date;
    updatedAt: Date;
    riskScore: number; // 0-100, calculated by AI
    tags: string[];
}

export interface LedgerEntry {
    id: string;
    transactionId: string;
    accountId: string;
    direction: 'DEBIT' | 'CREDIT';
    amount: bigint;
    balanceAfter: bigint;
    timestamp: Date;
}

export interface TransactionRequest {
    tenantId: string;
    sourceAccountId?: string;
    destinationAccountId?: string;
    amount: bigint;
    currency: CurrencyCode;
    type: TransactionType;
    description: string;
    metadata?: Record<string, any>;
    forceOverrideRisk?: boolean;
}

export interface TransactionResult {
    transactionId: string;
    status: TransactionStatus;
    riskAnalysis?: RiskAnalysisResult;
    timestamp: Date;
}

export interface RiskAnalysisResult {
    score: number;
    flags: string[];
    approved: boolean;
    providerUsed: string;
    reasoning: string;
}

export interface BankingProviderAdapter {
    syncBalance(externalAccountId: string): Promise<bigint>;
    initiateTransfer(source: string, dest: string, amount: bigint): Promise<string>;
}

// -----------------------------------------------------------------------------
// Configuration & Metadata
// -----------------------------------------------------------------------------

const AGENT_METADATA = {
    purpose: "Enterprise-grade management of virtual accounts with AI-driven risk analysis and ledger consistency.",
    dependencies: ["@ecosystem/core-sdk", "@ecosystem/ai-gateway", "DatabaseService"],
    invalidation_conditions: ["Ledger corruption detected", "Unauthorized currency minting"],
    adjacent_apps: ["APP_37_Governance_AuditTrailEngine", "APP_01_Inference_CostRouter"]
};

// -----------------------------------------------------------------------------
// Core Logic: AccountManager
// -----------------------------------------------------------------------------

export class AccountManager {
    private readonly logger: Logger;
    private readonly eventBus: EventBus;
    private readonly metrics: MetricCollector;
    private readonly audit: AuditLogger;
    private readonly aiRegistry: AIProviderRegistry;
    private readonly bankingAdapter: BankingProviderAdapter;
    
    // In-memory simulation of a database for this file's scope. 
    // In production, this would be a Repository pattern interface.
    private accounts: Map<string, VirtualAccount> = new Map();
    private ledger: LedgerEntry[] = [];
    private transactions: Map<string, any> = new Map();

    // Mutex for account locking (simple in-memory implementation)
    private accountLocks: Set<string> = new Set();

    constructor(
        logger: Logger,
        eventBus: EventBus,
        metrics: MetricCollector,
        audit: AuditLogger,
        aiRegistry: AIProviderRegistry,
        bankingAdapter: BankingProviderAdapter
    ) {
        this.logger = logger.child({ component: 'AccountManager' });
        this.eventBus = eventBus;
        this.metrics = metrics;
        this.audit = audit;
        this.aiRegistry = aiRegistry;
        this.bankingAdapter = bankingAdapter;

        this.initializeSubscribers();
    }

    private initializeSubscribers() {
        this.eventBus.subscribe('SYS_CONFIG_UPDATE', this.handleConfigUpdate.bind(this));
        this.eventBus.subscribe('SEC_THREAT_DETECTED', this.handleSecurityThreat.bind(this));
    }

    /**
     * Creates a new virtual account with initial AI-based KYC risk assessment.
     */
    public async createAccount(
        ctx: SecureContext, 
        params: Omit<VirtualAccount, 'id' | 'balance' | 'reservedBalance' | 'createdAt' | 'updatedAt' | 'status' | 'riskScore'>
    ): Promise<VirtualAccount> {
        const traceId = uuidv4();
        this.logger.info({ traceId, tenant: params.tenantId }, 'Initiating account creation');

        // 1. Validate Jurisdiction
        if (!this.isJurisdictionSupported(params.jurisdiction)) {
            throw new ValidationError(`Jurisdiction ${params.jurisdiction} is not supported.`);
        }

        // 2. AI Risk Assessment (KYC/AML check on metadata)
        const riskAssessment = await this.assessAccountRisk(params.metadata, params.name);
        
        if (!riskAssessment.approved) {
            this.audit.log(ctx, 'ACCOUNT_CREATION_REJECTED', { reason: riskAssessment.reasoning });
            throw new SystemError(`Account creation rejected by AI Risk Engine: ${riskAssessment.reasoning}`);
        }

        // 3. Construct Account
        const newAccount: VirtualAccount = {
            id: uuidv4(),
            tenantId: params.tenantId,
            name: params.name,
            currency: params.currency,
            balance: BigInt(0),
            reservedBalance: BigInt(0),
            status: AccountStatus.ACTIVE,
            metadata: params.metadata,
            jurisdiction: params.jurisdiction,
            tags: params.tags,
            riskScore: riskAssessment.score,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 4. Persist
        this.accounts.set(newAccount.id, newAccount);

        // 5. Emit Events
        await this.eventBus.publish('FIN_ACCOUNT_CREATED', {
            accountId: newAccount.id,
            tenantId: newAccount.tenantId,
            currency: newAccount.currency
        });

        this.metrics.increment('account_created_total', { currency: newAccount.currency });
        
        return newAccount;
    }

    /**
     * Processes a transaction with double-entry ledger consistency and AI fraud detection.
     */
    public async processTransaction(ctx: SecureContext, request: TransactionRequest): Promise<TransactionResult> {
        const txId = uuidv4();
        const startTime = Date.now();

        try {
            // 1. Acquire Locks
            await this.acquireLocks([request.sourceAccountId, request.destinationAccountId]);

            // 2. Validate Accounts
            const source = request.sourceAccountId ? this.accounts.get(request.sourceAccountId) : null;
            const dest = request.destinationAccountId ? this.accounts.get(request.destinationAccountId) : null;

            this.validateTransactionContext(source, dest, request);

            // 3. AI Fraud Detection (Pre-flight)
            let riskResult: RiskAnalysisResult | undefined;
            if (!request.forceOverrideRisk) {
                riskResult = await this.detectFraud(request, source, dest);
                if (!riskResult.approved) {
                    this.audit.log(ctx, 'TRANSACTION_BLOCKED_FRAUD', { txId, riskResult });
                    return {
                        transactionId: txId,
                        status: TransactionStatus.FLAGGED_FOR_REVIEW,
                        riskAnalysis: riskResult,
                        timestamp: new Date()
                    };
                }
            }

            // 4. Execute Ledger Updates (Atomic Simulation)
            const timestamp = new Date();
            
            if (source) {
                source.balance -= request.amount;
                source.updatedAt = timestamp;
                this.recordLedgerEntry(txId, source.id, 'DEBIT', request.amount, source.balance, timestamp);
            }

            if (dest) {
                dest.balance += request.amount;
                dest.updatedAt = timestamp;
                this.recordLedgerEntry(txId, dest.id, 'CREDIT', request.amount, dest.balance, timestamp);
            }

            // 5. Persist Transaction Record
            const transactionRecord = {
                id: txId,
                ...request,
                status: TransactionStatus.CLEARED,
                timestamp,
                riskScore: riskResult?.score ?? 0
            };
            this.transactions.set(txId, transactionRecord);

            // 6. Emit Events
            await this.eventBus.publish('FIN_TRANSACTION_COMPLETED', {
                transactionId: txId,
                amount: request.amount.toString(),
                currency: request.currency
            });

            this.metrics.recordLatency('transaction_processing_ms', Date.now() - startTime);

            return {
                transactionId: txId,
                status: TransactionStatus.CLEARED,
                riskAnalysis: riskResult,
                timestamp
            };

        } catch (error) {
            this.logger.error({ error, txId }, 'Transaction failed');
            this.metrics.increment('transaction_failed_total');
            throw error;
        } finally {
            this.releaseLocks([request.sourceAccountId, request.destinationAccountId]);
        }
    }

    /**
     * Uses LLMs to generate a narrative explanation of account activity.
     */
    public async generateAccountNarrative(ctx: SecureContext, accountId: string): Promise<string> {
        const account = this.accounts.get(accountId);
        if (!account) throw new ValidationError('Account not found');

        // Fetch recent ledger entries
        const entries = this.ledger.filter(l => l.accountId === accountId).slice(-50);
        
        // Construct prompt for AI
        const prompt = `
            Analyze the following financial ledger for account ${account.name} (${account.currency}).
            Current Balance: ${account.balance.toString()} (minor units).
            
            Recent Transactions:
            ${entries.map(e => `- ${e.timestamp.toISOString()}: ${e.direction} ${e.amount}`).join('\n')}
            
            Provide a concise executive summary of spending patterns, anomalies, and cash flow health.
            Do not provide financial advice. Focus on observational data.
        `;

        const aiResponse = await this.aiRegistry.infer('narrative-model-v1', {
            prompt,
            maxTokens: 500,
            temperature: 0.2
        });

        return aiResponse.text;
    }

    /**
     * Introspection endpoint for the ecosystem agent.
     */
    public introspect(): any {
        return {
            agent_metadata: AGENT_METADATA,
            stats: {
                active_accounts: this.accounts.size,
                ledger_depth: this.ledger.length,
                locked_accounts: this.accountLocks.size
            },
            config: {
                supported_currencies: ['USD', 'EUR', 'GBP', 'USDC'],
                risk_threshold: 0.85
            }
        };
    }

    // -----------------------------------------------------------------------------
    // Internal Helpers
    // -----------------------------------------------------------------------------

    private async assessAccountRisk(metadata: any, name: string): Promise<RiskAnalysisResult> {
        // Simulate AI call to check against sanctions lists or negative news
        try {
            const response = await this.aiRegistry.infer('compliance-check-v2', {
                prompt: `Evaluate risk for entity: ${name}. Metadata: ${JSON.stringify(metadata)}`,
                temperature: 0
            });
            
            // Mock parsing logic
            const score = response.metadata?.riskScore || 10;
            return {
                score,
                flags: score > 50 ? ['HIGH_RISK_ENTITY'] : [],
                approved: score < 80,
                providerUsed: response.provider,
                reasoning: response.text
            };
        } catch (e) {
            this.logger.warn('AI Risk Assessment failed, defaulting to manual review');
            return {
                score: 100,
                flags: ['AI_SERVICE_FAILURE'],
                approved: false,
                providerUsed: 'NONE',
                reasoning: 'AI Service unavailable'
            };
        }
    }

    private async detectFraud(req: TransactionRequest, source: VirtualAccount | null, dest: VirtualAccount | null): Promise<RiskAnalysisResult> {
        // Heuristic checks first
        if (req.amount > BigInt(100000000)) { // > 1M units
            return {
                score: 90,
                flags: ['LARGE_AMOUNT'],
                approved: false,
                providerUsed: 'HEURISTIC',
                reasoning: 'Transaction exceeds automatic approval limit'
            };
        }

        // AI Check for pattern anomalies
        const prompt = `
            Analyze transaction for fraud:
            Source: ${source?.id || 'EXTERNAL'}
            Dest: ${dest?.id || 'EXTERNAL'}
            Amount: ${req.amount}
            Desc: ${req.description}
            
            Is this suspicious based on typical B2B SaaS patterns?
            Reply JSON: { "suspicious": boolean, "reason": string }
        `;

        try {
            const aiRes = await this.aiRegistry.infer('fraud-detection-v4', { prompt, jsonMode: true });
            const analysis = JSON.parse(aiRes.text);
            
            return {
                score: analysis.suspicious ? 85 : 10,
                flags: analysis.suspicious ? ['AI_FLAGGED_ANOMALY'] : [],
                approved: !analysis.suspicious,
                providerUsed: aiRes.provider,
                reasoning: analysis.reason
            };
        } catch (e) {
            // Fail open or closed based on policy? Here we fail closed for safety.
            return {
                score: 100,
                flags: ['AI_ERROR'],
                approved: false,
                providerUsed: 'NONE',
                reasoning: 'Fraud detection service unreachable'
            };
        }
    }

    private validateTransactionContext(source: VirtualAccount | null, dest: VirtualAccount | null, req: TransactionRequest) {
        if (req.type === TransactionType.INTERNAL_TRANSFER) {
            if (!source || !dest) throw new ValidationError('Internal transfers require both source and destination accounts.');
            if (source.currency !== dest.currency) throw new ValidationError('Cross-currency internal transfers not supported in this version.');
        }

        if (source) {
            if (source.status !== AccountStatus.ACTIVE) throw new ValidationError(`Source account ${source.id} is not active.`);
            if (source.balance < req.amount) throw new ValidationError(`Insufficient funds in account ${source.id}.`);
        }

        if (dest) {
            if (dest.status !== AccountStatus.ACTIVE) throw new ValidationError(`Destination account ${dest.id} is not active.`);
        }
    }

    private recordLedgerEntry(txId: string, accountId: string, direction: 'DEBIT' | 'CREDIT', amount: bigint, balanceAfter: bigint, timestamp: Date) {
        const entry: LedgerEntry = {
            id: uuidv4(),
            transactionId: txId,
            accountId,
            direction,
            amount,
            balanceAfter,
            timestamp
        };
        this.ledger.push(entry);
    }

    private async acquireLocks(accountIds: (string | undefined)[]) {
        const ids = accountIds.filter((id): id is string => !!id).sort(); // Sort to prevent deadlocks
        
        for (const id of ids) {
            let retries = 0;
            while (this.accountLocks.has(id)) {
                if (retries > 10) throw new SystemError(`Could not acquire lock for account ${id}`);
                await new Promise(resolve => setTimeout(resolve, 50));
                retries++;
            }
            this.accountLocks.add(id);
        }
    }

    private releaseLocks(accountIds: (string | undefined)[]) {
        accountIds.forEach(id => {
            if (id) this.accountLocks.delete(id);
        });
    }

    private isJurisdictionSupported(jurisdiction: string): boolean {
        const supported = ['US', 'EU', 'GB', 'SG', 'JP'];
        return supported.includes(jurisdiction);
    }

    private handleConfigUpdate(payload: any) {
        this.logger.info('Configuration updated', payload);
        // Logic to update risk thresholds or supported currencies dynamically
    }

    private handleSecurityThreat(payload: any) {
        this.logger.warn('Security threat detected, freezing high-risk accounts', payload);
        // Logic to auto-suspend accounts based on threat intelligence
    }
}