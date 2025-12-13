/*
 * Copyright (c) 2024 Aetheris, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
    CoreSDK,
    Logger,
    Config,
    Database,
    ServiceAuthenticator,
    EventBus,
} from '@aetheris/core';
import {
    Transaction,
    WithdrawalRequest,
    AIAnalysisResult,
    ConsensusPolicy,
} from '@aetheris/ontology';

// --- Local Service Imports ---
// In a real project structure, these would be in separate files.
// For this generation, they are included as simplified classes below.
// import { AIProviderAdapter, AIProviderFactory } from './services/ai_adapter';
// import { ConsensusEngine } from './services/consensus_engine';
// import { PolicyService } from './services/policy_service';
// import { WithdrawalService } from './services/withdrawal_service';
// import { CustodyConnector } from './services/custody_connector';

// --- Constants and Configuration ---
const APP_NAME = 'APP_65_Fintech_CryptoCustodyGuard';
const PORT = Config.get('PORT', 8065);
const app = express();
app.use(express.json());

// --- Core Service Initialization ---
const logger: Logger = CoreSDK.getLogger(APP_NAME);
const db: Database = CoreSDK.getDatabase();
const auth: ServiceAuthenticator = CoreSDK.getServiceAuthenticator();
const eventBus: EventBus = CoreSDK.getEventBus();

// --- Simplified Service Implementations (for single-file generation) ---

/**
 * @interface AIProviderAdapter
 * @description Defines the contract for an AI provider that can analyze transactions.
 */
interface AIProviderAdapter {
    analyzeTransaction(tx: Transaction, policy: ConsensusPolicy): Promise<AIAnalysisResult>;
}

/**
 * @class SimpleAIProviderFactory
 * @description A factory for creating AI provider adapters. This demonstrates the adapter pattern
 *              to avoid vendor lock-in. It integrates with OpenAI and Anthropic.
 */
class SimpleAIProviderFactory {
    static getProvider(providerName: 'OpenAI' | 'Anthropic' | string): AIProviderAdapter {
        const apiKey = Config.get(`${providerName.toUpperCase()}_API_KEY`);
        if (!apiKey) {
            logger.error(`API key for ${providerName} is not configured.`);
            throw new Error(`Configuration error: ${providerName} API key not found.`);
        }

        // This is a mock implementation. A real implementation would use the respective SDKs.
        return {
            analyzeTransaction: async (tx: Transaction, policy: ConsensusPolicy): Promise<AIAnalysisResult> => {
                logger.info(`[${providerName}] Analyzing transaction ${tx.id} against policy ${policy.id}`);
                
                // Simulate network latency for the AI API call
                await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 800));
                
                // Simulate a more complex risk analysis
                let riskScore = Math.random();
                if (tx.amount > (policy.velocityLimits?.amount ?? 1000000)) riskScore += 0.3;
                if (policy.denylist?.includes((tx.destination as any).address)) riskScore = 1.0;
                riskScore = Math.min(riskScore, 1.0);

                const isCompliant = riskScore < (policy.riskThreshold ?? 0.8);
                const decision = isCompliant ? 'APPROVE' : 'REJECT';
                
                let rationale = `[${providerName}] Analysis complete. `;
                rationale += `Transaction risk score is ${riskScore.toFixed(3)}. `;
                rationale += `Policy threshold is ${policy.riskThreshold}. `;
                rationale += `Decision: ${decision}.`;

                return {
                    provider: providerName,
                    decision,
                    riskScore,
                    rationale,
                    metadata: { 
                        timestamp: new Date().toISOString(),
                        modelUsed: providerName === 'OpenAI' ? 'gpt-4-turbo' : 'claude-3-opus',
                    }
                };
            }
        };
    }
}

/**
 * @class SimplePolicyService
 * @description Manages retrieval of consensus policies for transactions.
 */
class SimplePolicyService {
    constructor(private db: Database) {}
    async getPolicyForAsset(assetId: string): Promise<ConsensusPolicy> {
        logger.info(`Fetching policy for asset ${assetId}`);
        // In a real system, this would be a sophisticated DB query based on asset,
        // value, destination risk, etc. Here we return a default high-security policy.
        return {
            id: `policy-default-high-sec-${assetId}`,
            assetId: assetId,
            aiConsensus: {
                requiredApprovals: 2,
                providers: ['OpenAI', 'Anthropic'],
            },
            humanConsensus: {
                requiredApprovals: 1,
            },
            riskThreshold: 0.75,
            velocityLimits: {
                amount: 10000, // USD value equivalent
                periodSeconds: 86400,
            },
            allowlist: [],
            denylist: ['0xDEADBEEF...'], // Example denylisted address
        };
    }
}

/**
 * @class SimpleCustodyConnector
 * @description Interface to the underlying custody system.
 */
class SimpleCustodyConnector {
    async getTransactionDetails(txId: string): Promise<Transaction> {
        // Simulate fetching from a core custody service or database
        return {
            id: txId,
            asset: { id: 'ETH', name: 'Ethereum', type: 'CRYPTO' },
            amount: 10.5,
            source: { type: 'INTERNAL_VAULT', id: 'hot-wallet-01' },
            destination: { type: 'EXTERNAL_ADDRESS', address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B' },
            createdAt: new Date(),
            status: 'PENDING_APPROVAL',
        };
    }

    async broadcastTransaction(txId: string): Promise<{ success: boolean; txHash?: string }> {
        logger.info(`Broadcasting transaction ${txId} to the network.`);
        // Simulate interaction with a blockchain node or HSM
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { success: true, txHash: `0x${uuidv4().replace(/-/g, '')}` };
    }
}

/**
 * @class SimpleWithdrawalService
 * @description Manages the lifecycle and state of withdrawal requests.
 */
class SimpleWithdrawalService {
    // Using an in-memory store for this simplified example. A real app uses the DB.
    private requests: Map<string, WithdrawalRequest> = new Map();

    constructor(private db: Database) {}

    async createRequest(tx: Transaction, policy: ConsensusPolicy): Promise<WithdrawalRequest> {
        const request: WithdrawalRequest = {
            id: uuidv4(),
            transactionId: tx.id,
            status: 'AI_CONSENSUS_PENDING',
            policySnapshot: policy,
            aiAnalysisResults: [],
            humanSignatures: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        logger.info(`Created new withdrawal request ${request.id} for transaction ${tx.id}`);
        this.requests.set(request.id, request);
        // await this.db.table('withdrawal_requests').insert(request);
        return request;
    }

    async updateRequest(request: WithdrawalRequest): Promise<WithdrawalRequest> {
        request.updatedAt = new Date();
        logger.info(`Updating withdrawal request ${request.id} to status ${request.status}`);
        this.requests.set(request.id, request);
        // await this.db.table('withdrawal_requests').where({ id: request.id }).update(request);
        return request;
    }

    async getRequest(id: string): Promise<WithdrawalRequest | null> {
        logger.info(`Fetching withdrawal request ${id}`);
        const request = this.requests.get(id);
        return request || null;
        // return await this.db.table('withdrawal_requests').where({ id }).first();
    }
}

/**
 * @class SimpleConsensusEngine
 * @description The core logic orchestrator for the withdrawal approval process.
 */
class SimpleConsensusEngine {
    constructor(
        private withdrawalService: SimpleWithdrawalService,
        private custodyConnector: SimpleCustodyConnector,
        private eventBus: EventBus
    ) {}

    async processWithdrawal(request: WithdrawalRequest): Promise<void> {
        logger.info(`Starting AI consensus process for withdrawal ${request.id}`);
        
        const policy = request.policySnapshot;
        const providers = policy.aiConsensus.providers;
        const txDetails = await this.custodyConnector.getTransactionDetails(request.transactionId);

        const analysisPromises = providers.map(p => {
            const provider = SimpleAIProviderFactory.getProvider(p);
            return provider.analyzeTransaction(txDetails, policy);
        });

        const results = await Promise.all(analysisPromises);
        request.aiAnalysisResults = results;

        const approvals = results.filter(r => r.decision === 'APPROVE').length;
        
        await this.eventBus.publish('aetheris.fintech.cryptocustodyguard.ai_analysis.completed', {
            payload: { requestId: request.id, results, approvals, required: policy.aiConsensus.requiredApprovals }
        });

        if (approvals >= policy.aiConsensus.requiredApprovals) {
            logger.info(`AI consensus achieved for withdrawal ${request.id}`);
            request.status = 'HUMAN_SIGNATURE_PENDING';
            await this.withdrawalService.updateRequest(request);
            await this.eventBus.publish('aetheris.fintech.cryptocustodyguard.human_signature.required', {
                payload: { requestId: request.id, transactionId: request.transactionId, requiredSignatures: policy.humanConsensus.requiredApprovals }
            });
        } else {
            logger.warn(`AI consensus failed for withdrawal ${request.id}. Rejecting.`);
            request.status = 'REJECTED_AI';
            await this.withdrawalService.updateRequest(request);
            await this.eventBus.publish('aetheris.fintech.cryptocustodyguard.withdrawal.rejected', {
                payload: { requestId: request.id, reason: 'AI consensus not met.', analysisResults: results }
            });
        }
    }
}

// --- Initialize Application-Specific Services ---
const policyService = new SimplePolicyService(db);
const custodyConnector = new SimpleCustodyConnector();
const withdrawalService = new SimpleWithdrawalService(db);
const consensusEngine = new SimpleConsensusEngine(withdrawalService, custodyConnector, eventBus);

// --- API Routes ---
const router = express.Router();
router.use(auth.requireAuth);

router.post('/v1/withdrawals/request', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { transactionId } = req.body;
        if (!transactionId || typeof transactionId !== 'string') {
            return res.status(400).json({ error: 'A valid transactionId is required.' });
        }

        const transaction = await custodyConnector.getTransactionDetails(transactionId);
        const policy = await policyService.getPolicyForAsset(transaction.asset.id);
        const withdrawalRequest = await withdrawalService.createRequest(transaction, policy);

        // Asynchronously start the consensus process without blocking the API response
        consensusEngine.processWithdrawal(withdrawalRequest).catch(err => {
            logger.error(`Unhandled error in background consensus process for ${withdrawalRequest.id}:`, err);
            withdrawalRequest.status = 'FAILED_INTERNAL';
            withdrawalService.updateRequest(withdrawalRequest);
        });

        await eventBus.publish('aetheris.fintech.cryptocustodyguard.withdrawal.requested', {
            source: APP_NAME,
            payload: { requestId: withdrawalRequest.id, transactionId: transaction.id, policyId: policy.id }
        });

        res.status(202).json(withdrawalRequest);
    } catch (error) {
        next(error);
    }
});

router.get('/v1/withdrawals/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const request = await withdrawalService.getRequest(id);
        if (!request) {
            return res.status(404).json({ error: 'Withdrawal request not found.' });
        }
        res.status(200).json(request);
    } catch (error) {
        next(error);
    }
});

app.use('/', router);

// --- Self-Querying Agent Endpoints ---
const agentMetadata = {
    agent_metadata: {
        purpose: "Orchestrates a multi-signature consensus process for digital asset withdrawals, requiring approval from multiple AI models before proceeding to human signers. This acts as an intelligent guard against fraudulent or non-compliant transactions.",
        dependencies: [
            "CoreSDK.Database: For storing withdrawal request state and policies.",
            "CoreSDK.EventBus: For emitting events about withdrawal status changes.",
            "CoreSDK.Auth: For securing API endpoints.",
            "Ontology.Transaction: Uses the shared definition of a transaction.",
            "Ontology.ConsensusPolicy: Uses the shared definition for security policies.",
            "AI_Vendor.OpenAI: Used as one of the AI auditors for transaction analysis.",
            "AI_Vendor.Anthropic: Used as a secondary AI auditor, often for policy compliance checks.",
            "APP_XX_Custody_Core: Relies on a core custody service to provide transaction details and execute signed transactions."
        ],
        invalidation_conditions: [
            "A major change in the CoreSDK's Database or EventBus interface.",
            "Deprecation of APIs from integrated AI vendors (OpenAI, Anthropic).",
            "Significant changes to the blockchain protocols of supported assets that invalidate the transaction signing logic in the core custody service.",
            "Discovery of a systemic vulnerability in the AI models' ability to detect a new class of fraud."
        ],
        adjacent_apps: [
            "APP_XX_Custody_Core: The upstream service that creates and executes transactions.",
            "APP_YY_Notifications_MultiChannel: Consumes events from this app to notify human signers.",
            "APP_37_Governance_AuditTrailEngine: Consumes events to build a comprehensive audit log of all withdrawal decisions.",
            "APP_58_Narrative_ModelExplainabilityUI: Could be used to visualize the rationale from AI approvers for a given withdrawal request."
        ]
    }
};

app.get('/introspect', (req: Request, res: Response) => {
    res.status(200).json({
        appName: APP_NAME,
        description: "Provides AI-driven multi-signature consensus for crypto asset withdrawals.",
        architecture: {
            tension: "Speed vs. Safety. Every withdrawal is intentionally slowed by a multi-stage, multi-agent verification process to maximize security against unauthorized fund movement. The system's configuration allows tuning this balance.",
            components: [
                { name: "API Layer", description: "Express.js server exposing endpoints for withdrawal requests and status checks." },
                { name: "Withdrawal Service", description: "Manages the state of each withdrawal request in the database." },
                { name: "Policy Service", description: "Retrieves the specific consensus policy for a given transaction (asset, amount, etc.)." },
                { name: "AI Adapter", description: "Abstracts interactions with different AI providers (e.g., OpenAI, Anthropic)." },
                { name: "Consensus Engine", description: "Orchestrates the workflow: triggers AI analyses, evaluates results against policy, and manages the transition to human approval." },
                { name: "Custody Connector", description: "Interfaces with the core custody system to fetch transaction data and broadcast approved transactions." },
            ],
            dataFlow: "Request -> Fetch TX & Policy -> Create Withdrawal State -> Fan-out to AI Models -> Collect & Evaluate Responses -> If AI Pass, Notify Human Signers -> If Humans Sign, Broadcast TX -> Update State & Emit Events"
        },
        ...agentMetadata
    });
});

app.get('/assumptions', (req: Request, res: Response) => {
    res.status(200).json({
        technical_assumptions: [
            "The CoreSDK services (DB, EventBus, Auth) are available and reliable.",
            "The underlying core custody service provides accurate, immutable transaction data.",
            "Network access to AI vendor APIs is available and has acceptable latency.",
            "The database is persistent and provides transactional integrity for state updates.",
            "Human signers are reachable via notifications triggered by events on the bus."
        ],
        business_assumptions: [
            "The cost of AI analysis per transaction is less than the value protected by preventing a single fraudulent transaction.",
            "Customers are willing to accept a delay in withdrawal processing in exchange for significantly enhanced security.",
            "AI models can be prompted to provide meaningful, reliable analysis of transaction risk.",
            "A clear audit trail of AI and human decisions is sufficient for regulatory compliance."
        ]
    });
});

app.get('/failure-modes', (req: Request, res: Response) => {
    res.status(200).json({
        modes: [
            {
                mode: "AI Consensus Failure (False Positive)",
                description: "All AI models incorrectly flag a legitimate transaction as fraudulent, blocking the withdrawal.",
                mitigation: "Manual override process for high-authority administrators. Logging and monitoring of AI rejection rates to trigger model/prompt tuning.",
            },
            {
                mode: "AI Consensus Failure (False Negative)",
                description: "All AI models fail to detect a fraudulent transaction, passing it to human signers who may also be compromised or negligent.",
                mitigation: "This is the primary risk. Mitigation includes: using a diverse set of AI models, defense-in-depth with human signers, strict velocity limits in policies, and denylists for known malicious addresses.",
            },
            {
                mode: "AI Provider Outage",
                description: "One or more required AI provider APIs are down, stalling all withdrawal requests.",
                mitigation: "Implement fallback logic in the Consensus Engine. If a primary provider is down, the policy could allow proceeding with fewer AI approvals or using a backup provider. Circuit breakers on API calls.",
            },
            {
                mode: "Database Failure",
                description: "The service's database goes down, losing the state of in-progress withdrawals.",
                mitigation: "Standard database high-availability and backup/restore procedures managed by the CoreSDK's infrastructure layer.",
            },
            {
                mode: "Replay Attack",
                description: "An attacker resubmits a previously approved transactionId to drain funds.",
                mitigation: "The Withdrawal Service must ensure that a transactionId can only be processed once. The database schema should have a unique constraint on `transactionId`."
            }
        ]
    });
});

app.get('/update-triggers', (req: Request, res: Response) => {
    res.status(200).json({
        triggers: [
            {
                event: "New AI provider integrated into the ecosystem",
                action: "Update the AIProviderFactory to include the new provider. Policies can then be updated to use it.",
            },
            {
                event: "Change in Ontology.Transaction schema",
                action: "Update data mapping and analysis prompts to accommodate new transaction fields.",
            },
            {
                event: "New compliance regulation introduced",
                action: "Update or create new ConsensusPolicy definitions. Prompts for AI models may need to be updated to check for compliance with the new regulation.",
            },
            {
                event: "CoreSDK major version bump",
                action: "Requires a full dependency review and potential refactoring of service initializations and interactions.",
            }
        ]
    });
});

// --- Error Handling and Server Startup ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Unhandled error on ${req.method} ${req.path}:`, err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : 'Omitted in production',
    });
});

const startServer = async () => {
    try {
        await CoreSDK.initialize();
        logger.info('CoreSDK initialized successfully.');

        app.listen(PORT, () => {
            logger.info(`${APP_NAME} is running on port ${PORT}`);
            eventBus.publish('aetheris.platform.service.started', {
                source: APP_NAME,
                payload: { name: APP_NAME, port: PORT, timestamp: new Date().toISOString() }
            });
        });
    } catch (error) {
        logger.fatal('Failed to start server:', error);
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export default app;