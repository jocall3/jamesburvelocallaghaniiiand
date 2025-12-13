# APP_51_Security_PII_DataScanner

**A multi-stage, policy-driven service for detecting and remediating Personally Identifiable Information (PII) in real-time data streams and at-rest data stores.**

---

**DISCLAIMER:** This software is an infrastructure tool and not a legal compliance solution. It is designed to assist in identifying potential PII based on configured models and policies. The accuracy of PII detection is not guaranteed. Users are solely responsible for ensuring their data handling practices comply with all applicable laws and regulations, such as GDPR, CCPA, and HIPAA. Do not rely on this tool as the sole means of achieving compliance.

---

## 1. Problem Statement

In a data-driven economy, organizations ingest and process vast quantities of information from myriad sources. This data is a critical asset but also a significant liability. Embedded within logs, user-generated content, analytics events, and databases is a growing volume of Personally Identifiable Information (PII).

Failure to properly manage PII leads to severe consequences: regulatory fines, reputational damage, and loss of customer trust. However, identifying PII at scale is a complex challenge:

*   **Volume & Velocity:** The sheer amount and speed of modern data make manual review impossible.
*   **Contextual PII:** Simple pattern matching (regex) fails to identify contextual PII (e.g., "The CEO, Jane, is meeting at her home on 123 Main St.").
*   **Cost-Accuracy Trade-off:** Highly accurate Large Language Models (LLMs) can find contextual PII but are often too slow and expensive for line-rate processing of all data.
*   **Operational Overhead:** Ad-hoc scripts are brittle, unmaintainable, and lack the necessary audit trails for compliance.

`APP_51_Security_PII_DataScanner` provides a robust, scalable, and auditable solution to this problem. It offers a configurable, multi-stage scanning pipeline that allows organizations to balance the deep tension between detection accuracy and operational cost, ensuring sensitive data is identified and protected according to defined policies.

## 2. Architecture

The system is designed around a staged pipeline that applies progressively more powerful (and expensive) analysis techniques, governed by a flexible policy engine. This architecture embodies the core tension of **Accuracy vs. Performance**.

```ascii
[Data Sources]      [Connectors]        [Dispatcher]      [Staged Scanning Pipeline]                                [Action Emitter]      [Downstream]
(Kafka, S3, PG) --> (Kafka Adapter) --> (Data Chunker/ --> | [S1: Triage (Regex/FastNER)] --(clean)---------------------> (Pass-through) ----> (Clean Sink)
                     (S3 Poller)    |    Batcher)     |    |        |                                               |
                     (CDC Listener) |                 |    |    (suspicious)                                        |
                                    |                 |    |        v                                               |
                                    |                 |    | [S2: Deep Scan (LLM API)] --(PII found)-----------------> (Masking Engine) ----> (Masked Sink)
                                    |                 |    |        |                                               |
                                    |                 |    |    (uncertain)                                         |
                                    |                 |    |        v                                               |
                                    |                 |    | [S3: Validation (Human/X-Model)] --(confirmed PII)----> (Alerting Engine) ---> (APP_37_Audit)
                                    |                 |    |                                                        |
                                    +----------------------+--------------------------------------------------------+ (Quarantine Engine) -> (Secure Vault)
                                                       ^
                                                       |
                                                [Policy Engine]
                                                (Controls routing
                                                 & scan depth)
                                                       ^
                                                       |
                                              [Control Plane API]
                                              (config, policies)
                                                       ^
                                                       |
                                                  [AetherAuth]
```

### Components:

1.  **Connectors:** Pluggable modules that ingest data from various sources (e.g., Kafka topics, S3 buckets, PostgreSQL CDC streams). These are designed to be lightweight and horizontally scalable.
2.  **Dispatcher:** Consumes data from connectors, chunks it into manageable units (e.g., 100KB text blocks), and enriches it with metadata before feeding it into the scanning pipeline. It also handles backpressure.
3.  **Staged Scanning Pipeline:**
    *   **Stage 1: Triage (High-Performance/Low-Cost):** The first line of defense. Uses a combination of highly optimized regex patterns and lightweight, specialized Named Entity Recognition (NER) models (e.g., a fine-tuned DistilBERT). It catches common, unambiguous PII like email addresses, phone numbers, and credit card numbers with very low latency. Data that passes this stage can be considered "low-risk".
    *   **Stage 2: Deep Scan (High-Accuracy/High-Cost):** Data flagged as "suspicious" by Stage 1, or data from sources designated as highly sensitive by policy, is routed here. This stage leverages powerful LLMs (via `APP_01_Inference_CostRouter` for provider abstraction) to perform contextual analysis, identifying nuanced and complex PII that rule-based systems would miss.
    *   **Stage 3: Validation (Optional/Enterprise):** For findings with low confidence scores from Stage 2, this stage can route the data for cross-model validation (e.g., checking a GPT-4 finding with Claude 3) or integrate with human-in-the-loop platforms like `APP_29_Evaluation_HumanFeedbackLoop`.
4.  **Policy Engine:** The brain of the service. Administrators define rules that govern the scanning process. Examples:
    *   `"For data from 'kafka_topic_prod_logs', apply Stage 1 only."` (Cost optimization)
    *   `"For data in 's3_bucket_customer_support_tickets', apply Stage 1 and route all suspicious findings to Stage 2."` (Balanced approach)
    *   `"For any data tagged with 'GDPR_SUBJECT', apply Stage 2 immediately."` (Compliance-driven)
5.  **Action Emitter:** Based on the final scan results and policy, this component takes action.
    *   **Masking:** Replaces detected PII with placeholders (e.g., `[REDACTED_EMAIL]`).
    *   **Alerting:** Emits a structured event to the `AetherEvent` bus, which can be consumed by `APP_37_Governance_AuditTrailEngine` or other monitoring systems.
    *   **Quarantining:** Moves the entire data object to a secure, isolated location for manual review.
6.  **Control Plane API:** A RESTful API secured by `AetherAuth` for managing connectors, policies, and viewing scan results and audit logs.

## 3. Revenue Surface

This application is designed for direct monetization through a multi-tiered SaaS model, with clear enterprise upsell paths.

*   **Tiered SaaS Subscription (Core Revenue):**
    *   **Developer:** Free tier with limited data volume (e.g., 10 GB/month) and Stage 1 scanning only.
    *   **Pro:** Monthly fee based on data volume scanned (e.g., per TB). Includes access to the Stage 2 Deep Scan with a generous allotment of "LLM credits".
    *   **Enterprise:** Custom pricing for high-volume customers. Includes Stage 3 Validation workflows, premium connectors (Snowflake, Databricks), advanced policy controls, and dedicated support.

*   **Usage-Based Overage (Variable Revenue):**
    *   **Data Volume:** Pay-as-you-go pricing for data scanned beyond the subscription tier's limit.
    *   **Deep Scan Credits:** Pay-per-token/call for Stage 2 LLM usage that exceeds the monthly allotment. This directly maps revenue to our primary cost driver, ensuring profitability.

*   **Enterprise Upsell Paths (Expansion Revenue):**
    *   **On-Premise / Hybrid Deployment:** Deploying the scanner within a customer's VPC for maximum data privacy, managed via `APP_45_Infra_HybridCloudOrchestrator`.
    *   **Custom Connectors:** Professional services engagement to build connectors for proprietary or legacy data sources.
    *   **Compliance & Policy Consulting:** Services to help enterprises author effective scanning policies that map to specific regulatory regimes (GDPR, HIPAA).

## 4. Cost Drivers

Profitability depends on carefully managing the following operational costs:

*   **Third-Party LLM APIs (Primary & Variable):** The cost of API calls to providers like OpenAI, Anthropic, and Google for Stage 2 Deep Scans is the largest and most volatile expense. This cost is directly passed through to customers via the "Deep Scan Credits" model.
*   **Compute (Primary & Stable):**
    *   **Stage 1 Workers:** GPU/CPU resources required to run the high-throughput NER models. This cost scales linearly with the total volume of data processed.
    *   **Core Services:** Baseline compute for running the API, dispatcher, and connectors.
*   **Data Storage:** Costs for storing scan metadata, policies, and audit logs. Quarantine storage can also be a factor, though typically passed on to the customer.
*   **Data Egress/Transfer:** Network costs associated with pulling data from customer cloud environments (e.g., cross-region S3 access).

## 5. Failure Modes

*   **False Negatives (PII is Missed):**
    *   *Cause:* A new PII pattern emerges; a triage model is not sufficiently trained; an LLM prompt lacks the right context. This is the most critical failure mode from a customer liability perspective.
    *   *Mitigation:* The multi-stage architecture is the primary mitigation. We provide regular updates to models and rule sets. The system logs model versions used for each scan, enabling post-mortem analysis. An API is provided for customers to report false negatives, feeding into our fine-tuning pipeline (`APP_29_Evaluation_HumanFeedbackLoop`).
*   **False Positives (Clean Data is Flagged as PII):**
    *   *Cause:* An overly aggressive regex flags a benign identifier; an LLM hallucinates or misinterprets context.
    *   *Mitigation:* Can lead to business disruption if data is incorrectly masked or quarantined. The Stage 3 Validation workflow is the primary mitigation. The policy engine allows for configurable confidence thresholds and "allow-lists" to suppress known false positives.
*   **Pipeline Saturation / Latency Spike:**
    *   *Cause:* A sudden burst of data overwhelms the Triage stage; a poorly configured policy routes too much data to the slow Deep Scan stage.
    *   *Mitigation:* The system employs backpressure at the dispatcher level. Worker pools for each stage are auto-scaled. The policy engine can be configured with circuit breakers to temporarily bypass deep scanning under extreme load, prioritizing availability over accuracy.
*   **Upstream LLM Provider Outage:**
    *   *Cause:* The primary LLM provider for Stage 2 is unavailable.
    *   *Mitigation:* Deep integration with `APP_01_Inference_CostRouter` allows for automatic failover to a secondary LLM provider. If all providers are down, data destined for deep scan is queued with a configurable TTL before being either dropped or passed through with a "scan failed" status.
*   **Catastrophic Policy Misconfiguration:**
    *   *Cause:* A user creates a policy that sends 100% of their data to the expensive Deep Scan stage, resulting in a massive, unexpected bill.
    *   *Mitigation:* The API and UI include a "cost estimation" feature that simulates the financial impact of a policy before it is applied. We enforce budget alerts and spending caps linked to `APP_17_Billing_UsageTracker`.

---

```yaml
agent_metadata:
  purpose: "To continuously scan data streams and stores for Personally Identifiable Information (PII), applying configurable policies for masking, alerting, or quarantining."
  dependencies:
    - "aether_sdk": For core service utilities and configuration management.
    - "aether_auth": For securing the control plane API and access to data connectors.
    - "aether_events": To publish scan results, policy violations, and operational alerts.
    - "External LLM APIs": (e.g., OpenAI, Anthropic) for the deep scan stage.
    - "Internal NER Models": For the high-throughput triage stage.
  invalidation_conditions:
    - "Significant changes in data privacy regulations (e.g., GDPR, CCPA) may require updates to detection logic and policies."
    - "Emergence of new, widely used PII formats not covered by existing models."
    - "Deprecation of a major integrated LLM provider's API."
    - "Discovery of a systemic flaw in a core detection model leading to high rates of false negatives."
  adjacent_apps:
    - "APP_01_Inference_CostRouter": Used to select the optimal LLM for the deep scan stage based on cost, latency, and accuracy requirements.
    - "APP_37_Governance_AuditTrailEngine": Receives detailed logs of all scan operations, findings, and actions taken (e.g., masking) for compliance and audit purposes.
    - "APP_41_Policy_ComplianceEngine": Consumes policies defined in this app to check against organizational or regulatory templates. This app provides the enforcement; APP_41 provides the template management.
    - "APP_25_DataLifecycle_SchemaTracker": Can provide schema information to the scanner, helping to focus scans on high-risk fields (e.g., 'user_bio', 'customer_notes').