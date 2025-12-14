/**
 * lib/RulesEngine.ts
 *
 * A high-fidelity rules engine for defining and executing complex business policies and compliance rules.
 * It supports declarative rule definitions, custom operators, custom actions, and priority-based execution.
 */

// --- 1. Interfaces for Rule Definition ---

/**
 * Represents a single condition within a rule.
 * Conditions can use 'fact', 'operator', and 'value' to compare data,
 * or 'all'/'any' for nested logical grouping (AND/OR).
 */
export interface Condition {
    /** The path to the fact to evaluate, e.g., "user.age" or "order.total". */
    fact?: string;
    /** The operator to use for comparison, e.g., "equal", "greaterThan", "in". */
    operator?: string;
    /** The value to compare the fact against. */
    value?: any;
    /** Optional path to another fact for comparison, e.g., "factA" operator "factB.value". */
    path?: string;
    /** Additional parameters for custom operators. */
    params?: Record<string, any>;
    /** Nested conditions for AND logic. All sub-conditions must be true. */
    all?: Condition[];
    /** Nested conditions for OR logic. At least one sub-condition must be true. */
    any?: Condition[];
}

/**
 * Represents an event that is emitted when a rule's conditions are met.
 * This can be used to signal that a policy was violated, a discount applied, etc.
 */
export interface RuleEvent {
    /** The type of event, e.g., "policyViolated", "discountApplied". */
    type: string;
    /** Parameters associated with the event, providing context. */
    params?: Record<string, any>;
}

/**
 * Represents an action to be executed when a rule fires or fails.
 * Actions can perform side effects like logging, sending notifications, or triggering workflows.
 */
export interface RuleAction {
    /** The type of action, e.g., "log", "sendNotification", "triggerWorkflow". */
    type: string;
    /** Parameters for the action, specific to its type. */
    params?: Record<string, any>;
}

/**
 * Defines the structure of a business rule.
 */
export interface Rule {
    /** A unique identifier for the rule. */
    id: string;
    /** A human-readable name for the rule. */
    name: string;
    /** An optional description of the rule's purpose. */
    description?: string;
    /**
     * Priority of the rule. Higher numbers mean higher priority.
     * Rules are evaluated in descending order of priority.
     * Default is 0.
     */
    priority?: number;
    /**
     * The conditions that must be met for the rule to fire.
     * Can use 'all' (AND) or 'any' (OR) for complex logical grouping.
     */
    conditions: {
        all?: Condition[];
        any?: Condition[];
    };
    /** The event to emit when the rule fires. */
    event: RuleEvent;
    /** Optional actions to execute if the rule's conditions are met. */
    onSuccess?: RuleAction[];
    /** Optional actions to execute if the rule's conditions are NOT met. */
    onFailure?: RuleAction[];
    /** Whether the rule is enabled. Default is true. Disabled rules are skipped. */
    enabled?: boolean;
}

/**
 * The result of a single rule's evaluation.
 */
export interface RuleResult {
    ruleId: string;
    ruleName: string;
    conditionsMet: boolean;
    event?: RuleEvent;
    executedActions?: RuleAction[];
    error?: string; // Error message if rule evaluation failed
}

// --- 2. Core Engine Components ---

/**
 * Type for a custom operator function.
 * Operators define how two values (a fact value and a rule value) are compared.
 * @param factValue The value retrieved from the facts object based on `condition.fact`.
 * @param ruleValue The value defined in the rule's condition (`condition.value`) or another fact's value (`condition.path`).
 * @param params Additional parameters from the condition (`condition.params`).
 * @returns True if the condition is met, false otherwise.
 */
export type OperatorFunction = (factValue: any, ruleValue: any, params?: Record<string, any>) => boolean;

/**
 * Type for a custom action function.
 * Actions are executed when a rule fires or fails. They can perform side effects.
 * @param params Parameters defined in the rule's action (`RuleAction.params`).
 * @param facts The current set of facts against which the rules were run.
 * @returns A Promise that resolves when the action is complete, or void for synchronous actions.
 */
export type ActionFunction = (params: Record<string, any>, facts: Record<string, any>) => Promise<void> | void;

/**
 * Options for initializing the RulesEngine.
 */
export interface RulesEngineOptions {
    /** Custom operators to register, extending or overriding default operators. */
    customOperators?: Record<string, OperatorFunction>;
    /** Custom actions to register, extending or overriding default actions. */
    customActions?: Record<string, ActionFunction>;
    /**
     * A logger instance conforming to a basic console-like interface.
     * Defaults to `console` if not provided.
     */
    logger?: {
        info: (...args: any[]) => void;
        warn: (...args: any[]) => void;
        error: (...args: any[]) => void;
        debug: (...args: any[]) => void;
    };
}

/**
 * A high-fidelity rules engine for defining and executing complex business policies and compliance rules.
 * It provides a flexible and extensible framework for declarative rule management.
 */
export class RulesEngine {
    private rules: Rule[] = [];
    private operators: Record<string, OperatorFunction> = {};
    private actions: Record<string, ActionFunction> = {};
    private logger: NonNullable<RulesEngineOptions['logger']>;

    constructor(options?: RulesEngineOptions) {
        this.logger = options?.logger || console; // Default to console logger
        this.registerDefaultOperators();
        this.registerDefaultActions();

        // Register custom operators and actions provided in options
        if (options?.customOperators) {
            for (const name in options.customOperators) {
                this.registerOperator(name, options.customOperators[name]);
            }
        }
        if (options?.customActions) {
            for (const name in options.customActions) {
                this.registerAction(name, options.customActions[name]);
            }
        }
    }

    /**
     * Registers a new operator with the engine.
     * This allows extending the engine with custom comparison logic.
     * @param name The unique name of the operator (e.g., "greaterThan").
     * @param fn The function that implements the operator's logic.
     */
    public registerOperator(name: string, fn: OperatorFunction): void {
        if (this.operators[name]) {
            this.logger.warn(`RulesEngine: Operator "${name}" is being overwritten.`);
        }
        this.operators[name] = fn;
        this.logger.debug(`RulesEngine: Operator "${name}" registered.`);
    }

    /**
     * Registers a new action with the engine.
     * This allows extending the engine with custom side-effect logic.
     * @param name The unique name of the action (e.g., "sendEmail").
     * @param fn The function that implements the action's logic.
     */
    public registerAction(name: string, fn: ActionFunction): void {
        if (this.actions[name]) {
            this.logger.warn(`RulesEngine: Action "${name}" is being overwritten.`);
        }
        this.actions[name] = fn;
        this.logger.debug(`RulesEngine: Action "${name}" registered.`);
    }

    /**
     * Adds a single rule to the engine. If a rule with the same ID already exists, it will be updated.
     * Rules are automatically sorted by priority after addition.
     * @param rule The rule to add.
     * @throws Error if the rule does not have an 'id'.
     */
    public addRule(rule: Rule): void {
        if (!rule.id) {
            throw new Error('RulesEngine: Rule must have an "id" property.');
        }
        if (this.rules.some(r => r.id === rule.id)) {
            this.logger.warn(`RulesEngine: Rule with ID "${rule.id}" already exists and will be updated.`);
            this.rules = this.rules.filter(r => r.id !== rule.id);
        }
        this.rules.push(rule);
        // Sort rules by priority in descending order (higher priority first)
        this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        this.logger.debug(`RulesEngine: Rule "${rule.name}" (ID: ${rule.id}) added.`);
    }

    /**
     * Adds multiple rules to the engine.
     * @param rules An array of rules to add.
     */
    public addRules(rules: Rule[]): void {
        rules.forEach(rule => this.addRule(rule));
    }

    /**
     * Removes a rule by its ID.
     * @param ruleId The ID of the rule to remove.
     * @returns True if the rule was found and removed, false otherwise.
     */
    public removeRule(ruleId: string): boolean {
        const initialLength = this.rules.length;
        this.rules = this.rules.filter(rule => rule.id !== ruleId);
        if (this.rules.length < initialLength) {
            this.logger.debug(`RulesEngine: Rule with ID "${ruleId}" removed.`);
            return true;
        }
        this.logger.warn(`RulesEngine: Rule with ID "${ruleId}" not found for removal.`);
        return false;
    }

    /**
     * Executes all registered rules against the provided facts.
     * Rules are evaluated in order of priority.
     * @param facts The data (facts) to evaluate the rules against. This object should be immutable during a single run.
     * @returns A promise that resolves to an array of RuleResult objects, detailing the outcome of each rule.
     */
    public async run(facts: Record<string, any>): Promise<RuleResult[]> {
        this.logger.info('RulesEngine: Starting rule evaluation.', { facts });
        const results: RuleResult[] = [];

        for (const rule of this.rules) {
            if (rule.enabled === false) {
                this.logger.debug(`RulesEngine: Rule "${rule.name}" (ID: ${rule.id}) is disabled. Skipping.`);
                continue;
            }

            const ruleResult: RuleResult = {
                ruleId: rule.id,
                ruleName: rule.name,
                conditionsMet: false,
            };

            try {
                const conditionsMet = await this.evaluateConditions(rule.conditions, facts);
                ruleResult.conditionsMet = conditionsMet;

                if (conditionsMet) {
                    this.logger.info(`RulesEngine: Rule "${rule.name}" (ID: ${rule.id}) conditions met.`, { event: rule.event });
                    ruleResult.event = rule.event;
                    ruleResult.executedActions = await this.executeActions(rule.onSuccess || [], facts);
                } else {
                    this.logger.debug(`RulesEngine: Rule "${rule.name}" (ID: ${rule.id}) conditions NOT met.`);
                    ruleResult.executedActions = await this.executeActions(rule.onFailure || [], facts);
                }
            } catch (error: any) {
                this.logger.error(`RulesEngine: Error evaluating rule "${rule.name}" (ID: ${rule.id}):`, error);
                ruleResult.error = error.message;
            }
            results.push(ruleResult);
        }
        this.logger.info('RulesEngine: Rule evaluation complete.');
        return results;
    }

    /**
     * Evaluates a set of conditions, supporting 'all' (AND) and 'any' (OR) logic.
     * @param conditions The conditions object (can contain 'all' or 'any').
     * @param facts The facts to evaluate against.
     * @returns A promise that resolves to true if conditions are met, false otherwise.
     */
    private async evaluateConditions(conditions: { all?: Condition[]; any?: Condition[] }, facts: Record<string, any>): Promise<boolean> {
        if (conditions.all) {
            // All conditions must be true (AND logic)
            for (const condition of conditions.all) {
                if (!(await this.evaluateCondition(condition, facts))) {
                    return false;
                }
            }
            return true;
        } else if (conditions.any) {
            // At least one condition must be true (OR logic)
            for (const condition of conditions.any) {
                if (await this.evaluateCondition(condition, facts)) {
                    return true;
                }
            }
            return false;
        }
        return false; // No conditions defined, or empty 'all'/'any'
    }

    /**
     * Evaluates a single condition. This can be a simple fact-operator-value comparison
     * or a nested 'all'/'any' condition.
     * @param condition The condition to evaluate.
     * @param facts The facts to evaluate against.
     * @returns A promise that resolves to true if the condition is met, false otherwise.
     */
    private async evaluateCondition(condition: Condition, facts: Record<string, any>): Promise<boolean> {
        if (condition.all || condition.any) {
            // Handle nested conditions recursively
            return this.evaluateConditions(condition as { all?: Condition[]; any?: Condition[] }, facts);
        }

        const { fact, operator, value, path, params } = condition;

        if (!fact || !operator) {
            this.logger.warn('RulesEngine: Invalid condition: "fact" and "operator" are required for simple conditions.', condition);
            return false;
        }

        const operatorFn = this.operators[operator];
        if (!operatorFn) {
            this.logger.error(`RulesEngine: Unknown operator: "${operator}" in condition.`, condition);
            return false;
        }

        try {
            const factValue = this.getFactValue(facts, fact);
            // If 'path' is provided, compare the primary fact to another fact's value.
            // Otherwise, compare to the literal 'value' provided in the condition.
            const ruleValue = path ? this.getFactValue(facts, path) : value;

            const result = operatorFn(factValue, ruleValue, params);
            this.logger.debug(`RulesEngine: Condition "${fact} ${operator} ${JSON.stringify(ruleValue)}" evaluated to ${result} (Fact Value: ${JSON.stringify(factValue)})`);
            return result;
        } catch (error: any) {
            this.logger.error(`RulesEngine: Error evaluating condition "${fact} ${operator} ${JSON.stringify(value || path)}":`, error);
            return false;
        }
    }

    /**
     * Executes an array of actions. Actions are executed sequentially.
     * @param actions The actions to execute.
     * @param facts The current facts.
     * @returns A promise that resolves to the list of successfully executed actions.
     */
    private async executeActions(actions: RuleAction[], facts: Record<string, any>): Promise<RuleAction[]> {
        const executed: RuleAction[] = [];
        for (const action of actions) {
            const actionFn = this.actions[action.type];
            if (!actionFn) {
                this.logger.error(`RulesEngine: Unknown action type: "${action.type}". Skipping action.`, action);
                continue;
            }
            try {
                this.logger.debug(`RulesEngine: Executing action "${action.type}" with params:`, action.params);
                // Ensure async actions are awaited, and sync actions are wrapped in a Promise.resolve
                await Promise.resolve(actionFn(action.params || {}, facts));
                executed.push(action);
            } catch (error: any) {
                this.logger.error(`RulesEngine: Error executing action "${action.type}":`, error);
            }
        }
        return executed;
    }

    /**
     * Safely retrieves a nested value from an object using a dot-separated path.
     * Returns `undefined` if any part of the path does not exist or is not an object.
     * @param obj The object to traverse.
     * @param path The dot-separated path (e.g., "user.address.city").
     * @returns The value at the specified path, or `undefined` if not found.
     */
    private getFactValue(obj: Record<string, any>, path: string): any {
        return path.split('.').reduce((current, key) => (current && typeof current === 'object' ? current[key] : undefined), obj);
    }

    /**
     * Registers a set of common, default operators.
     * These can be overridden by custom operators with the same name.
     */
    private registerDefaultOperators(): void {
        this.registerOperator('equal', (a, b) => a === b);
        this.registerOperator('notEqual', (a, b) => a !== b);
        this.registerOperator('greaterThan', (a, b) => a > b);
        this.registerOperator('greaterThanOrEqual', (a, b) => a >= b);
        this.registerOperator('lessThan', (a, b) => a < b);
        this.registerOperator('lessThanOrEqual', (a, b) => a <= b);
        this.registerOperator('in', (a, b) => Array.isArray(b) && b.includes(a));
        this.registerOperator('notIn', (a, b) => Array.isArray(b) && !b.includes(a));
        this.registerOperator('contains', (a, b) => Array.isArray(a) && a.includes(b)); // Array 'a' contains element 'b'
        this.registerOperator('notContains', (a, b) => Array.isArray(a) && !a.includes(b));
        this.registerOperator('startsWith', (a, b) => typeof a === 'string' && typeof b === 'string' && a.startsWith(b));
        this.registerOperator('endsWith', (a, b) => typeof a === 'string' && typeof b === 'string' && a.endsWith(b));
        this.registerOperator('matches', (a, b) => typeof a === 'string' && typeof b === 'string' && new RegExp(b).test(a)); // Regex match
        this.registerOperator('exists', (a) => a !== undefined && a !== null);
        this.registerOperator('doesNotExist', (a) => a === undefined || a === null);
        this.registerOperator('isEmpty', (a) => {
            if (a === null || a === undefined) return true;
            if (typeof a === 'string' || Array.isArray(a)) return a.length === 0;
            if (typeof a === 'object') return Object.keys(a).length === 0;
            return false;
        });
        this.registerOperator('isNotEmpty', (a) => {
            if (a === null || a === undefined) return false;
            if (typeof a === 'string' || Array.isArray(a)) return a.length > 0;
            if (typeof a === 'object') return Object.keys(a).length > 0;
            return true;
        });
    }

    /**
     * Registers a set of common, default actions.
     * These can be overridden by custom actions with the same name.
     */
    private registerDefaultActions(): void {
        this.registerAction('log', (params) => {
            this.logger.info('RulesEngine Action: Log', params);
        });
        this.registerAction('sendNotification', async (params) => {
            this.logger.info('RulesEngine Action: Sending notification...', params);
            // Simulate an asynchronous operation like sending an email or pushing to a message queue
            await new Promise(resolve => setTimeout(resolve, 50));
            this.logger.info('RulesEngine Action: Notification sent.', params);
        });
        // Placeholder for an action that might trigger an external workflow or update a system.
        // Note: Facts passed to `run` are treated as immutable for the duration of that call.
        // Any "update" action would typically trigger an external system or queue a change for a subsequent process.
        this.registerAction('triggerExternalWorkflow', (params, facts) => {
            this.logger.info('RulesEngine Action: Triggering external workflow.', { params, relevantFacts: facts });
            // In a real application, this would involve calling an API, publishing to a message broker, etc.
        });
    }
}