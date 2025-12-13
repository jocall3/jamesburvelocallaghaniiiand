# APP_07_Billing_UsageTracker

**A highly available, distributed service for metering resource consumption across the AI ecosystem.**

This application serves as the financial source of truth for all billable events occurring within the platform. It subscribes to the shared event bus, processes usage events idempotently, aggregates them into time-series data, and exposes an API for querying consumption metrics. It is the foundational layer for billing, cost allocation, and financial analytics.

---

## Problem Statement

In a distributed, multi-provider AI ecosystem, tracking resource consumption is a complex, high-stakes problem. Activities like model inferences, data storage, API calls, and agent executions generate a high-velocity stream of events. Without a centralized, reliable, and auditable system to meter this usage, it's impossible to:

1.  **Bill customers accurately:** Leading to revenue loss or customer disputes.
2.  **Allocate costs internally:** Obscuring the true cost of different products, teams, or features.
3.  **Provide usage visibility:** Preventing customers from understanding and managing their own spend.
4.  **Enforce quotas and limits:** Creating risks of resource abuse and financial overruns.

`UsageTracker` solves this by providing a scalable, fault-tolerant ingestion and aggregation pipeline that acts as the canonical system of record for all billable activities.

## Architecture

The architecture is designed around the core tension of **Accuracy vs. Latency**. It provides a fast path for near-real-time estimates and a slower, more rigorous path for generating billable, auditable totals.

```ascii
                               +-------------------------+
                               | Shared Event Bus        |
                               | (e.g., Kafka, Pulsar)   |
                               +-----------+-------------+
                                           |
                                           | (Usage Events: Inference, Storage, API calls)
                                           |
           +-------------------------------+-------------------------------+
           |                                                               |
+----------v-----------+                                        +----------v-----------+
| Fast Path Consumer   |                                        | Accuracy Path Consumer|
| (Low Latency)        |                                        | (Idempotent, Batch)   |
+----------+-----------+                                        +----------+-----------+
           |                                                               |
           | (Stream Processing)                                           | (Batch Aggregation)
           |                                                               |
+----------v-----------+                                        +----------v-----------+
| In-Memory Cache      |                                        | Time-Series Database  |
| (e.g., Redis)        |                                        | (e.g., TimescaleDB)   |
| For Real-time Dash   |                                        | For Billing Records   |
+----------+-----------+                                        +----------+-----------+
           |                                                               |
           |                                                               |
+----------v-----------+                                        +----------v-----------+
| Usage Query API      <----------------------------------------+          |
| (/usage/realtime)    |                                                   |
+----------------------+                                                   |
                                                                           |
                                                                +----------v-----------+
                                                                | Usage Query API      |
                                                                | (/usage/billing)     |
                                                                +----------------------+
                                                                           |
                                                                           |
                                                                +----------v-----------+
                                                                | APP_10_Billing_       |
                                                                | InvoiceGenerator      |
                                                                +----------------------+
```

### Key Components:

1.  **Event Bus Subscriber:** Listens to topics on the shared event bus where billable events are published (e.g., `events.inference.completed`, `events.storage.bytes_written`).
2.  **Dual-Path Consumers:**
    *   **Fast Path:** A consumer group focused on low-latency processing. It updates in-memory counters (backed by Redis) to power real-time dashboards. It prioritizes speed over perfect transactional integrity.
    *   **Accuracy Path:** A separate consumer group focused on correctness. It uses smaller batches, idempotent processing logic (checking event UUIDs against a bloom filter or database), and transactional writes to a durable time-series database. This is the source of truth for invoicing.
3.  **Aggregation Engine:** Transforms raw events (e.g., "1024 input tokens used for model X by tenant Y") into structured, time-bucketed metrics.
4.  **Time-Series Database:** Stores aggregated usage data, indexed by tenant, resource type, time, and other relevant dimensions. This allows for efficient querying of historical usage.
5.  **Query API:** Exposes secure endpoints for other services to retrieve usage data. This is used by invoicing systems, customer-facing dashboards, and internal analytics tools.

## Revenue Surface

`UsageTracker` is a core infrastructure component that enables multiple revenue models.

*   **Usage-Based Billing (Core):** The data generated by this service is the direct input for pay-as-you-go billing models. We charge a small percentage of the revenue we enable tracking for (e.g., 0.5% of tracked spend).
*   **Real-time Usage API Access (Premium Tier):** Access to the low-latency "fast path" API is a premium feature for customers who want to build their own real-time dashboards or pre-paid credit systems.
*   **Advanced Analytics & Anomaly Detection (Enterprise Tier):** A subscription service that runs analytics on the usage data to provide customers with cost optimization insights, budget alerting, and anomaly detection (e.g., "Your inference costs spiked 300% in the last hour").
*   **Audit & Compliance Reporting (Enterprise Tier):** On-demand generation of signed, immutable usage reports for financial audits and compliance requirements.

## Cost Drivers

*   **Database Storage & IOPS:** The primary cost driver. The volume of time-series data can grow very large. Requires a robust, scalable database solution.
*   **Compute Resources:** The number of consumer instances scales directly with the volume of events on the bus.
*   **Message Bus Costs:** High throughput on the shared event bus may incur costs depending on the underlying technology (e.g., Kafka cluster hosting).
*   **Data Retention:** Long-term storage of raw and aggregated event data for audit purposes contributes significantly to storage costs. Policies for data tiering (hot, warm, cold storage) are critical.

## Failure Modes

*   **Event Bus Unavailability:**
    *   **Detection:** Health checks and consumer lag monitoring.
    *   **Mitigation:** The event bus is designed for high availability with data replication. Consumers will pause and automatically reconnect. No data is lost as long as the bus's retention policy is longer than the outage.
*   **Duplicate Event Processing (Over-billing):**
    *   **Detection:** This is a critical failure. It's detected via reconciliation jobs that compare checksums of usage data against other sources.
    *   **Mitigation:** The "Accuracy Path" consumer implements strict idempotent processing. Each event has a unique ID, which is checked against a persistent store (e.g., a `processed_events` table or Redis set) before processing.
*   **Processing Lag:**
    *   **Detection:** Monitoring consumer group lag (the delta between the last produced message and the last consumed message).
    *   **Mitigation:** The consumer groups are configured to auto-scale based on lag metrics. If lag exceeds a critical threshold, an alert is triggered for manual intervention.
*   **"Poison Pill" Message:**
    *   **Detection:** A malformed event causes the consumer to crash in a loop.
    *   **Mitigation:** Consumers are wrapped in a robust error handling block. After a set number of retries, the problematic message is shunted to a Dead-Letter Queue (DLQ) for offline analysis. Processing of valid messages continues uninterrupted.
*   **Database Unavailability:**
    *   **Detection:** Health checks on the database connection.
    *   **Mitigation:** The "Accuracy Path" consumer will pause processing and apply backpressure to the event bus. It will not acknowledge messages until they are successfully persisted, ensuring at-least-once delivery. The service can withstand temporary DB outages.

---

## Legal and Compliance

This service processes potentially sensitive financial and operational data.

*   **License:** All code is licensed under the Apache 2.0 License. See `LICENSE` file.
*   **Disclaimer:** This service provides data for billing purposes but does not offer financial advice. All calculations should be independently verified. The accuracy of the data is dependent on the correctness of events published by upstream services.
*   **Jurisdictional Controls:** The service includes feature flags to alter data retention policies and anonymization logic based on the jurisdiction of the tenant (`tenant_metadata.jurisdiction`).
*   **Audit Hooks:** All writes to the time-series database and all API query requests are logged to a separate, immutable audit trail (e.g., via `APP_37_Governance_AuditTrailEngine`).

---

## `agent_metadata`

```yaml
agent_metadata:
  purpose: "To meter all billable resource consumption across the ecosystem by consuming a stream of usage events, aggregating them into a time-series database, and exposing a queryable API. This service is the source of truth for customer billing and internal cost allocation."
  dependencies:
    - "SharedEventBus: For receiving usage events from all other applications."
    - "CoreSDK: For tenant identification, authentication, and authorization for the Query API."
    - "Time-Series Database (e.g., TimescaleDB): For durable storage of aggregated usage metrics."
    - "SchemaRegistry: To validate incoming event schemas and prevent data corruption."
  invalidation_conditions:
    - "A breaking change in the core `UsageEvent` schema within the Unified Ontology without a corresponding consumer update."
    - "Corruption or loss of data in the underlying time-series database."
    - "Sustained event bus outage exceeding the data retention window, leading to permanent data loss."
  adjacent_apps:
    - "APP_10_Billing_InvoiceGenerator: Consumes aggregated data from this service's API to generate customer invoices."
    - "APP_01_Inference_CostRouter: Publishes detailed cost and usage events after each inference."
    - "APP_37_Governance_AuditTrailEngine: Receives logs from this service for compliance and audit purposes."
    - "APP_42_Analytics_CostExplorerUI: A primary consumer of the Query API to build customer-facing dashboards."