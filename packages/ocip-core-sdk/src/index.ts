/*
 * Copyright 2024 O'Callaghan Capital Intelligence Platform (OCIP)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview
 * O'Callaghan Capital Intelligence Platform (OCIP) Core SDK
 *
 * This is the main entry point for the OCIP Core SDK. It exports all the shared
 * primitives, clients, contracts, and utilities that form the foundation of the
 * OCIP application ecosystem. All 75 applications in the ecosystem are built
 * upon this SDK to ensure consistency, interoperability, and security.
 *
 * @module @ocip/core-sdk
 */

// ============================================================================
// CORE & CONFIGURATION
// ============================================================================
// Provides fundamental building blocks, environment configuration, and
// lifecycle management for all OCIP applications.
// ============================================================================

export * from './config/env';
export * from './config/featureFlags';
export * from './core/application';
export * from './core/types';

// ============================================================================
// AUTHENTICATION & IDENTITY
// ============================================================================
// A unified authentication and authorization model based on JWTs and a
// capability-based permission system. Enforces zero-trust principles across
// the entire application suite.
// ============================================================================

export * from './auth/client';
export * from './auth/middleware';
export * from './auth/token';
export * from './auth/identity';
export * from './auth/policy';
export * from './auth/types';

// ============================================================================
// CONTRACTS & ONTOLOGY (DATA MODEL)
// ============================================================================
// The unified ontology for the OCIP ecosystem. These typed data contracts
// ensure data consistency and interoperability between all services.
// Schemas are provided for runtime validation.
// ============================================================================

// --- Core Concepts ---
export * from './contracts/core/ocipObject';
export * from './contracts/core/pagination';
export * from './contracts/core/tags';
export * from './contracts/core/audit';

// --- AI Primitives ---
export * from './contracts/ai/provider';
export * from './contracts/ai/model';
export * from './contracts/ai/inference';
export * from './contracts/ai/embedding';
export * from './contracts/ai/tool';
export * from './contracts/ai/agent';
export * from './contracts/ai/prompt';
export * from './contracts/ai/dataset';
export * from './contracts/ai/fineTuning';

// --- Infrastructure & Billing ---
export * from './contracts/infra/compute';
export * from './contracts/infra/storage';
export * from './contracts/billing/cost';
export * from './contracts/billing/invoice';
export * from './contracts/billing/usage';

// --- Governance & Compliance ---
export * from './contracts/governance/policy';
export * from './contracts/governance/auditTrail';
export * from './contracts/governance/jurisdiction';

// --- Workflow & Orchestration ---
export * from './contracts/workflow/job';
export * from './contracts/workflow/pipeline';
export * from './contracts/workflow/trigger';

// ============================================================================
// COMMUNICATION & EVENTS
// ============================================================================
// A typed, asynchronous event bus for inter-service communication. It forms
// the backbone of the reactive and decoupled architecture of the platform.
// ============================================================================

export * from './events/busClient';
export * from './events/message';
export * from './events/topics';
export * from './events/schemas';

// ============================================================================
// CLIENTS & ADAPTERS
// ============================================================================
// Standardized clients for interacting with other OCIP services and abstracted
// adapters for third-party AI providers. This layer prevents vendor lock-in
// and provides a consistent interface for common AI capabilities.
// ============================================================================

export * from './clients/ocip/baseClient';
export * from './clients/ocip/serviceRegistry';
export * from './clients/ai/providerFactory';
export * from './clients/ai/adapters/baseAdapter';
export * from './clients/ai/types';

// ============================================================================
// INSTRUMENTATION & OBSERVABILITY
// ============================================================================
// Production-grade logging, metrics, and tracing, conforming to OpenTelemetry
// standards. Provides deep visibility into application performance, cost,
// and behavior.
// ============================================================================

export * from './instrumentation/logger';
export * from './instrumentation/metrics';
export * from './instrumentation/tracing';
export * from './instrumentation/context';

// ============================================================================
// ERROR HANDLING
// ============================================================================
// A structured set of custom error classes to ensure consistent and
// machine-readable error reporting across all applications.
// ============================================================================

export * from './errors/baseError';
export * from './errors/httpErrors';
export * from './errors/validationError';
export * from './errors/authError';
export * from './errors/providerError';

// ============================================================================
// MIDDLEWARE (HTTP)
// ============================================================================
// A collection of pluggable middleware for standardizing request handling
// in HTTP-based services (e.g., using Express or Fastify).
// ============================================================================

export * from './middleware/requestLogger';
export * from './middleware/errorHandler';
export * from './middleware/authGuard';
export * from './middleware/rateLimiter';
export * from './middleware/contextInjector';
export * from './middleware/versioning';

// ============================================================================
// INTROSPECTION & SELF-QUERYING
// ============================================================================
// Components to support the mandatory self-querying agent mode. Enables
// any application to expose its purpose, dependencies, and failure modes
// in a machine-readable format.
// ============================================================================

export * from './introspection/metadata';
export * from './introspection/handler';
export * from './introspection/types';

// ============================================================================
// STORAGE ABSTRACTIONS
// ============================================================================
// Abstracted interfaces for common storage patterns, such as key-value stores,
// object storage, and vector databases. Allows for swapping underlying
// storage providers without changing application logic.
// ============================================================================

export * from './storage/keyValueStore';
export * from './storage/objectStore';
export * from './storage/vectorStore';
export * from './storage/sqlDatabase';

// ============================================================================
// UTILITIES
// ============================================================================
// A collection of general-purpose helper functions and classes used
// throughout the OCIP ecosystem.
// ============================================================================

export * from './utils/idGenerator';
export * from './utils/retry';
export * from './utils/schemaValidator';
export * from './utils/async';
export * from './utils/crypto';
export * from './utils/deepMerge';

// ============================================================================
// EXTENSIBILITY & PLUGINS
// ============================================================================
// Defines the core interfaces for the OCIP plugin system, allowing
// applications to be extended with new functionality in a standardized and
// secure manner.
// ============================================================================

export * from './plugins/pluginManager';
export * from './plugins/plugin';
export * from './plugins/hooks';