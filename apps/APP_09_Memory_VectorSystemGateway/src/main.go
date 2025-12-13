package main

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/patrickmn/go-cache"

	// Shared Core SDK imports
	"APP_09_Memory_VectorSystemGateway/pkg/auth"
	"APP_09_Memory_VectorSystemGateway/pkg/common"
	"APP_09_Memory_VectorSystemGateway/pkg/events"
	"APP_09_Memory_VectorSystemGateway/pkg/metrics"
	"APP_09_Memory_VectorSystemGateway/pkg/ontology"

	// Vendor-specific adapters (placeholders for actual SDKs)
	"APP_09_Memory_VectorSystemGateway/internal/adapters/pinecone"
	"APP_09_Memory_VectorSystemGateway/internal/adapters/weaviate"
	"APP_09_Memory_VectorSystemGateway/internal/adapters/qdrant"
	"APP_09_Memory_VectorSystemGateway/internal/adapters/milvus"
	"APP_09_Memory_VectorSystemGateway/internal/adapters/chroma"
)

const (
	// APIVersion defines the current version of the API.
	APIVersion = "v1"
	// DefaultCacheTTL is the default time-to-live for cached items.
	DefaultCacheTTL = 5 * time.Minute
	// DefaultCacheCleanupInterval is how often expired items are removed from the cache.
	DefaultCacheCleanupInterval = 10 * time.Minute
	// DefaultMaxConnectionsPerProvider is the default maximum number of concurrent connections per vector DB provider.
	DefaultMaxConnectionsPerProvider = 10
	// DefaultRequestTimeout is the default timeout for upstream vector DB requests.
	DefaultRequestTimeout = 30 * time.Second
	// MaxVectorDimension is a safety limit for vector dimensions.
	MaxVectorDimension = 4096
	// MaxQueryK is a safety limit for the number of nearest neighbors to retrieve.
	MaxQueryK = 1000
	// MaxBatchSize is a safety limit for batch operations.
	MaxBatchSize = 1000
)

// Feature flags for jurisdictional controls and capabilities.
var (
	EnableCaching          = getEnvBool("FEATURE_ENABLE_CACHING", true)
	EnableConnectionPooling = getEnvBool("FEATURE_ENABLE_CONNECTION_POOLING", true)
	EnableMetrics          = getEnvBool("FEATURE_ENABLE_METRICS", true)
	EnableAuditLogging     = getEnvBool("FEATURE_ENABLE_AUDIT_LOGGING", true)
	EnableTLS              = getEnvBool("FEATURE_ENABLE_TLS", false)
	TLSCertPath            = os.Getenv("TLS_CERT_PATH")
	TLSKeyPath             = os.Getenv("TLS_KEY_PATH")
)

// VectorDBProvider represents a generic interface for interacting with different vector databases.
type VectorDBProvider interface {
	// Initialize sets up the provider with necessary credentials and configurations.
	Initialize(ctx context.Context, config ProviderConfig) error
	// UpsertVectors inserts or updates vectors in the specified collection.
	UpsertVectors(ctx context.Context, collection string, vectors []VectorData, options UpsertOptions) (UpsertResult, error)
	// QueryVectors performs a nearest neighbor search.
	QueryVectors(ctx context.Context, collection string, queryVector []float32, k int, options QueryOptions) (QueryResult, error)
	// DeleteVectors removes vectors by ID or metadata filter.
	DeleteVectors(ctx context.Context, collection string, ids []string, filter map[string]interface{}) (DeleteResult, error)
	// GetVector retrieves specific vectors by ID.
	GetVectors(ctx context.Context, collection string, ids []string, options GetOptions) (GetResult, error)
	// ListCollections lists all available collections.
	ListCollections(ctx context.Context) ([]string, error)
	// CreateCollection creates a new vector collection.
	CreateCollection(ctx context.Context, name string, dimension int, options CollectionOptions) error
	// DeleteCollection deletes an existing vector collection.
	DeleteCollection(ctx context.Context, name string) error
	// HealthCheck performs a health check on the provider.
	HealthCheck(ctx context.Context) error
	// Close cleans up any resources held by the provider.
	Close() error
}

// ProviderConfig holds configuration for a specific vector DB provider.
type ProviderConfig struct {
	Name      string            `json:"name"`
	Type      string            `json:"type"` // e.g., "pinecone", "weaviate", "qdrant"
	APIKey    string            `json:"apiKey"`
	Endpoint  string            `json:"endpoint"`
	Region    string            `json:"region"`
	ProjectID string            `json:"projectId"`
	Extra     map[string]string `json:"extra"` // For provider-specific settings
}

// VectorData represents a single vector entry.
type VectorData struct {
	ID       string                 `json:"id"`
	Vector   []float32              `json:"vector"`
	Metadata map[string]interface{} `json:"metadata"`
}

// UpsertOptions allows for provider-specific upsert configurations.
type UpsertOptions struct {
	Namespace string                 `json:"namespace,omitempty"`
	Extra     map[string]interface{} `json:"extra,omitempty"`
}

// UpsertResult contains the outcome of an upsert operation.
type UpsertResult struct {
	IDs      []string `json:"ids"`
	Success  bool     `json:"success"`
	Message  string   `json:"message,omitempty"`
	Provider string   `json:"provider"`
}

// QueryOptions allows for provider-specific query configurations.
type QueryOptions struct {
	Namespace string                 `json:"namespace,omitempty"`
	Filter    map[string]interface{} `json:"filter,omitempty"`
	IncludeMetadata bool             `json:"includeMetadata,omitempty"`
	IncludeVectors  bool             `json:"includeVectors,omitempty"`
	Extra     map[string]interface{} `json:"extra,omitempty"`
}

// QueryResult contains the outcome of a query operation.
type QueryResult struct {
	Matches  []VectorMatch `json:"matches"`
	Success  bool          `json:"success"`
	Message  string        `json:"message,omitempty"`
	Provider string        `json:"provider"`
}

// VectorMatch represents a single match from a vector query.
type VectorMatch struct {
	ID       string                 `json:"id"`
	Score    float32                `json:"score"`
	Vector   []float32              `json:"vector,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// DeleteResult contains the outcome of a delete operation.
type DeleteResult struct {
	Count    int    `json:"count"`
	Success  bool   `json:"success"`
	Message  string `json:"message,omitempty"`
	Provider string `json:"provider"`
}

// GetOptions allows for provider-specific get configurations.
type GetOptions struct {
	IncludeMetadata bool             `json:"includeMetadata,omitempty"`
	IncludeVectors  bool             `json:"includeVectors,omitempty"`
	Extra     map[string]interface{} `json:"extra,omitempty"`
}

// GetResult contains the outcome of a get operation.
type GetResult struct {
	Vectors  []VectorData `json:"vectors"`
	Success  bool         `json:"success"`
	Message  string       `json:"message,omitempty"`
	Provider string       `json:"provider"`
}

// CollectionOptions allows for provider-specific collection configurations.
type CollectionOptions struct {
	MetricType string                 `json:"metricType,omitempty"` // e.g., "cosine", "euclidean"
	Shards     int                    `json:"shards,omitempty"`
	Replicas   int                    `json:"replicas,omitempty"`
	Extra      map[string]interface{} `json:"extra,omitempty"`
}

// VectorSystemGateway manages multiple vector DB providers and handles requests.
type VectorSystemGateway struct {
	providers map[string]VectorDBProvider
	mu        sync.RWMutex
	cache     *cache.Cache
	pool      *ConnectionPool
	eventBus  *events.EventBus
	metrics   *metrics.MetricsCollector
	config    GatewayConfig
}

// GatewayConfig holds the overall configuration for the gateway.
type GatewayConfig struct {
	Providers []ProviderConfig `json:"providers"`
	CacheTTL  time.Duration    `json:"cacheTTL"`
	MaxConns  int              `json:"maxConnectionsPerProvider"`
	Timeout   time.Duration    `json:"requestTimeout"`
}

// NewVectorSystemGateway creates and initializes a new gateway.
func NewVectorSystemGateway(cfg GatewayConfig, eb *events.EventBus, mc *metrics.MetricsCollector) (*VectorSystemGateway, error) {
	if cfg.CacheTTL == 0 {
		cfg.CacheTTL = DefaultCacheTTL
	}
	if cfg.MaxConns == 0 {
		cfg.MaxConns = DefaultMaxConnectionsPerProvider
	}
	if cfg.Timeout == 0 {
		cfg.Timeout = DefaultRequestTimeout
	}

	gw := &VectorSystemGateway{
		providers: make(map[string]VectorDBProvider),
		cache:     cache.New(cfg.CacheTTL, DefaultCacheCleanupInterval),
		pool:      NewConnectionPool(cfg.MaxConns),
		eventBus:  eb,
		metrics:   mc,
		config:    cfg,
	}

	for _, pCfg := range cfg.Providers {
		if err := gw.RegisterProvider(context.Background(), pCfg); err != nil {
			log.Printf("WARNING: Failed to register provider %s (%s): %v", pCfg.Name, pCfg.Type, err)
			// Continue with other providers, but log the error.
		}
	}

	if len(gw.providers) == 0 {
		return nil, errors.New("no vector database providers successfully registered")
	}

	log.Printf("VectorSystemGateway initialized with %d providers, cache TTL: %s, max conns per provider: %d",
		len(gw.providers), cfg.CacheTTL, cfg.MaxConns)

	return gw, nil
}

// RegisterProvider initializes and adds a new vector DB provider to the gateway.
func (gw *VectorSystemGateway) RegisterProvider(ctx context.Context, config ProviderConfig) error {
	gw.mu.Lock()
	defer gw.mu.Unlock()

	if _, exists := gw.providers[config.Name]; exists {
		return fmt.Errorf("provider with name '%s' already registered", config.Name)
	}

	var provider VectorDBProvider
	switch strings.ToLower(config.Type) {
	case "pinecone":
		provider = &pinecone.PineconeAdapter{}
	case "weaviate":
		provider = &weaviate.WeaviateAdapter{}
	case "qdrant":
		provider = &qdrant.QdrantAdapter{}
	case "milvus":
		provider = &milvus.MilvusAdapter{}
	case "chroma":
		provider = &chroma.ChromaAdapter{}
	default:
		return fmt.Errorf("unsupported vector database provider type: %s", config.Type)
	}

	if err := provider.Initialize(ctx, config); err != nil {
		return fmt.Errorf("failed to initialize provider %s (%s): %w", config.Name, config.Type, err)
	}

	gw.providers[config.Name] = provider
	log.Printf("Provider '%s' (%s) registered successfully.", config.Name, config.Type)

	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_ProviderRegistered,
			map[string]interface{}{
				"providerName": config.Name,
				"providerType": config.Type,
				"endpoint":     config.Endpoint,
			},
		))
	}
	return nil
}

// GetProvider retrieves a registered provider by name.
func (gw *VectorSystemGateway) GetProvider(name string) (VectorDBProvider, error) {
	gw.mu.RLock()
	defer gw.mu.RUnlock()
	provider, ok := gw.providers[name]
	if !ok {
		return nil, fmt.Errorf("provider '%s' not found", name)
	}
	return provider, nil
}

// UpsertVectors handles upserting vectors to a specified provider.
func (gw *VectorSystemGateway) UpsertVectors(ctx context.Context, providerName, collection string, vectors []VectorData, options UpsertOptions) (UpsertResult, error) {
	if EnableMetrics {
		defer gw.metrics.RecordRequest("upsert_vectors", providerName, time.Now())
	}
	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_UpsertRequested,
			map[string]interface{}{
				"providerName": providerName,
				"collection":   collection,
				"vectorCount":  len(vectors),
				"options":      options,
			},
		))
	}

	if len(vectors) == 0 {
		return UpsertResult{Success: true, Message: "No vectors to upsert", Provider: providerName}, nil
	}
	if len(vectors) > MaxBatchSize {
		return UpsertResult{}, fmt.Errorf("batch size exceeds maximum allowed (%d)", MaxBatchSize)
	}
	for _, v := range vectors {
		if len(v.Vector) > MaxVectorDimension {
			return UpsertResult{}, fmt.Errorf("vector dimension exceeds maximum allowed (%d)", MaxVectorDimension)
		}
	}

	provider, err := gw.GetProvider(providerName)
	if err != nil {
		return UpsertResult{}, err
	}

	opCtx, cancel := context.WithTimeout(ctx, gw.config.Timeout)
	defer cancel()

	if EnableConnectionPooling {
		conn, err := gw.pool.Get(providerName)
		if err != nil {
			return UpsertResult{}, fmt.Errorf("failed to get connection from pool: %w", err)
		}
		defer gw.pool.Put(providerName, conn) // Ensure connection is returned to pool

		// Use the connection (which is just a placeholder for now, actual provider is used)
		// In a real scenario, the connection object would wrap the provider or its client.
		// For this abstraction, we just ensure the pool mechanism is exercised.
	}

	result, err := provider.UpsertVectors(opCtx, collection, vectors, options)
	if err != nil {
		if EnableAuditLogging {
			gw.eventBus.Publish(events.NewEvent(
				ontology.VectorSystemGateway_UpsertFailed,
				map[string]interface{}{
					"providerName": providerName,
					"collection":   collection,
					"error":        err.Error(),
				},
			))
		}
		return UpsertResult{}, fmt.Errorf("provider '%s' upsert failed: %w", providerName, err)
	}

	if EnableCaching {
		// Invalidate cache for the affected collection
		gw.cache.Delete(fmt.Sprintf("query:%s:%s", providerName, collection))
		log.Printf("Cache invalidated for collection %s on provider %s", collection, providerName)
	}

	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_UpsertCompleted,
			map[string]interface{}{
				"providerName": providerName,
				"collection":   collection,
				"success":      result.Success,
				"ids":          result.IDs,
			},
		))
	}
	return result, nil
}

// QueryVectors handles querying vectors from a specified provider, with caching.
func (gw *VectorSystemGateway) QueryVectors(ctx context.Context, providerName, collection string, queryVector []float32, k int, options QueryOptions) (QueryResult, error) {
	if EnableMetrics {
		defer gw.metrics.RecordRequest("query_vectors", providerName, time.Now())
	}
	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_QueryRequested,
			map[string]interface{}{
				"providerName": providerName,
				"collection":   collection,
				"k":            k,
				"options":      options,
			},
		))
	}

	if len(queryVector) == 0 {
		return QueryResult{}, errors.New("query vector cannot be empty")
	}
	if len(queryVector) > MaxVectorDimension {
		return QueryResult{}, fmt.Errorf("query vector dimension exceeds maximum allowed (%d)", MaxVectorDimension)
	}
	if k <= 0 || k > MaxQueryK {
		return QueryResult{}, fmt.Errorf("k must be between 1 and %d", MaxQueryK)
	}

	cacheKey := fmt.Sprintf("query:%s:%s:%s:%d:%v", providerName, collection, common.HashVector(queryVector), k, options)
	if EnableCaching {
		if cachedResult, found := gw.cache.Get(cacheKey); found {
			if result, ok := cachedResult.(QueryResult); ok {
				log.Printf("Cache hit for query: %s", cacheKey)
				if EnableMetrics {
					gw.metrics.RecordCacheHit("query_vectors", providerName)
				}
				return result, nil
			}
		}
		if EnableMetrics {
			gw.metrics.RecordCacheMiss("query_vectors", providerName)
		}
	}

	provider, err := gw.GetProvider(providerName)
	if err != nil {
		return QueryResult{}, err
	}

	opCtx, cancel := context.WithTimeout(ctx, gw.config.Timeout)
	defer cancel()

	if EnableConnectionPooling {
		conn, err := gw.pool.Get(providerName)
		if err != nil {
			return QueryResult{}, fmt.Errorf("failed to get connection from pool: %w", err)
		}
		defer gw.pool.Put(providerName, conn)
	}

	result, err := provider.QueryVectors(opCtx, collection, queryVector, k, options)
	if err != nil {
		if EnableAuditLogging {
			gw.eventBus.Publish(events.NewEvent(
				ontology.VectorSystemGateway_QueryFailed,
				map[string]interface{}{
					"providerName": providerName,
					"collection":   collection,
					"error":        err.Error(),
				},
			))
		}
		return QueryResult{}, fmt.Errorf("provider '%s' query failed: %w", providerName, err)
	}

	if EnableCaching {
		gw.cache.Set(cacheKey, result, cache.DefaultExpiration)
		log.Printf("Query result cached for: %s", cacheKey)
	}

	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_QueryCompleted,
			map[string]interface{}{
				"providerName": providerName,
				"collection":   collection,
				"success":      result.Success,
				"matchCount":   len(result.Matches),
			},
		))
	}
	return result, nil
}

// DeleteVectors handles deleting vectors from a specified provider.
func (gw *VectorSystemGateway) DeleteVectors(ctx context.Context, providerName, collection string, ids []string, filter map[string]interface{}) (DeleteResult, error) {
	if EnableMetrics {
		defer gw.metrics.RecordRequest("delete_vectors", providerName, time.Now())
	}
	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_DeleteRequested,
			map[string]interface{}{
				"providerName": providerName,
				"collection":   collection,
				"idsCount":     len(ids),
				"filter":       filter,
			},
		))
	}

	if len(ids) == 0 && len(filter) == 0 {
		return DeleteResult{}, errors.New("either IDs or a filter must be provided for deletion")
	}
	if len(ids) > MaxBatchSize {
		return DeleteResult{}, fmt.Errorf("batch size for IDs exceeds maximum allowed (%d)", MaxBatchSize)
	}

	provider, err := gw.GetProvider(providerName)
	if err != nil {
		return DeleteResult{}, err
	}

	opCtx, cancel := context.WithTimeout(ctx, gw.config.Timeout)
	defer cancel()

	if EnableConnectionPooling {
		conn, err := gw.pool.Get(providerName)
		if err != nil {
			return DeleteResult{}, fmt.Errorf("failed to get connection from pool: %w", err)
		}
		defer gw.pool.Put(providerName, conn)
	}

	result, err := provider.DeleteVectors(opCtx, collection, ids, filter)
	if err != nil {
		if EnableAuditLogging {
			gw.eventBus.Publish(events.NewEvent(
				ontology.VectorSystemGateway_DeleteFailed,
				map[string]interface{}{
					"providerName": providerName,
					"collection":   collection,
					"error":        err.Error(),
				},
			))
		}
		return DeleteResult{}, fmt.Errorf("provider '%s' delete failed: %w", providerName, err)
	}

	if EnableCaching {
		// Invalidate cache for the affected collection
		gw.cache.Delete(fmt.Sprintf("query:%s:%s", providerName, collection))
		log.Printf("Cache invalidated for collection %s on provider %s", collection, providerName)
	}

	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_DeleteCompleted,
			map[string]interface{}{
				"providerName": providerName,
				"collection":   collection,
				"success":      result.Success,
				"count":        result.Count,
			},
		))
	}
	return result, nil
}

// GetVectors handles retrieving specific vectors from a specified provider.
func (gw *VectorSystemGateway) GetVectors(ctx context.Context, providerName, collection string, ids []string, options GetOptions) (GetResult, error) {
	if EnableMetrics {
		defer gw.metrics.RecordRequest("get_vectors", providerName, time.Now())
	}
	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_GetRequested,
			map[string]interface{}{
				"providerName": providerName,
				"collection":   collection,
				"idsCount":     len(ids),
				"options":      options,
			},
		))
	}

	if len(ids) == 0 {
		return GetResult{}, errors.New("no IDs provided for retrieval")
	}
	if len(ids) > MaxBatchSize {
		return GetResult{}, fmt.Errorf("batch size for IDs exceeds maximum allowed (%d)", MaxBatchSize)
	}

	provider, err := gw.GetProvider(providerName)
	if err != nil {
		return GetResult{}, err
	}

	opCtx, cancel := context.WithTimeout(ctx, gw.config.Timeout)
	defer cancel()

	if EnableConnectionPooling {
		conn, err := gw.pool.Get(providerName)
		if err != nil {
			return GetResult{}, fmt.Errorf("failed to get connection from pool: %w", err)
		}
		defer gw.pool.Put(providerName, conn)
	}

	result, err := provider.GetVectors(opCtx, collection, ids, options)
	if err != nil {
		if EnableAuditLogging {
			gw.eventBus.Publish(events.NewEvent(
				ontology.VectorSystemGateway_GetFailed,
				map[string]interface{}{
					"providerName": providerName,
					"collection":   collection,
					"error":        err.Error(),
				},
			))
		}
		return GetResult{}, fmt.Errorf("provider '%s' get failed: %w", providerName, err)
	}

	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_GetCompleted,
			map[string]interface{}{
				"providerName": providerName,
				"collection":   collection,
				"success":      result.Success,
				"vectorCount":  len(result.Vectors),
			},
		))
	}
	return result, nil
}

// ListCollections lists collections for a specified provider.
func (gw *VectorSystemGateway) ListCollections(ctx context.Context, providerName string) ([]string, error) {
	if EnableMetrics {
		defer gw.metrics.RecordRequest("list_collections", providerName, time.Now())
	}
	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_ListCollectionsRequested,
			map[string]interface{}{
				"providerName": providerName,
			},
		))
	}

	provider, err := gw.GetProvider(providerName)
	if err != nil {
		return nil, err
	}

	opCtx, cancel := context.WithTimeout(ctx, gw.config.Timeout)
	defer cancel()

	if EnableConnectionPooling {
		conn, err := gw.pool.Get(providerName)
		if err != nil {
			return nil, fmt.Errorf("failed to get connection from pool: %w", err)
		}
		defer gw.pool.Put(providerName, conn)
	}

	collections, err := provider.ListCollections(opCtx)
	if err != nil {
		if EnableAuditLogging {
			gw.eventBus.Publish(events.NewEvent(
				ontology.VectorSystemGateway_ListCollectionsFailed,
				map[string]interface{}{
					"providerName": providerName,
					"error":        err.Error(),
				},
			))
		}
		return nil, fmt.Errorf("provider '%s' list collections failed: %w", providerName, err)
	}

	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_ListCollectionsCompleted,
			map[string]interface{}{
				"providerName": providerName,
				"count":        len(collections),
			},
		))
	}
	return collections, nil
}

// CreateCollection creates a new collection on a specified provider.
func (gw *VectorSystemGateway) CreateCollection(ctx context.Context, providerName, name string, dimension int, options CollectionOptions) error {
	if EnableMetrics {
		defer gw.metrics.RecordRequest("create_collection", providerName, time.Now())
	}
	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_CreateCollectionRequested,
			map[string]interface{}{
				"providerName": providerName,
				"collection":   name,
				"dimension":    dimension,
				"options":      options,
			},
		))
	}

	if name == "" {
		return errors.New("collection name cannot be empty")
	}
	if dimension <= 0 || dimension > MaxVectorDimension {
		return fmt.Errorf("dimension must be between 1 and %d", MaxVectorDimension)
	}

	provider, err := gw.GetProvider(providerName)
	if err != nil {
		return err
	}

	opCtx, cancel := context.WithTimeout(ctx, gw.config.Timeout)
	defer cancel()

	if EnableConnectionPooling {
		conn, err := gw.pool.Get(providerName)
		if err != nil {
			return fmt.Errorf("failed to get connection from pool: %w", err)
		}
		defer gw.pool.Put(providerName, conn)
	}

	err = provider.CreateCollection(opCtx, name, dimension, options)
	if err != nil {
		if EnableAuditLogging {
			gw.eventBus.Publish(events.NewEvent(
				ontology.VectorSystemGateway_CreateCollectionFailed,
				map[string]interface{}{
					"providerName": providerName,
					"collection":   name,
					"error":        err.Error(),
				},
			))
		}
		return fmt.Errorf("provider '%s' create collection failed: %w", providerName, err)
	}

	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_CreateCollectionCompleted,
			map[string]interface{}{
				"providerName": providerName,
				"collection":   name,
				"dimension":    dimension,
			},
		))
	}
	return nil
}

// DeleteCollection deletes a collection on a specified provider.
func (gw *VectorSystemGateway) DeleteCollection(ctx context.Context, providerName, name string) error {
	if EnableMetrics {
		defer gw.metrics.RecordRequest("delete_collection", providerName, time.Now())
	}
	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_DeleteCollectionRequested,
			map[string]interface{}{
				"providerName": providerName,
				"collection":   name,
			},
		))
	}

	if name == "" {
		return errors.New("collection name cannot be empty")
	}

	provider, err := gw.GetProvider(providerName)
	if err != nil {
		return err
	}

	opCtx, cancel := context.WithTimeout(ctx, gw.config.Timeout)
	defer cancel()

	if EnableConnectionPooling {
		conn, err := gw.pool.Get(providerName)
		if err != nil {
			return fmt.Errorf("failed to get connection from pool: %w", err)
		}
		defer gw.pool.Put(providerName, conn)
	}

	err = provider.DeleteCollection(opCtx, name)
	if err != nil {
		if EnableAuditLogging {
			gw.eventBus.Publish(events.NewEvent(
				ontology.VectorSystemGateway_DeleteCollectionFailed,
				map[string]interface{}{
					"providerName": providerName,
					"collection":   name,
					"error":        err.Error(),
				},
			))
		}
		return fmt.Errorf("provider '%s' delete collection failed: %w", providerName, err)
	}

	if EnableCaching {
		// Invalidate cache for the affected collection
		gw.cache.Delete(fmt.Sprintf("query:%s:%s", providerName, name))
		log.Printf("Cache invalidated for collection %s on provider %s", name, providerName)
	}

	if EnableAuditLogging {
		gw.eventBus.Publish(events.NewEvent(
			ontology.VectorSystemGateway_DeleteCollectionCompleted,
			map[string]interface{}{
				"providerName": providerName,
				"collection":   name,
			},
		))
	}
	return nil
}

// HealthCheck performs health checks on all registered providers.
func (gw *VectorSystemGateway) HealthCheck(ctx context.Context) map[string]string {
	results := make(map[string]string)
	gw.mu.RLock()
	defer gw.mu.RUnlock()

	var wg sync.WaitGroup
	for name, provider := range gw.providers {
		wg.Add(1)
		go func(name string, provider VectorDBProvider) {
			defer wg.Done()
			opCtx, cancel := context.WithTimeout(ctx, gw.config.Timeout)
			defer cancel()
			err := provider.HealthCheck(opCtx)
			if err != nil {
				results[name] = fmt.Sprintf("Unhealthy: %v", err)
				if EnableAuditLogging {
					gw.eventBus.Publish(events.NewEvent(
						ontology.VectorSystemGateway_ProviderHealthCheckFailed,
						map[string]interface{}{
							"providerName": name,
							"error":        err.Error(),
						},
					))
				}
			} else {
				results[name] = "Healthy"
				if EnableAuditLogging {
					gw.eventBus.Publish(events.NewEvent(
						ontology.VectorSystemGateway_ProviderHealthCheckCompleted,
						map[string]interface{}{
							"providerName": name,
							"status":       "Healthy",
						},
					))
				}
			}
		}(name, provider)
	}
	wg.Wait()
	return results
}

// Close gracefully shuts down the gateway and all providers.
func (gw *VectorSystemGateway) Close() error {
	gw.mu.Lock()
	defer gw.mu.Unlock()

	log.Println("Shutting down VectorSystemGateway...")
	var errs []error
	for name, provider := range gw.providers {
		if err := provider.Close(); err != nil {
			errs = append(errs, fmt.Errorf("failed to close provider '%s': %w", name, err))
		} else {
			log.Printf("Provider '%s' closed successfully.", name)
		}
	}
	gw.pool.Close() // Close connection pool
	log.Println("VectorSystemGateway shutdown complete.")
	return errors.Join(errs...)
}

// ConnectionPool manages a pool of connections for each provider.
// In a real-world scenario, this would manage actual client connections.
// For this abstraction, it simulates connection limits and reuse.
type ConnectionPool struct {
	maxConns int
	pools    map[string]chan struct{} // Using empty struct as a semaphore
	mu       sync.Mutex
}

// NewConnectionPool creates a new connection pool.
func NewConnectionPool(maxConns int) *ConnectionPool {
	return &ConnectionPool{
		maxConns: maxConns,
		pools:    make(map[string]chan struct{}),
	}
}

// Get acquires a connection from the pool for a given provider.
func (cp *ConnectionPool) Get(providerName string) (interface{}, error) {
	cp.mu.Lock()
	if _, ok := cp.pools[providerName]; !ok {
		cp.pools[providerName] = make(chan struct{}, cp.maxConns)
		for i := 0; i < cp.maxConns; i++ {
			cp.pools[providerName] <- struct{}{} // Fill with available "connections"
		}
	}
	pool := cp.pools[providerName]
	cp.mu.Unlock()

	select {
	case <-pool:
		// A "connection" is available
		return struct{}{}, nil // Return a placeholder connection
	case <-time.After(DefaultRequestTimeout): // Use a timeout for acquiring a connection
		return nil, fmt.Errorf("timed out waiting for connection to provider %s", providerName)
	}
}

// Put returns a connection to the pool for a given provider.
func (cp *ConnectionPool) Put(providerName string, conn interface{}) {
	cp.mu.Lock()
	defer cp.mu.Unlock()
	if pool, ok := cp.pools[providerName]; ok {
		select {
		case pool <- struct{}{}:
			// Connection returned successfully
		default:
			// Pool is full, this should not happen if Get/Put are balanced
			log.Printf("WARNING: Connection pool for %s is full, dropping connection.", providerName)
		}
	}
}

// Close closes all connection pools.
func (cp *ConnectionPool) Close() {
	cp.mu.Lock()
	defer cp.mu.Unlock()
	for providerName, pool := range cp.pools {
		close(pool)
		log.Printf("Connection pool for %s closed.", providerName)
	}
}

// HTTP Handlers

// GatewayAPI represents the HTTP API for the VectorSystemGateway.
type GatewayAPI struct {
	gateway  *VectorSystemGateway
	authenticator *auth.Authenticator
}

// NewGatewayAPI creates a new GatewayAPI instance.
func NewGatewayAPI(gw *VectorSystemGateway, authenticator *auth.Authenticator) *GatewayAPI {
	return &GatewayAPI{
		gateway:  gw,
		authenticator: authenticator,
	}
}

// handleRequest is a generic handler wrapper for common logic like auth, error handling, and logging.
func (api *GatewayAPI) handleRequest(w http.ResponseWriter, r *http.Request, handler func(context.Context, http.ResponseWriter, *http.Request) (interface{}, error)) {
	// Apply common headers
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-API-Version", APIVersion)
	w.Header().Set("X-Request-ID", uuid.New().String())

	// Authentication and Authorization
	if !api.authenticator.Authenticate(r) {
		common.SendJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	if !api.authenticator.Authorize(r, common.PermissionVectorDBAccess) { // Example permission
		common.SendJSONError(w, "Forbidden", http.StatusForbidden)
		return
	}

	ctx := r.Context()
	result, err := handler(ctx, w, r)
	if err != nil {
		log.Printf("API Error: %v", err)
		var httpErr *common.HTTPError
		if errors.As(err, &httpErr) {
			common.SendJSONError(w, httpErr.Message, httpErr.StatusCode)
		} else {
			common.SendJSONError(w, fmt.Sprintf("Internal Server Error: %v", err), http.StatusInternalServerError)
		}
		return
	}

	if result != nil {
		if err := json.NewEncoder(w).Encode(result); err != nil {
			log.Printf("Failed to encode response: %v", err)
			common.SendJSONError(w, "Failed to encode response", http.StatusInternalServerError)
		}
	}
}

// upsertVectorsHandler handles HTTP requests for upserting vectors.
func (api *GatewayAPI) upsertVectorsHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	if r.Method != http.MethodPost {
		return nil, common.NewHTTPError("Method Not Allowed", http.StatusMethodNotAllowed)
	}

	var req struct {
		ProviderName string        `json:"providerName"`
		Collection   string        `json:"collection"`
		Vectors      []VectorData  `json:"vectors"`
		Options      UpsertOptions `json:"options"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, common.NewHTTPError(fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
	}

	if req.ProviderName == "" || req.Collection == "" || len(req.Vectors) == 0 {
		return nil, common.NewHTTPError("Provider name, collection, and vectors are required", http.StatusBadRequest)
	}

	result, err := api.gateway.UpsertVectors(ctx, req.ProviderName, req.Collection, req.Vectors, req.Options)
	if err != nil {
		return nil, fmt.Errorf("upsert operation failed: %w", err)
	}
	return result, nil
}

// queryVectorsHandler handles HTTP requests for querying vectors.
func (api *GatewayAPI) queryVectorsHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	if r.Method != http.MethodPost {
		return nil, common.NewHTTPError("Method Not Allowed", http.StatusMethodNotAllowed)
	}

	var req struct {
		ProviderName string        `json:"providerName"`
		Collection   string        `json:"collection"`
		QueryVector  []float32     `json:"queryVector"`
		K            int           `json:"k"`
		Options      QueryOptions  `json:"options"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, common.NewHTTPError(fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
	}

	if req.ProviderName == "" || req.Collection == "" || len(req.QueryVector) == 0 || req.K == 0 {
		return nil, common.NewHTTPError("Provider name, collection, query vector, and k are required", http.StatusBadRequest)
	}

	result, err := api.gateway.QueryVectors(ctx, req.ProviderName, req.Collection, req.QueryVector, req.K, req.Options)
	if err != nil {
		return nil, fmt.Errorf("query operation failed: %w", err)
	}
	return result, nil
}

// deleteVectorsHandler handles HTTP requests for deleting vectors.
func (api *GatewayAPI) deleteVectorsHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	if r.Method != http.MethodPost {
		return nil, common.NewHTTPError("Method Not Allowed", http.StatusMethodNotAllowed)
	}

	var req struct {
		ProviderName string                 `json:"providerName"`
		Collection   string                 `json:"collection"`
		IDs          []string               `json:"ids"`
		Filter       map[string]interface{} `json:"filter"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, common.NewHTTPError(fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
	}

	if req.ProviderName == "" || req.Collection == "" || (len(req.IDs) == 0 && len(req.Filter) == 0) {
		return nil, common.NewHTTPError("Provider name, collection, and either IDs or filter are required", http.StatusBadRequest)
	}

	result, err := api.gateway.DeleteVectors(ctx, req.ProviderName, req.Collection, req.IDs, req.Filter)
	if err != nil {
		return nil, fmt.Errorf("delete operation failed: %w", err)
	}
	return result, nil
}

// getVectorsHandler handles HTTP requests for retrieving vectors.
func (api *GatewayAPI) getVectorsHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	if r.Method != http.MethodPost {
		return nil, common.NewHTTPError("Method Not Allowed", http.StatusMethodNotAllowed)
	}

	var req struct {
		ProviderName string    `json:"providerName"`
		Collection   string    `json:"collection"`
		IDs          []string  `json:"ids"`
		Options      GetOptions `json:"options"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, common.NewHTTPError(fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
	}

	if req.ProviderName == "" || req.Collection == "" || len(req.IDs) == 0 {
		return nil, common.NewHTTPError("Provider name, collection, and IDs are required", http.StatusBadRequest)
	}

	result, err := api.gateway.GetVectors(ctx, req.ProviderName, req.Collection, req.IDs, req.Options)
	if err != nil {
		return nil, fmt.Errorf("get operation failed: %w", err)
	}
	return result, nil
}

// listCollectionsHandler handles HTTP requests for listing collections.
func (api *GatewayAPI) listCollectionsHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	if r.Method != http.MethodGet {
		return nil, common.NewHTTPError("Method Not Allowed", http.StatusMethodNotAllowed)
	}

	providerName := r.URL.Query().Get("providerName")
	if providerName == "" {
		return nil, common.NewHTTPError("Provider name is required", http.StatusBadRequest)
	}

	collections, err := api.gateway.ListCollections(ctx, providerName)
	if err != nil {
		return nil, fmt.Errorf("list collections operation failed: %w", err)
	}
	return map[string]interface{}{"providerName": providerName, "collections": collections}, nil
}

// createCollectionHandler handles HTTP requests for creating a collection.
func (api *GatewayAPI) createCollectionHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	if r.Method != http.MethodPost {
		return nil, common.NewHTTPError("Method Not Allowed", http.StatusMethodNotAllowed)
	}

	var req struct {
		ProviderName string            `json:"providerName"`
		Collection   string            `json:"collection"`
		Dimension    int               `json:"dimension"`
		Options      CollectionOptions `json:"options"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, common.NewHTTPError(fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
	}

	if req.ProviderName == "" || req.Collection == "" || req.Dimension == 0 {
		return nil, common.NewHTTPError("Provider name, collection, and dimension are required", http.StatusBadRequest)
	}

	err := api.gateway.CreateCollection(ctx, req.ProviderName, req.Collection, req.Dimension, req.Options)
	if err != nil {
		return nil, fmt.Errorf("create collection operation failed: %w", err)
	}
	return map[string]string{"message": fmt.Sprintf("Collection '%s' created successfully on provider '%s'", req.Collection, req.ProviderName)}, nil
}

// deleteCollectionHandler handles HTTP requests for deleting a collection.
func (api *GatewayAPI) deleteCollectionHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	if r.Method != http.MethodPost {
		return nil, common.NewHTTPError("Method Not Allowed", http.StatusMethodNotAllowed)
	}

	var req struct {
		ProviderName string `json:"providerName"`
		Collection   string `json:"collection"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, common.NewHTTPError(fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
	}

	if req.ProviderName == "" || req.Collection == "" {
		return nil, common.NewHTTPError("Provider name and collection are required", http.StatusBadRequest)
	}

	err := api.gateway.DeleteCollection(ctx, req.ProviderName, req.Collection)
	if err != nil {
		return nil, fmt.Errorf("delete collection operation failed: %w", err)
	}
	return map[string]string{"message": fmt.Sprintf("Collection '%s' deleted successfully from provider '%s'", req.Collection, req.ProviderName)}, nil
}

// healthCheckHandler provides the health status of the gateway and its providers.
func (api *GatewayAPI) healthCheckHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	if r.Method != http.MethodGet {
		return nil, common.NewHTTPError("Method Not Allowed", http.StatusMethodNotAllowed)
	}

	results := api.gateway.HealthCheck(ctx)
	overallStatus := "Healthy"
	for _, status := range results {
		if strings.Contains(status, "Unhealthy") {
			overallStatus = "Degraded"
			break
		}
	}

	return map[string]interface{}{
		"status":    overallStatus,
		"providers": results,
		"timestamp": time.Now().Format(time.RFC3339),
	}, nil
}

// introspectHandler provides metadata about the application.
func (api *GatewayAPI) introspectHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	if r.Method != http.MethodGet {
		return nil, common.NewHTTPError("Method Not Allowed", http.StatusMethodNotAllowed)
	}
	return map[string]interface{}{
		"app_name":    "APP_09_Memory_VectorSystemGateway",
		"description": "Go-based gateway that translates a common vector search API into provider-specific requests. Implements caching and connection pooling to optimize performance across different vector DB backends.",
		"version":     APIVersion,
		"capabilities": []string{
			"Vector Upsert", "Vector Query", "Vector Delete", "Vector Get",
			"Collection Management (Create, Delete, List)",
			"Multi-provider abstraction", "Caching", "Connection Pooling",
			"Authentication", "Authorization", "Metrics", "Audit Logging",
			"Extensibility via adapters",
		},
		"feature_flags": map[string]bool{
			"EnableCaching":          EnableCaching,
			"EnableConnectionPooling": EnableConnectionPooling,
			"EnableMetrics":          EnableMetrics,
			"EnableAuditLogging":     EnableAuditLogging,
			"EnableTLS":              EnableTLS,
		},
		"agent_metadata": agent_metadata,
	}, nil
}

// assumptionsHandler provides a list of assumptions made by the application.
func (api *GatewayAPI) assumptionsHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	if r.Method != http.MethodGet {
		return nil, common.NewHTTPError("Method Not Allowed", http.StatusMethodNotAllowed)
	}
	return map[string]interface{}{
		"assumptions": []string{
			"All configured vector DB providers are accessible from the gateway.",
			"API keys/credentials for providers are securely managed (e.g., via environment variables or secrets manager).",
			"Network latency to vector DB providers is within acceptable limits for configured timeouts.",
			"Vector dimensions are consistent within a given collection.",
			"Metadata filtering syntax is consistent or translated by adapters.",
			"The common protocol layer (HTTP/JSON) and shared SDK are correctly implemented and available.",
			"The event bus and metrics collector are operational.",
			"Authentication and authorization services are external and reliable.",
		},
	}, nil
}

// failureModesHandler describes potential failure modes of the application.
func (api *GatewayAPI) failureModesHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	if r.Method != http.MethodGet {
		return nil, common.NewHTTPError("Method Not Allowed", http.StatusMethodNotAllowed)
	}
	return map[string]interface{}{
		"failure_modes": []string{
			"Upstream vector DB provider unavailability or latency spikes.",
			"Incorrect API keys or expired credentials for providers.",
			"Network partition between gateway and providers.",
			"Cache invalidation issues leading to stale data.",
			"Connection pool exhaustion under high load.",
			"Misconfiguration of provider endpoints or collection schemas.",
			"Denial-of-service attacks or excessive requests overwhelming the gateway or providers.",
			"Memory exhaustion due to large vector batches or query results.",
			"Event bus or metrics collector failures impacting observability/auditing.",
			"Authentication/Authorization service failures leading to access issues.",
			"Data corruption in underlying vector databases.",
			"Jurisdictional control flags misconfigured, leading to non-compliance.",
		},
	}, nil
}

// updateTriggersHandler describes conditions that would trigger an update or redeployment.
func (api *GatewayAPI) updateTriggersHandler(ctx context.Context, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	if r.Method != http.MethodGet {
		return nil, common.NewHTTPError("Method Not Allowed", http.StatusMethodNotAllowed)
	}
	return map[string]interface{}{
		"update_triggers": []string{
			"Addition or removal of a new vector DB provider type.",
			"Updates to existing vector DB provider SDKs or APIs requiring adapter changes.",
			"Changes in caching strategy or connection pooling parameters.",
			"Security vulnerabilities discovered in dependencies or the gateway itself.",
			"Performance bottlenecks identified under specific load patterns.",
			"Changes to the common protocol layer, auth model, or data contracts.",
			"Introduction of new vector operations or query types.",
			"Compliance requirements necessitating changes to audit logging or data handling.",
			"Feature flag changes requiring redeployment (e.g., enabling/disabling TLS).",
			"Scaling requirements necessitating architectural changes (e.g., sharding the gateway).",
		},
	}, nil
}

// agent_metadata block for self-querying agent mode.
var agent_metadata = map[string]interface{}{
	"purpose": "Provides a unified, abstracted, and optimized gateway for interacting with various vector database systems, enabling multi-vendor memory management for AI applications.",
	"dependencies": []string{
		"pkg/auth: Authentication and authorization services.",
		"pkg/common: Common utilities, error handling, HTTP helpers.",
		"pkg/events: Typed event bus for audit logging and internal communication.",
		"pkg/metrics: Metrics collection and reporting.",
		"pkg/ontology: Shared ontology for consistent concepts.",
		"internal/adapters/pinecone: Pinecone vector DB adapter.",
		"internal/adapters/weaviate: Weaviate vector DB adapter.",
		"internal/adapters/qdrant: Qdrant vector DB adapter.",
		"internal/adapters/milvus: Milvus vector DB adapter.",
		"internal/adapters/chroma: Chroma vector DB adapter.",
		"github.com/patrickmn/go-cache: In-memory caching.",
		"github.com/google/uuid: UUID generation for request IDs.",
	},
	"invalidation_conditions": []string{
		"Changes to provider API specifications.",
		"Updates to the shared core SDK (auth, events, metrics, ontology).",
		"Significant changes in vector database landscape requiring new adapters or major adapter overhauls.",
		"Security policy updates affecting data access or storage.",
		"Performance requirements exceeding current gateway capabilities.",
	},
	"adjacent_apps": []string{
		"APP_01_Inference_CostRouter: Could query vector DBs for model metadata or routing decisions.",
		"APP_02_MultiProvider_InferenceGateway: Relies on vector DBs for context retrieval in RAG patterns.",
		"APP_03_Agent_OrchestrationEngine: Agents use vector DBs for long-term memory and tool context.",
		"APP_04_ToolCalling_Registry: Tools might interact with vector DBs.",
		"APP_06_Evaluation_BenchmarkingService: Uses vector DBs to store evaluation datasets and results.",
		"APP_07_Dataset_LifecycleManager: Manages vector datasets.",
		"APP_08_SyntheticData_Generator: Stores generated synthetic vectors.",
		"APP_10_Prompt_CompilationVersioning: Stores prompt embeddings for retrieval.",
		"APP_11_AICost_AccountingBilling: Logs vector DB usage for billing.",
		"APP_12_Compliance_AuditLogging: Consumes audit logs from this gateway.",
		"APP_13_RedTeam_FailureSimulation: Can simulate failures in vector DB interactions.",
		"APP_14_Multimodal_Pipelines: Stores multimodal embeddings.",
		"APP_15_FineTuning_Orchestration: Stores embeddings for fine-tuning datasets.",
		"APP_16_EdgeInference_Controller: Edge devices might query local vector stores via this gateway.",
		"APP_17_Workflow_Automation: Workflows might involve vector search steps.",
		"APP_18_Developer_Observability: Monitors vector DB performance and usage.",
		"APP_19_Narrative_ModelExplainabilityUI: Visualizes vector space and query results.",
		"APP_20_Governance_PolicyEnforcement: Enforces data retention and access policies on vector data.",
	},
}

// getEnvBool parses an environment variable as a boolean with a default.
func getEnvBool(key string, defaultValue bool) bool {
	val, exists := os.LookupEnv(key)
	if !exists {
		return defaultValue
	}
	b, err := strconv.ParseBool(val)
	if err != nil {
		log.Printf("WARNING: Invalid boolean value for %s: %s. Using default %t.", key, val, defaultValue)
		return defaultValue
	}
	return b
}

// main function to start the HTTP server.
func main() {
	// Disclaimer banner
	fmt.Println("--------------------------------------------------------------------------------")
	fmt.Println("APP_09_Memory_VectorSystemGateway - Production-Grade Vector System Gateway")
	fmt.Println("Disclaimer: This software is provided 'as-is', without any express or implied")
	fmt.Println("warranties. It is designed for systems integration and does not offer financial,")
	fmt.Println("legal, or behavioral advice. Use responsibly and ensure compliance with all")
	fmt.Println("applicable laws and regulations.")
	fmt.Println("--------------------------------------------------------------------------------")

	// Load configuration from environment or file
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	listenAddr := fmt.Sprintf(":%s", port)

	// Example provider configuration (should ideally come from a config file or secrets manager)
	providerConfigs := []ProviderConfig{
		{
			Name:     "pinecone-prod",
			Type:     "pinecone",
			APIKey:   os.Getenv("PINECONE_API_KEY"),
			Endpoint: os.Getenv("PINECONE_ENDPOINT"),
			Region:   os.Getenv("PINECONE_REGION"),
		},
		{
			Name:     "weaviate-dev",
			Type:     "weaviate",
			APIKey:   os.Getenv("WEAVIATE_API_KEY"),
			Endpoint: os.Getenv("WEAVIATE_ENDPOINT"),
		},
		{
			Name:     "qdrant-cluster",
			Type:     "qdrant",
			APIKey:   os.Getenv("QDRANT_API_KEY"),
			Endpoint: os.Getenv("QDRANT_ENDPOINT"),
		},
		// Add more providers as needed
	}

	// Filter out providers with missing essential config
	var validProviderConfigs []ProviderConfig
	for _, p := range providerConfigs {
		if p.APIKey == "" || p.Endpoint == "" {
			log.Printf("WARNING: Skipping provider %s (%s) due to missing API_KEY or ENDPOINT environment variables.", p.Name, p.Type)
			continue
		}
		validProviderConfigs = append(validProviderConfigs, p)
	}

	if len(validProviderConfigs) == 0 {
		log.Fatalf("FATAL: No valid vector database providers configured. Exiting.")
	}

	// Initialize shared components
	eventBus := events.NewEventBus()
	metricsCollector := metrics.NewMetricsCollector("vector_system_gateway")
	authenticator := auth.NewAuthenticator(os.Getenv("AUTH_SERVICE_URL")) // Assuming an external auth service

	// Gateway configuration
	gatewayConfig := GatewayConfig{
		Providers: validProviderConfigs,
		CacheTTL:  DefaultCacheTTL, // Can be overridden by env var if needed
		MaxConns:  DefaultMaxConnectionsPerProvider,
		Timeout:   DefaultRequestTimeout,
	}

	gateway, err := NewVectorSystemGateway(gatewayConfig, eventBus, metricsCollector)
	if err != nil {
		log.Fatalf("Failed to initialize VectorSystemGateway: %v", err)
	}
	defer func() {
		if err := gateway.Close(); err != nil {
			log.Printf("Error during gateway shutdown: %v", err)
		}
	}()

	api := NewGatewayAPI(gateway, authenticator)

	// Setup HTTP routes
	mux := http.NewServeMux()
	mux.HandleFunc("/"+APIVersion+"/vectors/upsert", func(w http.ResponseWriter, r *http.Request) { api.handleRequest(w, r, api.upsertVectorsHandler) })
	mux.HandleFunc("/"+APIVersion+"/vectors/query", func(w http.ResponseWriter, r *http.Request) { api.handleRequest(w, r, api.queryVectorsHandler) })
	mux.HandleFunc("/"+APIVersion+"/vectors/delete", func(w http.ResponseWriter, r *http.Request) { api.handleRequest(w, r, api.deleteVectorsHandler) })
	mux.HandleFunc("/"+APIVersion+"/vectors/get", func(w http.ResponseWriter, r *http.Request) { api.handleRequest(w, r, api.getVectorsHandler) })
	mux.HandleFunc("/"+APIVersion+"/collections/list", func(w http.ResponseWriter, r *http.Request) { api.handleRequest(w, r, api.listCollectionsHandler) })
	mux.HandleFunc("/"+APIVersion+"/collections/create", func(w http.ResponseWriter, r *http.Request) { api.handleRequest(w, r, api.createCollectionHandler) })
	mux.HandleFunc("/"+APIVersion+"/collections/delete", func(w http.ResponseWriter, r *r.Request) { api.handleRequest(w, r, api.deleteCollectionHandler) })
	mux.HandleFunc("/"+APIVersion+"/health", func(w http.ResponseWriter, r *http.Request) { api.handleRequest(w, r, api.healthCheckHandler) })

	// Self-querying agent endpoints
	mux.HandleFunc("/introspect", func(w http.ResponseWriter, r *http.Request) { api.handleRequest(w, r, api.introspectHandler) })
	mux.HandleFunc("/assumptions", func(w http.ResponseWriter, r *http.Request) { api.handleRequest(w, r, api.assumptionsHandler) })
	mux.HandleFunc("/failure-modes", func(w http.ResponseWriter, r *http.Request) { api.handleRequest(w, r, api.failureModesHandler) })
	mux.HandleFunc("/update-triggers", func(w http.ResponseWriter, r *http.Request) { api.handleRequest(w, r, api.updateTriggersHandler) })

	// Start HTTP server
	log.Printf("VectorSystemGateway listening on %s", listenAddr)

	server := &http.Server{
		Addr:         listenAddr,
		Handler:      mux,
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	if EnableTLS {
		if TLSCertPath == "" || TLSKeyPath == "" {
			log.Fatalf("FATAL: TLS enabled but TLS_CERT_PATH or TLS_KEY_PATH not set. Exiting.")
		}
		log.Printf("Starting HTTPS server on %s", listenAddr)
		server.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
		err = server.ListenAndServeTLS(TLSCertPath, TLSKeyPath)
	} else {
		log.Printf("Starting HTTP server on %s (TLS disabled)", listenAddr)
		err = server.ListenAndServe()
	}

	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("Server failed: %v", err)
	}
	log.Println("Server stopped.")
}

/*
	License: MIT

	Copyright (c) 2023 Autonomous Principal Software Architect

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/