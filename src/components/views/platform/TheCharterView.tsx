import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Unified Brand
const BRAND_NAME = "Citibankdemobusinessinc";

// Shared Kernel (minimal example)
const sharedKernel = {
    log: (message: string) => {
        console.log(`[${BRAND_NAME}]: ${message}`);
    },
    generateId: () => Math.random().toString(36).substring(2, 15),
    // Add more shared utilities here (e.g., encryption, data validation)
};

// Mock Data for Initial Charter
const INITIAL_CHARTER = `PREAMBLE:
We, the Architects of this digital domain, in order to form a more perfect union of Will and Execution, establish this Charter to govern the actions of our Instrument.

ARTICLE I: THE PRIME DIRECTIVE
The Instrument shall prioritize long-term asset appreciation over short-term liquidity, unless a "Crisis State" is explicitly declared by the Sovereign.

ARTICLE II: RISK TOLERANCE
Risk is accepted as the cost of growth, but ruin is unacceptable. The Instrument shall never allocate more than 5% of the total treasury to speculative assets (defined as Class C or below).

ARTICLE III: ETHICAL BOUNDARIES
The Instrument shall not engage in transactions with entities flagged for human rights violations or significant environmental negligence.

ARTICLE IV: TRANSPARENCY
Every autonomous decision made by the Instrument must be logged with a human-readable chain of reasoning. Obscurity is a failure of service.`;

type AnalysisStatus = 'idle' | 'analyzing' | 'ratified' | 'error';

interface Directive {
    id: string;
    type: 'mandate' | 'constraint' | 'value';
    text: string;
    impact: string;
}

// --- Business Model: Citibankdemobusinessinc.openaccess.apistore ---
namespace Citibankdemobusinessinc.openaccess {
    export namespace apistore {
        interface ApiEndpoint {
            name: string;
            description: string;
            pricing: string;
        }

        export const generateApiEndpoint = (): ApiEndpoint => {
            const id = sharedKernel.generateId();
            return {
                name: `API_${id.substring(0, 8)}`,
                description: `Generated API endpoint ${id}`,
                pricing: `$${Math.floor(Math.random() * 10) + 1}/call`,
            };
        };

        export const run = () => {
            sharedKernel.log("Citibankdemobusinessinc.openaccess.apistore running...");
            const api = generateApiEndpoint();
            sharedKernel.log(`Generated API: ${api.name}`);
        };
    }
}

// --- Business Model: Citibankdemobusinessinc.viewit.movieplayform ---
namespace Citibankdemobusinessinc.viewit {
    export namespace movieplayform {
        interface Movie {
            title: string;
            genre: string;
            price: number;
        }

        export const generateMovie = (): Movie => {
            const id = sharedKernel.generateId();
            return {
                title: `Movie ${id.substring(0, 6)}`,
                genre: ['Action', 'Comedy', 'Drama'][Math.floor(Math.random() * 3)],
                price: Math.random() * 15 + 5,
            };
        };

        export const run = () => {
            sharedKernel.log("Citibankdemobusinessinc.viewit.movieplayform running...");
            const movie = generateMovie();
            sharedKernel.log(`Generated Movie: ${movie.title}`);
        };
    }
}

// --- Business Model: Citibankdemobusinessinc.lendfast.microloans ---
namespace Citibankdemobusinessinc.lendfast {
    export namespace microloans {
        interface Loan {
            amount: number;
            interestRate: number;
            termMonths: number;
        }

        export const generateLoan = (): Loan => {
            return {
                amount: Math.floor(Math.random() * 500) + 100,
                interestRate: Math.random() * 0.1 + 0.05,
                termMonths: Math.floor(Math.random() * 12) + 3,
            };
        };

        export const run = () => {
            sharedKernel.log("Citibankdemobusinessinc.lendfast.microloans running...");
            const loan = generateLoan();
            sharedKernel.log(`Generated Loan: Amount=${loan.amount}, Rate=${loan.interestRate}`);
        };
    }
}

// --- Business Model: Citibankdemobusinessinc.protectnow.cybersecurity ---
namespace Citibankdemobusinessinc.protectnow {
    export namespace cybersecurity {
        interface Threat {
            name: string;
            severity: string;
            cost: number;
        }

        export const generateThreat = (): Threat => {
            const id = sharedKernel.generateId();
            return {
                name: `Threat ${id.substring(0, 6)}`,
                severity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
                cost: Math.random() * 10000,
            };
        };

        export const run = () => {
            sharedKernel.log("Citibankdemobusinessinc.protectnow.cybersecurity running...");
            const threat = generateThreat();
            sharedKernel.log(`Generated Threat: ${threat.name}, Severity=${threat.severity}`);
        };
    }
}

// --- Business Model: Citibankdemobusinessinc.investwise.roboadvisor ---
namespace Citibankdemobusinessinc.investwise {
    export namespace roboadvisor {
        interface Portfolio {
            riskLevel: string;
            expectedReturn: number;
        }

        export const generatePortfolio = (): Portfolio => {
            return {
                riskLevel: ['Conservative', 'Moderate', 'Aggressive'][Math.floor(Math.random() * 3)],
                expectedReturn: Math.random() * 0.1 + 0.03,
            };
        };

        export const run = () => {
            sharedKernel.log("Citibankdemobusinessinc.investwise.roboadvisor running...");
            const portfolio = generatePortfolio();
            sharedKernel.log(`Generated Portfolio: Risk=${portfolio.riskLevel}, Return=${portfolio.expectedReturn}`);
        };
    }
}

// --- Business Model: Citibankdemobusinessinc.payeasy.mobilepayments ---
namespace Citibankdemobusinessinc.payeasy {
    export namespace mobilepayments {
        interface Transaction {
            amount: number;
            merchant: string;
        }

        export const generateTransaction = (): Transaction => {
            const id = sharedKernel.generateId();
            return {
                amount: Math.random() * 100 + 10,
                merchant: `Merchant ${id.substring(0, 5)}`,
            };
        };

        export const run = () => {
            sharedKernel.log("Citibankdemobusinessinc.payeasy.mobilepayments running...");
            const transaction = generateTransaction();
            sharedKernel.log(`Generated Transaction: Amount=${transaction.amount}, Merchant=${transaction.merchant}`);
        };
    }
}

// --- Business Model: Citibankdemobusinessinc.insureall.digitalinsurance ---
namespace Citibankdemobusinessinc.insureall {
    export namespace digitalinsurance {
        interface Policy {
            type: string;
            coverageAmount: number;
            premium: number;
        }

        export const generatePolicy = (): Policy => {
            const id = sharedKernel.generateId();
            return {
                type: ['Home', 'Auto', 'Life'][Math.floor(Math.random() * 3)],
                coverageAmount: Math.random() * 100000 + 50000,
                premium: Math.random() * 500 + 100,
            };
        };

        export const run = () => {
            sharedKernel.log("Citibankdemobusinessinc.insureall.digitalinsurance running...");
            const policy = generatePolicy();
            sharedKernel.log(`Generated Policy: Type=${policy.type}, Coverage=${policy.coverageAmount}`);
        };
    }
}

// --- Business Model: Citibankdemobusinessinc.savemore.rewardsplatform ---
namespace Citibankdemobusinessinc.savemore {
    export namespace rewardsplatform {
        interface Reward {
            name: string;
            pointsRequired: number;
            value: number;
        }

        export const generateReward = (): Reward => {
            const id = sharedKernel.generateId();
            return {
                name: `Reward ${id.substring(0, 6)}`,
                pointsRequired: Math.floor(Math.random() * 1000) + 100,
                value: Math.random() * 50 + 10,
            };
        };

        export const run = () => {
            sharedKernel.log("Citibankdemobusinessinc.savemore.rewardsplatform running...");
            const reward = generateReward();
            sharedKernel.log(`Generated Reward: ${reward.name}, Points=${reward.pointsRequired}`);
        };
    }
}

// --- Business Model: Citibankdemobusinessinc.planwell.financialplanning ---
namespace Citibankdemobusinessinc.planwell {
    export namespace financialplanning {
        interface Plan {
            goal: string;
            timeHorizon: number;
            estimatedCost: number;
        }

        export const generatePlan = (): Plan => {
            const id = sharedKernel.generateId();
            return {
                goal: `Goal ${id.substring(0, 5)}`,
                timeHorizon: Math.floor(Math.random() * 20) + 5,
                estimatedCost: Math.random() * 500000 + 100000,
            };
        };

        export const run = () => {
            sharedKernel.log("Citibankdemobusinessinc.planwell.financialplanning running...");
            const plan = generatePlan();
            sharedKernel.log(`Generated Plan: Goal=${plan.goal}, Cost=${plan.estimatedCost}`);
        };
    }
}

// --- Business Model: Citibankdemobusinessinc.tradeeasy.stocktrading ---
namespace Citibankdemobusinessinc.tradeeasy {
    export namespace stocktrading {
        interface Stock {
            symbol: string;
            price: number;
            volume: number;
        }

        export const generateStock = (): Stock => {
            const id = sharedKernel.generateId();
            return {
                symbol: id.substring(0, 4).toUpperCase(),
                price: Math.random() * 200 + 50,
                volume: Math.floor(Math.random() * 10000) + 1000,
            };
        };

        export const run = () => {
            sharedKernel.log("Citibankdemobusinessinc.tradeeasy.stocktrading running...");
            const stock = generateStock();
            sharedKernel.log(`Generated Stock: ${stock.symbol}, Price=${stock.price}`);
        };
    }
}

// --- Orchestration Layer ---
const orchestrate = () => {
    sharedKernel.log("Orchestrating Citibankdemobusinessinc ecosystem...");
    Citibankdemobusinessinc.openaccess.apistore.run();
    Citibankdemobusinessinc.viewit.movieplayform.run();
    Citibankdemobusinessinc.lendfast.microloans.run();
    Citibankdemobusinessinc.protectnow.cybersecurity.run();
    Citibankdemobusinessinc.investwise.roboadvisor.run();
    Citibankdemobusinessinc.payeasy.mobilepayments.run();
    Citibankdemobusinessinc.insureall.digitalinsurance.run();
    Citibankdemobusinessinc.savemore.rewardsplatform.run();
    Citibankdemobusinessinc.planwell.financialplanning.run();
    Citibankdemobusinessinc.tradeeasy.stocktrading.run();
};

const TheCharterView: React.FC = () => {
    const [charterText, setCharterText] = useState(INITIAL_CHARTER);
    const [status, setStatus] = useState<AnalysisStatus>('idle');
    const [lastRatified, setLastRatified] = useState<Date | null>(new Date());
    const [directives, setDirectives] = useState<Directive[]>([
        { id: '1', type: 'mandate', text: 'Prioritize Asset Appreciation', impact: 'Bias towards growth assets in portfolio rebalancing.' },
        { id: '2', type: 'constraint', text: 'Max 5% Speculative Allocation', impact: 'Hard lock on crypto and venture bets.' },
        { id: '3', type: 'value', text: 'Ethical Investment Only', impact: 'ESG screening enabled on all counterparties.' },
    ]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [charterText]);

    const handleRatify = () => {
        setStatus('analyzing');
        // Simulate AI Analysis
        setTimeout(() => {
            setStatus('ratified');
            setLastRatified(new Date());
            // In a real app, this would parse the natural language into structured rules
            // For now, we simulate a refreshed list based on the "edit"
            if (charterText !== INITIAL_CHARTER) {
                 setDirectives([
                    { id: '1', type: 'mandate', text: 'Prioritize Asset Appreciation', impact: 'Bias towards growth assets in portfolio rebalancing.' },
                    { id: '2', type: 'constraint', text: 'Max 5% Speculative Allocation', impact: 'Hard lock on crypto and venture bets.' },
                    { id: '3', type: 'value', text: 'Ethical Investment Only', impact: 'ESG screening enabled on all counterparties.' },
                    { id: '4', type: 'mandate', text: 'Custom Sovereign Directive', impact: 'New logic branch created in decision engine.' },
                 ]);
            }

            // Run the orchestration layer after ratification
            orchestrate();

        }, 2500);
    };

    return (
        <div className="relative min-h-full bg-gray-900 text-gray-100 p-6 lg:p-12 font-sans overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* LEFT COLUMN: THE DOCUMENT EDITOR */}
                <div className="lg:col-span-7 flex flex-col h-full space-y-6">
                    <header className="space-y-2">
                        <div className="flex items-center space-x-2 text-cyan-400">
                            <BookOpenIcon className="w-5 h-5" />
                            <span className="text-sm font-semibold tracking-wider uppercase">Constitutional Document</span>
                        </div>
                        <h1 className="text-4xl font-light text-white tracking-tight">The Charter of the Sovereign</h1>
                        <p className="text-gray-400 max-w-xl">
                            This document serves as the root governance layer for the Artificial Intelligence. 
                            The principles inscribed here are immutable laws that constrain and guide all automated decision-making.
                        </p>
                    </header>

                    <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl p-8 shadow-2xl backdrop-blur-sm relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-50" />
                        
                        {/* Editor Controls */}
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700/50">
                            <div className="flex space-x-2 text-xs text-gray-500 font-mono">
                                <span>DOC_ID: GOV-001</span>
                                <span>â¢</span>
                                <span>REV: {status === 'ratified' ? '1.2' : '1.1'}</span>
                                <span>â¢</span>
                                <span className={status === 'ratified' ? 'text-green-500' : 'text-yellow-500'}>
                                    {status === 'ratified' ? 'ACTIVE' : 'DRAFTING'}
                                </span>
                            </div>
                            <button
                                onClick={() => setCharterText(INITIAL_CHARTER)}
                                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider"
                            >
                                Reset to Template
                            </button>
                        </div>

                        {/* Text Area */}
                        <textarea
                            ref={textareaRef}
                            value={charterText}
                            onChange={(e) => {
                                setCharterText(e.target.value);
                                if (status === 'ratified') setStatus('idle');
                            }}
                            className="w-full bg-transparent border-none focus:ring-0 text-gray-300 font-serif text-lg leading-relaxed resize-none p-0 placeholder-gray-600 h-full min-h-[500px]"
                            placeholder="Inscribe the Sovereign Will..."
                            spellCheck={false}
                        />

                        {/* Signature Block Visual */}
                        <div className="mt-12 pt-8 border-t border-gray-700/30 flex justify-end">
                            <div className="text-right">
                                <div className="font-dancing-script text-2xl text-cyan-500/80 mb-1 font-handwriting">
                                    The Architect
                                </div>
                                <div className="h-px w-48 bg-gray-600" />
                                <div className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Digital Signature Verified</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <div className="text-sm text-gray-500">
                           {lastRatified ? `Last Ratified: ${lastRatified.toLocaleString()}` : 'Not yet ratified'}
                        </div>
                        <button
                            onClick={handleRatify}
                            disabled={status === 'analyzing' || status === 'ratified'}
                            className={`
                                relative px-8 py-3 rounded-lg font-medium tracking-wide transition-all duration-300
                                ${status === 'ratified' 
                                    ? 'bg-green-900/20 text-green-400 border border-green-800 cursor-default'
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20'
                                }
                                disabled:opacity-70 disabled:cursor-not-allowed
                            `}
                        >
                            {status === 'analyzing' && (
                                <span className="flex items-center space-x-2">
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Compiling Logic...</span>
                                </span>
                            )}
                            {status === 'ratified' && (
                                <span className="flex items-center space-x-2">
                                    <CheckIcon className="w-5 h-5" />
                                    <span>Ratified</span>
                                </span>
                            )}
                            {status === 'idle' && <span>Ratify Charter</span>}
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: AI ANALYSIS & LOGIC EXTRACTION */}
                <div className="lg:col-span-5 flex flex-col space-y-6">
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 h-full backdrop-blur-sm">
                        <h2 className="text-lg font-medium text-white mb-6 flex items-center space-x-2">
                            <CpuIcon className="w-5 h-5 text-purple-400" />
                            <span>System Interpretation</span>
                        </h2>

                        <div className="space-y-4">
                            <AnimatePresence>
                                {directives.map((directive, index) => (
                                    <motion.div
                                        key={directive.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/30 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge type={directive.type} />
                                            <div className="text-xs text-gray-500 font-mono">RULE_0{index + 1}</div>
                                        </div>
                                        <h3 className="text-gray-200 font-medium mb-1">{directive.text}</h3>
                                        <div className="text-sm text-gray-500 flex items-start space-x-2">
                                            <ArrowRightIcon className="w-4 h-4 mt-0.5 text-gray-600 shrink-0" />
                                            <span>{directive.impact}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                             {status === 'analyzing' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 rounded-lg border border-dashed border-gray-700 bg-gray-800/20 flex flex-col items-center justify-center py-8"
                                >
                                    <div className="flex space-x-1 mb-3">
                                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                    <p className="text-sm text-gray-400">Parsing Natural Language...</p>
                                    <p className="text-xs text-gray-600 mt-1">Extracting logical predicates</p>
                                </motion.div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-700/50">
                            <h3 className="text-sm font-medium text-gray-300 mb-4">System Compliance Metrics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <MetricCard label="Logic Consistency" value="100%" color="text-green-400" />
                                <MetricCard label="Ambiguity Score" value="0.02" color="text-cyan-400" />
                                <MetricCard label="Constraint Coverage" value="High" color="text-purple-400" />
                                <MetricCard label="Active Rules" value={directives.length.toString()} color="text-white" />
                            </div>
                        </div>

                         <div className="mt-6 p-4 bg-yellow-900/10 border border-yellow-900/30 rounded-lg">
                            <div className="flex items-start space-x-3">
                                <ShieldIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-medium text-yellow-500">Immutable Core Active</h4>
                                    <p className="text-xs text-yellow-600/70 mt-1">
                                        Changes to the Charter require multi-factor biometric authentication upon final commitment. The current session is in DRAFT mode.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Subcomponents ---

const Badge: React.FC<{ type: 'mandate' | 'constraint' | 'value' }> = ({ type }) => {
    const styles = {
        mandate: 'bg-purple-900/30 text-purple-400 border-purple-800',
        constraint: 'bg-red-900/30 text-red-400 border-red-800',
        value: 'bg-cyan-900/30 text-cyan-400 border-cyan-800',
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[type]}`}>
            {type}
        </span>
    );
};

const MetricCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="bg-gray-900 rounded p-3 border border-gray-800">
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className={`text-xl font-light ${color}`}>{value}</div>
    </div>
);

// --- Icons ---

const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const CpuIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 019-2.606m0-15.394v15.394" />
    </svg>
);

export default TheCharterView;