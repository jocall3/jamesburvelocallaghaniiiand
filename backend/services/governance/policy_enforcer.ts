import { Policy, PolicyRule, EnforcementAction, ResourceDescriptor } from '../../models/Policy';
import { AccessRequest, ResourceOwner } from '../../models/Access';
import { Logger } from '../../utils/logger';

/**
 * PolicyEnforcer: Logic engine to enforce data sharing and ethical boundaries
 * across the connected service mesh.
 *
 * This service determines if a given access request is permissible based on
 * defined organizational policies, regulatory compliance rules, and ethical guidelines.
 */
export class PolicyEnforcer {
    private policies: Policy[] = [];

    constructor() {
        // In a real application, policies would be loaded dynamically from a database
        // or a configuration service.
        this.loadDefaultPolicies();
    }

    /**
     * Loads default, hardcoded policies for demonstration.
     */
    private loadDefaultPolicies() {
        Logger.info('PolicyEnforcer: Loading default governance policies.');

        // 1. PII Data Sharing Policy (Strict)
        this.policies.push({
            id: 'pii-strict-share',
            name: 'Strict PII Data Sharing',
            description: 'PII (e.g., User email) cannot be shared across service boundaries unless explicitly authorized by Security/Compliance.',
            isActive: true,
            rules: [{
                condition: (request: AccessRequest) => 
                    request.resource.type === 'UserAccount' && 
                    request.resource.attributes.includes('email') &&
                    request.targetService.name !== 'IdentityService', // Identity service is the owner/sole manager
                action: EnforcementAction.DENY_HARD,
                justification: 'Attempted unauthorized PII sharing.'
            }]
        });

        // 2. Compute Engine API Access Policy (Limit high-risk APIs)
        this.policies.push({
            id: 'compute-api-limit',
            name: 'Compute Engine Sensitive Operations Limit',
            description: 'Only high-privilege services can perform instance deletion via compute.googleapis.com.',
            isActive: true,
            rules: [{
                condition: (request: AccessRequest) => 
                    request.resource.apiName === 'compute.googleapis.com' &&
                    request.resource.method === 'DeleteInstance' &&
                    !['ProvisioningService', 'MaintenanceScheduler'].includes(request.sourceService.name),
                action: EnforcementAction.NOTIFY_AND_DENY,
                justification: 'High-risk compute operation attempted by unauthorized service.'
            }]
        });

        // 3. Ethical Boundary Policy (Restrict usage based on data source)
        this.policies.push({
            id: 'ethical-ml-data-use',
            name: 'AI/ML Model Training Data Restriction',
            description: 'Data sourced from freebase.googleapis.com should not be used for ML model training, due to license constraints.',
            isActive: true,
            rules: [{
                condition: (request: AccessRequest) => 
                    request.targetService.name.includes('ML') && 
                    request.resource.attributes.includes('data_source:freebase.googleapis.com'),
                action: EnforcementAction.QUARANTINE_DATA,
                justification: 'Use of restricted data source for ML training.'
            }]
        });
    }

    /**
     * Executes the enforcement logic for a given access request.
     * @param request The detailed access request being evaluated.
     * @returns The resulting enforcement decision.
     */
    public async enforce(request: AccessRequest): Promise<{ action: EnforcementAction, justification: string }> {
        Logger.debug(`Enforcing policies for request: ${request.sourceService.name} -> ${request.resource.apiName}`);

        // Prioritize rules based on severity (Deny Hard > Deny > Notify/Log > Allow)
        const activeRules = this.policies
            .filter(p => p.isActive)
            .flatMap(p => p.rules);

        for (const rule of activeRules) {
            try {
                if (rule.condition(request)) {
                    Logger.warn(`Policy Violation: Policy Enforcer decided action ${rule.action} for request to ${request.resource.apiName}. Justification: ${rule.justification}`);
                    return {
                        action: rule.action,
                        justification: rule.justification
                    };
                }
            } catch (error) {
                Logger.error(`Error evaluating rule: ${error}. Defaulting to DENY_HARD for safety.`);
                return {
                    action: EnforcementAction.DENY_HARD,
                    justification: 'System error during policy evaluation.'
                };
            }
        }

        Logger.debug('No policies triggered. Allowing access (Action: ALLOW).');
        return {
            action: EnforcementAction.ALLOW,
            justification: 'Passed all governance checks.'
        };
    }

    /**
     * Adds a new policy to the enforcement engine (runtime operation).
     * @param policy The new policy to add.
     */
    public addPolicy(policy: Policy): void {
        this.policies.push(policy);
        Logger.info(`Added new policy: ${policy.name}`);
    }

    /**
     * Retrieves all currently loaded policies.
     */
    public getPolicies(): Policy[] {
        return this.policies;
    }
}