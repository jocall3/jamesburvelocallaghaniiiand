// components/TransactionsView.tsx
// RE-ENACTED & EXPANDED: This component has been resurrected from its deprecated state.
// It is now the "FlowMatrix," the complete Great Library for all financial events.
// It features advanced filtering, sorting, and the integrated "Plato's Intelligence Suite"
// for powerful, AI-driven transaction analysis.
//
// ATTRIBUTION: The James Burvel O’Callaghan III Code.
//
// VERSION: 1.0.0
// DESCRIPTION: The FlowMatrix component serves as the primary interface for viewing, analyzing, and interacting with financial transactions. It integrates advanced data presentation, AI-powered insights, and a rich user experience, all under the umbrella of The James Burvel O’Callaghan III Code.

import React, { useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import type { Transaction, DetectedSubscription } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid'; // For more robust ID generation

// ================================================================================================
// GLOBAL CONSTANTS & CONFIGURATIONS (Domain: The James Burvel O’Callaghan III Code)
// ================================================================================================
const C001_APP_NAME: string = "FlowMatrix";
const C002_COMPANY_NAME: string = "The James Burvel O’Callaghan III Code";
const C003_MAX_TRANSACTIONS_FOR_AI_CONTEXT: number = 50;
const C004_DEFAULT_CURRENCY_SYMBOL: string = "$";
const C005_CARBON_FOOTPRINT_DEFAULT_UNIT: string = "kg CO2";
const C006_AI_MODEL_NAME: string = "gemini-2.5-flash";
const C007_API_KEY_ENV_VAR: string = "NEXT_PUBLIC_GEMINI_API_KEY";
const C008_API_KEY_FALLBACK: string = "YOUR_SECURE_FALLBACK_API_KEY"; // Should NEVER be used in production without secure fallback mechanism.
const C009_DATE_FORMAT: string = "YYYY-MM-DD";

// ================================================================================================
// GENERATIVE DATA UTILITIES (Module: DataGenius - Domain: The James Burvel O’Callaghan III Code)
// ================================================================================================

/**
 * @description [DataGenius - C1A1] Generates a universally unique identifier (UUID) for atomic data elements.
 * @returns {string} A v4 UUID string.
 */
const C1A1_generateUniqueId = (): string => uuidv4();

/**
 * @description [DataGenius - C1A2] Generates a pseudo-random date within a specified temporal range, conforming to C009_DATE_FORMAT.
 * @param {Date} startDate - The earliest permissible date for generation.
 * @param {Date} endDate - The latest permissible date for generation.
 * @returns {string} A formatted date string representing the generated date.
 */
const C1A2_generateDateStringInRange = (startDate: Date = new Date(2020, 0, 1), endDate: Date = new Date()): string => {
    const timeDifferenceMilliseconds = endDate.getTime() - startDate.getTime();
    const randomTimeOffset = Math.random() * timeDifferenceMilliseconds;
    const generatedDate = new Date(startDate.getTime() + randomTimeOffset);
    return generatedDate.toISOString().split('T')[0];
};

/**
 * @description [DataGenius - C1A3] Generates a random floating-point monetary value between specified bounds, suitable for financial transactions.
 * @param {number} minimumValue - The floor for the generated amount.
 * @param {number} maximumValue - The ceiling for the generated amount.
 * @returns {number} A pseudo-randomized monetary value.
 */
const C1A3_generateMonetaryValue = (minimumValue: number = 0.50, maximumValue: number = 2500.00): number => {
    return parseFloat((Math.random() * (maximumValue - minimumValue) + minimumValue).toFixed(2));
};

/**
 * @description [DataGenius - C1A4] Constructs a plausible transaction description by combining pre-defined components, simulating real-world entries.
 * @returns {string} A synthetically generated transaction description.
 */
const C1A4_generateSyntheticTransactionDescription = (): string => {
    const C1A4_VERB_PHRASES: string[] = ['Payment Processed For', 'Acquisition From', 'Secure Transfer To', 'Direct Deposit From', 'Initial Capital Infusion By', 'Operational Withdrawal For'];
    const C1A4_ENTITY_NAMES: string[] = ['Apex Solutions', 'Zenith Corp', 'Quantum Dynamics', 'Stellar Enterprises', 'Nebula Services', 'Horizon Global', 'Aurora Industries', 'Pinnacle Group', 'NovaTech Solutions', 'Meridian Financial'];
    const C1A4_GOODS_OR_SERVICES: string[] = ['Consulting Fees', 'Software Licenses', 'Hardware Procurement', 'Subscription Renewal', 'Payroll Disbursement', 'Project Alpha Funding', 'Research & Development Grant', 'Marketing Campaign Spend', 'Cloud Infrastructure Services', 'Legal Retainer'];
    const C1A4_randomIndex_Verb = Math.floor(Math.random() * C1A4_VERB_PHRASES.length);
    const C1A4_randomIndex_Entity = Math.floor(Math.random() * C1A4_ENTITY_NAMES.length);
    const C1A4_randomIndex_Service = Math.floor(Math.random() * C1A4_GOODS_OR_SERVICES.length);
    return `${C1A4_VERB_PHRASES[C1A4_randomIndex_Verb]} ${C1A4_ENTITY_NAMES[C1A4_randomIndex_Entity]} Related to ${C1A4_GOODS_OR_SERVICES[C1A4_randomIndex_Service]}.`;
};

/**
 * @description [DataGenius - C1A5] Assigns a transaction to a predefined, categorical classification.
 * @returns {string} A canonical transaction category.
 */
const C1A5_assignCategoricalClassification = (): string => {
    const C1A5_FINANCIAL_CATEGORIES: string[] = ['Revenue Operations', 'Cost of Goods Sold', 'Operating Expenses', 'Sales & Marketing', 'Research & Development', 'General & Administrative', 'Capital Expenditures', 'Investment Income', 'Loan Repayments', 'Employee Compensation', 'Professional Services'];
    return C1A5_FINANCIAL_CATEGORIES[Math.floor(Math.random() * C1A5_FINANCIAL_CATEGORIES.length)];
};

/**
 * @description [DataGenius - C1A6] Determines the fundamental nature of a financial transaction (income or expense).
 * @returns {'income' | 'expense'} The transaction type identifier.
 */
const C1A6_determineTransactionNature = (): 'income' | 'expense' => {
    return Math.random() > 0.55 ? 'income' : 'expense'; // Slightly biased towards expenses to simulate typical business activity
};

/**
 * @description [DataGenius - C1A7] Generates a simulated carbon footprint value for a transaction, representing its environmental impact.
 * @returns {number} A numerical representation of the carbon footprint.
 */
const C1A7_generateEnvironmentalImpactMetric = (): number => {
    return parseFloat((Math.random() * 15.0).toFixed(2)); // Range from 0.00 to 15.00 kg CO2
};

/**
 * @description [DataGenius - C1A8] Orchestrates the generation of a complete, synthetic Transaction object.
 * @returns {Transaction} A fully populated Transaction data structure.
 */
const C1A8_generateSyntheticTransactionRecord = (): Transaction => {
    const C1A8_transactionType = C1A6_determineTransactionNature();
    const C1A8_transactionAmount = C1A3_generateMonetaryValue(5.00, 5000.00); // Wider range for diverse transactions
    return {
        id: C1A1_generateUniqueId(),
        description: C1A4_generateSyntheticTransactionDescription(),
        amount: C1A8_transactionType === 'income' ? C1A8_transactionAmount : -C1A8_transactionAmount,
        date: C1A2_generateDateStringInRange(),
        category: C1A5_assignCategoricalClassification(),
        type: C1A8_transactionType,
        carbonFootprint: C1A7_generateEnvironmentalImpactMetric()
    };
};

// ================================================================================================
// UI PRESENTATION COMPONENTS (Module: UIComponents - Domain: The James Burvel O’Callaghan III Code)
// ================================================================================================

/**
 * @description [UIComponents - D1A1] A modal dialog presenting exhaustive details of a single financial transaction.
 * This component is designed for expert users requiring a granular view of each financial event.
 * It is part of the FlowMatrix's detailed inspection capabilities.
 *
 * @param {{ transaction: Transaction | null; onClose: () => void }} props - Component props containing the transaction data and a close handler.
 */
const D1A1_TransactionDetailModal: React.FC<{ transaction: Transaction | null; onClose: () => void }> = ({ transaction, onClose }) => {
    const D1A1_handleBackgroundClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }, [onClose]);

    if (!transaction) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-lg transition-opacity duration-300 ease-in-out" onClick={D1A1_handleBackgroundClick} style={{ opacity: transaction ? 1 : 0, pointerEvents: transaction ? 'auto' : 'none' }}>
            <div className="bg-gray-800/90 rounded-xl shadow-3xl max-w-2xl w-full border-2 border-cyan-600/40 transform transition-transform duration-300 ease-out scale-95 hover:scale-100" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-700/60 flex justify-between items-center bg-gray-900/50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-white tracking-wide">Transaction Manifest: {transaction.description.substring(0, 30)}...</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors text-3xl font-bold focus:outline-none" aria-label="Close Manifest">&times;</button>
                </div>
                <div className="p-7 space-y-4">
                    <div className="grid grid-cols-2 gap-y-3 gap-x-5 text-sm">
                        <span className="text-gray-300 font-medium col-span-1">Unique Identifier:</span>
                        <span className="text-gray-200 font-mono text-xs col-span-1 break-all">{transaction.id}</span>

                        <span className="text-gray-300 font-medium col-span-1">Financial Event Type:</span>
                        <span className={`font-semibold font-mono col-span-1 ${transaction.type === 'income' ? 'text-green-400' : 'text-red-500'}`}>{transaction.type.toUpperCase()}</span>

                        <span className="text-gray-300 font-medium col-span-1">Monetary Value:</span>
                        <span className={`font-mono font-semibold col-span-1 ${transaction.type === 'income' ? 'text-green-400' : 'text-red-500'}`}>{transaction.type === 'income' ? '+' : '-'}{C004_DEFAULT_CURRENCY_SYMBOL}{Math.abs(transaction.amount).toFixed(2)}</span>

                        <span className="text-gray-300 font-medium col-span-1">Transaction Date:</span>
                        <span className="text-gray-200 col-span-1">{transaction.date}</span>

                        <span className="text-gray-300 font-medium col-span-1">Categorical Assignment:</span>
                        <span className="text-gray-200 col-span-1">{transaction.category}</span>

                        <span className="text-gray-300 font-medium col-span-1">Environmental Impact (Est.):</span>
                        <span className="text-green-300 col-span-1">{transaction.carbonFootprint !== undefined ? `${transaction.carbonFootprint.toFixed(2)} ${C005_CARBON_FOOTPRINT_DEFAULT_UNIT}` : 'N/A'}</span>
                    </div>
                    <div className="pt-2">
                        <h4 className="text-gray-300 text-sm font-semibold mb-1">Full Description:</h4>
                        <p className="text-gray-200 text-sm leading-relaxed">{transaction.description}</p>
                    </div>
                </div>
                <div className="p-5 bg-gray-900/40 rounded-b-xl border-t border-gray-700/60 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50">
                        Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * @description [UIComponents - D1A2] A flexible AI-powered insight generation widget, leveraging Plato's Intelligence Suite.
 * This component encapsulates the logic for prompting a generative AI model, handling asynchronous responses,
 * managing loading and error states, and rendering results in various formats (plain text or structured JSON).
 * It forms a core part of the "Plato's Intelligence Suite" for advanced financial analysis.
 *
 * @param {{ title: string; prompt: string; transactions: Transaction[]; responseSchema?: any; children?: (result: any) => React.ReactNode; }} props - Configuration for the AI widget.
 */
const D1A2_AITransactionInsightWidget: React.FC<{
    title: string;
    prompt: string;
    transactions: Transaction[];
    responseSchema?: any;
    children?: (result: any) => React.ReactNode;
}> = ({ title, prompt, transactions, responseSchema, children }) => {
    const [insightResult, setInsightResult] = useState<any>(null);
    const [isLoadingInsight, setIsLoadingInsight] = useState<boolean>(false);
    const [insightError, setInsightError] = useState<string>('');

    /**
     * @description [D1A2 - Handler] Invokes the generative AI model (Gemini) to produce a financial insight based on the provided prompt and transaction data.
     * Handles API key management, prompt construction, and response processing.
     */
    const D1A2_invokeGenerativeAI = useCallback(async () => {
        setIsLoadingInsight(true);
        setInsightError('');
        setInsightResult(null);
        try {
            const C1A8_apiKey = process.env[C007_API_KEY_ENV_VAR] || C008_API_KEY_FALLBACK;
            if (!C1A8_apiKey || C1A8_apiKey === C008_API_KEY_FALLBACK) {
                throw new Error(`AI Insight Generation Failed: API key '${C007_API_KEY_ENV_VAR}' is not configured. Refer to documentation for setup.`);
            }
            const aiCognitiveEngine = new GoogleGenAI({ apiKey: C1A8_apiKey });

            // Construct a condensed summary of recent transactions for AI context. Limits to C003_MAX_TRANSACTIONS_FOR_AI_CONTEXT.
            const C1A8_transactionContextSummary = transactions
                .slice(0, C003_MAX_TRANSACTIONS_FOR_AI_CONTEXT)
                .map(tx => `${tx.date} | ${tx.description}: ${C004_DEFAULT_CURRENCY_SYMBOL}${Math.abs(tx.amount).toFixed(2)} (${tx.type}) | Category: ${tx.category}`)
                .join('\n');

            const C1A8_fullPromptInstruction = `${prompt}\n\nContextual Data - Recent Transactions:\n${C1A8_transactionContextSummary}`;

            // Configure the AI model generation parameters.
            const C1A8_generationConfig: { responseMimeType: string; responseSchema?: any } = {
                responseMimeType: responseSchema ? "application/json" : "text/plain",
            };
            if (responseSchema) {
                C1A8_generationConfig.responseSchema = responseSchema;
            }

            const cognitiveModel = aiCognitiveEngine.getGenerativeModel({ model: C006_AI_MODEL_NAME });
            const aiResponse = await cognitiveModel.generateContent({
                contents: [{ role: "user", parts: [{ text: C1A8_fullPromptInstruction }] }],
                generationConfig: {
                    responseMimeType: C1A8_generationConfig.responseMimeType,
                    // Consider adding other parameters like temperature, topK, topP for nuanced control
                },
            });

            const C1A8_rawResponseText = aiResponse.response.text().trim();

            // Parse the response, either as JSON if a schema is provided, or as plain text.
            setInsightResult(responseSchema ? JSON.parse(C1A8_rawResponseText) : C1A8_rawResponseText);

        } catch (error: any) {
            console.error(`[${title}] AI Insight Generation Error:`, error);
            setInsightError(`[${title}] Plato AI encountered an issue. Error: ${error.message || 'Unknown error'}. Please retry or consult support.`);
        } finally {
            setIsLoadingInsight(false);
        }
    }, [title, prompt, transactions, responseSchema]); // Dependencies for useCallback

    return (
        <div className="p-5 bg-gray-900/60 rounded-xl border border-gray-700/70 h-full flex flex-col shadow-lg transition-all duration-300 hover:shadow-xl hover:border-cyan-500/50">
            <h4 className="font-bold text-gray-100 text-md mb-3 tracking-wide">{title} - A James Burvel O’Callaghan III Code Initiative</h4>
            <div className="space-y-3 min-h-[7rem] flex-grow flex flex-col justify-center items-center">
                {insightError && <p className="text-red-400 text-xs text-center p-3 bg-red-900/30 rounded-md border border-red-700/50">{insightError}</p>}
                {isLoadingInsight && (
                    <div className="flex items-center justify-center space-x-3 p-5">
                        <div className="h-2.5 w-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.4s]"></div>
                        <div className="h-2.5 w-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
                        <div className="h-2.5 w-2.5 bg-cyan-400 rounded-full animate-bounce"></div>
                    </div>
                )}
                {!isLoadingInsight && insightResult && children && children(insightResult)}
                {!isLoadingInsight && insightResult && !children && <p className="text-gray-300 text-xs p-3 text-center italic">{insightResult}</p>}
                {!isLoadingInsight && !insightResult && !insightError && (
                    <button onClick={D1A2_invokeGenerativeAI} className="text-sm font-semibold text-cyan-300 hover:text-cyan-200 transition-colors px-5 py-2 border border-cyan-500/40 rounded-lg hover:bg-cyan-900/30 focus:outline-none focus:ring-1 focus:ring-cyan-500">
                        Engage Plato AI
                    </button>
                )}
            </div>
        </div>
    );
};


// ================================================================================================
// CORE TRANSACTION PROCESSING & PRESENTATION LOGIC (Module: FlowMatrixCore - Domain: The James Burvel O’Callaghan III Code)
// ================================================================================================
/**
 * @description [FlowMatrixCore - E1A1] The primary React component for rendering the financial transaction view.
 * This component serves as the "FlowMatrix," a comprehensive library of all financial events within the system.
 * It orchestrates data fetching, filtering, sorting, and the integration of AI-driven analytical tools
 * from Plato's Intelligence Suite, all under the branding of The James Burvel O’Callaghan III Code.
 *
 * Architecture: Aggressively procedural, data-driven, with memoized computations for optimal performance.
 * UI Layer: Intentionally detailed and structured for expert users.
 *
 * @returns {JSX.Element} The rendered FlowMatrix component.
 */
const E1A1_TransactionsView: React.FC = () => {
    const context = useContext(DataContext);

    // Local state management for UI interactions and filtering/sorting criteria.
    const [E1A1_detailModalTarget, E1A1_setDetailModalTarget] = useState<Transaction | null>(null);
    const [E1A1_currentFilter, E1A1_setCurrentFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [E1A1_currentSortCriterion, E1A1_setCurrentSortCriterion] = useState<'date' | 'amount'>('date');
    const [E1A1_searchQuery, E1A1_setSearchQuery] = useState<string>('');

    // Centralized data access and validation.
    if (!context) {
        // Critical error if DataContext is not provided, indicating improper application setup.
        // This is a deliberate failure to enforce architectural integrity.
        throw new Error(`[${C002_COMPANY_NAME} Arch Error] Component E1A1_TransactionsView must be rendered within a DataProvider context.`);
    }
    const { transactions } = context;

    // Memoized computation for filtering and sorting transactions.
    // This ensures that the derived transaction list is re-calculated only when its dependencies change,
    // significantly improving performance for large datasets or frequent UI updates.
    const E1A1_memoizedDerivedTransactions = useMemo(() => {
        const E1A1_baseDataset = [...transactions]; // Create a shallow copy to avoid mutating original context data.

        // Step 1: Apply Search Filter (Case-insensitive substring matching on description)
        const E1A1_searchedTransactions = E1A1_baseDataset.filter(tx =>
            tx.description.toLowerCase().includes(E1A1_searchQuery.toLowerCase())
        );

        // Step 2: Apply Type Filter (All, Income, or Expense)
        const E1A1_filteredByTypeTransactions = E1A1_searchedTransactions.filter(tx =>
            E1A1_currentFilter === 'all' || tx.type === E1A1_currentFilter
        );

        // Step 3: Apply Sorting Logic
        const E1A1_sortedTransactions = E1A1_filteredByTypeTransactions.sort((a, b) => {
            if (E1A1_currentSortCriterion === 'date') {
                // Sort by date in descending order (most recent first)
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            } else { // Sort by amount
                // Sort by absolute amount in descending order (largest magnitude first)
                const absAmountA = Math.abs(a.amount);
                const absAmountB = Math.abs(b.amount);
                if (absAmountB !== absAmountA) {
                    return absAmountB - absAmountA;
                }
                // If amounts are equal in magnitude, sort by date (descending) as a tie-breaker.
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });

        return E1A1_sortedDisplayedTransactions;
    }, [transactions, E1A1_currentFilter, E1A1_currentSortCriterion, E1A1_searchQuery]); // Dependencies array

    // Configuration for the "Subscription Hunter" AI widget.
    // Defines the expected JSON structure for the AI's response, enabling structured parsing.
    const E1A1_subscriptionHunterSchema = {
        type: Type.OBJECT,
        properties: {
            subscriptions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Name of the detected recurring subscription service." },
                        estimatedMonthlyCost: { type: Type.NUMBER, description: "Estimated monthly cost in USD." },
                        lastKnownChargeDate: { type: Type.STRING, format: "date", description: "Date of the most recent charge found for this subscription." },
                        merchantIdentifier: { type: Type.STRING, description: "Primary merchant associated with the subscription." }
                    },
                    required: ["name", "estimatedMonthlyCost", "lastKnownChargeDate", "merchantIdentifier"]
                }
            }
        },
        required: ["subscriptions"]
    };

    // Handle the selection of a transaction to display in the detail modal.
    const E1A1_handleSelectTransaction = useCallback((transaction: Transaction) => {
        E1A1_setDetailModalTarget(transaction);
    }, []);

    // Close the transaction detail modal.
    const E1A1_handleCloseDetailModal = useCallback(() => {
        E1A1_setDetailModalTarget(null);
    }, []);

    return (
        <section className="container mx-auto px-4 py-12 space-y-8 bg-gradient-to-br from-gray-900 to-black min-h-screen">
            <header className="text-center">
                <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
                    The <span className="text-cyan-400">{C001_APP_NAME}</span>: Financial Event Corpus
                </h1>
                <p className="text-xl text-gray-300 max-w-4xl mx-auto">
                    {C002_COMPANY_NAME} presents the FlowMatrix, an exhaustive, meticulously structured repository of all financial transactions. Explore, analyze, and gain unparalleled insights into your fiscal landscape.
                </p>
            </header>

            {/* Section: Plato's Intelligence Suite - AI-Powered Analytics */}
            <Card title="Plato's Intelligence Nexus" subtitle="AI-Driven Financial Forensics by The James Burvel O’Callaghan III Code" isCollapsible={true} defaultExpanded={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* AI Widget: Subscription Hunter */}
                    <D1A2_AITransactionInsightWidget
                        title="Subscription Vigilance Engine"
                        prompt="Act as a financial analyst. Scrutinize the provided transaction data to identify potential recurring subscription services. Focus on recurring payments to the same or similar merchants. For each identified subscription, provide its name, an estimated monthly cost, the date of its last known charge, and the primary merchant identifier. Ensure the output is strictly JSON format as per the defined schema."
                        transactions={E1A1_memoizedDerivedTransactions}
                        responseSchema={E1A1_subscriptionHunterSchema}
                    >
                        {(result: { subscriptions: DetectedSubscription[] }) => (
                            <div className="text-xs text-gray-300 space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700/60">
                                <h5 className="font-semibold text-cyan-300 mb-2">Detected Recurring Commitments:</h5>
                                {result.subscriptions && result.subscriptions.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1.5">
                                        {result.subscriptions.map((sub: any) => (
                                            <li key={sub.name} className="border-b border-gray-700/40 pb-1.5 last:border-b-0 last:pb-0">
                                                <strong className="text-white">{sub.name}</strong><br />
                                                <span className="text-green-300 font-mono">~{C004_DEFAULT_CURRENCY_SYMBOL}{sub.estimatedMonthlyCost.toFixed(2)}</span> | <span className="text-gray-400">Last: {sub.lastKnownChargeDate}</span> | <span className="text-blue-300 text-opacity-90">{sub.merchantIdentifier}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400 italic text-center p-4">Plato's analysis reveals no clear recurring subscriptions in the recent transaction history.</p>
                                )}
                            </div>
                        )}
                    </D1A2_AITransactionInsightWidget>

                    {/* AI Widget: Anomaly Detection */}
                    <D1A2_AITransactionInsightWidget
                        title="Financial Anomaly Sentinel"
                        prompt="Analyze the provided financial transactions and identify the single most anomalous or outlier transaction. Provide a concise explanation detailing why this transaction deviates significantly from the typical spending or income patterns observed."
                        transactions={E1A1_memoizedDerivedTransactions}
                    />

                    {/* AI Widget: Tax Deduction Identifier */}
                    <D1A2_AITransactionInsightWidget
                        title="Tax Optimization Scout"
                        prompt="Review the transaction data. Identify one specific transaction that appears to be a potential candidate for tax deduction purposes. State the transaction and clearly articulate the reasoning behind its potential eligibility for tax benefits."
                        transactions={E1A1_memoizedDerivedTransactions}
                    />

                    {/* AI Widget: Savings Opportunity Finder */}
                    <D1A2_AITransactionInsightWidget
                        title="Fiscal Efficiency Advisor"
                        prompt="Based on the patterns and trends evident in the transaction history, provide one concrete, actionable recommendation for improving savings or reducing unnecessary expenditure. Explain the rationale behind the suggestion."
                        transactions={E1A1_memoizedDerivedTransactions}
                    />
                </div>
            </Card>

            {/* Section: Core Transaction Data Table */}
            <Card title="Transaction Ledger" subtitle="Detailed View & Control Panel" isCollapsible={false}>
                {/* Control Panel: Search, Filter, Sort */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 p-4 bg-gray-900/40 rounded-lg border border-gray-700/60 shadow-inner">
                    <div className="flex items-center gap-3 w-full md:w-auto mb-3 md:mb-0">
                        <label htmlFor="transaction-search" className="sr-only">Search Transactions</label>
                        <input
                            id="transaction-search"
                            type="text"
                            placeholder="Search transaction details..."
                            value={E1A1_searchQuery}
                            onChange={e => E1A1_setSearchQuery(e.target.value)}
                            className="w-full md:w-64 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                        <div className="inline-flex items-center gap-2">
                            <label htmlFor="transaction-filter" className="text-gray-300 text-sm font-medium">Filter:</label>
                            <select
                                id="transaction-filter"
                                value={E1A1_currentFilter}
                                onChange={e => E1A1_setCurrentFilter(e.target.value as any)}
                                className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-sm cursor-pointer appearance-none"
                            >
                                <option value="all">All Types</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>
                        <div className="inline-flex items-center gap-2">
                            <label htmlFor="transaction-sort" className="text-gray-300 text-sm font-medium">Sort By:</label>
                            <select
                                id="transaction-sort"
                                value={E1A1_currentSortCriterion}
                                onChange={e => E1A1_setCurrentSortCriterion(e.target.value as any)}
                                className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-sm cursor-pointer appearance-none"
                            >
                                <option value="date">Date (Newest First)</option>
                                <option value="amount">Amount (Magnitude)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Transaction Data Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-800 shadow-lg">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-200 uppercase bg-gray-900/70 border-b border-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wide">Description</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wide">Category</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wide">Date</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wide text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {E1A1_memoizedDerivedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                                        No transactions found matching your current criteria. Consider adjusting your search or filters.
                                    </td>
                                </tr>
                            ) : (
                                E1A1_memoizedDerivedTransactions.map(tx => (
                                    <tr
                                        key={tx.id}
                                        onClick={() => E1A1_handleSelectTransaction(tx)}
                                        className="border-b border-gray-800/50 hover:bg-gray-800/60 transition-colors duration-200 cursor-pointer group"
                                    >
                                        <td scope="row" className="px-6 py-5 font-medium text-white whitespace-nowrap group-hover:text-cyan-400 transition-colors duration-200">
                                            {tx.description.substring(0, 70)}{tx.description.length > 70 ? '...' : ''}
                                        </td>
                                        <td className="px-6 py-5 text-gray-300">{tx.category}</td>
                                        <td className="px-6 py-5 text-gray-300">{tx.date}</td>
                                        <td className={`px-6 py-5 text-right font-mono font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-500'}`}>
                                            {tx.type === 'income' ? '+' : '-'}{C004_DEFAULT_CURRENCY_SYMBOL}{Math.abs(tx.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Render the Transaction Detail Modal */}
            <D1A1_TransactionDetailModal transaction={E1A1_detailModalTarget} onClose={E1A1_handleCloseDetailModal} />
        </section>
    );
};

export default E1A1_TransactionsView;
