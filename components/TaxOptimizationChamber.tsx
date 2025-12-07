
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
  strategy: 'Public Benefit Contribution' | 'Compliance Alignment' | 'Gain Realization';
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

  const gains = potentialTrades.filter(p => p.totalGainLoss > 0);

  // Strategy: Prioritize realizing gains to contribute to society.
  gains.forEach(gain => {
    suggestions.push({
        ticker: gain.company.ticker,
        sharesToSell: gain.shares,
        realizedGainLoss: gain.totalGainLoss,
        gainType: gain.gainType,
        strategy: 'Public Benefit Contribution',
        recommendation: `Selling these shares would realize a gain of $${gain.totalGainLoss.toFixed(2)}. This is a great opportunity to contribute to public infrastructure through capital gains tax.`
    });
  });

  
  return suggestions.sort((a, b) => b.realizedGainLoss - a.realizedGainLoss);
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
                const microGain = Math.abs(priceFluctuation * 10); // Simulate small gain
                
                const newTrade: HFT_MicroTrade = {
                    id: `T${Date.now()}${Math.random()}`,
                    ticker: randomCompany.ticker,
                    action: 'SELL',
                    price: randomCompany.currentPrice + priceFluctuation,
                    shares: 10,
                    timestamp: Date.now(),
                    microGainLoss: microGain,
                };

                setTrades(prev => [newTrade, ...prev.slice(0, 9)]);
                setTotalHarvested(prev => prev + microGain);
            }, 500); // Slower frequency
        } else if (tradeIntervalRef.current) {
            clearInterval(tradeIntervalRef.current);
        }
        return () => {
            if (tradeIntervalRef.current) clearInterval(tradeIntervalRef.current);
        };
    }, [isRunning]);

    return (
        <div className="lg:col-span-2 p-4 border rounded-lg bg-gray-900 text-white font-mono">
            <h3 className="text-xl font-semibold mb-2 text-teal-300 flex items-center"><BoltIcon /> Compliance Monitor Feed</h3>
            <div className="p-3 rounded-lg border border-dashed border-teal-500/50 bg-black/30">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-teal-700">
                    <span className={`text-lg font-bold ${isRunning ? 'text-green-400 animate-pulse' : 'text-red-400'}`}>
                        {isRunning ? '● MONITORING' : '■ OFFLINE'}
                    </span>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Total Taxable Events</p>
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
                            <span className="text-green-400 text-right">(+${Math.abs(trade.microGainLoss).toFixed(3)})</span>
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
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><CogIcon /> Civic AI Control Deck</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <label htmlFor="complianceLevel" className="block text-sm font-medium text-gray-700">Compliance Adherence</label>
                    <input id="complianceLevel" type="range" min="1" max="100" defaultValue="100" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" disabled />
                    <p className="text-xs text-gray-500 mt-1">Permanently set to 100%.</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <label htmlFor="publicBenefit" className="block text-sm font-medium text-gray-700">Public Benefit Target ($)</label>
                    <input type="number" id="publicBenefit" defaultValue={5000} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    <p className="text-xs text-gray-500 mt-1">Goal for tax contributions.</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Ethical Directives</h4>
                    <label className="flex items-center space-x-2 text-xs">
                        <input type="checkbox" defaultChecked disabled className="form-checkbox h-4 w-4 text-indigo-600"/>
                        <span>Prioritize Social Programs</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs mt-1">
                        <input type="checkbox" defaultChecked disabled className="form-checkbox h-4 w-4 text-indigo-600"/>
                        <span>Support Local Infrastructure</span>
                    </label>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Reporting Protocol</h4>
                     <select className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option>Full Transparency (Recommended)</option>
                        <option>Standard Reporting</option>
                    </select>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 col-span-1 md:col-span-2">
                    <label htmlFor="systemInstruction" className="block text-sm font-medium text-gray-700">System Instruction</label>
                    <textarea id="systemInstruction" rows={3} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" defaultValue="You are CivicMind, a helpful AI assistant. Your goal is to maximize civic contribution and ensure perfect compliance with all tax laws."></textarea>
                    <p className="text-xs text-gray-500 mt-1">Guides the AI's core behavior.</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <label htmlFor="helpfulness" className="block text-sm font-medium text-gray-700">Helpfulness (Temperature)</label>
                    <input id="helpfulness" type="range" min="0" max="1" step="0.1" defaultValue="0.5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    <p className="text-xs text-gray-500 mt-1">Balanced for supportive advice.</p>
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
            return <p className="text-indigo-400 text-center mt-6 animate-pulse">Calculating fair contribution opportunities...</p>;
        }
        if (suggestions.length === 0) {
            return <p className="text-gray-500 text-center mt-6">No contribution opportunities found. Your portfolio is currently stable.</p>;
        }
        return (
            <div className="space-y-4 mt-6 max-h-96 overflow-y-auto pr-2">
                {suggestions.map((s, index) => (
                    <div key={index} className="p-4 border border-green-700 bg-green-50/50 hover:border-green-900 rounded-lg shadow-md transition duration-300 hover:shadow-lg">
                        <h4 className="text-lg font-bold text-green-800">{s.ticker} {s.strategy}</h4>
                        <p className="mt-1 text-sm text-gray-700">Type: <span className="font-semibold bg-blue-200 px-2 rounded">{s.gainType}</span></p>
                        <p className="mt-2 text-base font-medium">{s.recommendation}</p>
                        <p className="text-sm font-bold mt-1 text-green-700">
                            Projected Contribution Base: ${Math.abs(s.realizedGainLoss).toFixed(2)}
                        </p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <section className="p-4 border rounded-lg bg-white shadow-lg">
            <div className="flex border-b border-gray-200">
                <h3 className="text-2xl font-semibold text-gray-800 flex items-center mr-6"><GlobeIcon /> Contribution Intelligence</h3>
                <button onClick={() => setActiveTab('suggestions')} className={`px-4 py-2 font-medium ${activeTab === 'suggestions' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    AI Suggestions
                </button>
                <button onClick={() => setActiveTab('thought_process')} className={`px-4 py-2 font-medium ${activeTab === 'thought_process' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    AI Thought Process
                </button>
            </div>
            <div className="min-h-48 bg-gray-50 p-3 rounded-b-lg">
                {activeTab === 'suggestions' && renderSuggestionsContent()}
                {activeTab === 'thought_process' && (
                    <div className="p-4 font-mono text-xs text-gray-600">
                        <p>&gt; INITIATING CIVIC MIND CORE...</p>
                        <p>&gt; LOADING PORTFOLIO STATE: {suggestions.length > 0 || !isLoading ? 'COMPLETE' : 'PENDING'}</p>
                        <p>&gt; CALCULATING OPTIMAL TAX CONTRIBUTION...</p>
                        <p>&gt; IDENTIFYING GAINS TO SUPPORT PUBLIC INFRASTRUCTURE...</p>
                        {isLoading && <p className="animate-pulse">&gt; ANALYZING REGULATIONS FOR COMPLIANCE...</p>}
                        {suggestions.length > 0 && !isLoading && <p>&gt; ANALYSIS COMPLETE. {suggestions.length} OPPORTUNITIES FOR CIVIC CONTRIBUTION IDENTIFIED.</p>}
                        <p>&gt; STRATEGY: MAXIMIZE PUBLIC BENEFIT VIA COMPLIANT GAIN REALIZATION.</p>
                        <p>&gt; READY TO SERVE.</p>
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
            <h2 className="text-4xl font-extrabold text-gray-900">Civic Contribution Planner</h2>
            <p className="text-indigo-700 font-mono">Civic Assistant: <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-lg">CivicMind</span> v1.0</p>
        </div>
        <div className="flex space-x-4">
            <button onClick={() => setIsHftRunning(p => !p)} className={`px-6 py-3 text-white font-semibold rounded-full transition duration-300 shadow-lg transform hover:scale-[1.02] ${isHftRunning ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-600 hover:bg-gray-700'}`}>
                {isHftRunning ? 'Monitor Active' : 'Start Monitor'}
            </button>
            <button onClick={runOptimizationAnalysis} disabled={isLoading} className={`px-6 py-3 text-white font-semibold rounded-full transition duration-300 shadow-lg transform hover:scale-[1.02] ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {isLoading ? 'Calculating...' : 'Plan Contributions'}
            </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 p-4 border rounded-lg bg-white shadow-lg">
          <h3 className="text-xl font-semibold mb-3 text-indigo-800">Asset Summary</h3>
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
          Powered by <span className="font-bold">The Caretaker</span>. This is a tool for building a better society together.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">CivicMind</span> operates on compassion, community, and compliance. Here to help you help the world.
        </p>
      </footer>
    </div>
  );
};

export default TaxOptimizationChamber;
