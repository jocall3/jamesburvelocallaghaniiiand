import { WorkflowExecution, WorkflowStepExecution } from '../../types/workflow';

export class ExecutionLogger {
    private execution: WorkflowExecution;

    constructor(execution: WorkflowExecution) {
        this.execution = execution;
    }

    /**
     * Logs the start of a specific workflow step execution.
     * @param stepId The ID of the step being executed.
     * @param inputs The inputs provided to the step.
     */
    logStepStart(stepId: string, inputs: any): void {
        const timestamp = new Date().toISOString();
        const stepExecution: WorkflowStepExecution = {
            stepId: stepId,
            status: 'RUNNING',
            startTime: timestamp,
            endTime: null,
            inputs: inputs,
            outputs: null,
            logs: [],
        };

        this.execution.stepExecutions.push(stepExecution);
        console.log(`[${timestamp}] Workflow ${this.execution.workflowId}: Step ${stepId} started with inputs:`, inputs);
    }

    /**
     * Logs the successful completion of a workflow step execution.
     * @param stepId The ID of the step that completed.
     * @param outputs The outputs produced by the step.
     */
    logStepSuccess(stepId: string, outputs: any): void {
        const timestamp = new Date().toISOString();
        const stepExecution = this.execution.stepExecutions.find(se => se.stepId === stepId && se.status === 'RUNNING');

        if (stepExecution) {
            stepExecution.status = 'COMPLETED';
            stepExecution.endTime = timestamp;
            stepExecution.outputs = outputs;
            console.log(`[${timestamp}] Workflow ${this.execution.workflowId}: Step ${stepId} completed successfully with outputs:`, outputs);
        } else {
            this.logError(stepId, `Attempted to log success for non-running or missing step: ${stepId}`);
        }
    }

    /**
     * Logs an error during a workflow step execution.
     * @param stepId The ID of the step where the error occurred.
     * @param error The error object or message.
     */
    logError(stepId: string, error: any): void {
        const timestamp = new Date().toISOString();
        let stepExecution = this.execution.stepExecutions.find(se => se.stepId === stepId && se.status === 'RUNNING');

        if (!stepExecution) {
            // If an error occurs before we even logged start (e.g., initialization error), create a placeholder
            stepExecution = {
                stepId: stepId,
                status: 'FAILED',
                startTime: timestamp,
                endTime: timestamp,
                inputs: null,
                outputs: null,
                logs: [],
            };
            this.execution.stepExecutions.push(stepExecution);
        } else {
            stepExecution.status = 'FAILED';
            stepExecution.endTime = timestamp;
        }

        const logEntry = {
            timestamp,
            level: 'ERROR',
            message: typeof error === 'string' ? error : (error.message || JSON.stringify(error)),
        };

        stepExecution.logs.push(logEntry);
        this.execution.status = 'FAILED'; // Update overall execution status if a step fails
        console.error(`[${timestamp}] Workflow ${this.execution.workflowId}: Step ${stepId} FAILED. Error:`, error);
    }

    /**
     * Adds an arbitrary log message to a running step.
     * @param stepId The ID of the step to log to.
     * @param level The log level (INFO, WARN).
     * @param message The log message.
     */
    log(stepId: string, level: 'INFO' | 'WARN', message: string): void {
        const timestamp = new Date().toISOString();
        let stepExecution = this.execution.stepExecutions.find(se => se.stepId === stepId && (se.status === 'RUNNING' || se.status === 'COMPLETED'));

        if (!stepExecution) {
            console.warn(`[${timestamp}] Workflow ${this.execution.workflowId}: Cannot log to step ${stepId}. Step execution not found or already finalized.`);
            return;
        }

        const logEntry = {
            timestamp,
            level: level,
            message: message,
        };

        stepExecution.logs.push(logEntry);
        console.log(`[${timestamp}] [${level}] Workflow ${this.execution.workflowId} Step ${stepId}: ${message}`);
    }

    /**
     * Marks the entire workflow execution as complete.
     */
    logWorkflowComplete(): void {
        const timestamp = new Date().toISOString();
        if (this.execution.status !== 'FAILED') {
            this.execution.status = 'COMPLETED';
        }
        this.execution.completionTime = timestamp;
        console.log(`[${timestamp}] Workflow ${this.execution.workflowId} execution finished with status: ${this.execution.status}`);
    }

    /**
     * Retrieves the current state of the execution log.
     */
    getExecutionSnapshot(): WorkflowExecution {
        return { ...this.execution };
    }
}