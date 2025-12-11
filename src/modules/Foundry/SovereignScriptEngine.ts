```typescript
import { VM, VMScript, VMError } from 'vm2';

// --- Type Definitions for the sandboxed environment ---

/**
 * Represents a single financial instrument or asset's market data.
 */
export interface TickerData {
    symbol: string;
    price: number;
    bid: number;
    ask: number;
    volume: number;
    timestamp: number;
}

/**
 * Represents a position held in the user's portfolio.
 */
export interface PortfolioPosition {
    symbol: string;
    quantity: number;
    averagePrice: number;
    marketValue: number;
}

/**
 * Represents the current state of the user's portfolio.
 */
export interface PortfolioState {
    cash: number;
    positions: PortfolioPosition[];
    totalValue: number;
}

/**
 * The API exposed to the user script for interacting with market data.
 * The implementation of this interface should handle caching, rate-limiting, and data source connections.
 */
export interface MarketAPI {
    /**
     * Fetches the latest ticker data for a given symbol.
     * @param symbol The stock, forex, or crypto symbol (e.g., 'AAPL', 'EURUSD', 'BTC-USD').
     * @returns A promise that resolves with the ticker data, or null if the symbol is not found.
     */
    getTicker(symbol: string): Promise<TickerData | null>;

    /**
     * Fetches historical price data (candles).
     * @param symbol The asset symbol.
     * @param interval The time interval (e.g., '1m', '1h', '1d').
     * @param limit The number of data points to retrieve.
     * @returns A promise that resolves with an array of historical data points.
     */
    getHistory(symbol: string, interval: string, limit: number): Promise<any[]>;
}

/**
 * The API for managing the portfolio and executing trades.
 * The implementation of this interface is responsible for all risk management,
 * order validation, and brokerage/exchange communication.
 */
export interface TradeAPI {
    /**
     * Retrieves the current state of the portfolio.
     * @returns A promise that resolves with the portfolio state.
     */
    getPortfolio(): Promise<PortfolioState>;

    /**
     * Places a market buy order.
     * @param symbol The asset symbol.
     * @param quantity The amount of the asset to buy.
     * @returns A promise that resolves with the order execution details.
     */
    buy(symbol: string, quantity: number): Promise<{ success: boolean; message: string; orderId?: string }>;

    /**
     * Places a market sell order.
     * @param symbol The asset symbol.
     * @param quantity The amount of the asset to sell.
     * @returns A promise that resolves with the order execution details.
     */
    sell(symbol: string, quantity: number): Promise<{ success: boolean; message: string; orderId?: string }>;
}


/**
 * The full context object that will be available as global-like variables in the sandboxed script.
 */
export interface SovereignScriptContext {
    market: MarketAPI;
    trade: TradeAPI;
    /**
     * A safe logging function for script output.
     * @param args The data to log.
     */
    log: (...args: any[]) => void;
}

/**
 * Options for configuring the SovereignScriptEngine.
 */
export interface SovereignScriptEngineOptions {
    /**
     * The maximum execution time for a script in milliseconds.
     * @default 5000
     */
    timeout?: number;

    /**
     * External modules that are allowed to be `require`d by the script.
     * Use with extreme caution. It is safer to provide all functionality via the context.
     * @default []
     */
    allowedModules?: string[];
}

/**
 * Represents the structured result of a script execution.
 */
export interface ExecutionResult<T = any> {
    success: boolean;
    result?: T;
    error?: string;
    logs: any[][];
    executionTime: number; // in milliseconds
}

/**
 * SovereignScriptEngine provides a secure, sandboxed environment for executing
 * user-provided financial logic and trading scripts. It leverages `vm2` to prevent
 * access to sensitive Node.js APIs and the host system, while exposing a controlled
 * set of financial and trading functions through a dedicated context object.
 */
export class SovereignScriptEngine {
    private readonly options: Required<SovereignScriptEngineOptions>;

    constructor(options: SovereignScriptEngineOptions = {}) {
        this.options = {
            timeout: options.timeout ?? 5000,
            allowedModules: options.allowedModules ?? [],
        };
    }

    /**
     * Executes a user-defined script within a secure sandbox.
     * @param scriptContent The string content of the JavaScript to execute.
     * @param context The API context (market data, trading functions) to inject into the sandbox.
     * @returns A promise that resolves with the execution result.
     */
    public async execute<T = any>(
        scriptContent: string,
        context: SovereignScriptContext
    ): Promise<ExecutionResult<T>> {
        const startTime = Date.now();
        const capturedLogs: any[][] = [];

        // Create a safe logger that pushes sanitized logs to our capturedLogs array.
        const safeLog = (...args: any[]) => {
            const sanitizedArgs = args.map(arg => {
                try {
                    // Basic serialization to prevent complex objects/functions from leaking.
                    return JSON.parse(JSON.stringify(arg));
                } catch {
                    return String(arg);
                }
            });
            capturedLogs.push(sanitizedArgs);
        };

        const vm = new VM({
            timeout: this.options.timeout,
            sandbox: {
                ...context,
                log: safeLog,
                // A helper to allow top-level async/await patterns in user scripts
                run: async (main: () => Promise<any>) => {
                  return await main();
                }
            },
            compiler: 'javascript',
            eval: false,
            wasm: false,
            require: {
                external: {
                    modules: this.options.allowedModules,
                },
                builtin: [], // Explicitly disallow all built-in node modules
                root: './', // Restrict require paths to a dummy directory
                mock: {},
            },
        });

        // The user script is wrapped in an async function to allow top-level await.
        // The sandbox provides a `run` function to execute this wrapper.
        const wrappedScript = `run(async () => {
${scriptContent}
});`;

        try {
            const script = new VMScript(wrappedScript, 'sovereign-script.js');
            const result = await vm.run(script);
            const executionTime = Date.now() - startTime;
            
            return {
                success: true,
                result: result as T,
                logs: capturedLogs,
                executionTime,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            let errorMessage: string;

            if (error instanceof VMError) {
                errorMessage = `[Sandbox Error] ${error.message}`;
            } else if (error instanceof Error) {
                errorMessage = `[Runtime Error] ${error.message}`;
            } else {
                errorMessage = 'An unknown error occurred during script execution.';
            }

            return {
                success: false,
                error: errorMessage,
                logs: capturedLogs,
                executionTime,
            };
        }
    }
}
```