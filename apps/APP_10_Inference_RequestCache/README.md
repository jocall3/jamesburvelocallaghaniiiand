# APP_10_Inference_RequestCache

**A High-Performance Semantic Caching Layer for AI Inference**

---

## DISCLAIMER

This software is an infrastructure component designed for managing AI model requests. It does not generate, endorse, or validate the content of AI model responses. Cached responses are reflections of previously generated data and are subject to staleness and potential inaccuracies. Use of this system for mission-critical, financial, or life-safety applications is not recommended without extensive validation and fail-safe mechanisms. All usage must comply with jurisdictional laws and the terms of service of the underlying AI model providers.

---

## 1. Problem Statement

Modern AI applications face a significant challenge: the high cost and latency associated with repeated calls to large language models (LLMs). Many applications, from chatbots to content generation tools, frequently process identical or semantically similar user prompts. Each redundant API call incurs direct costs (pay-per-token), adds network latency, and consumes valuable GPU resources on the inference provider's side. This inefficiency acts as a direct brake on scalability and profitability.

`APP_10_Inference_RequestCache` solves this problem by providing a sophisticated, multi-layered caching service that sits between your application and the AI inference endpoints. It intelligently intercepts requests, determines if a valid response already exists for an identical or semantically similar prompt, and serves the cached response instantly, bypassing the expensive round-trip to the LLM.

## 2. Architecture

The system employs a two-tiered caching strategy to balance speed and semantic richness: a Level 1 (L1) exact-match cache and a Level 2 (L2) semantic-match cache.

**Tension: Cost Savings vs. Response Freshness/Accuracy**

The core architectural tension is the trade-off between maximizing cost savings and ensuring the freshness and contextual accuracy of responses. Aggressive caching (long TTLs, low semantic similarity thresholds) drastically reduces costs but increases the risk of serving stale or subtly incorrect answers. The entire API and configuration surface is designed to expose this trade-off to the operator, making it a first-class, configurable parameter of the system.

```ascii
+-----------------+      (1) Request      +-----------------------------+
|                 |---------------------->|                             |
|   Client App    |                       | APP_10_Inference_RequestCache |
|                 |      (7) Response     |                             |
+-----------------+<----------------------|   +---------------------+   |
                                          |   | (2) Normalize & Hash|   |
                                          |   +---------------------+   |
                                          |              |              |
                                          |   +---------------------+   |
                                          |   |  L1 Cache Check     |   |
                                          |   | (e.g., Redis)       |   |
                                          |   +---------------------+   |
                                          |      |           | (HIT)    |
                                          | (MISS)           '----------'
                                          |      |                      |
      +-----------------------------------+      |                      |
      | (3) Generate Embedding            |      |                      |
      | (e.g., OpenAI, Cohere, local)     |      |                      |
      +-----------------------------------+      |                      |
                       |                         |                      |
      |   +---------------------+                |                      |
      |   |  L2 Cache Check     |                |                      |
      |   | (Vector DB)         |                |                      |
      |   +---------------------+                |                      |
      |      |           | (HIT w/ threshold)    |                      |
      | (MISS)           '-----------------------'                      |
      |      |                                                          |
      |      | (4) Forward Request                                      |
      |      v                                                          |
+-----'-----------------------------------------------------------------'-----+
|                                                                             |
|  +--------------------------------+      (5) Response      +--------------+ |
|  | APP_01_Inference_CostRouter    |<-----------------------|              | |
|  | (or other inference endpoints) |----------------------->| AI Providers | |
|  +--------------------------------+      (e.g., OpenAI)   | (Anthropic)  | |
|                                                            | (etc.)       | |
|                                                            +--------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
      ^      |
      |      | (6) Store in L1 & L2 Caches w/ TTL
      |      '----------------------------------------------------------------'
      |
      '-----------------------------------------------------------------------'
```

**Workflow:**

1.  **Request Ingress:** The service receives a standard inference request (prompt, model parameters, etc.).
2.  **Normalization & Hashing (L1):** The request payload is normalized (e.g., whitespace, case) and a cryptographic hash is generated. This hash is used as the key for the L1 exact-match cache (e.g., Redis). A lookup is performed. If a hit occurs, the cached response is returned immediately.
3.  **Embedding Generation (L2):** On an L1 miss, the service uses a configured embedding model (e.g., OpenAI `text-embedding-3-small`, a local Sentence Transformer) to generate a vector embedding of the prompt text.
4.  **Semantic Search (L2):** This embedding is used to query a vector database (e.g., Pinecone, Weaviate, managed via `APP_17_Memory_VectorStoreManager`). The query searches for vectors within a configurable similarity threshold (e.g., cosine similarity > 0.98). If a sufficiently similar request is found, its corresponding response is retrieved and returned.
5.  **Cache Miss & Forwarding:** If both L1 and L2 caches miss, the original request is forwarded to the downstream inference service (e.g., `APP_01_Inference_CostRouter`).
6.  **Response Caching:** Upon receiving a fresh response from the inference service, it is stored in both caches. The L1 cache stores the `(hash, response)` pair, and the L2 cache stores the `(embedding, response)` pair. A configurable Time-To-Live (TTL) is applied to both entries.
7.  **Response Egress:** The fresh response is returned to the client.

## 3. Revenue Surface

This application is monetized as a critical infrastructure component that provides clear, measurable ROI.

*   **Tiered SaaS Subscriptions (Monthly/Annual):**
    *   **Developer:** Limited requests/month, small cache size, community support.
    *   **Pro:** Higher request limits, larger L1/L2 cache storage, configurable TTLs, basic analytics.
    *   **Business:** Very high request limits, choice of embedding models, advanced analytics on hit/miss rates and cost savings, longer data retention.

*   **Usage-Based Overage:**
    *   Per-request fee for cache lookups (e.g., $0.00001 per lookup).
    *   Per-GB fee for cache storage beyond the tier limit.

*   **Enterprise (Annual Contract):**
    *   **VPC/On-Prem Deployment:** Deploy the cache within the customer's cloud environment for maximum security and minimum latency.
    *   **Customizable Caching Policies:** Integration with `APP_37_Governance_AuditTrailEngine` to enforce rules like "never cache requests containing PII" or "only cache responses from specific models."
    *   **Event-Driven Invalidation:** Integration with `APP_32_Dataset_VersionManager` to automatically invalidate cache entries related to updated knowledge bases.
    *   **Premium Support & SLA:** Dedicated support channel and guaranteed uptime.
    *   **Cost Savings Dashboard:** A detailed, real-time dashboard quantifying money saved, latency reduced, and API calls avoided.

## 4. Cost Drivers

*   **L1 Cache (Key-Value Store):** Hosting costs for a managed Redis, Memcached, or DragonflyDB instance. Scales with the number of unique *exact* requests.
*   **L2 Cache (Vector Database):** This is a primary cost driver. Costs are associated with managed services like Pinecone or Weaviate, or the compute/memory resources for a self-hosted alternative. Scales with the number of unique *semantic* requests and the dimensionality of the embeddings.
*   **Embedding Model API Calls:** For every L1 cache miss, an API call is made to an embedding model. While cheaper than a full LLM call, this cost can be significant at scale. Offering local, open-source embedding models is a key cost-control feature.
*   **Service Compute:** The application's own compute instances (e.g., Kubernetes pods, VMs) for running the caching logic, API endpoints, and background jobs.
*   **Data Transfer:** Network egress costs for serving responses and communicating with downstream services.

## 5. Failure Modes

*   **Cache Poisoning:** A malicious or erroneous response is cached and served repeatedly.
    *   **Mitigation:** Strict TTLs are enforced. An admin API for manual cache invalidation (`DELETE /cache/entry/{hash_or_id}`) is provided. Integration with `APP_25_Evaluation_ResponseAssessor` can flag low-quality responses to prevent them from being cached.
*   **Stale Data:** The world or a knowledge base changes, but the cache continues to serve an outdated answer.
    *   **Mitigation:** TTLs are the primary defense. The system subscribes to events from `APP_32_Dataset_VersionManager` to proactively invalidate relevant cache entries when underlying data sources are updated.
*   **Semantic Mismatch (False Positive):** The system incorrectly deems two distinct prompts as semantically identical, returning a wrong or nonsensical answer.
    *   **Mitigation:** The semantic similarity threshold is a user-configurable parameter. A request header (`X-Cache-Bypass: true`) allows clients to force a fresh response. The system logs all L2 cache hits with their similarity scores for auditing.
*   **Cache Store Unavailability (Redis/VectorDB Down):** The backing data stores become unavailable.
    *   **Mitigation:** The system is designed to **fail open**. If a cache store is unreachable, the service logs the error and immediately forwards the request to the downstream inference provider. This preserves application availability at the expense of increased cost and latency. Health checks continuously monitor backend status.
*   **Embedding Model Failure:** The configured embedding model API is down or returning errors.
    *   **Mitigation:** The system gracefully degrades. It can be configured to fall back to L1 (exact-match) caching only, or to fail open and forward all requests. A circuit breaker pattern is implemented to avoid hammering a failing service.

---

## `agent_metadata`

```yaml
agent_metadata:
  purpose: "Provides a multi-layered (exact and semantic) caching service for AI inference requests to reduce latency and cost."
  dependencies:
    - "core.sdk.SharedKernel": "For common data structures and utilities."
    - "core.auth.IdentityService": "For authenticating and authorizing API requests."
    - "core.protocols.EventBus": "For receiving cache invalidation events."
    - "external.KeyValueStore": "Interface for L1 exact-match cache (e.g., Redis)."
    - "external.VectorDatabase": "Interface for L2 semantic-match cache (e.g., Pinecone)."
    - "external.EmbeddingProvider": "Interface for generating text embeddings."
  invalidation_conditions:
    - "TTL (Time-To-Live) on a cache entry expires."
    - "An explicit API call to DELETE /cache/entry/{id} is received."
    - "An 'entity_updated' event is received on the event bus from an adjacent app like APP_32_Dataset_VersionManager, triggering targeted invalidation."
    - "A global 'purge_all' administrative command is executed."
  adjacent_apps:
    - "APP_01_Inference_CostRouter": "Acts as the primary downstream consumer for cache misses."
    - "APP_11_Billing_UsageTracker": "Publishes events for cache hits/misses to be metered for billing."
    - "APP_37_Governance_AuditTrailEngine": "Logs all cache access, invalidation, and policy enforcement decisions for audit purposes."
    - "APP_17_Memory_VectorStoreManager": "Can be used as an abstraction layer over the underlying vector database, providing a unified management interface."