# APP_11_Billing_TokenCounter

## 1. System Overview

**APP_11_Billing_TokenCounter** is a high-throughput, low-latency microservice designed to normalize, count, and attribute token usage across heterogeneous AI model providers. It serves as the financial source of truth for the ecosystem, translating raw text or image inputs into standardized cost units based on dynamic rate cards.

It addresses the "Black Box Billing" problem where organizations rely on vendor invoices without the ability to audit or predict costs in real-time.

### Agent Metadata

```yaml
agent_metadata:
  app_id: "APP_11"
  name: "Billing_TokenCounter"
  purpose: "Universal token normalization, cost attribution, and ledgering."
  dependencies:
    - "Shared_Core_SDK"
    - "Redis (Hot Ledger)"
    - "PostgreSQL (Durable Ledger)"
    - "Tiktoken / HuggingFace Tokenizers"
  invalidation_conditions:
    - "New model architecture release (requires tokenizer update)"
    - "Vendor pricing schema change"
  adjacent_apps:
    - "APP_01_Inference_CostRouter"
    - "APP_37_Governance_AuditTrailEngine"
    - "APP_50_Marketplace_CreditSystem"
  capabilities:
    - "Real-time token counting (Text, Image, Audio)"
    - "Multi-tenant ledger management"
    - "Budget enforcement hooks"
```

---

## 2. Problem Statement

In a multi-model ecosystem, "one token" is not a standard unit.
*   **OpenAI** uses `cl100k_base`.
*   **Anthropic** uses a different BPE scheme.
*   **Llama 3** has its own vocabulary.
*   **Image models** charge by resolution or step count.

Without a unified normalization layer, downstream billing is an approximation at best and a financial liability at worst. Developers cannot implement "stop on budget" logic if the cost is calculated asynchronously by the vendor 30 days later.

**The Solution**: A centralized counting authority that intercepts payloads (or processes logs), applies the correct tokenizer, calculates cost against a versioned rate card, and commits to a cryptographically verifiable ledger.

---

## 3. Architecture

The system balances **Precision** (exact BPE counting) vs **Latency** (heuristic estimation).

```ascii
                                      +---------------------+
                                      |   Rate Card Sync    |
                                      | (Vendor APIs/Config)|
                                      +----------+----------+
                                                 |
[Inference Request] --> +----------------+       v      +------------------+
                        |  Ingress API   | <--->(Cache) |  Rate Card Eng.  |
                        +-------+--------+              +--------+---------+
                                |                                |
                                v                                v
                        +-------+--------+              +--------+---------+
                        | Tokenizer Pool |              |   Cost Engine    |
                        | (WASM/Native)  |------------->| (Float/Decimal)  |
                        +-------+--------+              +--------+---------+
                                |                                |
                                v                                v
                        +-------+--------+              +--------+---------+
                        |  Audit Logger  |              |   Ledger Write   |
                        | (Async Queue)  |              | (Redis -> SQL)   |
                        +----------------+              +------------------+
```

### Core Components
1.  **Tokenizer Pool**: A scalable set of workers loading vendor-specific tokenizer definitions (tiktoken, sentencepiece, etc.).
2.  **Rate Card Engine**: Manages versioned pricing schemas (e.g., `gpt-4-0613` vs `gpt-4-1106-preview`).
3.  **Ledger**: Double-entry accounting system for tracking usage credits and debits.

---

## 4. Revenue Surface

This application generates value (and potential revenue) through:

1.  **Arbitrage & Markup**: Charging end-users a unified rate (e.g., $0.05/1k tokens) while routing to cheaper providers dynamically.
2.  **Cost Control as a Service**: Enterprise features for strict budget caps, alerting, and anomaly detection (e.g., "User X is burning $50/min").
3.  **Audit Compliance**: Selling immutable logs of exactly what was sent/received for financial audits.
4.  **SaaS Licensing**: Charging per-seat or per-transaction for the billing infrastructure itself.

---

## 5. Cost Drivers

*   **Compute (CPU)**: Tokenization is CPU-intensive. High throughput requires horizontal scaling of the Tokenizer Pool.
*   **Storage (Hot)**: Redis costs for maintaining real-time user balances and rate limits.
*   **Storage (Cold)**: Long-term retention of usage logs in PostgreSQL/S3.
*   **Network**: Ingress/Egress bandwidth, though payloads are generally text.

---

## 6. Integration & Extensibility

### Supported Vendors (Tokenization Strategies)
*   **OpenAI**: Native `tiktoken` integration.
*   **Anthropic**: Claude-specific tokenizer mapping.
*   **Hugging Face**: Generic `transformers` tokenizer support for Llama, Mistral, Falcon.
*   **Google Vertex**: Character/Byte offset mapping.
*   **Image Models (DALL-E, Midjourney)**: Resolution-based cost calculators.

### API Surface

**`POST /v1/count`**
Calculates tokens without billing.
```json
{
  "model": "gpt-4",
  "content": "Hello world..."
}
```

**`POST /v1/charge`**
Calculates tokens, computes cost, and deducts from a wallet.
```json
{
  "transaction_id": "tx_123",
  "tenant_id": "org_abc",
  "model": "claude-3-opus",
  "input_content": "...",
  "output_content": "..."
}
```

**`GET /introspect`**
Returns current health, loaded rate cards, and tokenizer versions.

---

## 7. Unit Economics Visibility

The system exposes metrics to Prometheus/Grafana:

*   `token_counter_processing_time_ms`: Latency overhead per request.
*   `cost_per_million_tokens_blended`: Average cost across all traffic.
*   `ledger_lock_contention`: Database write pressure.
*   `tokenizer_cache_hit_rate`: Efficiency of tokenizer loading.

---

## 8. Legal & Compliance

### Disclaimer
This software provides **estimations** of costs based on configured rate cards. It does not guarantee exact alignment with vendor invoices due to:
1.  Undocumented changes in vendor tokenization logic.
2.  Differences in floating-point arithmetic.
3.  Hidden vendor fees (e.g., context window overhead).

**No Financial Advice**: This tool is for operational cost tracking, not tax reporting.

### Jurisdictional Controls
*   **Feature Flag**: `ENABLE_EU_DATA_RESIDENCY` - Ensures usage logs are stored in specific regions.
*   **PII Redaction**: Configurable masking of payload content before logging to the ledger.

---

## 9. Setup & Deployment

### Prerequisites
*   Node.js 20+ or Python 3.11+ (Polyglot core)
*   Redis 7.x
*   PostgreSQL 15+

### Environment Variables
```bash
# Core
PORT=3011
LOG_LEVEL=info

# Persistence
DATABASE_URL=postgres://user:pass@localhost:5432/billing
REDIS_URL=redis://localhost:6379

# Configuration
RATE_CARD_URL=https://api.ecosystem.internal/config/rates.json
ENABLE_STRICT_MODE=true # Fails if tokenizer is unknown
```

### Quick Start
```bash
npm install
npm run build
npm start
```

---

## 10. Tension & Trade-offs

**Accuracy vs. Performance**:
*   *Strict Mode*: Loads the exact tokenizer for the model. High CPU, 100% accuracy.
*   *Fast Mode*: Uses a generic approximation (e.g., `len(text) / 4`). Zero CPU, ~90% accuracy.

**Design Choice**: The system defaults to **Strict Mode** for billing events (`/charge`) and **Fast Mode** for estimation events (`/count`), reflecting the tension between financial rigor and user experience.