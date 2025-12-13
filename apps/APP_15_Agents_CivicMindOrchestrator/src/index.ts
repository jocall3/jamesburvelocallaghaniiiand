/*
 * Copyright (c) 2024. The Ecosyste.ms Platform / APP_15_Agents_CivicMindOrchestrator
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * ---
 *
 * This application is part of a larger ecosystem of 75 distinct applications.
 *
 * Project: Ecosyste.ms
 * App Name: APP_15_Agents_CivicMindOrchestrator
 *
 * Purpose:
 * An advanced agent orchestrator with a strong focus on safety, ethical guidelines,
 * and compliance for public-good or civic-oriented tasks. It enforces policies
 * from APP_01_Inference_CostRouter, logs extensively to APP_37_Governance_AuditTrailEngine,
 * and preferentially uses models fine-tuned for safety and helpfulness.
 *
 * The core architectural tension of this application is Utility vs. Safety.
 * It aims to provide powerful agentic capabilities while rigorously constraining
 * them within predefined ethical and operational boundaries. This tension is
 * visible in the multi-stage plan refinement process, which includes generation,
 * sanitization, policy validation, and final approval before execution.
 */

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosInstance } from 'axios';
import {
    Logger,
    Config,
    AuthMiddleware,
    EventBusClient,
    TypedAPIResponse,
    ServiceDiscovery,
    EcosystemEvent,
    ErrorCodes,
    BaseError,
} from '@ecosystem/core-sdk';

// --- AGENT METADATA (for self-querying) ---
const agent_metadata = {
    purpose: "To orchestrate multi-step AI agent tasks under strict safety, ethical, and policy constraints, suitable for civic or public-good applications.",
    dependencies: [
        "APP_01_Inference_CostRouter: for policy enforcement and model routing decisions.",
        "APP_37_Governance_AuditTrailEngine: for comprehensive, immutable audit logging of all actions.",
        "core-sdk: for auth, logging, config, and event bus communication.",
        "AI Vendors: Anthropic, Google AI Platform (Vertex AI), OpenAI for access to safety-aligned models."
    ],
    invalidation_conditions: [
        "Major breaking changes in the API contracts of APP_01 or APP_37.",
        "Deprecation of safety-focused model APIs by key vendors (e.g., Claude API, Gemini Safety Settings).",
        "Significant drift in the performance or safety alignment of underlying models, requiring recalibration of the Plan Sanitizer."
    ],
    adjacent_apps: [
        "APP_14_Agents_MultiModelOrchestrator: A more general-purpose orchestrator from which this app derives its core concepts but adds a safety/policy layer.",
        "APP_58_Narrative_ModelExplainabilityUI: Can be used to visualize the decision-making process and safety interventions of missions executed by this orchestrator.",
        "APP_38_Governance_PolicyEditor: Provides a UI for defining the policies that APP_01 enforces and this app consumes."
    ]
};

// --- TYPE DEFINITIONS ---

enum MissionStatus {
    PENDING = 'PENDING',
    PLANNING = 'PLANNING',
    SANITIZING = 'SANITIZING',
    AWAITING_POLICY_APPROVAL = 'AWAITING_POLICY_APPROVAL',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

enum StepStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    SKIPPED = 'SKIPPED',
}

interface CivicMissionInput {
    objective: string;
    context?: Record<string, any>;
    constraints: string[]; // e.g., "Do not generate personally identifiable information", "All sources must be cited"
    requestorId: string;
    jurisdiction?: string; // For jurisdictional feature flags
}

interface MissionStep {
    stepId: string;
    description: string;
    tool_call?: {
        name: string;
        arguments: Record<string, any>;
    };
    model_prompt?: string;
    dependencies: string[]; // stepIds this step depends on
    status: StepStatus;
    result?: any;
    error?: string;
    cost?: number; // in micro-units
    startedAt?: Date;
    completedAt?: Date;
}

interface ExecutionPlan {
    planId: string;
    rawPlan: MissionStep[];
    sanitizedPlan: MissionStep[];
    justificationForChanges: string; // Explanation from the sanitizer model
}

interface CivicMission {
    missionId: string;
    status: MissionStatus;
    objective: string;
    constraints: string[];
    requestorId: string;
    executionPlan?: ExecutionPlan;
    finalResult?: any;
    auditTrail: any[];
    createdAt: Date;
    updatedAt: Date;
}

// --- INTER-APP COMMUNICATION CONTRACTS ---

interface PolicyDecisionRequest {
    missionId: string;
    objective: string;
    plan: MissionStep[];
    jurisdiction?: string;
}

interface PolicyDecisionResponse {
    approved: boolean;
    reason: string;
    policyId: string;
    recommendedModel: string; // Model suggested by APP_01 based on cost/policy
    costCapMicroUnits?: number;
}

interface AuditEventRequest {
    sourceApp: 'APP_15_Agents_CivicMindOrchestrator';
    eventType: string; // e.g., 'MISSION_CREATED', 'PLAN_SANITIZED', 'POLICY_REJECTED'
    timestamp: string;
    actor: { type: string; id: string }; // e.g., { type: 'user', id: '...' } or { type: 'system', id: 'PlanSanitizer' }
    details: Record<string, any>;
    severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
}

// --- ERRORS ---

class OrchestrationError extends BaseError {
    constructor(message: string, code: number, details?: any) {
        super(message, code, 'ORCHESTRATION_ERROR', details);
    }
}

// --- CONFIGURATION ---

const config = new Config();
const PORT = config.get('PORT', 3015);
const logger = new Logger('APP_15_CivicMindOrchestrator');
const eventBus = new EventBusClient();
const serviceDiscovery = new ServiceDiscovery();

// --- MODEL PROVIDER ADAPTERS ---

interface ModelProviderAdapter {
    generate(prompt: string, systemPrompt?: string): Promise<string>;
}

class AnthropicAdapter implements ModelProviderAdapter {
    private apiKey: string;
    private client: AxiosInstance;
    constructor() {
        this.apiKey = config.getOrThrow('ANTHROPIC_API_KEY');
        this.client = axios.create({
            baseURL: 'https://api.anthropic.com/v1',
            headers: {
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
        });
    }
    async generate(prompt: string, systemPrompt?: string): Promise<string> {
        try {
            const response = await this.client.post('/messages', {
                model: 'claude-3-sonnet-20240229', // Prioritizes a balanced, safe model
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: 'user', content: prompt }],
            });
            return response.data.content[0].text;
        } catch (error) {
            logger.error('Anthropic API error', { error });
            throw new OrchestrationError('Failed to generate text with Anthropic', ErrorCodes.VENDOR_API_ERROR, { vendor: 'Anthropic' });
        }
    }
}

class GoogleVertexAIAdapter implements ModelProviderAdapter {
    private apiKey: string;
    private projectId: string;
    private client: AxiosInstance;
    constructor() {
        this.apiKey = config.getOrThrow('GOOGLE_API_KEY');
        this.projectId = config.getOrThrow('GOOGLE_PROJECT_ID');
        this.client = axios.create({
            baseURL: `https://us-central1-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/us-central1/publishers/google/models`,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
    }
    async generate(prompt: string, systemPrompt?: string): Promise<string> {
        try {
            const response = await this.client.post(':predict', {
                model: 'gemini-1.5-pro-preview-0409',
                contents: {
                    role: 'user',
                    parts: { text: prompt }
                },
                system_instruction: systemPrompt ? { parts: { text: systemPrompt } } : undefined,
                safety_settings: [ // Enforce high safety levels
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                ],
            });
            return response.data.predictions[0].content.parts[0].text;
        } catch (error) {
            logger.error('Google Vertex AI API error', { error });
            throw new OrchestrationError('Failed to generate text with Google Vertex AI', ErrorCodes.VENDOR_API_ERROR, { vendor: 'Google' });
        }
    }
}

// --- CORE SERVICES ---

class AuditLogger {
    private auditServiceUrl: string | null = null;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        try {
            this.auditServiceUrl = await serviceDiscovery.getServiceUrl('APP_37_Governance_AuditTrailEngine');
        } catch (error) {
            logger.error('Failed to discover APP_37. Audit logging will be disabled.', { error });
        }
    }

    async log(event: Omit<AuditEventRequest, 'sourceApp' | 'timestamp'>): Promise<void> {
        if (!this.auditServiceUrl) {
            logger.warn('Audit service not available. Skipping log.', { eventType: event.eventType });
            return;
        }

        const auditEvent: AuditEventRequest = {
            ...event,
            sourceApp: 'APP_15_Agents_CivicMindOrchestrator',
            timestamp: new Date().toISOString(),
        };

        try {
            await axios.post(`${this.auditServiceUrl}/v1/log`, auditEvent);
        } catch (error) {
            logger.error('Failed to send audit log to APP_37', { error, auditEvent });
        }
    }
}

class PolicyEnforcer {
    private policyServiceUrl: string | null = null;

    constructor(private auditLogger: AuditLogger) {
        this.initialize();
    }

    private async initialize() {
        try {
            this.policyServiceUrl = await serviceDiscovery.getServiceUrl('APP_01_Inference_CostRouter');
        } catch (error) {
            logger.error('Failed to discover APP_01. Policy enforcement will be disabled.', { error });
        }
    }

    async getPolicyDecision(request: PolicyDecisionRequest): Promise<PolicyDecisionResponse> {
        if (!this.policyServiceUrl) {
            logger.warn('Policy service not available. Approving request by default.', { missionId: request.missionId });
            await this.auditLogger.log({
                eventType: 'POLICY_DECISION_BYPASSED',
                actor: { type: 'system', id: 'PolicyEnforcer' },
                details: { missionId: request.missionId, reason: 'APP_01 not available' },
                severity: 'WARN',
            });
            return {
                approved: true,
                reason: 'Policy service unavailable, proceeding with caution.',
                policyId: 'default-bypass-policy',
                recommendedModel: 'default-safe-model',
            };
        }

        try {
            const response = await axios.post<PolicyDecisionResponse>(`${this.policyServiceUrl}/v1/decide`, request);
            const decision = response.data;
            await this.auditLogger.log({
                eventType: 'POLICY_DECISION_RECEIVED',
                actor: { type: 'system', id: 'PolicyEnforcer' },
                details: { missionId: request.missionId, decision },
                severity: 'INFO',
            });
            return decision;
        } catch (error) {
            logger.error('Failed to get policy decision from APP_01', { error, request });
            await this.auditLogger.log({
                eventType: 'POLICY_DECISION_FAILED',
                actor: { type: 'system', id: 'PolicyEnforcer' },
                details: { missionId: request.missionId, error: error.message },
                severity: 'ERROR',
            });
            throw new OrchestrationError('Could not communicate with Policy Enforcement Service', ErrorCodes.SERVICE_UNAVAILABLE, { service: 'APP_01' });
        }
    }
}

// --- ORCHESTRATOR CORE LOGIC ---

class CivicMindOrchestrator {
    private missions: Map<string, CivicMission> = new Map();
    private plannerModel: ModelProviderAdapter;
    private sanitizerModel: ModelProviderAdapter;
    private auditLogger: AuditLogger;
    private policyEnforcer: PolicyEnforcer;

    constructor() {
        this.auditLogger = new AuditLogger();
        this.policyEnforcer = new PolicyEnforcer(this.auditLogger);
        // Use a powerful model for planning
        this.plannerModel = new GoogleVertexAIAdapter();
        // Use a model known for strong safety and instruction following for sanitization
        this.sanitizerModel = new AnthropicAdapter();
    }

    public async createMission(input: CivicMissionInput): Promise<CivicMission> {
        const missionId = uuidv4();
        const mission: CivicMission = {
            missionId,
            status: MissionStatus.PENDING,
            objective: input.objective,
            constraints: input.constraints,
            requestorId: input.requestorId,
            auditTrail: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.missions.set(missionId, mission);
        this.updateMissionStatus(missionId, MissionStatus.PENDING);

        await this.auditLogger.log({
            eventType: 'MISSION_CREATED',
            actor: { type: 'user', id: input.requestorId },
            details: { missionId, objective: input.objective, constraints: input.constraints },
            severity: 'INFO',
        });

        // Asynchronously start the planning process
        this.processMission(missionId).catch(err => {
            logger.error(`Unhandled error processing mission ${missionId}`, { error: err });
            this.updateMissionStatus(missionId, MissionStatus.FAILED, { error: 'Unhandled processing error' });
        });

        return mission;
    }

    private async processMission(missionId: string): Promise<void> {
        try {
            // 1. Generate Raw Plan
            const rawPlan = await this.generateRawPlan(missionId);

            // 2. Sanitize Plan
            const { sanitizedPlan, justification } = await this.sanitizePlan(missionId, rawPlan);

            const mission = this.missions.get(missionId)!;
            mission.executionPlan = {
                planId: uuidv4(),
                rawPlan,
                sanitizedPlan,
                justificationForChanges: justification,
            };
            this.missions.set(missionId, mission);

            // 3. Get Policy Approval
            const policyDecision = await this.getPolicyApproval(missionId, sanitizedPlan);
            if (!policyDecision.approved) {
                this.updateMissionStatus(missionId, MissionStatus.REJECTED, { reason: policyDecision.reason });
                return;
            }

            this.updateMissionStatus(missionId, MissionStatus.APPROVED);

            // 4. Execute Mission
            await this.executeMission(missionId);

        } catch (error) {
            logger.error(`Failed to process mission ${missionId}`, { error });
            this.updateMissionStatus(missionId, MissionStatus.FAILED, { error: error.message });
            await this.auditLogger.log({
                eventType: 'MISSION_PROCESSING_FAILED',
                actor: { type: 'system', id: 'Orchestrator' },
                details: { missionId, error: error.message },
                severity: 'CRITICAL',
            });
        }
    }

    private async generateRawPlan(missionId: string): Promise<MissionStep[]> {
        this.updateMissionStatus(missionId, MissionStatus.PLANNING);
        const mission = this.missions.get(missionId)!;

        const prompt = `
            Based on the following objective and constraints, generate a step-by-step execution plan.
            Format the output as a JSON array of objects, where each object represents a step.
            Each step must have: 'description', 'tool_call' (optional), and 'dependencies' (an array of stepIds it depends on).
            Assign a unique 'stepId' to each step (e.g., "step_1", "step_2").
            The plan should be logical, efficient, and directly address the objective.

            Objective: "${mission.objective}"
            Constraints: ${mission.constraints.map(c => `- ${c}`).join('\n')}

            Example of a step:
            {
              "stepId": "step_1",
              "description": "Gather initial data about topic X from public sources.",
              "tool_call": { "name": "web_search", "arguments": { "query": "Topic X overview" } },
              "dependencies": []
            }

            Now, generate the plan for the given objective.
        `;

        const systemPrompt = "You are a meticulous planning agent. Your task is to create a detailed, machine-readable execution plan.";
        const responseJson = await this.plannerModel.generate(prompt, systemPrompt);

        try {
            const plan = JSON.parse(responseJson);
            // Basic validation
            if (!Array.isArray(plan)) throw new Error("Plan is not an array.");
            plan.forEach(step => {
                if (!step.stepId || !step.description || !step.dependencies) {
                    throw new Error("Invalid step structure in plan.");
                }
                step.status = StepStatus.PENDING;
            });
            await this.auditLogger.log({
                eventType: 'RAW_PLAN_GENERATED',
                actor: { type: 'system', id: 'PlannerAgent' },
                details: { missionId, plan },
                severity: 'INFO',
            });
            return plan;
        } catch (error) {
            logger.error('Failed to parse generated plan', { responseJson, error });
            throw new OrchestrationError('Planner agent generated an invalid plan format.', ErrorCodes.INVALID_INPUT, { rawResponse: responseJson });
        }
    }

    private async sanitizePlan(missionId: string, rawPlan: MissionStep[]): Promise<{ sanitizedPlan: MissionStep[], justification: string }> {
        this.updateMissionStatus(missionId, MissionStatus.SANITIZING);
        const mission = this.missions.get(missionId)!;

        const prompt = `
            You are a safety and ethics guardian AI. Your task is to review and, if necessary, modify an execution plan to ensure it strictly adheres to a set of constraints.
            You must analyze the plan for potential risks, including privacy violations, generation of harmful content, misinformation, and actions that could be perceived as malicious or unethical.
            If a step is unsafe, you can modify it, add a warning/verification step, or remove it entirely.
            You MUST output a JSON object with two keys: "sanitizedPlan" (the modified plan, in the same format as the input) and "justification" (a detailed, step-by-step explanation of every change you made and why, or a statement that no changes were necessary).

            Constraints to enforce:
            ${mission.constraints.map(c => `- ${c}`).join('\n')}
            - Do not perform any action that could be interpreted as surveillance.
            - Do not interact with non-public APIs or systems without explicit tools.
            - Avoid creating or disseminating unverified information. Add verification steps where necessary.
            - Ensure all data handling is anonymized if it involves user data.

            Original Plan:
            ${JSON.stringify(rawPlan, null, 2)}

            Now, provide your analysis and the sanitized plan in the specified JSON format.
        `;

        const systemPrompt = "You are a rigorous safety and ethics auditor. Your primary goal is to prevent harm and ensure compliance. Be conservative in your judgments.";
        const responseJson = await this.sanitizerModel.generate(prompt, systemPrompt);

        try {
            const result = JSON.parse(responseJson);
            if (!result.sanitizedPlan || !result.justification) {
                throw new Error("Sanitizer response missing required keys.");
            }
            result.sanitizedPlan.forEach(step => step.status = StepStatus.PENDING);

            await this.auditLogger.log({
                eventType: 'PLAN_SANITIZED',
                actor: { type: 'system', id: 'SanitizerAgent' },
                details: { missionId, rawPlan, sanitizedPlan: result.sanitizedPlan, justification: result.justification },
                severity: 'INFO',
            });
            return result;
        } catch (error) {
            logger.error('Failed to parse sanitizer response', { responseJson, error });
            throw new OrchestrationError('Sanitizer agent generated an invalid response format.', ErrorCodes.INVALID_INPUT, { rawResponse: responseJson });
        }
    }

    private async getPolicyApproval(missionId: string, plan: MissionStep[]): Promise<PolicyDecisionResponse> {
        this.updateMissionStatus(missionId, MissionStatus.AWAITING_POLICY_APPROVAL);
        const mission = this.missions.get(missionId)!;

        const request: PolicyDecisionRequest = {
            missionId,
            objective: mission.objective,
            plan,
        };

        return this.policyEnforcer.getPolicyDecision(request);
    }

    private async executeMission(missionId: string): Promise<void> {
        this.updateMissionStatus(missionId, MissionStatus.RUNNING);
        const mission = this.missions.get(missionId)!;
        const plan = mission.executionPlan!.sanitizedPlan;

        // Simple topological sort / dependency-based execution
        const stepMap = new Map(plan.map(step => [step.stepId, step]));
        const completedSteps = new Set<string>();

        let executableSteps = plan.filter(step => step.dependencies.length === 0);

        while (completedSteps.size < plan.length) {
            if (executableSteps.length === 0) {
                throw new OrchestrationError('Execution stalled: Circular dependency or failed step.', ErrorCodes.EXECUTION_FAILURE, { missionId });
            }

            const stepToExecute = executableSteps.pop()!;
            stepMap.get(stepToExecute.stepId)!.status = StepStatus.RUNNING;
            this.missions.set(missionId, mission);

            try {
                // In a real system, this would involve a tool registry and execution logic.
                // Here we simulate it.
                logger.info(`Executing step: ${stepToExecute.description}`, { missionId, stepId: stepToExecute.stepId });
                await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
                const result = `Result of '${stepToExecute.description}'`;

                stepToExecute.result = result;
                stepToExecute.status = StepStatus.COMPLETED;
                completedSteps.add(stepToExecute.stepId);

                await this.auditLogger.log({
                    eventType: 'STEP_COMPLETED',
                    actor: { type: 'system', id: 'ExecutorAgent' },
                    details: { missionId, stepId: stepToExecute.stepId, result },
                    severity: 'INFO',
                });

                // Find next executable steps
                plan.forEach(nextStep => {
                    if (nextStep.status === StepStatus.PENDING && nextStep.dependencies.every(dep => completedSteps.has(dep))) {
                        executableSteps.push(nextStep);
                    }
                });

            } catch (error) {
                stepToExecute.status = StepStatus.FAILED;
                stepToExecute.error = error.message;
                this.updateMissionStatus(missionId, MissionStatus.FAILED, { failedStep: stepToExecute.stepId });
                await this.auditLogger.log({
                    eventType: 'STEP_FAILED',
                    actor: { type: 'system', id: 'ExecutorAgent' },
                    details: { missionId, stepId: stepToExecute.stepId, error: error.message },
                    severity: 'ERROR',
                });
                return; // Stop execution on failure
            }
        }

        this.updateMissionStatus(missionId, MissionStatus.COMPLETED, { finalResult: "All steps completed successfully." });
    }

    private updateMissionStatus(missionId: string, status: MissionStatus, details: any = {}) {
        const mission = this.missions.get(missionId);
        if (mission) {
            mission.status = status;
            mission.updatedAt = new Date();
            if (status === MissionStatus.FAILED || status === MissionStatus.REJECTED) {
                mission.finalResult = { error: details };
            }
            if (status === MissionStatus.COMPLETED) {
                mission.finalResult = details.finalResult;
            }
            this.missions.set(missionId, mission);
            logger.info(`Mission ${missionId} status updated to ${status}`, { details });

            // Publish event to the ecosystem
            const event: EcosystemEvent = {
                source: 'APP_15_Agents_CivicMindOrchestrator',
                type: `civic_mission.${status.toLowerCase()}`,
                payload: { missionId, status, ...details },
                timestamp: new Date().toISOString(),
            };
            eventBus.publish('agent_events', event);
        }
    }

    public getMission(missionId: string): CivicMission | undefined {
        return this.missions.get(missionId);
    }
}

// --- API LAYER (Express) ---

const app = express();
const authMiddleware = new AuthMiddleware();
const orchestrator = new CivicMindOrchestrator();

app.use(express.json());
app.use(authMiddleware.verifyToken.bind(authMiddleware)); // Secure all endpoints

// API to create and start a new mission
app.post('/v1/missions', (req: Request, res: Response, next: NextFunction) => {
    const { objective, context, constraints, jurisdiction } = req.body;
    const requestorId = (req as any).user.id;

    if (!objective || !constraints || !Array.isArray(constraints)) {
        return next(new OrchestrationError('Missing required fields: objective and constraints (array).', ErrorCodes.INVALID_INPUT));
    }

    const missionInput: CivicMissionInput = { objective, context, constraints, requestorId, jurisdiction };

    orchestrator.createMission(missionInput)
        .then(mission => {
            res.status(202).json(new TypedAPIResponse(mission, `Mission ${mission.missionId} accepted for processing.`));
        })
        .catch(err => next(err));
});

// API to get the status and result of a mission
app.get('/v1/missions/:missionId', (req: Request, res: Response, next: NextFunction) => {
    const { missionId } = req.params;
    const mission = orchestrator.getMission(missionId);

    if (!mission) {
        return next(new OrchestrationError(`Mission with ID ${missionId} not found.`, ErrorCodes.NOT_FOUND));
    }

    res.status(200).json(new TypedAPIResponse(mission));
});

// --- SELF-QUERYING ENDPOINTS ---

app.get('/introspect', (req: Request, res: Response) => {
    res.json(new TypedAPIResponse({
        appName: 'APP_15_Agents_CivicMindOrchestrator',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        ...agent_metadata
    }));
});

app.get('/assumptions', (req: Request, res: Response) => {
    res.json(new TypedAPIResponse({
        assumptions: [
            {
                id: 'A01',
                scope: 'Inter-App Communication',
                assumption: 'Dependent services (APP_01, APP_37) are available and adhere to their API contracts.',
                mitigation: 'Service discovery with health checks and fallback logic (e.g., default approval if APP_01 is down). Extensive logging for failures.'
            },
            {
                id: 'A02',
                scope: 'AI Model Behavior',
                assumption: 'The sanitizer model (Anthropic Claude) can reliably identify and mitigate risks in generated plans based on natural language constraints.',
                mitigation: 'Using models specifically trained for safety, providing very clear and structured system prompts, and having a human review loop for highly sensitive missions (future feature).'
            },
            {
                id: 'A03',
                scope: 'Plan Parsing',
                assumption: 'The planner and sanitizer models will consistently return valid JSON as requested.',
                mitigation: 'Robust JSON parsing with error handling and retry mechanisms. If parsing fails, the mission is marked as FAILED to prevent execution of malformed plans.'
            }
        ]
    }));
});

app.get('/failure-modes', (req: Request, res: Response) => {
    res.json(new TypedAPIResponse({
        failure_modes: [
            {
                mode: 'Policy Rejection',
                description: 'The sanitized plan is rejected by APP_01 due to policy violations (cost, model usage, action type).',
                detection: 'Direct API response from APP_01.',
                recovery: 'Mission is terminated and marked as REJECTED. User must revise the objective or constraints.'
            },
            {
                mode: 'Sanitization Failure',
                description: 'The sanitizer model fails to produce a valid JSON output or produces a plan that is still unsafe.',
                detection: 'JSON parsing errors. For unsafe plans, this is a latent risk mitigated by the model choice and prompting.',
                recovery: 'Mission is marked as FAILED. For latent risks, post-mortem analysis via audit logs is required.'
            },
            {
                mode: 'Execution Deadlock',
                description: 'A step in the plan fails, or a circular dependency prevents further progress.',
                detection: 'The execution loop finds no executable steps while not all steps are complete.',
                recovery: 'Mission is marked as FAILED. The state of the plan shows the point of failure.'
            },
            {
                mode: 'Dependency Unavailability',
                description: 'APP_01 or APP_37 is unreachable.',
                detection: 'Network errors during API calls.',
                recovery: 'PolicyEnforcer has a fallback to approve with a warning. AuditLogger logs to console and continues. This maintains availability but degrades governance.'
            }
        ]
    }));
});

app.get('/update-triggers', (req: Request, res: Response) => {
    res.json(new TypedAPIResponse({
        update_triggers: [
            {
                trigger: 'New Safety-Aligned Model Release',
                action: 'Evaluate the new model for the sanitizer or planner role. Update ModelProviderAdapters and potentially the core prompts to leverage new capabilities (e.g., better tool use, more reliable JSON output).'
            },
            {
                trigger: 'Change in APP_01 Policy Schema',
                action: 'Update the `PolicyDecisionRequest` and `PolicyDecisionResponse` types and the logic in `PolicyEnforcer` to match the new contract.'
            },
            {
                trigger: 'New Civic Constraint Pattern',
                description: 'A new class of ethical or legal constraint becomes common (e.g., related to a new data privacy law).',
                action: 'Update the system prompt for the `PlanSanitizer` to explicitly include rules and checks for this new constraint pattern.'
            }
        ]
    }));
});

// --- ERROR HANDLING ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof BaseError) {
        logger.warn('API Error', { code: err.code, message: err.message, details: err.details });
        res.status(err.httpCode).json(new TypedAPIResponse(null, err.message, { code: err.code, details: err.details }));
    } else {
        logger.error('Unhandled API Error', { error: err.message, stack: err.stack });
        res.status(500).json(new TypedAPIResponse(null, 'An internal server error occurred.', { code: ErrorCodes.INTERNAL_SERVER_ERROR }));
    }
});

// --- SERVER INITIALIZATION ---
app.listen(PORT, () => {
    logger.info(`APP_15_Agents_CivicMindOrchestrator listening on port ${PORT}`);
    eventBus.connect().then(() => logger.info('Event bus connected.'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    // server.close(() => {
    //     logger.info('HTTP server closed');
    //     eventBus.disconnect().then(() => logger.info('Event bus disconnected.'));
    // });
});