# APP_42_Governance_AccessControlManager

**Manages role-based access control (RBAC) and attribute-based access control (ABAC) for all applications and data within the ecosystem.**

---

## 1. Problem Statement

In a large-scale, multi-tenant AI ecosystem with dozens of interconnected applications, managing permissions is a critical and complex challenge. A simple, static permission model is insufficient. We need a system that can:

*   **Scale:** Handle thousands of users, service accounts, and resources across 75+ applications without becoming unmanageable.
*   **Adapt:** Enforce dynamic access rules based not just on a user's role, but on real-time attributes of the user, the resource, and the environment (e.g., data sensitivity, model risk score, time of day, IP address).
*   **Centralize:** Provide a single source of truth for authorization logic, preventing policy fragmentation and ensuring consistent enforcement across the entire platform.
*   **Audit:** Create an immutable, comprehensive log of every access decision (allow or deny) to meet stringent compliance and security requirements (e.g., GDPR, HIPAA, SOC 2).
*   **Integrate:** Seamlessly connect with external Identity Providers (IdPs) and internal data sources (like model registries or data catalogs) to enrich access decisions.

`APP_42_Governance_AccessControlManager` solves this by providing a centralized, policy-as-code authorization service that decouples access logic from application code.

## 2. Architecture

The system is designed around the standard XACML-inspired pattern, separating the concerns of policy enforcement, decision, administration, and information gathering. This architecture embodies the core tension of the system: providing extreme flexibility and **Openness** through its attribute-based model while maintaining strict, centralized **Control** and auditability.

### Architectural Tension: Openness vs. Control

*   **Openness:** The pluggable **Policy Information Point (PIP)** and the expressive policy language (OPA Rego) allow developers to define arbitrarily complex and context-aware authorization rules. This enables fine-grained, dynamic permissions that adapt to business needs.
*   **Control:** The centralized **Policy Decision Point (PDP)** ensures that all access logic is evaluated consistently. The immutable audit log provides a non-repudiable record of every decision, and the **Policy Enforcement Point (PEP)** acts as a universal gatekeeper, ensuring no request bypasses authorization checks.

### ASCII Diagram

```ascii
+---------------------------------+      +---------------------------------+
| External Identity Provider (IdP)|      | Other Ecosystem Apps (e.g.,     |
| (Okta, Azure AD, etc.)          |      | APP_01, APP_14, etc.)           |
+---------------------------------+      +-----------------------+---------+
       ^         |                                               |
       |         | User/Service Account                          | API Request
       |         | Authentication                                | (e.g., "run_model:xyz")
       |         v                                               v
+------+---------+-----------------+      +----------------------+----------+
|  Core SDK Auth Module           |----->| Policy Enforcement Point (PEP)  |
| (Validates JWT, gets user info) |      | (Embedded in App or as Gateway) |
+---------------------------------+      +----------------------+----------+
                                                                 |
                                                                 | Check(subject, action, resource, context)
                                                                 v
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                            APP_42_Governance_AccessControlManager                 |
|                                                                                   |
|  +-------------------------+       +-------------------------+                    |
|  | Policy Administration   |------>|                         |<-------------------+
|  | Point (PAP)             |       | Policy Decision Point   |                    |
|  | (API for CRUD on        |       | (PDP)                   |                    |
|  |  Roles, Policies)       |       | (Core RBAC/ABAC Engine) |                    |
|  +-------------------------+       |                         |                    |
|           ^                        +------------+------------+                    |
|           |                                     |                                 |
|           | Admin/Dev                             | Fetch Attributes                |
|           |                                     v                                 |
|  +--------+--------+                   +--------+----------------+                |
|  | Policy Store    |                   | Policy Information Point|                |
|  | (Postgres/JSONB)|                   | (PIP)                   |                |
|  | - Roles         |                   | - User Directory        |                |
|  | - Policies (OPA)|                   | - Data Catalog          |                |
|  | - Attributes    |                   | - Model Registry        |                |
|  +-----------------+                   +-------------------------+                |
|                                                                                   |
|                                      +-------------------------+                  |
|                                      | Audit Log Service       |<-----------------+
|                                      | (Records all decisions) |   Log(decision)
|                                      +-------------------------+                  |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

## 3. Revenue Surface

This application is a critical piece of enterprise infrastructure and is monetized as a B2B SaaS product with clear upsell paths.

*   **Core Tiers (SaaS Subscription):**
    *   **Team:** Basic RBAC functionality. Per-seat pricing. Limited to a predefined set of roles and permissions.
    *   **Business:** Full ABAC functionality. Higher per-seat price. Includes integrations with standard PIPs (e.g., user directories, Jira) and policy-as-code workflows.
    *   **Enterprise:** Custom pricing. Unlocks advanced features like policy simulation ("dry run"), jurisdictional controls (geofencing policies), just-in-time (JIT) access requests, and integrations with compliance platforms like Vanta or Drata.

*   **Usage-Based Billing:**
    *   **Policy Evaluations:** A metered charge per million policy evaluations above the tier's free quota. This aligns cost with platform usage.
    *   **Custom PIP Connectors:** A monthly fee for each active custom Policy Information Point connector, reflecting the maintenance and data-fetching overhead.

*   **Professional Services:**
    *   **Policy Migration & Authoring:** Consulting services to help large enterprises migrate from legacy systems and author complex ABAC policies.
    *   **Custom Connector Development:** Building bespoke PIP connectors to integrate with proprietary internal systems.

## 4. Cost Drivers

*   **Compute:** The PDP is a low-latency, high-throughput service. Its operational cost is the primary driver, scaling with the number of API calls across the entire ecosystem. High-availability, multi-region deployments are necessary for resilience.
*   **Audit Log Storage:** Every access decision is logged. This data volume can become massive, requiring a scalable and cost-effective storage solution (e.g., AWS S3 Glacier, Google Cloud Storage Archive) with an efficient query layer (e.g., Athena, BigQuery).
*   **Data Egress:** The PIP frequently fetches data from other services (both internal and external) to enrich policy decisions. This can lead to significant data transfer costs, especially in multi-cloud or hybrid environments.
*   **Engineering:** Maintaining the core policy engine (based on Open Policy Agent or a similar technology) and developing a library of robust PIP connectors requires specialized security and systems engineering talent.

## 5. Failure Modes

*   **PDP Unavailability:** If the PDP is down, all authorization checks fail.
    *   **Impact:** Catastrophic. Can lead to a total outage for all dependent applications.
    *   **Mitigation:** Multi-region active-active deployment of the PDP. PEPs must implement a configurable "fail-closed" (default deny) or "fail-open" (default allow) strategy. Fail-closed is the secure default, but fail-open might be required for non-critical systems. This choice is a critical risk decision.
*   **High Decision Latency:** Slow policy evaluation adds latency to every single API call in the ecosystem.
    *   **Impact:** Platform-wide performance degradation.
    *   **Mitigation:** Aggressive caching of decisions at the PEP layer, performance tuning of policy code, and horizontal scaling of the PDP.
*   **Incorrect Policy Logic:** A flawed policy can have severe security consequences.
    *   **Impact:** Privilege escalation (granting unauthorized access) or widespread denial of service (denying legitimate access).
    *   **Mitigation:** A robust "policy-as-code" CI/CD pipeline with static analysis, unit/integration testing, and a policy simulation feature that allows admins to test changes against historical traffic before deployment.
*   **PIP Data Staleness:** The PDP makes a decision based on outdated attributes from a PIP (e.g., a user who has been offboarded but whose "active" status is cached).
    *   **Impact:** Security vulnerability or incorrect denial of access.
    *   **Mitigation:** Configurable TTLs on PIP data, event-driven cache invalidation, and real-time data fetching for highly sensitive decisions.

---

## `agent_metadata`

```yaml
agent_metadata:
  purpose: >-
    Provides a centralized, fine-grained authorization service for the entire
    application ecosystem, supporting both Role-Based Access Control (RBAC)
    and Attribute-Based Access Control (ABAC). It decouples authorization logic
    from application code, enabling consistent policy enforcement and auditing.
  dependencies:
    - "SHARED_CORE_SDK": For parsing authenticated user/service identity from JWTs.
    - "External Identity Providers (e.g., Okta, Azure AD)": As the source of truth for user identity.
    - "APP_33_Data_Catalog": As a Policy Information Point (PIP) to fetch data sensitivity labels.
    - "APP_11_Model_Registry": As a PIP to fetch model risk scores or compliance status.
    - "APP_37_Governance_AuditTrailEngine": Consumes the detailed access decision logs generated by this service.
  invalidation_conditions:
    - A fundamental change in the shared authentication token (JWT) structure.
    - Deprecation of a critical data source used by a widely-adopted Policy Information Point.
    - Discovery of a major vulnerability in the underlying policy evaluation engine (e.g., OPA).
  adjacent_apps:
    - "APP_37_Governance_AuditTrailEngine": This app is the primary producer of logs for the Audit Trail Engine.
    - "APP_01_Inference_CostRouter": Uses policies from this app to determine which users/teams can access high-cost models.
    - "APP_38_Governance_DataMaskingProxy": The proxy consults this app to decide whether a user's role/attributes require data to be masked.
    - "APP_50_Billing_UsageTracker": Can use attributes from this app to segment usage data by department, project, or other custom attributes for chargeback.