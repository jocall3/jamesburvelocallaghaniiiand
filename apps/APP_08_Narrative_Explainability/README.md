# APP_08_Narrative_Explainability

> **The Black Box Decoder**: A production-grade system for generating human-readable, legally defensible explanations of AI model inference, bridging the gap between raw logits and regulatory compliance.

---

## 1. Executive Summary

**APP_08_Narrative_Explainability** is a specialized infrastructure component designed to attach "narrative layers" to stochastic model outputs. It intercepts inference results, analyzes attention mechanisms, feature attributions, and probability distributions, and synthesizes a natural language explanation of *why* a model generated a specific output.

This system addresses the critical tension between **Model Complexity** and **Interpretability**. As models grow larger (trillions of parameters), their reasoning becomes more opaque. APP_08 provides the necessary translation layer for enterprises operating in regulated industries (Finance, Healthcare, Legal) where "black box" decision-making is a liability.

---

## 2. Problem Statement

### The Opacity Crisis
Modern LLMs and multimodal models function as high-dimensional probability engines. While effective, they lack inherent accountability.
- **Regulatory Risk**: EU AI Act and GDPR require "right to explanation."
- **Trust Deficit**: Enterprise stakeholders cannot rely on AI agents if the reasoning chain is invisible.
- **Debugging Difficulty**: Engineers cannot optimize prompts or fine-tune models effectively without understanding failure modes.

### The Solution
APP_08 acts as a sidecar process to the main inference pipeline. It does not alter the inference but observes it, querying secondary "Explainer Models" or analyzing internal state (where available) to produce a structured `ExplanationObject` linked to the original `InferenceID`.

---

## 3. Architecture

The system operates on a **Post-Hoc Interpretability** model, utilizing a mix of Shapley values, attention map analysis, and counterfactual prompting.

```ascii
+---------------------+       +-------------------------+
| Client Application  | ----> | APP_08_Gateway          |
+---------------------+       +-----------+-------------+
          ^                               |
          | (1) Request + Context         | (2) Ingest Strategy
          |                               v
+---------+-----------+       +-------------------------+
| Inference Provider  | <---- | Explanation Orchestrator|
| (OpenAI/Anthropic/  |       +-----------+-------------+
|  HuggingFace/Local) |                   |
+---------------------+                   | (3) Parallel Analysis
          |                               |
          v                     +---------+---------+----------------+
(4) Raw Output (Logits/Text)    |                   |                |
          |             +-------v-------+   +-------v------+  +------v-------+
          +-----------> | Feature       |   | Counterfactual|  | Narrative    |
                        | Attribution   |   | Simulator    |  | Synthesizer  |
                        | (SHAP/Lime)   |   | (Perturb)    |  | (LLM-based)  |
                        +-------+-------+   +-------+------+  +------+-------+
                                |                   |                |
                                v                   v                v
                        +--------------------------------------------+
                        |          Consensus Engine                  |
                        | (Weighted Confidence Scoring)              |
                        +---------------------+----------------------+
                                              |
                                              v
                                    +-------------------+
                                    | Structured Report |
                                    | (JSON + Markdown) |
                                    +-------------------+
```

---

## 4. Core Capabilities & Integrations

### AI Vendor Integrations
APP_08 abstracts over specific interpretability tools provided by major vendors, normalizing them into a standard schema.

| Vendor | Integration Type | Capability Used |
|--------|------------------|-----------------|
| **Anthropic** | Direct API | Constitutional AI principles, self-correction prompts. |
| **OpenAI** | API | Counterfactual generation, reasoning trace extraction. |
| **Hugging Face** | SDK | Access to raw attention heads and hidden states (local models). |
| **Azure AI** | SDK | Content safety filters and explainability dashboard hooks. |
| **Fiddler/TruEra** | Adapter | Export to third-party observability platforms. |
| **LangChain** | Callback | Trace injection for chain-of-thought verification. |

### Key Features
1.  **Causal Graph Generation**: Maps input tokens to output tokens with weight visualization.
2.  **Counterfactual Analysis**: Automatically runs "What if?" scenarios (e.g., "If gender was swapped, would the loan be approved?").
3.  **Narrative Synthesis**: Generates a paragraph explaining the decision in plain English (or localized language).
4.  **Confidence Calibration**: distinct from model logprobs, this scores the *explanation's* reliability.

---

## 5. API Surface

### Endpoints

- `POST /v1/explain/inference`: Generate an explanation for a completed inference ID.
- `POST /v1/explain/simulate`: Run counterfactual simulations.
- `GET /v1/policy/compliance`: Check if an explanation meets configured regulatory standards.

### Example Payload

```json
{
  "inference_id": "inf_8823_x99",
  "model_context": "gpt-4-turbo",
  "input_snapshot": "...",
  "output_snapshot": "...",
  "config": {
    "depth": "deep",
    "method": "shapley_plus_narrative",
    "target_audience": "auditor"
  }
}
```

---

## 6. Business Logic & Unit Economics

### Revenue Surface
- **Per-Explanation Pricing**: Charge per explanation generated (compute intensive).
- **Compliance Retainer**: Monthly fee for long-term storage of audit trails (immutable logs).
- **Enterprise Connectors**: License fees for integrating with proprietary on-prem models.

### Cost Drivers
- **Compute Multiplier**: Generating a high-quality explanation often requires 2x-5x the compute of the original inference (due to counterfactual sampling).
- **Storage**: High-fidelity logs of attention maps are data-heavy.
- **API Costs**: Calls to "Explainer Models" (e.g., using GPT-4 to explain a Llama-2 output).

### Unit Economics Visibility
The system tracks `explanation_cost_per_token`.
- **Base Inference**: $0.03
- **Explanation Overhead**: $0.12 (4x multiplier for robust audit)
- **Margin**: Target 40% on the aggregate service.

---

## 7. Self-Querying Agent Mode

This application includes a mandatory introspection block for the ecosystem orchestrator.

```yaml
agent_metadata:
  app_id: "APP_08"
  name: "Narrative Explainability Layer"
  purpose: "Translate stochastic vector operations into human-semantic reasoning."
  dependencies:
    - "APP_01_Inference_CostRouter" (for billing explanation compute)
    - "APP_37_Governance_AuditTrailEngine" (for immutable storage)
    - "APP_00_Core_SDK" (Shared Protocol)
  invalidation_conditions:
    - "Model weights inaccessible (API closed)"
    - "Explanation confidence score < 0.5"
  adjacent_apps:
    - "APP_58_Narrative_ModelExplainabilityUI"
    - "APP_14_Agents_MultiModelOrchestrator"
  capabilities:
    - "introspect"
    - "explain"
    - "audit"
```

### Introspection Endpoints
- `/introspect`: Returns current health, loaded explainers, and queue depth.
- `/assumptions`: Returns the configured bias baselines and ethical frameworks.
- `/failure-modes`: Returns recent instances where explanation generation failed or hallucinated.

---

## 8. Legal & Defensibility

**Disclaimer**:
> This software generates *post-hoc rationalizations* of AI model behavior. It does not guarantee that the explanation perfectly matches the internal neural pathways of the model, especially for closed-source APIs. Explanations are probabilistic approximations.

**Jurisdictional Flags**:
- `ENABLE_GDPR_MODE`: Forces deletion of raw input data after explanation generation.
- `ENABLE_FINRA_MODE`: Enforces WORM (Write Once Read Many) storage for all explanation artifacts.

**License**:
Proprietary / Enterprise License (See LICENSE file).

---

## 9. Getting Started

### Prerequisites
- Python 3.10+
- Redis (for job queue)
- PostgreSQL (for structured logs)
- API Keys for at least 2 vendors (e.g., OpenAI, Anthropic)

### Installation

```bash
pip install -r requirements.txt
cp .env.example .env
# Configure VENDOR_KEYS in .env
python main.py
```

### Running a Test Explanation

```bash
curl -X POST http://localhost:8008/v1/explain/simulate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Deny the loan application.", "model": "mock-v1"}'
```

---

## 10. Tension & Trade-offs

**Scale vs. Explainability**:
- **High Scale**: Running millions of inferences per minute.
- **High Explainability**: Running SHAP analysis on every token.
- **Resolution**: APP_08 implements **Sampling Strategies**. It explains 100% of "High Risk" flagged inferences, but only 1% of routine traffic, or explains on-demand via user trigger. This balances the crushing cost of interpretability with the need for oversight.