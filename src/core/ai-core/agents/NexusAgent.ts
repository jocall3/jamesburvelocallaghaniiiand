```typescript
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { LLM, ChatMessage } from '../llm/LLM';
import { Tool } from '../tools/Tool';
import { Memory } from '../memory/Memory';
import { Logger } from '../../utils/Logger';

/**
 * Defines the possible states of a Nexus Agent.
 */
export enum AgentState {
    IDLE = 'IDLE',
    STARTING = 'STARTING',
    THINKING = 'THINKING',
    EXECUTING = 'EXECUTING',
    AWAITING_FEEDBACK = 'AWAITING_FEEDBACK',
    PROCESSING = 'PROCESSING',
    FINISHED = 'FINISHED',
    STOPPED = 'STOPPED',
    ERROR = 'ERROR',
}

/**
 * Configuration options for creating a NexusAgent.
 */
export interface NexusAgentOptions {
    name: string;
    role: string;
    goals: string[];
    llm: LLM;
    tools: Tool[];
    memory: Memory;
    systemPromptTemplate?: string;
    maxIterations?: number;
    logger?: Logger;
}

/**
 * Represents a specific action an agent decides to take.
 */
export interface AgentAction {
    toolName: string;
    args: Record<string, any>;
}

/**
 * Represents the structured thought process of an agent, as parsed from an LLM response.
 */
export interface LLMThoughtProcess {
    thought: string;
    reasoning: string;
    plan: string[];
    criticism: string;
    action: AgentAction;
}

/**
 * NexusAgent is the abstract base class for all autonomous agents in the framework.
 * It provides the core execution loop (Think -> Execute -> Observe) and state management.
 * Concrete agent implementations must extend this class and implement the abstract methods.
 */
export abstract class NexusAgent extends EventEmitter {
    public readonly id: string;
    public name: string;
    public role: string;
    public goals: string[];
    public state: AgentState;
    
    protected llm: LLM;
    protected tools: Map<string, Tool>;
    protected memory: Memory;
    protected logger: Logger;

    protected systemPrompt: string;
    protected maxIterations: number;
    protected iterationCount: number = 0;
    protected isRunning: boolean = false;
    
    /**
     * Creates an instance of a NexusAgent.
     * @param options The configuration options for the agent.
     */
    constructor(options: NexusAgentOptions) {
        super();
        this.id = uuidv4();
        this.name = options.name;
        this.role = options.role;
        this.goals = options.goals;
        this.llm = options.llm;
        this.memory = options.memory;
        this.logger = options.logger || new Logger(`NexusAgent-${this.name}`);
        this.maxIterations = options.maxIterations ?? 25;
        this.state = AgentState.IDLE;

        this.tools = new Map();
        options.tools.forEach(tool => this.tools.set(tool.name, tool));

        this.systemPrompt = this.buildSystemPrompt(options.systemPromptTemplate);
    }

    /**
     * Builds the system prompt that defines the agent's behavior, goals, and constraints.
     * Must be implemented by concrete agent classes.
     * @param template An optional string template for the prompt.
     * @returns The fully constructed system prompt string.
     */
    protected abstract buildSystemPrompt(template?: string): string;

    /**
     * Parses the raw string response from the LLM into a structured thought process object.
     * Must be implemented by concrete agent classes.
     * @param response The raw string response from the LLM.
     * @returns An `LLMThoughtProcess` object.
     */
    protected abstract parseLLMResponse(response: string): LLMThoughtProcess;

    /**
     * Starts the agent's main execution loop.
     * The agent will continue to run until it achieves its goals, reaches the max iteration limit,
     * or is manually stopped.
     * @param initialTask An optional initial task or query to begin the process.
     */
    public async run(initialTask?: string): Promise<void> {
        if (this.isRunning) {
            this.logger.warn(`Agent ${this.name} is already running.`);
            return;
        }

        this.setState(AgentState.STARTING);
        this.isRunning = true;
        this.iterationCount = 0;

        this.logger.info(`Agent ${this.name} (${this.id}) starting. Goals: ${this.goals.join(', ')}`);
        
        if (initialTask) {
            await this.memory.addMessage({ role: 'user', content: initialTask });
        }

        while (this.isRunning && this.iterationCount < this.maxIterations) {
            try {
                this.iterationCount++;
                this.emit('iteration', this.iterationCount);
                this.logger.info(`--- Iteration ${this.iterationCount}/${this.maxIterations} ---`);

                const thoughtProcess = await this.think();
                if (!thoughtProcess || !thoughtProcess.action) {
                     this.logger.warn("Agent could not decide on a valid action. Finishing task.");
                     this.setState(AgentState.FINISHED);
                     break;
                }

                if (thoughtProcess.action.toolName.toLowerCase() === 'task_complete') {
                    this.logger.info(`Agent concluded: ${thoughtProcess.thought}`);
                    this.logger.info("Agent has completed its task.");
                    this.setState(AgentState.FINISHED);
                    break;
                }

                const actionResult = await this.execute(thoughtProcess.action);
                await this.observe(thoughtProcess, actionResult);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Critical error in agent loop: ${errorMessage}`, { stack: error instanceof Error ? error.stack : undefined });
                this.setState(AgentState.ERROR);
                this.emit('error', error);
                break;
            }
        }
        
        if (this.isRunning && this.iterationCount >= this.maxIterations) {
            this.logger.warn("Agent reached maximum iterations without completing the task.");
            this.setState(AgentState.FINISHED);
        }
        
        this.stop();
    }

    /**
     * Stops the agent's execution loop.
     */
    public stop(): void {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.state !== AgentState.ERROR && this.state !== AgentState.FINISHED) {
            this.setState(AgentState.STOPPED);
        }
        this.logger.info(`Agent ${this.name} has stopped.`);
        this.emit('stop');
    }

    /**
     * The "Think" step of the execution cycle.
     * The agent constructs a prompt from its memory and system prompt, sends it to the LLM,
     * and parses the response into a structured thought process.
     * @returns A promise that resolves to the agent's thought process.
     */
    protected async think(): Promise<LLMThoughtProcess> {
        this.setState(AgentState.THINKING);
        this.emit('think');

        const prompt = await this.constructPrompt();
        const response = await this.llm.chat(prompt);
        
        this.logger.debug(`LLM Raw Response:\n${response}`);
        
        const parsedResponse = this.parseLLMResponse(response);
        
        await this.memory.addMessage({ role: 'assistant', content: response });

        this.emit('thought', parsedResponse);
        this.logger.info(`Thought: ${parsedResponse.thought}`);
        this.logger.info(`Action: ${parsedResponse.action.toolName}(${JSON.stringify(parsedResponse.action.args)})`);

        return parsedResponse;
    }

    /**
     * The "Execute" step of the execution cycle.
     * The agent invokes the tool specified in its decided action.
     * @param action The action to execute.
     * @returns A promise that resolves to a string representing the result of the action.
     */
    protected async execute(action: AgentAction): Promise<string> {
        this.setState(AgentState.EXECUTING);
        this.emit('execute', action);
        
        const tool = this.tools.get(action.toolName);
        if (!tool) {
            const errorMsg = `Error: Tool '${action.toolName}' not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`;
            this.logger.error(errorMsg);
            return errorMsg;
        }

        try {
            const result = await tool.execute(action.args);
            const resultString = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            this.logger.info(`Tool '${action.toolName}' executed successfully.`);
            this.logger.debug(`Tool result: ${resultString}`);
            this.emit('tool_result', { toolName: action.toolName, result: resultString });
            return resultString;
        } catch (error) {
            const errorMsg = `Error executing tool '${action.toolName}': ${error instanceof Error ? error.message : String(error)}`;
            this.logger.error(errorMsg);
            this.emit('tool_error', { toolName: action.toolName, error });
            return errorMsg;
        }
    }

    /**
     * The "Observe" step of the execution cycle.
     * The agent processes the result of its last action and stores it in memory.
     * @param thoughtProcess The thought process that led to the action.
     * @param actionResult The result of the executed action.
     */
    protected async observe(thoughtProcess: LLMThoughtProcess, actionResult: string): Promise<void> {
        this.setState(AgentState.PROCESSING);
        this.emit('observe', { thoughtProcess, actionResult });
        
        const toolResultMessage: ChatMessage = {
            role: 'tool',
            content: `Observation: ${actionResult}`,
            tool_call_id: thoughtProcess.action.toolName, // For traceability
        };
        await this.memory.addMessage(toolResultMessage);
        
        this.logger.info("Observation recorded in memory.");
    }
    
    /**
     * Constructs the full prompt to be sent to the LLM, including the system prompt and conversation history.
     * @returns A promise that resolves to an array of chat messages.
     */
    protected async constructPrompt(): Promise<ChatMessage[]> {
        const history = await this.memory.getMessages();
        const promptMessages: ChatMessage[] = [
            { role: 'system', content: this.systemPrompt },
            ...history
        ];
        return promptMessages;
    }
    
    /**
     * Safely sets the agent's state and emits a stateChange event.
     * @param newState The new state to set.
     */
    protected setState(newState: AgentState): void {
        if (this.state !== newState) {
            const oldState = this.state;
            this.state = newState;
            this.emit('stateChange', { oldState, newState });
            this.logger.info(`State changed from ${oldState} to ${newState}`);
        }
    }

    /**
     * Retrieves the list of tools available to the agent.
     * @returns An array of `Tool` instances.
     */
    public getTools(): Tool[] {
        return Array.from(this.tools.values());
    }
}
```