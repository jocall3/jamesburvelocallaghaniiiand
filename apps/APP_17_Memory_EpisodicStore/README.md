# APP_17_Memory_EpisodicStore

## 1. Overview

**APP_17_Memory_EpisodicStore** is a specialized persistence engine designed to provide Long-Term Episodic Memory (LTEM) for autonomous agents and LLM applications. Unlike standard RAG (Retrieval-Augmented Generation) systems that focus on semantic similarity of static documents, this application focuses on the **temporal and causal continuity** of agent interactions.

It treats memory not as a bag of vectors, but as a linked graph of "episodes"—discrete units of interaction bounded by time, intent, or session context. This allows agents to answer questions like "What did we agree on last Tuesday regarding the API refactor?" rather than just retrieving generic documentation about API refactors.

### Core Tension: Fidelity vs. Latency
The architectural design balances the need for high-fidelity recall (storing raw interaction traces) against query latency and context window constraints. It employs a "tiered consolidation" strategy where recent memories are raw, medium-term memories are summarized, and long-term memories are synthesized into narrative arcs.

---

## 2. Problem Statement

### The Amnesia Bottleneck
State-of-the-art LLMs are stateless. While context windows are growing (128k, 1M tokens), they are ephemeral and expensive. Standard vector databases solve semantic retrieval but fail at:
1.  **Temporal Reasoning**: "Before X happened but after Y."
2.  **Causal Linkage**: Understanding that Error A caused Fix B.
3.  **Identity Continuity**: Maintaining a consistent persona or user understanding across months of interaction.

### The Solution
An API-first memory controller that:
1.  Ingests interaction streams (User/Assistant turns).
2.  Segments streams into "Episodes".
3.  Generates embeddings enriched with temporal metadata.
4.  Background-processes episodes into hierarchical summaries.
5.  Provides a hybrid retrieval interface (Semantic + Temporal + Graph).

---

## 3. Architecture

```ascii
                                      +---------------------+
                                      |   Governance / ACL  |
                                      +----------+----------+
                                                 |
[ Client App ] ---> [ API Gateway (REST/gRPC) ]--+
                          |
                          v
                 +------------------+       +------------------+
                 |  Ingest Pipeline |------>|  Event Bus (NATS)|
                 +--------+---------+       +--------+---------+
                          |                          |
           +--------------v-------------+            v
           |  Segmentation Engine (LLM) |    +----------------+
           +--------------+-------------+    | Async Workers  |
                          |                  +-------+--------+
                          v                          |
           +----------------------------+            |
           |   Embedding Router         |<-----------+
           | (OpenAI / Cohere / Azure)  |            |
           +--------------+-------------+            |
                          |                          |
        +-----------------v--------------------------v-----------------+
        |                  Storage Abstraction Layer                   |
        |  +----------+  +----------+  +-------------+  +-----------+  |
        |  | Pinecone |  | Weaviate |  | TimescaleDB |  | S3 (Blob) |  |
        |  +----------+  +----------+  +-------------+  +-----------+  |
        +--------------------------------------------------------------+
```

### Components
1.  **Ingest Pipeline**: Validates schema, sanitizes PII (via `APP_37_Governance_AuditTrailEngine`), and buffers high-throughput streams.
2.  **Segmentation Engine**: Uses small, fast models (e.g., Haiku, GPT-3.5-Turbo) to detect topic shifts and cut streams into Episodes.
3.  **Embedding Router**: Multi-provider support to generate vectors. Supports dimension reduction adapters.
4.  **Async Workers**:
    *   **Consolidator**: Merges old episodes into summaries.
    *   **Graph Linker**: Establishes edges between related episodes (e.g., "Referenced By").
5.  **Storage Layer**: Hybrid approach. Vectors in Pinecone/Weaviate, Metadata in Postgres/TimescaleDB, Raw blobs in S3.

---

## 4. Integration & Ecosystem

This app is designed to function as the "Hippocampus" of the 75-app suite.

### Upstream Dependencies (Inputs)
*   **APP_14_Agents_MultiModelOrchestrator**: Pushes raw conversation logs to EpisodicStore.
*   **APP_01_Inference_CostRouter**: Used to optimize the cost of summarization and embedding generation.

### Downstream Consumers (Outputs)
*   **APP_58_Narrative_ModelExplainabilityUI**: Visualizes the memory graph to explain *why* an agent made a decision based on past context.
*   **APP_22_Eval_Benchmarking**: Uses historical episodes to create regression tests for agents.

### Vendor Integrations
*   **Vector Stores**: Pinecone (Serverless), Weaviate (Hybrid Search), Qdrant.
*   **Embeddings**: OpenAI `text-embedding-3-large`, Cohere `embed-english-v3.0` (for binary quantization support).
*   **LLMs (for Summarization)**: Anthropic Claude 3 Haiku (high context/cost ratio), Mistral Large.

---

## 5. API Surface

### `POST /v1/episodes`
Create a new memory episode.
```json
{
  "agent_id": "agt_8823",
  "session_id": "sess_001",
  "content": [
    {"role": "user", "text": "Deploy the staging environment.", "timestamp": "2023-10-27T10:00:00Z"},
    {"role": "assistant", "text": "Deploying...", "timestamp": "2023-10-27T10:00:05Z"}
  ],
  "tags": ["devops", "deployment"]
}
```

### `POST /v1/recall`
Retrieve context based on query and current state.
```json
{
  "query": "When was the last time we touched the staging config?",
  "agent_id": "agt_8823",
  "strategy": "hybrid_temporal",
  "lookback_window": "30d",
  "limit": 5
}
```

### `POST /v1/synthesize`
Force a consolidation of memories for a specific entity.
```json
{
  "entity_id": "user_123",
  "resolution": "weekly"
}
```

### `GET /introspect`
Standard agent-mode self-check.

---

## 6. Business Logic & Revenue Surface

### Revenue Model
1.  **Storage Tiering**: Charge per GB of stored history (Raw vs. Summarized).
2.  **Compute Markup**: Margin on embedding and summarization tokens.
3.  **Enterprise Features**:
    *   **"Photographic Memory"**: Zero-loss storage guarantees.
    *   **Compliance Vault**: WORM (Write Once Read Many) compliance for financial audit trails.
    *   **Private VPC Deployment**: Deploy the store into customer's AWS/Azure account.

### Cost Drivers
1.  **Vector Storage**: High dimensionality vectors are expensive at scale.
    *   *Mitigation*: Adaptive dimensionality reduction and quantization.
2.  **LLM Summarization**: Constant background processing of logs consumes tokens.
    *   *Mitigation*: Use cheaper models for initial pass, expensive models only for "Key Episodes".
3.  **Egress**: Retrieving large context blocks.

### Unit Economics
*   **Ingest Cost**: ~$0.05 per 1k interaction turns (Embedding + Indexing).
*   **Storage Cost**: ~$0.10 per GB/month (blended S3 + Vector DB).
*   **Retrieval Cost**: ~$0.001 per query.
*   **Price Point**: $29/month base + usage ($0.50/1k ops).

---

## 7. Configuration & Deployment

### Environment Variables
```bash
# Core
PORT=8080
LOG_LEVEL=info
ENV=production

# Auth
AUTH_ISSUER_URL=https://auth.internal.platform
AUTH_AUDIENCE=app_17_memory

# Backends
VECTOR_PROVIDER=pinecone
PINECONE_API_KEY=sk-...
PINECONE_ENV=us-east-1
OPENAI_API_KEY=sk-...

# Policy
RETENTION_DAYS=365
PII_REDACTION_ENABLED=true
```

### Docker Compose (Snippet)
```yaml
services:
  episodic-store:
    image: app_17_memory:latest
    environment:
      - VECTOR_PROVIDER=weaviate
    depends_on:
      - weaviate
      - redis
```

---

## 8. Legal & Compliance

### Disclaimer
This software stores user interactions which may contain Personally Identifiable Information (PII). It is the operator's responsibility to configure the `PII_REDACTION_ENABLED` flags and ensure compliance with GDPR, CCPA, and local regulations.

### Jurisdictional Controls
*   **Data Residency**: Configurable storage regions (e.g., force EU-West-1 for EU users).
*   **Right to be Forgotten**: Implements `DELETE /v1/entity/{id}` which performs a cascading delete across vector indices, raw logs, and summaries.

### Auditability
All memory modifications (insert, update, delete, synthesize) are emitted to the immutable event bus (`APP_37_Governance_AuditTrailEngine`).

---

## 9. Self-Querying Agent Metadata

```yaml
agent_metadata:
  purpose: "Provide persistent, temporal, episodic memory storage and retrieval for AI agents."
  dependencies:
    - "APP_00_Core_SharedSDK"
    - "APP_37_Governance_AuditTrailEngine"
    - "APP_01_Inference_CostRouter"
  invalidation_conditions:
    - "Schema version mismatch in vector store"
    - "Loss of connection to embedding provider"
    - "Auth token expiration"
  adjacent_apps:
    - "APP_14_Agents_MultiModelOrchestrator"
    - "APP_58_Narrative_ModelExplainabilityUI"
  capabilities:
    - "temporal_indexing"
    - "hierarchical_summarization"
    - "hybrid_search"
```

---

## 10. Failure Modes & Redundancy

1.  **Embedding Provider Outage**:
    *   *Behavior*: Ingest queues up in NATS/Kafka. Retrieval falls back to keyword search (BM25) on raw text if vectors cannot be generated for the query.
2.  **Vector DB Latency**:
    *   *Behavior*: Circuit breaker opens. System returns "Recent Short Term Memory" (from Redis cache) only, flagging response as `partial_context`.
3.  **Context Poisoning**:
    *   *Behavior*: If an agent ingests malicious prompts designed to skew future retrieval, the `APP_37` audit trail allows for "Memory Rollback" to a pre-infection state.

---

## 11. Getting Started

1.  **Install Dependencies**: `npm install`
2.  **Configure Providers**: Copy `.env.example` to `.env` and add API keys.
3.  **Run Migrations**: `npm run db:migrate` (Sets up Vector schemas).
4.  **Start Server**: `npm start`
5.  **Verify**: `curl localhost:8080/introspect`