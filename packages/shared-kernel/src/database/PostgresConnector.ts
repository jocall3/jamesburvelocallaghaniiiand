/**
 * @file packages/shared-kernel/src/database/PostgresConnector.ts
 * @description A robust, singleton connection manager for PostgreSQL databases using `pg`.
 * It provides connection pooling, query execution, and safe transaction management.
 */

import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';

/**
 * Configuration options for the PostgreSQL connection pool.
 * This is an alias for the `PoolConfig` from the `pg` library.
 *
 * @example
 * const config: PostgresConfig = {
 *   user: process.env.DB_USER,
 *   host: process.env.DB_HOST,
 *   database: process.env.DB_NAME,
 *   password: process.env.DB_PASSWORD,
 *   port: parseInt(process.env.DB_PORT || '5432', 10),
 *   max: 20, // max number of clients in the pool
 *   idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
 *   connectionTimeoutMillis: 2000, // how long to wait for a client to connect
 * };
 */
export type PostgresConfig = PoolConfig;

/**
 * A singleton class to manage PostgreSQL database connections.
 * It encapsulates a connection pool and provides methods for querying and transactions.
 */
export class PostgresConnector {
  private static instance: PostgresConnector;
  private pool: Pool;

  /**
   * The constructor is private to enforce the singleton pattern.
   * Use `PostgresConnector.getInstance()` to get the single instance.
   * @param {PostgresConfig} config - The configuration for the connection pool.
   */
  private constructor(config: PostgresConfig) {
    this.pool = new Pool(config);

    // Event listener for new client connections
    this.pool.on('connect', (client) => {
      // In a real application, use a proper logger instance.
      console.log(`[PostgresConnector] Client connected. Total clients: ${this.pool.totalCount}`);
      // You could set session-level parameters here if needed, e.g.:
      // client.query('SET TIME ZONE "UTC"');
    });

    // Event listener for errors from idle clients
    this.pool.on('error', (err, client) => {
      // In a real application, use a proper logger instance.
      console.error('[PostgresConnector] Unexpected error on idle client', err);
      // It's recommended to exit the process gracefully here to allow a process manager
      // (like PM2 or Kubernetes) to restart the service in a clean state.
      process.exit(-1);
    });
  }

  /**
   * Gets the singleton instance of the PostgresConnector.
   * The configuration is required on the first call to initialize the connector.
   * Subsequent calls will return the existing instance, ignoring any provided config.
   * @param {PostgresConfig} [config] - The configuration for the connection pool. Required for first-time initialization.
   * @returns {PostgresConnector} The singleton instance.
   */
  public static getInstance(config?: PostgresConfig): PostgresConnector {
    if (!PostgresConnector.instance) {
      if (!config) {
        throw new Error(
          'PostgresConnector requires a configuration object for the first initialization.',
        );
      }
      PostgresConnector.instance = new PostgresConnector(config);
    }
    return PostgresConnector.instance;
  }

  /**
   * Acquires a client from the pool to test the connection.
   * Throws an error if a connection cannot be established.
   */
  public async connect(): Promise<void> {
    let client: PoolClient | undefined;
    try {
      client = await this.pool.connect();
      console.log('[PostgresConnector] Database connection test successful.');
    } catch (error) {
      console.error('[PostgresConnector] Failed to connect to the database.', error);
      throw error;
    } finally {
      client?.release();
    }
  }

  /**
   * Gracefully shuts down the connection pool.
   * This should be called during application shutdown.
   */
  public async disconnect(): Promise<void> {
    console.log('[PostgresConnector] Disconnecting from the database...');
    await this.pool.end();
    console.log('[PostgresConnector] All clients have been disconnected.');
  }

  /**
   * Executes a SQL query using a client from the pool.
   * This is suitable for single, auto-commit queries.
   * @template T - The expected type of the rows in the result.
   * @param {string} text - The SQL query string. Can include placeholders like $1, $2.
   * @param {any[]} [params] - An array of parameters to substitute into the query.
   * @returns {Promise<QueryResult<T>>} A promise that resolves with the query result.
   */
  public async query<T extends any = any>(
    text: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      // In a real application, use a proper logger with log levels.
      console.log(`[PostgresConnector] Executed query: { text: "${text.substring(0, 100)}...", duration: ${duration}ms, rows: ${res.rowCount} }`);
      return res;
    } catch (error) {
      console.error(`[PostgresConnector] Error executing query: ${text}`, error);
      throw error;
    }
  }

  /**
   * Retrieves a single client from the pool.
   * This is useful for manual transaction management, but `executeTransaction` is preferred.
   * **IMPORTANT:** The caller is responsible for releasing the client back to the pool
   * using `client.release()` in a `finally` block.
   * @returns {Promise<PoolClient>} A promise that resolves with a connected client.
   */
  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Executes a series of database operations within a transaction.
   * This method handles acquiring a client, beginning the transaction,
   * committing on success, rolling back on failure, and releasing the client.
   * This is the recommended way to handle transactions.
   *
   * @template T - The return type of the callback function.
   * @param {(client: PoolClient) => Promise<T>} callback - An async function that receives a `PoolClient`
   * and performs database operations. If it throws an error, the transaction is rolled back.
   * @returns {Promise<T>} A promise that resolves with the return value of the callback.
   *
   * @example
   * await db.executeTransaction(async (client) => {
   *   const { rows } = await client.query('INSERT INTO users (name) VALUES ($1) RETURNING id', ['John']);
   *   const userId = rows[0].id;
   *   await client.query('INSERT INTO profiles (user_id, bio) VALUES ($1, $2)', [userId, 'A bio.']);
   * });
   */
  public async executeTransaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[PostgresConnector] Transaction rolled back due to an error.', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Gets the underlying `pg.Pool` instance.
   * Use with caution, primarily for scenarios not covered by the connector's API.
   * @returns {Pool} The `pg.Pool` instance.
   */
  public getPool(): Pool {
    return this.pool;
  }
}