/**
 * @fileoverview
 * This is the main entry point for the shared-kernel package.
 * It aggregates and exports all the public-facing modules, providing a single,
 * consistent interface for other packages to consume the shared functionalities.
 *
 * The shared kernel contains cross-cutting concerns and core domain concepts
 * that are common across different bounded contexts of the application.
 *
 * @see https://martinfowler.com/bliki/SharedKernel.html
 * @see https://docs.nestjs.com/fundamentals/modules#sharing-modules
 */

// --- Application Layer ---
// Exports core application-level constructs like Commands, Queries, and Results.
// These are used to define the application's use cases and interactions.
export * from './application';

// --- Domain Layer ---
// Exports fundamental domain-driven design (DDD) building blocks.
// This includes base classes and interfaces for Entities, Value Objects,
// Aggregate Roots, and Domain Events.
export * from './domain';

// --- Common Errors ---
// Exports custom error classes that represent specific failure scenarios
// within the application and domain layers, allowing for consistent error handling.
export * from './errors';

// --- Infrastructure Abstractions (Ports) ---
// Exports interfaces for infrastructure concerns, such as repositories, loggers,
// and message brokers. This follows the Dependency Inversion Principle,
// allowing concrete implementations to be swapped out.
export * from './infrastructure';

// --- Core Types ---
// Exports common, reusable type definitions and type utilities, such as
// branded types, Maybe/Optional types, and other foundational type helpers.
export * from './types';

// --- Utilities ---
// Exports a collection of general-purpose utility functions and constants
// that don't fit into the other categories but are widely used.
export * from './utils';