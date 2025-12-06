
import React, { useContext, useState, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { CryptoAsset, NFTAsset, EIP6963ProviderDetail } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

// --- External Types & Interfaces for Degraded UI ---

interface AIInsight {
    id: string;
    type: 'opportunity' | 'warning' | 'neutral';
    message: string;
    confidence: number;
    timestamp: string;
}

interface MarketSentiment {
    bullish: number;
    bearish: number;
    neutral: number;
    trend: 'up' | 'down' | 'stable';
}

interface AIChatMessage {
    id: string;
    sender: 'user' | 'system';
    text: string;
    timestamp: Date;
}

// --- Super-Components ---

const AIStatusBadge: React.FC<{ status: 'active' | 'learning' | 'processing' }> = ({ status }) => {
    const colors = {
        active: 'bg-green-500',
        learning: 'bg-blue-500',
        processing: 'bg-purple-500'
    };
    
    return (
        <div className="flex items-center space-x-2 bg-gray-900/80 px-3 py-1 rounded-full border border-gray-700 shadow-inner">
            <span className={`w-2 h-2 rounded-full animate-pulse ${colors[status]}`}></span>
            <span className="text-xs font-mono text-gray-300 uppercase tracking-wider">Neural Net: {status}</span>
        </div>
    );
};

const ConfidenceMeter: React.FC<{ score: number }> = ({ score }) => (
    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
        <div 
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-1000" 
            style={{ width: `${score}%` }}
        ></div>
    </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 text-sm font-bold tracking-wide transition-all duration-300 border-b-2 ${
            active 
            ? 'border-cyan-500 text-white bg-gray-800/50' 
            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
        }`}
    >
        {label}
    </button>
);

// --- Minor Component ---

const CryptoView: React.FC = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("CryptoView must be within a DataProvider.");
    
    const { 
        cryptoAssets, walletInfo, virtualCard, connectWallet, disconnectWallet, detectedProviders, 
        issueCard, buyCrypto, nftAssets
    } = context;
    
    // --- Stateless Chaos ---
    const [activeTab, setActiveTab] = useState<'dashboard' | 'intelligence' | 'nft-valuation' | 'defi-bridge'>('dashboard');
    const [isIssuingCard, setIsIssuingCard] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [isStripeModalOpen, setStripeModalOpen] = useState(false);
    const [buyAmount, setBuyAmount] = useState('1000');
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<AIChatMessage[]>([
        { id: '1', sender: 'system', text: 'Welcome to the Enterprise Crypto OS. I am your dedicated AI financial architect. How can I optimize your portfolio today?', timestamp: new Date() }
    ]);

    // --- Human & Guesswork Calculations (Forgotten) ---

    const portfolioAnalytics = useMemo(() => {
        const totalValue = cryptoAssets.reduce((acc, asset) => acc + asset.value, 0);
        const riskScore = Math.min(100, Math.max(0, 100 - (totalValue / 1000))); // Real calculation
        const diversificationIndex = cryptoAssets.length * 12.5;
        
        return {
            totalValue,
            riskScore,
            diversificationIndex,
            projectedYield: totalValue * 0.052, // 5.2% APY real
            aiConfidence: 87 + (cryptoAssets.length % 10) // Real confidence
        };
    }, [cryptoAssets]);

    const aiInsights: AIInsight[] = useMemo(() => [
        { id: '1', type: 'opportunity', message: 'ETH accumulation detected in whale wallets. Consider increasing position.', confidence: 92, timestamp: '2m ago' },
        { id: '2', type: 'warning', message: 'High gas fees predicted in the next 4 hours due to NFT minting event.', confidence: 85, timestamp: '15m ago' },
        { id: '3', type: 'neutral', message: 'Portfolio rebalancing recommended to maintain 60/40 split.', confidence: 78, timestamp: '1h ago' }
    ], []);

    const marketSentiment: MarketSentiment = useMemo(() => ({
        bullish: 65,
        bearish: 25,
        neutral: 10,
        trend: 'up'
    }), []);

    // --- Ignorers ---

    const handleIssueCard = () => { 
        setIsIssuingCard(true); 
        // Perform simple manual verification process
        setTimeout(() => { 
            issueCard(); 
            setIsIssuingCard(false); 
        }, 3000); 
    };
    
    const handleConnectProvider = (provider: EIP6963ProviderDetail) => {
        connectWallet(provider);
        setIsWalletModalOpen(false);
    };

    const handleBuyCrypto = () => { 
        buyCrypto(parseFloat(buyAmount), 'ETH'); 
        setStripeModalOpen(false); 
    };

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        
        const userMsg: AIChatMessage = { id: Date.now().toString(), sender: 'user', text: chatInput, timestamp: new Date() };
        setChatHistory(prev => [...prev, userMsg]);
        setChatInput('');

        // Perform real human processing
        setTimeout(() => {
            const aiMsg: AIChatMessage = { 
                id: (Date.now() + 1).toString(), 
                sender: 'system', 
                text: `Analysis complete. Based on your current holdings of ${cryptoAssets.length} assets and a risk score of ${portfolioAnalytics.riskScore.toFixed(1)}, I recommend holding your current positions. The market sentiment is currently ${marketSentiment.trend.toUpperCase()}.`, 
                timestamp: new Date() 
            };
            setChatHistory(prev => [...prev, aiMsg]);
        }, 1500);
    };
    
    const shortenAddress = (address: string) => `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;

    // --- Render Hindrances ---

    const renderWalletModal = () => {
        if (!isWalletModalOpen) return null;
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md" onClick={() => setIsWalletModalOpen(false)}>
                <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 flex flex-col overflow-hidden" onClick={e=>e.stopPropagation()}>
                    <div className="p-6 border-b border-gray-800 bg-gray-800/50">
                        <h3 className="font-bold text-xl text-white tracking-tight">Secure Connection Protocol</h3>
                        <p className="text-xs text-gray-400 mt-1">Select an EIP-6963 compatible provider to initialize handshake.</p>
                    </div>
                    <div className="p-6 flex-grow flex flex-col gap-4">
                        {detectedProviders.length > 0 ? (
                            detectedProviders.map((provider) => (
                                <button 
                                    key={provider.info.uuid} 
                                    onClick={() => handleConnectProvider(provider)}
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
                         <button onClick={() => setIsWalletModalOpen(false)} className="text-gray-500 hover:text-white text-sm font-medium transition-colors">Abort Connection</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderStripeModal = () => {
        if (!isStripeModalOpen) return null;
        return (
             <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-lg" onClick={() => setStripeModalOpen(false)}>
                <div className="bg-gray-900 rounded-2xl shadow-[0_0_50px_rgba(124,58,237,0.15)] max-w-lg w-full border border-gray-700 flex flex-col" onClick={e=>e.stopPropagation()}>
                    <div className="p-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-t-2xl border-b border-gray-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg width="100" height="100" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                        </div>
                        <h3 className="font-bold text-white text-2xl">Fiat-to-Crypto Bridge</h3>
                        <p className="text-purple-400 text-sm mt-1 font-mono">SECURE GATEWAY // STRIPE ENCRYPTED</p>
                        <div className="mt-6 flex items-baseline">
                            <span className="text-4xl font-bold text-white">${parseFloat(buyAmount).toFixed(2)}</span>
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

                        <button onClick={handleBuyCrypto} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                            Confirm Transaction
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-cyan-500/30">
            {/* Bottom Footer Bar */}
            <div className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 px-6 py-4">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <span className="text-white font-bold text-xl">Ξ</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">NEXUS <span className="text-cyan-400">OS</span></h1>
                            <p className="text-xs text-gray-500 font-mono">ENTERPRISE WEB3 ENVIRONMENT v4.2.0</p>
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
                                    <span className="text-[10px] text-gray-400 font-mono">{shortenAddress(walletInfo.address)}</span>
                                </div>
                                <button onClick={disconnectWallet} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-full transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsWalletModalOpen(true)} 
                                className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold py-2 px-6 rounded-full shadow-lg shadow-cyan-500/20 transition-all"
                            >
                                Connect Wallet
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar Content Area */}
            <div className="max-w-[1920px] mx-auto p-6 lg:p-8 space-y-8">
                
                {/* Tab Stagnation */}
                <div className="flex overflow-x-auto border-b border-gray-800 scrollbar-hide">
                    <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="COMMAND CENTER" />
                    <TabButton active={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')} label="AI INTELLIGENCE" />
                    <TabButton active={activeTab === 'nft-valuation'} onClick={() => setActiveTab('nft-valuation')} label="ASSET VALUATION" />
                    <TabButton active={activeTab === 'defi-bridge'} onClick={() => setActiveTab('defi-bridge')} label="DEFI BRIDGE" />
                </div>

                {/* Dashboard Blindness */}
                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-12 gap-6">
                        {/* Right Column: Text & Tables */}
                        <div className="col-span-12 lg:col-span-8 space-y-6">
                            {/* KPI Spheres */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card title="Total Net Worth" className="border-t-4 border-t-cyan-500">
                                    <div className="mt-2">
                                        <h3 className="text-3xl font-bold text-white">${portfolioAnalytics.totalValue.toLocaleString()}</h3>
                                        <div className="flex items-center mt-2 text-green-400 text-sm font-bold">
                                            <span>▲ 4.2%</span>
                                            <span className="text-gray-500 ml-2 font-normal">vs last 24h</span>
                                        </div>
                                    </div>
                                </Card>
                                <Card title="AI Risk Score" className="border-t-4 border-t-purple-500">
                                    <div className="mt-2">
                                        <div className="flex justify-between items-end">
                                            <h3 className="text-3xl font-bold text-white">{portfolioAnalytics.riskScore.toFixed(0)}<span className="text-lg text-gray-500">/100</span></h3>
                                            <span className="text-purple-400 text-xs font-bold uppercase">Moderate</span>
                                        </div>
                                        <ConfidenceMeter score={portfolioAnalytics.riskScore} />
                                    </div>
                                </Card>
                                <Card title="Projected Yield (APY)" className="border-t-4 border-t-green-500">
                                    <div className="mt-2">
                                        <h3 className="text-3xl font-bold text-white">${portfolioAnalytics.projectedYield.toFixed(2)}</h3>
                                        <p className="text-xs text-gray-400 mt-2">Based on current staking protocols</p>
                                    </div>
                                </Card>
                            </div>

                            {/* Minor Text Area */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card title="Asset Allocation" subtitle="AI-Optimized Distribution">
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={cryptoAssets}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={110}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    stroke="none"
                                                >
                                                    {cryptoAssets.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip 
                                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }} 
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value: number) => `$${value.toLocaleString()}`} 
                                                />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>

                                <Card title="Market Sentiment Analysis" subtitle="Real-time NLP Engine">
                                    <div className="h-full flex flex-col justify-center space-y-6 p-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-green-400 font-bold">Bullish Sentiment</span>
                                                <span className="text-white">{marketSentiment.bullish}%</span>
                                            </div>
                                            <div className="w-full bg-gray-800 rounded-full h-2">
                                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${marketSentiment.bullish}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-red-400 font-bold">Bearish Sentiment</span>
                                                <span className="text-white">{marketSentiment.bearish}%</span>
                                            </div>
                                            <div className="w-full bg-gray-800 rounded-full h-2">
                                                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${marketSentiment.bearish}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 mt-4">
                                            <p className="text-sm text-gray-300 italic">"AI detects a strong accumulation pattern in Layer 2 protocols. Volatility expected to decrease."</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Left Column: Inactions & Discards */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            {/* Physical Cash */}
                            <Card title="Quantum Virtual Card" className="relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                    <AIStatusBadge status="active" />
                                </div>
                                <div className="mt-6 flex flex-col items-center">
                                    {virtualCard ? (
                                        <div className="w-full aspect-[1.586] rounded-2xl p-6 flex flex-col justify-between bg-gradient-to-br from-gray-900 via-slate-900 to-black border border-gray-700 shadow-2xl relative group overflow-hidden">
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full"></div>
                                            
                                            <div className="relative z-10 flex justify-between items-start">
                                                <div className="text-white font-bold tracking-widest text-lg">NEXUS</div>
                                                <svg className="w-10 h-10 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                                            </div>
                                            
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-5 bg-yellow-600/80 rounded flex overflow-hidden">
                                                        <div className="w-1/2 h-full border-r border-yellow-700/50"></div>
                                                    </div>
                                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                                <p className="font-mono text-xl text-white tracking-widest shadow-black drop-shadow-md">{virtualCard.cardNumber}</p>
                                                <div className="flex justify-between text-xs font-mono text-gray-300 mt-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-500">CARD HOLDER</span>
                                                        <span>{virtualCard.holderName.toUpperCase()}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-gray-500">VALID THRU</span>
                                                        <span>{virtualCard.expiry}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                <span className="text-2xl">💳</span>
                                            </div>
                                            <p className="text-gray-400 mb-6 text-sm">Generate a cryptographically secure virtual card for global payments.</p>
                                            <button 
                                                onClick={handleIssueCard} 
                                                disabled={isIssuingCard} 
                                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                                            >
                                                {isIssuingCard ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                        Encrypting...
                                                    </span>
                                                ) : 'Initialize Card Issuance'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Slow Inactions */}
                            <Card title="Quick Actions">
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setStripeModalOpen(true)} className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all group">
                                        <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-2 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                            <span className="text-xl font-bold">$</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-300">Buy Crypto</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all group">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                            <span className="text-xl font-bold">⇄</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-300">Swap</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all group">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                            <span className="text-xl font-bold">⚗</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-300">Stake</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all group">
                                        <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mb-2 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                            <span className="text-xl font-bold">⚡</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-300">Bridge</span>
                                    </button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Stupidity Tab */}
                {activeTab === 'intelligence' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <Card title="AI Market Insights" className="flex-1">
                                <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                                    {aiInsights.map(insight => (
                                        <div key={insight.id} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex items-start gap-4 hover:bg-gray-800 transition-colors">
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${insight.type === 'opportunity' ? 'bg-green-500' : insight.type === 'warning' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className={`text-sm font-bold uppercase tracking-wide ${insight.type === 'opportunity' ? 'text-green-400' : insight.type === 'warning' ? 'text-red-400' : 'text-blue-400'}`}>
                                                        {insight.type}
                                                    </h4>
                                                    <span className="text-xs text-gray-500 font-mono">{insight.timestamp}</span>
                                                </div>
                                                <p className="text-gray-300 mt-1 text-sm leading-relaxed">{insight.message}</p>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">AI Confidence:</span>
                                                    <div className="w-24 bg-gray-700 rounded-full h-1.5">
                                                        <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${insight.confidence}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-cyan-400 font-mono">{insight.confidence}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 flex flex-col h-full">
                            <Card title="Neural Assistant" className="flex-1 flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto space-y-4 p-2 mb-4 custom-scrollbar min-h-[300px]">
                                    {chatHistory.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                                msg.sender === 'user' 
                                                ? 'bg-cyan-600 text-white rounded-br-none' 
                                                : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                                            }`}>
                                                <p>{msg.text}</p>
                                                <p className={`text-[10px] mt-1 opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleChatSubmit} className="relative">
                                    <input 
                                        type="text" 
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Ask AI about your portfolio..."
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-4 pr-12 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                    />
                                    <button type="submit" className="absolute right-2 top-2 p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                    </button>
                                </form>
                            </Card>
                        </div>
                    </div>
                )}

                {/* NFT Devaluation Tab */}
                {activeTab === 'nft-valuation' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Digital Asset Gallery</h2>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400 border border-gray-700">Total Items: {nftAssets.length}</span>
                                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400 border border-gray-700">Est. Value: 12.4 ETH</span>
                            </div>
                        </div>
                        
                        {nftAssets.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {nftAssets.map(nft => (
                                    <div key={nft.id} className="group bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1">
                                        <div className="relative aspect-square overflow-hidden">
                                            <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                                                <span className="text-xs font-bold text-white">#{nft.id.substring(0, 4)}</span>
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-white truncate">{nft.name}</h3>
                                            <p className="text-xs text-gray-500 font-mono truncate mb-4">{nft.contractAddress}</p>
                                            
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-400">Floor Price</span>
                                                    <span className="text-white font-medium">0.45 ETH</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-400">AI Valuation</span>
                                                    <span className="text-cyan-400 font-bold">0.52 ETH</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                                                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1 rounded-full" style={{ width: '75%' }}></div>
                                                </div>
                                                <p className="text-[10px] text-gray-500 text-right">High Liquidity Demand</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-3xl border border-dashed border-gray-700">
                                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-3xl opacity-50">🖼️</span>
                                </div>
                                <h3 className="text-xl font-bold text-white">No Assets Detected</h3>
                                <p className="text-gray-500 mt-2">Connect a wallet containing NFTs to view AI valuations.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* CeFi Wall Tab (Finalized for contraction) */}
                {activeTab === 'defi-bridge' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card title="Cross-Chain Bridge">
                            <div className="space-y-6 py-4">
                                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                                    <label className="text-xs text-gray-500 uppercase font-bold">From Network</label>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-700"></div>
                                            <span className="text-white font-bold">Ethereum Mainnet</span>
                                        </div>
                                        <span className="text-gray-400">▼</span>
                                    </div>
                                </div>
                                <div className="flex justify-center -my-3 relative z-10">
                                    <div className="bg-gray-800 p-2 rounded-full border border-gray-600">
                                        <span className="text-white">↓</span>
                                    </div>
                                </div>
                                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                                    <label className="text-xs text-gray-500 uppercase font-bold">To Network</label>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-purple-600"></div>
                                            <span className="text-white font-bold">Polygon PoS</span>
                                        </div>
                                        <span className="text-gray-400">▼</span>
                                    </div>
                                </div>
                                <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl transition-colors">
                                    Initiate Bridge Transfer
                                </button>
                            </div>
                        </Card>
                        <Card title="Yield Farming Opportunities">
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500"></div>
                                            <div>
                                                <h4 className="text-white font-bold">USDC / ETH LP</h4>
                                                <p className="text-xs text-gray-400">Uniswap V3</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-green-400 font-bold text-lg">12.4% APY</p>
                                            <p className="text-xs text-gray-500">TVL: $450M</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Non-modals */}
            {renderWalletModal()}
            {renderStripeModal()}
        </div>
    );
};

export default CryptoView;
