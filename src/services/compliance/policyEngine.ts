interface RuleCondition {
    target: 'header' | 'body' | 'path' | 'scope' | 'user';
    key: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'missing' | 'rateLimit';
    value?: string | number | string[];
}

interface PolicyRule {
    id: string;
    description: string;
    condition: RuleCondition;
    effect: 'ALLOW' | 'DENY' | 'CHALLENGE';
}

interface GovernancePolicy {
    name: string;
    appliesTo: 'CustomerProfile' | 'TokenAuthorization' | 'Products' | 'Rewards' | 'Global';
    rules: PolicyRule[];
}

interface EvaluationContext {
    apiPath: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers: Record<string, string>;
    body: Record<string, any>;
    resolvedScopes: string[];
    userProfile: {
        countryCode?: string;
        roles: string[];
        customerId?: string;
    }
}

interface EvaluationResult {
    policyName: string;
    ruleId: string;
    effect: 'ALLOW' | 'DENY' | 'CHALLENGE';
    message: string;
    isViolating: boolean;
}

const MOCK_POLICIES: GovernancePolicy[] = [
    {
        name: "GlobalSecurityCheck",
        appliesTo: "Global",
        rules: [
            {
                id: "G_R1_UUID_REQUIRED",
                description: "All transactional requests must include a UUID header.",
                condition: { target: "header", key: "uuid", operator: "missing" },
                effect: "CHALLENGE"
            }
        ]
    },
    {
        name: "CustomerProfileAccessMandatoryHeaders",
        appliesTo: "CustomerProfile",
        rules: [
            {
                id: "CP_R1_AUTH_REQUIRED",
                description: "Authorization header must be present.",
                condition: { target: "header", key: "authorization", operator: "missing" },
                effect: "DENY"
            },
            {
                id: "CP_R2_COUNTRY_CODE_REQUIRED",
                description: "Country code header must be present for customer lookup.",
                condition: { target: "header", key: "countrycode", operator: "missing" },
                effect: "DENY"
            }
        ]
    },
    {
        name: "ScopeBasedProfileRestriction",
        appliesTo: "CustomerProfile",
        rules: [
            {
                id: "CP_R3_SCOPE_CHECK",
                description: "Requires 'customers_profiles' scope to access details endpoint.",
                condition: { target: "scope", key: "customers_profiles", operator: "missing" },
                effect: "DENY"
            },
            {
                id: "CP_R4_US_ONLY_ACCESS",
                description: "Limit access to US accounts only.",
                condition: { target: "user", key: "countryCode", operator: "notEquals", value: "US" },
                effect: "CHALLENGE"
            }
        ]
    },
    {
        name: "TokenEndpointProtocolEnforcement",
        appliesTo: "TokenAuthorization",
        rules: [
            {
                id: "TKN_R1_CONTENT_TYPE_ENFORCEMENT",
                description: "Token endpoint must use application/x-www-form-urlencoded",
                condition: { target: "header", key: "content-type", operator: "notEquals", value: "application/x-www-form-urlencoded" },
                effect: "DENY"
            }
        ]
    }
];

/**
 * Logic engine that evaluates transactions against user-defined governance policies.
 */
export class PolicyEngine {
    private policies: GovernancePolicy[] = MOCK_POLICIES;

    /**
     * Determines which governance policy sets are applicable based on the API path.
     * @param context The request context.
     * @returns An array of applicable policies.
     */
    private determinePolicySet(context: EvaluationContext): GovernancePolicy[] {
        let applicationArea: GovernancePolicy['appliesTo'] | undefined;
        const path = context.apiPath;

        if (path.startsWith('/api/custmgmt/profiles/v1')) {
            applicationArea = 'CustomerProfile';
        } else if (path.startsWith('/api/identity/auth/v1')) {
            applicationArea = 'TokenAuthorization';
        } else if (path.startsWith('/api/productDirectory/v1')) {
            applicationArea = 'Products';
        } else if (path.includes('/rewards/shopWithPoints')) {
            applicationArea = 'Rewards';
        }

        const applicable = this.policies.filter(
            p => p.appliesTo === 'Global' || p.appliesTo === applicationArea
        );
        return applicable;
    }

    /**
     * Checks if a single rule condition is met (i.e., if the rule is violated).
     * Returns true if the condition defined in the rule is met, triggering the rule's effect.
     */
    private checkCondition(condition: RuleCondition, context: EvaluationContext): boolean {
        const { target, key, operator, value } = condition;
        let actualValue: any;

        const lookupKey = key.toLowerCase();

        switch (target) {
            case 'header':
                // Headers are normalized to lowercase for lookup
                actualValue = context.headers[lookupKey];
                break;
            case 'scope':
                // For scope, actualValue is a boolean indicating presence
                actualValue = context.resolvedScopes.includes(key);
                break;
            case 'path':
                actualValue = context.apiPath;
                break;
            case 'body':
                actualValue = context.body[key];
                break;
            case 'user':
                actualValue = context.userProfile[key as keyof EvaluationContext['userProfile']];
                break;
            default:
                return false;
        }

        // --- Operators Evaluation ---
        switch (operator) {
            case 'missing':
                if (target === 'scope') {
                    // Scope violation if scope is NOT present (actualValue is false)
                    return !actualValue;
                }
                // Check if value is null, undefined, or empty string
                return actualValue === undefined || actualValue === null || actualValue === '';

            case 'equals':
                // Case-insensitive comparison for strings
                if (typeof actualValue === 'string' && typeof value === 'string') {
                    return actualValue.toLowerCase() === (value as string).toLowerCase();
                }
                return actualValue === value;

            case 'notEquals':
                // Case-insensitive comparison for strings
                if (typeof actualValue === 'string' && typeof value === 'string') {
                    return actualValue.toLowerCase() !== (value as string).toLowerCase();
                }
                return actualValue !== value;

            case 'contains':
                if (Array.isArray(actualValue)) {
                    return actualValue.includes(value);
                }
                if (typeof actualValue === 'string' && typeof value === 'string') {
                    return actualValue.includes(value);
                }
                return false;

            case 'rateLimit':
                // Placeholder for complex stateful checks (e.g., querying external rate limiter)
                // Assuming violation if the external check returns true (mocked as always false)
                return false;

            default:
                return true; // Fail closed if operator is unsupported
        }
    }

    /**
     * Evaluates the context against applicable governance policies.
     * Rules are processed sequentially within their policy groups.
     * Processing stops immediately upon encountering a DENY result.
     *
     * @param context The transactional context to evaluate.
     * @returns The primary evaluation result (first DENY/CHALLENGE encountered, or ALLOW if compliant).
     */
    public evaluate(context: EvaluationContext): EvaluationResult {
        const applicablePolicies = this.determinePolicySet(context);

        for (const policy of applicablePolicies) {
            for (const rule of policy.rules) {
                const isViolating = this.checkCondition(rule.condition, context);

                if (isViolating) {
                    const result: EvaluationResult = {
                        policyName: policy.name,
                        ruleId: rule.id,
                        effect: rule.effect,
                        message: `Policy violation: ${rule.description}`,
                        isViolating: true
                    };

                    // DENY takes precedence and stops processing
                    if (rule.effect === 'DENY') {
                        return result;
                    }
                    // CHALLENGE also immediately returns the requirement but allows processing of subsequent DENY rules 
                    // (For this simplified engine, we treat CHALLENGE as a hard stop requiring external intervention).
                    if (rule.effect === 'CHALLENGE') {
                        return result;
                    }
                }
            }
        }

        // If no rules were violated, return ALLOW.
        return {
            policyName: "Overall Compliance",
            ruleId: "FINAL_EVALUATION",
            effect: "ALLOW",
            message: "Request is compliant with all governance policies.",
            isViolating: false
        };
    }
}

// Example Usage (for demonstration, normally this would be in tests or index)
if (require.main === module) {
    const engine = new PolicyEngine();

    // --- Scenario 1: Customer Profile access - Missing Headers (DENY expected) ---
    const context1: EvaluationContext = {
        apiPath: '/api/custmgmt/profiles/v1/accounts/1234/details',
        method: 'GET',
        headers: {
            'client_id': 'TEST_CLIENT',
            'accept': 'application/json'
            // Missing Authorization and countryCode
        },
        body: {},
        resolvedScopes: ['customers_profiles'],
        userProfile: { countryCode: 'US', roles: ['aggregator'] }
    };

    console.log("--- Scenario 1: Missing Auth Header ---");
    const result1 = engine.evaluate(context1);
    console.log(`Result: ${result1.effect} - ${result1.message}`);
    // Expected: DENY (CP_R1_AUTH_REQUIRED)

    // --- Scenario 2: Token Endpoint - Wrong Content Type (DENY expected) ---
    const context2: EvaluationContext = {
        apiPath: '/api/identity/auth/v1/oauth2/token/us/gcb',
        method: 'POST',
        headers: {
            'authorization': 'Basic XXX',
            'content-type': 'application/json' // Should be application/x-www-form-urlencoded
        },
        body: { grant_type: 'authorization_code' },
        resolvedScopes: [],
        userProfile: { countryCode: 'US', roles: [] }
    };

    console.log("\n--- Scenario 2: Wrong Content Type for Token Endpoint ---");
    const result2 = engine.evaluate(context2);
    console.log(`Result: ${result2.effect} - ${result2.message}`);
    // Expected: DENY (TKN_R1_CONTENT_TYPE_ENFORCEMENT)

    // --- Scenario 3: Compliant Customer Profile request (ALLOW expected) ---
    const context3: EvaluationContext = {
        apiPath: '/api/custmgmt/profiles/v1/accounts/1234/details',
        method: 'GET',
        headers: {
            'authorization': 'Bearer ABC',
            'client_id': 'TEST_CLIENT',
            'countrycode': 'US',
            'uuid': '128bitrandom'
        },
        body: {},
        resolvedScopes: ['customers_profiles', 'accounts_details_transactions'],
        userProfile: { countryCode: 'US', roles: ['aggregator'] }
    };

    console.log("\n--- Scenario 3: Compliant Request ---");
    const result3 = engine.evaluate(context3);
    console.log(`Result: ${result3.effect} - ${result3.message}`);
    // Expected: ALLOW (Final Evaluation)
    
    // --- Scenario 4: Missing UUID (CHALLENGE expected) ---
    const context4: EvaluationContext = {
        apiPath: '/api/productDirectory/v1/products',
        method: 'GET',
        headers: {
            'authorization': 'Bearer ABC',
            'client_id': 'TEST_CLIENT',
        },
        body: {},
        resolvedScopes: ['read_products'],
        userProfile: { countryCode: 'IN', roles: ['aggregator'] }
    };

    console.log("\n--- Scenario 4: Missing UUID (Global Policy Check) ---");
    const result4 = engine.evaluate(context4);
    console.log(`Result: ${result4.effect} - ${result4.message}`);
    // Expected: CHALLENGE (G_R1_UUID_REQUIRED)
}