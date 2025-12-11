export type Address = string;
export type HexString = string;

/**
 * Represents a blockchain network identifier.
 */
export enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Polygon = 137,
  PolygonMumbai = 80001,
  Avalanche = 43114,
  AvalancheFuji = 43113,
  BSC = 56,
  BSCTestnet = 97,
  Localhost = 31337
}

/**
 * Standard interface for an ERC-20 compatible token definition.
 */
export interface TokenDefinition {
  /**
   * The checksummed address of the token contract.
   */
  address: Address;
  
  /**
   * The chain ID where this token exists.
   */
  chainId: ChainId;
  
  /**
   * The symbol of the token (e.g., "USDC", "WETH").
   */
  symbol: string;
  
  /**
   * The name of the token (e.g., "USD Coin", "Wrapped Ether").
   */
  name: string;
  
  /**
   * The number of decimal places used by the token.
   */
  decimals: number;
  
  /**
   * Optional URL to the token's logo image.
   */
  logoURI?: string;
  
  /**
   * Optional list of tags associated with the token (e.g., "stablecoin", "defi").
   */
  tags?: string[];
}

/**
 * Represents a Non-Fungible Token (NFT) asset definition (ERC-721/ERC-1155).
 */
export interface NFTAssetDefinition {
  /**
   * The contract address of the NFT collection.
   */
  contractAddress: Address;
  
  /**
   * The unique identifier for the specific asset within the collection.
   */
  tokenId: string;
  
  /**
   * The standard supported by this asset.
   */
  standard: 'ERC721' | 'ERC1155';
  
  /**
   * The chain ID where this asset exists.
   */
  chainId: ChainId;
  
  /**
   * Metadata URI associated with the token.
   */
  tokenURI?: string;
}

/**
 * Aggregate type for any blockchain-based asset.
 */
export type BlockchainAsset = TokenDefinition | NFTAssetDefinition;

/**
 * Configuration for known contract addresses within the system.
 */
export interface ContractAddressRegistry {
  [chainId: number]: {
    /**
     * The address of the primary protocol contract.
     */
    protocolAddress: Address;
    
    /**
     * Address for the reward distribution contract (if applicable).
     */
    rewardsDistributor?: Address;
    
    /**
     * Address for the governance token contract.
     */
    governanceToken?: Address;
    
    /**
     * Address for the shop-with-points adapter contract.
     */
    shopWithPointsAdapter?: Address;
    
    /**
     * Registry for identity verification.
     */
    identityRegistry?: Address;
  };
}

/**
 * Represents a balance of a specific asset for a user.
 */
export interface AssetBalance {
  asset: BlockchainAsset;
  
  /**
   * The raw balance as a string to avoid precision loss (BigInt representation).
   */
  balanceRaw: string;
  
  /**
   * The formatted balance (e.g., "10.5").
   */
  balanceFormatted: string;
}

/**
 * Supported native currency symbols.
 */
export type NativeCurrencySymbol = 'ETH' | 'MATIC' | 'AVAX' | 'BNB';

/**
 * Definition for a network's native currency.
 */
export interface NativeCurrency {
  name: string;
  symbol: NativeCurrencySymbol;
  decimals: number;
}