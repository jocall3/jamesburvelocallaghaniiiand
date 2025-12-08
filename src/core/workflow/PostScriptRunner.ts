/**
 * @file src/core/workflow/PostScriptRunner.ts
 * @description Executes user-defined JavaScript code *after* a workflow step has completed.
 * This is used for response parsing, data extraction, running assertions, and
 * setting variables for subsequent steps.
 */

import * as vm from 'vm';
import * as crypto from 'crypto';
import { Buffer } from 'buffer';

// NOTE: These types would typically be in a central location like 'src/core/types'.
// They are defined here for clarity and to make this file self-contained.

/**
 * Represents the shared context across all steps in a workflow execution.
 * It holds stateful information like environment and global variables.
 */
export interface WorkflowContext {
    /** A key-value store for variables specific to the current execution environment. */
    environment: Record<string, any>;
    /** A key-value store for variables that are shared across all environments. */
    globals: Record<string, any>;
}

/**
 * Represents the outcome of a single step's execution, typically an API request.
 * This data is made available to the post-execution script.
 */
export interface StepExecutionResult {
    /** The HTTP status code of the response. */
    status: number;
    /** The HTTP status text of the response. */
    statusText: string;
    /** A key-value object of response headers. Header names are lower-cased. */
    headers: Record<string, string | string[] | undefined>;
    /** The response body. Can be a string, Buffer, or a pre-parsed JSON object. */
    body: any;
    /** The time taken for the step to execute, in milliseconds. */
    executionTime: number;
}

/**
 * Defines the result of a post-script execution.
 */
export interface PostScriptResult {
    /** Indicates if the script executed without throwing an unhandled error. */
    success: boolean;
    /** An array of messages logged by the script using the sandboxed console. */
    logs: string[];
    /** An array of error messages captured during script execution. */
    errors: string[];
    /** The workflow context, potentially modified by the script. */
    updatedContext: WorkflowContext;
}

/**
 * A utility class for executing user-defined JavaScript code after a workflow step.
 * This runner provides a sandboxed environment with access to the step's response,
 * environment variables, and a set of utility functions.
 */
export class PostScriptRunner {
    /**
     * Default timeout for script execution to prevent infinite loops.
     */
    private static readonly SCRIPT_TIMEOUT_MS = 5000;

    /**
     * Executes a post-execution script in a sandboxed environment.
     *
     * @param script The JavaScript code to execute. If null, undefined, or empty, it returns a successful result immediately.
     * @param context The current workflow context, containing environment and global variables.
     * @param stepResult The result from the step's execution (e.g., an API call response).
     * @returns A promise that resolves with the results of the script execution.
     */
    public static async run(
        script: string | null | undefined,
        context: WorkflowContext,
        stepResult: StepExecutionResult
    ): Promise<PostScriptResult> {
        if (!script || script.trim() === '') {
            return {
                success: true,
                logs: [],
                errors: [],
                updatedContext: context,
            };
        }

        const logs: string[] = [];
        const errors: string[] = [];

        // Use structuredClone for a deep, safe copy of the context.
        // This prevents a failing script from corrupting the original context state.
        const contextClone = structuredClone(context);

        const sandbox = this.createSandbox(contextClone, stepResult, logs);
        const vmContext = vm.createContext(sandbox);

        try {
            // Execute the script within the sandboxed context.
            await vm.runInContext(script, vmContext, {
                timeout: this.SCRIPT_TIMEOUT_MS,
                displayErrors: true,
            });

            return {
                success: true,
                logs,
                errors,
                updatedContext: contextClone,
            };
        } catch (error: any) {
            const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
            errors.push(errorMessage);
            
            // On failure, discard the cloned context and return the original, unmodified one.
            return {
                success: false,
                logs,
                errors,
                updatedContext: context,
            };
        }
    }

    /**
     * Creates the sandboxed global object for the script execution.
     * This defines the entire API available to the user's script.
     *
     * @param context The cloned workflow context for the script to modify.
     * @param stepResult The result of the step execution.
     * @param logs An array to capture console log messages.
     * @returns The sandboxed object to be used by the VM.
     */
    private static createSandbox(
        context: WorkflowContext,
        stepResult: StepExecutionResult,
        logs: string[]
    ): object {
        const responseAccessor = {
            status: stepResult.status,
            statusText: stepResult.statusText,
            headers: stepResult.headers,
            body: stepResult.body,
            executionTime: stepResult.executionTime,
            json: (): any => {
                try {
                    if (typeof stepResult.body === 'string') {
                        return JSON.parse(stepResult.body);
                    }
                    if (typeof stepResult.body === 'object' && stepResult.body !== null && !Buffer.isBuffer(stepResult.body)) {
                        return stepResult.body; // Already parsed
                    }
                } catch (e) {
                    logs.push(`[SYSTEM ERROR] Failed to parse response body as JSON: ${(e as Error).message}`);
                    return null;
                }
                return null;
            },
            text: (): string => {
                if (typeof stepResult.body === 'string') {
                    return stepResult.body;
                }
                if (Buffer.isBuffer(stepResult.body)) {
                    return stepResult.body.toString('utf-8');
                }
                try {
                    return JSON.stringify(stepResult.body);
                } catch (e) {
                    return String(stepResult.body);
                }
            },
        };

        const createVariableAccessor = (store: Record<string, any>) => ({
            get: (key: string): any => store[key],
            set: (key: string, value: any): void => {
                store[key] = value;
            },
            unset: (key: string): void => {
                delete store[key];
            },
            clear: (): void => {
                Object.keys(store).forEach(key => delete store[key]);
            },
            all: (): Record<string, any> => ({ ...store }),
        });

        const customConsole = {
            log: (...args: any[]) => logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')),
            warn: (...args: any[]) => logs.push(`[WARN] ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')}`),
            error: (...args: any[]) => logs.push(`[ERROR] ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')}`),
        };

        return {
            // Core APIs for interacting with workflow state
            response: responseAccessor,
            environment: createVariableAccessor(context.environment),
            globals: createVariableAccessor(context.globals),
            
            // Safe Utilities
            console: customConsole,
            crypto,
            Buffer,
            atob: (str: string) => Buffer.from(str, 'base64').toString('binary'),
            btoa: (str: string) => Buffer.from(str, 'binary').toString('base64'),

            // Asynchronous operations
            setTimeout,
            clearTimeout,
            setInterval,
            clearInterval,

            // Explicitly block access to potentially harmful Node.js globals
            process: undefined,
            require: undefined,
            module: undefined,
            exports: undefined,
            __dirname: undefined,
            __filename: undefined,
            global: undefined,
        };
    }
}