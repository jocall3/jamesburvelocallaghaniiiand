# APP_05_Eval_Benchmarker

> **The Truth Engine for Enterprise AI Adoption**

**Version:** 1.0.0  
**License:** MIT (Enterprise Edition Available)  
**Status:** Production-Grade  
**Ecosystem Role:** Quality Assurance & Comparative Analytics

---

## ⚠️ Legal & Compliance Disclaimer

This software is provided "as is" without warranties of any kind. It is designed for technical evaluation and benchmarking purposes.
- **No Financial Advice:** Benchmark scores do not constitute investment advice regarding specific AI vendors.
- **No Guarantee of Performance:** Past performance in benchmarks does not guarantee future model behavior in production.
- **Jurisdictional Control:** Users are responsible for ensuring that evaluation datasets comply with local data privacy laws (GDPR, CCPA).
- **Vendor Terms:** Users must adhere to the Terms of Service of all integrated AI providers (OpenAI, Anthropic, etc.) regarding automated testing and benchmarking.

---

## 1. Problem Statement

In a fragmented AI landscape with over 100 viable model providers, organizations face a critical paralysis: **"Which model is right for this specific task, right now?"**

Marketing claims are unreliable. Public leaderboards are static and generalized. Enterprises need a dynamic, private, and rigorous evaluation engine that can:
1.  Test models against *proprietary* golden datasets.
2.  Quantify the trade-off between **Cost**, **Latency**, and **Quality**.
3.  Detect regression in model performance over time (drift).
4.  Arbitrate between vendors to prevent lock-in.

**APP_05_Eval_Benchmarker** is a high-throughput, multi-modal evaluation harness that treats AI models as adversarial inputs, subjecting them to rigorous stress testing before they are promoted to production.

---

## 2. Architecture

The system operates on a "Challenge-Response-Judge" architecture. It abstracts over vendor APIs to inject prompts and measures the output against defined rubrics.

```ascii
[User/CI Pipeline]
       |
       v
+---------------------+
|  API Gateway        | <--- Shared Auth & Rate Limiting
+---------------------+
       |
       v
+---------------------------------------------------------------+
|  Orchestrator (The "Exam Proctor")                            |
|  - Loads "Golden Set" (Test Cases)                            |
|  - Selects Strategy (Exact Match, Semantic, LLM-as-Judge)     |
+---------------------------------------------------------------+
       |                                         |
       | (Parallel Dispatch)                     | (Evaluation)
       v                                         v
+-------------------+                   +-----------------------+
|  Vendor Adapters  |                   |  Judgement Engine     |
|                   |                   |                       |
|  [OpenAI] --------+-----> (Resp) ---> |  [Regex/Code Eval]    |
|  [Anthropic] -----+-----> (Resp) ---> |  [Vector Sim (Pinecone)]
|  [Cohere] --------+-----> (Resp) ---> |  [LLM Judge (GPT-4)]  |
|  [Local/Ollama] --+-----> (Resp) ---> |  [Human (Scale AI)]   |
+-------------------+                   +-----------------------+
                                                 |
                                                 v
                                        +-----------------------+
                                        |  Metrics Store        |
                                        |  (TimescaleDB)        |
                                        +-----------------------+
                                                 |
                                                 v
                                        +-----------------------+
                                        |  Reporting API        |
                                        |  - Cost/Token Analysis|
                                        |  - Latency Heatmaps   |
                                        +-----------------------+
```

### Core Tensions
- **Speed vs. Rigor:** Fast regex-based evals vs. slow, expensive "LLM-as-a-Judge" or Human-in-the-loop.
- **Generalization vs. Specificity:** Standard academic benchmarks (MMLU) vs. domain-specific proprietary datasets.

---

## 3. Key Features & Integrations

### AI Vendor Integrations (Top 100)
This app includes native adapters for the following, normalized to a common `PromptRequest` and `InferenceResult` schema:
- **OpenAI:** GPT-4o, GPT-4-Turbo (Used as both Subject and Judge).
- **Anthropic:** Claude 3.5 Sonnet (High-reasoning benchmarks).
- **Google Vertex AI:** Gemini 1.5 Pro (Long-context retrieval tests).
- **Cohere:** Command R+ (RAG-specific accuracy testing).
- **Hugging Face Inference Endpoints:** For testing open-weights models (Llama 3, Mixtral).
- **Groq:** For latency-critical benchmarking.

### Evaluation Strategies
1.  **Deterministic:** Exact match, JSON schema validation, Code execution (sandbox).
2.  **Semantic Similarity:** Embedding distance using **Pinecone** or **Weaviate**.
3.  **LLM-as-a-Judge:** Using a superior model to grade the output of a smaller model (e.g., GPT-4 grading Llama-3-8b).
4.  **Reference-Free:** Hallucination detection via consistency checking (SelfCheckGPT implementation).

### Ecosystem Integration
- **APP_01_Inference_CostRouter:** Pushes benchmark results to update routing weights.
- **APP_37_Governance_AuditTrailEngine:** Logs every evaluation run for compliance.
- **APP_14_Agents_MultiModelOrchestrator:** Uses this app to select the best agent for a task.

---

## 4. Getting Started

### Prerequisites
- Docker & Docker Compose
- Redis (for job queues)
- PostgreSQL (for results storage)
- API Keys for at least 2 vendors (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)

### Configuration (`config.yaml`)

```yaml
server:
  port: 8005
  environment: production

evaluation:
  default_judge: "openai/gpt-4-turbo"
  concurrency: 50
  timeout_ms: 30000

vendors:
  openai:
    enabled: true
    api_key: ${OPENAI_API_KEY}
  anthropic:
    enabled: true
    api_key: ${ANTHROPIC_API_KEY}
  huggingface:
    enabled: false

storage:
  postgres_url: ${DB_CONNECTION_STRING}
  vector_store: "pinecone"
```

### Installation

```bash
# Clone the ecosystem repo
git clone https://github.com/ecosystem/suite.git

# Navigate to app
cd apps/APP_05_Eval_Benchmarker

# Install dependencies (Python/Rust hybrid)
pip install -r requirements.txt
cargo build --release

# Run the service
./start_server.sh
```

---

## 5. API Reference

### Core Endpoints

#### `POST /api/v1/benchmark/run`
Initiates a benchmark run.
```json
{
  "dataset_id": "ds_finance_q4_2024",
  "models": ["openai/gpt-4o", "anthropic/claude-3-opus"],
  "metrics": ["accuracy", "latency", "cost_per_1k_tokens"],
  "judge_config": {
    "strategy": "llm_judge",
    "model": "openai/gpt-4-turbo"
  }
}
```

#### `GET /api/v1/benchmark/results/{run_id}`
Retrieves aggregated results.

#### `POST /api/v1/dataset/upload`
Uploads a "Golden Set" (CSV/JSONL) containing `input`, `expected_output`, and `rubric`.

### Self-Querying & Introspection (Mandatory)

#### `GET /introspect`
Returns current system state, active judges, and queue depth.

#### `GET /assumptions`
Returns the hard-coded assumptions used in scoring (e.g., "Latency is measured from first byte received").

#### `GET /failure-modes`
Lists known limitations (e.g., "LLM-as-a-Judge bias towards verbose answers").

#### `GET /update-triggers`
Defines conditions that trigger a re-evaluation (e.g., "New model version detected via APP_99_Registry").

---

## 6. Business Logic & Unit Economics

### Revenue Surface
1.  **Compute Margin:** Charge a markup on the inference costs incurred during evaluation.
2.  **SaaS Subscription:** Monthly fee for historical tracking, drift alerts, and team collaboration.
3.  **Certification Fees:** "Certified for Finance" badges for models that pass specific rigorous test suites.

### Cost Drivers
- **Inference Costs:** The primary cost. Running 1,000 eval questions against GPT-4 is expensive.
    - *Mitigation:* Use caching, tiered evaluation (fail fast with cheap models), and synthetic data expansion.
- **Storage:** Storing full text inputs/outputs for audit trails.
- **Vector DB:** Costs for semantic similarity checks.

### Unit Economics Example
- **Scenario:** Customer runs a "Daily Regression Test" on their RAG pipeline.
- **Input:** 100 Questions.
- **Models Tested:** 2 (Current Prod vs Candidate).
- **Judge:** GPT-4-Turbo.
- **Cost to Serve:** ~$2.50 (Vendor API fees) + $0.10 (Compute/DB).
- **Price to Customer:** $10.00 per run (or included in $500/mo tier).
- **Margin:** ~70%.

---

## 7. Operational Tensions

### The "Judge Bias" Problem
LLMs often favor their own outputs or verbose outputs when acting as judges.
- **Solution:** We implement "Pairwise Comparison with Swap" (asking the judge twice with swapped orders) to neutralize position bias.
- **Code Location:** `src/judges/pairwise_arbiter.py`

### The "Data Contamination" Risk
Public benchmarks are often included in model training data.
- **Solution:** Support for dynamic, synthetic dataset generation via `APP_08_Synthetic_DataGen` to create fresh, unseen test cases on the fly.

---

## 8. Agent Metadata

```yaml
agent_metadata:
  purpose: "To provide objective, quantifiable metrics on AI model performance, cost, and safety."
  dependencies:
    - "APP_00_Core_SDK"
    - "APP_01_Inference_CostRouter" (for model access)
    - "APP_37_Governance_AuditTrailEngine" (for logging)
  invalidation_conditions:
    - "Vendor API schema changes"
    - "Judge model deprecation"
  adjacent_apps:
    - "APP_08_Synthetic_DataGen" (Source of test data)
    - "APP_58_Narrative_ModelExplainabilityUI" (Consumer of eval reports)
  capabilities:
    - "multi_model_inference"
    - "statistical_analysis"
    - "drift_detection"