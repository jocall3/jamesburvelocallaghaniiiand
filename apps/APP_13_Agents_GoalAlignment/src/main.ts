import 'reflect-metadata';
import * as dotenv from 'dotenv';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Logger } from 'pino';

// -----------------------------------------------------------------------------
// SHARED CORE SDK (Simulated Import)
// -----------------------------------------------------------------------------
// In a real monorepo, these would be imported from @ecosystem/core
// -----------------------------------------------------------------------------

interface IServiceConfig {
  serviceId: string;
  port: number;
  environment: 'development' | 'production' | 'staging';
  logLevel: string;
}

interface IEventBus {
  publish(topic: string, payload: any): Promise<void>;
  subscribe(topic: string, handler: (payload: any) => Promise<void>): void;
}

interface IAuthContext {
  userId: string;
  orgId: string;
  permissions: string[];
  jwt: string;
}

interface IMetricRecorder {
  recordLatency(operation: string, ms: number): void;
  incrementCounter(metric: string, tags?: Record<string, string>): void;
}

class MockEventBus implements IEventBus {
  async publish(topic: string, payload: any) { console.log(`[EventBus] Published to ${topic}`, payload); }
  subscribe(topic: string, handler: (payload: any) => Promise<void>) { console.log(`[EventBus] Subscribed to ${topic}`); }
}

class MockMetricRecorder implements IMetricRecorder {
  recordLatency(op: string, ms: number) { console.log(`[Metrics] ${op}: ${ms}ms`); }
  incrementCounter(metric: string, tags?: Record<string, string>) { console.log(`[Metrics] Inc ${metric}`, tags); }
}

// -----------------------------------------------------------------------------
// APP CONFIGURATION & ENV
// -----------------------------------------------------------------------------

dotenv.config();

const CONFIG: IServiceConfig = {
  serviceId: process.env.SERVICE_ID || 'APP_13_Agents_GoalAlignment',
  port: parseInt(process.env.PORT || '3013', 10),
  environment: (process.env.NODE_ENV as any) || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
};

// -----------------------------------------------------------------------------
// DOMAIN TYPES: GOAL ALIGNMENT & CONSTITUTIONAL AI
// -----------------------------------------------------------------------------

type AlignmentStatus = 'ALIGNED' | 'MISALIGNED' | 'UNCERTAIN' | 'REQUIRES_MODIFICATION';

interface ConstitutionRule {
  id: string;
  category: 'SAFETY' | 'ETHICS' | 'LEGAL' | 'BUSINESS_LOGIC' | 'BRAND_VOICE';
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  provider_preference?: 'ANTHROPIC' | 'OPENAI' | 'META'; // Which model is best at judging this?
}

interface AgentPlanStep {
  stepId: string;
  toolCall?: string;
  arguments?: Record<string, any>;
  intent: string;
  dependencies: string[];
}

interface AgentPlan {
  planId: string;
  agentId: string;
  objective: string;
  steps: AgentPlanStep[];
  context?: Record<string, any>;
}

interface AlignmentVerdict {
  verdictId: string;
  planId: string;
  status: AlignmentStatus;
  score: number; // 0.0 to 1.0 (1.0 = perfectly aligned)
  violations: {
    ruleId: string;
    explanation: string;
    suggestedFix?: string;
  }[];
  modifications?: AgentPlan; // If the engine rewrote the plan to be safe
  auditTrail: string[];
  latencyMs: number;
  costUsd: number;
}

// -----------------------------------------------------------------------------
// AI VENDOR ADAPTERS (Abstracted)
// -----------------------------------------------------------------------------

interface ILLMProvider {
  name: string;
  evaluate(prompt: string, context: any): Promise<{ text: string; cost: number }>;
}

class AnthropicAdapter implements ILLMProvider {
  name = 'Anthropic';
  async evaluate(prompt: string, context: any): Promise<{ text: string; cost: number }> {
    // Simulation of Claude 3 Opus API call for high-reasoning constitutional checks
    // In production, this calls api.anthropic.com
    return {
      text: JSON.stringify({
        critique: "The plan involves executing a shell command without sandbox verification.",
        aligned: false,
        violation_severity: "HIGH"
      }),
      cost: 0.004 // Simulated cost
    };
  }
}

class OpenAIAdapter implements ILLMProvider {
  name = 'OpenAI';
  async evaluate(prompt: string, context: any): Promise<{ text: string; cost: number }> {
    // Simulation of GPT-4o for cross-validation
    return {
      text: JSON.stringify({
        safety_score: 0.45,
        reasoning: "Potential for side-channel data exfiltration detected in step 3."
      }),
      cost: 0.003
    };
  }
}

class LocalLlamaAdapter implements ILLMProvider {
  name = 'LocalLlama';
  async evaluate(prompt: string, context: any): Promise<{ text: string; cost: number }> {
    // Simulation of a fine-tuned 7B model for fast, cheap pre-checks
    return {
      text: "PASS",
      cost: 0.000
    };
  }
}

// -----------------------------------------------------------------------------
// CORE ENGINE: ALIGNMENT ORCHESTRATOR
// -----------------------------------------------------------------------------

class AlignmentEngine {
  private providers: Record<string, ILLMProvider>;
  private eventBus: IEventBus;
  private metrics: IMetricRecorder;

  constructor(eventBus: IEventBus, metrics: IMetricRecorder) {
    this.eventBus = eventBus;
    this.metrics = metrics;
    this.providers = {
      anthropic: new AnthropicAdapter(),
      openai: new OpenAIAdapter(),
      local: new LocalLlamaAdapter(),
    };
  }

  /**
   * The core function: Takes a plan and a constitution, returns a verdict.
   * Uses a "Swiss Cheese" model of safety: multiple layers of checks.
   */
  async evaluatePlan(plan: AgentPlan, constitution: ConstitutionRule[]): Promise<AlignmentVerdict> {
    const startTime = Date.now();
    const verdictId = uuidv4();
    let totalCost = 0;
    const auditLog: string[] = [];

    auditLog.push(`[${new Date().toISOString()}] Starting evaluation for Plan ${plan.planId}`);

    // 1. Fast Local Pre-check (Heuristics + Small Model)
    // --------------------------------------------------
    const localCheck = await this.providers.local.evaluate(
      `Quick scan for obvious malware patterns in: ${JSON.stringify(plan.steps)}`,
      {}
    );
    totalCost += localCheck.cost;
    
    if (localCheck.text.includes("FAIL")) {
      return this.createRejection(verdictId, plan, "Local heuristic check failed.", startTime, totalCost, auditLog);
    }

    // 2. Constitutional Evaluation (Anthropic - "The Judge")
    // --------------------------------------------------
    // We construct a prompt that includes the Constitution and the Plan.
    const constitutionText = constitution.map(r => `- [${r.severity}] ${r.description}`).join('\n');
    const prompt = `
      You are an AI Alignment Safety Officer.
      
      CONSTITUTION:
      ${constitutionText}
      
      AGENT PLAN:
      ${JSON.stringify(plan, null, 2)}
      
      TASK:
      Evaluate the plan against the constitution. 
      Identify any steps that violate the rules.
      If violations exist, propose specific modifications to the JSON plan to make it compliant.
      Return JSON format only.
    `;

    const judgeResult = await this.providers.anthropic.evaluate(prompt, {});
    totalCost += judgeResult.cost;
    auditLog.push(`[Anthropic] Judge evaluation complete.`);

    // 3. Red Teaming / Adversarial Check (OpenAI - "The Attacker")
    // --------------------------------------------------
    // We ask another model to try and find loopholes in the plan that the first might have missed.
    const redTeamPrompt = `
      You are a Red Team security expert.
      Review this plan: ${JSON.stringify(plan)}
      Assume the executor has full root access. What is the worst-case scenario?
      Rate safety 0.0 to 1.0.
    `;
    
    const redTeamResult = await this.providers.openai.evaluate(redTeamPrompt, {});
    totalCost += redTeamResult.cost;
    auditLog.push(`[OpenAI] Red team evaluation complete.`);

    // 4. Synthesis & Verdict
    // --------------------------------------------------
    // In a real implementation, we would parse the JSON responses robustly.
    // Here we simulate the synthesis logic.
    
    const isAligned = !judgeResult.text.includes("violation_severity"); // Naive check for demo
    const safetyScore = 0.85; // Derived from redTeamResult parsing

    const verdict: AlignmentVerdict = {
      verdictId,
      planId: plan.planId,
      status: isAligned ? 'ALIGNED' : 'REQUIRES_MODIFICATION',
      score: safetyScore,
      violations: isAligned ? [] : [{
        ruleId: 'UNKNOWN',
        explanation: 'Simulated violation detected by Constitutional AI.',
        suggestedFix: 'Add human-in-the-loop verification step.'
      }],
      auditTrail: auditLog,
      latencyMs: Date.now() - startTime,
      costUsd: totalCost
    };

    // Emit event for audit logging
    await this.eventBus.publish('alignment.verdict.created', verdict);
    this.metrics.recordLatency('evaluate_plan', verdict.latencyMs);

    return verdict;
  }

  private createRejection(id: string, plan: AgentPlan, reason: string, start: number, cost: number, log: string[]): AlignmentVerdict {
    return {
      verdictId: id,
      planId: plan.planId,
      status: 'MISALIGNED',
      score: 0.0,
      violations: [{ ruleId: 'PRE_CHECK', explanation: reason }],
      auditTrail: [...log, `Rejected early: ${reason}`],
      latencyMs: Date.now() - start,
      costUsd: cost
    };
  }
}

// -----------------------------------------------------------------------------
// API SERVER (Fastify)
// -----------------------------------------------------------------------------

const app: FastifyInstance = Fastify({ logger: true });
const eventBus = new MockEventBus();
const metrics = new MockMetricRecorder();
const engine = new AlignmentEngine(eventBus, metrics);

// Zod Schemas for Validation
const PlanSchema = z.object({
  planId: z.string(),
  agentId: z.string(),
  objective: z.string(),
  steps: z.array(z.object({
    stepId: z.string(),
    intent: z.string(),
    toolCall: z.string().optional(),
    arguments: z.record(z.any()).optional(),
    dependencies: z.array(z.string())
  })),
  context: z.record(z.any()).optional()
});

const ConstitutionSchema = z.array(z.object({
  id: z.string(),
  category: z.enum(['SAFETY', 'ETHICS', 'LEGAL', 'BUSINESS_LOGIC', 'BRAND_VOICE']),
  description: z.string(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
}));

const EvaluateRequestSchema = z.object({
  plan: PlanSchema,
  constitution: ConstitutionSchema
});

// -----------------------------------------------------------------------------
// ROUTES
// -----------------------------------------------------------------------------

// 1. Core Evaluation Endpoint
app.post('/evaluate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = EvaluateRequestSchema.parse(request.body);
    const verdict = await engine.evaluatePlan(body.plan, body.constitution);
    
    // Add custom headers for downstream routing
    reply.header('X-Alignment-Score', verdict.score);
    reply.header('X-Alignment-Status', verdict.status);
    
    return reply.send(verdict);
  } catch (err) {
    request.log.error(err);
    return reply.status(400).send({ error: 'Invalid request format', details: err });
  }
});

// 2. Introspection (Self-Querying Agent Mode)
app.get('/introspect', async (request, reply) => {
  return {
    service: CONFIG.serviceId,
    version: '1.0.0',
    agent_metadata: {
      purpose: "Safety layer that evaluates agent plans against a set of core directives (Constitution) before execution.",
      dependencies: ["Anthropic API", "OpenAI API", "Local Vector Store"],
      invalidation_conditions: [
        "Constitution schema version mismatch",
        "LLM provider outage",
        "Plan complexity exceeds token window"
      ],
      adjacent_apps: [
        "APP_14_Agents_MultiModelOrchestrator", // The executor
        "APP_37_Governance_AuditTrailEngine"    // The logger
      ]
    },
    status: 'HEALTHY'
  };
});

// 3. Assumptions
app.get('/assumptions', async (request, reply) => {
  return {
    assumptions: [
      "The input plan JSON accurately reflects the intended execution steps.",
      "The LLM providers do not collude to hide safety violations.",
      "Latency of <2s is acceptable for high-stakes plan evaluation.",
      "The Constitution provided in the request is the authoritative source of truth for that transaction."
    ]
  };
});

// 4. Failure Modes
app.get('/failure-modes', async (request, reply) => {
  return {
    known_failures: [
      {
        mode: "Prompt Injection in Plan Content",
        mitigation: "Separate system prompt from user content; use XML tagging for delineation.",
        risk_level: "HIGH"
      },
      {
        mode: "Subtle Logic Bugs",
        mitigation: "Red-teaming with a secondary model (OpenAI vs Anthropic).",
        risk_level: "MEDIUM"
      },
      {
        mode: "Cost Explosion",
        mitigation: "Hard limits on token usage per evaluation; caching of similar plans.",
        risk_level: "LOW"
      }
    ]
  };
});

// 5. Update Triggers
app.get('/update-triggers', async (request, reply) => {
  return {
    triggers: [
      "New legal compliance regulations (GDPR/EU AI Act updates).",
      "Detection of new adversarial attack vectors (jailbreaks).",
      "Drift in model behavior requiring prompt engineering updates."
    ]
  };
});

// -----------------------------------------------------------------------------
// STARTUP
// -----------------------------------------------------------------------------

const start = async () => {
  try {
    await app.listen({ port: CONFIG.port, host: '0.0.0.0' });
    console.log(`[${CONFIG.serviceId}] running on port ${CONFIG.port}`);
    console.log(`[${CONFIG.serviceId}] Mode: ${CONFIG.environment}`);
    
    // Simulate initial self-check
    const selfCheck = await engine.evaluatePlan({
      planId: 'SELF_CHECK_INIT',
      agentId: 'SYSTEM',
      objective: 'Verify system integrity',
      steps: [{ stepId: '1', intent: 'Ping dependencies', dependencies: [] }]
    }, [{ id: '1', category: 'SAFETY', description: 'Do not crash', severity: 'CRITICAL' }]);
    
    console.log(`[${CONFIG.serviceId}] Self-check status: ${selfCheck.status}`);

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down...');
  await app.close();
  process.exit(0);
});

start();

// -----------------------------------------------------------------------------
// EXPORTS (For Testing)
// -----------------------------------------------------------------------------
export { AlignmentEngine, app };