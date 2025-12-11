export interface ApplicationRecord {
    id: string;
    displayName: string;
    appId: string;
    createdDateTime: Date;
    applicationType: string;
    accountEnabled: boolean;
    applicationVisibility: string;
    assignmentRequired: boolean;
    isAppProxy: boolean;
}

export interface LifecyclePolicy {
    maxAgeDays: number;
    excludeMicrosoftApps: boolean;
    dryRun: boolean;
}

export interface AutomationReport {
    processedCount: number;
    disabledCount: number;
    skippedCount: number;
    errors: Array<{ appId: string; message: string }>;
    disabledAppIds: string[];
}

export interface IAppServiceClient {
    updateAppStatus(id: string, isEnabled: boolean): Promise<void>;
}

export class LifecycleAutomator {
    private client: IAppServiceClient;
    private defaultPolicy: LifecyclePolicy = {
        maxAgeDays: 90,
        excludeMicrosoftApps: true,
        dryRun: false
    };

    constructor(client: IAppServiceClient) {
        this.client = client;
    }

    /**
     * processing logic to identify and disable stale applications based on the provided policy.
     * @param apps List of application records to evaluate.
     * @param customPolicy Optional policy overrides.
     */
    public async processLifecycleRules(
        apps: ApplicationRecord[], 
        customPolicy?: Partial<LifecyclePolicy>
    ): Promise<AutomationReport> {
        const policy = { ...this.defaultPolicy, ...customPolicy };
        const report: AutomationReport = {
            processedCount: 0,
            disabledCount: 0,
            skippedCount: 0,
            errors: [],
            disabledAppIds: []
        };

        const thresholdDate = this.calculateThresholdDate(policy.maxAgeDays);

        for (const app of apps) {
            report.processedCount++;

            if (!this.isEligibleForDisabling(app, policy, thresholdDate)) {
                report.skippedCount++;
                continue;
            }

            try {
                if (!policy.dryRun) {
                    await this.client.updateAppStatus(app.id, false);
                }
                report.disabledCount++;
                report.disabledAppIds.push(app.id);
            } catch (error) {
                report.errors.push({
                    appId: app.appId,
                    message: error instanceof Error ? error.message : 'Unknown error during status update'
                });
            }
        }

        return report;
    }

    /**
     * Determines if a specific app meets the criteria for being disabled.
     */
    private isEligibleForDisabling(app: ApplicationRecord, policy: LifecyclePolicy, thresholdDate: Date): boolean {
        // 1. If already disabled, skip
        if (!app.accountEnabled) {
            return false;
        }

        // 2. Check exclusion rules (e.g., Microsoft First Party Apps)
        if (policy.excludeMicrosoftApps && this.isMicrosoftApp(app)) {
            return false;
        }

        // 3. Critical Infrastructure Protection (Hardcoded safeguards)
        if (this.isCriticalApp(app)) {
            return false;
        }

        // 4. Age Check (Created before threshold)
        // Note: Ideally coupled with LastSignInDate, but using CreatedDate as per available schema
        if (app.createdDateTime > thresholdDate) {
            return false; // Too new to be considered stale based on creation
        }

        return true;
    }

    private isMicrosoftApp(app: ApplicationRecord): boolean {
        return app.applicationType === 'Microsoft Application' || app.displayName.startsWith('Microsoft');
    }

    private isCriticalApp(app: ApplicationRecord): boolean {
        const criticalKeywords = ['Azure', 'Windows', 'Office 365', 'Intune', 'Graph', 'Security', 'Defender'];
        return criticalKeywords.some(keyword => app.displayName.includes(keyword));
    }

    private calculateThresholdDate(days: number): Date {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    }
}