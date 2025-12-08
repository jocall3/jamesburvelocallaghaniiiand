/**
 * @file Manages the execution context (variables, secrets, temporary data) passed between workflow steps.
 * @version 1.0.0
 */

// #region Utility Functions (Dependency-free implementations)

/**
 * Deeply clones an object or array.
 * @param source The object or array to clone.
 * @returns A deep copy of the source.
 */
function cloneDeep<T>(source: T): T {
    if (source === null || typeof source !== 'object') {
        return source;
    }

    if (source instanceof Date) {
        return new Date(source.getTime()) as any;
    }

    if (source instanceof Array) {
        const newArr = [] as any[];
        for (let i = 0; i < source.length; i++) {
            newArr[i] = cloneDeep(source[i]);
        }
        return newArr as T;
    }

    // Handle Objects
    const newObj = {} as { [key: string]: any };
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            newObj[key] = cloneDeep((source as any)[key]);
        }
    }
    return newObj as T;
}

/**
 * Gets the value at a path of an object.
 * @param obj The object to query.
 * @param path The path of the property to retrieve.
 * @param defaultValue The value returned for unresolved values.
 * @returns The resolved value.
 */
function get(obj: any, path: string | string[], defaultValue?: any): any {
    const pathArray = Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, '.$1').split('.');
    
    let current = obj;
    for (const key of pathArray) {
        if (current === null || current === undefined) {
            return defaultValue;
        }
        current = current[key];
    }
    return current === undefined ? defaultValue : current;
}

/**
 * Sets the value at a path of an object.
 * @param obj The object to modify.
 * @param path The path of the property to set.
 * @param value The value to set.
 * @returns The modified object.
 */
function set(obj: any, path: string | string[], value: any): any {
    const pathArray = Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, '.$1').split('.');
    
    let current = obj;
    for (let i = 0; i < pathArray.length - 1; i++) {
        const key = pathArray[i];
        if (current[key] === undefined || typeof current[key] !== 'object' || current[key] === null) {
            const nextKey = pathArray[i + 1];
            current[key] = /^\d+$/.test(nextKey) ? [] : {};
        }
        current = current[key];
    }
    current[pathArray[pathArray.length - 1]] = value;
    return obj;
}

// #endregion

/**
 * Represents the output of a single workflow step.
 */
export interface IStepOutput {
    status: 'success' | 'failure' | 'skipped' | 'running' | 'pending';
    output: any;
    error?: string | object;
    startedAt: string; // ISO 8601 string
    finishedAt?: string; // ISO 8601 string
    logs?: string[];
}

/**
 * Defines the structure of the data managed by the ContextManager.
 * This is the "state" of a workflow execution.
 */
export interface IWorkflowContextData {
    /** Global variables available to all steps (e.g., workflow run ID, timestamp). */
    globals: Record<string, any>;
    /** User-defined variables for the workflow execution. */
    variables: Record<string, any>;
    /** Sensitive data, which should be masked in logs and UI. */
    secrets: Record<string, string>;
    /** Outputs from previously executed steps, keyed by step ID. */
    steps: Record<string, IStepOutput>;
}

/**
 * Manages the execution context for a workflow run.
 * It holds state (variables, secrets, step outputs) and provides
 * utilities for resolving template strings against that state.
 */
export class ContextManager {
    private context: IWorkflowContextData;

    /**
     * Initializes a new ContextManager instance.
     * @param initialContext - Optional initial data to populate the context.
     */
    constructor(initialContext?: Partial<IWorkflowContextData>) {
        this.context = {
            globals: initialContext?.globals ?? {},
            variables: initialContext?.variables ?? {},
            secrets: initialContext?.secrets ?? {},
            steps: initialContext?.steps ?? {},
        };
    }

    /**
     * Retrieves the entire context data object.
     * @returns A deep copy of the current context data to prevent mutation.
     */
    public getFullContext(): IWorkflowContextData {
        return cloneDeep(this.context);
    }

    /**
     * Retrieves a value from the context using a dot-notation path.
     * This method can access `globals`, `variables`, and `steps`.
     * Secrets are not resolved by this method for security; use `getSecret`.
     * @param path - The dot-notation path to the value (e.g., 'steps.step1.output.id', 'variables.userId').
     * @param defaultValue - The value to return if the path is not found.
     * @returns The resolved value or the default value.
     */
    public get(path: string, defaultValue?: any): any {
        return get(this.context, path, defaultValue);
    }

    /**
     * Sets a value in the context using a dot-notation path.
     * Note: This should be used with caution. Prefer specific setters like `setStepOutput` or `setVariable`.
     * This method will not set secrets.
     * @param path - The dot-notation path where the value should be set (e.g., 'variables.newVar').
     * @param value - The value to set.
     */
    public set(path: string, value: any): void {
        if (path.startsWith('secrets')) {
            console.warn('Attempted to set a secret using the generic set method. Use setSecret instead.');
            return;
        }
        set(this.context, path, value);
    }

    /**
     * Sets a value in the `variables` scope of the context.
     * @param key - The variable key.
     * @param value - The value to set.
     */
    public setVariable(key: string, value: any): void {
        this.context.variables[key] = value;
    }

    /**
     * Retrieves a secret value by its key.
     * @param key - The key of the secret to retrieve.
     * @returns The secret string or undefined if not found.
     */
    public getSecret(key: string): string | undefined {
        return this.context.secrets[key];
    }

    /**
     * Adds or updates a secret in the context.
     * @param key - The key for the secret.
     * @param value - The secret value.
     */
    public setSecret(key: string, value: string): void {
        this.context.secrets[key] = value;
    }

    /**
     * Stores the output of a completed workflow step.
     * @param stepId - The unique identifier of the step.
     * @param output - The output data from the step.
     */
    public setStepOutput(stepId: string, output: IStepOutput): void {
        this.context.steps[stepId] = output;
    }

    /**
     * Retrieves the full output object for a specific step.
     * @param stepId - The unique identifier of the step.
     * @returns The step output object or undefined if the step hasn't run.
     */
    public getStepOutput(stepId: string): IStepOutput | undefined {
        return this.context.steps[stepId];
    }

    /**
     * Resolves template placeholders within a given data structure (string, object, array).
     * Placeholders should be in the format `{{ path.to.value }}`.
     * Example: `Hello, {{ variables.name }}` becomes `Hello, John`.
     * @param template - The data structure containing templates to resolve.
     * @returns A new data structure with all templates resolved.
     */
    public resolve(template: any): any {
        if (typeof template === 'string') {
            return this.resolveString(template);
        }

        if (Array.isArray(template)) {
            return template.map(item => this.resolve(item));
        }

        if (typeof template === 'object' && template !== null) {
            const resolvedObject: Record<string, any> = {};
            for (const key in template) {
                if (Object.prototype.hasOwnProperty.call(template, key)) {
                    resolvedObject[key] = this.resolve(template[key]);
                }
            }
            return resolvedObject;
        }

        // Return non-templatable types as-is
        return template;
    }

    /**
     * Resolves template placeholders within a single string.
     * If the string is a single placeholder (e.g., `{{steps.step1.output}}`), it returns the resolved value in its original type.
     * Otherwise, it returns a string with all placeholders substituted.
     * @param templateString - The string to resolve.
     * @returns The resolved value or string.
     */
    private resolveString(templateString: string): any {
        // Regex to match a string that is ONLY a single placeholder, e.g., "{{ variables.name }}"
        const singleTemplateRegex = /^{{\s*([\w.-]+)\s*}}$/;
        const singleMatch = templateString.match(singleTemplateRegex);

        if (singleMatch) {
            const path = singleMatch[1];
            // Return the value with its original type (e.g., object, number, boolean).
            // Return undefined if not found, rather than an empty string.
            return this.get(path, undefined);
        }

        // Regex to find all placeholders in a string, e.g., "Hello {{ variables.name }}!"
        const globalTemplateRegex = /{{\s*([\w.-]+)\s*}}/g;
        return templateString.replace(globalTemplateRegex, (match, path) => {
            const value = this.get(path);
            if (value === undefined || value === null) {
                // Replace with empty string if value not found to avoid "undefined" or "null" in strings.
                return '';
            }
            if (typeof value === 'object') {
                // Stringify objects to avoid "[object Object]" in the final string.
                return JSON.stringify(value);
            }
            return String(value);
        });
    }
}