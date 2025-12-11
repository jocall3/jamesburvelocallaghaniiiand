```typescript
// src/services/AgentOrchestrator.ts

/**
 * @file AgentOrchestrator.ts
 * @description This file defines the central service for managing the lifecycle,
 * communication, and resource consumption of active AI agents. It acts as the
 * operating system for the AI workforce, ensuring that agents are spawned, monitored,
 * and terminated in a controlled and observable manner. This service is designed
 * as a singleton to provide a single source of truth for agent state across the
 * entire application.
 */

// ================================================================================================
// TYPE DEFINITIONS
// ================================================================================================

export type AgentID = string;

export enum AgentStatus {
    IDLE = 'IDLE',
    RUNNING = 'RUNNING',
    PAUSED = 'PAUSED',
    STOPPED = 'STOPPED',
    COMPLETED = 'COMPLETED',
    ERROR = 'ERROR',
}

export interface AgentConfig {
    name: string;
    description: string;
    systemPrompt: string;
    model: 'gemini-pro' | 'gemini-1.5-pro' | 'custom-model';
    tools: string[]; // e.g., ['send_money', 'get_transactions']
}

export interface AgentResourceUsage {
    cpu: number; // percentage
    memory: number; // in MB
    apiCalls: number;
    tokensUsed: number;
    activeSince: Date;
    totalUptime: number; // in seconds
}

export interface AgentTask {
    timestamp: Date;
    task: string;
    result: any;
    status: 'success' | 'failure';
}

export interface AgentInstance {
    id: AgentID;
    config: AgentConfig;
    status: AgentStatus;
    resources: AgentResourceUsage;
    taskHistory: AgentTask[];
    lastMessage?: string;
    // Internal timer for resource simulation
    _resourceIntervalId?: NodeJS.Timeout;
}

// Type for the subscriber callback, enabling reactive updates
type Subscriber = (agents: Map<AgentID, AgentInstance>) => void;

// ================================================================================================
// AGENT ORCHESTRATOR CLASS
// ================================================================================================

/**
 * @class AgentOrchestrator
 * @description A singleton service that manages the lifecycle, communication, and
 * resource consumption of all active AI agents. It acts as the central nervous
 * system for the AI Agent framework, providing a stable interface for the UI
 * and other services to interact with agents without needing to know the
 * underlying implementation details.
 */
class AgentOrchestrator {
    private static _instance: AgentOrchestrator;
    private activeAgents: Map<AgentID, AgentInstance> = new Map();
    private subscribers: Subscriber[] = [];

    private constructor() {
        console.log("Agent Orchestrator Initialized: The conductor is ready.");
        // In a real application, this could load persisted agent states from storage.
    }

    /**
     * Retrieves the singleton instance of the AgentOrchestrator.
     */
    public static getInstance(): AgentOrchestrator {
        if (!AgentOrchestrator._instance) {
            AgentOrchestrator._instance = new AgentOrchestrator();
        }
        return AgentOrchestrator._instance;
    }

    // --- Subscription System ---

    /**
     * Subscribes a listener to agent state changes.
     * @param callback - The function to call with the updated agent map.
     * @returns An unsubscribe function.
     */
    public subscribe(callback: Subscriber): () => void {
        this.subscribers.push(callback);
        // Immediately notify the new subscriber with the current state
        callback(new Map(this.activeAgents));
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }

    private notifySubscribers(): void {
        const agentsSnapshot = new Map(this.activeAgents);
        this.subscribers.forEach(callback => callback(agentsSnapshot));
    }

    // --- Core Lifecycle Methods ---

    /**
     * Creates, initializes, and starts a new AI agent.
     * @param config - The configuration for the new agent.
     * @returns A promise that resolves with the new agent's ID.
     */
    public async spawnAgent(config: AgentConfig): Promise<AgentID> {
        const id: AgentID = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        const newAgent: AgentInstance = {
            id,
            config,
            status: AgentStatus.IDLE,
            resources: {
                cpu: 0,
                memory: 0,
                apiCalls: 0,
                tokensUsed: 0,
                activeSince: new Date(),
                totalUptime: 0,
            },
            taskHistory: [],
            lastMessage: "Initializing..."
        };

        this.activeAgents.set(id, newAgent);
        console.log(`[Orchestrator] Agent ${id} (${config.name}) spawned.`);
        this.notifySubscribers();

        // Simulate startup and begin resource consumption simulation
        setTimeout(() => this.startAgentSimulation(id), 500);

        return id;
    }

    /**
     * Stops a running agent and clears its resource simulation.
     * @param agentId - The ID of the agent to stop.
     */
    public async stopAgent(agentId: AgentID): Promise<void> {
        const agent = this.activeAgents.get(agentId);
        if (!agent) {
            console.error(`[Orchestrator] Attempted to stop non-existent agent: ${agentId}`);
            return;
        }

        if (agent._resourceIntervalId) {
            clearInterval(agent._resourceIntervalId);
        }

        agent.status = AgentStatus.STOPPED;
        agent.lastMessage = `Terminated by user at ${new Date().toLocaleTimeString()}`;
        agent.resources.cpu = 0;
        agent.resources.memory = 0;
        console.log(`[Orchestrator] Agent ${agentId} stopped.`);
        this.notifySubscribers();
    }
    
    // --- Agent Interaction & State Management ---

    /**
     * Dispatches a task to a specific agent.
     * @param agentId - The ID of the agent to receive the task.
     * @param task - A string describing the task.
     * @returns A promise that resolves with the task's result.
     */
    public async dispatchTask(agentId: AgentID, task: string): Promise<any> {
        const agent = this.activeAgents.get(agentId);
        if (!agent || agent.status !== AgentStatus.RUNNING) {
            const errorMsg = `Agent ${agentId} is not available to perform tasks. Current status: ${agent?.status || 'Not Found'}`;
            console.error(`[Orchestrator] ${errorMsg}`);
            throw new Error(errorMsg);
        }

        agent.lastMessage = `Processing task: "${task}"`;
        agent.resources.apiCalls++;
        this.notifySubscribers();

        // Simulate async work and a call to a generative AI API
        return new Promise(resolve => {
            const processingTime = 2000 + Math.random() * 3000;
            setTimeout(() => {
                const tokens = 50 + Math.floor(Math.random() * 200);
                agent.resources.tokensUsed += tokens;
                
                const result = {
                    status: 'success',
                    message: `Task "${task}" completed successfully.`,
                    tokensConsumed: tokens
                };

                agent.taskHistory.push({ timestamp: new Date(), task, result, status: 'success' });
                agent.lastMessage = `Task complete. Awaiting new instructions.`;
                this.notifySubscribers();

                resolve(result);
            }, processingTime);
        });
    }

    public getAgent(agentId: AgentID): AgentInstance | undefined {
        return this.activeAgents.get(agentId);
    }
    
    public listActiveAgents(): AgentInstance[] {
        return Array.from(this.activeAgents.values());
    }

    // --- Internal Simulation Logic ---

    private startAgentSimulation(agentId: AgentID): void {
        const agent = this.activeAgents.get(agentId);
        if (!agent) return;

        agent.status = AgentStatus.RUNNING;
        agent.lastMessage = "Online and operational.";

        if (agent._resourceIntervalId) clearInterval(agent._resourceIntervalId);

        agent._resourceIntervalId = setInterval(() => {
            const currentAgent = this.activeAgents.get(agentId);
            if (!currentAgent || currentAgent.status !== AgentStatus.RUNNING) {
                if (currentAgent?._resourceIntervalId) clearInterval(currentAgent._resourceIntervalId);
                return;
            }

            // Simulate fluctuating resource usage
            currentAgent.resources.cpu = Math.min(100, Math.max(5, currentAgent.resources.cpu + (Math.random() - 0.48) * 10));
            currentAgent.resources.memory = Math.min(1024, Math.max(50, currentAgent.resources.memory + (Math.random() - 0.45) * 25));
            currentAgent.resources.totalUptime = (new Date().getTime() - currentAgent.resources.activeSince.getTime()) / 1000;
            
            // Periodically update the "last message" to show ambient activity
            if (Math.random() < 0.1) {
                const standbyMessages = ["Monitoring data streams...", "Optimizing parameters...", "Awaiting instructions...", "Analyzing context...", "System nominal."];
                currentAgent.lastMessage = standbyMessages[Math.floor(Math.random() * standbyMessages.length)];
            }
            
            this.notifySubscribers();
        }, 2000);
    }
}

// Export the singleton instance for global access
export const agentOrchestrator = AgentOrchestrator.getInstance();
```