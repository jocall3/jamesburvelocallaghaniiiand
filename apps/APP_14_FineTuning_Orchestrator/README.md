# APP_14_FineTuning_Orchestrator

## 1. System Overview

**APP_14_FineTuning_Orchestrator** is a production-grade control plane designed to abstract, manage, and optimize the lifecycle of model fine-tuning across heterogeneous AI providers. It decouples the definition of a training job from the underlying execution environment, allowing organizations to switch between proprietary fine-tuning endpoints (e.g., OpenAI, Azure OpenAI) and open-weights training on managed infrastructure (e.g., Databricks MosaicML, Hugging Face AutoTrain, AWS SageMaker) without refactoring application logic.

### Core Tension: Specialization vs. Portability
The central architectural tension in this system is **Specialization (Model Performance) vs. Portability (Vendor Independence)**. Highly specialized fine-tuning often requires vendor-specific hyperparameters and data formats. This orchestrator enforces a unified schema for training configurations while using adapter patterns to translate these into vendor-specific payloads, accepting a slight overhead in abstraction to gain massive leverage in vendor negotiation and disaster recovery.

## 2. Problem Statement

Fine-tuning Large Language Models (LLMs) is currently fragmented across incompatible APIs, data formats, and monitoring tools.
-   **Vendor Lock-in**: Training on OpenAI locks you into their ecosystem. Moving to Llama 3 on AWS requires a complete rewrite of the training pipeline.
-   **Opaque Economics**: It is difficult to compare the TCO (Total Cost of Ownership) of fine-tuning GPT-3.5 vs. hosting a LoRA-tuned Mistral 7B.
-   **Zombie Jobs**: Lack of centralized state management leads to orphaned training runs that consume budget without producing artifacts.
-   **Compliance Gaps**: No unified audit trail for *what* data was used to train *which* model version.

## 3. Architecture

```ascii
                                  +-------------------+
                                  |   Unified API     |
                                  |  (gRPC / REST)    |
                                  +--------+----------+
                                           |
                                           v
+------------------+          +------------+-----------+          +------------------+
|  Policy Engine   | <------- |    Job Controller      | -------> |   Cost Ledger    |
| (AuthZ, Quotas)  |          |   (State Machine)      |          | (FinOps Module)  |
+------------------+          +------------+-----------+          +------------------+
                                           |
           +-------------------------------+-------------------------------+
           |                               |                               |
           v                               v                               v
+----------+----------+         +----------+----------+         +----------+----------+
|   OpenAI Adapter    |         |  Azure AI Adapter   |         | MosaicML Adapter    |
| (GPT-3.5/4 Turbo)   |         | (Llama/Phi/Custom)  |         | (MPT/Open Weights)  |
+----------+----------+         +----------+----------+         +----------+----------+
           |                               |                               |
           v                               v                               v
    [External API]                  [External API]                  [External API]
```

## 4. Key Features & Integrations

### Integrations
-   **OpenAI**: Full support for `gpt-3.5-turbo` and `gpt-4o` fine-tuning jobs.
-   **Azure AI Studio**: Integration for managed open-source model training.
-   **Databricks MosaicML**: High-performance training for large open-weights models.
-   **Hugging Face**: AutoTrain integration for rapid prototyping.
-   **Weights & Biases**: (Optional) Webhook integration for experiment tracking.

### Capabilities
-   **Hyperparameter Translation**: Maps generic config (e.g., `learning_rate_multiplier`) to provider-specific parameters.
-   **Dataset Validation**: Pre-flight checks on dataset schema (JSONL validation, token count estimation) before submission to expensive endpoints.
-   **Drift Detection**: Compares training loss curves across different providers for the same dataset.
-   **Artifact Registry**: Centralized tracking of Model IDs, Checkpoints, and Adapter weights.

## 5. Revenue Surface

This application generates value through:

1.  **Compute Arbitrage**: Automatically routing jobs to the cheapest provider that meets performance SLAs (e.g., switching from GPT-4 FT to Llama 3 70B FT).
2.  **Orchestration Fees**: Per-job management fee or monthly platform subscription.
3.  **Enterprise Governance**: Premium modules for RBAC, VPC peering, and audit log retention.
4.  **Model Hosting**: Upsell path to `APP_01_Inference_CostRouter` for serving the fine-tuned models.

## 6. Cost Drivers

-   **Egress Bandwidth**: Uploading large training datasets to multiple providers.
-   **State Management**: High-availability database (Postgres/Redis) for tracking long-running jobs (days/weeks).
-   **Polling Overhead**: Frequent API polling to check job status across providers.

## 7. Unit Economics

-   **Input**: Training Tokens + Validation Tokens.
-   **Process**: Orchestration overhead is negligible (< $0.01 per job).
-   **Output**: The primary cost is the pass-through compute cost from the AI vendor.
-   **Margin**: Value is derived from engineering time saved (estimated 20-40 hours per model migration).

## 8. Failure Modes

1.  **Provider Outage**: If OpenAI API is down, the queue pauses. *Mitigation*: Circuit breakers and auto-retry with exponential backoff.
2.  **Validation Mismatch**: Provider rejects dataset after upload. *Mitigation*: Strict local validation using shared tokenizer libraries before upload.
3.  **Runaway Costs**: A job hangs or loops. *Mitigation*: Hard timeouts and budget caps enforced at the Controller level.
4.  **Credential Rotation**: API keys expire mid-training. *Mitigation*: Vault integration for dynamic secret injection.

## 9. Self-Querying Agent Metadata

```yaml
agent_metadata:
  purpose: "Orchestrate and abstract the lifecycle of model fine-tuning across multiple AI providers."
  dependencies:
    - "APP_00_Shared_Core_SDK"
    - "APP_07_Dataset_Lifecycle_Manager"
    - "APP_01_Inference_CostRouter"
  invalidation_conditions:
    - "Provider API schema changes (breaking)"
    - "Loss of access to encrypted credential store"
  adjacent_apps:
    - "APP_37_Governance_AuditTrailEngine"
    - "APP_58_Narrative_ModelExplainabilityUI"
  capabilities:
    - "start_training_job"
    - "cancel_training_job"
    - "get_training_metrics"
    - "list_finetuned_models"
```

## 10. Legal & Compliance

**Disclaimer**: This software orchestrates third-party computational resources. Users are responsible for ensuring they have the legal right to fine-tune models on their datasets. The software does not guarantee convergence or model performance.

-   **Jurisdiction**: Supports region-pinning (e.g., "EU-Only") for data residency compliance.
-   **Audit**: All API interactions are logged with immutable timestamps.
-   **License**: Enterprise Proprietary (see LICENSE).

## 11. Getting Started

### Prerequisites
-   Python 3.10+
-   Redis (for job queue)
-   PostgreSQL (for job history)
-   API Keys for at least one provider (OpenAI, Azure, etc.)

### Installation
```bash
pip install -r requirements.txt
cp .env.example .env
# Configure PROVIDER_OPENAI_KEY, PROVIDER_AZURE_KEY
python main.py
```

### API Example
```bash
curl -X POST http://localhost:8000/api/v1/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "model_base": "gpt-3.5-turbo",
    "dataset_id": "ds_12345",
    "provider": "openai",
    "hyperparameters": {
      "epochs": 3
    }
  }'