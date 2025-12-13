# APP_07_Data_Ingestion_MarketDataAggregator

**Disclaimer:** This application provides data aggregation infrastructure. It is not a source of financial advice. Data accuracy and timeliness are subject to the guarantees of the upstream providers. Always perform independent verification before making any financial decisions.

---

## 1. Problem Statement

Financial AI models, algorithmic trading strategies, and risk management systems require a constant, high-fidelity stream of real-time market data. Sourcing this data is a significant systems integration challenge. Financial institutions must subscribe to multiple data vendors (e.g., Polygon.io, IEX Cloud, Refinitiv, Bloomberg), each with a proprietary API, authentication scheme, data format, and set of symbols.

This creates a complex, brittle, and expensive data ingestion layer that must be custom-built and maintained. Engineers spend more time managing data provider connections, normalizing disparate schemas, and handling network interruptions than on building core business logic.

`APP_07_Data_Ingestion_MarketDataAggregator` solves this problem by providing a unified, resilient, and scalable service that ingests data from numerous market data providers and broadcasts a normalized, consistent stream onto the shared ecosystem event bus. It acts as a single, reliable firehose for all market data, abstracting away the complexity of the underlying sources.

## 2. Architecture

The system is designed around a plugin-based adapter architecture, ensuring extensibility and isolation. The core tension of **Latency vs. Reliability** is resolved by offering dual-path publishing, allowing downstream consumers to select the trade-off that fits their use case.

```ascii
+---------------------------+      +---------------------------+      +---------------------------+
|   External Provider A     |      |   External Provider B     |      |   External Provider C     |
|   (e.g., Polygon.io)      |      |   (e.g., IEX Cloud)       |      |   (e.g., Crypto Exchange) |
|   (WebSocket/REST)        |      |   (SSE/REST)              |      |   (FIX/WebSocket)         |
+-------------+-------------+      +-------------+-------------+      +-------------+-------------+
              |                            |                            |
              | (Raw Ticks, Quotes, Bars)  |                            |
              v                            v                            v
+-------------+-------------+<----+--------+-------------+<----+--------+-------------+
|      Adapter A Plugin     |     |      Adapter B Plugin     |     |      Adapter C Plugin     |
| (Connection Mgmt, Auth)   |     | (Connection Mgmt, Auth)   |     | (Connection Mgmt, Auth)   |
+---------------------------+     +---------------------------+     +---------------------------+
              | (Provider-specific format) |                            |
              v                            v                            v
+-------------------------------------------------------------------------------------------+
|                                Normalization Engine                                       |
|  - Maps provider fields to Unified Market Data Ontology (UMDO)                            |
|  - Type coercion, timestamp sync (NTP), symbol mapping                                    |
|  - Schema validation and quarantine for malformed data                                    |
+-------------------------------------------------------------------------------------------+
                                            | (UMDO Format)
                                            v
+-------------------------------------------------------------------------------------------+
|                                Resilience & Buffering Layer                               |
|  - In-memory ring buffers for short-term disconnects                                      |
|  - Spill-to-disk for extended outages (configurable)                                      |
|  - Heartbeat monitoring and automatic reconnection logic                                  |
+-------------------------------------------------------------------------------------------+
                                            |
                                            v
+-------------------------------------------------------------------------------------------+
|                                Dual-Path Publishing Gateway                               |
|                                                                                           |
|   [Path 1: Low Latency] -------------------> To: event_bus:market.ticks.fast               |
|   - Protocol: UDP Multicast / WebSockets    - Delivery: Best-effort, potential loss       |
|   - Use Case: HFT, real-time dashboards     - Minimal serialization overhead              |
|                                                                                           |
|   [Path 2: High Reliability] -------------> To: event_bus:market.ticks.reliable           |
|   - Protocol: Kafka / NATS JetStream        - Delivery: At-least-once, ordered            |
|   - Use Case: Audit, compliance, analytics  - Durable, persistent stream                  |
|                                                                                           |
+-------------------------------------------------------------------------------------------+

```

## 3. Revenue Surface

This application is monetized as a critical infrastructure component, offering clear value based on data volume, quality, and reliability.

*   **Tiered Subscription (SaaS):**
    *   **Developer:** 1 data source, 100 symbols, limited message rate.
    *   **Pro:** 5 data sources, 5,000 symbols, high message rate.
    *   **Enterprise:** Unlimited sources, unlimited symbols, dedicated infrastructure, premium support.
*   **Usage-Based Billing:** A metered component based on messages processed or GB of data egressed, providing a direct link between customer value and cost.
*   **Data Provider Markup:** A percentage-based service fee on top of the raw data costs from the underlying providers, simplifying billing for the customer.
*   **Premium Add-ons:**
    *   **Historical Data Replay:** Service to backfill and stream historical data through the same normalized API for model training and backtesting.
    *   **Derived Data Feeds:** Real-time calculation of VWAP, TWAP, or custom aggregations (e.g., 5-second OHLCV bars from tick data) as separate, premium streams.
    *   **Compliance Stream:** A guaranteed, immutable, and signed stream of all data for regulatory audit purposes (e.g., FINRA/SEC compliance).

## 4. Cost Drivers

*   **Upstream Data Provider Fees:** The most significant cost. Licenses for real-time data from top-tier providers are expensive and scale with the number of symbols and markets.
*   **Compute (CPU/Memory):** Low-latency stream processing, normalization, and managing thousands of concurrent connections require high-performance compute instances.
*   **Network Egress:** Broadcasting high-frequency data (millions of messages per second) to the event bus and downstream consumers is a major cost driver.
*   **Storage:** Primarily for the spill-to-disk buffer in the resilience layer and for the optional Historical Data Replay service.
*   **Engineering & Maintenance:** Each provider adapter is a mini-integration project that requires ongoing maintenance to adapt to API changes, schema updates, and authentication rotations.

## 5. Failure Modes

The system is designed to be resilient to failures in the complex, distributed environment of real-time data.

*   **Upstream Provider Outage:**
    *   **Detection:** Lack of heartbeats or TCP connection drops.
    *   **Mitigation:** The specific adapter enters a reconnection loop with exponential backoff. Data from that source is flagged as "stale" in the unified stream. Alerts are fired to an operator dashboard. For enterprise clients, a pre-configured failover to a secondary provider for the same symbols can be triggered.
*   **Network Partition (Loss of Event Bus):**
    *   **Detection:** Failure to publish messages to the event bus.
    *   **Mitigation:** The Resilience Layer activates. Incoming data is buffered in an in-memory ring buffer. If the outage persists beyond the buffer's capacity, data is spooled to a local disk cache. Upon reconnection, the buffered data is published in the correct order to ensure data integrity for reliable streams.
*   **Malformed Data ("Poison Pill"):**
    *   **Detection:** The Normalization Engine fails to validate an incoming message against the provider's expected schema.
    *   **Mitigation:** The malformed message is shunted to a "dead-letter" queue for later inspection. The specific adapter that produced it is flagged, and if the error rate exceeds a threshold, the adapter is automatically restarted. This prevents one bad message from crashing the entire service.
*   **Backpressure / Slow Consumer:**
    *   **Detection:** The publishing gateway's internal buffers start to fill up because a downstream system (the event bus or a direct consumer) cannot keep up.
    *   **Mitigation:** For the reliable stream, backpressure is naturally handled by the messaging system (e.g., Kafka). For the low-latency stream, the system will begin to drop messages, prioritizing the most recent data, and incrementing a "dropped_messages" metric for monitoring.
*   **Symbol Mapping Failure:**
    *   **Detection:** An incoming symbol from a provider does not map to a known entity in the Unified Market Data Ontology.
    *   **Mitigation:** The message is flagged as "unmapped" and can be either dropped or published to a special topic for manual review, based on configuration. This prevents data pollution.

## 6. Enterprise Upsell Paths

*   **On-Premise / VPC Deployment:** For large financial institutions with strict data residency and security requirements, the entire application can be deployed within their own cloud environment or on-premise data center.
*   **Direct Exchange Co-location:** Deploying dedicated instances of the aggregator within data centers like Equinix NY4/LD4 to provide nanosecond-level proximity to major trading exchanges, delivered via direct cross-connects.
*   **Custom Adapter Development:** Professional services engagement to build and maintain adapters for proprietary internal data feeds or niche, exotic data providers that a client relies on.
*   **Guaranteed SLAs:** Offering financially-backed Service Level Agreements for uptime, data completeness, and maximum latency, which is critical for algorithmic trading clients.
*   **Advanced Analytics & Feature Engineering:** A higher-tier service that integrates with `APP_25_Analytics_StreamProcessing` to provide real-time feature extraction (e.g., volatility surfaces, order book imbalance) directly on the incoming data streams.