/*
 * Copyright 2024 Unisonio SE
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *
 * ---
 *
 * This file is part of APP_08_Agents_SelfHealing.
 *
 * The HealthMonitor is a watchdog process responsible for ensuring the operational
 * integrity of other autonomous agents within the ecosystem. It embodies the
 * architectural tension between Autonomy and Control: agents are allowed to
 * operate independently, but the monitor enforces operational boundaries and
 * attempts automated recovery, escalating to human oversight only when necessary.
 * This balance is configurable through HealthPolicies, allowing for different
 * levels of intervention depending on the agent's criticality and operating environment.
 */

import {
    CoreSDK,
    Logger,
    EventBus,
    EcosystemEvent,
    ServiceDiscovery,
    Configuration,
    AuditLogger,
    FeatureFlagProvider,
} from '@ecosystem/core-sdk';
import {
    AgentId,
    AgentState,
    AgentStatus,
    AgentAction,
    Ontology,
} from '@ecosystem/shared-ontology';
import { IInferenceGateway, InferenceRequest, InferenceProvider } from '../interfaces/IInferenceGateway';
import { IAgentController, RestartOptions } from '../interfaces/IAgentController';

// --- Type Definitions ---

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export type FailureType =
    | 'CRASH'
    | 'TIMEOUT'
    | 'STATE_STAGNATION'
    | 'REPETITIVE_LOOP'
    | 'HALLUCINATION'
    | 'POLICY_VIOLATION'
    | 'RESOURCE_EXHAUSTION';

export interface HealthCheckResult {
    status: HealthStatus;
    failureType?: FailureType;
    details: Record<string, any>;
    timestamp: number;
}

export interface InterventionPlan {
    agentId: AgentId;
    failureType: FailureType;
    strategy: InterventionStrategy;
    params: any;
    attempt: number;
}

export interface HealthPolicy {
    id: string;
    // Defines the sequence of interventions for a given failure type.
    interventionSequences: {
        [key in FailureType]?: {
            strategy: InterventionStrategyType;
            params?: any;
        }[];
    };
    // Maximum number of automated recovery attempts before escalating.
    maxAttempts: number;
    // Time in seconds to wait before considering an agent's state as stagnant.
    stagnationThresholdSeconds: number;
    // Number of identical consecutive actions to be considered a repetitive loop.
    repetitionThreshold: number;
    // Configuration for hallucination checks.
    sanityCheckConfig?: {
        provider: InferenceProvider;
        model: string;
        promptTemplate: string; // e.g., "Is the following statement factually correct and relevant? {output}"
    };
}

// --- Interfaces for Extensibility ---

export interface IDetector {
    type: FailureType;
    detect(agentTracker: AgentStateTracker): Promise<HealthCheckResult>;
}

export interface IIntervention {
    type: InterventionStrategyType;
    execute(plan: InterventionPlan): Promise<boolean>;
}

export type InterventionStrategyType =
    | 'RESTART'
    | 'STATE_ROLLBACK'
    | 'CORRECTIVE_PROMPT'
    | 'MODEL_HOTSWAP'
    | 'ESCALATE';

// --- Agent State Tracking ---

/**
 * In-memory representation of a monitored agent's state and history.
 * In a production system, this would be backed by a persistent, time-series database.
 */
export class AgentStateTracker {
    public readonly agentId: AgentId;
    public currentState: AgentState;
    public status: AgentStatus = 'ACTIVE';
    public lastStateUpdate: number;
    public actionHistory: AgentAction[] = [];
    public healthHistory: HealthCheckResult[] = [];
    public interventionAttempts: { [key in FailureType]?: number } = {};

    constructor(agentId: AgentId, initialState: AgentState) {
        this.agentId = agentId;
        this.currentState = initialState;
        this.lastStateUpdate = Date.now();
    }

    updateState(newState: AgentState) {
        if (JSON.stringify(this.currentState) !== JSON.stringify(newState)) {
            this.currentState = newState;
            this.lastStateUpdate = Date.now();
        }
    }

    recordAction(action: AgentAction) {
        this.actionHistory.push(action);
        if (this.actionHistory.length > 100) { // Keep history bounded
            this.actionHistory.shift();
        }
    }

    recordHealthResult(result: HealthCheckResult) {
        this.healthHistory.push(result);
        if (this.healthHistory.length > 50) {
            this.healthHistory.shift();
        }
    }

    incrementInterventionAttempt(failureType: FailureType) {
        this.interventionAttempts[failureType] = (this.interventionAttempts[failureType] || 0) + 1;
    }

    resetInterventionAttempts(failureType: FailureType) {
        delete this.interventionAttempts[failureType];
    }
}

// --- Core Health Monitor ---

export class HealthMonitor {
    private logger: Logger;
    private eventBus: EventBus;
    private auditLogger: AuditLogger;
    private featureFlags: FeatureFlagProvider;
    private config: Configuration;
    private inferenceGateway: IInferenceGateway;
    private agentController: IAgentController;

    private monitoredAgents: Map<AgentId, { tracker: AgentStateTracker; policy: HealthPolicy }> = new Map();
    private detectors: IDetector[];
    private interventions: Map<InterventionStrategyType, IIntervention>;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    constructor(sdk: CoreSDK, inferenceGateway: IInferenceGateway, agentController: IAgentController) {
        this.logger = sdk.getLogger('HealthMonitor');
        this.eventBus = sdk.getEventBus();
        this.auditLogger = sdk.getAuditLogger();
        this.featureFlags = sdk.getFeatureFlagProvider();
        this.config = sdk.getConfiguration();
        this.inferenceGateway = inferenceGateway;
        this.agentController = agentController;

        this.detectors = this.initializeDetectors();
        this.interventions = this.initializeInterventions();
    }

    private initializeDetectors(): IDetector[] {
        // In a real system, these would be dynamically loaded plugins.
        return [
            new StagnationDetector(this),
            new RepetitiveLoopDetector(this),
            new HallucinationDetector(this, this.inferenceGateway),
        ];
    }

    private initializeInterventions(): Map<InterventionStrategyType, IIntervention> {
        const interventionMap = new Map<InterventionStrategyType, IIntervention>();
        interventionMap.set('RESTART', new RestartIntervention(this, this.agentController));
        interventionMap.set('CORRECTIVE_PROMPT', new CorrectivePromptIntervention(this, this.agentController));
        interventionMap.set('ESCALATE', new EscalationIntervention(this));
        // Other interventions like STATE_ROLLBACK would be added here.
        return interventionMap;
    }

    public async start(): Promise<void> {
        if (this.isRunning) {
            this.logger.warn('HealthMonitor is already running.');
            return;
        }
        this.logger.info('Starting HealthMonitor service...');
        await this.subscribeToAgentEvents();
        const intervalMs = this.config.get<number>('healthmonitor.interval_ms', 5000);
        this.monitoringInterval = setInterval(() => this.runHealthCheckCycle(), intervalMs);
        this.isRunning = true;
        this.logger.info(`HealthMonitor started. Checking agents every ${intervalMs}ms.`);
    }

    public async stop(): Promise<void> {
        if (!this.isRunning) {
            this.logger.warn('HealthMonitor is not running.');
            return;
        }
        this.logger.info('Stopping HealthMonitor service...');
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        // In a real implementation, we would unsubscribe from the event bus.
        this.isRunning = false;
        this.logger.info('HealthMonitor stopped.');
    }

    public registerAgent(agentId: AgentId, initialState: AgentState, policy: HealthPolicy): void {
        if (this.monitoredAgents.has(agentId)) {
            this.logger.warn(`Agent ${agentId} is already being monitored. Updating policy.`);
        } else {
            this.logger.info(`Registering agent ${agentId} for health monitoring.`);
        }
        const tracker = new AgentStateTracker(agentId, initialState);
        this.monitoredAgents.set(agentId, { tracker, policy });
    }

    public deregisterAgent(agentId: AgentId): void {
        if (this.monitoredAgents.has(agentId)) {
            this.logger.info(`Deregistering agent ${agentId} from health monitoring.`);
            this.monitoredAgents.delete(agentId);
        }
    }

    private async subscribeToAgentEvents(): Promise<void> {
        await this.eventBus.subscribe(Ontology.topics.agent.state_update, async (event: EcosystemEvent) => {
            const { agentId, state } = event.payload;
            const monitored = this.monitoredAgents.get(agentId);
            if (monitored) {
                monitored.tracker.updateState(state);
            }
        });

        await this.eventBus.subscribe(Ontology.topics.agent.action_taken, async (event: EcosystemEvent) => {
            const { agentId, action } = event.payload;
            const monitored = this.monitoredAgents.get(agentId);
            if (monitored) {
                monitored.tracker.recordAction(action);
            }
        });
    }

    private async runHealthCheckCycle(): Promise<void> {
        this.logger.debug(`Running health check cycle for ${this.monitoredAgents.size} agents.`);
        for (const [agentId, { tracker, policy }] of this.monitoredAgents.entries()) {
            let finalResult: HealthCheckResult = { status: 'HEALTHY', details: {}, timestamp: Date.now() };

            for (const detector of this.detectors) {
                const result = await detector.detect(tracker);
                if (result.status === 'UNHEALTHY') {
                    finalResult = result;
                    break; // First detected failure triggers intervention
                }
            }

            tracker.recordHealthResult(finalResult);

            if (finalResult.status === 'UNHEALTHY' && finalResult.failureType) {
                this.logger.warn(`Agent ${agentId} detected as UNHEALTHY. Reason: ${finalResult.failureType}`, finalResult.details);
                await this.triggerIntervention(tracker, policy, finalResult.failureType);
            } else if (tracker.healthHistory.at(-2)?.status === 'UNHEALTHY') {
                // Agent has recovered
                this.logger.info(`Agent ${agentId} has recovered and is now HEALTHY.`);
                Object.keys(tracker.interventionAttempts).forEach(key => {
                    tracker.resetInterventionAttempts(key as FailureType);
                });
                await this.eventBus.publish({
                    topic: Ontology.topics.agent.health_status,
                    payload: { agentId, status: 'HEALTHY', reason: 'RECOVERED' },
                });
            }
        }
    }

    private async triggerIntervention(tracker: AgentStateTracker, policy: HealthPolicy, failureType: FailureType): Promise<void> {
        tracker.incrementInterventionAttempt(failureType);
        const attempt = tracker.interventionAttempts[failureType] || 1;

        if (attempt > policy.maxAttempts) {
            this.logger.error(`Agent ${tracker.agentId} exceeded max recovery attempts for ${failureType}. Escalating.`);
            await this.executeIntervention({
                agentId: tracker.agentId,
                failureType,
                strategy: 'ESCALATE',
                params: { reason: `Exceeded max recovery attempts (${policy.maxAttempts}).` },
                attempt,
            });
            return;
        }

        const sequence = policy.interventionSequences[failureType];
        if (!sequence || sequence.length === 0) {
            this.logger.warn(`No intervention sequence defined for failure type ${failureType} for agent ${tracker.agentId}. Defaulting to ESCALATE.`);
            await this.executeIntervention({
                agentId: tracker.agentId,
                failureType,
                strategy: 'ESCALATE',
                params: { reason: `No intervention sequence defined for ${failureType}.` },
                attempt,
            });
            return;
        }

        // Simple strategy: use attempt number to index into sequence, looping if necessary
        const strategyConfig = sequence[(attempt - 1) % sequence.length];
        
        const plan: InterventionPlan = {
            agentId: tracker.agentId,
            failureType,
            strategy: strategyConfig.strategy,
            params: strategyConfig.params || {},
            attempt,
        };

        await this.executeIntervention(plan);
    }

    private async executeIntervention(plan: InterventionPlan): Promise<void> {
        const intervention = this.interventions.get(plan.strategy);
        if (!intervention) {
            this.logger.error(`Unknown intervention strategy: ${plan.strategy}. Cannot heal agent ${plan.agentId}.`);
            return;
        }

        this.logger.info(`Executing intervention plan for agent ${plan.agentId}:`, plan);
        await this.auditLogger.log({
            actor: { type: 'SYSTEM', id: 'HealthMonitor' },
            action: 'EXECUTE_INTERVENTION',
            target: { type: 'AGENT', id: plan.agentId },
            details: plan,
        });

        const success = await intervention.execute(plan);

        await this.eventBus.publish({
            topic: Ontology.topics.agent.healing_action,
            payload: { ...plan, success },
        });

        if (success) {
            this.logger.info(`Intervention ${plan.strategy} for agent ${plan.agentId} completed successfully.`);
        } else {
            this.logger.error(`Intervention ${plan.strategy} for agent ${plan.agentId} failed.`);
            // Optionally, trigger the next intervention in the sequence immediately or escalate.
        }
    }

    // Public getter for introspection
    public getMonitoredAgentTracker(agentId: AgentId): AgentStateTracker | undefined {
        return this.monitoredAgents.get(agentId)?.tracker;
    }
}

// --- Detector Implementations ---

class StagnationDetector implements IDetector {
    type: FailureType = 'STATE_STAGNATION';
    constructor(private monitor: HealthMonitor) {}

    async detect(tracker: AgentStateTracker): Promise<HealthCheckResult> {
        const policy = this.monitor['monitoredAgents'].get(tracker.agentId)?.policy;
        if (!policy) return { status: 'UNKNOWN', details: { reason: 'No policy found' }, timestamp: Date.now() };

        const secondsSinceUpdate = (Date.now() - tracker.lastStateUpdate) / 1000;
        if (secondsSinceUpdate > policy.stagnationThresholdSeconds) {
            return {
                status: 'UNHEALTHY',
                failureType: this.type,
                details: {
                    lastUpdate: new Date(tracker.lastStateUpdate).toISOString(),
                    secondsSinceUpdate,
                    threshold: policy.stagnationThresholdSeconds,
                },
                timestamp: Date.now(),
            };
        }
        return { status: 'HEALTHY', details: {}, timestamp: Date.now() };
    }
}

class RepetitiveLoopDetector implements IDetector {
    type: FailureType = 'REPETITIVE_LOOP';
    constructor(private monitor: HealthMonitor) {}

    async detect(tracker: AgentStateTracker): Promise<HealthCheckResult> {
        const policy = this.monitor['monitoredAgents'].get(tracker.agentId)?.policy;
        if (!policy || tracker.actionHistory.length < policy.repetitionThreshold) {
            return { status: 'HEALTHY', details: {}, timestamp: Date.now() };
        }

        const lastActions = tracker.actionHistory.slice(-policy.repetitionThreshold);
        const firstActionSignature = JSON.stringify(lastActions[0]);
        const isLooping = lastActions.every(action => JSON.stringify(action) === firstActionSignature);

        if (isLooping) {
            return {
                status: 'UNHEALTHY',
                failureType: this.type,
                details: {
                    repeatedAction: lastActions[0],
                    repetitionCount: policy.repetitionThreshold,
                },
                timestamp: Date.now(),
            };
        }
        return { status: 'HEALTHY', details: {}, timestamp: Date.now() };
    }
}

class HallucinationDetector implements IDetector {
    type: FailureType = 'HALLUCINATION';
    constructor(private monitor: HealthMonitor, private inferenceGateway: IInferenceGateway) {}

    async detect(tracker: AgentStateTracker): Promise<HealthCheckResult> {
        const policy = this.monitor['monitoredAgents'].get(tracker.agentId)?.policy;
        if (!policy?.sanityCheckConfig || tracker.actionHistory.length === 0) {
            return { status: 'HEALTHY', details: { reason: 'Sanity check not configured or no recent actions.' }, timestamp: Date.now() };
        }

        const lastAction = tracker.actionHistory.at(-1);
        if (!lastAction || !lastAction.output) {
            return { status: 'HEALTHY', details: {}, timestamp: Date.now() };
        }

        const { provider, model, promptTemplate } = policy.sanityCheckConfig;
        const prompt = promptTemplate.replace('{output}', JSON.stringify(lastAction.output));

        try {
            const request: InferenceRequest = {
                provider,
                model,
                prompt,
                params: { temperature: 0.1, max_tokens: 10 },
            };
            const response = await this.inferenceGateway.infer(request);
            const assessment = response.choices[0].text.trim().toLowerCase();

            // A simple check. A more robust system would use structured output or function calling.
            if (assessment.includes('incorrect') || assessment.includes('false') || assessment.includes('irrelevant')) {
                return {
                    status: 'UNHEALTHY',
                    failureType: this.type,
                    details: {
                        checkedOutput: lastAction.output,
                        assessmentModel: `${provider}/${model}`,
                        assessmentResult: assessment,
                    },
                    timestamp: Date.now(),
                };
            }
        } catch (error) {
            this.monitor['logger'].error(`Error during hallucination detection for agent ${tracker.agentId}`, error);
            return { status: 'DEGRADED', details: { reason: 'Sanity check model failed.' }, timestamp: Date.now() };
        }

        return { status: 'HEALTHY', details: {}, timestamp: Date.now() };
    }
}

// --- Intervention Implementations ---

class RestartIntervention implements IIntervention {
    type: InterventionStrategyType = 'RESTART';
    constructor(private monitor: HealthMonitor, private agentController: IAgentController) {}

    async execute(plan: InterventionPlan): Promise<boolean> {
        try {
            const options: RestartOptions = {
                reason: `Automated self-healing due to ${plan.failureType}`,
                ...(plan.params || {}),
            };
            await this.agentController.restartAgent(plan.agentId, options);
            return true;
        } catch (error) {
            this.monitor['logger'].error(`Failed to restart agent ${plan.agentId}`, error);
            return false;
        }
    }
}

class CorrectivePromptIntervention implements IIntervention {
    type: InterventionStrategyType = 'CORRECTIVE_PROMPT';
    constructor(private monitor: HealthMonitor, private agentController: IAgentController) {}

    async execute(plan: InterventionPlan): Promise<boolean> {
        try {
            const defaultPrompt = `System intervention: A potential issue of type '${plan.failureType}' was detected. Please review your last few actions, reassess your current goal, and formulate a new plan.`;
            const prompt = plan.params?.prompt || defaultPrompt;
            await this.agentController.injectContext(plan.agentId, prompt);
            return true;
        } catch (error) {
            this.monitor['logger'].error(`Failed to inject corrective prompt for agent ${plan.agentId}`, error);
            return false;
        }
    }
}

class EscalationIntervention implements IIntervention {
    type: InterventionStrategyType = 'ESCALATE';
    constructor(private monitor: HealthMonitor) {}

    async execute(plan: InterventionPlan): Promise<boolean> {
        this.monitor['logger'].fatal(`ESCALATION: Agent ${plan.agentId} requires human intervention.`, plan);
        await this.monitor['eventBus'].publish({
            topic: Ontology.topics.system.alert,
            payload: {
                severity: 'CRITICAL',
                source: 'HealthMonitor',
                message: `Agent ${plan.agentId} failed automated recovery and requires human intervention.`,
                details: plan,
            },
        });
        // This might also trigger a PagerDuty alert, create a Jira ticket, etc. via another service.
        return true;
    }
}