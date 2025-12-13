import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * APP_25_Workflow_HumanInLoop
 * ApprovalQueue.ts
 * 
 * Core logic for managing human-in-the-loop review queues.
 * Acts as a circuit breaker for low-confidence AI actions.
 * 
 * Integrations:
 * - OpenAI / Anthropic (Confidence Normalization)
 * - Slack / Email (Notification Formatting)
 * - Event Bus (Audit Trail)
 */

// --- Shared Ecosystem Types (Mocked for standalone validity) ---

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'meta' | 'azure' | 'custom';

export interface AIContext {
    provider: AIProvider;
    model: string;
    promptHash: string;
    traceId: string;
    metadata: Record<string, any>;
    rawOutput?: any; // The raw completion object from the vendor
}

export interface ProposedAction {
    type: string;
    payload: any;
    targetSystem: string;
    idempotencyKey: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'EXPIRED';

export interface ReviewHistoryEntry {
    timestamp: Date;
    actorId: string;
    action: 'COMMENT' | 'APPROVE' | 'REJECT' | 'ESCALATE' | 'EXPIRE';
    reason?: string;
    metadata?: any;
}

export interface QueueItem {
    id: string;
    createdAt: Date;
    expiresAt: Date;
    status: ApprovalStatus;
    confidenceScore: number; // Normalized 0-1
    requiredConfidence: number;
    context: AIContext;
    action: ProposedAction;
    reviewers: string[]; // User IDs or Group IDs
    history: ReviewHistoryEntry[];
    tags: string[];
    priority: number;
}

export interface NotificationConfig {
    channels: ('slack' | 'email' | 'webhook')[];
    slackChannelId?: string;
    emailRecipients?: string[];
    webhookUrl?: string;
    escalationTimeoutMinutes?: number;
}

// --- Interfaces for Dependency Injection ---

export interface INotificationAdapter {
    sendSlack(channelId: string, message: any): Promise<void>;
    sendEmail(recipients: string[], subject: string, body: string): Promise<void>;
    sendWebhook(url: string, payload: any): Promise<void>;
}

export interface IPersistenceAdapter {
    save(item: QueueItem): Promise<void>;
    get(id: string): Promise<QueueItem | null>;
    update(item: QueueItem): Promise<void>;
    query(filters: Partial<QueueItem>): Promise<QueueItem[]>;
    delete(id: string): Promise<void>;
}

export interface IEventBus {
    publish(topic: string, payload: any): Promise<void>;
}

export interface ILogger {
    info(msg: string, meta?: any): void;
    warn(msg: string, meta?: any): void;
    error(msg: string, meta?: any): void;
    debug(msg: string, meta?: any): void;
}

// --- Core Implementation ---

export class ApprovalQueue extends EventEmitter {
    private persistence: IPersistenceAdapter;
    private notifier: INotificationAdapter;
    private eventBus: IEventBus;
    private logger: ILogger;

    // Configuration Constants
    private readonly DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
    private readonly AUTO_REJECT_THRESHOLD = 0.25;
    private readonly CRITICAL_RISK_REQUIREMENT = 0.98;

    constructor(
        persistence: IPersistenceAdapter,
        notifier: INotificationAdapter,
        eventBus: IEventBus,
        logger: ILogger
    ) {
        super();
        this.persistence = persistence;
        this.notifier = notifier;
        this.eventBus = eventBus;
        this.logger = logger;
    }

    /**
     * Main Entry Point: Ingests a proposed action from an AI agent.
     * Evaluates confidence and risk to determine if human review is needed.
     */
    public async enqueueAction(
        context: AIContext,
        action: ProposedAction,
        rawConfidence: number,
        policyConfig: {
            minConfidence?: number;
            requiredReviewers?: string[];
            notificationConfig?: NotificationConfig;
            autoApproveLowRisk?: boolean;
        } = {}
    ): Promise<QueueItem> {
        const normalizedConfidence = this.normalizeConfidence(context.provider, rawConfidence, context.rawOutput);
        const id = uuidv4();
        const now = new Date();

        // Determine Thresholds
        let requiredConfidence = policyConfig.minConfidence || 0.85;
        if (action.riskLevel === 'critical') {
            requiredConfidence = Math.max(requiredConfidence, this.CRITICAL_RISK_REQUIREMENT);
        }

        // Initial Status Determination
        let status: ApprovalStatus = 'PENDING';
        let autoDecisionReason = '';

        if (normalizedConfidence < this.AUTO_REJECT_THRESHOLD) {
            status = 'REJECTED';
            autoDecisionReason = `Confidence (${normalizedConfidence.toFixed(2)}) below auto-reject threshold (${this.AUTO_REJECT_THRESHOLD})`;
        } else if (normalizedConfidence >= requiredConfidence) {
            status = 'APPROVED';
            autoDecisionReason = `Confidence (${normalizedConfidence.toFixed(2)}) met requirement (${requiredConfidence})`;
        } else if (action.riskLevel === 'low' && policyConfig.autoApproveLowRisk) {
            status = 'APPROVED';
            autoDecisionReason = 'Auto-approved low risk action';
        }

        const item: QueueItem = {
            id,
            createdAt: now,
            expiresAt: new Date(now.getTime() + this.DEFAULT_EXPIRY_MS),
            status,
            confidenceScore: normalizedConfidence,
            requiredConfidence,
            context,
            action,
            reviewers: policyConfig.requiredReviewers || ['group:admins'],
            history: [],
            tags: [context.provider, action.type, action.riskLevel],
            priority: action.riskLevel === 'critical' ? 1 : action.riskLevel === 'high' ? 2 : 3
        };

        if (status !== 'PENDING') {
            item.history.push({
                timestamp: now,
                actorId: 'system:policy_engine',
                action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
                reason: autoDecisionReason
            });
        }

        await this.persistence.save(item);

        // Emit Lifecycle Event
        await this.eventBus.publish('approval.queued', {
            itemId: item.id,
            status: item.status,
            provider: context.provider,
            risk: action.riskLevel
        });

        // Handle Notifications for Pending Items
        if (status === 'PENDING' && policyConfig.notificationConfig) {
            await this.dispatchNotifications(item, policyConfig.notificationConfig);
        }

        // If auto-approved, trigger execution immediately via event bus
        if (status === 'APPROVED') {
            await this.triggerDownstreamExecution(item, 'system:policy_engine');
        }

        return item;
    }

    /**
     * Processes a human decision on a queue item.
     */
    public async processReview(
        itemId: string,
        reviewerId: string,
        decision: 'APPROVE' | 'REJECT' | 'ESCALATE',
        reason?: string
    ): Promise<QueueItem> {
        const item = await this.persistence.get(itemId);
        if (!item) {
            throw new Error(`Queue item ${itemId} not found`);
        }

        if (item.status !== 'PENDING' && item.status !== 'ESCALATED') {
            throw new Error(`Item ${itemId} is already ${item.status}. Cannot re-review.`);
        }

        const previousStatus = item.status;
        
        // State Transition
        switch (decision) {
            case 'APPROVE':
                item.status = 'APPROVED';
                break;
            case 'REJECT':
                item.status = 'REJECTED';
                break;
            case 'ESCALATE':
                item.status = 'ESCALATED';
                // Logic to add senior reviewers could go here
                break;
        }

        item.history.push({
            timestamp: new Date(),
            actorId: reviewerId,
            action: decision,
            reason
        });

        await this.persistence.update(item);

        this.logger.info(`[ApprovalQueue] Decision ${decision} on ${itemId} by ${reviewerId}`);

        await this.eventBus.publish('approval.decision', {
            itemId: item.id,
            decision,
            reviewerId,
            latencyMs: new Date().getTime() - item.createdAt.getTime()
        });

        if (item.status === 'APPROVED') {
            await this.triggerDownstreamExecution(item, reviewerId);
        }

        return item;
    }

    /**
     * Normalizes confidence scores from various vendors to a 0-1 float.
     */
    private normalizeConfidence(provider: AIProvider, rawScore: number, rawOutput?: any): number {
        try {
            switch (provider) {
                case 'openai':
                    // OpenAI often provides logprobs. If rawScore is negative, assume logprob.
                    // If it's 0-1, assume it's already normalized or a custom metric.
                    if (rawScore < 0) return Math.exp(rawScore);
                    return Math.min(Math.max(rawScore, 0), 1);
                
                case 'anthropic':
                    // Anthropic doesn't always give a confidence score directly in API, 
                    // but if provided via custom evaluation, assume 0-1.
                    return Math.min(Math.max(rawScore, 0), 1);

                case 'google':
                    // Vertex AI safety scores are often 0-1.
                    return rawScore;

                default:
                    return Math.min(Math.max(rawScore, 0), 1);
            }
        } catch (e) {
            this.logger.warn(`Error normalizing confidence for ${provider}`, e);
            return 0.5; // Fail safe to middle
        }
    }

    /**
     * Dispatches notifications to configured channels.
     */
    private async dispatchNotifications(item: QueueItem, config: NotificationConfig): Promise<void> {
        const promises: Promise<void>[] = [];

        if (config.channels.includes('slack') && config.slackChannelId) {
            const slackPayload = this.formatSlackPayload(item);
            promises.push(this.notifier.sendSlack(config.slackChannelId, slackPayload));
        }

        if (config.channels.includes('email') && config.emailRecipients) {
            const subject = `[Action Required] Review AI Action: ${item.action.type}`;
            const body = `
                Action ID: ${item.id}
                Confidence: ${(item.confidenceScore * 100).toFixed(1)}%
                Risk: ${item.action.riskLevel}
                
                Proposed Payload:
                ${JSON.stringify(item.action.payload, null, 2)}
                
                Please review in the dashboard.
            `;
            promises.push(this.notifier.sendEmail(config.emailRecipients, subject, body));
        }

        if (config.channels.includes('webhook') && config.webhookUrl) {
            promises.push(this.notifier.sendWebhook(config.webhookUrl, item));
        }

        await Promise.allSettled(promises);
    }

    private formatSlackPayload(item: QueueItem): any {
        const color = item.action.riskLevel === 'critical' ? '#ff0000' : '#ffcc00';
        return {
            attachments: [{
                color: color,
                blocks: [
                    {
                        type: "header",
                        text: { type: "plain_text", text: "🤖 AI Action Review Required" }
                    },
                    {
                        type: "section",
                        fields: [
                            { type: "mrkdwn", text: `*Type:* ${item.action.type}` },
                            { type: "mrkdwn", text: `*Risk:* ${item.action.riskLevel.toUpperCase()}` },
                            { type: "mrkdwn", text: `*Confidence:* ${(item.confidenceScore * 100).toFixed(1)}%` },
                            { type: "mrkdwn", text: `*Provider:* ${item.context.provider}` }
                        ]
                    },
                    {
                        type: "section",
                        text: { type: "mrkdwn", text: `*Payload Snippet:*\n\`\`\`${JSON.stringify(item.action.payload).slice(0, 200)}...\`\`\`` }
                    },
                    {
                        type: "actions",
                        elements: [
                            { type: "button", text: { type: "plain_text", text: "Approve" }, style: "primary", value: `approve:${item.id}` },
                            { type: "button", text: { type: "plain_text", text: "Reject" }, style: "danger", value: `reject:${item.id}` },
                            { type: "button", text: { type: "plain_text", text: "View Details" }, url: `https://dashboard.internal/review/${item.id}` }
                        ]
                    }
                ]
            }]
        };
    }

    private async triggerDownstreamExecution(item: QueueItem, approverId: string): Promise<void> {
        await this.eventBus.publish('workflow.execute_action', {
            action: item.action,
            context: item.context,
            approvalMetadata: {
                approverId,
                approvedAt: new Date(),
                queueItemId: item.id
            }
        });
    }

    // --- Maintenance ---

    public async pruneExpiredItems(): Promise<void> {
        const pending = await this.persistence.query({ status: 'PENDING' });
        const now = new Date();
        
        for (const item of pending) {
            if (item.expiresAt < now) {
                item.status = 'EXPIRED';
                item.history.push({
                    timestamp: now,
                    actorId: 'system:ttl_worker',
                    action: 'EXPIRE',
                    reason: 'Review window timed out'
                });
                await this.persistence.update(item);
                await this.eventBus.publish('approval.expired', { itemId: item.id });
            }
        }
    }

    // --- Self-Querying / Introspection ---

    public introspect() {
        return {
            component: "ApprovalQueue",
            version: "1.0.0",
            stats: {
                defaultExpiryMs: this.DEFAULT_EXPIRY_MS,
                autoRejectThreshold: this.AUTO_REJECT_THRESHOLD,
                criticalRiskRequirement: this.CRITICAL_RISK_REQUIREMENT
            },
            capabilities: [
                "multi-provider-confidence-normalization",
                "slack-interactive-messages",
                "audit-trail-enforcement"
            ]
        };
    }

    public getAssumptions() {
        return [
            "Persistence layer guarantees strong consistency for status updates.",
            "EventBus delivery is at-least-once.",
            "Reviewer IDs provided in config map to valid identities in Auth system."
        ];
    }

    public getFailureModes() {
        return [
            "NotificationAdapter failure may leave items in PENDING without reviewer awareness.",
            "High throughput of low-confidence items may saturate persistence storage.",
            "Race condition if multiple reviewers act on the same item simultaneously (mitigated by status check)."
        ];
    }

    public getUpdateTriggers() {
        return [
            "New AI provider integration requiring custom confidence normalization.",
            "Changes to corporate risk policy thresholds.",
            "Migration of notification provider (e.g., Slack to Teams)."
        ];
    }

    public getAgentMetadata() {
        return {
            purpose: "Manages queues for human review of low-confidence AI actions.",
            dependencies: ["@ecosystem/core", "PersistenceAdapter", "NotificationAdapter"],
            invalidation_conditions: ["Schema migration of QueueItem", "Change in AI provider confidence scales"],
            adjacent_apps: ["APP_14_Agents_MultiModelOrchestrator", "APP_37_Governance_AuditTrailEngine"]
        };
    }
}