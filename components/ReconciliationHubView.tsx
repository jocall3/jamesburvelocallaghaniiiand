
import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card';
import { ArrowRight, Check, X, Search, AlertCircle, Wand2 } from 'lucide-react';

// --- Mock Data Types ---
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

const MOCK_LEDGER: Transaction[] = [
    { id: 'L001', date: '2024-03-10', amount: 5000.00, description: 'Vendor Payment - Acme Corp', source: 'INTERNAL_LEDGER', status: 'UNMATCHED', currency: 'USD' },
    { id: 'L002', date: '2024-03-11', amount: 1250.50, description: 'Office Supplies', source: 'INTERNAL_LEDGER', status: 'UNMATCHED', currency: 'USD' },
    { id: 'L003', date: '2024-03-12', amount: 100000.00, description: 'Capital Injection', source: 'INTERNAL_LEDGER', status: 'UNMATCHED', currency: 'USD' },
    { id: 'L004', date: '2024-03-12', amount: 45.00, description: 'Coffee', source: 'INTERNAL_LEDGER', status: 'UNMATCHED', currency: 'USD' },
];

const MOCK_STATEMENT: Transaction[] = [
    { id: 'S001', date: '2024-03-11', amount: 5000.00, description: 'ACH WDL ACME CORP', source: 'BANK_STATEMENT', status: 'UNMATCHED', currency: 'USD' },
    { id: 'S002', date: '2024-03-11', amount: 1250.50, description: 'STAPLES #9942', source: 'BANK_STATEMENT', status: 'UNMATCHED', currency: 'USD' },
    { id: 'S003', date: '2024-03-13', amount: 99985.00, description: 'WIRE IN CITI - FEE DEDUCTED', source: 'BANK_STATEMENT', status: 'UNMATCHED', currency: 'USD' },
    { id: 'S004', date: '2024-03-15', amount: 500.00, description: 'UNKNOWN CHARGE', source: 'BANK_STATEMENT', status: 'UNMATCHED', currency: 'USD' },
];

const ReconciliationHubView: React.FC = () => {
    const [ledgerTx, setLedgerTx] = useState<Transaction[]>(MOCK_LEDGER);
    const [statementTx, setStatementTx] = useState<Transaction[]>(MOCK_STATEMENT);
    const [selectedLedger, setSelectedLedger] = useState<string | null>(null);
    const [selectedStatement, setSelectedStatement] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
    const [isAutoMatching, setIsAutoMatching] = useState(false);

    // --- AI Matching Logic ---
    const runAIMatching = () => {
        setIsAutoMatching(true);
        setTimeout(() => {
            const newSuggestions: MatchSuggestion[] = [];
            
            ledgerTx.filter(l => l.status === 'UNMATCHED').forEach(l => {
                statementTx.filter(s => s.status === 'UNMATCHED').forEach(s => {
                    let confidence = 0;
                    let reason = '';

                    // Exact Amount Match
                    if (l.amount === s.amount) {
                        confidence += 0.8;
                        reason = 'Exact amount match';
                    } 
                    // Fuzzy Amount Match (e.g., fees deducted)
                    else if (Math.abs(l.amount - s.amount) / l.amount < 0.01) {
                        confidence += 0.6;
                        reason = 'Close amount (possible fee deduction)';
                    }

                    // Date proximity
                    const dateDiff = Math.abs(new Date(l.date).getTime() - new Date(s.date).getTime());
                    if (dateDiff < 86400000 * 2) { // 2 days
                        confidence += 0.1;
                    }

                    if (confidence > 0.5) {
                        newSuggestions.push({
                            ledgerId: l.id,
                            statementId: s.id,
                            confidence: Math.min(confidence, 0.99),
                            reason
                        });
                    }
                });
            });

            setSuggestions(newSuggestions);
            setIsAutoMatching(false);
        }, 1500);
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
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white tracking-wider">Reconciliation Hub</h2>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 flex items-center gap-2">
                        <Search size={16} /> Filter
                    </button>
                    <button 
                        onClick={runAIMatching}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 flex items-center gap-2 disabled:opacity-50 transition-all"
                        disabled={isAutoMatching}
                    >
                        {isAutoMatching ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Wand2 size={16} />}
                        AI Auto-Match
                    </button>
                </div>
            </div>

            {/* AI Suggestions Panel */}
            {suggestions.length > 0 && (
                <div className="mb-6 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl animate-fadeIn">
                    <h3 className="text-lg font-semibold text-indigo-300 mb-3 flex items-center gap-2">
                        <Wand2 size={18} /> Suggested Matches ({suggestions.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suggestions.map((s, idx) => {
                            const l = ledgerTx.find(t => t.id === s.ledgerId);
                            const stmt = statementTx.find(t => t.id === s.statementId);
                            if (!l || !stmt) return null;
                            return (
                                <div key={idx} className="p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-indigo-500 transition-colors group">
                                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                                        <span>{l.id} ↔ {stmt.id}</span>
                                        <span className="text-green-400 font-mono">{(s.confidence * 100).toFixed(0)}% Match</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white font-bold">${l.amount.toLocaleString()}</span>
                                        <span className="text-gray-500 text-xs">vs</span>
                                        <span className="text-white font-bold">${stmt.amount.toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-indigo-300 mb-3">{s.reason}</p>
                                    <button 
                                        onClick={() => handleAutoResolve(s)}
                                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded transition-colors"
                                    >
                                        Confirm Match
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
                {/* Internal Ledger Side */}
                <Card title="Internal Ledger (ERP)" className="flex flex-col h-full border-l-4 border-blue-500">
                    <div className="flex-grow overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {ledgerTx.filter(t => t.status === 'UNMATCHED').map(tx => (
                            <div 
                                key={tx.id}
                                onClick={() => setSelectedLedger(tx.id === selectedLedger ? null : tx.id)}
                                className={`p-3 rounded cursor-pointer transition-all border ${
                                    selectedLedger === tx.id ? 'bg-blue-900/40 border-blue-500' : 'bg-gray-800/50 border-transparent hover:bg-gray-800'
                                }`}
                            >
                                <div className="flex justify-between">
                                    <span className="font-mono text-xs text-gray-500">{tx.date}</span>
                                    <span className="font-mono font-bold text-white">${tx.amount.toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-gray-300 mt-1 truncate">{tx.description}</p>
                                <div className="text-xs text-gray-500 mt-1">{tx.id}</div>
                            </div>
                        ))}
                        {ledgerTx.filter(t => t.status === 'UNMATCHED').length === 0 && (
                            <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                                <Check className="w-12 h-12 text-green-500 mb-2" />
                                All ledger items reconciled.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Bank Statement Side */}
                <Card title="Bank Statement (Citibank API)" className="flex flex-col h-full border-r-4 border-green-500">
                     <div className="flex-grow overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {statementTx.filter(t => t.status === 'UNMATCHED').map(tx => (
                            <div 
                                key={tx.id}
                                onClick={() => setSelectedStatement(tx.id === selectedStatement ? null : tx.id)}
                                className={`p-3 rounded cursor-pointer transition-all border ${
                                    selectedStatement === tx.id ? 'bg-green-900/40 border-green-500' : 'bg-gray-800/50 border-transparent hover:bg-gray-800'
                                }`}
                            >
                                <div className="flex justify-between">
                                    <span className="font-mono text-xs text-gray-500">{tx.date}</span>
                                    <span className="font-mono font-bold text-white">${tx.amount.toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-gray-300 mt-1 truncate">{tx.description}</p>
                                <div className="text-xs text-gray-500 mt-1">{tx.id}</div>
                            </div>
                        ))}
                         {statementTx.filter(t => t.status === 'UNMATCHED').length === 0 && (
                            <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                                <Check className="w-12 h-12 text-green-500 mb-2" />
                                All statement items reconciled.
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Manual Match Action Bar */}
            <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-600 p-4 rounded-xl shadow-2xl flex items-center gap-6 transition-all duration-300 ${selectedLedger && selectedStatement ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <div className="text-sm">
                    <span className="text-gray-400">Linking</span> <span className="text-blue-400 font-mono">{selectedLedger}</span> <span className="text-gray-400">to</span> <span className="text-green-400 font-mono">{selectedStatement}</span>
                </div>
                <div className="h-8 w-px bg-gray-600"></div>
                <div className="flex gap-2">
                    <button onClick={() => { setSelectedLedger(null); setSelectedStatement(null); }} className="px-4 py-2 rounded hover:bg-gray-700 text-gray-300 text-sm font-medium">Cancel</button>
                    <button onClick={handleMatch} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold shadow-lg flex items-center gap-2">
                        <Check size={16} /> Match
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReconciliationHubView;
