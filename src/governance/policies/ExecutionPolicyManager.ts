class ExecutionPolicyManager {
    constructor() {
        this.policies = [];
    }

    /**
     * Registers a new execution policy.
     * @param {object} policy - The policy object to register. Must define `canExecute(action, context)`
     */
    registerPolicy(policy) {
        if (typeof policy.canExecute !== 'function') {
            throw new Error("Policy must have a 'canExecute' method.");
        }
        this.policies.push(policy);
        console.log(`Policy registered: ${policy.name || 'Unnamed Policy'}`);
    }

    /**
     * Checks if an autonomous action is allowed to execute based on all registered policies.
     * @param {string} action - The action being requested (e.g., 'CREATE_ACCOUNT', 'TRANSFER_FUNDS').
     * @param {object} context - Contextual information relevant to the execution (e.g., user ID, time of day, current system state).
     * @returns {boolean} True if all policies allow execution, false otherwise.
     */
    canExecute(action, context) {
        if (this.policies.length === 0) {
            console.warn("No execution policies registered. Allowing execution by default.");
            return true;
        }

        for (const policy of this.policies) {
            try {
                const result = policy.canExecute(action, context);
                if (!result) {
                    console.log(`Execution blocked by policy: ${policy.name || 'Unnamed Policy'} for action: ${action}`);
                    return false;
                }
            } catch (error) {
                console.error(`Error executing policy ${policy.name || 'Unnamed Policy'}:`, error);
                // Depending on requirements, you might fail safe (return false) or continue if policy failure means exclusion.
                // Here, we fail safe: if a policy throws, we block execution.
                return false;
            }
        }

        console.log(`Execution allowed for action: ${action} after passing ${this.policies.length} policies.`);
        return true;
    }

    /**
     * Clears all registered policies.
     */
    clearPolicies() {
        this.policies = [];
        console.log("All execution policies cleared.");
    }
}

export const executionPolicyManager = new ExecutionPolicyManager();