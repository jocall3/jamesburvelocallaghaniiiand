# APP_05_Gateway_UniversalLLM

**The High-Performance, Vendor-Agnostic Inference Switchboard.**

## 1. Problem Statement

The AI landscape is fragmented. Integrating Large Language Models (LLMs) into production systems currently forces engineers to choose between:
1.  **Vendor Lock-in**: Hardcoding against OpenAI, Anthropic, or Bedrock SDKs, making migration painful and creating single points of failure.
2.  **Maintenance Hell**: Maintaining dozens of bespoke adapters to handle varying API schemas, tokenization methods, and error codes.
3.  **Opaque Observability**: Lacking a centralized view of latency, cost, and quality across different providers.

**APP_05_Gateway_UniversalLLM** solves this by providing a single, high-throughput API surface that abstracts over 50+ AI providers. It treats model inference as a commodity utility, handling routing, fallback, retries, and schema normalization transparently.

## 2. Architecture

The system is designed as a stateless, high-concurrency gateway built on the shared ecosystem Core SDK.

```ascii
                                      +---------------------+
                                      |   Configuration     |
                                      | (Routing Policies)  |
                                      +----------+----------+
                                                 |
+-------------+      +------------------+        v         +------------------+
|   Client    | ---> |  Ingress Layer   | ---> [ROUTER] -> |  Adapter Engine  |
| Application |      | (Auth, RateLim)  |        ^         | (Norm & Trans)   |
+-------------+      +------------------+        |         +--------+---------+
                                                 |                  |
                                        +--------+--------+         |
                                        |  State/Cache    |         |
                                        | (Redis/Vector)  |         |
                                        +-----------------+         |
                                                                    v
                                                          +---------------------+
                                                          | Provider Connectors |
                                                          +---------------------+
                                                          | - OpenAI            |
                                                          | - Anthropic         |
                                                          | - Google Vertex     |
                                                          | - AWS Bedrock       |
                                                          | - Azure AI          |
                                                          | - Hugging Face      |
                                                          | - Groq              |
                                                          | - ... (40+ others)  |
                                                          +---------------------+
```

### Key Components
1.  **Ingress Layer**: Validates JWTs via the shared Identity Model. Enforces tenant-level rate limits.
2.  **Router**: Determines which provider receives the request based on latency targets, cost caps, or specific model capabilities.
3.  **Adapter Engine**: Converts the unified internal request schema into provider-specific payloads (e.g., mapping `system_prompt` to Anthropic's top-level parameter vs OpenAI's message role).
4.  **Provider Connectors**: Isolated modules handling HTTP transport, streaming management, and specific error handling for each vendor.

## 3. Supported Integrations

This gateway includes native adapters for the following top-tier providers (non-exhaustive):

*   **Proprietary**: OpenAI, Anthropic, Google DeepMind (Gemini), Meta Llama (via various hosts), Mistral, Cohere, AI21.
*   **Cloud Platforms**: AWS Bedrock, Azure AI Studio, Google Vertex AI, Oracle Cloud AI.
*   **Inference Clouds**: Groq, Cerebras, SambaNova, Together AI, Anyscale, DeepInfra.
*   **Enterprise**: Databricks MosaicML, Snowflake Arctic, IBM WatsonX.

## 4. Tension & Trade-offs

**Abstraction vs. Specificity**
*   *The Tension*: To provide a truly universal API, we must find the lowest common denominator between providers. However, advanced features (like specific function calling formats or caching headers) are often vendor-specific.
*   *The Resolution*: We implement a "Leaky Abstraction" model. The core API covers 90% of use cases (text generation, chat, embeddings). For the remaining 10%, we expose a `provider_specific_overrides` field, allowing raw JSON injection for specific vendors, sacrificing portability for capability when strictly necessary.

## 5. Revenue Surface

This application is designed to be monetized as a middleware infrastructure service.

| Revenue Stream | Description | Metric |
| :--- | :--- | :--- |
| **Throughput Markup** | Small percentage fee on top of underlying provider costs. | % of Spend |
| **Enterprise Gateway** | License for self-hosted deployment within VPCs. | Per Node / Month |
| **Smart Routing** | Premium fee for "Lowest Cost" or "Lowest Latency" dynamic routing strategies. | Per Request |
| **Cache Hits** | Charge for serving cached responses (cheaper than inference, profitable for gateway). | Per 1k Tokens |

## 6. Unit Economics & Cost Drivers

*   **Compute**: Extremely low CPU/Memory footprint per request. The gateway is I/O bound.
*   **Egress**: Bandwidth costs for streaming large responses.
*   **Latency**: The primary "cost" to the user is the added hop (typically <10ms overhead).
*   **Storage**: Redis/Memcached costs for semantic caching (optional feature).

**Profitability Threshold**:
With a 1% markup on token costs, the gateway becomes profitable at approximately 50M tokens/day throughput, assuming standard cloud hosting costs.

## 7. Data & Privacy (Legal Defensibility)

*   **Zero Retention Default**: By default, the gateway does **not** log prompts or completions to disk. It streams data through memory buffers only.
*   **Audit Logging**: Configurable hooks allow enterprise customers to pipe logs to their own S3/Splunk instances (APP_37 integration).
*   **Jurisdictional Routing**: Feature flags allow restricting data flow to specific geographic regions (e.g., "EU-Only" routing to comply with GDPR).

**Disclaimer**: This software routes data to third-party providers. Users are responsible for reading and complying with the Terms of Service of the underlying AI vendors (OpenAI, Anthropic, etc.).

## 8. API Reference (Snapshot)

### POST `/v1/chat/completions`

Standardized endpoint compatible with OpenAI client libraries, but with supercharged routing capabilities.

**Headers**:
- `x-ecosystem-auth`: Bearer <token>
- `x-route-strategy`: `lowest-latency` | `lowest-cost` | `best-quality`

**Body**:
```json
{
  "model": "ecosystem-general-purpose-v1",
  "messages": [{"role": "user", "content": "Hello world"}],
  "fallback_providers": ["anthropic/claude-3-haiku", "meta/llama-3-70b"],
  "max_cost_usd": 0.002
}
```

## 9. Self-Querying Agent Metadata

To facilitate autonomous orchestration within the 75-app suite, this service exposes the following metadata via `/introspect`:

```yaml
agent_metadata:
  app_id: "APP_05"
  name: "Gateway_UniversalLLM"
  purpose: "Unified interface for LLM inference routing and normalization."
  capabilities:
    - "text-generation"
    - "embeddings"
    - "provider-fallback"
    - "cost-estimation"
  dependencies:
    - "CORE_SDK_v1"
    - "External_AI_Providers_HTTP"
  invalidation_conditions:
    - "Provider API schema deprecation"
    - "Network partition > 500ms"
  adjacent_apps:
    - "APP_01_Inference_CostRouter"  # Provides routing logic
    - "APP_37_Governance_AuditTrailEngine" # Consumes logs
    - "APP_14_Agents_MultiModelOrchestrator" # Primary consumer
```

## 10. Installation & Deployment

### Prerequisites
- Python 3.11+
- Redis (optional, for caching)
- Valid API keys for desired providers set in environment variables (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).

### Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the gateway
python -m app_05_gateway.main --port 8000 --workers 4
```

### Configuration
Configuration is managed via `config.yaml` or environment variables. See `config.example.yaml` for the full schema of provider mappings and routing rules.

---

*Generated for the Ecosystem Project. Strict adherence to Protocol 75.*