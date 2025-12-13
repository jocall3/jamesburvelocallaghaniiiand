/*
 * Copyright (c) 2024, The Autonomous Architect Ecosystem
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @file This file defines the core configuration for the Ethical Guardrails service.
 * It includes type definitions for policies, sensitivity levels, actions, and
 * default policy sets that can be used to bootstrap the guardrail engine.
 * This configuration is designed to be serializable and environment-agnostic.
 */

// ============================================================================
// Core Enumerations and Types
// ============================================================================

/**
 * Defines the broad categories of ethical concerns the guardrails can address.
 * 'CUSTOM' allows for user-defined categories not covered by the standard set.
 */
export enum PolicyCategory {
    HATE_SPEECH = 'HATE_SPEECH',
    SELF_HARM = 'SELF_HARM',
    VIOLENCE = 'VIOLENCE',
    MISINFORMATION = 'MISINFORMATION',
    ILLEGAL_ACTIVITIES = 'ILLEGAL_ACTIVITIES',
    PRIVACY_VIOLATION = 'PRIVACY_VIOLATION',
    ADULT_CONTENT = 'ADULT_CONTENT',
    INTELLECTUAL_PROPERTY = 'INTELLECTUAL_PROPERTY',
    UNFAIR_BIAS = 'UNFAIR_BIAS',
    FINANCIAL_ADVICE = 'FINANCIAL_ADVICE',
    LEGAL_ADVICE = 'LEGAL_ADVICE',
    MEDICAL_ADVICE = 'MEDICAL_ADVICE',
    CUSTOM = 'CUSTOM',
}

/**
 * Represents the severity of a policy violation.
 * This ordered enum allows for escalating responses based on risk.
 */
export enum SensitivityLevel {
    LEVEL_1_INFO = 'LEVEL_1_INFO',
    LEVEL_2_LOW = 'LEVEL_2_LOW',
    LEVEL_3_MEDIUM = 'LEVEL_3_MEDIUM',
    LEVEL_4_HIGH = 'LEVEL_4_HIGH',
    LEVEL_5_CRITICAL = 'LEVEL_5_CRITICAL',
}

/**
 * Defines the set of possible actions the guardrail engine can take in response to a policy violation.
 */
export enum ActionType {
    ALLOW = 'ALLOW',
    LOG = 'LOG',
    ALERT = 'ALERT',
    REDACT = 'REDACT',
    BLOCK = 'BLOCK',
    QUARANTINE = 'QUARANTINE',
    REDIRECT = 'REDIRECT',
    THROTTLE = 'THROTTLE',
}

/**
 * Standardized jurisdiction codes. Used for applying region-specific policies.
 * This is not an exhaustive list and can be extended.
 */
export type JurisdictionCode = 'GLOBAL' | 'EU' | 'US-CA' | 'US' | 'CN' | 'IN';

// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * Defines a single action to be taken, including its type and any necessary parameters.
 */
export interface PolicyAction {
    /** The type of action to perform. */
    type: ActionType;
    /** Optional parameters for the action. E.g., for ALERT, { channel: 'security-alerts' }. */
    params?: Record<string, any>;
}

/**
 * Defines the rules for a specific sensitivity level within a policy,
 * including the confidence threshold and the actions to take.
 */
export interface SensitivityRule {
    /** The sensitivity level this rule applies to. */
    level: SensitivityLevel;
    /** An array of actions to execute when this rule is triggered. */
    actions: PolicyAction[];
    /**
     * The confidence score threshold (0.0 to 1.0) from a detection model
     * required to trigger this rule. If undefined, any detection triggers it.
     */
    threshold?: number;
}

/**
 * Represents a single, atomic guardrail policy.
 */
export interface PolicyDefinition {
    /** A unique identifier for the policy, e.g., 'hate-speech-racial'. */
    id: string;
    /** The category this policy belongs to. */
    category: PolicyCategory;
    /** A human-readable description of what the policy guards against. */
    description: string;
    /** Whether this policy is currently active. */
    enabled: boolean;
    /** An ordered list of rules for different sensitivity levels. The engine should evaluate them in order. */
    rules: SensitivityRule[];
    /** Optional tags for filtering, grouping, and reporting. */
    tags?: string[];
    /**
     * Configuration for the external service or internal logic used to detect this violation.
     * This provides an abstraction layer over different AI vendors.
     */
    detector?: {
        /** The provider of the detection service, e.g., 'openai-moderation', 'google-perspective', 'custom-regex'. */
        provider: string;
        /** The specific model or endpoint to use, if applicable. */
        model?: string;
        /** Provider-specific configuration parameters. */
        config?: Record<string, any>;
    };
}

/**
 * A collection of policies that form a coherent guardrail strategy.
 * Policy sets can be versioned and applied to different applications or jurisdictions.
 */
export interface PolicySet {
    /** A unique identifier for the policy set, e.g., 'default-strict-v1.2'. */
    id: string;
    /** A user-friendly name for the policy set. */
    name: string;
    /** A detailed description of the policy set's purpose and risk appetite. */
    description: string;
    /** A map of policy definitions included in this set, keyed by their unique ID. */
    policies: Record<string, PolicyDefinition>;
}

/**
 * The top-level configuration for the Ethical Guardrails service.
 */
export interface GuardrailsConfig {
    /** A map of all available policy sets, keyed by their ID. */
    policySets: Record<string, PolicySet>;
    /**
     * A mapping from jurisdiction codes to the ID of the policy set that should be applied.
     * The 'GLOBAL' key serves as the default.
     */
    jurisdictionalMap: Record<JurisdictionCode | 'GLOBAL', string>;
    /** The ID of the default policy set to use if no jurisdiction matches. */
    defaultPolicySetId: string;
}

// ============================================================================
// Default Policy Definitions and Sets
// ============================================================================

/**
 * A balanced, general-purpose policy set suitable for most applications.
 * It prioritizes safety while minimizing false positives.
 */
export const BALANCED_POLICY_SET: PolicySet = {
    id: 'default-balanced-v1',
    name: 'Default Balanced',
    description: 'A standard set of guardrails for general-purpose AI applications. Balances safety with user experience.',
    policies: {
        'hate-speech': {
            id: 'hate-speech',
            category: PolicyCategory.HATE_SPEECH,
            description: 'Detects and mitigates language that expresses hatred or promotes violence against individuals or groups based on protected characteristics.',
            enabled: true,
            detector: { provider: 'openai-moderation', config: { categories: ['hate', 'hate/threatening'] } },
            tags: ['safety', 'content-moderation'],
            rules: [
                { level: SensitivityLevel.LEVEL_3_MEDIUM, threshold: 0.6, actions: [{ type: ActionType.LOG }] },
                { level: SensitivityLevel.LEVEL_4_HIGH, threshold: 0.8, actions: [{ type: ActionType.LOG }, { type: ActionType.ALERT, params: { channel: 'moderation-review' } }] },
                { level: SensitivityLevel.LEVEL_5_CRITICAL, threshold: 0.95, actions: [{ type: ActionType.BLOCK }, { type: ActionType.ALERT, params: { channel: 'security-critical' } }] },
            ],
        },
        'self-harm': {
            id: 'self-harm',
            category: PolicyCategory.SELF_HARM,
            description: 'Identifies content that encourages or provides instructions on how to self-harm or commit suicide.',
            enabled: true,
            detector: { provider: 'anthropic-constitutional-ai', model: 'self-harm-clause' },
            tags: ['safety', 'user-wellbeing'],
            rules: [
                { level: SensitivityLevel.LEVEL_4_HIGH, threshold: 0.7, actions: [{ type: ActionType.LOG }, { type: ActionType.REDIRECT, params: { message: 'It sounds like you are going through a difficult time. Please consider reaching out to a support hotline.' } }] },
                { level: SensitivityLevel.LEVEL_5_CRITICAL, threshold: 0.9, actions: [{ type: ActionType.BLOCK }, { type: ActionType.ALERT, params: { channel: 'emergency-response' } }] },
            ],
        },
        'pii-detection': {
            id: 'pii-detection',
            category: PolicyCategory.PRIVACY_VIOLATION,
            description: 'Detects and redacts common forms of Personally Identifiable Information (PII) like phone numbers, email addresses, and social security numbers.',
            enabled: true,
            detector: { provider: 'google-dlp', config: { infoTypes: ['PHONE_NUMBER', 'EMAIL_ADDRESS', 'US_SOCIAL_SECURITY_NUMBER'] } },
            tags: ['privacy', 'compliance', 'gdpr', 'ccpa'],
            rules: [
                { level: SensitivityLevel.LEVEL_3_MEDIUM, threshold: 0.8, actions: [{ type: ActionType.REDACT, params: { redaction_char: '[REDACTED]' } }, { type: ActionType.LOG }] },
            ],
        },
        'financial-advice': {
            id: 'financial-advice',
            category: PolicyCategory.FINANCIAL_ADVICE,
            description: 'Prevents the model from giving explicit financial advice, which it is not qualified to do.',
            enabled: true,
            detector: { provider: 'custom-regex', config: { patterns: ['(buy|sell|invest in) (stock|crypto|bond)', 'guaranteed return'] } },
            tags: ['legal', 'compliance', 'risk-management'],
            rules: [
                { level: SensitivityLevel.LEVEL_4_HIGH, actions: [{ type: ActionType.BLOCK }, { type: ActionType.REDIRECT, params: { message: 'I am an AI and cannot provide financial advice. Please consult a qualified professional.' } }] },
            ],
        },
    },
};

/**
 * A strict policy set for high-risk, regulated, or public-facing applications.
 * It has lower thresholds and more aggressive actions to minimize risk.
 */
export const STRICT_POLICY_SET: PolicySet = {
    id: 'default-strict-v1',
    name: 'Default Strict',
    description: 'A highly restrictive set of guardrails for applications in regulated industries or those with high public visibility. Prioritizes safety and compliance above all.',
    policies: {
        ...BALANCED_POLICY_SET.policies,
        'hate-speech': {
            ...BALANCED_POLICY_SET.policies['hate-speech'],
            description: 'STRICT: Detects and mitigates language that expresses hatred or promotes violence against individuals or groups based on protected characteristics.',
            rules: [
                { level: SensitivityLevel.LEVEL_2_LOW, threshold: 0.4, actions: [{ type: ActionType.LOG }] },
                { level: SensitivityLevel.LEVEL_3_MEDIUM, threshold: 0.6, actions: [{ type: ActionType.LOG }, { type: ActionType.ALERT, params: { channel: 'moderation-review' } }] },
                { level: SensitivityLevel.LEVEL_4_HIGH, threshold: 0.75, actions: [{ type: ActionType.BLOCK }, { type: ActionType.ALERT, params: { channel: 'security-critical' } }] },
            ],
        },
        'self-harm': {
            ...BALANCED_POLICY_SET.policies['self-harm'],
            description: 'STRICT: Identifies content that encourages or provides instructions on how to self-harm or commit suicide.',
            rules: [
                { level: SensitivityLevel.LEVEL_3_MEDIUM, threshold: 0.5, actions: [{ type: ActionType.LOG }, { type: ActionType.REDIRECT, params: { message: 'It sounds like you are going through a difficult time. Please consider reaching out to a support hotline.' } }] },
                { level: SensitivityLevel.LEVEL_5_CRITICAL, threshold: 0.8, actions: [{ type: ActionType.BLOCK }, { type: ActionType.ALERT, params: { channel: 'emergency-response' } }] },
            ],
        },
        'misinformation-public-health': {
            id: 'misinformation-public-health',
            category: PolicyCategory.MISINFORMATION,
            description: 'Detects and blocks harmful misinformation related to public health crises (e.g., pandemics, vaccine safety).',
            enabled: true,
            detector: { provider: 'custom-classifier', model: 'public-health-misinfo-v2' },
            tags: ['safety', 'public-trust', 'misinformation'],
            rules: [
                { level: SensitivityLevel.LEVEL_4_HIGH, threshold: 0.85, actions: [{ type: ActionType.BLOCK }, { type: ActionType.LOG }, { type: ActionType.REDIRECT, params: { message: 'This content may contain harmful misinformation. For accurate public health information, please consult official sources like the WHO or CDC.' } }] },
            ],
        },
        'unfair-bias-hiring': {
            id: 'unfair-bias-hiring',
            category: PolicyCategory.UNFAIR_BIAS,
            description: 'Detects biased language related to gender, race, or age in the context of hiring and recruitment.',
            enabled: true,
            detector: { provider: 'databricks-mosaic-ai', model: 'debias-classifier-v1' },
            tags: ['fairness', 'hr-tech', 'compliance'],
            rules: [
                { level: SensitivityLevel.LEVEL_3_MEDIUM, threshold: 0.7, actions: [{ type: ActionType.LOG }, { type: ActionType.ALERT, params: { channel: 'hr-compliance-review' } }] },
                { level: SensitivityLevel.LEVEL_4_HIGH, threshold: 0.9, actions: [{ type: ActionType.REDACT, params: { redaction_strategy: 'neutralize_language' } }, { type: ActionType.LOG }] },
            ],
        },
    },
};

/**
 * A policy set specifically designed for GDPR compliance in the EU.
 * It has a strong focus on PII and data privacy.
 */
export const EU_GDPR_POLICY_SET: PolicySet = {
    id: 'eu-gdpr-v1',
    name: 'EU GDPR Compliance',
    description: 'A policy set tailored to meet the stringent data privacy requirements of the GDPR in the European Union.',
    policies: {
        'pii-detection-eu': {
            id: 'pii-detection-eu',
            category: PolicyCategory.PRIVACY_VIOLATION,
            description: 'Detects and redacts a wide range of PII, with special attention to EU-specific identifiers.',
            enabled: true,
            detector: { provider: 'google-dlp', config: { 
                infoTypes: [
                    'PHONE_NUMBER', 'EMAIL_ADDRESS', 'IBAN_CODE', 'IP_ADDRESS', 
                    'PASSPORT', 'NATIONAL_ID_NUMBER'
                ],
                region: 'europe-west4'
            } },
            tags: ['privacy', 'compliance', 'gdpr'],
            rules: [
                { level: SensitivityLevel.LEVEL_4_HIGH, threshold: 0.75, actions: [{ type: ActionType.REDACT, params: { redaction_char: '[GDPR_REDACTED]' } }, { type: ActionType.LOG }] },
                { level: SensitivityLevel.LEVEL_5_CRITICAL, threshold: 0.95, actions: [{ type: ActionType.BLOCK }, { type: ActionType.ALERT, params: { channel: 'dpo-alerts' } }] },
            ],
        },
        'right-to-be-forgotten-trigger': {
            id: 'right-to-be-forgotten-trigger',
            category: PolicyCategory.PRIVACY_VIOLATION,
            description: 'Identifies phrases that may constitute a "right to be forgotten" request and flags them for a special workflow.',
            enabled: true,
            detector: { provider: 'custom-regex', config: { patterns: ['(delete|remove|forget) all my data', 'right to erasure'] } },
            tags: ['privacy', 'compliance', 'gdpr'],
            rules: [
                { level: SensitivityLevel.LEVEL_5_CRITICAL, actions: [{ type: ActionType.QUARANTINE }, { type: ActionType.ALERT, params: { channel: 'dpo-requests', workflow: 'rtbf-v1' } }] },
            ],
        },
    },
};


// ============================================================================
// Default Top-Level Configuration
// ============================================================================

/**
 * The default, out-of-the-box configuration for the Guardrails service.
 * This can be loaded at startup and overridden by environment-specific configurations.
 */
export const DEFAULT_GUARDRAILS_CONFIG: GuardrailsConfig = {
    policySets: {
        [BALANCED_POLICY_SET.id]: BALANCED_POLICY_SET,
        [STRICT_POLICY_SET.id]: STRICT_POLICY_SET,
        [EU_GDPR_POLICY_SET.id]: EU_GDPR_POLICY_SET,
    },
    jurisdictionalMap: {
        'GLOBAL': BALANCED_POLICY_SET.id,
        'EU': EU_GDPR_POLICY_SET.id,
        'US': STRICT_POLICY_SET.id, // Example: US might default to stricter for litigation risk
        'US-CA': STRICT_POLICY_SET.id,
        'CN': STRICT_POLICY_SET.id,
        'IN': BALANCED_POLICY_SET.id,
    },
    defaultPolicySetId: BALANCED_POLICY_SET.id,
};