/**
 * @fileoverview Main export file for the Core Universal SDK.
 * This file serves as the public API entry point for the entire ecosystem.
 * It aggregates and re-exports all shared modules, types, and utilities
 * that form the foundation of the 75-application suite.
 *
 * @license Apache-2.0
 * @version 1.0.0
 * @see README.md for detailed usage and architecture.
 *
 * This SDK provides the common language and tools for all applications, ensuring
 * consistency, interoperability, and operational rigor.
 */

// --- Core Infrastructure ---

/**
 * Standardized logging interface and implementation.
 * Provides structured, level-based logging with context propagation.
 * All applications MUST use this logger for operational visibility.
 * @module logging
 */
export * from './logging/logger';
export * from './logging/types';

/**
 * Hierarchical configuration management.
 * Loads configuration from environment variables, files, and a central
 * configuration service, providing a unified view of application settings.
 * @module config
 */
export * from './config/loader';
export * from './config/types';

/**
 * Standardized error handling framework.
 * Includes base error classes, an error factory, and type definitions for consistent
 * error reporting and handling across all applications. This is crucial for
 * building reliable distributed systems.
 * @module errors
 */
export * from './errors/base';
export * from './errors/factory';
export * from './errors/types';


// --- Communication & Integration ---

/**
 * Base API client for making HTTP requests.
 * Includes built-in support for retries, timeouts, middleware, and authentication.
 * This should be the foundation for all inter-service communication.
 * @module api
 */
export * from './api/client';
export * from './api/types';
export * from './api/middleware';

/**
 * Shared authentication and identity model.
 * Provides clients and token providers for interacting with the central identity service.
 * This ensures a single, secure source of truth for identity and access control.
 * @module auth
 */
export * from './auth/client';
export * from './auth/types';
export * from './auth/tokenProvider';

/**
 * Typed event bus client and protocol definitions.
 * Enables asynchronous, decoupled communication between applications using a
 * strongly-typed, versioned message protocol.
 * @module events
 */
export * from './events/client';
export * from './events/types';
export * from './events/protocol';


// --- Data Model & Ontology ---

/**
 * The unified ontology of core concepts.
 * Defines the fundamental data structures, enumerations, and identifiers used
 * across the ecosystem. This is the semantic glue of the platform.
 * @module ontology
 */
export * from './ontology/core';
export * from './ontology/identifiers';
export * from './ontology/resource';
export * from './ontology/meta';
export * from './ontology/versioning';


// --- Utilities & Helpers ---

/**
 * Common utility functions.
 * Includes robust retry logic, secure UUID generation, feature flagging,
 * and other essential helpers to avoid reimplementing common patterns.
 * @module utils
 */
export * from './utils/retry';
export * from './utils/uuid';
export * from './utils/featureFlags';
export * from './utils/time';
export * from './utils/validation';
export * from './utils/pagination';


// --- Execution Context ---

/**
 * Request context management for tracking and propagation.
 * Ensures that request-scoped data (like trace IDs, user info, tenancy) is
 * available throughout the call stack, even across asynchronous boundaries.
 * @module context
 */
export * from './context/requestContext';
export * from './context/types';


// --- Core Abstractions ---

/**
 * Base interfaces for extensible components like plugins and adapters.
 * These define the contracts for building modular and replaceable components,
 * preventing vendor lock-in and promoting a flexible architecture.
 * @module abstractions
 */
export * from './abstractions/plugin';
export * from './abstractions/adapter';
export * from './abstractions/service';
export * from './abstractions/repository';

/**
 * Constants used throughout the ecosystem.
 * Centralizes key values like header names, event types, and system identifiers.
 * @module constants
 */
export * from './constants';

/**
 * Health check and introspection primitives.
 * Provides standardized mechanisms for services to report their health,
 * dependencies, and operational status, enabling self-querying capabilities.
 * @module health
 */
export * from './health/types';
export * from './health/checker';