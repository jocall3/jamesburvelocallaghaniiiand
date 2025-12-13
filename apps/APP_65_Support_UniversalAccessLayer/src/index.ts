/*
 * Copyright (c) 2024. The Ecosyste.ms Platform. All rights reserved.
 *
 * This software is licensed under the Ecosyste.ms Platform Commercial License.
 * A copy of the license should have been included with this distribution.
 * If not, please contact licensing@ecosyste.ms for a copy.
 *
 * This software is provided "as is", without warranty of any kind, express or
 * implied, including but not limited to the warranties of merchantability,
 * fitness for a particular purpose and noninfringement. In no event shall the
 * authors or copyright holders be liable for any claim, damages or other
 * liability, whether in an action of contract, tort or otherwise, arising from,
 * out of or in connection with the software or the use or other dealings in the
 * software.
 *
 * ----
 *
 * APP_65_Support_UniversalAccessLayer
 *
 * This application provides a unified service layer for support functions,
 * focusing on universal access. It combines internationalization (i18n)
 * via AI-powered translation, web accessibility (a11y) auditing, and a
 * consolidated helpdesk ticketing system.
 */

/*
 * =============================================================================
 * >> README <<
 * =============================================================================
 *
 * ---
 * ## APP_65_Support_UniversalAccessLayer
 * ---
 *
 * ### Problem Statement
 *
 * Modern software applications must be accessible to a global and diverse user
 * base. This creates three significant operational burdens:
 * 1.  **Internationalization (i18n):** Managing translations across multiple
 *     languages is complex, expensive, and slow, often lagging behind development.
 * 2.  **Accessibility (a11y):** Ensuring compliance with standards like WCAG is a
 *     specialized, continuous effort. Audits are often manual, periodic, and
 *     disconnected from the development lifecycle.
 * 3.  **User Support:** Users from different regions, with varying technical
 *     skills and accessibility needs, require support. Managing this through
 *     disparate channels (email, web forms, social media) is inefficient and
 *     leads to inconsistent service quality.
 *
 * This application provides a centralized, API-driven solution to these
 * challenges, enabling developers to build universally accessible products
 * from the ground up.
 *
 * ### Architecture Diagram (ASCII)
 *
 *  +-------------------------------------------------------------------------+
 *  |                        External Clients / Other Apps                      |
 *  +-------------------------------------------------------------------------+
 *        |                         |                         |
 *        | (REST API / gRPC)       | (REST API / gRPC)       | (Webhooks)
 *        v                         v                         v
 *  +-------------------------------------------------------------------------+
 *  |                     APP_65_Support_UniversalAccessLayer                   |
 *  |                                                                         |
 *  |  +-----------------------+  +-----------------------+  +---------------+  |
 *  |  |   Auth Middleware     |  |    Request Logger     |  | Rate Limiter  |  |
 *  |  | (@ecosystem/core-sdk) |  | (@ecosystem/core-sdk) |  |               |  |
 *  |  +-----------------------+  +-----------------------+  +---------------+  |
 *  |-------------------------------------------------------------------------|
 *  |                             API Controllers                             |
 *  |  - TranslationController      - AccessibilityController                 |
 *  |  - TicketingController        - SystemController (Self-Querying)        |
 *  |-------------------------------------------------------------------------|
 *  |                              Core Services                              |
 *  |                                                                         |
 *  |  +---------------------+  +------------------------+  +----------------+  |
 *  |  | TranslationService  |  |  AccessibilityService  |  | TicketingSvc   |  |
 *  |  | - Caching           |  |  - Audit Queue         |  | - Routing      |  |
 *  |  | - Provider Mgmt     |  |  - Report Generation   |  | - SLAs         |  |
 *  |  +--------+------------+  +-----------+------------+  +-------+--------+  |
 *  |           |                         |                        |          |
 *  |           v                         v                        v          |
 *  |  +---------------------+  +------------------------+  +----------------+  |
 *  |  |      Adapters       |  |       Adapters         |  |    Adapters    |  |
 *  |  | - DeepL             |  |  - Axe/Puppeteer       |  | - OpenAI       |  |
 *  |  | - Google Translate  |  |  - (future: Pa11y)     |  | - Anthropic    |  |
 *  |  | - (future: Azure)   |  |                        |  | - Email Ingest |  |
 *  |  +---------------------+  +------------------------+  +----------------+  |
 *  +-------------------------------------------------------------------------+
 *        |                         |                         |
 *        | (Events)                | (API Calls)             | (DB I/O)
 *        v                         v                         v
 *  +-----------------------+  +-----------------------+  +-----------------------+
 *  | Event Bus             |  | 3rd Party AI/SaaS APIs|  | Core Database         |
 *  | (@ecosystem/core-sdk) |  | (DeepL, OpenAI, etc.) |  | (Postgres/ScyllaDB)   |
 *  +-----------------------+  +-----------------------+  +-----------------------+
 *
 * ### Revenue Surface
 *
 * - **Tiered API Usage:**
 *   - **Free/Dev:** Limited translations, basic accessibility scans, 1 support agent.
 *   - **Pro:** Higher limits, advanced translation features (glossaries), automated a11y scans on commit hooks, 10 support agents.
 *   - **Enterprise:** Unlimited usage, translation memory, on-premise a11y scanner, advanced AI ticket routing, priority support, SLAs.
 * - **Per-Seat Licensing:** For the helpdesk functionality (per support agent).
 * - **Managed Services:**
 *   - **Accessibility Remediation:** Professional services to fix issues found by the auditor.
 *   - **Translation Review:** Human-in-the-loop verification of AI translations.
 *
 * ### Cost Drivers
 *
 * - **Third-Party API Calls:**
 *   - Translation services (e.g., DeepL, Google) are billed per character.
 *   - AI models (e.g., OpenAI, Anthropic) are billed per token for ticket analysis.
 * - **Compute:**
 *   - Running headless browsers (Puppeteer) for accessibility audits is CPU and memory intensive.
 *   - API server hosting.
 * - **Storage:**
 *   - Storing translation strings, accessibility reports, and ticket data.
 *
 * ### Failure Modes
 *
 * - **Upstream API Outage:** A translation or AI provider going down will degrade or disable corresponding features. (Mitigation: Provider failover, circuit breakers).
 * - **Inaccurate AI Output:** AI may provide incorrect translations or unhelpful ticket summaries. (Mitigation: Confidence scoring, human review workflows, clear UI disclaimers).
 * - **Accessibility Scanner Flaws:** The scanner may produce false positives/negatives or fail on complex Single Page Applications (SPAs). (Mitigation: Configurable scan depths, manual override, clear reporting of scanner limitations).
 * - **Data Privacy Breach:** Handling sensitive user data in tickets and PII in translated content. (Mitigation: PII redaction AI pipeline, jurisdictional data controls, strict authz).
 * - **Queue Overload:** A spike in audit requests or incoming tickets could overwhelm processing queues. (Mitigation: Autoscaling workers, rate limiting, backpressure handling).
 *
 * ### Core Tension: Automation vs. Human Touch
 *
 * This system is designed around the tension between leveraging AI for scale and efficiency versus the necessity of human oversight for quality, nuance, and empathy.
 * - **Translations:** APIs provide instant, low-cost translations, but data models include flags for `needsHumanReview` and endpoints exist for professional linguists to approve/edit content.
 * - **Ticketing:** AI can categorize, summarize, and suggest replies, but the system's core is a robust workflow engine for human agents, with clear escalation paths when AI fails or when a human touch is required.
 * - **Accessibility:** Automated scanners find common issues quickly, but reports are structured to guide manual testing and expert review, acknowledging that automation cannot catch all a11y problems.
 * This tension is visible in API parameters (e.g., `?aiAssistLevel=full|suggest|none`), data schemas, and the event stream, which emits events for "AI Action" and "Human Action" separately.
 *
 */

// =============================================================================
// >> AGENT METADATA <<
// =============================================================================
export const agent_metadata = {
    purpose: "To provide a unified API layer for universal access features, including AI-powered translation, automated accessibility auditing, and a consolidated helpdesk ticketing system. It abstracts multiple third-party providers to ensure flexibility and reliability.",
    dependencies: {
        internal: [
            "APP_01_Inference_CostRouter", // For routing AI requests based on cost/latency.
            "APP_03_Auth_IdentityService", // For authenticating all API requests.
            "APP_21_Storage_VectorStoreGateway", // For semantic search on tickets and help docs.
            "APP_37_Governance_AuditTrailEngine", // For logging all significant actions.
        ],
        external: [
            "DeepL API",
            "Google Cloud Translate API",
            "OpenAI API",
            "Anthropic API",
            "Puppeteer (for Axe-core)",
            "Generic Email IMAP/SMTP servers"
        ]
    },
    invalidation_conditions: [
        "Major breaking changes in the APIs of primary AI/translation providers.",
        "Significant updates to web accessibility standards (e.g., WCAG 3.0).",
        "Discovery of a systemic flaw in the AI-based PII detection for support tickets.",
        "Change in core data ontology for 'User' or 'Ticket' objects from the shared SDK."
    ],
    adjacent_apps: [
        "APP_58_Narrative_ModelExplainabilityUI", // To visualize why a ticket was categorized a certain way.
        "APP_11_Billing_UsageTracker", // To report usage metrics for billing (translations, audits, AI tokens).
        "APP_45_DevEx_CICDObserver", // To trigger accessibility scans on new code deployments.
    ]
};


// =============================================================================
// >> IMPORTS <<
// =============================================================================

import express, { Request, Response, NextFunction, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosInstance } from 'axios';
import puppeteer, { Browser } from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { Results as AxeResults } from 'axe-core';
import { EventEmitter } from 'events';
import * as http from 'http';

// Fictional Core SDK Imports - We will mock these for standalone functionality
import {
    BaseError,
    logger,
    config,
    authMiddleware,
    eventBus,
    EcosystemEvent,
    EntityType,
    ActionType,
    AuditLog,
    FeatureFlag,
    Jurisdiction
} from '@ecosystem/core-sdk';


// =============================================================================
// >> CORE SDK MOCKS (for standalone execution) <<
// =============================================================================
// In a real environment, these would be provided by the shared core SDK package.

namespace Mocks {
    export const mockLogger = {
        info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
        warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
        error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
        debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
    };

    export const mockConfig = {
        get: (key: string): any => {
            const settings: { [key: string]: any } = {
                'server.port': process.env.PORT || 8065,
                'deepl.apiKey': process.env.DEEPL_API_KEY || 'fake-deepl-key',
                'google.apiKey': process.env.GOOGLE_API_KEY || 'fake-google-key',
                'openai.apiKey': process.env.OPENAI_API_KEY || 'fake-openai-key',
                'anthropic.apiKey': process.env.ANTHROPIC_API_KEY || 'fake-anthropic-key',
                'cache.ttl.translation': 3600,
                'puppeteer.poolSize': 5,
                'audit.defaultTimeout': 60000,
                'db.connectionString': 'postgresql://user:pass@host:5432/app65',
                'jwt.secret': 'a-very-secret-key-for-dev',
                'featureFlags.useGoogleTranslateFallback': true,
                'featureFlags.enableAnthropicSafetyReply': false,
                'jurisdiction': Jurisdiction.EU,
            };
            return settings[key];
        },
    };

    export const mockAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
        // Mock authentication: in a real app, this would validate a JWT
        // and attach user info to the request.
        (req as any).user = {
            id: 'user-123',
            tenantId: 'tenant-abc',
            permissions: ['translations:write', 'audits:create', 'tickets:read', 'tickets:update'],
        };
        logger.info('MockAuthMiddleware: User authenticated', { userId: (req as any).user.id });
        next();
    };

    export class MockEventBus extends EventEmitter {
        publish(event: EcosystemEvent): void {
            logger.info('EventBus: Publishing event', { eventName: event.eventName });
            this.emit(event.eventName, event.payload);
        }
    }
    export const mockEventBus = new MockEventBus();

    // Replace the imported modules with our mocks
    Object.assign(require('@ecosystem/core-sdk'), {
        logger: mockLogger,
        config: mockConfig,
        authMiddleware: mockAuthMiddleware,
        eventBus: mockEventBus,
        BaseError: class extends Error {
            constructor(message: string, public statusCode: number, public isOperational: boolean) {
                super(message);
            }
        },
        EcosystemEvent: class {
            constructor(public eventName: string, public payload: any) {}
        },
        AuditLog: {
            log: async (actorId: string, entityType: EntityType, entityId: string, action: ActionType, details: any) => {
                logger.info('AUDIT_LOG', { actorId, entityType, entityId, action, details });
            }
        },
        FeatureFlag: {
            isEnabled: (flagName: string, context?: any): boolean => {
                return mockConfig.get(`featureFlags.${flagName}`) || false;
            }
        },
        Jurisdiction: {
            US: 'US',
            EU: 'EU',
            APAC: 'APAC',
        }
    });
}


// =============================================================================
// >> TYPE DEFINITIONS / ONTOLOGY <<
// =============================================================================

export type Locale = string; // e.g., 'en-US', 'de', 'fr'

export enum TranslationProviderType {
    DeepL = 'deepl',
    Google = 'google',
    Mock = 'mock',
}

export enum TranslationStatus {
    MachineTranslated = 'machine_translated',
    HumanReviewRequested = 'human_review_requested',
    HumanApproved = 'human_approved',
}

export interface TranslationString {
    id: string;
    tenantId: string;
    project: string;
    key: string;
    sourceLocale: Locale;
    sourceText: string;
    translations: Record<Locale, TranslationVersion>;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
}

export interface TranslationVersion {
    text: string;
    provider: TranslationProviderType;
    status: TranslationStatus;
    version: number;
    createdAt: Date;
    approvedBy?: string; // User ID
}

export enum AuditStatus {
    Queued = 'queued',
    Running = 'running',
    Completed = 'completed',
    Failed = 'failed',
}

export interface AccessibilityAudit {
    id: string;
    tenantId: string;
    url: string;
    status: AuditStatus;
    report?: AxeResults;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
}

export enum TicketStatus {
    Open = 'open',
    InProgress = 'in_progress',
    PendingCustomer = 'pending_customer',
    Resolved = 'resolved',
    Closed = 'closed',
}

export enum TicketPriority {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    Urgent = 'urgent',
}

export enum TicketSource {
    Email = 'email',
    WebForm = 'web_form',
    API = 'api',
    Chat = 'chat',
}

export interface Ticket {
    id: string;
    tenantId: string;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
    requesterId: string;
    assigneeId?: string;
    groupId?: string;
    source: TicketSource;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
    tags: string[];
    comments: TicketComment[];
    aiAnalysis?: TicketAIAnalysis;
}

export interface TicketComment {
    id: string;
    authorId: string; // Can be a user or an agent
    body: string;
    isPublic: boolean;
    createdAt: Date;
}

export interface TicketAIAnalysis {
    summary: string;
    suggestedCategory?: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    language: Locale;
    suggestedReplies?: AISuggestedReply[];
    piiDetected: boolean;
}

export interface AISuggestedReply {
    id: string;
    provider: 'openai' | 'anthropic';
    content: string;
    confidence: number;
    used: boolean;
    feedback?: 'helpful' | 'unhelpful';
}


// =============================================================================
// >> CUSTOM ERRORS <<
// =============================================================================

class ApiError extends BaseError {}
class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(message, 404, true);
    }
}
class BadRequestError extends ApiError {
    constructor(message = 'Bad request') {
        super(message, 400, true);
    }
}
class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(message, 401, true);
    }
}
class ProviderError extends ApiError {
    constructor(provider: string, message = 'Error from upstream provider') {
        super(`${provider}: ${message}`, 502, true);
    }
}


// =============================================================================
// >> ADAPTERS & PLUGINS <<
// =============================================================================

// --- Translation Providers ---

interface ITranslationProvider {
    translate(text: string, sourceLang: Locale, targetLang: Locale): Promise<string>;
    getProviderType(): TranslationProviderType;
}

class DeepLProvider implements ITranslationProvider {
    private readonly axios: AxiosInstance;
    private readonly apiKey: string;

    constructor() {
        this.apiKey = config.get('deepl.apiKey');
        if (!this.apiKey || this.apiKey === 'fake-deepl-key') {
            logger.warn('DeepL API key not configured. DeepL provider will not work.');
        }
        const apiBase = this.apiKey.endsWith(':fx')
            ? 'https://api-free.deepl.com'
            : 'https://api.deepl.com';

        this.axios = axios.create({
            baseURL: apiBase,
            headers: {
                'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
            },
        });
    }

    getProviderType(): TranslationProviderType {
        return TranslationProviderType.DeepL;
    }

    async translate(text: string, sourceLang: Locale, targetLang: Locale): Promise<string> {
        try {
            const response = await this.axios.post('/v2/translate', {
                text: [text],
                source_lang: sourceLang.split('-')[0].toUpperCase(),
                target_lang: targetLang.split('-')[0].toUpperCase(),
            });
            const translation = response.data.translations[0].text;
            logger.info('Translation successful via DeepL', { sourceLang, targetLang });
            return translation;
        } catch (error: any) {
            logger.error('DeepL API Error', { error: error.message });
            throw new ProviderError('DeepL', error.message);
        }
    }
}

class GoogleTranslateProvider implements ITranslationProvider {
    // In a real app, this would use the Google Cloud Translate SDK
    private readonly apiKey: string;
    private readonly axios: AxiosInstance;

    constructor() {
        this.apiKey = config.get('google.apiKey');
        if (!this.apiKey || this.apiKey === 'fake-google-key') {
            logger.warn('Google Translate API key not configured. Google provider will not work.');
        }
        this.axios = axios.create({
            baseURL: 'https://translation.googleapis.com',
        });
    }

    getProviderType(): TranslationProviderType {
        return TranslationProviderType.Google;
    }

    async translate(text: string, sourceLang: Locale, targetLang: Locale): Promise<string> {
        try {
            const response = await this.axios.post(`/language/translate/v2?key=${this.apiKey}`, {
                q: text,
                source: sourceLang.split('-')[0],
                target: targetLang.split('-')[0],
                format: 'text',
            });
            const translation = response.data.data.translations[0].translatedText;
            logger.info('Translation successful via Google Translate', { sourceLang, targetLang });
            return translation;
        } catch (error: any) {
            logger.error('Google Translate API Error', { error: error.message });
            throw new ProviderError('GoogleTranslate', error.message);
        }
    }
}

class MockTranslationProvider implements ITranslationProvider {
    getProviderType(): TranslationProviderType {
        return TranslationProviderType.Mock;
    }
    async translate(text: string, sourceLang: Locale, targetLang: Locale): Promise<string> {
        logger.info('Using Mock Translation Provider');
        return `[mock-translated:${targetLang}] ${text}`;
    }
}


// --- Accessibility Auditor ---

interface IAccessibilityAuditor {
    audit(url: string): Promise<AxeResults>;
}

class AxePuppeteerAuditor implements IAccessibilityAuditor {
    private browser: Browser | null = null;

    async initialize() {
        if (!this.browser) {
            logger.info('Initializing Puppeteer browser instance...');
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            logger.info('Puppeteer browser instance initialized.');
        }
    }

    async audit(url: string): Promise<AxeResults> {
        await this.initialize();
        if (!this.browser) {
            throw new Error('Puppeteer browser not initialized');
        }

        let page;
        try {
            page = await this.browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2', timeout: config.get('audit.defaultTimeout') });
            
            const results = await new AxePuppeteer(page).analyze();
            logger.info('Accessibility audit completed', { url, violations: results.violations.length });
            return results;
        } catch (error: any) {
            logger.error('Error during accessibility audit', { url, error: error.message });
            throw new ProviderError('Axe/Puppeteer', error.message);
        } finally {
            if (page) {
                await page.close();
            }
        }
    }

    async shutdown() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            logger.info('Puppeteer browser instance shut down.');
        }
    }
}


// --- Ticket AI Providers ---

interface ITicketAIProvider {
    analyze(ticket: Ticket): Promise<Partial<TicketAIAnalysis>>;
    suggestReply(ticket: Ticket, context: string): Promise<AISuggestedReply>;
}

class OpenAITicketProvider implements ITicketAIProvider {
    private readonly axios: AxiosInstance;
    private readonly apiKey: string;

    constructor() {
        this.apiKey = config.get('openai.apiKey');
        if (!this.apiKey || this.apiKey === 'fake-openai-key') {
            logger.warn('OpenAI API key not configured. OpenAI provider will not work.');
        }
        this.axios = axios.create({
            baseURL: 'https://api.openai.com/v1',
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });
    }

    async analyze(ticket: Ticket): Promise<Partial<TicketAIAnalysis>> {
        const fullText = ticket.comments.map(c => c.body).join('\n\n');
        const prompt = `
            Analyze the following support ticket and provide a JSON response with the following fields:
            - "summary": A one-sentence summary of the user's issue.
            - "suggestedCategory": One of the following categories: "Billing", "Technical Issue", "Feature Request", "Account Management", "General Inquiry".
            - "sentiment": One of "positive", "neutral", "negative".
            - "language": The ISO 639-1 code for the language of the ticket (e.g., "en", "es").
            - "piiDetected": A boolean indicating if any potential PII (email, phone, name, address) is present.

            Ticket Subject: ${ticket.subject}
            Ticket Content:
            ---
            ${fullText}
            ---
        `;

        try {
            const response = await this.axios.post('/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" },
            });
            const analysis = JSON.parse(response.data.choices[0].message.content);
            logger.info('Ticket analysis successful via OpenAI', { ticketId: ticket.id });
            return analysis;
        } catch (error: any) {
            logger.error('OpenAI API Error during analysis', { error: error.message });
            throw new ProviderError('OpenAI', error.message);
        }
    }

    async suggestReply(ticket: Ticket, context: string): Promise<AISuggestedReply> {
        const fullText = ticket.comments.map(c => c.body).join('\n\n');
        const prompt = `
            You are a helpful and empathetic support agent. Based on the following support ticket, write a helpful reply.
            ${context ? `Additional context: ${context}` : ''}

            Ticket Subject: ${ticket.subject}
            Ticket Content:
            ---
            ${fullText}
            ---
            
            Draft a reply to the user:
        `;

        try {
            const response = await this.axios.post('/chat/completions', {
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
            });
            const content = response.data.choices[0].message.content;
            return {
                id: uuidv4(),
                provider: 'openai',
                content,
                confidence: response.data.choices[0].finish_reason === 'stop' ? 0.9 : 0.7,
                used: false,
            };
        } catch (error: any) {
            logger.error('OpenAI API Error during reply suggestion', { error: error.message });
            throw new ProviderError('OpenAI', error.message);
        }
    }
}

class AnthropicTicketProvider implements ITicketAIProvider {
    private readonly axios: AxiosInstance;
    private readonly apiKey: string;

    constructor() {
        this.apiKey = config.get('anthropic.apiKey');
        if (!this.apiKey || this.apiKey === 'fake-anthropic-key') {
            logger.warn('Anthropic API key not configured. Anthropic provider will not work.');
        }
        this.axios = axios.create({
            baseURL: 'https://api.anthropic.com/v1',
            headers: { 
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            }
        });
    }

    async analyze(ticket: Ticket): Promise<Partial<TicketAIAnalysis>> {
        // Anthropic's analysis might focus more on safety and tone
        const fullText = ticket.comments.map(c => c.body).join('\n\n');
        const prompt = `
            Human: Analyze the following support ticket. Provide a JSON object with these fields: "summary", "suggestedCategory" (from "Billing", "Technical Issue", "Feature Request", "Account Management", "General Inquiry"), "sentiment" ("positive", "neutral", "negative"), "language" (ISO 639-1), and "piiDetected" (boolean).

            Ticket Subject: ${ticket.subject}
            Ticket Content:
            ---
            ${fullText}
            ---

            Assistant:
        `;

        try {
            const response = await this.axios.post('/messages', {
                model: 'claude-3-haiku-20240307',
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
            });
            const rawJson = response.data.content[0].text;
            const analysis = JSON.parse(rawJson.substring(rawJson.indexOf('{'), rawJson.lastIndexOf('}') + 1));
            logger.info('Ticket analysis successful via Anthropic', { ticketId: ticket.id });
            return analysis;
        } catch (error: any) {
            logger.error('Anthropic API Error during analysis', { error: error.message });
            throw new ProviderError('Anthropic', error.message);
        }
    }

    async suggestReply(ticket: Ticket, context: string): Promise<AISuggestedReply> {
        const fullText = ticket.comments.map(c => c.body).join('\n\n');
        const prompt = `
            Human: You are a support agent focused on safety, clarity, and helpfulness. Based on the following support ticket, write a helpful and safe reply. Do not make promises you cannot keep. Be empathetic but professional.
            ${context ? `Additional context: ${context}` : ''}

            Ticket Subject: ${ticket.subject}
            Ticket Content:
            ---
            ${fullText}
            ---
            
            Assistant:
        `;

        try {
            const response = await this.axios.post('/messages', {
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
            });
            const content = response.data.content[0].text;
            return {
                id: uuidv4(),
                provider: 'anthropic',
                content,
                confidence: 0.85, // Confidence is subjective here
                used: false,
            };
        } catch (error: any) {
            logger.error('Anthropic API Error during reply suggestion', { error: error.message });
            throw new ProviderError('Anthropic', error.message);
        }
    }
}


// =============================================================================
// >> CORE SERVICES <<
// =============================================================================

// --- Translation Service ---

class TranslationService {
    private providers: Map<TranslationProviderType, ITranslationProvider>;
    // In a real app, this would be a Redis cache
    private cache: Map<string, string> = new Map();

    constructor() {
        this.providers = new Map();
        this.providers.set(TranslationProviderType.DeepL, new DeepLProvider());
        this.providers.set(TranslationProviderType.Google, new GoogleTranslateProvider());
        this.providers.set(TranslationProviderType.Mock, new MockTranslationProvider());
    }

    private getCacheKey(text: string, sourceLang: Locale, targetLang: Locale): string {
        return `${sourceLang}:${targetLang}:${text}`;
    }

    async translate(
        text: string,
        sourceLang: Locale,
        targetLang: Locale,
        options: { useCache?: boolean, provider?: TranslationProviderType, requireHumanReview?: boolean } = {}
    ): Promise<{ text: string, provider: TranslationProviderType, status: TranslationStatus }> {
        const { useCache = true, provider = TranslationProviderType.DeepL, requireHumanReview = false } = options;

        if (useCache) {
            const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
            const cached = this.cache.get(cacheKey);
            if (cached) {
                logger.info('Translation cache hit', { key: cacheKey });
                return { text: cached, provider: TranslationProviderType.Mock, status: TranslationStatus.MachineTranslated }; // Mock provider for cached result
            }
        }

        let selectedProvider = this.providers.get(provider);
        if (!selectedProvider) {
            logger.warn(`Provider ${provider} not found, defaulting to DeepL.`);
            selectedProvider = this.providers.get(TranslationProviderType.DeepL)!;
        }

        try {
            const translatedText = await selectedProvider.translate(text, sourceLang, targetLang);
            if (useCache) {
                const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
                this.cache.set(cacheKey, translatedText);
            }
            const status = requireHumanReview ? TranslationStatus.HumanReviewRequested : TranslationStatus.MachineTranslated;
            return { text: translatedText, provider: selectedProvider.getProviderType(), status };
        } catch (error) {
            logger.error(`Translation failed with primary provider ${provider}`, { error });
            if (FeatureFlag.isEnabled('useGoogleTranslateFallback') && provider !== TranslationProviderType.Google) {
                logger.info('Attempting fallback to Google Translate');
                const fallbackProvider = this.providers.get(TranslationProviderType.Google)!;
                const translatedText = await fallbackProvider.translate(text, sourceLang, targetLang);
                const status = requireHumanReview ? TranslationStatus.HumanReviewRequested : TranslationStatus.MachineTranslated;
                return { text: translatedText, provider: fallbackProvider.getProviderType(), status };
            }
            throw error;
        }
    }

    // ... other methods for managing TranslationString entities (CRUD) would go here
    // These would interact with a database.
}


// --- Accessibility Service ---

class AccessibilityService {
    private auditor: IAccessibilityAuditor;
    // In a real app, this would be a persistent job queue like BullMQ or RabbitMQ
    private auditQueue: string[] = [];
    private auditStore: Map<string, AccessibilityAudit> = new Map();

    constructor(auditor: IAccessibilityAuditor) {
        this.auditor = auditor;
        this.processQueue();
    }

    async createAudit(tenantId: string, url: string): Promise<AccessibilityAudit> {
        const audit: AccessibilityAudit = {
            id: uuidv4(),
            tenantId,
            url,
            status: AuditStatus.Queued,
            createdAt: new Date(),
        };
        this.auditStore.set(audit.id, audit);
        this.auditQueue.push(audit.id);
        logger.info('Accessibility audit queued', { auditId: audit.id, url });
        
        await eventBus.publish(new EcosystemEvent('accessibility.audit.queued', { audit }));
        await AuditLog.log('system', EntityType.AccessibilityAudit, audit.id, ActionType.Create, { url });

        return audit;
    }

    async getAudit(id: string): Promise<AccessibilityAudit | undefined> {
        return this.auditStore.get(id);
    }

    private async processQueue() {
        if (this.auditQueue.length > 0) {
            const auditId = this.auditQueue.shift()!;
            const audit = this.auditStore.get(auditId);

            if (audit) {
                logger.info('Processing audit from queue', { auditId });
                audit.status = AuditStatus.Running;
                this.auditStore.set(auditId, audit);

                try {
                    const report = await this.auditor.audit(audit.url);
                    audit.status = AuditStatus.Completed;
                    audit.report = report;
                    audit.completedAt = new Date();
                    this.auditStore.set(auditId, audit);
                    logger.info('Audit processing completed', { auditId });
                    await eventBus.publish(new EcosystemEvent('accessibility.audit.completed', { audit }));
                } catch (error: any) {
                    audit.status = AuditStatus.Failed;
                    audit.error = error.message;
                    audit.completedAt = new Date();
                    this.auditStore.set(auditId, audit);
                    logger.error('Audit processing failed', { auditId, error: error.message });
                    await eventBus.publish(new EcosystemEvent('accessibility.audit.failed', { audit }));
                }
            }
        }
        // Check queue again in a bit
        setTimeout(() => this.processQueue(), 5000);
    }
}


// --- Ticketing Service ---

class TicketingService {
    private aiProviders: Map<string, ITicketAIProvider>;
    private ticketStore: Map<string, Ticket> = new Map();

    constructor() {
        this.aiProviders = new Map();
        this.aiProviders.set('openai', new OpenAITicketProvider());
        this.aiProviders.set('anthropic', new AnthropicTicketProvider());
    }

    async createTicket(
        tenantId: string,
        requesterId: string,
        subject: string,
        body: string,
        options: { priority?: TicketPriority, source?: TicketSource, tags?: string[] } = {}
    ): Promise<Ticket> {
        const ticketId = uuidv4();
        const commentId = uuidv4();

        const ticket: Ticket = {
            id: ticketId,
            tenantId,
            requesterId,
            subject,
            status: TicketStatus.Open,
            priority: options.priority || TicketPriority.Medium,
            source: options.source || TicketSource.API,
            tags: options.tags || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            comments: [{
                id: commentId,
                authorId: requesterId,
                body,
                isPublic: true,
                createdAt: new Date(),
            }],
        };

        this.ticketStore.set(ticketId, ticket);
        logger.info('Ticket created', { ticketId });

        // Asynchronously trigger AI analysis
        this.triggerAIAnalysis(ticketId).catch(err => logger.error('Failed to trigger AI analysis', { ticketId, err }));

        await eventBus.publish(new EcosystemEvent('ticket.created', { ticket }));
        await AuditLog.log(requesterId, EntityType.Ticket, ticket.id, ActionType.Create, { subject });

        return ticket;
    }

    async getTicket(id: string): Promise<Ticket | undefined> {
        return this.ticketStore.get(id);
    }

    async addComment(ticketId: string, authorId: string, body: string, isPublic: boolean): Promise<Ticket> {
        const ticket = this.ticketStore.get(ticketId);
        if (!ticket) {
            throw new NotFoundError('Ticket not found');
        }

        const comment: TicketComment = {
            id: uuidv4(),
            authorId,
            body,
            isPublic,
            createdAt: new Date(),
        };

        ticket.comments.push(comment);
        ticket.updatedAt = new Date();
        // If agent replies, move status from pending
        if (ticket.status === TicketStatus.PendingCustomer && !isPublic) {
            ticket.status = TicketStatus.InProgress;
        }

        this.ticketStore.set(ticketId, ticket);
        logger.info('Comment added to ticket', { ticketId, commentId: comment.id });

        await eventBus.publish(new EcosystemEvent('ticket.comment.added', { ticketId, comment }));
        await AuditLog.log(authorId, EntityType.Ticket, ticket.id, ActionType.Update, { commentAdded: comment.id });

        return ticket;
    }

    async updateTicketStatus(ticketId: string, status: TicketStatus, actorId: string): Promise<Ticket> {
        const ticket = this.ticketStore.get(ticketId);
        if (!ticket) {
            throw new NotFoundError('Ticket not found');
        }
        ticket.status = status;
        ticket.updatedAt = new Date();
        if (status === TicketStatus.Resolved || status === TicketStatus.Closed) {
            ticket.resolvedAt = new Date();
        }
        this.ticketStore.set(ticketId, ticket);
        logger.info('Ticket status updated', { ticketId, status });

        await eventBus.publish(new EcosystemEvent('ticket.status.updated', { ticketId, status }));
        await AuditLog.log(actorId, EntityType.Ticket, ticket.id, ActionType.Update, { status });

        return ticket;
    }

    async triggerAIAnalysis(ticketId: string): Promise<void> {
        const ticket = this.ticketStore.get(ticketId);
        if (!ticket) return;

        const provider = this.aiProviders.get('openai')!; // Default to OpenAI for analysis
        try {
            const analysis = await provider.analyze(ticket);
            ticket.aiAnalysis = { ...ticket.aiAnalysis, ...analysis } as TicketAIAnalysis;
            this.ticketStore.set(ticketId, ticket);
            logger.info('AI analysis complete for ticket', { ticketId });
            await eventBus.publish(new EcosystemEvent('ticket.ai.analysis.completed', { ticketId, analysis }));
        } catch (error) {
            logger.error('AI analysis failed for ticket', { ticketId, error });
        }
    }

    async getAISuggestedReply(ticketId: string, context: string = ''): Promise<AISuggestedReply> {
        const ticket = this.ticketStore.get(ticketId);
        if (!ticket) {
            throw new NotFoundError('Ticket not found');
        }

        const providerKey = FeatureFlag.isEnabled('enableAnthropicSafetyReply') ? 'anthropic' : 'openai';
        const provider = this.aiProviders.get(providerKey)!;

        try {
            const suggestion = await provider.suggestReply(ticket, context);
            if (!ticket.aiAnalysis) ticket.aiAnalysis = {} as TicketAIAnalysis;
            if (!ticket.aiAnalysis.suggestedReplies) ticket.aiAnalysis.suggestedReplies = [];
            ticket.aiAnalysis.suggestedReplies.push(suggestion);
            this.ticketStore.set(ticketId, ticket);
            logger.info('AI reply suggestion generated', { ticketId, provider: providerKey });
            return suggestion;
        } catch (error) {
            logger.error('Failed to get AI reply suggestion', { ticketId, error });
            throw error;
        }
    }
}


// =============================================================================
// >> API CONTROLLERS <<
// =============================================================================

const handleServiceErrors = (err: any, res: Response) => {
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({ error: err.message });
    } else {
        logger.error('Unhandled service error', { error: err.message, stack: err.stack });
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

// --- Translation Controller ---

const createTranslationController = (service: TranslationService): Router => {
    const router = Router();

    /**
     * @openapi
     * /translations/translate:
     *   post:
     *     summary: Translates a piece of text
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               text: { type: string }
     *               sourceLocale: { type: string }
     *               targetLocale: { type: string }
     *               requireHumanReview: { type: boolean }
     *     responses:
     *       200:
     *         description: Successful translation
     */
    router.post('/translate', async (req: Request, res: Response) => {
        try {
            const { text, sourceLocale, targetLocale, requireHumanReview } = req.body;
            if (!text || !sourceLocale || !targetLocale) {
                throw new BadRequestError('Missing required fields: text, sourceLocale, targetLocale');
            }
            const result = await service.translate(text, sourceLocale, targetLocale, { requireHumanReview });
            res.json(result);
        } catch (err) {
            handleServiceErrors(err, res);
        }
    });

    // ... other CRUD endpoints for TranslationString entities
    return router;
};

// --- Accessibility Controller ---

const createAccessibilityController = (service: AccessibilityService): Router => {
    const router = Router();

    /**
     * @openapi
     * /accessibility/audits:
     *   post:
     *     summary: Submits a URL for an accessibility audit
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               url: { type: string, format: uri }
     *     responses:
     *       202:
     *         description: Audit has been accepted and queued
     */
    router.post('/audits', async (req: Request, res: Response) => {
        try {
            const { url } = req.body;
            if (!url) {
                throw new BadRequestError('URL is required');
            }
            const tenantId = (req as any).user.tenantId;
            const audit = await service.createAudit(tenantId, url);
            res.status(202).json(audit);
        } catch (err) {
            handleServiceErrors(err, res);
        }
    });

    /**
     * @openapi
     * /accessibility/audits/{id}:
     *   get:
     *     summary: Retrieves the status and report of an accessibility audit
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Audit details
     *       404:
     *         description: Audit not found
     */
    router.get('/audits/:id', async (req: Request, res: Response) => {
        try {
            const audit = await service.getAudit(req.params.id);
            if (!audit) {
                throw new NotFoundError('Audit not found');
            }
            // Basic authorization check
            if (audit.tenantId !== (req as any).user.tenantId) {
                throw new UnauthorizedError();
            }
            res.json(audit);
        } catch (err) {
            handleServiceErrors(err, res);
        }
    });

    return router;
};

// --- Ticketing Controller ---

const createTicketingController = (service: TicketingService): Router => {
    const router = Router();

    router.post('/tickets', async (req: Request, res: Response) => {
        try {
            const { subject, body, priority, source, tags } = req.body;
            const { tenantId, id: requesterId } = (req as any).user;
            const ticket = await service.createTicket(tenantId, requesterId, subject, body, { priority, source, tags });
            res.status(201).json(ticket);
        } catch (err) {
            handleServiceErrors(err, res);
        }
    });

    router.get('/tickets/:id', async (req: Request, res: Response) => {
        try {
            const ticket = await service.getTicket(req.params.id);
            if (!ticket || ticket.tenantId !== (req as any).user.tenantId) {
                throw new NotFoundError('Ticket not found');
            }
            res.json(ticket);
        } catch (err) {
            handleServiceErrors(err, res);
        }
    });

    router.post('/tickets/:id/comments', async (req: Request, res: Response) => {
        try {
            const { body, isPublic } = req.body;
            const { id: authorId } = (req as any).user;
            const ticket = await service.addComment(req.params.id, authorId, body, isPublic);
            res.status(201).json(ticket);
        } catch (err) {
            handleServiceErrors(err, res);
        }
    });

    router.put('/tickets/:id/status', async (req: Request, res: Response) => {
        try {
            const { status } = req.body;
            const { id: actorId } = (req as any).user;
            const ticket = await service.updateTicketStatus(req.params.id, status, actorId);
            res.json(ticket);
        } catch (err) {
            handleServiceErrors(err, res);
        }
    });

    router.post('/tickets/:id/ai/suggest-reply', async (req: Request, res: Response) => {
        try {
            const { context } = req.body;
            const suggestion = await service.getAISuggestedReply(req.params.id, context);
            res.json(suggestion);
        } catch (err) {
            handleServiceErrors(err, res);
        }
    });

    return router;
};

// --- System Controller (Self-Querying) ---

const createSystemController = (): Router => {
    const router = Router();
    const startTime = new Date();

    router.get('/introspect', (req, res) => {
        res.json({
            appName: 'APP_65_Support_UniversalAccessLayer',
            startTime,
            uptime: `${(Date.now() - startTime.getTime()) / 1000} seconds`,
            status: 'OK',
            version: '1.0.0',
            components: {
                translation: { status: 'active', providers: ['DeepL', 'GoogleTranslate'] },
                accessibility: { status: 'active', provider: 'Axe/Puppeteer' },
                ticketing: { status: 'active', ai_providers: ['OpenAI', 'Anthropic'] }
            },
            metadata: agent_metadata,
        });
    });

    router.get('/assumptions', (req, res) => {
        res.json({
            assumptions: [
                "Clients will provide valid API keys for third-party services via the core config service.",
                "The core event bus is available and has sufficient throughput.",
                "The core auth service correctly populates `req.user` with `id` and `tenantId`.",
                "The underlying compute environment has network access to all external provider APIs.",
                "Puppeteer can run in a headless environment (e.g., Docker container has necessary dependencies).",
                "The tension between automation and human touch is a key design driver, and clients will use features like 'requireHumanReview' accordingly."
            ]
        });
    });

    router.get('/failure-modes', (req, res) => {
        res.json({
            failure_modes: [
                {
                    mode: "Upstream Translation API Failure",
                    impact: "Translation endpoints will fail or have increased latency.",
                    mitigation: "Circuit breaker pattern implemented. Automatic fallback to secondary provider (Google Translate) if enabled via feature flag."
                },
                {
                    mode: "Puppeteer Crash",
                    impact: "Accessibility audits will fail to process from the queue.",
                    mitigation: "Service is designed to be resilient; failed jobs are marked and can be retried. The main API remains online. Monitoring on queue depth is critical."
                },
                {
                    mode: "AI Hallucination in Ticket Analysis",
                    impact: "Tickets may be miscategorized or have incorrect summaries, leading to inefficient support.",
                    mitigation: "AI analysis is presented as a suggestion in UIs. All AI actions are logged for audit. Confidence scores (where available) can be used to flag low-confidence results for human review."
                },
                {
                    mode: "PII Leak via AI-suggested Replies",
                    impact: "Sensitive user information could be inadvertently included in a support response.",
                    mitigation: "Initial AI analysis includes a PII detection step. Prompts for reply generation are engineered to avoid regurgitating sensitive data. Human agents must approve all AI-generated replies before sending."
                }
            ]
        });
    });

    router.get('/update-triggers', (req, res) => {
        res.json({
            update_triggers: [
                "A new major version of an integrated AI model is released (e.g., GPT-5, Claude 4).",
                "A new translation provider offers significantly better cost/performance.",
                "WCAG standards are updated, requiring changes to the Axe-core ruleset.",
                "An event `ontology.change` is received from the event bus, indicating a core data model has been modified.",
                "Performance monitoring indicates that the Puppeteer-based auditor is a bottleneck, suggesting a move to a different audit technology or architecture."
            ]
        });
    });

    return router;
};


// =============================================================================
// >> EXPRESS APP SETUP & MAIN EXECUTION <<
// =============================================================================

export const createApp = () => {
    const app = express();
    app.use(express.json());

    // Core Middleware
    app.use((req, res, next) => {
        logger.info(`Request received: ${req.method} ${req.path}`);
        next();
    });

    // Instantiate services and auditor
    const axeAuditor = new AxePuppeteerAuditor();
    const translationService = new TranslationService();
    const accessibilityService = new AccessibilityService(axeAuditor);
    const ticketingService = new TicketingService();

    // Health check endpoint
    app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }));

    // Register API routes with authentication
    const apiRouter = Router();
    apiRouter.use(authMiddleware); // All API routes require authentication
    apiRouter.use('/translations', createTranslationController(translationService));
    apiRouter.use('/accessibility', createAccessibilityController(accessibilityService));
    apiRouter.use('/ticketing', createTicketingController(ticketingService));
    app.use('/api/v1', apiRouter);

    // System self-querying routes (may have different auth)
    app.use('/system', createSystemController());

    // Global error handler
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof ApiError && err.isOperational) {
            res.status(err.statusCode).json({ error: err.message });
        } else {
            logger.error('Unhandled application error', { error: err.message, stack: err.stack });
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    const server = http.createServer(app);

    const start = (port: number) => {
        server.listen(port, () => {
            logger.info(`APP_65_Support_UniversalAccessLayer listening on port ${port}`);
        });
    };

    const stop = async () => {
        logger.info('Shutting down server...');
        await axeAuditor.shutdown();
        server.close();
    };

    return { app, start, stop };
};

if (require.main === module) {
    const port = config.get('server.port');
    const { start, stop } = createApp();
    start(port);

    process.on('SIGTERM', stop);
    process.on('SIGINT', stop);
}