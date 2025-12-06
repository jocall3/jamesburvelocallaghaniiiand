
import React, { useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { View, LinkedAccount } from '../types';
import {
    Brain, Zap, ShieldCheck, AlertTriangle, TrendingUp, Settings, Loader2, MessageSquareText,
    Activity, FileText, Bot, GitBranch, DollarSign, BarChart3, Cpu, Database, Network, SlidersHorizontal, Play, Pause, Repeat, Sparkles
} from 'lucide-react';

// --- Advanced Utility Functions (Simulated) ---

const calculateHealthScore = (accounts: LinkedAccount[]): number => {
    if (accounts.length === 0) return 0;
    let score = 100.0;
    let penalty = 0;
    accounts.forEach(account => {
        const isStale = Math.random() > 0.90;
        const hasRecentError = Math.random() > 0.98;
        if (isStale) penalty += 5;
        if (hasRecentError) penalty += 15;
        if (account.type === 'depository' && Math.random() > 0.7) penalty -= 1;
    });
    score = Math.max(0, 100 - penalty);
    return parseFloat(score.toFixed(2));
};

const generateSummary = (score: number, errorCount: number): string => {
    if (errorCount > 5) return "CRITICAL ALERT: Multiple connections require immediate manual intervention. System stability is at risk.";
    if (score < 70) return "Performance Degradation: System integrity is compromised. Proactive re-authentication is strongly recommended.";
    if (score > 95) return "Optimal Performance: All data endpoints are stable and responding within nominal parameters.";
    return "Stable Operation: Data synchronization is proceeding as expected. Minor fluctuations detected.";
};

// --- Type Definitions for Sub-Modules ---
type HFTStrategy = 'Arbitrage' | 'Market Making' | 'Momentum';
type Trade = { id: string; symbol: string; side: 'BUY' | 'SELL'; price: number; quantity: number; timestamp: number; pnl: number };
type ActiveViewModule = 'HEALTH_STATUS' | 'HFT_SIMULATOR' | 'RISK_SENTINEL' | 'GEMINI_INSIGHTS' | 'ANALYTICS_ENGINE' | 'DATA_TOPOLOGY';

// --- Sub-Components (Self-Contained Apps) ---

const HFTStrategyView: React.FC = () => {
    const [strategy, setStrategy] = useState<HFTStrategy>('Momentum');
    const [isRunning, setIsRunning] = useState(false);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [pnl, setPnl] = useState(0);

    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            const newTrade: Trade = {
                id: `T${Date.now()}${Math.random()}`,
                symbol: ['BTC/USD', 'ETH/USD', 'AAPL', 'TSLA'][Math.floor(Math.random() * 4)],
                side: Math.random() > 0.5 ? 'BUY' : 'SELL',
                price: 100 + Math.random() * 5000,
                quantity: Math.random() * 10,
                timestamp: Date.now(),
                pnl: (Math.random() - 0.48) * 100,
            };
            setTrades(prev => [newTrade, ...prev.slice(0, 99)]);
            setPnl(prev => prev + newTrade.pnl);
        }, 250); // High frequency simulation
        return () => clearInterval(interval);
    }, [isRunning]);

    return (
        <Card title="High-Frequency Trading (HFT) Simulator" className="bg-gray-800/90 border-indigo-600/50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <Card title="Strategy Configuration" className="bg-gray-900/50">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-300">Select Strategy</label>
                            <select value={strategy} onChange={e => setStrategy(e.target.value as HFTStrategy)} className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 text-white">
                                <option>Arbitrage</option>
                                <option>Market Making</option>
                                <option>Momentum</option>
                            </select>
                        </div>
                        <div className="mt-4 space-y-3">
                            <label className="block text-sm font-medium text-gray-300">Risk Limit ($)</label>
                            <input type="number" defaultValue={10000} className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 text-white" />
                        </div>
                        <div className="mt-4 space-y-3">
                            <label className="block text-sm font-medium text-gray-300">Execution Speed (ms)</label>
                            <input type="number" defaultValue={5} className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 text-white" />
                        </div>
                        <div className="mt-6 flex space-x-2">
                            <button onClick={() => setIsRunning(!isRunning)} className={`w-full flex items-center justify-center p-3 rounded-lg text-white font-bold transition ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                {isRunning ? <><Pause className="w-5 h-5 mr-2" /> Stop Engine</> : <><Play className="w-5 h-5 mr-2" /> Start Engine</>}
                            </button>
                            <button onClick={() => { setTrades([]); setPnl(0); }} className="p-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"><Repeat className="w-5 h-5" /></button>
                        </div>
                    </Card>
                    <Card title="Performance" className="bg-gray-900/50">
                        <p className="text-sm text-gray-400">Realized P&L</p>
                        <p className={`text-4xl font-mono font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                        <p className="text-sm text-gray-400 mt-4">Trades Executed</p>
                        <p className="text-3xl font-mono font-bold text-white">{trades.length}</p>
                    </Card>
                </div>
                {/* Trade Log */}
                <div className="lg:col-span-2">
                    <Card title="Live Trade Execution Log" className="bg-gray-900/50 h-[600px] flex flex-col">
                        <div className="grid grid-cols-5 gap-2 text-xs font-bold text-gray-400 border-b border-gray-700 pb-2 mb-2 px-2">
                            <span>Timestamp</span><span>Symbol</span><span>Side</span><span className="text-right">Price</span><span className="text-right">P&L</span>
                        </div>
                        <div className="flex-grow overflow-y-auto pr-2 font-mono text-sm space-y-1">
                            {trades.map(trade => (
                                <div key={trade.id} className={`grid grid-cols-5 gap-2 p-1.5 rounded ${trade.side === 'BUY' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    <span className="text-gray-500">{new Date(trade.timestamp).toLocaleTimeString('en-US', { hour12: false })}.{String(trade.timestamp % 1000).padStart(3, '0')}</span>
                                    <span className="text-white font-semibold">{trade.symbol}</span>
                                    <span className={trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>{trade.side}</span>
                                    <span className="text-right text-white">{trade.price.toFixed(2)}</span>
                                    <span className={`text-right font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{trade.pnl.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </Card>
    );
};

const RiskSentinelView: React.FC = () => {
    const [reportType, setReportType] = useState('AML_Screening');
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportUrl, setReportUrl] = useState<string | null>(null);

    const handleGenerateReport = useCallback(() => {
        setIsGenerating(true);
        setReportUrl(null);
        setTimeout(() => {
            setReportUrl(`/reports/generated/${reportType}_${Date.now()}.pdf`);
            setIsGenerating(false);
        }, 2500);
    }, [reportType]);

    return (
        <Card title="Risk & Compliance Sentinel" className="bg-gray-800/90 border-red-600/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Report Generation */}
                <Card title="Compliance Report Generation" className="bg-gray-900/50">
                    <div className="space-y-4">
                        <p className="text-gray-300">Generate on-demand compliance reports based on real-time transactional data.</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Report Type</label>
                            <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 text-white">
                                <option value="AML_Screening">AML Screening Report</option>
                                <option value="SAR_Filing">Suspicious Activity Report (SAR)</option>
                                <option value="KYC_Verification">KYC Verification Summary</option>
                            </select>
                        </div>
                        <button onClick={handleGenerateReport} disabled={isGenerating} className="w-full flex items-center justify-center p-3 rounded-lg text-white font-bold transition bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600">
                            {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...</> : <><FileText className="w-5 h-5 mr-2" /> Generate Report</>}
                        </button>
                        {reportUrl && (
                            <div className="mt-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-center">
                                <p className="text-green-300">Report generated successfully.</p>
                                <a href={reportUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline text-sm">Download Report</a>
                            </div>
                        )}
                    </div>
                </Card>
                {/* Live Anomaly Feed */}
                <Card title="Live Anomaly Detection Feed" className="bg-gray-900/50">
                    <div className="h-80 overflow-y-auto pr-2 space-y-3">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="flex items-start space-x-3 p-2 bg-gray-800/70 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        {['High-value transfer', 'Unusual Geo-location', 'Rapid Movement of Funds'][i % 3]}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Account ****{1000 + i * 17} | Risk Score: {75 + (i % 25)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </Card>
    );
};

const GeminiInsightsView: React.FC = () => {
    const { linkedAccounts } = useContext(DataContext)!;
    const [query, setQuery] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [insight, setInsight] = useState<string | null>(null);

    const handleQuerySubmit = useCallback(() => {
        if (!query.trim()) return;
        setIsThinking(true);
        setInsight(null);
        const thinkingTime = 1500 + Math.random() * 2000;
        setTimeout(() => {
            let generatedInsight = `Based on the query "${query}" and analysis of ${linkedAccounts.length} data sources, a multi-modal projection suggests a 15% increase in discretionary spending potential for the next fiscal quarter. Key indicators include reduced debt servicing costs and a positive shift in investment account momentum.`;
            if (query.toLowerCase().includes('risk')) {
                generatedInsight = `Risk analysis indicates a potential concentration risk in the technology sector, representing 68% of the total investment portfolio. Diversification into consumer staples or healthcare is recommended to mitigate volatility. The system has flagged two transactions from a high-risk jurisdiction for further review.`;
            } else if (query.toLowerCase().includes('save')) {
                generatedInsight = `To optimize savings, the model suggests consolidating the balances from accounts ****${linkedAccounts[0]?.mask || '1234'} and ****${linkedAccounts[1]?.mask || '5678'} into a high-yield savings vehicle. This action could potentially increase annual returns by approximately $${(Math.random() * 500 + 200).toFixed(2)}.`;
            }
            setInsight(generatedInsight);
            setIsThinking(false);
        }, thinkingTime);
    }, [query, linkedAccounts]);

    const proactiveInsights = useMemo(() => [
        { title: "Cash Flow Optimization", text: "Unusually high balance in a low-yield checking account. Consider moving funds to a higher-yield instrument.", severity: "low" },
        { title: "Subscription Anomaly", text: "A duplicate subscription charge for 'StreamFlix' was detected across two different cards.", severity: "medium" },
        { title: "Investment Opportunity", text: "Market volatility in the energy sector presents a potential buying opportunity aligned with your stated risk profile.", severity: "low" },
        { title: "Credit Utilization Alert", text: `Credit card ending in ****${linkedAccounts[2]?.mask || '9012'} has a utilization rate of 85%, which may impact credit score.`, severity: "high" },
    ], [linkedAccounts]);

    return (
        <Card title="Gemini Advanced Insights Engine" className="bg-gray-800/90 border-purple-600/50">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Panel: Proactive Insights */}
                <div className="lg:col-span-2 space-y-4">
                    <Card title="Proactive Intelligence Feed" className="bg-gray-900/50">
                        <div className="h-[400px] overflow-y-auto pr-2 space-y-3">
                            {proactiveInsights.map((item, index) => (
                                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                                    item.severity === 'high' ? 'border-red-500 bg-red-500/10' :
                                    item.severity === 'medium' ? 'border-yellow-500 bg-yellow-500/10' :
                                    'border-cyan-500 bg-cyan-500/10'
                                }`}>
                                    <p className="font-bold text-white">{item.title}</p>
                                    <p className="text-sm text-gray-300">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Panel: Interactive Query */}
                <div className="lg:col-span-3">
                    <Card title="Natural Language Data Interrogation" className="bg-gray-900/50">
                        <p className="text-gray-400 mb-4 text-sm">Engage with your complete financial dataset using natural language. The Gemini model will synthesize information across all connected accounts to provide a holistic response.</p>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Your Query:</label>
                            <textarea
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="e.g., 'Analyze my spending for last month and identify risks' or 'Where can I save more money?'"
                                className="w-full p-3 h-24 bg-gray-700 rounded-md border border-gray-600 text-white resize-none focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                        <button onClick={handleQuerySubmit} disabled={isThinking || !query.trim()} className="mt-4 w-full flex items-center justify-center p-3 rounded-lg text-white font-bold transition bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600">
                            {isThinking ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Thinking...</> : <><Sparkles className="w-5 h-5 mr-2" /> Generate Insight</>}
                        </button>

                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-white mb-2">Generated Insight:</h3>
                            <div className="p-4 min-h-[150px] bg-gray-950 rounded-lg border border-gray-700">
                                {isThinking && <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>}
                                {insight && <p className="text-gray-200 whitespace-pre-wrap">{insight}</p>}
                                {!isThinking && !insight && <p className="text-gray-500 text-center pt-10">Your generated insight will appear here.</p>}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </Card>
    );
};

// --- Main Component ---

const PlaidDashboardView: React.FC = () => {
    const context = useContext(DataContext);
    const [activeModule, setActiveModule] = useState<ActiveViewModule>('HEALTH_STATUS');

    if (!context) {
        throw new Error("PlaidDashboardView must be used within a DataProvider");
    }

    const { linkedAccounts, plaidApiKey, setActiveView } = context;

    const renderModule = () => {
        switch (activeModule) {
            case 'HFT_SIMULATOR': return <HFTStrategyView />;
            case 'RISK_SENTINEL': return <RiskSentinelView />;
            case 'GEMINI_INSIGHTS': return <GeminiInsightsView />;
            // Add other modules here when built
            // case 'ANALYTICS_ENGINE': return <AnalyticsForecastView />;
            // case 'DATA_TOPOLOGY': return <DataTopologyView />;
            case 'HEALTH_STATUS':
            default:
                return <HealthStatusView />;
        }
    };

    if (!plaidApiKey) {
        return (
            <div className="space-y-8 p-6 bg-gray-900 min-h-screen">
                <header className="flex justify-between items-center border-b border-gray-700 pb-4">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-widest uppercase">
                        Financial Dashboard: Plaid Integration
                    </h1>
                    <button onClick={() => setActiveView(View.APIIntegration)} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition duration-300 transform hover:scale-[1.02]">
                        <Settings className="w-5 h-5 mr-2" /> Configure API Key
                    </button>
                </header>
                <Card title="Configuration Required: Plaid API Key" className="border-red-500/50">
                    <div className="text-center p-8 space-y-6">
                        <AlertTriangle className="w-16 h-16 mx-auto text-red-400 animate-pulse" />
                        <p className="text-xl text-gray-300">
                            System Core Uninitialized. API credentials are required to activate data synchronization and enable dashboard modules.
                        </p>
                        <button onClick={() => setActiveView(View.APIIntegration)} className="w-full md:w-auto px-8 py-3 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xl transition duration-300">
                            Proceed to Configuration
                        </button>
                    </div>
                </Card>
                <div className="text-center text-sm text-gray-500 pt-4">Status: OFFLINE. Awaiting credentials for system handshake.</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 font-sans text-white">
            {/* Sidebar Navigation */}
            <nav className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col">
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-wider">
                        FIN-COMMAND
                    </h1>
                    <p className="text-xs text-gray-500">Plaid Integration Core</p>
                </div>
                <ul className="space-y-2">
                    <ModuleNavItem icon={Activity} label="Health & Status" view="HEALTH_STATUS" activeModule={activeModule} setActiveModule={setActiveModule} />
                    <ModuleNavItem icon={Cpu} label="HFT Simulator" view="HFT_SIMULATOR" activeModule={activeModule} setActiveModule={setActiveModule} />
                    <ModuleNavItem icon={ShieldCheck} label="Risk Sentinel" view="RISK_SENTINEL" activeModule={activeModule} setActiveModule={setActiveModule} />
                    <ModuleNavItem icon={Sparkles} label="Gemini Insights" view="GEMINI_INSIGHTS" activeModule={activeModule} setActiveModule={setActiveModule} />
                    <ModuleNavItem icon={BarChart3} label="Analytics Engine" view="ANALYTICS_ENGINE" activeModule={activeModule} setActiveModule={setActiveModule} disabled />
                    <ModuleNavItem icon={GitBranch} label="Data Topology" view="DATA_TOPOLOGY" activeModule={activeModule} setActiveModule={setActiveModule} disabled />
                </ul>
                <div className="mt-auto">
                    <button onClick={() => setActiveView(View.APIIntegration)} className="w-full flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition duration-300 text-sm">
                        <Settings className="w-4 h-4 mr-2" /> Manage Integration
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-y-auto">
                {renderModule()}
                <footer className="text-center text-xs text-gray-600 pt-6 mt-6 border-t border-gray-800">
                    Financial Command Center | Version 2.0 | All Systems Operational
                </footer>
            </main>
        </div>
    );
};

const ModuleNavItem: React.FC<{ icon: React.ElementType, label: string, view: ActiveViewModule, activeModule: ActiveViewModule, setActiveModule: (view: ActiveViewModule) => void, disabled?: boolean }> = ({ icon: Icon, label, view, activeModule, setActiveModule, disabled }) => {
    const isActive = activeModule === view;
    return (
        <li>
            <button
                onClick={() => !disabled && setActiveModule(view)}
                disabled={disabled}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition duration-200 ${isActive ? 'bg-cyan-600/20 text-cyan-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{label}</span>
                {disabled && <span className="text-xs ml-auto text-gray-500">(Soon)</span>}
            </button>
        </li>
    );
};

const HealthStatusView: React.FC = () => {
    const { linkedAccounts, userProfile } = useContext(DataContext)!;
    const [chatOpen, setChatOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [response, setResponse] = useState("Hello. I am the Dashboard Assistant. How can I help?");
    const streamIntervalRef = useRef<any>(null);

    const healthScore = useMemo(() => calculateHealthScore(linkedAccounts), [linkedAccounts]);
    const itemsInError = useMemo(() => linkedAccounts.filter(acc => Math.random() > 0.95).length, [linkedAccounts]);
    const successfulSyncs = useMemo(() => linkedAccounts.length * 25 + Math.floor(Math.random() * 100), [linkedAccounts]);
    const summary = useMemo(() => generateSummary(healthScore, itemsInError), [healthScore, itemsInError]);

    useEffect(() => {
        // Cleanup interval on component unmount
        return () => {
            if (streamIntervalRef.current) {
                clearInterval(streamIntervalRef.current);
            }
        };
    }, []);

    const handleQuery = useCallback(() => {
        if (!query.trim()) return;

        // Clear any existing stream
        if (streamIntervalRef.current) {
            clearInterval(streamIntervalRef.current);
        }
        
        // System instruction influences the response tone and content
        const systemInstruction = "You are a helpful, slightly formal, AI Dashboard Assistant. You provide concise and data-driven answers.";

        let fullResponse = "";
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes("error")) {
            fullResponse = `Analyzing error logs... There are currently ${itemsInError} items flagged with potential errors. It is recommended to run diagnostics on accounts that have not been re-authenticated in the last 90 days for optimal performance.`;
        } else if (lowerQuery.includes("health")) {
            fullResponse = `The current aggregate System Health Score is ${healthScore.toFixed(2)}%. This indicates a high degree of operational stability and data integrity across all connected endpoints.`;
        } else if (lowerQuery.includes("sync")) {
            fullResponse = `Reviewing synchronization telemetry... Total successful data synchronizations in the last 24-hour cycle are within 99.7% of expected parameters. Average data latency is currently 215ms.`;
        } else if (lowerQuery.includes("user")) {
            fullResponse = `Accessing user profile... The profile for ${userProfile?.name || 'N/A'} is associated with ${linkedAccounts.length} active data source connections. All permissions are correctly configured.`;
        } else {
            fullResponse = "I have analyzed the system telemetry. To provide a more detailed analysis, please specify if you're interested in connection health, error rates, or synchronization performance.";
        }

        setResponse("..."); // Indicate thinking
        setQuery(""); // Clear input

        setTimeout(() => { // Simulate initial network latency
            const words = fullResponse.split(' ');
            let currentWordIndex = 0;
            streamIntervalRef.current = setInterval(() => {
                if (currentWordIndex < words.length) {
                    setResponse(words.slice(0, currentWordIndex + 1).join(' '));
                    currentWordIndex++;
                } else {
                    if (streamIntervalRef.current) {
                        clearInterval(streamIntervalRef.current);
                        streamIntervalRef.current = null;
                    }
                }
            }, 50); // Stream one word every 50ms
        }, 300);

    }, [query, itemsInError, healthScore, linkedAccounts.length, userProfile]);

    return (
        <div className="space-y-6">
            <Card title="System Health Status" className="border-l-4 border-cyan-500 bg-gray-800/70">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <Brain className="w-10 h-10 text-cyan-400 flex-shrink-0" />
                        <div>
                            <p className="text-lg font-medium text-white">System Score:</p>
                            <p className="text-4xl font-extrabold text-cyan-300">{healthScore.toFixed(2)}%</p>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-8 max-w-xl">
                        <p className="text-sm italic text-gray-300 border-l-2 border-gray-600 pl-3">
                            <span className="font-bold text-cyan-400">System Note:</span> {summary}
                        </p>
                    </div>
                    <button onClick={() => setChatOpen(!chatOpen)} className={`mt-4 md:mt-0 px-4 py-2 rounded-full text-sm font-semibold transition duration-300 flex items-center ${chatOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'} text-white`}>
                        <MessageSquareText className="w-4 h-4 mr-2" /> {chatOpen ? 'Close Assistant' : 'Open Assistant'}
                    </button>
                </div>
            </Card>

            {chatOpen && (
                <Card title="AI Assistant Interface" className="bg-gray-800/90 border-cyan-600/50">
                    <div className="h-64 overflow-y-auto p-3 mb-3 bg-gray-900 rounded-lg border border-gray-700 space-y-3">
                        <div className="flex justify-start">
                            <div className="bg-gray-700 p-3 rounded-lg max-w-[80%] shadow-md">
                                <p className="text-xs font-bold text-cyan-400 mb-1">Assistant</p>
                                <p className="text-sm text-white">{response}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuery()} placeholder="Ask about connection stability, errors, or metrics..." className="flex-grow p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-cyan-500 focus:border-cyan-500" />
                        <button onClick={handleQuery} disabled={!query.trim()} className="px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg disabled:bg-gray-600 transition duration-200 flex items-center"><Zap className="w-5 h-5" /></button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Connection Resilience" className="shadow-xl border-b-4 border-green-500"><ShieldCheck className="w-8 h-8 text-green-400 mb-2" /><p className="text-5xl font-extrabold text-white my-1">{healthScore.toFixed(1)}%</p><p className="text-sm text-gray-400">Estimated Stability</p></Card>
                <Card title="Active Errors" className="shadow-xl border-b-4 border-red-500"><AlertTriangle className="w-8 h-8 text-red-400 mb-2" /><p className={`text-5xl font-extrabold my-1 ${itemsInError > 0 ? 'text-red-400' : 'text-white'}`}>{itemsInError}</p><p className="text-sm text-gray-400">Attention Required</p></Card>
                <Card title="Total Syncs (24h)" className="shadow-xl border-b-4 border-cyan-500"><TrendingUp className="w-8 h-8 text-cyan-400 mb-2" /><p className="text-5xl font-extrabold text-white my-1">{successfulSyncs.toLocaleString()}</p><p className="text-sm text-gray-400">Daily Sync Operations</p></Card>
                <Card title="Institutions Monitored" className="shadow-xl border-b-4 border-indigo-500"><Database className="w-8 h-8 text-indigo-400 mb-2" /><p className="text-5xl font-extrabold text-white my-1">{linkedAccounts.length}</p><p className="text-sm text-gray-400">Connected Data Sources</p></Card>
            </div>

            <Card title={`Connected Financial Institutions (${linkedAccounts.length})`} className="bg-gray-800/70">
                {linkedAccounts.length > 0 ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {linkedAccounts.map(account => {
                            const isError = Math.random() > 0.95;
                            const statusColor = isError ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300';
                            return (
                                <div key={account.id} className="p-4 bg-gray-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg hover:bg-gray-700/70 transition duration-200 border border-gray-700">
                                    <div className="flex-grow mb-2 md:mb-0">
                                        <p className="font-bold text-lg text-white">{account.name}</p>
                                        <p className="text-sm text-gray-400">Type: {account.type?.toUpperCase() || 'UNKNOWN'} | ID: {account.id.substring(0, 8)}...{account.mask && <span className="ml-4">Masked: ****{account.mask}</span>}</p>
                                    </div>
                                    <div className="flex items-center space-x-3 flex-shrink-0">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColor}`}>{isError ? 'Error' : 'Operational'}</span>
                                        <button className="text-cyan-400 hover:text-cyan-300 text-sm">Details &rarr;</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-800 rounded-lg border border-dashed border-gray-700">
                        <Zap className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                        <p className="text-gray-500 text-lg">No active Plaid connections. Please configure in settings.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PlaidDashboardView;
