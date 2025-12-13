// =================================================================================
// Legal Disclaimer and License
// =================================================================================
//
// Copyright (c) 2024, Ecosystem AI. All rights reserved.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// =================================================================================
// File: SwarmHive.ts
// Purpose: Core logic for managing swarms of specialized agents.
// APP_ID: APP_44_Agents_SwarmController
// =================================================================================

import { v4 as uuidv4 } from 'uuid';
import {
    CoreSDK,
    Logger,
    EventBus,
    AuthService,
    IModelAdapter,
    ModelProvider,
    ModelCapability,
    BillingService,
    UsageRecord,
    EcosystemEvent,
} from '@ecosystem/core-sdk';

// =================================================================================
// Type Definitions and Interfaces
// =================================================================================

export type AgentID = string;
export type SwarmID = string;
export type TaskID = string;

export enum SwarmState {
    PENDING = 'PENDING',
    DECOMPOSING = 'DECOMPOSING',
    RUNNING = 'RUNNING',
    SYNTHESIZING = 'SYNTHESIZING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    TERMINATED = 'TERMINATED',
}

export enum AgentState {
    IDLE = 'IDLE',
    WORKING = 'WORKING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    STALLED = 'STALLED',
}

export interface SubTask {
    id: TaskID;
    description: string;
    dependencies: TaskID[];
    context: Record<string, any>;
    assignedAgentId?: AgentID;
}

export interface AgentResult {
    agentId: AgentID;
    subTaskId: TaskID;
    output: any;
    cost: UsageRecord;
    executionTimeMs: number;
    isFinal: boolean;
}

export interface AgentConfig {
    provider: ModelProvider;
    model: string;
    capabilities: ModelCapability[];
    promptTemplate: string;
    maxRetries: number;
    timeoutMs: number;
    initializationContext?: Record<string, any>;
}

export interface SwarmResourceLimits {
    maxConcurrentAgents: number;
    maxTotalAgents: number;
    maxTokensPerSwarm: number;
    maxExecutionTimeSeconds: number;
}

export interface SwarmConfig {
    problemStatement: string;
    agentConfig: AgentConfig;
    decompositionStrategy: ITaskDecomposer;
    synthesisStrategy: IResultSynthesizer;
    resourceLimits: SwarmResourceLimits;
    // Tension: Speed vs. Safety. failFast terminates the swarm on the first agent failure.
    failFast: boolean;
    // Tension: Openness vs. Control. Defines if agents can spawn other agents.
    allowRecursiveSpawn: boolean;
}

export interface HiveConfig {
    maxConcurrentSwarms: number;
    defaultAgentConfig: AgentConfig;
    defaultResourceLimits: SwarmResourceLimits;
    housekeepingIntervalMs: number;
}

export interface SwarmStatus {
    id: SwarmID;
    state: SwarmState;
    startTime: Date;
    endTime?: Date;
    progress: number; // 0.0 to 1.0
    agentStats: {
        total: number;
        active: number;
        completed: number;
        failed: number;
    };
    resourceUsage: {
        tokens: number;
        elapsedSeconds: number;
    };
    finalResult?: any;
    error?: string;
}

export interface ITaskDecomposer {
    decompose(problem: string, context?: Record<string, any>): Promise<SubTask[]>;
}

export interface IResultSynthesizer {
    synthesize(results: AgentResult[], originalProblem: string): Promise<any>;
}

// =================================================================================
// Core Agent Class
// =================================================================================

class Agent {
    public readonly id: AgentID;
    public state: AgentState = AgentState.IDLE;
    private modelAdapter: IModelAdapter;
    private startTime?: number;

    constructor(
        public readonly swarmId: SwarmID,
        private subTask: SubTask,
        private config: AgentConfig,
        private coreSDK: CoreSDK,
        private eventBus: EventBus,
    ) {
        this.id = uuidv4();
        this.subTask.assignedAgentId = this.id;
        this.modelAdapter = this.coreSDK.getModelAdapter(this.config.provider, {
            model: this.config.model,
            capabilities: this.config.capabilities,
        });
    }

    public async execute(): Promise<void> {
        if (this.state !== AgentState.IDLE) {
            this.coreSDK.logger.warn(`Agent ${this.id} already in state ${this.state}, cannot execute.`);
            return;
        }

        this.state = AgentState.WORKING;
        this.startTime = Date.now();
        this.publishStateChange();

        let retries = 0;
        while (retries <= this.config.maxRetries) {
            try {
                const prompt = this.constructPrompt();
                const { output, usage } = await this.modelAdapter.generate({
                    prompt,
                    max_tokens: 2048, // Example, should be configurable
                    temperature: 0.7, // Example
                });

                const result: AgentResult = {
                    agentId: this.id,
                    subTaskId: this.subTask.id,
                    output: this.parseOutput(output),
                    cost: usage,
                    executionTimeMs: Date.now() - this.startTime,
                    isFinal: true,
                };

                this.state = AgentState.COMPLETED;
                this.publishResult(result);
                this.publishStateChange();
                return;

            } catch (error: any) {
                this.coreSDK.logger.error(`Agent ${this.id} failed on attempt ${retries + 1}`, { error: error.message });
                retries++;
                if (retries > this.config.maxRetries) {
                    this.state = AgentState.FAILED;
                    this.publishError(error);
                    this.publishStateChange();
                    return;
                }
                // Optional: exponential backoff
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }
        }
    }

    private constructPrompt(): string {
        // More sophisticated prompt engineering would happen here
        return this.config.promptTemplate
            .replace('{problem}', this.subTask.description)
            .replace('{context}', JSON.stringify(this.subTask.context, null, 2));
    }

    private parseOutput(rawOutput: string): any {
        // Attempt to parse JSON, fallback to raw string
        try {
            return JSON.parse(rawOutput);
        } catch {
            return rawOutput;
        }
    }

    private publish(payload: any, eventType: string) {
        const event: EcosystemEvent = {
            id: uuidv4(),
            source: `APP_44_Agents_SwarmController/Agent/${this.id}`,
            type: `agent.${eventType}`,
            timestamp: new Date().toISOString(),
            data: payload,
            metadata: {
                swarmId: this.swarmId,
                subTaskId: this.subTask.id,
            }
        };
        this.eventBus.publish(`swarm.${this.swarmId}`, event);
    }

    private publishResult(result: AgentResult) {
        this.publish(result, 'result');
    }

    private publishError(error: Error) {
        this.publish({ message: error.message, stack: error.stack }, 'error');
    }

    private publishStateChange() {
        this.publish({ state: this.state }, 'state.change');
    }
}

// =================================================================================
// Core Swarm Class
// =================================================================================

class Swarm {
    public readonly id: SwarmID;
    public state: SwarmState = SwarmState.PENDING;
    public readonly startTime: Date;
    public endTime?: Date;

    private agents: Map<AgentID, Agent> = new Map();
    private subTasks: Map<TaskID, SubTask> = new Map();
    private completedTasks: Set<TaskID> = new Set();
    private agentResults: AgentResult[] = [];
    private totalTokens: number = 0;
    private timeoutHandle?: NodeJS.Timeout;

    constructor(
        public readonly config: SwarmConfig,
        private coreSDK: CoreSDK,
        private eventBus: EventBus,
    ) {
        this.id = uuidv4();
        this.startTime = new Date();
    }

    public async start(): Promise<any> {
        this.coreSDK.logger.info(`Starting swarm ${this.id} for problem: "${this.config.problemStatement.substring(0, 50)}..."`);
        this.state = SwarmState.DECOMPOSING;
        this.publishStatus();

        this.timeoutHandle = setTimeout(() => {
            this.failSwarm(`Swarm timed out after ${this.config.resourceLimits.maxExecutionTimeSeconds} seconds.`);
        }, this.config.resourceLimits.maxExecutionTimeSeconds * 1000);

        try {
            const tasks = await this.config.decompositionStrategy.decompose(this.config.problemStatement);
            if (!tasks || tasks.length === 0) {
                throw new Error("Task decomposition yielded no sub-tasks.");
            }
            tasks.forEach(task => this.subTasks.set(task.id, task));

            this.state = SwarmState.RUNNING;
            this.publishStatus();

            this.eventBus.subscribe(`swarm.${this.id}`, this.handleAgentMessage.bind(this));
            this.scheduleTasks();

            return new Promise((resolve, reject) => {
                this.eventBus.once(`swarm.${this.id}.completed`, (event) => resolve(event.data.result));
                this.eventBus.once(`swarm.${this.id}.failed`, (event) => reject(new Error(event.data.error)));
            });

        } catch (error: any) {
            await this.failSwarm(error.message);
            throw error;
        }
    }

    public terminate(reason: string): void {
        if (this.state === SwarmState.COMPLETED || this.state === SwarmState.FAILED || this.state === SwarmState.TERMINATED) {
            return;
        }
        this.coreSDK.logger.warn(`Terminating swarm ${this.id}. Reason: ${reason}`);
        this.state = SwarmState.TERMINATED;
        if (this.timeoutHandle) clearTimeout(this.timeoutHandle);
        this.eventBus.unsubscribe(`swarm.${this.id}`, this.handleAgentMessage.bind(this));
        // In a real implementation, we'd need to signal agents to stop.
        this.publishStatus();
    }

    public getStatus(): SwarmStatus {
        const agentStats = { total: 0, active: 0, completed: 0, failed: 0 };
        this.agents.forEach(agent => {
            agentStats.total++;
            if (agent.state === AgentState.WORKING) agentStats.active++;
            if (agent.state === AgentState.COMPLETED) agentStats.completed++;
            if (agent.state === AgentState.FAILED) agentStats.failed++;
        });

        return {
            id: this.id,
            state: this.state,
            startTime: this.startTime,
            endTime: this.endTime,
            progress: this.subTasks.size > 0 ? this.completedTasks.size / this.subTasks.size : 0,
            agentStats,
            resourceUsage: {
                tokens: this.totalTokens,
                elapsedSeconds: ( (this.endTime?.getTime() || Date.now()) - this.startTime.getTime() ) / 1000,
            },
            finalResult: this.state === SwarmState.COMPLETED ? this.agentResults[this.agentResults.length - 1] : undefined,
            error: this.state === SwarmState.FAILED ? 'See logs for details' : undefined,
        };
    }

    private async handleAgentMessage(event: EcosystemEvent): Promise<void> {
        const { type, data, metadata } = event;
        if (!metadata || metadata.swarmId !== this.id) return;

        switch (type) {
            case 'agent.result':
                this.handleAgentResult(data as AgentResult);
                break;
            case 'agent.error':
                this.handleAgentError(metadata.agentId, data);
                break;
            case 'agent.state.change':
                // Could be used for more granular progress tracking
                break;
        }
    }

    private handleAgentResult(result: AgentResult) {
        this.coreSDK.logger.info(`Swarm ${this.id} received result from agent ${result.agentId} for task ${result.subTaskId}`);
        this.agentResults.push(result);
        this.completedTasks.add(result.subTaskId);
        this.totalTokens += result.cost.total_tokens;

        // Check for resource limit breach
        if (this.totalTokens > this.config.resourceLimits.maxTokensPerSwarm) {
            this.failSwarm(`Exceeded token limit of ${this.config.resourceLimits.maxTokensPerSwarm}.`);
            return;
        }

        if (this.completedTasks.size === this.subTasks.size) {
            this.synthesizeResults();
        } else {
            this.scheduleTasks(); // Schedule next wave of tasks
        }
        this.publishStatus();
    }

    private handleAgentError(agentId: AgentID, errorData: any) {
        this.coreSDK.logger.error(`Swarm ${this.id} received error from agent ${agentId}`, { error: errorData.message });
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.state = AgentState.FAILED;
        }

        if (this.config.failFast) {
            this.failSwarm(`Agent ${agentId} failed: ${errorData.message}`);
        } else {
            // Implement retry logic for the sub-task if needed, or just mark as failed and continue
            const failedTask = Array.from(this.subTasks.values()).find(t => t.assignedAgentId === agentId);
            if (failedTask) {
                this.completedTasks.add(failedTask.id); // Consider it "completed" to not block the swarm
            }
            if (this.completedTasks.size === this.subTasks.size) {
                this.synthesizeResults();
            }
        }
        this.publishStatus();
    }

    private scheduleTasks() {
        const activeAgents = Array.from(this.agents.values()).filter(a => a.state === AgentState.WORKING).length;
        const availableSlots = this.config.resourceLimits.maxConcurrentAgents - activeAgents;

        if (availableSlots <= 0) return;

        const schedulableTasks = Array.from(this.subTasks.values()).filter(task =>
            !task.assignedAgentId &&
            task.dependencies.every(depId => this.completedTasks.has(depId))
        );

        for (let i = 0; i < Math.min(availableSlots, schedulableTasks.length); i++) {
            const task = schedulableTasks[i];
            this.spawnAgent(task);
        }
    }

    private spawnAgent(subTask: SubTask) {
        if (this.agents.size >= this.config.resourceLimits.maxTotalAgents) {
            this.coreSDK.logger.warn(`Swarm ${this.id} reached max total agent limit of ${this.config.resourceLimits.maxTotalAgents}.`);
            return;
        }

        const agent = new Agent(this.id, subTask, this.config.agentConfig, this.coreSDK, this.eventBus);
        this.agents.set(agent.id, agent);
        this.coreSDK.logger.info(`Spawning agent ${agent.id} for task ${subTask.id}`);
        agent.execute(); // Fire and forget, results handled by event bus
    }

    private async synthesizeResults() {
        this.state = SwarmState.SYNTHESIZING;
        this.publishStatus();
        this.coreSDK.logger.info(`Swarm ${this.id} synthesizing results from ${this.agentResults.length} agents.`);

        try {
            const finalResult = await this.config.synthesisStrategy.synthesize(this.agentResults, this.config.problemStatement);
            this.state = SwarmState.COMPLETED;
            this.endTime = new Date();
            if (this.timeoutHandle) clearTimeout(this.timeoutHandle);

            const event: EcosystemEvent = {
                id: uuidv4(),
                source: `APP_44_Agents_SwarmController/Swarm/${this.id}`,
                type: `swarm.completed`,
                timestamp: new Date().toISOString(),
                data: { result: finalResult, status: this.getStatus() }
            };
            this.eventBus.publish(`swarm.${this.id}.completed`, event);
            this.publishStatus();

        } catch (error: any) {
            this.failSwarm(`Result synthesis failed: ${error.message}`);
        }
    }

    private async failSwarm(errorMessage: string) {
        if (this.state === SwarmState.FAILED || this.state === SwarmState.TERMINATED) return;

        this.coreSDK.logger.error(`Swarm ${this.id} failed: ${errorMessage}`);
        this.state = SwarmState.FAILED;
        this.endTime = new Date();
        if (this.timeoutHandle) clearTimeout(this.timeoutHandle);

        const event: EcosystemEvent = {
            id: uuidv4(),
            source: `APP_44_Agents_SwarmController/Swarm/${this.id}`,
            type: `swarm.failed`,
            timestamp: new Date().toISOString(),
            data: { error: errorMessage, status: this.getStatus() }
        };
        this.eventBus.publish(`swarm.${this.id}.failed`, event);
        this.publishStatus();
    }

    private publishStatus() {
        const status = this.getStatus();
        const event: EcosystemEvent = {
            id: uuidv4(),
            source: `APP_44_Agents_SwarmController/Swarm/${this.id}`,
            type: `swarm.status.update`,
            timestamp: new Date().toISOString(),
            data: status
        };
        this.eventBus.publish('swarm.events', event);
    }
}

// =================================================================================
// Main SwarmHive Controller Class
// =================================================================================

export class SwarmHive {
    private activeSwarms: Map<SwarmID, Swarm> = new Map();
    private housekeepingInterval?: NodeJS.Timeout;

    constructor(
        private config: HiveConfig,
        private coreSDK: CoreSDK,
        private eventBus: EventBus,
        private authService: AuthService,
        private billingService: BillingService,
    ) {
        this.coreSDK.logger.info("SwarmHive Controller initialized.");
        this.startHousekeeping();
    }

    /**
     * Creates and starts a new swarm to solve a complex problem.
     * @param config - The configuration for the new swarm.
     * @param authToken - The authentication token for the user/service initiating the swarm.
     * @returns A promise that resolves with the initial status of the created swarm.
     */
    public async createSwarm(config: SwarmConfig, authToken: string): Promise<SwarmStatus> {
        await this.authService.verify(authToken, ['swarm:create']);

        if (this.activeSwarms.size >= this.config.maxConcurrentSwarms) {
            throw new Error("Maximum number of concurrent swarms reached.");
        }

        const mergedConfig: SwarmConfig = {
            ...config,
            agentConfig: { ...this.config.defaultAgentConfig, ...config.agentConfig },
            resourceLimits: { ...this.config.defaultResourceLimits, ...config.resourceLimits },
        };

        const swarm = new Swarm(mergedConfig, this.coreSDK, this.eventBus);
        this.activeSwarms.set(swarm.id, swarm);

        // Don't await start() here, as it's a long-running process.
        // The caller gets an immediate response with the swarm ID and can listen for events.
        swarm.start().catch(err => {
            this.coreSDK.logger.error(`Swarm ${swarm.id} failed during initialization.`, { error: err.message });
            // The swarm itself will publish a failure event.
        });

        const initialStatus = swarm.getStatus();
        this.coreSDK.logger.info(`Swarm ${swarm.id} created.`, { initialStatus });
        return initialStatus;
    }

    /**
     * Retrieves the current status of a specific swarm.
     * @param swarmId - The ID of the swarm to query.
     * @param authToken - The authentication token.
     * @returns The status of the swarm, or null if not found.
     */
    public async getSwarmStatus(swarmId: SwarmID, authToken: string): Promise<SwarmStatus | null> {
        await this.authService.verify(authToken, ['swarm:read']);
        const swarm = this.activeSwarms.get(swarmId);
        return swarm ? swarm.getStatus() : null;
    }

    /**
     * Lists the statuses of all currently active swarms.
     * @param authToken - The authentication token.
     * @returns An array of swarm statuses.
     */
    public async listActiveSwarms(authToken: string): Promise<SwarmStatus[]> {
        await this.authService.verify(authToken, ['swarm:list']);
        return Array.from(this.activeSwarms.values()).map(s => s.getStatus());
    }

    /**
     * Manually terminates a running swarm.
     * @param swarmId - The ID of the swarm to terminate.
     * @param reason - The reason for termination.
     * @param authToken - The authentication token.
     * @returns A promise that resolves when the termination signal has been sent.
     */
    public async terminateSwarm(swarmId: SwarmID, reason: string, authToken: string): Promise<void> {
        await this.authService.verify(authToken, ['swarm:terminate']);
        const swarm = this.activeSwarms.get(swarmId);
        if (swarm) {
            swarm.terminate(reason);
        } else {
            throw new Error(`Swarm with ID ${swarmId} not found.`);
        }
    }

    /**
     * Shuts down the SwarmHive controller and all active swarms.
     */
    public shutdown(): void {
        this.coreSDK.logger.info("Shutting down SwarmHive Controller...");
        if (this.housekeepingInterval) {
            clearInterval(this.housekeepingInterval);
        }
        this.activeSwarms.forEach(swarm => swarm.terminate("Hive shutdown"));
        this.activeSwarms.clear();
    }

    private startHousekeeping(): void {
        this.housekeepingInterval = setInterval(() => {
            this.performHousekeeping();
        }, this.config.housekeepingIntervalMs);
    }

    private performHousekeeping(): void {
        this.coreSDK.logger.debug("Performing SwarmHive housekeeping...");
        const swarmsToCull: SwarmID[] = [];
        this.activeSwarms.forEach((swarm, id) => {
            const status = swarm.getStatus();
            if ([SwarmState.COMPLETED, SwarmState.FAILED, SwarmState.TERMINATED].includes(status.state)) {
                // In a real system, you might wait a grace period before culling
                // to allow final status queries.
                const finalUsage = status.resourceUsage;
                this.billingService.recordUsage({
                    service: 'APP_44_SwarmController',
                    unit: 'tokens',
                    quantity: finalUsage.tokens,
                    timestamp: new Date(),
                    metadata: { swarmId: id, finalState: status.state },
                });
                swarmsToCull.push(id);
            }
        });

        swarmsToCull.forEach(id => {
            this.coreSDK.logger.info(`Culling completed swarm ${id} from active list.`);
            this.activeSwarms.delete(id);
        });
    }
}

// =================================================================================
// Extensibility Hooks: Default Strategy Implementations
// =================================================================================

/**
 * A simple decomposer that splits a problem by newlines.
 * Tension: Openness vs. Control. This is a very simple, controllable decomposer.
 * A more open one might use an LLM to generate the decomposition plan, which is more powerful but less predictable.
 */
export class SimpleLineDecomposer implements ITaskDecomposer {
    async decompose(problem: string): Promise<SubTask[]> {
        return problem.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map((line, index) => ({
                id: `task-${index + 1}`,
                description: line,
                dependencies: [], // No dependencies in this simple model
                context: {},
            }));
    }
}

/**
 * A synthesizer that concatenates all agent outputs.
 * Tension: Scale vs. Explainability. Simple concatenation scales well but offers no
 * summarization or explanation of how the final result was derived. A more complex
 * synthesizer might use another LLM call to create a coherent summary, improving
 * explainability at the cost of more compute and potential hallucination.
 */
export class ConcatenationSynthesizer implements IResultSynthesizer {
    async synthesize(results: AgentResult[], originalProblem: string): Promise<any> {
        return results
            .sort((a, b) => a.subTaskId.localeCompare(b.subTaskId)) // Ensure consistent order
            .map(r => r.output)
            .join('\n\n---\n\n');
    }
}