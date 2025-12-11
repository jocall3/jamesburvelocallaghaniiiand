// src/api/web3/walletConnector.ts

/**
 * This file provides a set of functions to interact with a Web3 wallet
 * injected into the browser window, such as MetaMask. It follows the EIP-1193
 * standard for Ethereum provider interaction.
 */

// Define an interface for the wallet provider based on EIP-1193.
interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] | Record<string, any> }) => Promise<any>;
  on: (eventName: string, listener: (...args: any[]) => void) => void;
  removeListener: (eventName: string, listener: (...args: any[]) => void) => void;
}

/**
 * Defines the structure for the wallet's connection state.
 */
export interface WalletState {
  accounts: string[];
  chainId: string | null;
  isConnected: boolean;
}

// Augment the global Window interface to include the 'ethereum' property
// injected by wallet extensions.
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

/**
 * Retrieves the Ethereum provider from the window object.
 * @returns The Ethereum provider if available, otherwise null.
 */
const getProvider = (): EthereumProvider | null => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum;
  }
  console.warn('Ethereum provider not found. Please install a wallet like MetaMask.');
  return null;
};

/**
 * Represents the initial or disconnected state of the wallet.
 */
export const disconnectedState: WalletState = {
  accounts: [],
  chainId: null,
  isConnected: false,
};

/**
 * Connects to the user's wallet and requests account access.
 * This will trigger a connection prompt from the wallet if the dApp is not yet approved.
 *
 * @returns A promise that resolves to the current WalletState.
 * @throws An error if a wallet provider is not found or if the user rejects the connection.
 */
export const connectWallet = async (): Promise<WalletState> => {
  const provider = getProvider();
  if (!provider) {
    throw new Error('Wallet provider not found. Please install a wallet extension.');
  }

  try {
    // Request account access. This is the method that prompts the user to connect.
    const accounts = await provider.request({ method: 'eth_requestAccounts' });

    if (!accounts || accounts.length === 0) {
      // This case is unlikely if the request succeeds, but it's good practice to handle.
      return disconnectedState;
    }
    
    // Get the current chain ID.
    const chainId = await provider.request({ method: 'eth_chainId' });

    return {
      accounts,
      chainId,
      isConnected: true,
    };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    // Re-throw the error so the UI layer can handle it, e.g., show a message to the user.
    throw error;
  }
};

/**
 * Retrieves the current connection state without prompting the user to connect.
 * This is useful for checking if the dApp is already connected on page load.
 *
 * @returns A promise that resolves to the current WalletState.
 */
export const getCurrentWalletState = async (): Promise<WalletState> => {
  const provider = getProvider();
  if (!provider) {
    return disconnectedState;
  }

  try {
    // `eth_accounts` returns an array of accounts if connected, or an empty array if not.
    // It does not trigger a connection prompt.
    const accounts = await provider.request({ method: 'eth_accounts' });

    if (!accounts || accounts.length === 0) {
      return disconnectedState;
    }

    const chainId = await provider.request({ method: 'eth_chainId' });

    return {
      accounts,
      chainId,
      isConnected: true,
    };
  } catch (error) {
    console.error('Could not get current wallet state:', error);
    return disconnectedState;
  }
};

/**
 * Sets up event listeners for wallet events like account or chain changes.
 *
 * @param onAccountsChanged - Callback function to handle when the user switches accounts.
 * @param onChainChanged - Callback function to handle when the user switches networks.
 * @returns A cleanup function to remove the listeners, which should be called
 *          when the component unmounts or the listeners are no longer needed.
 */
export const setupWalletListeners = (
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void
): (() => void) => {
  const provider = getProvider();
  if (!provider) {
    // Return a no-op cleanup function if there's no provider.
    return () => {};
  }

  const handleAccountsChanged = (accounts: string[]) => {
    console.log('Wallet accounts changed:', accounts);
    onAccountsChanged(accounts);
  };

  const handleChainChanged = (chainId: string) => {
    console.log('Wallet chain changed:', chainId);
    // It is often recommended to reload the page on chain change.
    // window.location.reload();
    onChainChanged(chainId);
  };

  provider.on('accountsChanged', handleAccountsChanged);
  provider.on('chainChanged', handleChainChanged);

  // Return a cleanup function to prevent memory leaks.
  const cleanup = () => {
    provider.removeListener('accountsChanged', handleAccountsChanged);
    provider.removeListener('chainChanged', handleChainChanged);
  };

  return cleanup;
};