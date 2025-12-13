// agent_metadata:
//   purpose: Provides a secure, high-performance gRPC service for registering, managing, and executing AI agent tools. It enforces authentication, validation, rate-limiting, and audit logging for all tool interactions.
//   dependencies: Shared Core SDK (Auth, Event Bus, Audit), external AI vendor APIs (e.g., OpenAI, Anthropic for description/schema assistance), external tool endpoints.
//   invalidation_conditions: Changes to shared auth protocol, significant updates to tool definition schema, security vulnerabilities in underlying gRPC or HTTP client libraries, depletion of storage for tool definitions.
//   adjacent_apps: APP_01_Inference_CostRouter (for routing tool calls to cost-optimized endpoints), APP_14_Agents_MultiModelOrchestrator (primary consumer of this registry), APP_37_Governance_AuditTrailEngine (receives audit logs), APP_09_Memory_VectorStore (for storing tool usage patterns or complex tool states).

// License Header
// Apache License 2.0

// Copyright (c) 2023 Your Organization

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Disclaimer: This software is provided "as is", without warranty of any kind, express or implied,
// including but not limited to the warranties of merchantability, fitness for a particular purpose
// and noninfringement. In no event shall the authors or copyright holders be liable for any claim,
// damages or other liability, whether in an action of contract, tort or otherwise, arising from,
// out of or in connection with the software or the use or other dealings in the software.
// This software does not offer financial advice, make guarantees, or predict outcomes.
// It is a system for managing and orchestrating AI tools.

// --- Start of actual code ---

// Standard library imports
use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, Instant},
};

// Third-party crate imports
use async_trait::async_trait;
use dashmap::DashMap;
use governor::{
    clock::DefaultClock,
    middleware::NoOpMiddleware,
    state::{InMemoryState, NotKeyed},
    Quota, RateLimiter,
};
use http::Uri;
use prost::Message; // For protobuf serialization/deserialization
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tokio::{
    sync::{mpsc, Mutex},
    time::sleep,
};
use tonic::{
    metadata::MetadataMap,
    transport::{Server, Channel},
    Request, Response, Status,
};
use tracing::{error, info, instrument, warn};
use uuid::Uuid;

// --- Shared Core SDK Mockup ---
// In a real project, these would be separate crates/modules.
// For the purpose of generating a single 1MB file, they are inlined.
mod shared_core_sdk {
    pub mod auth {
        use super::super::*; // Access main.rs items
        use async_trait::async_trait;
        use std::collections::HashMap;
        use tonic::metadata::MetadataMap;
        use tracing::instrument;

        #[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
        pub struct AuthContext {
            pub principal_id: String,
            pub roles: Vec<String>,
            pub permissions: Vec<String>,
            pub tenant_id: Option<String>,
            pub metadata: HashMap<String, String>,
        }

        #[async_trait]
        pub trait Authenticator: Send + Sync + 'static {
            async fn authenticate(&self, metadata: &MetadataMap) -> Result<AuthContext, Status>;
            async fn authorize_tool_access(
                &self,
                auth_context: &AuthContext,
                tool_id: &str,
                action: &str, // e.g., "execute", "register", "read"
            ) -> Result<(), Status>;
        }

        #[derive(Debug, Clone)]
        pub struct MockAuthenticator;

        #[async_trait]
        impl Authenticator for MockAuthenticator {
            #[instrument(name = "authenticate_request", skip(metadata), level = "info")]
            async fn authenticate(&self, metadata: &MetadataMap) -> Result<AuthContext, Status> {
                // Simulate authentication from metadata (e.g., JWT token)
                if let Some(auth_header) = metadata.get("authorization") {
                    let auth_str = auth_header
                        .to_str()
                        .map_err(|_| Status::unauthenticated("Invalid auth header format"))?;
                    if auth_str.starts_with("Bearer ") {
                        let token = auth_str.trim_start_matches("Bearer ");
                        // In a real scenario, validate JWT, check against identity service
                        // For this mock, we'll parse a simple "user_id:role1,role2:tenant_id" format
                        let parts: Vec<&str> = token.split(':').collect();
                        if parts.len() >= 2 {
                            let principal_id = parts[0].to_string();
                            let roles = parts[1].split(',').map(String::from).collect();
                            let tenant_id = parts.get(2).map(|s| s.to_string());

                            info!(
                                principal_id = %principal_id,
                                roles = ?roles,
                                tenant_id = ?tenant_id,
                                "Authentication successful"
                            );

                            return Ok(AuthContext {
                                principal_id,
                                roles,
                                permissions: vec!["tool:execute".to_string(), "tool:register".to_string(), "tool:read".to_string()], // Mock permissions
                                tenant_id,
                                metadata: HashMap::new(),
                            });
                        }
                    }
                }
                error!("Authentication failed: Missing or invalid Authorization header");
                Err(Status::unauthenticated("Missing or invalid Authorization header"))
            }

            #[instrument(name = "authorize_tool_access", skip(auth_context), level = "info")]
            async fn authorize_tool_access(
                &self,
                auth_context: &AuthContext,
                tool_id: &str,
                action: &str,
            ) -> Result<(), Status> {
                // Simulate authorization logic
                // e.g., check if user has "tool:execute" permission for this tool_id or tenant
                if auth_context.permissions.contains(&format!("tool:{}", action)) {
                    info!(
                        principal_id = %auth_context.principal_id,
                        tool_id = %tool_id,
                        action = %action,
                        "Authorization successful"
                    );
                    Ok(())
                } else {
                    warn!(
                        principal_id = %auth_context.principal_id,
                        tool_id = %tool_id,
                        action = %action,
                        "Authorization failed: Insufficient permissions"
                    );
                    Err(Status::permission_denied(format!(
                        "Principal {} lacks permission to {} tool {}",
                        auth_context.principal_id, action, tool_id
                    )))
                }
            }
        }
    }

    pub mod event_bus {
        use super::super::*; // Access main.rs items
        use async_trait::async_trait;
        use serde::Serialize;
        use tokio::sync::mpsc;
        use tracing::{error, info, instrument};

        #[derive(Debug, Clone, Serialize)]
        #[serde(tag = "type", content = "payload")]
        pub enum Event {
            ToolRegistered {
                tool_id: String,
                tool_name: String,
                principal_id: String,
                timestamp: String,
            },
            ToolUpdated {
                tool_id: String,
                tool_name: String,
                principal_id: String,
                timestamp: String,
            },
            ToolCallInitiated {
                tool_id: String,
                tool_name: String,
                principal_id: String,
                call_id: String,
                input_hash: String, // Hash of input for privacy
                timestamp: String,
            },
            ToolCallCompleted {
                tool_id: String,
                tool_name: String,
                principal_id: String,
                call_id: String,
                duration_ms: u64,
                status: String, // "success", "failure"
                timestamp: String,
            },
            ToolCallFailed {
                tool_id: String,
                tool_name: String,
                principal_id: String,
                call_id: String,
                error_message: String,
                timestamp: String,
            },
            PolicyViolation {
                principal_id: String,
                tool_id: Option<String>,
                violation_type: String, // "rate_limit", "auth_failure", "validation_error"
                details: String,
                timestamp: String,
            },
            // Add more event types as needed for a unified ontology
        }

        #[async_trait]
        pub trait EventPublisher: Send + Sync + 'static {
            async fn publish(&self, event: Event) -> Result<(), Box<dyn std::error::Error + Send + Sync>>;
        }

        pub struct MpscEventPublisher {
            sender: mpsc::Sender<Event>,
        }

        impl MpscEventPublisher {
            pub fn new(sender: mpsc::Sender<Event>) -> Self {
                MpscEventPublisher { sender }
            }
        }

        #[async_trait]
        impl EventPublisher for MpscEventPublisher {
            #[instrument(name = "publish_event", skip(self, event), fields(event_type = %event.to_string()), level = "debug")]
            async fn publish(&self, event: Event) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
                info!("Publishing event: {:?}", event);
                self.sender
                    .send(event)
                    .await
                    .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)
            }
        }

        impl std::fmt::Display for Event {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                match self {
                    Event::ToolRegistered { .. } => write!(f, "ToolRegistered"),
                    Event::ToolUpdated { .. } => write!(f, "ToolUpdated"),
                    Event::ToolCallInitiated { .. } => write!(f, "ToolCallInitiated"),
                    Event::ToolCallCompleted { .. } => write!(f, "ToolCallCompleted"),
                    Event::ToolCallFailed { .. } => write!(f, "ToolCallFailed"),
                    Event::PolicyViolation { .. } => write!(f, "PolicyViolation"),
                }
            }
        }
    }

    pub mod audit {
        use super::super::*; // Access main.rs items
        use async_trait::async_trait;
        use serde::Serialize;
        use tracing::{error, info, instrument};

        #[derive(Debug, Clone, Serialize)]
        pub struct AuditLogEntry {
            pub timestamp: String,
            pub principal_id: String,
            pub action: String,
            pub target_id: Option<String>, // e.g., tool_id, policy_id
            pub outcome: String,           // "success", "failure", "pending"
            pub details: HashMap<String, String>,
            pub tenant_id: Option<String>,
            pub correlation_id: Option<String>,
        }

        #[async_trait]
        pub trait AuditLogger: Send + Sync + 'static {
            async fn log(&self, entry: AuditLogEntry) -> Result<(), Box<dyn std::error::Error + Send + Sync>>;
        }

        pub struct ConsoleAuditLogger;

        #[async_trait]
        impl AuditLogger for ConsoleAuditLogger {
            #[instrument(name = "audit_log", skip(self, entry), level = "info")]
            async fn log(&self, entry: AuditLogEntry) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
                info!("AUDIT: {:?}", serde_json::to_string(&entry)?);
                Ok(())
            }
        }
    }
}

// --- Application-specific modules ---

/// Configuration for the Tool Calling Registry service.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub grpc_listen_addr: String,
    pub enable_ai_description_enhancement: bool,
    pub enable_ai_schema_validation_assistance: bool,
    pub openai_api_key: Option<String>,
    pub anthropic_api_key: Option<String>,
    pub default_tool_rate_limit_per_minute: u32,
    pub max_tool_call_timeout_ms: u64,
    pub enable_feature_jurisdiction_a: bool, // Example feature flag for jurisdictional control
    pub enable_feature_jurisdiction_b: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            grpc_listen_addr: "[::1]:50051".to_string(),
            enable_ai_description_enhancement: true,
            enable_ai_schema_validation_assistance: false,
            openai_api_key: std::env::var("OPENAI_API_KEY").ok(),
            anthropic_api_key: std::env::var("ANTHROPIC_API_KEY").ok(),
            default_tool_rate_limit_per_minute: 60, // 1 call per second by default
            max_tool_call_timeout_ms: 30_000, // 30 seconds
            enable_feature_jurisdiction_a: true,
            enable_feature_jurisdiction_b: false,
        }
    }
}

/// Custom error types for the service.
#[derive(Debug, thiserror::Error)]
pub enum ToolRegistryError {
    #[error("Tool not found: {0}")]
    NotFound(String),
    #[error("Invalid tool definition: {0}")]
    InvalidToolDefinition(String),
    #[error("Tool call validation failed: {0}")]
    ValidationFailed(String),
    #[error("Tool execution failed: {0}")]
    ExecutionFailed(String),
    #[error("Rate limit exceeded for tool {0}")]
    RateLimitExceeded(String),
    #[error("Authentication error: {0}")]
    AuthenticationError(String),
    #[error("Authorization error: {0}")]
    AuthorizationError(String),
    #[error("Internal server error: {0}")]
    InternalError(String),
    #[error("Serialization/Deserialization error: {0}")]
    SerdeError(#[from] serde_json::Error),
    #[error("HTTP client error: {0}")]
    HttpClientError(#[from] reqwest::Error),
    #[error("gRPC status error: {0}")]
    GrpcStatus(#[from] Status),
    #[error("AI vendor error: {0}")]
    AIVendorError(String),
}

impl From<ToolRegistryError> for Status {
    fn from(err: ToolRegistryError) -> Self {
        match err {
            ToolRegistryError::NotFound(msg) => Status::not_found(msg),
            ToolRegistryError::InvalidToolDefinition(msg) => Status::invalid_argument(msg),
            ToolRegistryError::ValidationFailed(msg) => Status::invalid_argument(msg),
            ToolRegistryError::RateLimitExceeded(msg) => Status::resource_exhausted(msg),
            ToolRegistryError::AuthenticationError(msg) => Status::unauthenticated(msg),
            ToolRegistryError::AuthorizationError(msg) => Status::permission_denied(msg),
            ToolRegistryError::ExecutionFailed(msg) => Status::internal(msg),
            ToolRegistryError::InternalError(msg) => Status::internal(msg),
            ToolRegistryError::SerdeError(e) => Status::internal(format!("Serialization error: {}", e)),
            ToolRegistryError::HttpClientError(e) => Status::internal(format!("HTTP client error: {}", e)),
            ToolRegistryError::GrpcStatus(s) => s, // Already a Status
            ToolRegistryError::AIVendorError(msg) => Status::internal(format!("AI vendor error: {}", msg)),
        }
    }
}

/// Data models for tools, calls, and related entities.
pub mod models {
    use super::*;
    use std::collections::HashMap;

    pub type ToolId = String;
    pub type PrincipalId = String;
    pub type CallId = String;

    #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
    pub enum AuthStrategy {
        None,
        BearerToken { env_var_name: String },
        ApiKey { header_name: String, env_var_name: String },
        // Add more complex strategies like OAuth2, AWS SigV4, etc.
    }

    #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
    pub struct RateLimitPolicy {
        pub calls_per_minute: u32,
        pub burst_size: u32,
    }

    impl Default for RateLimitPolicy {
        fn default() -> Self {
            Self {
                calls_per_minute: 60, // 1 call per second
                burst_size: 5,
            }
        }
    }

    #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
    pub struct ToolDefinition {
        pub id: ToolId,
        pub name: String,
        pub description: String,
        pub input_schema: Value,  // JSON Schema
        pub output_schema: Value, // JSON Schema
        pub endpoint_url: String,
        pub auth_strategy: AuthStrategy,
        pub rate_limit_policy: RateLimitPolicy,
        pub tags: Vec<String>,
        pub created_by: PrincipalId,
        pub created_at: String,
        pub updated_at: String,
        pub metadata: HashMap<String, String>, // For additional vendor-specific or custom data
        pub feature_flags: HashMap<String, bool>, // For jurisdictional or experimental features
    }

    #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
    pub struct ToolCallRequest {
        pub tool_id: ToolId,
        pub input_params: Value, // JSON object matching input_schema
        pub call_id: CallId,
        pub principal_id: PrincipalId,
        pub tenant_id: Option<String>,
        pub correlation_id: Option<String>,
    }

    #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
    pub struct ToolCallResult {
        pub call_id: CallId,
        pub tool_id: ToolId,
        pub output: Value, // JSON object matching output_schema
        pub duration_ms: u64,
        pub status: String, // "success", "failure"
        pub error_message: Option<String>,
        pub timestamp: String,
    }

    // gRPC message definitions (manual mapping for this single file)
    // In a real project, these would be generated by `tonic-build` from a .proto file.
    pub mod grpc {
        use super::*;

        #[derive(Clone, PartialEq, Message)]
        pub struct RegisterToolRequest {
            #[prost(string, tag = "1")]
            pub name: String,
            #[prost(string, tag = "2")]
            pub description: String,
            #[prost(string, tag = "3")]
            pub input_schema_json: String,
            #[prost(string, tag = "4")]
            pub output_schema_json: String,
            #[prost(string, tag = "5")]
            pub endpoint_url: String,
            #[prost(message, optional, tag = "6")]
            pub auth_strategy: Option<GrpcAuthStrategy>,
            #[prost(message, optional, tag = "7")]
            pub rate_limit_policy: Option<GrpcRateLimitPolicy>,
            #[prost(string, repeated, tag = "8")]
            pub tags: Vec<String>,
            #[prost(map = "string, string", tag = "9")]
            pub metadata: HashMap<String, String>,
            #[prost(map = "string, bool", tag = "10")]
            pub feature_flags: HashMap<String, bool>,
            #[prost(string, optional, tag = "11")]
            pub correlation_id: Option<String>,
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct UpdateToolRequest {
            #[prost(string, tag = "1")]
            pub id: String,
            #[prost(string, optional, tag = "2")]
            pub name: Option<String>,
            #[prost(string, optional, tag = "3")]
            pub description: Option<String>,
            #[prost(string, optional, tag = "4")]
            pub input_schema_json: Option<String>,
            #[prost(string, optional, tag = "5")]
            pub output_schema_json: Option<String>,
            #[prost(string, optional, tag = "6")]
            pub endpoint_url: Option<String>,
            #[prost(message, optional, tag = "7")]
            pub auth_strategy: Option<GrpcAuthStrategy>,
            #[prost(message, optional, tag = "8")]
            pub rate_limit_policy: Option<GrpcRateLimitPolicy>,
            #[prost(string, repeated, tag = "9")]
            pub tags: Vec<String>, // Overwrites existing tags if provided
            #[prost(map = "string, string", tag = "10")]
            pub metadata: HashMap<String, String>, // Merges with existing metadata
            #[prost(map = "string, bool", tag = "11")]
            pub feature_flags: HashMap<String, bool>, // Merges with existing feature flags
            #[prost(string, optional, tag = "12")]
            pub correlation_id: Option<String>,
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct ToolDefinitionResponse {
            #[prost(string, tag = "1")]
            pub id: String,
            #[prost(string, tag = "2")]
            pub name: String,
            #[prost(string, tag = "3")]
            pub description: String,
            #[prost(string, tag = "4")]
            pub input_schema_json: String,
            #[prost(string, tag = "5")]
            pub output_schema_json: String,
            #[prost(string, tag = "6")]
            pub endpoint_url: String,
            #[prost(message, optional, tag = "7")]
            pub auth_strategy: Option<GrpcAuthStrategy>,
            #[prost(message, optional, tag = "8")]
            pub rate_limit_policy: Option<GrpcRateLimitPolicy>,
            #[prost(string, repeated, tag = "9")]
            pub tags: Vec<String>,
            #[prost(string, tag = "10")]
            pub created_by: String,
            #[prost(string, tag = "11")]
            pub created_at: String,
            #[prost(string, tag = "12")]
            pub updated_at: String,
            #[prost(map = "string, string", tag = "13")]
            pub metadata: HashMap<String, String>,
            #[prost(map = "string, bool", tag = "14")]
            pub feature_flags: HashMap<String, bool>,
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct GetToolRequest {
            #[prost(string, tag = "1")]
            pub id: String,
            #[prost(string, optional, tag = "2")]
            pub correlation_id: Option<String>,
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct ListToolsRequest {
            #[prost(string, repeated, tag = "1")]
            pub tags: Vec<String>,
            #[prost(string, optional, tag = "2")]
            pub name_contains: Option<String>,
            #[prost(uint32, tag = "3")]
            pub limit: u32,
            #[prost(uint32, tag = "4")]
            pub offset: u32,
            #[prost(string, optional, tag = "5")]
            pub correlation_id: Option<String>,
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct ListToolsResponse {
            #[prost(message, repeated, tag = "1")]
            pub tools: Vec<ToolDefinitionResponse>,
            #[prost(uint32, tag = "2")]
            pub total_count: u32,
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct ExecuteToolCallRequest {
            #[prost(string, tag = "1")]
            pub tool_id: String,
            #[prost(string, tag = "2")]
            pub input_params_json: String,
            #[prost(string, optional, tag = "3")]
            pub correlation_id: Option<String>,
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct ExecuteToolCallResponse {
            #[prost(string, tag = "1")]
            pub call_id: String,
            #[prost(string, tag = "2")]
            pub tool_id: String,
            #[prost(string, tag = "3")]
            pub output_json: String,
            #[prost(uint64, tag = "4")]
            pub duration_ms: u64,
            #[prost(string, tag = "5")]
            pub status: String,
            #[prost(string, optional, tag = "6")]
            pub error_message: Option<String>,
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct GrpcAuthStrategy {
            #[prost(oneof = "grpc_auth_strategy::Strategy", tags = "1, 2, 3")]
            pub strategy: Option<grpc_auth_strategy::Strategy>,
        }

        pub mod grpc_auth_strategy {
            use super::*;
            #[derive(Clone, PartialEq, Message)]
            pub enum Strategy {
                #[prost(message, tag = "1")]
                None(GrpcAuthStrategyNone),
                #[prost(message, tag = "2")]
                BearerToken(GrpcAuthStrategyBearerToken),
                #[prost(message, tag = "3")]
                ApiKey(GrpcAuthStrategyApiKey),
            }
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct GrpcAuthStrategyNone {}

        #[derive(Clone, PartialEq, Message)]
        pub struct GrpcAuthStrategyBearerToken {
            #[prost(string, tag = "1")]
            pub env_var_name: String,
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct GrpcAuthStrategyApiKey {
            #[prost(string, tag = "1")]
            pub header_name: String,
            #[prost(string, tag = "2")]
            pub env_var_name: String,
        }

        impl From<AuthStrategy> for GrpcAuthStrategy {
            fn from(strategy: AuthStrategy) -> Self {
                GrpcAuthStrategy {
                    strategy: Some(match strategy {
                        AuthStrategy::None => grpc_auth_strategy::Strategy::None(GrpcAuthStrategyNone {}),
                        AuthStrategy::BearerToken { env_var_name } => {
                            grpc_auth_strategy::Strategy::BearerToken(GrpcAuthStrategyBearerToken { env_var_name })
                        }
                        AuthStrategy::ApiKey {
                            header_name,
                            env_var_name,
                        } => grpc_auth_strategy::Strategy::ApiKey(GrpcAuthStrategyApiKey {
                            header_name,
                            env_var_name,
                        }),
                    }),
                }
            }
        }

        impl TryFrom<GrpcAuthStrategy> for AuthStrategy {
            type Error = ToolRegistryError;
            fn try_from(grpc_strategy: GrpcAuthStrategy) -> Result<Self, Self::Error> {
                match grpc_strategy.strategy {
                    Some(grpc_auth_strategy::Strategy::None(_)) => Ok(AuthStrategy::None),
                    Some(grpc_auth_strategy::Strategy::BearerToken(bt)) => {
                        Ok(AuthStrategy::BearerToken { env_var_name: bt.env_var_name })
                    }
                    Some(grpc_auth_strategy::Strategy::ApiKey(ak)) => Ok(AuthStrategy::ApiKey {
                        header_name: ak.header_name,
                        env_var_name: ak.env_var_name,
                    }),
                    None => Err(ToolRegistryError::InvalidToolDefinition(
                        "AuthStrategy must be specified".to_string(),
                    )),
                }
            }
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct GrpcRateLimitPolicy {
            #[prost(uint32, tag = "1")]
            pub calls_per_minute: u32,
            #[prost(uint32, tag = "2")]
            pub burst_size: u32,
        }

        impl From<RateLimitPolicy> for GrpcRateLimitPolicy {
            fn from(policy: RateLimitPolicy) -> Self {
                GrpcRateLimitPolicy {
                    calls_per_minute: policy.calls_per_minute,
                    burst_size: policy.burst_size,
                }
            }
        }

        impl From<GrpcRateLimitPolicy> for RateLimitPolicy {
            fn from(grpc_policy: GrpcRateLimitPolicy) -> Self {
                RateLimitPolicy {
                    calls_per_minute: grpc_policy.calls_per_minute,
                    burst_size: grpc_policy.burst_size,
                }
            }
        }

        // Agent introspection messages
        #[derive(Clone, PartialEq, Message)]
        pub struct IntrospectRequest {}

        #[derive(Clone, PartialEq, Message)]
        pub struct IntrospectResponse {
            #[prost(string, tag = "1")]
            pub purpose: String,
            #[prost(string, repeated, tag = "2")]
            pub dependencies: Vec<String>,
            #[prost(string, repeated, tag = "3")]
            pub invalidation_conditions: Vec<String>,
            #[prost(string, repeated, tag = "4")]
            pub adjacent_apps: Vec<String>,
            #[prost(string, tag = "5")]
            pub current_status: String,
            #[prost(map = "string, string", tag = "6")]
            pub metrics: HashMap<String, String>,
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct GetAssumptionsRequest {}

        #[derive(Clone, PartialEq, Message)]
        pub struct GetAssumptionsResponse {
            #[prost(string, repeated, tag = "1")]
            pub assumptions: Vec<String>,
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct GetFailureModesRequest {}

        #[derive(Clone, PartialEq, Message)]
        pub struct GetFailureModesResponse {
            #[prost(string, repeated, tag = "1")]
            pub failure_modes: Vec<String>,
        }

        #[derive(Clone, PartialEq, Message)]
        pub struct GetUpdateTriggersRequest {}

        #[derive(Clone, PartialEq, Message)]
        pub struct GetUpdateTriggersResponse {
            #[prost(string, repeated, tag = "1")]
            pub update_triggers: Vec<String>,
        }

        // Tonic service definition (manual)
        #[tonic::service]
        pub trait ToolRegistry {
            type RegisterToolStream: tonic::codegen::tokio_stream::Stream<Item = Result<ToolDefinitionResponse, Status>> + Send + 'static;
            async fn register_tool(
                &self,
                request: Request<RegisterToolRequest>,
            ) -> Result<Response<ToolDefinitionResponse>, Status>;

            async fn update_tool(
                &self,
                request: Request<UpdateToolRequest>,
            ) -> Result<Response<ToolDefinitionResponse>, Status>;

            async fn get_tool(
                &self,
                request: Request<GetToolRequest>,
            ) -> Result<Response<ToolDefinitionResponse>, Status>;

            async fn list_tools(
                &self,
                request: Request<ListToolsRequest>,
            ) -> Result<Response<ListToolsResponse>, Status>;

            async fn execute_tool_call(
                &self,
                request: Request<ExecuteToolCallRequest>,
            ) -> Result<Response<ExecuteToolCallResponse>, Status>;

            // Agent introspection methods
            async fn introspect(
                &self,
                request: Request<IntrospectRequest>,
            ) -> Result<Response<IntrospectResponse>, Status>;

            async fn get_assumptions(
                &self,
                request: Request<GetAssumptionsRequest>,
            ) -> Result<Response<GetAssumptionsResponse>, Status>;

            async fn get_failure_modes(
                &self,
                request: Request<GetFailureModesRequest>,
            ) -> Result<Response<GetFailureModesResponse>, Status>;

            async fn get_update_triggers(
                &self,
                request: Request<GetUpdateTriggersRequest>,
            ) -> Result<Response<GetUpdateTriggersResponse>, Status>;
        }
    }
}

/// Core registry for storing and managing tool definitions.
#[async_trait]
pub trait ToolStore: Send + Sync + 'static {
    async fn register_tool(&self, tool: models::ToolDefinition) -> Result<models::ToolDefinition, ToolRegistryError>;
    async fn update_tool(&self, tool: models::ToolDefinition) -> Result<models::ToolDefinition, ToolRegistryError>;
    async fn get_tool(&self, id: &models::ToolId) -> Result<models::ToolDefinition, ToolRegistryError>;
    async fn list_tools(
        &self,
        tags: &[String],
        name_contains: Option<&str>,
        limit: u32,
        offset: u32,
    ) -> Result<(Vec<models::ToolDefinition>, u32), ToolRegistryError>;
    async fn delete_tool(&self, id: &models::ToolId) -> Result<(), ToolRegistryError>;
}

pub struct InMemoryToolStore {
    tools: DashMap<models::ToolId, models::ToolDefinition>,
}

impl InMemoryToolStore {
    pub fn new() -> Self {
        InMemoryToolStore {
            tools: DashMap::new(),
        }
    }
}

#[async_trait]
impl ToolStore for InMemoryToolStore {
    #[instrument(name = "store_register_tool", skip(self, tool), fields(tool_id = %tool.id, tool_name = %tool.name), level = "info")]
    async fn register_tool(&self, mut tool: models::ToolDefinition) -> Result<models::ToolDefinition, ToolRegistryError> {
        if self.tools.contains_key(&tool.id) {
            return Err(ToolRegistryError::InvalidToolDefinition(format!(
                "Tool with ID {} already exists",
                tool.id
            )));
        }
        let now = chrono::Utc::now().to_rfc3339();
        tool.created_at = now.clone();
        tool.updated_at = now;
        self.tools.insert(tool.id.clone(), tool.clone());
        info!("Tool registered successfully.");
        Ok(tool)
    }

    #[instrument(name = "store_update_tool", skip(self, tool), fields(tool_id = %tool.id, tool_name = %tool.name), level = "info")]
    async fn update_tool(&self, mut tool: models::ToolDefinition) -> Result<models::ToolDefinition, ToolRegistryError> {
        let mut entry = self
            .tools
            .get_mut(&tool.id)
            .ok_or_else(|| ToolRegistryError::NotFound(format!("Tool with ID {} not found for update", tool.id)))?;

        // Only update fields that are explicitly provided in the `tool` object
        // This assumes the `tool` object passed here already contains the merged/updated fields.
        // For a partial update, the gRPC handler would merge fields before calling this.
        entry.name = tool.name;
        entry.description = tool.description;
        entry.input_schema = tool.input_schema;
        entry.output_schema = tool.output_schema;
        entry.endpoint_url = tool.endpoint_url;
        entry.auth_strategy = tool.auth_strategy;
        entry.rate_limit_policy = tool.rate_limit_policy;
        entry.tags = tool.tags;
        entry.metadata = tool.metadata;
        entry.feature_flags = tool.feature_flags;
        entry.updated_at = chrono::Utc::now().to_rfc3339();

        info!("Tool updated successfully.");
        Ok(entry.value().clone())
    }

    #[instrument(name = "store_get_tool", skip(self), fields(tool_id = %id), level = "debug")]
    async fn get_tool(&self, id: &models::ToolId) -> Result<models::ToolDefinition, ToolRegistryError> {
        self.tools
            .get(id)
            .map(|entry| entry.value().clone())
            .ok_or_else(|| ToolRegistryError::NotFound(format!("Tool with ID {} not found", id)))
    }

    #[instrument(name = "store_list_tools", skip(self, tags, name_contains), level = "debug")]
    async fn list_tools(
        &self,
        tags: &[String],
        name_contains: Option<&str>,
        limit: u32,
        offset: u32,
    ) -> Result<(Vec<models::ToolDefinition>, u32), ToolRegistryError> {
        let all_tools: Vec<models::ToolDefinition> = self.tools.iter().map(|entry| entry.value().clone()).collect();

        let filtered_tools: Vec<models::ToolDefinition> = all_tools
            .into_iter()
            .filter(|tool| {
                let tag_match = tags.is_empty() || tags.iter().all(|t| tool.tags.contains(t));
                let name_match = name_contains
                    .map(|s| tool.name.to_lowercase().contains(&s.to_lowercase()))
                    .unwrap_or(true);
                tag_match && name_match
            })
            .collect();

        let total_count = filtered_tools.len() as u32;
        let paginated_tools = filtered_tools
            .into_iter()
            .skip(offset as usize)
            .take(limit as usize)
            .collect();

        info!(
            total_count = %total_count,
            returned_count = %paginated_tools.len(),
            "Tools listed successfully."
        );
        Ok((paginated_tools, total_count))
    }

    #[instrument(name = "store_delete_tool", skip(self), fields(tool_id = %id), level = "info")]
    async fn delete_tool(&self, id: &models::ToolId) -> Result<(), ToolRegistryError> {
        if self.tools.remove(id).is_some() {
            info!("Tool deleted successfully.");
            Ok(())
        } else {
            Err(ToolRegistryError::NotFound(format!("Tool with ID {} not found for deletion", id)))
        }
    }
}

/// Handles validation of tool call inputs against JSON schemas.
#[async_trait]
pub trait ToolInputValidator: Send + Sync + 'static {
    async fn validate_input(
        &self,
        tool_id: &models::ToolId,
        input: &Value,
        schema: &Value,
    ) -> Result<(), ToolRegistryError>;
}

pub struct JsonSchemaValidator {
    config: Arc<AppConfig>,
    ai_client: Arc<dyn AIVendorClient>, // For schema validation assistance
}

impl JsonSchemaValidator {
    pub fn new(config: Arc<AppConfig>, ai_client: Arc<dyn AIVendorClient>) -> Self {
        JsonSchemaValidator { config, ai_client }
    }
}

#[async_trait]
impl ToolInputValidator for JsonSchemaValidator {
    #[instrument(name = "validate_tool_input", skip(self, input, schema), fields(tool_id = %tool_id), level = "debug")]
    async fn validate_input(
        &self,
        tool_id: &models::ToolId,
        input: &Value,
        schema: &Value,
    ) -> Result<(), ToolRegistryError> {
        let compiled_schema = match jsonschema::JSONSchema::compile(schema) {
            Ok(s) => s,
            Err(e) => {
                error!("Failed to compile schema for tool {}: {}", tool_id, e);
                return Err(ToolRegistryError::InternalError(format!(
                    "Failed to compile schema: {}",
                    e
                )));
            }
        };

        let validation_result = compiled_schema.validate(input);

        if let Err(errors) = validation_result {
            let mut error_messages = Vec::new();
            for error in errors {
                error_messages.push(format!("Validation error: {} at {}", error.instance_path, error.kind));
            }
            let combined_error = error_messages.join("; ");
            warn!("Input validation failed for tool {}: {}", tool_id, combined_error);

            if self.config.enable_ai_schema_validation_assistance {
                info!("Attempting AI assistance for schema validation for tool {}", tool_id);
                let prompt = format!(
                    "The following JSON input failed to validate against its schema.
                    Schema: {}
                    Input: {}
                    Validation errors: {}
                    Please suggest how to fix the input to conform to the schema, focusing on the specific errors.
                    Provide a corrected JSON snippet if possible, or clear instructions.",
                    serde_json::to_string_pretty(schema).unwrap_or_default(),
                    serde_json::to_string_pretty(input).unwrap_or_default(),
                    combined_error
                );
                match self.ai_client.generate_text(&prompt, None).await {
                    Ok(suggestion) => {
                        warn!("AI validation assistance for tool {}: {}", tool_id, suggestion);
                        // In a real system, this might be returned to the caller or logged more prominently.
                    }
                    Err(e) => error!("AI validation assistance failed: {}", e),
                }
            }

            return Err(ToolRegistryError::ValidationFailed(combined_error));
        }

        info!("Input validated successfully for tool {}.", tool_id);
        Ok(())
    }
}

/// Handles making external HTTP calls to tool endpoints.
#[async_trait]
pub trait ToolExecutor: Send + Sync + 'static {
    async fn execute_http_call(
        &self,
        tool: &models::ToolDefinition,
        input_params: &Value,
        timeout: Duration,
    ) -> Result<Value, ToolRegistryError>;
}

pub struct HttpClientExecutor {
    client: reqwest::Client,
}

impl HttpClientExecutor {
    pub fn new() -> Self {
        HttpClientExecutor {
            client: reqwest::Client::builder()
                .timeout(Duration::from_secs(60)) // Default client timeout
                .build()
                .expect("Failed to build HTTP client"),
        }
    }

    async fn get_auth_header(&self, auth_strategy: &models::AuthStrategy) -> Result<Option<(String, String)>, ToolRegistryError> {
        match auth_strategy {
            models::AuthStrategy::None => Ok(None),
            models::AuthStrategy::BearerToken { env_var_name } => {
                let token = std::env::var(env_var_name).map_err(|_| {
                    ToolRegistryError::InternalError(format!(
                        "Environment variable {} not set for Bearer token auth",
                        env_var_name
                    ))
                })?;
                Ok(Some(("Authorization".to_string(), format!("Bearer {}", token))))
            }
            models::AuthStrategy::ApiKey {
                header_name,
                env_var_name,
            } => {
                let api_key = std::env::var(env_var_name).map_err(|_| {
                    ToolRegistryError::InternalError(format!(
                        "Environment variable {} not set for API key auth",
                        env_var_name
                    ))
                })?;
                Ok(Some((header_name.clone(), api_key)))
            }
        }
    }
}

#[async_trait]
impl ToolExecutor for HttpClientExecutor {
    #[instrument(name = "execute_http_call", skip(self, tool, input_params), fields(tool_id = %tool.id, endpoint = %tool.endpoint_url), level = "info")]
    async fn execute_http_call(
        &self,
        tool: &models::ToolDefinition,
        input_params: &Value,
        timeout: Duration,
    ) -> Result<Value, ToolRegistryError> {
        let auth_header = self.get_auth_header(&tool.auth_strategy).await?;

        let request_builder = self
            .client
            .post(&tool.endpoint_url)
            .json(input_params)
            .timeout(timeout);

        let request_builder = if let Some((header_name, header_value)) = auth_header {
            request_builder.header(&header_name, header_value)
        } else {
            request_builder
        };

        let response = request_builder.send().await?.error_for_status()?;

        let response_json: Value = response.json().await?;
        info!("Tool call to {} successful.", tool.endpoint_url);
        Ok(response_json)
    }
}

/// Manages rate limiting for tool calls.
pub struct ToolRateLimiter {
    // Keyed by tool_id, then by principal_id
    limiters: DashMap<models::ToolId, Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock, NoOpMiddleware>>>,
    default_quota: Quota,
}

impl ToolRateLimiter {
    pub fn new(default_calls_per_minute: u32) -> Self {
        let default_quota = Quota::per_minute(std::num::NonZeroU32::new(default_calls_per_minute).unwrap_or_else(|| std::num::NonZeroU32::new(1).unwrap()));
        ToolRateLimiter {
            limiters: DashMap::new(),
            default_quota,
        }
    }

    #[instrument(name = "check_rate_limit", skip(self), fields(tool_id = %tool_id, principal_id = %principal_id), level = "debug")]
    pub fn check_rate_limit(
        &self,
        tool_id: &models::ToolId,
        principal_id: &models::PrincipalId,
        policy: &models::RateLimitPolicy,
    ) -> Result<(), ToolRegistryError> {
        let quota = Quota::per_minute(std::num::NonZeroU32::new(policy.calls_per_minute).unwrap_or_else(|| std::num::NonZeroU32::new(1).unwrap()))
            .allow_burst(std::num::NonZeroU32::new(policy.burst_size).unwrap_or_else(|| std::num::NonZeroU32::new(1).unwrap()));

        let limiter = self.limiters.entry(tool_id.clone()).or_insert_with(|| {
            Arc::new(RateLimiter::direct(quota))
        });

        // Governor's direct limiter is not keyed, so we're applying a global limit per tool.
        // For per-principal limiting, the DashMap key would need to be (tool_id, principal_id).
        // For simplicity and to fit the 1MB constraint, we'll use a per-tool global limit here.
        // A more complex implementation would involve a `DashMap<(ToolId, PrincipalId), Arc<RateLimiter>>`.
        match limiter.check() {
            Ok(_) => {
                info!("Rate limit check passed for tool {} by principal {}.", tool_id, principal_id);
                Ok(())
            }
            Err(_) => {
                warn!("Rate limit exceeded for tool {} by principal {}.", tool_id, principal_id);
                Err(ToolRegistryError::RateLimitExceeded(format!(
                    "Rate limit exceeded for tool {}",
                    tool_id
                )))
            }
        }
    }

    pub fn update_tool_rate_limit_policy(&self, tool_id: &models::ToolId, policy: &models::RateLimitPolicy) {
        let quota = Quota::per_minute(std::num::NonZeroU32::new(policy.calls_per_minute).unwrap_or_else(|| std::num::NonZeroU32::new(1).unwrap()))
            .allow_burst(std::num::NonZeroU32::new(policy.burst_size).unwrap_or_else(|| std::num::NonZeroU32::new(1).unwrap()));

        self.limiters.insert(tool_id.clone(), Arc::new(RateLimiter::direct(quota)));
        info!("Updated rate limit policy for tool {}.", tool_id);
    }
}

/// Client for interacting with AI vendors (e.g., OpenAI, Anthropic).
#[async_trait]
pub trait AIVendorClient: Send + Sync + 'static {
    async fn generate_text(&self, prompt: &str, model: Option<&str>) -> Result<String, ToolRegistryError>;
    async fn generate_description_from_schema(&self, schema: &Value) -> Result<String, ToolRegistryError>;
}

pub struct OpenAIClient {
    api_key: String,
    client: reqwest::Client,
}

impl OpenAIClient {
    pub fn new(api_key: String) -> Self {
        OpenAIClient {
            api_key,
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl AIVendorClient for OpenAIClient {
    #[instrument(name = "openai_generate_text", skip(self, prompt), level = "debug")]
    async fn generate_text(&self, prompt: &str, model: Option<&str>) -> Result<String, ToolRegistryError> {
        let model_name = model.unwrap_or("gpt-3.5-turbo");
        let response = self
            .client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&json!({
                "model": model_name,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 500,
                "temperature": 0.7
            }))
            .send()
            .await?
            .error_for_status()?;

        let json_response: Value = response.json().await?;
        let content = json_response["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| ToolRegistryError::AIVendorError("Failed to parse OpenAI response".to_string()))?
            .to_string();
        info!("OpenAI text generation successful.");
        Ok(content)
    }

    #[instrument(name = "openai_generate_description_from_schema", skip(self, schema), level = "debug")]
    async fn generate_description_from_schema(&self, schema: &Value) -> Result<String, ToolRegistryError> {
        let prompt = format!(
            "Given the following JSON schema, generate a concise, clear, and user-friendly description of what this tool's input or output represents. Focus on its purpose and key parameters.
            Schema: {}
            Description:",
            serde_json::to_string_pretty(schema).unwrap_or_default()
        );
        self.generate_text(&prompt, Some("gpt-3.5-turbo")).await
    }
}

pub struct AnthropicClient {
    api_key: String,
    client: reqwest::Client,
}

impl AnthropicClient {
    pub fn new(api_key: String) -> Self {
        AnthropicClient {
            api_key,
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl AIVendorClient for AnthropicClient {
    #[instrument(name = "anthropic_generate_text", skip(self, prompt), level = "debug")]
    async fn generate_text(&self, prompt: &str, model: Option<&str>) -> Result<String, ToolRegistryError> {
        let model_name = model.unwrap_or("claude-3-haiku-20240307");
        let response = self
            .client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&json!({
                "model": model_name,
                "max_tokens": 500,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }))
            .send()
            .await?
            .error_for_status()?;

        let json_response: Value = response.json().await?;
        let content = json_response["content"][0]["text"]
            .as_str()
            .ok_or_else(|| ToolRegistryError::AIVendorError("Failed to parse Anthropic response".to_string()))?
            .to_string();
        info!("Anthropic text generation successful.");
        Ok(content)
    }

    #[instrument(name = "anthropic_generate_description_from_schema", skip(self, schema), level = "debug")]
    async fn generate_description_from_schema(&self, schema: &Value) -> Result<String, ToolRegistryError> {
        let prompt = format!(
            "Given the following JSON schema, generate a concise, clear, and user-friendly description of what this tool's input or output represents. Focus on its purpose and key parameters.
            Schema: {}
            Description:",
            serde_json::to_string_pretty(schema).unwrap_or_default()
        );
        self.generate_text(&prompt, Some("claude-3-haiku-20240307")).await
    }
}

pub struct MockAIVendorClient;

#[async_trait]
impl AIVendorClient for MockAIVendorClient {
    async fn generate_text(&self, prompt: &str, _model: Option<&str>) -> Result<String, ToolRegistryError> {
        info!("Mock AI Client: Generating text for prompt: {}", prompt);
        Ok(format!("Mock AI response for: {}", prompt))
    }

    async fn generate_description_from_schema(&self, schema: &Value) -> Result<String, ToolRegistryError> {
        info!("Mock AI Client: Generating description for schema: {:?}", schema);
        Ok(format!("A tool that processes data structured like: {}", schema))
    }
}

/// The gRPC service implementation for the Tool Registry.
pub struct ToolRegistryServiceImpl {
    config: Arc<AppConfig>,
    tool_store: Arc<dyn ToolStore>,
    authenticator: Arc<dyn shared_core_sdk::auth::Authenticator>,
    validator: Arc<dyn ToolInputValidator>,
    executor: Arc<dyn ToolExecutor>,
    rate_limiter: Arc<ToolRateLimiter>,
    event_publisher: Arc<dyn shared_core_sdk::event_bus::EventPublisher>,
    audit_logger: Arc<dyn shared_core_sdk::audit::AuditLogger>,
    ai_client: Arc<dyn AIVendorClient>,
}

impl ToolRegistryServiceImpl {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        config: Arc<AppConfig>,
        tool_store: Arc<dyn ToolStore>,
        authenticator: Arc<dyn shared_core_sdk::auth::Authenticator>,
        validator: Arc<dyn ToolInputValidator>,
        executor: Arc<dyn ToolExecutor>,
        rate_limiter: Arc<ToolRateLimiter>,
        event_publisher: Arc<dyn shared_core_sdk::event_bus::EventPublisher>,
        audit_logger: Arc<dyn shared_core_sdk::audit::AuditLogger>,
        ai_client: Arc<dyn AIVendorClient>,
    ) -> Self {
        ToolRegistryServiceImpl {
            config,
            tool_store,
            authenticator,
            validator,
            executor,
            rate_limiter,
            event_publisher,
            audit_logger,
            ai_client,
        }
    }

    async fn authenticate_request<T>(&self, request: &Request<T>, action: &str, tool_id: Option<&str>) -> Result<shared_core_sdk::auth::AuthContext, Status> {
        let auth_context = self.authenticator.authenticate(request.metadata()).await?;
        if let Some(id) = tool_id {
            self.authenticator.authorize_tool_access(&auth_context, id, action).await?;
        } else {
            // For actions like ListTools or RegisterTool, we might check a broader permission
            self.authenticator.authorize_tool_access(&auth_context, "global", action).await?;
        }
        Ok(auth_context)
    }

    async fn log_audit_event(
        &self,
        auth_context: &shared_core_sdk::auth::AuthContext,
        action: String,
        target_id: Option<String>,
        outcome: String,
        details: HashMap<String, String>,
        correlation_id: Option<String>,
    ) {
        let entry = shared_core_sdk::audit::AuditLogEntry {
            timestamp: chrono::Utc::now().to_rfc3339(),
            principal_id: auth_context.principal_id.clone(),
            action,
            target_id,
            outcome,
            details,
            tenant_id: auth_context.tenant_id.clone(),
            correlation_id,
        };
        if let Err(e) = self.audit_logger.log(entry).await {
            error!("Failed to log audit event: {}", e);
        }
    }

    async fn publish_event(&self, event: shared_core_sdk::event_bus::Event) {
        if let Err(e) = self.event_publisher.publish(event).await {
            error!("Failed to publish event: {}", e);
        }
    }
}

#[tonic::async_trait]
impl models::grpc::tool_registry_server::ToolRegistry for ToolRegistryServiceImpl {
    #[instrument(name = "grpc_register_tool", skip(self, request), level = "info")]
    async fn register_tool(
        &self,
        request: Request<models::grpc::RegisterToolRequest>,
    ) -> Result<Response<models::grpc::ToolDefinitionResponse>, Status> {
        let auth_context = self.authenticate_request(&request, "register", None).await?;
        let correlation_id = request.get_ref().correlation_id.clone(); // Assuming correlation_id field is added to requests

        let req = request.into_inner();
        info!("Received RegisterTool request for tool: {}", req.name);

        let input_schema: Value = serde_json::from_str(&req.input_schema_json)
            .map_err(|e| ToolRegistryError::InvalidToolDefinition(format!("Invalid input_schema_json: {}", e)))?;
        let output_schema: Value = serde_json::from_str(&req.output_schema_json)
            .map_err(|e| ToolRegistryError::InvalidToolDefinition(format!("Invalid output_schema_json: {}", e)))?;

        // AI-powered description enhancement
        let mut description = req.description;
        if self.config.enable_ai_description_enhancement {
            info!("Attempting AI description enhancement for tool: {}", req.name);
            match self.ai_client.generate_description_from_schema(&input_schema).await {
                Ok(ai_desc) if description.is_empty() => {
                    description = format!("{} (AI-generated based on input schema)", ai_desc);
                    info!("AI generated description for tool {}.", req.name);
                }
                Ok(ai_desc) => {
                    description = format!("{}\n\nAI-suggested details: {}", description, ai_desc);
                    info!("AI enhanced description for tool {}.", req.name);
                }
                Err(e) => error!("AI description enhancement failed for tool {}: {}", req.name, e),
            }
        }

        let tool_id = Uuid::new_v4().to_string();
        let new_tool = models::ToolDefinition {
            id: tool_id.clone(),
            name: req.name,
            description,
            input_schema,
            output_schema,
            endpoint_url: req.endpoint_url,
            auth_strategy: req
                .auth_strategy
                .map(models::AuthStrategy::try_from)
                .transpose()?
                .unwrap_or(models::AuthStrategy::None),
            rate_limit_policy: req
                .rate_limit_policy
                .map(models::RateLimitPolicy::from)
                .unwrap_or_default(),
            tags: req.tags,
            created_by: auth_context.principal_id.clone(),
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
            metadata: req.metadata,
            feature_flags: req.feature_flags,
        };

        let result = self.tool_store.register_tool(new_tool.clone()).await;

        match result {
            Ok(tool) => {
                self.rate_limiter.update_tool_rate_limit_policy(&tool.id, &tool.rate_limit_policy);
                self.publish_event(shared_core_sdk::event_bus::Event::ToolRegistered {
                    tool_id: tool.id.clone(),
                    tool_name: tool.name.clone(),
                    principal_id: auth_context.principal_id.clone(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                })
                .await;
                self.log_audit_event(
                    &auth_context,
                    "RegisterTool".to_string(),
                    Some(tool.id.clone()),
                    "success".to_string(),
                    HashMap::from([("tool_name".to_string(), tool.name.clone())]),
                    correlation_id,
                )
                .await;
                info!("Tool {} registered successfully.", tool.id);
                Ok(Response::new(tool.into()))
            }
            Err(e) => {
                error!("Failed to register tool: {}", e);
                self.log_audit_event(
                    &auth_context,
                    "RegisterTool".to_string(),
                    Some(tool_id),
                    "failure".to_string(),
                    HashMap::from([("error".to_string(), e.to_string())]),
                    correlation_id,
                )
                .await;
                Err(e.into())
            }
        }
    }

    #[instrument(name = "grpc_update_tool", skip(self, request), level = "info")]
    async fn update_tool(
        &self,
        request: Request<models::grpc::UpdateToolRequest>,
    ) -> Result<Response<models::grpc::ToolDefinitionResponse>, Status> {
        let auth_context = self.authenticate_request(&request, "update", Some(&request.get_ref().id)).await?;
        let correlation_id = request.get_ref().correlation_id.clone();

        let req = request.into_inner();
        info!("Received UpdateTool request for tool: {}", req.id);

        let existing_tool = self.tool_store.get_tool(&req.id).await?;

        let mut updated_tool = existing_tool.clone();

        if let Some(name) = req.name {
            updated_tool.name = name;
        }
        if let Some(description) = req.description {
            updated_tool.description = description;
        }
        if let Some(input_schema_json) = req.input_schema_json {
            updated_tool.input_schema = serde_json::from_str(&input_schema_json)
                .map_err(|e| ToolRegistryError::InvalidToolDefinition(format!("Invalid input_schema_json: {}", e)))?;
        }
        if let Some(output_schema_json) = req.output_schema_json {
            updated_tool.output_schema = serde_json::from_str(&output_schema_json)
                .map_err(|e| ToolRegistryError::InvalidToolDefinition(format!("Invalid output_schema_json: {}", e)))?;
        }
        if let Some(endpoint_url) = req.endpoint_url {
            updated_tool.endpoint_url = endpoint_url;
        }
        if let Some(auth_strategy) = req.auth_strategy {
            updated_tool.auth_strategy = models::AuthStrategy::try_from(auth_strategy)?;
        }
        if let Some(rate_limit_policy) = req.rate_limit_policy {
            updated_tool.rate_limit_policy = models::RateLimitPolicy::from(rate_limit_policy);
        }
        if !req.tags.is_empty() {
            updated_tool.tags = req.tags; // Overwrite tags if provided
        }
        updated_tool.metadata.extend(req.metadata); // Merge metadata
        updated_tool.feature_flags.extend(req.feature_flags); // Merge feature flags

        let result = self.tool_store.update_tool(updated_tool.clone()).await;

        match result {
            Ok(tool) => {
                self.rate_limiter.update_tool_rate_limit_policy(&tool.id, &tool.rate_limit_policy);
                self.publish_event(shared_core_sdk::event_bus::Event::ToolUpdated {
                    tool_id: tool.id.clone(),
                    tool_name: tool.name.clone(),
                    principal_id: auth_context.principal_id.clone(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                })
                .await;
                self.log_audit_event(
                    &auth_context,
                    "UpdateTool".to_string(),
                    Some(tool.id.clone()),
                    "success".to_string(),
                    HashMap::from([("tool_name".to_string(), tool.name.clone())]),
                    correlation_id,
                )
                .await;
                info!("Tool {} updated successfully.", tool.id);
                Ok(Response::new(tool.into()))
            }
            Err(e) => {
                error!("Failed to update tool {}: {}", req.id, e);
                self.log_audit_event(
                    &auth_context,
                    "UpdateTool".to_string(),
                    Some(req.id),
                    "failure".to_string(),
                    HashMap::from([("error".to_string(), e.to_string())]),
                    correlation_id,
                )
                .await;
                Err(e.into())
            }
        }
    }

    #[instrument(name = "grpc_get_tool", skip(self, request), level = "info")]
    async fn get_tool(
        &self,
        request: Request<models::grpc::GetToolRequest>,
    ) -> Result<Response<models::grpc::ToolDefinitionResponse>, Status> {
        let auth_context = self.authenticate_request(&request, "read", Some(&request.get_ref().id)).await?;
        let correlation_id = request.get_ref().correlation_id.clone();

        let tool_id = request.into_inner().id;
        info!("Received GetTool request for tool: {}", tool_id);

        let result = self.tool_store.get_tool(&tool_id).await;

        match result {
            Ok(tool) => {
                self.log_audit_event(
                    &auth_context,
                    "GetTool".to_string(),
                    Some(tool.id.clone()),
                    "success".to_string(),
                    HashMap::new(),
                    correlation_id,
                )
                .await;
                info!("Tool {} retrieved successfully.", tool.id);
                Ok(Response::new(tool.into()))
            }
            Err(e) => {
                error!("Failed to get tool {}: {}", tool_id, e);
                self.log_audit_event(
                    &auth_context,
                    "GetTool".to_string(),
                    Some(tool_id),
                    "failure".to_string(),
                    HashMap::from([("error".to_string(), e.to_string())]),
                    correlation_id,
                )
                .await;
                Err(e.into())
            }
        }
    }

    #[instrument(name = "grpc_list_tools", skip(self, request), level = "info")]
    async fn list_tools(
        &self,
        request: Request<models::grpc::ListToolsRequest>,
    ) -> Result<Response<models::grpc::ListToolsResponse>, Status> {
        let auth_context = self.authenticate_request(&request, "read", None).await?;
        let correlation_id = request.get_ref().correlation_id.clone();

        let req = request.into_inner();
        info!("Received ListTools request with tags: {:?}, name_contains: {:?}", req.tags, req.name_contains);

        let (tools, total_count) = self
            .tool_store
            .list_tools(&req.tags, req.name_contains.as_deref(), req.limit, req.offset)
            .await?;

        self.log_audit_event(
            &auth_context,
            "ListTools".to_string(),
            None,
            "success".to_string(),
            HashMap::from([
                ("tags".to_string(), req.tags.join(",")),
                ("name_contains".to_string(), req.name_contains.unwrap_or_default()),
                ("count".to_string(), tools.len().to_string()),
            ]),
            correlation_id,
        )
        .await;
        info!("Listed {} tools (total {}).", tools.len(), total_count);
        Ok(Response::new(models::grpc::ListToolsResponse {
            tools: tools.into_iter().map(Into::into).collect(),
            total_count,
        }))
    }

    #[instrument(name = "grpc_execute_tool_call", skip(self, request), level = "info")]
    async fn execute_tool_call(
        &self,
        request: Request<models::grpc::ExecuteToolCallRequest>,
    ) -> Result<Response<models::grpc::ExecuteToolCallResponse>, Status> {
        let auth_context = self.authenticate_request(&request, "execute", Some(&request.get_ref().tool_id)).await?;
        let correlation_id = request.get_ref().correlation_id.clone();

        let req = request.into_inner();
        let call_id = Uuid::new_v4().to_string();
        info!("Received ExecuteToolCall request for tool: {} (Call ID: {})", req.tool_id, call_id);

        let tool = self.tool_store.get_tool(&req.tool_id).await?;

        // Check feature flags for jurisdictional control
        if let Some(enabled) = tool.feature_flags.get("jurisdiction_a_enabled") {
            if *enabled && !self.config.enable_feature_jurisdiction_a {
                let error_msg = format!("Tool {} is restricted by jurisdiction A policy.", tool.id);
                error!("{}", error_msg);
                self.log_audit_event(
                    &auth_context,
                    "ExecuteToolCall".to_string(),
                    Some(tool.id.clone()),
                    "failure".to_string(),
                    HashMap::from([
                        ("call_id".to_string(), call_id.clone()),
                        ("error".to_string(), error_msg.clone()),
                        ("policy_violation".to_string(), "jurisdiction_a".to_string()),
                    ]),
                    correlation_id.clone(),
                )
                .await;
                self.publish_event(shared_core_sdk::event_bus::Event::PolicyViolation {
                    principal_id: auth_context.principal_id.clone(),
                    tool_id: Some(tool.id.clone()),
                    violation_type: "jurisdiction_a_restriction".to_string(),
                    details: error_msg.clone(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                })
                .await;
                return Err(Status::permission_denied(error_msg));
            }
        }

        // Rate Limiting
        if let Err(e) = self
            .rate_limiter
            .check_rate_limit(&tool.id, &auth_context.principal_id, &tool.rate_limit_policy)
        {
            error!("Rate limit exceeded for tool {}: {}", tool.id, e);
            self.log_audit_event(
                &auth_context,
                "ExecuteToolCall".to_string(),
                Some(tool.id.clone()),
                "failure".to_string(),
                HashMap::from([
                    ("call_id".to_string(), call_id.clone()),
                    ("error".to_string(), e.to_string()),
                    ("policy_violation".to_string(), "rate_limit".to_string()),
                ]),
                correlation_id.clone(),
            )
            .await;
            self.publish_event(shared_core_sdk::event_bus::Event::PolicyViolation {
                principal_id: auth_context.principal_id.clone(),
                tool_id: Some(tool.id.clone()),
                violation_type: "rate_limit_exceeded".to_string(),
                details: e.to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            })
            .await;
            return Err(e.into());
        }

        let input_params: Value = serde_json::from_str(&req.input_params_json)
            .map_err(|e| ToolRegistryError::ValidationFailed(format!("Invalid input_params_json: {}", e)))?;

        // Input Validation
        if let Err(e) = self.validator.validate_input(&tool.id, &input_params, &tool.input_schema).await {
            error!("Input validation failed for tool {}: {}", tool.id, e);
            self.log_audit_event(
                &auth_context,
                "ExecuteToolCall".to_string(),
                Some(tool.id.clone()),
                "failure".to_string(),
                HashMap::from([
                    ("call_id".to_string(), call_id.clone()),
                    ("error".to_string(), e.to_string()),
                    ("policy_violation".to_string(), "input_validation".to_string()),
                ]),
                correlation_id.clone(),
            )
            .await;
            self.publish_event(shared_core_sdk::event_bus::Event::PolicyViolation {
                principal_id: auth_context.principal_id.clone(),
                tool_id: Some(tool.id.clone()),
                violation_type: "input_validation_failed".to_string(),
                details: e.to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            })
            .await;
            return Err(e.into());
        }

        self.publish_event(shared_core_sdk::event_bus::Event::ToolCallInitiated {
            tool_id: tool.id.clone(),
            tool_name: tool.name.clone(),
            principal_id: auth_context.principal_id.clone(),
            call_id: call_id.clone(),
            input_hash: format!("{:x}", md5::compute(req.input_params_json.as_bytes())), // Hash input for privacy
            timestamp: chrono::Utc::now().to_rfc3339(),
        })
        .await;
        self.log_audit_event(
            &auth_context,
            "ExecuteToolCall".to_string(),
            Some(tool.id.clone()),
            "pending".to_string(),
            HashMap::from([
                ("call_id".to_string(), call_id.clone()),
                ("input_hash".to_string(), format!("{:x}", md5::compute(req.input_params_json.as_bytes()))),
            ]),
            correlation_id.clone(),
        )
        .await;

        let start_time = Instant::now();
        let execution_result = self
            .executor
            .execute_http_call(&tool, &input_params, Duration::from_millis(self.config.max_tool_call_timeout_ms))
            .await;
        let duration_ms = start_time.elapsed().as_millis() as u64;

        match execution_result {
            Ok(output) => {
                // Optional: Output Validation
                if let Err(e) = self.validator.validate_input(&tool.id, &output, &tool.output_schema).await {
                    warn!("Output validation failed for tool {}: {}", tool.id, e);
                    // This is a warning, not a hard error, as the tool itself might have returned valid data
                    // but it didn't conform to our schema. We still return the output but log the issue.
                    self.log_audit_event(
                        &auth_context,
                        "ExecuteToolCall".to_string(),
                        Some(tool.id.clone()),
                        "warning".to_string(),
                        HashMap::from([
                            ("call_id".to_string(), call_id.clone()),
                            ("error".to_string(), format!("Output schema mismatch: {}", e)),
                            ("status".to_string(), "completed_with_output_validation_warning".to_string()),
                        ]),
                        correlation_id.clone(),
                    )
                    .await;
                    self.publish_event(shared_core_sdk::event_bus::Event::ToolCallCompleted {
                        tool_id: tool.id.clone(),
                        tool_name: tool.name.clone(),
                        principal_id: auth_context.principal_id.clone(),
                        call_id: call_id.clone(),
                        duration_ms,
                        status: "completed_with_output_validation_warning".to_string(),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    })
                    .await;
                    return Ok(Response::new(models::grpc::ExecuteToolCallResponse {
                        call_id,
                        tool_id: tool.id,
                        output_json: serde_json::to_string(&output).unwrap_or_default(),
                        duration_ms,
                        status: "completed_with_output_validation_warning".to_string(),
                        error_message: Some(format!("Tool call succeeded but output failed schema validation: {}", e)),
                    }));
                }

                self.log_audit_event(
                    &auth_context,
                    "ExecuteToolCall".to_string(),
                    Some(tool.id.clone()),
                    "success".to_string(),
                    HashMap::from([
                        ("call_id".to_string(), call_id.clone()),
                        ("duration_ms".to_string(), duration_ms.to_string()),
                    ]),
                    correlation_id.clone(),
                )
                .await;
                self.publish_event(shared_core_sdk::event_bus::Event::ToolCallCompleted {
                    tool_id: tool.id.clone(),
                    tool_name: tool.name.clone(),
                    principal_id: auth_context.principal_id.clone(),
                    call_id: call_id.clone(),
                    duration_ms,
                    status: "success".to_string(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                })
                .await;
                info!("Tool call {} completed successfully in {}ms.", call_id, duration_ms);
                Ok(Response::new(models::grpc::ExecuteToolCallResponse {
                    call_id,
                    tool_id: tool.id,
                    output_json: serde_json::to_string(&output).unwrap_or_default(),
                    duration_ms,
                    status: "success".to_string(),
                    error_message: None,
                }))
            }
            Err(e) => {
                error!("Tool call {} failed: {}", call_id, e);
                self.log_audit_event(
                    &auth_context,
                    "ExecuteToolCall".to_string(),
                    Some(tool.id.clone()),
                    "failure".to_string(),
                    HashMap::from([
                        ("call_id".to_string(), call_id.clone()),
                        ("error".to_string(), e.to_string()),
                        ("duration_ms".to_string(), duration_ms.to_string()),
                    ]),
                    correlation_id.clone(),
                )
                .await;
                self.publish_event(shared_core_sdk::event_bus::Event::ToolCallFailed {
                    tool_id: tool.id.clone(),
                    tool_name: tool.name.clone(),
                    principal_id: auth_context.principal_id.clone(),
                    call_id: call_id.clone(),
                    error_message: e.to_string(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                })
                .await;
                Err(e.into())
            }
        }
    }

    // --- Agent Introspection Methods ---

    #[instrument(name = "grpc_introspect", skip(self, request), level = "info")]
    async fn introspect(
        &self,
        _request: Request<models::grpc::IntrospectRequest>,
    ) -> Result<Response<models::grpc::IntrospectResponse>, Status> {
        // No auth for introspection, as it's meant for self-discovery by other agents
        info!("Received Introspect request.");
        let response = models::grpc::IntrospectResponse {
            purpose: "Provides a secure, high-performance gRPC service for registering, managing, and executing AI agent tools. It enforces authentication, validation, rate-limiting, and audit logging for all tool interactions.".to_string(),
            dependencies: vec![
                "Shared Core SDK (Auth, Event Bus, Audit)".to_string(),
                "External AI vendor APIs (e.g., OpenAI, Anthropic for description/schema assistance)".to_string(),
                "External tool endpoints (HTTP/REST)".to_string(),
            ],
            invalidation_conditions: vec![
                "Changes to shared auth protocol".to_string(),
                "Significant updates to tool definition schema".to_string(),
                "Security vulnerabilities in underlying gRPC or HTTP client libraries".to_string(),
                "Depletion of storage for tool definitions".to_string(),
                "Changes in AI vendor API contracts for assistance features".to_string(),
            ],
            adjacent_apps: vec![
                "APP_01_Inference_CostRouter (for routing tool calls to cost-optimized endpoints)".to_string(),
                "APP_14_Agents_MultiModelOrchestrator (primary consumer of this registry)".to_string(),
                "APP_37_Governance_AuditTrailEngine (receives audit logs)".to_string(),
                "APP_09_Memory_VectorStore (for storing tool usage patterns or complex tool states)".to_string(),
            ],
            current_status: "Operational".to_string(), // In a real app, this would query health checks
            metrics: HashMap::from([
                ("registered_tools".to_string(), self.tool_store.list_tools(&[], None, 1, 0).await.map(|(_, count)| count.to_string()).unwrap_or_default()),
                ("active_tool_calls".to_string(), "0".to_string()), // Placeholder
                ("total_tool_calls_24h".to_string(), "0".to_string()), // Placeholder
            ]),
        };
        Ok(Response::new(response))
    }

    #[instrument(name = "grpc_get_assumptions", skip(self, request), level = "info")]
    async fn get_assumptions(
        &self,
        _request: Request<models::grpc::GetAssumptionsRequest>,
    ) -> Result<Response<models::grpc::GetAssumptionsResponse>, Status> {
        info!("Received GetAssumptions request.");
        let response = models::grpc::GetAssumptionsResponse {
            assumptions: vec![
                "External tool endpoints are reachable and adhere to their defined schemas.".to_string(),
                "The shared authentication service is highly available and performs authorization correctly.".to_string(),
                "Environment variables for tool authentication (API keys, bearer tokens) are securely managed and available.".to_string(),
                "JSON schemas provided for tools are valid and accurately describe expected inputs/outputs.".to_string(),
                "AI vendor APIs (OpenAI, Anthropic) are available for optional description/validation assistance.".to_string(),
                "The underlying network infrastructure is reliable for inter-service communication.".to_string(),
                "Time synchronization across the ecosystem is maintained for accurate logging and rate limiting.".to_string(),
            ],
        };
        Ok(Response::new(response))
    }

    #[instrument(name = "grpc_get_failure_modes", skip(self, request), level = "info")]
    async fn get_failure_modes(
        &self,
        _request: Request<models::grpc::GetFailureModesRequest>,
    ) -> Result<Response<models::grpc::GetFailureModesResponse>, Status> {
        info!("Received GetFailureModes request.");
        let response = models::grpc::GetFailureModesResponse {
            failure_modes: vec![
                "External tool endpoint unreachability or errors (HTTP 4xx/5xx, timeouts).".to_string(),
                "Invalid or malicious tool definitions leading to execution errors or security vulnerabilities.".to_string(),
                "Authentication/Authorization service outages or misconfigurations.".to_string(),
                "Rate limit exhaustion due to high demand or misconfigured policies.".to_string(),
                "Schema validation failures due to incorrect agent inputs or malformed tool definitions.".to_string(),
                "Dependency on AI vendor APIs (e.g., OpenAI, Anthropic) for optional features failing.".to_string(),
                "Internal storage (e.g., database for tool definitions) becoming unavailable or corrupted.".to_string(),
                "Resource exhaustion (CPU, memory, network) leading to service unresponsiveness.".to_string(),
                "Incorrect feature flag configuration leading to unintended jurisdictional violations or feature unavailability.".to_string(),
            ],
        };
        Ok(Response::new(response))
    }

    #[instrument(name = "grpc_get_update_triggers", skip(self, request), level = "info")]
    async fn get_update_triggers(
        &self,
        _request: Request<models::grpc::GetUpdateTriggersRequest>,
    ) -> Result<Response<models::grpc::GetUpdateTriggersResponse>, Status> {
        info!("Received GetUpdateTriggers request.");
        let response = models::grpc::GetUpdateTriggersResponse {
            update_triggers: vec![
                "New AI vendors or tool types requiring new integration patterns.".to_string(),
                "Updates to shared core SDK (auth, event bus, audit) requiring API/protocol changes.".to_string(),
                "Security vulnerabilities discovered in any component or dependency.".to_string(),
                "Performance bottlenecks identified under load.".to_string(),
                "Changes in compliance requirements or jurisdictional policies.".to_string(),
                "Feedback from agent developers on usability or missing features.".to_string(),
                "Introduction of new AI models or capabilities that can enhance registry features (e.g., better schema interpretation).".to_string(),
            ],
        };
        Ok(Response::new(response))
    }
}

// Helper for converting models::ToolDefinition to models::grpc::ToolDefinitionResponse
impl From<models::ToolDefinition> for models::grpc::ToolDefinitionResponse {
    fn from(tool: models::ToolDefinition) -> Self {
        models::grpc::ToolDefinitionResponse {
            id: tool.id,
            name: tool.name,
            description: tool.description,
            input_schema_json: serde_json::to_string(&tool.input_schema).unwrap_or_default(),
            output_schema_json: serde_json::to_string(&tool.output_schema).unwrap_or_default(),
            endpoint_url: tool.endpoint_url,
            auth_strategy: Some(tool.auth_strategy.into()),
            rate_limit_policy: Some(tool.rate_limit_policy.into()),
            tags: tool.tags,
            created_by: tool.created_by,
            created_at: tool.created_at,
            updated_at: tool.updated_at,
            metadata: tool.metadata,
            feature_flags: tool.feature_flags,
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    info!("Starting APP_08_Tools_CallingRegistry service...");

    // Load configuration
    let config = Arc::new(AppConfig::default()); // In a real app, load from file/env
    info!("Configuration loaded: {:?}", config);

    // Setup shared core SDK components
    let (event_tx, mut event_rx) = mpsc::channel::<shared_core_sdk::event_bus::Event>(100);
    let event_publisher: Arc<dyn shared_core_sdk::event_bus::EventPublisher> =
        Arc::new(shared_core_sdk::event_bus::MpscEventPublisher::new(event_tx));
    let audit_logger: Arc<dyn shared_core_sdk::audit::AuditLogger> = Arc::new(shared_core_sdk::audit::ConsoleAuditLogger);
    let authenticator: Arc<dyn shared_core_sdk::auth::Authenticator> = Arc::new(shared_core_sdk::auth::MockAuthenticator);

    // Spawn a task to process events (e.g., send to a Kafka/NATS bus)
    tokio::spawn(async move {
        while let Some(event) = event_rx.recv().await {
            info!("Event Bus received: {:?}", event);
            // In a real system, send this to a distributed event bus
        }
    });

    // Setup AI client for optional features
    let ai_client: Arc<dyn AIVendorClient> = if config.enable_ai_description_enhancement || config.enable_ai_schema_validation_assistance {
        if let Some(api_key) = &config.openai_api_key {
            info!("Using OpenAI for AI assistance.");
            Arc::new(OpenAIClient::new(api_key.clone()))
        } else if let Some(api_key) = &config.anthropic_api_key {
            info!("Using Anthropic for AI assistance.");
            Arc::new(AnthropicClient::new(api_key.clone()))
        } else {
            warn!("AI assistance enabled but no API key found for OpenAI or Anthropic. Using mock AI client.");
            Arc::new(MockAIVendorClient)
        }
    } else {
        info!("AI assistance disabled. Using mock AI client.");
        Arc::new(MockAIVendorClient)
    };


    // Setup application components
    let tool_store: Arc<dyn ToolStore> = Arc::new(InMemoryToolStore::new());
    let validator: Arc<dyn ToolInputValidator> = Arc::new(JsonSchemaValidator::new(config.clone(), ai_client.clone()));
    let executor: Arc<dyn ToolExecutor> = Arc::new(HttpClientExecutor::new());
    let rate_limiter = Arc::new(ToolRateLimiter::new(config.default_tool_rate_limit_per_minute));

    // Create the gRPC service instance
    let tool_registry_service = ToolRegistryServiceImpl::new(
        config.clone(),
        tool_store.clone(),
        authenticator.clone(),
        validator.clone(),
        executor.clone(),
        rate_limiter.clone(),
        event_publisher.clone(),
        audit_logger.clone(),
        ai_client.clone(),
    );

    let addr = config.grpc_listen_addr.parse()?;
    info!("ToolRegistryService listening on {}", addr);

    Server::builder()
        .add_service(models::grpc::tool_registry_server::ToolRegistryServer::new(tool_registry_service))
        .serve(addr)
        .await?;

    Ok(())
}