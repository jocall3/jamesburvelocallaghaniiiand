/**
 * @file src/services/cache/ResponseCache.ts
 * @purpose Caching layer for API responses to improve performance and reduce redundant requests.
 * This service provides an in-memory cache with Time-To-Live (TTL) support for API responses.
 * It generates unique cache keys based on request details (URL, method, params, body)
 * to ensure that identical requests hit the cache.
 */

import crypto from 'crypto';

/**
 * Defines the contract for a generic cache store.
 * This allows for easy swapping of the underlying cache implementation (e.g., in-memory, Redis, etc.).
 * @template T The type of data stored in the cache.
 */
export interface ICache<T> {
    /**
     * Retrieves an item from the cache.
     * @param key The key of the item to retrieve.
     * @returns The cached item, or undefined if not found or expired.
     */
    get(key: string): T | undefined;

    /**
     * Adds or updates an item in the cache.
     * @param key The key to store the item under.
     * @param value The item to store.
     * @param ttl Optional. Time-to-live in milliseconds.
     */
    set(key: string, value: T, ttl?: number): void;

    /**
     * Deletes an item from the cache.
     * @param key The key of the item to delete.
     * @returns True if an element in the cache existed and has been removed, or false if the element does not exist.
     */
    delete(key: string): boolean;

    /**
     * Checks if an item exists in the cache (and is not expired).
     * @param key The key to check.
     * @returns True if the item exists, false otherwise.
     */
    has(key: string): boolean;

    /**
     * Clears all items from the cache.
     */
    clear(): void;
}

/**
 * Represents a single entry in the InMemoryCache.
 * @template T The type of the cached value.
 */
interface CacheEntry<T> {
    value: T;
    expiresAt: number | null;
}

/**
 * A simple in-memory cache implementation that adheres to the ICache interface.
 * Supports TTL for cache entries.
 * @template T The type of data to be stored.
 */
export class InMemoryCache<T> implements ICache<T> {
    private readonly cache = new Map<string, CacheEntry<T>>();

    /**
     * @inheritdoc
     */
    public get(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }

        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value;
    }

    /**
     * @inheritdoc
     */
    public set(key: string, value: T, ttl?: number): void {
        const expiresAt = ttl ? Date.now() + ttl : null;
        this.cache.set(key, { value, expiresAt });
    }

    /**
     * @inheritdoc
     */
    public delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * @inheritdoc
     */
    public has(key: string): boolean {
        // `get` method handles expiration check
        return this.get(key) !== undefined;
    }

    /**
     * @inheritdoc
     */
    public clear(): void {
        this.cache.clear();
    }
}

/**
 * Defines the structure of a request object that can be cached.
 */
export interface CacheableRequest {
    method: string;
    url: string;
    params?: Record<string, any>;
    headers?: Record<string, any>; // Headers can sometimes influence the response
    data?: any; // Request body
}

/**
 * Type alias for a cached response. Can be any serializable data.
 */
export type CachedResponse = any;

/**
 * A singleton service for caching API responses.
 * It uses an ICache implementation to store responses and generates
 * stable keys from request objects.
 */
class ResponseCacheService {
    private static instance: ResponseCacheService;
    private cache: ICache<string>; // Stores serialized JSON strings

    private constructor(cacheImplementation: ICache<string> = new InMemoryCache<string>()) {
        this.cache = cacheImplementation;
        console.log('ResponseCacheService initialized.');
    }

    /**
     * Gets the singleton instance of the ResponseCacheService.
     * @returns The singleton instance.
     */
    public static getInstance(): ResponseCacheService {
        if (!ResponseCacheService.instance) {
            ResponseCacheService.instance = new ResponseCacheService();
        }
        return ResponseCacheService.instance;
    }

    /**
     * Generates a stable and unique cache key from request details.
     * This method normalizes the request object to ensure that semantically
     * identical requests produce the same key.
     * @param request - The request object.
     * @returns A unique hash string representing the request.
     */
    private generateCacheKey(request: CacheableRequest): string {
        try {
            // To ensure consistency, we sort keys of params and data if they are objects
            const sortedParams = request.params ? JSON.stringify(this.sortObjectKeys(request.params)) : '';
            const sortedData = request.data ? JSON.stringify(this.sortObjectKeys(request.data)) : '';

            const keyString = `${request.method.toUpperCase()}:${request.url}:${sortedParams}:${sortedData}`;

            // Use a cryptographic hash to create a fixed-length, collision-resistant key
            return crypto.createHash('sha256').update(keyString).digest('hex');
        } catch (error) {
            console.error('[ResponseCache] Error generating cache key:', error);
            // Fallback to a less stable but functional key
            return `${request.method}:${request.url}:${Date.now()}`;
        }
    }

    /**
     * Recursively sorts the keys of an object.
     * @param obj The object to sort.
     * @returns A new object with sorted keys.
     */
    private sortObjectKeys(obj: any): any {
        if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
            return obj;
        }
        return Object.keys(obj).sort().reduce((acc, key) => {
            acc[key] = this.sortObjectKeys(obj[key]);
            return acc;
        }, {} as Record<string, any>);
    }

    /**
     * Retrieves a cached response.
     * @param request - The request object to look up in the cache.
     * @returns The cached response data, or null if not found or expired.
     */
    public get(request: CacheableRequest): CachedResponse | null {
        const key = this.generateCacheKey(request);
        const cachedValue = this.cache.get(key);

        if (cachedValue) {
            try {
                return JSON.parse(cachedValue);
            } catch (error) {
                console.error(`[ResponseCache] Error parsing cached value for key ${key}. Invalidating entry.`, error);
                this.cache.delete(key);
                return null;
            }
        }
        return null;
    }

    /**
     * Caches an API response.
     * @param request - The original request object.
     * @param response - The response data to cache. Must be JSON-serializable.
     * @param ttl - Optional. Time-to-live for the cache entry in milliseconds.
     */
    public set(request: CacheableRequest, response: CachedResponse, ttl?: number): void {
        const key = this.generateCacheKey(request);
        try {
            const valueToCache = JSON.stringify(response);
            this.cache.set(key, valueToCache, ttl);
        } catch (error) {
            console.error(`[ResponseCache] Error serializing response for key ${key}. Caching failed.`, error);
        }
    }

    /**
     * Invalidates a specific cache entry based on its request.
     * Useful for POST, PUT, DELETE operations that change data.
     * @param request - The request object whose cache entry should be invalidated.
     */
    public invalidate(request: CacheableRequest): void {
        const key = this.generateCacheKey(request);
        this.cache.delete(key);
    }

    /**
     * Clears the entire response cache.
     */
    public clearAll(): void {
        this.cache.clear();
        console.log('[ResponseCache] All cache entries have been cleared.');
    }
}

/**
 * Export a singleton instance of the ResponseCacheService for application-wide use.
 */
export const responseCache = ResponseCacheService.getInstance();