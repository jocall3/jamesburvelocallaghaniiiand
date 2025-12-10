import { Pool, PoolClient, QueryResult } from 'pg';

/**
 * Configuration interface for the database connection.
 */
export interface DbConfig {
  user?: string;
  host?: string;
  database?: string;
  password?: string;
  port?: number;
  max?: number; // Maximum number of clients in the pool
  idleTimeoutMillis?: number; // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis?: number; // How long to wait for a client to become available
  ssl?: boolean | { rejectUnauthorized: boolean }; // SSL configuration
}

/**
 * Service for managing database connections, transactions, and queries.
 * It uses a PostgreSQL pool to efficiently handle connections.
 */
export class DatabaseService {
  private pool: Pool;
  private isConnected: boolean = false;

  /**
   * Initializes the DatabaseService with the given configuration.
   * @param config Database connection configuration.
   */
  constructor(config: DbConfig) {
    this.pool = new Pool(config);

    this.pool.on('error', (err: Error, client: PoolClient) => {
      console.error('Database pool error:', err.message, 'on client:', client);
      // It's good practice to log or handle this error, but the pool itself
      // will try to recover by removing the bad client and creating a new one.
    });

    console.log('DatabaseService initialized.');
  }

  /**
   * Establishes and tests the database connection.
   * @returns A promise that resolves if the connection is successful, rejects otherwise.
   */
  public async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1'); // Simple query to test connection
      client.release();
      this.isConnected = true;
      console.log('Successfully connected to the database.');
    } catch (error) {
      this.isConnected = false;
      console.error('Failed to connect to the database:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnects from the database by ending the pool.
   * @returns A promise that resolves when the pool is closed.
   */
  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.pool.end();
        this.isConnected = false;
        console.log('Database pool closed.');
      } catch (error) {
        console.error('Error closing database pool:', error);
        throw new Error(`Database disconnection failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.warn('Attempted to disconnect, but database was not connected.');
    }
  }

  /**
   * Executes a SQL query with optional parameters.
   * @param sql The SQL query string.
   * @param params Optional array of parameters for the query.
   * @returns A promise that resolves with the query result.
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.isConnected) {
      throw new Error('Database is not connected. Call connect() first.');
    }
    try {
      console.debug('Executing query:', sql, params);
      const result = await this.pool.query<T>(sql, params);
      return result;
    } catch (error) {
      console.error('Error executing query:', sql, params, error);
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Executes a series of database operations within a transaction.
   * If any operation fails, the transaction is rolled back.
   * @param callback An async function that receives a PoolClient for transaction operations.
   * @returns A promise that resolves with the result of the callback function.
   */
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.isConnected) {
      throw new Error('Database is not connected. Call connect() first.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction failed, rolled back:', error);
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Helper method to select records from a table.
   * @param table The name of the table.
   * @param conditions Optional object of key-value pairs for WHERE clause.
   * @param fields Optional array of field names to select. Defaults to all fields.
   * @returns A promise that resolves with an array of records.
   */
  public async select<T = any>(table: string, conditions?: Record<string, any>, fields?: string[]): Promise<T[]> {
    let sql = `SELECT ${fields && fields.length > 0 ? fields.join(', ') : '*'} FROM "${table}"`;
    const params: any[] = [];
    const whereClauses: string[] = [];
    let paramIndex = 1;

    if (conditions) {
      for (const key in conditions) {
        if (Object.prototype.hasOwnProperty.call(conditions, key)) {
          whereClauses.push(`"${key}" = $${paramIndex++}`);
          params.push(conditions[key]);
        }
      }
      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }
    }

    const result = await this.query<T>(sql, params);
    return result.rows;
  }

  /**
   * Helper method to insert a new record into a table.
   * @param table The name of the table.
   * @param data The object containing the data to insert.
   * @param returningFields Optional array of field names to return after insert. Defaults to 'id'.
   * @returns A promise that resolves with the inserted record (or specified fields).
   */
  public async insert<T = any>(table: string, data: Record<string, any>, returningFields: string[] = ['id']): Promise<T> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `INSERT INTO "${table}" (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders}) RETURNING ${returningFields.map(field => `"${field}"`).join(', ')}`;

    const result = await this.query<T>(sql, values);
    if (result.rows.length === 0) {
      throw new Error('Insert operation failed, no rows returned.');
    }
    return result.rows[0];
  }

  /**
   * Helper method to update records in a table.
   * @param table The name of the table.
   * @param conditions Object of key-value pairs for WHERE clause to identify records.
   * @param data The object containing the data to update.
   * @param returningFields Optional array of field names to return after update. Defaults to 'id'.
   * @returns A promise that resolves with an array of updated records (or specified fields).
   */
  public async update<T = any>(table: string, conditions: Record<string, any>, data: Record<string, any>, returningFields: string[] = ['id']): Promise<T[]> {
    const setClauses: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        setClauses.push(`"${key}" = $${paramIndex++}`);
        updateValues.push(data[key]);
      }
    }

    const whereClauses: string[] = [];
    for (const key in conditions) {
      if (Object.prototype.hasOwnProperty.call(conditions, key)) {
        whereClauses.push(`"${key}" = $${paramIndex++}`);
        updateValues.push(conditions[key]);
      }
    }

    if (setClauses.length === 0) {
      throw new Error('No data provided for update.');
    }
    if (whereClauses.length === 0) {
      throw new Error('No conditions provided for update. Refusing to update all records.');
    }

    const sql = `UPDATE "${table}" SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING ${returningFields.map(field => `"${field}"`).join(', ')}`;

    const result = await this.query<T>(sql, updateValues);
    return result.rows;
  }

  /**
   * Helper method to delete records from a table.
   * @param table The name of the table.
   * @param conditions Object of key-value pairs for WHERE clause to identify records.
   * @param returningFields Optional array of field names to return after delete. Defaults to 'id'.
   * @returns A promise that resolves with an array of deleted records (or specified fields).
   */
  public async delete<T = any>(table: string, conditions: Record<string, any>, returningFields: string[] = ['id']): Promise<T[]> {
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (Object.keys(conditions).length === 0) {
      throw new Error('No conditions provided for delete. Refusing to delete all records.');
    }

    for (const key in conditions) {
      if (Object.prototype.hasOwnProperty.call(conditions, key)) {
        whereClauses.push(`"${key}" = $${paramIndex++}`);
        params.push(conditions[key]);
      }
    }

    const sql = `DELETE FROM "${table}" WHERE ${whereClauses.join(' AND ')} RETURNING ${returningFields.map(field => `"${field}"`).join(', ')}`;

    const result = await this.query<T>(sql, params);
    return result.rows;
  }
}