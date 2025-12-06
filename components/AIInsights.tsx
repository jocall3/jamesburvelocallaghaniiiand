
import React, { useContext, useState, useMemo } from 'react';
import Card from './Card';
import type { AIInsight } from '../types';
import { DataContext } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LineChart, Line, CartesianGrid } from 'recharts';

// --- GEIN-Enhanced Component Ecosystem for Hyper-Scale AI-Driven Trading ---

// Expanded AIInsight type to represent a deeply interconnected, multi-faceted data structure.
export interface EnhancedAIInsight extends AIInsight {
    confidenceScore: number;
    actionable: boolean;
    actionType?: 'rebalance_portfolio' | 'set_stop_loss' | 'execute_trade' | 'liquidity_provision';
    details?: {
        asset?: string;
        currentAllocation?: number;
        suggestedAllocation?: number;
        currentPrice?: number;
        suggestedStopLoss?: number;
        tradeType?: 'buy' | 'sell';
        quantity?: number;
        targetPool?: string;
    };
    tags: string[];
    // --- GEIN (Generative Edge & Intelligence Nexus) Implementation ---
    geinFactor: number; // Proprietary metric for insight quality and uniqueness.
    correlationId: string; // Links related insights across different models/timeframes.
    sourceModel: string; // The specific AI model that generated the insight.
    timeToLive: number; // Validity period of the insight in seconds.
    riskAnalysis: {
        volatilityIndex: number;
        sharpeRatio: number;
        maxDrawdown: number;
    };
    backtestData: { name: string; value: number }[];
    alternativeActions: {
        actionType: string;
        rationale: string;
        confidence: number;
    }[];
    // Added missing properties
    urgency: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    chartData?: { name: string; value: number }[];
}

// --- Self-Contained SVG Icons for a Richer UI without external dependencies ---

const BoltIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5.2a1 1 0 01-1.17.986l-3.2-1.1a1 1 0 00-1.26.95l.5 3.5a1 1 0 01-.45.95l-2.7 2.1a1 1 0 00-.55 1.34l3.2 5.9a1 1 0 01.05.52 1 1 0 01-1.6 1.04l-1.4-1.4a1 1 0 00-1.4 1.4l1.4 1.4a3 3 0 004.2 0l9.4-9.4a1 1 0 01-.1-1.5l-5.9-3.2a1 1 0 01-.5-.05l-3.5-.5a1 1 0 00-.95 1.26l1.1 3.2A1 1 0 018.8 11V2a1 1 0 011.3-.954z" clipRule="evenodd" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// --- Enhanced Urgency Indicator with Labels ---

const UrgencyIndicator: React.FC<{ urgency: 'low' | 'medium' | 'high' }> = ({ urgency }) => {
    const urgencyConfig = useMemo(() => ({
        low: { class: 'bg-blue-500', label: 'Low' },
        medium: { class: 'bg-yellow-500', label: 'Medium' },
        high: { class: 'bg-red-500', label: 'High' },
    }), []);
    
    return (
        <div className="absolute top-3 right-3 flex items-center text-xs font-semibold">
            <span className={`h-2.5 w-2.5 rounded-full ${urgencyConfig[urgency].class} mr-2`}></span>
            <span className="text-gray-400">{urgencyConfig[urgency].label} Urgency</span>
        </div>
    );
};

// --- Self-Contained "App-in-App" Action Modal with Multi-Tab Analysis ---

const ActionModal: React.FC<{ insight: EnhancedAIInsight; onClose: () => void }> = ({ insight, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'backtest' | 'alternatives'>('overview');

    const handleExecute = () => {
        setIsLoading(true);
        console.log(`Executing HFT action: ${insight.actionType} for insight ${insight.id} with details:`, insight.details);
        setTimeout(() => {
            setIsLoading(false);
            onClose();
        }, 1500);
    };

    const renderOverview = () => {
        switch (insight.actionType) {
            case 'rebalance_portfolio':
                return (
                    <>
                        <h4 className="text-lg font-semibold text-gray-100 mb-2">Rebalance: {insight.details?.asset}</h4>
                        <p className="text-sm text-gray-400 mb-4">Adjust allocation from {insight.details?.currentAllocation}% to {insight.details?.suggestedAllocation}%. This is a high-conviction trade based on predictive market analytics.</p>
                        <div className="space-y-2">
                            <label htmlFor="allocation" className="block text-sm font-medium text-gray-300">New Allocation (%)</label>
                            <input type="range" id="allocation" min="0" max="100" defaultValue={insight.details?.suggestedAllocation} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                        </div>
                    </>
                );
            case 'set_stop_loss':
                return (
                    <>
                        <h4 className="text-lg font-semibold text-gray-100 mb-2">Set Stop-Loss: {insight.details?.asset}</h4>
                        <p className="text-sm text-gray-400 mb-4">Current Price: ${insight.details?.currentPrice?.toFixed(2)}. The AI suggests a new stop-loss to mitigate downside risk from volatility spikes.</p>
                        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-300 text-center text-lg font-bold">
                            Suggested Stop: ${insight.details?.suggestedStopLoss}
                        </div>
                    </>
                );
            case 'execute_trade':
                return (
                    <>
                         <h4 className="text-lg font-semibold text-gray-100 mb-2">Execute Trade: {insight.details?.tradeType?.toUpperCase()} {insight.details?.asset}</h4>
                         <p className="text-sm text-gray-400 mb-4">Quantity: {insight.details?.quantity}. Based on short-term momentum indicators and order book imbalance.</p>
                    </>
                );
            case 'liquidity_provision':
                 return (
                    <>
                         <h4 className="text-lg font-semibold text-gray-100 mb-2">Provide Liquidity: {insight.details?.targetPool}</h4>
                         <p className="text-sm text-gray-400 mb-4">Projected APR is surging. Deploy capital to capture yield farming opportunities.</p>
                    </>
                );
            default:
                return <p className="text-gray-400">Review the insight details before proceeding.</p>;
        }
    };

    const renderRisk = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-800 rounded text-center">
                    <div className="text-xs text-gray-500">Volatility</div>
                    <div className="text-lg font-bold text-yellow-400">{insight.riskAnalysis.volatilityIndex}</div>
                </div>
                <div className="p-3 bg-gray-800 rounded text-center">
                    <div className="text-xs text-gray-500">Sharpe Ratio</div>
                    <div className="text-lg font-bold text-green-400">{insight.riskAnalysis.sharpeRatio}</div>
                </div>
                <div className="p-3 bg-gray-800 rounded text-center">
                    <div className="text-xs text-gray-500">Max Drawdown</div>
                    <div className="text-lg font-bold text-red-400">{insight.riskAnalysis.maxDrawdown}%</div>
                </div>
            </div>
            <div className="text-xs text-gray-400 bg-gray-800 p-3 rounded border border-gray-700">
                <strong className="text-gray-300">GEIN Factor Analysis:</strong> This insight was generated with a GEIN Factor of {insight.geinFactor}, indicating a highly unique market edge derived from proprietary data streams.
            </div>
        </div>
    );

    const renderBacktest = () => (
        <div className="h-64 w-full bg-gray-800 p-2 rounded border border-gray-700">
            <p className="text-xs text-gray-400 mb-2 text-center">Simulated Performance (Last 30 Days)</p>
            <ResponsiveContainer width="100%" height="90%">
                <LineChart data={insight.backtestData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                    <YAxis stroke="#9CA3AF" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563', color: '#F3F4F6' }} />
                    <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    const renderAlternatives = () => (
        <div className="space-y-3">
            {insight.alternativeActions.map((alt, idx) => (
                <div key={idx} className="p-3 bg-gray-800 border border-gray-700 rounded hover:border-gray-500 cursor-pointer transition-colors">
                    <div className="flex justify-between mb-1">
                        <span className="font-semibold text-gray-200 capitalize">{alt.actionType.replace('_', ' ')}</span>
                        <span className="text-xs text-cyan-400 font-mono">{alt.confidence}% Conf.</span>
                    </div>
                    <p className="text-xs text-gray-400">{alt.rationale}</p>
                </div>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-gray-900 w-full max-w-2xl rounded-xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-800/50">
                    <h3 className="text-xl font-bold text-white flex items-center"><BoltIcon /> Strategic Execution Module</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><CloseIcon /></button>
                </div>
                
                <div className="flex border-b border-gray-800">
                    <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-gray-800 text-white border-b-2 border-cyan-500' : 'text-gray-400 hover:bg-gray-800/50'}`}>Overview</button>
                    <button onClick={() => setActiveTab('risk')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'risk' ? 'bg-gray-800 text-white border-b-2 border-cyan-500' : 'text-gray-400 hover:bg-gray-800/50'}`}>Risk Analysis</button>
                    <button onClick={() => setActiveTab('backtest')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'backtest' ? 'bg-gray-800 text-white border-b-2 border-cyan-500' : 'text-gray-400 hover:bg-gray-800/50'}`}>Backtest</button>
                    <button onClick={() => setActiveTab('alternatives')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'alternatives' ? 'bg-gray-800 text-white border-b-2 border-cyan-500' : 'text-gray-400 hover:bg-gray-800/50'}`}>Alternatives</button>
                </div>

                <div className="p-6 min-h-[300px]">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'risk' && renderRisk()}
                    {activeTab === 'backtest' && renderBacktest()}
                    {activeTab === 'alternatives' && renderAlternatives()}
                </div>

                <div className="p-4 border-t border-gray-800 bg-gray-800/30 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Cancel</button>
                    <button 
                        onClick={handleExecute} 
                        disabled={isLoading}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Initiating...
                            </>
                        ) : 'Execute Strategy'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AIInsights: React.FC = () => {
    const context = useContext(DataContext);
    const [selectedInsight, setSelectedInsight] = useState<EnhancedAIInsight | null>(null);

    // Mock data generation if context data is limited
    const insights: EnhancedAIInsight[] = useMemo(() => {
        const baseInsights = context?.financialGoals || []; // Using financialGoals as a seed for mock insights
        
        return [
            {
                id: 'ins_1',
                title: 'Portfolio Imbalance Detected',
                description: 'Crypto exposure has exceeded 20% due to recent ETH rally. Rebalancing recommended to maintain risk parity.',
                urgency: 'high',
                confidenceScore: 92,
                actionable: true,
                actionType: 'rebalance_portfolio',
                details: { asset: 'ETH', currentAllocation: 22, suggestedAllocation: 15 },
                tags: ['Risk', 'Crypto', 'Rebalance'],
                geinFactor: 0.85,
                correlationId: 'corr_eth_rally_q3',
                sourceModel: 'Sentinel-Prime-v4',
                timeToLive: 3600,
                riskAnalysis: { volatilityIndex: 65, sharpeRatio: 1.8, maxDrawdown: 12 },
                backtestData: Array.from({length: 30}, (_, i) => ({ name: `Day ${i}`, value: 100 + Math.random() * 20 + i })),
                alternativeActions: [
                    { actionType: 'hedge_with_options', rationale: 'Buy protective puts to lock in gains without selling.', confidence: 75 },
                    { actionType: 'do_nothing', rationale: 'Allow drift if momentum indicators remain strong.', confidence: 40 }
                ],
                message: 'Portfolio Imbalance',
                type: 'Warning'
            },
            {
                id: 'ins_2',
                title: 'Stop-Loss Opportunity',
                description: 'TSLA volatility approaching critical threshold. Dynamic stop-loss adjustment suggested.',
                urgency: 'medium',
                confidenceScore: 88,
                actionable: true,
                actionType: 'set_stop_loss',
                details: { asset: 'TSLA', currentPrice: 245.50, suggestedStopLoss: 230.00 },
                tags: ['Equity', 'Protection'],
                geinFactor: 0.78,
                correlationId: 'corr_tech_volatility',
                sourceModel: 'Risk-Overseer-v9',
                timeToLive: 7200,
                riskAnalysis: { volatilityIndex: 45, sharpeRatio: 1.2, maxDrawdown: 25 },
                backtestData: Array.from({length: 30}, (_, i) => ({ name: `Day ${i}`, value: 100 - Math.random() * 10 })),
                alternativeActions: [],
                message: 'Stop-Loss Update',
                type: 'Opportunity'
            },
             {
                id: 'ins_3',
                title: 'Liquidity Pool Yield Spike',
                description: 'USDC-ETH pool on Uniswap v3 showing 45% APR. Capital deployment advised.',
                urgency: 'low',
                confidenceScore: 65,
                actionable: true,
                actionType: 'liquidity_provision',
                details: { targetPool: 'USDC-ETH (0.05%)' },
                tags: ['DeFi', 'Yield'],
                geinFactor: 0.92,
                correlationId: 'corr_defi_yields',
                sourceModel: 'Yield-Hunter-Alpha',
                timeToLive: 1800,
                riskAnalysis: { volatilityIndex: 80, sharpeRatio: 2.5, maxDrawdown: 5 },
                backtestData: Array.from({length: 30}, (_, i) => ({ name: `Day ${i}`, value: 100 + Math.random() * 5 })),
                alternativeActions: [],
                message: 'High Yield Alert',
                type: 'Opportunity'
            }
        ];
    }, [context]);

    return (
        <Card title="AI Strategic Insights" className="h-full border-l-4 border-purple-500">
            <div className="space-y-4 pr-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {insights.map(insight => (
                    <div 
                        key={insight.id} 
                        className="relative p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 group cursor-pointer hover:bg-gray-800"
                        onClick={() => setSelectedInsight(insight)}
                    >
                        <UrgencyIndicator urgency={insight.urgency} />
                        <h4 className="font-bold text-gray-200 pr-24">{insight.title}</h4>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{insight.description}</p>
                        
                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex gap-2">
                                {insight.tags.map(tag => (
                                    <span key={tag} className="text-[10px] uppercase font-bold px-2 py-0.5 bg-gray-700 rounded text-gray-300">{tag}</span>
                                ))}
                            </div>
                            <div className="flex items-center text-xs font-mono text-cyan-400 opacity-80 group-hover:opacity-100">
                                <span className="mr-2">Score: {insight.confidenceScore}</span>
                                <BoltIcon />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {selectedInsight && <ActionModal insight={selectedInsight} onClose={() => setSelectedInsight(null)} />}
        </Card>
    );
};

export default AIInsights;
