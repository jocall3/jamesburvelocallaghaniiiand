import React, { useState, useEffect } from 'react';

// Interfaces defining the structure of Digital Assets
interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  currentPrice: number;
  value: number;
  change24h: number;
}

interface NFTAsset {
  id: string;
  tokenId: string;
  name: string;
  collection: string;
  imageUrl: string;
  floorPrice: number;
}

interface VaultSummary {
  totalValue: number;
  currency: string;
}

const DigitalVaultView: React.FC = () => {
  // State management for assets and UI
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);
  const [nftAssets, setNftAssets] = useState<NFTAsset[]>([]);
  const [summary, setSummary] = useState<VaultSummary>({ totalValue: 0, currency: 'USD' });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'crypto' | 'nfts'>('crypto');

  // Effect to fetch vault data (simulating API call)
  useEffect(() => {
    const fetchVaultData = async () => {
      setIsLoading(true);
      try {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock Data Response
        const mockCrypto: CryptoAsset[] = [
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', balance: 0.45, currentPrice: 42100.50, value: 18945.22, change24h: 2.5 },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', balance: 3.2, currentPrice: 2250.00, value: 7200.00, change24h: -1.2 },
          { id: 'solana', symbol: 'SOL', name: 'Solana', balance: 150, currentPrice: 98.50, value: 14775.00, change24h: 5.8 },
          { id: 'usdc', symbol: 'USDC', name: 'USD Coin', balance: 5000, currentPrice: 1.00, value: 5000.00, change24h: 0.01 },
        ];

        const mockNFTs: NFTAsset[] = [
          { id: 'nft1', tokenId: '#1234', name: 'Cosmic Cube', collection: 'Galaxy Explorers', imageUrl: 'https://via.placeholder.com/200?text=NFT+Art', floorPrice: 1.2 },
          { id: 'nft2', tokenId: '#888', name: 'Pixel Punk', collection: 'Retro Arts', imageUrl: 'https://via.placeholder.com/200?text=Punk', floorPrice: 0.5 },
          { id: 'nft3', tokenId: '#007', name: 'Golden Ticket', collection: 'Membership Club', imageUrl: 'https://via.placeholder.com/200?text=Pass', floorPrice: 2.8 },
        ];

        setCryptoAssets(mockCrypto);
        setNftAssets(mockNFTs);
        setSummary({
          totalValue: mockCrypto.reduce((acc, curr) => acc + curr.value, 0),
          currency: 'USD'
        });

      } catch (error) {
        console.error("Failed to fetch vault data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaultData();
  }, []);

  // Currency formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>Syncing Digital Vault...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
            <h1 style={styles.title}>Digital Vault</h1>
            <p style={styles.subtitle}>Securely manage your cryptocurrencies and digital collectibles.</p>
        </div>
      </header>

      {/* Portfolio Summary Card */}
      <section style={styles.summaryCard}>
        <div style={styles.summaryContent}>
            <h2 style={styles.summaryTitle}>Total Portfolio Value</h2>
            <div style={styles.totalValue}>{formatCurrency(summary.totalValue)}</div>
            <div style={styles.summarySubtext}>+2.4% (24h)</div>
        </div>
        <div style={styles.actions}>
          <button style={styles.actionButton}>Deposit</button>
          <button style={styles.actionButton}>Withdraw</button>
          <button style={styles.actionButtonPrimary}>Trade</button>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabs}>
            <button 
            style={activeTab === 'crypto' ? styles.activeTab : styles.tab} 
            onClick={() => setActiveTab('crypto')}
            >
            Cryptocurrencies ({cryptoAssets.length})
            </button>
            <button 
            style={activeTab === 'nfts' ? styles.activeTab : styles.tab} 
            onClick={() => setActiveTab('nfts')}
            >
            NFTs & Collectibles ({nftAssets.length})
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={styles.content}>
        {activeTab === 'crypto' && (
          <div style={styles.assetList}>
             <div style={styles.tableHeader}>
                <span style={{flex: 2}}>Asset</span>
                <span style={{flex: 1, textAlign: 'right'}}>Price</span>
                <span style={{flex: 1, textAlign: 'right'}}>Balance</span>
                <span style={{flex: 1, textAlign: 'right'}}>Value</span>
             </div>
            {cryptoAssets.map((asset) => (
              <div key={asset.id} style={styles.assetRow}>
                <div style={{...styles.assetInfo, flex: 2}}>
                  <div style={styles.assetSymbol}>{asset.symbol}</div>
                  <div style={styles.assetName}>{asset.name}</div>
                </div>
                <div style={{...styles.assetPrice, flex: 1}}>
                    <div>{formatCurrency(asset.currentPrice)}</div>
                    <div style={{...styles.changeText, color: asset.change24h >= 0 ? '#10b981' : '#ef4444'}}>
                        {asset.change24h > 0 ? '+' : ''}{asset.change24h}%
                    </div>
                </div>
                <div style={{...styles.assetBalance, flex: 1}}>
                  {asset.balance} {asset.symbol}
                </div>
                <div style={{...styles.assetValue, flex: 1}}>
                  {formatCurrency(asset.value)}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'nfts' && (
          <div style={styles.nftGrid}>
            {nftAssets.map((nft) => (
              <div key={nft.id} style={styles.nftCard}>
                <div style={styles.nftImageContainer}>
                    <img src={nft.imageUrl} alt={nft.name} style={styles.nftImage} />
                </div>
                <div style={styles.nftDetails}>
                  <h3 style={styles.nftName}>{nft.name}</h3>
                  <p style={styles.nftCollection}>{nft.collection}</p>
                  <div style={styles.nftFooter}>
                    <span style={styles.nftTokenId}>{nft.tokenId}</span>
                    <span style={styles.nftPrice}>Floor: {nft.floorPrice} ETH</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Add New NFT Placeholder */}
            <div style={{...styles.nftCard, ...styles.addNftCard}}>
                <span style={styles.addNftText}>+ Import NFT</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles object simulating CSS-in-JS or CSS Modules
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '40px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    maxWidth: '1280px',
    margin: '0 auto',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    color: '#1e293b',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.25rem',
    color: '#64748b',
    fontWeight: 500,
  },
  header: {
    marginBottom: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '1.1rem',
    margin: 0,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    marginBottom: '40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #e2e8f0',
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  summaryTitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
    marginBottom: '8px',
  },
  totalValue: {
    fontSize: '3rem',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1,
    marginBottom: '8px',
  },
  summarySubtext: {
    color: '#10b981',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  actionButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: 'white',
    color: '#334155',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '1rem',
    transition: 'background-color 0.2s',
  },
  actionButtonPrimary: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '1rem',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
    transition: 'background-color 0.2s',
  },
  tabsContainer: {
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '24px',
  },
  tabs: {
    display: 'flex',
    gap: '32px',
  },
  tab: {
    padding: '12px 4px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#64748b',
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  activeTab: {
    padding: '12px 4px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid #2563eb',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#2563eb',
  },
  content: {
    minHeight: '400px',
  },
  assetList: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    padding: '16px 24px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
  },
  assetRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.1s',
  },
  assetInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  assetSymbol: {
    fontWeight: 700,
    fontSize: '1.125rem',
    color: '#0f172a',
  },
  assetName: {
    color: '#64748b',
    fontSize: '0.875rem',
    marginTop: '2px',
  },
  assetPrice: {
    textAlign: 'right',
    fontWeight: 500,
  },
  changeText: {
    fontSize: '0.875rem',
    marginTop: '2px',
    fontWeight: 600,
  },
  assetBalance: {
    textAlign: 'right',
    color: '#334155',
    fontWeight: 500,
  },
  assetValue: {
    textAlign: 'right',
    fontWeight: 700,
    color: '#0f172a',
  },
  nftGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '24px',
  },
  nftCard: {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
  },
  nftImageContainer: {
    height: '240px',
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  nftImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  nftDetails: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  nftName: {
    margin: '0 0 4px 0',
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  nftCollection: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.875rem',
  },
  nftFooter: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nftTokenId: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
  },
  nftPrice: {
    fontWeight: 600,
    color: '#0f172a',
    fontSize: '0.9rem',
  },
  addNftCard: {
    border: '2px dashed #cbd5e1',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '340px',
  },
  addNftText: {
    color: '#64748b',
    fontWeight: 600,
    fontSize: '1.125rem',
  },
};

export default DigitalVaultView;