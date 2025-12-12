import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card';
import { ArrowRight, Check, X, Search, AlertCircle, Wand2 } from 'lucide-react';

// --- Generative Data Functions ---
const generateTransactionId = () => `TXN_${Math.random().toString(36).substring(2, 15)}`;
const generateDate = (daysAgo: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo - Math.floor(Math.random() * 30));
    return date.toISOString().split('T')[0];
};
const generateAmount = (base: number = 1000, variance: number = 0.5) => {
    const sign = Math.random() > 0.5 ? 1 : -1;
    return parseFloat((base * (1 + (Math.random() - 0.5) * variance) * sign).toFixed(2));
};
const generateDescription = (type: string) => {
    const prefixes = ['Payment', 'Purchase', 'Transfer', 'Deposit', 'Withdrawal', 'Fee', 'Charge', 'Invoice'];
    const vendors = ['Acme Corp', 'Globex Inc', 'Stark Industries', 'Wayne Enterprises', 'Cyberdyne Systems', 'Initech'];
    const services = ['Cloud Hosting', 'Software License', 'Consulting Fee', 'Office Supplies', 'Travel Expense', 'Subscription'];
    const randomVendor = vendors[Math.floor(Math.random() * vendors.length)];
    const randomService = services[Math.floor(Math.random() * services.length)];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

    switch (type) {
        case 'INTERNAL_LEDGER':
            return `${prefix} - ${randomVendor} - ${randomService}`;
        case 'BANK_STATEMENT':
            return `${prefix.substring(0, 4)} ${randomVendor.substring(0, 4)} ${Math.random().toString(36).substring(0, 3).toUpperCase()}`;
        default:
            return 'Miscellaneous Transaction';
    }
};
const generateCurrency = () => ['USD', 'EUR', 'GBP'][Math.floor(Math.random() * 3)];

// --- Data Types ---
interface Transaction {
    id: string;
    date: string;
    amount: number;
    description: string;
    source: 'INTERNAL_LEDGER' | 'BANK_STATEMENT';
    status: 'UNMATCHED' | 'MATCHED' | 'PENDING';
    currency: string;
}

interface MatchSuggestion {
    ledgerId: string;
    statementId: string;
    confidence: number;
    reason: string;
}

// --- Internal Data Simulation ---
const simulateInternalLedgerData = (count: number): Transaction[] => {
    const data: Transaction[] = [];
    for (let i = 0; i < count; i++) {
        data.push({
            id: generateTransactionId(),
            date: generateDate(Math.floor(Math.random() * 60)),
            amount: generateAmount(1000, 0.8),
            description: generateDescription('INTERNAL_LEDGER'),
            source: 'INTERNAL_LEDGER',
            status: Math.random() > 0.3 ? 'UNMATCHED' : 'MATCHED',
            currency: generateCurrency(),
        });
    }
    return data;
};

const simulateBankStatementData = (count: number): Transaction[] => {
    const data: Transaction[] = [];
    for (let i = 0; i < count; i++) {
        data.push({
            id: generateTransactionId(),
            date: generateDate(Math.floor(Math.random() * 60)),
            amount: generateAmount(1000, 0.8),
            description: generateDescription('BANK_STATEMENT'),
            source: 'BANK_STATEMENT',
            status: Math.random() > 0.3 ? 'UNMATCHED' : 'MATCHED',
            currency: generateCurrency(),
        });
    }
    return data;
};

const MOCK_LEDGER: Transaction[] = simulateInternalLedgerData(15);
const MOCK_STATEMENT: Transaction[] = simulateBankStatementData(18);

const ReconciliationHubView: React.FC = () => {
    const [ledgerTx, setLedgerTx] = useState<Transaction[]>(MOCK_LEDGER);
    const [statementTx, setStatementTx] = useState<Transaction[]>(MOCK_STATEMENT);
    const [selectedLedger, setSelectedLedger] = useState<string | null>(null);
    const [selectedStatement, setSelectedStatement] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
    const [isAutoMatching, setIsAutoMatching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // --- Internal Model Training Logic ---
    // In a real scenario, this would involve loading trained models or performing on-the-fly training.
    // For this self-contained example, we simulate the outcome of a trained model.
    const trainReconciliationModel = () => {
        console.log("Simulating reconciliation model training...");
        // Placeholder for actual model training logic
        return {
            predictMatch: (ledger: Transaction, statement: Transaction): { confidence: number, reason: string } => {
                let confidence = 0;
                let reason = '';

                // Rule-based matching as a proxy for model prediction
                const amountDiff = Math.abs(ledger.amount - statement.amount);
                const dateDiffDays = Math.abs(new Date(ledger.date).getTime() - new Date(statement.date).getTime()) / (1000 * 60 * 60 * 24);

                if (ledger.currency === statement.currency) {
                    confidence += 0.1; // Currency match bonus
                }

                if (amountDiff === 0) {
                    confidence += 0.6;
                    reason = 'Exact amount match';
                } else if (amountDiff / Math.max(ledger.amount, statement.amount) < 0.01) {
                    confidence += 0.4;
                    reason = 'Close amount match (potential fee/tax)';
                } else if (amountDiff / Math.max(ledger.amount, statement.amount) < 0.05) {
                    confidence += 0.2;
                    reason = 'Slightly different amount';
                }

                if (dateDiffDays <= 1) {
                    confidence += 0.2;
                    if (reason) reason += ', ';
                    reason += 'Same day transaction';
                } else if (dateDiffDays <= 3) {
                    confidence += 0.1;
                    if (reason) reason += ', ';
                    reason += 'Within 3 days';
                }

                // Basic description keyword matching
                const ledgerDescLower = ledger.description.toLowerCase();
                const statementDescLower = statement.description.toLowerCase();
                if (ledgerDescLower.includes('payment') && statementDescLower.includes('ach') || ledgerDescLower.includes('invoice') && statementDescLower.includes('payment')) {
                    confidence += 0.1;
                    if (reason) reason += ', ';
                    reason += 'Keyword match in description';
                }

                return {
                    confidence: Math.min(confidence, 0.99),
                    reason: reason || 'No strong indicators',
                };
            }
        };
    };

    const reconciliationModel = useMemo(() => trainReconciliationModel(), []);

    // --- AI Matching Logic ---
    const runAIMatching = () => {
        setIsAutoMatching(true);
        setSuggestions([]); // Clear previous suggestions

        // Simulate a delay for AI processing
        setTimeout(() => {
            const newSuggestions: MatchSuggestion[] = [];
            const unmatchedLedger = ledgerTx.filter(l => l.status === 'UNMATCHED');
            const unmatchedStatement = statementTx.filter(s => s.status === 'UNMATCHED');

            unmatchedLedger.forEach(l => {
                unmatchedStatement.forEach(s => {
                    // Ensure transactions are in the same currency for matching
                    if (l.currency !== s.currency) return;

                    const { confidence, reason } = reconciliationModel.predictMatch(l, s);

                    if (confidence > 0.6) { // Threshold for suggestion
                        newSuggestions.push({
                            ledgerId: l.id,
                            statementId: s.id,
                            confidence: confidence,
                            reason: reason
                        });
                    }
                });
            });

            // Sort suggestions by confidence
            newSuggestions.sort((a, b) => b.confidence - a.confidence);
            setSuggestions(newSuggestions);
            setIsAutoMatching(false);
        }, 1000); // Simulate 1 second AI processing time
    };

    const handleMatch = () => {
        if (selectedLedger && selectedStatement) {
            setLedgerTx(prev => prev.map(t => t.id === selectedLedger ? { ...t, status: 'MATCHED' } : t));
            setStatementTx(prev => prev.map(t => t.id === selectedStatement ? { ...t, status: 'MATCHED' } : t));
            setSelectedLedger(null);
            setSelectedStatement(null);
            // Remove used suggestions
            setSuggestions(prev => prev.filter(s => s.ledgerId !== selectedLedger && s.statementId !== selectedStatement));
        }
    };

    const handleAutoResolve = (suggestion: MatchSuggestion) => {
        setLedgerTx(prev => prev.map(t => t.id === suggestion.ledgerId ? { ...t, status: 'MATCHED' } : t));
        setStatementTx(prev => prev.map(t => t.id === suggestion.statementId ? { ...t, status: 'MATCHED' } : t));
        setSuggestions(prev => prev.filter(s => s !== suggestion));
        setSelectedLedger(null);
        setSelectedStatement(null);
    };

    const handleDismissSuggestion = (suggestion: MatchSuggestion) => {
        setSuggestions(prev => prev.filter(s => s !== suggestion));
    };

    const filteredLedgerTx = useMemo(() =>
        ledgerTx.filter(tx =>
            tx.status === 'UNMATCHED' &&
            (tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
             tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
             tx.amount.toString().includes(searchQuery))
        ), [ledgerTx, searchQuery]
    );

    const filteredStatementTx = useMemo(() =>
        statementTx.filter(tx =>
            tx.status === 'UNMATCHED' &&
            (tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
             tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
             tx.amount.toString().includes(searchQuery))
        ), [statementTx, searchQuery]
    );

    return (
        <div className="space-y-6 p-8 bg-gradient-to-br from-gray-900 to-black min-h-screen text-gray-200 font-sans">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
                    Citibankdemobusinessinc.Reconciliation.Hub
                </h1>
                <div className="flex gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 pl-10 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none w-64"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    </div>
                    <button
                        onClick={runAIMatching}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isAutoMatching || filteredLedgerTx.length === 0 || filteredStatementTx.length === 0}
                    >
                        {isAutoMatching ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Wand2 size={18} />}
                        AI Auto-Match
                    </button>
                </div>
            </div>

            {/* AI Suggestions Panel */}
            {suggestions.length > 0 && (
                <div className="mb-8 p-6 bg-indigo-900/30 border border-indigo-500/40 rounded-xl shadow-lg animate-fadeInUp">
                    <h3 className="text-2xl font-bold text-indigo-300 mb-4 flex items-center gap-3">
                        <Wand2 size={24} className="text-indigo-400" /> AI Match Suggestions ({suggestions.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {suggestions.map((s, idx) => {
                            const l = ledgerTx.find(t => t.id === s.ledgerId);
                            const stmt = statementTx.find(t => t.id === s.statementId);
                            if (!l || !stmt) return null;
                            return (
                                <div key={idx} className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-indigo-500 transition-all duration-300 group shadow-sm">
                                    <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                                        <span>{l.id} â†” {stmt.id}</span>
                                        <span className="text-green-400 font-semibold">{(s.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-white font-bold text-lg">${l.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        <span className="text-gray-500 text-sm">vs</span>
                                        <span className="text-white font-bold text-lg">${stmt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <p className="text-xs text-indigo-300 mb-4 leading-relaxed">{s.reason}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAutoResolve(s)}
                                            className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded transition-colors shadow"
                                        >
                                            <Check size={16} className="inline mr-1" /> Confirm
                                        </button>
                                        <button
                                            onClick={() => handleDismissSuggestion(s)}
                                            className="py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded transition-colors shadow"
                                        >
                                            <X size={16} className="inline" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Internal Ledger Side */}
                <Card title="Internal Ledger (ERP)" className="flex flex-col h-[70vh] border-l-4 border-blue-500 shadow-xl">
                    <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {filteredLedgerTx.length > 0 ? filteredLedgerTx.map(tx => (
                            <div
                                key={tx.id}
                                onClick={() => setSelectedLedger(tx.id === selectedLedger ? null : tx.id)}
                                className={`p-4 rounded-lg cursor-pointer transition-all duration-300 border ${
                                    selectedLedger === tx.id ? 'bg-blue-900/60 border-blue-500 shadow-md' : 'bg-gray-800/50 border-transparent hover:bg-gray-800/70 hover:border-gray-700'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-mono text-xs text-gray-500">{tx.date}</span>
                                    <span className="font-mono font-bold text-white text-lg">${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <p className="text-sm text-gray-300 mt-1 truncate font-medium">{tx.description}</p>
                                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                    <span>{tx.id}</span>
                                    <span>{tx.currency}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-gray-500 flex flex-col items-center justify-center h-full">
                                <Check className="w-12 h-12 text-green-500 mb-3" />
                                <p className="text-lg">All ledger items reconciled or matched!</p>
                                <p className="text-sm">No unmatched items found.</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Bank Statement Side */}
                <Card title="Bank Statement (Citibank API)" className="flex flex-col h-[70vh] border-r-4 border-green-500 shadow-xl">
                     <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {filteredStatementTx.length > 0 ? filteredStatementTx.map(tx => (
                            <div
                                key={tx.id}
                                onClick={() => setSelectedStatement(tx.id === selectedStatement ? null : tx.id)}
                                className={`p-4 rounded-lg cursor-pointer transition-all duration-300 border ${
                                    selectedStatement === tx.id ? 'bg-green-900/60 border-green-500 shadow-md' : 'bg-gray-800/50 border-transparent hover:bg-gray-800/70 hover:border-gray-700'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-mono text-xs text-gray-500">{tx.date}</span>
                                    <span className="font-mono font-bold text-white text-lg">${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <p className="text-sm text-gray-300 mt-1 truncate font-medium">{tx.description}</p>
                                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                    <span>{tx.id}</span>
                                    <span>{tx.currency}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-gray-500 flex flex-col items-center justify-center h-full">
                                <Check className="w-12 h-12 text-green-500 mb-3" />
                                <p className="text-lg">All statement items reconciled or matched!</p>
                                <p className="text-sm">No unmatched items found.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Manual Match Action Bar */}
            <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 p-5 rounded-xl shadow-2xl flex items-center gap-8 transition-all duration-500 z-50 ${selectedLedger && selectedStatement ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
                <div className="flex items-center gap-4">
                    <AlertCircle className="w-6 h-6 text-yellow-400" />
                    <div className="text-sm">
                        <span className="text-gray-400">Linking</span> <span className="text-blue-400 font-mono font-semibold">{selectedLedger}</span> <span className="text-gray-400">to</span> <span className="text-green-400 font-mono font-semibold">{selectedStatement}</span>
                    </div>
                </div>
                <div className="h-10 w-px bg-gray-600"></div>
                <div className="flex gap-3">
                    <button onClick={() => { setSelectedLedger(null); setSelectedStatement(null); }} className="px-5 py-2 rounded-lg hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors">Cancel</button>
                    <button onClick={handleMatch} className="px-7 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 transition-colors">
                        <Check size={18} /> Match Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReconciliationHubView;