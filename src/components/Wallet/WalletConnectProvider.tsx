```typescript
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Web3Provider } from '@ethersproject/providers';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';

interface WalletConnectContextType {
  connector: WalletConnect | null;
  isConnected: boolean;
  chainId: number | null;
  account: string | null;
  web3Provider: Web3Provider | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
  sendTransaction: (transaction: any) => Promise<string | null>; // Adjust type as necessary
}

const WalletConnectContext = createContext<WalletConnectContextType | undefined>(
  undefined
);

interface WalletConnectProviderProps {
  children: ReactNode;
  infuraId: string;
}

export const WalletConnectProvider: React.FC<WalletConnectProviderProps> = ({
  children,
  infuraId,
}) => {
  const [connector, setConnector] = useState<WalletConnect | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [web3Provider, setWeb3Provider] = useState<Web3Provider | null>(null);

  const initializeConnector = useCallback(() => {
    const newConnector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org', // Required
      qrcodeModal: QRCodeModal,
    });
    setConnector(newConnector);
    return newConnector;
  }, []);

  useEffect(() => {
    const conn = connector || initializeConnector();

    const handleConnect = async (error: Error | null, payload?: { params: any[] }) => {
      if (error) {
        console.error('WalletConnect Connect Error:', error);
        return;
      }
  
      const { accounts, chainId } = payload?.params[0];
      setChainId(chainId);
      setAccount(accounts[0]);
      setIsConnected(true);
      setWeb3Provider(new Web3Provider(conn));
    };

    const handleSessionUpdate = (error: Error | null, payload?: { params: any[] }) => {
        if (error) {
          console.error('WalletConnect Session Update Error:', error);
          return;
        }
        const { accounts, chainId } = payload?.params[0];

        setChainId(chainId);
        setAccount(accounts[0]);
    };

    const handleDisconnect = (error: Error | null) => {
      if (error) {
        console.error('WalletConnect Disconnect Error:', error);
        return;
      }

      setIsConnected(false);
      setChainId(null);
      setAccount(null);
      setWeb3Provider(null);
    };
    

    if (conn.session.connected) {
      setChainId(conn.chainId);
      setAccount(conn.accounts[0]);
      setIsConnected(true);
      setWeb3Provider(new Web3Provider(conn));
    }
    

    conn.on('connect', handleConnect);
    conn.on('session_update', handleSessionUpdate);
    conn.on('disconnect', handleDisconnect);

    return () => {
      conn.off('connect', handleConnect);
      conn.off('session_update', handleSessionUpdate);
      conn.off('disconnect', handleDisconnect);
    };
  }, [connector, initializeConnector]);


  const connectWallet = useCallback(async () => {
    if (!connector) return;
    try {
      if (!connector.session.connected) {
        await connector.createSession();
      }
    } catch (error) {
      console.error('WalletConnect Connection Error:', error);
    }
  }, [connector]);


  const disconnectWallet = useCallback(async () => {
    if (!connector) return;
    try {
      await connector.killSession();
      setIsConnected(false);
      setChainId(null);
      setAccount(null);
      setWeb3Provider(null);
    } catch (error) {
      console.error('WalletConnect Disconnection Error:', error);
    }
  }, [connector]);

  const signMessage = useCallback(
    async (message: string) => {
      if (!connector || !account) return null;
      try {
        const result = await connector.signPersonalMessage([message, account]);
        return result;
      } catch (error) {
        console.error('WalletConnect Sign Message Error:', error);
        return null;
      }
    },
    [connector, account]
  );

  const sendTransaction = useCallback(
    async (transaction: any) => {
      if (!connector || !account) return null;
      try {
        const result = await connector.sendTransaction({
          ...transaction,
          from: account,
        });
        return result;
      } catch (error) {
        console.error('WalletConnect Send Transaction Error:', error);
        return null;
      }
    },
    [connector, account]
  );

  const value: WalletConnectContextType = {
    connector,
    isConnected,
    chainId,
    account,
    web3Provider,
    connectWallet,
    disconnectWallet,
    signMessage,
    sendTransaction,
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
};

export const useWalletConnect = (): WalletConnectContextType => {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error(
      'useWalletConnect must be used within a WalletConnectProvider'
    );
  }
  return context;
};
```