

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, DollarSign, Activity, TrendingUp, Zap, Server, Shield, Globe, Cpu, BarChart3, ZapIcon, Rocket, Brain, Landmark, Clock, Database, Aperture } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';

// --- AI Integration Types (Simulated) ---
type AIInsight = {
  id: string;
  source: 'MarketSentiment' | 'GeopoliticalRisk' | 'InternalEfficiency';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  recommendation: string;
  confidence: number; // 0.0 to 1.0
};

type ProfileSummary = {
  id: string;
  name: string;
  role: string;
  aiScore: number; // Predictive performance score
  lastActionTurn: number;
};

// --- Core Data Structures ---
type NationMetrics = {
  gdp: number; // Trillions USD, Real Growth
  nationalReserve: number; // Trillions USD, Liquid Assets
  debtToGdp: number; // Percentage, Adjusted for Future Liabilities
  unemploymentRate: number; // Percentage, Structural & Cyclical
  inflationRate: number; // Percentage, Core CPI
  tradeBalance: number; // Billions USD, Net Exports
  infrastructureQualityIndex: number; // 0-100, Physical & Digital Backbone
  technologicalAdvancementScore: number; // 0-100, R&D Investment & Patent Velocity
  humanCapitalIndex: number; // 0-100, Education & Health Outcomes
  regulatoryComplexity: number; // 1-100, Friction for new ventures
  cyberDefensePosture: number; // 0-100, Resilience against state actors
};

type EconomicLever = {
  name: string;
  currentValue: number;
  min: number;
  max: number;
  unit: string;
  description: string;
  icon: React.ReactNode;
  aiOptimizationTarget: 'Growth' | 'Stability' | 'Equity';
};

type ScenarioResult = {
  turn: number;
  gdpGrowth: number;
  inflation: number;
  unemployment: number;
  reserveChange: number;
  aiModelVersion: string;
};

// --- Initial Configuration ---
const CORE_AI_VERSION = "IdgafAI_v7.1.9";

const initialMetrics: NationMetrics = {
  gdp: 25.0,
  nationalReserve: 4.5,
  debtToGdp: 120.5,
  unemploymentRate: 4.2,
  inflationRate: 3.5,
  tradeBalance: -50.0,
  infrastructureQualityIndex: 88,
  technologicalAdvancementScore: 92,
  humanCapitalIndex: 85,
  regulatoryComplexity: 45,
  cyberDefensePosture: 78,
};

const initialLevers: EconomicLever[] = [
  { name: 'Interest Rate', currentValue: 3.0, min: 0.0, max: 10.0, unit: '%', description: 'Central Bank Policy Rate. Primary tool for liquidity management.', icon: <DollarSign size={16} />, aiOptimizationTarget: 'Stability' },
  { name: 'Fiscal Stimulus', currentValue: 500, min: 0, max: 2000, unit: 'B', description: 'Government spending injection (Billions). Targeted infrastructure/R&D allocation.', icon: <Activity size={16} />, aiOptimizationTarget: 'Growth' },
  { name: 'Corporate Tax Rate', currentValue: 21.0, min: 10.0, max: 50.0, unit: '%', description: 'Taxation on corporate profits. Calibrated for capital retention vs. public funding.', icon: <Server size={16} />, aiOptimizationTarget: 'Equity' },
  { name: 'Reserve Requirement', currentValue: 10.0, min: 5.0, max: 25.0, unit: '%', description: 'Fraction of deposits banks must hold. Controls fractional reserve expansion.', icon: <Zap size={16} />, aiOptimizationTarget: 'Stability' },
  { name: 'Digital Infrastructure Bond Rate', currentValue: 5.5, min: 1.0, max: 12.0, unit: '%', description: 'Incentive rate for private investment in quantum/AI infrastructure.', icon: <Cpu size={16} />, aiOptimizationTarget: 'Growth' },
];

const initialHistory: ScenarioResult[] = [
  { turn: 1, gdpGrowth: 2.1, inflation: 3.2, unemployment: 4.5, reserveChange: 10, aiModelVersion: CORE_AI_VERSION },
  { turn: 2, gdpGrowth: 2.5, inflation: 3.5, unemployment: 4.2, reserveChange: 15, aiModelVersion: CORE_AI_VERSION },
  { turn: 3, gdpGrowth: 3.1, inflation: 3.8, unemployment: 3.9, reserveChange: 22, aiModelVersion: CORE_AI_VERSION },
  { turn: 4, gdpGrowth: 2.9, inflation: 4.1, unemployment: 4.0, reserveChange: 18, aiModelVersion: CORE_AI_VERSION },
  { turn: 5, gdpGrowth: 3.5, inflation: 3.5, unemployment: 3.5, reserveChange: 30, aiModelVersion: CORE_AI_VERSION },
];

const initialProfiles: ProfileSummary[] = [
    { id: 'P001', name: 'Dr. Elara Vance', role: 'Chief Economist', aiScore: 98.2, lastActionTurn: 5 },
    { id: 'P002', name: 'Director Kaelen Rix', role: 'Cyber Command Lead', aiScore: 95.1, lastActionTurn: 4 },
    { id: 'P003', name: 'Minister of Trade', role: 'External Relations', aiScore: 89.5, lastActionTurn: 5 },
];

// --- Utility Components ---

const MetricCard: React.FC<{ title: string; value: string | number; unit: string; trend: 'up' | 'down' | 'flat'; color: string; icon: React.ReactNode }> = ({ title, value, unit, trend, color, icon }) => {
  const trendIcon = useMemo(() => {
    if (trend === 'up') return <TrendingUp className="w-6 h-6 text-green-400" />;
    if (trend === 'down') return <TrendingUp className="w-6 h-6 text-red-400 transform rotate-180" />;
    return <div className="w-6 h-6 text-gray-500">{icon}</div>;
  }, [trend, icon]);

  return (
    <div className="p-5 rounded-2xl shadow-2xl border border-indigo-800/50 backdrop-blur-md bg-gray-800/80 hover:bg-gray-700/80 transition-all duration-500 transform hover:scale-[1.02] relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
      <div className="relative z-10 flex justify-between items-start">
        <div className="flex flex-col">
            <div className="flex items-center text-sm font-medium text-indigo-400 uppercase mb-1">
                {icon}
                <span className='ml-2'>{title}</span>
            </div>
            <div className="mt-1 flex items-baseline">
                <p className={`text-5xl font-extrabold ${color} transition-transform duration-300 group-hover:translate-x-1`}>{value}</p>
                <span className="ml-2 text-xl font-semibold text-gray-400">{unit}</span>
            </div>
        </div>
        <div className="p-2 bg-gray-900/50 rounded-full border border-gray-700">
            {trendIcon}
        </div>
      </div>
    </div>
  );
};

const LeverControl: React.FC<{ lever: EconomicLever; onUpdate: (name: string, value: number) => void }> = ({ lever, onUpdate }) => {
  const [value, setValue] = useState(lever.currentValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    onUpdate(lever.name, newValue);
  };

  const targetColor = lever.aiOptimizationTarget === 'Growth' ? 'text-green-400' : lever.aiOptimizationTarget === 'Stability' ? 'text-yellow-400' : 'text-cyan-400';

  return (
    <div className="p-5 bg-gray-900/70 rounded-xl border border-purple-700/50 mb-4 shadow-xl hover:shadow-purple-500/20 transition duration-300">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center text-lg font-bold text-white">
          {lever.icon}
          <h4 className="ml-3">{lever.name}</h4>
        </div>
        <span className={`text-2xl font-extrabold ${targetColor}`}>
          {value.toFixed(lever.unit.includes('%') ? 1 : 0)} {lever.unit}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3 italic border-l-2 border-gray-700 pl-2">{lever.description}</p>
      
      <div className='flex items-center space-x-3'>
        <span className='text-xs text-gray-400'>Target:</span>
        <span className={`text-sm font-bold ${targetColor}`}>{lever.aiOptimizationTarget}</span>
      </div>

      <input
        type="range"
        min={lever.min}
        max={lever.max}
        step={(lever.max - lever.min) / 200} // Finer granularity
        value={value}
        onChange={handleChange}
        className="w-full h-3 mt-3 bg-gray-700 rounded-full appearance-none cursor-pointer range-lg [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span className='font-mono'>{lever.min.toFixed(lever.unit.includes('%') ? 1 : 0)}{lever.unit}</span>
        <span className='font-mono'>{lever.max.toFixed(lever.unit.includes('%') ? 1 : 0)}{lever.unit}</span>
      </div>
    </div>
  );
};

const AIInsightCard: React.FC<{ insight: AIInsight }> = ({ insight }) => {
    const colorMap = {
        Critical: 'bg-red-900/50 border-red-500 text-red-300',
        High: 'bg-orange-900/50 border-orange-500 text-orange-300',
        Medium: 'bg-yellow-900/50 border-yellow-500 text-yellow-300',
        Low: 'bg-green-900/50 border-green-500 text-green-300',
    };
    const IconMap = {
        MarketSentiment: <BarChart3 size={18} />,
        GeopoliticalRisk: <Landmark size={18} />,
        InternalEfficiency: <Cpu size={18} />,
    };

    return (
        <div className={`p-4 rounded-lg border-l-4 ${colorMap[insight.severity]} shadow-lg mb-3 transition duration-300 hover:shadow-xl`}>
            <div className="flex justify-between items-center mb-1">
                <div className='flex items-center font-semibold text-sm'>
                    {IconMap[insight.source]}
                    <span className='ml-2'>{insight.source} Alert</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorMap[insight.severity].replace('bg-', 'bg-').replace('text-', 'text-')}`}>{insight.severity}</span>
            </div>
            <p className="text-sm mt-1">{insight.recommendation}</p>
            <div className="mt-2 flex justify-between text-xs text-gray-400">
                <span>Confidence: {(insight.confidence * 100).toFixed(1)}%</span>
                <span>Model: {CORE_AI_VERSION}</span>
            </div>
        </div>
    );
};

// --- Simulation Core Logic ---

const generateAIInsights = (metrics: NationMetrics, levers: EconomicLever[], turn: number): AIInsight[] => {
    const insights: AIInsight[] = [];

    // 1. Debt Sustainability Check
    if (metrics.debtToGdp > 130) {
        insights.push({
            id: `D${turn}1`,
            source: 'GeopoliticalRisk',
            severity: 'Critical',
            recommendation: 'Immediate 15% reduction in non-essential capital expenditure required. Debt servicing ratio approaching critical threshold.',
            confidence: 0.95,
        });
    } else if (metrics.debtToGdp > 110) {
        insights.push({
            id: `D${turn}2`,
            source: 'InternalEfficiency',
            severity: 'High',
            recommendation: 'Re-evaluate current Interest Rate lever setting; 0.5% reduction could free up 40B USD in annual servicing costs.',
            confidence: 0.88,
        });
    }

    // 2. Inflation/Growth Balance Check
    if (metrics.inflationRate > 4.5 && metrics.gdp > 3.0) {
        insights.push({
            id: `I${turn}1`,
            source: 'MarketSentiment',
            severity: 'High',
            recommendation: 'Aggressive tightening cycle recommended. Increase Interest Rate by 50bps next cycle to anchor expectations.',
            confidence: 0.91,
        });
    }

    // 3. Infrastructure Lag Check
    if (metrics.infrastructureQualityIndex < 80 && metrics.gdp > 2.0) {
        const stimulusLever = levers.find(l => l.name === 'Fiscal Stimulus');
        if (stimulusLever && stimulusLever.currentValue < 1000) {
            insights.push({
                id: `T${turn}1`,
                source: 'InternalEfficiency',
                severity: 'Medium',
                recommendation: 'Infrastructure deficit is suppressing potential growth. Allocate 300B USD from reserves to Digital Infrastructure Bond Rate.',
                confidence: 0.75,
            });
        }
    }
    
    // 4. Tech Score Stagnation Check
    if (metrics.technologicalAdvancementScore < 95 && turn % 10 === 0) {
        insights.push({
            id: `R${turn}1`,
            source: 'MarketSentiment',
            severity: 'Low',
            recommendation: 'R&D pipeline review initiated. Consider tax incentives for deep-tech startups.',
            confidence: 0.65,
        });
    }

    return insights;
};


const runAdvancedSimulationTurn = (
    currentMetrics: NationMetrics, 
    currentLevers: EconomicLever[], 
    currentTurn: number
): { newMetrics: NationMetrics, newResult: ScenarioResult, insights: AIInsight[] } => {
    
    const rates = currentLevers.reduce((acc, l) => ({ ...acc, [l.name.replace(/\s/g, '')]: l.currentValue }), {} as any);
    const randomFactor = (Math.random() - 0.5) * 0.5; // General noise factor

    // --- 1. Complex Interdependency Model ---
    
    // Base Growth influenced by Tech, Infrastructure, and Regulatory Friction
    let baseGrowth = 2.5 + (currentMetrics.technologicalAdvancementScore / 100) * 1.5 - (currentMetrics.regulatoryComplexity / 100) * 1.0;
    
    // Monetary Policy Impact (Interest Rate & Reserve Requirement)
    const monetaryDampening = (rates.InterestRate - 3.0) * 0.15 + (rates.ReserveRequirement - 10.0) * 0.05;
    
    // Fiscal Impact (Stimulus vs. Tax Rate)
    const fiscalStimulation = (rates.FiscalStimulus / 1500) * 1.0 - (rates.CorporateTaxRate - 20) * 0.08;
    
    // Infrastructure Investment Feedback Loop
    const infraBoost = (rates.DigitalInfrastructureBondRate / 10) * 0.2;

    let newGdpGrowth = baseGrowth + monetaryDampening + fiscalStimulation + infraBoost + randomFactor;

    // Inflation Model: Driven by growth overshoot and reserve liquidity
    let newInflation = 3.0 + (newGdpGrowth - 3.0) * 0.6 + (rates.FiscalStimulus / 2000) * 0.5 - (currentMetrics.infrastructureQualityIndex / 100) * 0.5;
    
    // Unemployment Model: Okun's Law approximation
    let newUnemployment = 4.0 - (newGdpGrowth - 3.0) * 0.7 + (currentMetrics.humanCapitalIndex / 100) * 0.5;

    // --- 2. Metric Updates & Clamping ---
    
    // Clamp Growth and Inflation
    newGdpGrowth = Math.max(0.5, Math.min(6.0, newGdpGrowth));
    newInflation = Math.max(0.5, Math.min(12.0, newInflation));
    newUnemployment = Math.max(0.5, Math.min(15.0, newUnemployment));

    // Reserve Change: Simplified based on Trade Balance and Tax Revenue proxy
    const reserveChange = (currentMetrics.tradeBalance / 100) + (rates.CorporateTaxRate / 100) * currentMetrics.gdp * 0.05 + (rates.FiscalStimulus / 5000);
    const newReserve = currentMetrics.nationalReserve + reserveChange * 0.1; // Only 10% of net flow is immediately liquid

    // Dynamic Index Updates (Slow decay/growth)
    const newTechScore = Math.min(100, currentMetrics.technologicalAdvancementScore + (newGdpGrowth > 4.0 ? 0.5 : 0.1) + infraBoost * 2);
    const newInfra = Math.min(100, currentMetrics.infrastructureQualityIndex + (rates.FiscalStimulus > 1000 ? 0.8 : 0.2));
    const newDebt = Math.max(50, currentMetrics.debtToGdp * (1 + (newGdpGrowth / 100)) - (currentMetrics.gdp * (rates.CorporateTaxRate / 100) * 0.02)); // Debt reduction via tax revenue proxy
    
    const newMetrics: NationMetrics = {
      ...currentMetrics,
      gdp: parseFloat((currentMetrics.gdp * (1 + newGdpGrowth / 100)).toFixed(3)),
      inflationRate: parseFloat(newInflation.toFixed(2)),
      unemploymentRate: parseFloat(newUnemployment.toFixed(2)),
      nationalReserve: parseFloat(newReserve.toFixed(3)),
      debtToGdp: parseFloat(newDebt.toFixed(2)),
      technologicalAdvancementScore: parseFloat(newTechScore.toFixed(1)),
      infrastructureQualityIndex: parseFloat(newInfra.toFixed(1)),
      tradeBalance: parseFloat((currentMetrics.tradeBalance + randomFactor * 10).toFixed(1)), // Trade balance fluctuates slightly
    };

    const newResult: ScenarioResult = {
      turn: currentTurn + 1,
      gdpGrowth: parseFloat(newGdpGrowth.toFixed(2)),
      inflation: parseFloat(newInflation.toFixed(2)),
      unemployment: parseFloat(newUnemployment.toFixed(2)),
      reserveChange: parseFloat(reserveChange.toFixed(2)),
      aiModelVersion: CORE_AI_VERSION,
    };

    const insights = generateAIInsights(newMetrics, currentLevers, currentTurn + 1);

    return { newMetrics, newResult, insights };
};


// --- Main Component ---
const NationalMetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<NationMetrics>(initialMetrics);
  const [levers, setLevers] = useState<EconomicLever[]>(initialLevers);
  const [history, setHistory] = useState<ScenarioResult[]>(initialHistory);
  const [profiles, setProfiles] = useState<ProfileSummary[]>(initialProfiles);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationTurn, setSimulationTurn] = useState(initialHistory.length);

  // Initialize insights on load
  useEffect(() => {
    setInsights(generateAIInsights(metrics, levers, simulationTurn));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateLever = useCallback((name: string, value: number) => {
    setLevers(prev => prev.map(l => (l.name === name ? { ...l, currentValue: value } : l)));
  }, []);

  const runSimulationStep = useCallback(() => {
    setSimulationTurn(prevTurn => {
      const { newMetrics, newResult, insights: newInsights } = runAdvancedSimulationTurn(metrics, levers, prevTurn);
      
      setMetrics(newMetrics);
      setHistory(prev => [...prev, newResult].slice(-50)); // Keep last 50 turns
      setInsights(newInsights);

      // Update Profile activity based on turn progression
      setProfiles(prevProfiles => prevProfiles.map(p => ({
          ...p,
          lastActionTurn: newResult.turn,
      })));

      return newResult.turn;
    });
  }, [metrics, levers]);

  useEffect(() => {
    if (simulationRunning) {
      const interval = setInterval(runSimulationStep, 1500); // Faster turn rate for dramatic effect
      return () => clearInterval(interval);
    }
  }, [simulationRunning, runSimulationStep]);

  const handleRunSimulation = () => {
    setSimulationRunning(true);
  };

  const handlePauseSimulation = () => {
    setSimulationRunning(false);
  };

  const handleStepSimulation = () => {
    if (!simulationRunning) {
        runSimulationStep();
    }
  };

  const getMetricColor = (metric: keyof NationMetrics) => {
    switch (metric) {
      case 'gdp': return metrics.gdp > 30 ? 'text-green-400' : 'text-green-500';
      case 'nationalReserve': return metrics.nationalReserve > 6 ? 'text-yellow-400' : 'text-yellow-500';
      case 'debtToGdp': return metrics.debtToGdp > 130 ? 'text-red-400' : metrics.debtToGdp > 100 ? 'text-orange-400' : 'text-green-400';
      case 'unemploymentRate': return metrics.unemploymentRate > 5.0 ? 'text-red-400' : 'text-green-400';
      case 'inflationRate': return metrics.inflationRate > 4.0 ? 'text-red-400' : metrics.inflationRate > 2.5 ? 'text-yellow-400' : 'text-green-400';
      case 'humanCapitalIndex': return metrics.humanCapitalIndex > 90 ? 'text-cyan-400' : 'text-indigo-400';
      default: return 'text-indigo-400';
    }
  };

  const currentKPIs = useMemo(() => [
    { title: "GDP (T USD)", value: metrics.gdp.toFixed(2), unit: "T", trend: 'up' as const, icon: <Landmark size={18} />, color: getMetricColor('gdp') },
    { title: "Reserves (T USD)", value: metrics.nationalReserve.toFixed(2), unit: "T", trend: 'up' as const, icon: <DollarSign size={18} />, color: getMetricColor('nationalReserve') },
    { title: "Debt/GDP", value: metrics.debtToGdp.toFixed(1), unit: "%", trend: (metrics.debtToGdp > initialMetrics.debtToGdp ? 'up' : 'down') as "up" | "down" | "flat", icon: <TrendingUp size={18} />, color: getMetricColor('debtToGdp') },
    { title: "Unemployment", value: metrics.unemploymentRate.toFixed(1), unit: "%", trend: 'down' as const, icon: <ZapIcon size={18} />, color: getMetricColor('unemploymentRate') },
    { title: "Inflation", value: metrics.inflationRate.toFixed(1), unit: "%", trend: 'up' as const, icon: <TrendingUp size={18} />, color: getMetricColor('inflationRate') },
    { title: "Tech Velocity", value: metrics.technologicalAdvancementScore.toFixed(0), unit: "/100", trend: 'up' as const, icon: <Cpu size={18} />, color: getMetricColor('technologicalAdvancementScore') },
  ], [metrics]);

  return (
    <div className="min-h-screen p-10 text-white bg-gray-950 font-sans relative overflow-hidden">
        {/* Background Grid Effect */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px]"></div>
        <div className="absolute inset-0 opacity-5 bg-[url('/grid.svg')] bg-repeat [background-size:100px_100px]"></div>

      <header className="relative z-20 flex justify-between items-center pb-8 border-b border-indigo-800/50 mb-8">
        <div className='flex items-center'>
            <Aperture className='w-10 h-10 text-purple-400 mr-3 animate-spin-slow' />
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 tracking-tight">
                National Metrics Dashboard: Chronos Engine
            </h1>
        </div>
        <div className="flex space-x-4 items-center">
          <div className='text-sm text-gray-400 bg-gray-800/70 p-2 rounded-lg border border-gray-700'>
            Turn: <span className='font-bold text-lg text-yellow-300'>{simulationTurn}</span> | Core: <span className='text-xs text-green-400'>{CORE_AI_VERSION}</span>
          </div>
          <button
            onClick={simulationRunning ? handlePauseSimulation : handleRunSimulation}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center shadow-lg transform hover:scale-[1.03] ${simulationRunning ? 'bg-red-700 hover:bg-red-600 shadow-red-500/40' : 'bg-green-600 hover:bg-green-500 shadow-green-500/40'}`}
          >
            {simulationRunning ? (
              <>
                <Clock size={20} className="mr-2 animate-spin-slow" /> PAUSE EXECUTION
              </>
            ) : (
              <>
                <Zap size={20} className="mr-2" /> INITIATE CYCLE
              </>
            )}
          </button>
          <button
            onClick={handleStepSimulation}
            disabled={simulationRunning}
            className={`p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition shadow-lg`}
          >
            <Rocket size={24} />
          </button>
          <button className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 transition">
            <Settings size={24} />
          </button>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-8 relative z-10">

        {/* Column 1: Core Metrics & Status (4/12 width) */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <h2 className="text-3xl font-bold text-indigo-300 flex items-center border-b border-gray-800 pb-2"><Globe className="w-7 h-7 mr-3" /> National Economic Dashboard</h2>

          <div className="grid grid-cols-2 gap-5">
            {currentKPIs.map((kpi) => (
                <MetricCard
                    key={kpi.title}
                    title={kpi.title}
                    value={kpi.value}
                    unit={kpi.unit}
                    trend={kpi.trend}
                    color={kpi.color}
                    icon={kpi.icon}
                />
            ))}
          </div>

          {/* Advanced Stability Indicators */}
          <div className="p-6 bg-gray-900 rounded-2xl shadow-2xl border border-cyan-800/50">
            <h3 className="text-2xl font-bold text-cyan-300 mb-4 flex items-center"><Shield className="mr-2 w-6 h-6" /> Resilience Matrix</h3>
            <div className="space-y-4">
              {[
                { label: 'Human Capital Index', value: metrics.humanCapitalIndex, max: 100, color: 'bg-green-500', textColor: getMetricColor('humanCapitalIndex') },
                { label: 'Regulatory Friction', value: metrics.regulatoryComplexity, max: 100, color: 'bg-red-500', textColor: metrics.regulatoryComplexity < 50 ? 'text-green-400' : 'text-red-400' },
                { label: 'Cyber Defense Posture', value: metrics.cyberDefensePosture, max: 100, color: 'bg-indigo-500', textColor: getMetricColor('cyberDefensePosture') },
              ].map(({ label, value, max, color, textColor }) => (
                <div key={label}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className='text-gray-400'>{label}</span>
                    <span className={`font-mono text-lg font-bold ${textColor}`}>
                      {value.toFixed(1)} / {max}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-700 rounded-full">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Economic Levers (Control Panel) (3/12 width) */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <h2 className="text-3xl font-bold text-purple-300 flex items-center border-b border-gray-800 pb-2"><Settings className="w-7 h-7 mr-3" /> Policy Control Nexus</h2>
          <div className="p-5 bg-gray-900/80 rounded-2xl shadow-2xl border border-purple-700/50">
            {levers.map(lever => (
              <LeverControl key={lever.name} lever={lever} onUpdate={updateLever} />
            ))}

            <div className="mt-8 p-4 bg-purple-900/30 rounded-xl border border-purple-600/50">
                <p className="text-sm font-bold text-purple-300 flex items-center"><Brain className='w-4 h-4 mr-2'/> AI Optimization Directives</p>
                <p className="text-xs text-gray-400 mt-1">Levers are dynamically weighted by the AI based on current risk profile and optimization targets ({levers.filter(l => l.aiOptimizationTarget === 'Stability').length} Stability, {levers.filter(l => l.aiOptimizationTarget === 'Growth').length} Growth, {levers.filter(l => l.aiOptimizationTarget === 'Equity').length} Equity).</p>
            </div>
          </div>
        </div>

        {/* Column 3: Simulation & Impact Visualizations (5/12 width) */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
          <h2 className="text-3xl font-bold text-cyan-300 flex items-center border-b border-gray-800 pb-2"><BarChart3 className="w-7 h-7 mr-3" /> Predictive Modeling & Risk Assessment</h2>

          {/* Primary Chart: Growth/Inflation */}
          <div className="p-6 bg-gray-900 rounded-2xl shadow-2xl border border-cyan-800/50 h-[400px]">
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Macro Trajectory (GDP vs. Inflation)</h3>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGdp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorInf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#4ADE80" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="turn" stroke="#4B5563" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" stroke="#818CF8" domain={[0, 7]} orientation="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" stroke="#4ADE80" domain={[0, 10]} orientation="right" tick={{ fontSize: 10 }} />
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #4B5563', borderRadius: '8px' }} labelStyle={{ color: '#E5E7EB' }} />
                <Area yAxisId="left" type="monotone" dataKey="gdpGrowth" stroke="#818CF8" strokeWidth={2} fillOpacity={1} fill="url(#colorGdp)" name="GDP Growth (%)" />
                <Area yAxisId="right" type="monotone" dataKey="inflation" stroke="#4ADE80" strokeWidth={2} fillOpacity={1} fill="url(#colorInf)" name="Inflation Rate (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insight Feed */}
          <div className="p-6 bg-gray-900 rounded-2xl shadow-2xl border border-red-800/50">
            <h3 className="text-xl font-semibold text-red-300 mb-3 flex items-center"><Zap size={20} className='mr-2'/> IdgafAI Critical Alerts ({insights.filter(i => i.severity !== 'Low').length} Active)</h3>
            <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {insights.length > 0 ? (
                    insights.map(insight => <AIInsightCard key={insight.id} insight={insight} />)
                ) : (
                    <p className='text-gray-500 italic p-4 bg-gray-800 rounded-lg'>System nominal. No immediate high-severity anomalies detected.</p>
                )}
            </div>
          </div>
        </div>
      </main>
      
      <section className="mt-10 p-8 bg-gray-900/70 rounded-2xl border border-indigo-700/50 backdrop-blur-lg shadow-inner">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400 mb-4 flex items-center"><Database className='w-7 h-7 mr-3'/> System Log & Personnel Manifest</h2>
          
          <div className='grid grid-cols-3 gap-6'>
            {/* Personnel Manifest */}
            <div className='col-span-1'>
                <h3 className="text-xl font-semibold text-indigo-300 mb-3">Active Personnel Nodes</h3>
                <div className='space-y-3'>
                    {profiles.map(p => (
                        <div key={p.id} className='p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-indigo-500 transition'>
                            <p className='font-bold text-white'>{p.name}</p>
                            <p className='text-sm text-gray-400 italic'>{p.role}</p>
                            <div className='flex justify-between text-xs mt-1'>
                                <span>AI Score: <span className='font-mono text-green-400'>{p.aiScore.toFixed(1)}</span></span>
                                <span>Last Sync: T-{simulationTurn - p.lastActionTurn}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Historical Context */}
            <div className='col-span-2'>
                <h3 className="text-xl font-semibold text-purple-300 mb-3">Simulation History Snapshot (Last 5 Turns)</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700 rounded-lg overflow-hidden">
                        <thead className="bg-gray-800 sticky top-0">
                            <tr>
                                {['Turn', 'GDP Growth', 'Inflation', 'Unemployment', 'Reserve Change', 'Model'].map(header => (
                                    <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-gray-900 divide-y divide-gray-800">
                            {history.slice(-5).reverse().map((res) => (
                                <tr key={res.turn} className='hover:bg-gray-800 transition duration-150'>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-yellow-300">{res.turn}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-green-400">{res.gdpGrowth.toFixed(2)}%</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-red-400">{res.inflation.toFixed(2)}%</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-cyan-400">{res.unemployment.toFixed(2)}%</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-indigo-400">{res.reserveChange.toFixed(2)} B</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{res.aiModelVersion.split('_')[0]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      </section>

      <footer className="mt-10 pt-6 border-t border-indigo-900 text-center text-sm text-gray-600">
        National Metrics Dashboard v1.0.0 | Chronos Engine Active | All Rights Reserved to the Collective Future.
      </footer>
    </div>
  );
};

export default NationalMetricsDashboard;
