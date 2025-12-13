# APP_32_Narrative_PortfolioSummaryGenerator

**A service that automatically generates natural language summaries of portfolio performance, attribution, and risk exposure.**

---

**DISCLAIMER:** This service generates informational summaries based on provided data. The output is not, and should not be construed as, financial advice, an offer to sell, or a solicitation of an offer to buy any security. All financial decisions should be made with a qualified professional. The accuracy of the summary is contingent on the accuracy of the input data.

---

## 1. Problem Statement

Financial advisors, wealth managers, and institutional investors spend countless hours analyzing dense quantitative reports on portfolio performance, risk, and attribution. Translating this complex data into a clear, concise, and client-friendly narrative is a manual, time-consuming, and error-prone process. This operational bottleneck limits the frequency of client communication, reduces advisor productivity, and creates a risk of inconsistent or inaccurate reporting.

`APP_32_Narrative_PortfolioSummaryGenerator` automates this last mile of financial analysis, transforming structured portfolio data into high-quality, human-readable narratives at scale. It empowers financial professionals to deliver personalized insights faster, improve client engagement, and focus on strategic advice rather than report generation.

## 2. Architecture

The system is designed as a multi-stage pipeline that prioritizes factual accuracy and safety over raw generative speed. This "chain of verification" architecture is central to mitigating the risk of AI hallucination in a high-stakes financial context.

```ascii
+---------------------------------------------------------------------------------+
|                                  CLIENT SYSTEM                                  |
| (e.g., Wealth Management Platform, Robo-Advisor, Family Office)                 |
+---------------------------------------------------------------------------------+
       |
       | 1. POST /v1/summaries (Portfolio Data: Positions, Txns, Benchmark)
       v
+---------------------------------------------------------------------------------+
|                      APP_32_Narrative_PortfolioSummaryGenerator                   |
|---------------------------------------------------------------------------------|
|                                  API Gateway                                    |
|                      (Auth via Shared Core SDK Identity)                        |
+---------------------------------------------------------------------------------+
       |
       v
+---------------------------------------------------------------------------------+
|                             Data Ingestion & Validation Service                 |
|                                                                                 |
|  - Validates portfolio schema against unified ontology                          |
|  - Enriches with market data (via adapters for Polygon.io, Finnhub)             |
+---------------------------------------------------------------------------------+
       |
       | (Validated & Enriched Portfolio Data)
       v
+---------------------------------------------------------------------------------+
|                             Financial Analytics Core                            |
|                                                                                 |
|  - Performance Calculation (Time-Weighted Return, Sharpe, Alpha)                |
|  - Attribution Analysis (Brinson-Fachler model)                                 |
|  - Risk Metrics (Value-at-Risk, Sector/Factor Exposure)                         |
+---------------------------------------------------------------------------------+
       |
       | (Structured Analytical Report - "Source of Truth" JSON)
       v
+---------------------------------------------------------------------------------+
|                           Narrative Generation Engine                           |
|---------------------------------------------------------------------------------|
|                                                                                 |
|  [Tension: Safety vs. Automation]                                               |
|                                                                                 |
|  +--> [Step 1: Fact Extraction] --(Key Insights)--> [Step 2: Structuring] --+
|  |    (Uses cost-effective model like Mistral via Groq for speed)             |
|  |                                                                           |
|  +--< [Step 4: Fact-Checking & Redaction] <--(Draft Narrative)-- [Step 3] <---+
|       (Cross-references every claim in draft against "Source of Truth" JSON. |
|        Uses rule-based checks + analytical LLM like Google Gemini Pro.       |
|        Redacts any unverified claims.)                                       |
|                                                                             |
|                                     [Step 3: Narrative Generation]            |
|                                     (Uses high-quality model for fluency,     |
|                                      e.g., Anthropic Claude 3 Sonnet/Opus)    |
+---------------------------------------------------------------------------------+
       |
       | (Final, Verified Narrative - JSON with provenance links)
       v
+---------------------------------------------------------------------------------+
|                                 Output Formatter                                |
|                                                                                 |
|  - Formats for API response (JSON, Markdown, HTML)                              |
|  - Publishes to Event Bus (`portfolio.summary.generated`) for downstream apps   |
+---------------------------------------------------------------------------------+
       |
       v
   API Response / Event Message
```

### Core Architectural Tension: Safety vs. Automation

The core value proposition is automation, but the primary risk is generating factually incorrect financial statements. The architecture directly embodies this tension:

*   **Automation Driver:** The `Narrative Generation` step (Step 3) uses a powerful, fluent large language model (e.g., Anthropic Claude 3) to create a human-like summary. This is where the automation magic happens.
*   **Safety Gate:** The `Fact-Checking & Redaction` step (Step 4) acts as a deterministic, rigorous check on the creative output of the generative model. It does not generate new text; it only verifies or redacts claims against the ground-truth data from the `Financial Analytics Core`.

This separation allows for independent scaling and configuration. A "draft mode" for internal use might have a lenient safety gate for speed, while a "client-ready mode" for regulatory environments would enforce a zero-tolerance policy on unverified claims.

## 3. Revenue Surface

This application is monetized through a tiered, value-based API subscription model.

*   **Tier 1: Advisor Pro**
    *   **Model:** Per-seat, monthly subscription.
    *   **Features:** On-demand summary generation for individual portfolios. Access to standard templates (e.g., "Quarterly Performance Review," "Market Volatility Update").
    *   **Target:** Independent financial advisors, small advisory firms.

*   **Tier 2: Platform Business**
    *   **Model:** Usage-based (per-summary fee) with a monthly platform fee.
    *   **Features:** Batch processing for thousands of portfolios. API access to customize templates, tone, and verbosity. Integration with client's CRM via the shared event bus.
    *   **Target:** Robo-advisors, retail brokerage platforms, mid-sized wealth management firms.

*   **Tier 3: Enterprise**
    *   **Model:** Annual contract with dedicated infrastructure.
    *   **Features:** All Platform features plus:
        *   White-labeling of the service.
        *   Integration with proprietary risk models and data warehouses (e.g., Snowflake, Databricks).
        *   Jurisdictional compliance packs (e.g., FINRA review hooks, SEC marketing rule flags).
        *   On-premise or VPC deployment options.
    *   **Target:** Large banks, asset managers, institutional investment platforms.

*   **Ecosystem Upsell:**
    Generated summaries act as a discovery mechanism for other platform services. For example, a summary might include a call-to-action: `"A high concentration in the technology sector was a key driver of returns. To model the impact of a sector downturn, run a simulation with APP_45_Risk_ScenarioSimulator."`

## 4. Cost Drivers

*   **AI Compute (Variable):** The primary cost driver. Each summary generation involves multiple LLM API calls (e.g., Groq for extraction, Anthropic for generation, Google for validation). Costs scale directly with the number and complexity of summaries generated. This is managed via `APP_01_Inference_CostRouter`.
*   **Market Data Feeds (Fixed/Tiered):** Licensing costs for real-time and historical financial data from third-party providers are a significant fixed cost.
*   **Core Compute (Variable):** CPU/memory costs for running the `Financial Analytics Core`, which can be intensive for complex attribution models on large portfolios.
*   **Data Storage (Variable):** Costs for storing portfolio snapshots, analytical results, and generated narratives for audit and compliance purposes (e.g., in S3 or a managed database).

## 5. Failure Modes

*   **Factual Hallucination:** The generative LLM produces a statement unsupported by the analytical data (e.g., misstates the top contributing security).
    *   **Mitigation:** The mandatory `Fact-Checking & Redaction` step is designed to catch and remove these errors before output. Metrics on redaction rates are critical for monitoring model health.
*   **Subtle Misinterpretation:** The model correctly states facts but arranges them into a misleading narrative (e.g., implying causation from correlation).
    *   **Mitigation:** Template engineering, prompt chaining, and using LLMs with stronger reasoning capabilities (at higher cost). Human-in-the-loop review for enterprise tiers.
*   **Upstream Data Error:** The input portfolio data is incorrect, leading to a summary that is internally consistent but factually wrong.
    *   **Mitigation:** Robust schema validation at the ingestion layer. Data quality checks that flag anomalies (e.g., extreme price changes, missing positions). Clear provenance tracking in the output, linking each statement back to its source data.
*   **Regulatory Misalignment:** The generated language inadvertently crosses the line from "informational summary" to "financial advice" or makes promissory claims.
    *   **Mitigation:** A combination of prompt-level guardrails, output filtering for forbidden keywords, and jurisdiction-specific feature flags that enable more conservative language templates. All outputs are logged in `APP_37_Governance_AuditTrailEngine`.
*   **LLM API Latency/Failure:** The service is dependent on external AI providers. An outage or performance degradation at Anthropic, Google, etc., will directly impact this application.
    *   **Mitigation:** Integration with multiple providers through an abstraction layer. Automatic failover logic and circuit breakers. Caching of recent, non-time-sensitive results.

---

```yaml
agent_metadata:
  purpose: "To generate human-readable, natural language summaries of financial portfolio performance, attribution, and risk based on structured input data."
  dependencies:
    - "Core_SDK: for authentication and event bus communication."
    - "External_LLM_APIs: Anthropic, Google, Groq (via adapters) for narrative generation and fact-checking."
    - "External_Market_Data_APIs: for enriching portfolio data with prices and benchmarks."
    - "APP_01_Inference_CostRouter: to select the most cost-effective LLM for sub-tasks like fact extraction."
  invalidation_conditions:
    - "Significant changes in financial reporting standards (e.g., GIPS)."
    - "Deprecation of a major integrated LLM API."
    - "Detection of persistent, high-severity factual hallucination rates exceeding a predefined threshold (e.g., >0.1% of claims)."
  adjacent_apps:
    - "APP_21_Optimization_PortfolioRebalancer: Consumes summaries to suggest rebalancing actions."
    - "APP_45_Risk_ScenarioSimulator: Can be triggered from summaries to run 'what-if' analyses on key holdings."
    - "APP_37_Governance_AuditTrailEngine: Logs all data inputs and generated summaries for compliance."
    - "APP_58_Narrative_ModelExplainabilityUI: Can be used to visualize the link between the source analytical data and the final generated text."