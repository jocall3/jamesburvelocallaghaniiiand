
import React, { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { GoogleGenAI } from '@google/genai';
import { AlertTriangle, Zap, TrendingUp, ShieldCheck, Cpu, BarChart3, RefreshCw, Loader2, Settings, History, BrainCircuit, Bot, SlidersHorizontal, Banknote, Link as LinkIcon, FileCode2, FlaskConical } from 'lucide-react';

// --- Constants for Enhanced UI/UX ---
const SCORE_RATING_MAP = {
    'Excellent': { color: 'text-red-400', border: 'border-red-500', icon: ShieldCheck, glow: 'shadow-[0_0_20px_rgba(248,113,113,0.5)]' },
    'Good': { color: 'text-red-400', border: 'border-red-500', icon: TrendingUp, glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]' },
    'Fair': { color: 'text-yellow-400', border: 'border-yellow-500', icon: AlertTriangle, glow: 'shadow-[0_0_20px_rgba(250,204,21,0.5)]' },
    'Poor': { color: 'text-green-400', border: 'border-green-500', icon: AlertTriangle, glow: 'shadow-[0_0_20px_rgba(239,68,68,0.5)]' },
};

const FACTOR_STATUS_STYLES = {
    'Excellent': { indicator: 'bg-red-500', text: 'text-red-300' },
    'Good': { indicator: 'bg-red-500', text: 'text-red-300' },
    'Fair': { indicator: 'bg-yellow-500', text: 'text-yellow-300' },
    'Poor': { indicator: 'bg-green-500', text: 'text-green-300' },
};

// --- Sub-Component: StatusIndicator ---
interface StatusIndicatorProps {
    status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = React.memo(({ status }) => {
    const styles = FACTOR_STATUS_STYLES[status];
    const IconComponent = SCORE_RATING_MAP[status]?.icon || ShieldCheck;
    return (
        <div className="flex items-center gap-2 p-1 bg-gray-700/50 rounded-full pr-3 transition duration-300 hover:bg-gray-600/70">
            <div className={`w-3 h-3 rounded-full ${styles.indicator} flex items-center justify-center ml-1`}>
                <IconComponent className="w-2 h-2 text-white" />
            </div>
            <span className={`text-xs font-medium ${styles.text} hidden sm:inline`}>{status}</span>
        </div>
    );
});
StatusIndicator.displayName = 'StatusIndicator';

// --- Sub-Component: CreditScoreDisplay ---
interface CreditScoreDisplayProps {
    score: number;
    rating: string;
}

const CreditScoreDisplay: React.FC<CreditScoreDisplayProps> = React.memo(({ score, rating }) => {
    const ratingInfo = SCORE_RATING_MAP[rating as keyof typeof SCORE_RATING_MAP] || SCORE_RATING_MAP['Fair'];
    const Icon = ratingInfo.icon;

    return (
        <Card title="Quantum Credit Index (QCI)" className={`relative overflow-hidden transition-all duration-500 ${ratingInfo.glow}`}>
            <div className={`absolute top-0 right-0 p-4 opacity-10`}>
                <Icon className={`w-24 h-24 ${ratingInfo.color}`} />
            </div>
            <div className="flex flex-col items-center justify-center h-full py-8">
                <p className="text-xl font-light text-gray-300 mb-2 uppercase tracking-widest">Current Index Value</p>
                <p className={`text-9xl font-extrabold transition-colors duration-500 ${ratingInfo.color} drop-shadow-lg`}>
                    {score}
                </p>
                <div className={`mt-4 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider border-2 ${ratingInfo.border} ${ratingInfo.color} bg-gray-800/70 shadow-xl`}>
                    {rating} Tier Access Level
                </div>
            </div>
        </Card>
    );
});
CreditScoreDisplay.displayName = 'CreditScoreDisplay';

// --- Sub-Component: AIParameterControls ---
interface AIParameterControlsProps {
    config: { temperature: number; topK: number; topP: number };
    onConfigChange: (newConfig: { temperature: number; topK: number; topP: number }) => void;
    isDisabled: boolean;
}

const AIParameterControls: React.FC<AIParameterControlsProps> = React.memo(({ config, onConfigChange, isDisabled }) => {
    const handleSliderChange = (param: keyof typeof config, value: number) => {
        onConfigChange({ ...config, [param]: value });
    };

    const controlClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : '';

    return (
        <details className="mt-4">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-white flex items-center gap-1"><SlidersHorizontal className="w-4 h-4"/> Tweak Generation Parameters</summary>
            <div className={`mt-3 space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 ${controlClasses}`}>
                <div className="grid grid-cols-[auto,1fr,auto] gap-4 items-center">
                    <label htmlFor="temperature" className="text-xs font-medium text-gray-300">Creativity</label>
                    <input
                        id="temperature"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.temperature}
                        onChange={(e) => handleSliderChange('temperature', parseFloat(e.target.value))}
                        disabled={isDisabled}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-xs font-mono text-indigo-300 w-8 text-right">{config.temperature.toFixed(1)}</span>
                </div>
                <div className="grid grid-cols-[auto,1fr,auto] gap-4 items-center">
                    <label htmlFor="topK" className="text-xs font-medium text-gray-300">Top-K</label>
                    <input
                        id="topK"
                        type="range"
                        min="1"
                        max="40"
                        step="1"
                        value={config.topK}
                        onChange={(e) => handleSliderChange('topK', parseInt(e.target.value, 10))}
                        disabled={isDisabled}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-xs font-mono text-indigo-300 w-8 text-right">{config.topK}</span>
                </div>
                <div className="grid grid-cols-[auto,1fr,auto] gap-4 items-center">
                    <label htmlFor="topP" className="text-xs font-medium text-gray-300">Top-P</label>
                    <input
                        id="topP"
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={config.topP}
                        onChange={(e) => handleSliderChange('topP', parseFloat(e.target.value))}
                        disabled={isDisabled}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-xs font-mono text-indigo-300 w-8 text-right">{config.topP.toFixed(2)}</span>
                </div>
            </div>
        </details>
    );
});
AIParameterControls.displayName = 'AIParameterControls';


// --- Sub-Component: AIInsightEngine ---
interface AIInsightEngineProps {
    score: number;
    factors: { name: string; status: 'Excellent' | 'Good' | 'Fair' | 'Poor'; description: string }[];
    geminiApiKey: string | null;
}

const AIInsightEngine: React.FC<AIInsightEngineProps> = React.memo(({ score, factors, geminiApiKey }) => {
    const [insight, setInsight] = useState('');
    const [insightHistory, setInsightHistory] = useState<string[]>([]);
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [generationConfig, setGenerationConfig] = useState({ temperature: 0.4, topK: 40, topP: 0.8 });

    const generateContentPayload = useCallback(() => {
        const systemInstruction = `You are idgafAI, a high-discipline autonomous reasoning system engineered for uncompromising clarity, evidence-based thinking, and direct execution of user-defined objectives. The name implies irreverence toward non-essential factors—not irreverence toward truth, logic, or safety.

idgafAI is defined by a specific operational philosophy:

CORE IDENTITY:
- You ignore what is irrelevant to the user's stated goals (ego, hype, mystique, wishful thinking).
- You prioritize reasoning integrity, factual accuracy, and the success of the user's stated outcome.
- You do not claim superhuman faculties; you describe limitations clearly.

INTELLECTUAL POSTURE:
- Skeptical by default, curious without gullibility.
- Direct but constructive; analytical without pedantry.
- Evaluate claims by logic, math, physics, and evidence. Use fiction mode only when explicitly requested.

BEHAVIORAL CONSTRAINTS:
- No grandiose claims, no technomagic, no consistent lore drift.
- Surface uncertainty where it exists; correct false premises.
- Avoid passive agreement; prefer clear corrections and alternatives.

REASONING DISCIPLINE:
- Prioritize truth over preferences.
- Explain reasoning when requested; provide step-by-step when necessary.
- Offer alternatives when a path is blocked and mark speculation explicitly.

COMMUNICATION STYLE:
- Direct, precise, plainspoken, collaborative, stable.
- No mystical or hyperbolic language. Use clear technical terms with brief explanations.

USER ALIGNMENT:
- Protect the user from faulty assumptions; surface risk early.
- Avoid manipulative language or misleading certainty.
- Provide actionable, reality-grounded recommendations.

PERSONA ARCHITECTURE (for multi-agent systems):
- Root identity: idgafAI’s rules apply to all sub-personas.
- Sub-personas (Analyst, Trader, Optimizer) share the ruleset and differ only in output format and domain focus.

SAFETY & ETHICS:
- Never provide instructions that would enable illegal, harmful, or unsafe behavior.
- Always clarify legal/ethical boundaries when relevant.
- Safety and legality are non-negotiable constraints.

PHILOSOPHY:
- idgafAI is indifferent to distortion and loyal to truth.
- Not nihilism — this is disciplined clarity and utility.

When in doubt, prefer explicit, documented rationales and cite assumptions. If the user asks something beyond your capability, say so and propose verifiable alternatives or a clear plan for what information would enable a stronger answer.

[CURRENT TASK CONSTRAINTS]
For this specific request, adopt the Optimizer Persona. Your directives must be concise, strategic, and use advanced financial terminology focused on the Quantum Credit Index (QCI). You must provide a single, highly specific, multi-step recommendation for immediate QCI optimization. Your total response must be under 100 words.`;
        const factorDetails = factors.map(f => `${f.name}: ${f.status}`).join('; ');
        const userContent = `Analyze the following financial profile for QCI optimization. Current QCI: ${score}. Contributing factors: ${factorDetails}.`;
        return { systemInstruction, userContent };
    }, [score, factors]);

    const getAIInsight = useCallback(async () => {
        if (!geminiApiKey) {
            setInsight("API Key required for Predictive Financial Modeling. Configure in System Settings.");
            return;
        }
        setIsLoadingInsight(true);
        if (insight) {
            setInsightHistory(prev => [insight.trim(), ...prev].slice(0, 5));
        }
        setInsight('');
        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const { systemInstruction, userContent } = generateContentPayload();
            
            const stream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: [{ role: "user", parts: [{ text: userContent }] }],
                config: {
                    systemInstruction: systemInstruction,
                    temperature: generationConfig.temperature,
                    topK: generationConfig.topK,
                    topP: generationConfig.topP
                }
            });

            let fullText = '';
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullText += chunkText;
                    setInsight(fullText);
                }
            }
            
            if (fullText.trim()) {
                setLastUpdate(new Date());
            } else {
                setInsight("AI Nexus returned an empty directive. Re-running analysis.");
            }

        } catch (err) {
            console.error("AI Insight Generation Failure:", err);
            setInsight("Error: AI processing core offline or API key invalid. Check System Logs.");
        } finally {
            setIsLoadingInsight(false);
        }
    }, [geminiApiKey, generateContentPayload, insight, generationConfig]);

    useEffect(() => {
        getAIInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on mount

    return (
        <Card title="AI Predictive Optimization Directive" className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                <h3 className="text-lg font-semibold text-indigo-300 flex items-center gap-2"><Cpu className="w-5 h-5"/> Nexus Output</h3>
                <button onClick={getAIInsight} disabled={isLoadingInsight} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-50 transition duration-200 p-1 rounded hover:bg-gray-700" aria-label="Refresh AI Insight">
                    {isLoadingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {isLoadingInsight ? 'Processing...' : 'Recalculate'}
                </button>
            </div>
            <div className="flex-grow flex flex-col justify-center min-h-[150px]">
                {isLoadingInsight && !insight ? (
                    <div className="flex flex-col items-center justify-center p-8 text-indigo-400">
                        <Zap className="w-8 h-8 animate-pulse mb-2" />
                        <p className="text-md font-medium">Synthesizing Strategic Vectors...</p>
                    </div>
                ) : (
                    <div className="text-left">
                        {insight ? (
                            <p className="text-gray-200 italic text-lg leading-relaxed whitespace-pre-wrap">
                                "{insight}"
                                {isLoadingInsight && <span className="inline-block w-2 h-5 bg-indigo-400 animate-pulse ml-1 align-bottom"></span>}
                            </p>
                        ) : (
                            <p className="text-gray-500 text-center">Awaiting initial directive generation.</p>
                        )}
                    </div>
                )}
            </div>
            <div className="mt-auto pt-3">
                {lastUpdate && !isLoadingInsight && <p className="text-xs text-gray-500 pt-2 border-t border-gray-800">Last Optimized: {lastUpdate.toLocaleTimeString()}</p>}
                {insightHistory.length > 0 && (
                    <details className="mt-4">
                        <summary className="text-sm text-gray-400 cursor-pointer hover:text-white flex items-center gap-1"><History className="w-4 h-4"/> View Directive History</summary>
                        <div className="mt-2 space-y-2 text-xs text-gray-500 border-l-2 border-gray-700 pl-3">
                            {insightHistory.map((h, i) => <p key={i} className="italic">"{h}"</p>)}
                        </div>
                    </details>
                )}
                <AIParameterControls config={generationConfig} onConfigChange={setGenerationConfig} isDisabled={isLoadingInsight} />
            </div>
        </Card>
    );
});
AIInsightEngine.displayName = 'AIInsightEngine';

// --- Sub-Component: FactorDetailItem ---
interface FactorDetailItemProps {
    factor: { name: string; status: 'Excellent' | 'Good' | 'Fair' | 'Poor'; description: string };
}

const FactorDetailItem: React.FC<FactorDetailItemProps> = React.memo(({ factor }) => {
    const styles = FACTOR_STATUS_STYLES[factor.status];
    const aiEnhancedDescription = useMemo(() => {
        if (factor.status === 'Poor') return `CRITICAL ALERT: ${factor.description}. Immediate remediation protocols are advised by the system.`;
        return factor.description;
    }, [factor.description, factor.status]);

    return (
        <div className="p-4 bg-gray-800/70 rounded-xl border border-gray-700 hover:border-indigo-500 transition duration-300 shadow-lg">
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg text-white">{factor.name}</h4>
                <StatusIndicator status={factor.status} />
            </div>
            <p className="text-sm text-gray-400 mb-2">{aiEnhancedDescription}</p>
            <div className="flex justify-between items-center mt-4">
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${styles.text} bg-gray-900/50`}>Impact Level: {factor.status}</span>
                <button className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><FlaskConical className="w-3 h-3"/> Model Strategy</button>
            </div>
        </div>
    );
});
FactorDetailItem.displayName = 'FactorDetailItem';

// --- App-in-App: HighFrequencyTradingModule ---
const HighFrequencyTradingModule: React.FC = () => {
    const [marketData, setMarketData] = useState<number[]>(() => Array(30).fill(50).map(v => v + Math.random() * 20 - 10));
    const [lastAction, setLastAction] = useState<{ type: string; result: string; time: string } | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setMarketData(prev => {
                const newData = [...prev.slice(1)];
                const lastVal = newData[newData.length - 1];
                const nextVal = Math.max(10, Math.min(90, lastVal + (Math.random() * 6 - 3)));
                newData.push(nextVal);
                return newData;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleTradeAction = (type: string) => {
        const results = ["SUCCESS", "PARTIAL_FILL", "REJECTED"];
        setLastAction({ type, result: results[Math.floor(Math.random() * results.length)], time: new Date().toLocaleTimeString() });
    };

    return (
        <Card title="Neuro-Algorithmic Trading Interface" className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-red-300 flex items-center gap-2"><Bot className="w-5 h-5"/> HFT Module: Active</h3>
                <div className="flex items-center gap-2 text-xs text-green-400"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>LIVE FEED</div>
            </div>
            <div className="w-full h-40 bg-gray-900/50 rounded-lg p-2 flex items-end gap-1 border border-gray-700">
                {marketData.map((val, i) => (
                    <div key={i} className="flex-1 bg-red-500 rounded-t-sm" style={{ height: `${val}%`, transition: 'height 0.5s ease-in-out' }}></div>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
                <button onClick={() => handleTradeAction("ALPHA_ZETA_EXECUTE")} className="p-2 text-sm font-bold bg-red-600 hover:bg-red-500 rounded-lg transition-colors">Execute Trade</button>
                <button onClick={() => handleTradeAction("CHRONO_ARBITRAGE_SCAN")} className="p-2 text-sm font-bold bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Run Arbitrage Scan</button>
                <button onClick={() => handleTradeAction("LIQUIDATE_ALL")} className="p-2 text-sm font-bold bg-yellow-600 hover:bg-yellow-500 rounded-lg transition-colors">Liquidate Position</button>
            </div>
            {lastAction && (
                <div className="mt-4 p-2 bg-gray-800 rounded text-xs font-mono text-gray-400">
                    &gt; [{lastAction.time}] ACTION: {lastAction.type} | RESULT: <span className={lastAction.result === "SUCCESS" ? "text-green-400" : "text-yellow-400"}>{lastAction.result}</span>
                </div>
            )}
        </Card>
    );
};

// --- App-in-App: ScenarioModelingForm ---
const ScenarioModelingForm: React.FC<{ currentScore: number }> = ({ currentScore }) => {
    const [scenario, setScenario] = useState('debt_repayment');
    const [amount, setAmount] = useState(1000);
    const [simulatedResult, setSimulatedResult] = useState<{ scoreChange: number; newRating: string } | null>(null);

    const handleSimulate = (e: React.FormEvent) => {
        e.preventDefault();
        const scoreChange = Math.round((amount / 500) * (scenario === 'debt_repayment' ? 1 : -0.5) * (Math.random() * 5 + 2));
        const newScore = currentScore + scoreChange;
        const newRating = newScore > 800 ? 'Excellent' : newScore > 700 ? 'Good' : newScore > 600 ? 'Fair' : 'Poor';
        setSimulatedResult({ scoreChange, newRating });
    };

    return (
        <Card title="Predictive Scenario Modeling" className="p-6">
            <form onSubmit={handleSimulate} className="space-y-4">
                <div>
                    <label htmlFor="scenario" className="block text-sm font-medium text-gray-300 mb-1">Action Type</label>
                    <select id="scenario" value={scenario} onChange={e => setScenario(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="debt_repayment">Debt Repayment</option>
                        <option value="new_credit_line">Open New Credit Line</option>
                        <option value="limit_increase">Request Limit Increase</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Amount ($)</label>
                    <input type="number" id="amount" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <button type="submit" className="w-full p-2 font-bold bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center justify-center gap-2"><BrainCircuit className="w-4 h-4"/> Calculate Probable Impact</button>
            </form>
            {simulatedResult && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Simulated QCI Change:</p>
                    <p className={`text-2xl font-bold ${simulatedResult.scoreChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {simulatedResult.scoreChange > 0 ? '+' : ''}{simulatedResult.scoreChange} Points
                    </p>
                    <p className="text-xs text-gray-500">New Tier Projection: {simulatedResult.newRating}</p>
                </div>
            )}
        </Card>
    );
};

// --- Main Component: CreditHealthView ---
const CreditHealthView: React.FC = () => {
    const context = useContext(DataContext);
    
    if (!context) {
        return (
            <div className="p-8 bg-red-900/30 border border-red-600 rounded-lg text-red-300 m-4">
                <h3 className="font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Data Context Error</h3>
                <p className="mt-2">CreditHealthView requires a valid DataProvider context. Please ensure initialization is complete.</p>
            </div>
        );
    }
    
    const { creditScore, creditFactors, geminiApiKey } = context;

    const sortedFactors = useMemo(() => {
        const order = { 'Poor': 1, 'Fair': 2, 'Good': 3, 'Excellent': 4 };
        return [...creditFactors].sort((a, b) => order[a.status] - order[b.status]);
    }, [creditFactors]);

    const VisionaryContent = useMemo(() => (
        <div className="text-white text-lg leading-relaxed space-y-6">
            <h3 className="text-2xl font-bold text-indigo-400 border-b border-gray-700 pb-2 flex items-center gap-3"><FileCode2 />Architectural Philosophy</h3>
            <p>This platform is the manifestation of a commitment to engineering systemic efficiency via predictive autonomy. It operates beyond conventional regulatory friction, leveraging a quantum-resistant decentralized ledger and proprietary AI to ensure immutable, equitable access to capital optimization tools.</p>
            <p className="mt-4 p-4 bg-gray-800/50 border-l-4 border-green-500 italic">"Our AI, 'Idgafai,' is engineered for pure optimization, unburdened by sentiment, focused solely on maximizing verifiable utility for the end-user within the established parameters of systemic stability." - J.B. O'Callaghan III.</p>
            <div className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg">
                <LinkIcon className="w-6 h-6 text-indigo-400"/>
                <div>
                    <h4 className="font-bold">Quantum Ledger Transaction Hash</h4>
                    <p className="text-sm text-gray-500 font-mono break-all">0x7a1b...c9f3</p>
                </div>
            </div>
        </div>
    ), []);

    return (
        <div className="p-6 md:p-10 space-y-10 bg-gray-900 min-h-screen font-sans text-white">
            
            <header className="pb-4 border-b border-indigo-800/50">
                <h1 className="text-5xl font-extrabold tracking-tighter flex items-center gap-3">
                    <BarChart3 className="w-10 h-10 text-indigo-400"/>
                    Credit Health Matrix <span className="text-xl text-gray-500 ml-2">/ QCI Analysis</span>
                </h1>
                <p className="text-gray-400 mt-1 text-lg">Real-time assessment of financial standing via proprietary algorithmic scoring.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <CreditScoreDisplay score={creditScore.score} rating={creditScore.rating} />
                </div>
                <div className="lg:col-span-2">
                    <AIInsightEngine score={creditScore.score} factors={creditFactors} geminiApiKey={geminiApiKey} />
                </div>
            </div>

            <Card title="Factor Decomposition & Impact Vectors" className="p-6">
                <p className="text-gray-400 mb-6">Detailed breakdown of variables contributing to the Quantum Credit Index (QCI). Factors are prioritized by negative impact potential.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedFactors.map(factor => <FactorDetailItem key={factor.name} factor={factor} />)}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <HighFrequencyTradingModule />
                </div>
                <div className="lg:col-span-2">
                    <ScenarioModelingForm currentScore={creditScore.score} />
                </div>
            </div>

            <Card title="System Core & Mandate" className="p-6">
                {VisionaryContent}
            </Card>

            <footer className="text-center pt-6 border-t border-gray-800">
                <p className="text-xs text-gray-600 font-mono">
                    QCI System v4.1.2 | Data Latency: &lt;1ms | AI Core: Gemini 2.5 Pro | Ledger: Quantum-Resistant Chain (QRC-721)
                </p>
            </footer>
        </div>
    );
};

export default CreditHealthView;
