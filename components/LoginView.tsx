
import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
    Terminal, Cpu, Globe, Shield, Zap, Activity, 
    Lock, ChevronRight, Command, GitBranch, 
    Database, Layers, Key, Code, Search, 
    Layout, Box, Server, ArrowRight, Brain // Brain imported here
} from 'lucide-react';

// --- Animated Background Grid ---
const BackgroundGrid = () => (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%] animate-spin-slow opacity-5 bg-[radial-gradient(circle_800px_at_50%_50%,#00f3ff,transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
    </div>
);

// --- Terminal Component ---
const TerminalWindow = () => {
    const [lines, setLines] = useState<string[]>([
        "> INITIALIZING SOVEREIGN KERNEL...",
        "> LOADING MODULES: [QUANTUM_LEDGER, NEURAL_NET, HFT_ENGINE]",
        "> ESTABLISHING SECURE HANDSHAKE WITH CITIBANK GATEWAY...",
        "> VERIFYING PLAID LINK TOKENS...",
        "> SYNCING STRIPE WEBHOOKS...",
        "> MARQETA JIT FUNDING: ACTIVE",
        "> SYSTEM READY."
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            const newLogs = [
                `> [${new Date().toLocaleTimeString()}] INGESTING MARKET DATA FEED...`,
                `> [${new Date().toLocaleTimeString()}] OPTIMIZING ROUTING TABLE...`,
                `> [${new Date().toLocaleTimeString()}] DETECTED ARBITRAGE OPPORTUNITY (ETH/USD)...`,
                `> [${new Date().toLocaleTimeString()}] REBALANCING PORTFOLIO CLUSTER...`
            ];
            const randomLog = newLogs[Math.floor(Math.random() * newLogs.length)];
            setLines(prev => [...prev.slice(-8), randomLog]);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-[#0d1117] rounded-lg border border-gray-700 shadow-2xl font-mono text-xs p-4 h-64 w-full max-w-md opacity-80 flex flex-col">
            <div className="flex gap-2 mb-4 border-b border-gray-800 pb-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-gray-500">bash — idgafai-core</span>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col justify-end space-y-1">
                {lines.map((line, i) => (
                    <div key={i} className="text-green-400 truncate">{line}</div>
                ))}
                <div className="flex items-center text-green-400">
                    <span className="mr-2">$</span>
                    <span className="w-2 h-4 bg-green-400 animate-pulse" />
                </div>
            </div>
        </div>
    );
};

// --- Feature Card ---
const FeatureCard: React.FC<{ icon: React.ElementType, title: string, desc: string }> = ({ icon: Icon, title, desc }) => (
    <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-cyan-500/50 transition-all duration-300 group">
        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-900/20 transition-colors">
            <Icon className="w-6 h-6 text-gray-400 group-hover:text-cyan-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
);

const LoginView: React.FC = () => {
    const authContext = useContext(AuthContext);
    const { loginWithCredentials, isLoading } = authContext || {};
    const [email, setEmail] = useState('visionary@sovereign-ai-nexus.io');
    const [password, setPassword] = useState('password');
    const [isFocused, setIsFocused] = useState(false);

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (loginWithCredentials) {
            await loginWithCredentials(email, password);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30 relative overflow-x-hidden">
            <BackgroundGrid />
            
            {/* Navbar */}
            <nav className="relative z-50 border-b border-white/10 backdrop-blur-md bg-black/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center font-bold text-black">
                            S
                        </div>
                        <span className="font-bold text-xl tracking-tight">SOVEREIGN<span className="text-cyan-400">OS</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <a href="#" className="hover:text-white transition-colors">Platform</a>
                        <a href="#" className="hover:text-white transition-colors">Developers</a>
                        <a href="#" className="hover:text-white transition-colors">Compliance</a>
                        <a href="#" className="hover:text-white transition-colors">Pricing</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-green-500 hidden sm:inline-block">● SYSTEM OPERATIONAL</span>
                        <button className="text-sm font-bold px-4 py-2 bg-white/5 hover:bg-white/10 rounded-md border border-white/10 transition-all">
                            Documentation
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Hero Area */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 lg:flex lg:items-center lg:gap-20">
                
                {/* Left Column: Copy & Value Prop */}
                <div className="lg:w-1/2 space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-800/50 text-cyan-400 text-xs font-mono mb-4">
                        <GitBranch className="w-3 h-3" /> v4.2.0-RELEASE: QUANTUM_ENTANGLEMENT_ENABLED
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1]">
                        The Financial <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                            Singularity
                        </span>
                    </h1>
                    
                    <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                        The world's first AI-native banking operating system. Integrate banking, treasury, payments, and crypto into a single, programmable interface. Built by James Burvel O'Callaghan III for the post-fiat era.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button className="px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                            Start Building <ArrowRight className="w-4 h-4" />
                        </button>
                        <button className="px-8 py-4 bg-transparent border border-gray-700 text-white font-bold rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-2 font-mono">
                            <Terminal className="w-4 h-4 text-gray-500" /> npm install @sovereign/sdk
                        </button>
                    </div>

                    <div className="pt-12 grid grid-cols-3 gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Fake Logos for Trust */}
                        <div className="flex items-center gap-2"><Globe className="w-6 h-6" /><span className="font-bold">CITI</span></div>
                        <div className="flex items-center gap-2"><Layers className="w-6 h-6" /><span className="font-bold">PLAID</span></div>
                        <div className="flex items-center gap-2"><Code className="w-6 h-6" /><span className="font-bold">STRIPE</span></div>
                    </div>
                </div>

                {/* Right Column: Login & Interactive Elements */}
                <div className="lg:w-1/2 mt-16 lg:mt-0 relative">
                    {/* Decorative background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

                    <div className="relative flex flex-col gap-6">
                        {/* Terminal floating behind/above */}
                        <div className="transform lg:translate-x-12 lg:-translate-y-12 shadow-2xl">
                            <TerminalWindow />
                        </div>

                        {/* Login Card */}
                        <div className={`bg-[#161b22] border border-gray-700 rounded-xl p-8 shadow-2xl relative z-20 transform transition-all duration-300 ${isFocused ? 'scale-[1.02] border-cyan-500/50 ring-1 ring-cyan-500/20' : ''}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Console Access</h2>
                                <Lock className="w-4 h-4 text-gray-500" />
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 uppercase mb-1">Identity Principal</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onFocus={() => setIsFocused(true)}
                                            onBlur={() => setIsFocused(false)}
                                            className="w-full bg-[#0d1117] border border-gray-700 rounded-md py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-500 uppercase mb-1">Secure Token / Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Key className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <input 
                                            type="password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onFocus={() => setIsFocused(true)}
                                            onBlur={() => setIsFocused(false)}
                                            className="w-full bg-[#0d1117] border border-gray-700 rounded-md py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <Cpu className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4 fill-current" /> Initialize Session
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500">
                                <a href="#" className="hover:text-cyan-400">Recover Identity</a>
                                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> SSO Enabled</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Grid Section */}
            <div className="relative z-10 bg-black/50 border-t border-white/5 py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Engineered for the <span className="text-purple-400">Next Epoch</span></h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Replace fragmented legacy systems with a single, sovereign core. Experience the convergence of TradFi liquidity and DeFi composability.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={Database}
                            title="Universal Ledger"
                            desc="Real-time reconciliation across Citi, Stripe, and 100+ localized payment rails. Single source of truth for all asset classes."
                        />
                        <FeatureCard 
                            icon={Brain}
                            title="Generative Finance"
                            desc="idgafAI (Gemini 2.5 Pro) actively manages risk, optimizes tax vectors, and executes high-frequency arbitrage strategies autonomously."
                        />
                        <FeatureCard 
                            icon={Layout}
                            title="Composable UI"
                            desc="Build bespoke financial workflows with our React-based component library. Drag, drop, and deploy capital in milliseconds."
                        />
                        <FeatureCard 
                            icon={Search}
                            title="Deep Observability"
                            desc="Full-stack visibility into every transaction lifecycle. Trace funds from origin to settlement with quantum-resistant audit logs."
                        />
                        <FeatureCard 
                            icon={Server}
                            title="Edge Infrastructure"
                            desc="Distributed across 40+ zones. Sub-millisecond latency for algorithmic trading and real-time payment settlements."
                        />
                        <FeatureCard 
                            icon={Command}
                            title="Developer First"
                            desc="SDKs for TypeScript, Python, and Go. CLI tools for pipeline management. If you can code it, you can bank it."
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 bg-black border-t border-white/10 py-12 px-6 text-sm text-gray-500">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-white font-bold">S</div>
                        <span>© 2025 Sovereign Systems Inc.</span>
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white">Status</a>
                        <a href="#" className="hover:text-white">Security</a>
                        <a href="#" className="hover:text-white">Terms</a>
                        <a href="#" className="hover:text-white">Privacy</a>
                    </div>
                    <div className="font-mono text-xs text-cyan-900">
                        ID: SYSTEM_ROOT_ACCESS_GRANTED
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Simple Icon wrapper to avoid cluttering imports with 'User' vs 'UserIcon' naming conflicts if any
const UserIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export default LoginView;
