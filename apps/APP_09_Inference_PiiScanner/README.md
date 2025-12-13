# APP_09_Inference_PiiScanner

**A Real-Time PII Scanning & Redaction Gateway for AI Inference**

---

**DISCLAIMER:** This software is provided "as is", without warranty of any kind, express or implied. It is a tool to assist in data protection efforts and does not guarantee compliance with any data privacy regulations such as GDPR, CCPA, or HIPAA. Users are solely responsible for ensuring their data handling practices comply with all applicable laws and regulations.

---

## 1. Problem Statement

Enterprises are racing to integrate Large Language Models (LLMs) and other generative AI into their products. However, a critical blocker is the risk of sending Personally Identifiable Information (PII) to third-party model providers like OpenAI, Anthropic, or Google. This exposes companies to significant compliance violations, data breaches, and loss of customer trust.

Existing Data Loss Prevention (DLP) solutions are often batch-oriented, too slow for real-time inference, or not designed for the unstructured, conversational nature of AI prompts. Developers are forced to either build brittle, ad-hoc PII stripping logic or avoid using powerful external models with sensitive data altogether, limiting innovation.

`APP_09_Inference_PiiScanner` solves this by providing a high-throughput, policy-driven gateway that sits between your application and AI providers. It intercepts requests, identifies and redacts PII in real-time, and then reconstructs the responses with the original data, ensuring sensitive information never leaves your trusted environment.

## 2. Architecture

The PiiScanner can be deployed as a sidecar container or a centralized API gateway. It operates as a reverse proxy, managing the lifecycle of a request to an external AI service.

**Core Tension: Security vs. Utility**

The fundamental design tension is balancing aggressive PII redaction for maximum **security** against preserving the contextual **utility** of the prompt for the AI model. Over-redaction renders prompts useless; under-redaction creates compliance risks. This tension is managed through a configurable, multi-layered Policy Engine.

**ASCII Diagram: Data Flow**

```
                               +---------------------------------+
                               |      APP_09_Inference_PiiScanner      |
                               |                                 |
+-------------------+  1. Request  +---------------------------------+  4. Sanitized Req  +-----------------+
|                   |    (w/ PII)  |                                 |      (No PII)      |                 |
| Internal Service  +------------> |  Ingress -> Policy Engine ->    +------------------> |   External AI   |
| (e.g., Chatbot)   |              |      PII Detection Engine       |                    | Provider (e.g., |
|                   |              | (Regex + NER Model) -> Redactor |                    |     OpenAI)     |
+-------------------+              |                                 |                    |                 |
                     |              |      +------------------+       |                    +-----------------+
                     |              |      |   State Store    |       |                          | 5. AI Response
                     |              |      | (Redis/DynamoDB) |       |                          | (w/ Placeholders)
                     |              |      | - {placeholder: PII}     |                          |
                     |              |      | - TTL-based entries      |                          |
                     |              |      +------------------+       |                          |
                     |              |               ^ | 3. Store     |                          |
                     |              |               | | Mapping      |                          |
                     |              |               v |              |                          |
                     |  8. Response |  7. De-redact |  De-redactor <-+--------------------------+
                     | (PII Restored)|              |                                 |
                     <---------------+--------------+---------------------------------+
                                     (using stored mapping)
```

**Workflow:**

1.  **Ingress:** An internal service sends a request (e.g., a user prompt) to the PiiScanner endpoint instead of directly to the AI provider.
2.  **Policy Evaluation:** The Policy Engine loads the rules for the given API key or tenant (e.g., sensitivity level, custom patterns, allowed entities).
3.  **PII Detection & Redaction:** The request payload is scanned by a multi-layered detection engine:
    *   **Layer 1 (Regex):** High-speed scanning for well-defined patterns (emails, phone numbers, SSNs, credit card numbers).
    *   **Layer 2 (NER):** A Named Entity Recognition model (e.g., from Hugging Face or Scale AI) identifies contextual PII like names and locations.
    *   The `Redactor` replaces found PII with stable placeholders (e.g., `[PERSON_NAME_1]`, `[EMAIL_ADDRESS_1]`).
4.  **Stateful Mapping:** The mapping between the placeholder and the original PII is stored in a low-latency, time-to-live (TTL) key-value store.
5.  **Forwarding:** The sanitized request is forwarded to the target AI provider.
6.  **Response Interception:** The PiiScanner receives the response from the AI provider.
7.  **De-redaction:** The `De-redactor` looks for placeholders in the response. It retrieves the original PII from the state store using the placeholder as the key.
8.  **Egress:** The final, reconstructed response is sent back to the original internal service.

## 3. Revenue Surface

This application is monetized as a critical piece of security and compliance infrastructure.

*   **Tiered SaaS Subscription (Monthly/Annually):**
    *   **Developer:** Free tier with limited requests/month and basic regex patterns.
    *   **Pro ($$$/month):** Higher request limits, access to NER models, custom regex pattern configuration, and basic audit logs.
    *   **Business ($$$$/month):** Very high request limits, advanced policy engine (jurisdictional rules, contextual unmasking), integration with `APP_37_Governance_AuditTrailEngine`, and priority support.

*   **Enterprise (Contract-based):**
    *   On-premise or VPC deployment for maximum data privacy.
    *   Integration with corporate identity providers (e.g., Okta) and DLP systems.
    *   Custom NER model training and fine-tuning on customer-specific data schemas.
    *   Guaranteed latency SLAs.

*   **Usage-Based Overage:**
    *   Per-request fee for usage exceeding subscription limits.
    *   Per-character/token processing fee, creating a direct link between usage and cost.

## 4. Cost Drivers

*   **Compute (High):** The NER models can be computationally intensive. Maintaining low latency at high throughput requires significant CPU/GPU resources. This is the primary scaling cost.
*   **State Store (Medium):** A highly available, low-latency key-value store like Redis ElastiCache or DynamoDB is required. Costs scale with the number of in-flight requests.
*   **AI Model Licensing (Variable):** Costs associated with using third-party NER models or hosting open-source ones (e.g., on Hugging Face Inference Endpoints or Amazon SageMaker).
*   **Bandwidth (Medium):** Data transfer costs for receiving and forwarding requests and responses.
*   **Engineering & Maintenance (Medium):** Costs for continuously updating regex patterns and retraining NER models to combat model drift and new PII patterns.

## 5. Failure Modes

*   **False Negative (PII Leak):**
    *   **Problem:** The scanner fails to detect a piece of PII, which is then sent to the external provider. This is the most critical failure mode.
    *   **Mitigation:**
        *   Layered detection (regex + multiple NER models).
        *   Confidence scoring on NER predictions; policies can reject requests below a certain threshold.
        *   Continuous updates to patterns and models.
        *   Allowing customers to add their own required regex patterns.

*   **False Positive (Context Corruption):**
    *   **Problem:** The scanner incorrectly redacts non-PII data, corrupting the prompt and leading to a poor or nonsensical response from the AI model.
    *   **Mitigation:**
        *   Configurable sensitivity levels in the policy engine.
        *   Customer-defined "allow lists" or "exclusion rules".
        *   Feedback mechanism for customers to report false positives, which can be used for model fine-tuning.

*   **State Store Unavailability/Data Loss:**
    *   **Problem:** The key-value store holding the placeholder-to-PII mapping goes down or loses data. Responses cannot be de-redacted, returning placeholders like `[PERSON_NAME_1]` to the end-user.
    *   **Mitigation:**
        *   Use a high-availability, replicated data store.
        *   Implement a circuit breaker that can bypass scanning (with a warning) or fail-fast if the store is down.
        *   The API response includes a status field indicating if de-redaction was successful.

*   **High Latency:**
    *   **Problem:** The scanning process adds unacceptable latency to the end-to-end AI call, degrading user experience.
    *   **Mitigation:**
        *   Horizontally scalable, stateless scanner instances.
        *   Optimized, distilled, or quantized NER models for faster inference.
        *   Use of highly performant regex engines (e.g., Rust's `regex` or Google's RE2).

---

## `agent_metadata`

```yaml
agent_metadata:
  purpose: "Provides a real-time gateway to scan for, redact, and de-redact Personally Identifiable Information (PII) in requests and responses to/from third-party AI models, preventing data leakage and aiding compliance."
  dependencies:
    - "core.sdk.CoreSDK": For common services like logging, metrics, and configuration.
    - "core.auth.IdentityService": To authenticate requests and enforce tenant-based policies.
    - "core.state.KeyValueStoreAdapter": An interface for a fast, TTL-based key-value store (e.g., Redis, DynamoDB) to manage redaction mappings.
    - "ai.vendor.ner.HuggingFaceAdapter": Adapter for a NER model provider.
    - "ai.vendor.ner.ScaleAIAdapter": Alternative adapter for a commercial NER provider.
  invalidation_conditions:
    - "A major new data privacy regulation (e.g., a federal US privacy law) is enacted, requiring new PII entity types to be supported."
    - "Systematic discovery of a new class of PII that bypasses existing regex and NER models."
    - "Significant performance degradation or concept drift in the underlying NER models."
    - "The state store provider has a major, unrecoverable failure."
  adjacent_apps:
    - "APP_37_Governance_AuditTrailEngine": The PiiScanner should push detailed logs of every redaction/de-redaction event (what was redacted, which policy was applied) to the Audit Trail Engine for compliance reporting.
    - "APP_01_Inference_CostRouter": The Cost Router should route requests through the PiiScanner before sending them to the final model provider, ensuring all traffic is sanitized.
    - "APP_19_Governance_PolicyEngine": The PiiScanner is a primary consumer of policies defined in the Policy Engine, which centrally manages redaction rules.
    - "APP_25_Datasets_Anonymizer": The PiiScanner can use anonymization techniques and models developed by the Dataset Anonymizer for its redaction strategies.