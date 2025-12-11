export const FraudDetectionView = () => {
    // -------------------------------------------------------------------------
    // IMPORTS & DEPENDENCIES
    // -------------------------------------------------------------------------
    const [alerts, setAlerts] = React.useState<FraudAlert[]>(INITIAL_ALERTS);
    const [selectedAlert, setSelectedAlert] = React.useState<FraudAlert | null>(INITIAL_ALERTS[0]);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [aiAnalysis, setAiAnalysis] = React.useState<string | null>(null);
    const [showGraph, setShowGraph] = React.useState(false);
    const [streamActive, setStreamActive] = React.useState(true);

    // -------------------------------------------------------------------------
    // MOCK DATA GENERATORS
    // -------------------------------------------------------------------------
    React.useEffect(() => {
        if (!streamActive) return;
        const interval = setInterval(() => {
            const newAlert = generateMockAlert();
            setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep last 50
        }, 3000);
        return () => clearInterval(interval);
    }, [streamActive]);

    const handleAnalyzeAlert = async (alert: FraudAlert) => {
        setSelectedAlert(alert);
        setIsAnalyzing(true);
        setAiAnalysis(null);
        setShowGraph(false);

        // Simulate AI Latency
        setTimeout(() => {
            const analysis = generateAIAnalysis(alert);
            setAiAnalysis(analysis);
            setIsAnalyzing(false);
        }, 1800);
    };

    const handleLinkAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
            setShowGraph(true);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-100 overflow-hidden font-sans">
            {/* HEADER */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-20">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                        Fraud Detection & Prevention
                    </h1>
                    <p className="text-sm text-gray-400">Real-time anomaly monitoring and AI-driven threat mitigation</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
                        <div className={`w-2 h-2 rounded-full ${streamActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                        <span className="text-xs font-mono text-gray-300">{streamActive ? 'LIVE FEED ACTIVE' : 'FEED PAUSED'}</span>
                    </div>
                    <button 
                        onClick={() => setStreamActive(!streamActive)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        {streamActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button className="flex items-center gap-2 bg-red-600/20 text-red-400 border border-red-600/50 px-4 py-2 rounded-lg hover:bg-red-600/30 transition-all">
                        <Siren className="w-4 h-4" />
                        <span>Escalate Incident</span>
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT GRID */}
            <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
                
                {/* LEFT PANEL: LIVE FEED */}
                <div className="col-span-12 lg:col-span-4 border-r border-gray-800 flex flex-col bg-gray-900/30">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-300 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-cyan-400" />
                            Transaction Stream
                        </h2>
                        <span className="text-xs bg-cyan-900/30 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/50">
                            {alerts.length} Events
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {alerts.map((alert) => (
                            <div 
                                key={alert.id}
                                onClick={() => handleAnalyzeAlert(alert)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-800 group ${
                                    selectedAlert?.id === alert.id 
                                    ? 'bg-gray-800 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
                                        alert.severity === 'Critical' ? 'bg-red-900/30 text-red-400 border-red-800' :
                                        alert.severity === 'High' ? 'bg-orange-900/30 text-orange-400 border-orange-800' :
                                        'bg-yellow-900/30 text-yellow-400 border-yellow-800'
                                    }`}>
                                        {alert.riskScore}/100 RISK
                                    </span>
                                    <span className="text-xs font-mono text-gray-500">{alert.timestamp}</span>
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-full bg-gray-800 group-hover:bg-gray-700 transition-colors">
                                        <alert.icon className="w-4 h-4 text-gray-300" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{alert.type}</div>
                                        <div className="text-xs text-gray-400">{alert.user}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-mono">{alert.location}</span>
                                    <span className="text-white font-mono font-bold">${alert.amount.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MIDDLE PANEL: ANALYSIS & DETAILS */}
                <div className="col-span-12 lg:col-span-5 border-r border-gray-800 flex flex-col bg-gray-900">
                    {selectedAlert ? (
                        <>
                            <div className="p-6 border-b border-gray-800">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">{selectedAlert.type} Detection</h2>
                                        <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                                            <span>ID: {selectedAlert.id}</span>
                                            <span className="text-gray-600">|</span>
                                            <span>{selectedAlert.timestamp}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-3xl font-bold text-red-500">{selectedAlert.riskScore}</div>
                                        <div className="text-xs text-red-400 font-semibold tracking-wider">RISK SCORE</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Source IP</div>
                                        <div className="font-mono text-sm text-cyan-300">192.168.43.21</div>
                                        <div className="text-xs text-gray-400 mt-1">Lagos, NG (VPN Detected)</div>
                                    </div>
                                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Device Fingerprint</div>
                                        <div className="font-mono text-sm text-purple-300">iPhone 13 Pro</div>
                                        <div className="text-xs text-gray-400 mt-1">ID: a7f-99x-22b (New Device)</div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleLinkAnalysis()}
                                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg border border-gray-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Network className="w-4 h-4" />
                                        Deep Link Analysis
                                    </button>
                                    <button className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)]">
                                        Freeze Account
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-gray-950/30">
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                        <Bot className="w-4 h-4 text-purple-400" />
                                        AI Risk Rationale
                                    </h3>
                                    {isAnalyzing && !aiAnalysis ? (
                                        <div className="space-y-3 animate-pulse">
                                            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                                            <div className="h-4 bg-gray-800 rounded w-full"></div>
                                            <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                                        </div>
                                    ) : aiAnalysis ? (
                                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                                                {aiAnalysis}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 italic">Select a transaction to generate AI analysis...</div>
                                    )}
                                </div>

                                {/* Rules Triggered */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-300 mb-3">Rules Triggered</h3>
                                    <div className="space-y-2">
                                        {selectedAlert.rules.map((rule, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-red-900/10 border border-red-900/30 rounded">
                                                <span className="text-xs text-red-200">{rule}</span>
                                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select an alert to view details
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL: LINK ANALYSIS VISUALIZATION */}
                <div className="col-span-12 lg:col-span-3 bg-black flex flex-col">
                    <div className="p-4 border-b border-gray-800">
                        <h2 className="font-semibold text-gray-300 flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-indigo-400" />
                            Entity Graph
                        </h2>
                    </div>
                    <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
                        {showGraph ? (
                            <MockLinkGraph severity={selectedAlert?.severity || 'Low'} />
                        ) : (
                            <div className="text-center p-6">
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center mx-auto mb-4">
                                    <Network className="w-6 h-6 text-gray-600" />
                                </div>
                                <h3 className="text-gray-400 font-medium mb-2">No Graph Loaded</h3>
                                <p className="text-xs text-gray-600">
                                    Run Deep Link Analysis to visualize hidden relationships and potential fraud rings.
                                </p>
                            </div>
                        )}
                        
                        {/* Overlay Controls */}
                        {showGraph && (
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                <button className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 text-white">
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 text-white">
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// -------------------------------------------------------------------------
// SUB-COMPONENTS & HELPERS
// -------------------------------------------------------------------------

const MockLinkGraph: React.FC<{ severity: string }> = ({ severity }) => {
    // A simplified visual representation of a graph using SVG
    const color = severity === 'Critical' ? '#EF4444' : severity === 'High' ? '#F97316' : '#EAB308';
    
    return (
        <div className="relative w-full h-full animate-in fade-in duration-1000">
            <svg width="100%" height="100%" viewBox="0 0 400 400" className="opacity-80">
                {/* Connections */}
                <line x1="200" y1="200" x2="100" y2="100" stroke="#374151" strokeWidth="1" />
                <line x1="200" y1="200" x2="300" y2="100" stroke="#374151" strokeWidth="1" />
                <line x1="200" y1="200" x2="150" y2="300" stroke="#374151" strokeWidth="1" />
                <line x1="200" y1="200" x2="250" y2="300" stroke="#374151" strokeWidth="1" />
                <line x1="100" y1="100" x2="50" y2="150" stroke="#374151" strokeWidth="1" strokeDasharray="4" />
                
                {/* Central Node (The Subject) */}
                <circle cx="200" cy="200" r="20" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
                <circle cx="200" cy="200" r="8" fill={color} />
                
                {/* Connected Nodes (The Network) */}
                <g className="cursor-pointer hover:opacity-80">
                    <circle cx="100" cy="100" r="12" fill="#1F2937" stroke="#4B5563" strokeWidth="2" />
                    <text x="100" y="80" textAnchor="middle" fill="#9CA3AF" fontSize="10" fontFamily="monospace">Device Match</text>
                </g>

                <g className="cursor-pointer hover:opacity-80">
                    <circle cx="300" cy="100" r="12" fill="#1F2937" stroke="#4B5563" strokeWidth="2" />
                    <text x="300" y="80" textAnchor="middle" fill="#9CA3AF" fontSize="10" fontFamily="monospace">IP Match</text>
                </g>

                <g className="cursor-pointer hover:opacity-80">
                    <circle cx="150" cy="300" r="12" fill="#1F2937" stroke="#4B5563" strokeWidth="2" />
                </g>

                <g className="cursor-pointer hover:opacity-80">
                    <circle cx="250" cy="300" r="12" fill="#1F2937" stroke="#4B5563" strokeWidth="2" />
                </g>

                {/* Pulse Effect on Main Node */}
                <circle cx="200" cy="200" r="20" fill="none" stroke={color} strokeWidth="1">
                    <animate attributeName="r" from="20" to="30" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
            </svg>
            <div className="absolute top-4 left-4 bg-gray-900/80 p-2 rounded border border-gray-800 text-xs">
                <div className="text-gray-400 mb-1">Graph Complexity</div>
                <div className="font-mono text-cyan-400">Nodes: 5 | Edges: 6</div>
            </div>
        </div>
    );
};

// -------------------------------------------------------------------------
// TYPES & DATA
// -------------------------------------------------------------------------

import React from 'react';
import { ShieldAlert, Activity, AlertTriangle, Network, Share2, ZoomIn, ZoomOut, Pause, Play, Siren, MapPin, Smartphone, CreditCard, DollarSign, Bot } from 'lucide-react';

interface FraudAlert {
    id: string;
    type: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    riskScore: number;
    amount: number;
    user: string;
    timestamp: string;
    location: string;
    rules: string[];
    icon: any;
}

const INITIAL_ALERTS: FraudAlert[] = [
    {
        id: 'evt_993821',
        type: 'Velocity Check',
        severity: 'Critical',
        riskScore: 94,
        amount: 4500.00,
        user: 'Stark Industries Corp',
        timestamp: '10:42:05 AM',
        location: 'Lagos, NG',
        rules: ['Excessive transaction frequency', 'Geo-location mismatch (Home: NYC)', 'New device fingerprint'],
        icon: Activity
    },
    {
        id: 'evt_993820',
        type: 'Suspicious Merchant',
        severity: 'High',
        riskScore: 78,
        amount: 125.50,
        user: 'Alex Chen',
        timestamp: '10:41:12 AM',
        location: 'Online',
        rules: ['Merchant category high-risk', 'Pattern matches card testing'],
        icon: AlertTriangle
    },
    {
        id: 'evt_993819',
        type: 'Login Anomaly',
        severity: 'Medium',
        riskScore: 65,
        amount: 0,
        user: 'Sarah Connor',
        timestamp: '10:38:55 AM',
        location: 'Moscow, RU',
        rules: ['Login from unsanctioned region', 'Tor exit node detected'],
        icon: MapPin
    }
];

const generateMockAlert = (): FraudAlert => {
    const types = ['Velocity Check', 'Large Transfer', 'Device Mismatch', 'Login Anomaly', 'Structure Violation'];
    const users = ['Wayne Ent.', 'Cyberdyne Systems', 'Acme Corp', 'Tyrell Corp', 'Massive Dynamic'];
    const locations = ['London, UK', 'Beijing, CN', 'Sao Paulo, BR', 'Unknown Proxy', 'New York, US'];
    const severities: ('Critical' | 'High' | 'Medium' | 'Low')[] = ['Critical', 'High', 'Medium', 'Low'];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const riskScore = severity === 'Critical' ? 90 + Math.floor(Math.random() * 10) : 
                      severity === 'High' ? 70 + Math.floor(Math.random() * 20) : 
                      50 + Math.floor(Math.random() * 20);

    return {
        id: `evt_${Math.floor(Math.random() * 1000000)}`,
        type,
        severity,
        riskScore,
        amount: Math.floor(Math.random() * 10000),
        user: users[Math.floor(Math.random() * users.length)],
        timestamp: new Date().toLocaleTimeString(),
        location: locations[Math.floor(Math.random() * locations.length)],
        rules: ['Heuristic Analysis Triggered'],
        icon: Activity
    };
};

const generateAIAnalysis = (alert: FraudAlert): string => {
    return `Analysis of Event ${alert.id} indicates a strong correlation with known fraud patterns. 
    
    The user's device fingerprint does not match historical records (Confidence: 98%). Furthermore, the transaction originated from ${alert.location}, which is a geospatial impossibility given a transaction recorded 15 minutes prior in a different continent.
    
    Recommendation: Immediate temporary freeze of the instrument. Trigger step-up biometric authentication for next login.`;
};

export default FraudDetectionView;