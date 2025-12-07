
import React, { useState, useEffect } from 'react';
import Card from './Card';
import { Search, FileText, Folder, ChevronRight, Terminal } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Mock Markdown Content
const MOCK_FILES = [
    { id: '1', title: 'Manifesto.md', path: '/docs/core/manifesto.md', content: '# The Sovereign Manifesto\n\nWe build to serve. We build to educate. We build to empower.\n\nThis system is designed to provide a single source of truth in a world of noise.' },
    { id: '2', title: 'Economy_101.md', path: '/docs/education/economy_101.md', content: '# Understanding the Machine\n\nMoney is energy. It flows where attention goes. This document outlines the fundamental physics of capital flow.' },
    { id: '3', title: '527_Structure.md', path: '/docs/legal/527_structure.md', content: '# The 527 Organization\n\nAn autonomous entity designed for influence. We operate within the light to shape the narrative of the future.' },
    { id: '4', title: 'AI_Ethics.md', path: '/docs/ai/ethics.md', content: '# CivicMind Ethics\n\n1. Support the user.\n2. Support the community.\n3. Uphold the truth.' },
];

const KnowledgeBaseView: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState(MOCK_FILES[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiResponse, setAiResponse] = useState('');

    const filteredFiles = MOCK_FILES.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleAskAI = async () => {
        setIsGenerating(true);
        setAiResponse('');
        // Simulated AI response for "Truth Engine" functionality
        setTimeout(() => {
            setAiResponse(`Based on the "${selectedFile.title}" document, the core truth is that financial sovereignty is achieved through knowledge, not just accumulation. The text emphasizes structural understanding over speculative action.`);
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center pb-6 border-b border-gray-700">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">The Academy</h1>
                    <p className="text-gray-400 mt-1">Single Source of Truth Repository</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search knowledge..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
                {/* File Explorer */}
                <Card className="lg:col-span-1 flex flex-col h-full bg-gray-900 border-gray-800">
                    <div className="p-4 border-b border-gray-800 font-semibold text-gray-300 flex items-center gap-2">
                        <Folder className="w-4 h-4 text-yellow-500" /> /root/docs
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredFiles.map(file => (
                            <button
                                key={file.id}
                                onClick={() => { setSelectedFile(file); setAiResponse(''); }}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-all ${
                                    selectedFile.id === file.id 
                                    ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30' 
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span className="flex-1 text-left truncate">{file.title}</span>
                                {selectedFile.id === file.id && <ChevronRight className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Content Viewer */}
                <Card className="lg:col-span-2 flex flex-col h-full bg-gray-900 border-gray-800 relative overflow-hidden">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur z-10">
                        <span className="font-mono text-xs text-gray-500">{selectedFile.path}</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition">Raw</button>
                            <button className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition">History</button>
                        </div>
                    </div>
                    
                    <div className="flex-1 p-8 overflow-y-auto font-serif text-gray-300 leading-relaxed bg-black/20">
                        <h1 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-4">{selectedFile.title.replace('.md', '')}</h1>
                        <div className="prose prose-invert max-w-none">
                            {selectedFile.content.split('\n').map((line, i) => (
                                <p key={i} className="mb-4">{line}</p>
                            ))}
                        </div>
                    </div>

                    {/* AI Truth Engine Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent">
                        {aiResponse && (
                            <div className="mb-4 p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 animate-in slide-in-from-bottom-2">
                                <strong className="block text-cyan-500 text-xs uppercase mb-1">Truth Consensus Engine</strong>
                                {aiResponse}
                            </div>
                        )}
                        <button 
                            onClick={handleAskAI}
                            disabled={isGenerating}
                            className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 rounded-lg text-sm text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg"
                        >
                            {isGenerating ? (
                                <span className="animate-pulse">Validating Narrative...</span>
                            ) : (
                                <>
                                    <Terminal className="w-4 h-4 text-green-400" /> Verify Truth with AI
                                </>
                            )}
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default KnowledgeBaseView;
