```typescript
import { EventEmitter } from 'events';

/**
 * Defines the supported financial actions within the system.
 */
export enum FinancialAction {
    CREATE_ACCOUNT = 'CREATE_ACCOUNT',
    DEPOSIT = 'DEPOSIT',
    WITHDRAW = 'WITHDRAW',
    TRANSFER = 'TRANSFER',
    FREEZE_ACCOUNT = 'FREEZE_ACCOUNT',
    AUDIT_LEDGER = 'AUDIT_LEDGER',
    CALCULATE_INTEREST = 'CALCULATE_INTEREST'
}

/**
 * Interface representing a single step in a financial scenario.
 */
export interface ScenarioStep {
    id: string;
    description: string;
    action: FinancialAction;
    payload: Record<string, any>;
    expected: {
        success: boolean;
        errorCode?: string;
        balanceChange?: number;
        customAssertion?: (result: any, context: any) => boolean;
    };
    timeoutMs?: number;
}

/**
 * Interface representing a full end-to-end scenario.
 */
export interface FinancialScenario {
    id: string;
    name: string;
    description: string;
    steps: ScenarioStep[];
    config?: {
        stopOnFailure: boolean;
        dryRun?: boolean;
    };
}

/**
 * Result of a single step execution.
 */
export interface StepResult {
    stepId: string;
    action: FinancialAction;
    status: 'PASSED' | 'FAILED' | 'SKIPPED';
    duration: number;
    output: any;
    error?: Error | string;
    logs: string[];
}

/**
 * Aggregated report of a scenario execution.
 */
export interface ScenarioReport {
    scenarioId: string;
    timestamp: Date;
    success: boolean;
    totalDuration: number;
    stepResults: StepResult[];
    contextState: Record<string, any>;
}

/**
 * Abstract adapter to decouple the runner from specific financial services.
 */
export interface FinancialServiceProvider {
    execute(action: FinancialAction, payload: any, context: Record<string, any>): Promise<any>;
    cleanup(context: Record<string, any>): Promise<void>;
}

/**
 * Engine for executing end-to-end financial scenarios to validate system integrity.
 */
export class ScenarioRunner extends EventEmitter {
    private serviceProvider: FinancialServiceProvider;
    private executionContext: Record<string, any>;

    constructor(serviceProvider: FinancialServiceProvider) {
        super();
        this.serviceProvider = serviceProvider;
        this.executionContext = {};
    }

    /**
     * Resets the execution context.
     */
    public resetContext(): void {
        this.executionContext = {};
    }

    /**
     * executes a specific financial scenario.
     * @param scenario The scenario definition to run.
     */
    public async run(scenario: FinancialScenario): Promise<ScenarioReport> {
        this.emit('start', scenario);
        const startTime = Date.now();
        const stepResults: StepResult[] = [];
        let isScenarioSuccessful = true;
        
        console.info(`[ScenarioRunner] Starting scenario: ${scenario.name} (${scenario.id})`);

        for (const step of scenario.steps) {
            // Check if we should proceed based on previous failures
            if (!isScenarioSuccessful && scenario.config?.stopOnFailure) {
                stepResults.push(this.createSkippedResult(step));
                continue;
            }

            const stepStart = Date.now();
            const logs: string[] = [];
            const logger = (msg: string) => logs.push(`[${new Date().toISOString()}] ${msg}`);

            try {
                logger(`Executing action: ${step.action}`);
                
                // Enforce timeout if specified
                const executionPromise = this.serviceProvider.execute(step.action, step.payload, this.executionContext);
                const timeoutPromise = new Promise<never>((_, reject) => {
                    if (step.timeoutMs) {
                        setTimeout(() => reject(new Error(`Operation timed out after ${step.timeoutMs}ms`)), step.timeoutMs);
                    }
                });

                const result = step.timeoutMs 
                    ? await Promise.race([executionPromise, timeoutPromise])
                    : await executionPromise;

                logger(`Raw Result: ${JSON.stringify(result)}`);

                // Validate expectations
                this.validateExpectations(step, result, this.executionContext);

                stepResults.push({
                    stepId: step.id,
                    action: step.action,
                    status: 'PASSED',
                    duration: Date.now() - stepStart,
                    output: result,
                    logs
                });
                
                this.emit('stepPass', step, result);

            } catch (error: any) {
                isScenarioSuccessful = false;
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger(`Error: ${errorMessage}`);

                // Check if the error was expected
                if (!step.expected.success && step.expected.errorCode === error.code) {
                    // It failed as expected
                    isScenarioSuccessful = true; // Recover status
                    stepResults.push({
                        stepId: step.id,
                        action: step.action,
                        status: 'PASSED',
                        duration: Date.now() - stepStart,
                        output: { error: errorMessage },
                        logs: [...logs, 'Error matched expected failure criteria.']
                    });
                    this.emit('stepPass', step, { error: errorMessage });
                } else {
                    stepResults.push({
                        stepId: step.id,
                        action: step.action,
                        status: 'FAILED',
                        duration: Date.now() - stepStart,
                        output: null,
                        error: errorMessage,
                        logs
                    });
                    this.emit('stepFail', step, error);
                }
            }
        }

        const endTime = Date.now();
        const report: ScenarioReport = {
            scenarioId: scenario.id,
            timestamp: new Date(),
            success: isScenarioSuccessful,
            totalDuration: endTime - startTime,
            stepResults,
            contextState: { ...this.executionContext } // Snapshot of final state
        };

        console.info(`[ScenarioRunner] Finished scenario: ${scenario.name}. Success: ${isScenarioSuccessful}`);
        
        // Cleanup after run
        try {
            await this.serviceProvider.cleanup(this.executionContext);
        } catch (e) {
            console.error('[ScenarioRunner] Cleanup failed', e);
        }

        this.emit('end', report);
        return report;
    }

    private validateExpectations(step: ScenarioStep, result: any, context: any): void {
        if (!step.expected.success) {
            // If we are here, the operation succeeded but we expected failure
            throw new Error(`Step expected to fail with error code '${step.expected.errorCode}', but succeeded.`);
        }

        // Custom assertions hook
        if (step.expected.customAssertion) {
            const passed = step.expected.customAssertion(result, context);
            if (!passed) {
                throw new Error('Custom assertion failed.');
            }
        }

        // Financial specific validations (e.g. balance checks)
        if (step.expected.balanceChange !== undefined) {
            if (result.balanceChange !== step.expected.balanceChange) {
                throw new Error(`Balance mismatch. Expected change: ${step.expected.balanceChange}, Actual: ${result.balanceChange}`);
            }
        }
    }

    private createSkippedResult(step: ScenarioStep): StepResult {
        return {
            stepId: step.id,
            action: step.action,
            status: 'SKIPPED',
            duration: 0,
            output: null,
            logs: ['Step skipped due to previous failure.']
        };
    }
}
```