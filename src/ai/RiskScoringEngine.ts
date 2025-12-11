export interface ApplicationRecord {
    id: string;
    displayName: string;
    appId: string;
    createdDateTime: string;
    applicationType: string;
    accountEnabled: string;
    applicationVisibility: string;
    assignmentRequired: string;
    isAppProxy: string;
}

export interface RiskAssessment {
    appId: string;
    displayName: string;
    score: number;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    reasons: string[];
}

export class RiskScoringEngine {
    /**
     * Calculates a risk score based on 'assignmentRequired' and visibility settings.
     * 
     * Scoring Logic:
     * - Base Score: 0
     * - Assignment Not Required: +60 points (High inherent risk as any user can access)
     * - Visible in Portal: 
     *    - If Assignment Not Required: +40 points (High exposure: visible + accessible)
     *    - If Assignment Required: +10 points (Standard visibility)
     * - Hidden: 0 points added for visibility
     * - Account Disabled: Score resets to 0 (No active risk)
     * 
     * Risk Levels:
     * - 80-100: Critical
     * - 60-79: High
     * - 20-59: Medium
     * - 0-19: Low
     */
    public evaluate(app: ApplicationRecord): RiskAssessment {
        let score = 0;
        const reasons: string[] = [];

        const assignmentRequired = app.assignmentRequired.toLowerCase() === 'true';
        const isVisible = app.applicationVisibility === 'Visible';
        const accountEnabled = app.accountEnabled.toLowerCase() === 'true';

        // If the account is disabled, the immediate risk is negligible
        if (!accountEnabled) {
            return {
                appId: app.appId,
                displayName: app.displayName,
                score: 0,
                riskLevel: 'Low',
                reasons: ['Account is disabled']
            };
        }

        // 1. Evaluate Assignment Requirement
        if (!assignmentRequired) {
            score += 60;
            reasons.push('User assignment is not required (Open access)');
        } else {
            reasons.push('User assignment is required');
        }

        // 2. Evaluate Visibility
        if (isVisible) {
            if (!assignmentRequired) {
                // High Risk combination: Visible to everyone and no assignment needed
                score += 40;
                reasons.push('Application is visible to all users while having open access');
            } else {
                // Normal operational visibility
                score += 10;
                reasons.push('Application is visible in My Apps portal');
            }
        } else {
            reasons.push('Application is hidden from My Apps portal');
        }

        return {
            appId: app.appId,
            displayName: app.displayName,
            score: score,
            riskLevel: this.determineRiskLevel(score),
            reasons: reasons
        };
    }

    private determineRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
        if (score >= 80) return 'Critical';
        if (score >= 60) return 'High';
        if (score >= 20) return 'Medium';
        return 'Low';
    }
}