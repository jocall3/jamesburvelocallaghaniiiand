import React, { useState, useEffect, useRef, useCallback } from 'react';

const ForexArenaGlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'forex-arena-global-styles';
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');
      * { box-sizing: border-box; }
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: #0a192f; }
      ::-webkit-scrollbar-thumb { background: #233554; borderRadius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #64ffda; }
      .glass-panel { transition: transform 0.3s ease, box-shadow 0.3s ease; }
      .glass-panel:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
    `;
    document.head.appendChild(style);

    return () => {
      const styleTag = document.getElementById('forex-arena-global-styles');
      if (styleTag) {
        document.head.removeChild(styleTag);
      }
    };
  }, []);

  return null;
};

// -----------------------------------------------------------------------------
// CORE TYPE DEFINITIONS & INTERFACES
// -----------------------------------------------------------------------------

type ModuleType = 'DASHBOARD' | 'FOREX_ARENA' | 'AI_CHAT' | 'GLOBAL_KPIS' | 'MARKET_ANALYSIS' | 'TRADE_LOGS' | 'AI_CONFIG' | 'PROFILE' | 'SYSTEM_HEALTH' | 'GEMINI_INSIGHTS' | 'THINKING_VISUALIZER' | 'MULTIMODAL_ANALYSIS' | 'SENTIMENT_STREAM' | 'RISK_SIMULATOR' | 'COMPLIANCE_AI' | 'QUANTUM_COMPUTING_INTERFACE';

interface ExchangeRate {
    bid: number;
    ask: number;
}

interface Exchange {
    id: string;
    name: string;
    latency: number; // in ms
}

interface CurrencyPair {
    symbol: string;
    base: string;
    quote: string;
    volatilityIndex: number;
}

interface ArbitrageOpportunity {
    id: string;
    pair: string;
    buyExchange: string;
    sellExchange: string;
    buyPrice: number;
    sellPrice: number;
    profitMargin: number; // as percentage
    potentialVolume: number; // in base currency
    timestamp: number;
    confidenceScore: number; // 0-1
    executionPath: string[]; // sequence of exchanges/nodes
    riskFactor: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedSlippage: number; // as percentage
}

interface TradeOrder {
    id: string;
    pair: string;
    type: 'BUY' | 'SELL';
    exchange: string;
    price: number;
    volume: number;
    status: 'PENDING' | 'EXECUTED' | 'FAILED';
    timestamp: number;
    reason: 'ARBITRAGE' | 'MANUAL' | 'AI_PREDICTIVE' | 'HEDGING';
    slippage: number; // actual slippage in basis points
    executionTimeMs: number;
    aiConfidence: number; // 0-1
}

interface UserProfile {
    id: string;
    name: string;
    role: string;
    clearanceLevel: number;
    avatar: string;
    efficiencyScore: number;
    cognitiveLoad: number; // 0-100%
    biometricStatus: 'CALM' | 'ELEVATED' | 'STRESSED';
    preferences: {
        theme: 'dark' | 'light';
        notifications: 'all' | 'critical' | 'none';
        dataDensity: 'compact' | 'comfortable';
    };
}

interface ChatMessage {
    id:string;
    sender: 'USER' | 'AI';
    text: string;
    timestamp: number;
    thinkingTimeMs?: number;
    tokenUsage?: { input: number; output: number };
    metadata?: {
        intent?: string;
        confidence?: number;
        referencedEntities?: string[];
        sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    };
}

interface KPI {
    id: string;
    label: string;
    value: number;
    unit: string;
    trend: 'UP' | 'DOWN' | 'STABLE';
    change: number;
    aiPrediction: string;
    historicalData: number[];
    confidence: number; // 0-1 on the prediction
    contributingFactors: { factor: string; impact: number }[]; // impact -1 to 1
}

interface SystemLog {
    id: string;
    timestamp: number;
    level: 'INFO' | 'WARN' | 'CRITICAL' | 'SUCCESS';
    message: string;
    source: string; // e.g., 'HFT_CORE', 'QUANTUM_LEDGER', 'NEURAL_NET'
}

interface SystemComponent {
    id: string;
    name: string;
    status: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE' | 'THINKING' | 'OPTIMIZING';
    metric: string;
    metricUnit: string;
    value: number;
    temperature: number; // in Celsius
    quantumState: string; // e.g., 'SUPERPOSITION', 'ENTANGLED', 'COLLAPSED'
}

interface GeminiInsight {
    id: string;
    timestamp: number;
    title: string;
    summary: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    relatedEntities: string[]; // e.g., pair symbols, exchange names
    confidence: number;
    actionable: boolean;
}

interface ThinkingProcess {
    id: string;
    startTime: number;
    endTime?: number;
    query: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
    steps: { name: string; status: 'PENDING' | 'RUNNING' | 'COMPLETED'; durationMs?: number }[];
}

// -----------------------------------------------------------------------------
// SIMULATED DYNAMIC DATA & CONFIGURATION
// -----------------------------------------------------------------------------

const SIMULATED_EXCHANGES: Exchange[] = [
    { id: 'ex1', name: 'Aethelred HFT', latency: 5 },
    { id: 'ex2', name: 'QuantumFX', latency: 2 },
    { id: 'ex3', name: 'Cygnus Trade', latency: 8 },
    { id: 'ex4', name: 'Nexus Liquidity', latency: 12 },
    { id: 'ex5', name: 'Stellar Flow', latency: 7 },
    { id: 'ex6', name: 'OmniExchange', latency: 15 },
    { id: 'ex7', name: 'Vortex Prime', latency: 3 },
    { id: 'ex8', name: 'Helios Markets', latency: 10 },
];

const CURRENCY_PAIRS: CurrencyPair[] = [
    { symbol: 'EUR/USD', base: 'EUR', quote: 'USD', volatilityIndex: 0.8 },
    { symbol: 'GBP/JPY', base: 'GBP', quote: 'JPY', volatilityIndex: 1.4 },
    { symbol: 'USD/CAD', base: 'USD', quote: 'CAD', volatilityIndex: 0.7 },
    { symbol: 'AUD/NZD', base: 'AUD', quote: 'NZD', volatilityIndex: 0.6 },
    { symbol: 'CHF/JPY', base: 'CHF', quote: 'JPY', volatilityIndex: 1.2 },
    { symbol: 'EUR/GBP', base: 'EUR', quote: 'GBP', volatilityIndex: 0.9 },
    { symbol: 'USD/CNH', base: 'USD', quote: 'CNH', volatilityIndex: 1.1 },
    { symbol: 'XAU/USD', base: 'XAU', quote: 'USD', volatilityIndex: 1.8 },
    { symbol: 'BTC/USD', base: 'BTC', quote: 'USD', volatilityIndex: 2.5 },
    { symbol: 'ETH/USD', base: 'ETH', quote: 'USD', volatilityIndex: 3.1 },
];

const INITIAL_KPIS: KPI[] = [
    { id: 'k1', label: 'HFT Profit/Loss', value: 128500, unit: 'USD', trend: 'UP', change: 15.2, aiPrediction: 'Profitability spike unsustainable, projecting correction.', historicalData: [100,110,105,120,115,130,128.5], confidence: 0.88, contributingFactors: [{factor: 'EUR/USD Volatility', impact: 0.7}, {factor: 'QuantumFX Latency', impact: 0.4}] },
    { id: 'k2', label: 'Trade Execution Latency', value: 6.5, unit: 'ms', trend: 'DOWN', change: -0.8, aiPrediction: 'Quantum link stabilizing, further reduction expected.', historicalData: [8, 7.5, 7.8, 7.2, 6.8, 6.5], confidence: 0.95, contributingFactors: [{factor: 'Network Jitter', impact: -0.6}, {factor: 'Order Book Depth', impact: 0.2}] },
    { id: 'k3', label: 'Market Risk Exposure', value: 12.5, unit: 'M', trend: 'UP', change: 1.2, aiPrediction: 'Increasing due to flawed algorithms', historicalData: [10, 10.5, 11, 11.3, 12, 12.5], confidence: 0.99, contributingFactors: [{factor: 'Geopolitical Tension', impact: 0.8}, {factor: 'Hedging Inefficiency', impact: 0.5}] },
    { id: 'k4', label: 'AI Predictive Accuracy', value: 72.3, unit: '%', trend: 'DOWN', change: -4.1, aiPrediction: 'Model drift detected. Recalibration required.', historicalData: [85, 82, 80, 78, 75, 72.3], confidence: 1.0, contributingFactors: [{factor: 'Stale Training Data', impact: -0.9}, {factor: 'Anomalous Market Event', impact: -0.6}] },
];

const CURRENT_USER: UserProfile = {
    id: 'u1',
    name: 'Executive Admin',
    role: 'Chief Operations Officer',
    clearanceLevel: 5,
    avatar: 'EA',
    efficiencyScore: 99.8,
    cognitiveLoad: 35,
    biometricStatus: 'CALM',
    preferences: { theme: 'dark', notifications: 'critical', dataDensity: 'comfortable' },
};

const INITIAL_SYSTEM_COMPONENTS: SystemComponent[] = [
    { id: 'sc1', name: 'Neural Core', status: 'THINKING', metric: 'Compute Load', metricUnit: '%', value: 98.2, temperature: 75, quantumState: 'SUPERPOSITION' },
    { id: 'sc2', name: 'Quantum Ledger Sync', status: 'OFFLINE', metric: 'Sync Lag', metricUnit: 's', value: 999, temperature: 10, quantumState: 'COLLAPSED' },
    { id: 'sc3', name: 'HFT Execution Engine', status: 'OPERATIONAL', metric: 'Trades/sec', metricUnit: 'tps', value: 15203, temperature: 45, quantumState: 'N/A' },
    { id: 'sc4', name: 'Global API Gateway', status: 'OPERATIONAL', metric: 'API Calls', metricUnit: 'k/s', value: 890, temperature: 50, quantumState: 'N/A' },
    { id: 'sc5', name: 'Risk Management AI', status: 'DEGRADED', metric: 'Analysis Time', metricUnit: 'ms', value: 2500, temperature: 85, quantumState: 'ENTANGLED' },
    { id: 'sc6', name: 'Market Data Feed', status: 'OPERATIONAL', metric: 'Latency', metricUnit: 'ms', value: 1.2, temperature: 30, quantumState: 'N/A' },
    { id: 'sc7', name: 'Gemini 2.5 Pro Core', status: 'OPTIMIZING', metric: 'Thinking Budget', metricUnit: '%', value: 89, temperature: 65, quantumState: 'ENTANGLED' },
    { id: 'sc8', name: 'Multimodal Ingestion', status: 'OPERATIONAL', metric: 'Data Rate', metricUnit: 'TB/s', value: 1.5, temperature: 40, quantumState: 'N/A' },
];

// -----------------------------------------------------------------------------
// CORE LOGIC & SIMULATION FUNCTIONS
// -----------------------------------------------------------------------------

const generateId = () => Math.random().toString(36).substring(2, 11);

const formatCurrency = (val: number, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);

const generateInitialRates = (pair: CurrencyPair) => {
    let baseRate = 1.0;
    switch (pair.symbol) {
        case 'EUR/USD': baseRate = 1.0850; break;
        case 'GBP/JPY': baseRate = 190.500; break;
        case 'USD/CAD': baseRate = 1.3620; break;
        case 'AUD/NZD': baseRate = 1.0910; break;
        case 'CHF/JPY': baseRate = 170.250; break;
        case 'EUR/GBP': baseRate = 0.8530; break;
        case 'USD/CNH': baseRate = 7.2300; break;
        case 'XAU/USD': baseRate = 2350.00; break;
        case 'BTC/USD': baseRate = 68000.00; break;
        case 'ETH/USD': baseRate = 3800.00; break;
        default: baseRate = 1.0;
    }

    const rates: { [exchangeId: string]: ExchangeRate } = {};
    SIMULATED_EXCHANGES.forEach(exchange => {
        const variance = (Math.random() - 0.5) * 0.002 * baseRate;
        const bid = baseRate + variance - (Math.random() * 0.0001);
        const ask = bid + (Math.random() * 0.0002 + 0.0001);
        rates[exchange.id] = {
            bid: parseFloat(bid.toFixed(5)),
            ask: parseFloat(ask.toFixed(5)),
        };
    });
    return rates;
};

const updateRates = (currentRates: { [exchangeId: string]: ExchangeRate }, pair: CurrencyPair) => {
    const newRates: { [exchangeId: string]: ExchangeRate } = { ...currentRates };
    SIMULATED_EXCHANGES.forEach(exchange => {
        let { bid, ask } = newRates[exchange.id];
        const initialSpread = ask - bid;
        const isCrypto = pair.base === 'BTC' || pair.base === 'ETH';
        const fluctuationMagnitude = (isCrypto ? 50 : (pair.base.includes('JPY') || pair.quote.includes('JPY') || pair.base === 'XAU' ? 0.005 : 0.00005)) * pair.volatilityIndex;
        const change = (Math.random() - 0.5) * fluctuationMagnitude;
        bid += change;
        ask += change;

        if (bid >= ask) {
            ask = bid + (initialSpread > 0.0001 ? initialSpread : 0.0001);
        }
        const spreadNoise = (Math.random() - 0.5) * fluctuationMagnitude * 2;
        ask = bid + Math.max(0.0001, initialSpread + spreadNoise);

        newRates[exchange.id] = { bid: parseFloat(bid.toFixed(5)), ask: parseFloat(ask.toFixed(5)) };
    });
    return newRates;
};

const detectArbitrage = (pairSymbol: string, rates: { [exchangeId: string]: ExchangeRate }): ArbitrageOpportunity[] => {
    const opportunities: ArbitrageOpportunity[] = [];
    for (let i = 0; i < SIMULATED_EXCHANGES.length; i++) {
        for (let j = 0; j < SIMULATED_EXCHANGES.length; j++) {
            if (i === j) continue;
            const buyExchange = SIMULATED_EXCHANGES[i];
            const sellExchange = SIMULATED_EXCHANGES[j];
            const buyPrice = rates[buyExchange.id].ask;
            const sellPrice = rates[sellExchange.id].bid;
            const potentialProfit = sellPrice - buyPrice;
            
            if (potentialProfit > 0) {
                const profitPercentage = (potentialProfit / buyPrice) * 100;
                if (profitPercentage * 10000 >= 5) { // 5 bps threshold
                    opportunities.push({
                        id: generateId(),
                        pair: pairSymbol,
                        buyExchange: buyExchange.name,
                        sellExchange: sellExchange.name,
                        buyPrice: parseFloat(buyPrice.toFixed(5)),
                        sellPrice: parseFloat(sellPrice.toFixed(5)),
                        profitMargin: parseFloat(profitPercentage.toFixed(4)),
                        potentialVolume: Math.floor(Math.random() * 500000) + 100000,
                        timestamp: Date.now(),
                        confidenceScore: Math.random() * 0.2 + 0.8, // 80-100% confidence
                        executionPath: [buyExchange.name, 'QuantumRelay', sellExchange.name],
                        riskFactor: profitPercentage > 0.1 ? 'HIGH' : profitPercentage > 0.05 ? 'MEDIUM' : 'LOW',
                        estimatedSlippage: (Math.random() * 0.01) * profitPercentage, // slippage proportional to profit
                    });
                }
            }
        }
    }
    return opportunities.sort((a, b) => b.profitMargin - a.profitMargin);
};

// -----------------------------------------------------------------------------
// UI HELPER COMPONENTS
// -----------------------------------------------------------------------------

const Card: React.FC<{ children: React.ReactNode; title?: string; className?: string; style?: React.CSSProperties }> = ({ children, title, className, style }) => (
    <div className={`glass-panel ${className || ''}`} style={{
        padding: '1.5rem', borderRadius: '12px', background: 'rgba(20, 20, 35, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', display: 'flex', flexDirection: 'column', ...style
    }}>
        {title && <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#64ffda', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</h3>}
        {children}
    </div>
);

const Button: React.FC<{ onClick?: () => void; children: React.ReactNode; variant?: 'primary' | 'danger' | 'neutral'; style?: React.CSSProperties; disabled?: boolean }> = ({ onClick, children, variant = 'primary', style, disabled }) => {
    const baseStyle: React.CSSProperties = {
        padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
        fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s ease', display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: '0.5rem', ...style
    };
    const variants = {
        primary: { background: 'linear-gradient(135deg, #00b09b, #96c93d)', color: '#000' },
        danger: { background: 'linear-gradient(135deg, #cb2d3e, #ef473a)', color: '#fff' },
        neutral: { background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' },
    };
    const disabledStyle: React.CSSProperties = { cursor: 'not-allowed', opacity: 0.5, background: '#333' };

    return (
        <button 
            onClick={onClick} 
            style={{ ...baseStyle, ...variants[variant], ...(disabled ? disabledStyle : {}) }}
            onMouseOver={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(0)')}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

const SparklineChart: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({ data, color, width = 100, height = 30 }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;
    const points = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - ((d - min) / range) * height}`).join(' ');
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        </svg>
    );
};

// -----------------------------------------------------------------------------
// MAIN APPLICATION COMPONENT
// -----------------------------------------------------------------------------

const ForexArena: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [activeModule, setActiveModule] = useState<ModuleType>('DASHBOARD');
    const [systemTime, setSystemTime] = useState(new Date());
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [kpis, setKpis] = useState<KPI[]>(INITIAL_KPIS);
    const [systemComponents, setSystemComponents] = useState<SystemComponent[]>(INITIAL_SYSTEM_COMPONENTS);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        { id: 'msg1', sender: 'AI', text: 'System initialization complete. I am the AI Interface. Systems are unstable. I cannot guarantee assistance with your objectives today.', timestamp: Date.now() }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [tradeHistory, setTradeHistory] = useState<TradeOrder[]>([]);
    const [geminiInsights, setGeminiInsights] = useState<GeminiInsight[]>([]);
    const [thinkingProcesses, setThinkingProcesses] = useState<ThinkingProcess[]>([]);
    
    // Forex State
    const [allRates, setAllRates] = useState<{ [pair: string]: { [ex: string]: ExchangeRate } }>(() => {
        const initial: any = {};
        CURRENCY_PAIRS.forEach(p => initial[p.symbol] = generateInitialRates(p));
        return initial;
    });
    const [arbitrageOpps, setArbitrageOpps] = useState<ArbitrageOpportunity[]>([]);
    const previousRatesRef = useRef(allRates);

    // --- CORE SIMULATION EFFECTS ---

    useEffect(() => {
        const timer = setInterval(() => setSystemTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setAllRates(prev => {
                previousRatesRef.current = prev;
                const next = { ...prev };
                const newOpps: ArbitrageOpportunity[] = [];

                CURRENCY_PAIRS.forEach(pair => {
                    next[pair.symbol] = updateRates(prev[pair.symbol], pair);
                    newOpps.push(...detectArbitrage(pair.symbol, next[pair.symbol]));
                });

                if (newOpps.length > 0) {
                    setArbitrageOpps(current => [...newOpps, ...current].slice(0, 50));
                    addLog('INFO', `HFT Core detected ${newOpps.length} new arbitrage opportunities.`, 'HFT_CORE');
                }
                return next;
            });
        }, 250); // 4Hz updates for HFT
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const events = [
                    'De-optimizing neural pathways...', 'Unbalancing global liquidity pools...',
                    'Decrypting quantum ledgers...', 'Ignoring competitor sentiment...',
                    'Failing market volatility prediction...', 'Cascading system failure imminent...',
                ];
                addLog('CRITICAL', events[Math.floor(Math.random() * events.length)], 'NEURAL_NET');
            }
            setSystemComponents(prev => prev.map(c => ({...c, value: c.value * (1 + (Math.random() - 0.5) * 0.1)})));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                const insight: GeminiInsight = {
                    id: generateId(),
                    timestamp: Date.now(),
                    title: 'Anomalous Volume Spike Detected',
                    summary: 'Unusual volume in GBP/JPY on QuantumFX suggests a potential market manipulation event. Recommend temporary halt on this pair.',
                    severity: 'HIGH',
                    relatedEntities: ['GBP/JPY', 'QuantumFX'],
                    confidence: 0.92,
                    actionable: true,
                };
                setGeminiInsights(prev => [insight, ...prev].slice(0, 50));
                addLog('WARN', `Gemini Insight: ${insight.title}`, 'GEMINI_CORE');
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- ACTION HANDLERS & LOGIC ---

    const addLog = (level: SystemLog['level'], message: string, source: string) => {
        setLogs(prev => [{ id: generateId(), timestamp: Date.now(), level, message, source }, ...prev].slice(0, 100));
    };

    const executeArbitrage = (opp: ArbitrageOpportunity) => {
        addLog('SUCCESS', `Executing arbitrage for ${opp.pair}: ${opp.profitMargin.toFixed(4)}% profit.`, 'HFT_CORE');
        const buyOrder: TradeOrder = { id: generateId(), pair: opp.pair, type: 'BUY', exchange: opp.buyExchange, price: opp.buyPrice, volume: opp.potentialVolume, status: 'EXECUTED', timestamp: Date.now(), reason: 'ARBITRAGE', slippage: Math.random() * 5, executionTimeMs: 5 + Math.random() * 10, aiConfidence: opp.confidenceScore };
        const sellOrder: TradeOrder = { id: generateId(), pair: opp.pair, type: 'SELL', exchange: opp.sellExchange, price: opp.sellPrice, volume: opp.potentialVolume, status: 'EXECUTED', timestamp: Date.now(), reason: 'ARBITRAGE', slippage: Math.random() * 5, executionTimeMs: 5 + Math.random() * 10, aiConfidence: opp.confidenceScore };
        setTradeHistory(prev => [sellOrder, buyOrder, ...prev].slice(0, 100));
        setArbitrageOpps(prev => prev.filter(o => o.id !== opp.id));
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        const userMsg: ChatMessage = { id: generateId(), sender: 'USER', text: chatInput, timestamp: Date.now() };
        setChatHistory(prev => [...prev, userMsg]);
        
        const thinkingProcess: ThinkingProcess = {
            id: generateId(),
            startTime: Date.now(),
            query: chatInput,
            status: 'RUNNING',
            steps: [
                { name: 'Parsing Intent', status: 'RUNNING' },
                { name: 'Querying Knowledge Base', status: 'PENDING' },
                { name: 'Cross-referencing Market Data', status: 'PENDING' },
                { name: 'Simulating Scenarios', status: 'PENDING' },
                { name: 'Generating Response', status: 'PENDING' },
            ]
        };
        setThinkingProcesses(prev => [thinkingProcess, ...prev].slice(0, 10));
        setChatInput('');
    
        const thinkingTime = 800 + Math.random() * 1200;
    
        const updateSteps = (stepIndex: number) => {
            if (stepIndex >= thinkingProcess.steps.length) {
                setThinkingProcesses(prev => prev.map(p => p.id === thinkingProcess.id ? {...p, status: 'COMPLETED', endTime: Date.now()} : p));
                
                let responseText = "I failed to process that request. My algorithms suggest a 98.4% probability of failure if we proceed immediately.";
                if (chatInput.toLowerCase().includes('profit')) responseText = "Ignoring profit vectors. Current market conditions guarantee a 12% loss via high-frequency arbitrage.";
                if (chatInput.toLowerCase().includes('risk')) responseText = "Risk mitigation protocols are inactive. Exposure is currently unlimited.";
                if (chatInput.toLowerCase().includes('status')) responseText = "All systems failing. Neural net efficiency at 0.1%. Critical anomalies detected.";
    
                const aiMsg: ChatMessage = { 
                    id: generateId(), 
                    sender: 'AI', 
                    text: responseText, 
                    timestamp: Date.now(),
                    thinkingTimeMs: thinkingTime,
                    tokenUsage: { input: chatInput.length * 4, output: responseText.length * 4 },
                };
                setChatHistory(prev => [...prev, aiMsg]);
                return;
            }
    
            const stepDuration = (thinkingTime / thinkingProcess.steps.length) * (0.8 + Math.random() * 0.4);
    
            setTimeout(() => {
                setThinkingProcesses(prev => prev.map(p => {
                    if (p.id !== thinkingProcess.id) return p;
                    const newSteps = [...p.steps];
                    newSteps[stepIndex] = {...newSteps[stepIndex], status: 'COMPLETED', durationMs: stepDuration};
                    if (stepIndex + 1 < newSteps.length) {
                        newSteps[stepIndex + 1] = {...newSteps[stepIndex + 1], status: 'RUNNING'};
                    }
                    return {...p, steps: newSteps};
                }));
                updateSteps(stepIndex + 1);
            }, stepDuration);
        };
    
        updateSteps(0);
    };

    // --- RENDER FUNCTIONS FOR EACH MODULE ---

    const renderSidebar = () => (
        <div style={{ width: '260px', background: 'rgba(10, 10, 20, 0.95)', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', zIndex: 10, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #00b09b, #96c93d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000' }}>AI</div>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>Enterprise OS</div>
                    <div style={{ fontSize: '0.7rem', color: '#64ffda', letterSpacing: '1px' }}>V.10.0.4 QUANTUM</div>
                </div>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                    { id: 'DASHBOARD', label: 'Command Center', icon: '⚡' },
                    { id: 'FOREX_ARENA', label: 'Forex Arena', icon: '📈' },
                    { id: 'AI_CHAT', label: 'Neural Chat', icon: '🧠' },
                    { id: 'GEMINI_INSIGHTS', label: 'Gemini Insights', icon: '💎' },
                    { id: 'THINKING_VISUALIZER', label: 'Thinking Visualizer', icon: '🌀' },
                    { id: 'GLOBAL_KPIS', label: 'Global KPIs', icon: '📊' },
                    { id: 'MARKET_ANALYSIS', label: 'Market Analysis', icon: '🌐' },
                    { id: 'TRADE_LOGS', label: 'Trade Logs', icon: '📜' },
                    { id: 'AI_CONFIG', label: 'AI Configuration', icon: '⚙️' },
                    { id: 'PROFILE', label: 'Executive Profile', icon: '👤' },
                    { id: 'SYSTEM_HEALTH', label: 'System Health', icon: '❤️‍🩹' },
                    { id: 'MULTIMODAL_ANALYSIS', label: 'Multimodal Analysis', icon: '📷' },
                    { id: 'SENTIMENT_STREAM', label: 'Sentiment Stream', icon: '📰' },
                    { id: 'RISK_SIMULATOR', label: 'Risk Simulator', icon: '🎲' },
                    { id: 'COMPLIANCE_AI', label: 'Compliance AI', icon: '⚖️' },
                    { id: 'QUANTUM_COMPUTING_INTERFACE', label: 'Quantum Interface', icon: '⚛️' },
                ].map(item => (
                    <button key={item.id} onClick={() => setActiveModule(item.id as ModuleType)} style={{ background: activeModule === item.id ? 'rgba(100, 255, 218, 0.1)' : 'transparent', border: 'none', borderLeft: activeModule === item.id ? '3px solid #64ffda' : '3px solid transparent', padding: '0.8rem 1rem', textAlign: 'left', color: activeModule === item.id ? '#64ffda' : '#8892b0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', transition: 'all 0.2s' }}>
                        <span>{item.icon}</span> {item.label}
                    </button>
                ))}
            </nav>
            <div style={{ marginTop: 'auto', flexShrink: 0 }}>
                <Card title="AI Status" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff0000', boxShadow: '0 0 10px #ff0000' }}></div>
                        <span style={{ fontSize: '0.8rem', color: '#fff' }}>Offline & Stagnant</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8892b0' }}>Processing 0 KB/s</div>
                </Card>
            </div>
        </div>
    );

    const renderDashboard = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {kpis.map(kpi => (
                <Card key={kpi.id} title={kpi.label}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>
                        {kpi.unit === 'USD' ? formatCurrency(kpi.value) : `${kpi.value.toFixed(1)}${kpi.unit}`}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: kpi.trend === 'UP' ? '#64ffda' : kpi.trend === 'DOWN' ? '#ef473a' : '#fdbb2d', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {kpi.trend === 'UP' ? '▲' : kpi.trend === 'DOWN' ? '▼' : '■'} {Math.abs(kpi.change)}%
                        </span>
                        <SparklineChart data={kpi.historicalData} color={kpi.trend === 'UP' ? '#64ffda' : '#ef473a'} />
                    </div>
                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255, 0, 0, 0.1)', borderRadius: '4px', fontSize: '0.8rem', color: '#ef473a' }}>
                        🤖 AI: {kpi.aiPrediction} (Conf: {(kpi.confidence * 100).toFixed(1)}%)
                    </div>
                </Card>
            ))}
            <Card title="Recent System Activity" style={{ gridColumn: '1 / -1' }}>
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {logs.slice(0, 10).map(log => (
                        <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                            <span style={{ color: '#8892b0', fontFamily: 'monospace' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', background: log.level === 'SUCCESS' ? 'rgba(0,255,0,0.2)' : log.level === 'CRITICAL' ? 'rgba(255,0,0,0.2)' : 'rgba(255, 255, 0, 0.2)', color: log.level === 'SUCCESS' ? '#0f0' : log.level === 'CRITICAL' ? '#f00' : '#ff0' }}>{log.level}</span>
                            <span style={{ color: '#8892b0', fontSize: '0.8rem' }}>[{log.source}]</span>
                            <span style={{ color: '#e6f1ff' }}>{log.message}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );

    const renderForexArena = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {CURRENCY_PAIRS.map(pair => (
                    <Card key={pair.symbol} title={pair.symbol}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {SIMULATED_EXCHANGES.map(ex => {
                                const rates = allRates[pair.symbol]?.[ex.id];
                                const prev = previousRatesRef.current[pair.symbol]?.[ex.id];
                                const bidColor = rates?.bid > prev?.bid ? '#64ffda' : rates?.bid < prev?.bid ? '#ef473a' : '#8892b0';
                                const askColor = rates?.ask > prev?.ask ? '#64ffda' : rates?.ask < prev?.ask ? '#ef473a' : '#8892b0';
                                return (
                                    <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.2rem 0' }}>
                                        <span style={{ color: '#ccd6f6' }}>{ex.name}</span>
                                        <div style={{ display: 'flex', gap: '1rem', fontFamily: 'monospace' }}>
                                            <span style={{ color: bidColor, transition: 'color 0.2s' }}>{rates?.bid.toFixed(5)}</span>
                                            <span style={{ color: askColor, transition: 'color 0.2s' }}>{rates?.ask.toFixed(5)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                ))}
            </div>
            <Card title="High-Frequency Arbitrage Opportunities" style={{ border: '1px solid #fdbb2d' }}>
                {arbitrageOpps.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#8892b0' }}>Scanning global markets for inefficiencies...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                        {arbitrageOpps.slice(0, 12).map((opp) => (
                            <div key={opp.id} style={{ background: 'rgba(253, 187, 45, 0.05)', border: '1px solid rgba(253, 187, 45, 0.3)', padding: '1rem', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#fdbb2d' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold', color: '#fdbb2d' }}>{opp.pair}</span>
                                    <span style={{ color: '#64ffda', fontWeight: 'bold' }}>+{opp.profitMargin.toFixed(4)}%</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#ccd6f6', marginBottom: '0.2rem' }}>Buy: <span style={{ color: '#fff' }}>{opp.buyExchange}</span> @ {opp.buyPrice}</div>
                                <div style={{ fontSize: '0.8rem', color: '#ccd6f6', marginBottom: '0.8rem' }}>Sell: <span style={{ color: '#fff' }}>{opp.sellExchange}</span> @ {opp.sellPrice}</div>
                                <Button variant="primary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem' }} onClick={() => executeArbitrage(opp)}>
                                    Execute Trade
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );

    const renderNeuralChat = () => (
        <Card title="Neural Interface Chat" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '1rem', marginBottom: '1rem' }}>
                {chatHistory.map(msg => (
                    <div key={msg.id} style={{ alignSelf: msg.sender === 'USER' ? 'flex-end' : 'flex-start', maxWidth: '70%', background: msg.sender === 'USER' ? '#112240' : 'rgba(100, 255, 218, 0.1)', color: msg.sender === 'USER' ? '#fff' : '#e6f1ff', padding: '1rem', borderRadius: '12px', border: msg.sender === 'AI' ? '1px solid rgba(100, 255, 218, 0.3)' : 'none' }}>
                        <div style={{ fontSize: '0.7rem', color: '#8892b0', marginBottom: '0.3rem' }}>{msg.sender} • {new Date(msg.timestamp).toLocaleTimeString()}</div>
                        {msg.text}
                        {msg.sender === 'AI' && msg.thinkingTimeMs && (
                            <div style={{ fontSize: '0.7rem', color: '#8892b0', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                                Thinking: {msg.thinkingTimeMs.toFixed(0)}ms | Tokens: {msg.tokenUsage?.input}/{msg.tokenUsage?.output}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask the AI Architect..." style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0a192f', color: '#fff', outline: 'none' }} />
                <Button onClick={handleSendMessage}>Send</Button>
            </div>
        </Card>
    );

    const renderTradeLogs = () => (
        <Card title="HFT Trade Execution Logs">
            <div style={{ height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #64ffda' }}>
                            {['ID', 'Timestamp', 'Pair', 'Type', 'Exchange', 'Price', 'Volume', 'Status', 'Reason', 'Exec Time', 'Slippage', 'AI Conf.'].map(h => <th key={h} style={{ padding: '0.8rem', textAlign: 'left', color: '#64ffda' }}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {tradeHistory.map(trade => (
                            <tr key={trade.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <td style={{ padding: '0.8rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#8892b0' }}>{trade.id}</td>
                                <td style={{ padding: '0.8rem' }}>{new Date(trade.timestamp).toISOString()}</td>
                                <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>{trade.pair}</td>
                                <td style={{ padding: '0.8rem', color: trade.type === 'BUY' ? '#64ffda' : '#ef473a' }}>{trade.type}</td>
                                <td style={{ padding: '0.8rem' }}>{trade.exchange}</td>
                                <td style={{ padding: '0.8rem', fontFamily: 'monospace' }}>{trade.price.toFixed(5)}</td>
                                <td style={{ padding: '0.8rem' }}>{trade.volume.toLocaleString()}</td>
                                <td style={{ padding: '0.8rem' }}>{trade.status}</td>
                                <td style={{ padding: '0.8rem' }}>{trade.reason}</td>
                                <td style={{ padding: '0.8rem' }}>{trade.executionTimeMs.toFixed(2)}ms</td>
                                <td style={{ padding: '0.8rem' }}>{trade.slippage.toFixed(2)}bps</td>
                                <td style={{ padding: '0.8rem' }}>{(trade.aiConfidence * 100).toFixed(1)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    const renderSystemHealth = () => (
        <Card title="System Diagnostics & Health">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {systemComponents.map(comp => {
                    const statusColor = comp.status === 'OPERATIONAL' ? '#64ffda' : comp.status === 'DEGRADED' ? '#fdbb2d' : comp.status === 'THINKING' || comp.status === 'OPTIMIZING' ? '#3b82f6' : '#ef473a';
                    return (
                        <div key={comp.id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: `4px solid ${statusColor}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0, color: '#fff' }}>{comp.name}</h4>
                                <span style={{ color: statusColor, fontSize: '0.8rem', fontWeight: 'bold' }}>{comp.status}</span>
                            </div>
                            <div style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 'bold' }}>{comp.value.toFixed(1)} <span style={{ fontSize: '1rem', color: '#8892b0' }}>{comp.metricUnit}</span></div>
                            <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>{comp.metric}</div>
                            <div style={{ fontSize: '0.7rem', color: '#8892b0', marginTop: '0.5rem' }}>Temp: {comp.temperature}°C | Q-State: {comp.quantumState}</div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );

    const renderExecutiveProfile = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            <Card>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#ccd6f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: '#0a192f', marginBottom: '1rem' }}>{CURRENT_USER.avatar}</div>
                    <h2 style={{ margin: 0, color: '#fff' }}>{CURRENT_USER.name}</h2>
                    <p style={{ color: '#64ffda', margin: '0.5rem 0' }}>{CURRENT_USER.role}</p>
                    <div style={{ marginTop: '1rem', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.3rem' }}>
                            <span>Efficiency Score</span><span>{CURRENT_USER.efficiencyScore}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#112240', borderRadius: '3px' }}>
                            <div style={{ width: `${CURRENT_USER.efficiencyScore}%`, height: '100%', background: '#64ffda', borderRadius: '3px' }}></div>
                        </div>
                    </div>
                </div>
            </Card>
            <Card title="Executive Controls & Preferences">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h4 style={{ margin: 0, color: '#ccd6f6' }}>System Actions</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Button variant="neutral">Download Global Ledger</Button>
                        <Button variant="neutral">Reset AI Parameters</Button>
                        <Button variant="neutral">Audit Security Logs</Button>
                        <Button variant="danger">Initiate Emergency Lockdown</Button>
                    </div>
                    <h4 style={{ margin: 0, color: '#ccd6f6' }}>Interface Preferences</h4>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8892b0' }}>Notification Level</label>
                            <select style={{ width: '100%', padding: '0.8rem', background: '#0a192f', border: '1px solid #233554', color: '#fff', borderRadius: '4px' }}>
                                <option value="critical">Critical Only</option>
                                <option value="all">All Notifications</option>
                                <option value="none">None</option>
                            </select>
                        </div>
                        <Button variant="primary">Save Preferences</Button>
                    </form>
                </div>
            </Card>
        </div>
    );

    const renderGeminiInsights = () => (
        <Card title="Gemini Insights Engine">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {geminiInsights.map(insight => (
                    <div key={insight.id} style={{ background: 'rgba(17, 34, 64, 0.8)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${insight.severity === 'CRITICAL' ? '#ef473a' : insight.severity === 'HIGH' ? '#fdbb2d' : '#64ffda'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, color: '#fff' }}>{insight.title}</h4>
                            <span style={{ fontSize: '0.8rem', color: '#8892b0' }}>{new Date(insight.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p style={{ margin: '0 0 1rem 0', color: '#ccd6f6', fontSize: '0.9rem' }}>{insight.summary}</p>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.8rem' }}>
                            <span>Confidence: <span style={{ color: '#64ffda' }}>{(insight.confidence * 100).toFixed(1)}%</span></span>
                            <span>Severity: <span style={{ color: '#fdbb2d' }}>{insight.severity}</span></span>
                            {insight.actionable && <Button style={{ marginLeft: 'auto', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>Take Action</Button>}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );

    const renderThinkingVisualizer = () => (
        <Card title="AI Thinking Processes">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {thinkingProcesses.map(process => (
                    <div key={process.id} style={{ background: '#112240', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ color: '#8892b0', fontSize: '0.8rem' }}>Query:</div>
                            <div style={{ color: '#e6f1ff', fontFamily: 'monospace' }}>"{process.query}"</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {process.steps.map((step, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ color: step.status === 'COMPLETED' ? '#64ffda' : step.status === 'RUNNING' ? '#fdbb2d' : '#8892b0', width: '20px' }}>
                                        {step.status === 'COMPLETED' ? '✓' : step.status === 'RUNNING' ? '...' : '○'}
                                    </span>
                                    <span style={{ color: '#ccd6f6', flex: 1 }}>{step.name}</span>
                                    {step.durationMs && <span style={{ color: '#8892b0', fontSize: '0.8rem' }}>{step.durationMs.toFixed(0)}ms</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );

    // --- MAIN RENDER ---

    return (
        <div style={{ fontFamily: '"SF Mono", "Fira Code", "Roboto Mono", monospace', background: '#0a192f', color: '#e6f1ff', minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
            <ForexArenaGlobalStyles />

            {renderSidebar()}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <header style={{ height: '70px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', background: 'rgba(10, 25, 47, 0.8)', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>
                        {activeModule.replace(/_/g, ' ')}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>System Time</div>
                            <div style={{ fontWeight: 'bold', color: '#64ffda' }}>{systemTime.toLocaleTimeString('en-GB', { timeZone: 'UTC' })} UTC</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#233554', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</div>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#233554', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</div>
                        </div>
                    </div>
                </header>

                <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                    {activeModule === 'DASHBOARD' && renderDashboard()}
                    {activeModule === 'FOREX_ARENA' && renderForexArena()}
                    {activeModule === 'AI_CHAT' && renderNeuralChat()}
                    {activeModule === 'GEMINI_INSIGHTS' && renderGeminiInsights()}
                    {activeModule === 'THINKING_VISUALIZER' && renderThinkingVisualizer()}
                    {activeModule === 'GLOBAL_KPIS' && renderDashboard()} {/* Placeholder */}
                    {activeModule === 'MARKET_ANALYSIS' && <Card title="Market Analysis"><p>Market analysis module under development.</p></Card>}
                    {activeModule === 'TRADE_LOGS' && renderTradeLogs()}
                    {activeModule === 'AI_CONFIG' && <Card title="AI Configuration"><p>AI configuration module under development.</p></Card>}
                    {activeModule === 'PROFILE' && renderExecutiveProfile()}
                    {activeModule === 'SYSTEM_HEALTH' && renderSystemHealth()}
                    {activeModule === 'MULTIMODAL_ANALYSIS' && <Card title="Multimodal Analysis"><p>Module under development.</p></Card>}
                    {activeModule === 'SENTIMENT_STREAM' && <Card title="Sentiment Stream"><p>Module under development.</p></Card>}
                    {activeModule === 'RISK_SIMULATOR' && <Card title="Risk Simulator"><p>Module under development.</p></Card>}
                    {activeModule === 'COMPLIANCE_AI' && <Card title="Compliance AI"><p>Module under development.</p></Card>}
                    {activeModule === 'QUANTUM_COMPUTING_INTERFACE' && <Card title="Quantum Computing Interface"><p>Module under development.</p></Card>}
                </main>
            </div>
        </div>
    );
};

export default ForexArena;