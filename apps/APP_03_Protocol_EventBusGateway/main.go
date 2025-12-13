// Copyright (c) 2024 AIEcosystems Inc. All rights reserved.
//
// This software is licensed under the terms of the MIT License.
// For details, see the LICENSE file in the root of this repository.

// APP_03_Protocol_EventBusGateway
//
// This application serves as the central, hardened gateway for the entire AIEcosystem event bus.
// It is responsible for three critical functions:
// 1. Authentication & Authorization: Verifying the identity of the publisher and ensuring it has
//    the necessary permissions to publish to a specific event topic.
// 2. Schema Validation: Enforcing that every message published to a topic conforms to the
//    registered schema for that topic, ensuring data consistency and contract integrity across
//    the ecosystem.
// 3. Protocol Forwarding: Securely and reliably forwarding validated messages to the underlying
//    message bus infrastructure (e.g., Kafka, NATS, Pulsar).
//
// This gateway embodies the design tension between Throughput and Rigor.
// - Rigor: Every message undergoes synchronous, strict validation and authorization. This guarantees
//   data quality and security at the cost of latency. This is the default mode.
// - Throughput: High-performance modes can be enabled via configuration for trusted services,
//   allowing for features like validation sampling, asynchronous validation, or batch processing,
//   trading some immediate guarantees for higher message ingestion rates.

package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
	"go.opentelemetry.io/otel/trace"

	// Core SDK imports - these would be actual internal modules in a real project.
	"aiecosystem/core-sdk/go/pkg/auth"
	"aiecosystem/core-sdk/go/pkg/config"
	"aiecosystem/core-sdk/go/pkg/events"
	"aiecosystem/core-sdk/go/pkg/observability"
	"aiecosystem/core-sdk/go/pkg/schema"
)

const (
	appName             = "APP_03_Protocol_EventBusGateway"
	defaultPort         = "8080"
	defaultReadTimeout  = 5 * time.Second
	defaultWriteTimeout = 10 * time.Second
	defaultIdleTimeout  = 120 * time.Second
	shutdownTimeout     = 15 * time.Second
)

var (
	// Prometheus metrics to monitor gateway performance and behavior.
	// These metrics are crucial for understanding the unit economics (cost per message).
	messagesReceived = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventbus_gateway_messages_received_total",
			Help: "Total number of messages received by the gateway.",
		},
		[]string{"topic"},
	)
	messagesValidated = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventbus_gateway_messages_validated_total",
			Help: "Total number of messages that passed schema validation.",
		},
		[]string{"topic", "status"}, // status: "success", "failure"
	)
	messagesAuthorized = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventbus_gateway_messages_authorized_total",
			Help: "Total number of messages that passed authorization.",
		},
		[]string{"topic", "status"}, // status: "success", "failure"
	)
	messagesPublished = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventbus_gateway_messages_published_total",
			Help: "Total number of messages successfully published to the underlying message bus.",
		},
		[]string{"topic"},
	)
	messageProcessingLatency = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "eventbus_gateway_message_processing_latency_seconds",
			Help:    "Latency of message processing from receipt to publish.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"topic"},
	)
)

func init() {
	prometheus.MustRegister(messagesReceived)
	prometheus.MustRegister(messagesValidated)
	prometheus.MustRegister(messagesAuthorized)
	prometheus.MustRegister(messagesPublished)
	prometheus.MustRegister(messageProcessingLatency)
}

// agentMetadata provides machine-readable information about the application.
// This is crucial for the self-querying and self-orchestrating capabilities of the ecosystem.
const agentMetadata = `
agent_metadata:
  purpose: "Acts as a secure, schema-validating gateway for all events flowing through the ecosystem's central message bus. It enforces authorization and data contracts."
  dependencies:
    - "APP_XX_Identity_AuthService: For authenticating and authorizing publishers."
    - "APP_XX_Governance_SchemaRegistry: For fetching and validating event schemas."
    - "Underlying Message Bus (e.g., Kafka, NATS, Pulsar): For event persistence and transport."
    - "Core SDK: For shared auth, config, and event protocol definitions."
  invalidation_conditions:
    - "Loss of connectivity to the AuthService or SchemaRegistry."
    - "Underlying message bus becomes unavailable or reports persistent errors."
    - "Configuration drift where security policies are no longer in sync with the AuthService."
  adjacent_apps:
    - "All applications that produce or consume events within the ecosystem."
    - "APP_37_Governance_AuditTrailEngine: Consumes logs and events from this gateway to build audit trails."
    - "APP_10_Billing_UsageTracker: Consumes events from this gateway to meter usage for billing."
`

// Config holds all configuration for the application.
// It is loaded from environment variables or a configuration file, separating config from execution.
type Config struct {
	Port                 string        `env:"PORT"`
	ReadTimeout          time.Duration `env:"HTTP_READ_TIMEOUT"`
	WriteTimeout         time.Duration `env:"HTTP_WRITE_TIMEOUT"`
	IdleTimeout          time.Duration `env:"HTTP_IDLE_TIMEOUT"`
	AuthServiceEndpoint  string        `env:"AUTH_SERVICE_ENDPOINT,required"`
	SchemaRegistryEndpoint string      `env:"SCHEMA_REGISTRY_ENDPOINT,required"`
	MessageBusType       string        `env:"MESSAGE_BUS_TYPE,required"` // e.g., "kafka", "nats", "pulsar"
	MessageBusBrokers    string        `env:"MESSAGE_BUS_BROKERS,required"`
	LogLevel             string        `env:"LOG_LEVEL"`
	EnableJurisdictionDE bool          `env:"ENABLE_JURISDICTION_DE"` // Example of a jurisdictional feature flag
	// Throughput vs. Rigor configuration
	ValidationMode      string `env:"VALIDATION_MODE"` // "strict" (default) or "sampled"
	ValidationSampleRate float64 `env:"VALIDATION_SAMPLE_RATE"` // e.g., 0.1 for 10%
	TrustedPublisherIDs []string `env:"TRUSTED_PUBLISHER_IDS"` // Comma-separated list of service IDs that can bypass some checks
}

// LoadConfig loads configuration from the environment.
func LoadConfig() (*Config, error) {
	// In a real application, this would use a library like 'envconfig' or 'viper'.
	// For this example, we'll manually populate with defaults and environment overrides.
	cfg := &Config{
		Port:                 getEnv("PORT", defaultPort),
		ReadTimeout:          getEnvDuration("HTTP_READ_TIMEOUT", defaultReadTimeout),
		WriteTimeout:         getEnvDuration("HTTP_WRITE_TIMEOUT", defaultWriteTimeout),
		IdleTimeout:          getEnvDuration("HTTP_IDLE_TIMEOUT", defaultIdleTimeout),
		AuthServiceEndpoint:  os.Getenv("AUTH_SERVICE_ENDPOINT"),
		SchemaRegistryEndpoint: os.Getenv("SCHEMA_REGISTRY_ENDPOINT"),
		MessageBusType:       os.Getenv("MESSAGE_BUS_TYPE"),
		MessageBusBrokers:    os.Getenv("MESSAGE_BUS_BROKERS"),
		LogLevel:             getEnv("LOG_LEVEL", "info"),
		EnableJurisdictionDE: getEnvBool("ENABLE_JURISDICTION_DE", false),
		ValidationMode:       getEnv("VALIDATION_MODE", "strict"),
		ValidationSampleRate: getEnvFloat("VALIDATION_SAMPLE_RATE", 1.0),
	}

	if trustedIDs := os.Getenv("TRUSTED_PUBLISHER_IDS"); trustedIDs != "" {
		cfg.TrustedPublisherIDs = strings.Split(trustedIDs, ",")
	}

	// Basic validation
	if cfg.AuthServiceEndpoint == "" || cfg.SchemaRegistryEndpoint == "" || cfg.MessageBusType == "" || cfg.MessageBusBrokers == "" {
		return nil, errors.New("missing required configuration: AUTH_SERVICE_ENDPOINT, SCHEMA_REGISTRY_ENDPOINT, MESSAGE_BUS_TYPE, MESSAGE_BUS_BROKERS must be set")
	}

	return cfg, nil
}

// Server holds the dependencies for the HTTP server.
type Server struct {
	router             *mux.Router
	config             *Config
	logger             *slog.Logger
	authClient         auth.AuthServiceClient
	schemaClient       schema.SchemaRegistryClient
	messageProducer    events.MessageProducer
	tracer             trace.Tracer
	isShuttingDown     bool
	shutdownMutex      sync.Mutex
}

// NewServer creates and initializes a new Server instance.
func NewServer(cfg *Config, logger *slog.Logger) (*Server, error) {
	// Initialize service clients. These would be real clients from the core SDK.
	// For this example, we'll use mock implementations.
	authClient, err := auth.NewClient(cfg.AuthServiceEndpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to create auth service client: %w", err)
	}

	schemaClient, err := schema.NewClient(cfg.SchemaRegistryEndpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to create schema registry client: %w", err)
	}

	producerConfig := events.ProducerConfig{
		Type:    events.BusType(cfg.MessageBusType),
		Brokers: strings.Split(cfg.MessageBusBrokers, ","),
	}
	messageProducer, err := events.NewProducer(producerConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create message producer: %w", err)
	}

	s := &Server{
		router:          mux.NewRouter(),
		config:          cfg,
		logger:          logger,
		authClient:      authClient,
		schemaClient:    schemaClient,
		messageProducer: messageProducer,
		tracer:          otel.Tracer(appName),
	}

	s.registerRoutes()
	return s, nil
}

// registerRoutes sets up the HTTP routes for the gateway.
func (s *Server) registerRoutes() {
	// Core API for publishing events
	s.router.HandleFunc("/publish/{topic}", s.publishHandler).Methods("POST")
	s.router.HandleFunc("/publish-batch", s.batchPublishHandler).Methods("POST")

	// Observability and operational endpoints
	s.router.Handle("/metrics", promhttp.Handler())
	s.router.HandleFunc("/healthz", s.healthCheckHandler).Methods("GET")
	s.router.HandleFunc("/readyz", s.readinessCheckHandler).Methods("GET")

	// Self-querying agent endpoints
	s.router.HandleFunc("/introspect", s.introspectHandler).Methods("GET")
	s.router.HandleFunc("/assumptions", s.assumptionsHandler).Methods("GET")
	s.router.HandleFunc("/failure-modes", s.failureModesHandler).Methods("GET")
	s.router.HandleFunc("/update-triggers", s.updateTriggersHandler).Methods("GET")
}

// start begins listening for HTTP requests.
func (s *Server) start(ctx context.Context) error {
	httpServer := &http.Server{
		Addr:         ":" + s.config.Port,
		Handler:      otelhttp.NewHandler(s.router, "http.server"),
		ReadTimeout:  s.config.ReadTimeout,
		WriteTimeout: s.config.WriteTimeout,
		IdleTimeout:  s.config.IdleTimeout,
	}

	errChan := make(chan error, 1)
	go func() {
		s.logger.Info("Server starting", "address", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errChan <- err
		}
	}()

	select {
	case err := <-errChan:
		return err
	case <-ctx.Done():
		s.logger.Info("Server shutting down...")
		s.shutdownMutex.Lock()
		s.isShuttingDown = true
		s.shutdownMutex.Unlock()

		shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
		defer cancel()

		if err := httpServer.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("HTTP server shutdown failed: %w", err)
		}
		if err := s.messageProducer.Close(); err != nil {
			s.logger.Error("Failed to close message producer", "error", err)
		}
		s.logger.Info("Server shut down gracefully")
		return nil
	}
}

// publishHandler is the core logic for handling a single event publication request.
func (s *Server) publishHandler(w http.ResponseWriter, r *http.Request) {
	ctx, span := s.tracer.Start(r.Context(), "publishHandler")
	defer span.End()

	startTime := time.Now()
	vars := mux.Vars(r)
	topic := vars["topic"]

	span.SetAttributes(
		attribute.String("event.topic", topic),
	)
	messagesReceived.WithLabelValues(topic).Inc()

	// 1. Extract Authentication Token
	token, err := auth.ExtractToken(r)
	if err != nil {
		s.handleError(w, r, "Authorization token missing or malformed", http.StatusUnauthorized, err)
		messagesAuthorized.WithLabelValues(topic, "failure").Inc()
		return
	}

	// 2. Authorize the request
	authRequest := &auth.AuthorizationRequest{
		Token:      token,
		Resource:   fmt.Sprintf("topic:%s", topic),
		Action:     "publish",
	}
	authResponse, err := s.authClient.Authorize(ctx, authRequest)
	if err != nil {
		s.handleError(w, r, "Authorization check failed", http.StatusInternalServerError, err)
		messagesAuthorized.WithLabelValues(topic, "failure").Inc()
		return
	}
	if !authResponse.Allowed {
		s.handleError(w, r, "Permission denied to publish to topic", http.StatusForbidden, errors.New("publisher not authorized"))
		messagesAuthorized.WithLabelValues(topic, "failure").Inc()
		return
	}
	messagesAuthorized.WithLabelValues(topic, "success").Inc()
	span.SetAttributes(attribute.String("auth.principal_id", authResponse.PrincipalID))

	// 3. Read and Decode the message body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		s.handleError(w, r, "Failed to read request body", http.StatusBadRequest, err)
		return
	}
	defer r.Body.Close()

	var messageData map[string]interface{}
	if err := json.Unmarshal(body, &messageData); err != nil {
		s.handleError(w, r, "Failed to decode JSON message", http.StatusBadRequest, err)
		messagesValidated.WithLabelValues(topic, "failure").Inc()
		return
	}

	// 4. Schema Validation (Tension: Throughput vs. Rigor)
	// Enterprise upsell path: Offer stricter validation guarantees or custom validation logic.
	isTrusted := s.isTrustedPublisher(authResponse.PrincipalID)
	shouldValidate := s.shouldPerformValidation(isTrusted)

	if shouldValidate {
		validationRequest := &schema.ValidationRequest{
			SchemaID: topic, // Assuming schema ID maps directly to topic name for simplicity
			Version:  "latest",
			Data:     messageData,
		}
		validationResponse, err := s.schemaClient.Validate(ctx, validationRequest)
		if err != nil {
			s.handleError(w, r, "Schema validation service failed", http.StatusInternalServerError, err)
			messagesValidated.WithLabelValues(topic, "failure").Inc()
			return
		}
		if !validationResponse.Valid {
			s.handleError(w, r, "Message failed schema validation", http.StatusBadRequest, fmt.Errorf("validation errors: %v", validationResponse.Errors))
			messagesValidated.WithLabelValues(topic, "failure").Inc()
			return
		}
	} else {
		s.logger.Debug("Skipping schema validation for trusted publisher or due to sampling", "topic", topic, "principal", authResponse.PrincipalID)
	}
	messagesValidated.WithLabelValues(topic, "success").Inc()

	// 5. Construct and Publish the Event
	// The core SDK provides a standard event envelope.
	event := events.NewCloudEvent(
		topic,
		"aiecosystem.event.v1",
		messageData,
		events.WithSource(appName),
		events.WithSubject(authResponse.PrincipalID),
	)

	// Add tracing context to the event for distributed tracing across services.
	otel.GetTextMapPropagator().Inject(ctx, event.Headers)

	err = s.messageProducer.Publish(ctx, topic, event)
	if err != nil {
		s.handleError(w, r, "Failed to publish message to event bus", http.StatusServiceUnavailable, err)
		return
	}

	messagesPublished.WithLabelValues(topic).Inc()
	messageProcessingLatency.WithLabelValues(topic).Observe(time.Since(startTime).Seconds())

	s.writeJSON(w, http.StatusAccepted, map[string]string{"status": "message accepted", "eventId": event.ID})
}

// batchPublishHandler handles multiple messages in a single request for higher throughput.
func (s *Server) batchPublishHandler(w http.ResponseWriter, r *http.Request) {
	// This is a more complex handler that would process an array of messages.
	// It represents an upsell path for high-volume clients.
	// For brevity, this is a placeholder implementation.
	s.handleError(w, r, "Batch publishing not yet implemented", http.StatusNotImplemented, nil)
}

// isTrustedPublisher checks if a given principal ID is in the configured trusted list.
func (s *Server) isTrustedPublisher(principalID string) bool {
	for _, id := range s.config.TrustedPublisherIDs {
		if id == principalID {
			return true
		}
	}
	return false
}

// shouldPerformValidation implements the logic for the Throughput vs. Rigor tension.
func (s *Server) shouldPerformValidation(isTrusted bool) bool {
	switch s.config.ValidationMode {
	case "strict":
		return true
	case "sampled":
		// Trusted publishers can be configured to bypass sampling.
		if isTrusted {
			return false
		}
		return s.config.ValidationSampleRate >= 1.0 || (s.config.ValidationSampleRate > 0 && time.Now().UnixNano()%int64(1.0/s.config.ValidationSampleRate) == 0)
	case "none":
		return false
	default:
		return true // Default to strict mode
	}
}

// healthCheckHandler reports the liveness of the service.
func (s *Server) healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	s.shutdownMutex.Lock()
	defer s.shutdownMutex.Unlock()
	if s.isShuttingDown {
		http.Error(w, "Service is shutting down", http.StatusServiceUnavailable)
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]string{"status": "healthy"})
}

// readinessCheckHandler reports if the service is ready to accept traffic.
func (s *Server) readinessCheckHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	// Check dependencies: auth service, schema registry, message bus
	var ready bool = true
	var checks []string

	if err := s.authClient.Ping(ctx); err != nil {
		ready = false
		checks = append(checks, fmt.Sprintf("auth_service: unhealthy (%v)", err))
	} else {
		checks = append(checks, "auth_service: healthy")
	}

	if err := s.schemaClient.Ping(ctx); err != nil {
		ready = false
		checks = append(checks, fmt.Sprintf("schema_registry: unhealthy (%v)", err))
	} else {
		checks = append(checks, "schema_registry: healthy")
	}

	if err := s.messageProducer.Ping(ctx); err != nil {
		ready = false
		checks = append(checks, fmt.Sprintf("message_bus: unhealthy (%v)", err))
	} else {
		checks = append(checks, "message_bus: healthy")
	}

	if !ready {
		s.logger.Warn("Readiness check failed", "checks", checks)
		s.writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{"status": "unhealthy", "checks": checks})
		return
	}

	s.writeJSON(w, http.StatusOK, map[string]interface{}{"status": "ready", "checks": checks})
}

// --- Self-Querying Agent Endpoints ---

func (s *Server) introspectHandler(w http.ResponseWriter, r *http.Request) {
	metadata, _ := parseAgentMetadata()
	s.writeJSON(w, http.StatusOK, map[string]interface{}{
		"appName": appName,
		"purpose": metadata["purpose"],
		"version": "1.0.0", // This would come from build flags
	})
}

func (s *Server) assumptionsHandler(w http.ResponseWriter, r *http.Request) {
	metadata, _ := parseAgentMetadata()
	s.writeJSON(w, http.StatusOK, map[string]interface{}{
		"dependencies": metadata["dependencies"],
		"assumptions": []string{
			"Network connectivity exists to all dependent services.",
			"Dependent services (Auth, Schema Registry) adhere to their API contracts.",
			"The underlying message bus provides at-least-once delivery semantics.",
			"Event schemas are backwards-compatible to avoid breaking consumers.",
		},
	})
}

func (s *Server) failureModesHandler(w http.ResponseWriter, r *http.Request) {
	metadata, _ := parseAgentMetadata()
	s.writeJSON(w, http.StatusOK, map[string]interface{}{
		"invalidation_conditions": metadata["invalidation_conditions"],
		"failure_modes": []map[string]string{
			{"mode": "Dependency Unavailability", "description": "Auth Service or Schema Registry is down. Gateway will reject all incoming messages with 503 Service Unavailable.", "mitigation": "Circuit breakers, retries with exponential backoff, and robust monitoring/alerting."},
			{"mode": "Message Bus Unavailability", "description": "Cannot connect to the underlying message bus. Gateway will reject messages with 503.", "mitigation": "Internal buffering (with limits) for transient failures, dead-letter queue for persistent failures."},
			{"mode": "Poison Pill Message", "description": "A malformed message that repeatedly fails processing.", "mitigation": "Strict schema validation rejects malformed messages at the edge. Rate limiting prevents abuse."},
			{"mode": "Configuration Error", "description": "Incorrect service endpoints or credentials.", "mitigation": "Configuration validation on startup, dynamic configuration reloading with health checks."},
		},
	})
}

func (s *Server) updateTriggersHandler(w http.ResponseWriter, r *http.Request) {
	s.writeJSON(w, http.StatusOK, map[string]interface{}{
		"update_triggers": []string{
			"Deployment of a new version of the gateway application.",
			"Change in core configuration (e.g., service endpoints, security policies).",
			"Update to the Core SDK, requiring a new build and deployment.",
			"Major version change in a dependent service's API contract.",
		},
		"adjacent_apps": []string{
			"APP_XX_Identity_AuthService",
			"APP_XX_Governance_SchemaRegistry",
			"APP_37_Governance_AuditTrailEngine",
		},
	})
}

// --- Helper Functions ---

func (s *Server) handleError(w http.ResponseWriter, r *http.Request, message string, statusCode int, err error) {
	logMsg := message
	if err != nil {
		logMsg = fmt.Sprintf("%s: %v", message, err)
	}
	s.logger.Error(logMsg, "status_code", statusCode, "path", r.URL.Path)
	s.writeJSON(w, statusCode, map[string]string{"error": message})
}

func (s *Server) writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		s.logger.Error("Failed to write JSON response", "error", err)
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	if value, ok := os.LookupEnv(key); ok {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if value, ok := os.LookupEnv(key); ok {
		return strings.ToLower(value) == "true" || value == "1"
	}
	return fallback
}

func getEnvFloat(key string, fallback float64) float64 {
	if value, ok := os.LookupEnv(key); ok {
		if f, err :=  fmt.Sscanf(value, "%f", &fallback); err == nil && f == 1 {
			return fallback
		}
	}
	return fallback
}

// A simple parser for the YAML-like agent metadata block.
func parseAgentMetadata() (map[string]interface{}, error) {
	// In a real scenario, this would use a proper YAML parser.
	// For this self-contained example, we'll use simple string splitting.
	data := make(map[string]interface{})
	lines := strings.Split(strings.TrimSpace(agentMetadata), "\n")
	var currentKey string
	var currentList []string

	for _, line := range lines[1:] { // Skip the first line "agent_metadata:"
		line = strings.TrimSpace(line)
		if strings.HasSuffix(line, ":") {
			if currentKey != "" && len(currentList) > 0 {
				data[currentKey] = currentList
			}
			currentKey = strings.TrimSuffix(line, ":")
			currentList = []string{}
		} else if strings.HasPrefix(line, "- ") {
			currentList = append(currentList, strings.TrimPrefix(line, "- "))
		} else {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.Trim(strings.TrimSpace(parts[1]), `"`)
				data[key] = value
			}
		}
	}
	if currentKey != "" && len(currentList) > 0 {
		data[currentKey] = currentList
	}
	return data, nil
}

// initTracer initializes an OpenTelemetry tracer provider.
func initTracer() (*sdktrace.TracerProvider, error) {
	// For production, you'd use a real exporter (e.g., OTLP, Jaeger, Datadog).
	// For this example, we'll use a simple stdout exporter.
	exporter, err := stdouttrace.New(stdouttrace.WithPrettyPrint())
	if err != nil {
		return nil, err
	}

	r, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName(appName),
		),
	)
	if err != nil {
		return nil, err
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(r),
	)
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))

	return tp, nil
}

func main() {
	// Setup structured logging
	logLevel := new(slog.LevelVar)
	logHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: logLevel})
	logger := slog.New(logHandler)

	// Load configuration
	cfg, err := LoadConfig()
	if err != nil {
		logger.Error("Configuration error", "error", err)
		os.Exit(1)
	}

	// Set log level from config
	switch strings.ToLower(cfg.LogLevel) {
	case "debug":
		logLevel.Set(slog.LevelDebug)
	case "warn":
		logLevel.Set(slog.LevelWarn)
	case "error":
		logLevel.Set(slog.LevelError)
	default:
		logLevel.Set(slog.LevelInfo)
	}

	// Initialize OpenTelemetry for distributed tracing
	tp, err := initTracer()
	if err != nil {
		logger.Error("Failed to initialize tracer", "error", err)
		os.Exit(1)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			logger.Error("Error shutting down tracer provider", "error", err)
		}
	}()

	// Create the server
	server, err := NewServer(cfg, logger)
	if err != nil {
		logger.Error("Failed to create server", "error", err)
		os.Exit(1)
	}

	// Setup signal handling for graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Start the server
	if err := server.start(ctx); err != nil {
		logger.Error("Server failed to start", "error", err)
		os.Exit(1)
	}
}