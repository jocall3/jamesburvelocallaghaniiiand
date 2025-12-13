// Copyright 2024 The Integrated Application Ecosystem Authors
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

/*
agent_metadata:
  purpose: "Provides a centralized, real-time policy evaluation service for the ecosystem. It decides whether actions are permissible based on a dynamic, extensible rule set, integrating AI for complex policy interpretation and data analysis."
  dependencies:
    - "core_sdk.auth.AuthService": For authenticating incoming requests.
    - "core_sdk.events.EventBus": For publishing audit trail events for every policy decision.
    - "core_sdk.database.KeyValueStore": For storing policy definitions.
    - "External:OpenAI API": For natural language policy interpretation.
    - "External:Google Cloud DLP API": For sensitive data detection within evaluation contexts.
  invalidation_conditions:
    - "Major version change in the core_sdk's event schema or auth token format."
    - "Deprecation of integrated AI vendor APIs (e.g., OpenAI completion models, Google DLP)."
    - "Fundamental change in the ecosystem's data residency or privacy requirements, requiring a new policy storage backend."
  adjacent_apps:
    - "APP_01_Inference_CostRouter": Queries this service to enforce budget and model usage policies.
    - "APP_14_Agents_MultiModelOrchestrator": Queries this service to ensure agent actions comply with operational guardrails.
    - "APP_37_Governance_AuditTrailEngine": Consumes audit events published by this service.
*/

package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"go.uber.org/zap"

	// Placeholder for the shared core SDK
	"core_sdk/auth"
	"core_sdk/config"
	"core_sdk/database"
	"core_sdk/events"
	"core_sdk/logging"
	"core_sdk/observability"

	// Internal packages for this application
	"app_05_governance_policyengine/pkg/evaluator"
	"app_05_governance_policyengine/pkg/integrations"
	"app_05_governance_policyengine/pkg/policy"
	"app_05_governance_policyengine/pkg/storage"
)

// AppConfig holds the application-specific configuration.
type AppConfig struct {
	ServerPort              string `env:"SERVER_PORT" envDefault:"8080"`
	GinMode                 string `env:"GIN_MODE" envDefault:"release"`
	GracefulShutdownTimeout time.Duration `env:"GRACEFUL_SHUTDOWN_TIMEOUT" envDefault:"15s"`
	JurisdictionalFeatures  map[string]bool `env:"JURISDICTIONAL_FEATURES"`

	// AI Vendor Integration Configs
	OpenAIAPIKey      string `env:"OPENAI_API_KEY,required"`
	GoogleCredentialsJSON string `env:"GOOGLE_CREDENTIALS_JSON,required"`
	GoogleProjectID   string `env:"GOOGLE_PROJECT_ID,required"`
}

var (
	logger         *zap.Logger
	policyStore    policy.Store
	policyEvaluator *evaluator.PolicyEvaluator
	eventPublisher events.Publisher
	appVersion     = "0.1.0" // Injected at build time
)

func main() {
	// Load environment variables from .env file
	_ = godotenv.Load()

	// Initialize core services from the SDK
	logger = logging.NewLogger("APP_05_Governance_PolicyEngine")
	defer logger.Sync()

	var appCfg AppConfig
	if err := config.Load(&appCfg); err != nil {
		logger.Fatal("Failed to load application configuration", zap.Error(err))
	}

	// Initialize observability (metrics, tracing)
	observability.InitTracer("APP_05_Governance_PolicyEngine")

	// Initialize shared event bus publisher
	var err error
	eventPublisher, err = events.NewPublisher("policy_events")
	if err != nil {
		logger.Fatal("Failed to initialize event publisher", zap.Error(err))
	}

	// Initialize database connection for policy storage
	db, err := database.NewKeyValueStore("policies")
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	policyStore = storage.NewDBPolicyStore(db)

	// Initialize AI vendor clients
	openAIClient, err := integrations.NewOpenAIClient(appCfg.OpenAIAPIKey)
	if err != nil {
		logger.Fatal("Failed to initialize OpenAI client", zap.Error(err))
	}
	googleDLPClient, err := integrations.NewGoogleDLPClient(context.Background(), appCfg.GoogleProjectID, appCfg.GoogleCredentialsJSON)
	if err != nil {
		logger.Fatal("Failed to initialize Google DLP client", zap.Error(err))
	}

	// Initialize the core policy evaluator with its dependencies
	policyEvaluator = evaluator.NewPolicyEvaluator(policyStore, openAIClient, googleDLPClient, eventPublisher)

	// Set up Gin router
	gin.SetMode(appCfg.GinMode)
	router := gin.New()

	// Middleware stack
	router.Use(logging.GinMiddleware(logger))
	router.Use(observability.GinMiddleware())
	router.Use(gin.Recovery())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "version": appVersion})
	})

	// Self-querying agent endpoints
	setupIntrospectionRoutes(router)

	// API v1 routes
	v1 := router.Group("/v1")
	v1.Use(auth.Middleware()) // Use shared auth middleware
	{
		// Core evaluation endpoint
		v1.POST("/evaluate", handleEvaluatePolicy)

		// Policy management CRUD endpoints
		policies := v1.Group("/policies")
		{
			policies.POST("", handleCreatePolicy)
			policies.GET("", handleListPolicies)
			policies.GET("/:id", handleGetPolicy)
			policies.PUT("/:id", handleUpdatePolicy)
			policies.DELETE("/:id", handleDeletePolicy)
		}
	}

	// Start server
	srv := &http.Server{
		Addr:    ":" + appCfg.ServerPort,
		Handler: router,
	}

	go func() {
		logger.Info("Starting server", zap.String("port", appCfg.ServerPort))
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatal("Could not start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), appCfg.GracefulShutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exiting")
}

// setupIntrospectionRoutes configures the self-querying agent endpoints.
func setupIntrospectionRoutes(r *gin.Engine) {
	r.GET("/introspect", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"appName": "APP_05_Governance_PolicyEngine",
			"version": appVersion,
			"purpose": "Provides a centralized, real-time policy evaluation service for the ecosystem. It decides whether actions are permissible based on a dynamic, extensible rule set, integrating AI for complex policy interpretation and data analysis.",
			"dependencies": []string{
				"core_sdk.auth.AuthService",
				"core_sdk.events.EventBus",
				"core_sdk.database.KeyValueStore",
				"External:OpenAI API",
				"External:Google Cloud DLP API",
			},
			"adjacent_apps": []string{
				"APP_01_Inference_CostRouter",
				"APP_14_Agents_MultiModelOrchestrator",
				"APP_37_Governance_AuditTrailEngine",
			},
		})
	})

	r.GET("/assumptions", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"network": "Assumes reliable, low-latency network access to integrated AI vendor APIs (OpenAI, Google Cloud).",
			"data_contracts": "Assumes that evaluation contexts provided by clients adhere to the documented schema. Malformed contexts may lead to default-deny decisions.",
			"auth": "Assumes the core_sdk.auth service correctly validates and provides user/service identity, which is a critical input for policy evaluation.",
			"performance": "Assumes that policies designated as 'TIER_STATIC' do not require external API calls and can be evaluated with sub-10ms latency. 'TIER_DYNAMIC' policies have variable latency dependent on external services.",
		})
	})

	r.GET("/failure-modes", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"external_api_outage": "If OpenAI or Google DLP APIs are down, 'TIER_DYNAMIC' policy evaluations will fail. The system can be configured to either fail-open (default allow) or fail-closed (default deny).",
			"database_unavailability": "If the policy store is unreachable, the service cannot load policies and will be unable to perform any evaluations. The service will fail health checks.",
			"poisoned_policy": "A poorly written or malicious policy (e.g., a regex that causes catastrophic backtracking) could lead to high CPU usage and slow down evaluations for all users. Resource limits and timeouts are in place to mitigate this.",
			"event_bus_outage": "If the event bus is down, audit events will be lost. The system can be configured to buffer events locally or halt evaluations if auditing is considered critical.",
			"cost_overrun": "Unconstrained use of 'TIER_DYNAMIC' policies that invoke expensive AI models can lead to unexpected high costs. Rate limiting and budget-tracking policies are recommended.",
		})
	})

	r.GET("/update-triggers", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"policy_change": "Any CRUD operation on the /v1/policies endpoint triggers an immediate change in behavior for subsequent evaluations.",
			"sdk_update": "An update to the core_sdk may require a service restart to pick up new auth, logging, or eventing capabilities.",
			"config_change": "Changes to environment variables (e.g., API keys, feature flags) require a service restart to take effect.",
			"vendor_model_update": "If an integrated AI vendor (e.g., OpenAI) updates or deprecates a model used in a 'TIER_DYNAMIC' policy, the policy may need to be updated to maintain its intended behavior.",
		})
	})
}

// handleEvaluatePolicy is the primary endpoint for policy decisions.
// It embodies the tension between Speed (static, local rules) and Safety (dynamic, AI-powered checks).
func handleEvaluatePolicy(c *gin.Context) {
	var req evaluator.EvaluationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	// Extract identity from the context, populated by the auth middleware
	identity, exists := auth.GetIdentity(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Identity not found in request context"})
		return
	}
	req.Principal = identity

	// The core logic is delegated to the evaluator service
	result, err := policyEvaluator.Evaluate(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, policy.ErrPolicyNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		logger.Error("Policy evaluation failed", zap.Error(err), zap.String("policy_id", req.PolicyID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "An internal error occurred during policy evaluation"})
		return
	}

	// The response includes detailed metadata about the evaluation,
	// which is crucial for observability and cost accounting.
	c.JSON(http.StatusOK, result)
}

// --- Policy CRUD Handlers ---

func handleCreatePolicy(c *gin.Context) {
	var p policy.Policy
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	p.Version = 1
	p.CreatedAt = time.Now().UTC()
	p.UpdatedAt = p.CreatedAt

	if err := p.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Policy validation failed", "details": err.Error()})
		return
	}

	if err := policyStore.Create(c.Request.Context(), &p); err != nil {
		logger.Error("Failed to create policy", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store policy"})
		return
	}

	c.JSON(http.StatusCreated, p)
}

func handleListPolicies(c *gin.Context) {
	policies, err := policyStore.List(c.Request.Context())
	if err != nil {
		logger.Error("Failed to list policies", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve policies"})
		return
	}
	c.JSON(http.StatusOK, policies)
}

func handleGetPolicy(c *gin.Context) {
	id := c.Param("id")
	p, err := policyStore.Get(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, policy.ErrPolicyNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		logger.Error("Failed to get policy", zap.Error(err), zap.String("id", id))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve policy"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func handleUpdatePolicy(c *gin.Context) {
	id := c.Param("id")
	var p policy.Policy
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	if err := p.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Policy validation failed", "details": err.Error()})
		return
	}

	// Ensure the ID in the path matches the body
	p.ID = id

	updatedPolicy, err := policyStore.Update(c.Request.Context(), &p)
	if err != nil {
		if errors.Is(err, policy.ErrPolicyNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		logger.Error("Failed to update policy", zap.Error(err), zap.String("id", id))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update policy"})
		return
	}

	c.JSON(http.StatusOK, updatedPolicy)
}

func handleDeletePolicy(c *gin.Context) {
	id := c.Param("id")
	err := policyStore.Delete(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, policy.ErrPolicyNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		logger.Error("Failed to delete policy", zap.Error(err), zap.String("id", id))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete policy"})
		return
	}
	c.Status(http.StatusNoContent)
}

// Dummy implementations for core_sdk packages to make the code runnable for analysis.
// In a real build, these would be provided by the shared SDK.
var _ = func() interface{} {
	// --- core_sdk/auth ---
	auth.GetIdentity = func(c *gin.Context) (auth.Identity, bool) {
		// In a real scenario, this would be populated by the middleware
		// from a JWT or other token.
		return auth.Identity{
			UserID: "user-123",
			Groups: []string{"developers", "beta-testers"},
			Claims: map[string]interface{}{"service_account": "test-runner"},
		}, true
	}
	auth.Middleware = func() gin.HandlerFunc {
		return func(c *gin.Context) {
			// Dummy middleware, just proceeds.
			c.Next()
		}
	}

	// --- core_sdk/events ---
	events.NewPublisher = func(topic string) (events.Publisher, error) {
		return &dummyPublisher{topic: topic}, nil
	}

	// --- core_sdk/database ---
	database.NewKeyValueStore = func(namespace string) (database.KeyValueStore, error) {
		return &dummyKVStore{store: make(map[string][]byte)}, nil
	}

	return nil
}()

type dummyPublisher struct {
	topic string
}

func (p *dummyPublisher) Publish(ctx context.Context, event events.Event) error {
	eventBytes, _ := json.Marshal(event)
	logger.Info("DUMMY_PUBLISH", zap.String("topic", p.topic), zap.String("event", string(eventBytes)))
	return nil
}

type dummyKVStore struct {
	store map[string][]byte
}

func (s *dummyKVStore) Get(ctx context.Context, key string) ([]byte, error) {
	val, ok := s.store[key]
	if !ok {
		return nil, database.ErrNotFound
	}
	return val, nil
}

func (s *dummyKVStore) Set(ctx context.Context, key string, value []byte) error {
	s.store[key] = value
	return nil
}

func (s *dummyKVStore) Delete(ctx context.Context, key string) error {
	delete(s.store, key)
	return nil
}

func (s *dummyKVStore) List(ctx context.Context, prefix string) (map[string][]byte, error) {
	// Simplified list for dummy implementation
	return s.store, nil
}