# APP_59_UI_ConversationalAnalytics

**LICENSE:** Apache 2.0

**DISCLAIMER:** This application provides AI-generated analytics and data summaries. All outputs are for informational purposes only and must be independently verified before being used for financial, operational, or strategic decisions. This tool does not provide financial advice. Use at your own risk.

---

## 1. Problem Statement

Accessing and deriving insights from large-scale financial data lakes is a significant bottleneck for most organizations. Business analysts, portfolio managers, and executives who lack deep SQL or data science expertise are often reliant on static dashboards or overburdened data teams to answer critical, time-sensitive questions. This latency between question and answer inhibits agile decision-making and limits the exploratory potential of valuable data assets.

`APP_59_UI_ConversationalAnalytics` solves this by providing a sophisticated, yet intuitive, conversational interface that allows users to query complex financial data using natural language. It acts as an intelligent translation layer between human intent and machine-executable queries, effectively democratizing data access and empowering non-technical users to perform sophisticated analysis on their own.

## 2. Architecture

The application is architected to resolve the core tension between the ambiguity of natural language and the precision required for financial data analysis. A central "Query Intent Router" intelligently dispatches user requests to the most appropriate backend service, either a structured query generator or a free-form analytical engine.

### 2.1. Architectural Diagram (ASCII)

```
+---------------------------------+
|      User (Web Browser)         |
|   (React/Next.js Frontend)      |
+---------------------------------+
              | (HTTPS/GraphQL API Call)
              v
+------------------------------------------------+
|   APP_59 Backend Service (Python/FastAPI)      |
|                                                |
| +--------------------------------------------+ |
| |           Query Intent Router              | |
| | (Confidence Scoring & Capability Mapping)  | |
| +------------------+-------------------------+ |
|                    |                         |
| (Structured Query) | (Unstructured Analysis) |
|                    v                         v
+--------------------+-------------------------+
  |                                          |
  v (Prompt + Schema)                        v (Prompt + Context)
+--------------------+                     +--------------------+
|   Text-to-SQL/DSL  |                     |   Reasoning &      |
|   Generation       |                     |   Summarization    |
|   (via Cohere)     |                     |   (via Perplexity) |
+--------------------+                     +--------------------+
  | (Generated Query)                        | (Retrieved Docs)
  v                                          ^
+--------------------+                     +--------------------+
| APP_XX_Data_QueryProxy |                     | APP_XX_Memory_VectorStore |
| (Executes against  |                     | (RAG on 10-Ks, etc.)|
| Snowflake/Databricks)|                     +--------------------+
+--------------------+
  | (Raw Data Results)
  v
+------------------------------------------------+
|           Response Synthesis Engine            |
| (Formats tables, charts, text using Core SDK)  |
+------------------------------------------------+
              | (Formatted JSON Response)
              v
+---------------------------------+
|      User (Web Browser)         |
+---------------------------------+

--- Shared Ecosystem Services ---
-> APP_02_Auth_Gateway (Authentication)
-> APP_10_Billing_CostAggregator (Cost Tracking)
-> APP_37_Governance_AuditTrailEngine (Audit Logging)
-> APP_01_Inference_CostRouter (LLM Failover/Routing)

```

### 2.2. Core Tension: Intuition vs. Precision

The design of this application embodies the fundamental conflict between human **intuition** and machine **precision**.
*   **Intuition:** Users ask questions like, "How did our energy sector investments perform last quarter compared to the market?" This is fluid, contextual, and inherently ambiguous. The system leverages large language models (LLMs) to understand this intent.
*   **Precision:** Financial data is unforgiving. An answer must be based on precise, verifiable queries against structured data. A single error can lead to flawed decisions.

This tension is managed architecturally at the **Query Intent Router**. This component doesn't just pass a prompt to an LLM. It analyzes the query and, based on a confidence score, decides on a path:
1.  **High Confidence (Precision Path):** If the query maps clearly to known database schema elements (e.g., "show me revenue for product X"), it's routed to a highly-constrained Text-to-SQL agent using Cohere, with strict validation on the generated SQL. The generated query is displayed to the user for transparency.
2.  **Low Confidence (Intuition Path):** If the query is open-ended (e.g., "summarize risks for our top 5 holdings"), it's routed to a RAG (Retrieval-Augmented Generation) pipeline using Perplexity, which synthesizes information from unstructured documents (like SEC filings) retrieved from a vector store. The answer is explicitly marked as a "summary" and sources are cited.

This architectural choice makes the tension visible to the user, balancing the need for fast, intuitive exploration with the requirement for verifiable, precise data extraction.

## 3. Revenue Surface

This application is monetized as a premium, high-value SaaS product, directly enabling faster and better investment and operational decisions.

*   **Primary Model: Tiered Per-Seat Licensing**
    *   **Analyst Tier ($250/user/month):** Core query capabilities, 500 queries/month, access to standard speed models, community support.
    *   **Portfolio Manager Tier ($750/user/month):** Unlimited queries, priority access to high-performance models (lower latency, higher accuracy), ability to connect to real-time data sources, email/chat support.
    *   **Enterprise Tier (Custom Pricing):** Includes all PM features plus SSO/SAML integration, dedicated infrastructure options, API access, custom data source connectors, and enhanced governance controls enforced via `APP_38_Governance_PolicyEngine`.

*   **Secondary Model: Usage-Based Add-ons**
    *   **Automated Insights Engine ($0.10/report):** Users can schedule recurring natural language queries (e.g., "Email me a summary of AAPL's stock performance every Monday morning") that run automatically.
    *   **High-Compute RAG Queries ($0.50/query):** Queries requiring extensive document retrieval and synthesis from the vector store incur a per-query fee to cover the higher computational cost.

*   **Enterprise Upsell Path:** The clear path to enterprise adoption involves deeper integration with a company's data security and compliance stack. This includes private model deployments, VPC peering, integration with internal identity providers, and custom-trained Text-to-SQL models that understand company-specific jargon and data schemas.

## 4. Cost Drivers

The unit economics are directly tied to query complexity and volume.

*   **AI API Consumption (Variable):** The most significant cost. Every user query results in API calls to Cohere (for SQL generation) and/or Perplexity (for analysis). Costs are tracked per-token via `APP_10_Billing_CostAggregator`.
*   **Data Warehouse Query Execution (Variable):** The SQL generated by the AI is executed on the customer's underlying data platform (e.g., Snowflake, Databricks). While this is often the customer's cost, our service's efficiency directly impacts their bill, making query optimization a key feature.
*   **Application Hosting (Fixed/Variable):** Compute costs for running the backend API, frontend web server, and any caching layers (e.g., Redis). Scales with user concurrency.
*   **Vector Database (Variable):** Costs associated with storing and indexing embeddings for unstructured documents used in RAG queries. This includes storage and compute for similarity searches.
*   **Ecosystem Service Fees (Internal):** Internal cross-charging for usage of core platform services like authentication, billing, and logging.

## 5. Failure Modes

*   **Incorrect SQL Generation:** The LLM produces a syntactically correct but semantically incorrect SQL query, leading to dangerously wrong data.
    *   **Mitigation:**
        1.  **Query Validation:** A semantic validation layer checks the generated SQL against schema constraints before execution.
        2.  **User Transparency:** The generated SQL is always visible to the user, allowing for expert verification.
        3.  **Feedback Loop:** A "thumbs up/down" mechanism on answers trains a corrective model to reduce future errors.
        4.  **Confidence Gating:** Low-confidence queries are flagged and require user confirmation before running.

*   **LLM Provider Outage/Latency:** Cohere or Perplexity APIs are unavailable or slow.
    *   **Mitigation:** The system is integrated with `APP_01_Inference_CostRouter`, which can automatically failover to a compatible alternative model (e.g., from OpenAI or Anthropic) based on health checks and performance metrics. The UI will display a notification of potential degradation.

*   **Data Access Violations:** A user attempts to craft a query to access data beyond their permissions.
    *   **Mitigation:** The application is stateless regarding data permissions. All queries executed by `APP_XX_Data_QueryProxy` are run under the credentials of the authenticated user, inheriting the security model of the underlying data warehouse. All queries are logged for audit by `APP_37_Governance_AuditTrailEngine`.

*   **Runaway Queries & Cost Overruns:** A vague user query generates an extremely complex SQL query that consumes significant data warehouse credits.
    *   **Mitigation:** An integrated cost estimator analyzes the generated query plan before execution. If the estimated cost exceeds a user-defined threshold, it requires explicit user approval to proceed. Budgets and alerts are managed via `APP_10_Billing_CostAggregator`.

---

## `agent_metadata`

```yaml
agent_metadata:
  purpose: "Provides a natural language conversational interface for querying and analyzing large-scale financial data lakes, abstracting complex query languages like SQL."
  dependencies:
    - "APP_01_Inference_CostRouter": For dynamic routing of LLM requests to providers like Cohere and Perplexity.
    - "APP_02_Auth_Gateway": For user authentication and authorization.
    - "APP_10_Billing_CostAggregator": For tracking query costs and enforcing usage limits.
    - "APP_37_Governance_AuditTrailEngine": For logging all user queries and system responses for compliance.
    - "APP_28_Data_QueryProxy": For secure execution of generated queries against underlying data warehouses.
    - "APP_17_Memory_VectorIndex": For RAG-based queries on unstructured documents (e.g., filings, reports).
  invalidation_conditions:
    - "Major breaking changes in integrated AI provider APIs (Cohere, Perplexity)."
    - "Significant schema changes in the target financial data lake that are not reflected in the model's context."
    - "Deprecation of the shared authentication protocol from APP_02_Auth_Gateway."
  adjacent_apps:
    - "APP_58_Narrative_ModelExplainabilityUI": Can be used to visualize the reasoning process behind how a natural language query was translated into a data query.
    - "APP_60_UI_DashboardBuilder": Users can 'pin' insights from this conversational app to create persistent dashboards in the Dashboard Builder.
    - "APP_25_Dataset_SchemaManager": Provides the schema information that this app uses to generate accurate data queries.