/**
 * @file Generates various types of unique identifiers (UUID, KSUID, etc.).
 * @module packages/shared-kernel/src/utils/idGenerator
 *
 * @description
 * This module provides a centralized and extensible utility for generating different
 * kinds of unique identifiers required throughout the application. It abstracts
 * the underlying libraries and provides a consistent interface.
 *
 * To use this module, ensure you have the required dependencies installed:
 * npm install ksuid nanoid @paralleldrive/cuid2
 * or
 * yarn add ksuid nanoid @paralleldrive/cuid2
 */

import { randomUUID } from 'crypto';
import KSUID from 'ksuid';
import { nanoid as nanoIdGenerator } from 'nanoid';
import { createId as createCuid2 } from '@paralleldrive/cuid2';

/**
 * A type representing a branded string for a specific ID type.
 * This helps in preventing accidental mixing of different ID types at compile time.
 * @template T - A string literal type to brand the string.
 */
export type BrandedId<T extends string> = string & { readonly __brand: T };

export type UUID = BrandedId<'UUID'>;
export type KSUID = BrandedId<'KSUID'>;
export type NanoId = BrandedId<'NanoId'>;
export type Cuid2 = BrandedId<'Cuid2'>;

/**
 * A collection of utility functions for generating various types of unique identifiers.
 * This generator is designed to be extensible to support new ID formats in the future.
 */
export const IdGenerator = {
  /**
   * Generates a standard v4 UUID (Universally Unique Identifier).
   * UUIDs are 128-bit numbers, typically represented as 36-character hexadecimal strings.
   * They are globally unique but are not sortable by time. Best for ensuring uniqueness
   * across distributed systems where sortability is not a concern.
   *
   * @returns {UUID} A new v4 UUID string.
   * @example
   * // "123e4567-e89b-12d3-a456-426614174000"
   */
  uuidV4(): UUID {
    return randomUUID() as UUID;
  },

  /**
   * Generates a K-Sortable Unique Identifier (KSUID).
   * KSUIDs are 27 characters long and are sortable by the time they were created.
   * They combine a 32-bit timestamp with a 128-bit random payload, encoded in Base62.
   * This makes them excellent for use as database primary keys, as they prevent index
   * fragmentation and are more efficient than UUIDs for indexed lookups.
   *
   * @returns {Promise<KSUID>} A promise that resolves to a new KSUID string.
   * @example
   * // "2nPiX2jHnS4v2s8d6Z3b1v9a1"
   */
  async ksuid(): Promise<KSUID> {
    const id = await KSUID.random();
    return id.string as KSUID;
  },

  /**
   * Generates a NanoID.
   * NanoIDs are URL-friendly, compact, and fast. The default size is 21 characters,
   * providing a similar collision resistance to UUID v4.
   * They are ideal for public-facing identifiers like shareable links or short codes.
   *
   * @param {number} [size=21] - The desired length of the ID.
   * @returns {NanoId} A new NanoID string.
   * @example
   * // "V1StGXR8_Z5jdHi6B-myT"
   */
  nanoid(size?: number): NanoId {
    return nanoIdGenerator(size) as NanoId;
  },

  /**
   * Generates a CUID2 (Collision-Resistant Unique ID, version 2).
   * CUID2 is a modern, secure, and collision-resistant ID optimized for web applications
   * and horizontal scaling. It is not time-sortable.
   * It includes a session fingerprint, a sequence counter, and a large random value,
   * making it highly resistant to collisions even in high-frequency generation scenarios.
   *
   * @returns {Cuid2} A new CUID2 string.
   * @example
   * // "tz4a98xxat96iws9zmbrgj3a"
   */
  cuid2(): Cuid2 {
    return createCuid2() as Cuid2;
  },
};

/**
 * A factory function to create a specific type of ID generator.
 * This can be useful for dependency injection or when a specific ID strategy
 * is chosen for a particular domain or service.
 *
 * @template T - The type of ID to generate ('uuidV4', 'ksuid', 'nanoid', 'cuid2').
 * @param {T} type - The type of ID generator to create.
 * @returns {typeof IdGenerator[T]} A function that generates the specified ID type.
 * @example
 * const userNanoIdGenerator = createIdGenerator('nanoid');
 * const newUserId = userNanoIdGenerator(10); // Custom size
 *
 * const eventKsuidGenerator = createIdGenerator('ksuid');
 * const newEventId = await eventKsuidGenerator();
 */
export function createIdGenerator<T extends keyof typeof IdGenerator>(
  type: T
): typeof IdGenerator[T] {
  return IdGenerator[type];
}