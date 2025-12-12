import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Brain, Layers, Zap, Globe, Cpu, BookOpen, Eye,
    ArrowRight, CheckCircle, Lock, ChevronRight,
    Activity, Shield, Server, Database, Network,
    Code, Terminal, Layout, Box
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from './Card'; 

type Tab = 'CURRICULUM' | 'ORCHESTRATION' | 'SIMULATION' | 'SOURCE';

const LandingPage: React.FC<{ onLoginClick?: () => void }> = ({ onLoginClick }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('CURRICULUM');

    const handleEnterClass = (path: string) => {
        if (isAuthenticated) {
            navigate(path);
        } else {
            if (onLoginClick) onLoginClick();
            else navigate('/login');
        }
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'CURRICULUM':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center max-w-3xl mx-auto mb-8">
                            <h2 className="text-3xl font-bold text-white mb-4">Study Modules</h2>
                            <p className="text-gray-400">
                                Explore the functional modules of the Mind's Eye. Each section represents a core competency of the modern financial stack, mapped to an educational curriculum.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="hover:border-cyan-500 transition-all cursor-pointer group bg-gray-900/50 border-gray-800" onClick={() => handleEnterClass('/dashboard/crypto')}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
                                        <Cpu size={24} />
                                    </div>
                                    <span className="text-xs font-mono text-gray-500">CLASS 101</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Quantum Ledger Dynamics</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    An introduction to decentralized asset management and cryptographic verification.
                                </p>
                                <div className="flex items-center text-cyan-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                                    Begin Module <ChevronRight size={16} />
                                </div>
                            </Card>

                            <Card className="hover:border-cyan-500 transition-all cursor-pointer group bg-gray-900/50 border-gray-800" onClick={() => handleEnterClass('/dashboard/hft')}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-lg bg-green-500/10 text-green-400">
                                        <Activity size={24} />
                                    </div>
                                    <span className="text-xs font-mono text-gray-500">CLASS 202</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">High Frequency Trading</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Advanced algorithmic execution and market microstructure analysis.
                                </p>
                                <div className="flex items-center text-cyan-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                                    Begin Module <ChevronRight size={16} />
                                </div>
                            </Card>

                            <Card className="hover:border-cyan-500 transition-all cursor-pointer group bg-gray-900/50 border-gray-800" onClick={() => handleEnterClass('/dashboard/treasury')}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                                        <Shield size={24} />
                                    </div>
                                    <span className="text-xs font-mono text-gray-500">CLASS 303</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Sovereign Treasury</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Resource allocation, risk management, and long-term capital preservation.
                                </p>
                                <div className="flex items-center text-cyan-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                                    Begin Module <ChevronRight size={16} />
                                </div>
                            </Card>

                            <Card className="hover:border-cyan-500 transition-all cursor-pointer group bg-gray-900/50 border-gray-800" onClick={() => handleEnterClass('/dashboard')}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400">
                                        <Layout size={24} />
                                    </div>
                                    <span className="text-xs font-mono text-gray-500">CLASS 404</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">System Architecture</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Overview of the Mind's Eye dashboard and integrated systems.
                                </p>
                                <div className="flex items-center text-cyan-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                                    Begin Module <ChevronRight size={16} />
                                </div>
                            </Card>
                        </div>
                    </div>
                );
            case 'ORCHESTRATION':
                return (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-white mb-4">The Orchestration Layer</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                How the Mind's Eye connects disparate data sources into a unified cognitive model.
                            </p>
                        </div>

                        <div className="relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 md:p-12 overflow-hidden">
                            {/* Visual Representation */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                {/* Sources */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 w-48">
                                        <Database size={20} className="text-blue-400" />
                                        <span className="text-sm font-mono text-gray-300">Stripe API</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 w-48">
                                        <Server size={20} className="text-green-400" />
                                        <span className="text-sm font-mono text-gray-300">Plaid Connect</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 w-48">
                                        <Globe size={20} className="text-purple-400" />
                                        <span className="text-sm font-mono text-gray-300">Market Data</span>
                                    </div>
                                </div>

                                {/* Connection Lines (Visual only, simplified for CSS) */}
                                <div className="hidden md:flex flex-col gap-2 items-center justify-center opacity-50">
                                    <div className="w-16 h-0.5 bg-gradient-to-r from-gray-700 to-cyan-500"></div>
                                    <div className="w-16 h-0.5 bg-gradient-to-r from-gray-700 to-cyan-500"></div>
                                    <div className="w-16 h-0.5 bg-gradient-to-r from-gray-700 to-cyan-500"></div>
                                </div>

                                {/* The Brain */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full"></div>
                                    <div className="w-32 h-32 bg-gray-950 border-2 border-cyan-500/50 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/20 relative z-10">
                                        <Brain size={48} className="text-cyan-400 animate-pulse" />
                                    </div>
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <span className="text-xs font-mono text-cyan-400">GEMINI CORE</span>
                                    </div>
                                </div>

                                {/* Output */}
                                <div className="hidden md:flex items-center opacity-50">
                                    <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-500 to-gray-700"></div>
                                </div>

                                <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl text-center w-48">
                                    <Layers size={32} className="text-white mx-auto mb-2" />
                                    <span className="text-sm font-bold text-white">Unified UI</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                                <Zap className="text-yellow-400 mb-4" size={24} />
                                <h4 className="font-bold text-white mb-2">Real-time Ingestion</h4>
                                <p className="text-sm text-gray-400">Webhooks and websocket connections stream data directly into the context window.</p>
                            </div>
                            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                                <Brain className="text-cyan-400 mb-4" size={24} />
                                <h4 className="font-bold text-white mb-2">Cognitive Processing</h4>
                                <p className="text-sm text-gray-400">LLMs analyze patterns, detect anomalies, and suggest optimizations.</p>
                            </div>
                            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                                <Eye className="text-purple-400 mb-4" size={24} />
                                <h4 className="font-bold text-white mb-2">Visual Synthesis</h4>
                                <p className="text-sm text-gray-400">Complex data is rendered into intuitive dashboards for human decision making.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'SIMULATION':
                return (
                    <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="inline-flex items-center justify-center p-4 bg-yellow-500/10 rounded-full mb-4">
                            <Terminal size={48} className="text-yellow-500" />
                        </div>
                        <h2 className="text-4xl font-bold text-white">This is a Simulation</h2>
                        <div className="prose prose-invert prose-lg mx-auto text-gray-300">
                            <p>
                                You are viewing a <strong>Demo Environment</strong>. The data you seeâ€”balances, transactions, and market movementsâ€”is simulated for educational purposes.
                            </p>
                            <p>
                                This platform is designed as a <strong>Living Textbook</strong>. It demonstrates how modern financial applications are architected, how they handle state, and how they integrate with AI.
                            </p>
                            <p>
                                While the code is production-grade, the environment is a sandbox. Feel free to explore, click, and experiment. You cannot break the simulation.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                            <div className="p-4 border border-gray-800 rounded-lg bg-gray-900/50">
                                <h4 className="font-bold text-white mb-1">Safe Environment</h4>
                                <p className="text-xs text-gray-500">No real funds are at risk.</p>
                            </div>
                            <div className="p-4 border border-gray-800 rounded-lg bg-gray-900/50">
                                <h4 className="font-bold text-white mb-1">Interactive Learning</h4>
                                <p className="text-xs text-gray-500">Learn by doing, not just reading.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'SOURCE':
                return (
                    <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-8 md:p-12 animate-in fade-in duration-500 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500"></div>
                        <div className="flex items-center gap-3 mb-8">
                            <BookOpen className="text-cyan-400" size={32} />
                            <h2 className="text-3xl font-bold text-white">Foundational Texts</h2>
                        </div>
                        
                        <div className="space-y-8">
                            <div className="prose prose-invert prose-lg text-gray-300">
                                <h3 className="text-xl font-bold text-white">The Physics of Value</h3>
                                <p>
                                    Value is not static; it is a vector quantity, possessing both magnitude and direction. In the digital age, value flows like energy through a circuit. 
                                    To harness it, we must understand the resistance (regulation), the voltage (demand), and the current (liquidity).
                                </p>
                                <p>
                                    Mind's Eye Orchestration provides the schematics for this new physics. It is a tool for visualizing the invisible forces that shape our economy.
                                </p>
                            </div>

                            <div className="p-6 bg-black/30 rounded-xl border-l-4 border-cyan-500">
                                <h4 className="font-bold text-white mb-2">Core Axioms</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li>1. Information Asymmetry is the root of all profit and loss.</li>
                                    <li>2. Automation is the only hedge against complexity.</li>
                                    <li>3. The interface is the product; the code is the truth.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-cyan-500/30">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-900/30 rounded-lg flex items-center justify-center border border-cyan-500/30">
                            <Eye size={24} className="text-cyan-400"/>
                        </div>
                        <div>
                            <h1 className="font-bold tracking-wider text-lg leading-none">MIND'S EYE</h1>
                            <span className="text-[10px] tracking-[0.2em] text-gray-500 uppercase">Orchestration</span>
                        </div>
                    </div>
                    
                    <div className="hidden md:flex gap-1 p-1 bg-gray-900 rounded-xl border border-gray-800">
                        {(['CURRICULUM', 'ORCHESTRATION', 'SIMULATION', 'SOURCE'] as Tab[]).map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === tab 
                                    ? 'bg-gray-800 text-white shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => onLoginClick ? onLoginClick() : navigate('/login')} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
                            Log In
                        </button>
                        <button onClick={() => onLoginClick ? onLoginClick() : navigate('/login')} className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-cyan-500/20">
                            Enter Demo
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Nav (Simplified) */}
            <div className="md:hidden fixed bottom-0 w-full bg-gray-900 border-t border-gray-800 z-50 px-4 py-3 flex justify-between overflow-x-auto">
                 {(['CURRICULUM', 'ORCHESTRATION', 'SIMULATION', 'SOURCE'] as Tab[]).map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex flex-col items-center gap-1 px-2 ${activeTab === tab ? 'text-cyan-400' : 'text-gray-500'}`}
                    >
                        {tab === 'CURRICULUM' && <BookOpen size={16} />}
                        {tab === 'ORCHESTRATION' && <Layers size={16} />}
                        {tab === 'SIMULATION' && <Zap size={16} />}
                        {tab === 'SOURCE' && <Code size={16} />}
                        <span className="text-[10px] font-bold">{tab.substring(0, 4)}</span>
                    </button>
                ))}
            </div>

            {/* Header / Hero Section */}
            <header className="pt-32 pb-12 px-6 text-center">
                <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-4 tracking-tight">
                    Mind's Eye Orchestration
                </h1>
                <p className="text-xl text-cyan-400 font-mono tracking-widest uppercase opacity-80">
                    The Template for the Future
                </p>
            </header>

            {/* Main Content */}
            <main className="pb-32 px-6 max-w-7xl mx-auto min-h-[60vh]">
                {renderContent()}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800 bg-black py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Eye size={20} className="text-gray-600" />
                        <span className="font-bold text-gray-400">Mind's Eye Orchestration</span>
                    </div>
                    <div className="text-xs text-gray-600 font-mono">
                        COPYRIGHT Â© 2025 MIND'S EYE ORCHESTRATION.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;