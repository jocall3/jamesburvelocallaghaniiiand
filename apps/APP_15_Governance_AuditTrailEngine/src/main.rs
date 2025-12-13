// apps/APP_15_Governance_AuditTrailEngine/src/main.rs

//! APP_15_Governance_AuditTrailEngine
//!
//! A Rust service built on a tamper-evident data structure (like a Merkle tree) to store audit logs.
//! It consumes events from the bus and provides a secure API for querying audit trails.
//!
//! This application ensures the integrity and immutability of critical operational logs,
//! providing a foundational layer for compliance, security, and explainability across the AI ecosystem.
//!
//! License: MIT
//! Copyright (c) 2024 AI Ecosystem
//!
//! Disclaimer: This software is provided "as is", without warranty of any kind, express or
//! implied, including but not limited to the warranties of merchantability, fitness for a
//! particular purpose and noninfringement. In no event shall the authors or copyright
//! holders be liable for any claim, damages or other liability, whether in an action of
//! contract, tort or otherwise, arising from, out of or in connection with the software
//! or the use or other dealings in the software.
//!
//! This system is designed for logging and auditing purposes only. It does not provide
//! financial advice, make behavioral predictions, or engage in political advocacy.
//! All data processed is for system operational analysis and compliance verification.

use actix_web::{
    web::{self, Data},
    App, HttpResponse, HttpServer, Responder,
};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use config::{Config, ConfigError, File};
use hex::{decode, encode};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::{collections::HashMap, fmt, sync::Arc, time::Duration};
use tokio::sync::{mpsc, Mutex};
use uuid::Uuid;

// --- Common SDK Mocks/Stubs (for demonstration within a single file) ---
// In a real project, these would be external crates or modules.

/// Common types for the AI Ecosystem.
pub mod common_sdk_types {
    use serde::{Deserialize, Serialize};
    use uuid::Uuid;

    #[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
    pub struct AppId(pub Uuid);

    #[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
    pub struct UserId(pub Uuid);

    #[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
    pub struct TenantId(pub Uuid);

    #[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
    pub struct ResourceId(pub Uuid);

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub enum AiVendor {
        OpenAI,
        Anthropic,
        GoogleDeepMind,
        MetaAI,
        MicrosoftAzureAI,
        AmazonBedrock,
        NVIDIA,
        HuggingFace,
        Mistral,
        Cohere,
        StabilityAI,
        Perplexity,
        Other(String),
    }

    impl fmt::Display for AiVendor {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            match self {
                AiVendor::OpenAI => write!(f, "OpenAI"),
                AiVendor::Anthropic => write!(f, "Anthropic"),
                AiVendor::GoogleDeepMind => write!(f, "GoogleDeepMind"),
                AiVendor::MetaAI => write!(f, "MetaAI"),
                AiVendor::MicrosoftAzureAI => write!(f, "MicrosoftAzureAI"),
                AiVendor::AmazonBedrock => write!(f, "AmazonBedrock"),
                AiVendor::NVIDIA => write!(f, "NVIDIA"),
                AiVendor::HuggingFace => write!(f, "HuggingFace"),
                AiVendor::Mistral => write!(f, "Mistral"),
                AiVendor::Cohere => write!(f, "Cohere"),
                AiVendor::StabilityAI => write!(f, "StabilityAI"),
                AiVendor::Perplexity => write!(f, "Perplexity"),
                AiVendor::Other(s) => write!(f, "Other({})", s),
            }
        }
    }
}

/// Common authentication and authorization interfaces.
pub mod common_sdk_auth {
    use super::*;
    use common_sdk_types::{AppId, TenantId, UserId};
    use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    pub struct Claims {
        pub sub: String, // Subject (user ID)
        pub app_id: Uuid,
        pub tenant_id: Uuid,
        pub roles: Vec<String>,
        pub exp: usize, // Expiration time
    }

    #[async_trait]
    pub trait AuthService: Send + Sync + 'static {
        async fn validate_token(&self, token: &str) -> Result<Claims, String>;
        async fn generate_token(&self, user_id: UserId, app_id: AppId, tenant_id: TenantId, roles: Vec<String>) -> Result<String, String>;
    }

    pub struct JwtAuthService {
        encoding_key: EncodingKey,
        decoding_key: DecodingKey,
        jwt_secret: String,
    }

    impl JwtAuthService {
        pub fn new(jwt_secret: String) -> Self {
            let encoding_key = EncodingKey::from_secret(jwt_secret.as_bytes());
            let decoding_key = DecodingKey::from_secret(jwt_secret.as_bytes());
            Self {
                encoding_key,
                decoding_key,
                jwt_secret,
            }
        }
    }

    #[async_trait]
    impl AuthService for JwtAuthService {
        async fn validate_token(&self, token: &str) -> Result<Claims, String> {
            let validation = Validation::default();
            decode::<Claims>(token, &self.decoding_key, &validation)
                .map(|data| data.claims)
                .map_err(|e| format!("Invalid token: {}", e))
        }

        async fn generate_token(&self, user_id: UserId, app_id: AppId, tenant_id: TenantId, roles: Vec<String>) -> Result<String, String> {
            let exp = (Utc::now() + chrono::Duration::hours(1)).timestamp() as usize;
            let claims = Claims {
                sub: user_id.0.to_string(),
                app_id: app_id.0,
                tenant_id: tenant_id.0,
                roles,
                exp,
            };
            encode(&Header::default(), &claims, &self.encoding_key)
                .map_err(|e| format!("Failed to generate token: {}", e))
        }
    }

    // Mock AuthService for testing or simplified environments
    pub struct MockAuthService;

    #[async_trait]
    impl AuthService for MockAuthService {
        async fn validate_token(&self, token: &str) -> Result<Claims, String> {
            if token == "valid-token" {
                Ok(Claims {
                    sub: Uuid::new_v4().to_string(),
                    app_id: Uuid::new_v4(),
                    tenant_id: Uuid::new_v4(),
                    roles: vec!["admin".to_string()],
                    exp: (Utc::now() + chrono::Duration::hours(1)).timestamp() as usize,
                })
            } else {
                Err("Invalid mock token".to_string())
            }
        }

        async fn generate_token(&self, _user_id: UserId, _app_id: AppId, _tenant_id: TenantId, _roles: Vec<String>) -> Result<String, String> {
            Ok("mock-token".to_string())
        }
    }
}

/// Common event bus for inter-service communication.
pub mod common_sdk_event_bus {
    use super::*;
    use common_sdk_types::{AiVendor, AppId, ResourceId, TenantId, UserId};
    use serde::{Deserialize, Serialize};
    use std::fmt;

    /// Represents a generic event in the ecosystem.
    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(tag = "type", content = "payload")]
    pub enum AppEvent {
        // Core System Events
        ServiceStarted {
            app_id: AppId,
            timestamp: DateTime<Utc>,
        },
        UserLoggedIn {
            user_id: UserId,
            tenant_id: TenantId,
            timestamp: DateTime<Utc>,
            ip_address: String,
        },
        ConfigurationUpdated {
            app_id: AppId,
            actor_id: UserId,
            timestamp: DateTime<Utc>,
            config_key: String,
            old_value: serde_json::Value,
            new_value: serde_json::Value,
        },

        // AI-specific Events
        InferenceRequestLogged {
            request_id: ResourceId,
            actor_id: UserId,
            tenant_id: TenantId,
            timestamp: DateTime<Utc>,
            model_id: String,
            vendor: AiVendor,
            input_tokens: u32,
            output_tokens: u32,
            cost_usd: f64,
            latency_ms: u64,
            metadata: serde_json::Value, // e.g., prompt hash, safety flags
        },
        AgentActionExecuted {
            agent_id: ResourceId,
            actor_id: UserId, // User who initiated the agent
            tenant_id: TenantId,
            timestamp: DateTime<Utc>,
            action_type: String, // e.g., "tool_call", "model_inference", "data_retrieval"
            tool_name: Option<String>,
            model_id: Option<String>,
            vendor: Option<AiVendor>,
            input_data_hash: String,
            output_data_hash: String,
            success: bool,
            error_message: Option<String>,
            metadata: serde_json::Value, // e.g., tool parameters, model response summary
        },
        ModelFineTuningJobStarted {
            job_id: ResourceId,
            actor_id: UserId,
            tenant_id: TenantId,
            timestamp: DateTime<Utc>,
            base_model_id: String,
            dataset_id: ResourceId,
            vendor: AiVendor,
            hyperparameters: serde_json::Value,
        },
        ModelEvaluationCompleted {
            evaluation_id: ResourceId,
            actor_id: UserId,
            tenant_id: TenantId,
            timestamp: DateTime<Utc>,
            model_id: String,
            dataset_id: ResourceId,
            metrics: serde_json::Value, // e.g., {"accuracy": 0.9, "f1": 0.85}
            vendor: AiVendor,
        },
        DatasetVersionCreated {
            dataset_id: ResourceId,
            version_id: ResourceId,
            actor_id: UserId,
            tenant_id: TenantId,
            timestamp: DateTime<Utc>,
            source_uri: String,
            record_count: u64,
            schema_hash: String,
            metadata: serde_json::Value,
        },
        PromptVersionCreated {
            prompt_id: ResourceId,
            version_id: ResourceId,
            actor_id: UserId,
            tenant_id: TenantId,
            timestamp: DateTime<Utc>,
            template: String,
            variables: Vec<String>,
            metadata: serde_json::Value,
        },
        CostAllocationUpdated {
            tenant_id: TenantId,
            actor_id: UserId,
            timestamp: DateTime<Utc>,
            service_id: String, // e.g., "inference_gateway", "agent_orchestrator"
            allocated_budget_usd: f64,
            metadata: serde_json::Value,
        },
        PolicyEnforced {
            policy_id: ResourceId,
            actor_id: UserId, // System or user
            tenant_id: TenantId,
            timestamp: DateTime<Utc>,
            resource_id: ResourceId,
            resource_type: String,
            action: String, // e.g., "blocked_inference", "data_redacted"
            decision: String, // "allow", "deny", "warn"
            reason: String,
            metadata: serde_json::Value,
        },
        RedTeamSimulationRun {
            simulation_id: ResourceId,
            actor_id: UserId,
            tenant_id: TenantId,
            timestamp: DateTime<Utc>,
            target_model_id: String,
            attack_vector: String,
            success: bool,
            report_uri: String,
            metadata: serde_json::Value,
        },
        // Add more events as needed for other apps
    }

    impl fmt::Display for AppEvent {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "AppEvent::{}", self.event_type())
        }
    }

    impl AppEvent {
        pub fn event_type(&self) -> &'static str {
            match self {
                AppEvent::ServiceStarted { .. } => "ServiceStarted",
                AppEvent::UserLoggedIn { .. } => "UserLoggedIn",
                AppEvent::ConfigurationUpdated { .. } => "ConfigurationUpdated",
                AppEvent::InferenceRequestLogged { .. } => "InferenceRequestLogged",
                AppEvent::AgentActionExecuted { .. } => "AgentActionExecuted",
                AppEvent::ModelFineTuningJobStarted { .. } => "ModelFineTuningJobStarted",
                AppEvent::ModelEvaluationCompleted { .. } => "ModelEvaluationCompleted",
                AppEvent::DatasetVersionCreated { .. } => "DatasetVersionCreated",
                AppEvent::PromptVersionCreated { .. } => "PromptVersionCreated",
                AppEvent::CostAllocationUpdated { .. } => "CostAllocationUpdated",
                AppEvent::PolicyEnforced { .. } => "PolicyEnforced",
                AppEvent::RedTeamSimulationRun { .. } => "RedTeamSimulationRun",
            }
        }

        pub fn get_tenant_id(&self) -> Option<TenantId> {
            match self {
                AppEvent::UserLoggedIn { tenant_id, .. }
                | AppEvent::ConfigurationUpdated { tenant_id, .. }
                | AppEvent::InferenceRequestLogged { tenant_id, .. }
                | AppEvent::AgentActionExecuted { tenant_id, .. }
                | AppEvent::ModelFineTuningJobStarted { tenant_id, .. }
                | AppEvent::ModelEvaluationCompleted { tenant_id, .. }
                | AppEvent::DatasetVersionCreated { tenant_id, .. }
                | AppEvent::PromptVersionCreated { tenant_id, .. }
                | AppEvent::CostAllocationUpdated { tenant_id, .. }
                | AppEvent::PolicyEnforced { tenant_id, .. }
                | AppEvent::RedTeamSimulationRun { tenant_id, .. } => Some(tenant_id.clone()),
                _ => None,
            }
        }

        pub fn get_actor_id(&self) -> Option<UserId> {
            match self {
                AppEvent::UserLoggedIn { user_id, .. } => Some(user_id.clone()),
                AppEvent::ConfigurationUpdated { actor_id, .. }
                | AppEvent::InferenceRequestLogged { actor_id, .. }
                | AppEvent::AgentActionExecuted { actor_id, .. }
                | AppEvent::ModelFineTuningJobStarted { actor_id, .. }
                | AppEvent::ModelEvaluationCompleted { actor_id, .. }
                | AppEvent::DatasetVersionCreated { actor_id, .. }
                | AppEvent::PromptVersionCreated { actor_id, .. }
                | AppEvent::CostAllocationUpdated { actor_id, .. }
                | AppEvent::PolicyEnforced { actor_id, .. }
                | AppEvent::RedTeamSimulationRun { actor_id, .. } => Some(actor_id.clone()),
                _ => None,
            }
        }
    }

    #[async_trait]
    pub trait EventBusConsumer: Send + Sync + 'static {
        async fn consume_events(&self, handler: Box<dyn Fn(AppEvent) + Send + Sync>) -> Result<(), String>;
    }

    pub struct MockEventBusConsumer {
        // In a real scenario, this would connect to Kafka, NATS, etc.
        // For a mock, we can simulate receiving events.
        event_sender: mpsc::Sender<AppEvent>,
    }

    impl MockEventBusConsumer {
        pub fn new(event_sender: mpsc::Sender<AppEvent>) -> Self {
            Self { event_sender }
        }

        // This method allows external code (e.g., tests or other mocks) to push events
        pub async fn push_event(&self, event: AppEvent) {
            if let Err(e) = self.event_sender.send(event).await {
                error!("Failed to send mock event: {}", e);
            }
        }
    }

    #[async_trait]
    impl EventBusConsumer for MockEventBusConsumer {
        async fn consume_events(&self, handler: Box<dyn Fn(AppEvent) + Send + Sync>) -> Result<(), String> {
            info!("MockEventBusConsumer started consuming events.");
            // In a real scenario, this would be a loop polling the bus.
            // For this mock, we'll just keep the channel open.
            // The actual event processing will happen when events are sent via `push_event`.
            // This is a simplified representation.
            Ok(())
        }
    }
}

// --- End Common SDK Mocks/Stubs ---

/// Configuration for the Audit Trail Engine.
#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub server_address: String,
    pub database_url: String,
    pub jwt_secret: String,
    pub log_level: String,
    pub enable_merkle_tree: bool,
    pub merkle_tree_flush_interval_seconds: u64,
    pub jurisdiction_data_retention_days: Option<u32>, // Feature flag for jurisdictional controls
    pub enable_mock_auth: bool,
    pub enable_mock_event_bus: bool,
}

impl AppConfig {
    /// Loads configuration from environment variables and `Settings.toml`.
    pub fn load() -> Result<Self, ConfigError> {
        let s = Config::builder()
            .add_source(File::with_name("Settings.toml").required(false))
            .add_source(config::Environment::with_prefix("APP_15").separator("__"))
            .build()?;
        s.try_deserialize()
    }
}

// --- Merkle Tree Implementation ---

/// A cryptographic hash type.
pub type Hash = [u8; 32]; // SHA256 output size

/// Represents a node in the Merkle tree.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MerkleNode {
    Leaf(Hash),
    Parent(Hash, Box<MerkleNode>, Box<MerkleNode>),
    Empty,
}

impl MerkleNode {
    /// Calculates the hash of the node.
    pub fn hash(&self) -> Hash {
        match self {
            MerkleNode::Leaf(h) => *h,
            MerkleNode::Parent(h, _, _) => *h,
            MerkleNode::Empty => Sha256::digest(b"").into(), // Hash of an empty string
        }
    }

    /// Creates a new parent node from two children.
    fn new_parent(left: MerkleNode, right: MerkleNode) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(left.hash());
        hasher.update(right.hash());
        MerkleNode::Parent(hasher.finalize().into(), Box::new(left), Box::new(right))
    }
}

/// A simple Merkle Tree implementation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleTree {
    leaves: Vec<Hash>,
    root: MerkleNode,
}

impl MerkleTree {
    /// Creates a new empty Merkle tree.
    pub fn new() -> Self {
        MerkleTree {
            leaves: Vec::new(),
            root: MerkleNode::Empty,
        }
    }

    /// Adds a new leaf (data hash) to the Merkle tree.
    pub fn add_leaf(&mut self, data_hash: Hash) {
        self.leaves.push(data_hash);
        self.rebuild_tree();
    }

    /// Rebuilds the entire tree from the current set of leaves.
    fn rebuild_tree(&mut self) {
        if self.leaves.is_empty() {
            self.root = MerkleNode::Empty;
            return;
        }

        let mut current_level: Vec<MerkleNode> = self
            .leaves
            .iter()
            .map(|&h| MerkleNode::Leaf(h))
            .collect();

        while current_level.len() > 1 {
            let mut next_level = Vec::new();
            let mut i = 0;
            while i < current_level.len() {
                let left = current_level[i].clone();
                let right = if i + 1 < current_level.len() {
                    current_level[i + 1].clone()
                } else {
                    left.clone() // Duplicate the last node if odd number of leaves
                };
                next_level.push(MerkleNode::new_parent(left, right));
                i += 2;
            }
            current_level = next_level;
        }
        self.root = current_level.pop().unwrap_or(MerkleNode::Empty);
    }

    /// Returns the current Merkle root hash.
    pub fn get_root(&self) -> Hash {
        self.root.hash()
    }

    /// Generates a Merkle proof for a given leaf hash.
    /// Returns a vector of sibling hashes needed to reconstruct the path to the root.
    pub fn get_proof(&self, leaf_hash: Hash) -> Option<Vec<Hash>> {
        if self.leaves.is_empty() {
            return None;
        }

        let mut proof = Vec::new();
        let mut current_level: Vec<MerkleNode> = self
            .leaves
            .iter()
            .map(|&h| MerkleNode::Leaf(h))
            .collect();

        let mut target_index = self.leaves.iter().position(|&h| h == leaf_hash)?;

        while current_level.len() > 1 {
            let mut next_level = Vec::new();
            let mut i = 0;
            let mut found_in_level = false;

            while i < current_level.len() {
                let left = current_level[i].clone();
                let right = if i + 1 < current_level.len() {
                    current_level[i + 1].clone()
                } else {
                    left.clone()
                };

                if i == target_index || i + 1 == target_index {
                    found_in_level = true;
                    if i == target_index {
                        proof.push(right.hash());
                    } else {
                        proof.push(left.hash());
                    }
                    target_index = i / 2; // Move to the parent's index in the next level
                }
                next_level.push(MerkleNode::new_parent(left, right));
                i += 2;
            }
            if !found_in_level {
                return None; // Leaf not found in this level, something went wrong
            }
            current_level = next_level;
        }
        Some(proof)
    }

    /// Verifies a Merkle proof for a given leaf hash and root hash.
    pub fn verify_proof(leaf_hash: Hash, proof: &[Hash], root_hash: Hash) -> bool {
        let mut current_hash = leaf_hash;
        for sibling_hash in proof {
            let mut hasher = Sha256::new();
            // Order matters: left then right. We assume the proof provides the sibling in the correct order.
            // If current_hash was left, sibling is right. If current_hash was right, sibling is left.
            // A more robust proof would include direction. For simplicity, we'll assume a canonical order (e.g., smaller hash first).
            // However, for a simple Merkle tree, the proof is just the siblings.
            // A common approach is to always hash (current, sibling) or (sibling, current) based on index.
            // For this basic implementation, we'll just hash them in a fixed order.
            // A real-world Merkle proof would typically include the index of the leaf and the path direction.
            // For this example, we'll assume the proof is ordered correctly.
            if current_hash < *sibling_hash {
                hasher.update(current_hash);
                hasher.update(sibling_hash);
            } else {
                hasher.update(sibling_hash);
                hasher.update(current_hash);
            }
            current_hash = hasher.finalize().into();
        }
        current_hash == root_hash
    }
}

// --- Audit Record Definition ---

/// Represents a single audit record.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AuditRecord {
    pub id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub actor_id: Uuid,
    pub tenant_id: Uuid,
    pub action: String,
    pub target_id: Option<Uuid>,
    pub details: serde_json::Value, // JSON blob for specific event details
    pub metadata: serde_json::Value, // JSON blob for AI vendor context, etc.
    pub record_hash: String,         // SHA256 hash of the record content
    pub merkle_root_at_ingestion: Option<String>, // Merkle root when this record was added
    pub merkle_proof_at_ingestion: Option<String>, // JSON array of hashes for proof
}

impl AuditRecord {
    /// Hashes the significant fields of the audit record to ensure tamper-evidence.
    pub fn calculate_hash(&self) -> Hash {
        let mut hasher = Sha256::new();
        hasher.update(self.id.as_bytes());
        hasher.update(self.timestamp.to_rfc3339().as_bytes());
        hasher.update(self.actor_id.as_bytes());
        hasher.update(self.tenant_id.as_bytes());
        hasher.update(self.action.as_bytes());
        if let Some(target_id) = self.target_id {
            hasher.update(target_id.as_bytes());
        }
        hasher.update(self.details.to_string().as_bytes());
        hasher.update(self.metadata.to_string().as_bytes());
        hasher.finalize().into()
    }

    /// Creates an AuditRecord from an AppEvent.
    pub fn from_app_event(event: common_sdk_event_bus::AppEvent) -> Self {
        let id = Uuid::new_v4();
        let timestamp = Utc::now();
        let actor_id = event
            .get_actor_id()
            .map(|u| u.0)
            .unwrap_or_else(Uuid::nil);
        let tenant_id = event
            .get_tenant_id()
            .map(|t| t.0)
            .unwrap_or_else(Uuid::nil);
        let action = event.event_type().to_string();
        let target_id = match &event {
            common_sdk_event_bus::AppEvent::InferenceRequestLogged { request_id, .. } => {
                Some(request_id.0)
            }
            common_sdk_event_bus::AppEvent::AgentActionExecuted { agent_id, .. } => {
                Some(agent_id.0)
            }
            common_sdk_event_bus::AppEvent::ModelFineTuningJobStarted { job_id, .. } => {
                Some(job_id.0)
            }
            common_sdk_event_bus::AppEvent::ModelEvaluationCompleted { evaluation_id, .. } => {
                Some(evaluation_id.0)
            }
            common_sdk_event_bus::AppEvent::DatasetVersionCreated { dataset_id, .. } => {
                Some(dataset_id.0)
            }
            common_sdk_event_bus::AppEvent::PromptVersionCreated { prompt_id, .. } => {
                Some(prompt_id.0)
            }
            common_sdk_event_bus::AppEvent::PolicyEnforced { resource_id, .. } => {
                Some(resource_id.0)
            }
            common_sdk_event_bus::AppEvent::RedTeamSimulationRun { simulation_id, .. } => {
                Some(simulation_id.0)
            }
            _ => None,
        };

        let details = serde_json::to_value(&event).unwrap_or_else(|_| serde_json::json!({"error": "Failed to serialize event"}));
        let metadata = serde_json::json!({
            "source_event_type": event.event_type(),
            "ai_vendor": match &event {
                common_sdk_event_bus::AppEvent::InferenceRequestLogged { vendor, .. } => Some(vendor.to_string()),
                common_sdk_event_bus::AppEvent::AgentActionExecuted { vendor, .. } => vendor.as_ref().map(|v| v.to_string()),
                common_sdk_event_bus::AppEvent::ModelFineTuningJobStarted { vendor, .. } => Some(vendor.to_string()),
                common_sdk_event_bus::AppEvent::ModelEvaluationCompleted { vendor, .. } => Some(vendor.to_string()),
                _ => None,
            }
        });

        let mut record = Self {
            id,
            timestamp,
            actor_id,
            tenant_id,
            action,
            target_id,
            details,
            metadata,
            record_hash: String::new(), // Will be calculated below
            merkle_root_at_ingestion: None,
            merkle_proof_at_ingestion: None,
        };
        record.record_hash = encode(record.calculate_hash());
        record
    }
}

// --- Audit Log Store Trait and Implementation ---

#[async_trait]
pub trait AuditLogStore: Send + Sync + 'static {
    /// Ingests a new audit record.
    async fn ingest_record(&self, record: AuditRecord) -> Result<(), String>;

    /// Queries audit records based on criteria.
    async fn query_records(
        &self,
        actor_id: Option<Uuid>,
        tenant_id: Option<Uuid>,
        action: Option<String>,
        target_id: Option<Uuid>,
        start_time: Option<DateTime<Utc>>,
        end_time: Option<DateTime<Utc>>,
        limit: u32,
        offset: u32,
    ) -> Result<Vec<AuditRecord>, String>;

    /// Retrieves a specific audit record by ID.
    async fn get_record_by_id(&self, id: Uuid) -> Result<Option<AuditRecord>, String>;

    /// Retrieves the current Merkle root.
    async fn get_merkle_root(&self) -> Result<String, String>;

    /// Retrieves the Merkle proof for a specific record.
    async fn get_merkle_proof(&self, record_id: Uuid) -> Result<Option<Vec<String>>, String>;

    /// Flushes pending records to the Merkle tree and updates the root.
    async fn flush_merkle_tree(&self) -> Result<(), String>;
}

/// Implementation of AuditLogStore using SQLite and an in-memory Merkle tree.
pub struct SqliteMerkleAuditLogStore {
    pool: SqlitePool,
    merkle_tree: Arc<Mutex<MerkleTree>>,
    pending_records: Arc<Mutex<Vec<AuditRecord>>>, // Records waiting to be added to Merkle tree
    enable_merkle_tree: bool,
}

impl SqliteMerkleAuditLogStore {
    pub async fn new(database_url: &str, enable_merkle_tree: bool) -> Result<Self, sqlx::Error> {
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(database_url)
            .await?;

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await?;

        let mut store = Self {
            pool,
            merkle_tree: Arc::new(Mutex::new(MerkleTree::new())),
            pending_records: Arc::new(Mutex::new(Vec::new())),
            enable_merkle_tree,
        };

        if enable_merkle_tree {
            // Rebuild Merkle tree from existing records on startup
            info!("Rebuilding Merkle tree from existing audit records...");
            let existing_records = sqlx::query_as::<_, AuditRecord>(
                "SELECT id, timestamp, actor_id, tenant_id, action, target_id, details, metadata, record_hash, merkle_root_at_ingestion, merkle_proof_at_ingestion FROM audit_records ORDER BY timestamp ASC"
            )
            .fetch_all(&store.pool)
            .await?;

            let mut tree = store.merkle_tree.lock().await;
            for record in existing_records {
                let hash_bytes = decode(&record.record_hash)
                    .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
                    .try_into()
                    .map_err(|_| sqlx::Error::Decode(Box::new("Invalid hash length")))?;
                tree.add_leaf(hash_bytes);
            }
            info!("Merkle tree rebuilt. Current root: {}", encode(tree.get_root()));
        }

        Ok(store)
    }
}

#[async_trait]
impl AuditLogStore for SqliteMerkleAuditLogStore {
    async fn ingest_record(&self, mut record: AuditRecord) -> Result<(), String> {
        let record_hash_bytes = decode(&record.record_hash)
            .map_err(|e| format!("Failed to decode record hash: {}", e))?
            .try_into()
            .map_err(|_| "Invalid record hash length".to_string())?;

        if self.enable_merkle_tree {
            let mut pending = self.pending_records.lock().await;
            pending.push(record.clone()); // Clone for pending, original will be inserted
        }

        // Insert into database
        sqlx::query!(
            r#"
            INSERT INTO audit_records (id, timestamp, actor_id, tenant_id, action, target_id, details, metadata, record_hash, merkle_root_at_ingestion, merkle_proof_at_ingestion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            record.id,
            record.timestamp,
            record.actor_id,
            record.tenant_id,
            record.action,
            record.target_id,
            record.details,
            record.metadata,
            record.record_hash,
            record.merkle_root_at_ingestion,
            record.merkle_proof_at_ingestion,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to insert audit record: {}", e))?;

        info!("Audit record ingested: {}", record.id);
        Ok(())
    }

    async fn query_records(
        &self,
        actor_id: Option<Uuid>,
        tenant_id: Option<Uuid>,
        action: Option<String>,
        target_id: Option<Uuid>,
        start_time: Option<DateTime<Utc>>,
        end_time: Option<DateTime<Utc>>,
        limit: u32,
        offset: u32,
    ) -> Result<Vec<AuditRecord>, String> {
        let mut query = "SELECT id, timestamp, actor_id, tenant_id, action, target_id, details, metadata, record_hash, merkle_root_at_ingestion, merkle_proof_at_ingestion FROM audit_records WHERE 1=1".to_string();
        let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send + Sync>> = Vec::new();

        if let Some(actor) = actor_id {
            query.push_str(" AND actor_id = ?");
            params.push(Box::new(actor));
        }
        if let Some(tenant) = tenant_id {
            query.push_str(" AND tenant_id = ?");
            params.push(Box::new(tenant));
        }
        if let Some(act) = action {
            query.push_str(" AND action = ?");
            params.push(Box::new(act));
        }
        if let Some(target) = target_id {
            query.push_str(" AND target_id = ?");
            params.push(Box::new(target));
        }
        if let Some(start) = start_time {
            query.push_str(" AND timestamp >= ?");
            params.push(Box::new(start));
        }
        if let Some(end) = end_time {
            query.push_str(" AND timestamp <= ?");
            params.push(Box::new(end));
        }

        query.push_str(" ORDER BY timestamp DESC LIMIT ? OFFSET ?");
        params.push(Box::new(limit));
        params.push(Box::new(offset));

        let mut q = sqlx::query_as::<_, AuditRecord>(&query);
        for param in params {
            q = q.bind(param);
        }

        q.fetch_all(&self.pool)
            .await
            .map_err(|e| format!("Failed to query audit records: {}", e))
    }

    async fn get_record_by_id(&self, id: Uuid) -> Result<Option<AuditRecord>, String> {
        sqlx::query_as::<_, AuditRecord>(
            "SELECT id, timestamp, actor_id, tenant_id, action, target_id, details, metadata, record_hash, merkle_root_at_ingestion, merkle_proof_at_ingestion FROM audit_records WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| format!("Failed to get record by ID: {}", e))
    }

    async fn get_merkle_root(&self) -> Result<String, String> {
        if !self.enable_merkle_tree {
            return Err("Merkle tree is disabled.".to_string());
        }
        let tree = self.merkle_tree.lock().await;
        Ok(encode(tree.get_root()))
    }

    async fn get_merkle_proof(&self, record_id: Uuid) -> Result<Option<Vec<String>>, String> {
        if !self.enable_merkle_tree {
            return Err("Merkle tree is disabled.".to_string());
        }

        let record = self.get_record_by_id(record_id).await?;
        let record = match record {
            Some(r) => r,
            None => return Ok(None),
        };

        let record_hash_bytes = decode(&record.record_hash)
            .map_err(|e| format!("Failed to decode record hash: {}", e))?
            .try_into()
            .map_err(|_| "Invalid record hash length".to_string())?;

        let tree = self.merkle_tree.lock().await;
        let proof = tree.get_proof(record_hash_bytes);

        Ok(proof.map(|p| p.into_iter().map(encode).collect()))
    }

    async fn flush_merkle_tree(&self) -> Result<(), String> {
        if !self.enable_merkle_tree {
            return Ok(());
        }

        let mut pending = self.pending_records.lock().await;
        if pending.is_empty() {
            return Ok(());
        }

        let mut tree = self.merkle_tree.lock().await;
        let current_root = encode(tree.get_root());

        info!("Flushing {} pending records to Merkle tree...", pending.len());

        let records_to_flush = pending.drain(..).collect::<Vec<_>>();
        let mut updated_records = Vec::new();

        for mut record in records_to_flush {
            let record_hash_bytes = decode(&record.record_hash)
                .map_err(|e| format!("Failed to decode record hash for flush: {}", e))?
                .try_into()
                .map_err(|_| "Invalid record hash length for flush".to_string())?;

            tree.add_leaf(record_hash_bytes);
            let proof = tree.get_proof(record_hash_bytes)
                .ok_or_else(|| format!("Failed to generate Merkle proof for record {}", record.id))?;

            record.merkle_root_at_ingestion = Some(encode(tree.get_root()));
            record.merkle_proof_at_ingestion = Some(serde_json::to_string(&proof.into_iter().map(encode).collect::<Vec<String>>())
                .map_err(|e| format!("Failed to serialize Merkle proof: {}", e))?);
            updated_records.push(record);
        }

        // Update records in DB with their Merkle root and proof
        let mut tx = self.pool.begin().await.map_err(|e| format!("Failed to begin transaction: {}", e))?;
        for record in updated_records {
            sqlx::query!(
                r#"
                UPDATE audit_records
                SET merkle_root_at_ingestion = ?, merkle_proof_at_ingestion = ?
                WHERE id = ?
                "#,
                record.merkle_root_at_ingestion,
                record.merkle_proof_at_ingestion,
                record.id,
            )
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to update record with Merkle info: {}", e))?;
        }
        tx.commit().await.map_err(|e| format!("Failed to commit transaction: {}", e))?;

        info!("Merkle tree flushed. New root: {}", encode(tree.get_root()));
        Ok(())
    }
}

// --- API Request/Response Models ---

#[derive(Debug, Serialize, Deserialize)]
pub struct IngestRecordRequest {
    pub actor_id: Uuid,
    pub tenant_id: Uuid,
    pub action: String,
    pub target_id: Option<Uuid>,
    pub details: serde_json::Value,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IngestRecordResponse {
    pub id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub record_hash: String,
    pub merkle_root_at_ingestion: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryRecordsRequest {
    pub actor_id: Option<Uuid>,
    pub tenant_id: Option<Uuid>,
    pub action: Option<String>,
    pub target_id: Option<Uuid>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    #[serde(default = "default_limit")]
    pub limit: u32,
    #[serde(default)]
    pub offset: u32,
}

fn default_limit() -> u32 {
    100
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryRecordsResponse {
    pub records: Vec<AuditRecord>,
    pub total: u32, // In a real app, this would be a separate count query
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MerkleProofResponse {
    pub record_id: Uuid,
    pub record_hash: String,
    pub merkle_root: String,
    pub proof: Vec<String>,
    pub verified: bool,
}

// --- API Handlers ---

/// Helper function to extract JWT claims from request headers.
async fn get_claims_from_request(
    req: &actix_web::HttpRequest,
    auth_service: &Arc<dyn common_sdk_auth::AuthService>,
) -> Result<common_sdk_auth::Claims, actix_web::Error> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| actix_web::error::ErrorUnauthorized("Authorization header missing"))?;

    if !auth_header.starts_with("Bearer ") {
        return Err(actix_web::error::ErrorUnauthorized(
            "Invalid Authorization header format",
        ));
    }
    let token = auth_header.trim_start_matches("Bearer ");

    auth_service
        .validate_token(token)
        .await
        .map_err(|e| actix_web::error::ErrorUnauthorized(format!("Invalid token: {}", e)))
}

/// Ingests a new audit record.
async fn ingest_record(
    req: actix_web::HttpRequest,
    body: web::Json<IngestRecordRequest>,
    store: web::Data<Arc<dyn AuditLogStore>>,
    auth_service: web::Data<Arc<dyn common_sdk_auth::AuthService>>,
) -> impl Responder {
    let claims = match get_claims_from_request(&req, &auth_service).await {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    // Basic authorization: only allow if user has 'auditor' or 'admin' role
    if !claims.roles.contains(&"auditor".to_string()) && !claims.roles.contains(&"admin".to_string()) {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Insufficient permissions"}));
    }

    let mut record = AuditRecord {
        id: Uuid::new_v4(),
        timestamp: Utc::now(),
        actor_id: body.actor_id,
        tenant_id: body.tenant_id,
        action: body.action.clone(),
        target_id: body.target_id,
        details: body.details.clone(),
        metadata: body.metadata.clone(),
        record_hash: String::new(),
        merkle_root_at_ingestion: None,
        merkle_proof_at_ingestion: None,
    };
    record.record_hash = encode(record.calculate_hash());

    match store.ingest_record(record.clone()).await {
        Ok(_) => HttpResponse::Ok().json(IngestRecordResponse {
            id: record.id,
            timestamp: record.timestamp,
            record_hash: record.record_hash,
            merkle_root_at_ingestion: record.merkle_root_at_ingestion,
        }),
        Err(e) => {
            error!("Failed to ingest record: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e}))
        }
    }
}

/// Queries audit records.
async fn query_records(
    req: actix_web::HttpRequest,
    query: web::Query<QueryRecordsRequest>,
    store: web::Data<Arc<dyn AuditLogStore>>,
    auth_service: web::Data<Arc<dyn common_sdk_auth::AuthService>>,
) -> impl Responder {
    let claims = match get_claims_from_request(&req, &auth_service).await {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    // Basic authorization: only allow if user has 'auditor' or 'admin' role
    if !claims.roles.contains(&"auditor".to_string()) && !claims.roles.contains(&"admin".to_string()) {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Insufficient permissions"}));
    }

    // Enforce tenant isolation: a user can only query records for their tenant
    let tenant_id_filter = query.tenant_id.unwrap_or(claims.tenant_id);
    if tenant_id_filter != claims.tenant_id {
        warn!("Attempted cross-tenant query by user {} for tenant {}", claims.sub, tenant_id_filter);
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Cannot query records for other tenants"}));
    }

    match store
        .query_records(
            query.actor_id,
            Some(tenant_id_filter), // Always filter by the user's tenant
            query.action.clone(),
            query.target_id,
            query.start_time,
            query.end_time,
            query.limit,
            query.offset,
        )
        .await
    {
        Ok(records) => HttpResponse::Ok().json(QueryRecordsResponse {
            total: records.len() as u32, // This is not a true total count, just for the current page
            records,
        }),
        Err(e) => {
            error!("Failed to query records: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e}))
        }
    }
}

/// Retrieves the current Merkle root.
async fn get_merkle_root(
    req: actix_web::HttpRequest,
    store: web::Data<Arc<dyn AuditLogStore>>,
    auth_service: web::Data<Arc<dyn common_sdk_auth::AuthService>>,
) -> impl Responder {
    let claims = match get_claims_from_request(&req, &auth_service).await {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    if !claims.roles.contains(&"auditor".to_string()) && !claims.roles.contains(&"admin".to_string()) {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Insufficient permissions"}));
    }

    match store.get_merkle_root().await {
        Ok(root) => HttpResponse::Ok().json(serde_json::json!({"merkle_root": root})),
        Err(e) => {
            error!("Failed to get Merkle root: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e}))
        }
    }
}

/// Retrieves the Merkle proof for a specific record.
async fn get_merkle_proof(
    req: actix_web::HttpRequest,
    path: web::Path<Uuid>,
    store: web::Data<Arc<dyn AuditLogStore>>,
    auth_service: web::Data<Arc<dyn common_sdk_auth::AuthService>>,
) -> impl Responder {
    let claims = match get_claims_from_request(&req, &auth_service).await {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    if !claims.roles.contains(&"auditor".to_string()) && !claims.roles.contains(&"admin".to_string()) {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Insufficient permissions"}));
    }

    let record_id = path.into_inner();

    let record = match store.get_record_by_id(record_id).await {
        Ok(Some(r)) => r,
        Ok(None) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Record not found"})),
        Err(e) => {
            error!("Failed to retrieve record for proof: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({"error": e}));
        }
    };

    // Enforce tenant isolation for proof retrieval
    if record.tenant_id != claims.tenant_id {
        warn!("Attempted cross-tenant proof retrieval by user {} for record {}", claims.sub, record_id);
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Cannot retrieve proof for records of other tenants"}));
    }

    let current_merkle_root = match store.get_merkle_root().await {
        Ok(root) => root,
        Err(e) => {
            error!("Failed to get current Merkle root for proof verification: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({"error": e}));
        }
    };

    let proof_result = store.get_merkle_proof(record_id).await;

    match proof_result {
        Ok(Some(proof_hashes)) => {
            let record_hash_bytes = match decode(&record.record_hash) {
                Ok(h) => h,
                Err(e) => {
                    error!("Failed to decode record hash for verification: {}", e);
                    return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal hash error"}));
                }
            };
            let record_hash_bytes: Hash = match record_hash_bytes.try_into() {
                Ok(h) => h,
                Err(_) => {
                    error!("Invalid record hash length for verification: {}", record.record_hash);
                    return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal hash error"}));
                }
            };

            let proof_bytes: Result<Vec<Hash>, _> = proof_hashes
                .iter()
                .map(|h_str| decode(h_str).map(|h_vec| h_vec.try_into().map_err(|_| "Invalid hash length")).transpose())
                .collect::<Result<Result<Vec<Hash>, &str>, _>>()
                .map_err(|e| {
                    error!("Failed to decode proof hash: {:?}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal proof hash error"}))
                })?
                .map_err(|e| {
                    error!("Invalid proof hash length: {}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal proof hash error"}))
                })?;

            let current_root_bytes = match decode(&current_merkle_root) {
                Ok(h) => h,
                Err(e) => {
                    error!("Failed to decode current Merkle root for verification: {}", e);
                    return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal root hash error"}));
                }
            };
            let current_root_bytes: Hash = match current_root_bytes.try_into() {
                Ok(h) => h,
                Err(_) => {
                    error!("Invalid current Merkle root length: {}", current_merkle_root);
                    return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal root hash error"}));
                }
            };

            let verified = MerkleTree::verify_proof(record_hash_bytes, &proof_bytes, current_root_bytes);

            HttpResponse::Ok().json(MerkleProofResponse {
                record_id,
                record_hash: record.record_hash,
                merkle_root: current_merkle_root,
                proof: proof_hashes,
                verified,
            })
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Merkle proof not found for record"})),
        Err(e) => {
            error!("Failed to get Merkle proof: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": e}))
        }
    }
}

// --- Agent Mode Endpoints ---

#[derive(Serialize)]
struct AgentMetadata {
    purpose: String,
    dependencies: HashMap<String, String>,
    invalidation_conditions: Vec<String>,
    adjacent_apps: Vec<String>,
}

async fn introspect() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "service_name": "APP_15_Governance_AuditTrailEngine",
        "version": env!("CARGO_PKG_VERSION"),
        "description": "A tamper-evident audit log service using Merkle trees.",
        "endpoints": [
            {"path": "/audit/record", "method": "POST", "description": "Ingest a new audit record."},
            {"path": "/audit/query", "method": "GET", "description": "Query audit records."},
            {"path": "/audit/root", "method": "GET", "description": "Get the current Merkle root."},
            {"path": "/audit/record/{id}/proof", "method": "GET", "description": "Get Merkle proof for a record."},
            {"path": "/introspect", "method": "GET", "description": "Get service metadata."},
            {"path": "/assumptions", "method": "GET", "description": "Get service assumptions."},
            {"path": "/failure-modes", "method": "GET", "description": "Get potential failure modes."},
            {"path": "/update-triggers", "method": "GET", "description": "Get conditions that trigger updates."},
        ],
        "data_contracts": {
            "AuditRecord": "JSON schema for audit records",
            "IngestRecordRequest": "JSON schema for ingestion requests",
            "QueryRecordsRequest": "JSON schema for query requests",
            "MerkleProofResponse": "JSON schema for Merkle proof responses",
            "AppEvent": "JSON schema for common_sdk_event_bus::AppEvent"
        },
        "extensibility_hooks": [
            "AuditLogStore trait for pluggable storage backends (e.g., PostgreSQL, S3)",
            "EventBusConsumer trait for different message brokers (e.g., Kafka, NATS)",
            "AuthService trait for different authentication providers (e.g., OAuth, API Key)",
            "MerkleTree implementation can be swapped for more advanced cryptographic structures."
        ],
        "monetization_capabilities": [
            "Compliance-as-a-Service: Offer tamper-evident logging for regulatory requirements.",
            "Security Auditing: Provide immutable logs for incident response and forensic analysis.",
            "AI Explainability: Trace AI model decisions and agent actions with verifiable logs.",
            "Data Governance: Ensure data lineage and access control logging.",
            "Enterprise Tier: Higher throughput, longer retention, advanced query features, multi-region deployment."
        ],
        "tension_points": {
            "cost_vs_quality": "Storing full, immutable audit trails with cryptographic proofs is resource-intensive (compute for hashing, storage for proofs). Balancing granularity and retention with infrastructure costs is key.",
            "speed_vs_safety": "Real-time ingestion of events vs. the latency introduced by cryptographic hashing and Merkle tree updates. Design prioritizes safety/integrity over absolute lowest latency for non-critical audit events.",
            "openness_vs_control": "Providing flexible query APIs vs. strict access controls and data isolation for sensitive audit data. Tenant isolation and role-based access are critical controls.",
            "scale_vs_explainability": "Handling high-volume event streams while maintaining the ability to generate detailed, verifiable proofs for individual records. Merkle tree batching helps balance this."
        }
    }))
}

async fn assumptions() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "assumptions": [
            "The common_sdk_auth::AuthService provides robust and secure authentication.",
            "The common_sdk_event_bus::AppEvent covers all relevant events for auditing.",
            "The underlying database (SQLite in this example) is reliable and performant for the expected load.",
            "System clocks are synchronized for accurate timestamping of audit records.",
            "The `jwt_secret` is securely managed and not exposed.",
            "Network connectivity between services and the database is stable.",
            "The volume of audit events allows for periodic Merkle tree flushing without excessive backlog or performance degradation.",
            "Tenant IDs and User IDs are consistently used across the ecosystem for proper isolation and attribution."
        ]
    }))
}

async fn failure_modes() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "failure_modes": [
            "Database connection failure: Prevents record ingestion and querying.",
            "Merkle tree corruption: If the in-memory tree state is lost or corrupted, proofs cannot be generated correctly until rebuilt from DB.",
            "High event volume: Can overwhelm the ingestion pipeline, leading to backlogs or dropped events if not scaled.",
            "Authentication service outage: Prevents all API access.",
            "Disk space exhaustion: Database or log files fill up, stopping the service.",
            "Hash collision: While extremely unlikely with SHA256, a collision would compromise tamper-evidence.",
            "Clock skew: Inaccurate timestamps can lead to incorrect audit trails or query results.",
            "Denial-of-Service (DoS) attacks: Maliciously high ingestion rates could exhaust resources.",
            "Data tampering (internal): If the database itself is compromised without detection, the Merkle tree would eventually detect it upon rebuild or verification, but immediate records might be affected before flushing.",
            "Incorrect Merkle proof generation: Bugs in the Merkle tree logic could lead to invalid proofs, undermining trust."
        ]
    }))
}

async fn update_triggers() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "update_triggers": [
            "New AI vendor integrations: May require new event types or metadata fields in AuditRecord.",
            "Changes in compliance regulations: Could necessitate new data retention policies, query capabilities, or proof formats.",
            "Security vulnerabilities: Requires immediate patching and potential audit of past logs.",
            "Performance bottlenecks: High latency or resource usage during ingestion or querying.",
            "New common_sdk_event_bus::AppEvent types: Requires updates to `AuditRecord::from_app_event`.",
            "Database schema changes: Requires migration scripts and application updates.",
            "Authentication protocol changes: Updates to common_sdk_auth::AuthService integration.",
            "Feedback from auditors/compliance officers: Requests for new features or adjustments to existing ones.",
            "Merkle tree algorithm improvements or cryptographic standard updates."
        ]
    }))
}

// --- Main Application ---

/// Machine-readable metadata for agent introspection.
const AGENT_METADATA: &str = r#"
agent_metadata:
  purpose: "Provides a tamper-evident, immutable audit trail for all critical operations and AI interactions across the ecosystem, ensuring compliance, security, and explainability."
  dependencies:
    - "common_sdk_auth: Authentication and authorization for API access."
    - "common_sdk_event_bus: Source of all events to be audited."
    - "SQL database (e.g., SQLite, PostgreSQL): Persistent storage for audit records."
    - "Operating system time synchronization: For accurate timestamps."
  invalidation_conditions:
    - "Compromise of the database integrity without detection by Merkle tree."
    - "Failure of the Merkle tree hashing algorithm (e.g., SHA256 vulnerability)."
    - "Loss of the Merkle tree root history (if externalized)."
    - "Significant changes in regulatory compliance requirements that cannot be met by current data model."
  adjacent_apps:
    - "APP_01_Inference_CostRouter: Logs inference requests and costs."
    - "APP_14_Agents_MultiModelOrchestrator: Logs agent actions and tool calls."
    - "APP_37_Governance_PolicyEnforcement: Logs policy enforcement decisions."
    - "APP_42_Evaluation_BenchmarkingService: Logs evaluation runs and results."
    - "APP_58_Narrative_ModelExplainabilityUI: Consumes audit logs to explain model behavior."
    - "APP_63_Compliance_DataRetentionManager: Interacts for data lifecycle management."
    - "APP_70_Developer_ObservabilityDashboard: Visualizes audit trails."
"#;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logging
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    info!("Starting APP_15_Governance_AuditTrailEngine...");

    // Load configuration
    let config = match AppConfig::load() {
        Ok(cfg) => {
            info!("Configuration loaded successfully.");
            cfg
        }
        Err(e) => {
            error!("Failed to load configuration: {}", e);
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                "Failed to load configuration",
            ));
        }
    };

    // Set log level from config
    std::env::set_var("RUST_LOG", &config.log_level);
    env_logger::init_from_env(env_logger::Env::new().default_filter_or(&config.log_level));

    // Initialize Auth Service
    let auth_service: Arc<dyn common_sdk_auth::AuthService> = if config.enable_mock_auth {
        info!("Using MockAuthService.");
        Arc::new(common_sdk_auth::MockAuthService)
    } else {
        info!("Using JwtAuthService.");
        Arc::new(common_sdk_auth::JwtAuthService::new(config.jwt_secret.clone()))
    };

    // Initialize Audit Log Store
    let audit_store = match SqliteMerkleAuditLogStore::new(&config.database_url, config.enable_merkle_tree).await {
        Ok(store) => {
            info!("Audit log store initialized successfully.");
            Arc::new(store)
        }
        Err(e) => {
            error!("Failed to initialize audit log store: {}", e);
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                "Failed to initialize audit log store",
            ));
        }
    };

    // Initialize Event Bus Consumer
    let (event_tx, mut event_rx) = mpsc::channel::<common_sdk_event_bus::AppEvent>(1000); // Channel for internal event processing
    let event_bus_consumer: Arc<dyn common_sdk_event_bus::EventBusConsumer> = if config.enable_mock_event_bus {
        info!("Using MockEventBusConsumer.");
        Arc::new(common_sdk_event_bus::MockEventBusConsumer::new(event_tx.clone()))
    } else {
        // In a real scenario, this would be a concrete implementation connecting to Kafka/NATS
        // For now, we'll use the mock even if not explicitly enabled, to keep the flow.
        // A production setup would have a different branch here.
        warn!("Production EventBusConsumer not implemented. Falling back to MockEventBusConsumer.");
        Arc::new(common_sdk_event_bus::MockEventBusConsumer::new(event_tx.clone()))
    };

    // Spawn a task to consume events from the bus and ingest them
    let audit_store_clone = audit_store.clone();
    tokio::spawn(async move {
        info!("Event bus consumer task started.");
        while let Some(event) = event_rx.recv().await {
            let record = AuditRecord::from_app_event(event.clone());
            if let Err(e) = audit_store_clone.ingest_record(record).await {
                error!("Failed to ingest event from bus ({}): {}", event.event_type(), e);
            } else {
                info!("Ingested event from bus: {}", event.event_type());
            }
        }
        info!("Event bus consumer task stopped.");
    });

    // Spawn a task to periodically flush the Merkle tree
    if config.enable_merkle_tree {
        let audit_store_clone = audit_store.clone();
        let flush_interval = config.merkle_tree_flush_interval_seconds;
        tokio::spawn(async move {
            info!("Merkle tree flush task started with interval {} seconds.", flush_interval);
            let mut interval = tokio::time::interval(Duration::from_secs(flush_interval));
            interval.tick().await; // Initial tick to avoid immediate flush
            loop {
                interval.tick().await;
                if let Err(e) = audit_store_clone.flush_merkle_tree().await {
                    error!("Failed to flush Merkle tree: {}", e);
                }
            }
        });
    } else {
        info!("Merkle tree is disabled. No periodic flushing will occur.");
    }

    // Start the HTTP server
    info!("Starting HTTP server at: {}", config.server_address);
    HttpServer::new(move || {
        App::new()
            .app_data(Data::new(audit_store.clone()))
            .app_data(Data::new(auth_service.clone()))
            // Audit API routes
            .service(web::resource("/audit/record").route(web::post().to(ingest_record)))
            .service(web::resource("/audit/query").route(web::get().to(query_records)))
            .service(web::resource("/audit/root").route(web::get().to(get_merkle_root)))
            .service(web::resource("/audit/record/{id}/proof").route(web::get().to(get_merkle_proof)))
            // Agent Mode routes
            .service(web::resource("/introspect").route(web::get().to(introspect)))
            .service(web::resource("/assumptions").route(web::get().to(assumptions)))
            .service(web::resource("/failure-modes").route(web::get().to(failure_modes)))
            .service(web::resource("/update-triggers").route(web::get().to(update_triggers)))
    })
    .bind(&config.server_address)?
    .run()
    .await
}

// --- Database Migrations (Embedded for single file, normally in `migrations/`) ---
// This is a simplified representation. In a real project, `sqlx-cli` would manage these.
// For this file, we'll define them as a macro.
#[macro_export]
macro_rules! migrations {
    () => {
        sqlx::migrate!("./migrations")
    };
}

// The `migrations` directory would contain files like:
// `migrations/20230101000000_create_audit_records_table.sql`
// ```sql
// CREATE TABLE IF NOT EXISTS audit_records (
//     id TEXT PRIMARY KEY NOT NULL,
//     timestamp TEXT NOT NULL,
//     actor_id TEXT NOT NULL,
//     tenant_id TEXT NOT NULL,
//     action TEXT NOT NULL,
//     target_id TEXT,
//     details JSON NOT NULL,
//     metadata JSON NOT NULL,
//     record_hash TEXT NOT NULL,
//     merkle_root_at_ingestion TEXT,
//     merkle_proof_at_ingestion JSON
// );
// CREATE INDEX IF NOT EXISTS idx_audit_records_timestamp ON audit_records (timestamp);
// CREATE INDEX IF NOT EXISTS idx_audit_records_actor_id ON audit_records (actor_id);
// CREATE INDEX IF NOT EXISTS idx_audit_records_tenant_id ON audit_records (tenant_id);
// CREATE INDEX IF NOT EXISTS idx_audit_records_action ON audit_records (action);
// ```