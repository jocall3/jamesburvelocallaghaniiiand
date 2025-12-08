import { EventEmitter } from 'events';

/**
 * Represents the status of a workflow or a specific step.
 */
export enum ExecutionStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    SKIPPED = 'SKIPPED',
    CANCELLED = 'CANCELLED',
}

/**
 * Configuration for retrying failed steps.
 */
export interface RetryPolicy {
    maxAttempts: number;
    backoffMultiplier: number;
    initialIntervalMs: number;
}

/**
 * Defines a single step within a workflow.
 */
export interface WorkflowStep {
    id: string;
    operationId: string; // Links to OpenAPI Operation ID
    description?: string;
    dependsOn?: string[]; // IDs of steps that must complete before this one
    inputs: Record<string, any>; // Inputs for the operation, supports expressions
    preScript?: string; // JavaScript code to run before the operation
    postScript?: string; // JavaScript code to run after the operation
    retryPolicy?: RetryPolicy;
    condition?: string; // Expression that must evaluate to true to run this step
}

/**
 * Defines the structure of a workflow.
 */
export interface WorkflowDefinition {
    id: string;
    title: string;
    version: string;
    description?: string;
    variables?: Record<string, any>; // Global variables
    steps: WorkflowStep[];
}

/**
 * The runtime context passed between steps.
 */
export interface WorkflowContext {
    workflowId: string;
    executionId: string;
    status: ExecutionStatus;
    variables: Record<string, any>;
    steps: Record<string, StepResult>;
    auth: {
        accessToken?: string;
        provider?: string; // e.g., 'google'
        user?: any;
    };
    integrations: {
        googleDrive?: any;
        github?: any;
        [key: string]: any;
    };
}

/**
 * The result of a single step execution.
 */
export interface StepResult {
    id: string;
    status: ExecutionStatus;
    startTime: Date;
    endTime?: Date;
    output?: any;
    error?: Error;
    attempts: number;
}

/**
 * Interface for the external service that executes the actual API calls.
 */
export interface IOperationExecutor {
    executeOperation(operationId: string, inputs: any, auth: any): Promise<any>;
}

/**
 * Interface for script execution (sandbox).
 */
export interface IScriptExecutor {
    execute(script: string, context: any): Promise<any>;
}

/**
 * Core engine for executing workflows defined by OpenAPI 3.1.0 standards and custom extensions.
 * Handles state transitions, dependency resolution, scripting hooks, and error management.
 */
export class WorkflowEngine extends EventEmitter {
    private operationExecutor: IOperationExecutor;
    private scriptExecutor: IScriptExecutor;

    constructor(operationExecutor: IOperationExecutor, scriptExecutor: IScriptExecutor) {
        super();
        this.operationExecutor = operationExecutor;
        this.scriptExecutor = scriptExecutor;
    }

    /**
     * Initializes and executes a workflow.
     * @param definition The workflow definition.
     * @param initialInputs Initial inputs provided to the workflow.
     * @param authContext Authentication tokens (e.g., Google OAuth).
     */
    public async executeWorkflow(
        definition: WorkflowDefinition,
        initialInputs: Record<string, any> = {},
        authContext: any = {}
    ): Promise<WorkflowContext> {
        const executionId = crypto.randomUUID();
        
        const context: WorkflowContext = {
            workflowId: definition.id,
            executionId: executionId,
            status: ExecutionStatus.RUNNING,
            variables: { ...definition.variables, ...initialInputs },
            steps: {},
            auth: authContext,
            integrations: {} // Populated as needed
        };

        this.emit('workflowStart', { executionId, workflowId: definition.id });

        try {
            // Topological sort or simple dependency check loop
            const stepsToRun = new Map<string, WorkflowStep>(definition.steps.map(s => [s.id, s]));
            const completedSteps = new Set<string>();

            // Initialize step results
            definition.steps.forEach(step => {
                context.steps[step.id] = {
                    id: step.id,
                    status: ExecutionStatus.PENDING,
                    startTime: new Date(),
                    attempts: 0
                };
            });

            while (completedSteps.size < stepsToRun.size) {
                // Find steps that are ready to run (dependencies met) and haven't run yet
                const readySteps = Array.from(stepsToRun.values()).filter(step => {
                    if (completedSteps.has(step.id)) return false;
                    if (!step.dependsOn || step.dependsOn.length === 0) return true;
                    return step.dependsOn.every(depId => completedSteps.has(depId));
                });

                if (readySteps.length === 0 && completedSteps.size < stepsToRun.size) {
                    throw new Error('Deadlock detected in workflow dependencies or circular dependency.');
                }

                // Execute ready steps in parallel
                await Promise.all(readySteps.map(async (step) => {
                    try {
                        await this.executeStep(step, context);
                    } catch (error) {
                        // If a step fails and it's critical, the workflow fails
                        // Error handling logic is inside executeStep, but if it bubbles up:
                        context.status = ExecutionStatus.FAILED;
                        throw error;
                    } finally {
                        completedSteps.add(step.id);
                    }
                }));

                if (context.status === ExecutionStatus.FAILED) break;
            }

            context.status = ExecutionStatus.COMPLETED;
            this.emit('workflowComplete', { executionId, result: context });
        } catch (error) {
            context.status = ExecutionStatus.FAILED;
            this.emit('workflowError', { executionId, error });
            throw error;
        }

        return context;
    }

    /**
     * Executes a single step including pre-scripts, operation call, and post-scripts.
     */
    private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<void> {
        const stepResult = context.steps[step.id];
        stepResult.status = ExecutionStatus.RUNNING;
        stepResult.startTime = new Date();
        this.emit('stepStart', { executionId: context.executionId, stepId: step.id });

        try {
            // 1. Evaluate Condition
            if (step.condition) {
                const shouldRun = await this.evaluateExpression(step.condition, context);
                if (!shouldRun) {
                    stepResult.status = ExecutionStatus.SKIPPED;
                    stepResult.endTime = new Date();
                    this.emit('stepSkipped', { executionId: context.executionId, stepId: step.id });
                    return;
                }
            }

            // 2. Run Pre-Script
            if (step.preScript) {
                await this.runScript(step.preScript, context, stepResult);
            }

            // 3. Resolve Inputs
            const resolvedInputs = this.resolveInputs(step.inputs, context);

            // 4. Execute Operation (with Retry Logic)
            const output = await this.executeOperationWithRetry(step, resolvedInputs, context);
            stepResult.output = output;

            // 5. Run Post-Script
            if (step.postScript) {
                await this.runScript(step.postScript, context, stepResult);
            }

            stepResult.status = ExecutionStatus.COMPLETED;
            stepResult.endTime = new Date();
            this.emit('stepComplete', { executionId: context.executionId, stepId: step.id, output });

        } catch (error: any) {
            stepResult.status = ExecutionStatus.FAILED;
            stepResult.error = error;
            stepResult.endTime = new Date();
            this.emit('stepError', { executionId: context.executionId, stepId: step.id, error });
            throw error; // Re-throw to stop workflow if necessary
        }
    }

    /**
     * Handles the retry logic for operations.
     */
    private async executeOperationWithRetry(
        step: WorkflowStep, 
        inputs: any, 
        context: WorkflowContext
    ): Promise<any> {
        const policy = step.retryPolicy || { maxAttempts: 1, backoffMultiplier: 1, initialIntervalMs: 0 };
        let attempt = 0;
        let lastError;

        while (attempt < policy.maxAttempts) {
            attempt++;
            context.steps[step.id].attempts = attempt;
            
            try {
                // Special handling for specific integrations if needed, otherwise generic executor
                // This supports the "1000 APIs" requirement by delegating to the operationExecutor
                // which should have the OpenAPI definitions loaded.
                return await this.operationExecutor.executeOperation(
                    step.operationId, 
                    inputs, 
                    context.auth
                );
            } catch (error) {
                lastError = error;
                if (attempt >= policy.maxAttempts) break;

                const delay = policy.initialIntervalMs * Math.pow(policy.backoffMultiplier, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
                this.emit('stepRetry', { executionId: context.executionId, stepId: step.id, attempt, delay });
            }
        }

        throw lastError;
    }

    /**
     * Resolves input variables using a template syntax (e.g., ${steps.step1.output.id}).
     */
    private resolveInputs(inputs: any, context: WorkflowContext): any {
        if (typeof inputs === 'string') {
            return this.interpolateString(inputs, context);
        } else if (Array.isArray(inputs)) {
            return inputs.map(i => this.resolveInputs(i, context));
        } else if (typeof inputs === 'object' && inputs !== null) {
            const resolved: any = {};
            for (const key in inputs) {
                resolved[key] = this.resolveInputs(inputs[key], context);
            }
            return resolved;
        }
        return inputs;
    }

    /**
     * Interpolates a string with context values.
     * Supports dot notation: ${steps.login.output.token}
     */
    private interpolateString(str: string, context: WorkflowContext): any {
        const regex = /\$\{([^}]+)\}/g;
        
        // If the string is exactly one variable, return the raw value (preserve types)
        if (str.match(/^\$\{([^}]+)\}$/)) {
            const path = str.slice(2, -1).trim();
            return this.getValueFromPath(path, context);
        }

        return str.replace(regex, (_, path) => {
            const val = this.getValueFromPath(path.trim(), context);
            return val !== undefined ? String(val) : '';
        });
    }

    private getValueFromPath(path: string, context: WorkflowContext): any {
        const parts = path.split('.');
        let current: any = context;
        
        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }
        return current;
    }

    /**
     * Evaluates a boolean expression for step conditions.
     */
    private async evaluateExpression(expression: string, context: WorkflowContext): Promise<boolean> {
        // Using the script executor to evaluate expressions safely
        try {
            const result = await this.scriptExecutor.execute(`return ${expression};`, context);
            return !!result;
        } catch (e) {
            console.error(`Failed to evaluate condition: ${expression}`, e);
            return false;
        }
    }

    /**
     * Runs a pre or post script.
     * Scripts have access to the context and can modify variables.
     */
    private async runScript(script: string, context: WorkflowContext, currentStep: StepResult): Promise<void> {
        // Expose a safe sandbox context
        const sandboxContext = {
            variables: context.variables,
            steps: context.steps,
            currentStep: currentStep,
            auth: context.auth,
            // Helper to set output from script
            setOutput: (val: any) => { currentStep.output = val; },
            // Helper to fail from script
            fail: (msg: string) => { throw new Error(msg); }
        };

        await this.scriptExecutor.execute(script, sandboxContext);
    }
}

/**
 * Default implementation of a Script Executor using Function constructor.
 * Note: In a high-security environment, use 'vm2' or 'isolated-vm'.
 */
export class DefaultScriptExecutor implements IScriptExecutor {
    async execute(script: string, context: any): Promise<any> {
        const keys = Object.keys(context);
        const values = Object.values(context);
        
        // Wrap in an async function to allow await in scripts
        const func = new Function(...keys, `return (async () => { ${script} })();`);
        return func(...values);
    }
}

/**
 * Helper to validate if a workflow definition is valid.
 */
export function validateWorkflow(definition: WorkflowDefinition): string[] {
    const errors: string[] = [];
    if (!definition.id) errors.push('Workflow ID is required');
    if (!definition.steps || !Array.isArray(definition.steps)) errors.push('Workflow steps are required');
    
    const stepIds = new Set<string>();
    definition.steps.forEach(step => {
        if (stepIds.has(step.id)) errors.push(`Duplicate step ID: ${step.id}`);
        stepIds.add(step.id);
    });

    definition.steps.forEach(step => {
        if (step.dependsOn) {
            step.dependsOn.forEach(dep => {
                if (!stepIds.has(dep)) errors.push(`Step ${step.id} depends on unknown step ${dep}`);
            });
        }
    });

    return errors;
}