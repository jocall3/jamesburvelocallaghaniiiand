// apps/APP_04_Analysis_FounderBackgroundScorer/src/main.go

// Package main provides the core service for scoring founder backgrounds.
// It integrates with various data sources, leverages AI for entity and relationship extraction,
// and stores this information in a graph database for complex querying and analysis.
//
// This service is designed to be independently deployable while adhering to a shared
// ecosystem protocol, authentication model, and data contracts.
//
// License: Apache License 2.0
//
// Copyright 2024 The FounderBackgroundScorer Authors
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
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	// External dependencies for robust production-grade service
	"github.com/gin-gonic/gin"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
	"github.com/spf13/viper"

	// Simulated internal project dependencies
	// These packages would be part of the shared core SDK and ecosystem.
	"core_sdk/auth"          // Shared authentication and authorization client
	"core_sdk/eventbus"      // Typed event bus for inter-service communication
	"core_sdk/ontology"      // Unified ontology for common concepts and data contracts
	"core_sdk/telemetry"     // Observability: metrics, tracing, logging
	"core_sdk/config"        // Centralized configuration management (though viper is used directly here)
	"core_sdk/audit"         // Audit logging hooks
	"core_sdk/featureflags"  // Centralized feature flag management
)

// agent_metadata:
//   purpose: This application, APP_04_Analysis_FounderBackgroundScorer, is designed to provide
//            a robust, AI-powered platform for analyzing and scoring the backgrounds of founders
//            and key personnel. It achieves this by ingesting data from diverse public and
//            internal sources, leveraging advanced Large Language Models (LLMs) for entity
//            and relationship extraction, and persisting this structured knowledge in a graph
//            database. The primary goal is to enable data-driven decision-making for venture
//            capital firms, corporate development teams, and talent acquisition specialists
//            by offering deep insights into professional networks, experience, and potential risks.
//            It exposes monetizable capabilities around enhanced due diligence, competitive
//            intelligence, and talent scouting.
//   dependencies:
//     - Graph Database (e.g., Neo4j): For storing interconnected founder data.
//     - LLM Providers (Mistral AI, Llama (Meta AI)): For natural language understanding,
//       entity recognition, and relationship extraction from unstructured text.
//     - Public Data APIs (e.g., simulated Crunchbase, LinkedIn, SEC filings): For external data ingestion.
//     - Internal Data Sources (e.g., CRM, HRIS, proprietary deal flow systems): For private data ingestion.
//     - Shared Core SDK: auth, eventbus, ontology, telemetry, config, audit, featureflags.
//     - Message Queue (e.g., Kafka/RabbitMQ via eventbus): For asynchronous data ingestion and processing.
//   invalidation_conditions:
//     - Significant changes in LLM API contracts or model performance.
//     - Schema changes in the graph database requiring data migration.
//     - Deprecation or major changes in integrated public data APIs.
//     - Changes in regulatory compliance requirements impacting data ingestion or storage.
//     - Core SDK breaking changes.
//     - Loss of connectivity to primary data sources or LLM providers.
//   adjacent_apps:
//     - APP_01_Inference_CostRouter: To optimize LLM API calls based on cost/performance.
//     - APP_02_Data_PublicSourceAggregator: To provide pre-processed public data feeds.
//     - APP_03_Data_InternalSourceIntegrator: To securely integrate internal enterprise data.
//     - APP_05_Compliance_DataPrivacyShield: To enforce data privacy and jurisdictional controls.
//     - APP_14_Agents_MultiModelOrchestrator: For advanced LLM task routing and chaining.
//     - APP_37_Governance_AuditTrailEngine: To centralize and analyze audit logs.
//     - APP_58_Narrative_ModelExplainabilityUI: To visualize and explain scoring decisions.
//     - APP_62_Evaluation_GraphQueryOptimizer: To optimize complex graph queries for performance.
//     - APP_70_AI_Marketplace_DataBroker: To potentially offer anonymized, aggregated insights.

// --- Configuration Management ---

// AppConfig holds all service-level configurations.
type AppConfig struct {
	Service struct {
		Port        string `mapstructure:"port"`
		Environment string `mapstructure:"environment"` // e.g., "development", "production"
		LogLevel    string `mapstructure:"log_level"`
	} `mapstructure:"service"`
	Neo4j struct {
		URI      string `mapstructure:"uri"`
		Username string `mapstructure:"username"`
		Password string `mapstructure:"password"`
		Database string `mapstructure:"database"`
	} `mapstructure:"neo4j"`
	LLM struct {
		MistralAPIKey string `mapstructure:"mistral_api_key"`
		MistralBaseURL string `mapstructure:"mistral_base_url"`
		LlamaAPIKey   string `mapstructure:"llama_api_key"`
		LlamaBaseURL  string `mapstructure:"llama_base_url"`
		DefaultModel  string `mapstructure:"default_model"` // e.g., "mistral", "llama" (keys for MultiModelLLMRouter)
		MaxRetries    int    `mapstructure:"max_retries"`
		TimeoutSec    int    `mapstructure:"timeout_sec"`
	} `mapstructure:"llm"`
	FeatureFlags struct {
		EnablePublicDataIngestion bool `mapstructure:"enable_public_data_ingestion"`
		EnableInternalDataIngestion bool `mapstructure:"enable_internal_data_ingestion"`
		EnableJurisdictionalFiltering bool `mapstructure:"enable_jurisdictional_filtering"`
		EnableRealtimeScoring       bool `mapstructure:"enable_realtime_scoring"`
		EnableGraphSchemaValidation bool `mapstructure:"enable_graph_schema_validation"`
		EnableLLMCaching            bool `mapstructure:"enable_llm_caching"`
	} `mapstructure:"feature_flags"`
	DataSources struct {
		Public struct {
			CrunchbaseAPIKey string `mapstructure:"crunchbase_api_key"`
			LinkedInAPIKey   string `mapstructure:"linkedin_api_key"` // Simulated
			SECAPIKey        string `mapstructure:"sec_api_key"`     // Simulated
		} `mapstructure:"public"`
		Internal struct {
			CRMSystemURL string `mapstructure:"crm_system_url"`
			HRISSystemURL string `mapstructure:"hris_system_url"`
		} `mapstructure:"internal"`
	} `mapstructure:"data_sources"`
	Scoring struct {
		WeightExperience float64 `mapstructure:"weight_experience"`
		WeightNetwork    float64 `mapstructure:"weight_network"`
		WeightEducation  float64 `mapstructure:"weight_education"`
		WeightInnovation float64 `mapstructure:"weight_innovation"`
		WeightRisk       float64 `mapstructure:"weight_risk"`
	} `mapstructure:"scoring"`
}

var appConfig AppConfig

// initConfig loads configuration from environment variables and a config file.
func initConfig() error {
	viper.SetConfigName("config") // name of config file (without extension)
	viper.SetConfigType("yaml")   // or json, toml, etc.
	viper.AddConfigPath(".")      // path to look for the config file in the current directory
	viper.AddConfigPath("./config") // path to look for the config file in a config directory
	viper.AutomaticEnv()          // read in environment variables that match

	// Set default values
	viper.SetDefault("service.port", "8080")
	viper.SetDefault("service.environment", "development")
	viper.SetDefault("service.log_level", "info")
	viper.SetDefault("neo4j.uri", "bolt://localhost:7687")
	viper.SetDefault("neo4j.username", "neo4j")
	viper.SetDefault("neo4j.password", "password")
	viper.SetDefault("neo4j.database", "neo4j")
	viper.SetDefault("llm.default_model", "mistral") // Must match a key in MultiModelLLMRouter.clients
	viper.SetDefault("llm.max_retries", 3)
	viper.SetDefault("llm.timeout_sec", 60)
	viper.SetDefault("feature_flags.enable_public_data_ingestion", true)
	viper.SetDefault("feature_flags.enable_internal_data_ingestion", false)
	viper.SetDefault("feature_flags.enable_jurisdictional_filtering", true)
	viper.SetDefault("feature_flags.enable_realtime_scoring", false)
	viper.SetDefault("feature_flags.enable_graph_schema_validation", true)
	viper.SetDefault("feature_flags.enable_llm_caching", true)
	viper.SetDefault("scoring.weight_experience", 0.3)
	viper.SetDefault("scoring.weight_network", 0.25)
	viper.SetDefault("scoring.weight_education", 0.15)
	viper.SetDefault("scoring.weight_innovation", 0.2)
	viper.SetDefault("scoring.weight_risk", 0.1) // Negative weight for risk factors

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			log.Println("Config file not found, using defaults and environment variables.")
		} else {
			return fmt.Errorf("failed to read config file: %w", err)
		}
	}

	if err := viper.Unmarshal(&appConfig); err != nil {
		return fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// Override with environment variables if present (e.g., for secrets)
	// This ensures secrets are not hardcoded or committed.
	if os.Getenv("NEO4J_PASSWORD") != "" {
		appConfig.Neo4j.Password = os.Getenv("NEO4J_PASSWORD")
	}
	if os.Getenv("MISTRAL_API_KEY") != "" {
		appConfig.LLM.MistralAPIKey = os.Getenv("MISTRAL_API_KEY")
	}
	if os.Getenv("LLAMA_API_KEY") != "" {
		appConfig.LLM.LlamaAPIKey = os.Getenv("LLAMA_API_KEY")
	}
	if os.Getenv("CRUNCHBASE_API_KEY") != "" {
		appConfig.DataSources.Public.CrunchbaseAPIKey = os.Getenv("CRUNCHBASE_API_KEY")
	}
	// ... similar overrides for other sensitive keys

	log.Printf("Configuration loaded for environment: %s", appConfig.Service.Environment)
	return nil
}

// --- Shared Core SDK Interfaces (Simulated) ---

// AuthClient defines the interface for the shared authentication and authorization service.
type AuthClient interface {
	Authenticate(token string) (auth.UserContext, error)
	Authorize(user auth.UserContext, permission string) error
}

// EventPublisher defines the interface for the shared event bus.
type EventPublisher interface {
	Publish(ctx context.Context, topic string, event interface{}) error
}

// OntologyMapper defines the interface for mapping data to the unified ontology.
type OntologyMapper interface {
	MapToOntology(data interface{}) (ontology.OntologyEntity, error)
	MapFromOntology(entity ontology.OntologyEntity, target interface{}) error
	GetSchema(entityType string) (ontology.Schema, error)
}

// TelemetryClient defines the interface for shared observability.
type TelemetryClient interface {
	RecordMetric(name string, value float64, tags ...string)
	StartSpan(ctx context.Context, name string) (context.Context, telemetry.Span)
	Log(level telemetry.LogLevel, message string, fields ...telemetry.LogField)
}

// AuditLogger defines the interface for shared audit logging.
type AuditLogger interface {
	LogEvent(ctx context.Context, event audit.Event) error
}

// FeatureFlagManager defines the interface for shared feature flag management.
type FeatureFlagManager interface {
	IsEnabled(flagName string, userContext featureflags.UserContext) bool
	GetVariant(flagName string, userContext featureflags.UserContext) (string, error)
}

// --- Data Models (Ontology-aligned) ---

// Founder represents a person entity in the graph.
type Founder struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Email       string            `json:"email,omitempty"`
	LinkedInURL string            `json:"linkedin_url,omitempty"`
	Bio         string            `json:"bio,omitempty"`
	Skills      []string          `json:"skills,omitempty"`
	Location    string            `json:"location,omitempty"`
	BirthYear   int               `json:"birth_year,omitempty"`
	RiskFactors []string          `json:"risk_factors,omitempty"`
	Score       float64           `json:"score,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"` // Source, last_updated, etc.
}

// Company represents a company entity.
type Company struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Website     string            `json:"website,omitempty"`
	Industry    string            `json:"industry,omitempty"`
	Description string            `json:"description,omitempty"`
	FoundedYear int               `json:"founded_year,omitempty"`
	Status      string            `json:"status,omitempty"` // e.g., "Active", "Acquired", "Defunct"
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// Investment represents an investment round or acquisition.
type Investment struct {
	ID          string            `json:"id"`
	Amount      float64           `json:"amount,omitempty"`
	Currency    string            `json:"currency,omitempty"`
	Round       string            `json:"round,omitempty"` // e.g., "Seed", "Series A"
	Date        time.Time         `json:"date,omitempty"`
	InvestorIDs []string          `json:"investor_ids,omitempty"` // IDs of investing entities (Person/Company)
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// Role represents a professional role held by a founder at a company.
type Role struct {
	ID        string            `json:"id"`
	Title     string            `json:"title"`
	StartDate time.Time         `json:"start_date"`
	EndDate   *time.Time        `json:"end_date,omitempty"` // Pointer for optional end date (current role)
	IsFounder bool              `json:"is_founder"`
	Metadata  map[string]string `json:"metadata,omitempty"`
}

// Education represents an educational attainment.
type Education struct {
	ID          string            `json:"id"`
	Institution string            `json:"institution"`
	Degree      string            `json:"degree"`
	Field       string            `json:"field,omitempty"`
	StartDate   time.Time         `json:"start_date,omitempty"`
	EndDate     *time.Time        `json:"end_date,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// GraphNode represents a generic node in the graph.
type GraphNode struct {
	ID     string                 `json:"id"`
	Labels []string               `json:"labels"`
	Props  map[string]interface{} `json:"properties"`
}

// GraphRelationship represents a generic relationship in the graph.
type GraphRelationship struct {
	ID         string                 `json:"id"` // Optional, can be generated
	StartNodeID string                 `json:"start_node_id"`
	EndNodeID   string                 `json:"end_node_id"`
	Type       string                 `json:"type"`
	Props      map[string]interface{} `json:"properties"`
}

// LLMResponse models the structured output from LLM for entity/relationship extraction.
type LLMResponse struct {
	Entities     []LLMEntity     `json:"entities"`
	Relationships []LLMRelationship `json:"relationships"`
}

// LLMEntity represents an extracted entity.
type LLMEntity struct {
	Type       string            `json:"type"` // e.g., "PERSON", "ORGANIZATION", "SKILL"
	Value      string            `json:"value"`
	Properties map[string]string `json:"properties,omitempty"` // e.g., "linkedin_url", "title"
}

// LLMRelationship represents an extracted relationship.
type LLMRelationship struct {
	SourceEntityValue string            `json:"source_entity_value"`
	TargetEntityValue string            `json:"target_entity_value"`
	Type              string            `json:"type"` // e.g., "WORKS_AT", "FOUNDED", "INVESTED_IN"
	Properties        map[string]string `json:"properties,omitempty"` // e.g., "start_date", "end_date"
}

// FounderScoreResult encapsulates the scoring output.
type FounderScoreResult struct {
	FounderID string            `json:"founder_id"`
	Score     float64           `json:"score"`
	Breakdown map[string]float64 `json:"breakdown"` // Component scores
	Insights  []string          `json:"insights"`  // Key findings
	Warnings  []string          `json:"warnings"`  // Potential issues or data gaps
	Disclaimer string           `json:"disclaimer"` // Legal disclaimer
}

// --- Graph Database Client ---

// GraphDBClient defines the interface for interacting with the graph database.
type GraphDBClient interface {
	Connect(ctx context.Context) error
	Close(ctx context.Context) error
	ExecuteRead(ctx context.Context, query string, params map[string]interface{}) ([]map[string]interface{}, error)
	ExecuteWrite(ctx context.Context, query string, params map[string]interface{}) ([]map[string]interface{}, error)
	IngestNode(ctx context.Context, node GraphNode) error
	IngestRelationship(ctx context.Context, rel GraphRelationship) error
	EnsureSchema(ctx context.Context, schema ontology.Schema) error // For schema validation/migration
}

// Neo4jClient implements GraphDBClient for Neo4j.
type Neo4jClient struct {
	driver neo4j.DriverWithContext
	config AppConfig
	telemetryClient TelemetryClient
	auditLogger AuditLogger
}

// NewNeo4jClient creates a new Neo4jClient.
func NewNeo4jClient(cfg AppConfig, tc TelemetryClient, al AuditLogger) (*Neo4jClient, error) {
	return &Neo4jClient{
		config: cfg,
		telemetryClient: tc,
		auditLogger: al,
	}, nil
}

// Connect establishes a connection to the Neo4j database.
func (c *Neo4jClient) Connect(ctx context.Context) error {
	spanCtx, span := c.telemetryClient.StartSpan(ctx, "Neo4jClient.Connect")
	defer span.End()

	driver, err := neo4j.NewDriverWithContext(c.config.Neo4j.URI,
		neo4j.BasicAuth(c.config.Neo4j.Username, c.config.Neo4j.Password, ""),
		func(config *neo4j.Config) {
			config.Log = neo4j.ConsoleLogger(neo4j.LogLevelInfo)
		})
	if err != nil {
		c.telemetryClient.Log(telemetry.Error, "Failed to create Neo4j driver", telemetry.LogField{Key: "error", Value: err.Error()})
		c.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeSystemError,
			Source: "Neo4jClient",
			Description: "Failed to create Neo4j driver",
			Details: map[string]interface{}{"error": err.Error()},
		})
		return fmt.Errorf("failed to create Neo4j driver: %w", err)
	}
	c.driver = driver

	// Verify connectivity
	if err = c.driver.VerifyConnectivity(spanCtx); err != nil {
		c.telemetryClient.Log(telemetry.Error, "Failed to verify Neo4j connectivity", telemetry.LogField{Key: "error", Value: err.Error()})
		c.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeSystemError,
			Source: "Neo4jClient",
			Description: "Failed to verify Neo4j connectivity",
			Details: map[string]interface{}{"error": err.Error()},
		})
		return fmt.Errorf("failed to verify Neo4j connectivity: %w", err)
	}

	c.telemetryClient.Log(telemetry.Info, "Successfully connected to Neo4j", telemetry.LogField{Key: "uri", Value: c.config.Neo4j.URI})
	return nil
}

// Close closes the connection to the Neo4j database.
func (c *Neo4jClient) Close(ctx context.Context) error {
	spanCtx, span := c.telemetryClient.StartSpan(ctx, "Neo4jClient.Close")
	defer span.End()

	if c.driver != nil {
		err := c.driver.Close(spanCtx)
		if err != nil {
			c.telemetryClient.Log(telemetry.Error, "Failed to close Neo4j driver", telemetry.LogField{Key: "error", Value: err.Error()})
			c.auditLogger.LogEvent(spanCtx, audit.Event{
				Type: audit.EventTypeSystemError,
				Source: "Neo4jClient",
				Description: "Failed to close Neo4j driver",
				Details: map[string]interface{}{"error": err.Error()},
			})
			return fmt.Errorf("failed to close Neo4j driver: %w", err)
		}
		c.telemetryClient.Log(telemetry.Info, "Neo4j driver closed.")
	}
	return nil
}

// ExecuteRead executes a read-only Cypher query.
func (c *Neo4jClient) ExecuteRead(ctx context.Context, query string, params map[string]interface{}) ([]map[string]interface{}, error) {
	spanCtx, span := c.telemetryClient.StartSpan(ctx, "Neo4jClient.ExecuteRead")
	defer span.End()
	span.SetAttribute("query", query)
	span.SetAttribute("params", fmt.Sprintf("%v", params))

	session := c.driver.NewSession(spanCtx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead, Database: c.config.Neo4j.Database})
	defer session.Close(spanCtx)

	result, err := session.ExecuteRead(spanCtx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		records, err := tx.Run(spanCtx, query, params)
		if err != nil {
			return nil, err
		}
		var results []map[string]interface{}
		for records.Next(spanCtx) {
			results = append(results, records.Record().AsMap())
		}
		if err = records.Err(); err != nil {
			return nil, err
		}
		return results, nil
	})

	if err != nil {
		c.telemetryClient.Log(telemetry.Error, "Neo4j read query failed", telemetry.LogField{Key: "error", Value: err.Error(), Key: "query", Value: query})
		c.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeDataAccessFailure,
			Source: "Neo4jClient",
			Description: "Failed to execute read query",
			Details: map[string]interface{}{"query": query, "error": err.Error()},
		})
		return nil, fmt.Errorf("failed to execute read query: %w", err)
	}
	return result.([]map[string]interface{}), nil
}

// ExecuteWrite executes a write Cypher query.
func (c *Neo4jClient) ExecuteWrite(ctx context.Context, query string, params map[string]interface{}) ([]map[string]interface{}, error) {
	spanCtx, span := c.telemetryClient.StartSpan(ctx, "Neo4jClient.ExecuteWrite")
	defer span.End()
	span.SetAttribute("query", query)
	span.SetAttribute("params", fmt.Sprintf("%v", params))

	session := c.driver.NewSession(spanCtx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite, Database: c.config.Neo4j.Database})
	defer session.Close(spanCtx)

	result, err := session.ExecuteWrite(spanCtx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		records, err := tx.Run(spanCtx, query, params)
		if err != nil {
			return nil, err
		}
		var results []map[string]interface{}
		for records.Next(spanCtx) {
			results = append(results, records.Record().AsMap())
		}
		if err = records.Err(); err != nil {
			return nil, err
		}
		return results, nil
	})

	if err != nil {
		c.telemetryClient.Log(telemetry.Error, "Neo4j write query failed", telemetry.LogField{Key: "error", Value: err.Error(), Key: "query", Value: query})
		c.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeDataAccessFailure,
			Source: "Neo4jClient",
			Description: "Failed to execute write query",
			Details: map[string]interface{}{"query": query, "error": err.Error()},
		})
		return nil, fmt.Errorf("failed to execute write query: %w", err)
	}
	return result.([]map[string]interface{}), nil
}

// IngestNode creates or updates a node in the graph.
func (c *Neo4jClient) IngestNode(ctx context.Context, node GraphNode) error {
	spanCtx, span := c.telemetryClient.StartSpan(ctx, "Neo4jClient.IngestNode")
	defer span.End()
	span.SetAttribute("node_id", node.ID)
	span.SetAttribute("node_labels", strings.Join(node.Labels, ","))

	labels := strings.Join(node.Labels, ":")
	if labels == "" {
		labels = "Entity" // Default label if none provided
	}

	// Cypher query to MERGE (create or update) a node
	query := fmt.Sprintf(`
		MERGE (n:%s {id: $id})
		ON CREATE SET n = $props, n.createdAt = datetime()
		ON MATCH SET n += $props, n.updatedAt = datetime()
		RETURN n
	`, labels)

	params := map[string]interface{}{
		"id":    node.ID,
		"props": node.Props,
	}

	_, err := c.ExecuteWrite(spanCtx, query, params)
	if err != nil {
		c.telemetryClient.Log(telemetry.Error, "Failed to ingest node", telemetry.LogField{Key: "node_id", Value: node.ID, Key: "error", Value: err.Error()})
		c.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeDataIngestionFailure,
			Source: "Neo4jClient",
			Description: "Failed to ingest graph node",
			Details: map[string]interface{}{"node_id": node.ID, "labels": labels, "error": err.Error()},
		})
		return fmt.Errorf("failed to ingest node %s: %w", node.ID, err)
	}
	c.telemetryClient.Log(telemetry.Debug, "Node ingested successfully", telemetry.LogField{Key: "node_id", Value: node.ID})
	return nil
}

// IngestRelationship creates or updates a relationship in the graph.
func (c *Neo4jClient) IngestRelationship(ctx context.Context, rel GraphRelationship) error {
	spanCtx, span := c.telemetryClient.StartSpan(ctx, "Neo4jClient.IngestRelationship")
	defer span.End()
	span.SetAttribute("start_node_id", rel.StartNodeID)
	span.SetAttribute("end_node_id", rel.EndNodeID)
	span.SetAttribute("relationship_type", rel.Type)

	// Cypher query to MERGE a relationship
	// It assumes nodes already exist or will be created by separate ingestNode calls.
	query := fmt.Sprintf(`
		MATCH (a {id: $startNodeID})
		MATCH (b {id: $endNodeID})
		MERGE (a)-[r:%s]->(b)
		ON CREATE SET r = $props, r.createdAt = datetime()
		ON MATCH SET r += $props, r.updatedAt = datetime()
		RETURN r
	`, rel.Type)

	params := map[string]interface{}{
		"startNodeID": rel.StartNodeID,
		"endNodeID":   rel.EndNodeID,
		"props":       rel.Props,
	}

	_, err := c.ExecuteWrite(spanCtx, query, params)
	if err != nil {
		c.telemetryClient.Log(telemetry.Error, "Failed to ingest relationship", telemetry.LogField{Key: "start_node", Value: rel.StartNodeID, Key: "end_node", Value: rel.EndNodeID, Key: "type", Value: rel.Type, Key: "error", Value: err.Error()})
		c.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeDataIngestionFailure,
			Source: "Neo4jClient",
			Description: "Failed to ingest graph relationship",
			Details: map[string]interface{}{"start_node": rel.StartNodeID, "end_node": rel.EndNodeID, "type": rel.Type, "error": err.Error()},
		})
		return fmt.Errorf("failed to ingest relationship %s between %s and %s: %w", rel.Type, rel.StartNodeID, rel.EndNodeID, err)
	}
	c.telemetryClient.Log(telemetry.Debug, "Relationship ingested successfully", telemetry.LogField{Key: "start_node", Value: rel.StartNodeID, Key: "end_node", Value: rel.EndNodeID, Key: "type", Value: rel.Type})
	return nil
}

// EnsureSchema applies schema constraints and indices to the graph database.
// This helps maintain data integrity and query performance.
func (c *Neo4jClient) EnsureSchema(ctx context.Context, schema ontology.Schema) error {
	if !c.config.FeatureFlags.EnableGraphSchemaValidation {
		c.telemetryClient.Log(telemetry.Info, "Graph schema validation is disabled by feature flag.")
		return nil
	}

	spanCtx, span := c.telemetryClient.StartSpan(ctx, "Neo4jClient.EnsureSchema")
	defer span.End()

	// Example schema application: create unique constraints and indices
	// In a real scenario, ontology.Schema would define these.
	constraints := []string{
		"CREATE CONSTRAINT IF NOT EXISTS FOR (f:Founder) REQUIRE f.id IS UNIQUE",
		"CREATE CONSTRAINT IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE",
		"CREATE CONSTRAINT IF NOT EXISTS FOR (i:Investment) REQUIRE i.id IS UNIQUE",
		"CREATE INDEX IF NOT EXISTS FOR (f:Founder) ON (f.name)",
		"CREATE INDEX IF NOT EXISTS FOR (c:Company) ON (c.name)",
		"CREATE INDEX IF NOT EXISTS FOR (r:Role) ON (r.title)",
	}

	for _, query := range constraints {
		_, err := c.ExecuteWrite(spanCtx, query, nil)
		if err != nil {
			c.telemetryClient.Log(telemetry.Error, "Failed to apply schema constraint", telemetry.LogField{Key: "query", Value: query, Key: "error", Value: err.Error()})
			c.auditLogger.LogEvent(spanCtx, audit.Event{
				Type: audit.EventTypeSystemError,
				Source: "Neo4jClient",
				Description: "Failed to apply graph schema constraint",
				Details: map[string]interface{}{"query": query, "error": err.Error()},
			})
			return fmt.Errorf("failed to apply schema constraint '%s': %w", query, err)
		}
		c.telemetryClient.Log(telemetry.Debug, "Applied schema constraint", telemetry.LogField{Key: "query", Value: query})
	}
	c.telemetryClient.Log(telemetry.Info, "Graph schema ensured successfully.")
	return nil
}

// --- LLM Client Interfaces and Implementations ---

// LLMClient defines the interface for interacting with Large Language Models.
type LLMClient interface {
	ExtractEntities(ctx context.Context, text string, entityTypes []string) ([]LLMEntity, error)
	ExtractRelationships(ctx context.Context, text string, relationshipTypes []string) ([]LLMRelationship, error)
	// Additional methods for summarization, classification, etc., could be added.
}

// MistralClient implements LLMClient for Mistral AI.
type MistralClient struct {
	apiKey string
	baseURL string
	defaultModel string
	maxRetries int
	timeout time.Duration
	telemetryClient TelemetryClient
	auditLogger AuditLogger
}

// NewMistralClient creates a new MistralClient.
func NewMistralClient(cfg AppConfig, tc TelemetryClient, al AuditLogger) *MistralClient {
	return &MistralClient{
		apiKey: cfg.LLM.MistralAPIKey,
		baseURL: cfg.LLM.MistralBaseURL,
		defaultModel: cfg.LLM.DefaultModel,
		maxRetries: cfg.LLM.MaxRetries,
		timeout: time.Duration(cfg.LLM.TimeoutSec) * time.Second,
		telemetryClient: tc,
		auditLogger: al,
	}
}

// simulateMistralAPICall is a placeholder for actual Mistral API interaction.
func (c *MistralClient) simulateMistralAPICall(ctx context.Context, endpoint string, requestBody interface{}) ([]byte, error) {
	spanCtx, span := c.telemetryClient.StartSpan(ctx, "MistralClient.simulateMistralAPICall")
	defer span.End()
	span.SetAttribute("endpoint", endpoint)

	// In a real implementation, this would involve HTTP requests to Mistral API.
	// For now, simulate a delay and return mock data.
	time.Sleep(500 * time.Millisecond) // Simulate network latency

	// Mock response based on endpoint
	if endpoint == "/v1/entities" {
		// Example mock for entity extraction
		mockEntities := []LLMEntity{
			{Type: "PERSON", Value: "Elon Musk", Properties: map[string]string{"linkedin_url": "https://linkedin.com/in/elonmusk"}},
			{Type: "ORGANIZATION", Value: "Tesla", Properties: map[string]string{"industry": "Automotive"}},
			{Type: "ORGANIZATION", Value: "SpaceX", Properties: map[string]string{"industry": "Aerospace"}},
			{Type: "SKILL", Value: "Engineering"},
			{Type: "SKILL", Value: "Entrepreneurship"},
		}
		return json.Marshal(mockEntities)
	} else if endpoint == "/v1/relationships" {
		// Example mock for relationship extraction
		mockRelationships := []LLMRelationship{
			{SourceEntityValue: "Elon Musk", TargetEntityValue: "Tesla", Type: "FOUNDED", Properties: map[string]string{"start_date": "2003-07-01"}},
			{SourceEntityValue: "Elon Musk", TargetEntityValue: "SpaceX", Type: "FOUNDED", Properties: map[string]string{"start_date": "2002-03-14"}},
			{SourceEntityValue: "Tesla", TargetEntityValue: "Automotive", Type: "OPERATES_IN"},
		}
		return json.Marshal(mockRelationships)
	}

	return nil, fmt.Errorf("unsupported mock endpoint: %s", endpoint)
}

// ExtractEntities uses Mistral to extract entities from text.
func (c *MistralClient) ExtractEntities(ctx context.Context, text string, entityTypes []string) ([]LLMEntity, error) {
	spanCtx, span := c.telemetryClient.StartSpan(ctx, "MistralClient.ExtractEntities")
	defer span.End()
	span.SetAttribute("text_length", len(text))
	span.SetAttribute("entity_types", strings.Join(entityTypes, ","))
	c.telemetryClient.RecordMetric("llm.mistral.extract_entities.calls", 1)

	// Simulate API call with retry logic
	var (
		respBytes []byte
		err       error
	)
	for i := 0; i < c.maxRetries; i++ {
		respBytes, err = c.simulateMistralAPICall(spanCtx, "/v1/entities", map[string]interface{}{
			"model":        c.defaultModel,
			"input":        text,
			"entity_types": entityTypes,
		})
		if err == nil {
			break
		}
		c.telemetryClient.Log(telemetry.Warn, "Mistral entity extraction failed, retrying", telemetry.LogField{Key: "attempt", Value: i + 1, Key: "error", Value: err.Error()})
		time.Sleep(time.Duration(i+1) * 500 * time.Millisecond) // Exponential backoff
	}

	if err != nil {
		c.telemetryClient.Log(telemetry.Error, "Mistral entity extraction failed after retries", telemetry.LogField{Key: "error", Value: err.Error()})
		c.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeAIInferenceFailure,
			Source: "MistralClient",
			Description: "Failed to extract entities from text",
			Details: map[string]interface{}{"text_snippet": text[:min(len(text), 100)], "error": err.Error()},
		})
		return nil, fmt.Errorf("mistral entity extraction failed: %w", err)
	}

	var entities []LLMEntity
	if err := json.Unmarshal(respBytes, &entities); err != nil {
		c.telemetryClient.Log(telemetry.Error, "Failed to unmarshal Mistral entity response", telemetry.LogField{Key: "error", Value: err.Error()})
		return nil, fmt.Errorf("failed to unmarshal Mistral entity response: %w", err)
	}
	c.telemetryClient.RecordMetric("llm.mistral.extract_entities.success", 1)
	span.SetAttribute("extracted_entities_count", len(entities))
	return entities, nil
}

// ExtractRelationships uses Mistral to extract relationships from text.
func (c *MistralClient) ExtractRelationships(ctx context.Context, text string, relationshipTypes []string) ([]LLMRelationship, error) {
	spanCtx, span := c.telemetryClient.StartSpan(ctx, "MistralClient.ExtractRelationships")
	defer span.End()
	span.SetAttribute("text_length", len(text))
	span.SetAttribute("relationship_types", strings.Join(relationshipTypes, ","))
	c.telemetryClient.RecordMetric("llm.mistral.extract_relationships.calls", 1)

	var (
		respBytes []byte
		err       error
	)
	for i := 0; i < c.maxRetries; i++ {
		respBytes, err = c.simulateMistralAPICall(spanCtx, "/v1/relationships", map[string]interface{}{
			"model":            c.defaultModel,
			"input":            text,
			"relationship_types": relationshipTypes,
		})
		if err == nil {
			break
		}
		c.telemetryClient.Log(telemetry.Warn, "Mistral relationship extraction failed, retrying", telemetry.LogField{Key: "attempt", Value: i + 1, Key: "error", Value: err.Error()})
		time.Sleep(time.Duration(i+1) * 500 * time.Millisecond)
	}

	if err != nil {
		c.telemetryClient.Log(telemetry.Error, "Mistral relationship extraction failed after retries", telemetry.LogField{Key: "error", Value: err.Error()})
		c.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeAIInferenceFailure,
			Source: "MistralClient",
			Description: "Failed to extract relationships from text",
			Details: map[string]interface{}{"text_snippet": text[:min(len(text), 100)], "error": err.Error()},
		})
		return nil, fmt.Errorf("mistral relationship extraction failed: %w", err)
	}

	var relationships []LLMRelationship
	if err := json.Unmarshal(respBytes, &relationships); err != nil {
		c.telemetryClient.Log(telemetry.Error, "Failed to unmarshal Mistral relationship response", telemetry.LogField{Key: "error", Value: err.Error()})
		return nil, fmt.Errorf("failed to unmarshal Mistral relationship response: %w", err)
	}
	c.telemetryClient.RecordMetric("llm.mistral.extract_relationships.success", 1)
	span.SetAttribute("extracted_relationships_count", len(relationships))
	return relationships, nil
}

// LlamaClient implements LLMClient for Llama (Meta AI).
type LlamaClient struct {
	apiKey string
	baseURL string
	defaultModel string
	maxRetries int
	timeout time.Duration
	telemetryClient TelemetryClient
	auditLogger AuditLogger
}

// NewLlamaClient creates a new LlamaClient.
func NewLlamaClient(cfg AppConfig, tc TelemetryClient, al AuditLogger) *LlamaClient {
	return &LlamaClient{
		apiKey: cfg.LLM.LlamaAPIKey,
		baseURL: cfg.LLM.LlamaBaseURL,
		defaultModel: cfg.LLM.DefaultModel,
		maxRetries: cfg.LLM.MaxRetries,
		timeout: time.Duration(cfg.LLM.TimeoutSec) * time.Second,
		telemetryClient: tc,
		auditLogger: al,
	}
}

// simulateLlamaAPICall is a placeholder for actual Llama API interaction.
func (c *LlamaClient) simulateLlamaAPICall(ctx context.Context, endpoint string, requestBody interface{}) ([]byte, error) {
	spanCtx, span := c.telemetryClient.StartSpan(ctx, "LlamaClient.simulateLlamaAPICall")
	defer span.End()
	span.SetAttribute("endpoint", endpoint)

	// Simulate a delay and return mock data.
	time.Sleep(600 * time.Millisecond) // Simulate network latency, maybe Llama is slightly slower or different

	if endpoint == "/v1/entities" {
		mockEntities := []LLMEntity{
			{Type: "PERSON", Value: "Sam Altman", Properties: map[string]string{"linkedin_url": "https://linkedin.com/in/samaltman"}},
			{Type: "ORGANIZATION", Value: "OpenAI", Properties: map[string]string{"industry": "Artificial Intelligence"}},
			{Type: "SKILL", Value: "Venture Capital"},
		}
		return json.Marshal(mockEntities)
	} else if endpoint == "/v1/relationships" {
		mockRelationships := []LLMRelationship{
			{SourceEntityValue: "Sam Altman", TargetEntityValue: "OpenAI", Type: "CEO_OF", Properties: map[string]string{"start_date": "2015-12-11"}},
			{SourceEntityValue: "Sam Altman", TargetEntityValue: "Y Combinator", Type: "FORMER_PRESIDENT_OF"},
		}
		return json.Marshal(mockRelationships)
	}

	return nil, fmt.Errorf("unsupported mock endpoint: %s", endpoint)
}

// ExtractEntities uses Llama to extract entities from text.
func (c *LlamaClient) ExtractEntities(ctx context.Context, text string, entityTypes []string) ([]LLMEntity, error) {
	spanCtx, span := c.telemetryClient.StartSpan(ctx, "LlamaClient.ExtractEntities")
	defer span.End()
	span.SetAttribute("text_length", len(text))
	span.SetAttribute("entity_types", strings.Join(entityTypes, ","))
	c.telemetryClient.RecordMetric("llm.llama.extract_entities.calls", 1)

	var (
		respBytes []byte
		err       error
	)
	for i := 0; i < c.maxRetries; i++ {
		respBytes, err = c.simulateLlamaAPICall(spanCtx, "/v1/entities", map[string]interface{}{
			"model":        c.defaultModel,
			"input":        text,
			"entity_types": entityTypes,
		})
		if err == nil {
			break
		}
		c.telemetryClient.Log(telemetry.Warn, "Llama entity extraction failed, retrying", telemetry.LogField{Key: "attempt", Value: i + 1, Key: "error", Value: err.Error()})
		time.Sleep(time.Duration(i+1) * 500 * time.Millisecond)
	}

	if err != nil {
		c.telemetryClient.Log(telemetry.Error, "Llama entity extraction failed after retries", telemetry.LogField{Key: "error", Value: err.Error()})
		c.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeAIInferenceFailure,
			Source: "LlamaClient",
			Description: "Failed to extract entities from text",
			Details: map[string]interface{}{"text_snippet": text[:min(len(text), 100)], "error": err.Error()},
		})
		return nil, fmt.Errorf("llama entity extraction failed: %w", err)
	}

	var entities []LLMEntity
	if err := json.Unmarshal(respBytes, &entities); err != nil {
		c.telemetryClient.Log(telemetry.Error, "Failed to unmarshal Llama entity response", telemetry.LogField{Key: "error", Value: err.Error()})
		return nil, fmt.Errorf("failed to unmarshal Llama entity response: %w", err)
	}
	c.telemetryClient.RecordMetric("llm.llama.extract_entities.success", 1)
	span.SetAttribute("extracted_entities_count", len(entities))
	return entities, nil
}

// ExtractRelationships uses Llama to extract relationships from text.
func (c *LlamaClient) ExtractRelationships(ctx context.Context, text string, relationshipTypes []string) ([]LLMRelationship, error) {
	spanCtx, span := c.telemetryClient.StartSpan(ctx, "LlamaClient.ExtractRelationships")
	defer span.End()
	span.SetAttribute("text_length", len(text))
	span.SetAttribute("relationship_types", strings.Join(relationshipTypes, ","))
	c.telemetryClient.RecordMetric("llm.llama.extract_relationships.calls", 1)

	var (
		respBytes []byte
		err       error
	)
	for i := 0; i < c.maxRetries; i++ {
		respBytes, err = c.simulateLlamaAPICall(spanCtx, "/v1/relationships", map[string]interface{}{
			"model":            c.defaultModel,
			"input":            text,
			"relationship_types": relationshipTypes,
		})
		if err == nil {
			break
		}
		c.telemetryClient.Log(telemetry.Warn, "Llama relationship extraction failed, retrying", telemetry.LogField{Key: "attempt", Value: i + 1, Key: "error", Value: err.Error()})
		time.Sleep(time.Duration(i+1) * 500 * time.Millisecond)
	}

	if err != nil {
		c.telemetryClient.Log(telemetry.Error, "Llama relationship extraction failed after retries", telemetry.LogField{Key: "error", Value: err.Error()})
		c.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeAIInferenceFailure,
			Source: "LlamaClient",
			Description: "Failed to extract relationships from text",
			Details: map[string]interface{}{"text_snippet": text[:min(len(text), 100)], "error": err.Error()},
		})
		return nil, fmt.Errorf("llama relationship extraction failed: %w", err)
	}

	var relationships []LLMRelationship
	if err := json.Unmarshal(respBytes, &relationships); err != nil {
		c.telemetryClient.Log(telemetry.Error, "Failed to unmarshal Llama relationship response", telemetry.LogField{Key: "error", Value: err.Error()})
		return nil, fmt.Errorf("failed to unmarshal Llama relationship response: %w", err)
	}
	c.telemetryClient.RecordMetric("llm.llama.extract_relationships.success", 1)
	span.SetAttribute("extracted_relationships_count", len(relationships))
	return relationships, nil
}

// MultiModelLLMRouter routes LLM requests to appropriate providers.
// This acts as an abstraction layer over specific LLM vendors.
type MultiModelLLMRouter struct {
	clients map[string]LLMClient
	defaultClient string
	telemetryClient TelemetryClient
	auditLogger AuditLogger
	costRouter  *CostRouter // Simulated integration with APP_01_Inference_CostRouter
}

// CostRouter is a simulated client for APP_01_Inference_CostRouter.
type CostRouter struct {
	telemetryClient TelemetryClient
}

func NewCostRouter(tc TelemetryClient) *CostRouter {
	return &CostRouter{telemetryClient: tc}
}

// GetOptimalLLM simulates calling the cost router to get the best LLM for a task.
func (cr *CostRouter) GetOptimalLLM(ctx context.Context, taskType string, inputSize int) (string, error) {
	cr.telemetryClient.Log(telemetry.Debug, "Simulating cost router for optimal LLM", telemetry.LogField{Key: "task_type", Value: taskType, Key: "input_size", Value: inputSize})
	// In a real scenario, this would make an API call to APP_01_Inference_CostRouter
	// For now, a simple heuristic: Mistral for entities, Llama for relationships (or vice-versa)
	if taskType == "entity_extraction" {
		return "mistral", nil
	}
	if taskType == "relationship_extraction" {
		return "llama", nil
	}
	return "mistral", nil // Default
}


// NewMultiModelLLMRouter creates a new MultiModelLLMRouter.
func NewMultiModelLLMRouter(cfg AppConfig, tc TelemetryClient, al AuditLogger) *MultiModelLLMRouter {
	clients := make(map[string]LLMClient)
	if cfg.LLM.MistralAPIKey != "" {
		clients["mistral"] = NewMistralClient(cfg, tc, al)
	}
	if cfg.LLM.LlamaAPIKey != "" {
		clients["llama"] = NewLlamaClient(cfg, tc, al)
	}

	return &MultiModelLLMRouter{
		clients: clients,
		defaultClient: cfg.LLM.DefaultModel, // This should map to a client key, e.g., "mistral" or "llama"
		telemetryClient: tc,
		auditLogger: al,
		costRouter: NewCostRouter(tc), // Initialize simulated cost router
	}
}

// getClient selects an LLM client, potentially using the cost router.
func (r *MultiModelLLMRouter) getClient(ctx context.Context, taskType string, inputSize int) (LLMClient, string, error) {
	preferredVendor, err := r.costRouter.GetOptimalLLM(ctx, taskType, inputSize)
	if err != nil {
		r.telemetryClient.Log(telemetry.Warn, "Failed to get optimal LLM from cost router, falling back to default", telemetry.LogField{Key: "error", Value: err.Error()})
		preferredVendor = r.defaultClient // Fallback
	}

	client, ok := r.clients[preferredVendor]
	if !ok {
		// If preferred vendor not found or not configured, try default
		client, ok = r.clients[r.defaultClient]
		if !ok {
			return nil, "", fmt.Errorf("no LLM client available for default model %s", r.defaultClient)
		}
		r.telemetryClient.Log(telemetry.Warn, "Preferred LLM client not found, using default", telemetry.LogField{Key: "preferred", Value: preferredVendor, Key: "default", Value: r.defaultClient})
		return client, r.defaultClient, nil
	}
	return client, preferredVendor, nil
}

// ExtractEntities routes entity extraction requests.
func (r *MultiModelLLMRouter) ExtractEntities(ctx context.Context, text string, entityTypes []string) ([]LLMEntity, error) {
	spanCtx, span := r.telemetryClient.StartSpan(ctx, "MultiModelLLMRouter.ExtractEntities")
	defer span.End()

	client, vendor, err := r.getClient(spanCtx, "entity_extraction", len(text))
	if err != nil {
		return nil, err
	}
	span.SetAttribute("llm_vendor", vendor)
	return client.ExtractEntities(spanCtx, text, entityTypes)
}

// ExtractRelationships routes relationship extraction requests.
func (r *MultiModelLLMRouter) ExtractRelationships(ctx context.Context, text string, relationshipTypes []string) ([]LLMRelationship, error) {
	spanCtx, span := r.telemetryClient.StartSpan(ctx, "MultiModelLLMRouter.ExtractRelationships")
	defer span.End()

	client, vendor, err := r.getClient(spanCtx, "relationship_extraction", len(text))
	if err != nil {
		return nil, err
	}
	span.SetAttribute("llm_vendor", vendor)
	return client.ExtractRelationships(spanCtx, text, relationshipTypes)
}

// --- Data Ingestion ---

// RawDataSource represents raw data from an external source.
type RawDataSource struct {
	SourceType string            `json:"source_type"` // e.g., "Crunchbase", "LinkedIn", "InternalCRM"
	SourceID   string            `json:"source_id"`   // Unique ID within the source
	Content    string            `json:"content"`     // Raw text content to be processed
	URL        string            `json:"url,omitempty"`
	Timestamp  time.Time         `json:"timestamp"`
	Metadata   map[string]string `json:"metadata,omitempty"`
}

// DataIngestor defines the interface for ingesting raw data.
type DataIngestor interface {
	Ingest(ctx context.Context, founderID string) ([]RawDataSource, error)
	// Ingest can also be triggered by events from other services (e.g., new company data available)
}

// PublicDataIngestor simulates fetching data from public APIs (Crunchbase, LinkedIn, SEC).
type PublicDataIngestor struct {
	config AppConfig
	telemetryClient TelemetryClient
	auditLogger AuditLogger
	featureFlagManager FeatureFlagManager
}

// NewPublicDataIngestor creates a new PublicDataIngestor.
func NewPublicDataIngestor(cfg AppConfig, tc TelemetryClient, al AuditLogger, ffm FeatureFlagManager) *PublicDataIngestor {
	return &PublicDataIngestor{
		config: cfg,
		telemetryClient: tc,
		auditLogger: al,
		featureFlagManager: ffm,
	}
}

// Ingest fetches public data for a given founder ID.
func (i *PublicDataIngestor) Ingest(ctx context.Context, founderID string) ([]RawDataSource, error) {
	if !i.featureFlagManager.IsEnabled("EnablePublicDataIngestion", featureflags.UserContext{}) {
		i.telemetryClient.Log(telemetry.Info, "Public data ingestion is disabled by feature flag.")
		return nil, nil
	}
	if i.featureFlagManager.IsEnabled("EnableJurisdictionalFiltering", featureflags.UserContext{}) {
		// Simulate checking jurisdiction for data privacy.
		// In a real system, this would involve geo-IP lookup or user-provided jurisdiction.
		i.telemetryClient.Log(telemetry.Debug, "Jurisdictional filtering enabled for public data ingestion.")
		// Add logic to filter or anonymize data based on jurisdiction.
	}

	spanCtx, span := i.telemetryClient.StartSpan(ctx, "PublicDataIngestor.Ingest")
	defer span.End()
	span.SetAttribute("founder_id", founderID)
	i.telemetryClient.RecordMetric("data_ingestion.public.calls", 1)

	var sources []RawDataSource

	// Simulate Crunchbase API call
	if i.config.DataSources.Public.CrunchbaseAPIKey != "" {
		i.telemetryClient.Log(telemetry.Debug, "Simulating Crunchbase data fetch for founder", telemetry.LogField{Key: "founder_id", Value: founderID})
		time.Sleep(200 * time.Millisecond) // Simulate API call latency
		sources = append(sources, RawDataSource{
			SourceType: "Crunchbase",
			SourceID:   fmt.Sprintf("cb-%s", founderID),
			Content:    fmt.Sprintf("John Doe is a founder of ExampleCorp, founded in 2020. He previously worked at OldCompany. Crunchbase profile: example.com/crunchbase/%s", founderID),
			URL:        fmt.Sprintf("https://api.crunchbase.com/v4/people/%s", founderID),
			Timestamp:  time.Now(),
			Metadata:   map[string]string{"api_version": "v4"},
		})
		i.telemetryClient.RecordMetric("data_ingestion.public.crunchbase.success", 1)
	} else {
		i.telemetryClient.Log(telemetry.Warn, "Crunchbase API key not configured, skipping Crunchbase ingestion.")
	}

	// Simulate LinkedIn profile scraping/API (highly restricted in real-world)
	if i.config.DataSources.Public.LinkedInAPIKey != "" {
		i.telemetryClient.Log(telemetry.Debug, "Simulating LinkedIn data fetch for founder", telemetry.LogField{Key: "founder_id", Value: founderID})
		time.Sleep(300 * time.Millisecond)
		sources = append(sources, RawDataSource{
			SourceType: "LinkedIn",
			SourceID:   fmt.Sprintf("li-%s", founderID),
			Content:    fmt.Sprintf("John Doe's LinkedIn profile shows he has skills in AI, Machine Learning, and has a Master's from Stanford University. He is currently CEO of ExampleCorp. LinkedIn URL: example.com/linkedin/%s", founderID),
			URL:        fmt.Sprintf("https://api.linkedin.com/v2/people/%s", founderID),
			Timestamp:  time.Now(),
			Metadata:   map[string]string{"api_version": "v2"},
		})
		i.telemetryClient.RecordMetric("data_ingestion.public.linkedin.success", 1)
	} else {
		i.telemetryClient.Log(telemetry.Warn, "LinkedIn API key not configured, skipping LinkedIn ingestion.")
	}

	// Simulate SEC filings search for public company founders
	if i.config.DataSources.Public.SECAPIKey != "" {
		i.telemetryClient.Log(telemetry.Debug, "Simulating SEC filings data fetch for founder", telemetry.LogField{Key: "founder_id", Value: founderID})
		time.Sleep(250 * time.Millisecond)
		sources = append(sources, RawDataSource{
			SourceType: "SECFilings",
			SourceID:   fmt.Sprintf("sec-%s", founderID),
			Content:    fmt.Sprintf("SEC filing for ExampleCorp (Form S-1) mentions John Doe as a key executive and lists his prior experience at TechGiant Inc. SEC URL: example.com/sec/%s", founderID),
			URL:        fmt.Sprintf("https://api.sec.gov/filings/%s", founderID),
			Timestamp:  time.Now(),
			Metadata:   map[string]string{"document_type": "S-1"},
		})
		i.telemetryClient.RecordMetric("data_ingestion.public.sec.success", 1)
	} else {
		i.telemetryClient.Log(telemetry.Warn, "SEC API key not configured, skipping SEC filings ingestion.")
	}

	if len(sources) == 0 {
		i.telemetryClient.Log(telemetry.Warn, "No public data sources configured or enabled for ingestion.")
		i.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeDataIngestionWarning,
			Source: "PublicDataIngestor",
			Description: "No public data sources configured or enabled",
			Details: map[string]interface{}{"founder_id": founderID},
		})
	} else {
		i.telemetryClient.Log(telemetry.Info, "Public data ingested successfully", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "num_sources", Value: len(sources)})
	}

	return sources, nil
}

// InternalDataIngestor simulates fetching data from internal enterprise systems (CRM, HRIS).
type InternalDataIngestor struct {
	config AppConfig
	telemetryClient TelemetryClient
	auditLogger AuditLogger
	featureFlagManager FeatureFlagManager
}

// NewInternalDataIngestor creates a new InternalDataIngestor.
func NewInternalDataIngestor(cfg AppConfig, tc TelemetryClient, al AuditLogger, ffm FeatureFlagManager) *InternalDataIngestor {
	return &InternalDataIngestor{
		config: cfg,
		telemetryClient: tc,
		auditLogger: al,
		featureFlagManager: ffm,
	}
}

// Ingest fetches internal data for a given founder ID.
func (i *InternalDataIngestor) Ingest(ctx context.Context, founderID string) ([]RawDataSource, error) {
	if !i.featureFlagManager.IsEnabled("EnableInternalDataIngestion", featureflags.UserContext{}) {
		i.telemetryClient.Log(telemetry.Info, "Internal data ingestion is disabled by feature flag.")
		return nil, nil
	}
	if i.featureFlagManager.IsEnabled("EnableJurisdictionalFiltering", featureflags.UserContext{}) {
		i.telemetryClient.Log(telemetry.Debug, "Jurisdictional filtering enabled for internal data ingestion.")
		// This is critical for internal data: ensure compliance with GDPR, CCPA, etc.
		// Data anonymization or pseudonymization might be required here.
	}

	spanCtx, span := i.telemetryClient.StartSpan(ctx, "InternalDataIngestor.Ingest")
	defer span.End()
	span.SetAttribute("founder_id", founderID)
	i.telemetryClient.RecordMetric("data_ingestion.internal.calls", 1)

	var sources []RawDataSource

	// Simulate CRM system data
	if i.config.DataSources.Internal.CRMSystemURL != "" {
		i.telemetryClient.Log(telemetry.Debug, "Simulating CRM data fetch for founder", telemetry.LogField{Key: "founder_id", Value: founderID})
		time.Sleep(150 * time.Millisecond)
		sources = append(sources, RawDataSource{
			SourceType: "InternalCRM",
			SourceID:   fmt.Sprintf("crm-%s", founderID),
			Content:    fmt.Sprintf("CRM record for John Doe indicates he was a lead in Q4 2019, with notes on his previous startup exit and investor connections. Internal contact: jane.doe@ourfirm.com", founderID),
			URL:        fmt.Sprintf("%s/api/founders/%s", i.config.DataSources.Internal.CRMSystemURL, founderID),
			Timestamp:  time.Now(),
			Metadata:   map[string]string{"internal_status": "HighPotential"},
		})
		i.telemetryClient.RecordMetric("data_ingestion.internal.crm.success", 1)
	} else {
		i.telemetryClient.Log(telemetry.Warn, "CRM system URL not configured, skipping CRM ingestion.")
	}

	// Simulate HRIS system data (if founder is an employee or related party)
	if i.config.DataSources.Internal.HRISSystemURL != "" {
		i.telemetryClient.Log(telemetry.Debug, "Simulating HRIS data fetch for founder", telemetry.LogField{Key: "founder_id", Value: founderID})
		time.Sleep(180 * time.Millisecond)
		sources = append(sources, RawDataSource{
			SourceType: "InternalHRIS",
			SourceID:   fmt.Sprintf("hris-%s", founderID),
			Content:    fmt.Sprintf("HRIS record for John Doe (if applicable) shows employment history, performance reviews, and internal project contributions. This data is highly sensitive.", founderID),
			URL:        fmt.Sprintf("%s/api/employees/%s", i.config.DataSources.Internal.HRISSystemURL, founderID),
			Timestamp:  time.Now(),
			Metadata:   map[string]string{"confidentiality_level": "High"},
		})
		i.telemetryClient.RecordMetric("data_ingestion.internal.hris.success", 1)
	} else {
		i.telemetryClient.Log(telemetry.Warn, "HRIS system URL not configured, skipping HRIS ingestion.")
	}

	if len(sources) == 0 {
		i.telemetryClient.Log(telemetry.Warn, "No internal data sources configured or enabled for ingestion.")
		i.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeDataIngestionWarning,
			Source: "InternalDataIngestor",
			Description: "No internal data sources configured or enabled",
			Details: map[string]interface{}{"founder_id": founderID},
		})
	} else {
		i.telemetryClient.Log(telemetry.Info, "Internal data ingested successfully", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "num_sources", Value: len(sources)})
	}

	return sources, nil
}

// DataProcessor orchestrates data ingestion, LLM processing, and graph storage.
type DataProcessor struct {
	graphDBClient GraphDBClient
	llmRouter     *MultiModelLLMRouter
	ingestors     map[string]DataIngestor
	ontologyMapper OntologyMapper
	eventPublisher EventPublisher
	telemetryClient TelemetryClient
	auditLogger AuditLogger
}

// NewDataProcessor creates a new DataProcessor.
func NewDataProcessor(
	gdb GraphDBClient,
	llm *MultiModelLLMRouter,
	ingestors map[string]DataIngestor,
	om OntologyMapper,
	ep EventPublisher,
	tc TelemetryClient,
	al AuditLogger,
) *DataProcessor {
	return &DataProcessor{
		graphDBClient: gdb,
		llmRouter:     llm,
		ingestors:     ingestors,
		ontologyMapper: om,
		eventPublisher: ep,
		telemetryClient: tc,
		auditLogger: al,
	}
}

// ProcessFounderData orchestrates the full data pipeline for a founder.
func (dp *DataProcessor) ProcessFounderData(ctx context.Context, founderID string) error {
	spanCtx, span := dp.telemetryClient.StartSpan(ctx, "DataProcessor.ProcessFounderData")
	defer span.End()
	span.SetAttribute("founder_id", founderID)
	dp.telemetryClient.RecordMetric("data_processor.process_founder_data.calls", 1)

	dp.telemetryClient.Log(telemetry.Info, "Starting data processing for founder", telemetry.LogField{Key: "founder_id", Value: founderID})
	dp.auditLogger.LogEvent(spanCtx, audit.Event{
		Type: audit.EventTypeDataIngestionStart,
		Source: "DataProcessor",
		Description: fmt.Sprintf("Initiating data processing for founder %s", founderID),
		Details: map[string]interface{}{"founder_id": founderID},
	})

	var allRawSources []RawDataSource
	var wg sync.WaitGroup
	var mu sync.Mutex
	errChan := make(chan error, len(dp.ingestors))

	// Ingest data from all configured sources concurrently
	for name, ingestor := range dp.ingestors {
		wg.Add(1)
		go func(name string, ingestor DataIngestor) {
			defer wg.Done()
			sources, err := ingestor.Ingest(spanCtx, founderID)
			if err != nil {
				dp.telemetryClient.Log(telemetry.Error, "Failed to ingest data from source", telemetry.LogField{Key: "source", Value: name, Key: "error", Value: err.Error()})
				errChan <- fmt.Errorf("ingest from %s failed: %w", name, err)
				return
			}
			mu.Lock()
			allRawSources = append(allRawSources, sources...)
			mu.Unlock()
			dp.telemetryClient.Log(telemetry.Debug, "Ingested data from source", telemetry.LogField{Key: "source", Value: name, Key: "count", Value: len(sources)})
		}(name, ingestor)
	}
	wg.Wait()
	close(errChan)

	for err := range errChan {
		dp.telemetryClient.Log(telemetry.Error, "Error during data ingestion phase", telemetry.LogField{Key: "error", Value: err.Error()})
		dp.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeDataIngestionFailure,
			Source: "DataProcessor",
			Description: "Error during data ingestion phase",
			Details: map[string]interface{}{"founder_id": founderID, "error": err.Error()},
		})
		return fmt.Errorf("data ingestion failed for %s: %w", founderID, err)
	}

	if len(allRawSources) == 0 {
		dp.telemetryClient.Log(telemetry.Warn, "No raw data ingested for founder", telemetry.LogField{Key: "founder_id", Value: founderID})
		dp.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeDataIngestionWarning,
			Source: "DataProcessor",
			Description: "No raw data ingested for founder",
			Details: map[string]interface{}{"founder_id": founderID},
		})
		return errors.New("no raw data ingested")
	}

	// Combine all content for LLM processing
	var combinedContent strings.Builder
	for _, src := range allRawSources {
		combinedContent.WriteString(src.Content)
		combinedContent.WriteString("\n\n---\n\n") // Separator
	}
	textToProcess := combinedContent.String()

	// LLM-based entity and relationship extraction
	dp.telemetryClient.Log(telemetry.Info, "Starting LLM extraction for founder", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "text_length", Value: len(textToProcess)})
	dp.telemetryClient.RecordMetric("llm.extraction.total_tokens", float64(len(textToProcess)/4)) // Estimate tokens

	extractedEntities, err := dp.llmRouter.ExtractEntities(spanCtx, textToProcess, []string{"PERSON", "ORGANIZATION", "SKILL", "LOCATION", "EDUCATION"})
	if err != nil {
		dp.telemetryClient.Log(telemetry.Error, "LLM entity extraction failed", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
		dp.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeAIInferenceFailure,
			Source: "DataProcessor",
			Description: "LLM entity extraction failed",
			Details: map[string]interface{}{"founder_id": founderID, "error": err.Error()},
		})
		return fmt.Errorf("LLM entity extraction failed: %w", err)
	}
	dp.telemetryClient.Log(telemetry.Info, "LLM entity extraction complete", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "num_entities", Value: len(extractedEntities)})

	extractedRelationships, err := dp.llmRouter.ExtractRelationships(spanCtx, textToProcess, []string{"WORKS_AT", "FOUNDED", "INVESTED_IN", "STUDIED_AT", "HAS_SKILL", "LOCATED_IN"})
	if err != nil {
		dp.telemetryClient.Log(telemetry.Error, "LLM relationship extraction failed", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
		dp.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeAIInferenceFailure,
			Source: "DataProcessor",
			Description: "LLM relationship extraction failed",
			Details: map[string]interface{}{"founder_id": founderID, "error": err.Error()},
		})
		return fmt.Errorf("LLM relationship extraction failed: %w", err)
	}
	dp.telemetryClient.Log(telemetry.Info, "LLM relationship extraction complete", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "num_relationships", Value: len(extractedRelationships)})

	// Map LLM output to graph nodes and relationships (ontology alignment)
	graphNodes := make(map[string]GraphNode) // Use map to avoid duplicate nodes
	for _, entity := range extractedEntities {
		id := fmt.Sprintf("%s-%s", strings.ToLower(entity.Type), strings.ReplaceAll(entity.Value, " ", "-"))
		node := GraphNode{
			ID:     id,
			Labels: []string{entity.Type},
			Props:  make(map[string]interface{}),
		}
		node.Props["name"] = entity.Value
		for k, v := range entity.Properties {
			node.Props[k] = v
		}
		node.Props["source_data_processed_at"] = time.Now().Format(time.RFC3339)
		graphNodes[id] = node
	}

	var graphRelationships []GraphRelationship
	for _, rel := range extractedRelationships {
		sourceID := fmt.Sprintf("person-%s", strings.ReplaceAll(rel.SourceEntityValue, " ", "-")) // Simplified ID generation
		targetID := fmt.Sprintf("org-%s", strings.ReplaceAll(rel.TargetEntityValue, " ", "-"))   // Simplified ID generation

		// Ensure source and target nodes exist in our collected nodes, or create placeholders
		if _, ok := graphNodes[sourceID]; !ok {
			graphNodes[sourceID] = GraphNode{ID: sourceID, Labels: []string{"UnknownEntity"}, Props: map[string]interface{}{"name": rel.SourceEntityValue}}
		}
		if _, ok := graphNodes[targetID]; !ok {
			graphNodes[targetID] = GraphNode{ID: targetID, Labels: []string{"UnknownEntity"}, Props: map[string]interface{}{"name": rel.TargetEntityValue}}
		}

		relationship := GraphRelationship{
			StartNodeID: sourceID,
			EndNodeID:   targetID,
			Type:        rel.Type,
			Props:       make(map[string]interface{}),
		}
		for k, v := range rel.Properties {
			relationship.Props[k] = v
		}
		relationship.Props["source_data_processed_at"] = time.Now().Format(time.RFC3339)
		graphRelationships = append(graphRelationships, relationship)
	}

	// Ingest into graph database
	dp.telemetryClient.Log(telemetry.Info, "Ingesting extracted data into graph DB", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "num_nodes", Value: len(graphNodes), Key: "num_relationships", Value: len(graphRelationships)})
	for _, node := range graphNodes {
		err := dp.graphDBClient.IngestNode(spanCtx, node)
		if err != nil {
			dp.telemetryClient.Log(telemetry.Error, "Failed to ingest node into graph DB", telemetry.LogField{Key: "node_id", Value: node.ID, Key: "error", Value: err.Error()})
			dp.auditLogger.LogEvent(spanCtx, audit.Event{
				Type: audit.EventTypeDataPersistenceFailure,
				Source: "DataProcessor",
				Description: "Failed to ingest node into graph DB",
				Details: map[string]interface{}{"founder_id": founderID, "node_id": node.ID, "error": err.Error()},
			})
			return fmt.Errorf("failed to ingest node %s: %w", node.ID, err)
		}
	}
	for _, rel := range graphRelationships {
		err := dp.graphDBClient.IngestRelationship(spanCtx, rel)
		if err != nil {
			dp.telemetryClient.Log(telemetry.Error, "Failed to ingest relationship into graph DB", telemetry.LogField{Key: "start_node", Value: rel.StartNodeID, Key: "end_node", Value: rel.EndNodeID, Key: "type", Value: rel.Type, Key: "error", Value: err.Error()})
			dp.auditLogger.LogEvent(spanCtx, audit.Event{
				Type: audit.EventTypeDataPersistenceFailure,
				Source: "DataProcessor",
				Description: "Failed to ingest relationship into graph DB",
				Details: map[string]interface{}{"founder_id": founderID, "relationship_type": rel.Type, "error": err.Error()},
			})
			return fmt.Errorf("failed to ingest relationship %s between %s and %s: %w", rel.Type, rel.StartNodeID, rel.EndNodeID, err)
		}
	}

	// Publish event for downstream services (e.g., scoring, UI updates)
	event := eventbus.Event{
		Type:      "FounderDataProcessed",
		Timestamp: time.Now(),
		Payload:   map[string]interface{}{"founder_id": founderID, "status": "success"},
	}
	if err := dp.eventPublisher.Publish(spanCtx, "founder.data.processed", event); err != nil {
		dp.telemetryClient.Log(telemetry.Error, "Failed to publish FounderDataProcessed event", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
		dp.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeSystemError,
			Source: "DataProcessor",
			Description: "Failed to publish event after data processing",
			Details: map[string]interface{}{"founder_id": founderID, "error": err.Error()},
		})
	}

	dp.telemetryClient.Log(telemetry.Info, "Successfully processed and ingested data for founder", telemetry.LogField{Key: "founder_id", Value: founderID})
	dp.telemetryClient.RecordMetric("data_processor.process_founder_data.success", 1)
	dp.auditLogger.LogEvent(spanCtx, audit.Event{
		Type: audit.EventTypeDataIngestionSuccess,
		Source: "DataProcessor",
		Description: fmt.Sprintf("Successfully processed and ingested data for founder %s", founderID),
		Details: map[string]interface{}{"founder_id": founderID, "num_nodes": len(graphNodes), "num_relationships": len(graphRelationships)},
	})
	return nil
}

// --- Founder Scoring Logic ---

// FounderScorer calculates a score for a founder based on graph data.
type FounderScorer struct {
	graphDBClient GraphDBClient
	config        AppConfig
	telemetryClient TelemetryClient
	auditLogger AuditLogger
}

// NewFounderScorer creates a new FounderScorer.
func NewFounderScorer(gdb GraphDBClient, cfg AppConfig, tc TelemetryClient, al AuditLogger) *FounderScorer {
	return &FounderScorer{
		graphDBClient: gdb,
		config:        cfg,
		telemetryClient: tc,
		auditLogger: al,
	}
}

// ScoreFounder calculates a comprehensive score for a founder.
// This method queries the graph database to gather relevant data points
// and applies a weighted scoring algorithm.
func (s *FounderScorer) ScoreFounder(ctx context.Context, founderID string) (*FounderScoreResult, error) {
	spanCtx, span := s.telemetryClient.StartSpan(ctx, "FounderScorer.ScoreFounder")
	defer span.End()
	span.SetAttribute("founder_id", founderID)
	s.telemetryClient.RecordMetric("founder_scorer.score_founder.calls", 1)

	s.telemetryClient.Log(telemetry.Info, "Starting scoring for founder", telemetry.LogField{Key: "founder_id", Value: founderID})
	s.auditLogger.LogEvent(spanCtx, audit.Event{
		Type: audit.EventTypeAnalysisStart,
		Source: "FounderScorer",
		Description: fmt.Sprintf("Initiating founder scoring for %s", founderID),
		Details: map[string]interface{}{"founder_id": founderID},
	})

	// 1. Query for founder's experience (roles, companies founded)
	experienceQuery := `
		MATCH (f:Founder {id: $founderID})-[:WORKS_AT|FOUNDED]->(c:Company)
		OPTIONAL MATCH (f)-[r:WORKS_AT|FOUNDED]->(c)
		RETURN c.name AS companyName, r.title AS roleTitle, r.start_date AS startDate, r.end_date AS endDate, labels(c) AS companyLabels
	`
	experienceRecords, err := s.graphDBClient.ExecuteRead(spanCtx, experienceQuery, map[string]interface{}{"founderID": founderID})
	if err != nil {
		s.telemetryClient.Log(telemetry.Error, "Failed to query founder experience", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
		return nil, fmt.Errorf("failed to query founder experience: %w", err)
	}

	// 2. Query for founder's network (co-founders, investors, advisors)
	networkQuery := `
		MATCH (f:Founder {id: $founderID})-[rel]-(other)
		WHERE type(rel) IN ['CO_FOUNDED', 'INVESTED_IN', 'ADVISED_BY', 'MENTORED_BY']
		RETURN type(rel) AS relationshipType, other.name AS otherName, labels(other) AS otherLabels
	`
	networkRecords, err := s.graphDBClient.ExecuteRead(spanCtx, networkQuery, map[string]interface{}{"founderID": founderID})
	if err != nil {
		s.telemetryClient.Log(telemetry.Error, "Failed to query founder network", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
		return nil, fmt.Errorf("failed to query founder network: %w", err)
	}

	// 3. Query for founder's education
	educationQuery := `
		MATCH (f:Founder {id: $founderID})-[:STUDIED_AT]->(edu:Education)
		RETURN edu.institution AS institution, edu.degree AS degree, edu.field AS field, edu.end_date AS endDate
	`
	educationRecords, err := s.graphDBClient.ExecuteRead(spanCtx, educationQuery, map[string]interface{}{"founderID": founderID})
	if err != nil {
		s.telemetryClient.Log(telemetry.Error, "Failed to query founder education", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
		return nil, fmt.Errorf("failed to query founder education: %w", err)
	}

	// 4. Query for founder's skills and innovation indicators
	skillsQuery := `
		MATCH (f:Founder {id: $founderID})-[:HAS_SKILL]->(s:Skill)
		RETURN s.name AS skillName
	`
	skillsRecords, err := s.graphDBClient.ExecuteRead(spanCtx, skillsQuery, map[string]interface{}{"founderID": founderID})
	if err != nil {
		s.telemetryClient.Log(telemetry.Error, "Failed to query founder skills", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
		return nil, fmt.Errorf("failed to query founder skills: %w", err)
	}

	// 5. Query for risk factors
	riskQuery := `
		MATCH (f:Founder {id: $founderID})
		RETURN f.risk_factors AS riskFactors
	`
	riskRecords, err := s.graphDBClient.ExecuteRead(spanCtx, riskQuery, map[string]interface{}{"founderID": founderID})
	if err != nil {
		s.telemetryClient.Log(telemetry.Error, "Failed to query founder risk factors", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
		return nil, fmt.Errorf("failed to query founder risk factors: %w", err)
	}

	// --- Scoring Algorithm ---
	// This is a simplified example. A real system would have a more sophisticated,
	// potentially ML-driven, scoring model.

	breakdown := make(map[string]float64)
	totalScore := 0.0
	insights := []string{}
	warnings := []string{}

	// Experience Score
	experienceScore := 0.0
	for _, rec := range experienceRecords {
		companyName := rec["companyName"].(string)
		roleTitle := rec["roleTitle"].(string)
		// startDate := rec["startDate"].(time.Time) // Assuming Neo4j driver converts to time.Time
		// endDate := rec["endDate"].(time.Time)
		experienceScore += 1.0 // Base score for each role
		if strings.Contains(strings.ToLower(roleTitle), "founder") || strings.Contains(strings.ToLower(roleTitle), "ceo") {
			experienceScore += 2.0 // Higher weight for leadership/founder roles
			insights = append(insights, fmt.Sprintf("Founder has leadership experience as %s at %s.", roleTitle, companyName))
		}
		if strings.Contains(strings.ToLower(companyName), "unicorn") || strings.Contains(strings.ToLower(companyName), "faang") { // Example for high-profile companies
			experienceScore += 1.5
			insights = append(insights, fmt.Sprintf("Founder worked at high-profile company %s.", companyName))
		}
	}
	breakdown["experience"] = experienceScore * s.config.Scoring.WeightExperience
	totalScore += breakdown["experience"]

	// Network Score
	networkScore := 0.0
	for _, rec := range networkRecords {
		relType := rec["relationshipType"].(string)
		otherName := rec["otherName"].(string)
		networkScore += 0.5 // Base score for each connection
		if relType == "INVESTED_IN" {
			networkScore += 1.0 // Higher weight for investor connections
			insights = append(insights, fmt.Sprintf("Founder is connected to investor %s.", otherName))
		}
		if relType == "CO_FOUNDED" {
			networkScore += 1.5 // Higher weight for co-founder relationships
			insights = append(insights, fmt.Sprintf("Founder has co-founded with %s.", otherName))
		}
	}
	breakdown["network"] = networkScore * s.config.Scoring.WeightNetwork
	totalScore += breakdown["network"]

	// Education Score
	educationScore := 0.0
	for _, rec := range educationRecords {
		institution := rec["institution"].(string)
		degree := rec["degree"].(string)
		educationScore += 1.0 // Base score for each degree
		if strings.Contains(strings.ToLower(institution), "stanford") || strings.Contains(strings.ToLower(institution), "mit") { // Example for top universities
			educationScore += 1.5
			insights = append(insights, fmt.Sprintf("Founder attended a top-tier institution: %s.", institution))
		}
		if strings.Contains(strings.ToLower(degree), "phd") || strings.Contains(strings.ToLower(degree), "master") {
			educationScore += 0.5
		}
	}
	breakdown["education"] = educationScore * s.config.Scoring.WeightEducation
	totalScore += breakdown["education"]

	// Innovation/Skills Score
	innovationScore := 0.0
	for _, rec := range skillsRecords {
		skillName := rec["skillName"].(string)
		innovationScore += 0.5 // Base score for each skill
		if strings.Contains(strings.ToLower(skillName), "ai") || strings.Contains(strings.ToLower(skillName), "machine learning") || strings.Contains(strings.ToLower(skillName), "blockchain") {
			innovationScore += 1.0 // Higher weight for cutting-edge skills
			insights = append(insights, fmt.Sprintf("Founder possesses high-demand skill: %s.", skillName))
		}
	}
	breakdown["innovation"] = innovationScore * s.config.Scoring.WeightInnovation
	totalScore += breakdown["innovation"]

	// Risk Score (subtracted from total)
	riskScore := 0.0
	if len(riskRecords) > 0 {
		if riskFactors, ok := riskRecords[0]["riskFactors"].([]interface{}); ok {
			for _, rf := range riskFactors {
				if riskFactor, isString := rf.(string); isString {
					riskScore += 2.0 // Base penalty for each risk factor
					warnings = append(warnings, fmt.Sprintf("Identified risk factor: %s.", riskFactor))
				}
			}
		}
	}
	breakdown["risk"] = riskScore * s.config.Scoring.WeightRisk // This weight should be negative or applied as subtraction
	totalScore -= breakdown["risk"]

	// Normalize score to a 0-100 scale (example, adjust max possible score)
	// This is a placeholder; a real system would have a more robust normalization.
	maxPossibleScore := 100.0 // Assuming max raw score could be around 100 for this example
	if totalScore > maxPossibleScore {
		totalScore = maxPossibleScore
	}
	if totalScore < 0 {
		totalScore = 0
	}

	// Update founder node with the calculated score
	updateScoreQuery := `
		MATCH (f:Founder {id: $founderID})
		SET f.score = $score, f.scoreUpdatedAt = datetime()
		RETURN f
	`
	_, err = s.graphDBClient.ExecuteWrite(spanCtx, updateScoreQuery, map[string]interface{}{"founderID": founderID, "score": totalScore})
	if err != nil {
		s.telemetryClient.Log(telemetry.Error, "Failed to update founder score in graph DB", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
		s.auditLogger.LogEvent(spanCtx, audit.Event{
			Type: audit.EventTypeDataPersistenceFailure,
			Source: "FounderScorer",
			Description: "Failed to update founder score in graph DB",
			Details: map[string]interface{}{"founder_id": founderID, "error": err.Error()},
		})
	}

	result := &FounderScoreResult{
		FounderID: founderID,
		Score:     totalScore,
		Breakdown: breakdown,
		Insights:  insights,
		Warnings:  warnings,
		Disclaimer: "This score is generated by an AI model based on available data and should not be considered financial, legal, or investment advice. It is for informational purposes only and does not guarantee future performance or suitability. Always conduct independent due diligence.",
	}

	s.telemetryClient.Log(telemetry.Info, "Founder scoring complete", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "score", Value: totalScore})
	s.telemetryClient.RecordMetric("founder_scorer.score_founder.success", 1)
	s.auditLogger.LogEvent(spanCtx, audit.Event{
		Type: audit.EventTypeAnalysisSuccess,
		Source: "FounderScorer",
		Description: fmt.Sprintf("Successfully scored founder %s", founderID),
		Details: map[string]interface{}{"founder_id": founderID, "score": totalScore, "breakdown": breakdown},
	})

	return result, nil
}

// --- Service Implementation ---

// FounderBackgroundScorerService orchestrates all components.
type FounderBackgroundScorerService struct {
	config AppConfig
	authClient AuthClient
	eventPublisher EventPublisher
	ontologyMapper OntologyMapper
	telemetryClient TelemetryClient
	auditLogger AuditLogger
	featureFlagManager FeatureFlagManager

	graphDBClient GraphDBClient
	llmRouter     *MultiModelLLMRouter
	dataProcessor *DataProcessor
	founderScorer *FounderScorer
	router        *gin.Engine
}

// NewFounderBackgroundScorerService initializes the service.
func NewFounderBackgroundScorerService(cfg AppConfig) (*FounderBackgroundScorerService, error) {
	// Initialize shared SDK components (simulated)
	// In a real project, these would be injected or retrieved from a global registry.
	authClient := &auth.MockAuthClient{} // Using mock for shared SDK
	eventPublisher := &eventbus.MockEventPublisher{}
	ontologyMapper := &ontology.MockOntologyMapper{}
	telemetryClient := telemetry.NewMockTelemetryClient(cfg.Service.LogLevel)
	auditLogger := audit.NewMockAuditLogger()
	featureFlagManager := featureflags.NewMockFeatureFlagManager(cfg.FeatureFlags)

	// Initialize core components
	graphDBClient, err := NewNeo4jClient(cfg, telemetryClient, auditLogger)
	if err != nil {
		return nil, fmt.Errorf("failed to create Neo4j client: %w", err)
	}

	llmRouter := NewMultiModelLLMRouter(cfg, telemetryClient, auditLogger)

	ingestors := make(map[string]DataIngestor)
	ingestors["public"] = NewPublicDataIngestor(cfg, telemetryClient, auditLogger, featureFlagManager)
	ingestors["internal"] = NewInternalDataIngestor(cfg, telemetryClient, auditLogger, featureFlagManager)

	dataProcessor := NewDataProcessor(graphDBClient, llmRouter, ingestors, ontologyMapper, eventPublisher, telemetryClient, auditLogger)
	founderScorer := NewFounderScorer(graphDBClient, cfg, telemetryClient, auditLogger)

	// Setup Gin router
	gin.SetMode(gin.ReleaseMode) // Use ReleaseMode for production
	if cfg.Service.Environment == "development" {
		gin.SetMode(gin.DebugMode)
	}
	router := gin.New()
	router.Use(gin.Logger()) // Use Gin's default logger
	router.Use(gin.Recovery()) // Recover from panics

	service := &FounderBackgroundScorerService{
		config:             cfg,
		authClient:         authClient,
		eventPublisher:     eventPublisher,
		ontologyMapper:     ontologyMapper,
		telemetryClient:    telemetryClient,
		auditLogger:        auditLogger,
		featureFlagManager: featureFlagManager,
		graphDBClient:      graphDBClient,
		llmRouter:          llmRouter,
		dataProcessor:      dataProcessor,
		founderScorer:      founderScorer,
		router:             router,
	}

	service.setupRoutes()
	return service, nil
}

// setupRoutes configures the HTTP API endpoints.
func (s *FounderBackgroundScorerService) setupRoutes() {
	// Middleware for authentication and authorization
	authMiddleware := func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			s.telemetryClient.Log(telemetry.Warn, "Authentication required", telemetry.LogField{Key: "path", Value: c.Request.URL.Path})
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			return
		}
		user, err := s.authClient.Authenticate(token)
		if err != nil {
			s.telemetryClient.Log(telemetry.Warn, "Authentication failed", telemetry.LogField{Key: "error", Value: err.Error(), Key: "path", Value: c.Request.URL.Path})
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authentication token"})
			return
		}
		c.Set("user", user) // Store user context for later use
		s.auditLogger.LogEvent(c.Request.Context(), audit.Event{
			Type: audit.EventTypeAuthSuccess,
			Source: "AuthMiddleware",
			Description: "User authenticated",
			Details: map[string]interface{}{"user_id": user.UserID, "path": c.Request.URL.Path},
		})
		c.Next()
	}

	// Middleware for audit logging specific actions
	auditLogAction := func(actionType audit.EventType, description string) gin.HandlerFunc {
		return func(c *gin.Context) {
			user, exists := c.Get("user")
			userID := "anonymous"
			if exists {
				if uc, ok := user.(auth.UserContext); ok {
					userID = uc.UserID
				}
			}
			s.auditLogger.LogEvent(c.Request.Context(), audit.Event{
				Type: actionType,
				Source: "API",
				Description: description,
				Details: map[string]interface{}{"user_id": userID, "path": c.Request.URL.Path, "method": c.Request.Method},
			})
			c.Next()
		}
	}

	api := s.router.Group("/api/v1")
	api.Use(authMiddleware) // Apply auth to all API endpoints

	// Ingestion endpoint
	api.POST("/ingest/:founderID", auditLogAction(audit.EventTypeDataIngestionRequest, "Request to ingest founder data"), s.handleIngestFounderData)

	// Scoring endpoint
	api.GET("/score/:founderID", auditLogAction(audit.EventTypeAnalysisRequest, "Request to score founder background"), s.handleScoreFounder)

	// Graph Query endpoint
	api.POST("/query", auditLogAction(audit.EventTypeDataAccessRequest, "Request to query graph database"), s.handleGraphQuery)

	// Self-querying agent endpoints (no auth for introspection, but sensitive info should be filtered)
	s.router.GET("/introspect", s.handleIntrospect)
	s.router.GET("/assumptions", s.handleAssumptions)
	s.router.GET("/failure-modes", s.handleFailureModes)
	s.router.GET("/update-triggers", s.handleUpdateTriggers)

	s.telemetryClient.Log(telemetry.Info, "API routes configured.")
}

// handleIngestFounderData handles requests to ingest data for a founder.
func (s *FounderBackgroundScorerService) handleIngestFounderData(c *gin.Context) {
	founderID := c.Param("founderID")
	if founderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "founderID is required"})
		return
	}

	// Authorization check: ensure user has permission to trigger ingestion
	user := c.MustGet("user").(auth.UserContext)
	if err := s.authClient.Authorize(user, "founder:ingest"); err != nil {
		s.telemetryClient.Log(telemetry.Warn, "Authorization failed for data ingestion", telemetry.LogField{Key: "user_id", Value: user.UserID, Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: " + err.Error()})
		return
	}

	// Asynchronous processing for ingestion to avoid blocking the API request
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute) // Long timeout for ingestion
		defer cancel()
		// Re-establish context with tracing if needed, or pass the original context
		// For simplicity, using a new background context here.
		if err := s.dataProcessor.ProcessFounderData(ctx, founderID); err != nil {
			s.telemetryClient.Log(telemetry.Error, "Asynchronous data ingestion failed", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
			s.eventPublisher.Publish(context.Background(), "founder.ingestion.failed", map[string]string{"founder_id": founderID, "error": err.Error()})
			s.auditLogger.LogEvent(context.Background(), audit.Event{
				Type: audit.EventTypeDataIngestionFailure,
				Source: "API",
				Description: "Asynchronous data ingestion failed",
				Details: map[string]interface{}{"founder_id": founderID, "error": err.Error(), "triggered_by": user.UserID},
			})
		} else {
			s.telemetryClient.Log(telemetry.Info, "Asynchronous data ingestion completed successfully", telemetry.LogField{Key: "founder_id", Value: founderID})
			s.eventPublisher.Publish(context.Background(), "founder.ingestion.success", map[string]string{"founder_id": founderID})
			s.auditLogger.LogEvent(context.Background(), audit.Event{
				Type: audit.EventTypeDataIngestionSuccess,
				Source: "API",
				Description: "Asynchronous data ingestion completed",
				Details: map[string]interface{}{"founder_id": founderID, "triggered_by": user.UserID},
			})
		}
	}()

	c.JSON(http.StatusAccepted, gin.H{"message": "Data ingestion initiated for founder", "founder_id": founderID})
}

// handleScoreFounder handles requests to score a founder.
func (s *FounderBackgroundScorerService) handleScoreFounder(c *gin.Context) {
	founderID := c.Param("founderID")
	if founderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "founderID is required"})
		return
	}

	user := c.MustGet("user").(auth.UserContext)
	if err := s.authClient.Authorize(user, "founder:score"); err != nil {
		s.telemetryClient.Log(telemetry.Warn, "Authorization failed for founder scoring", telemetry.LogField{Key: "user_id", Value: user.UserID, Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: " + err.Error()})
		return
	}

	// If real-time scoring is disabled, check if a score exists and return it.
	if !s.config.FeatureFlags.EnableRealtimeScoring {
		s.telemetryClient.Log(telemetry.Info, "Real-time scoring disabled, attempting to retrieve cached score.", telemetry.LogField{Key: "founder_id", Value: founderID})
		// Query Neo4j for existing score
		query := `MATCH (f:Founder {id: $founderID}) RETURN f.score AS score, f.scoreUpdatedAt AS scoreUpdatedAt, f.risk_factors AS riskFactors`
		records, err := s.graphDBClient.ExecuteRead(c.Request.Context(), query, map[string]interface{}{"founderID": founderID})
		if err == nil && len(records) > 0 {
			score, ok := records[0]["score"].(float64)
			if ok {
				result := &FounderScoreResult{
					FounderID: founderID,
					Score:     score,
					Disclaimer: "This score is based on previously processed data. Real-time scoring is currently disabled. Always conduct independent due diligence.",
				}
				if riskFactors, rfOk := records[0]["riskFactors"].([]interface{}); rfOk {
					for _, rf := range riskFactors {
						if rfs, isString := rf.(string); isString {
							result.Warnings = append(result.Warnings, fmt.Sprintf("Identified risk factor: %s.", rfs))
						}
					}
				}
				c.JSON(http.StatusOK, result)
				return
			}
		}
		s.telemetryClient.Log(telemetry.Warn, "No cached score found and real-time scoring disabled.", telemetry.LogField{Key: "founder_id", Value: founderID})
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Real-time scoring is currently disabled and no cached score found. Please try again later or enable real-time scoring."})
		return
	}

	scoreResult, err := s.founderScorer.ScoreFounder(c.Request.Context(), founderID)
	if err != nil {
		s.telemetryClient.Log(telemetry.Error, "Failed to score founder", telemetry.LogField{Key: "founder_id", Value: founderID, Key: "error", Value: err.Error()})
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to score founder: %v", err)})
		return
	}

	c.JSON(http.StatusOK, scoreResult)
}

// GraphQueryRequest defines the structure for a graph query request.
type GraphQueryRequest struct {
	Query  string                 `json:"query" binding:"required"`
	Params map[string]interface{} `json:"params"`
	Write  bool                   `json:"write"` // True for write queries, false for read queries
}

// handleGraphQuery allows executing arbitrary Cypher queries (with caution).
func (s *FounderBackgroundScorerService) handleGraphQuery(c *gin.Context) {
	var req GraphQueryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := c.MustGet("user").(auth.UserContext)
	permission := "graph:read"
	if req.Write {
		permission = "graph:write"
	}
	if err := s.authClient.Authorize(user, permission); err != nil {
		s.telemetryClient.Log(telemetry.Warn, "Authorization failed for graph query", telemetry.LogField{Key: "user_id", Value: user.UserID, Key: "permission", Value: permission, Key: "error", Value: err.Error()})
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: " + err.Error()})
		return
	}

	var (
		results []map[string]interface{}
		err     error
	)

	if req.Write {
		results, err = s.graphDBClient.ExecuteWrite(c.Request.Context(), req.Query, req.Params)
		s.auditLogger.LogEvent(c.Request.Context(), audit.Event{
			Type: audit.EventTypeDataAccessWrite,
			Source: "API",
			Description: "Graph write query executed",
			Details: map[string]interface{}{"user_id": user.UserID, "query_snippet": req.Query[:min(len(req.Query), 100)], "success": err == nil},
		})
	} else {
		results, err = s.graphDBClient.ExecuteRead(c.Request.Context(), req.Query, req.Params)
		s.auditLogger.LogEvent(c.Request.Context(), audit.Event{
			Type: audit.EventTypeDataAccessRead,
			Source: "API",
			Description: "Graph read query executed",
			Details: map[string]interface{}{"user_id": user.UserID, "query_snippet": req.Query[:min(len(req.Query), 100)], "success": err == nil},
		})
	}

	if err != nil {
		s.telemetryClient.Log(telemetry.Error, "Graph query failed", telemetry.LogField{Key: "query_type", Value: permission, Key: "error", Value: err.Error()})
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Graph query failed: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"results": results})
}

// --- Self-Querying Agent Endpoints ---

// handleIntrospect provides an overview of the service's current state and capabilities.
func (s *FounderBackgroundScorerService) handleIntrospect(c *gin.Context) {
	s.telemetryClient.Log(telemetry.Info, "Introspect endpoint called.")
	c.JSON(http.StatusOK, gin.H{
		"service_name": "APP_04_Analysis_FounderBackgroundScorer",
		"description":  "AI-powered service for analyzing and scoring founder backgrounds using graph database and LLMs.",
		"version":      "1.0.0",
		"status":       "operational",
		"capabilities": []string{
			"Founder data ingestion (public & internal sources)",
			"LLM-based entity and relationship extraction (Mistral, Llama)",
			"Graph database storage and querying (Neo4j)",
			"Founder background scoring algorithm",
			"API for triggering ingestion and retrieving scores",
			"Extensibility via DataIngestor and LLMClient interfaces",
			"Shared authentication and authorization",
			"Typed event bus for inter-service communication",
			"Unified ontology adherence",
			"Telemetry (metrics, tracing, logging)",
			"Audit logging",
			"Feature flag management",
		},
		"integrations": map[string]interface{}{
			"graph_database": "Neo4j",
			"llm_providers":  []string{"Mistral AI", "Llama (Meta AI)"},
			"data_sources":   []string{"Crunchbase (simulated)", "LinkedIn (simulated)", "SEC Filings (simulated)", "Internal CRM (simulated)", "Internal HRIS (simulated)"},
			"shared_sdk":     []string{"auth", "eventbus", "ontology", "telemetry", "audit", "featureflags"},
			"adjacent_apps":  strings.Split(agentMetadata.AdjacentApps, ", "),
		},
		"current_config_summary": map[string]interface{}{
			"environment":                 s.config.Service.Environment,
			"neo4j_uri":                   s.config.Neo4j.URI,
			"llm_default_model":           s.config.LLM.DefaultModel,
			"enable_public_data_ingestion": s.config.FeatureFlags.EnablePublicDataIngestion,
			"enable_internal_data_ingestion": s.config.FeatureFlags.EnableInternalDataIngestion,
			"enable_jurisdictional_filtering": s.config.FeatureFlags.EnableJurisdictionalFiltering,
			"enable_realtime_scoring":     s.config.FeatureFlags.EnableRealtimeScoring,
			"enable_graph_schema_validation": s.config.FeatureFlags.EnableGraphSchemaValidation,
			"enable_llm_caching":          s.config.FeatureFlags.EnableLLMCaching,
		},
		"monetization_surfaces": []string{
			"API access for founder data ingestion and scoring (per-call, tiered access)",
			"Premium data sources integration (higher subscription tiers)",
			"Custom scoring model development and deployment for enterprise clients",
			"Advanced analytics and reporting on founder ecosystems (e.g., network analysis, trend identification)",
			"Compliance and audit reporting features for regulated industries",
			"Integration with internal enterprise systems (CRM, HRIS) for enhanced internal due diligence",
			"Real-time data updates and scoring for high-frequency use cases",
		},
		"cost_drivers": []string{
			"LLM API calls (token usage, model complexity)",
			"Graph database compute and storage (query complexity, data volume)",
			"External data source API subscriptions",
			"Infrastructure costs (servers, networking, data transfer)",
			"Data processing compute (CPU/memory for ingestion, parsing, graph operations)",
			"Developer and maintenance overhead",
		},
		"tension_design": "The service balances **Speed vs Safety** by offering rapid ingestion of public data for quick insights, while implementing rigorous jurisdictional filtering and audit logging for sensitive internal data to ensure privacy and compliance. It also balances **Data Breadth vs Data Privacy** by integrating diverse sources while providing granular control over what data is ingested and processed.",
	})
}

// handleAssumptions lists key assumptions made in the service's design and operation.
func (s *FounderBackgroundScorerService) handleAssumptions(c *gin.Context) {
	s.telemetryClient.Log(telemetry.Info, "Assumptions endpoint called.")
	c.JSON(http.StatusOK, gin.H{
		"service_name": "APP_04_Analysis_FounderBackgroundScorer",
		"assumptions": []string{
			"External LLM providers (Mistral, Llama) are reliable and maintain their API contracts.",
			"Graph database (Neo4j) is available, performant, and scalable for the expected data volume and query load.",
			"Shared core SDK components (auth, eventbus, ontology, telemetry, audit, featureflags) are functional and accessible.",
			"Data from public sources (Crunchbase, LinkedIn, SEC) is generally accurate and available via APIs (or simulated access).",
			"Internal data sources (CRM, HRIS) provide structured or semi-structured data that can be processed.",
			"The unified ontology is stable and adequately covers the domain concepts for founder analysis.",
			"Network connectivity to all external APIs and internal services is stable.",
			"The scoring algorithm, while configurable, is fundamentally sound for its intended purpose.",
			"Users of the API understand the disclaimer regarding AI-generated scores and conduct their own due diligence.",
			"Jurisdictional controls are correctly configured and enforced by feature flags and data processing logic.",
		},
	})
}

// handleFailureModes describes potential failure points and their impacts.
func (s *FounderBackgroundScorerService) handleFailureModes(c *gin.Context) {
	s.telemetryClient.Log(telemetry.Info, "Failure modes endpoint called.")
	c.JSON(http.StatusOK, gin.H{
		"service_name": "APP_04_Analysis_FounderBackgroundScorer",
		"failure_modes": []map[string]string{
			{"mode": "LLM API Rate Limiting/Outage", "impact": "Entity/relationship extraction fails, leading to incomplete or no data for scoring. Scores become stale or unavailable.", "mitigation": "Retry logic, multi-model routing, caching LLM responses, circuit breakers, fallback to default values."},
			{"mode": "Graph Database Unavailability/Performance Degradation", "impact": "Data ingestion fails, scoring queries time out, API becomes unresponsive. Data consistency issues.", "mitigation": "Database clustering, replication, connection pooling, query optimization, monitoring, graceful degradation (e.g., serving stale scores)."},
			{"mode": "External Data Source API Changes/Outages", "impact": "Incomplete data ingestion, leading to less accurate or biased scores. Data freshness issues.", "mitigation": "API adapters, robust error handling, monitoring external APIs, fallback to cached data, alerting on data source failures."},
			{"mode": "Internal Data Source Connectivity Issues", "impact": "Critical internal data cannot be ingested, leading to incomplete or inaccurate internal analysis. Compliance risks.", "mitigation": "Secure network connectivity, robust retry mechanisms, data source health checks, clear audit trails for data access failures."},
			{"mode": "Ontology Mismatch/Schema Drift", "impact": "Data ingestion failures, incorrect graph structure, scoring algorithm errors. Data integrity compromised.", "mitigation": "Schema validation, versioning of ontology, robust data transformation logic, automated testing for schema changes."},
			{"mode": "Authentication/Authorization Service Failure", "impact": "All API endpoints become inaccessible, preventing any operation. Security breach risk if not handled correctly.", "mitigation": "High availability for auth service, robust error handling, clear separation of concerns, emergency access procedures."},
			{"mode": "Event Bus Failure", "impact": "Asynchronous processes (like post-ingestion scoring triggers) fail to initiate or complete. Loss of inter-service communication.", "mitigation": "Durable message queues, dead-letter queues, retry mechanisms, monitoring of event delivery."},
			{"mode": "Jurisdictional Control Misconfiguration", "impact": "Sensitive data processed or stored in violation of regulations (e.g., GDPR). Significant legal and reputational risk.", "mitigation": "Strict configuration management, automated compliance checks, clear feature flag documentation, regular security audits."},
			{"mode": "Scoring Algorithm Bias/Errors", "impact": "Scores are inaccurate, unfair, or misleading, leading to poor business decisions. Reputational damage.", "mitigation": "Regular model evaluation, explainability features, human-in-the-loop review, A/B testing of scoring models, diverse training data (if ML-driven)."},
		},
	})
}

// handleUpdateTriggers describes conditions or events that would trigger updates or redeployments.
func (s *FounderBackgroundScorerService) handleUpdateTriggers(c *gin.Context) {
	s.telemetryClient.Log(telemetry.Info, "Update triggers endpoint called.")
	c.JSON(http.StatusOK, gin.H{
		"service_name": "APP_04_Analysis_FounderBackgroundScorer",
		"update_triggers": []map[string]string{
			{"trigger": "New LLM Model Release/API Update", "action": "Update LLM client adapters, re-evaluate model performance, potentially retrain or fine-tune extraction prompts."},
			{"trigger": "Graph Database Schema Evolution", "action": "Develop and deploy database migration scripts, update data models and ingestion logic."},
			{"trigger": "New Data Source Integration", "action": "Implement new DataIngestor, update configuration, extend ontology if necessary."},
			{"trigger": "Changes in Regulatory Compliance (e.g., GDPR, CCPA)", "action": "Review and update data ingestion, processing, storage, and access controls. Adjust jurisdictional filtering logic."},
			{"trigger": "Performance Bottleneck Identified", "action": "Optimize graph queries, scale infrastructure, implement caching strategies, refactor data processing pipelines."},
			{"trigger": "Security Vulnerability Patch", "action": "Apply security patches to dependencies, update underlying infrastructure, conduct security audits."},
			{"trigger": "Scoring Algorithm Improvement", "action": "Update scoring logic, re-evaluate historical scores, potentially re-process existing data."},
			{"trigger": "Core SDK Updates", "action": "Integrate new versions of shared auth, eventbus, telemetry, etc., ensuring compatibility."},
			{"trigger": "Feature Flag Configuration Change", "action": "Monitor impact of flag changes, potentially requiring code adjustments if new variants are introduced."},
			{"trigger": "Feedback from Users/Analysts", "action": "Iterate on data quality, scoring accuracy, and user experience based on operational feedback."},
		},
	})
}

// Run starts the HTTP server.
func (s *FounderBackgroundScorerService) Run() error {
	// Connect to Neo4j
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := s.graphDBClient.Connect(ctx); err != nil {
		return fmt.Errorf("failed to connect to graph database: %w", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := s.graphDBClient.Close(ctx); err != nil {
			s.telemetryClient.Log(telemetry.Error, "Failed to close graph database connection during shutdown", telemetry.LogField{Key: "error", Value: err.Error()})
		}
	}()

	// Ensure graph schema (constraints, indices)
	if s.config.FeatureFlags.EnableGraphSchemaValidation {
		// A real ontology.Schema would be passed here. For now, a mock.
		mockSchema := ontology.Schema{
			Name: "FounderGraphSchema",
			Entities: []ontology.EntitySchema{
				{Name: "Founder", Properties: map[string]string{"id": "string", "name": "string"}},
				{Name: "Company", Properties: map[string]string{"id": "string", "name": "string"}},
			},
			Relationships: []ontology.RelationshipSchema{
				{Name: "WORKS_AT", From: "Founder", To: "Company"},
				{Name: "FOUNDED", From: "Founder", To: "Company"},
			},
		}
		if err := s.graphDBClient.EnsureSchema(ctx, mockSchema); err != nil {
			s.telemetryClient.Log(telemetry.Error, "Failed to ensure graph schema", telemetry.LogField{Key: "error", Value: err.Error()})
			return fmt.Errorf("failed to ensure graph schema: %w", err)
		}
	}

	addr := fmt.Sprintf(":%s", s.config.Service.Port)
	srv := &http.Server{
		Addr:    addr,
		Handler: s.router,
	}

	// Start HTTP server in a goroutine
	go func() {
		s.telemetryClient.Log(telemetry.Info, fmt.Sprintf("Service listening on %s", addr))
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			s.telemetryClient.Log(telemetry.Fatal, "HTTP server failed", telemetry.LogField{Key: "error", Value: err.Error()})
			os.Exit(1) // Exit if server fails to start
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	s.telemetryClient.Log(telemetry.Info, "Shutting down server...")

	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancelShutdown()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		s.telemetryClient.Log(telemetry.Error, "Server forced to shutdown", telemetry.LogField{Key: "error", Value: err.Error()})
		return fmt.Errorf("server forced to shutdown: %w", err)
	}

	s.telemetryClient.Log(telemetry.Info, "Server exiting gracefully.")
	return nil
}

// min is a helper function to get the minimum of two integers.
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// --- Main Function ---

func main() {
	// Initialize configuration
	if err := initConfig(); err != nil {
		log.Fatalf("Failed to initialize configuration: %v", err)
	}

	// Create and run the service
	service, err := NewFounderBackgroundScorerService(appConfig)
	if err != nil {
		log.Fatalf("Failed to create FounderBackgroundScorerService: %v", err)
	}

	if err := service.Run(); err != nil {
		log.Fatalf("Service terminated with error: %v", err)
	}
}

// --- Mock Implementations for Shared Core SDK (for compilation) ---
// In a real project, these would be actual imports from `core_sdk` modules.

package auth

import "fmt"

type UserContext struct {
	UserID    string
	Roles     []string
	TenantID  string
	Metadata  map[string]string
}

type MockAuthClient struct{}

func (m *MockAuthClient) Authenticate(token string) (UserContext, error) {
	if token == "Bearer valid-token" {
		return UserContext{UserID: "testuser", Roles: []string{"admin", "analyst"}, TenantID: "default", Metadata: map[string]string{"source": "mock"}}, nil
	}
	return UserContext{}, fmt.Errorf("invalid token")
}

func (m *MockAuthClient) Authorize(user UserContext, permission string) error {
	if user.UserID == "testuser" && (permission == "founder:ingest" || permission == "founder:score" || permission == "graph:read" || permission == "graph:write") {
		return nil // Mock: testuser has all permissions
	}
	return fmt.Errorf("user %s not authorized for %s", user.UserID, permission)
}

package eventbus

import (
	"context"
	"fmt"
	"log"
	"time"
)

type Event struct {
	Type      string
	Timestamp time.Time
	Payload   interface{}
	Metadata  map[string]string
}

type MockEventPublisher struct{}

func (m *MockEventPublisher) Publish(ctx context.Context, topic string, event interface{}) error {
	log.Printf("[MOCK EVENTBUS] Published to topic '%s': %+v\n", topic, event)
	return nil
}

package ontology

import "fmt"

type OntologyEntity struct {
	Type       string
	ID         string
	Properties map[string]interface{}
}

type Schema struct {
	Name          string
	Entities      []EntitySchema
	Relationships []RelationshipSchema
}

type EntitySchema struct {
	Name       string
	Properties map[string]string // propertyName -> type
}

type RelationshipSchema struct {
	Name string
	From string
	To   string
}

type MockOntologyMapper struct{}

func (m *MockOntologyMapper) MapToOntology(data interface{}) (OntologyEntity, error) {
	// Simplified mock mapping
	if f, ok := data.(map[string]interface{}); ok {
		if id, idOk := f["id"].(string); idOk {
			return OntologyEntity{Type: "Generic", ID: id, Properties: f}, nil
		}
	}
	return OntologyEntity{}, fmt.Errorf("mock ontology mapper failed to map data")
}

func (m *MockOntologyMapper) MapFromOntology(entity OntologyEntity, target interface{}) error {
	// Simplified mock mapping
	return fmt.Errorf("mock ontology mapper not implemented for MapFromOntology")
}

func (m *MockOntologyMapper) GetSchema(entityType string) (Schema, error) {
	// Simplified mock schema retrieval
	return Schema{Name: "MockSchema"}, nil
}

package telemetry

import (
	"context"
	"log"
	"time"
	"strings"
)

type LogLevel int

const (
	Debug LogLevel = iota
	Info
	Warn
	Error
	Fatal
)

func (l LogLevel) String() string {
	switch l {
	case Debug: return "DEBUG"
	case Info:  return "INFO"
	case Warn:  return "WARN"
	case Error: return "ERROR"
	case Fatal: return "FATAL"
	default:    return "UNKNOWN"
	}
}

type LogField struct {
	Key   string
	Value interface{}
}

type Span interface {
	End()
	SetAttribute(key string, value interface{})
	RecordError(err error)
}

type mockSpan struct {
	name string
	start time.Time
	attributes map[string]interface{}
}

func (s *mockSpan) End() {
	log.Printf("[MOCK TRACE] Span '%s' ended. Duration: %v, Attributes: %+v\n", s.name, time.Since(s.start), s.attributes)
}
func (s *mockSpan) SetAttribute(key string, value interface{}) {
	s.attributes[key] = value
}
func (s *mockSpan) RecordError(err error) {
	log.Printf("[MOCK TRACE] Span '%s' recorded error: %v\n", s.name, err)
}

type MockTelemetryClient struct {
	minLogLevel LogLevel
}

func NewMockTelemetryClient(logLevel string) *MockTelemetryClient {
	level := Info
	switch strings.ToLower(logLevel) {
	case "debug": level = Debug
	case "info":  level = Info
	case "warn":  level = Warn
	case "error": level = Error
	case "fatal": level = Fatal
	}
	return &MockTelemetryClient{minLogLevel: level}
}

func (m *MockTelemetryClient) RecordMetric(name string, value float64, tags ...string) {
	if m.minLogLevel <= Debug {
		log.Printf("[MOCK METRIC] %s: %f (tags: %v)\n", name, value, tags)
	}
}

func (m *MockTelemetryClient) StartSpan(ctx context.Context, name string) (context.Context, Span) {
	if m.minLogLevel <= Debug {
		log.Printf("[MOCK TRACE] Span '%s' started.\n", name)
	}
	return ctx, &mockSpan{name: name, start: time.Now(), attributes: make(map[string]interface{})}
}

func (m *MockTelemetryClient) Log(level LogLevel, message string, fields ...LogField) {
	if level >= m.minLogLevel {
		fieldStr := ""
		for _, f := range fields {
			fieldStr += fmt.Sprintf(" %s=%v", f.Key, f.Value)
		}
		log.Printf("[MOCK LOG] [%s] %s%s\n", level.String(), message, fieldStr)
	}
}

package audit

import (
	"context"
	"log"
	"time"
)

type EventType string

const (
	EventTypeAuthSuccess        EventType = "AUTH_SUCCESS"
	EventTypeAuthFailure        EventType = "AUTH_FAILURE"
	EventTypeDataAccessRead     EventType = "DATA_ACCESS_READ"
	EventTypeDataAccessWrite    EventType = "DATA_ACCESS_WRITE"
	EventTypeDataAccessFailure  EventType = "DATA_ACCESS_FAILURE"
	EventTypeDataIngestionStart EventType = "DATA_INGESTION_START"
	EventTypeDataIngestionSuccess EventType = "DATA_INGESTION_SUCCESS"
	EventTypeDataIngestionFailure EventType = "DATA_INGESTION_FAILURE"
	EventTypeDataIngestionWarning EventType = "DATA_INGESTION_WARNING"
	EventTypeAIInferenceSuccess EventType = "AI_INFERENCE_SUCCESS"
	EventTypeAIInferenceFailure EventType = "AI_INFERENCE_FAILURE"
	EventTypeAnalysisStart      EventType = "ANALYSIS_START"
	EventTypeAnalysisSuccess    EventType = "ANALYSIS_SUCCESS"
	EventTypeAnalysisFailure    EventType = "ANALYSIS_FAILURE"
	EventTypeSystemError        EventType = "SYSTEM_ERROR"
	EventTypeSystemWarning      EventType = "SYSTEM_WARNING"
	EventTypeDataIngestionRequest EventType = "DATA_INGESTION_REQUEST"
	EventTypeAnalysisRequest    EventType = "ANALYSIS_REQUEST"
)

type Event struct {
	Timestamp   time.Time              `json:"timestamp"`
	Type        EventType              `