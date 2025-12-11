import { createClient, RedisClientType } from 'redis';

class RedisCache {
    private client: RedisClientType;
    private isConnected: boolean = false;

    constructor() {
        // Initialize Redis client using environment variables or defaults
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        return new Error('Redis connection retry exhausted');
                    }
                    return Math.min(retries * 50, 2000);
                }
            }
        });

        this.client.on('error', (err) => console.error('Redis Client Error:', err));
        this.client.on('connect', () => console.log('Redis Client Connecting...'));
        this.client.on('ready', () => {
            this.isConnected = true;
            console.log('Redis Client Connected and Ready');
        });
        this.client.on('end', () => {
            this.isConnected = false;
            console.log('Redis Client Disconnected');
        });
    }

    /**
     * Connects to the Redis server if not already connected.
     */
    public async connect(): Promise<void> {
        if (!this.isConnected) {
            await this.client.connect();
        }
    }

    /**
     * Disconnects from the Redis server.
     */
    public async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.client.quit();
        }
    }

    /**
     * Retrieves a value from the cache.
     * @param key The cache key
     * @returns The parsed value or null if missing/error
     */
    public async get<T>(key: string): Promise<T | null> {
        try {
            await this.connect();
            const data = await this.client.get(key);
            if (data) {
                return JSON.parse(data) as T;
            }
            return null;
        } catch (error) {
            console.error(`Error retrieving key [${key}] from Redis:`, error);
            return null;
        }
    }

    /**
     * Sets a value in the cache with an optional TTL.
     * @param key The cache key
     * @param value The value to store (will be JSON stringified)
     * @param ttlSeconds Time to live in seconds (default: 3600)
     */
    public async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        try {
            await this.connect();
            const stringValue = JSON.stringify(value);
            await this.client.set(key, stringValue, {
                EX: ttlSeconds
            });
        } catch (error) {
            console.error(`Error setting key [${key}] in Redis:`, error);
        }
    }

    /**
     * Specialized method to get cached EVM simulation results.
     * @param transactionHash The hash of the transaction
     */
    public async getSimulationResult(transactionHash: string): Promise<any | null> {
        return this.get(`sim:${transactionHash}`);
    }

    /**
     * Specialized method to cache EVM simulation results.
     * Simulation results are often deterministic, so we cache them for a long duration (e.g., 24 hours).
     * @param transactionHash The hash of the transaction
     * @param result The simulation result object
     */
    public async setSimulationResult(transactionHash: string, result: any): Promise<void> {
        // Cache for 24 hours (86400 seconds)
        await this.set(`sim:${transactionHash}`, result, 86400);
    }

    /**
     * Specialized method to get cached Google search results.
     * @param query The search query string
     */
    public async getSearchResult(query: string): Promise<any | null> {
        const normalizedKey = `search:${query.trim().toLowerCase()}`;
        return this.get(normalizedKey);
    }

    /**
     * Specialized method to cache Google search results to save API costs.
     * @param query The search query string
     * @param data The search result data
     */
    public async setSearchResult(query: string, data: any): Promise<void> {
        const normalizedKey = `search:${query.trim().toLowerCase()}`;
        // Cache for 12 hours
        await this.set(normalizedKey, data, 43200);
    }

    /**
     * Clears a specific key from the cache.
     * @param key The key to remove
     */
    public async del(key: string): Promise<void> {
        try {
            await this.connect();
            await this.client.del(key);
        } catch (error) {
            console.error(`Error deleting key [${key}] from Redis:`, error);
        }
    }
}

// Export a singleton instance
export const redisCache = new RedisCache();