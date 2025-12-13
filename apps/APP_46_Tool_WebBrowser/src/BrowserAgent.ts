// Copyright 2024 Unchained Software Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { v4 as uuidv4 } from 'uuid';
import {
    CoreSDK,
    Logger,
    EventBus,
    AuthContext,
} from '@unchained-ecosystem/core-sdk';
import {
    IBrowserController,
    BrowserControllerFactory,
} from './controllers';
import {
    BrowserAgentOptions,
    BrowserSession,
    NavigationResult,
    ExtractionResult,
    BrowserAction,
    BrowserActionType,
    SessionState,
    Viewport,
    ActionError,
    ActionHook,
    HookType,
} from './types';
import {
    NavigationError,
    SelectorTimeoutError,
    ExecutionError,
    SessionNotFoundError,
} from './errors';
import { IImageAnalysisProvider, OpenAIVisionProvider, AnthropicVisionProvider } from './vision_providers';

// Constants
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_USER_AGENT = 'UnchainedEcosystem-BrowserAgent/1.0';
const DEFAULT_VIEWPORT: Viewport = { width: 1920, height: 1080 };

/**
 * @class BrowserAgent
 * @description Core logic for APP_46. A headless browser controller that allows AI agents
 * to interact with the web. It manages browser sessions, executes actions, and extracts information.
 * This class embodies the tension between speed vs. safety by offering both direct, fast
 * DOM manipulation and slower, safer, vision-model-assisted interactions.
 */
export class BrowserAgent {
    private sessions: Map<string, BrowserSession> = new Map();
    private options: BrowserAgentOptions;
    private logger: Logger;
    private eventBus: EventBus;
    private coreSDK: CoreSDK;
    private browserController: IBrowserController;
    private visionProviders: Map<string, IImageAnalysisProvider> = new Map();
    private hooks: Map<HookType, ActionHook[]> = new Map();

    /**
     * @constructor
     * @param {BrowserAgentOptions} options - Configuration for the BrowserAgent.
     * @param {CoreSDK} coreSDK - The shared ecosystem SDK instance.
     */
    constructor(options: BrowserAgentOptions, coreSDK: CoreSDK) {
        this.options = {
            timeout: DEFAULT_TIMEOUT,
            defaultUserAgent: DEFAULT_USER_AGENT,
            defaultViewport: DEFAULT_VIEWPORT,
            ...options,
        };
        this.coreSDK = coreSDK;
        this.logger = coreSDK.getLogger('APP_46_Tool_WebBrowser');
        this.eventBus = coreSDK.getEventBus();
        this.browserController = BrowserControllerFactory.create(
            this.options.browserBackend || 'puppeteer',
            this.options.launchOptions || {}
        );

        this.registerDefaultVisionProviders();
        this.logger.info('BrowserAgent initialized.', { backend: this.options.browserBackend });
    }

    /**
     * Registers the default vision providers for screenshot analysis.
     * This demonstrates multi-provider integration (OpenAI, Anthropic).
     */
    private registerDefaultVisionProviders() {
        if (this.coreSDK.config.get('openai_api_key')) {
            this.visionProviders.set('openai', new OpenAIVisionProvider(this.coreSDK.config));
            this.logger.info('Registered OpenAI Vision Provider.');
        }
        if (this.coreSDK.config.get('anthropic_api_key')) {
            this.visionProviders.set('anthropic', new AnthropicVisionProvider(this.coreSDK.config));
            this.logger.info('Registered Anthropic Vision Provider.');
        }
    }

    /**
     * Registers a hook to be called before or after an action.
     * @param {HookType} type - 'beforeAction' or 'afterAction'.
     * @param {ActionHook} hook - The function to execute.
     */
    public registerHook(type: HookType, hook: ActionHook) {
        if (!this.hooks.has(type)) {
            this.hooks.set(type, []);
        }
        this.hooks.get(type)?.push(hook);
    }

    private async executeHooks(type: HookType, sessionId: string, action: BrowserAction, result?: any) {
        const hooks = this.hooks.get(type) || [];
        for (const hook of hooks) {
            try {
                await hook({ sessionId, action, result });
            } catch (error) {
                this.logger.error(`Error executing ${type} hook`, { error, sessionId, action });
            }
        }
    }

    /**
     * Starts a new browser session.
     * @param {AuthContext} authContext - The authentication context of the user starting the session.
     * @param {object} [sessionOptions] - Options specific to this session.
     * @returns {Promise<string>} The unique ID of the new session.
     */
    public async startSession(authContext: AuthContext, sessionOptions: { userAgent?: string; viewport?: Viewport } = {}): Promise<string> {
        const sessionId = uuidv4();
        this.logger.info('Starting new browser session.', { sessionId, userId: authContext.userId });

        try {
            const page = await this.browserController.newPage({
                userAgent: sessionOptions.userAgent || this.options.defaultUserAgent,
                viewport: sessionOptions.viewport || this.options.defaultViewport,
            });

            const session: BrowserSession = {
                id: sessionId,
                page: page,
                state: SessionState.IDLE,
                createdAt: new Date(),
                authContext,
                history: [],
            };

            this.sessions.set(sessionId, session);

            await this.eventBus.publish('browser.session.started', {
                sessionId,
                userId: authContext.userId,
                timestamp: new Date(),
            });

            return sessionId;
        } catch (error) {
            this.logger.error('Failed to start browser session.', { error });
            throw new Error(`Failed to initialize browser session: ${error.message}`);
        }
    }

    /**
     * Ends an existing browser session and cleans up resources.
     * @param {string} sessionId - The ID of the session to end.
     * @returns {Promise<void>}
     */
    public async endSession(sessionId: string): Promise<void> {
        const session = this.getSession(sessionId);
        this.logger.info('Ending browser session.', { sessionId });

        try {
            await this.browserController.closePage(session.page);
            this.sessions.delete(sessionId);

            await this.eventBus.publish('browser.session.ended', {
                sessionId,
                userId: session.authContext.userId,
                durationMs: new Date().getTime() - session.createdAt.getTime(),
                timestamp: new Date(),
            });
        } catch (error) {
            this.logger.error('Error ending browser session.', { sessionId, error });
            // Still remove from map to prevent leaks
            this.sessions.delete(sessionId);
            throw new Error(`Failed to properly close session ${sessionId}: ${error.message}`);
        }
    }

    /**
     * Retrieves a session by its ID, throwing an error if not found.
     * @param {string} sessionId - The session ID.
     * @returns {BrowserSession} The browser session object.
     * @private
     */
    private getSession(sessionId: string): BrowserSession {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new SessionNotFoundError(sessionId);
        }
        return session;
    }

    /**
     * Executes a sequence of browser actions within a session.
     * @param {string} sessionId - The session ID.
     * @param {BrowserAction[]} actions - An array of actions to execute.
     * @returns {Promise<any[]>} An array of results from each action.
     */
    public async runSequence(sessionId: string, actions: BrowserAction[]): Promise<any[]> {
        const session = this.getSession(sessionId);
        this.logger.info(`Running action sequence for session ${sessionId}`, { actionCount: actions.length });
        session.state = SessionState.BUSY;

        const results: any[] = [];
        try {
            for (const action of actions) {
                const result = await this.executeAction(sessionId, action);
                results.push(result);
            }
        } catch (error) {
            this.logger.error(`Error during action sequence for session ${sessionId}`, { error });
            session.state = SessionState.ERROR;
            throw error; // Re-throw to be handled by the caller
        } finally {
            if (session.state !== SessionState.ERROR) {
                session.state = SessionState.IDLE;
            }
        }
        return results;
    }

    /**
     * Executes a single browser action.
     * @param {string} sessionId - The session ID.
     * @param {BrowserAction} action - The action to execute.
     * @returns {Promise<any>} The result of the action.
     */
    public async executeAction(sessionId: string, action: BrowserAction): Promise<any> {
        const session = this.getSession(sessionId);
        session.history.push(action);
        
        await this.executeHooks('beforeAction', sessionId, action);

        let result: any;
        try {
            switch (action.type) {
                case BrowserActionType.NAVIGATE:
                    result = await this.navigate(sessionId, action.payload.url);
                    break;
                case BrowserActionType.CLICK:
                    result = await this.click(sessionId, action.payload.selector);
                    break;
                case BrowserActionType.TYPE:
                    result = await this.type(sessionId, action.payload.selector, action.payload.text);
                    break;
                case BrowserActionType.EXTRACT:
                    result = await this.extract(sessionId, action.payload.selector, action.payload.extractType);
                    break;
                case BrowserActionType.SCREENSHOT:
                    result = await this.getScreenshot(sessionId);
                    break;
                case BrowserActionType.EXECUTE_SCRIPT:
                    result = await this.executeScript(sessionId, action.payload.script);
                    break;
                case BrowserActionType.ANALYZE_VIEWPORT_WITH_VISION:
                    result = await this.analyzeViewportWithVision(sessionId, action.payload.prompt, action.payload.provider);
                    break;
                default:
                    throw new Error(`Unsupported action type: ${(action as any).type}`);
            }
        } catch (error) {
            const actionError: ActionError = {
                action,
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                },
                timestamp: new Date(),
            };
            session.errors = [...(session.errors || []), actionError];
            await this.eventBus.publish('browser.action.failed', {
                sessionId,
                userId: session.authContext.userId,
                ...actionError,
            });
            throw error; // rethrow
        }

        await this.executeHooks('afterAction', sessionId, action, result);
        
        await this.eventBus.publish('browser.action.completed', {
            sessionId,
            userId: session.authContext.userId,
            action,
            resultSummary: this.summarizeResult(result),
            timestamp: new Date(),
        });

        return result;
    }

    private summarizeResult(result: any): any {
        if (result instanceof Buffer) {
            return { type: 'buffer', size: result.length };
        }
        if (typeof result === 'string' && result.length > 256) {
            return `${result.substring(0, 256)}...`;
        }
        return result;
    }

    // --- Core Action Implementations ---

    public async navigate(sessionId: string, url: string): Promise<NavigationResult> {
        const session = this.getSession(sessionId);
        try {
            const response = await this.browserController.navigate(session.page, url, {
                timeout: this.options.timeout,
                waitUntil: 'networkidle2',
            });
            const content = await session.page.content();
            const title = await session.page.title();
            return {
                url: session.page.url(),
                statusCode: response?.status() || 0,
                content,
                title,
            };
        } catch (error) {
            throw new NavigationError(url, error.message);
        }
    }

    public async click(sessionId: string, selector: string): Promise<{ success: true }> {
        const session = this.getSession(sessionId);
        try {
            await this.browserController.click(session.page, selector, { timeout: this.options.timeout });
            return { success: true };
        } catch (error) {
            throw new SelectorTimeoutError(selector, 'click', error.message);
        }
    }

    public async type(sessionId: string, selector: string, text: string): Promise<{ success: true }> {
        const session = this.getSession(sessionId);
        try {
            await this.browserController.type(session.page, selector, text, { timeout: this.options.timeout });
            return { success: true };
        } catch (error) {
            throw new SelectorTimeoutError(selector, 'type', error.message);
        }
    }

    public async extract(sessionId: string, selector: string, extractType: 'text' | 'html' = 'text'): Promise<ExtractionResult> {
        const session = this.getSession(sessionId);
        try {
            const result = await this.browserController.extract(session.page, selector, extractType, { timeout: this.options.timeout });
            return {
                selector,
                type: extractType,
                data: result,
            };
        } catch (error) {
            throw new SelectorTimeoutError(selector, 'extract', error.message);
        }
    }

    public async getScreenshot(sessionId: string, options?: { fullPage?: boolean; encoding?: 'base64' | 'binary' }): Promise<string | Buffer> {
        const session = this.getSession(sessionId);
        return this.browserController.screenshot(session.page, {
            fullPage: options?.fullPage || false,
            encoding: options?.encoding || 'base64',
        });
    }

    /**
     * Executes a sandboxed JavaScript snippet on the page.
     * This method represents the tension between openness/power and control/safety.
     * We mitigate risks by not exposing Node.js context and logging executions.
     * @param sessionId The session ID.
     * @param script A string containing the JavaScript to execute.
     * @returns The result of the script execution.
     */
    public async executeScript(sessionId: string, script: string): Promise<any> {
        const session = this.getSession(sessionId);
        this.logger.warn('Executing arbitrary script in session.', { sessionId, script: script.substring(0, 100) });
        try {
            // The script is executed in the browser's context, not Node.js, which provides some sandboxing.
            const result = await this.browserController.executeScript(session.page, script);
            return result;
        } catch (error) {
            throw new ExecutionError(script, error.message);
        }
    }

    /**
     * Uses a vision model to analyze the current viewport and provide structured output.
     * This is a powerful, high-level action that integrates AI vendors directly.
     * It highlights the cost vs. quality trade-off: API calls are expensive but can
     * overcome challenges of complex, dynamic UIs where selectors fail.
     * @param sessionId The session ID.
     * @param prompt The prompt for the vision model (e.g., "Find the login button").
     * @param provider The vision provider to use ('openai', 'anthropic', etc.).
     * @returns The structured response from the vision model.
     */
    public async analyzeViewportWithVision(sessionId: string, prompt: string, provider: string = 'openai'): Promise<any> {
        const visionProvider = this.visionProviders.get(provider);
        if (!visionProvider) {
            throw new Error(`Vision provider '${provider}' is not configured or available.`);
        }

        this.logger.info(`Analyzing viewport with vision provider: ${provider}`, { sessionId, prompt });

        const screenshotBase64 = await this.getScreenshot(sessionId, { encoding: 'base64' }) as string;

        try {
            const analysis = await visionProvider.analyzeImage(screenshotBase64, prompt);
            
            await this.eventBus.publish('browser.vision.analysis', {
                sessionId,
                provider,
                prompt,
                cost: analysis.cost, // Assuming provider returns cost info
                tokens: analysis.tokens,
                timestamp: new Date(),
            });

            return analysis.result;
        } catch (error) {
            this.logger.error(`Vision analysis failed for provider ${provider}`, { sessionId, error });
            throw new Error(`Vision analysis failed: ${error.message}`);
        }
    }

    /**
     * Shuts down the browser agent and all active sessions.
     */
    public async shutdown(): Promise<void> {
        this.logger.info('Shutting down BrowserAgent...');
        const sessionIds = Array.from(this.sessions.keys());
        for (const sessionId of sessionIds) {
            await this.endSession(sessionId).catch(err => 
                this.logger.error(`Error closing session ${sessionId} during shutdown`, { error: err })
            );
        }
        await this.browserController.closeBrowser();
        this.logger.info('BrowserAgent shut down successfully.');
    }
}