# APP_71_Infra_TenantProvisioningService

**DISCLAIMER:** This software is provided "as is", without warranty of any kind, express or implied. The use of this software is at your own risk. The developers assume no liability for any direct, indirect, consequential, or incidental damages arising out of the use or inability to use this software. This service does not provide financial, legal, or compliance advice. All configurations, especially those related to compliance and data residency, should be independently verified by qualified professionals.

---

## 1. Problem Statement

Onboarding a new customer onto a complex, multi-service AI ecosystem is a high-friction, error-prone, and time-consuming process. Manual provisioning involves coordinating across multiple teams and systems to create isolated data stores, configure authentication realms, deploy compliance policies, set up billing meters, and allocate resources. This manual approach leads to inconsistent environments, security vulnerabilities, long sales-to-value cycles, and high operational overhead.

`APP_71_Infra_TenantProvisioningService` solves this by providing a centralized, API-driven, and fully automated engine for the entire tenant lifecycle. It orchestrates the creation, configuration, updating, and decommissioning of isolated tenant environments across the entire application ecosystem, ensuring consistency, security, and speed.

## 2. Architecture

The service is built around a durable workflow engine that executes a series of provisioning steps in a transactional and fault-tolerant manner. It acts as the central orchestrator, communicating with other core services to construct a complete tenant environment.

### High-Level Flow (ASCII Diagram)

```
                               +---------------------------------+
[API Gateway / UI] ------------>|   Tenant Provisioning Service   |
                               |         (APP_71)                |
                               +---------------------------------+
                                               |
                                               | (Orchestrates Workflow)
                                               v
                               +---------------------------------+
                               |      Durable Workflow Engine    |
                               | (e.g., Temporal, AWS Step Func) |
                               +---------------------------------+
                                               |
         +---------------------------------------------------------------------------------+
         |                                                                                 |
         v                                                                                 v
+--------------------+  1. Create Tenant Record  +--------------------------+   7. Report   +------------------+
| Tenant Metadata DB |<---------------------------|      Workflow Steps      |-------------->|  Event Bus       |
|    (Postgres)      |                           +--------------------------+   (e.g., Kafka)   | (TenantCreated)  |
+--------------------+                                       |                                +------------------+
                                                             |
         +---------------------------------------------------+---------------------------------------------------+
         |                         |                         |                         |                         |
         v                         v                         v                         v                         v
+--------------------+  +--------------------+  +--------------------+  +--------------------+  +--------------------+
| APP_05_Auth        |  | APP_23_Data        |  | APP_38_Governance  |  | APP_42_Billing     |  | Cloud Provider     |
| IdentityManager    |  | SchemaManager      |  | PolicyEngine       |  | UsageTracker       |  | Adapters (IaaS)    |
| (Create Realm)     |  | (Create Schema)    |  | (Deploy Policies)  |  | (Init Meters)      |  | (Create VPC, etc)  |
+--------------------+  +--------------------+  +--------------------+  +--------------------+  +--------------------+

```

### Core Tension: Automation vs. Customization

The fundamental design tension is between providing a fast, fully automated, "one-click" onboarding experience for standard customers and offering the deep, granular customization required by large enterprises.

*   **Automation:** The service exposes a simple `POST /v1/tenants` endpoint that takes a service plan (e.g., `standard`, `enterprise`) and runs a pre-defined, highly optimized provisioning workflow. This is designed for speed and reliability.
*   **Customization:** For enterprise clients, the service exposes `POST /v1/provisioning-plans`. This allows them to submit a declarative configuration file (e.g., YAML or JSON) specifying custom resource requirements, network topologies, policy overrides, and even hooks to call their own internal APIs during setup. The workflow engine dynamically constructs and executes a bespoke workflow based on this plan.

This dual-path approach allows the system to serve the entire market spectrum without compromising on either speed for the masses or control for the few.

## 3. Revenue Surface

This service is a direct enabler of revenue and a monetizable product in its own right.

*   **Tiered Onboarding Fees:** A one-time setup fee is charged per tenant, tiered by complexity. A `basic` plan might be free, while a `gov-cloud-hipaa` plan carries a significant setup cost due to the complex orchestration involved.
*   **Provisioning Plan Subscriptions:** Customers can subscribe to advanced provisioning plans (e.g., "High-Availability Plan," "Geo-Fenced EU Plan") for a recurring monthly fee. These plans include automated provisioning of DR environments, enforcement of data residency, etc.
*   **Add-on Resource Provisioning:** The service charges usage-based or fixed fees for provisioning optional, dedicated resources like private inference endpoints (via `APP_01_Inference_CostRouter`), dedicated vector databases (via `APP_19_Memory_VectorDBManager`), or VPC peering.
*   **Lifecycle Management Premium:** An enterprise-tier feature that includes configuration drift detection and automated remediation, charging a percentage of the tenant's total platform spend.
*   **Express Provisioning SLA:** A premium charge for a guaranteed provisioning time (e.g., under 5 minutes), which requires reserving "hot-standby" resources.

## 4. Cost Drivers

*   **Compute:** The workflow engine and API hosts are the primary compute cost. Costs scale with the number of concurrent provisioning operations.
*   **Database:** The Tenant Metadata Database stores the desired state, configuration, and status of every tenant. This grows linearly with the customer base.
*   **Third-Party API Calls:** Direct costs are incurred from calls to underlying IaaS/PaaS providers (e.g., AWS, Azure, GCP) to create resources like databases, networks, and storage buckets.
*   **Inter-Service Traffic:** High volume of network calls to other ecosystem applications during a provisioning workflow.
*   **Observability & Logging:** Storing detailed logs and traces for every step of every provisioning workflow is critical for auditing and debugging, but incurs storage and query costs.

## 5. Failure Modes & Mitigation

The provisioning process is a complex distributed transaction, making it susceptible to various failures.

*   **Partial Provisioning:** A step in the multi-step workflow fails (e.g., database created, but auth realm creation fails).
    *   **Mitigation:** The workflow engine uses a **saga pattern**. Each step has a corresponding "compensation" or rollback step. If the workflow fails, it executes the compensation steps in reverse order to clean up all created resources, ensuring atomicity. The tenant's state is marked as `PROVISIONING_FAILED`.
*   **Dependency Service Outage:** `APP_05_Auth_IdentityManager` is unavailable.
    *   **Mitigation:** The workflow engine implements durable, stateful retries with exponential backoff. The provisioning process is paused and will resume automatically once the dependency is available again. The tenant's state is marked as `PROVISIONING_STALLED`.
*   **Cloud Provider Throttling/Errors:** The underlying IaaS provider (e.g., AWS) API returns a `503` or a rate-limiting error.
    *   **Mitigation:** The cloud provider adapters have built-in, fine-grained retry logic specific to the provider's error codes and rate limits.
*   **Configuration Drift:** An administrator manually changes a resource in the cloud console, causing the actual state to differ from the service's desired state.
    *   **Mitigation:** The service runs periodic **reconciliation loops**. It fetches the current state of tenant resources and compares it against the stored configuration. It can be configured to either alert on drift or automatically remediate it. This is a premium, enterprise-tier feature.
*   **Idempotency Failure:** A network glitch causes a `createTenant` request to be sent twice.
    *   **Mitigation:** The API and workflow engine are designed to be fully idempotent. The initial `createTenant` call is associated with a unique idempotency key. Subsequent calls with the same key will not re-trigger the workflow but will instead return the result of the original, in-progress, or completed operation.

## 6. Enterprise Readiness & Upsell

*   **Unit Economics Visibility:** The cost to provision a single tenant is highly visible. Each workflow step logs its associated costs (API calls, compute time). This data is fed into `APP_42_Billing_UsageTracker`, allowing for precise margin calculation on onboarding fees.
*   **Replaceable Dependencies:** The core logic is decoupled from its dependencies. The `IWorkflowEngine` interface allows swapping Temporal for Cadence or AWS Step Functions. The `ICloudProvider` interface abstracts away AWS, GCP, and Azure specifics.
*   **Upsell Paths:**
    *   **Bring Your Own Key (BYOK):** Provisioning tenants with customer-managed encryption keys stored in their own KMS.
    *   **Custom Policy Sets:** Allowing enterprises to upload their own policy bundles (e.g., OPA policies) to be deployed by `APP_38_Governance_PolicyEngine` at creation time.
    *   **PrivateLink/VPC Peering:** Automating the network integration between the tenant's environment and their existing cloud infrastructure.
    *   **GitOps-driven Provisioning:** Allowing tenants to manage their environment configuration declaratively in a Git repository, which this service then applies automatically.

---

## 7. Machine-Readable Metadata

```yaml
agent_metadata:
  purpose: "To provide a centralized, automated, and API-driven service for the entire lifecycle management (provisioning, configuration, decommissioning) of isolated tenant environments across the ecosystem."
  dependencies:
    - "APP_05_Auth_IdentityManager: For creating tenant-specific authentication realms and issuers."
    - "APP_23_Data_SchemaManager: For creating isolated database schemas or namespaces."
    - "APP_38_Governance_PolicyEngine: For deploying default and custom governance/compliance policies."
    - "APP_42_Billing_UsageTracker: For initializing billing meters and tracking provisioning costs."
    - "APP_37_Governance_AuditTrailEngine: For establishing an audit log stream for the new tenant."
    - "CoreSDK: For shared protocols, auth clients, and event bus interfaces."
    - "ExternalIaaSProviders (AWS, GCP, Azure): For provisioning underlying infrastructure resources."
  invalidation_conditions:
    - "A major breaking change in the API contract of a critical downstream service (e.g., APP_05)."
    - "Deprecation of a core resource API by a major cloud provider."
    - "Discovery of a security flaw in the tenant isolation model that requires a new provisioning workflow."
  adjacent_apps:
    - "APP_72_Infra_TenantMigrationTool: A service that would use this provisioning service as a target to migrate existing tenants from one configuration to another."
    - "APP_43_Billing_PlanManager: The service that defines the provisioning 'plans' (e.g., standard, enterprise) that this service consumes and executes."
    - "APP_06_Auth_RBACManager: Consumed by this service to set up the initial administrator roles for a new tenant."