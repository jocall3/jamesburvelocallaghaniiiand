

import React, { useState, useCallback, useMemo } from 'react';
import { 
  RefreshCw, Play, Save, History, Code, Settings, TrendingUp, DollarSign, X, User, LogOut,
  Plus, Search, Filter, ChevronDown, ChevronUp, BrainCircuit, Bot, SlidersHorizontal,
  LayoutDashboard, Repeat, Send, Target, Trophy, Heart, Briefcase, Link, Zap, Lock,
  Atom, Users, Megaphone, CreditCard, Handshake, Activity, Phone, Shield, Sparkles, Eye,
  Globe, Key, Receipt, Rocket, PieChart, Palette, Building, Wheat, Scale, Crown, FileText,
  Server, Network, GitBranch, HardDrive, Cpu, Database, Cloud, Terminal, BookOpen,
  BarChart2, CheckSquare, Calendar, MessageSquare, LifeBuoy
} from 'lucide-react';
import { Badge } from './badge'; // Fixed import case to match file name

// --- Expanded Data Models ---

interface SystemMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  aiPrediction: number;
  subMetrics?: { label: string; value: string }[];
}

interface AIInsight {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'market' | 'system' | 'security' | 'optimization' | 'regulatory';
  message: string;
  confidence: number;
  actionable: boolean;
  relatedEntityId?: string;
}

interface AlgorithmParameter {
  name: string;
  type: 'number' | 'string' | 'boolean';
  value: any;
  range?: [number, number];
  description: string;
}

interface Algorithm {
  id: string;
  name: string;
  description: string;
  tags: string[];
  code: string; // Can be JSON for No-Code or raw script
  language: 'nocode' | 'python' | 'rust';
  status: 'draft' | 'backtesting' | 'live' | 'error' | 'optimizing' | 'archived';
  version: number;
  lastModified: string;
  author: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  aiScore: number; // 0-100, AI's confidence in the algo's viability
  parameters: AlgorithmParameter[];
  deploymentTarget: 'cloud-cluster-a' | 'edge-node-tokyo' | 'quantum-fabric-1';
  performanceMetrics?: {
    pnl: number;
    return: number;
    sharpe: number;
    sortino: number;
    alpha: number;
    beta: number;
    volatility: number;
    winRate: number;
    maxDrawdown: number;
  };
  // "GEIN" implementation
  geinFactor: number;
  interactionMatrix: number[][];
  dataPointSensitivity: Record<string, number>;
  layerMetrics: Record<string, { gein: number; activation: number }>;
  executionPriority: 'low' | 'normal' | 'high' | 'critical' | 'quantum';
  computeProfile: 'cpu-bound' | 'memory-bound' | 'io-bound' | 'gpu-accelerated';
  dataSources: string[];
  dependencies: { name: string; version: string }[];
  permissions: string[];
  ownerTeam: string;
  isAudited: boolean;
  auditHistory: { date: string; auditor: string; result: 'pass' | 'fail' }[];
}

interface BacktestResult {
  runId: string;
  algorithmId: string;
  algorithmVersion: number;
  startDate: string;
  endDate:string;
  initialCapital: number;
  finalCapital: number;
  equityCurve: { date: string; value: number; aiForecast: number }[];
  metrics: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    trades: number;
    profitFactor: number;
    expectancy: number;
    avgTradeReturn: number;
  };
  parametersSnapshot: AlgorithmParameter[];
  aiAnalysis: string;
  tradeLog: { timestamp: string; type: 'buy' | 'sell'; asset: string; quantity: number; price: number; pnl: number }[];
}

interface UserProfile {
  id: string;
  name: string;
  role: 'Administrator' | 'Trader' | 'Quant' | 'Observer';
  clearanceLevel: number;
  email: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto' | 'matrix';
    notifications: 'all' | 'critical' | 'none';
    aiAssistanceLevel: 'minimal' | 'standard' | 'proactive';
    defaultView: string;
  };
  apiKeys: { service: string; key: string; lastUsed: string }[];
  security: {
    twoFactorEnabled: boolean;
    lastLogin: string;
    loginHistory: { timestamp: string; ip: string; status: 'success' | 'failed' }[];
  };
  stats: {
    loginCount: number;
    actionsPerformed: number;
    uptime: string;
    pnlContribution: number;
  };
}

// --- Data Utilities & Mocks ---

const generateTimeSeries = (points: number, startValue: number, volatility: number) => {
  const data = [];
  let currentValue = startValue;
  const now = new Date();
  for (let i = 0; i < points; i++) {
    const date = new Date(now.getTime() - (points - i) * 86400000).toISOString().split('T')[0];
    const change = (Math.random() - 0.5) * volatility;
    currentValue = currentValue * (1 + change);
    data.push({
      date,
      value: currentValue,
      aiForecast: currentValue * (1 + (Math.random() - 0.5) * 0.02)
    });
  }
  return data;
};

const mockInsights: AIInsight[] = [
  { id: 'ins-1', timestamp: '2023-10-27 09:15:00', severity: 'high', category: 'market', message: 'Detected arbitrage opportunity in FOREX/CRYPTO bridge.', confidence: 0.98, actionable: true, relatedEntityId: 'algo-3' },
  { id: 'ins-2', timestamp: '2023-10-27 09:30:00', severity: 'medium', category: 'optimization', message: 'Algorithm "Alpha-1" logic can be compressed by 15%. Suggest refactor.', confidence: 0.85, actionable: true, relatedEntityId: 'algo-1' },
  { id: 'ins-3', timestamp: '2023-10-27 10:00:00', severity: 'low', category: 'system', message: 'Global latency reduced by 4ms via AI routing.', confidence: 0.99, actionable: false },
  { id: 'ins-4', timestamp: '2023-10-27 10:45:00', severity: 'critical', category: 'security', message: 'Anomalous login attempt blocked by Neural Firewall.', confidence: 0.99, actionable: false },
  { id: 'ins-5', timestamp: '2023-10-27 11:00:00', severity: 'medium', category: 'regulatory', message: 'New SEC filing detected for AAPL. Potential volatility increase.', confidence: 0.92, actionable: true },
];

const initialAlgorithms: Algorithm[] = [
  { 
    id: 'algo-1', 
    name: 'Quantum Momentum Scalper v4', 
    description: 'High-frequency scalping strategy utilizing quantum-inspired principles for momentum prediction.',
    tags: ['HFT', 'Scalping', 'Momentum', 'Quantum'],
    code: '{"nodes":["Input: L2 Market Data Stream", "Filter: Volatility > 1.5", "AI Model: Quantum Trend Predictor", "Logic: If confidence > 0.95", "Action: Buy/Sell 100 units"]}', 
    language: 'nocode',
    status: 'live', 
    version: 4,
    lastModified: '2023-10-26',
    author: 'System Admin',
    riskLevel: 'high',
    aiScore: 94,
    parameters: [
      { name: 'Volatility Threshold', type: 'number', value: 1.5, range: [0.5, 5], description: 'Minimum volatility to activate trading.' },
      { name: 'Trade Size', type: 'number', value: 100, range: [10, 1000], description: 'Number of units per trade.' }
    ],
    deploymentTarget: 'cloud-cluster-a',
    performanceMetrics: { pnl: 125000, return: 45.2, sharpe: 2.1, sortino: 2.8, alpha: 0.15, beta: 0.8, volatility: 12.5, winRate: 68, maxDrawdown: -8.2 },
    geinFactor: 0.98,
    interactionMatrix: [[1, 0.2, -0.1], [0.2, 1, 0.5], [-0.1, 0.5, 1]],
    dataPointSensitivity: { 'L2.bid_price': 0.8, 'L2.ask_price': 0.8, 'volatility': 0.9 },
    layerMetrics: { 'input': { gein: 1.0, activation: 0.95 }, 'quantum_core': { gein: 0.99, activation: 0.98 }, 'output': { gein: 1.0, activation: 0.96 } },
    executionPriority: 'quantum',
    computeProfile: 'gpu-accelerated',
    dataSources: ['L2 Market Data Stream', 'Global News Feed API'],
    dependencies: [{ name: 'quantum-tensor-lib', version: '2.5.1' }],
    permissions: ['read:market_data', 'execute:trades'],
    ownerTeam: 'Quantum Core Team',
    isAudited: true,
    auditHistory: [{ date: '2023-09-15', auditor: 'Internal Security', result: 'pass' }]
  },
  { 
    id: 'algo-2', 
    name: 'Mean Reversion HFT (Neural)', 
    description: 'Neural network-based strategy that capitalizes on short-term mean reversion in liquid assets.',
    tags: ['HFT', 'Mean Reversion', 'AI', 'Market Making'],
    code: '{"nodes":["Input: Order Book Depth", "AI: Sentiment Analysis (News Feeds)", "Logic: Spread > 0.02% AND Reversion Signal", "Action: Market Make (Bid/Ask)"]}', 
    language: 'nocode',
    status: 'backtesting', 
    version: 12,
    lastModified: '2023-10-27',
    author: 'AI Architect',
    riskLevel: 'medium',
    aiScore: 88,
    parameters: [
      { name: 'Spread Threshold', type: 'number', value: 0.02, range: [0.01, 0.1], description: 'Minimum bid-ask spread to engage.' },
      { name: 'Sentiment Weight', type: 'number', value: 0.3, range: [0, 1], description: 'Influence of news sentiment on trade logic.' }
    ],
    deploymentTarget: 'edge-node-tokyo',
    performanceMetrics: { pnl: 45000, return: 12.5, sharpe: 1.8, sortino: 1.9, alpha: 0.05, beta: 0.2, volatility: 4.2, winRate: 55, maxDrawdown: -4.1 },
    geinFactor: 0.85,
    interactionMatrix: [[1, 0.7], [0.7, 1]],
    dataPointSensitivity: { 'spread': 0.9, 'sentiment': 0.6 },
    layerMetrics: { 'input': { gein: 1.0, activation: 0.9 }, 'neural_net': { gein: 0.8, activation: 0.92 }, 'output': { gein: 1.0, activation: 0.88 } },
    executionPriority: 'high',
    computeProfile: 'cpu-bound',
    dataSources: ['Order Book Depth', 'News Feeds'],
    dependencies: [{ name: 'sentiment-analyzer', version: '4.2.0' }],
    permissions: ['read:market_data', 'execute:trades'],
    ownerTeam: 'AI Research',
    isAudited: true,
    auditHistory: [{ date: '2023-08-20', auditor: 'External Audit Co.', result: 'pass' }]
  },
  { 
    id: 'algo-3', 
    name: 'Global Macro Arbitrage', 
    description: 'Long-term strategy identifying and exploiting price discrepancies between correlated global assets.',
    tags: ['Macro', 'Arbitrage', 'Global', 'Low-Risk'],
    code: '{"nodes":["Input: Global Indices (S&P, FTSE, NIKKEI)", "Input: Forex Rates (USD, EUR, JPY)", "Logic: Correlation Divergence > 2-sigma", "Action: Hedge Pair Trade"]}', 
    language: 'nocode',
    status: 'draft', 
    version: 1,
    lastModified: '2023-10-27',
    author: 'User',
    riskLevel: 'low',
    aiScore: 72,
    parameters: [
      { name: 'Correlation Window', type: 'number', value: 90, range: [30, 365], description: 'Lookback period for correlation calculation (days).' },
      { name: 'Sigma Threshold', type: 'number', value: 2, range: [1, 3], description: 'Standard deviation for divergence signal.' }
    ],
    deploymentTarget: 'quantum-fabric-1',
    geinFactor: 0.7,
    interactionMatrix: [[1, 0.85, 0.7], [0.85, 1, 0.75], [0.7, 0.75, 1]],
    dataPointSensitivity: { 'correlation_divergence': 0.95 },
    layerMetrics: { 'input': { gein: 1.0, activation: 0.99 }, 'logic': { gein: 0.9, activation: 0.9 }, 'output': { gein: 1.0, activation: 0.92 } },
    executionPriority: 'normal',
    computeProfile: 'memory-bound',
    dataSources: ['Global Indices API', 'Forex Rates API'],
    dependencies: [],
    permissions: ['read:market_data', 'execute:trades'],
    ownerTeam: 'Macro Analysis Desk',
    isAudited: false,
    auditHistory: []
  },
];

const mockUserProfile: UserProfile = {
  id: 'u-001',
  name: 'Trader',
  role: 'Administrator',
  clearanceLevel: 5,
  email: 'admin@local',
  preferences: { theme: 'dark', notifications: 'all', aiAssistanceLevel: 'proactive', defaultView: 'Executive Dashboard' },
  apiKeys: [{ service: 'Binance', key: 'bin_..._xyz', lastUsed: '2023-10-27 10:30:00' }],
  security: {
    twoFactorEnabled: true,
    lastLogin: '2023-10-27 09:00:00',
    loginHistory: [{ timestamp: '2023-10-27 09:00:00', ip: '127.0.0.1', status: 'success' }]
  },
  stats: { loginCount: 1420, actionsPerformed: 54300, uptime: '99.99%', pnlContribution: 170000 }
};

// --- Expanded UI Components ---

const Button = ({ icon: Icon, children, onClick, variant = 'primary', disabled = false, className = '', size = 'md' }: any) => {
  const baseClasses = "flex items-center justify-center space-x-2 rounded-lg text-sm transition duration-200 ease-in-out font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800";
  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  let colorClasses = "";

  switch (variant) {
    case 'primary': colorClasses = "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"; break;
    case 'secondary': colorClasses = "bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600 focus:ring-indigo-500 disabled:bg-gray-800 disabled:text-gray-500"; break;
    case 'danger': colorClasses = "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400"; break;
    case 'success': colorClasses = "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 disabled:bg-emerald-400"; break;
    case 'ghost': colorClasses = "bg-transparent text-gray-400 hover:bg-gray-700 hover:text-white disabled:text-gray-600 shadow-none"; break;
  }

  return (
    <button className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${colorClasses} ${className}`} onClick={onClick} disabled={disabled}>
      {Icon && <Icon className="w-4 h-4" />}
      {children && <span>{children}</span>}
    </button>
  );
};

const Card = ({ title, subtitle, children, className = '', actions = null, noPadding = false }: any) => (
  <div className={`bg-gray-800/50 backdrop-blur-sm shadow-2xl rounded-xl border border-gray-700 flex flex-col ${className}`}>
    {(title || actions) && (
      <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/30 rounded-t-xl">
        <div>
          <h3 className="text-lg font-bold text-gray-100">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>
    )}
    <div className={`${noPadding ? '' : 'p-6'} flex-grow overflow-auto custom-scrollbar`}>
      {children}
    </div>
  </div>
);

// Use the imported Badge component
const StatusBadge = ({ color, children }: { color: string, children: React.ReactNode }) => {
    let variant: "default" | "secondary" | "destructive" | "outline" | "live" = "default";
    if (color === 'green') variant = "default"; 
    if (color === 'yellow') variant = "secondary";
    if (color === 'gray') variant = "outline";
    
    return <Badge variant={variant}>{children}</Badge>;
};

const ProgressBar = ({ value, max = 100, color = 'indigo', label }: any) => (
  <div className="w-full">
    <div className="flex justify-between mb-1">
      {label && <span className="text-xs font-medium text-gray-300">{label}</span>}
      <span className="text-xs font-medium text-gray-400">{Math.round((value / max) * 100)}%</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2.5">
      <div className={`bg-gradient-to-r from-${color}-500 to-${color}-400 h-2.5 rounded-full transition-all duration-500`} style={{ width: `${(value / max) * 100}%` }}></div>
    </div>
  </div>
);

const Input = ({ label, type = 'text', value, onChange, placeholder, name }: any) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
    </div>
);

const Select = ({ label, value, onChange, children, name }: any) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
            {children}
        </select>
    </div>
);

const Tabs = ({ tabs, activeTab, setActiveTab }: { tabs: string[], activeTab: string, setActiveTab: (tab: string) => void }) => (
    <div className="border-b border-gray-700 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
            <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`${
                            tab === activeTab
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        {tab}
                    </button>
                ))}
            </nav>
        </div>
    </div>
);

// --- Dashboard Widgets & Views ---

const AIStatusMonitor = () => {
  const stats = [
    { label: 'Quantum Core Load', value: 78, color: 'indigo' },
    { label: 'Global Latency', value: 8, max: 50, color: 'green' },
    { label: 'Predictive Accuracy', value: 98.2, color: 'purple' },
    { label: 'Neural Firewall Threat', value: 2, color: 'red' },
  ];

  return (
    <Card title="AI System Status" subtitle="Real-time Quantum Core Monitoring">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, idx) => (
          <ProgressBar key={idx} label={stat.label} value={stat.value} max={stat.max || 100} color={stat.color} />
        ))}
      </div>
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Active AI Processes</h4>
        <div className="space-y-2 text-sm font-mono">
          {['Market Sentiment Analysis [PID: 2000]', 'Risk Vector Calculation [PID: 2015]', 'Liquidity Optimization [PID: 2030]', 'User Behavior Modeling [PID: 2045]', 'Regulatory Compliance Scan [PID: 2060]'].map((proc, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-900/50 rounded border border-gray-700">
              <span className="flex items-center text-cyan-400"><Cpu className="w-4 h-4 mr-2 text-cyan-500"/>{proc}</span>
              <span className="text-gray-500">OK</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const GlobalMarketPulse = () => {
  const markets = [
    { name: 'S&P 500', price: '4,120.50', change: '+0.45%', sentiment: 'Bullish', volatility: 'Low' },
    { name: 'BTC/USD', price: '64,230.00', change: '+2.10%', sentiment: 'Very Bullish', volatility: 'High' },
    { name: 'EUR/USD', price: '1.0850', change: '-0.12%', sentiment: 'Neutral', volatility: 'Low' },
    { name: 'Gold', price: '1,980.20', change: '+0.80%', sentiment: 'Bullish', volatility: 'Medium' },
    { name: 'Crude Oil', price: '78.40', change: '-1.20%', sentiment: 'Bearish', volatility: 'Medium' },
    { name: '10Y Treasury', price: '4.50%', change: '+0.02%', sentiment: 'Neutral', volatility: 'Low' },
  ];

  return (
    <Card title="Global Market Pulse" subtitle="AI-Driven Sentiment & Pricing" noPadding>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Asset</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Change</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">AI Sentiment</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Volatility</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800/30 divide-y divide-gray-700">
            {markets.map((m) => (
              <tr key={m.name} className="hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{m.name}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-300 font-mono">{m.price}</td>
                <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-bold ${m.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{m.change}</td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <Badge variant={m.sentiment.includes('Bullish') ? 'default' : m.sentiment.includes('Bearish') ? 'destructive' : 'secondary'}>{m.sentiment}</Badge>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <Badge variant={m.volatility === 'High' ? 'destructive' : m.volatility === 'Medium' ? 'secondary' : 'outline'}>{m.volatility}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const NoCodeEditor = ({ algorithm, onUpdateCode }: { algorithm: Algorithm, onUpdateCode: (code: string) => void }) => {
  const [blocks, setBlocks] = useState<string[]>(() => {
    try { return JSON.parse(algorithm.code).nodes || []; } catch { return []; }
  });

  const handleAddBlock = (type: string) => {
    const newBlock = `${type}: ${type === 'AI' ? 'Neural Optimization' : 'New Logic Node'}`;
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    onUpdateCode(JSON.stringify({ nodes: newBlocks }));
  };

  const handleOptimize = () => {
    const optimized = blocks.map(b => b.includes('AI') ? b : `${b} (Optimized)`);
    setBlocks(optimized);
    onUpdateCode(JSON.stringify({ nodes: optimized }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-900/50 rounded-lg border border-gray-700">
      <div className="p-3 border-b border-gray-700 bg-gray-800/50 rounded-t-lg flex flex-wrap gap-2">
        <Button icon={Database} onClick={() => handleAddBlock('Input')} variant="secondary" size="sm">Input</Button>
        <Button icon={TrendingUp} onClick={() => handleAddBlock('Indicator')} variant="secondary" size="sm">Indicator</Button>
        <Button icon={SlidersHorizontal} onClick={() => handleAddBlock('Logic')} variant="secondary" size="sm">Logic</Button>
        <Button icon={DollarSign} onClick={() => handleAddBlock('Action')} variant="secondary" size="sm">Action</Button>
        <div className="flex-grow"></div>
        <Button icon={Bot} onClick={handleOptimize} variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-700">AI Auto-Optimize</Button>
      </div>
      <div className="flex-grow p-4 overflow-y-auto space-y-3 custom-scrollbar">
        {blocks.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <Code className="w-12 h-12 mb-2 opacity-20" />
            <p>Use the toolbar to build your strategy.</p>
          </div>
        )}
        {blocks.map((block, index) => (
          <div key={index} className="group relative bg-gray-800 border border-indigo-900/50 p-4 rounded-lg shadow-sm hover:shadow-indigo-500/20 hover:shadow-lg transition-all flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-full absolute left-0 top-0 bottom-0 rounded-l-lg ${block.startsWith('Input') ? 'bg-blue-500' : block.startsWith('Action') ? 'bg-green-500' : 'bg-indigo-500'}`}></div>
              <span className="font-mono text-sm text-gray-300 ml-2">{block}</span>
            </div>
            <X className="w-4 h-4 text-gray-600 cursor-pointer hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
              const newBlocks = blocks.filter((_, i) => i !== index);
              setBlocks(newBlocks);
              onUpdateCode(JSON.stringify({ nodes: newBlocks }));
            }} />
          </div>
        ))}
      </div>
    </div>
  );
};

const AlgorithmParametersForm = ({ algorithm, onUpdate }: { algorithm: Algorithm, onUpdate: (params: AlgorithmParameter[]) => void }) => {
    const [params, setParams] = useState(algorithm.parameters);

    const handleChange = (index: number, value: any) => {
        const newParams = [...params];
        newParams[index].value = value;
        setParams(newParams);
    };

    const handleSave = () => {
        onUpdate(params);
    };

    return (
        <div className="p-6 space-y-6">
            {params.map((param, index) => (
                <div key={param.name}>
                    <label className="block text-sm font-medium text-gray-300">{param.name}</label>
                    <p className="text-xs text-gray-500 mb-2">{param.description}</p>
                    {param.type === 'number' && (
                        <input
                            type="number"
                            value={param.value}
                            onChange={(e) => handleChange(index, parseFloat(e.target.value))}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"
                        />
                    )}
                    {/* Add other types like boolean, string etc. */}
                </div>
            ))}
            <div className="pt-4 border-t border-gray-700">
                <Button icon={Save} onClick={handleSave} variant="primary">Save Parameters</Button>
            </div>
        </div>
    );
};

const Backtester = ({ algorithm }: { algorithm: Algorithm }) => {
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [isBacktesting, setIsBacktesting] = useState(false);

  const handleRun = useCallback(() => {
    setIsBacktesting(true);
    setTimeout(() => {
      const newResult: BacktestResult = {
        runId: `bt-${Date.now()}`,
        algorithmId: algorithm.id,
        algorithmVersion: algorithm.version,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        initialCapital: 100000,
        finalCapital: 100000 * (1 + (Math.random() * 40 + 10) / 100),
        equityCurve: generateTimeSeries(50, 100000, 0.05),
        metrics: {
          totalReturn: parseFloat((Math.random() * 40 + 10).toFixed(2)),
          sharpeRatio: parseFloat((Math.random() * 2 + 1).toFixed(2)),
          maxDrawdown: parseFloat((-Math.random() * 15).toFixed(2)),
          trades: Math.floor(Math.random() * 500 + 100),
          profitFactor: parseFloat((Math.random() * 1 + 1.2).toFixed(2)),
          expectancy: parseFloat((Math.random() * 0.5).toFixed(2)),
          avgTradeReturn: parseFloat((Math.random() * 0.2).toFixed(2)),
        },
        parametersSnapshot: algorithm.parameters,
        aiAnalysis: "Strategy exhibits strong momentum characteristics but may be overfitted to Q2 volatility. Suggest increasing stop-loss buffer by 0.5% and testing against 2022 data.",
        tradeLog: []
      };
      setResults([newResult, ...results]);
      setIsBacktesting(false);
    }, 1500);
  }, [algorithm, results]);

  const latest = results[0];

  return (
    <Card title="Simulation & Deployment" subtitle="Hyper-Realistic Backtesting Engine">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
             <Button icon={Play} onClick={handleRun} disabled={isBacktesting} variant="primary" className="w-full" size="lg">
               {isBacktesting ? 'Running Simulation...' : 'Run Hyper-Simulation'}
             </Button>
          </div>
        </div>

        {latest && (
          <div className="animate-fade-in space-y-4">
            <div className="bg-indigo-900/50 p-4 rounded-lg border border-indigo-700">
              <h4 className="font-bold text-indigo-300 flex items-center mb-2">
                <Bot className="w-4 h-4 mr-2" /> AI Analysis & Recommendations
              </h4>
              <p className="text-sm text-indigo-200 leading-relaxed">{latest.aiAnalysis}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Return', value: `+${latest.metrics.totalReturn}%`, color: 'text-green-400' },
                { label: 'Sharpe Ratio', value: latest.metrics.sharpeRatio, color: 'text-blue-400' },
                { label: 'Max Drawdown', value: `${latest.metrics.maxDrawdown}%`, color: 'text-red-400' },
                { label: 'Profit Factor', value: latest.metrics.profitFactor, color: 'text-purple-400' },
              ].map(m => (
                <div key={m.label} className="bg-gray-900/50 p-3 rounded border border-gray-700 shadow-sm">
                  <div className="text-xs text-gray-400 uppercase">{m.label}</div>
                  <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
                </div>
              ))}
            </div>
            
            <div className="h-32 bg-gray-900/50 rounded border border-gray-700 flex items-end justify-between px-2 pb-2 overflow-hidden">
               {latest.equityCurve.map((pt, i) => (
                 <div key={i} className="w-1 bg-indigo-500 hover:bg-indigo-400 transition-colors" style={{ height: `${(pt.value / 150000) * 100}%` }} title={`Date: ${pt.date}, Val: ${pt.value.toFixed(2)}`}></div>
               ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const AlgoList = ({ algorithms, selectedAlgo, onSelect, onCreate }: any) => (
  <Card title="Strategy Portfolio" subtitle="Managed Algorithms" actions={<Button icon={Plus} onClick={onCreate} variant="secondary" size="sm">New</Button>} className="h-full" noPadding>
    <div className="p-4 border-b border-gray-700">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search strategies..." className="w-full bg-gray-900 border border-gray-600 rounded-md pl-9 pr-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
    </div>
    <div className="space-y-3 p-4 overflow-y-auto custom-scrollbar">
      {(algorithms as Algorithm[]).map((algo: Algorithm) => (
        <div
          key={algo.id}
          onClick={() => onSelect(algo)}
          className={`p-4 rounded-lg cursor-pointer border-2 transition-all duration-200 ${selectedAlgo?.id === algo.id ? 'bg-indigo-900/50 border-indigo-500 shadow-lg shadow-indigo-900/50' : 'bg-gray-800 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-100">{algo.name}</h4>
            <Badge variant={algo.status === 'live' ? 'live' : algo.status === 'backtesting' ? 'secondary' : 'outline'}>{algo.status.toUpperCase()}</Badge>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>v{algo.version} &bull; {algo.author}</span>
            <span className="flex items-center text-indigo-400 font-semibold"><Bot className="w-3 h-3 mr-1" /> AI Score: {algo.aiScore}</span>
          </div>
          {algo.performanceMetrics && (
            <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-3 gap-2 text-xs">
              <div><span className="text-gray-500 block">Return</span><span className="font-medium text-green-400">+{algo.performanceMetrics.return}%</span></div>
              <div><span className="text-gray-500 block">Sharpe</span><span className="font-medium text-gray-300">{algo.performanceMetrics.sharpe}</span></div>
              <div><span className="text-gray-500 block">Win Rate</span><span className="font-medium text-gray-300">{algo.performanceMetrics.winRate}%</span></div>
            </div>
          )}
        </div>
      ))}
    </div>
  </Card>
);

// --- Navigation & Layout ---

const NAV_ITEMS = [
    { name: 'Executive Dashboard', icon: LayoutDashboard, category: 'Core' },
    { name: 'Algo-Trading Lab', icon: Code, category: 'Core', current: true },
    { name: 'Quantum Weaver AI', icon: BrainCircuit, category: 'Core' },
    { name: 'AI Financial Advisor', icon: Bot, category: 'Core' },
    { name: 'Advanced Charting', icon: BarChart2, category: 'Core' },
    { name: 'Market Scanner', icon: Search, category: 'Core' },
    { name: 'Gemini Thinking Console', icon: Sparkles, category: 'Gemini 2.5' },
    { name: 'Multimodal Input Analysis', icon: Eye, category: 'Gemini 2.5' },
    { name: 'Streaming Response Monitor', icon: Zap, category: 'Gemini 2.5' },
    { name: 'System Instruction Editor', icon: Terminal, category: 'Gemini 2.5' },
    { name: 'Chat History Explorer', icon: MessageSquare, category: 'Gemini 2.5' },
    { name: 'Global Transactions', icon: History, category: 'Treasury' },
    { name: 'Liquidity Transfer', icon: Send, category: 'Treasury' },
    { name: 'Budgetary Control', icon: Target, category: 'Treasury' },
    { name: 'Corporate Treasury', icon: Globe, category: 'Treasury' },
    { name: 'Modern Treasury API', icon: Key, category: 'Treasury' },
    { name: 'Strategic Goals', icon: Trophy, category: 'Strategy' },
    { name: 'Credit Health Monitor', icon: Heart, category: 'Strategy' },
    { name: 'Investment Portfolio', icon: Briefcase, category: 'Strategy' },
    { name: 'Venture Capital', icon: Rocket, category: 'Strategy' },
    { name: 'Private Equity', icon: Briefcase, category: 'Strategy' },
    { name: 'Mutual Fund Screener', icon: Filter, category: 'Strategy' },
    { name: 'ETF Hub', icon: PieChart, category: 'Strategy' },
    { name: 'Robo-Advisor Config', icon: Bot, category: 'Strategy' },
    { name: 'Web3 & Crypto Bridge', icon: Link, category: 'Markets' },
    { name: 'Forex Arbitrage Arena', icon: Scale, category: 'Markets' },
    { name: 'Commodities Exchange', icon: Wheat, category: 'Markets' },
    { name: 'Real Estate Empire', icon: Building, category: 'Markets' },
    { name: 'Art & NFT Vault', icon: Palette, category: 'Markets' },
    { name: 'Derivatives Desk', icon: PieChart, category: 'Markets' },
    { name: 'Options Chain', icon: Link, category: 'Markets' },
    { name: 'Futures Contracts', icon: FileText, category: 'Markets' },
    { name: 'Bond Analytics', icon: Scale, category: 'Markets' },
    { name: 'Dark Pool Routing', icon: Network, category: 'Markets' },
    { name: 'Exotic Derivatives', icon: Sparkles, category: 'Markets' },
    { name: 'Carbon Credit Trading', icon: Wheat, category: 'Markets' },
    { name: 'Tax Optimization AI', icon: Receipt, category: 'Finance' },
    { name: 'Legacy Planning', icon: BookOpen, category: 'Finance' },
    { name: 'Wealth Management', icon: Crown, category: 'Finance' },
    { name: 'Billing & Invoicing', icon: CreditCard, category: 'Finance' },
    { name: 'Expense Management', icon: Receipt, category: 'Finance' },
    { name: 'Capital Call Management', icon: Phone, category: 'Finance' },
    { name: 'Card Issuance (Marqeta)', icon: CreditCard, category: 'Integrations' },
    { name: 'Data Aggregation (Plaid)', icon: Link, category: 'Integrations' },
    { name: 'Payment Rails (Stripe)', icon: Zap, category: 'Integrations' },
    { name: 'Open Banking API', icon: Link, category: 'Integrations' },
    { name: 'Identity (SSO)', icon: Lock, category: 'Platform' },
    { name: 'Agent Marketplace', icon: Users, category: 'Platform' },
    { name: 'Ad Studio AI', icon: Megaphone, category: 'Platform' },
    { name: 'Card Customization', icon: CreditCard, category: 'Platform' },
    { name: 'DAO Governance', icon: Handshake, category: 'Platform' },
    { name: 'API Key Management', icon: Key, category: 'Platform' },
    { name: 'Webhook Subscriptions', icon: Send, category: 'Platform' },
    { name: 'System Status', icon: Activity, category: 'System' },
    { name: 'Security Center', icon: Shield, category: 'System' },
    { name: 'System Manifesto', icon: Eye, category: 'System' },
    { name: 'Audit Logs', icon: History, category: 'System' },
    { name: 'Disaster Recovery', icon: Server, category: 'System' },
    { name: 'Concierge', icon: Phone, category: 'Support' },
    { name: 'Philanthropy', icon: Heart, category: 'Support' },
    { name: 'Personalization', icon: Sparkles, category: 'Support' },
    { name: 'Knowledge Base', icon: BookOpen, category: 'Support' },
    { name: 'Live Chat Support', icon: MessageSquare, category: 'Support' },
    { name: 'Feature Requests', icon: Megaphone, category: 'Support' },
    { name: 'Risk Dashboard', icon: Shield, category: 'Risk Management' },
    { name: 'VaR Simulation', icon: BarChart2, category: 'Risk Management' },
    { name: 'Stress Testing', icon: Activity, category: 'Risk Management' },
    { name: 'Counterparty Risk', icon: Users, category: 'Risk Management' },
    { name: 'Credit Default Swaps', icon: FileText, category: 'Risk Management' },
    { name: 'Liquidity Risk', icon: LifeBuoy, category: 'Risk Management' },
    { name: 'Operational Risk', icon: SlidersHorizontal, category: 'Risk Management' },
    { name: 'Geopolitical Risk Map', icon: Globe, category: 'Risk Management' },
    { name: 'Model Risk Governance', icon: BrainCircuit, category: 'Risk Management' },
    { name: 'Compliance Hub', icon: CheckSquare, category: 'Compliance' },
    { name: 'Regulatory Reporting', icon: FileText, category: 'Compliance' },
    { name: 'Audit Trail', icon: History, category: 'Compliance' },
    { name: 'AML Monitoring', icon: Eye, category: 'Compliance' },
    { name: 'Trade Surveillance', icon: Search, category: 'Compliance' },
    { name: 'Policy Management', icon: BookOpen, category: 'Compliance' },
    { name: 'SEC Rule 15c3-5', icon: CheckSquare, category: 'Compliance' },
    { name: 'MiFID II Reporting', icon: FileText, category: 'Compliance' },
    { name: 'Data Lake Explorer', icon: Database, category: 'Data Science' },
    { name: 'Jupyter Notebooks', icon: BookOpen, category: 'Data Science' },
    { name: 'Model Training', icon: Cpu, category: 'Data Science' },
    { name: 'Feature Store', icon: HardDrive, category: 'Data Science' },
    { name: 'Data Visualization Lab', icon: BarChart2, category: 'Data Science' },
    { name: 'ETL Pipelines', icon: Repeat, category: 'Data Science' },
    { name: 'Alternative Data Hub', icon: HardDrive, category: 'Data Science' },
    { name: 'Cloud Infrastructure', icon: Cloud, category: 'Infrastructure' },
    { name: 'Network Topology', icon: Network, category: 'Infrastructure' },
    { name: 'Server Fleet Management', icon: Server, category: 'Infrastructure' },
    { name: 'CI/CD Pipelines', icon: GitBranch, category: 'Infrastructure' },
    { name: 'Terminal Access', icon: Terminal, category: 'Infrastructure' },
    { name: 'Quantum Fabric Status', icon: Atom, category: 'Infrastructure' },
    { name: 'Kubernetes Cluster', icon: Cloud, category: 'Infrastructure' },
    { name: 'Quarterly Reports', icon: PieChart, category: 'Reporting' },
    { name: 'Performance Attribution', icon: Trophy, category: 'Reporting' },
    { name: 'Client Statements', icon: Receipt, category: 'Reporting' },
    { name: 'P&L Analytics', icon: TrendingUp, category: 'Reporting' },
    { name: 'AUM Tracker', icon: DollarSign, category: 'Reporting' },
    { name: 'Investor Relations Portal', icon: Users, category: 'Client Relations' },
    { name: 'CRM Integration', icon: Handshake, category: 'Client Relations' },
    { name: 'Support Tickets', icon: LifeBuoy, category: 'Client Relations' },
    { name: 'Onboarding Wizard', icon: User, category: 'Client Relations' },
    { name: 'Global News Feed', icon: Globe, category: 'Market Intel' },
    { name: 'SEC Filings', icon: FileText, category: 'Market Intel' },
    { name: 'Social Media Sentiment', icon: Megaphone, category: 'Market Intel' },
    { name: 'Economic Calendar', icon: Calendar, category: 'Market Intel' },
    { name: 'Insider Trading Monitor', icon: Eye, category: 'Market Intel' },
    { name: 'Back Office Operations', icon: Briefcase, category: 'Operations' },
    { name: 'Settlements & Clearing', icon: CheckSquare, category: 'Operations' },
    { name: 'Corporate Actions', icon: Megaphone, 'category': 'Operations' },
    { name: 'Reconciliation Engine', icon: Repeat, category: 'Operations' },
    { name: 'Multi-Factor Auth', icon: Lock, category: 'Security' },
    { name: 'Intrusion Detection', icon: Shield, category: 'Security' },
    { name: 'Penetration Testing', icon: Target, category: 'Security' },
    { name: 'Bug Bounty Program', icon: Trophy, category: 'Security' },
];

const AppSidebar = ({ onNavigate, activeView }: any) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const groupedNavItems = useMemo(() => NAV_ITEMS.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof NAV_ITEMS>), []);

    return (
        <div className={`h-full bg-gray-900 text-white flex flex-col transition-all duration-300 shadow-2xl z-20 ${isCollapsed ? 'w-20' : 'w-72'}`}>
            <div className="p-5 flex items-center justify-between border-b border-gray-800 bg-gray-900 h-16">
                {!isCollapsed && (
                  <div>
                    <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-tighter">QUANTUM OS</h1>
                    <p className="text-[10px] text-gray-500 tracking-widest uppercase">High Frequency Trading</p>
                  </div>
                )}
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-4 border-b border-gray-800 bg-gray-800/50">
                <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors" onClick={() => onNavigate("Profile")}>
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-gray-700">TR</div>
                    {!isCollapsed && (
                      <div className="overflow-hidden"><p className="text-sm font-bold text-gray-200 truncate">Trader</p><p className="text-xs text-green-400 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span> Online</p></div>
                    )}
                </div>
            </div>

            <nav className="flex-grow overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {Object.entries(groupedNavItems).map(([category, items]: [string, typeof NAV_ITEMS]) => (
                    <div key={category}>
                        {!isCollapsed && <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{category}</h3>}
                        {items.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.name === activeView;
                            return (
                                <a key={item.name} href="#" onClick={(e) => { e.preventDefault(); onNavigate(item.name); }}
                                    className={`flex items-center p-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                                >
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                                    <span className={`ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{item.name}</span>
                                </a>
                            );
                        })}
                    </div>
                ))}
            </nav>
            
            <div className="p-4 border-t border-gray-800 bg-gray-900 text-xs text-gray-600 text-center">
              {!isCollapsed && "v12.8.1-Quantum | Secure Connection"}
            </div>
        </div>
    );
}

// --- Placeholder & Special Views ---

const AlgoTradingLab: React.FC = () => {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>(initialAlgorithms);
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'editor' | 'backtest' | 'params'>('list');

  const handleSelectAlgo = (algo: Algorithm) => {
    setSelectedAlgo(algo);
    setViewMode('editor');
  };

  const handleCreateAlgo = () => {
    const newAlgo: Algorithm = {
      id: `algo-${Date.now()}`,
      name: 'New Strategy',
      description: 'Draft strategy',
      tags: ['Draft'],
      code: '{"nodes":[]}',
      language: 'nocode',
      status: 'draft',
      version: 1,
      lastModified: new Date().toISOString().split('T')[0],
      author: 'User',
      riskLevel: 'low',
      aiScore: 50,
      parameters: [],
      deploymentTarget: 'cloud-cluster-a',
      geinFactor: 0.5,
      interactionMatrix: [],
      dataPointSensitivity: {},
      layerMetrics: {},
      executionPriority: 'normal',
      computeProfile: 'cpu-bound',
      dataSources: [],
      dependencies: [],
      permissions: [],
      ownerTeam: 'User',
      isAudited: false,
      auditHistory: []
    };
    setAlgorithms([...algorithms, newAlgo]);
    setSelectedAlgo(newAlgo);
    setViewMode('editor');
  };

  const updateAlgoCode = (code: string) => {
    if (selectedAlgo) {
      const updated = { ...selectedAlgo, code, lastModified: new Date().toISOString().split('T')[0] };
      setAlgorithms(algorithms.map(a => a.id === selectedAlgo.id ? updated : a));
      setSelectedAlgo(updated);
    }
  };

  const updateAlgoParams = (params: AlgorithmParameter[]) => {
    if (selectedAlgo) {
      const updated = { ...selectedAlgo, parameters: params, lastModified: new Date().toISOString().split('T')[0] };
      setAlgorithms(algorithms.map(a => a.id === selectedAlgo.id ? updated : a));
      setSelectedAlgo(updated);
    }
  };

  return (
    <div className="flex h-full space-x-6 p-6 bg-gray-900 min-h-screen text-white">
      <div className="w-1/4 min-w-[300px]">
        <AlgoList 
            algorithms={algorithms} 
            selectedAlgo={selectedAlgo} 
            onSelect={handleSelectAlgo} 
            onCreate={handleCreateAlgo}
        />
      </div>
      <div className="flex-grow flex flex-col space-y-6">
        {selectedAlgo ? (
          <Card title={selectedAlgo.name} subtitle={`${selectedAlgo.language.toUpperCase()} | v${selectedAlgo.version}`} 
            actions={
              <>
                <Button variant={viewMode === 'editor' ? 'primary' : 'ghost'} onClick={() => setViewMode('editor')} size="sm">Editor</Button>
                <Button variant={viewMode === 'params' ? 'primary' : 'ghost'} onClick={() => setViewMode('params')} size="sm">Params</Button>
                <Button variant={viewMode === 'backtest' ? 'primary' : 'ghost'} onClick={() => setViewMode('backtest')} size="sm">Simulate</Button>
              </>
            }
          >
            <div className="h-[600px]">
              {viewMode === 'editor' && <NoCodeEditor algorithm={selectedAlgo} onUpdateCode={updateAlgoCode} />}
              {viewMode === 'params' && <AlgorithmParametersForm algorithm={selectedAlgo} onUpdate={updateAlgoParams} />}
              {viewMode === 'backtest' && <Backtester algorithm={selectedAlgo} />}
            </div>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Code className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h2 className="text-2xl font-bold mb-2">Select a Strategy</h2>
              <p>Choose an algorithm from the list or create a new one to begin.</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-6">
             <AIStatusMonitor />
             <div className="col-span-2">
                <GlobalMarketPulse />
             </div>
        </div>
      </div>
    </div>
  );
};

export default AlgoTradingLab;
