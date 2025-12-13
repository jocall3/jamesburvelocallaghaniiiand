# APP_01_Sourcing_SignalAggregator

> **LEGAL DISCLAIMER**: This software is provided "as is" for informational and technical demonstration purposes only. It does not constitute financial, investment, or legal advice. No guarantees are made regarding the accuracy of signals generated. Users are responsible for compliance with all applicable data scraping, privacy, and securities laws in their jurisdiction.

## 1. Problem Statement: The Signal-to-Noise Asymmetry

In the modern high-velocity information landscape, the cost of missing a critical development (e.g., a breakthrough research paper, a stealth competitor's hiring spree, or a supply chain disruption) is immense. However, the cost of attention is equally high.

Traditional sourcing tools rely on keyword matching, resulting in:
1.  **High Noise**: Thousands of irrelevant alerts.
2.  **Latency**: Discovery happens days after the event.
3.  **Fragmentation**: Data lives in silos (GitHub, arXiv, SEC filings, Social Media).

**APP_01_Sourcing_SignalAggregator** solves this by treating the internet as a high-throughput stream, applying multi-stage AI filtering to distill terabytes of unstructured text into high-confidence, structured business signals.

## 2. Architectural Tension: Signal vs. Noise

The core engineering tension in this application is **Recall vs. Precision**.

*   **Maximize Recall (Openness)**: Ingest everything. Risk: Drowning the user in false positives, increasing compute costs linearly with input volume.
*   **Maximize Precision (Control)**: Strict filters. Risk: Missing the "Black Swan" event because it didn't fit a pre-defined schema.

**Resolution**: A tiered architecture.
1.  **L1 (Cheap/Fast)**: Heuristic & Regex filtering at the edge.
2.  **L2 (Moderate)**: Vector similarity search against interest clusters (Pinecone/Weaviate).
3.  **L3 (Expensive/Slow)**: LLM-based reasoning (GPT-4/Claude 3) for final verification and summarization.

## 3. Architecture

```ascii
[ External Sources ]                                      [ Control Plane ]
      |                                                          |
(RSS, Twitter, GitHub,                                    (Policy, Thresholds,
 SEC, News APIs)                                           Source Config)
      |                                                          |
      v                                                          v
+---------------------+    +----------------------+    +---------------------+
|  Ingestion Gateway  | -> |  Normalization Pipe  | -> |  Embedding Engine   |
| (Rate Limits/Proxies)|   | (Clean/Chunk/Hash)   |    | (OpenAI/Cohere)     |
+---------------------+    +----------------------+    +---------------------+
                                                                 |
                                                                 v
+---------------------+    +----------------------+    +---------------------+
|   Signal API (REST) | <- |   Scoring & Ranker   | <- |  Vector Database    |
| (JSON/Webhooks)     |    | (LLM Consensus)      |    | (Dedup/Cluster)     |
+---------------------+    +----------------------+    +---------------------+
      |
      v
[ Consumers ]
(VC Analysts, Hedge Funds,
 Corp Strategy, Auto-Traders)
```

## 4. Core Integrations

This application abstracts over multiple AI providers to ensure resilience and optimal performance per task:

*   **Ingestion & Parsing**: Unstructured.io, LangChain loaders.
*   **Embeddings**: OpenAI `text-embedding-3-small` (Cost), Cohere `embed-english-v3.0` (Quality).
*   **Vector Storage**: Pinecone (Serverless), Weaviate (Self-hosted option).
*   **Reasoning/Scoring**: Anthropic Claude 3.5 Sonnet (Nuance), OpenAI GPT-4o (Speed), Mistral Large (EU Compliance).
*   **Orchestration**: Shared `CORE_SDK` Event Bus.

## 5. Revenue Surface

This application is designed as a high-margin B2B SaaS or Data-as-a-Service (DaaS) offering.

| Tier | Features | Pricing Model | Unit Economics |
| :--- | :--- | :--- | :--- |
| **Observer** | Raw feed, L1 filters only, 24h delay. | Free / Freemium | Loss leader (Storage costs only). |
| **Analyst** | Real-time, L2 Vector search, 500 signals/day. | $499/mo | Positive (Compute < 10% of MRR). |
| **Strategist** | L3 LLM Scoring, Custom Ontologies, API Access. | $2,500/mo | High Margin (LLM costs passed through). |
| **Enterprise** | On-prem deployment, Dedicated Vector Pods, Audit Logs. | $50k+/yr | Service + License. |

**Upsell Path**: Users start with the raw feed. As they get overwhelmed, they pay for the "Scoring Engine" (L3) to save time.

## 6. Cost Drivers & Unit Economics

*   **Ingestion Bandwidth**: Low cost.
*   **Vector Storage**: Linear growth with data retention policies.
    *   *Optimization*: Aggressive TTL (Time-to-Live) for raw noise; permanent storage only for high-score signals.
*   **Inference (The Killer)**: Running GPT-4 on every tweet is bankruptcy.
    *   *Optimization*: The "Funnel" architecture ensures only top 1% of data hits the expensive LLMs.
    *   *Metric*: Cost per Valid Signal (CPVS). Target: < $0.05.

## 7. Failure Modes

1.  **Source Poisoning**: Adversarial actors injecting SEO spam or fake news to trigger signals.
    *   *Mitigation*: Domain reputation scoring and cross-referencing multiple sources.
2.  **Drift**: "AI" becomes a buzzword, flooding the vector space.
    *   *Mitigation*: Dynamic re-centering of vector clusters via `/update-triggers`.
3.  **Vendor Outage**: OpenAI goes down.
    *   *Mitigation*: Automatic fallback to Azure AI or Anthropic via `CORE_SDK` adapter.

## 8. Self-Querying Agent Interface

This app complies with the ecosystem's introspection protocol.

### Endpoints

*   `GET /introspect`: Returns current health, queue depth, and active model providers.
*   `GET /assumptions`: Returns hardcoded heuristics (e.g., "GitHub stars > 50 implies relevance").
*   `GET /failure-modes`: Returns active circuit breaker states.
*   `POST /update-triggers`: Forces a re-indexing of the vector space or prompt update.

### Agent Metadata

```yaml
agent_metadata:
  app_id: "APP_01"
  name: "Sourcing_SignalAggregator"
  purpose: "Ingest raw web data and distill into structured business intelligence signals."
  dependencies:
    - "CORE_SDK"
    - "APP_05_Identity_AuthCore" (for API access)
    - "APP_10_Infra_CostController" (for budget caps)
  invalidation_conditions:
    - "Source API schema change"
    - "Embedding model dimension mismatch"
    - "CPVS exceeds $0.10"
  adjacent_apps:
    - "APP_02_Market_TrendAnalyzer" (Consumer of signals)
    - "APP_14_Agents_MultiModelOrchestrator" (For complex reasoning)
```

## 9. Getting Started

### Prerequisites
*   Python 3.11+
*   Redis (Message Broker)
*   PostgreSQL (Metadata)
*   API Keys: OpenAI, Anthropic, Pinecone (set in `.env`)

### Installation

```bash
pip install -r requirements.txt
python main.py --mode=worker
```

### Configuration

Edit `config/sources.yaml` to define ingestion targets:

```yaml
sources:
  - type: rss
    url: "https://arxiv.org/rss/cs.AI"
    interval: 300
  - type: twitter_mock
    keywords: ["#AI", "#Startup", "#Funding"]
```

## 10. License

Proprietary. Unauthorized copying, modification, or distribution is strictly prohibited.
See `LICENSE` file for details.