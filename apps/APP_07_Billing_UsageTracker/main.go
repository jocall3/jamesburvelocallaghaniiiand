// Copyright 2024 Interconnected Systems, Inc.
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
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"core_sdk/bus"
	"core_sdk/config"
	"core_sdk/events"
	"core_sdk/logger"
	"core_sdk/metrics"
	"core_sdk/storage/timeseries"

	"github.com/google/uuid"
	"github.comcom/gorilla/mux"
)

const (
	appName               = "APP_07_Billing_UsageTracker"
	defaultPort           = "8080"
	defaultShutdownPeriod = 15 * time.Second
)

// agent_metadata is a machine-readable block for self-querying and ecosystem awareness.
const agentMetadata = `
agent_metadata:
  purpose: "Consumes real-time usage events from the AI application ecosystem, aggregates them into billable metrics, and stores them in a time-series database for accounting, analytics, and invoicing."
  dependencies:
    - "core_sdk.bus.Client": "For consuming usage events from the shared message bus."
    - "core_sdk.storage.timeseries.Writer": "For persisting aggregated usage data."
    - "core_sdk.config.Manager": "For loading application configuration."
    - "core_sdk.logger.Logger": "For structured logging."
  invalidation_conditions:
    - "Message bus becomes unavailable for an extended period, leading to event loss beyond the replay buffer."
    - "Time-series database is down, causing aggregation buffer to overflow."
    - "A breaking change in the events.UsageEvent schema is deployed without a corresponding update to this service."
  adjacent_apps:
    - "APP_01_Inference_CostRouter": "Primary producer of fine-grained inference usage events."
    - "APP_14_Agents_MultiModelOrchestrator": "Producer of complex, multi-step agent usage events."
    - "APP_08_Billing_InvoiceGenerator": "Primary consumer of the aggregated data produced by this app."
    - "APP_25_Observability_MetricsDashboard": "Consumer of data for real-time usage dashboards."
`

// AppConfig defines the application's configuration structure.
type AppConfig struct {
	Port                string        `env:"PORT"`
	LogLevel            string        `env:"LOG_LEVEL"`
	Bus                 bus.Config    `env:",prefix=BUS_"`
	TimeSeriesDB        timeseries.Config `env:",prefix=TSDB_"`
	AggregationWindow   time.Duration `env:"AGGREGATION_WINDOW"`
	MaxBatchSize        int           `env:"MAX_BATCH_SIZE"`
	ConsumerConcurrency int           `env:"CONSUMER_CONCURRENCY"`
	ShutdownTimeout     time.Duration `env:"SHUTDOWN_TIMEOUT"`
}

// UsageRecord represents a single, aggregated data point to be written to the time-series database.
type UsageRecord struct {
	Timestamp time.Time
	Metric    string
	Value     float64
	Tags      map[string]string
}

// UsageProcessor is responsible for aggregating raw events into time-series data points.
// It embodies the tension between real-time accuracy and cost efficiency.
// A small AggregationWindow provides near real-time data at the cost of more frequent DB writes.
// A larger window is more cost-efficient but introduces latency in usage visibility.
type UsageProcessor struct {
	log             logger.Logger
	storage         timeseries.Writer
	eventChan       <-chan events.UsageEvent
	ticker          *time.Ticker
	shutdown        chan struct{}
	wg              sync.WaitGroup
	maxBatchSize    int
	aggregationLock sync.Mutex
	aggregates      map[string]*UsageRecord
	metrics         metrics.Metrics
}

// NewUsageProcessor creates and initializes a new UsageProcessor.
func NewUsageProcessor(log logger.Logger, storage timeseries.Writer, eventChan <-chan events.UsageEvent, window time.Duration, batchSize int) *UsageProcessor {
	return &UsageProcessor{
		log:          log,
		storage:      storage,
		eventChan:    eventChan,
		ticker:       time.NewTicker(window),
		shutdown:     make(chan struct{}),
		maxBatchSize: batchSize,
		aggregates:   make(map[string]*UsageRecord),
		metrics:      metrics.NewPrometheusMetrics(appName),
	}
}

// Start begins the processing loop.
func (p *UsageProcessor) Start() {
	p.log.Infof("Usage processor started. Aggregation window: %s, Max batch size: %d", p.ticker.C, p.maxBatchSize)
	p.wg.Add(1)
	go p.processLoop()
}

// Stop gracefully shuts down the processor, flushing any pending aggregates.
func (p *UsageProcessor) Stop(ctx context.Context) error {
	p.log.Info("Shutting down usage processor...")
	close(p.shutdown)
	p.ticker.Stop()
	p.wg.Wait()

	p.log.Info("Flushing final aggregates before shutdown...")
	if err := p.flush(ctx); err != nil {
		p.log.Errorf("Error during final flush: %v", err)
		return err
	}
	p.log.Info("Usage processor shut down successfully.")
	return nil
}

// processLoop is the main event handling and aggregation loop.
func (p *UsageProcessor) processLoop() {
	defer p.wg.Done()
	for {
		select {
		case event, ok := <-p.eventChan:
			if !ok {
				p.log.Info("Event channel closed, processor stopping.")
				return
			}
			p.aggregate(event)
			p.metrics.Inc("events_processed_total", map[string]string{"provider": event.Provider, "unit": event.Unit})

			// Check if batch size is reached for an early flush
			p.aggregationLock.Lock()
			if len(p.aggregates) >= p.maxBatchSize {
				p.aggregationLock.Unlock()
				p.log.Debugf("Max batch size (%d) reached, flushing aggregates.", p.maxBatchSize)
				if err := p.flush(context.Background()); err != nil {
					p.log.Errorf("Error flushing aggregates on batch size trigger: %v", err)
					p.metrics.Inc("flush_errors_total", nil)
				}
			} else {
				p.aggregationLock.Unlock()
			}

		case <-p.ticker.C:
			p.log.Debug("Aggregation window elapsed, flushing aggregates.")
			if err := p.flush(context.Background()); err != nil {
				p.log.Errorf("Error flushing aggregates on window trigger: %v", err)
				p.metrics.Inc("flush_errors_total", nil)
			}

		case <-p.shutdown:
			p.log.Info("Processor received shutdown signal.")
			return
		}
	}
}

// aggregate processes a single UsageEvent and adds it to the in-memory aggregates.
func (p *UsageProcessor) aggregate(event events.UsageEvent) {
	p.aggregationLock.Lock()
	defer p.aggregationLock.Unlock()

	// Common tags for all metrics derived from this event
	baseTags := map[string]string{
		"tenant_id": event.TenantID,
		"provider":  event.Provider,
		"model_id":  event.ModelID,
	}
	for k, v := range event.Tags {
		baseTags[k] = v
	}

	// Handle different units of usage
	switch event.Unit {
	case "tokens":
		p.updateAggregate("ai.usage.tokens", event.Header.Timestamp, float64(event.InputTokens), withTag(baseTags, "direction", "input"))
		p.updateAggregate("ai.usage.tokens", event.Header.Timestamp, float64(event.OutputTokens), withTag(baseTags, "direction", "output"))
		p.updateAggregate("ai.usage.tokens", event.Header.Timestamp, float64(event.InputTokens+event.OutputTokens), withTag(baseTags, "direction", "total"))
	case "seconds":
		p.updateAggregate("ai.usage.seconds", event.Header.Timestamp, float64(event.DurationMs)/1000.0, baseTags)
	case "images":
		p.updateAggregate("ai.usage.images", event.Header.Timestamp, float64(event.Quantity), baseTags)
	case "characters":
		p.updateAggregate("ai.usage.characters", event.Header.Timestamp, float64(event.Quantity), baseTags)
	default:
		p.log.Warnf("Unknown usage unit '%s' in event %s", event.Unit, event.Header.EventID)
		p.metrics.Inc("unknown_units_total", map[string]string{"unit": event.Unit})
	}
}

// updateAggregate finds or creates an aggregate record and adds the new value.
func (p *UsageProcessor) updateAggregate(metric string, ts time.Time, value float64, tags map[string]string) {
	key := generateAggregateKey(metric, tags)
	if agg, exists := p.aggregates[key]; exists {
		agg.Value += value
	} else {
		p.aggregates[key] = &UsageRecord{
			Timestamp: ts, // Use timestamp of the first event in the window
			Metric:    metric,
			Value:     value,
			Tags:      tags,
		}
	}
}

// flush writes the current batch of aggregates to the time-series database.
func (p *UsageProcessor) flush(ctx context.Context) error {
	p.aggregationLock.Lock()
	if len(p.aggregates) == 0 {
		p.aggregationLock.Unlock()
		return nil
	}

	batch := make([]timeseries.DataPoint, 0, len(p.aggregates))
	for _, agg := range p.aggregates {
		batch = append(batch, timeseries.DataPoint{
			Metric:    agg.Metric,
			Timestamp: agg.Timestamp,
			Value:     agg.Value,
			Tags:      agg.Tags,
		})
	}
	// Reset aggregates immediately after copying to release the lock sooner
	p.aggregates = make(map[string]*UsageRecord)
	p.aggregationLock.Unlock()

	p.log.Infof("Flushing %d aggregated records to storage.", len(batch))
	startTime := time.Now()
	err := p.storage.Write(ctx, batch)
	duration := time.Since(startTime)

	if err != nil {
		p.metrics.Inc("storage_write_errors_total", nil)
		p.metrics.Observe("storage_write_duration_seconds", duration.Seconds(), map[string]string{"success": "false"})
		// TODO: Implement a dead-letter queue or retry mechanism for failed batches.
		// For now, we log the error and drop the batch.
		p.log.Errorf("Failed to write batch to time-series storage after %s: %v. Batch dropped.", duration, err)
		return err
	}

	p.metrics.Inc("storage_writes_total", nil)
	p.metrics.Observe("storage_write_duration_seconds", duration.Seconds(), map[string]string{"success": "true"})
	p.metrics.Add("records_written_total", float64(len(batch)), nil)
	p.log.Infof("Successfully flushed %d records in %s.", len(batch), duration)
	return nil
}

// withTag is a helper to create a new map with an added tag.
func withTag(base map[string]string, key, value string) map[string]string {
	newTags := make(map[string]string, len(base)+1)
	for k, v := range base {
		newTags[k] = v
	}
	newTags[key] = value
	return newTags
}

// generateAggregateKey creates a unique string key for an aggregate based on its metric and tags.
func generateAggregateKey(metric string, tags map[string]string) string {
	// A more performant implementation might use a sorted key-value string or a hash.
	// For clarity, JSON marshaling is used here.
	tagBytes, _ := json.Marshal(tags)
	return fmt.Sprintf("%s-%s", metric, string(tagBytes))
}

// EventConsumer listens to the message bus and forwards events to the processor.
type EventConsumer struct {
	log       logger.Logger
	client    bus.Client
	eventChan chan<- events.UsageEvent
	topic     string
	group     string
}

func NewEventConsumer(log logger.Logger, client bus.Client, eventChan chan<- events.UsageEvent) *EventConsumer {
	return &EventConsumer{
		log:       log,
		client:    client,
		eventChan: eventChan,
		topic:     events.TopicUsage,
		group:     appName, // Consumer group name
	}
}

// Start begins consuming messages from the bus.
func (c *EventConsumer) Start(ctx context.Context, concurrency int) error {
	c.log.Infof("Starting event consumer for topic '%s' with concurrency %d", c.topic, concurrency)
	handler := func(ctx context.Context, msg bus.Message) error {
		var event events.UsageEvent
		if err := json.Unmarshal(msg.Data(), &event); err != nil {
			c.log.Errorf("Failed to unmarshal usage event: %v. Message will be acknowledged and dropped.", err)
			// Acknowledge to prevent reprocessing of malformed messages.
			// Consider sending to a dead-letter queue.
			return nil
		}

		// Basic validation
		if event.TenantID == "" || event.Provider == "" || event.ModelID == "" {
			c.log.Warnf("Received invalid usage event with missing required fields: %s", event.Header.EventID)
			return nil
		}

		c.eventChan <- event
		return nil
	}

	return c.client.Subscribe(ctx, c.topic, c.group, handler, concurrency)
}

// APIServer provides health checks and introspection endpoints.
type APIServer struct {
	log    logger.Logger
	port   string
	server *http.Server
}

func NewAPIServer(log logger.Logger, port string) *APIServer {
	if port == "" {
		port = defaultPort
	}
	return &APIServer{
		log:  log,
		port: port,
	}
}

func (s *APIServer) Start() {
	router := mux.NewRouter()
	router.HandleFunc("/health", s.healthHandler).Methods("GET")
	router.HandleFunc("/introspect", s.introspectHandler).Methods("GET")
	router.HandleFunc("/assumptions", s.assumptionsHandler).Methods("GET")
	router.HandleFunc("/failure-modes", s.failureModesHandler).Methods("GET")
	router.HandleFunc("/update-triggers", s.updateTriggersHandler).Methods("GET")
	// Expose Prometheus metrics
	router.Handle("/metrics", metrics.GetHandler())

	s.server = &http.Server{
		Addr:    ":" + s.port,
		Handler: router,
		ReadTimeout: 5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout: 15 * time.Second,
	}

	s.log.Infof("API server starting on port %s", s.port)
	go func() {
		if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.log.Fatalf("API server failed: %v", err)
		}
	}()
}

func (s *APIServer) Stop(ctx context.Context) error {
	s.log.Infof("API server shutting down...")
	return s.server.Shutdown(ctx)
}

func (s *APIServer) healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (s *APIServer) introspectHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"appName":       appName,
		"purpose":       "Aggregates AI usage events for billing and analytics.",
		"version":       "1.0.0", // This should be dynamic in a real build
		"agentMetadata": agentMetadata,
	}
	s.respondWithJSON(w, http.StatusOK, response)
}

func (s *APIServer) assumptionsHandler(w http.ResponseWriter, r *http.Request) {
	assumptions := []string{
		"Event delivery from the message bus is at-least-once. Deduplication is not handled by this service.",
		"The `events.UsageEvent` schema is stable and backwards-compatible.",
		"Timestamps in events are reasonably accurate (low clock skew).",
		"The time-series database is highly available and can handle the write load.",
		"The service has exclusive write access to its consumer group offsets in the message bus.",
		"Configuration, including credentials, is securely managed and injected into the environment.",
	}
	s.respondWithJSON(w, http.StatusOK, map[string][]string{"assumptions": assumptions})
}

func (s *APIServer) failureModesHandler(w http.ResponseWriter, r *http.Request) {
	modes := []map[string]string{
		{
			"mode":          "Message Bus Unavailability",
			"detection":     "Failed connection attempts, health checks, metrics (e.g., `bus_connection_errors_total`).",
			"mitigation":    "SDK-level automatic reconnection with exponential backoff. Service remains operational but processes no new data.",
			"impact":        "Delay in usage data processing. Potential data loss if bus is down longer than its retention period.",
		},
		{
			"mode":          "Time-Series DB Unavailability",
			"detection":     "Failed write operations, health checks, metrics (e.g., `storage_write_errors_total`).",
			"mitigation":    "In-memory buffer will hold aggregates. If DB is down for an extended period, buffer may overflow leading to OOM kill. A persistent queue (e.g., on-disk) would be a future improvement.",
			"impact":        "Stale billing and analytics data. Potential data loss if the service restarts before the DB recovers.",
		},
		{
			"mode":          "Poison Pill Message",
			"detection":     "Spike in unmarshalling errors in logs and metrics.",
			"mitigation":    "Malformed messages are logged, acknowledged, and dropped to prevent blocking the consumer. A dead-letter queue is the recommended enhancement.",
			"impact":        "Loss of data for the specific malformed event.",
		},
		{
			"mode":          "Backpressure from Slow DB",
			"detection":     "Increasing `storage_write_duration_seconds` metric, growing size of in-memory aggregate buffer.",
			"mitigation":    "The event channel acts as a buffer. If it fills, message bus consumption will slow down naturally (flow control).",
			"impact":        "Increased end-to-end latency for usage data visibility.",
		},
	}
	s.respondWithJSON(w, http.StatusOK, map[string][]map[string]string{"failure_modes": modes})
}

func (s *APIServer) updateTriggersHandler(w http.ResponseWriter, r *http.Request) {
	triggers := []string{
		"Deployment of a new version of this application.",
		"Change in configuration (e.g., aggregation window, batch size, DB credentials) requiring a restart.",
		"Update to the `core_sdk`, especially the `events` or `bus` packages.",
		"Introduction of a new billable unit type (e.g., 'api_calls') in the ecosystem, requiring a logic update.",
		"Scaling event (up or down) of consumer instances.",
	}
	s.respondWithJSON(w, http.StatusOK, map[string][]string{"update_triggers": triggers})
}

func (s *APIServer) respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		s.log.Errorf("Failed to write JSON response: %v", err)
	}
}

func main() {
	// 1. Initialize Core Services
	log := logger.NewStdLogger(logger.Info) // Default level, will be updated by config
	cfgManager := config.NewManager(log)

	var appConfig AppConfig
	if err := cfgManager.Load(&appConfig); err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Update log level from config
	logLevel, err := logger.ParseLevel(appConfig.LogLevel)
	if err != nil {
		log.Warnf("Invalid log level '%s', using default.", appConfig.LogLevel)
		logLevel = logger.Info
	}
	log.SetLevel(logLevel)

	log.Infof("Starting %s...", appName)

	// Set default config values if not provided
	if appConfig.AggregationWindow == 0 {
		appConfig.AggregationWindow = 10 * time.Second
	}
	if appConfig.MaxBatchSize == 0 {
		appConfig.MaxBatchSize = 1000
	}
	if appConfig.ConsumerConcurrency == 0 {
		appConfig.ConsumerConcurrency = 4
	}
	if appConfig.ShutdownTimeout == 0 {
		appConfig.ShutdownTimeout = defaultShutdownPeriod
	}

	// 2. Setup Dependencies
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Setup message bus client
	busClient, err := bus.NewClient(ctx, appConfig.Bus, log)
	if err != nil {
		log.Fatalf("Failed to create bus client: %v", err)
	}
	defer busClient.Close()

	// Setup time-series storage writer
	tsdbWriter, err := timeseries.NewWriter(ctx, appConfig.TimeSeriesDB, log)
	if err != nil {
		log.Fatalf("Failed to create time-series writer: %v", err)
	}
	defer tsdbWriter.Close()

	// 3. Initialize Application Components
	eventChan := make(chan events.UsageEvent, appConfig.MaxBatchSize*2) // Buffered channel

	processor := NewUsageProcessor(log, tsdbWriter, eventChan, appConfig.AggregationWindow, appConfig.MaxBatchSize)
	consumer := NewEventConsumer(log, busClient, eventChan)
	apiServer := NewAPIServer(log, appConfig.Port)

	// 4. Start Application Components
	processor.Start()
	apiServer.Start()

	if err := consumer.Start(ctx, appConfig.ConsumerConcurrency); err != nil {
		log.Fatalf("Failed to start event consumer: %v", err)
	}

	// 5. Graceful Shutdown Handling
	shutdownChan := make(chan os.Signal, 1)
	signal.Notify(shutdownChan, syscall.SIGINT, syscall.SIGTERM)
	sig := <-shutdownChan
	log.Infof("Received shutdown signal: %v. Starting graceful shutdown.", sig)

	// Create a context with a timeout for shutdown
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), appConfig.ShutdownTimeout)
	defer shutdownCancel()

	// Stop components in reverse order of startup
	var shutdownWg sync.WaitGroup
	
	shutdownWg.Add(1)
	go func() {
		defer shutdownWg.Done()
		if err := apiServer.Stop(shutdownCtx); err != nil {
			log.Errorf("API server shutdown error: %v", err)
		}
	}()

	// The consumer is stopped by canceling its context, which was done at the start of shutdown
	cancel()

	shutdownWg.Add(1)
	go func() {
		defer shutdownWg.Done()
		// Close the event channel to signal the processor to stop processing new events
		close(eventChan)
		if err := processor.Stop(shutdownCtx); err != nil {
			log.Errorf("Usage processor shutdown error: %v", err)
		}
	}()

	// Wait for all components to shut down
	shutdownWg.Wait()

	log.Info("Application shut down gracefully.")
}