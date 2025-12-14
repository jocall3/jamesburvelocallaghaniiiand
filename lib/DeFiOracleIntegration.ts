export enum OracleProviderType {
    CHAINLINK = 'CHAINLINK',
    PYTH = 'PYTH',
    BAND = 'BAND',
    MOCK = 'MOCK', // For testing and demonstration purposes
    CUSTOM = 'CUSTOM', // For other specific, non-standard integrations
}

export interface OracleProviderConfig {
    type: OracleProviderType;
    name: string; // A descriptive name for this specific provider instance (e.g., "Chainlink ETH/USD Mainnet")
    // Provider-specific configurations
    // For Chainlink (on-chain):
    contractAddress?: string; // The address of the Chainlink price feed aggregator
    rpcUrl?: string; // RPC endpoint to interact with the blockchain
    // For Pyth (off-chain/on-chain):
    feedId?: string; // Pyth price feed ID (e.g., for specific assets)
    pythEndpoint?: string; // Pyth HTTP endpoint for off-chain data (e.g., HERMES)
    // For general API-based oracles:
    apiUrl?: string; // Base URL for the oracle's API
    apiKey?: string; // API key for authentication
    // ... other specific configurations as needed for different providers
}

export interface DeFiOracleIntegrationConfig {
    providers: OracleProviderConfig[];
    // Optional: Map specific asset symbols to preferred oracle provider types
    assetProviderMap?: { [assetSymbol: string]: OracleProviderType };
    defaultProviderType?: OracleProviderType; // Fallback provider type if no specific map entry exists
    cacheDurationSeconds?: number; // Duration in seconds to cache fetched prices (default: 60 seconds)
}

export interface AssetPrice {
    symbol: string;
    price: number;
    timestamp: number; // Unix timestamp when the price was fetched
    provider: OracleProviderType; // The oracle provider that supplied this price
}

/**
 * Interface for a generic oracle client.
 * All concrete oracle client implementations must adhere to this interface.
 */
export interface IOracleClient {
    providerType: OracleProviderType;
    fetchPrice(assetSymbol: string): Promise<number | null>;
}

/**
 * A mock oracle client for demonstration and testing purposes.
 * It simulates fetching prices with slight fluctuations and delays.
 */
class MockOracleClient implements IOracleClient {
    public readonly providerType: OracleProviderType = OracleProviderType.MOCK;
    private prices: { [key: string]: number } = {
        'ETH/USD': 3500.00,
        'BTC/USD': 70000.00,
        'GOLD/USD': 2300.00,
        'AAPL/USD': 170.00,
    };

    constructor(private config: OracleProviderConfig) {
        console.log(`[MockOracleClient] Initialized for config: ${config.name}`);
    }

    /**
     * Simulates fetching a price for a given asset symbol.
     * @param assetSymbol The symbol of the asset (e.g., "ETH/USD").
     * @returns A promise that resolves to a simulated price or null if not found.
     */
    async fetchPrice(assetSymbol: string): Promise<number | null> {
        const normalizedSymbol = assetSymbol.toUpperCase();
        console.log(`[MockOracleClient] Simulating fetch for ${normalizedSymbol}`);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));

        const basePrice = this.prices[normalizedSymbol];
        if (basePrice !== undefined) {
            // Simulate slight price fluctuation
            const fluctuation = (Math.random() - 0.5) * (basePrice * 0.001); // +/- 0.1%
            return parseFloat((basePrice + fluctuation).toFixed(2));
        }
        console.warn(`[MockOracleClient] Price not found for ${normalizedSymbol}`);
        return null;
    }
}

/**
 * The main integration layer for connecting with various DeFi oracles.
 * It manages multiple oracle clients, handles provider selection, and implements caching.
 */
export class DeFiOracleIntegration {
    private clients: Map<OracleProviderType, IOracleClient> = new Map();
    private assetProviderMap: { [assetSymbol: string]: OracleProviderType };
    private defaultProviderType: OracleProviderType;
    private cache: Map<string, AssetPrice> = new Map();
    private cacheDurationMs: number;

    /**
     * Initializes the DeFiOracleIntegration with a given configuration.
     * @param config Configuration object specifying oracle providers, asset-to-provider mapping, and cache duration.
     * @throws Error if no oracle providers are configured or if the default provider cannot be initialized.
     */
    constructor(config: DeFiOracleIntegrationConfig) {
        if (!config.providers || config.providers.length === 0) {
            throw new Error("DeFiOracleIntegration requires at least one oracle provider configuration.");
        }

        this.assetProviderMap = config.assetProviderMap || {};
        this.defaultProviderType = config.defaultProviderType || OracleProviderType.MOCK; // Default to MOCK if not specified
        this.cacheDurationMs = (config.cacheDurationSeconds || 60) * 1000;

        this.initializeClients(config.providers);

        // Ensure the default provider type has an initialized client
        if (!this.clients.has(this.defaultProviderType)) {
            console.warn(`[DeFiOracleIntegration] Default provider type ${this.defaultProviderType} is not configured. Falling back to the first available provider.`);
            if (config.providers.length > 0) {
                this.defaultProviderType = config.providers[0].type;
            } else {
                throw new Error("No valid oracle clients could be initialized.");
            }
            if (!this.clients.has(this.defaultProviderType)) {
                 throw new Error(`No valid oracle client could be initialized for default provider type ${this.defaultProviderType}.`);
            }
        }

        console.log(`[DeFiOracleIntegration] Initialized with ${this.clients.size} oracle clients. Default: ${this.defaultProviderType}`);
    }

    /**
     * Initializes concrete oracle client instances based on the provided configurations.
     * @param providersConfig An array of OracleProviderConfig objects.
     */
    private initializeClients(providersConfig: OracleProviderConfig[]): void {
        for (const providerConfig of providersConfig) {
            let client: IOracleClient | null = null;
            switch (providerConfig.type) {
                case OracleProviderType.MOCK:
                    client = new MockOracleClient(providerConfig);
                    break;
                // TODO: Implement concrete classes for other oracle types here
                // case OracleProviderType.CHAINLINK:
                //     client = new ChainlinkClient(providerConfig); // Requires ChainlinkClient implementation
                //     break;
                // case OracleProviderType.PYTH:
                //     client = new PythClient(providerConfig); // Requires PythClient implementation
                //     break;
                // case OracleProviderType.BAND:
                //     client = new BandClient(providerConfig); // Requires BandClient implementation
                //     break;
                default:
                    console.warn(`[DeFiOracleIntegration] Unsupported oracle provider type: ${providerConfig.type}. Skipping initialization for this provider.`);
                    break;
            }
            if (client) {
                this.clients.set(providerConfig.type, client);
            }
        }
    }

    /**
     * Retrieves the price for a given asset symbol.
     * It first checks the internal cache. If the price is not in cache or is stale,
     * it fetches it from the appropriate oracle client (determined by asset mapping or default).
     * @param assetSymbol The symbol of the asset (e.g., "ETH/USD", "BTC/USD").
     * @returns A promise that resolves to an AssetPrice object or null if the price cannot be fetched.
     */
    public async getAssetPrice(assetSymbol: string): Promise<AssetPrice | null> {
        const normalizedSymbol = assetSymbol.toUpperCase();

        // 1. Check cache
        const cachedPrice = this.cache.get(normalizedSymbol);
        if (cachedPrice && (Date.now() - cachedPrice.timestamp < this.cacheDurationMs)) {
            console.log(`[DeFiOracleIntegration] Returning cached price for ${normalizedSymbol}`);
            return cachedPrice;
        }

        // 2. Determine which provider to use
        const providerType = this.assetProviderMap[normalizedSymbol] || this.defaultProviderType;
        const client = this.clients.get(providerType);

        if (!client) {
            console.error(`[DeFiOracleIntegration] No oracle client configured for provider type: ${providerType} for asset ${normalizedSymbol}.`);
            return null;
        }

        // 3. Fetch price from oracle
        try {
            console.log(`[DeFiOracleIntegration] Fetching live price for ${normalizedSymbol} using ${providerType} client.`);
            const price = await client.fetchPrice(normalizedSymbol);

            if (price !== null) {
                const assetPrice: AssetPrice = {
                    symbol: normalizedSymbol,
                    price: price,
                    timestamp: Date.now(),
                    provider: providerType,
                };
                this.cache.set(normalizedSymbol, assetPrice);
                return assetPrice;
            }
        } catch (error) {
            console.error(`[DeFiOracleIntegration] Error fetching price for ${normalizedSymbol} from ${providerType}:`, error);
        }

        return null;
    }

    /**
     * Clears the internal price cache, forcing subsequent price requests to hit the oracle clients.
     */
    public clearCache(): void {
        this.cache.clear();
        console.log("[DeFiOracleIntegration] Price cache cleared.");
    }

    /**
     * Returns a read-only map of the currently configured oracle clients.
     * @returns A ReadonlyMap where keys are OracleProviderType and values are IOracleClient instances.
     */
    public getClients(): ReadonlyMap<OracleProviderType, IOracleClient> {
        return this.clients;
    }
}