# APP_28_ValueAdd_TalentNetworkGraph

**A Private Talent Intelligence Platform for Strategic Hiring and Network Leverage.**

---

**DISCLAIMER:** This software provides analytical tools for understanding professional networks based on provided data. It is not a replacement for professional recruitment services, due diligence, or human judgment. All outputs are probabilistic and should be independently verified. Use of this system must comply with all applicable data privacy laws, including GDPR and CCPA. The system makes no guarantees regarding hiring outcomes or candidate suitability.

---

## 1. Problem Statement

High-growth companies, particularly within a venture capital portfolio, compete fiercely for a limited pool of elite talent. Their success hinges on their ability to rapidly identify, attract, and hire key personnel. Traditional recruiting is slow, expensive, and relies on fragmented, siloed networks. VCs and their portfolio companies possess a vast, latent network of contacts across founders, investors, advisors, and employees, but this collective intelligence is unstructured and inaccessible.

`APP_28_ValueAdd_TalentNetworkGraph` solves this by creating a centralized, queryable, and intelligent graph of a portfolio's collective professional network. It transforms disconnected contact lists, professional profiles, and communication histories into a strategic asset for identifying "who knows whom," mapping talent landscapes, and uncovering non-obvious candidates for critical roles.

## 2. Architectural Tension: Centralized Intelligence vs. Decentralized Relationships

The core design tension of this system is the reconciliation of a powerful, centralized knowledge graph with the inherently decentralized, trust-based nature of human relationships.

*   **Centralized Intelligence:** The system aggregates and normalizes data from disparate sources into a single, unified graph database. This provides a "God's-eye view" of the network, enabling powerful queries, pathfinding, and ML-driven insights that are impossible with siloed data.
*   **Decentralized Relationships:** The value of a connection is not binary; it's defined by trust, context, and history, which are known only to the individuals involved. The system must avoid oversimplifying these relationships into mere links.

This tension is managed in the architecture by:
1.  **Relationship Provenance:** Every edge in the graph is annotated with its source (e.g., "Co-worker at Company X," "Investor-Founder relationship," "Email communication").
2.  **Strength Scoring:** NLP models (integrating **Cohere** and **OpenAI**) analyze communication content (metadata and, if permitted, text) to assign a probabilistic "relationship strength" score, which decays over time.
3.  **Warm Introduction Pathways:** The API prioritizes finding the *shortest, strongest path* between a hiring manager and a candidate, facilitating trusted, warm introductions rather than cold outreach. The system identifies the introducer but requires human action to initiate contact, respecting the decentralized nature of trust.

## 3. Architecture Diagram

```ascii
                                                                  +-------------------------+
                                                                  |   Portfolio Company UI  |
                                                                  | (Search, Visualize)     |
                                                                  +-----------+-------------+
                                                                              | (GraphQL/REST)
+----------------------+      +--------------------------+      +-------------+-------------+      +-------------------------+
|   Data Sources       |      | Ingestion & NLP Layer    |      |      API Gateway          |      |   Analysis & Scoring    |
|----------------------|      |--------------------------|      | (Auth, Rate Limiting)     |      |         Engine          |
| - LinkedIn Scraper   |----->| - Data Normalization     |----->|---------------------------|----->|-------------------------|
| - Internal CRM (API) |      | - Entity Extraction (NER)|      | - /search/candidates      |      | - Relationship Strength |
| - Email/Calendar     |      | - Skill Tagging (LLM)    |      | - /path/find              |      | - Skill Adjacency       |
|   (OAuth Connectors) |      | - Vector Embedding Gen.  |      | - /graph/visualize        |      | - "Hidden Gem" Scoring  |
| - Manual Uploads     |      +-----------+--------------+      | - /introspect             |      | - Centrality Algorithms |
+----------------------+                  |                       +-----------+-------------+      +-----------+-------------+
                                          |                                   |                                |
                                          | (Writes)                          | (Reads)                        | (Reads/Writes)
                                          |                                   |                                |
                               +----------v----------+             +----------v----------+           +----------v----------+
                               | Vector Database     |             | Graph Database      |           | Graph Database      |
                               | (e.g., Pinecone)    |             | (e.g., Neo4j)       |           | (e.g., Neo4j)       |
                               |---------------------|             |---------------------|           |---------------------|
                               | - Candidate Profiles|             | - Nodes: People, Co.  |           | - Nodes: People, Co.  |
                               | - Skill Embeddings  |             | - Edges: Works_At,    |           | - Edges: Works_At,    |
                               +---------------------+             |   Knows, Invested_In  |           |   Knows, Invested_In  |
                                                                   +---------------------+           +---------------------+

AI Vendor Integrations:
- Ingestion Layer: OpenAI/Cohere for NLP (Entity/Skill Extraction from resumes/profiles).
- Vector DB: Pinecone/Weaviate for semantic search on candidate descriptions.
- Analysis Engine: Integration with graph analytics platforms like Palantir Foundry/Gotham (via API connectors) or internal graph algorithms.
```

## 4. Core Features

*   **Unified Network Graph:** Aggregates contacts from across a portfolio into a single, queryable graph.
*   **Semantic Candidate Search:** "Find me a backend engineer who has worked on scaling payment systems and is known by someone at PortCo A."
*   **Warm Introduction Pathfinding:** Identifies the shortest and strongest chain of relationships between anyone in the network and a target candidate.
*   **Talent Mapping:** Visualize the talent landscape for a specific domain (e.g., "Show me all the AI researchers in our 2nd-degree network in London").
*   **Automated Data Enrichment:** Continuously updates profiles with new roles, skills, and connections from public sources.
*   **Privacy-Preserving Architecture:** Granular access controls ensure users can only see paths and profiles relevant to their own network, preventing unauthorized data exposure.

## 5. Revenue Surface (Monetization Strategy)

This application is designed as a B2B SaaS product, primarily for Venture Capital firms to offer as a value-add service to their portfolio.

*   **Platform Fee (Core Revenue):** A tiered annual subscription for the VC firm based on the number of portfolio companies and total network size (nodes in the graph).
*   **Per-Seat Licensing:** Portfolio companies get a number of "power user" seats as part of the platform fee, with additional seats sold separately.
*   **Success Fee (Performance-Based):** An optional model charging a percentage (e.g., 5-10%) of the first-year salary for key hires successfully placed via an introduction pathway identified by the system.
*   **Premium Analytics Module:** An add-on subscription for advanced features like competitive talent flow analysis, team composition modeling, and predictive attrition risk indicators.

## 6. Technical Stack & Integrations

*   **Backend:** Go / Python (FastAPI)
*   **Database:** Neo4j (Graph), PostgreSQL (Metadata), Pinecone (Vectors)
*   **Message Bus:** NATS / RabbitMQ (for asynchronous ingestion jobs)
*   **AI Integrations:**
    *   **OpenAI/Anthropic:** For extracting structured data (skills, experience) from unstructured text like resumes and LinkedIn profiles.
    *   **Cohere:** For generating embeddings and classifying relationship context from email metadata.
    *   **Palantir (Adapter):** Provides an API adapter to export sub-graphs and analysis results into Palantir Foundry for deeper, human-led investigation.
*   **Core SDK:** Utilizes the shared `core_sdk` for authentication, event logging, and inter-app communication.

## 7. Cost Drivers

*   **Graph Database Hosting:** The primary cost driver. Scales with the number of nodes and edges in the network. High-memory instances are required for performance.
*   **LLM API Calls:** Significant costs during the initial data backfill and ongoing enrichment. Caching strategies are critical to manage this.
*   **Vector Database:** Costs associated with storing and querying high-dimensional vectors for semantic search.
*   **Compute:** Processing power for running graph algorithms (centrality, pathfinding) and NLP models.
*   **Third-Party Data APIs:** Costs for commercial data sources (e.g., Clearbit, PeopleDataLabs) used for enrichment.

## 8. Failure Modes & Mitigation

*   **Data Staleness:** Profiles and relationships become outdated.
    *   **Mitigation:** Implement a continuous, low-frequency polling system for public profiles and a "last verified" timestamp. Nudge users to refresh OAuth connections.
*   **Incorrect Relationship Inference:** The NLP model misinterprets the strength or context of a relationship.
    *   **Mitigation:** Treat all AI-generated scores as probabilistic. Provide UI tools for users to manually override or correct relationship details. Maintain full data provenance.
*   **Privacy Breach:** Unauthorized access to sensitive contact information.
    *   **Mitigation:** Strict Role-Based Access Control (RBAC). Data is masked by default. A user can only see the *existence* of a path to a person, not their direct contact info, unless they are a 1st-degree connection. Full audit trail of all data access.
*   **API Rate Limiting:** Source systems (e.g., LinkedIn, CRM APIs) block ingestion.
    *   **Mitigation:** Implement intelligent, adaptive rate limiting with exponential backoff and jitter. Distribute ingestion jobs over time.

## 9. Enterprise Upsell Paths

*   **On-Premise / VPC Deployment:** For large funds or corporations with stringent data security and residency requirements.
*   **Custom Data Source Integrators:** Professional services to build connectors for proprietary, internal HRIS, ATS, or other systems of record.
*   **Advanced Compliance Module:** Features for GDPR "right to be forgotten" automation, data lineage tracking for regulators, and jurisdictional feature flagging.
*   **Human-in-the-Loop Analyst Services:** Access to a dedicated graph data scientist to run complex, bespoke queries and generate reports for strategic initiatives (e.g., M&A talent diligence, new market entry).

## 10. API Surface

The application exposes a secure GraphQL API for flexibility. Key queries and mutations include:

*   `searchCandidates(query: String, filters: CandidateFilters): [Candidate]`
*   `findPath(from: PersonID, to: PersonID, strengthThreshold: Float): Path`
*   `getNetworkNeighborhood(personId: PersonID, depth: Int): Graph`
*   `addManualConnection(personA: PersonID, personB: PersonID, context: String): Edge`
*   `enrichProfile(personId: PersonID): JobStatus`

## 11. Self-Introspection Endpoints

This application adheres to the ecosystem's self-querying standard via the following REST endpoints:

*   `/introspect`: Returns the application's configuration, active feature flags, and key dependencies.
*   `/assumptions`: Lists core operational assumptions (e.g., "Relationship strength decays exponentially over 24 months," "LinkedIn is the primary source of truth for job titles").
*   `/failure-modes`: Machine-readable version of the failure modes listed above.
*   `/update-triggers`: Describes events that trigger data updates (e.g., "User refreshes OAuth token," "Scheduled weekly scrape job completes").

---

## `agent_metadata`

```yaml
agent_metadata:
  purpose: "To build, analyze, and expose a graph of professional relationships to accelerate strategic talent acquisition for a network of affiliated companies."
  dependencies:
    - "APP_03_Identity_UnifiedAuth: For authenticating users and service accounts."
    - "APP_05_Observability_MetricsEngine: For reporting API usage and data ingestion metrics."
    - "APP_11_Billing_UsageTracker: For tracking API calls and graph operations for tiered billing."
    - "External: OpenAI/Cohere APIs for NLP."
    - "External: Pinecone/Weaviate API for vector search."
    - "External: Neo4j database instance."
  invalidation_conditions:
    - "Staleness of source data exceeds 90 days for a significant portion of the graph."
    - "Underlying graph database schema changes require a full data migration."
    - "Major changes to privacy regulations (e.g., GDPR, CCPA) require re-architecting data handling."
  adjacent_apps:
    - "APP_29_ValueAdd_MarketIntelEngine: Can provide target company lists to seed talent searches."
    - "APP_45_Governance_DataLineageTracker: Can consume event stream to track how contact data is used."
```

---

**License:** Licensed under the [Ecosystem Commercial License](./LICENSE). Use of this application is subject to the terms and conditions outlined in the license.