import React, { useState, useCallback } from 'react';
import { StorytellerEngine } from '../components/Storyteller/StorytellerEngine';
import { TransactionInputForm } from '../components/Input/TransactionInputForm';
import { Loader } from '../components/UI/Loader';
import { Alert } from '../components/UI/Alert';
import { simulateTransaction } from '../api/quantumApi';
import { QuantumTraceData } from '../types/quantumTypes';

export const QuantumStoryView: React.FC = () => {
    const [transactionHash, setTransactionHash] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [traceData, setTraceData] = useState<QuantumTraceData | null>(null);

    const handleAnalyze = useCallback(async (hash: string) => {
        // Basic validation for Ethereum transaction hash (32 bytes, hex)
        const hashRegex = /^0x([A-Fa-f0-9]{64})$/;
        if (!hashRegex.test(hash)) {
            setError('Invalid format. Please enter a valid 32-byte hexadecimal transaction hash starting with 0x.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setTraceData(null);
        setTransactionHash(hash);

        try {
            // Call the backend service to retrieve the EVM trace and simulation logs
            const result = await simulateTransaction(hash);
            setTraceData(result);
        } catch (err: any) {
            console.error('Simulation failed:', err);
            setError(err.message || 'An unexpected error occurred while simulating the transaction. Please verify the network status and try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleReset = () => {
        setTraceData(null);
        setTransactionHash('');
        setError(null);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <header className="py-6 px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 ring-1 ring-white/10" />
                        <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            Quantum Storyteller
                        </h1>
                    </div>
                    {traceData && (
                        <button
                            onClick={handleReset}
                            className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                            New Simulation
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
                {/* Ambient Background Effects */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl -z-10 pointer-events-none opacity-50 mix-blend-screen" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl -z-10 pointer-events-none opacity-50 mix-blend-screen" />

                <div className="w-full max-w-6xl mx-auto transition-all duration-500 ease-in-out flex flex-col items-center">
                    
                    {/* Input State */}
                    {!traceData && !isLoading && (
                        <div className="flex flex-col items-center animate-fade-in-up w-full max-w-2xl">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-6 leading-tight tracking-tight">
                                Decrypt the <br />
                                <span className="text-indigo-400">EVM Narrative</span>
                            </h2>
                            <p className="text-slate-400 text-center mb-12 text-lg leading-relaxed">
                                Enter a transaction hash to replay execution logs, inspect stack depths, and uncover the logic flow hidden within the bytecode.
                            </p>

                            <div className="w-full">
                                <TransactionInputForm 
                                    onSubmit={handleAnalyze} 
                                    disabled={isLoading}
                                    placeholder="Enter Tx Hash (e.g., 0xb9f4...)"
                                    className="shadow-2xl shadow-indigo-500/10"
                                />
                            </div>

                            {error && (
                                <div className="mt-8 w-full animate-shake">
                                    <Alert variant="error" title="Simulation Failed" message={error} />
                                </div>
                            )}

                            {/* Suggested Test Cases (Based on Integration Tests) */}
                            <div className="mt-16 w-full">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center">
                                    Try a Sample Transaction
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => handleAnalyze("0xb9f4e6e5c90329a43da70ced8e8974c3fa34e67e32283bfa82778296fa79dd98")}
                                        className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:border-indigo-500/50 transition-all text-left group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-xs font-mono text-indigo-400 block mb-1">Uniswap V2</span>
                                        <span className="text-sm font-medium text-slate-300 group-hover:text-white">Swap Transaction</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleAnalyze("0x6669284f4072af03600f95bc4c1ed3499e1658dab87615cfd03775fea13a82b7")}
                                        className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:border-purple-500/50 transition-all text-left group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-xs font-mono text-purple-400 block mb-1">Uniswap V3</span>
                                        <span className="text-sm font-medium text-slate-300 group-hover:text-white">Multicall Interaction</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleAnalyze("0x2ab5b72b40d8d004d40258e7a8296d512a0d805c1f73603ddba4069a80e40946")}
                                        className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:border-blue-500/50 transition-all text-left group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-xs font-mono text-blue-400 block mb-1">OpenSea</span>
                                        <span className="text-sm font-medium text-slate-300 group-hover:text-white">Transfer Helper</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleAnalyze("0x763774a4a954d0deccf9d054ed8164cef1e6762a45cdc30457b5c2770c833300")}
                                        className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:border-pink-500/50 transition-all text-left group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-xs font-mono text-pink-400 block mb-1">Curve</span>
                                        <span className="text-sm font-medium text-slate-300 group-hover:text-white">Remove Liquidity</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
                            <div className="relative">
                                <Loader size="xl" color="indigo" />
                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                            </div>
                            <h3 className="mt-8 text-xl font-medium text-slate-200">
                                Replaying EVM Execution
                            </h3>
                            <p className="mt-2 text-sm text-slate-500 max-w-sm text-center">
                                Fetching traces, validating gas costs, and analyzing stack operations...
                            </p>
                        </div>
                    )}

                    {/* Result State */}
                    {traceData && (
                        <div className="animate-fade-in w-full h-full flex-1">
                            <StorytellerEngine 
                                data={traceData} 
                                txHash={transactionHash} 
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};