# APP_01_Inference_CostRouter

## Overview

**Inference CostRouter** is a production-grade, policy-driven middleware designed to arbitrate LLM inference requests across multiple providers (OpenAI, Anthropic, Azure, Bedrock, Groq, Cohere) in real-time. It serves as the financial firewall for AI operations, optimizing for cost, latency, and quality based on semantic complexity and strict enterprise governance rules.

This application acts as a unified gateway, decoupling application logic from specific model providers, preventing vendor lock-in, and enabling real-time arbitrage of token prices.

## Problem Statement

As enterprises scale AI adoption, inference costs become volatile and opaque. Developers often default to the most capable (and expensive) models (e.g., GPT-4, Claude 3.5 Opus) for all tasks, regardless of difficulty. 

Specific pain points:
1.  **Over-provisioning**: Using SOTA models for simple classification or summarization tasks.
2.  **Vendor Lock-in**: Hard-coded SDK dependencies make switching providers during outages or price hikes impossible.
3.  **Lack of Controls**: No centralized mechanism to enforce budget caps per tenant, team, or feature.
4.  **Latency Unpredictability**: Single-provider dependency leads to application downtime during provider degradation.

## Architecture

The system uses a high-performance proxy architecture with a pluggable strategy engine.

```ascii
                                      +---------------------+
                                      |  Global Config &    |
                                      |  Policy Registry    |
                                      +----------+----------+
                                                 |
+-------------+      +-------------+      +------v------+
| Client App  | ---> | API Gateway | ---> | Router Core |
+-------------+      +-------------+      +------+------+
                            |                    |
                            |          +---------+---------+
                            |          |                   |
                   +--------v----------v-------+   +-------v-------+
                   | Semantic Analyzer (NLP)   |   | Cost Ledger   |
                   | (Complexity Scoring)      |   | (Budgeting)   |
                   +-----------+---------------+   +-------+-------+
                               |                           |
                               v                           v
                   +-----------------------------------------------+
                   |              Provider Adapters                |
                   | (Normalization, Retry, Circuit Breaking)      |
                   +---+-------------+-------------+-----------+---+
                       |             |             |           |
                 +-----v----+  +-----v-----+  +----v----+  +---v---+
                 | OpenAI   |  | Anthropic |  | Azure   |  | Groq  |
                 +----------+  +-----------+  +---------+  +-------+
```

## Core Capabilities

1.  **Smart Routing Strategies**:
    *   `lowest-cost`: Routes to the cheapest provider meeting minimum quality bars.
    *   `lowest-latency`: Routes to the fastest provider (e.g., Groq/Cerebras) for real-time needs.
    *   `semantic-tiering`: Analyzes prompt complexity; routes simple queries to 7B models and complex reasoning to Frontier models.
    *   `fallback-cascade`: Automatically retries secondary providers on 5xx errors or timeouts.

2.  **Financial Governance**:
    *   Real-time budget enforcement (Token bucket algorithm).
    *   Project-level and User-level spend caps.
    *   Projected cost estimation before execution.

3.  **Unified Interface**:
    *   Exposes an OpenAI-compatible `/v1/chat/completions` endpoint.
    *   Normalizes parameters (temperature, stop sequences) across 10+ vendors.

4.  **Observability**:
    *   Detailed logging of input/output tokens, cost, and latency per request.
    *   "Shadow Mode": Run a cheaper model in parallel to compare results without serving them.

## Integrations

The router includes built-in adapters for:
*   **Frontier**: OpenAI (GPT-4o), Anthropic (Claude 3.5), Google (Gemini 1.5).
*   **Open/Hosted**: Meta Llama 3 (via Groq, Bedrock, or Azure), Mistral.
*   **Enterprise**: Azure OpenAI, AWS Bedrock, Vertex AI.

## Revenue Surface

This application is designed to be monetized as:
1.  **Managed Gateway (SaaS)**: Charge a markup on routed tokens (e.g., 5%) or a flat fee per million requests.
2.  **Enterprise License**: Deploy into customer VPCs for compliance.
3.  **Savings Share**: Contractual agreement to take 20% of proven cost reductions compared to a baseline.

## Unit Economics

*   **Compute Cost**: Negligible (< $0.00005 per request) for the routing logic (Go/Rust based).
*   **Latency Overhead**: < 15ms added latency for decision engine.
*   **Value Proposition**: Can reduce inference bills by 40-70% by offloading 80% of traffic to smaller, cheaper models.

## Cost Drivers

1.  **Egress Bandwidth**: High volume of text data transfer.
2.  **Semantic Analysis Compute**: If using a local embedding model for complexity scoring, GPU/CPU usage increases.
3.  **Telemetry Storage**: Storing full request/response bodies for audit trails (configurable).

## Failure Modes

1.  **Global Provider Outage**: If all configured providers fail, the router returns a standardized 503 with `Retry-After`.
2.  **Misrouting**: A complex prompt routed to a weak model may yield hallucinations. Mitigated by `x-min-quality` headers.
3.  **Rate Limit Deadlocks**: If all keys are rate-limited, the system queues requests (increasing latency) or rejects them based on policy.

## API Surface

### `POST /v1/chat/completions`
Standard chat completion endpoint.
**Extensions**:
*   `x-router-mode`: `cost` | `speed` | `quality`
*   `x-budget-limit`: `0.005` (Max USD for this request)
*   `x-require-jurisdiction`: `eu` | `us`

### `GET /introspect`
Returns system health, active provider latencies, and current routing distribution.

### `GET /metrics`
Prometheus-compatible metrics endpoint (request_count, token_usage, cost_saved).

## Self-Querying Agent Metadata

```yaml
agent_metadata:
  purpose: "Centralized arbitration of LLM inference to optimize cost, speed, and quality."
  dependencies: 
    - "APP_02_Identity_AuthCore"
    - "APP_05_Observability_Telemetry"
    - "APP_37_Governance_AuditTrailEngine"
  invalidation_conditions:
    - "Provider API schema breaking changes"
    - "Network partition > 500ms"
    - "Invalidation of API keys"
  adjacent_apps:
    - "APP_14_Agents_MultiModelOrchestrator"
    - "APP_22_Evaluation_BenchmarkService"
  capabilities:
    - "routing"
    - "cost-tracking"
    - "rate-limiting"
    - "failover"
```

## Legal & Compliance

*   **Data Residency**: Supports region-locking to ensure data does not leave specific jurisdictions (GDPR/CCPA compliance hooks).
*   **No Training**: The router explicitly flags requests to providers with `opt-out` for training where supported.
*   **Disclaimer**: This software acts as a conduit. Users are responsible for the content sent to third-party AI providers and must adhere to their respective Acceptable Use Policies.
*   **Audit**: All routing decisions are logged with a cryptographic hash for auditability.

## Getting Started

1.  **Configuration**: Copy `.env.example` to `.env` and populate provider keys.
2.  **Policy**: Edit `config/routing_rules.yaml` to define model tiers.
3.  **Run**:
    ```bash
    docker-compose up -d
    ```
4.  **Verify**:
    ```bash
    curl -X POST http://localhost:8000/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{"model": "router-auto", "messages": [{"role": "user", "content": "Hello!"}]}'
    ```

---
*Part of the 75-App Autonomous Ecosystem*