// components/TransactionsView.tsx
// RE-ENACTED & EXPANDED: This component has been resurrected from its deprecated state.
// It is now the "FlowMatrix," the complete Great Library for all financial events.
// It features advanced filtering, sorting, and the integrated "Plato's Intelligence Suite"
// for powerful, AI-driven transaction analysis.

import React, { useContext, useState, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import type { Transaction, DetectedSubscription } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// ================================================================================================
// GENERATIVE DATA FUNCTIONS (Internal)
// ================================================================================================

/**
 * @description Generates a random string for unique IDs.
 * @returns {string} A unique identifier.
 */
const generateId = (): string => Math.random().toString(36).substring(2, 15);

/**
 * @description Generates a random date within a specified range.
 * @param {Date} startDate - The earliest possible date.
 * @param {Date} endDate - The latest possible date.
 * @returns {string} A formatted date string (YYYY-MM-DD).
 */
const generateDate = (startDate: Date = new Date(2023, 0, 1), endDate: Date = new Date()): string => {
    const timeDiff = endDate.getTime() - startDate.getTime();
    const randomTime = startDate.getTime() + Math.random() * timeDiff;
    const date = new Date(randomTime);
    return date.toISOString().split('T')[0];
};

/**
 * @description Generates a random transaction amount.
 * @param {number} min - The minimum amount.
 * @param {number} max - The maximum amount.
 * @returns {number} A random transaction amount.
 */
const generateAmount = (min: number = 10, max: number = 1000): number => {
    return Math.random() * (max - min) + min;
};

/**
 * @description Generates a random transaction description.
 * @returns {string} A descriptive string for a transaction.
 */
const generateDescription = (): string => {
    const prefixes = ['Payment to', 'Purchase from', 'Transfer to', 'Received from', 'Deposit from', 'Withdrawal from'];
    const merchants = ['Amazon', 'Starbucks', 'Local Grocer', 'Online Service', 'Utility Company', 'Friend', 'Employer', 'Bank'];
    const items = ['groceries', 'coffee', 'electronics', 'software subscription', 'rent', 'salary', 'consulting fee'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${merchants[Math.floor(Math.random() * merchants.length)]} for ${items[Math.floor(Math.random() * items.length)]}`;
};

/**
 * @description Generates a random transaction category.
 * @returns {string} A category string.
 */
const generateCategory = (): string => {
    const categories = ['Groceries', 'Dining', 'Utilities', 'Rent/Mortgage', 'Transportation', 'Entertainment', 'Salary', 'Freelance', 'Investments', 'Shopping', 'Health'];
    return categories[Math.floor(Math.random() * categories.length)];
};

/**
 * @description Generates a random transaction type.
 * @returns {'income' | 'expense'} The type of transaction.
 */
const generateTransactionType = (): 'income' | 'expense' => {
    return Math.random() > 0.6 ? 'income' : 'expense';
};

/**
 * @description Generates a simulated transaction object.
 * @returns {Transaction} A transaction object.
 */
const generateTransaction = (): Transaction => {
    const type = generateTransactionType();
    const amount = generateAmount(10, 1000);
    return {
        id: generateId(),
        description: generateDescription(),
        amount: type === 'income' ? amount : -amount,
        date: generateDate(),
        category: generateCategory(),
        type: type,
        carbonFootprint: Math.random() * 5 // Simulated carbon footprint in kg CO2
    };
};

// ================================================================================================
// MODAL & DETAIL COMPONENTS
// ================================================================================================

/**
 * @description A modal that displays detailed information about a single transaction.
 * This component provides a "magnifying glass" view into a specific financial event.
 * @param {{ transaction: Transaction | null; onClose: () => void }} props
 */
const TransactionDetailModal: React.FC<{ transaction: Transaction | null; onClose: () => void }> = ({ transaction, onClose }) => {
    if (!transaction) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Transaction Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal">&times;</button>
                </div>
                <div className="p-6 space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Description:</span> <span className="text-white font-semibold">{transaction.description}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Amount:</span> <span className={`font-mono font-semibold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Date:</span> <span className="text-white">{transaction.date}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Category:</span> <span className="text-white">{transaction.category}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Transaction ID:</span> <span className="text-white font-mono text-xs">{transaction.id}</span></div>
                    {transaction.carbonFootprint !== undefined && <div className="flex justify-between text-sm"><span className="text-gray-400">Carbon Footprint:</span> <span className="text-green-300">{transaction.carbonFootprint.toFixed(1)} kg CO2</span></div>}
                </div>
            </div>
        </div>
    );
};

// ================================================================================================
// PLATO'S INTELLIGENCE SUITE (AI WIDGETS)
// ================================================================================================

/**
 * @description A generic, reusable component for displaying an AI-generated insight
 * based on the user's transaction history. It handles the loading state, error state,
 * and rendering of the result, which can be either plain text or structured JSON.
 */
const AITransactionWidget: React.FC<{
    title: string;
    prompt: string;
    transactions: Transaction[];
    responseSchema?: any; // Allows passing a response schema for structured JSON
    children?: (result: any) => React.ReactNode; // Custom renderer for structured data
}> = ({ title, prompt, transactions, responseSchema, children }) => {
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    /**
     * @description Triggers the Gemini API call to generate the financial insight.
     */
    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            // In a real application, API_KEY would be securely managed.
            // For this self-contained example, we assume it's available in the environment.
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_FALLBACK_API_KEY'; // Use a placeholder or env var
            if (!apiKey || apiKey === 'YOUR_FALLBACK_API_KEY') {
                throw new Error("Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY.");
            }
            const ai = new GoogleGenAI({ apiKey: apiKey });
            
            // Create a concise summary of recent transactions to provide context to the AI.
            const transactionSummary = transactions.slice(0, 20).map(t => `${t.date} - ${t.description}: $${Math.abs(t.amount).toFixed(2)} (${t.type})`).join('\n');
            const fullPrompt = `${prompt}\n\nHere are the most recent transactions for context:\n${transactionSummary}`;
            
            // Configure the API call based on whether a structured JSON response is expected.
            const config: any = { responseMimeType: responseSchema ? "application/json" : "text/plain" };
            if (responseSchema) {
                config.responseSchema = responseSchema;
            }

            const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const response = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    responseMimeType: config.responseMimeType,
                },
            });

            const textResult = response.response.text().trim();
            setResult(responseSchema ? JSON.parse(textResult) : textResult);

        } catch (err: any) {
            console.error(`Error generating ${title}:`, err);
            setError(`Plato AI could not generate this insight. Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 bg-gray-900/40 rounded-lg border border-gray-700/50 h-full flex flex-col">
            <h4 className="font-semibold text-gray-200 text-sm mb-2">{title}</h4>
            <div className="space-y-2 min-h-[5rem] flex-grow flex flex-col justify-center">
                {error && <p className="text-red-400 text-xs text-center p-2">{error}</p>}
                {isLoading && (
                    <div className="flex items-center justify-center space-x-2">
                         <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                         <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                         <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                )}
                {!isLoading && result && children && children(result)}
                {!isLoading && result && !children && <p className="text-gray-300 text-xs p-2">{result}</p>}
                {!isLoading && !result && !error && (
                    <div className="text-center">
                        <button onClick={handleGenerate} className="text-sm font-medium text-cyan-300 hover:text-cyan-200 transition-colors">
                            Ask Plato AI
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ================================================================================================
// MAIN TRANSACTIONS VIEW (FlowMatrix)
// ================================================================================================
const TransactionsView: React.FC = () => {
    const context = useContext(DataContext);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [sort, setSort] = useState<'date' | 'amount'>('date');
    const [searchTerm, setSearchTerm] = useState('');

    if (!context) {
        throw new Error("TransactionsView must be within a DataProvider");
    }
    const { transactions } = context;

    /**
     * @description Memoized derivation of the transactions to display.
     * This is a crucial performance optimization. The list is only re-calculated
     * when the source data or one of the filter/sort criteria changes, preventing
     * unnecessary re-renders.
     */
    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(tx => filter === 'all' || tx.type === filter)
            .filter(tx => tx.description.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (sort === 'date') {
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                }
                // Sort by absolute amount for consistency, then by type to group income/expense
                const absA = Math.abs(a.amount);
                const absB = Math.abs(b.amount);
                if (absB !== absA) {
                    return absB - absA;
                }
                // If amounts are equal, sort by date (descending)
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
    }, [transactions, filter, sort, searchTerm]);
    
    // Schema definition for the Subscription Hunter AI widget.
    // This tells the Gemini API to return its findings in a structured JSON format.
    const subscriptionSchema = {
        type: Type.OBJECT,
        properties: {
            subscriptions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        estimatedAmount: { type: Type.NUMBER },
                        lastCharged: { type: Type.STRING }
                    }
                }
            }
        }
    };

    return (
        <>
            <div className="space-y-6">
                 <h2 className="text-3xl font-bold text-white tracking-wider">Transaction History (FlowMatrix)</h2>
                 <Card title="Plato's Intelligence Suite" isCollapsible>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <AITransactionWidget title="Subscription Hunter" prompt="Analyze these transactions to find potential recurring subscriptions the user might have forgotten about. Look for repeated payments to the same merchant around the same time each month. Provide the name of the subscription, an estimated monthly amount, and the date of the last known charge." transactions={transactions} responseSchema={subscriptionSchema}>
                           {(result: { subscriptions: DetectedSubscription[] }) => (
                                <ul className="text-xs text-gray-300 space-y-1 p-2">
                                    {result.subscriptions && result.subscriptions.length > 0 ? result.subscriptions.map(sub => <li key={sub.name}>- {sub.name} (~${sub.estimatedAmount.toFixed(2)})</li>) : <li>No potential subscriptions found.</li>}
                                </ul>
                           )}
                        </AITransactionWidget>
                        <AITransactionWidget title="Anomaly Detection" prompt="Analyze these transactions and identify one transaction that seems most unusual or out of place compared to the others. Briefly explain why." transactions={transactions} />
                        <AITransactionWidget title="Tax Deduction Finder" prompt="Scan these transactions and identify one potential tax-deductible expense. Explain your reasoning." transactions={transactions} />
                        <AITransactionWidget title="Savings Finder" prompt="Based on spending patterns, suggest one specific and actionable way to save money." transactions={transactions} />
                     </div>
                </Card>
                <Card>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <input type="text" placeholder="Search transactions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full md:w-1/3 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                        <div className="flex items-center gap-4">
                            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500">
                                <option value="all">All Types</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                             <select value={sort} onChange={e => setSort(e.target.value as any)} className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500">
                                <option value="date">Sort by Date</option>
                                <option value="amount">Sort by Amount</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                             <thead className="text-xs text-gray-300 uppercase bg-gray-900/30">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Description</th>
                                    <th scope="col" className="px-6 py-3">Category</th>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map(tx => (
                                    <tr key={tx.id} onClick={() => setSelectedTransaction(tx)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer">
                                        <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{tx.description}</th>
                                        <td className="px-6 py-4">{tx.category}</td>
                                        <td className="px-6 py-4">{tx.date}</td>
                                        <td className={`px-6 py-4 text-right font-mono ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                            {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
        </>
    );
};

export default TransactionsView;