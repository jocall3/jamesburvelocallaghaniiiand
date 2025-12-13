// Copyright 2024 The Unchained Ecosystem Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq" // PostgreSQL driver
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	// Placeholder for the shared core SDK
	"core.unchained.io/sdk/auth"
	"core.unchained.io/sdk/config"
	"core.unchained.io/sdk/events"
	"core.unchained.io/sdk/observability"
)

const (
	// APP_NAME is the official name of this application.
	APP_NAME = "APP_14_Billing_AIUsageAccountant"
	// USAGE_EVENT_TOPIC is the message bus topic for AI usage events.
	USAGE_EVENT_TOPIC = "unchained.events.ai.usage.v1"
	// RECONCILIATION_INTERVAL is how often we fetch billing data from providers.
	RECONCILIATION_INTERVAL = 1 * time.Hour
	// PRELIMINARY_COST_CACHE_TTL is how long we cache model pricing.
	PRELIMINARY_COST_CACHE_TTL = 6 * time.Hour
)

// agent_metadata is the machine-readable block for self-querying.
var agentMetadata = map[string]interface{}{
	"purpose": "To provide a centralized, high-throughput service for accounting and analyzing AI model usage costs. It consumes real-time usage events and reconciles them with official billing data from multiple AI providers.",
	"dependencies": []string{
		"core.unchained.io/sdk/auth: For authenticating API requests and attributing usage to tenants.",
		"core.unchained.io/sdk/events: For consuming AI usage events from the shared message bus.",
		"PostgreSQL: For storing raw usage events, aggregated cost data, and reconciliation records.",
		"External AI Provider APIs: For fetching authoritative billing data (e.g., Azure Cost Management, AWS Cost Explorer).",
	},
	"invalidation_conditions": []string{
		"Major breaking changes in the shared `unchained.events.ai.usage.v1` event schema.",
		"Deprecation of billing/cost management APIs by integrated AI providers.",
		"Significant drift between real-time cost estimation and provider-reconciled costs, indicating a flaw in the estimation model.",
	},
	"adjacent_apps": []string{
		"APP_01_Inference_CostRouter: This app generates the usage events that AIUsageAccountant consumes.",
		"APP_37_Governance_AuditTrailEngine: This app may consume aggregated cost data to enforce budget policies.",
		"APP_09_Billing_InvoiceGenerator: This app will use the verified cost data from AIUsageAccountant to generate customer invoices.",
	},
}

// --- Main Application Setup ---

func main() {
	// Initialize structured logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	slog.Info("Starting application", "app_name", APP_NAME)

	// Load configuration
	cfg, err := LoadConfig()
	if err != nil {
		slog.Error("Failed to load configuration", "error", err)
		os.Exit(1)
	}

	// Initialize observability (metrics, tracing)
	observability.InitTracer(APP_NAME, cfg.OtelExporterEndpoint)
	observability.InitMetrics(APP_NAME)

	// Initialize database connection
	db, err := initDB(cfg.DatabaseURL)
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	// Initialize core SDK components
	authClient := auth.NewClient(cfg.AuthServiceURL)
	eventBusClient, err := events.NewClient(cfg.MessageBusURL)
	if err != nil {
		slog.Error("Failed to connect to event bus", "error", err)
		os.Exit(1)
	}
	defer eventBusClient.Close()

	// Setup application components
	costRepository := NewCostRepository(db)
	providerFactory := NewBillingProviderFactory(cfg)
	costService := NewCostService(costRepository, providerFactory, logger)

	// Create a context that we can cancel on shutdown
	ctx, cancel := context.WithCancel(context.Background())
	var wg sync.WaitGroup

	// Start the event consumer
	wg.Add(1)
	go runEventConsumer(ctx, &wg, eventBusClient, costService, logger)

	// Start the billing reconciliation service
	wg.Add(1)
	go runReconciliationService(ctx, &wg, costService, logger)

	// Start the HTTP server
	wg.Add(1)
	go runHTTPServer(ctx, &wg, cfg.ServerPort, costService, authClient, logger)

	// Wait for termination signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	slog.Info("Shutdown signal received, initiating graceful shutdown...")
	cancel() // Signal all goroutines to stop

	// Wait for all goroutines to finish
	wg.Wait()
	slog.Info("Application shut down gracefully.")
}

// --- Configuration ---

// AppConfig holds all configuration for the application.
type AppConfig struct {
	ServerPort           string
	DatabaseURL          string
	MessageBusURL        string
	AuthServiceURL       string
	OtelExporterEndpoint string
	ProviderAPIKeys      map[string]string
	JurisdictionFlags    map[string]bool
}

// LoadConfig loads configuration from environment variables.
func LoadConfig() (*AppConfig, error) {
	// In a real app, this would use a library like Viper and read from files/env.
	// For this example, we use os.Getenv for simplicity.
	cfg := &AppConfig{
		ServerPort:           config.GetEnv("SERVER_PORT", "8080"),
		DatabaseURL:          config.GetEnvOrError("DATABASE_URL"),
		MessageBusURL:        config.GetEnvOrError("MESSAGE_BUS_URL"),
		AuthServiceURL:       config.GetEnvOrError("AUTH_SERVICE_URL"),
		OtelExporterEndpoint: config.GetEnv("OTEL_EXPORTER_ENDPOINT", "localhost:4317"),
		ProviderAPIKeys: map[string]string{
			"azure":    config.GetEnv("AZURE_BILLING_API_KEY", ""),
			"bedrock":  config.GetEnv("AWS_SECRET_ACCESS_KEY", ""), // Assuming IAM role is not used
			"openai":   config.GetEnv("OPENAI_API_KEY", ""),
			"anthropic": config.GetEnv("ANTHROPIC_API_KEY", ""),
		},
		JurisdictionFlags: map[string]bool{
			"EU_DATA_RESIDENCY": config.GetEnvAsBool("JURISDICTION_EU_DATA_RESIDENCY", false),
		},
	}
	if cfg.DatabaseURL == "" || cfg.MessageBusURL == "" || cfg.AuthServiceURL == "" {
		return nil, fmt.Errorf("missing required environment variables: DATABASE_URL, MESSAGE_BUS_URL, AUTH_SERVICE_URL")
	}
	return cfg, nil
}

// --- Database Initialization ---

func initDB(dataSourceName string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dataSourceName)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err = db.PingContext(ctx); err != nil {
		return nil, err
	}

	// Run migrations (in a real app, use a migration tool like goose or migrate)
	slog.Info("Running database migrations...")
	_, err = db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS raw_usage_events (
			event_id UUID PRIMARY KEY,
			correlation_id UUID,
			tenant_id UUID NOT NULL,
			user_id VARCHAR(255),
			provider VARCHAR(50) NOT NULL,
			model_id VARCHAR(255) NOT NULL,
			input_tokens INT,
			output_tokens INT,
			other_metrics JSONB,
			preliminary_cost_usd_micros BIGINT,
			event_timestamp TIMESTAMPTZ NOT NULL,
			received_at TIMESTAMPTZ DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS reconciled_costs (
			id UUID PRIMARY KEY,
			tenant_id UUID NOT NULL,
			provider VARCHAR(50) NOT NULL,
			cost_usd_micros BIGINT NOT NULL,
			start_time TIMESTAMPTZ NOT NULL,
			end_time TIMESTAMPTZ NOT NULL,
			reconciled_at TIMESTAMPTZ DEFAULT NOW(),
			source_data_ref VARCHAR(512)
		);

		CREATE INDEX IF NOT EXISTS idx_raw_usage_events_tenant_timestamp ON raw_usage_events (tenant_id, event_timestamp);
		CREATE INDEX IF NOT EXISTS idx_reconciled_costs_tenant_time ON reconciled_costs (tenant_id, start_time, end_time);
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	return db, nil
}

// --- HTTP Server & API Endpoints ---

func runHTTPServer(ctx context.Context, wg *sync.WaitGroup, port string, costService *CostService, authClient *auth.Client, logger *slog.Logger) {
	defer wg.Done()

	router := mux.NewRouter()
	api := router.PathPrefix("/api/v1").Subrouter()

	// Middleware for authentication and logging
	api.Use(observability.LoggingMiddleware(logger))
	api.Use(auth.AuthenticationMiddleware(authClient))

	// Business logic endpoints
	api.HandleFunc("/costs/query", costService.HandleQueryCosts).Methods("POST")
	api.HandleFunc("/costs/summary", costService.HandleGetCostSummary).Methods("GET")

	// Introspection endpoints
	router.HandleFunc("/health", handleHealthCheck).Methods("GET")
	router.HandleFunc("/introspect", handleIntrospect).Methods("GET")
	router.HandleFunc("/assumptions", handleAssumptions).Methods("GET")
	router.HandleFunc("/failure-modes", handleFailureModes).Methods("GET")
	router.HandleFunc("/update-triggers", handleUpdateTriggers).Methods("GET")

	// Metrics endpoint
	router.Handle("/metrics", promhttp.Handler())

	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	go func() {
		slog.Info("HTTP server starting", "port", port)
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			slog.Error("HTTP server failed", "error", err)
		}
	}()

	<-ctx.Done()
	slog.Info("HTTP server shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("HTTP server graceful shutdown failed", "error", err)
	}
}

// --- Introspection Handlers ---

func handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func handleIntrospect(w http.ResponseWriter, r *http.Request) {
	respondWithJSON(w, http.StatusOK, agentMetadata)
}

func handleAssumptions(w http.ResponseWriter, r *http.Request) {
	assumptions := map[string]interface{}{
		"design_tension": "Real-time Granularity vs. Reconciled Accuracy. The system provides immediate cost estimates from usage events but relies on periodic reconciliation with provider billing for ultimate accuracy. This tension is managed by clearly flagging data as 'preliminary' or 'reconciled' and providing APIs to query both.",
		"assumptions": []string{
			"The `unchained.events.ai.usage.v1` event schema is stable and contains sufficient information (tokens, model ID) to make a reasonable preliminary cost estimate.",
			"AI providers offer APIs to programmatically access detailed billing and usage data.",
			"There is a tolerable latency (e.g., up to 24 hours) for billing data to become available in provider APIs.",
			"The cost of storing and processing every raw usage event is less than the value derived from granular, real-time cost analysis.",
			"Tenant/user identity information in usage events can be reliably mapped to billing accounts in provider systems.",
		},
	}
	respondWithJSON(w, http.StatusOK, assumptions)
}

func handleFailureModes(w http.ResponseWriter, r *http.Request) {
	failureModes := map[string]interface{}{
		"revenue_surface": "Per-seat license for the platform, usage-based fees (e.g., % of spend managed), enterprise tiers with advanced features like budget alerting, custom reporting, and anomaly detection.",
		"cost_drivers":    "Compute and storage for the database (scales with event volume), compute for API and background jobs, data egress costs from provider billing APIs, message bus subscription costs.",
		"failure_modes": []map[string]string{
			{"mode": "Message Bus Ingestion Lag", "impact": "Delayed cost visibility for users.", "mitigation": "Consumer group scaling, dead-letter queues, monitoring on consumer lag."},
			{"mode": "Provider API Failure/Throttling", "impact": "Reconciliation fails, leading to stale or inaccurate cost data.", "mitigation": "Exponential backoff, circuit breakers, caching provider data, alerting on high failure rates."},
			{"mode": "Inaccurate Preliminary Cost Estimation", "impact": "Users make decisions based on wrong data, leading to budget overruns.", "mitigation": "Regularly update internal pricing models, clearly label data as preliminary, highlight variance post-reconciliation."},
			{"mode": "Database Performance Degradation", "impact": "Slow API responses, delayed event processing.", "mitigation": "Proper indexing, connection pooling, read replicas, archiving old data."},
			{"mode": "Event Schema Poisoning", "impact": "Malformed events crash the consumer or corrupt data.", "mitigation": "Robust validation and sanitization at the consumer entry point, dead-letter queue for un-parseable messages."},
		},
	}
	respondWithJSON(w, http.StatusOK, failureModes)
}

func handleUpdateTriggers(w http.ResponseWriter, r *http.Request) {
	updateTriggers := map[string]interface{}{
		"triggers": []string{
			"A new AI provider is added to the ecosystem, requiring a new BillingProvider adapter.",
			"An existing provider changes their pricing model (e.g., from per-token to time-based).",
			"The shared `unchained.events.ai.usage.v1` event schema is updated with new metrics.",
			"New compliance requirements (e.g., GDPR, CCPA) necessitate changes in data handling and storage.",
			"Performance benchmarks indicate a need to change the data aggregation strategy (e.g., from hourly to daily rollups).",
		},
	}
	respondWithJSON(w, http.StatusOK, updateTriggers)
}

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

// --- Data Models ---

// UsageEvent corresponds to the `unchained.events.ai.usage.v1` schema.
type UsageEvent struct {
	EventID        uuid.UUID       `json:"eventId"`
	CorrelationID  uuid.UUID       `json:"correlationId"`
	TenantID       uuid.UUID       `json:"tenantId"`
	UserID         string          `json:"userId"`
	Provider       string          `json:"provider"`
	ModelID        string          `json:"modelId"`
	InputTokens    int             `json:"inputTokens"`
	OutputTokens   int             `json:"outputTokens"`
	OtherMetrics   json.RawMessage `json:"otherMetrics"`
	EventTimestamp time.Time       `json:"eventTimestamp"`
}

// CostRecord represents a piece of cost data, either preliminary or reconciled.
type CostRecord struct {
	ID             uuid.UUID
	TenantID       uuid.UUID
	Provider       string
	CostUSDMicros  int64
	StartTime      time.Time
	EndTime        time.Time
	IsReconciled   bool
	SourceDataRef  string
}

// --- Event Consumer ---

func runEventConsumer(ctx context.Context, wg *sync.WaitGroup, client *events.Client, costService *CostService, logger *slog.Logger) {
	defer wg.Done()

	msgChan, err := client.Subscribe(ctx, USAGE_EVENT_TOPIC)
	if err != nil {
		logger.Error("Failed to subscribe to usage events", "error", err)
		return
	}

	logger.Info("Event consumer started", "topic", USAGE_EVENT_TOPIC)

	for {
		select {
		case <-ctx.Done():
			logger.Info("Event consumer shutting down.")
			return
		case msg := <-msgChan:
			var event UsageEvent
			if err := json.Unmarshal(msg.Data, &event); err != nil {
				logger.Error("Failed to unmarshal usage event", "error", err, "message_id", msg.ID)
				msg.Nack() // Or send to a DLQ
				continue
			}

			// Process the event
			if err := costService.ProcessUsageEvent(ctx, &event); err != nil {
				logger.Error("Failed to process usage event", "error", err, "event_id", event.EventID)
				msg.Nack()
			} else {
				logger.Debug("Successfully processed usage event", "event_id", event.EventID)
				msg.Ack()
			}
		}
	}
}

// --- Reconciliation Service ---

func runReconciliationService(ctx context.Context, wg *sync.WaitGroup, costService *CostService, logger *slog.Logger) {
	defer wg.Done()
	ticker := time.NewTicker(RECONCILIATION_INTERVAL)
	defer ticker.Stop()

	logger.Info("Reconciliation service started", "interval", RECONCILIATION_INTERVAL)

	// Run once on startup
	if err := costService.ReconcileAllProviders(ctx); err != nil {
		logger.Error("Initial reconciliation failed", "error", err)
	}

	for {
		select {
		case <-ctx.Done():
			logger.Info("Reconciliation service shutting down.")
			return
		case <-ticker.C:
			logger.Info("Starting scheduled reconciliation cycle.")
			if err := costService.ReconcileAllProviders(ctx); err != nil {
				logger.Error("Scheduled reconciliation failed", "error", err)
			}
		}
	}
}

// --- Service Layer ---

// CostService encapsulates the core business logic.
type CostService struct {
	repo            CostRepository
	providerFactory *BillingProviderFactory
	pricingCache    *sync.Map // Caches model pricing for preliminary estimates
	logger          *slog.Logger
}

func NewCostService(repo CostRepository, factory *BillingProviderFactory, logger *slog.Logger) *CostService {
	return &CostService{
		repo:            repo,
		providerFactory: factory,
		pricingCache:    new(sync.Map),
		logger:          logger,
	}
}

// ProcessUsageEvent calculates a preliminary cost and stores the raw event.
func (s *CostService) ProcessUsageEvent(ctx context.Context, event *UsageEvent) error {
	preliminaryCost, err := s.calculatePreliminaryCost(ctx, event)
	if err != nil {
		s.logger.Warn("Could not calculate preliminary cost", "event_id", event.EventID, "error", err)
		// We still store the event, just without a cost estimate.
	}

	return s.repo.StoreRawUsageEvent(ctx, event, preliminaryCost)
}

// calculatePreliminaryCost estimates cost based on cached pricing data.
// This is where the tension between speed and accuracy is most evident.
// The estimate is fast but may not reflect complex provider billing rules.
func (s *CostService) calculatePreliminaryCost(ctx context.Context, event *UsageEvent) (int64, error) {
	// In a real system, this would be a sophisticated pricing engine.
	// For now, we use a simple placeholder logic.
	// Example: OpenAI GPT-4 Turbo: $10/1M input, $30/1M output tokens
	var costPerMillionInput, costPerMillionOutput int64
	switch event.ModelID {
	case "gpt-4-turbo":
		costPerMillionInput = 10_000_000  // $10 in micros
		costPerMillionOutput = 30_000_000 // $30 in micros
	case "claude-3-opus":
		costPerMillionInput = 15_000_000
		costPerMillionOutput = 75_000_000
	default:
		return 0, fmt.Errorf("unknown model for pricing: %s", event.ModelID)
	}

	inputCost := (int64(event.InputTokens) * costPerMillionInput) / 1_000_000
	outputCost := (int64(event.OutputTokens) * costPerMillionOutput) / 1_000_000

	return inputCost + outputCost, nil
}

// ReconcileAllProviders fetches authoritative cost data from all configured providers.
func (s *CostService) ReconcileAllProviders(ctx context.Context) error {
	providers := s.providerFactory.GetAllProviderNames()
	var wg sync.WaitGroup
	errChan := make(chan error, len(providers))

	for _, providerName := range providers {
		wg.Add(1)
		go func(pName string) {
			defer wg.Done()
			s.logger.Info("Reconciling provider", "provider", pName)
			provider, err := s.providerFactory.GetProvider(pName)
			if err != nil {
				errChan <- fmt.Errorf("failed to get provider %s: %w", pName, err)
				return
			}

			// Fetch data for the last 24 hours, for example.
			endTime := time.Now().UTC()
			startTime := endTime.Add(-24 * time.Hour)

			reconciledCosts, err := provider.GetUsageCosts(ctx, startTime, endTime)
			if err != nil {
				errChan <- fmt.Errorf("failed to get usage costs for %s: %w", pName, err)
				return
			}

			if err := s.repo.StoreReconciledCosts(ctx, reconciledCosts); err != nil {
				errChan <- fmt.Errorf("failed to store reconciled costs for %s: %w", pName, err)
				return
			}
			s.logger.Info("Successfully reconciled provider", "provider", pName, "records", len(reconciledCosts))
		}(providerName)
	}

	wg.Wait()
	close(errChan)

	// Check for errors
	var reconciliationErr error
	for err := range errChan {
		s.logger.Error("Reconciliation error", "error", err)
		if reconciliationErr == nil {
			reconciliationErr = err // Store the first error
		}
	}

	return reconciliationErr
}

// --- API Handler Logic ---

type CostQueryRequest struct {
	TenantID  uuid.UUID `json:"tenantId"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
	GroupBy   []string  `json:"groupBy"` // e.g., ["provider", "model"]
	IncludePreliminary bool `json:"includePreliminary"`
}

func (s *CostService) HandleQueryCosts(w http.ResponseWriter, r *http.Request) {
	var req CostQueryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic validation
	if req.TenantID == uuid.Nil || req.StartTime.IsZero() || req.EndTime.IsZero() {
		http.Error(w, "Missing required fields: tenantId, startTime, endTime", http.StatusBadRequest)
		return
	}

	// Authorization check (example)
	claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok || (claims.TenantID != req.TenantID.String() && !claims.IsAdmin) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	results, err := s.repo.QueryAggregatedCosts(r.Context(), req)
	if err != nil {
		s.logger.Error("Failed to query costs", "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	respondWithJSON(w, http.StatusOK, results)
}

func (s *CostService) HandleGetCostSummary(w http.ResponseWriter, r *http.Request) {
	// Implementation for a summary endpoint would go here.
	// It would likely query for total cost over a period, top spenders, etc.
	respondWithJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

// --- Repository Layer (Data Access) ---

type CostRepository interface {
	StoreRawUsageEvent(ctx context.Context, event *UsageEvent, preliminaryCost int64) error
	StoreReconciledCosts(ctx context.Context, costs []CostRecord) error
	QueryAggregatedCosts(ctx context.Context, params CostQueryRequest) (interface{}, error)
}

type postgresCostRepository struct {
	db *sql.DB
}

func NewCostRepository(db *sql.DB) CostRepository {
	return &postgresCostRepository{db: db}
}

func (r *postgresCostRepository) StoreRawUsageEvent(ctx context.Context, event *UsageEvent, preliminaryCost int64) error {
	query := `
		INSERT INTO raw_usage_events (event_id, correlation_id, tenant_id, user_id, provider, model_id, input_tokens, output_tokens, other_metrics, preliminary_cost_usd_micros, event_timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := r.db.ExecContext(ctx, query,
		event.EventID, event.CorrelationID, event.TenantID, event.UserID, event.Provider, event.ModelID,
		event.InputTokens, event.OutputTokens, event.OtherMetrics, preliminaryCost, event.EventTimestamp,
	)
	return err
}

func (r *postgresCostRepository) StoreReconciledCosts(ctx context.Context, costs []CostRecord) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback() // Rollback is a no-op if Commit succeeds

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO reconciled_costs (id, tenant_id, provider, cost_usd_micros, start_time, end_time, source_data_ref)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT DO NOTHING -- Or update, depending on desired semantics
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, cost := range costs {
		_, err := stmt.ExecContext(ctx, uuid.New(), cost.TenantID, cost.Provider, cost.CostUSDMicros, cost.StartTime, cost.EndTime, cost.SourceDataRef)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *postgresCostRepository) QueryAggregatedCosts(ctx context.Context, params CostQueryRequest) (interface{}, error) {
	// This is a simplified example. A real implementation would be more complex,
	// dynamically building the GROUP BY clause and handling the combination of
	// preliminary and reconciled data.
	
	// This query demonstrates the core tension: it sums preliminary costs for recent data
	// and uses reconciled costs for older data, providing a unified but complex view.
	query := `
		WITH preliminary AS (
			SELECT
				provider,
				model_id,
				SUM(preliminary_cost_usd_micros) as cost
			FROM raw_usage_events
			WHERE tenant_id = $1 AND event_timestamp >= $2 AND event_timestamp < $3
			  AND event_timestamp > (SELECT COALESCE(MAX(end_time), '1970-01-01') FROM reconciled_costs WHERE tenant_id = $1)
			GROUP BY provider, model_id
		),
		reconciled AS (
			SELECT
				provider,
				'reconciled' as model_id, -- Model-level detail might be lost in reconciliation
				SUM(cost_usd_micros) as cost
			FROM reconciled_costs
			WHERE tenant_id = $1 AND start_time >= $2 AND end_time < $3
			GROUP BY provider
		)
		SELECT * FROM preliminary
		UNION ALL
		SELECT * FROM reconciled;
	`
	rows, err := r.db.QueryContext(ctx, query, params.TenantID, params.StartTime, params.EndTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := []map[string]interface{}{}
	for rows.Next() {
		var provider, modelId string
		var cost int64
		if err := rows.Scan(&provider, &modelId, &cost); err != nil {
			return nil, err
		}
		results = append(results, map[string]interface{}{
			"provider": provider,
			"modelId":  modelId,
			"costUSDMicros": cost,
		})
	}

	return results, nil
}

// --- Billing Provider Adapters ---

// BillingProvider defines the interface for fetching cost data from an AI provider.
type BillingProvider interface {
	GetUsageCosts(ctx context.Context, start, end time.Time) ([]CostRecord, error)
}

// BillingProviderFactory creates instances of BillingProvider.
type BillingProviderFactory struct {
	config *AppConfig
}

func NewBillingProviderFactory(config *AppConfig) *BillingProviderFactory {
	return &BillingProviderFactory{config: config}
}

func (f *BillingProviderFactory) GetProvider(name string) (BillingProvider, error) {
	switch name {
	case "azure":
		return NewAzureBillingProvider(f.config.ProviderAPIKeys["azure"]), nil
	case "bedrock":
		return NewBedrockBillingProvider(f.config.ProviderAPIKeys["bedrock"]), nil
	// Add other providers here
	default:
		return nil, fmt.Errorf("unknown billing provider: %s", name)
	}
}

func (f *BillingProviderFactory) GetAllProviderNames() []string {
	// In a real app, this would be dynamically configured.
	return []string{"azure", "bedrock"}
}

// --- Mock Provider Implementations ---
// In a real application, these would make actual API calls.

type AzureBillingProvider struct {
	apiKey string
}

func NewAzureBillingProvider(apiKey string) *AzureBillingProvider {
	return &AzureBillingProvider{apiKey: apiKey}
}

func (p *AzureBillingProvider) GetUsageCosts(ctx context.Context, start, end time.Time) ([]CostRecord, error) {
	slog.Info("Fetching costs from Azure Cost Management API...", "start", start, "end", end)
	// Mock implementation: return some dummy data
	// A real implementation would use the Azure SDK for Go.
	time.Sleep(2 * time.Second) // Simulate API latency
	return []CostRecord{
		{
			TenantID:      uuid.MustParse("a1a2a3a4-b1b2-c1c2-d1d2-d3d4d5d6d7d8"),
			Provider:      "azure",
			CostUSDMicros: 12345678,
			StartTime:     start,
			EndTime:       end,
			IsReconciled:  true,
			SourceDataRef: fmt.Sprintf("azure-export-%s", start.Format("2006-01-02")),
		},
	}, nil
}

type BedrockBillingProvider struct {
	secretKey string
}

func NewBedrockBillingProvider(secretKey string) *BedrockBillingProvider {
	return &BedrockBillingProvider{secretKey: secretKey}
}

func (p *BedrockBillingProvider) GetUsageCosts(ctx context.Context, start, end time.Time) ([]CostRecord, error) {
	slog.Info("Fetching costs from AWS Cost Explorer API...", "start", start, "end", end)
	// Mock implementation: return some dummy data
	// A real implementation would use the AWS SDK for Go (v2).
	time.Sleep(3 * time.Second) // Simulate API latency
	return []CostRecord{
		{
			TenantID:      uuid.MustParse("a1a2a3a4-b1b2-c1c2-d1d2-d3d4d5d6d7d8"),
			Provider:      "bedrock",
			CostUSDMicros: 87654321,
			StartTime:     start,
			EndTime:       end,
			IsReconciled:  true,
			SourceDataRef: fmt.Sprintf("aws-cur-%s", start.Format("20060102")),
		},
	}, nil
}