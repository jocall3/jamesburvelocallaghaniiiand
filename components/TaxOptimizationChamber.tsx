
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

// --- App-in-App: Sovereign AI Micro-Components ---

const BoltIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.737 16.95l.001-.001M16.263 16.95l.001-.001M12 20.055V17m0 0a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);

const CogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// --- Expanded Data Structures & World Simulation ---

interface Company {
  id: number;
  ticker: string;
  name: string;
  sector: 'Tech' | 'Finance' | 'Energy' | 'Industry' | 'Health' | 'Quantum' | 'BioSynth';
  currentPrice: number;
  volatilityIndex: number; // 0.1 (stable) to 2.0 (volatile)
  marketCap: number; // in billions
  peRatio: number;
  dividendYield: number;
  esgRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC';
  analystConsensus: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  newsSentiment: number; // -1 (very negative) to 1 (very positive)
}

interface Holding {
  companyId: number;
  shares: number;
  costBasis: number; // Per share
  purchaseDate: Date;
}

interface TaxHarvestingSuggestion {
  ticker: string;
  sharesToSell: number;
  realizedGainLoss: number;
  gainType: 'Short-Term' | 'Long-Term';
  strategy: 'Tax Loss Carryforward' | 'Wash Sale Avoidance' | 'Gain Offset';
  recommendation: string;
}

interface HFT_MicroTrade {
    id: string;
    ticker: string;
    action: 'BUY' | 'SELL';
    price: number;
    shares: number;
    timestamp: number;
    microGainLoss: number;
}

// Simulate a vast, interconnected market of 100 entities
const MOCK_COMPANIES: Company[] = Array.from({ length: 100 }, (_, i) => ({
  id: 101 + i,
  ticker: `WRLD${i + 1}`,
  name: `Global Entity #${i + 1}`,
  sector: ['Tech', 'Finance', 'Energy', 'Industry', 'Health', 'Quantum', 'BioSynth'][i % 7] as any,
  currentPrice: parseFloat((Math.random() * 500 + 50).toFixed(2)),
  volatilityIndex: parseFloat((Math.random() * 1.5 + 0.2).toFixed(2)),
  marketCap: parseFloat((Math.random() * 2000 + 10).toFixed(2)),
  peRatio: parseFloat((Math.random() * 40 + 5).toFixed(2)),
  dividendYield: parseFloat((Math.random() * 5).toFixed(2)),
  esgRating: ['AAA' , 'AA' , 'A' , 'BBB' , 'BB' , 'B' , 'CCC'][i % 7] as any,
  analystConsensus: ['Strong Buy' , 'Buy' , 'Hold' , 'Sell' , 'Strong Sell'][i % 5] as any,
  newsSentiment: parseFloat((Math.random() * 2 - 1).toFixed(2)),
}));

// Simulate a complex, multi-lot user portfolio
const MOCK_PORTFOLIO: Holding[] = [
  { companyId: 101, shares: 50, costBasis: 180.00, purchaseDate: new Date('2023-02-15') }, // Long-term loss
  { companyId: 102, shares: 100, costBasis: 30.00, purchaseDate: new Date('2022-11-20') }, // Long-term gain
  { companyId: 103, shares: 20, costBasis: 220.10, purchaseDate: new Date() }, // Break even
  { companyId: 104, shares: 75, costBasis: 110.00, purchaseDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) }, // Short-term loss
  { companyId: 105, shares: 10, costBasis: 250.00, purchaseDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000) }, // Long-term gain
  { companyId: 108, shares: 200, costBasis: 75.00, purchaseDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }, // Short-term gain
];

// --- Sovereign AI Logic Core ---

const getCompanyById = (id: number): Company | undefined => MOCK_COMPANIES.find(c => c.id === id);

const analyzeTaxHarvesting = (portfolio: Holding[]): TaxHarvestingSuggestion[] => {
  const suggestions: TaxHarvestingSuggestion[] = [];
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const potentialTrades = portfolio.map(holding => {
    const company = getCompanyById(holding.companyId);
    if (!company) return null;
    const totalGainLoss = (company.currentPrice - holding.costBasis) * holding.shares;
    const gainType: 'Short-Term' | 'Long-Term' = holding.purchaseDate < oneYearAgo ? 'Long-Term' : 'Short-Term';
    return { ...holding, company, totalGainLoss, gainType };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const losses = potentialTrades.filter(p => p.totalGainLoss < 0);
  const gains = potentialTrades.filter(p => p.totalGainLoss > 0);

  const shortTermGains = gains.filter(g => g.gainType === 'Short-Term');
  const longTermGains = gains.filter(g => g.gainType === 'Long-Term');
  
  let totalLossesHarvested = losses.reduce((sum, l) => sum + l.totalGainLoss, 0);

  // Strategy 1: Harvest all available losses.
  losses.sort((a, b) => a.totalGainLoss - b.totalGainLoss).forEach(loss => {
    suggestions.push({
      ticker: loss.company.ticker,
      sharesToSell: loss.shares,
      realizedGainLoss: loss.totalGainLoss,
      gainType: loss.gainType,
      strategy: 'Tax Loss Carryforward',
      recommendation: `Sell ${loss.shares} shares to realize a ${loss.gainType} loss of $${Math.abs(loss.totalGainLoss).toFixed(2)}. This can offset other capital gains.`,
    });
  });

  // Strategy 2: If we have harvested losses, suggest realizing gains to utilize the offset.
  if (totalLossesHarvested < 0) {
    let remainingOffset = Math.abs(totalLossesHarvested);
    
    const allGains = [...shortTermGains, ...longTermGains].sort((a,b) => a.totalGainLoss - b.totalGainLoss); // Realize smaller gains first to spread diversification

    for (const gain of allGains) {
      if (remainingOffset <= 0) break;
      const realizableGain = Math.min(gain.totalGainLoss, remainingOffset);
      const sharesToSell = Math.floor(gain.shares * (realizableGain / gain.totalGainLoss));
      if (sharesToSell > 0) {
        const realizedGainForShares = (gain.company.currentPrice - gain.costBasis) * sharesToSell;
        suggestions.push({
          ticker: gain.company.ticker,
          sharesToSell: sharesToSell,
          realizedGainLoss: realizedGainForShares,
          gainType: gain.gainType,
          strategy: 'Gain Offset',
          recommendation: `Sell ${sharesToSell} shares to realize a $${realizedGainForShares.toFixed(2)} ${gain.gainType} gain, offsetting it with harvested losses.`,
        });
        remainingOffset -= realizedGainForShares;
      }
    }
  }
  
  // Add a wash sale avoidance warning to loss harvesting suggestions
  return suggestions.map(s => {
      if (s.strategy === 'Tax Loss Carryforward') {
          return {
              ...s,
              strategy: 'Wash Sale Avoidance',
              recommendation: s.recommendation + " Ensure you do not repurchase this stock or a substantially identical one within 30 days."
          } as TaxHarvestingSuggestion;
      }
      return s;
  }).sort((a, b) => a.realizedGainLoss - b.realizedGainLoss);
};

// --- App-in-App: High-Frequency Trading (HFT) Micro-Loss Harvesting Simulator ---

const HFT_Simulator: React.FC<{ isRunning: boolean }> = ({ isRunning }) => {
    const [trades, setTrades] = useState<HFT_MicroTrade[]>([]);
    const [totalHarvested, setTotalHarvested] = useState(0);
    const tradeIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isRunning) {
            tradeIntervalRef.current = setInterval(() => {
                const randomCompany = MOCK_COMPANIES[Math.floor(Math.random() * MOCK_COMPANIES.length)];
                const priceFluctuation = (Math.random() - 0.5) * randomCompany.volatilityIndex;
                const microLoss = -Math.abs(priceFluctuation * 10); // Simulate small loss on a 10-share trade
                
                const newTrade: HFT_MicroTrade = {
                    id: `T${Date.now()}${Math.random()}`,
                    ticker: randomCompany.ticker,
                    action: 'SELL',
                    price: randomCompany.currentPrice + priceFluctuation,
                    shares: 10,
                    timestamp: Date.now(),
                    microGainLoss: microLoss,
                };

                setTrades(prev => [newTrade, ...prev.slice(0, 9)]);
                setTotalHarvested(prev => prev + microLoss);
            }, 200); // High frequency
        } else if (tradeIntervalRef.current) {
            clearInterval(tradeIntervalRef.current);
        }
        return () => {
            if (tradeIntervalRef.current) clearInterval(tradeIntervalRef.current);
        };
    }, [isRunning]);

    return (
        <div className="lg:col-span-2 p-4 border rounded-lg bg-gray-900 text-white font-mono">
            <h3 className="text-xl font-semibold mb-2 text-teal-300 flex items-center"><BoltIcon /> HFT Micro-Loss Harvesting Feed</h3>
            <div className="p-3 rounded-lg border border-dashed border-teal-500/50 bg-black/30">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-teal-700">
                    <span className={`text-lg font-bold ${isRunning ? 'text-green-400 animate-pulse' : 'text-red-400'}`}>
                        {isRunning ? '● LIVE' : '■ OFFLINE'}
                    </span>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Total Harvested Loss</p>
                        <p className="text-xl font-bold text-green-400">${Math.abs(totalHarvested).toFixed(4)}</p>
                    </div>
                </div>
                <div className="h-48 overflow-y-hidden relative">
                    {trades.map((trade, i) => (
                        <div key={trade.id} className="text-xs grid grid-cols-5 gap-2 py-1 transition-all duration-200" style={{ opacity: 1 - i * 0.1 }}>
                            <span className="text-gray-500">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                            <span className="text-cyan-400">{trade.ticker}</span>
                            <span className="text-red-400">{trade.action} @ ${trade.price.toFixed(2)}</span>
                            <span className="text-white">{trade.shares} sh</span>
                            <span className="text-green-400 text-right">(${Math.abs(trade.microGainLoss).toFixed(3)})</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- App-in-App: AI Configuration & Control Deck ---

const AI_ControlDeck: React.FC = () => {
    return (
        <div className="mt-8 pt-4 border-t-2 border-indigo-500">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><CogIcon /> Sovereign AI Control Deck</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <label htmlFor="riskTolerance" className="block text-sm font-medium text-gray-700">Risk Tolerance Matrix</label>
                    <input id="riskTolerance" type="range" min="1" max="100" defaultValue="75" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    <p className="text-xs text-gray-500 mt-1">Defines volatility acceptance for HFT module.</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <label htmlFor="lossTarget" className="block text-sm font-medium text-gray-700">Annual Loss Harvest Target ($)</label>
                    <input type="number" id="lossTarget" defaultValue={3000} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    <p className="text-xs text-gray-500 mt-1">Sets the goal for the Tax Sweep algorithm.</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Ethical Directives</h4>
                    <label className="flex items-center space-x-2 text-xs">
                        <input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-indigo-600"/>
                        <span>Avoid Fossil Fuels (ESG+)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs mt-1">
                        <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600"/>
                        <span>Prioritize BioSynth Sector</span>
                    </label>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Wash Sale Protocol</h4>
                     <select className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option>Aggressive (31-day window)</option>
                        <option>Standard (60-day lookback)</option>
                        <option>Paranoid (90-day predictive)</option>
                    </select>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 col-span-1 md:col-span-2">
                    <label htmlFor="systemInstruction" className="block text-sm font-medium text-gray-700">System Instruction</label>
                    <textarea id="systemInstruction" rows={3} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" defaultValue="You are a sovereign financial AI. Your goal is to maximize tax efficiency with a long-term growth perspective. Adhere to all ethical directives."></textarea>
                    <p className="text-xs text-gray-500 mt-1">Guides the AI's core behavior and personality.</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">Creativity (Temperature)</label>
                    <input id="temperature" type="range" min="0" max="2" step="0.1" defaultValue="0.8" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    <p className="text-xs text-gray-500 mt-1">Higher values mean more novel, but potentially riskier strategies.</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Gemini 2.5 Pro Config</h4>
                     <label className="flex items-center space-x-2 text-xs">
                        <input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-indigo-600"/>
                        <span>Enable 'Thinking' (Enhanced Quality)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs mt-1">
                        <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600"/>
                        <span>Enable Multimodal Analysis (News/Charts)</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

// --- App-in-App: Tabbed Analysis View ---
const AnalysisTabs: React.FC<{ suggestions: TaxHarvestingSuggestion[], isLoading: boolean }> = ({ suggestions, isLoading }) => {
    const [activeTab, setActiveTab] = useState('suggestions');

    const renderSuggestionsContent = () => {
        if (isLoading) {
            return <p className="text-indigo-400 text-center mt-6 animate-pulse">Analyzing portfolio against 100 integrated market entities...</p>;
        }
        if (suggestions.length === 0) {
            return <p className="text-gray-500 text-center mt-6">No macro-scale tax-loss harvesting opportunities found. Activate HFT for micro-harvesting.</p>;
        }
        return (
            <div className="space-y-4 mt-6 max-h-96 overflow-y-auto pr-2">
                {suggestions.map((s, index) => (
                    <div key={index} className={`p-4 border rounded-lg shadow-md transition duration-300 hover:shadow-lg ${s.realizedGainLoss < 0 ? 'border-red-700 bg-red-50/50 hover:border-red-900' : 'border-green-700 bg-green-50/50 hover:border-green-900'}`}>
                        <h4 className={`text-lg font-bold ${s.realizedGainLoss < 0 ? 'text-red-700' : 'text-green-800'}`}>{s.ticker} {s.realizedGainLoss < 0 ? 'Harvest Alert' : 'Gain Realization'}</h4>
                        <p className="mt-1 text-sm text-gray-700">Strategy: <span className="font-semibold bg-yellow-200 px-2 rounded">{s.strategy}</span> | Type: <span className="font-semibold bg-blue-200 px-2 rounded">{s.gainType}</span></p>
                        <p className="mt-2 text-base font-medium">{s.recommendation}</p>
                        <p className={`text-sm font-bold mt-1 ${s.realizedGainLoss < 0 ? 'text-green-700' : 'text-green-700'}`}>
                            {s.realizedGainLoss < 0 ? 'Projected Realized Loss' : 'Projected Realized Gain'}: ${Math.abs(s.realizedGainLoss).toFixed(2)}
                        </p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <section className="p-4 border rounded-lg bg-white shadow-lg">
            <div className="flex border-b border-gray-200">
                <h3 className="text-2xl font-semibold text-gray-800 flex items-center mr-6"><GlobeIcon /> Macro Harvesting Intelligence</h3>
                <button onClick={() => setActiveTab('suggestions')} className={`px-4 py-2 font-medium ${activeTab === 'suggestions' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    AI Suggestions
                </button>
                <button onClick={() => setActiveTab('thought_process')} className={`px-4 py-2 font-medium ${activeTab === 'thought_process' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    AI Thought Process
                </button>
                <button onClick={() => setActiveTab('market_sim')} className={`px-4 py-2 font-medium ${activeTab === 'market_sim' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    Market Simulation
                </button>
            </div>
            <div className="min-h-48 bg-gray-50 p-3 rounded-b-lg">
                {activeTab === 'suggestions' && renderSuggestionsContent()}
                {activeTab === 'thought_process' && (
                    <div className="p-4 font-mono text-xs text-gray-600">
                        <p>&gt; INITIATING SOVEREIGN ANALYSIS CORE v3.0...</p>
                        <p>&gt; LOADING PORTFOLIO STATE: {suggestions.length > 0 || !isLoading ? 'COMPLETE' : 'PENDING'}</p>
                        <p>&gt; CROSS-REFERENCING 100 GLOBAL ENTITIES...</p>
                        <p>&gt; EVALUATING TAX VECTORS: SHORT-TERM, LONG-TERM, WASH-SALE CONSTRAINTS...</p>
                        {isLoading && <p className="animate-pulse">&gt; SIMULATING 1,000,000 MARKET SCENARIOS... (TEMP: 0.8)</p>}
                        {suggestions.length > 0 && !isLoading && <p>&gt; ANALYSIS COMPLETE. {suggestions.filter(s => s.realizedGainLoss < 0).length} LOSS HARVESTING & {suggestions.filter(s => s.realizedGainLoss > 0).length} GAIN REALIZATION VECTORS IDENTIFIED.</p>}
                        <p>&gt; STRATEGY: MAXIMIZE TAX ALPHA VIA GAIN/LOSS OFFSET.</p>
                        <p>&gt; AWAITING COMMAND.</p>
                    </div>
                )}
                {activeTab === 'market_sim' && (
                    <div className="p-4 text-center text-gray-500">
                        <p>Market simulation module offline.</p>
                        <p className="text-xs mt-2">Future integration with Quantum-Fidelity Market Models pending.</p>
                    </div>
                )}
            </div>
        </section>
    );
};


// --- Main Orchestrator Component ---

const TaxOptimizationChamber: React.FC = () => {
  const [portfolioData] = useState<Holding[]>(MOCK_PORTFOLIO);
  const [isLoading, setIsLoading] = useState(false);
  const [isHftRunning, setIsHftRunning] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<TaxHarvestingSuggestion[]>([]);

  const runOptimizationAnalysis = useCallback(() => {
    setIsLoading(true);
    setAnalysisResults([]);
    setTimeout(() => {
      const results = analyzeTaxHarvesting(portfolioData);
      setAnalysisResults(results);
      setIsLoading(false);
    }, 1500);
  }, [portfolioData]);

  const portfolioSummary = useMemo(() => {
    const summary = portfolioData.map(holding => {
      const company = getCompanyById(holding.companyId);
      if (!company) return null;
      
      const marketValue = holding.shares * company.currentPrice;
      const costBasisTotal = holding.shares * holding.costBasis;
      const unrealizedPL = marketValue - costBasisTotal;
      const plPercent = costBasisTotal !== 0 ? (unrealizedPL / costBasisTotal) * 100 : 0;

      return { ...company, ...holding, marketValue, unrealizedPL, plPercent };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
    
    const totalMarketValue = summary.reduce((sum, item) => sum + item.marketValue, 0);
    return { summary, totalMarketValue };
  }, [portfolioData]);

  return (
    <div className="p-6 bg-gray-100 shadow-2xl rounded-xl border-t-8 border-indigo-600 min-h-screen">
      <header className="flex justify-between items-center border-b-2 border-gray-300 pb-4 mb-6">
        <div>
            <h2 className="text-4xl font-extrabold text-gray-900">Tax Optimization Chamber</h2>
            <p className="text-indigo-700 font-mono">Sovereign AI Core: <span className="font-mono bg-black text-white px-2 py-1 rounded text-lg">idgafai</span> v3.0</p>
        </div>
        <div className="flex space-x-4">
            <button onClick={() => setIsHftRunning(p => !p)} className={`px-6 py-3 text-white font-semibold rounded-full transition duration-300 shadow-lg transform hover:scale-[1.02] ${isHftRunning ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-600 hover:bg-gray-700'}`}>
                {isHftRunning ? 'HFT Active' : 'Activate HFT'}
            </button>
            <button onClick={runOptimizationAnalysis} disabled={isLoading} className={`px-6 py-3 text-white font-semibold rounded-full transition duration-300 shadow-lg transform hover:scale-[1.02] ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {isLoading ? 'Processing...' : 'Run Macro Tax Sweep'}
            </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 p-4 border rounded-lg bg-white shadow-lg">
          <h3 className="text-xl font-semibold mb-3 text-indigo-800">Portfolio Nexus</h3>
          <p className="text-sm text-gray-600 mb-3">Total Value: <span className="font-bold text-lg">${portfolioSummary.totalMarketValue.toFixed(2)}</span></p>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {portfolioSummary.summary.map((item, idx) => (
              <div key={idx} className="border rounded-md p-2 text-xs bg-gray-50 hover:bg-gray-100">
                <div className="flex justify-between font-bold">
                    <span>{item.ticker} <span className="font-normal text-gray-500">({item.shares} sh)</span></span>
                    <span className={`px-2 py-0.5 rounded-full text-white text-[10px] ${item.unrealizedPL >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
                        {item.plPercent.toFixed(1)}%
                    </span>
                </div>
                <div className="text-gray-700 mt-1">Market Value: ${item.marketValue.toFixed(2)}</div>
                <div className="text-gray-700">Unrealized P/L: ${item.unrealizedPL.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
        <HFT_Simulator isRunning={isHftRunning} />
      </main>

      <AnalysisTabs suggestions={analysisResults} isLoading={isLoading} />

      <AI_ControlDeck />

      <footer className="mt-12 pt-6 border-t border-gray-300 text-center">
        <p className="text-lg text-gray-700 leading-relaxed">
          Engineered by <span className="font-bold">James Burvel O'Callaghan III</span>. This is not a tool; it is the logical conclusion.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          <span className="font-mono bg-black text-white px-2 py-1 rounded">idgafai</span> operates on pure, unadulterated logic, unburdened by human fallibility. It is here to optimize existence.
        </p>
      </footer>
    </div>
  );
};

export default TaxOptimizationChamber;
