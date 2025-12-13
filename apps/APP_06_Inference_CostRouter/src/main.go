// Copyright 2024 The Ecosystem Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"os"
	"os/signal"
	"sort"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	// Placeholder for shared ecosystem SDK components.
	// In a real implementation, these would be actual packages.
	"core_sdk/auth"
	"core_sdk/config"
	"core_sdk/events"
	"core_sdk/logging"
	"core_sdk/ontology"
)

// =================================================================================================
// AGENT METADATA (MACHINE-READABLE)
// =================================================================================================

const agentMetadata = `
agent_metadata:
  purpose: "Acts as a high-performance, cost-aware, and latency-sensitive routing layer for large language model (LLM) inference requests. It dynamically selects the optimal provider and model based on real-time performance data, abstracting provider complexity from client applications."
  dependencies:
    - "core_sdk/auth: For securing control plane and proxy endpoints."
    - "core_sdk/events: For publishing audit trails and performance metrics."
    - "core_sdk/logging: For structured, observable logging."
    - "core_sdk/config: For centralized configuration management."
    - "core_sdk/ontology: For standardized data contracts (e.g., InferenceRequest)."
    - "External AI Providers: OpenAI, Anthropic, OpenRouter, etc. (via API)."
  invalidation_conditions:
    - "Significant, unannounced API changes from a major integrated provider."
    - "Sustained network failure preventing communication with all providers."
    - "Compromise of API keys or authentication secrets."
    - "Discovery of a systemic flaw in cost or latency calculation logic."
  adjacent_apps:
    - "APP_10_Billing_TokenAccountant: Consumes event stream from this app to generate invoices."
    - "APP_37_Governance_AuditTrailEngine: Consumes audit events for compliance logging."
    - "APP_14_Agents_MultiModelOrchestrator: Uses this router as its primary inference endpoint."
    - "APP_07_Inference_GatewayCache: Can be deployed in front of this router to cache common requests."
`

// =================================================================================================
// CORE DATA STRUCTURES
// =================================================================================================

// ModelPerformance holds real-time and historical performance data for a specific model.
type ModelPerformance struct {
	ModelID             string    `json:"model_id"`             // e.g., "openai/gpt-4-turbo"
	Provider            string    `json:"provider"`             // e.g., "openai"
	CostPerInputToken   float64   `json:"cost_per_input_token"` // In USD
	CostPerOutputToken  float64   `json:"cost_per_output_token"`// In USD
	AvgLatencyMs        float64   `json:"avg_latency_ms"`       // Exponential moving average of request latency
	AvgTokensPerSecond  float64   `json:"avg_tokens_per_second"`// Exponential moving average of generation speed
	SuccessRate         float64   `json:"success_rate"`         // Exponential moving average of success rate (1.0 = 100%)
	LastUpdated         time.Time `json:"last_updated"`
	TotalRequests       int64     `json:"total_requests"`
	FailureCount        int64     `json:"failure_count"`
	Active              bool      `json:"active"`               // Is this model enabled in the config?
	JurisdictionAllowed bool      `json:"jurisdiction_allowed"` // Controlled by feature flags
}

// Leaderboard manages the performance data for all tracked models.
type Leaderboard struct {
	mu     sync.RWMutex
	models map[string]*ModelPerformance
	logger *logging.Logger
}

// AppConfig holds the application's configuration.
type AppConfig struct {
	ServerPort          int               `json:"server_port"`
	DefaultStrategy     string            `json:"default_strategy"`
	Providers           []ProviderConfig  `json:"providers"`
	Models              []ModelConfig     `json:"models"`
	MetricsEMAAlpha     float64           `json:"metrics_ema_alpha"` // Alpha for exponential moving average
	Jurisdiction        string            `json:"jurisdiction"`      // e.g., "EU", "US"
	EnableDebugProxy    bool              `json:"enable_debug_proxy"`
	Auth                auth.AuthConfig   `json:"auth"`
	EventBus            events.BusConfig  `json:"event_bus"`
	LogLevel            string            `json:"log_level"`
}

// ProviderConfig defines settings for a specific AI provider.
type ProviderConfig struct {
	Name    string `json:"name"` // "openai", "anthropic", "openrouter"
	APIKey  string `json:"api_key"`
	BaseURL string `json:"base_url"`
	Enabled bool   `json:"enabled"`
}

// ModelConfig defines static properties of a model we can route to.
type ModelConfig struct {
	ModelID            string   `json:"model_id"`
	Provider           string   `json:"provider"`
	CostPerInputToken  float64  `json:"cost_per_input_token"`
	CostPerOutputToken float64  `json:"cost_per_output_token"`
	AllowedInJuris     []string `json:"allowed_in_juris"` // List of jurisdictions where this model can be used
	Enabled            bool     `json:"enabled"`
}

// Router is the central component that orchestrates routing logic.
type Router struct {
	config      *AppConfig
	leaderboard *Leaderboard
	providers   map[string]ProviderAdapter
	strategies  map[string]RoutingStrategy
	httpClient  *http.Client
	logger      *logging.Logger
	eventBus    events.EventBusClient
}

// =================================================================================================
// SHARED SDK STUBS (for demonstration purposes)
// =================================================================================================

// In a real system, these would be imported from a shared repository.
// They are defined here to make the code runnable and demonstrate integration points.

// --- core_sdk/logging ---
namespace logging {
	type Logger struct {
		level string
	}
	func NewLogger(level string) *Logger { return &Logger{level: level} }
	func (l *Logger) Info(msg string, args ...interface{}) { log.Printf("[INFO] "+msg, args...) }
	func (l *Logger) Warn(msg string, args ...interface{}) { log.Printf("[WARN] "+msg, args...) }
	func (l *Logger) Error(msg string, args ...interface{}) { log.Printf("[ERROR] "+msg, args...) }
	func (l *Logger) Debug(msg string, args ...interface{}) { if l.level == "debug" { log.Printf("[DEBUG] "+msg, args...) } }
}

// --- core_sdk/auth ---
namespace auth {
	type AuthConfig struct {
		JWTSecret      string `json:"jwt_secret"`
		APIKeyHeader   string `json:"api_key_header"`
		ValidAPIKeys   []string `json:"valid_api_keys"`
	}
	func Middleware(config AuthConfig, logger *logging.Logger) func(http.Handler) http.Handler {
		return func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				apiKey := r.Header.Get(config.APIKeyHeader)
				if apiKey == "" {
					logger.Warn("Auth failed: Missing API key")
					http.Error(w, "Unauthorized: Missing API Key", http.StatusUnauthorized)
					return
				}
				isValid := false
				for _, key := range config.ValidAPIKeys {
					if key == apiKey {
						isValid = true
						break
					}
				}
				if !isValid {
					logger.Warn("Auth failed: Invalid API key")
					http.Error(w, "Unauthorized: Invalid API Key", http.StatusUnauthorized)
					return
				}
				next.ServeHTTP(w, r)
			})
		}
	}
}

// --- core_sdk/events ---
namespace events {
	type BusConfig struct {
		Endpoint string `json:"endpoint"`
		Topic    string `json:"topic"`
	}
	type EventBusClient interface {
		Publish(ctx context.Context, event interface{}) error
	}
	type MockEventBusClient struct {
		logger *logging.Logger
		topic  string
	}
	func NewEventBusClient(config BusConfig, logger *logging.Logger) EventBusClient {
		return &MockEventBusClient{logger: logger, topic: config.Topic}
	}
	func (m *MockEventBusClient) Publish(ctx context.Context, event interface{}) error {
		eventJSON, err := json.Marshal(event)
		if err != nil {
			m.logger.Error("Failed to marshal event: %v", err)
			return err
		}
		m.logger.Info("EVENT PUBLISHED to topic '%s': %s", m.topic, string(eventJSON))
		return nil
	}
}

// --- core_sdk/ontology ---
namespace ontology {
	// Standardized request format across the ecosystem.
	type InferenceRequest struct {
		Model         string        `json:"model"` // Can be a specific model or a capability class like "fastest", "cheapest", "smartest"
		Messages      []Message     `json:"messages"`
		MaxTokens     int           `json:"max_tokens,omitempty"`
		Temperature   float64       `json:"temperature,omitempty"`
		Stream        bool          `json:"stream,omitempty"`
		RoutingPolicy RoutingPolicy `json:"routing_policy,omitempty"`
	}
	type Message struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}
	type RoutingPolicy struct {
		Strategy string            `json:"strategy"` // "cost", "latency", "balanced"
		Constraints map[string]interface{} `json:"constraints"` // e.g., "max_cost": 0.01, "max_latency_ms": 500
	}
	// Standardized response format.
	type InferenceResponse struct {
		ID                string    `json:"id"`
		Object            string    `json:"object"`
		Created           int64     `json:"created"`
		Model             string    `json:"model"` // The actual model used
		Provider          string    `json:"provider"`
		Choices           []Choice  `json:"choices"`
		Usage             Usage     `json:"usage"`
		RoutingDecision   RoutingDecision `json:"routing_decision"`
	}
	type Choice struct {
		Index        int     `json:"index"`
		Message      Message `json:"message"`
		FinishReason string  `json:"finish_reason"`
	}
	type Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	}
	type RoutingDecision struct {
		Strategy  string  `json:"strategy"`
		CandidateModels []string `json:"candidate_models"`
		SelectedModel   string  `json:"selected_model"`
		Reason          string  `json:"reason"`
		LatencyMs       int64   `json:"latency_ms"`
		EstimatedCostUSD float64 `json:"estimated_cost_usd"`
	}
}

// --- core_sdk/config ---
namespace config {
	func LoadConfig(path string, cfg interface{}) error {
		// In a real app, this would load from a file, env vars, or a config service.
		// Here, we'll just populate with defaults for demonstration.
		appCfg := cfg.(*AppConfig)
		appCfg.ServerPort = 8080
		appCfg.DefaultStrategy = "balanced"
		appCfg.MetricsEMAAlpha = 0.1
		appCfg.Jurisdiction = os.Getenv("JURISDICTION")
		if appCfg.Jurisdiction == "" {
			appCfg.Jurisdiction = "US"
		}
		appCfg.EnableDebugProxy = true
		appCfg.LogLevel = "info"

		appCfg.Auth = auth.AuthConfig{
			APIKeyHeader: "X-API-Key",
			ValidAPIKeys: []string{"secret-key-for-dev"},
		}
		appCfg.EventBus = events.BusConfig{
			Endpoint: "mock://eventbus",
			Topic:    "inference-events",
		}

		appCfg.Providers = []ProviderConfig{
			{Name: "openai", APIKey: os.Getenv("OPENAI_API_KEY"), BaseURL: "https://api.openai.com/v1", Enabled: os.Getenv("OPENAI_API_KEY") != ""},
			{Name: "anthropic", APIKey: os.Getenv("ANTHROPIC_API_KEY"), BaseURL: "https://api.anthropic.com/v1", Enabled: os.Getenv("ANTHROPIC_API_KEY") != ""},
			{Name: "openrouter", APIKey: os.Getenv("OPENROUTER_API_KEY"), BaseURL: "https://openrouter.ai/api/v1", Enabled: os.Getenv("OPENROUTER_API_KEY") != ""},
		}

		appCfg.Models = []ModelConfig{
			{ModelID: "openai/gpt-4-turbo", Provider: "openai", CostPerInputToken: 0.000010, CostPerOutputToken: 0.000030, AllowedInJuris: []string{"US", "EU"}, Enabled: true},
			{ModelID: "openai/gpt-3.5-turbo", Provider: "openai", CostPerInputToken: 0.0000005, CostPerOutputToken: 0.0000015, AllowedInJuris: []string{"US", "EU"}, Enabled: true},
			{ModelID: "anthropic/claude-3-opus-20240229", Provider: "anthropic", CostPerInputToken: 0.000015, CostPerOutputToken: 0.000075, AllowedInJuris: []string{"US"}, Enabled: true},
			{ModelID: "anthropic/claude-3-sonnet-20240229", Provider: "anthropic", CostPerInputToken: 0.000003, CostPerOutputToken: 0.000015, AllowedInJuris: []string{"US", "EU"}, Enabled: true},
			{ModelID: "google/gemini-pro", Provider: "openrouter", CostPerInputToken: 0.00000025, CostPerOutputToken: 0.0000005, AllowedInJuris: []string{"US", "EU"}, Enabled: true},
			{ModelID: "mistralai/mistral-7b-instruct", Provider: "openrouter", CostPerInputToken: 0.0000002, CostPerOutputToken: 0.0000002, AllowedInJuris: []string{"US", "EU"}, Enabled: true},
		}
		return nil
	}
}

// =================================================================================================
// LEADERBOARD IMPLEMENTATION
// =================================================================================================

func NewLeaderboard(logger *logging.Logger) *Leaderboard {
	return &Leaderboard{
		models: make(map[string]*ModelPerformance),
		logger: logger,
	}
}

// Initialize populates the leaderboard with static data from the config.
func (l *Leaderboard) Initialize(cfg *AppConfig) {
	l.mu.Lock()
	defer l.mu.Unlock()

	for _, modelCfg := range cfg.Models {
		isAllowed := false
		for _, j := range modelCfg.AllowedInJuris {
			if j == cfg.Jurisdiction {
				isAllowed = true
				break
			}
		}

		providerEnabled := false
		for _, p := range cfg.Providers {
			if p.Name == modelCfg.Provider && p.Enabled {
				providerEnabled = true
				break
			}
		}

		l.models[modelCfg.ModelID] = &ModelPerformance{
			ModelID:            modelCfg.ModelID,
			Provider:           modelCfg.Provider,
			CostPerInputToken:  modelCfg.CostPerInputToken,
			CostPerOutputToken: modelCfg.CostPerOutputToken,
			AvgLatencyMs:       2000, // Start with a pessimistic default
			AvgTokensPerSecond: 50,   // Start with a reasonable default
			SuccessRate:        0.98, // Start with an optimistic default
			LastUpdated:        time.Now(),
			Active:             modelCfg.Enabled && providerEnabled,
			JurisdictionAllowed: isAllowed,
		}
	}
	l.logger.Info("Leaderboard initialized with %d models", len(l.models))
}

// UpdateModelMetrics updates a model's performance data after a request.
func (l *Leaderboard) UpdateModelMetrics(modelID string, latency time.Duration, tokensGenerated int, success bool) {
	l.mu.Lock()
	defer l.mu.Unlock()

	model, ok := l.models[modelID]
	if !ok {
		l.logger.Warn("Attempted to update metrics for unknown model: %s", modelID)
		return
	}

	alpha := 0.1 // EMA smoothing factor, could be configurable

	// Update latency
	model.AvgLatencyMs = (1-alpha)*model.AvgLatencyMs + alpha*float64(latency.Milliseconds())

	// Update tokens per second
	if success && latency.Seconds() > 0 && tokensGenerated > 0 {
		tps := float64(tokensGenerated) / latency.Seconds()
		model.AvgTokensPerSecond = (1-alpha)*model.AvgTokensPerSecond + alpha*tps
	}

	// Update success rate
	var currentSuccess float64
	if success {
		currentSuccess = 1.0
	}
	model.SuccessRate = (1-alpha)*model.SuccessRate + alpha*currentSuccess

	model.TotalRequests++
	if !success {
		model.FailureCount++
	}

	model.LastUpdated = time.Now()
}

// GetRankedModels returns a list of active models, sorted according to a provided less function.
func (l *Leaderboard) GetRankedModels(less func(p1, p2 *ModelPerformance) bool) []*ModelPerformance {
	l.mu.RLock()
	defer l.mu.RUnlock()

	var activeModels []*ModelPerformance
	for _, model := range l.models {
		if model.Active && model.JurisdictionAllowed {
			activeModels = append(activeModels, model)
		}
	}

	sort.Slice(activeModels, func(i, j int) bool {
		return less(activeModels[i], activeModels[j])
	})

	return activeModels
}

// GetModel returns performance data for a single model.
func (l *Leaderboard) GetModel(modelID string) (*ModelPerformance, bool) {
	l.mu.RLock()
	defer l.mu.RUnlock()
	model, ok := l.models[modelID]
	return model, ok
}

// =================================================================================================
// PROVIDER ADAPTERS
// =================================================================================================

// ProviderAdapter defines the interface for communicating with a specific AI provider.
type ProviderAdapter interface {
	Name() string
	Execute(ctx context.Context, req *ontology.InferenceRequest, modelID string) (*ontology.InferenceResponse, error)
}

// --- OpenAI Adapter ---
type OpenAIAdapter struct {
	config     ProviderConfig
	httpClient *http.Client
	logger     *logging.Logger
}

func NewOpenAIAdapter(config ProviderConfig, client *http.Client, logger *logging.Logger) *OpenAIAdapter {
	return &OpenAIAdapter{config: config, httpClient: client, logger: logger}
}

func (a *OpenAIAdapter) Name() string { return "openai" }

func (a *OpenAIAdapter) Execute(ctx context.Context, req *ontology.InferenceRequest, modelID string) (*ontology.InferenceResponse, error) {
	// 1. Translate from ontology.InferenceRequest to OpenAI-specific format
	openaiReqBody := map[string]interface{}{
		"model":       strings.TrimPrefix(modelID, "openai/"),
		"messages":    req.Messages,
		"max_tokens":  req.MaxTokens,
		"temperature": req.Temperature,
		"stream":      req.Stream,
	}
	if req.MaxTokens == 0 {
		openaiReqBody["max_tokens"] = 4096 // A reasonable default
	}

	bodyBytes, err := json.Marshal(openaiReqBody)
	if err != nil {
		return nil, fmt.Errorf("openai adapter: failed to marshal request: %w", err)
	}

	// 2. Create and send HTTP request
	httpReq, err := http.NewRequestWithContext(ctx, "POST", a.config.BaseURL+"/chat/completions", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("openai adapter: failed to create http request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+a.config.APIKey)

	httpResp, err := a.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("openai adapter: http request failed: %w", err)
	}
	defer httpResp.Body.Close()

	respBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, fmt.Errorf("openai adapter: failed to read response body: %w", err)
	}

	if httpResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openai adapter: received non-200 status: %d - %s", httpResp.StatusCode, string(respBody))
	}

	// 3. Translate from OpenAI-specific response to ontology.InferenceResponse
	var openaiResp struct {
		ID      string `json:"id"`
		Object  string `json:"object"`
		Created int64  `json:"created"`
		Model   string `json:"model"`
		Choices []struct {
			Index        int `json:"index"`
			Message      ontology.Message `json:"message"`
			FinishReason string `json:"finish_reason"`
		} `json:"choices"`
		Usage ontology.Usage `json:"usage"`
	}

	if err := json.Unmarshal(respBody, &openaiResp); err != nil {
		return nil, fmt.Errorf("openai adapter: failed to unmarshal response: %w", err)
	}

	if len(openaiResp.Choices) == 0 {
		return nil, fmt.Errorf("openai adapter: response contained no choices")
	}

	// Re-assemble into standard format
	choices := make([]ontology.Choice, len(openaiResp.Choices))
	for i, c := range openaiResp.Choices {
		choices[i] = ontology.Choice{
			Index:        c.Index,
			Message:      c.Message,
			FinishReason: c.FinishReason,
		}
	}

	return &ontology.InferenceResponse{
		ID:       openaiResp.ID,
		Object:   openaiResp.Object,
		Created:  openaiResp.Created,
		Model:    modelID, // Use our internal, fully-qualified model ID
		Provider: a.Name(),
		Choices:  choices,
		Usage:    openaiResp.Usage,
	}, nil
}

// --- Anthropic Adapter ---
type AnthropicAdapter struct {
	config     ProviderConfig
	httpClient *http.Client
	logger     *logging.Logger
}

func NewAnthropicAdapter(config ProviderConfig, client *http.Client, logger *logging.Logger) *AnthropicAdapter {
	return &AnthropicAdapter{config: config, httpClient: client, logger: logger}
}

func (a *AnthropicAdapter) Name() string { return "anthropic" }

func (a *AnthropicAdapter) Execute(ctx context.Context, req *ontology.InferenceRequest, modelID string) (*ontology.InferenceResponse, error) {
	// 1. Translate to Anthropic format
	anthropicReqBody := map[string]interface{}{
		"model":        strings.TrimPrefix(modelID, "anthropic/"),
		"messages":     req.Messages,
		"max_tokens":   req.MaxTokens,
		"temperature":  req.Temperature,
		"stream":       req.Stream,
	}
	if req.MaxTokens == 0 {
		anthropicReqBody["max_tokens"] = 4096
	}

	bodyBytes, err := json.Marshal(anthropicReqBody)
	if err != nil {
		return nil, fmt.Errorf("anthropic adapter: failed to marshal request: %w", err)
	}

	// 2. Create and send HTTP request
	httpReq, err := http.NewRequestWithContext(ctx, "POST", a.config.BaseURL+"/messages", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("anthropic adapter: failed to create http request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", a.config.APIKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")

	httpResp, err := a.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("anthropic adapter: http request failed: %w", err)
	}
	defer httpResp.Body.Close()

	respBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, fmt.Errorf("anthropic adapter: failed to read response body: %w", err)
	}

	if httpResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("anthropic adapter: received non-200 status: %d - %s", httpResp.StatusCode, string(respBody))
	}

	// 3. Translate from Anthropic response to ontology format
	var anthropicResp struct {
		ID      string `json:"id"`
		Type    string `json:"type"`
		Role    string `json:"role"`
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
		Model        string `json:"model"`
		StopReason   string `json:"stop_reason"`
		Usage struct {
			InputTokens  int `json:"input_tokens"`
			OutputTokens int `json:"output_tokens"`
		} `json:"usage"`
	}

	if err := json.Unmarshal(respBody, &anthropicResp); err != nil {
		return nil, fmt.Errorf("anthropic adapter: failed to unmarshal response: %w", err)
	}

	if len(anthropicResp.Content) == 0 || anthropicResp.Content[0].Type != "text" {
		return nil, fmt.Errorf("anthropic adapter: unexpected response content format")
	}

	return &ontology.InferenceResponse{
		ID:       anthropicResp.ID,
		Object:   "chat.completion",
		Created:  time.Now().Unix(),
		Model:    modelID,
		Provider: a.Name(),
		Choices: []ontology.Choice{
			{
				Index: 0,
				Message: ontology.Message{
					Role:    "assistant",
					Content: anthropicResp.Content[0].Text,
				},
				FinishReason: anthropicResp.StopReason,
			},
		},
		Usage: ontology.Usage{
			PromptTokens:     anthropicResp.Usage.InputTokens,
			CompletionTokens: anthropicResp.Usage.OutputTokens,
			TotalTokens:      anthropicResp.Usage.InputTokens + anthropicResp.Usage.OutputTokens,
		},
	}, nil
}

// --- OpenRouter Adapter (Meta-Provider) ---
type OpenRouterAdapter struct {
	config     ProviderConfig
	httpClient *http.Client
	logger     *logging.Logger
}

func NewOpenRouterAdapter(config ProviderConfig, client *http.Client, logger *logging.Logger) *OpenRouterAdapter {
	return &OpenRouterAdapter{config: config, httpClient: client, logger: logger}
}

func (a *OpenRouterAdapter) Name() string { return "openrouter" }

func (a *OpenRouterAdapter) Execute(ctx context.Context, req *ontology.InferenceRequest, modelID string) (*ontology.InferenceResponse, error) {
	// OpenRouter uses an OpenAI-compatible API, so this is very similar to the OpenAI adapter.
	// The key difference is that the model ID is passed directly.
	openrouterReqBody := map[string]interface{}{
		"model":       modelID, // Pass the full model ID, e.g., "google/gemini-pro"
		"messages":    req.Messages,
		"max_tokens":  req.MaxTokens,
		"temperature": req.Temperature,
		"stream":      req.Stream,
	}
	if req.MaxTokens == 0 {
		openrouterReqBody["max_tokens"] = 4096
	}

	bodyBytes, err := json.Marshal(openrouterReqBody)
	if err != nil {
		return nil, fmt.Errorf("openrouter adapter: failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", a.config.BaseURL+"/chat/completions", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("openrouter adapter: failed to create http request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+a.config.APIKey)
	httpReq.Header.Set("HTTP-Referer", "https://ecosystem.dev") // Recommended by OpenRouter
	httpReq.Header.Set("X-Title", "Ecosystem Cost Router")      // Recommended by OpenRouter

	httpResp, err := a.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("openrouter adapter: http request failed: %w", err)
	}
	defer httpResp.Body.Close()

	respBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, fmt.Errorf("openrouter adapter: failed to read response body: %w", err)
	}

	if httpResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openrouter adapter: received non-200 status: %d - %s", httpResp.StatusCode, string(respBody))
	}

	// The response format is OpenAI-compatible, so we can reuse the parsing logic.
	var openrouterResp struct {
		ID      string `json:"id"`
		Object  string `json:"object"`
		Created int64  `json:"created"`
		Model   string `json:"model"`
		Choices []struct {
			Index        int `json:"index"`
			Message      ontology.Message `json:"message"`
			FinishReason string `json:"finish_reason"`
		} `json:"choices"`
		Usage ontology.Usage `json:"usage"`
	}

	if err := json.Unmarshal(respBody, &openrouterResp); err != nil {
		return nil, fmt.Errorf("openrouter adapter: failed to unmarshal response: %w", err)
	}

	if len(openrouterResp.Choices) == 0 {
		return nil, fmt.Errorf("openrouter adapter: response contained no choices")
	}

	choices := make([]ontology.Choice, len(openrouterResp.Choices))
	for i, c := range openrouterResp.Choices {
		choices[i] = ontology.Choice{
			Index:        c.Index,
			Message:      c.Message,
			FinishReason: c.FinishReason,
		}
	}

	return &ontology.InferenceResponse{
		ID:       openrouterResp.ID,
		Object:   openrouterResp.Object,
		Created:  openrouterResp.Created,
		Model:    modelID, // Use our internal ID
		Provider: a.Name(),
		Choices:  choices,
		Usage:    openrouterResp.Usage,
	}, nil
}

// =================================================================================================
// ROUTING STRATEGIES
// =================================================================================================

// RoutingStrategy defines the interface for model selection algorithms.
// This is where the core tension of the application (Cost vs. Latency vs. Quality) is encoded.
type RoutingStrategy interface {
	Name() string
	SelectModel(candidates []*ModelPerformance, req *ontology.InferenceRequest) (*ModelPerformance, string)
}

// --- Lowest Cost Strategy ---
type LowestCostStrategy struct{}

func (s *LowestCostStrategy) Name() string { return "cost" }
func (s *LowestCostStrategy) SelectModel(candidates []*ModelPerformance, req *ontology.InferenceRequest) (*ModelPerformance, string) {
	if len(candidates) == 0 {
		return nil, "No active models available."
	}
	// Sort by estimated cost. We need to estimate output tokens to do this.
	// A simple heuristic: assume output is 1.5x input length, capped by max_tokens.
	// Enterprise upsell: Use a small, fast model to predict output length for more accurate costing.
	inputTokens := 0
	for _, msg := range req.Messages {
		inputTokens += len(msg.Content) / 4 // Rough estimate
	}
	
	estimatedOutputTokens := int(float64(inputTokens) * 1.5)
	if req.MaxTokens > 0 && estimatedOutputTokens > req.MaxTokens {
		estimatedOutputTokens = req.MaxTokens
	}

	sort.Slice(candidates, func(i, j int) bool {
		costI := float64(inputTokens)*candidates[i].CostPerInputToken + float64(estimatedOutputTokens)*candidates[i].CostPerOutputToken
		costJ := float64(inputTokens)*candidates[j].CostPerInputToken + float64(estimatedOutputTokens)*candidates[j].CostPerOutputToken
		return costI < costJ
	})

	return candidates[0], fmt.Sprintf("Selected lowest cost model. Estimated cost: $%.6f",
		float64(inputTokens)*candidates[0].CostPerInputToken+float64(estimatedOutputTokens)*candidates[0].CostPerOutputToken)
}

// --- Lowest Latency Strategy ---
type LowestLatencyStrategy struct{}

func (s *LowestLatencyStrategy) Name() string { return "latency" }
func (s *LowestLatencyStrategy) SelectModel(candidates []*ModelPerformance, req *ontology.InferenceRequest) (*ModelPerformance, string) {
	if len(candidates) == 0 {
		return nil, "No active models available."
	}
	// Sort by average latency.
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].AvgLatencyMs < candidates[j].AvgLatencyMs
	})
	return candidates[0], fmt.Sprintf("Selected lowest latency model. EMA Latency: %.2fms", candidates[0].AvgLatencyMs)
}

// --- Balanced Strategy ---
// This strategy embodies the core design tension by creating a weighted score.
// Enterprise upsell: Allow users to define their own scoring function or weights.
type BalancedStrategy struct {
	CostWeight    float64
	LatencyWeight float64
	QualityWeight float64 // Quality is proxied by success rate and tokens/sec
}

func (s *BalancedStrategy) Name() string { return "balanced" }
func (s *BalancedStrategy) SelectModel(candidates []*ModelPerformance, req *ontology.InferenceRequest) (*ModelPerformance, string) {
	if len(candidates) == 0 {
		return nil, "No active models available."
	}

	// Normalize metrics to a 0-1 scale to make them comparable.
	minCost, maxCost := 1e9, 0.0
	minLatency, maxLatency := 1e9, 0.0
	minTps, maxTps := 1e9, 0.0

	inputTokens := 0
	for _, msg := range req.Messages {
		inputTokens += len(msg.Content) / 4
	}
	estimatedOutputTokens := int(float64(inputTokens) * 1.5)
	if req.MaxTokens > 0 && estimatedOutputTokens > req.MaxTokens {
		estimatedOutputTokens = req.MaxTokens
	}

	costs := make(map[string]float64)
	for _, c := range candidates {
		cost := float64(inputTokens)*c.CostPerInputToken + float64(estimatedOutputTokens)*c.CostPerOutputToken
		costs[c.ModelID] = cost
		if cost < minCost { minCost = cost }
		if cost > maxCost { maxCost = cost }
		if c.AvgLatencyMs < minLatency { minLatency = c.AvgLatencyMs }
		if c.AvgLatencyMs > maxLatency { maxLatency = c.AvgLatencyMs }
		if c.AvgTokensPerSecond < minTps { minTps = c.AvgTokensPerSecond }
		if c.AvgTokensPerSecond > maxTps { maxTps = c.AvgTokensPerSecond }
	}

	var bestModel *ModelPerformance
	var bestScore float64 = -1e9

	for _, c := range candidates {
		// Normalize: lower is better for cost/latency, higher is better for quality.
		// Avoid division by zero if all values are the same.
		normCost := 0.5
		if maxCost > minCost {
			normCost = 1 - (costs[c.ModelID]-minCost)/(maxCost-minCost)
		}
		
		normLatency := 0.5
		if maxLatency > minLatency {
			normLatency = 1 - (c.AvgLatencyMs-minLatency)/(maxLatency-minLatency)
		}

		normTps := 0.5
		if maxTps > minTps {
			normTps = (c.AvgTokensPerSecond - minTps) / (maxTps - minTps)
		}
		
		// Quality score is a mix of success rate and throughput.
		qualityScore := c.SuccessRate * normTps

		// Final weighted score. Higher is better.
		score := s.CostWeight*normCost + s.LatencyWeight*normLatency + s.QualityWeight*qualityScore
		
		if score > bestScore {
			bestScore = score
			bestModel = c
		}
	}

	if bestModel == nil {
		return candidates[0], "Balanced strategy failed to find optimal model, falling back to first available."
	}

	return bestModel, fmt.Sprintf("Selected balanced model with score %.4f", bestScore)
}

// =================================================================================================
// CORE ROUTER ENGINE
// =================================================================================================

func NewRouter(cfg *AppConfig, logger *logging.Logger) (*Router, error) {
	leaderboard := NewLeaderboard(logger)
	leaderboard.Initialize(cfg)

	httpClient := &http.Client{
		Timeout: 60 * time.Second,
	}

	providers := make(map[string]ProviderAdapter)
	for _, pCfg := range cfg.Providers {
		if !pCfg.Enabled {
			continue
		}
		switch pCfg.Name {
		case "openai":
			providers[pCfg.Name] = NewOpenAIAdapter(pCfg, httpClient, logger)
		case "anthropic":
			providers[pCfg.Name] = NewAnthropicAdapter(pCfg, httpClient, logger)
		case "openrouter":
			providers[pCfg.Name] = NewOpenRouterAdapter(pCfg, httpClient, logger)
		default:
			logger.Warn("Unknown provider in config: %s", pCfg.Name)
		}
	}

	strategies := map[string]RoutingStrategy{
		"cost":    &LowestCostStrategy{},
		"latency": &LowestLatencyStrategy{},
		"balanced": &BalancedStrategy{
			CostWeight:    0.4,
			LatencyWeight: 0.3,
			QualityWeight: 0.3,
		},
	}

	eventBus := events.NewEventBusClient(cfg.EventBus, logger)

	return &Router{
		config:      cfg,
		leaderboard: leaderboard,
		providers:   providers,
		strategies:  strategies,
		httpClient:  httpClient,
		logger:      logger,
		eventBus:    eventBus,
	}, nil
}

func (r *Router) Route(ctx context.Context, req *ontology.InferenceRequest) (*ontology.InferenceResponse, error) {
	startTime := time.Now()

	// 1. Determine routing strategy
	strategyName := r.config.DefaultStrategy
	if req.RoutingPolicy.Strategy != "" {
		strategyName = req.RoutingPolicy.Strategy
	}
	strategy, ok := r.strategies[strategyName]
	if !ok {
		return nil, fmt.Errorf("unknown routing strategy: %s", strategyName)
	}

	// 2. Get candidate models
	// TODO: Add filtering based on request capabilities (e.g., tool use, vision)
	candidates := r.leaderboard.GetRankedModels(func(p1, p2 *ModelPerformance) bool {
		return p1.ModelID < p2.ModelID // Default sort, strategy will re-sort
	})
	
	candidateNames := make([]string, len(candidates))
	for i, c := range candidates {
		candidateNames[i] = c.ModelID
	}

	// 3. Select the best model using the strategy
	selectedModel, reason := strategy.SelectModel(candidates, req)
	if selectedModel == nil {
		return nil, fmt.Errorf("routing failed: %s", reason)
	}

	// 4. Get the provider adapter for the selected model
	provider, ok := r.providers[selectedModel.Provider]
	if !ok {
		return nil, fmt.Errorf("no enabled provider found for selected model '%s'", selectedModel.ModelID)
	}

	// 5. Execute the request via the adapter
	r.logger.Info("Routing request to %s via %s. Reason: %s", selectedModel.ModelID, provider.Name(), reason)
	resp, err := provider.Execute(ctx, req, selectedModel.ModelID)
	
	latency := time.Since(startTime)
	success := err == nil

	// 6. Update leaderboard with performance metrics
	tokensGenerated := 0
	if success {
		tokensGenerated = resp.Usage.CompletionTokens
	}
	r.leaderboard.UpdateModelMetrics(selectedModel.ModelID, latency, tokensGenerated, success)

	if !success {
		return nil, fmt.Errorf("provider execution failed for %s: %w", selectedModel.ModelID, err)
	}

	// 7. Augment response with routing decision metadata
	estimatedCost := selectedModel.CostPerInputToken * float64(resp.Usage.PromptTokens) +
		selectedModel.CostPerOutputToken * float64(resp.Usage.CompletionTokens)

	resp.RoutingDecision = ontology.RoutingDecision{
		Strategy:        strategy.Name(),
		CandidateModels: candidateNames,
		SelectedModel:   selectedModel.ModelID,
		Reason:          reason,
		LatencyMs:       latency.Milliseconds(),
		EstimatedCostUSD: estimatedCost,
	}

	// 8. Publish audit/billing event
	event := map[string]interface{}{
		"eventType": "InferenceCompleted",
		"requestID": resp.ID,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"response":  resp,
	}
	go r.eventBus.Publish(context.Background(), event)

	return resp, nil
}

// =================================================================================================
// HTTP HANDLERS & SERVER
// =================================================================================================

func (r *Router) proxyHandler(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(req.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}

	var inferenceReq ontology.InferenceRequest
	if err := json.Unmarshal(body, &inferenceReq); err != nil {
		http.Error(w, "Invalid JSON request body", http.StatusBadRequest)
		return
	}

	// If debug proxy is enabled, dump the request
	if r.config.EnableDebugProxy {
		dump, _ := httputil.DumpRequest(req, true)
		r.logger.Debug("Inbound request dump:\n%s", string(dump))
	}

	resp, err := r.Route(req.Context(), &inferenceReq)
	if err != nil {
		r.logger.Error("Routing failed: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

func (r *Router) adminLeaderboardHandler(w http.ResponseWriter, req *http.Request) {
	models := r.leaderboard.GetRankedModels(func(p1, p2 *ModelPerformance) bool {
		return p1.ModelID < p2.ModelID
	})
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models)
}

func (r *Router) adminConfigHandler(w http.ResponseWriter, req *http.Request) {
	// Redact sensitive info like API keys before returning
	safeConfig := *r.config
	for i := range safeConfig.Providers {
		if len(safeConfig.Providers[i].APIKey) > 4 {
			safeConfig.Providers[i].APIKey = "REDACTED_..." + safeConfig.Providers[i].APIKey[len(safeConfig.Providers[i].APIKey)-4:]
		}
	}
	safeConfig.Auth.JWTSecret = "REDACTED"
	safeConfig.Auth.ValidAPIKeys = []string{"REDACTED"}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(safeConfig)
}

// --- Self-Querying Agent Endpoints ---

func (r *Router) introspectHandler(w http.ResponseWriter, req *http.Request) {
	type IntrospectionData struct {
		AppName         string   `json:"app_name"`
		ActiveModels    int      `json:"active_models"`
		AvailableProviders []string `json:"available_providers"`
		AvailableStrategies []string `json:"available_strategies"`
		CurrentStrategy string   `json:"current_strategy"`
	}
	
	providers := []string{}
	for name := range r.providers {
		providers = append(providers, name)
	}
	strategies := []string{}
	for name := range r.strategies {
		strategies = append(strategies, name)
	}

	data := IntrospectionData{
		AppName:         "APP_06_Inference_CostRouter",
		ActiveModels:    len(r.leaderboard.GetRankedModels(func(p1, p2 *ModelPerformance) bool { return p1.ModelID < p2.ModelID })),
		AvailableProviders: providers,
		AvailableStrategies: strategies,
		CurrentStrategy: r.config.DefaultStrategy,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func (r *Router) assumptionsHandler(w http.ResponseWriter, req *http.Request) {
	assumptions := map[string]string{
		"CostModel": "Costs are based on static, pre-configured per-token rates. Does not account for volume discounts or reserved throughput.",
		"LatencyModel": "Latency is measured as an exponential moving average (EMA) of end-to-end request time. This assumes future performance is related to recent past performance.",
		"QualityProxy": "Model 'quality' is not directly measured. The 'balanced' strategy uses success rate and tokens/second as a rough proxy for quality and performance.",
		"Network": "Assumes reliable, low-latency network connectivity to all provider APIs.",
		"Tokenization": "Token counts are based on provider-returned data. Input token estimation for cost prediction is a rough heuristic (1 token ~ 4 chars).",
		"APICompatibility": "Assumes provider APIs remain stable and conform to the implemented adapter logic.",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assumptions)
}

func (r *Router) failureModesHandler(w http.ResponseWriter, req *http.Request) {
	failureModes := map[string]string{
		"ProviderOutage": "If a provider's API is down, its models' success rates will plummet, causing them to be de-prioritized automatically. If all providers are down, all requests will fail.",
		"CascadingFailure": "A slow provider could increase latency for all requests if it's consistently chosen, potentially causing client timeouts. The EMA-based leaderboard is designed to mitigate this by quickly down-ranking slow models.",
		"ConfigurationError": "Incorrect API keys or model cost data in the config will lead to failed requests or incorrect billing.",
		"Throttling": "Sudden rate limiting from a provider will manifest as increased failures and latency, causing the router to shift traffic away from that provider.",
		"ColdStartPenalty": "A new or rarely used model may have a default pessimistic latency, preventing it from being selected. It may require manual intervention or a 'warm-up' period to gather accurate metrics.",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(failureModes)
}

func (r *Router) updateTriggersHandler(w http.ResponseWriter, req *http.Request) {
	triggers := map[string]string{
		"LeaderboardUpdate": "The model performance leaderboard is updated in real-time after every processed request.",
		"ConfigurationChange": "The application must be restarted to apply changes to the static configuration (e.g., adding a new model, changing API keys). Enterprise upsell: Implement hot-reloading of configuration.",
		"JurisdictionChange": "Changing the JURISDICTION environment variable and restarting will re-evaluate which models are eligible for routing based on their 'allowed_in_juris' configuration.",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(triggers)
}

// =================================================================================================
// MAIN FUNCTION
// =================================================================================================

func main() {
	// --- Initialization ---
	logger := logging.NewLogger("info")
	logger.Info("Starting APP_06_Inference_CostRouter...")

	var appConfig AppConfig
	if err := config.LoadConfig("", &appConfig); err != nil {
		logger.Error("Failed to load configuration: %v", err)
		os.Exit(1)
	}
	
	if level, err := strconv.Atoi(os.Getenv("LOG_LEVEL")); err == 0 && level > 0 {
		appConfig.LogLevel = "debug"
	}
	logger.level = appConfig.LogLevel

	router, err := NewRouter(&appConfig, logger)
	if err != nil {
		logger.Error("Failed to initialize router: %v", err)
		os.Exit(1)
	}

	// --- HTTP Server Setup ---
	mux := http.NewServeMux()

	// Public/Proxy Endpoint
	proxyMux := http.NewServeMux()
	proxyMux.HandleFunc("/v1/chat/completions", router.proxyHandler)
	// Apply auth middleware to the proxy endpoints
	authedProxyHandler := auth.Middleware(appConfig.Auth, logger)(proxyMux)
	mux.Handle("/v1/", authedProxyHandler)

	// Admin/Control Plane Endpoints
	adminMux := http.NewServeMux()
	adminMux.HandleFunc("/leaderboard", router.adminLeaderboardHandler)
	adminMux.HandleFunc("/config", router.adminConfigHandler)
	// Apply auth middleware to the admin endpoints
	authedAdminHandler := auth.Middleware(appConfig.Auth, logger)(adminMux)
	mux.Handle("/admin/", authedAdminHandler)

	// Self-Querying Agent Endpoints (typically not behind strict auth, but could be)
	mux.HandleFunc("/introspect", router.introspectHandler)
	mux.HandleFunc("/assumptions", router.assumptionsHandler)
	mux.HandleFunc("/failure-modes", router.failureModesHandler)
	mux.HandleFunc("/update-triggers", router.updateTriggersHandler)

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", appConfig.ServerPort),
		Handler: mux,
	}

	// --- Graceful Shutdown ---
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Info("Server listening on port %d", appConfig.ServerPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("Could not listen on %s: %v\n", server.Addr, err)
			os.Exit(1)
		}
	}()

	<-stop

	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error("Server shutdown failed: %v", err)
	} else {
		logger.Info("Server gracefully stopped")
	}
}