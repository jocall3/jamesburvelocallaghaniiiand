# APP_04_Memory_VectorVault

**Global Semantic Memory Orchestrator & Vector Abstraction Layer**

## 1. Overview

**VectorVault** is a production-grade, vendor-agnostic middleware for managing semantic memory at scale. It abstracts the complexities of underlying vector databases (Pinecone, Weaviate, Qdrant, pgvector) and embedding providers (OpenAI, Cohere, Hugging Face) into a unified, high-performance API.

Unlike a raw vector database, VectorVault provides **lifecycle management** for embeddings, handling model rotation, re-indexing, tiered storage (Hot/Warm/Cold), and automatic context window optimization. It is designed to serve as the long-term memory cortex for autonomous agent swarms.

### Core Tension: **Recall Precision vs. Retrieval Latency**
VectorVault explicitly exposes the trade-off between exhaustive, high-accuracy retrieval (using rerankers and hybrid search) and ultra-low-latency approximate nearest neighbor (ANN) lookups. This tension is configurable per-tenant and per-query.

---

## 2. Problem Statement

Building AI applications with long-term memory faces three critical failures:
1.  **Vendor Lock-in**: Hard-coding logic for a specific vector DB (e.g., Pinecone) makes migration painful when pricing or features change.
2.  **Embedding Drift**: When embedding models update (e.g., OpenAI `ada-002` to `text-embedding-3`), old vectors become useless. Re-embedding millions of records is an operational nightmare.
3.  **Context Pollution**: Naive retrieval stuffs the context window with irrelevant chunks, increasing costs and hallucination rates.

VectorVault solves these by treating memory as a managed service with virtualization over the physical storage and embedding layers.

---

## 3. Architecture

```ascii
                                      +---------------------+
                                      |   APP_00_Core_SDK   |
                                      |   (Auth / Events)   |
                                      +----------+----------+
                                                 |
          +--------------------------------------+--------------------------------------+
          |                                                                             |
+---------v---------+                                                         +---------v---------+
|   Ingest API      |                                                         |   Retrieval API   |
+---------+---------+                                                         +---------+---------+
          |                                                                             |
+---------v---------+      +---------------------+      +---------------------+         |
|  Chunking Engine  +----->|  Embedding Router   |<-----+   Query Planner     |<--------+
| (Semantic/Fixed)  |      | (OpenAI / Cohere)   |      | (Hybrid / Dense)    |
+---------+---------+      +----------+----------+      +----------+----------+
          |                           |                            |
          |                 +---------v---------+                  |
          +---------------->|  Vector Gateway   |<-----------------+
                            | (Adapter Pattern) |
                            +---------+---------+
                                      |
          +---------------------------+---------------------------+
          |                           |                           |
+---------v---------+       +---------v---------+       +---------v---------+
|    Pinecone       |       |    Weaviate       |       |    pgvector       |
| (High Perf/SaaS)  |       | (Hybrid Search)   |       | (Self-Hosted)     |
+-------------------+       +-------------------+       +-------------------+
```

---

## 4. Key Features

*   **Multi-Provider Abstraction**: Switch between Pinecone, Weaviate, Milvus, and Qdrant via configuration. No code changes required.
*   **Smart Embedding Rotation**: Automatically tracks the model version used for stored vectors. Provides background jobs to re-embed data when models are upgraded.
*   **Hybrid Search**: Combines dense vector search with sparse keyword search (BM25) for maximum recall.
*   **Reranking Pipeline**: Integrated support for Cohere Rerank or cross-encoders to refine results before returning them to the agent.
*   **Namespace Isolation**: Strict multi-tenant data isolation using namespaces and metadata filtering.
*   **Ephemeral vs. Durable**: Support for temporary memory sessions (Redis-backed) vs. long-term archival (S3 + Vector DB).

---

## 5. Integration & Configuration

### Supported Vendors (Adapters)
*   **Vector Stores**: Pinecone, Weaviate, Qdrant, Chroma, PostgreSQL (pgvector), Redis.
*   **Embedding Models**: OpenAI (`text-embedding-3-*`), Cohere (`embed-english-v3.0`), Google Vertex AI, Hugging Face (local/remote).
*   **Rerankers**: Cohere, BAAI/bge-reranker.

### Configuration Example (`config.yaml`)

```yaml
memory:
  default_backend: "pinecone_prod"
  backends:
    pinecone_prod:
      type: "pinecone"
      environment: "us-east-1"
      index: "agent-memory-01"
    local_dev:
      type: "pgvector"
      connection_string: "${DB_URL}"
  embedding:
    provider: "openai"
    model: "text-embedding-3-large"
    dimensions: 3072
  retrieval:
    use_reranker: true
    reranker_provider: "cohere"
    top_k_retrieval: 50
    top_k_final: 5
```

---

## 6. Revenue Surface

VectorVault is designed as a high-margin infrastructure component:

1.  **Managed Memory-as-a-Service**: Charge a markup on storage and compute (tokens) for managing the vector lifecycle.
2.  **Enterprise Features**:
    *   **Private VPC Peering**: Direct connection to enterprise vector stores.
    *   **Compliance Retention**: Automated TTL and deletion logs for GDPR/SOC2.
    *   **Custom Models**: Hosting fine-tuned embedding models.
3.  **Optimization Savings**: By using efficient chunking and caching embeddings, VectorVault reduces the customer's direct spend on OpenAI/Pinecone, allowing VectorVault to capture a percentage of savings.

---

## 7. Unit Economics & Cost Drivers

### Cost Drivers
*   **Embedding Tokens**: Linear cost based on volume of text ingested.
*   **Vector Storage**: Monthly cost per GB or per 1M vectors (vendor dependent).
*   **Reranking Compute**: GPU inference cost for reranking steps.
*   **Egress**: Data transfer fees if crossing cloud regions.

### Unit Economics
*   **Ingest Cost**: ~$0.0001 per 1k tokens (OpenAI small) + Storage overhead.
*   **Query Cost**: ~$0.001 per query (including embedding + vector DB lookup + reranking).
*   **Margin Goal**: 60-70% gross margin on managed tiers.

---

## 8. API Surface

### Standard Operations
*   `POST /v1/memory/ingest`: Chunk, embed, and store documents.
*   `POST /v1/memory/retrieve`: Semantic search with optional filtering and reranking.
*   `DELETE /v1/memory/prune`: Remove vectors by ID, metadata, or TTL.
*   `POST /v1/admin/reindex`: Trigger a background re-embedding job.

### Self-Querying Agent Mode (Mandatory)

*   `GET /introspect`: Returns current backend status, index stats, and embedding model versions.
*   `GET /assumptions`: Returns configured trade-offs (e.g., "Favoring speed over recall").
*   `GET /failure-modes`: Lists potential issues (e.g., "Pinecone rate limit approaching").
*   `POST /update-triggers`: Webhook receiver for index updates.

```yaml
agent_metadata:
  purpose: "Abstracted vector memory management and retrieval optimization."
  dependencies: 
    - "APP_00_Core_SDK"
    - "Pinecone"
    - "Weaviate"
    - "OpenAI"
    - "Cohere"
  invalidation_conditions: 
    - "Schema migration"
    - "Embedding model deprecation"
    - "Backend credential rotation"
  adjacent_apps: 
    - "APP_05_Memory_GraphWeaver"
    - "APP_14_Agents_MultiModelOrchestrator"
    - "APP_37_Governance_AuditTrailEngine"
```

---

## 9. Legal & Compliance

*   **License**: Proprietary / Enterprise License (see LICENSE file).
*   **Data Residency**: Configurable regions for vector storage to meet GDPR/CCPA.
*   **Disclaimer**: This software manages data persistence but does not guarantee zero data loss in the event of underlying provider (e.g., AWS, Pinecone) failure. Users are responsible for backup strategies.
*   **Audit**: All ingest and retrieval operations emit structured events to `APP_37_Governance_AuditTrailEngine`.

---

## 10. Failure Modes

1.  **Provider Outage**: If Pinecone/Weaviate goes down, the system degrades to read-only (if cached) or fails.
    *   *Mitigation*: Circuit breakers and fallback to secondary store (e.g., Postgres).
2.  **Embedding Mismatch**: Querying an index with a different embedding model than used for ingestion.
    *   *Mitigation*: Strict version tagging on all vectors; automatic rejection of mismatched queries.
3.  **Rate Limiting**: Exceeding API quotas for embedding providers.
    *   *Mitigation*: Internal token bucket rate limiter and exponential backoff queues.

---

## 11. Getting Started

1.  **Install Dependencies**: `pip install -r requirements.txt`
2.  **Set Environment**:
    ```bash
    export OPENAI_API_KEY="sk-..."
    export PINECONE_API_KEY="pc-..."
    export VECTOR_STORE_TYPE="pinecone"
    ```
3.  **Run Server**: `python main.py`
4.  **Verify**: `curl localhost:8000/introspect`