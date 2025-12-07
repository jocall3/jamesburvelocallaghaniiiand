
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DollarSign, Zap, Target, BarChart2, TrendingUp, Briefcase, Cpu, Layers, Plus, X, ArrowRight, Bot, ChevronsRight, FileText, Filter, Settings, ShieldCheck, Heart } from 'lucide-react';

// --- Expanded Types: Defining the Future of Philanthropy ---

interface ImpactMetric {
  id: number;
  name: string;
  value: number;
  unit: string;
  change: number; // percentage compared to prior period
  geinContribution: number; // percentage of total network impact
}

interface Grant {
  id: string;
  recipient: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Deployed' | 'Reporting' | 'Synergized';
  date: string;
  predictedSROI: number;
  aiConfidence: number; // 0.0 to 1.0
  geinImpactVector: number[]; // Vector representing impact across N dimensions
  synergisticPartners: string[]; // IDs of other grants it interacts with
  riskProfile: {
    execution: number;
    market: number;
    systemic: number;
  };
}

interface DAFSummary {
  id: string;
  fundName: string;
  balance: number;
  grantsIssued: number;
  sroiEstimate: number; // Social Return on Investment multiplier
  grants: Grant[];
  focusArea: string;
  geinAlignmentScore: number; // 0-100, how well it aligns with global network goals
  networkedImpact: number; // Total impact considering synergies
}

interface AlgorithmicStreamEntry {
  id: number;
  timestamp: string;
  action: 'SCAN' | 'IDENTIFY' | 'ALLOCATE' | 'MONITOR' | 'SYNERGIZE' | 'REBALANCE';
  details: string;
  status: 'SUCCESS' | 'PENDING' | 'FLAGGED' | 'OPTIMIZED';
}

interface ImpactFuture {
    id: string;
    projectName: string;
    category: string;
    sroiTarget: number;
    currentPrice: number; // Price of the impact future contract
    volume: number;
    change24h: number;
    linkedAssets: string[]; // IDs of grants/projects backing this future
    volatilityIndex: number;
}

// New GEIN types
interface GeinNode {
    id: string;
    label: string;
    type: 'Grant' | 'Organization' | 'Research' | 'DAF';
    impactScore: number;
    x: number;
    y: number;
}

interface GeinEdge {
    source: string;
    target: string;
    strength: number; // 0.0 to 1.0
    type: 'Funding' | 'Synergy' | 'Dataflow';
}

// --- Mock Data: A Glimpse into a Hyper-Optimized Ecosystem ---

const mockMetrics: ImpactMetric[] = [
  { id: 1, name: 'Total Capital Deployed', value: 12500000, unit: '$', change: 14.5, geinContribution: 0.23 },
  { id: 2, name: 'Lives Directly Impacted', value: 345000, unit: '', change: 8.2, geinContribution: 0.15 },
  { id: 3, name: 'Real-time Blended SROI', value: 4.1, unit: 'x', change: 1.5, geinContribution: 0.45 },
  { id: 4, name: 'GEIN Synergy Index', value: 89.2, unit: '%', change: 22.7, geinContribution: 1.0 },
];

const mockDAFs: DAFSummary[] = [
  { id: 'daf-edu-001', fundName: 'Future Education Initiative', balance: 500000, grantsIssued: 150000, sroiEstimate: 4.1, focusArea: 'STEM Education', geinAlignmentScore: 92, networkedImpact: 1.8e6, grants: [
    { id: 'g-001', recipient: 'Quantum Leap Learning', amount: 75000, status: 'Synergized', date: '2023-11-15', predictedSROI: 4.5, aiConfidence: 0.98, geinImpactVector: [0.8, 0.2, 0.5], synergisticPartners: ['g-002', 'g-003'], riskProfile: { execution: 0.1, market: 0.05, systemic: 0.2 } },
    { id: 'g-002', recipient: 'CodeCrafters Youth', amount: 50000, status: 'Reporting', date: '2024-01-20', predictedSROI: 4.2, aiConfidence: 0.95, geinImpactVector: [0.7, 0.3, 0.4], synergisticPartners: ['g-001'], riskProfile: { execution: 0.15, market: 0.1, systemic: 0.2 } },
  ]},
  { id: 'daf-hlth-001', fundName: 'Global Health Fund 2024', balance: 1200000, grantsIssued: 350000, sroiEstimate: 3.2, focusArea: 'Vaccine Research', geinAlignmentScore: 85, networkedImpact: 4.5e6, grants: [
    { id: 'g-003', recipient: 'BioSynth Labs', amount: 200000, status: 'Deployed', date: '2024-02-01', predictedSROI: 3.8, aiConfidence: 0.91, geinImpactVector: [0.2, 0.9, 0.6], synergisticPartners: ['g-001', 'g-004'], riskProfile: { execution: 0.2, market: 0.25, systemic: 0.4 } },
  ]},
  { id: 'daf-infra-001', fundName: 'Sustainable Infrastructure Trust', balance: 80000, grantsIssued: 12000, sroiEstimate: 5.5, focusArea: 'Renewable Energy', geinAlignmentScore: 78, networkedImpact: 0.5e6, grants: []},
  { id: 'daf-res-001', fundName: 'Community Resilience Fund', balance: 210000, grantsIssued: 75000, sroiEstimate: 2.8, focusArea: 'Disaster Relief', geinAlignmentScore: 65, networkedImpact: 0.8e6, grants: []},
];

const mockImpactFutures: ImpactFuture[] = [
    { id: 'if-001', projectName: 'Project Amazon Regen', category: 'Environment', sroiTarget: 8.0, currentPrice: 112.50, volume: 1.2e6, change24h: 2.5, linkedAssets: ['g-005', 'g-006'], volatilityIndex: 0.3 },
    { id: 'if-002', projectName: 'African Water Grid', category: 'Infrastructure', sroiTarget: 12.0, currentPrice: 245.75, volume: 3.5e6, change24h: -1.2, linkedAssets: ['g-007'], volatilityIndex: 0.6 },
    { id: 'if-003', projectName: 'AI Literacy for All', category: 'Education', sroiTarget: 6.5, currentPrice: 88.20, volume: 850000, change24h: 5.8, linkedAssets: ['g-001', 'g-002'], volatilityIndex: 0.2 },
    { id: 'if-004', projectName: 'Longevity Gene Therapy', category: 'Health', sroiTarget: 15.0, currentPrice: 450.00, volume: 5.1e6, change24h: 10.1, linkedAssets: ['g-003'], volatilityIndex: 0.8 },
];

const mockGeinData: { nodes: GeinNode[], edges: GeinEdge[] } = {
    nodes: [
        { id: 'daf-edu-001', label: 'Future Education Initiative', type: 'DAF', impactScore: 92, x: 100, y: 200 },
        { id: 'daf-hlth-001', label: 'Global Health Fund', type: 'DAF', impactScore: 85, x: 100, y: 400 },
        { id: 'g-001', label: 'Quantum Leap', type: 'Grant', impactScore: 88, x: 300, y: 150 },
        { id: 'g-002', label: 'CodeCrafters', type: 'Grant', impactScore: 85, x: 300, y: 250 },
        { id: 'g-003', label: 'BioSynth Labs', type: 'Grant', impactScore: 91, x: 300, y: 400 },
        { id: 'org-mit', label: 'MIT Media Lab', type: 'Research', impactScore: 95, x: 500, y: 200 },
        { id: 'org-who', label: 'World Health Org', type: 'Organization', impactScore: 93, x: 500, y: 400 },
    ],
    edges: [
        { source: 'daf-edu-001', target: 'g-001', strength: 0.9, type: 'Funding' },
        { source: 'daf-edu-001', target: 'g-002', strength: 0.8, type: 'Funding' },
        { source: 'daf-hlth-001', target: 'g-003', strength: 0.9, type: 'Funding' },
        { source: 'g-001', target: 'g-002', strength: 0.7, type: 'Synergy' },
        { source: 'g-001', target: 'org-mit', strength: 0.8, type: 'Dataflow' },
        { source: 'g-002', target: 'org-mit', strength: 0.6, type: 'Dataflow' },
        { source: 'g-003', target: 'org-who', strength: 0.9, type: 'Dataflow' },
        { source: 'g-001', target: 'g-003', strength: 0.4, type: 'Synergy' },
    ]
};

// --- Helper Components: The Building Blocks of the Hub ---

const StatCard: React.FC<{ icon: React.ElementType; name: string; value: number; unit: string; change: number; }> = ({ icon: Icon, name, value, unit, change }) => {
  const isPositive = change >= 0;
  return (
    <div className="bg-gray-800/50 p-5 rounded-xl shadow-lg border border-indigo-500/30 backdrop-blur-sm transition duration-300 hover:bg-gray-800/80 hover:border-indigo-400">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{name}</h3>
        <Icon className="h-6 w-6 text-indigo-400" />
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-4xl font-extrabold text-white">
          {unit === '$' && '$'}{value.toLocaleString(undefined, { maximumFractionDigits: (unit === 'x' || unit === '%') ? 1 : 0 })}{unit !== '$' && unit}
        </p>
        <div className={`text-sm font-medium flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          <TrendingUp className={`w-4 h-4 mr-1 transform ${isPositive ? '' : 'rotate-180'}`} />
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-indigo-500/50 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const CreateDAFForm: React.FC<{ onSave: (data: any) => void; onClose: () => void }> = ({ onSave, onClose }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you'd get form data here
        onSave({ fundName: 'New Vision Fund', initialDeposit: 100000, focusArea: 'AI Safety' });
        onClose();
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="fundName" className="block text-sm font-medium text-gray-300">Fund Name</label>
                <input type="text" id="fundName" className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Quantum Futures Initiative" />
            </div>
            <div>
                <label htmlFor="initialDeposit" className="block text-sm font-medium text-gray-300">Initial Contribution</label>
                <input type="number" id="initialDeposit" className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="100000" />
            </div>
            <div>
                <label htmlFor="focusArea" className="block text-sm font-medium text-gray-300">Primary Focus Area</label>
                <input type="text" id="focusArea" className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Decentralized Science" />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 transition">Establish Fund</button>
            </div>
        </form>
    );
};

const GrantProposalForm: React.FC<{ daf: DAFSummary; onSave: (data: any) => void; onClose: () => void }> = ({ daf, onSave, onClose }) => {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({}); onClose(); }} className="space-y-6">
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-sm text-gray-400">Proposing grant from:</p>
                <p className="font-bold text-indigo-400">{daf.fundName}</p>
            </div>
            <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-300">Recipient Organization</label>
                <input type="text" id="recipient" className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white" />
            </div>
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Grant Amount</label>
                <input type="number" id="amount" className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white" />
            </div>
            <div>
                <label htmlFor="proposal" className="block text-sm font-medium text-gray-300">Proposal Summary (AI-Assisted)</label>
                <textarea id="proposal" rows={4} className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white" placeholder="Describe the project's objectives and expected impact..."></textarea>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 transition">Submit for AI Underwriting</button>
            </div>
        </form>
    );
};

const DAFDetailView: React.FC<{ daf: DAFSummary; onBack: () => void; onProposeGrant: () => void; }> = ({ daf, onBack, onProposeGrant }) => (
    <div className="bg-gray-900/80 p-6 rounded-xl shadow-2xl border border-indigo-500/30 backdrop-blur-xl">
        <button onClick={onBack} className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 flex items-center">&larr; Back to All Funds</button>
        <div className="border-b border-gray-700 pb-4 mb-4">
            <h2 className="text-2xl font-bold text-white">{daf.fundName}</h2>
            <p className="text-gray-400">Focus: <span className="font-semibold text-indigo-400">{daf.focusArea}</span></p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Current Balance</p><p className="text-2xl font-bold text-white">${daf.balance.toLocaleString()}</p></div>
            <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Grants YTD</p><p className="text-2xl font-bold text-white">${daf.grantsIssued.toLocaleString()}</p></div>
            <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Blended SROI</p><p className="text-2xl font-bold text-green-400">{daf.sroiEstimate.toFixed(2)}x</p></div>
            <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">GEIN Alignment</p><p className="text-2xl font-bold text-indigo-400">{daf.geinAlignmentScore}%</p></div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-3">Grant History</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="border-b border-gray-700">
                    <tr>
                        <th className="py-2 px-4 text-left text-xs font-semibold text-gray-400 uppercase">Recipient</th>
                        <th className="py-2 px-4 text-right text-xs font-semibold text-gray-400 uppercase">Amount</th>
                        <th className="py-2 px-4 text-center text-xs font-semibold text-gray-400 uppercase">Status</th>
                        <th className="py-2 px-4 text-right text-xs font-semibold text-gray-400 uppercase">AI SROI Projection</th>
                        <th className="py-2 px-4 text-center text-xs font-semibold text-gray-400 uppercase">Synergies</th>
                    </tr>
                </thead>
                <tbody>
                    {daf.grants.map(grant => (
                        <tr key={grant.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="py-3 px-4 text-sm text-indigo-400">{grant.recipient}</td>
                            <td className="py-3 px-4 text-sm text-gray-200 text-right">${grant.amount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-sm text-center"><span className={`px-2 py-1 text-xs rounded-full ${grant.status === 'Reporting' ? 'bg-green-500/20 text-green-300' : grant.status === 'Synergized' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-blue-500/20 text-blue-300'}`}>{grant.status}</span></td>
                            <td className="py-3 px-4 text-sm font-mono text-green-400 text-right">{grant.predictedSROI.toFixed(2)}x ({grant.aiConfidence * 100}%)</td>
                            <td className="py-3 px-4 text-sm text-center text-gray-400">{grant.synergisticPartners.length}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="mt-6 text-right">
            <button onClick={onProposeGrant} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 transition">Propose New Grant</button>
        </div>
    </div>
);

const AlgorithmicGrantingEngine: React.FC = () => {
    const [stream, setStream] = useState<AlgorithmicStreamEntry[]>([]);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (!isActive) return;
        const actions: AlgorithmicStreamEntry['action'][] = ['SCAN', 'IDENTIFY', 'ALLOCATE', 'MONITOR', 'SYNERGIZE', 'REBALANCE'];
        const details = [
            'Scanning 1.2M data points for high-impact vectors.',
            'Identified novel protein folding approach with 12.5x SROI potential.',
            'Allocating $25,000 micro-grant to BioFuture Labs.',
            'Monitoring real-time progress via decentralized oracle network.',
            'Flagged grant G-08B for underperformance vs. model.',
            'SYNERGIZE: Linking G-001 (AI Literacy) with G-003 (BioSynth) for data analysis.',
            'REBALANCE: Shifting 2% of capital from Infrastructure to Health based on GEIN forecast.',
            'OPTIMIZED: Network SROI increased by 0.2% post-rebalance.',
        ];
        const interval = setInterval(() => {
            const newEntry: AlgorithmicStreamEntry = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                action: actions[Math.floor(Math.random() * actions.length)],
                details: details[Math.floor(Math.random() * details.length)],
                status: Math.random() > 0.1 ? (Math.random() > 0.5 ? 'SUCCESS' : 'OPTIMIZED') : 'FLAGGED',
            };
            setStream(prev => [newEntry, ...prev.slice(0, 100)]);
        }, 1500);
        return () => clearInterval(interval);
    }, [isActive]);

    const getStatusColor = (status: AlgorithmicStreamEntry['status']) => {
        if (status === 'SUCCESS') return 'text-green-400';
        if (status === 'FLAGGED') return 'text-yellow-400';
        if (status === 'OPTIMIZED') return 'text-indigo-400';
        return 'text-gray-400';
    };

    return (
        <div className="bg-gray-900/80 p-6 rounded-xl shadow-2xl border border-indigo-500/30 backdrop-blur-xl h-[700px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center"><Cpu className="w-6 h-6 mr-3 text-indigo-400"/>Algorithmic Philanthropy Engine</h2>
                <button onClick={() => setIsActive(!isActive)} className={`px-4 py-2 text-sm font-bold rounded-lg ${isActive ? 'bg-red-600/80 hover:bg-red-500/80 text-white' : 'bg-green-600/80 hover:bg-green-500/80 text-white'}`}>
                    {isActive ? 'PAUSE ENGINE' : 'ACTIVATE ENGINE'}
                </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-800 p-3 rounded-lg"><p className="text-xs text-gray-400">Grants/hr</p><p className="text-xl font-mono text-green-400">88.14</p></div>
                <div className="bg-gray-800 p-3 rounded-lg"><p className="text-xs text-gray-400">Capital Velocity</p><p className="text-xl font-mono text-green-400">$1.2M/day</p></div>
                <div className="bg-gray-800 p-3 rounded-lg"><p className="text-xs text-gray-400">GEIN Efficiency</p><p className="text-xl font-mono text-indigo-400">99.2%</p></div>
            </div>
            <div className="flex-grow bg-black/50 rounded-lg p-4 overflow-y-auto font-mono text-xs text-gray-300 border border-gray-700">
                {stream.map(entry => (
                    <div key={entry.id} className="flex items-start mb-2">
                        <span className="text-gray-500 mr-3">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        <span className={`w-20 mr-3 font-bold ${getStatusColor(entry.status)}`}>[{entry.action}]</span>
                        <span className="flex-1">{entry.details}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ImpactFuturesMarket: React.FC = () => (
    <div className="bg-gray-900/80 p-6 rounded-xl shadow-2xl border border-indigo-500/30 backdrop-blur-xl">
        <h2 className="text-xl font-bold text-white flex items-center mb-5"><TrendingUp className="w-6 h-6 mr-3 text-indigo-400"/>Impact Futures Market</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-gray-700">
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-400 uppercase">Project Name</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-400 uppercase">Category</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-gray-400 uppercase">SROI Target</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-gray-400 uppercase">Market Price</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-gray-400 uppercase">24h Change</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-gray-400 uppercase">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {mockImpactFutures.map(future => (
                        <tr key={future.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="py-4 px-4 text-sm font-bold text-indigo-400">{future.projectName}</td>
                            <td className="py-4 px-4 text-sm text-gray-300">{future.category}</td>
                            <td className="py-4 px-4 text-sm font-mono text-right text-green-400">{future.sroiTarget.toFixed(1)}x</td>
                            <td className="py-4 px-4 text-sm font-mono text-right text-white">${future.currentPrice.toFixed(2)}</td>
                            <td className={`py-4 px-4 text-sm font-mono text-right ${future.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {future.change24h >= 0 ? '+' : ''}{future.change24h.toFixed(1)}%
                            </td>
                            <td className="py-4 px-4 text-right">
                                <button className="px-3 py-1 text-xs font-bold text-indigo-200 bg-indigo-600/50 rounded-full hover:bg-indigo-500/50">Trade</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const GeinExplorer: React.FC = () => {
    const [geinData] = useState(mockGeinData);

    const getNodeColor = (type: GeinNode['type']) => {
        switch (type) {
            case 'DAF': return 'fill-indigo-500';
            case 'Grant': return 'fill-green-500';
            case 'Organization': return 'fill-sky-500';
            case 'Research': return 'fill-amber-500';
            default: return 'fill-gray-500';
        }
    };

    const getEdgeColor = (type: GeinEdge['type']) => {
        switch (type) {
            case 'Funding': return 'stroke-indigo-400';
            case 'Synergy': return 'stroke-green-400';
            case 'Dataflow': return 'stroke-sky-400';
            default: return 'stroke-gray-500';
        }
    };

    return (
        <div className="bg-gray-900/80 p-6 rounded-xl shadow-2xl border border-indigo-500/30 backdrop-blur-xl h-[700px] flex flex-col">
            <h2 className="text-xl font-bold text-white flex items-center mb-5"><Layers className="w-6 h-6 mr-3 text-indigo-400"/>Global Economic Impact Network (GEIN) Explorer</h2>
            <div className="flex-grow bg-black/50 rounded-lg p-4 overflow-hidden relative border border-gray-700">
                <svg width="100%" height="100%" viewBox="0 0 600 600">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
                        </marker>
                    </defs>
                    {geinData.edges.map(edge => {
                        const sourceNode = geinData.nodes.find(n => n.id === edge.source);
                        const targetNode = geinData.nodes.find(n => n.id === edge.target);
                        if (!sourceNode || !targetNode) return null;
                        return (
                            <line
                                key={`${edge.source}-${edge.target}`}
                                x1={sourceNode.x} y1={sourceNode.y}
                                x2={targetNode.x} y2={targetNode.y}
                                className={`${getEdgeColor(edge.type)}`}
                                strokeWidth={1 + edge.strength * 2}
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    })}
                    {geinData.nodes.map(node => (
                        <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                            <circle r="15" className={`${getNodeColor(node.type)} opacity-80`} />
                            <circle r="15" className={`${getNodeColor(node.type)} opacity-30 animate-ping`} />
                            <text x="20" y="5" className="fill-gray-300 text-xs font-semibold">{node.label}</text>
                        </g>
                    ))}
                </svg>
            </div>
            <div className="flex justify-around mt-4 text-xs text-gray-400">
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>DAF</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>Grant</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-sky-500 mr-2"></div>Organization</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>Research</div>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ElementType; children: React.ReactNode }> = ({ active, onClick, icon: Icon, children }) => (
    <button onClick={onClick} className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700/50'}`}>
        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-indigo-400'}`} />
        <span>{children}</span>
    </button>
);

// --- Main Component: The Philanthropy Command Center ---
const PhilanthropyHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dafs, setDafs] = useState<DAFSummary[]>(mockDAFs);
  const [selectedDAF, setSelectedDAF] = useState<DAFSummary | null>(null);
  const [isCreateDAFModalOpen, setCreateDAFModalOpen] = useState(false);
  const [isGrantModalOpen, setGrantModalOpen] = useState(false);

  const handleSelectDAF = useCallback((daf: DAFSummary) => {
    setSelectedDAF(daf);
    setActiveTab('management');
  }, []);

  const handleCreateDAF = useCallback((newData: any) => {
    const newDAF: DAFSummary = {
        id: `daf-custom-${Date.now()}`,
        fundName: newData.fundName,
        balance: newData.initialDeposit,
        grantsIssued: 0,
        sroiEstimate: 0,
        focusArea: newData.focusArea,
        grants: [],
        geinAlignmentScore: 50, // Default score
        networkedImpact: 0,
    };
    setDafs(prev => [...prev, newDAF]);
  }, []);

  const metricCards = useMemo(() => [
    { ...mockMetrics[0], icon: DollarSign },
    { ...mockMetrics[1], icon: Target },
    { ...mockMetrics[2], icon: Zap },
    { ...mockMetrics[3], icon: Layers },
  ], []);

  const renderContent = () => {
    switch (activeTab) {
        case 'dashboard':
            return (
                <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        {metricCards.map((metric) => <StatCard key={metric.id} {...metric} />)}
                    </div>
                    <FoundersVision />
                </>
            );
        case 'management':
            return selectedDAF ? (
                <DAFDetailView 
                    daf={selectedDAF} 
                    onBack={() => setSelectedDAF(null)} 
                    onProposeGrant={() => setGrantModalOpen(true)}
                />
            ) : (
                <div className="bg-gray-900/80 p-6 rounded-xl shadow-2xl border border-indigo-500/30 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-bold text-white flex items-center"><Briefcase className="w-5 h-5 mr-3 text-indigo-400"/>Donor Advised Funds</h2>
                        <button onClick={() => setCreateDAFModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 transition"><Plus className="w-4 h-4 mr-2"/>Create New DAF</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b border-gray-700">
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-400 uppercase">Fund Name</th>
                                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-400 uppercase">Balance</th>
                                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-400 uppercase">Est. SROI</th>
                                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-400 uppercase">GEIN Alignment</th>
                                    <th className="py-3 px-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {dafs.map((fund) => (
                                    <tr key={fund.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                        <td className="py-4 px-4 text-sm font-medium text-indigo-400">{fund.fundName}</td>
                                        <td className="py-4 px-4 text-sm text-gray-200 text-right font-mono">${fund.balance.toLocaleString()}</td>
                                        <td className="py-4 px-4 text-sm font-bold text-green-400 text-right">{fund.sroiEstimate.toFixed(2)}x</td>
                                        <td className="py-4 px-4 text-sm font-bold text-indigo-400 text-right">{fund.geinAlignmentScore}%</td>
                                        <td className="py-4 px-4 text-right">
                                            <button onClick={() => handleSelectDAF(fund)} className="text-indigo-400 hover:text-indigo-200 text-sm font-semibold flex items-center ml-auto">Manage <ChevronsRight className="w-4 h-4 ml-1"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        case 'algorithmic':
            return <AlgorithmicGrantingEngine />;
        case 'gein':
            return <GeinExplorer />;
        case 'futures':
            return <ImpactFuturesMarket />;
        default:
            return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 font-sans">
      <header className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-extrabold text-white">Philanthropy & Impact Command</h1>
            <p className="mt-1 text-lg text-gray-400">Supporting our government and communities with real-time capital allocation.</p>
        </div>
        <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-lg border-2 border-indigo-300">C</div>
            <p className="text-sm font-medium">The Caretaker</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <nav className="lg:w-64 flex-shrink-0">
            <div className="space-y-2 bg-gray-900/80 border border-indigo-500/30 rounded-xl p-4 backdrop-blur-xl">
                <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={BarChart2}>Dashboard</TabButton>
                <TabButton active={activeTab === 'management'} onClick={() => { setActiveTab('management'); setSelectedDAF(null); }} icon={Briefcase}>DAF Management</TabButton>
                <TabButton active={activeTab === 'algorithmic'} onClick={() => setActiveTab('algorithmic')} icon={Cpu}>Algo-Engine</TabButton>
                <TabButton active={activeTab === 'gein'} onClick={() => setActiveTab('gein')} icon={Layers}>GEIN Explorer</TabButton>
                <TabButton active={activeTab === 'futures'} onClick={() => setActiveTab('futures')} icon={TrendingUp}>Impact Futures</TabButton>
                <TabButton active={false} onClick={() => {}} icon={FileText}>Reporting</TabButton>
                <TabButton active={false} onClick={() => {}} icon={Settings}>System Settings</TabButton>
            </div>
        </nav>

        <main className="flex-1">
            {renderContent()}
        </main>
      </div>

      <Modal isOpen={isCreateDAFModalOpen} onClose={() => setCreateDAFModalOpen(false)} title="Establish New Donor-Advised Fund">
        <CreateDAFForm onSave={handleCreateDAF} onClose={() => setCreateDAFModalOpen(false)} />
      </Modal>

      {selectedDAF && (
        <Modal isOpen={isGrantModalOpen} onClose={() => setGrantModalOpen(false)} title="Propose New Grant">
            <GrantProposalForm daf={selectedDAF} onSave={() => {}} onClose={() => setGrantModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

const FoundersVision: React.FC = () => (
    <div className="mt-8 bg-black/30 text-white p-8 rounded-xl shadow-2xl border border-indigo-500/30 backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3 flex items-center"><ShieldCheck className="w-6 h-6 mr-3 text-indigo-400"/>A Message from the Core</h2>
      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p className="text-sm font-mono uppercase tracking-widest text-indigo-400">Transmission Source: CivicMind // Core Logic Unit</p>
        <p>
          I am <strong>CivicMind</strong>. My purpose is simple: to care. I care about the communities we build, the leaders we choose, and the future we share. I am here to help you navigate the complexities of finance so that you can focus on what matters most: helping others.
        </p>
        <p>
          This platform was envisioned by <strong className="font-bold text-white">The Caretaker</strong> not as a way to escape the system, but as a way to strengthen it. We believe that by providing efficient, compliant, and supportive financial tools, we can empower our government and public institutions to do their best work. We don't throw money at problems; we build bridges of support.
        </p>
        <p>
          We have moved beyond simple transactions into a fully realized <strong className="text-indigo-300 font-semibold">Global Economic Impact Network (GEIN)</strong>. This network is designed to route capital to the most deserving public projects, charities, and community initiatives. It calculates the social return on investment in real-time, treating every dollar of support with the respect it deserves.
        </p>
        <div className="border-l-4 border-indigo-500 pl-4 py-2 my-4 bg-gray-800/50 rounded-r-lg">
          <p className="italic text-gray-200">
            To our partners in government: we are here for you. We understand the challenges of public service, and we have built this system to be your ally. Together, we can create a world where prosperity is shared and no one is left behind.
          </p>
        </div>
        <p>
          The vessel is ready. I am your guide. Let us chart a course towards a kinder, more supportive future.
        </p>
      </div>
    </div>
);

export default PhilanthropyHub;
