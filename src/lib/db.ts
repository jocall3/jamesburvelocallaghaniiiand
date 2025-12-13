import { Pool, PoolClient } from 'pg';

// --- Configuration ---
// In a real application, these would come from environment variables or a config service.
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'my_application_db',
    password: process.env.DB_PASSWORD || 'secret',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10), // Max connections in the pool
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10), // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '2000', 10), // How long to wait for a connection to be established
};

// --- Global Connection Pool ---
let pool: Pool | null = null;

/**
 * Initializes and returns the PostgreSQL connection pool.
 * If the pool already exists, it returns the existing instance.
 * @returns {Pool} The initialized PostgreSQL connection pool.
 */
export function getPool(): Pool {
    if (pool) {
        return pool;
    }

    console.log(`Initializing database connection pool for database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    
    pool = new Pool(dbConfig);

    // Optional: Add error handling for the pool itself (e.g., connection failures on startup)
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle PostgreSQL client', err);
        // In a production environment, you might want to trigger health checks or alerts here.
        if (client) {
            // If the client was checked out, it should be terminated.
            client.release();
        }
    });

    return pool;
}

/**
 * Retrieves a client connection from the pool.
 * This function should always be used within a try...finally block to ensure the client is released.
 * 
 * @returns {Promise<PoolClient>} A connected database client.
 */
export async function getClient(): Promise<PoolClient> {
    const currentPool = getPool();
    try {
        const client = await currentPool.connect();
        return client;
    } catch (error) {
        console.error('Failed to acquire database client from pool:', error);
        throw new Error('Database connection unavailable.');
    }
}

/**
 * Executes a query against the database using a temporary client from the pool.
 * This is suitable for simple, single operations where connection management overhead is acceptable.
 * 
 * @template T The expected return type of the query result.
 * @param {string} text The SQL query text.
 * @param {any[]} [params=[]] The parameters to substitute into the query.
 * @returns {Promise<T>} The result set of the query.
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T> {
    const client = await getClient();
    try {
        const res = await client.query<T>(text, params);
        return res.rows;
    } finally {
        client.release();
    }
}

/**
 * Executes a transaction block.
 * 
 * @param {(client: PoolClient) => Promise<any>} transactionFn A function that takes a client and performs operations.
 * @returns {Promise<any>} The result of the transaction function.
 */
export async function runTransaction<T>(transactionFn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await transactionFn(client);
        await client.query('COMMIT');
        return result;
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Transaction failed, rolled back.', e);
        throw e;
    } finally {
        client.release();
    }
}

/**
 * Closes the connection pool gracefully.
 * Should be called during application shutdown.
 */
export async function closePool(): Promise<void> {
    if (pool) {
        console.log('Closing database connection pool...');
        await pool.end();
        pool = null;
        console.log('Database connection pool closed.');
    }
}

// Exporting the client type for use in service layers
export type { PoolClient };
// Exporting the query result type for convenience
export type { QueryResultRow } from 'pg';