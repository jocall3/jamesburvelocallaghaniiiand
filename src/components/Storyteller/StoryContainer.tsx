import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface LogEntry {
    address: string;
    topics: string[];
    data: string;
}

export interface TechnicalContext {
    contractAddress: string;
    contractName?: string;
    methodName?: string;
    gasUsed: number;
    depth: number;
    op?: string; // EVM Opcode
    logs?: LogEntry[];
}

export interface StoryChapter {
    sequenceId: number;
    title: string;
    narrative: string;
    iconType: 'swap' | 'transfer' | 'approval' | 'mint' | 'burn' | 'unknown';
    technicalContext: TechnicalContext;
}

export interface TransactionStory {
    txHash: string;
    status: 'success' | 'reverted';
    blockNumber: number;
    timestamp: number;
    summary: string;
    totalGasUsed: number;
    chapters: StoryChapter[];
}

interface StoryContainerProps {
    transactionHash: string;
    rpcUrl?: string; // Optional custom RPC for the backend to use for simulation
}

// ---------------------------------------------------------------------------
// Component Implementation
// ---------------------------------------------------------------------------

export const StoryContainer: React.FC<StoryContainerProps> = ({ transactionHash, rpcUrl }) => {
    // State Management
    const [storyData, setStoryData] = useState<TransactionStory | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<number>(0);

    // Fetch Story Logic
    const fetchTransactionStory = useCallback(async () => {
        if (!transactionHash) return;

        setIsLoading(true);
        setError(null);
        setStoryData(null);

        try {
            // This endpoint corresponds to the backend service that utilizes Nethereum
            // to trace the transaction, decode logs, and generate the narrative.
            const response = await axios.post<TransactionStory>('/api/v1/story/analyze', {
                hash: transactionHash,
                rpcUrl: rpcUrl
            });

            setStoryData(response.data);
            setCurrentStep(0); // Reset to introduction
        } catch (err: any) {
            console.error('Error generating story:', err);
            setError(
                err.response?.data?.message || 
                'Failed to analyze transaction. The trace might be too complex or the node is unreachable.'
            );
        } finally {
            setIsLoading(false);
        }
    }, [transactionHash, rpcUrl]);

    // Initial Fetch
    useEffect(() => {
        fetchTransactionStory();
    }, [fetchTransactionStory]);

    // Navigation Handlers
    const goToNextStep = () => {
        if (storyData && currentStep < storyData.chapters.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const goToPrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // ---------------------------------------------------------------------------
    // Internal UI Components (Icons/Loaders)
    // ---------------------------------------------------------------------------

    const Spinner = () => (
        <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    const IconChevronLeft = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    );

    const IconChevronRight = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
    );

    const IconAlert = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mb-4"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
    );

    // ---------------------------------------------------------------------------
    // State Rendering
    // ---------------------------------------------------------------------------

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl shadow border border-slate-200 p-8">
                <Spinner />
                <h3 className="text-lg font-medium text-slate-700">Analyzing EVM Trace...</h3>
                <p className="text-sm text-slate-500 mt-2">Deciphering opcodes, memory, and logs to tell the story.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl shadow border border-slate-200 p-8 text-center">
                <IconAlert />
                <h3 className="text-lg font-bold text-slate-800">Analysis Failed</h3>
                <p className="text-sm mt-2 mb-6 text-slate-500 max-w-md">{error}</p>
                <button 
                    onClick={fetchTransactionStory}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors text-sm font-medium"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!storyData) return null;

    // ---------------------------------------------------------------------------
    // Main Render
    // ---------------------------------------------------------------------------

    const currentChapter = storyData.chapters[currentStep];
    const progressPercentage = ((currentStep + 1) / storyData.chapters.length) * 100;

    return (
        <div className="flex flex-col w-full max-w-5xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 font-sans">
            {/* Header: Transaction Summary */}
            <header className="bg-slate-900 text-white p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                    <div className="overflow-hidden w-full">
                        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300 mb-1">
                            Transaction Story
                        </h1>
                        <div className="font-mono text-xs text-slate-400 truncate opacity-80" title={transactionHash}>
                            {transactionHash}
                        </div>
                    </div>
                    <div className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        storyData.status === 'success' 
                            ? 'bg-green-900/30 text-green-400 border-green-800' 
                            : 'bg-red-900/30 text-red-400 border-red-800'
                    }`}>
                        {storyData.status}
                    </div>
                </div>
                <p className="text-slate-300 text-lg leading-relaxed font-light border-l-4 border-indigo-500 pl-4">
                    {storyData.summary}
                </p>
            </header>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5">
                <div 
                    className="h-full bg-indigo-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            {/* Content Body */}
            <div className="flex flex-col md:flex-row flex-1 min-h-[500px]">
                
                {/* Left: Narrative View */}
                <div className="flex-1 p-6 md:p-10 flex flex-col justify-center bg-white relative">
                    <div className="mb-8 flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                {currentStep + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Chapter {currentStep + 1} of {storyData.chapters.length}
                            </span>
                        </div>
                        
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">
                            {currentChapter.title}
                        </h2>
                        
                        <div className="prose prose-slate lg:prose-lg text-slate-600 leading-8">
                            <p>{currentChapter.narrative}</p>
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between mt-auto pt-8 border-t border-slate-100">
                        <button
                            onClick={goToPrevStep}
                            disabled={currentStep === 0}
                            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all border ${
                                currentStep === 0 
                                ? 'border-transparent text-slate-300 cursor-not-allowed' 
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 shadow-sm'
                            }`}
                        >
                            <IconChevronLeft />
                            <span className="font-medium">Previous</span>
                        </button>

                        <div className="hidden sm:flex space-x-1">
                            {storyData.chapters.map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                        idx === currentStep ? 'bg-indigo-600' : 'bg-slate-200'
                                    }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={goToNextStep}
                            disabled={currentStep === storyData.chapters.length - 1}
                            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all border ${
                                currentStep === storyData.chapters.length - 1 
                                ? 'border-transparent text-slate-300 cursor-not-allowed' 
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 shadow-sm'
                            }`}
                        >
                            <span className="font-medium">Next</span>
                            <IconChevronRight />
                        </button>
                    </div>
                </div>

                {/* Right: Technical Context Panel */}
                <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 p-6 overflow-y-auto custom-scrollbar">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                        Technical Details
                    </h3>
                    
                    <div className="space-y-6">
                        {/* Contract Info */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200/60">
                            <span className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Contract / Interaction</span>
                            <div className="text-sm font-semibold text-slate-800 mb-1">
                                {currentChapter.technicalContext.contractName || "Unknown Contract"}
                            </div>
                            <code className="block text-[10px] text-indigo-600 break-all font-mono bg-indigo-50/50 p-1.5 rounded border border-indigo-100/50">
                                {currentChapter.technicalContext.contractAddress}
                            </code>
                        </div>

                        {/* Method & Gas */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200/60">
                                <span className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Depth</span>
                                <span className="block text-sm font-mono text-slate-800">
                                    {currentChapter.technicalContext.depth}
                                </span>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200/60">
                                <span className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Gas Used</span>
                                <span className="block text-sm font-mono text-slate-800">
                                    {currentChapter.technicalContext.gasUsed.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Method Name */}
                        {currentChapter.technicalContext.methodName && (
                            <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200/60">
                                <span className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Function Call</span>
                                <code className="block text-xs text-slate-700 font-mono">
                                    {currentChapter.technicalContext.methodName}
                                </code>
                            </div>
                        )}

                        {/* Opcode */}
                        {currentChapter.technicalContext.op && (
                            <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200/60">
                                <span className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Opcode</span>
                                <code className="block text-xs text-pink-600 font-mono">
                                    {currentChapter.technicalContext.op}
                                </code>
                            </div>
                        )}

                        {/* Logs Preview */}
                        {currentChapter.technicalContext.logs && currentChapter.technicalContext.logs.length > 0 && (
                            <div className="pt-2">
                                <span className="block text-xs text-slate-500 font-medium mb-2">
                                    Emitted Logs ({currentChapter.technicalContext.logs.length})
                                </span>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {currentChapter.technicalContext.logs.map((log, idx) => (
                                        <div key={idx} className="text-[10px] font-mono bg-slate-800 text-slate-300 p-2 rounded border border-slate-700">
                                            <div className="text-slate-500 mb-1">Log #{idx + 1}</div>
                                            <div className="truncate">Addr: {log.address}</div>
                                            <div className="truncate text-slate-500">Topics: {log.topics.length}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoryContainer;