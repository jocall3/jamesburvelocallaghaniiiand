// Copyright 2024 Interconnected Systems OS, Inc.
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

// agent_metadata:
//   purpose: "Acts as a high-throughput, multi-provider API gateway for AI model inference. It routes requests to various downstream AI providers based on configurable strategies, focusing on cost, latency, and quality trade-offs. It provides a unified API endpoint for diverse backend models."
//   dependencies:
//     - "core/sdk": For shared logging, configuration, metrics, and service discovery.
//     - "core/auth": For authenticating and authorizing incoming requests.
//     - "core/events": For publishing audit and billing events after each inference.
//     - "providers/openai": Adapter for OpenAI-compatible APIs.
//     - "providers/anthropic": Adapter for Anthropic's Claude models.
//     - "providers/google": Adapter for Google's Gemini and other Vertex AI models.
//     - "providers/cohere": Adapter for Cohere's models.
//   invalidation_conditions:
//     - "Major breaking changes in downstream provider APIs (e.g., OpenAI, Anthropic)."
//     - "Deprecation of the shared authentication protocol."
//     - "Significant changes to the core event bus schema for billing."
//   adjacent_apps:
//     - "APP_01_Inference_CostRouter": This gateway could be a consumer of the CostRouter's decisions.
//     - "APP_37_Governance_AuditTrailEngine": This gateway is a primary producer of events consumed by the AuditTrailEngine.
//     - "APP_11_Billing_TokenAccountant": Consumes billing events emitted by this gateway to calculate costs.
//     - "APP_06_Evaluation_Benchmarker": Uses this gateway as a consistent endpoint to benchmark different models.

package main

import (
	"context"
	"encoding/json"
	"flag"
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

	// Placeholder for the shared core SDK
	"ecosystem.com/core/auth"
	"ecosystem.com/core/config"
	"ecosystem.com/core/events"
	"ecosystem.com/core/logger"
	"ecosystem.com/core/metrics"
	"ecosystem.com/core/ontology"

	// Placeholder for provider adapters
	"ecosystem.com/app_21/providers"
	"ecosystem.com/app_21/routing"
)

const (
	defaultPort         = 8080
	defaultReadTimeout  = 5 * time.Second
	defaultWriteTimeout = 90 * time.Second
	defaultIdleTimeout  = 120 * time.Second
	shutdownTimeout     = 15 * time.Second
)

// AppConfig defines the specific configuration for the MultiModelGateway.
// It embeds the shared BaseConfig from the core SDK.
type AppConfig struct {
	config.BaseConfig
	Server struct {
		Port         int           `yaml:"port"`
		ReadTimeout  time.Duration `yaml:"readTimeout"`
		WriteTimeout time.Duration `yaml:"writeTimeout"`
		IdleTimeout  time.Duration `yaml:"idleTimeout"`
	} `yaml:"server"`
	RoutingStrategy routing.StrategyConfig `yaml:"routingStrategy"`
	Providers       []providers.Config     `yaml:"providers"`
	Jurisdiction    struct {
		DefaultRegion string   `yaml:"defaultRegion"`
		BlockedModels []string `yaml:"blockedModels"`
	} `yaml:"jurisdiction"`
}

// application holds the dependencies for our application.
type application struct {
	config        AppConfig
	logger        *slog.Logger
	router        routing.Router
	authClient    auth.Client
	eventProducer events.Producer
	metrics       metrics.MetricsCollector
	buildInfo     ontology.BuildInfo
}

func main() {
	// This is the main entrypoint for the application.
	// It follows a standard pattern:
	// 1. Parse command-line flags.
	// 2. Load configuration.
	// 3. Initialize dependencies (logger, clients, etc.).
	// 4. Start the HTTP server.
	// 5. Wait for a shutdown signal and perform graceful shutdown.

	buildInfo := ontology.BuildInfo{
		Version: "1.0.0",
		Commit:  "a1b2c3d", // This would be injected at build time
		Time:    time.Now().UTC().Format(time.RFC3339),
	}

	var cfgPath string
	flag.StringVar(&cfgPath, "config", "config.yaml", "Path to the configuration file")
	flag.Parse()

	// --- Configuration Loading ---
	cfg, err := loadConfig(cfgPath)
	if err != nil {
		slog.Error("failed to load configuration", "error", err)
		os.Exit(1)
	}

	// --- Dependency Initialization ---
	appLogger := logger.New(os.Stdout, logger.Level(cfg.LogLevel), cfg.LogFormat == "json")
	appLogger.Info("starting APP_21_Inference_MultiModelGateway", "version", buildInfo.Version, "pid", os.Getpid())

	authClient, err := auth.NewClient(cfg.Services.Auth)
	if err != nil {
		appLogger.Error("failed to initialize auth client", "error", err)
		os.Exit(1)
	}

	eventProducer, err := events.NewProducer(cfg.EventBus)
	if err != nil {
		appLogger.Error("failed to initialize event producer", "error", err)
		os.Exit(1)
	}

	metricsCollector := metrics.NewPrometheusCollector("app_21_multi_model_gateway")

	providerManager, err := providers.NewManager(cfg.Providers, appLogger)
	if err != nil {
		appLogger.Error("failed to initialize provider manager", "error", err)
		os.Exit(1)
	}

	router, err := routing.NewRouter(cfg.RoutingStrategy, providerManager, appLogger, metricsCollector)
	if err != nil {
		appLogger.Error("failed to initialize request router", "error", err)
		os.Exit(1)
	}

	app := &application{
		config:        cfg,
		logger:        appLogger,
		router:        router,
		authClient:    authClient,
		eventProducer: eventProducer,
		metrics:       metricsCollector,
		buildInfo:     buildInfo,
	}

	// --- Server Setup & Startup ---
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      app.routes(),
		ErrorLog:     slog.NewLogLogger(appLogger.Handler(), slog.LevelError),
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	// Start server in a goroutine so that it doesn't block.
	go func() {
		app.logger.Info("server starting", "address", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			app.logger.Error("server failed to start", "error", err)
			os.Exit(1)
		}
	}()

	// --- Graceful Shutdown ---
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	app.logger.Info("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		app.logger.Error("server forced to shutdown", "error", err)
		os.Exit(1)
	}

	if err := app.eventProducer.Close(); err != nil {
		app.logger.Error("failed to close event producer", "error", err)
	}

	app.logger.Info("server exiting")
}

// loadConfig loads and validates the application configuration.
func loadConfig(path string) (AppConfig, error) {
	var cfg AppConfig

	// Set sane defaults
	cfg.Server.Port = defaultPort
	cfg.Server.ReadTimeout = defaultReadTimeout
	cfg.Server.WriteTimeout = defaultWriteTimeout
	cfg.Server.IdleTimeout = defaultIdleTimeout
	cfg.LogLevel = "info"
	cfg.LogFormat = "text"

	// This would use the core/config loader in a real implementation
	// For this example, we simulate loading and validation.
	// config.Load(path, &cfg)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		// In a real scenario, we might proceed with defaults. Here we'll warn.
		slog.Warn("config file not found, using defaults", "path", path)
	} else {
		// Simulate reading from YAML
		// file, err := os.ReadFile(path)
		// yaml.Unmarshal(file, &cfg)
	}

	if len(cfg.Providers) == 0 {
		return cfg, fmt.Errorf("configuration error: at least one provider must be defined in 'providers'")
	}
	if cfg.RoutingStrategy.Name == "" {
		return cfg, fmt.Errorf("configuration error: 'routingStrategy.name' must be set")
	}

	return cfg, nil
}

// routes sets up the application's HTTP handlers and middleware.
func (app *application) routes() http.Handler {
	mux := http.NewServeMux()

	// --- Core API ---
	// The main inference endpoint, protected by authentication and other middleware.
	inferenceHandler := http.HandlerFunc(app.handleInference)
	mux.Handle("POST /v1/inference/chat/completions", app.authenticate(app.logRequests(inferenceHandler)))

	// --- Observability & Management ---
	mux.Handle("/metrics", app.metrics.Handler())
	mux.HandleFunc("GET /healthz", app.handleHealthz)
	mux.HandleFunc("GET /readyz", app.handleReadyz)

	// --- Self-Querying Agent Endpoints ---
	mux.HandleFunc("GET /introspect", app.handleIntrospect)
	mux.HandleFunc("GET /assumptions", app.handleAssumptions)
	mux.HandleFunc("GET /failure-modes", app.handleFailureModes)
	mux.HandleFunc("GET /update-triggers", app.handleUpdateTriggers)

	return mux
}

// handleInference is the core handler for proxying inference requests.
func (app *application) handleInference(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()

	// 1. Decode and validate the incoming request against the unified ontology.
	var req ontology.InferenceRequest
	if err := app.decodeJSON(w, r, &req); err != nil {
		app.errorResponse(w, r, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// 2. Apply jurisdictional controls.
	for _, blocked := range app.config.Jurisdiction.BlockedModels {
		if strings.EqualFold(req.Model, blocked) {
			app.errorResponse(w, r, http.StatusForbidden, "Model is not available in this jurisdiction", nil)
			return
		}
	}

	// 3. Use the router to select the best provider and model.
	// This is where the core tension (cost vs. quality vs. speed) is resolved.
	decision, err := app.router.SelectProvider(r.Context(), &req)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, "Failed to select an inference provider", err)
		return
	}

	app.logger.InfoContext(r.Context(), "routing decision made",
		"strategy", app.config.RoutingStrategy.Name,
		"selectedProvider", decision.Provider.Name(),
		"selectedModel", decision.Model,
		"reason", decision.Reason,
	)

	// 4. Forward the request to the chosen provider.
	providerResponse, err := decision.Provider.ChatCompletion(r.Context(), &decision.Request)
	if err != nil {
		app.metrics.IncInferenceErrors(decision.Provider.Name(), decision.Model, "provider_error")
		app.errorResponse(w, r, http.StatusBadGateway, "Error from upstream provider", err)
		return
	}

	// 5. Record metrics.
	latency := time.Since(startTime)
	app.metrics.ObserveInferenceLatency(decision.Provider.Name(), decision.Model, latency)
	app.metrics.IncInferenceCount(decision.Provider.Name(), decision.Model)
	if providerResponse.Usage != nil {
		app.metrics.AddTokensProcessed(decision.Provider.Name(), decision.Model, "prompt", float64(providerResponse.Usage.PromptTokens))
		app.metrics.AddTokensProcessed(decision.Provider.Name(), decision.Model, "completion", float64(providerResponse.Usage.CompletionTokens))
	}

	// 6. Publish an event for billing and auditing.
	// This is a critical integration point for the ecosystem.
	go func() {
		// Use a background context so event publishing doesn't block the response.
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		auditEvent := events.InferenceAuditEvent{
			EventID:           ontology.NewUUID(),
			Timestamp:         time.Now().UTC(),
			RequestID:         ontology.GetRequestID(r.Context()),
			PrincipalID:       auth.GetPrincipalID(r.Context()),
			Source IP:         r.RemoteAddr,
			Action:            "inference.chat.completion",
			TargetProvider:    decision.Provider.Name(),
			TargetModel:       decision.Model,
			LatencyMs:         latency.Milliseconds(),
			RequestPayload:    req,
			ResponsePayload:   *providerResponse,
			RoutingDecision:   decision.Reason,
			Jurisdiction:      app.config.Jurisdiction.DefaultRegion,
			Status:            "SUCCESS",
		}
		if err := app.eventProducer.Publish(ctx, "inference.audit", auditEvent); err != nil {
			app.logger.ErrorContext(ctx, "failed to publish audit event", "error", err)
		}
	}()

	// 7. Send the unified response back to the client.
	app.writeJSON(w, http.StatusOK, providerResponse, nil)
}

// --- Middleware ---

func (app *application) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// In a real implementation, this would extract a token (e.g., JWT)
		// from the Authorization header and validate it using the authClient.
		token, err := auth.ExtractToken(r)
		if err != nil {
			app.authenticationErrorResponse(w, r, err)
			return
		}

		principal, err := app.authClient.Validate(r.Context(), token)
		if err != nil {
			app.authenticationErrorResponse(w, r, err)
			return
		}

		// Add principal information to the request context for downstream use.
		ctx := auth.WithPrincipal(r.Context(), principal)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (app *application) logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Add a unique request ID to the context.
		ctx := ontology.WithRequestID(r.Context())
		r = r.WithContext(ctx)

		requestID := ontology.GetRequestID(ctx)
		principalID := auth.GetPrincipalID(ctx) // Will be empty if auth runs after

		app.logger.InfoContext(ctx, "received request",
			"request_id", requestID,
			"principal_id", principalID,
			"remote_addr", r.RemoteAddr,
			"proto", r.Proto,
			"method", r.Method,
			"uri", r.URL.RequestURI(),
		)

		next.ServeHTTP(w, r)
	})
}

// --- Helper Functions ---

func (app *application) decodeJSON(w http.ResponseWriter, r *http.Request, dst interface{}) error {
	maxBytes := 1_048_576 // 1MB
	r.Body = http.MaxBytesReader(w, r.Body, int64(maxBytes))

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	err := dec.Decode(dst)
	if err != nil {
		// Custom error handling for different JSON errors
		return err
	}

	err = dec.Decode(&struct{}{})
	if err != io.EOF {
		return fmt.Errorf("body must only contain a single JSON value")
	}

	return nil
}

func (app *application) writeJSON(w http.ResponseWriter, status int, data interface{}, headers http.Header) error {
	js, err := json.Marshal(data)
	if err != nil {
		return err
	}

	for key, value := range headers {
		w.Header()[key] = value
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, err = w.Write(js)
	return err
}

func (app *application) errorResponse(w http.ResponseWriter, r *http.Request, status int, message string, err error) {
	logMessage := message
	if err != nil {
		logMessage = fmt.Sprintf("%s: %v", message, err)
	}
	app.logger.ErrorContext(r.Context(), logMessage)

	resp := ontology.ErrorResponse{
		RequestID: ontology.GetRequestID(r.Context()),
		Error: ontology.APIError{
			Status:  status,
			Message: message,
		},
	}
	app.writeJSON(w, status, resp, nil)
}

func (app *application) authenticationErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	w.Header().Set("WWW-Authenticate", "Bearer")
	app.errorResponse(w, r, http.StatusUnauthorized, "Authentication failed", err)
}

// --- Management & Self-Querying Handlers ---

func (app *application) handleHealthz(w http.ResponseWriter, r *http.Request) {
	// Simple health check, doesn't check dependencies.
	data := map[string]string{"status": "ok"}
	app.writeJSON(w, http.StatusOK, data, nil)
}

func (app *application) handleReadyz(w http.ResponseWriter, r *http.Request) {
	// Readiness check should verify dependencies are available.
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	var wg sync.WaitGroup
	errs := make(chan error, 2)

	wg.Add(2)
	go func() {
		defer wg.Done()
		if err := app.authClient.Ping(ctx); err != nil {
			errs <- fmt.Errorf("auth service unhealthy: %w", err)
		}
	}()
	go func() {
		defer wg.Done()
		if err := app.eventProducer.Ping(ctx); err != nil {
			errs <- fmt.Errorf("event bus unhealthy: %w", err)
		}
	}()

	wg.Wait()
	close(errs)

	if len(errs) > 0 {
		var allErrors []string
		for err := range errs {
			allErrors = append(allErrors, err.Error())
		}
		app.errorResponse(w, r, http.StatusServiceUnavailable, "Service not ready", fmt.Errorf(strings.Join(allErrors, "; ")))
		return
	}

	data := map[string]string{"status": "ready"}
	app.writeJSON(w, http.StatusOK, data, nil)
}

func (app *application) handleIntrospect(w http.ResponseWriter, r *http.Request) {
	providersInfo := make([]map[string]interface{}, 0, len(app.config.Providers))
	for _, p := range app.config.Providers {
		providersInfo = append(providersInfo, map[string]interface{}{
			"name":    p.Name,
			"type":    p.Type,
			"enabled": p.Enabled,
			"timeout": p.Timeout,
		})
	}

	data := map[string]interface{}{
		"appName":         "APP_21_Inference_MultiModelGateway",
		"buildInfo":       app.buildInfo,
		"routingStrategy": app.config.RoutingStrategy,
		"providers":       providersInfo,
		"jurisdiction":    app.config.Jurisdiction,
	}
	app.writeJSON(w, http.StatusOK, data, nil)
}

func (app *application) handleAssumptions(w http.ResponseWriter, r *http.Request) {
	data := map[string][]string{
		"network": {
			"Downstream provider APIs are reachable and conform to their documented schemas.",
			"The shared auth service is available and has low latency.",
			"The event bus is available and can accept high throughput.",
		},
		"data": {
			"Incoming requests conform to the unified 'ontology.InferenceRequest' schema.",
			"API keys for downstream providers are valid and have sufficient quota.",
		},
		"operational": {
			"The configured routing strategy ('" + app.config.RoutingStrategy.Name + "') is optimal for the current business objective (e.g., cost, latency).",
			"The underlying compute has sufficient resources (CPU, memory, network) to handle the expected load.",
		},
	}
	app.writeJSON(w, http.StatusOK, data, nil)
}

func (app *application) handleFailureModes(w http.ResponseWriter, r *http.Request) {
	data := map[string]string{
		"provider_outage":         "If a primary provider (e.g., OpenAI) is down, the 'failover' or 'least_latency' router can redirect traffic to healthy alternatives. A 'priority' router might fail requests if the top-priority provider is down.",
		"high_latency_provider":   "A slow provider can increase overall response time. The router's internal timeouts and circuit breakers mitigate this by failing fast or rerouting.",
		"quota_exhaustion":        "Requests to a provider will fail with 429 errors. The system should detect this, mark the provider as unhealthy for a short period, and route traffic elsewhere.",
		"auth_service_outage":     "No new requests can be authenticated, leading to a complete service outage for clients. Existing connections might continue to work depending on token caching.",
		"event_bus_outage":        "Inference requests will succeed, but billing and audit data will be lost. A local cache or dead-letter queue for events is a potential mitigation.",
		"misconfiguration":        "Incorrect API keys or endpoint URLs will cause all requests to a specific provider to fail. Readiness checks should catch this on startup.",
		"cascading_failure":       "A surge in traffic or a slow downstream provider could exhaust the gateway's connection pool or memory, causing it to become unresponsive.",
	}
	app.writeJSON(w, http.StatusOK, data, nil)
}

func (app *application) handleUpdateTriggers(w http.ResponseWriter, r *http.Request) {
	data := map[string]string{
		"configuration_change": "A change to 'config.yaml' (e.g., adding a new provider, changing routing strategy) requires a service restart or a dynamic configuration reload signal (SIGHUP).",
		"dependency_update":    "An update to a core library (core/sdk, core/auth) or a provider adapter requires a new binary to be built and deployed.",
		"provider_api_change":  "If a downstream provider (e.g., Anthropic) releases a new API version, the corresponding adapter in 'providers/' must be updated and the service redeployed.",
		"secret_rotation":      "Updating provider API keys in the secret management system requires the service to be restarted to pick up the new credentials.",
	}
	app.writeJSON(w, http.StatusOK, data, nil)
}