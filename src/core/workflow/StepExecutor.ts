import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as vm from 'vm';
import { Logger } from 'winston'; // Assuming a logger is available, or we mock it
import { cloneDeep, get, set, template } from 'lodash';

// --- Interfaces & Types ---

export interface WorkflowContext {
    variables: Record<string, any>;
    secrets: Record<string, string>;
    auth: {
        googleToken?: string;
        customTokens?: Record<string, string>;
    };
    history: StepResult[];
    files: Record<string, Buffer | string>; // Virtual file system for Drive/GitHub integration
}

export type StepType = 'api' | 'script' | 'wait' | 'workflow';

export interface WorkflowStep {
    id: string;
    name: string;
    type: StepType;
    operationId?: string; // For OpenAPI operations
    
    // API Configuration
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    headers?: Record<string, string>;
    params?: Record<string, any>;
    body?: any;
    timeout?: number;
    
    // Scripting
    preScript?: string;
    postScript?: string;
    
    // Flow Control
    delayMs?: number;
    retryConfig?: {
        maxAttempts: number;
        backoffMs: number;
    };
    
    // Integration Flags
    requiresGoogleAuth?: boolean;
    saveResponseToFile?: string; // Path to save response body (e.g., for Drive upload)
}

export interface StepResult {
    stepId: string;
    status: 'success' | 'failure' | 'skipped';
    statusCode?: number;
    data?: any;
    headers?: any;
    error?: string;
    executionTimeMs: number;
    timestamp: string;
}

// --- Step Executor Class ---

export class StepExecutor {
    private axiosInstance: AxiosInstance;
    private logger: Console; // Using console for portability, replace with Winston/Pino in full project

    constructor() {
        this.axiosInstance = axios.create({
            validateStatus: () => true, // Handle all status codes manually
        });
        this.logger = console;
    }

    /**
     * Executes a single workflow step.
     * @param step The step definition.
     * @param context The current execution context.
     * @returns The result of the step execution.
     */
    public async execute(step: WorkflowStep, context: WorkflowContext): Promise<StepResult> {
        const startTime = Date.now();
        this.logger.info(`[StepExecutor] Starting step: ${step.name} (${step.id})`);

        try {
            // 1. Execute Pre-Script
            if (step.preScript) {
                this.logger.debug(`[StepExecutor] Running pre-script for ${step.id}`);
                await this.executeScript(step.preScript, context);
            }

            // 2. Variable Substitution (Interpolation)
            const processedStep = this.interpolateStep(step, context);

            // 3. Core Execution Logic
            let resultData: any;
            let statusCode: number | undefined;
            let headers: any;

            switch (processedStep.type) {
                case 'api':
                    const apiResponse = await this.executeApiCall(processedStep, context);
                    resultData = apiResponse.data;
                    statusCode = apiResponse.status;
                    headers = apiResponse.headers;
                    break;

                case 'wait':
                    await this.executeWait(processedStep.delayMs || 0);
                    resultData = { message: `Waited ${processedStep.delayMs}ms` };
                    statusCode = 200;
                    break;

                case 'script':
                    // Main logic is in the script itself, usually modifying context
                    // If there is a specific 'script' body distinct from pre/post
                    resultData = { message: 'Script executed successfully' };
                    statusCode = 200;
                    break;

                default:
                    throw new Error(`Unsupported step type: ${processedStep.type}`);
            }

            // 4. Handle File Saving (Integration with Drive/GitHub logic)
            if (step.saveResponseToFile && resultData) {
                context.files[step.saveResponseToFile] = resultData;
                this.logger.info(`[StepExecutor] Saved response to virtual file: ${step.saveResponseToFile}`);
            }

            // 5. Execute Post-Script
            // We temporarily inject the response into the context for the post-script to access
            const tempContext = { 
                ...context, 
                response: { data: resultData, status: statusCode, headers } 
            };
            
            if (step.postScript) {
                this.logger.debug(`[StepExecutor] Running post-script for ${step.id}`);
                await this.executeScript(step.postScript, tempContext);
                // Update original context variables if modified
                context.variables = tempContext.variables;
            }

            const executionTime = Date.now() - startTime;
            
            const result: StepResult = {
                stepId: step.id,
                status: (statusCode && statusCode >= 400) ? 'failure' : 'success',
                statusCode,
                data: resultData,
                headers,
                executionTimeMs: executionTime,
                timestamp: new Date().toISOString(),
            };

            // Update History
            context.history.push(result);

            return result;

        } catch (error: any) {
            const executionTime = Date.now() - startTime;
            this.logger.error(`[StepExecutor] Error in step ${step.id}:`, error);

            const failureResult: StepResult = {
                stepId: step.id,
                status: 'failure',
                error: error.message || 'Unknown error',
                executionTimeMs: executionTime,
                timestamp: new Date().toISOString(),
            };

            context.history.push(failureResult);
            return failureResult;
        }
    }

    /**
     * Executes an API call based on the step configuration.
     */
    private async executeApiCall(step: WorkflowStep, context: WorkflowContext): Promise<AxiosResponse> {
        if (!step.url) {
            throw new Error('URL is required for API steps');
        }

        const config: AxiosRequestConfig = {
            url: step.url,
            method: step.method || 'GET',
            headers: step.headers || {},
            params: step.params,
            data: step.body,
            timeout: step.timeout || 30000,
        };

        // Authentication Handling
        if (step.requiresGoogleAuth) {
            if (!context.auth.googleToken) {
                throw new Error('Google Auth required but no token found in context.');
            }
            config.headers = {
                ...config.headers,
                'Authorization': `Bearer ${context.auth.googleToken}`,
            };
        }

        // Retry Logic
        let attempt = 0;
        const maxAttempts = step.retryConfig?.maxAttempts || 1;
        
        while (attempt < maxAttempts) {
            try {
                attempt++;
                return await this.axiosInstance.request(config);
            } catch (error: any) {
                const isLastAttempt = attempt === maxAttempts;
                if (isLastAttempt) {
                    throw error;
                }
                
                const backoff = step.retryConfig?.backoffMs || 1000;
                this.logger.warn(`[StepExecutor] Attempt ${attempt} failed. Retrying in ${backoff}ms...`);
                await this.executeWait(backoff);
            }
        }

        throw new Error('Unreachable code in executeApiCall');
    }

    /**
     * Executes a delay.
     */
    private async executeWait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Executes a JavaScript snippet in a sandboxed environment.
     * Allows manipulation of the context variables.
     */
    private async executeScript(scriptCode: string, context: any): Promise<void> {
        try {
            const sandbox = {
                console: {
                    log: (...args: any[]) => this.logger.info('[Script Log]', ...args),
                    error: (...args: any[]) => this.logger.error('[Script Error]', ...args),
                },
                context: context,
                variables: context.variables,
                files: context.files,
                // Helper functions for scripts
                utils: {
                    base64Encode: (str: string) => Buffer.from(str).toString('base64'),
                    base64Decode: (str: string) => Buffer.from(str, 'base64').toString('utf-8'),
                    jsonParse: (str: string) => JSON.parse(str),
                    jsonStringify: (obj: any) => JSON.stringify(obj),
                }
            };

            vm.createContext(sandbox);
            vm.runInContext(scriptCode, sandbox, { timeout: 5000 }); // 5s timeout for scripts

            // Sync back changes to variables
            context.variables = sandbox.variables;
            context.files = sandbox.files;

        } catch (error: any) {
            throw new Error(`Script execution failed: ${error.message}`);
        }
    }

    /**
     * Interpolates variables in the step configuration using Lodash template.
     * Replaces {{variables.key}} with actual values.
     */
    private interpolateStep(step: WorkflowStep, context: WorkflowContext): WorkflowStep {
        const stepString = JSON.stringify(step);
        
        // Regex to find {{...}} patterns
        // We use a simple replacement strategy or lodash template
        // Note: JSON.stringify might escape quotes, so we need to be careful with complex objects.
        // A safer approach is to traverse the object, but for performance/simplicity in this file:
        
        try {
            // Create a flat data object for templating
            const data = {
                variables: context.variables,
                secrets: context.secrets,
                auth: context.auth,
                prev: context.history.length > 0 ? context.history[context.history.length - 1] : {},
            };

            // Using a custom replacer to handle {{ }} syntax
            const interpolatedString = stepString.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
                const value = get(data, expression.trim());
                return value !== undefined ? value : match;
            });

            return JSON.parse(interpolatedString);
        } catch (e) {
            this.logger.warn('[StepExecutor] Interpolation failed, using original step config', e);
            return step;
        }
    }
}