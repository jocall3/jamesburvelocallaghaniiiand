import { ethers, Contract, Signer, Provider, TransactionResponse } from 'ethers';

// --- Interfaces ---

/**
 * Configuration for an Automated Market Maker (AMM) liquidity pool.
 */
export interface AMMPoolConfig {
    /** The blockchain address of the AMM pool (e.g., Uniswap V2 Pair address). */
    address: string;
    /** The blockchain address of the first token in the pair. */
    tokenA: string;
    /** The blockchain address of the second token in the pair. */
    tokenB: string;
    /** Optional: The blockchain address of the LP token issued for providing liquidity (e.g., Uniswap V2 LP token). */
    lpToken?: string;
    /** Optional: The blockchain address of the AMM factory (useful for finding existing pools or creating new ones). */
    factoryAddress?: string;
    /** Optional: The blockchain address of the AMM router (used for adding/removing liquidity and swaps). */
    routerAddress?: string;
    /** The type of AMM protocol (e.g., Uniswap V2, Uniswap V3). */
    type: 'UNISWAP_V2' | 'UNISWAP_V3' | 'BALANCER' | 'CURVE' | 'GENERIC';
    /** Optional: A human-readable name for the pool. */
    name?: string;
}

/**
 * Represents the current state of an AMM liquidity pool.
 */
export interface PoolState {
    /** The current reserve amount of token A in the pool (raw BigInt). */
    reserveA: bigint;
    /** The current reserve amount of token B in the pool (raw BigInt). */
    reserveB: bigint;
    /** Optional: The total supply of LP tokens for this pool (raw BigInt). */
    totalSupplyLP?: bigint;
    /** The price of token A in terms of token B (e.g., how many B you get for 1 A). */
    priceA_vs_B: number;
    /** The price of token B in terms of token A (e.g., how many A you get for 1 B). */
    priceB_vs_A: number;
}

/**
 * Options for adding liquidity to an AMM pool.
 */
export interface AddLiquidityOptions {
    /** The desired amount of token A to add (raw BigInt). */
    amountADesired: bigint;
    /** The desired amount of token B to add (raw BigInt). */
    amountBDesired: bigint;
    /** The minimum amount of token A to add (for slippage control, raw BigInt). */
    amountAMin: bigint;
    /** The minimum amount of token B to add (for slippage control, raw BigInt). */
    amountBMin: bigint;
    /** The address to send the LP tokens to. */
    to: string;
    /** Unix timestamp by which the transaction must be mined. */
    deadline: number;
}

/**
 * Options for removing liquidity from an AMM pool.
 */
export interface RemoveLiquidityOptions {
    /** The amount of LP tokens to burn (raw BigInt). */
    lpTokenAmount: bigint;
    /** The minimum amount of token A to receive (for slippage control, raw BigInt). */
    amountAMin: bigint;
    /** The minimum amount of token B to receive (for slippage control, raw BigInt). */
    amountBMin: bigint;
    /** The address to send the received tokens to. */
    to: string;
    /** Unix timestamp by which the transaction must be mined. */
    deadline: number;
}

/**
 * Internal cache structure for token information.
 */
interface TokenInfo {
    address: string;
    decimals: number;
    symbol?: string;
}

// --- ABIs (Simplified for common functions) ---

// Uniswap V2 Pair ABI (minimal for getReserves, token0, token1, totalSupply)
const UNISWAP_V2_PAIR_ABI = [
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function totalSupply() external view returns (uint256)",
    "event Mint(address indexed sender, uint256 amount0, uint256 amount1)",
    "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)",
    "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
    "event Sync(uint112 reserve0, uint112 reserve1)",
];

// Uniswap V2 Router ABI (minimal for addLiquidity, removeLiquidity, getAmountsOut, swapExactTokensForTokens)
const UNISWAP_V2_ROUTER_ABI = [
    "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)",
    "function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB)",
    "function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts)",
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)",
];

// ERC-20 ABI (minimal for decimals and approve)
const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) returns (bool)",
];

/**
 * Service for managing Automated Market Maker (AMM) liquidity pools within Decentralized Finance (DeFi) protocols.
 * This service provides functionalities to interact with AMM pools, query their state,
 * and execute liquidity provision/removal and swap operations.
 *
 * Currently supports Uniswap V2-like protocols.
 */
export class AMMLiquidityPoolManager {
    private provider: Provider;
    private signer: Signer | null;
    private poolConfigs: Map<string, AMMPoolConfig>; // Map poolAddress (lowercase) -> config
    private tokenInfoCache: Map<string, TokenInfo>; // Map tokenAddress (lowercase) -> info

    /**
     * Creates an instance of AMMLiquidityPoolManager.
     * @param provider An ethers.js Provider instance connected to the blockchain.
     * @param signer Optional: An ethers.js Signer instance for sending transactions.
     */
    constructor(provider: Provider, signer?: Signer) {
        if (!provider) {
            throw new Error("Provider is required for AMMLiquidityPoolManager.");
        }
        this.provider = provider;
        this.signer = signer || null;
        this.poolConfigs = new Map();
        this.tokenInfoCache = new Map();
    }

    /**
     * Sets the signer for transactions. This is required for any write operations (e.g., add/remove liquidity, swaps).
     * @param signer The ethers.js Signer instance.
     */
    public setSigner(signer: Signer): void {
        this.signer = signer;
    }

    /**
     * Registers an AMM pool configuration with the manager.
     * This allows the manager to interact with the specified pool.
     * @param config The configuration for the AMM pool.
     * @throws {Error} If any required address in the config is invalid.
     */
    public registerPool(config: AMMPoolConfig): void {
        if (!ethers.isAddress(config.address)) {
            throw new Error(`Invalid pool address: ${config.address}`);
        }
        if (!ethers.isAddress(config.tokenA)) {
            throw new Error(`Invalid tokenA address: ${config.tokenA}`);
        }
        if (!ethers.isAddress(config.tokenB)) {
            throw new Error(`Invalid tokenB address: ${config.tokenB}`);
        }
        this.poolConfigs.set(config.address.toLowerCase(), config);
        console.log(`Registered AMM pool: ${config.name || config.address}`);
    }

    /**
     * Retrieves the configuration for a given pool address.
     * @param poolAddress The address of the AMM pool.
     * @returns The AMMPoolConfig or undefined if not found.
     */
    public getPoolConfig(poolAddress: string): AMMPoolConfig | undefined {
        return this.poolConfigs.get(poolAddress.toLowerCase());
    }

    /**
     * Fetches the number of decimals for a given ERC-20 token.
     * Results are cached to minimize on-chain calls.
     * @param tokenAddress The address of the ERC-20 token.
     * @returns The number of decimals for the token.
     * @throws {Error} If the decimals cannot be fetched.
     */
    private async getTokenDecimals(tokenAddress: string): Promise<number> {
        const normalizedAddress = tokenAddress.toLowerCase();
        const cached = this.tokenInfoCache.get(normalizedAddress);
        if (cached) {
            return cached.decimals;
        }

        try {
            const tokenContract = new Contract(tokenAddress, ERC20_ABI, this.provider);
            const decimals = await tokenContract.decimals();
            this.tokenInfoCache.set(normalizedAddress, { address: tokenAddress, decimals: Number(decimals) });
            return Number(decimals);
        } catch (error) {
            console.error(`[AMMLiquidityPoolManager] Failed to fetch decimals for token ${tokenAddress}:`, error);
            throw new Error(`Could not determine decimals for token ${tokenAddress}. Ensure it's a valid ERC-20 contract.`);
        }
    }

    /**
     * Approves an ERC-20 token for a spender. This is a prerequisite for many AMM operations.
     * @param tokenAddress The address of the token to approve.
     * @param spenderAddress The address of the contract that will spend the tokens (e.g., AMM router).
     * @param amount The amount to approve (raw BigInt). Use ethers.MaxUint256 for infinite approval.
     * @returns Transaction response.
     * @throws {Error} If signer is not set or transaction fails.
     */
    public async approveToken(tokenAddress: string, spenderAddress: string, amount: bigint): Promise<TransactionResponse> {
        if (!this.signer) {
            throw new Error("Signer not set. Cannot approve tokens.");
        }
        if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(spenderAddress)) {
            throw new Error("Invalid token or spender address for approval.");
        }

        const tokenContract = new Contract(tokenAddress, ERC20_ABI, this.signer);
        console.log(`Approving ${amount} from ${await this.signer.getAddress()} for ${spenderAddress} on token ${tokenAddress}...`);
        try {
            const tx = await tokenContract.approve(spenderAddress, amount);
            return tx;
        } catch (error) {
            console.error(`[AMMLiquidityPoolManager] Failed to approve token ${tokenAddress} for spender ${spenderAddress}:`, error);
            throw new Error(`Token approval failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Gets the current state of a Uniswap V2-like liquidity pool.
     * This includes reserves, total LP supply, and calculated prices.
     * @param poolAddress The address of the AMM pool.
     * @returns The current state of the pool.
     * @throws {Error} If the pool is not registered or not a UNISWAP_V2 type, or if token decimals cannot be fetched.
     */
    public async getUniswapV2PoolState(poolAddress: string): Promise<PoolState> {
        const config = this.getPoolConfig(poolAddress);
        if (!config || config.type !== 'UNISWAP_V2') {
            throw new Error(`Pool ${poolAddress} not registered or not a UNISWAP_V2 type.`);
        }

        const pairContract = new Contract(poolAddress, UNISWAP_V2_PAIR_ABI, this.provider);

        try {
            const [reserve0, reserve1] = await pairContract.getReserves();
            const token0Address = await pairContract.token0();
            const token1Address = await pairContract.token1();
            const totalSupplyLP = await pairContract.totalSupply();

            let reserveA: bigint;
            let reserveB: bigint;

            // Determine which reserve corresponds to tokenA and tokenB based on the config
            if (token0Address.toLowerCase() === config.tokenA.toLowerCase()) {
                reserveA = reserve0;
                reserveB = reserve1;
            } else if (token0Address.toLowerCase() === config.tokenB.toLowerCase()) {
                reserveA = reserve1;
                reserveB = reserve0;
            } else {
                throw new Error(`Configured tokens A (${config.tokenA}) or B (${config.tokenB}) do not match pool's token0 (${token0Address}) or token1 (${token1Address}).`);
            }

            const decimalsA = await this.getTokenDecimals(config.tokenA);
            const decimalsB = await this.getTokenDecimals(config.tokenB);

            // Calculate prices, normalizing for decimals
            // Price A vs B = (reserveB / 10^decimalsB) / (reserveA / 10^decimalsA)
            // To avoid floating point issues with BigInt, scale one side before division
            const priceA_vs_B = Number((reserveB * (10n ** BigInt(decimalsA))) / (reserveA * (10n ** BigInt(decimalsB))));
            const priceB_vs_A = Number((reserveA * (10n ** BigInt(decimalsB))) / (reserveB * (10n ** BigInt(decimalsA))));

            return {
                reserveA,
                reserveB,
                totalSupplyLP,
                priceA_vs_B,
                priceB_vs_A,
            };
        } catch (error) {
            console.error(`[AMMLiquidityPoolManager] Failed to get Uniswap V2 pool state for ${poolAddress}:`, error);
            throw new Error(`Failed to retrieve pool state: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Adds liquidity to a Uniswap V2-like pool via its router.
     * Requires the signer to be set and tokens to be approved for the router.
     * @param poolAddress The address of the AMM pool.
     * @param options Options for adding liquidity.
     * @returns Transaction response.
     * @throws {Error} If signer is not set, pool is not registered/configured correctly, or transaction fails.
     */
    public async addUniswapV2Liquidity(poolAddress: string, options: AddLiquidityOptions): Promise<TransactionResponse> {
        if (!this.signer) {
            throw new Error("Signer not set. Cannot perform transactions.");
        }

        const config = this.getPoolConfig(poolAddress);
        if (!config || config.type !== 'UNISWAP_V2' || !config.routerAddress) {
            throw new Error(`Pool ${poolAddress} not registered, not a UNISWAP_V2 type, or router address missing.`);
        }

        const routerContract = new Contract(config.routerAddress, UNISWAP_V2_ROUTER_ABI, this.signer);

        console.log(`[AMMLiquidityPoolManager] Adding liquidity to ${config.name || poolAddress} via router ${config.routerAddress}...`);
        try {
            // IMPORTANT: ERC-20 tokens (tokenA, tokenB) must be approved for the routerAddress
            // before calling this function. This logic is typically handled externally
            // or by a higher-level transaction orchestrator.
            // Example: await this.approveToken(config.tokenA, config.routerAddress, options.amountADesired);
            // Example: await this.approveToken(config.tokenB, config.routerAddress, options.amountBDesired);

            const tx = await routerContract.addLiquidity(
                config.tokenA,
                config.tokenB,
                options.amountADesired,
                options.amountBDesired,
                options.amountAMin,
                options.amountBMin,
                options.to,
                options.deadline
            );
            return tx;
        } catch (error) {
            console.error(`[AMMLiquidityPoolManager] Failed to add liquidity to ${poolAddress}:`, error);
            throw new Error(`Add liquidity failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Removes liquidity from a Uniswap V2-like pool via its router.
     * Requires the signer to be set and LP tokens to be approved for the router.
     * @param poolAddress The address of the AMM pool.
     * @param options Options for removing liquidity.
     * @returns Transaction response.
     * @throws {Error} If signer is not set, pool is not registered/configured correctly, or transaction fails.
     */
    public async removeUniswapV2Liquidity(poolAddress: string, options: RemoveLiquidityOptions): Promise<TransactionResponse> {
        if (!this.signer) {
            throw new Error("Signer not set. Cannot perform transactions.");
        }

        const config = this.getPoolConfig(poolAddress);
        if (!config || config.type !== 'UNISWAP_V2' || !config.routerAddress || !config.lpToken) {
            throw new Error(`Pool ${poolAddress} not registered, not a UNISWAP_V2 type, or router/LP token address missing.`);
        }

        const routerContract = new Contract(config.routerAddress, UNISWAP_V2_ROUTER_ABI, this.signer);

        console.log(`[AMMLiquidityPoolManager] Removing liquidity from ${config.name || poolAddress} via router ${config.routerAddress}...`);
        try {
            // IMPORTANT: LP tokens must be approved for the routerAddress
            // before calling this function. This logic is typically handled externally.
            // Example: await this.approveToken(config.lpToken, config.routerAddress, options.lpTokenAmount);

            const tx = await routerContract.removeLiquidity(
                config.tokenA,
                config.tokenB,
                options.lpTokenAmount,
                options.amountAMin,
                options.amountBMin,
                options.to,
                options.deadline
            );
            return tx;
        } catch (error) {
            console.error(`[AMMLiquidityPoolManager] Failed to remove liquidity from ${poolAddress}:`, error);
            throw new Error(`Remove liquidity failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Estimates the output amount for a token swap on a Uniswap V2-like router.
     * This is a read-only operation and does not require a signer.
     * @param routerAddress The address of the AMM router.
     * @param amountIn The amount of input token (raw BigInt).
     * @param path The array of token addresses representing the swap path (e.g., [tokenInAddress, tokenOutAddress]).
     * @returns The estimated output amount (raw BigInt).
     * @throws {Error} If the estimation fails.
     */
    public async estimateUniswapV2SwapOutput(routerAddress: string, amountIn: bigint, path: string[]): Promise<bigint> {
        if (!ethers.isAddress(routerAddress)) {
            throw new Error(`Invalid router address: ${routerAddress}`);
        }
        if (path.length < 2) {
            throw new Error("Swap path must contain at least two token addresses (input and output).");
        }
        if (!path.every(ethers.isAddress)) {
            throw new Error("Invalid token address found in swap path.");
        }

        const routerContract = new Contract(routerAddress, UNISWAP_V2_ROUTER_ABI, this.provider);
        try {
            const amounts = await routerContract.getAmountsOut(amountIn, path);
            return amounts[amounts.length - 1]; // The last element in amounts is the output amount
        } catch (error) {
            console.error(`[AMMLiquidityPoolManager] Failed to estimate swap output for path ${path.join('->')} with amount ${amountIn}:`, error);
            throw new Error(`Swap estimation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Executes a token swap on a Uniswap V2-like router.
     * Requires the signer to be set and the input token to be approved for the router.
     * @param routerAddress The address of the AMM router.
     * @param amountIn The exact amount of input token to swap (raw BigInt).
     * @param amountOutMin The minimum amount of output token expected (for slippage control, raw BigInt).
     * @param path The array of token addresses representing the swap path (e.g., [tokenInAddress, tokenOutAddress]).
     * @param to The address to send the output tokens to.
     * @param deadline Unix timestamp by which the transaction must be mined.
     * @returns Transaction response.
     * @throws {Error} If signer is not set, path is invalid, or transaction fails.
     */
    public async executeUniswapV2Swap(
        routerAddress: string,
        amountIn: bigint,
        amountOutMin: bigint,
        path: string[],
        to: string,
        deadline: number
    ): Promise<TransactionResponse> {
        if (!this.signer) {
            throw new Error("Signer not set. Cannot perform transactions.");
        }
        if (!ethers.isAddress(routerAddress)) {
            throw new Error(`Invalid router address: ${routerAddress}`);
        }
        if (path.length < 2) {
            throw new Error("Swap path must contain at least two token addresses (input and output).");
        }
        if (!path.every(ethers.isAddress)) {
            throw new Error("Invalid token address found in swap path.");
        }

        const routerContract = new Contract(routerAddress, UNISWAP_V2_ROUTER_ABI, this.signer);

        console.log(`[AMMLiquidityPoolManager] Executing swap on router ${routerAddress} for path ${path.join('->')}...`);
        try {
            // IMPORTANT: The input token (path[0]) must be approved for the routerAddress
            // before calling this function. This logic is typically handled externally.
            // Example: await this.approveToken(path[0], routerAddress, amountIn);

            const tx = await routerContract.swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                path,
                to,
                deadline
            );
            return tx;
        } catch (error) {
            console.error(`[AMMLiquidityPoolManager] Failed to execute swap on router ${routerAddress}:`, error);
            throw new Error(`Swap execution failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // TODO: Future expansion to support other AMM types (Uniswap V3, Balancer, Curve, etc.)
    // Each would require specific ABIs and potentially different methods for state retrieval,
    // liquidity management, and swaps due to their unique architectures (e.g., concentrated liquidity in V3).
    // Example:
    // public async getUniswapV3PoolState(poolAddress: string): Promise<PoolState> { /* ... */ }
    // public async addUniswapV3Liquidity(poolAddress: string, options: AddLiquidityOptions): Promise<TransactionResponse> { /* ... */ }
}