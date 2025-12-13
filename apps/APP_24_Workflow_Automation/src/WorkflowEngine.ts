import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// -----------------------------------------------------------------------------
// SHARED CORE SDK MOCKS (Assumed to exist in the ecosystem)
// -----------------------------------------------------------------------------

interface ILogger {
    info(msg: string, meta?: any): void;
    error(msg: string, meta?: any): void;
    warn(msg: string, meta?: any): void;
    debug(msg: string, meta?: any): void;
}

interface IEventBus {
    publish(topic: string, payload: any): Promise<void>;
    subscribe(topic: string, handler: (payload: any) => Promise<void>): void;
}

interface ICostTracker {
    recordTransaction(appId: string, resourceType: string, units: number, metadata: any): Promise<void>;
}

interface IAuthContext {
    tenantId: string;
    userId: string;
    permissions: string[];
}

// -----------------------------------------------------------------------------
// DOMAIN TYPES: WORKFLOW
// -----------------------------------------------------------------------------

export type NodeType = 
    | 'START' 
    | 'END' 
    | 'LLM_INFERENCE' 
    | 'TOOL_CALL' 
    | 'CONDITION' 
    | 'AGGREGATE' 
    | 'DELAY' 
    | 'HUMAN_APPROVAL'
    | 'WEBHOOK';

export type NodeStatus = 
    | 'PENDING' 
    | 'RUNNING' 
    | 'COMPLETED' 
    | 'FAILED' 
    | 'SKIPPED' 
    | 'WAITING_FOR_INPUT';

export interface RetryPolicy {
    maxAttempts: number;
    backoffMultiplier: number;
    initialIntervalMs: number;
    maxIntervalMs: number;
}

export interface WorkflowNode {
    id: string;
    type: NodeType;
    label: string;
    config: Record<string, any>; // Node-specific config (e.g., prompt template, model ID)
    retryPolicy?: RetryPolicy;
    timeoutMs?: number;
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    condition?: string; // JavaScript expression or JSONLogic to evaluate
}

export interface WorkflowDefinition {
    id: string;
    version: number;
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    globalConfig: Record<string, any>;
}

export interface NodeExecutionState {
    nodeId: string;
    status: NodeStatus;
    startTime?: number;
    endTime?: number;
    input: any;
    output: any;
    error?: string;
    attempts: number;
    costMetrics?: {
        tokensInput: number;
        tokensOutput: number;
        estimatedCostUSD: number;
    };
}

export interface WorkflowInstance {
    id: string;
    definitionId: string;
    tenantId: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
    context: Record<string, any>; // Global context accessible by all nodes
    nodeStates: Record<string, NodeExecutionState>;
    createdAt: number;
    updatedAt: number;
}

// -----------------------------------------------------------------------------
// AI VENDOR ABSTRACTION (Simplified)
// -----------------------------------------------------------------------------

interface AIRequest {
    provider: string; // 'openai', 'anthropic', 'azure', etc.
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    tools?: any[];
}

interface AIResponse {
    content: string;
    toolCalls?: any[];
    usage: {
        promptTokens: number;
        completionTokens: number;
    };
}

interface IAIProviderRegistry {
    executeInference(request: AIRequest): Promise<AIResponse>;
}

// -----------------------------------------------------------------------------
// CORE ENGINE LOGIC
// -----------------------------------------------------------------------------

export class WorkflowEngine {
    private logger: ILogger;
    private eventBus: IEventBus;
    private costTracker: ICostTracker;
    private aiRegistry: IAIProviderRegistry;

    // In-memory store for demo purposes; in production, this would be Redis/Postgres
    private instanceStore: Map<string, WorkflowInstance> = new Map();

    constructor(
        logger: ILogger,
        eventBus: IEventBus,
        costTracker: ICostTracker,
        aiRegistry: IAIProviderRegistry
    ) {
        this.logger = logger;
        this.eventBus = eventBus;
        this.costTracker = costTracker;
        this.aiRegistry = aiRegistry;
    }

    /**
     * Initializes and starts a new workflow instance.
     */
    public async startWorkflow(
        definition: WorkflowDefinition, 
        initialInput: Record<string, any>, 
        auth: IAuthContext
    ): Promise<string> {
        this.validateDefinition(definition);

        const instanceId = randomUUID();
        const instance: WorkflowInstance = {
            id: instanceId,
            definitionId: definition.id,
            tenantId: auth.tenantId,
            status: 'RUNNING',
            context: { ...initialInput },
            nodeStates: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // Initialize node states
        definition.nodes.forEach(node => {
            instance.nodeStates[node.id] = {
                nodeId: node.id,
                status: 'PENDING',
                attempts: 0,
                input: {},
                output: null
            };
        });

        this.instanceStore.set(instanceId, instance);
        
        this.logger.info(`Workflow instance started`, { instanceId, definitionId: definition.id });
        await this.eventBus.publish('workflow.started', { instanceId, tenantId: auth.tenantId });

        // Find start nodes (nodes with no incoming edges)
        const startNodes = this.findStartNodes(definition);
        
        // Execute start nodes in parallel
        await Promise.all(startNodes.map(node => this.processNode(instanceId, node.id, definition)));

        return instanceId;
    }

    /**
     * Core execution loop for a single node.
     * Handles retries, execution logic, and downstream triggering.
     */
    private async processNode(instanceId: string, nodeId: string, definition: WorkflowDefinition): Promise<void> {
        const instance = this.instanceStore.get(instanceId);
        if (!instance || instance.status !== 'RUNNING') return;

        const node = definition.nodes.find(n => n.id === nodeId);
        if (!node) throw new Error(`Node ${nodeId} not found in definition`);

        const state = instance.nodeStates[nodeId];

        // Check upstream dependencies
        if (!this.areDependenciesMet(nodeId, definition, instance)) {
            return; // Wait for other dependencies
        }

        // Update state to RUNNING
        state.status = 'RUNNING';
        state.startTime = Date.now();
        state.input = this.resolveNodeInput(node, instance, definition);
        this.updateInstance(instance);

        try {
            this.logger.debug(`Executing node`, { nodeId, type: node.type });

            const result = await this.executeNodeLogic(node, state.input, instance.context);

            // Update state to COMPLETED
            state.status = 'COMPLETED';
            state.output = result.output;
            state.endTime = Date.now();
            
            if (result.cost) {
                state.costMetrics = result.cost;
                await this.costTracker.recordTransaction(
                    instance.tenantId, 
                    'AI_INFERENCE_TOKENS', 
                    result.cost.tokensInput + result.cost.tokensOutput, 
                    { nodeId, instanceId }
                );
            }

            // Merge output into global context if configured
            if (node.config.outputKey) {
                instance.context[node.config.outputKey] = result.output;
            }

            this.updateInstance(instance);
            await this.eventBus.publish('node.completed', { instanceId, nodeId, status: 'COMPLETED' });

            // Trigger downstream nodes
            const downstreamEdges = definition.edges.filter(e => e.source === nodeId);
            
            for (const edge of downstreamEdges) {
                if (this.evaluateEdgeCondition(edge, instance.context)) {
                    await this.processNode(instanceId, edge.target, definition);
                }
            }

            // Check if workflow is complete
            this.checkWorkflowCompletion(instance, definition);

        } catch (error: any) {
            this.logger.error(`Node execution failed`, { nodeId, error: error.message });
            
            if (this.shouldRetry(node, state)) {
                state.attempts++;
                const delay = this.calculateBackoff(node.retryPolicy!, state.attempts);
                this.logger.info(`Retrying node in ${delay}ms`, { nodeId, attempt: state.attempts });
                
                setTimeout(() => {
                    // Reset status to pending for retry
                    // In a real system, this would be a scheduled job, not setTimeout
                    this.processNode(instanceId, nodeId, definition);
                }, delay);
            } else {
                state.status = 'FAILED';
                state.error = error.message;
                state.endTime = Date.now();
                instance.status = 'FAILED';
                this.updateInstance(instance);
                await this.eventBus.publish('workflow.failed', { instanceId, error: error.message });
            }
        }
    }

    /**
     * Actual business logic router for different node types.
     */
    private async executeNodeLogic(node: WorkflowNode, input: any, context: any): Promise<{ output: any, cost?: any }> {
        switch (node.type) {
            case 'START':
                return { output: input };

            case 'LLM_INFERENCE':
                return this.executeLLMNode(node, input);

            case 'TOOL_CALL':
                return this.executeToolNode(node, input);

            case 'CONDITION':
                // Condition nodes don't do work, they just pass data. 
                // The branching logic happens in evaluateEdgeCondition.
                return { output: input };

            case 'AGGREGATE':
                // Input is already an array of upstream outputs
                return { output: input };
            
            case 'DELAY':
                await new Promise(resolve => setTimeout(resolve, node.config.durationMs || 1000));
                return { output: input };

            case 'END':
                return { output: input };

            default:
                throw new Error(`Unsupported node type: ${node.type}`);
        }
    }

    private async executeLLMNode(node: WorkflowNode, input: any): Promise<{ output: any, cost?: any }> {
        const prompt = this.interpolateTemplate(node.config.promptTemplate, input);
        
        const request: AIRequest = {
            provider: node.config.provider || 'openai',
            model: node.config.model || 'gpt-4',
            messages: [
                { role: 'system', content: node.config.systemPrompt || 'You are a helpful assistant.' },
                { role: 'user', content: prompt }
            ],
            temperature: node.config.temperature || 0.7
        };

        const response = await this.aiRegistry.executeInference(request);

        return {
            output: response.content,
            cost: {
                tokensInput: response.usage.promptTokens,
                tokensOutput: response.usage.completionTokens,
                estimatedCostUSD: 0.0 // Placeholder for real calculation logic
            }
        };
    }

    private async executeToolNode(node: WorkflowNode, input: any): Promise<{ output: any }> {
        // Simulate tool execution (e.g., HTTP request, DB query)
        // In a real app, this would delegate to a ToolRegistry
        this.logger.info(`Executing tool: ${node.config.toolName}`);
        return { output: { status: 'success', data: 'Tool execution result mock' } };
    }

    /**
     * Resolves inputs from upstream nodes.
     */
    private resolveNodeInput(node: WorkflowNode, instance: WorkflowInstance, definition: WorkflowDefinition): any {
        const incomingEdges = definition.edges.filter(e => e.target === node.id);
        
        if (incomingEdges.length === 0) {
            return instance.context; // Start nodes get global context
        }

        if (incomingEdges.length === 1) {
            const sourceNodeId = incomingEdges[0].source;
            return instance.nodeStates[sourceNodeId].output;
        }

        // Aggregate inputs for multi-source nodes
        const inputs: Record<string, any> = {};
        incomingEdges.forEach(edge => {
            inputs[edge.source] = instance.nodeStates[edge.source].output;
        });
        return inputs;
    }

    private areDependenciesMet(nodeId: string, definition: WorkflowDefinition, instance: WorkflowInstance): boolean {
        const incomingEdges = definition.edges.filter(e => e.target === nodeId);
        
        for (const edge of incomingEdges) {
            const sourceState = instance.nodeStates[edge.source];
            if (sourceState.status !== 'COMPLETED' && sourceState.status !== 'SKIPPED') {
                return false;
            }
            // If source was skipped, we might need to skip this one too unless it's a join
            // Simplified logic: if any dependency failed, we fail/wait.
            if (sourceState.status === 'FAILED') {
                throw new Error(`Upstream dependency ${edge.source} failed`);
            }
        }
        return true;
    }

    private evaluateEdgeCondition(edge: WorkflowEdge, context: any): boolean {
        if (!edge.condition) return true;
        
        try {
            // DANGER: eval is used here for demonstration. 
            // Production MUST use a safe evaluator like 'json-logic-js' or a sandboxed VM.
            // const func = new Function('context', `return ${edge.condition}`);
            // return func(context);
            
            // Safe mock implementation:
            if (edge.condition === 'true') return true;
            if (edge.condition === 'false') return false;
            // Simple property check
            if (edge.condition.startsWith('context.')) {
                const key = edge.condition.split('.')[1];
                return !!context[key];
            }
            return true;
        } catch (e) {
            this.logger.error(`Condition evaluation failed for edge ${edge.id}`, e);
            return false;
        }
    }

    private findStartNodes(definition: WorkflowDefinition): WorkflowNode[] {
        const targetIds = new Set(definition.edges.map(e => e.target));
        return definition.nodes.filter(n => !targetIds.has(n.id));
    }

    private checkWorkflowCompletion(instance: WorkflowInstance, definition: WorkflowDefinition) {
        const allNodes = Object.values(instance.nodeStates);
        const isComplete = allNodes.every(n => 
            n.status === 'COMPLETED' || n.status === 'SKIPPED' || n.status === 'FAILED'
        );

        if (isComplete && instance.status === 'RUNNING') {
            const hasFailures = allNodes.some(n => n.status === 'FAILED');
            instance.status = hasFailures ? 'FAILED' : 'COMPLETED';
            instance.updatedAt = Date.now();
            this.updateInstance(instance);
            
            this.eventBus.publish(
                hasFailures ? 'workflow.failed' : 'workflow.completed', 
                { instanceId: instance.id }
            );
        }
    }

    private shouldRetry(node: WorkflowNode, state: NodeExecutionState): boolean {
        if (!node.retryPolicy) return false;
        return state.attempts < node.retryPolicy.maxAttempts;
    }

    private calculateBackoff(policy: RetryPolicy, attempt: number): number {
        const delay = policy.initialIntervalMs * Math.pow(policy.backoffMultiplier, attempt - 1);
        return Math.min(delay, policy.maxIntervalMs);
    }

    private interpolateTemplate(template: string, data: any): string {
        if (!template) return '';
        // Simple {{key}} replacement
        return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
            const val = key.split('.').reduce((o: any, i: string) => (o ? o[i] : null), data);
            return val !== undefined ? val : '';
        });
    }

    private updateInstance(instance: WorkflowInstance) {
        instance.updatedAt = Date.now();
        this.instanceStore.set(instance.id, instance);
    }

    private validateDefinition(def: WorkflowDefinition) {
        if (!def.nodes || def.nodes.length === 0) throw new Error("Workflow must have nodes");
        // Cycle detection (DFS)
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const detectCycle = (nodeId: string): boolean => {
            visited.add(nodeId);
            recursionStack.add(nodeId);

            const children = def.edges
                .filter(e => e.source === nodeId)
                .map(e => e.target);

            for (const child of children) {
                if (!visited.has(child)) {
                    if (detectCycle(child)) return true;
                } else if (recursionStack.has(child)) {
                    return true;
                }
            }
            recursionStack.delete(nodeId);
            return false;
        };

        for (const node of def.nodes) {
            if (!visited.has(node.id)) {
                if (detectCycle(node.id)) throw new Error("Cycle detected in workflow definition");
            }
        }
    }

    // -------------------------------------------------------------------------
    // SELF-QUERYING AGENT MODE
    // -------------------------------------------------------------------------

    public introspect() {
        return {
            status: 'HEALTHY',
            activeInstances: Array.from(this.instanceStore.values()).filter(i => i.status === 'RUNNING').length,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
    }

    public getAssumptions() {
        return [
            "EventBus is reliable and ordered.",
            "AI Providers respond within configured timeouts.",
            "Workflow definitions are immutable during execution.",
            "Node IDs are unique within a definition."
        ];
    }

    public getFailureModes() {
        return [
            "Circular dependencies in dynamic graph generation.",
            "Token limit exhaustion on aggregate nodes.",
            "AI Provider rate limiting causing cascading retry delays.",
            "Serialization failures for complex object passing between nodes."
        ];
    }

    public getAgentMetadata() {
        return {
            agent_metadata: {
                purpose: "Orchestrate DAG-based AI tasks with conditional logic and state persistence.",
                dependencies: ["EventBus", "AIProviderRegistry", "CostTracker"],
                invalidation_conditions: ["CyclicDependencyDetected", "AuthTokenExpired", "RateLimitExceeded"],
                adjacent_apps: ["APP_01_Inference_CostRouter", "APP_14_Agents_MultiModelOrchestrator"]
            }
        };
    }
}