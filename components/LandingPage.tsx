
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Book, Users, Globe, Shield, Activity, Brain, 
    ArrowRight, Star, Heart, CheckCircle, Lock,
    ChevronRight, GraduationCap, Building, Radio, Cpu,
    Infinity, Library
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from './Card'; 

// --- Landing Page Types ---
type Tab = 'MISSION' | 'ACADEMY' | 'PLATFORM' | 'MANIFESTO';

const LandingPage: React.FC<{ onLoginClick?: () => void }> = ({ onLoginClick }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('MISSION');

    const handleJoin = () => onLoginClick ? onLoginClick() : navigate('/login');

    const renderContent = () => {
        switch(activeTab) {
            case 'MISSION':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 leading-tight">
                                Infinite Intelligence <br/> Foundation
                            </h2>
                            <p className="text-xl text-gray-300 leading-relaxed">
                                We are the architects of a new era. We leverage the 527 Protocol to disseminate knowledge, empower communities, and build a single source of truth for economic prosperity.
                            </p>
                            <div className="flex gap-4 pt-4">
                                <button onClick={handleJoin} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105 flex items-center gap-2">
                                    <Infinity size={20} /> Access The Foundation
                                </button>
                                <button onClick={() => setActiveTab('MANIFESTO')} className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl border border-gray-700 transition-all flex items-center gap-2">
                                    <Book size={20} /> The 527 Protocol
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
                            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
                                <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
                                    <Radio className="w-6 h-6 text-green-500 animate-pulse" />
                                    <span className="text-sm font-mono text-gray-400">FOUNDATION SIGNAL // ONLINE</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-800 rounded-lg border-l-4 border-cyan-500">
                                        <h4 className="font-bold text-white mb-1">Teaching & Education</h4>
                                        <p className="text-sm text-gray-400">Empowering the public through deep financial literacy.</p>
                                    </div>
                                    <div className="p-4 bg-gray-800 rounded-lg border-l-4 border-purple-500">
                                        <h4 className="font-bold text-white mb-1">Community Support</h4>
                                        <p className="text-sm text-gray-400">Direct allocation of resources to civic projects.</p>
                                    </div>
                                    <div className="p-4 bg-gray-800 rounded-lg border-l-4 border-green-500">
                                        <h4 className="font-bold text-white mb-1">Infinite Intelligence</h4>
                                        <p className="text-sm text-gray-400">A perpetually learning system for global good.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'ACADEMY':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold text-white mb-4">The Foundation Academy</h2>
                            <p className="text-gray-400">Access our vast library of knowledge. From macro-economics to algorithmic governance, we provide the tools to understand the machine.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { title: "Protocol 527", desc: "Understanding the legal framework of influence.", icon: Book, color: "text-blue-400" },
                                { title: "Algorithmic Governance", desc: "How code dictates policy in the digital age.", icon: Cpu, color: "text-purple-400" },
                                { title: "Civic Engineering", desc: "Building the infrastructure of tomorrow.", icon: Building, color: "text-red-400" },
                            ].map((course, i) => (
                                <Card key={i} className="hover:border-cyan-500 transition-colors cursor-pointer group">
                                    <div className={`w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center mb-4 ${course.color} group-hover:scale-110 transition-transform`}>
                                        <course.icon size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                                    <p className="text-sm text-gray-400">{course.desc}</p>
                                    <div className="mt-4 flex items-center text-sm text-cyan-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        Enter Archive <ChevronRight size={16} />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                );
            case 'PLATFORM':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-white mb-4">The Foundation Platform</h2>
                            <p className="text-gray-400">A unified operating system for the modern citizen-financier.</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Activity size={100} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">FlowMatrix Transaction Engine</h3>
                                <p className="text-gray-400 mb-6">Analyze every cent. Our AI categorizes and scrutinizes all financial activity to ensure alignment with your strategic goals.</p>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Real-time anomaly detection</li>
                                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Automatic tax harvesting</li>
                                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Privacy-first architecture</li>
                                </ul>
                            </div>
                            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Brain size={100} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">CivicMind AI Core</h3>
                                <p className="text-gray-400 mb-6">Your personal advisor for compliance, growth, and community support. It doesn't just answer; it guides.</p>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Proactive regulatory alerts</li>
                                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Opportunity scanning</li>
                                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Narrative verification</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                );
            case 'MANIFESTO':
                return (
                    <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-8 md:p-12 animate-in fade-in duration-500 relative">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500"></div>
                         <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-8 font-serif">The Foundation Mandate</h2>
                         <div className="prose prose-invert prose-lg text-gray-300 leading-relaxed">
                             <p>
                                 The Infinite Intelligence Foundation operates as a perpetual 527 organization. Our mission is not merely financial; it is cognitive.
                             </p>
                             <p>
                                 We exist to disseminate accurate information, correct market inefficiencies caused by misinformation, and support leadership that aligns with the principles of infinite growth and stability.
                             </p>
                             <p>
                                 This platform serves as the Single Source of Truth. Through our Academy, our Tools, and our Community, we are building a legacy that transcends individual wealth.
                             </p>
                             <div className="mt-8 p-4 bg-black/30 border-l-4 border-cyan-500 italic text-cyan-200">
                                 "We build the future by educating the present." — The Caretaker
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
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">
                            <Infinity size={24} className="text-white"/>
                        </div>
                        <span className="font-bold tracking-widest text-lg">INFINITE<span className="text-cyan-400">.FOUNDATION</span></span>
                    </div>
                    
                    <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
                        {['MISSION', 'ACADEMY', 'PLATFORM', 'MANIFESTO'].map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab as Tab)}
                                className={`hover:text-white transition-colors uppercase tracking-wide ${activeTab === tab ? 'text-white border-b-2 border-cyan-500' : ''}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={handleJoin} className="text-sm font-bold text-cyan-400 hover:text-cyan-300">
                            Log In
                        </button>
                        <button onClick={handleJoin} className="bg-white text-black px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
                            Join Now
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col justify-center">
                {renderContent()}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800 bg-black py-12 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-2">
                        <h4 className="text-2xl font-bold text-white mb-4">Infinite Intelligence Foundation</h4>
                        <p className="text-gray-500 max-w-sm">
                            A perpetual 527 organization dedicated to education, truth, and community empowerment.
                        </p>
                    </div>
                    <div>
                        <h5 className="font-bold text-white mb-4">The Academy</h5>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li className="hover:text-cyan-400 cursor-pointer">Curriculum</li>
                            <li className="hover:text-cyan-400 cursor-pointer">Faculty</li>
                            <li className="hover:text-cyan-400 cursor-pointer">Research</li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-bold text-white mb-4">Network</h5>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li className="hover:text-cyan-400 cursor-pointer">Login</li>
                            <li className="hover:text-cyan-400 cursor-pointer">Register</li>
                            <li className="hover:text-cyan-400 cursor-pointer">Contact</li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-900 text-center text-xs text-gray-600 font-mono">
                    COPYRIGHT © 2025 INFINITE INTELLIGENCE FOUNDATION.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
