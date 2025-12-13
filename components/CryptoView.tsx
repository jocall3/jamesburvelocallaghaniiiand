```typescript
import React, { useContext, useState, useMemo, useCallback } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { CryptoAsset, NFTAsset, EIP6963ProviderDetail } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

// The James Burvel O'Callaghan III Code - CryptoView Component

// --- A. Entities & Use Cases ---
// A.1 Company: BurvelTech Financial - Use Case: AI-driven portfolio management
// A.2 Company: O'Callaghan Crypto - Use Case: Secure virtual card issuance
// A.3 Company: JBO Investments - Use Case: Cross-chain DeFi bridging

// --- B. Data Structures & Types ---

// B.1 Enhanced AI Insight Interface
interface JBO_A1_AIInsight {
    JBO_A1a_id: string;
    JBO_A1b_type: 'opportunity' | 'warning' | 'neutral';
    JBO_A1c_message: string;
    JBO_A1d_confidence: number;
    JBO_A1e_timestamp: string;
    JBO_A1f_source: string;
    JBO_A1g_relatedAsset?: string;
    JBO_A1h_urgency: 'high' | 'medium' | 'low';
}

// B.2 Refined Market Sentiment Interface
interface JBO_A2_MarketSentiment {
    JBO_A2a_bullish: number;
    JBO_A2b_bearish: number;
    JBO_A2c_neutral: number;
    JBO_A2d_trend: 'up' | 'down' | 'stable' | 'sideways';
    JBO_A2e_volatility: 'high' | 'medium' | 'low';
    JBO_A2f_dominantAsset?: string;
}

// B.3 Expanded AI Chat Message Interface
interface JBO_A3_AIChatMessage {
    JBO_A3a_id: string;
    JBO_A3b_sender: 'user' | 'system';
    JBO_A3c_text: string;
    JBO_A3d_timestamp: Date;
    JBO_A3e_metadata?: {
        JBO_A3e1_intent: string;
        JBO_A3e2_entities: string[];
        JBO_A3e3_sentimentScore: number;
    };
}

// B.4 Detailed Portfolio Analytics Interface
interface JBO_A4_PortfolioAnalytics {
    JBO_A4a_totalValue: number;
    JBO_A4b_riskScore: number;
    JBO_A4c_diversificationIndex: number;
    JBO_A4d_projectedYield: number;
    JBO_A4e_aiConfidence: number;
    JBO_A4f_sharpeRatio: number;
    JBO_A4g_sortinoRatio: number;
    JBO_A4h_beta: number;
    JBO_A4i_volatility: number;
    JBO_A4j_allocationByAsset: { [asset: string]: number };
    JBO_A4k_allocationByBlockchain: { [blockchain: string]: number };
}

// B.5 Enhanced Crypto Asset Interface
interface JBO_A5_CryptoAsset extends CryptoAsset {
    JBO_A5a_blockchain: string;
    JBO_A5b_protocol: string;
    JBO_A5c_apy: number;
    JBO_A5d_liquidity: number;
    JBO_A5e_smartContractAddress: string;
}

// --- C. UI Components ---

// C.1 AI Status Badge Component
const JBO_B1_AIStatusBadge: React.FC<{ JBO_B1a_status: 'active' | 'learning' | 'processing' | 'idle' }> = ({ JBO_B1a_status }) => {const JBO_B1b_colors = {active: 'bg-green-500', learning: 'bg-blue-500', processing: 'bg-purple-500', idle: 'bg-gray-500'}; return (<div className="flex items-center space-x-2 bg-gray-900/80 px-3 py-1 rounded-full border border-gray-700 shadow-inner"><span className={`w-2 h-2 rounded-full animate-pulse ${JBO_B1b_colors[JBO_B1a_status]}`}></span><span className="text-xs font-mono text-gray-300 uppercase tracking-wider">Neural Net: {JBO_B1a_status}</span></div>);};

// C.2 Confidence Meter Component
const JBO_B2_ConfidenceMeter: React.FC<{ JBO_B2a_score: number }> = ({ JBO_B2a_score }) => (<div className="w-full bg-gray-700 rounded-full h-1.5 mt-2"><div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${JBO_B2a_score}%` }}></div></div>);

// C.3 Tab Button Component
const JBO_B3_TabButton: React.FC<{ JBO_B3a_active: boolean; JBO_B3b_onClick: () => void; JBO_B3c_label: string }> = ({ JBO_B3a_active, JBO_B3b_onClick, JBO_B3c_label }) => (<button onClick={JBO_B3b_onClick} className={`px-6 py-3 text-sm font-bold tracking-wide transition-all duration-300 border-b-2 ${JBO_B3a_active ? 'border-cyan-500 text-white bg-gray-800/50' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'}`}>{JBO_B3c_label}</button>);

// C.4 NFT Card Component
const JBO_B4_NFTCard: React.FC<{ JBO_B4a_nft: NFTAsset }> = ({ JBO_B4a_nft }) => (<div className="group bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1"><div className="relative aspect-square overflow-hidden"><img src={JBO_B4a_nft.imageUrl} alt={JBO_B4a_nft.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /><div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10"><span className="text-xs font-bold text-white">#{JBO_B4a_nft.id.substring(0, 4)}</span></div></div><div className="p-5"><h3 className="text-lg font-bold text-white truncate">{JBO_B4a_nft.name}</h3><p className="text-xs text-gray-500 font-mono truncate mb-4">{JBO_B4a_nft.contractAddress}</p><div className="space-y-3"><div className="flex justify-between items-center text-sm"><span className="text-gray-400">Floor Price</span><span className="text-white font-medium">0.45 ETH</span></div><div className="flex justify-between items-center text-sm"><span className="text-gray-400">AI Valuation</span><span className="text-cyan-400 font-bold">0.52 ETH</span></div><div className="w-full bg-gray-700 rounded-full h-1 mt-2"><div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1 rounded-full" style={{ width: '75%' }}></div></div><p className="text-[10px] text-gray-500 text-right">High Liquidity Demand</p></div></div></div>);

// --- D. CryptoView Component ---

const JBO_C1_CryptoView: React.FC = () => {
    const JBO_C1a_context = useContext(DataContext);
    if (!JBO_C1a_context) throw new Error("CryptoView must be within a DataProvider.");
    const { cryptoAssets, walletInfo, virtualCard, connectWallet, disconnectWallet, detectedProviders, issueCard, buyCrypto, nftAssets } = JBO_C1a_context;
    const [JBO_C1b_activeTab, JBO_C1b1_setActiveTab] = useState<'dashboard' | 'intelligence' | 'nft-valuation' | 'defi-bridge'>('dashboard');
    const [JBO_C1c_isIssuingCard, JBO_C1c1_setIsIssuingCard] = useState(false);
    const [JBO_C1d_isWalletModalOpen, JBO_C1d1_setIsWalletModalOpen] = useState(false);
    const [JBO_C1e_isStripeModalOpen, JBO_C1e1_setStripeModalOpen] = useState(false);
    const [JBO_C1f_buyAmount, JBO_C1f1_setBuyAmount] = useState('1000');
    const [JBO_C1g_chatInput, JBO_C1g1_setChatInput] = useState('');
    const [JBO_C1h_chatHistory, JBO_C1h1_setChatHistory] = useState<JBO_A3_AIChatMessage[]>([{ JBO_A3a_id: '1', JBO_A3b_sender: 'system', JBO_A3c_text: 'Welcome to the Enterprise Crypto OS. I am your dedicated AI financial architect. How can I optimize your portfolio today?', JBO_A3d_timestamp: new Date() }]);

    const JBO_C1i_portfolioAnalytics: JBO_A4_PortfolioAnalytics = useMemo(() => {
        const JBO_C1i1_totalValue = cryptoAssets.reduce((acc, asset) => acc + asset.value, 0);
        const JBO_C1i2_riskScore = Math.min(100, Math.max(0, 100 - (JBO_C1i1_totalValue / 1000)));
        const JBO_C1i3_diversificationIndex = cryptoAssets.length * 12.5;
        const JBO_C1i4_sharpeRatio = 0.8;
        const JBO_C1i5_sortinoRatio = 1.2;
        const JBO_C1i6_beta = 0.9;
        const JBO_C1i7_volatility = 0.05;
        const JBO_C1i8_allocationByAsset = cryptoAssets.reduce((acc: { [key: string]: number }, asset) => { acc[asset.name] = asset.value / JBO_C1i1_totalValue; return acc; }, {});
        const JBO_C1i9_allocationByBlockchain = cryptoAssets.reduce((acc: { [key: string]: number }, asset: JBO_A5_CryptoAsset) => { acc[asset.JBO_A5a_blockchain] = (acc[asset.JBO_A5a_blockchain] || 0) + asset.value / JBO_C1i1_totalValue; return acc; }, {});

        return {
            JBO_A4a_totalValue: JBO_C1i1_totalValue,
            JBO_A4b_riskScore: JBO_C1i2_riskScore,
            JBO_A4c_diversificationIndex: JBO_C1i3_diversificationIndex,
            JBO_A4d_projectedYield: JBO_C1i1_totalValue * 0.052,
            JBO_A4e_aiConfidence: 87 + (cryptoAssets.length % 10),
            JBO_A4f_sharpeRatio: JBO_C1i4_sharpeRatio,
            JBO_A4g_sortinoRatio: JBO_C1i5_sortinoRatio,
            JBO_A4h_beta: JBO_C1i6_beta,
            JBO_A4i_volatility: JBO_C1i7_volatility,
            JBO_A4j_allocationByAsset: JBO_C1i8_allocationByAsset,
            JBO_A4k_allocationByBlockchain: JBO_C1i9_allocationByBlockchain,
        };
    }, [cryptoAssets]);

    const JBO_C1j_aiInsights: JBO_A1_AIInsight[] = useMemo(() => [
        { JBO_A1a_id: '1', JBO_A1b_type: 'opportunity', JBO_A1c_message: 'ETH accumulation detected in whale wallets. Consider increasing position.', JBO_A1d_confidence: 92, JBO_A1e_timestamp: '2m ago', JBO_A1f_source: 'Whale Alert API', JBO_A1g_relatedAsset: 'ETH', JBO_A1h_urgency: 'medium' },
        { JBO_A1a_id: '2', JBO_A1b_type: 'warning', JBO_A1c_message: 'High gas fees predicted in the next 4 hours due to NFT minting event.', JBO_A1d_confidence: 85, JBO_A1e_timestamp: '15m ago', JBO_A1f_source: 'GasNow API', JBO_A1h_urgency: 'high' },
        { JBO_A1a_id: '3', JBO_A1b_type: 'neutral', JBO_A1c_message: 'Portfolio rebalancing recommended to maintain 60/40 split.', JBO_A1d_confidence: 78, JBO_A1e_timestamp: '1h ago', JBO_A1f_source: 'BurvelTech AI Engine', JBO_A1h_urgency: 'low' }
    ], []);

    const JBO_C1k_marketSentiment: JBO_A2_MarketSentiment = useMemo(() => ({
        JBO_A2a_bullish: 65,
        JBO_A2b_bearish: 25,
        JBO_A2c_neutral: 10,
        JBO_A2d_trend: 'up',
        JBO_A2e_volatility: 'medium',
        JBO_A2f_dominantAsset: 'ETH'
    }), []);

    const JBO_C1l_handleIssueCard = useCallback(() => {JBO_C1c1_setIsIssuingCard(true); setTimeout(() => {issueCard(); JBO_C1c1_setIsIssuingCard(false);}, 3000);}, [issueCard]);

    const JBO_C1m_handleConnectProvider = useCallback((provider: EIP6963ProviderDetail) => {connectWallet(provider); JBO_C1d1_setIsWalletModalOpen(false);}, [connectWallet]);

    const JBO_C1n_handleBuyCrypto = useCallback(() => {buyCrypto(parseFloat(JBO_C1f_buyAmount), 'ETH'); JBO_C1e1_setStripeModalOpen(false);}, [buyCrypto, JBO_C1f_buyAmount]);

    const JBO_C1o_handleChatSubmit = useCallback((e: React.FormEvent) => {e.preventDefault(); if (!JBO_C1g_chatInput.trim()) return; const JBO_C1o1_userMsg: JBO_A3_AIChatMessage = { JBO_A3a_id: Date.now().toString(), JBO_A3b_sender: 'user', JBO_A3c_text: JBO_C1g_chatInput, JBO_A3d_timestamp: new Date() }; JBO_C1h1_setChatHistory(prev => [...prev, JBO_C1o1_userMsg]); JBO_C1g1_setChatInput(''); setTimeout(() => {const JBO_C1o2_aiMsg: JBO_A3_AIChatMessage = { JBO_A3a_id: (Date.now() + 1).toString(), JBO_A3b_sender: 'system', JBO_A3c_text: `Analysis complete. Based on your current holdings of ${cryptoAssets.length} assets and a risk score of ${JBO_C1i_portfolioAnalytics.JBO_A4b_riskScore.toFixed(1)}, I recommend holding your current positions. The market sentiment is currently ${JBO_C1k_marketSentiment.JBO_A2d_trend.toUpperCase()}.`, JBO_A3d_timestamp: new Date() }; JBO_C1h1_setChatHistory(prev => [...prev, JBO_C1o2_aiMsg]);}, 1500);}, [JBO_C1g_chatInput, cryptoAssets.length, JBO_C1i_portfolioAnalytics, JBO_C1k_marketSentiment]);

    const JBO_C1p_shortenAddress = useCallback((address: string) => `${address.substring(0, 8)}...${address.substring(address.length - 6)}`, []);

    const JBO_C1q_renderWalletModal = useCallback(() => {
        if (!JBO_C1d_isWalletModalOpen) return null;
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md" onClick={() => JBO_C1d1_setIsWalletModalOpen(false)}>
                <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-gray-800 bg-gray-800/50">
                        <h3 className="font-bold text-xl text-white tracking-tight">Secure Connection Protocol</h3>
                        <p className="text-xs text-gray-400 mt-1">Select an EIP-6963 compatible provider to initialize handshake.</p>
                    </div>
                    <div className="p-6 flex-grow flex flex-col gap-4">
                        {detectedProviders.length > 0 ? (
                            detectedProviders.map((provider) => (
                                <button
                                    key={provider.info.uuid}
                                    onClick={() => JBO_C1m_handleConnectProvider(provider)}
                                    className="group flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 hover:border-cyan-500 transition-all duration-300"
                                >
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-gray-900 p-1 mr-4 border border-gray-600 group-hover:border-cyan-400">
                                            <img src={provider.info.icon} alt={provider.info.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-white font-bold block">{provider.info.name}</span>
                                            <span className="text-xs text-gray-500">Detected via EIP-6963</span>
                                        </div>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                                <p className="font-mono">No providers detected.</p>
                                <p className="text-xs mt-2">Install MetaMask or similar to proceed.</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-950 text-center border-t border-gray-800">
                        <button onClick={() => JBO_C1d1_setIsWalletModalOpen(false)} className="text-gray-500 hover:text-white text-sm font-medium transition-colors">Abort Connection</button>
                    </div>
                </div>
            </div>
        );
    }, [JBO_C1d_isWalletModalOpen, JBO_C1m_handleConnectProvider, detectedProviders]);

    const JBO_C1r_renderStripeModal = useCallback(() => {
        if (!JBO_C1e_isStripeModalOpen) return null;
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-lg" onClick={() => JBO_C1e1_setStripeModalOpen(false)}>
                <div className="bg-gray-900 rounded-2xl shadow-[0_0_50px_rgba(124,58,237,0.15)] max-w-lg w-full border border-gray-700 flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="p-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-t-2xl border-b border-gray-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg width="100" height="100" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
                        </div>
                        <h3 className="font-bold text-white text-2xl">Fiat-to-Crypto Bridge</h3>
                        <p className="text-purple-400 text-sm mt-1 font-mono">SECURE GATEWAY // STRIPE ENCRYPTED</p>
                        <div className="mt-6 flex items-baseline">
                            <span className="text-4xl font-bold text-white">${parseFloat(JBO_C1f_buyAmount).toFixed(2)}</span>
                            <span className="ml-2 text-gray-400">USD</span>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Card Information</label>
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 flex items-center justify-between">
                                <span className="text-white font-mono text-lg tracking-widest">**** **** **** 4242</span>
                                <div className="flex space-x-2">
                                    <div className="w-8 h-5 bg-gray-600 rounded"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="flex-1 space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Expiry</label>
                                <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                    <span className="text-white font-mono">12/25</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">CVC / CVV</label>
                                <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                    <span className="text-white font-mono">•••</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                                <div>
                                    <p className="text-xs text-purple-300 font-bold">AI FRAUD DETECTION ACTIVE</p>
                                    <p className="text-xs text-purple-400/70 mt-1">Transaction is being monitored by neural security layer.</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={JBO_C1n_handleBuyCrypto} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                            Confirm Transaction
                        </button>
                    </div>
                </div>
            </div>
        );
    }, [JBO_C1e_isStripeModalOpen, JBO_C1f_buyAmount, JBO_C1n_handleBuyCrypto]);

    const JBO_C1s_enhancedCryptoAssets: JBO_A5_CryptoAsset[] = useMemo(() => {
        return cryptoAssets.map((asset, index) => ({
            ...asset,
            JBO_A5a_blockchain: ['Ethereum', 'Binance Smart Chain', 'Polygon'][index % 3],
            JBO_A5b_protocol: ['ERC-20', 'BEP-20', 'Polygon PoS'][index % 3],
            JBO_A5c_apy: Math.random() * 0.1,
            JBO_A5d_liquidity: Math.random() * 1000000,
            JBO_A5e_smartContractAddress: `0x${Math.random().toString(36).substring(2, 15)}`
        }));
    }, [cryptoAssets]);

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-cyan-500/30">
            <div className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 px-6 py-4">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <span className="text-white font-bold text-xl">Î</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">NEXUS <span className="text-cyan-400">OS</span></h1>
                            <p className="text-xs text-gray-500 font-mono">ENTERPRISE WEB3 ENVIRONMENT v4.2.0 - The James Burvel O'Callaghan III Code</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-gray-400">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                <span>GAS: 12 GWEI</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                <span>ETH: $2,450.21</span>
                            </div>
                        </div>

                        {walletInfo ? (
                            <div className="flex items-center gap-3 bg-gray-800 rounded-full pl-4 pr-2 py-1.5 border border-gray-700">
                                <div className="flex flex-col items-end mr-2">
                                    <span className="text-xs font-bold text-white">{walletInfo.balance.toFixed(4)} ETH</span>
                                    <span className="text-[10px] text-gray-400 font-mono">{JBO_C1p_shortenAddress(walletInfo.address)}</span>
                                </div>
                                <button onClick={disconnectWallet} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-full transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => JBO_C1d1_setIsWalletModalOpen(true)}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold py-2 px-6 rounded-full shadow-lg shadow-cyan-500/20 transition-all"
                            >
                                Connect Wallet
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-[1920px] mx-auto p-6 lg:p-8 space-y-8">
                <div className="flex overflow-x-auto border-b border-gray-800 scrollbar-hide">
                    <JBO_B3_TabButton JBO_B3a_active={JBO_C1b_activeTab === 'dashboard'} JBO_B3b_onClick={() => JBO_C1b1_setActiveTab('dashboard')} JBO_B3c_label="COMMAND CENTER" />
                    <JBO_B3_TabButton JBO_B3a_active={JBO_C1b_activeTab === 'intelligence'} JBO_B3b_onClick={() => JBO_C1b1_setActiveTab('intelligence')} JBO_B3c_label="AI INTELLIGENCE" />
                    <JBO_B3_TabButton JBO_B3a_active={JBO_C1b_activeTab === 'nft-valuation'} JBO_B3b_onClick={() => JBO_C1b1_setActiveTab('nft-valuation')} JBO_B3c_label="ASSET VALUATION" />
                    <JBO_B3_TabButton JBO_B3a_active={JBO_C1b_activeTab === 'defi-bridge'} JBO_B3b_onClick={() => JBO_C1b1_setActiveTab('defi-bridge')} JBO_B3c_label="DEFI BRIDGE" />
                </div>

                {JBO_C1b_activeTab === 'dashboard' && (
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card title="Total Net Worth" className="border-t-4 border-t-cyan-500">
                                    <div className="mt-2">
                                        <h3 className="text-3xl font-bold text-white">${JBO_C1i_portfolioAnalytics.JBO_A4a_totalValue.toLocaleString()}</h3>
                                        <div className="flex items-center mt-2 text-green-400 text-sm font-bold">
                                            <span>â² 4.2%</span>
                                            <span className="text-gray-500 ml-2 font-normal">vs last 24h</span>
                                        </div>
                                    </div>
                                </Card>
                                <Card title="AI Risk Score" className="border-t-4 border-t-purple-500">
                                    <div className="mt-2">
                                        <div className="flex justify-between items-end">
                                            <h3 className="text-3xl font-bold text-white">{JBO_C1i_portfolioAnalytics.JBO_A4b_riskScore.toFixed(0)}<span className="text-lg text-gray-500">/100</span></h3>
                                            <span className="text-purple-400 text-xs font-bold uppercase">Moderate</span>
                                        </div>
                                        <JBO_B2_ConfidenceMeter JBO_B2a_score={JBO_C1i_portfolioAnalytics.JBO_A4b_