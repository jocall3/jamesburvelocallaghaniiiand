// Copyright (c) 2024 ECOSYSTEM. All rights reserved.
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
	"io"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"

	// Core SDK imports - these would be actual paths in the monorepo
	"ecosystem/core/sdk/auth"
	"ecosystem/core/sdk/config"
	"ecosystem/core/sdk/events"
	"ecosystem/core/sdk/logging"
	"ecosystem/core/sdk/telemetry"

	// AI Vendor SDKs - using adapters to avoid lock-in
	"ecosystem/app_04/adapters/aiprovider"
	"ecosystem/app_04/adapters/storage"
	"ecosystem/app_04/domain"
	"ecosystem/app_04/services"

	"github.com/gorilla/mux"
	"go.uber.org/zap"
	"gopkg.in/yaml.v2"
)

const (
	appName    = "APP_04_Ontology_SchemaRegistry"
	appVersion = "0.1.0"
)

// agentMetadata provides machine-readable information about the application.
var agentMetadata = map[string]interface{}{
	"agent_metadata": map[string]interface{}{
		"purpose": "Provides a centralized, versioned, and validated registry for data schemas (e.g., JSON Schema, Avro, Protobuf) used across the ecosystem. It ensures data consistency, facilitates safe schema evolution, and can leverage AI for schema generation and semantic compatibility analysis.",
		"dependencies": []string{
			"core/sdk/auth: For securing API endpoints.",
			"core/sdk/events: To publish schema change events.",
			"core/sdk/config: For externalized configuration.",
			"core/sdk/logging: For structured logging.",
			"Persistent storage (e.g., PostgreSQL, etcd) via storage adapter.",
			"AI providers (e.g., OpenAI, Anthropic) via AI provider adapter for advanced features.",
		},
		"invalidation_conditions": []string{
			"Major version change in the core event bus protocol.",
			"Deprecation of a supported schema format (e.g., Avro).",
			"Fundamental change in the ecosystem's data governance model.",
		},
		"adjacent_apps": []string{
			"APP_37_Governance_AuditTrailEngine: Consumes schema change events for audit logs.",
			"APP_14_Agents_MultiModelOrchestrator: May query schemas to understand tool input/output formats.",
			"APP_09_Data_SyntheticGenerator: Uses schemas as templates for generating synthetic data.",
			"APP_01_Inference_CostRouter: May use schema information to estimate payload sizes and costs.",
		},
	},
}

// AppConfig defines the application's configuration structure.
type AppConfig struct {
	Server struct {
		Port         string        `yaml:"port"`
		ReadTimeout  time.Duration `yaml:"readTimeout"`
		WriteTimeout time.Duration `yaml:"writeTimeout"`
	} `yaml:"server"`
	Storage struct {
		Type       string `yaml:"type"`
		DSN        string `yaml:"dsn"`
		InMemory   bool   `yaml:"inMemory"`
	} `yaml:"storage"`
	AIProviders struct {
		OpenAIKey    string `yaml:"openAIKey"`
		AnthropicKey string `yaml:"anthropicKey"`
	} `yaml:"aiProviders"`
	Governance struct {
		DefaultCompatibilityLevel string `yaml:"defaultCompatibilityLevel"`
		AllowForceRegistration    bool   `yaml:"allowForceRegistration"`
	} `yaml:"governance"`
	Jurisdiction struct {
		DisableAIFeatures bool `yaml:"disableAIFeatures"`
	} `yaml:"jurisdiction"`
	EventBus events.Config `yaml:"eventBus"`
	Auth     auth.Config   `yaml:"auth"`
}

// apiServer holds the dependencies for the HTTP server.
type apiServer struct {
	router         *mux.Router
	logger         *zap.Logger
	schemaService  *services.SchemaService
	authMiddleware auth.Middleware
	config         *AppConfig
}

func main() {
	// Initialize structured logger
	logger, err := logging.NewProductionLogger(appName)
	if err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	logger.Info("Starting service",
		zap.String("appName", appName),
		zap.String("appVersion", appVersion),
	)

	// Load configuration
	appConfig, err := loadConfiguration()
	if err != nil {
		logger.Fatal("Failed to load configuration", zap.Error(err))
	}

	// Initialize telemetry
	shutdownTelemetry, err := telemetry.InitProvider(appName, appVersion)
	if err != nil {
		logger.Fatal("Failed to initialize telemetry", zap.Error(err))
	}
	defer shutdownTelemetry()

	// Initialize storage backend
	schemaStore, err := storage.NewStore(appConfig.Storage.Type, appConfig.Storage.DSN)
	if err != nil {
		logger.Fatal("Failed to initialize storage", zap.Error(err))
	}

	// Initialize AI provider clients
	aiProvider, err := aiprovider.NewMultiAIProvider(
		aiprovider.WithOpenAI(appConfig.AIProviders.OpenAIKey),
		aiprovider.WithAnthropic(appConfig.AIProviders.AnthropicKey),
	)
	if err != nil {
		logger.Fatal("Failed to initialize AI providers", zap.Error(err))
	}

	// Initialize event bus publisher
	eventPublisher, err := events.NewPublisher(appConfig.EventBus)
	if err != nil {
		logger.Fatal("Failed to initialize event publisher", zap.Error(err))
	}

	// Initialize core schema service
	schemaService := services.NewSchemaService(
		schemaStore,
		aiProvider,
		eventPublisher,
		logger,
		services.WithDefaultCompatibilityLevel(domain.CompatibilityLevel(appConfig.Governance.DefaultCompatibilityLevel)),
		services.WithAIFeaturesEnabled(!appConfig.Jurisdiction.DisableAIFeatures),
	)

	// Initialize authentication middleware from core SDK
	authClient, err := auth.NewClient(appConfig.Auth)
	if err != nil {
		logger.Fatal("Failed to initialize auth client", zap.Error(err))
	}
	authMiddleware := auth.NewAuthMiddleware(authClient, logger)

	// Create the API server
	server := newAPIServer(logger, schemaService, authMiddleware, appConfig)
	server.registerRoutes()

	// Start the HTTP server
	httpServer := &http.Server{
		Addr:         ":" + appConfig.Server.Port,
		Handler:      server.router,
		ReadTimeout:  appConfig.Server.ReadTimeout,
		WriteTimeout: appConfig.Server.WriteTimeout,
	}

	go func() {
		logger.Info("Server starting", zap.String("port", appConfig.Server.Port))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Could not listen on port", zap.String("port", appConfig.Server.Port), zap.Error(err))
		}
	}()

	// Graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exiting")
}

func loadConfiguration() (*AppConfig, error) {
	// Using the core SDK config loader
	loader := config.NewLoader[AppConfig](appName)
	cfg, err := loader.Load("config.yaml")
	if err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}
	return cfg, nil
}

func newAPIServer(logger *zap.Logger, schemaService *services.SchemaService, authMiddleware auth.Middleware, cfg *AppConfig) *apiServer {
	return &apiServer{
		router:         mux.NewRouter(),
		logger:         logger,
		schemaService:  schemaService,
		authMiddleware: authMiddleware,
		config:         cfg,
	}
}

func (s *apiServer) registerRoutes() {
	// Middleware for logging, metrics, etc.
	s.router.Use(telemetry.HTTPMiddleware)
	s.router.Use(logging.HTTPMiddleware(s.logger))

	// Public introspection endpoints
	s.router.HandleFunc("/introspect", s.handleIntrospect).Methods("GET")
	s.router.HandleFunc("/assumptions", s.handleAssumptions).Methods("GET")
	s.router.HandleFunc("/failure-modes", s.handleFailureModes).Methods("GET")
	s.router.HandleFunc("/update-triggers", s.handleUpdateTriggers).Methods("GET")
	s.router.HandleFunc("/health", s.handleHealth).Methods("GET")

	// API v1 routes with authentication
	apiV1 := s.router.PathPrefix("/api/v1").Subrouter()
	apiV1.Use(s.authMiddleware.Authenticate)

	// Schema management
	apiV1.HandleFunc("/schemas/subjects/{subject}", s.handleRegisterSchema).Methods("POST")
	apiV1.HandleFunc("/schemas/subjects/{subject}/versions", s.handleRegisterNewVersion).Methods("POST")
	apiV1.HandleFunc("/schemas/ids/{id}", s.handleGetSchemaByID).Methods("GET")
	apiV1.HandleFunc("/schemas/subjects/{subject}/versions/{version}", s.handleGetSchemaByVersion).Methods("GET")
	apiV1.HandleFunc("/schemas/subjects/{subject}/versions", s.handleGetAllSchemaVersions).Methods("GET")

	// Compatibility and Validation
	apiV1.HandleFunc("/compatibility/subjects/{subject}/versions/{version}", s.handleCheckCompatibility).Methods("POST")
	apiV1.HandleFunc("/validate/subjects/{subject}/versions/{version}", s.handleValidateData).Methods("POST")

	// AI-powered features (subject to jurisdictional flags)
	if !s.config.Jurisdiction.DisableAIFeatures {
		apiV1.HandleFunc("/schemas/generate", s.handleGenerateSchemaFromNL).Methods("POST")
		apiV1.HandleFunc("/compatibility/semantic/subjects/{subject}/versions/{version}", s.handleAnalyzeSemanticCompatibility).Methods("POST")
	}
}

// --- Agent Self-Querying Handlers ---

func (s *apiServer) handleIntrospect(w http.ResponseWriter, r *http.Request) {
	s.respondWithJSON(w, http.StatusOK, agentMetadata)
}

func (s *apiServer) handleAssumptions(w http.ResponseWriter, r *http.Request) {
	assumptions := map[string][]string{
		"assumptions": {
			"The underlying storage layer provides strong consistency and durability.",
			"The event bus guarantees at-least-once delivery for schema change notifications.",
			"Clients are responsible for caching schemas to reduce latency and load.",
			"Schema subjects follow a consistent, hierarchical naming convention.",
			"AI models used for generation and analysis are probabilistic and may not always be accurate.",
			"The core auth service provides reliable user/service identity.",
		},
	}
	s.respondWithJSON(w, http.StatusOK, assumptions)
}

func (s *apiServer) handleFailureModes(w http.ResponseWriter, r *http.Request) {
	failureModes := map[string]interface{}{
		"failure_modes": []map[string]string{
			{"mode": "Storage Unavailability", "impact": "Cannot register, update, or retrieve schemas. Read-only operations might work with a cache.", "mitigation": "High-availability storage cluster, read replicas, client-side caching."},
			{"mode": "Event Bus Outage", "impact": "Downstream systems are not notified of schema changes, leading to potential data processing failures.", "mitigation": "Durable message queue, dead-letter queues, periodic polling of schema registry as a fallback."},
			{"mode": "Incompatible Schema Registration", "impact": "Producers publish data with a new schema that consumers cannot read, causing data loss or application errors.", "mitigation": "Strict compatibility checks (BACKWARD, FORWARD, FULL), automated consumer contract testing."},
			{"mode": "AI Provider Latency/Error", "impact": "AI-powered features (generation, semantic analysis) will fail or be slow.", "mitigation": "Timeouts, circuit breakers, fallback to non-AI logic, feature flags to disable AI features dynamically."},
			{"mode": "Configuration Error", "impact": "Incorrect compatibility levels or auth settings can lead to overly permissive or restrictive behavior.", "mitigation": "Configuration validation on startup, GitOps for config changes, audit logs."},
		},
		"architectural_tension": "Openness vs. Control. The system must balance the need for teams to iterate quickly (Openness) with the need for data stability and governance across the ecosystem (Control). This is managed via configurable compatibility levels, 'force' registration flags, and AI-powered schema linting which can act as a suggestion (Openness) or a hard gate (Control).",
	}
	s.respondWithJSON(w, http.StatusOK, failureModes)
}

func (s *apiServer) handleUpdateTriggers(w http.ResponseWriter, r *http.Request) {
	updateTriggers := map[string][]string{
		"update_triggers": {
			"Introduction of a new schema format (e.g., FlatBuffers).",
			"Change in the core authentication or authorization model.",
			"Availability of a significantly more capable AI model for schema generation or analysis.",
			"New regulatory requirements for data lineage or governance.",
			"Performance bottlenecks identified in schema validation or storage access.",
		},
	}
	s.respondWithJSON(w, http.StatusOK, updateTriggers)
}

func (s *apiServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	// In a real app, this would check DB connections, etc.
	s.respondWithJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// --- API Handlers ---

type RegisterSchemaRequest struct {
	SchemaType       string `json:"schemaType"` // e.g., "JSON_SCHEMA", "AVRO", "PROTOBUF"
	SchemaDefinition string `json:"schemaDefinition"`
}

func (s *apiServer) handleRegisterSchema(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	subject := vars["subject"]
	user, _ := auth.UserFromContext(r.Context())

	var req RegisterSchemaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	schema, err := s.schemaService.RegisterSchema(r.Context(), subject, domain.SchemaType(req.SchemaType), req.SchemaDefinition, user.ID)
	if err != nil {
		s.handleServiceError(w, err)
		return
	}

	s.respondWithJSON(w, http.StatusCreated, schema)
}

func (s *apiServer) handleRegisterNewVersion(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	subject := vars["subject"]
	user, _ := auth.UserFromContext(r.Context())

	var req RegisterSchemaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// The 'force' parameter demonstrates the Openness vs. Control tension.
	// It allows bypassing compatibility checks, but requires special permissions.
	force := r.URL.Query().Get("force") == "true"
	if force && !s.config.Governance.AllowForceRegistration {
		s.respondWithError(w, http.StatusForbidden, "Force registration is disabled by policy")
		return
	}
	// A more robust implementation would check user permissions for 'force' action.

	schema, err := s.schemaService.RegisterNewVersion(r.Context(), subject, domain.SchemaType(req.SchemaType), req.SchemaDefinition, user.ID, force)
	if err != nil {
		s.handleServiceError(w, err)
		return
	}

	s.respondWithJSON(w, http.StatusCreated, schema)
}

func (s *apiServer) handleGetSchemaByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		s.respondWithError(w, http.StatusBadRequest, "Invalid schema ID")
		return
	}

	schema, err := s.schemaService.GetSchemaByID(r.Context(), id)
	if err != nil {
		s.handleServiceError(w, err)
		return
	}

	s.respondWithJSON(w, http.StatusOK, schema)
}

func (s *apiServer) handleGetSchemaByVersion(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	subject := vars["subject"]
	versionStr := vars["version"]

	var schema *domain.Schema
	var err error

	if versionStr == "latest" {
		schema, err = s.schemaService.GetLatestSchema(r.Context(), subject)
	} else {
		version, parseErr := strconv.Atoi(versionStr)
		if parseErr != nil {
			s.respondWithError(w, http.StatusBadRequest, "Invalid version number")
			return
		}
		schema, err = s.schemaService.GetSchemaByVersion(r.Context(), subject, version)
	}

	if err != nil {
		s.handleServiceError(w, err)
		return
	}

	s.respondWithJSON(w, http.StatusOK, schema)
}

func (s *apiServer) handleGetAllSchemaVersions(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	subject := vars["subject"]

	versions, err := s.schemaService.GetAllVersions(r.Context(), subject)
	if err != nil {
		s.handleServiceError(w, err)
		return
	}

	s.respondWithJSON(w, http.StatusOK, map[string][]int{"versions": versions})
}

type CompatibilityCheckRequest struct {
	SchemaDefinition string `json:"schemaDefinition"`
}

type CompatibilityCheckResponse struct {
	IsCompatible bool   `json:"isCompatible"`
	Reason       string `json:"reason,omitempty"`
}

func (s *apiServer) handleCheckCompatibility(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	subject := vars["subject"]
	versionStr := vars["version"]

	var req CompatibilityCheckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	isCompatible, reason, err := s.schemaService.CheckCompatibility(r.Context(), subject, versionStr, req.SchemaDefinition)
	if err != nil {
		s.handleServiceError(w, err)
		return
	}

	s.respondWithJSON(w, http.StatusOK, CompatibilityCheckResponse{IsCompatible: isCompatible, Reason: reason})
}

type ValidateDataRequest struct {
	Data json.RawMessage `json:"data"`
}

type ValidateDataResponse struct {
	IsValid bool     `json:"isValid"`
	Errors  []string `json:"errors,omitempty"`
}

func (s *apiServer) handleValidateData(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	subject := vars["subject"]
	versionStr := vars["version"]

	var req ValidateDataRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	isValid, validationErrors, err := s.schemaService.ValidateData(r.Context(), subject, versionStr, req.Data)
	if err != nil {
		s.handleServiceError(w, err)
		return
	}

	s.respondWithJSON(w, http.StatusOK, ValidateDataResponse{IsValid: isValid, Errors: validationErrors})
}

// --- AI-Powered Handlers ---

type GenerateSchemaRequest struct {
	Description string            `json:"description"`
	DataType    string            `json:"dataType"` // e.g., "user_profile", "product_event"
	Examples    []json.RawMessage `json:"examples,omitempty"`
}

func (s *apiServer) handleGenerateSchemaFromNL(w http.ResponseWriter, r *http.Request) {
	var req GenerateSchemaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	generatedSchema, err := s.schemaService.GenerateSchemaFromNL(r.Context(), req.Description, req.DataType, req.Examples)
	if err != nil {
		s.handleServiceError(w, err)
		return
	}

	s.respondWithJSON(w, http.StatusOK, generatedSchema)
}

type SemanticCompatibilityRequest struct {
	NewSchemaDefinition string `json:"newSchemaDefinition"`
}

type SemanticCompatibilityResponse struct {
	IsCompatible bool    `json:"isCompatible"`
	Confidence   float64 `json:"confidence"`
	Analysis     string  `json:"analysis"`
}

func (s *apiServer) handleAnalyzeSemanticCompatibility(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	subject := vars["subject"]
	versionStr := vars["version"]

	var req SemanticCompatibilityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	result, err := s.schemaService.AnalyzeSemanticCompatibility(r.Context(), subject, versionStr, req.NewSchemaDefinition)
	if err != nil {
		s.handleServiceError(w, err)
		return
	}

	s.respondWithJSON(w, http.StatusOK, result)
}

// --- Helper Functions ---

func (s *apiServer) respondWithError(w http.ResponseWriter, code int, message string) {
	s.respondWithJSON(w, code, map[string]string{"error": message})
}

func (s *apiServer) respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		s.logger.Error("Failed to marshal JSON response", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "Internal server error"}`))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

func (s *apiServer) handleServiceError(w http.ResponseWriter, err error) {
	s.logger.Error("Service error", zap.Error(err))
	switch e := err.(type) {
	case *domain.ServiceError:
		s.respondWithError(w, e.Code, e.Message)
	default:
		s.respondWithError(w, http.StatusInternalServerError, "An unexpected error occurred")
	}
}

// --- Mock/Placeholder Implementations for compilation ---
// In a real project, these would be in their own packages.

// This is a placeholder for the core SDK.
// It allows the main.go file to compile without the full monorepo.
var _ = func() interface{} {
	// Placeholder for core/sdk/auth
	_ = auth.NewClient
	_ = auth.NewAuthMiddleware
	_ = auth.UserFromContext

	// Placeholder for core/sdk/config
	_ = config.NewLoader[AppConfig]

	// Placeholder for core/sdk/events
	_ = events.NewPublisher

	// Placeholder for core/sdk/logging
	_ = logging.NewProductionLogger
	_ = logging.HTTPMiddleware

	// Placeholder for core/sdk/telemetry
	_ = telemetry.InitProvider
	_ = telemetry.HTTPMiddleware

	// Placeholder for app-specific packages
	_ = aiprovider.NewMultiAIProvider
	_ = storage.NewStore
	_ = services.NewSchemaService
	_ = domain.CompatibilityLevel("")

	return nil
}()

// This block contains dummy implementations to make the file self-contained and compilable.
// In the actual project, these would be provided by other packages.
// This is a common technique for developing a service in isolation.
func init() {
	// This init function sets up dummy implementations if the real packages are not available.
	// This is purely for demonstration and compilation purposes.
	if os.Getenv("ECOSYSTEM_ENV") != "production" {
		// Dummy auth
		auth.NewClient = func(config auth.Config) (auth.Client, error) { return &dummyAuthClient{}, nil }
		auth.NewAuthMiddleware = func(client auth.Client, logger *zap.Logger) auth.Middleware {
			return &dummyAuthMiddleware{}
		}
		auth.UserFromContext = func(ctx context.Context) (*auth.User, bool) {
			return &auth.User{ID: "dummy-user-123", Roles: []string{"admin"}}, true
		}

		// Dummy config
		config.NewLoader = func[T any](appName string) *config.Loader[T] {
			return &config.Loader[T]{
				Load: func(path string) (*T, error) {
					var cfg AppConfig
					// Provide a default config for running standalone
					cfg.Server.Port = "8080"
					cfg.Server.ReadTimeout = 15 * time.Second
					cfg.Server.WriteTimeout = 15 * time.Second
					cfg.Storage.InMemory = true
					cfg.Governance.DefaultCompatibilityLevel = "BACKWARD"
					cfg.Governance.AllowForceRegistration = true
					return any(&cfg).(*T), nil
				},
			}
		}

		// Dummy events
		events.NewPublisher = func(config events.Config) (events.Publisher, error) { return &dummyPublisher{}, nil }

		// Dummy storage
		storage.NewStore = func(storeType, dsn string) (storage.SchemaStore, error) { return &inMemoryStore{schemas: make(map[int]*domain.Schema), subjects: make(map[string]map[int]*domain.Schema), mu: &sync.RWMutex{}}, nil }

		// Dummy AI provider
		aiprovider.NewMultiAIProvider = func(opts ...aiprovider.Option) (aiprovider.Provider, error) {
			return &dummyAIProvider{}, nil
		}
	}
}

// Dummy Auth
type dummyAuthClient struct{}

func (d *dummyAuthClient) ValidateToken(ctx context.Context, token string) (*auth.User, error) {
	return &auth.User{ID: "dummy-user-123", Roles: []string{"admin"}}, nil
}

type dummyAuthMiddleware struct{}

func (d *dummyAuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), auth.UserContextKey, &auth.User{ID: "dummy-user-123", Roles: []string{"admin"}})
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Dummy Publisher
type dummyPublisher struct{}

func (d *dummyPublisher) Publish(ctx context.Context, event events.Event) error {
	fmt.Printf("DUMMY EVENT: Published event '%s' with payload: %s\n", event.Type, string(event.Payload))
	return nil
}

// Dummy AI Provider
type dummyAIProvider struct{}

func (d *dummyAIProvider) GenerateSchema(ctx context.Context, prompt string) (string, error) {
	return `{"type": "object", "properties": {"dummy": {"type": "string"}}}`, nil
}
func (d *dummyAIProvider) AnalyzeSemanticCompatibility(ctx context.Context, prompt string) (string, error) {
	return `{"compatible": true, "confidence": 0.9, "reason": "The new field 'user_id' is semantically equivalent to the old field 'customer_id'."}`, nil
}

// Dummy In-Memory Store
type inMemoryStore struct {
	schemas  map[int]*domain.Schema
	subjects map[string]map[int]*domain.Schema
	mu       *sync.RWMutex
	nextID   int
}

func (s *inMemoryStore) SaveSchema(ctx context.Context, schema *domain.Schema) (*domain.Schema, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.nextID++
	schema.ID = s.nextID
	s.schemas[schema.ID] = schema
	if _, ok := s.subjects[schema.Subject]; !ok {
		s.subjects[schema.Subject] = make(map[int]*domain.Schema)
	}
	s.subjects[schema.Subject][schema.Version] = schema
	return schema, nil
}
func (s *inMemoryStore) FindSchemaByID(ctx context.Context, id int) (*domain.Schema, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if schema, ok := s.schemas[id]; ok {
		return schema, nil
	}
	return nil, domain.ErrSchemaNotFound
}
func (s *inMemoryStore) FindSchemaBySubjectAndVersion(ctx context.Context, subject string, version int) (*domain.Schema, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if versions, ok := s.subjects[subject]; ok {
		if schema, ok := versions[version]; ok {
			return schema, nil
		}
	}
	return nil, domain.ErrSchemaNotFound
}
func (s *inMemoryStore) FindLatestSchemaBySubject(ctx context.Context, subject string) (*domain.Schema, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if versions, ok := s.subjects[subject]; ok {
		maxVersion := 0
		for v := range versions {
			if v > maxVersion {
				maxVersion = v
			}
		}
		if maxVersion > 0 {
			return versions[maxVersion], nil
		}
	}
	return nil, domain.ErrSchemaNotFound
}
func (s *inMemoryStore) FindAllVersionsBySubject(ctx context.Context, subject string) ([]int, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if versions, ok := s.subjects[subject]; ok {
		var versionList []int
		for v := range versions {
			versionList = append(versionList, v)
		}
		return versionList, nil
	}
	return nil, domain.ErrSubjectNotFound
}