import React, { useContext, useState, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { View, MarqetaCardProduct } from '../types';
import { Settings, RefreshCw, CreditCard, Zap, Activity, Shield, SlidersHorizontal, Globe, Link, Bell, Terminal, Cpu, Atom } from 'lucide-react';

type SubView = 'PROGRAMS' | 'TRANSACTIONS' | 'VELOCITY' | 'FRAUD_AI' | 'GLOBAL_CONFIG' | 'WEBHOOKS' | 'ANALYTICS' | 'DEVELOPER_API';

interface SimulatedTransaction {
    id: string;
    amount: number;
    currency: string;
    merchant: string;
    status: 'APPROVED' | 'DECLINED';
    timestamp: string;
    jitDecision: 'TIMEOUT' | 'APPROVED' | 'DECLINED';
}

const generateRandomTransaction = (): SimulatedTransaction => {
    const merchants = ['Stripe', 'Amazon', 'Netflix', 'Starbucks', 'Uber', 'Doordash'];
    const status = Math.random() > 0.1 ? 'APPROVED' : 'DECLINED';
    return {
        id: `txn_${Math.random().toString(36).substr(2, 9)}`,
        amount: parseFloat((Math.random() * 200).toFixed(2)),
        currency: 'USD',
        merchant: merchants[Math.floor(Math.random() * merchants.length)],
        status,
        jitDecision: status === 'DECLINED' ? (Math.random() > 0.5 ? 'TIMEOUT' : 'DECLINED') : 'APPROVED',
        timestamp: new Date().toISOString(),
    };
};

const MarqetaDashboardView: React.FC = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("MarqetaDashboardView must be used within a DataProvider");

    const { 
        marqetaCardProducts, 
        fetchMarqetaProducts, 
        isMarqetaLoading, 
        marqetaApiToken, 
        marqetaApiSecret, 
        setMarqetaCredentials,
        setActiveView 
    } = context;

    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [tokenInput, setTokenInput] = useState(marqetaApiToken || '');
    const [secretInput, setSecretInput] = useState(marqetaApiSecret || '');
    const [activeSubView, setActiveSubView] = useState<SubView>('PROGRAMS');
    const [transactions, setTransactions] = useState<SimulatedTransaction[]>([]);

    useEffect(() => {
        if (marqetaApiToken && marqetaApiSecret && marqetaCardProducts.length === 0) {
            fetchMarqetaProducts();
        }
    }, [marqetaApiToken, marqetaApiSecret]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTransactions(prev => [generateRandomTransaction(), ...prev.slice(0, 19)]);
        }, 1500); // High-frequency simulation
        return () => clearInterval(interval);
    }, []);

    const handleSaveConfig = () => {
        setMarqetaCredentials(tokenInput, secretInput);
        setIsConfigOpen(false);
        fetchMarqetaProducts();
    };

    const handlePersonalize = () => {
        setActiveView(View.CardCustomization);
    };

    const renderSubView = () => {
        switch (activeSubView) {
            case 'PROGRAMS':
                return renderProgramsView();
            case 'TRANSACTIONS':
                return renderTransactionsView();
            case 'VELOCITY':
                return renderVelocityControlView();
            case 'FRAUD_AI':
                return renderFraudAIView();
            case 'GLOBAL_CONFIG':
                return renderGlobalConfigView();
            case 'WEBHOOKS':
                return renderWebhooksView();
            case 'ANALYTICS':
                return renderAnalyticsView();
            case 'DEVELOPER_API':
                return renderDeveloperApiView();
            default:
                return renderProgramsView();
        }
    };

    if (!marqetaApiToken || !marqetaApiSecret) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 p-6 text-center">
                <div className="mb-8">
                     <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-widest uppercase">
                        Marqeta Card Command
                    </h1>
                    <p className="text-gray-400 mt-2">Secure connection required to access card product registry.</p>
                </div>
                
                <Card title="API Configuration" className="max-w-md w-full border-red-500/50">
                    <div className="space-y-4 p-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-400 text-left">Application Token</label>
                            <input 
                                type="text" 
                                value={tokenInput} 
                                onChange={e => setTokenInput(e.target.value)} 
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mt-1"
                                placeholder="Enter application token..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 text-left">Admin Access Token</label>
                            <input 
                                type="password" 
                                value={secretInput} 
                                onChange={e => setSecretInput(e.target.value)} 
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mt-1"
                                placeholder="Enter admin secret..."
                            />
                        </div>
                        <button 
                            onClick={handleSaveConfig}
                            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all shadow-lg"
                        >
                            Connect to Marqeta Sandbox
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    const SubViewButton: React.FC<{ view: SubView; icon: React.ReactNode; label: string }> = ({ view, icon, label }) => (
        <button
            onClick={() => setActiveSubView(view)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left ${activeSubView === view ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
        >
            {icon}
            <span className="font-semibold">{label}</span>
        </button>
    );

    const renderProgramsView = () => (
        <div className="space-y-6">
            {marqetaCardProducts.map(product => (
                <Card key={product.token} className="border-l-4 border-cyan-500 overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="w-full md:w-1/3 p-4">
                            <div className="aspect-[1.586] bg-gradient-to-br from-gray-800 to-black rounded-xl border border-gray-600 p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl group">
                                <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <CreditCard className="w-8 h-8 text-white opacity-80" />
                                    <span className="text-xs font-mono text-gray-400">{product.token.substring(0, 8)}</span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-lg font-bold text-white tracking-widest mb-1">{product.name}</p>
                                    <div className="flex justify-between text-xs text-gray-400 font-mono">
                                        <span>**** **** **** {product.config.fulfillment.bin_prefix.substring(0,4)}</span>
                                        <span>EXP 12/29</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4 p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs uppercase">Status</p>
                                    <p className={`font-bold ${product.active ? 'text-green-400' : 'text-red-400'}`}>{product.active ? 'ACTIVE' : 'INACTIVE'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase">Start Date</p>
                                    <p className="text-white font-mono">{product.start_date}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase">Fulfillment</p>
                                    <p className="text-white">{product.config.fulfillment.fulfillment_provider}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase">Instrument</p>
                                    <p className="text-white">{product.config.fulfillment.payment_instrument}</p>
                                </div>
                            </div>
                            <div className="bg-gray-800 rounded p-3 text-xs text-gray-400 font-mono overflow-x-auto">
                                <p>POI: {JSON.stringify(product.config.poi.other)}</p>
                                <p className="mt-1">JIT Funding: {product.config.jit_funding?.program_funding_source?.enabled ? 'ENABLED' : 'DISABLED'}</p>
                            </div>
                            <button onClick={handlePersonalize} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-[1.02]">
                                <Zap className="w-4 h-4 text-yellow-300" />
                                Personalize with AI Designer
                            </button>
                        </div>
                    </div>
                </Card>
            ))}
            {marqetaCardProducts.length === 0 && (
                 <div className="text-center text-gray-500 py-12">No card products found. Please verify credentials or create a program in the sandbox.</div>
            )}
        </div>
    );

    const renderTransactionsView = () => (
        <Card title="High-Frequency Transaction Stream" className="border-l-4 border-green-500">
            <div className="p-4 h-[600px] overflow-y-auto font-mono text-xs">
                <div className="grid grid-cols-6 gap-4 text-gray-400 uppercase pb-2 border-b border-gray-700">
                    <span>Timestamp</span>
                    <span>Transaction ID</span>
                    <span>Merchant</span>
                    <span className="text-right">Amount</span>
                    <span className="text-center">JIT Decision</span>
                    <span className="text-right">Status</span>
                </div>
                <div className="space-y-2 mt-2">
                    {transactions.map(tx => (
                        <div key={tx.id} className="grid grid-cols-6 gap-4 items-center p-2 rounded bg-gray-800/50 animate-pulse-once">
                            <span className="text-gray-500">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                            <span className="text-cyan-400">{tx.id}</span>
                            <span className="text-white">{tx.merchant}</span>
                            <span className="text-right text-white">${tx.amount.toFixed(2)}</span>
                            <span className={`text-center font-bold ${tx.jitDecision === 'APPROVED' ? 'text-green-400' : 'text-yellow-400'}`}>{tx.jitDecision}</span>
                            <span className={`text-right font-bold ${tx.status === 'APPROVED' ? 'text-green-400' : 'text-red-400'}`}>{tx.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );

    const renderVelocityControlView = () => (
        <Card title="Predictive Velocity Control Configuration" className="border-l-4 border-yellow-500">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Usage Limits</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Lifetime Spend</label>
                        <input type="number" defaultValue="10000" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Daily Transaction Count</label>
                        <input type="number" defaultValue="50" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Single Transaction Max Amount</label>
                        <input type="number" defaultValue="1500" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white mt-1" />
                    </div>
                </div>
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Merchant Category Controls</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Allowed MCCs (comma-separated)</label>
                        <input type="text" placeholder="e.g., 5812, 5411, 7999" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Blocked MCCs (comma-separated)</label>
                        <input type="text" placeholder="e.g., 7995, 6012" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white mt-1" />
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Cpu className="w-6 h-6 text-purple-400" />
                            <div>
                                <p className="font-semibold text-white">Enable Predictive MCC Blocking</p>
                                <p className="text-xs text-gray-400">Use sophisticated risk models to block suspicious merchant categories in real-time.</p>
                            </div>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-gray-800/50 p-4 m-6 mt-0 rounded-lg border border-gray-700">
                <button className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg">Apply Velocity Profile</button>
            </div>
        </Card>
    );

    const renderFraudAIView = () => (
        <Card title="Real-time Fraud Analysis" className="border-l-4 border-red-500">
            <div className="p-6">
                <p className="text-gray-400">This dashboard simulates a real-time deep learning fraud detection engine, analyzing transaction patterns and flagging anomalies based on risk metrics and global threat intelligence.</p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h4 className="text-white font-semibold">Global Threat Level</h4>
                        <p className="text-3xl font-bold text-red-500 mt-2">CRITICAL</p>
                        <p className="text-xs text-gray-500">Source: Consolidated Threat Feeds</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h4 className="text-white font-semibold">Anomalies Detected (24h)</h4>
                        <p className="text-3xl font-bold text-yellow-400 mt-2">1,482</p>
                        <p className="text-xs text-gray-500">98.7% Model-Mitigated</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h4 className="text-white font-semibold">Model Confidence</h4>
                        <p className="text-3xl font-bold text-green-400 mt-2">99.96%</p>
                        <p className="text-xs text-gray-500">Detection Model: v3.2 Deep Learning Model</p>
                    </div>
                </div>
                <div className="mt-6">
                    <h4 className="text-white font-semibold mb-2">Live Anomaly Feed</h4>
                    <div className="h-64 bg-black p-4 rounded-lg font-mono text-xs text-green-400 overflow-y-auto border border-gray-700">
                        <p>&gt; [VECTOR_ANALYSIS] High-velocity card-not-present attempts from geofenced region detected...</p>
                        <p>&gt; [RISK_MODEL] Risk profile deviation detected. Flagging TXN_ID: {transactions[2]?.id || '...'}</p>
                        <p className="text-yellow-400">&gt; [AUTOMATED_ACTION] Applying temporary velocity lock on card ending 4598. Reason: Suspected BIN attack.</p>
                        <p>&gt; [VECTOR_ANALYSIS] Cross-referencing dark web credential dumps... no match found.</p>
                        <p className="text-red-500">&gt; [RISK_ALERT] Authorization bypass signature detected. Escalating to Level 3 SOC.</p>
                    </div>
                </div>
            </div>
        </Card>
    );

    const renderGlobalConfigView = () => (
        <Card title="Global Platform Configuration" className="border-l-4 border-purple-500">
            <div className="p-6 space-y-6">
                <p className="text-gray-400">Settings here affect all card programs and transactions. Tread carefully.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2"><Globe className="w-4 h-4"/>Default Authorization Currency</label>
                        <select className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                            <option>USD - United States Dollar</option>
                            <option>EUR - Euro</option>
                            <option>GBP - British Pound</option>
                            <option>JPY - Japanese Yen</option>
                        </select>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2"><Shield className="w-4 h-4"/>Minimum KYC/AML Level</label>
                        <select className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                            <option>Level 1 - Basic Identity</option>
                            <option>Level 2 - Document Verification</option>
                            <option>Level 3 - Enhanced Due Diligence</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Atom className="w-6 h-6 text-cyan-400" />
                        <div>
                            <p className="font-semibold text-white">Enable ML-Enhanced JIT Decisions</p>
                            <p className="text-xs text-gray-400">Leverage specialized machine learning models for low-latency transaction authorization logic.</p>
                        </div>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="gemini-toggle" id="gemini-toggle" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                        <label htmlFor="gemini-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
                    </div>
                </div>
                <div className="bg-gray-800/50 p-4 mt-4 rounded-lg border border-gray-700">
                    <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg">Update Global Settings</button>
                </div>
            </div>
        </Card>
    );

    const renderWebhooksView = () => (
        <Card title="Webhook Subscriptions" className="border-l-4 border-indigo-500">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-400">Configure endpoints to receive real-time event notifications.</p>
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg">Add New Endpoint</button>
                </div>
                <div className="space-y-3">
                    <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-mono text-white">https://api.yourapp.com/webhooks/marqeta/transactions</p>
                            <p className="text-xs text-gray-400">Events: transaction.*, jit_funding.*</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-green-400 bg-green-500/20 px-2 py-1 rounded-full">ACTIVE</span>
                            <button className="text-gray-400 hover:text-white">...</button>
                        </div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-mono text-white">https://api.yourapp.com/webhooks/marqeta/fraud</p>
                            <p className="text-xs text-gray-400">Events: fraud.case.opened, fraud.case.updated</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-green-400 bg-green-500/20 px-2 py-1 rounded-full">ACTIVE</span>
                            <button className="text-gray-400 hover:text-white">...</button>
                        </div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-mono text-white">https://api.legacy-system.com/ingest/marqeta</p>
                            <p className="text-xs text-gray-400">Events: *</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-red-400 bg-red-500/20 px-2 py-1 rounded-full">FAILED</span>
                            <button className="text-gray-400 hover:text-white">...</button>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );

    const renderAnalyticsView = () => (
        <Card title="Platform Analytics & Insights" className="border-l-4 border-teal-500">
            <div className="p-6">
                <p className="text-gray-400 mb-6">Real-time visualization of key platform metrics. Powered by a serverless data pipeline.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                        <h4 className="text-gray-400 text-sm uppercase">Total Volume (24h)</h4>
                        <p className="text-3xl font-bold text-white mt-2">$1,283,492.10</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                        <h4 className="text-gray-400 text-sm uppercase">Approval Rate</h4>
                        <p className="text-3xl font-bold text-green-400 mt-2">98.1%</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                        <h4 className="text-gray-400 text-sm uppercase">JIT Timeouts</h4>
                        <p className="text-3xl font-bold text-yellow-400 mt-2">1.2%</p>
                    </div>
                </div>
                <div className="mt-8 bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-white font-semibold mb-4">Transaction Volume by Merchant Category</h4>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        [ Chart Component Placeholder: e.g., Recharts, Chart.js ]
                    </div>
                </div>
            </div>
        </Card>
    );

    const renderDeveloperApiView = () => (
        <Card title="Developer & API Access" className="border-l-4 border-blue-500">
            <div className="p-6 space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">API Keys</h3>
                    <div className="space-y-3">
                        <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-mono text-white">app_token_live_******************a4f2</p>
                                <p className="text-xs text-gray-400">Created: 2023-01-15 | Scopes: read, write</p>
                            </div>
                            <button className="text-gray-400 hover:text-white">Revoke</button>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-mono text-white">app_token_test_******************b9c1</p>
                                <p className="text-xs text-gray-400">Created: 2022-11-20 | Scopes: read</p>
                            </div>
                            <button className="text-gray-400 hover:text-white">Revoke</button>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Resources</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a href="#" className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition">
                            <p className="font-semibold text-cyan-400">API Documentation</p>
                            <p className="text-xs text-gray-400">Explore endpoints and schemas.</p>
                        </a>
                        <a href="#" className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition">
                            <p className="font-semibold text-cyan-400">SDKs & Libraries</p>
                            <p className="text-xs text-gray-400">Download for Python, Node.js, Go.</p>
                        </a>
                        <a href="#" className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition">
                            <p className="font-semibold text-cyan-400">API Status Page</p>
                            <p className="text-xs text-gray-400">Check real-time system health.</p>
                        </a>
                        <a href="#" className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition">
                            <p className="font-semibold text-cyan-400">Community Forum</p>
                            <p className="text-xs text-gray-400">Get help from other developers.</p>
                        </a>
                    </div>
                </div>
            </div>
        </Card>
    );

    return (
        <div className="bg-gray-900 min-h-screen flex">
            <nav className="w-64 bg-gray-900 border-r border-gray-800 p-4 space-y-2 flex-shrink-0 overflow-y-auto">
                <div className="flex items-center space-x-2 pb-4 border-b border-gray-800">
                    <CreditCard className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h2 className="text-lg font-bold text-white">Marqeta</h2>
                        <p className="text-xs text-gray-500">Command Center</p>
                    </div>
                </div>
                <SubViewButton view="PROGRAMS" icon={<CreditCard className="w-5 h-5" />} label="Card Programs" />
                <SubViewButton view="TRANSACTIONS" icon={<Activity className="w-5 h-5" />} label="Live Transactions" />
                <SubViewButton view="VELOCITY" icon={<SlidersHorizontal className="w-5 h-5" />} label="Velocity Controls" />
                <SubViewButton view="FRAUD_AI" icon={<Shield className="w-5 h-5" />} label="Fraud AI Engine" />
                <div className="pt-2 mt-2 border-t border-gray-800" />
                <SubViewButton view="GLOBAL_CONFIG" icon={<Globe className="w-5 h-5" />} label="Global Config" />
                <SubViewButton view="WEBHOOKS" icon={<Bell className="w-5 h-5" />} label="Webhooks" />
                <SubViewButton view="ANALYTICS" icon={<Atom className="w-5 h-5" />} label="Analytics" />
                <SubViewButton view="DEVELOPER_API" icon={<Terminal className="w-5 h-5" />} label="Developer & API" />
                <div className="pt-4 border-t border-gray-800 mt-4">
                    <button onClick={() => setIsConfigOpen(true)} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-700/50 hover:text-white w-full">
                        <Settings className="w-5 h-5" />
                        <span className="font-semibold">System Configuration</span>
                    </button>
                </div>
            </nav>

            <main className="flex-1 p-8 space-y-8 overflow-y-auto">
                <header className="flex justify-between items-center">
                     <div>
                        <h1 className="text-3xl font-bold text-white">Marqeta Sandbox Environment</h1>
                        <p className="text-gray-400 text-sm mt-1">Live data simulation via API v3</p>
                    </div>
                    <div className="flex space-x-3">
                        <button onClick={fetchMarqetaProducts} className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-white transition">
                            <RefreshCw className={`w-5 h-5 ${isMarqetaLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </header>

                {isConfigOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                        <Card title="System Configuration" className="max-w-lg w-full relative">
                            <button onClick={() => setIsConfigOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2"><Link className="w-4 h-4"/>API Credentials</label>
                                    <input type="text" value={tokenInput} onChange={e => setTokenInput(e.target.value)} placeholder="Application Token" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                                    <input type="password" value={secretInput} onChange={e => setSecretInput(e.target.value)} placeholder="Admin Access Token" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mt-2" />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2"><Terminal className="w-4 h-4"/>Webhook Endpoints</label>
                                    <input type="text" placeholder="https://api.yourapp.com/webhooks/marqeta" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2"><Atom className="w-4 h-4"/>Distributed Ledger Sync</label>
                                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                                        <p className="text-sm text-gray-400">Enable real-time distributed ledger backup.</p>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="q-toggle" id="q-toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                            <label htmlFor="q-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleSaveConfig} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-bold">Save & Reconnect</button>
                            </div>
                        </Card>
                    </div>
                )}

                {isMarqetaLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <RefreshCw className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
                        <p className="text-gray-400">Syncing card products from Marqeta Core...</p>
                    </div>
                ) : renderSubView()}
            </main>
        </div>
    );
};

export default MarqetaDashboardView;