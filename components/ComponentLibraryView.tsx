import React from 'react';
import { Cpu, Shield, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

const ComponentLibraryView: React.FC = () => {
    return (
        <div className="p-6 space-y-8 text-white">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                    Component Library
                </h1>
                <p className="text-gray-400 mt-2">
                    A collection of reusable UI components used throughout the AI Banking University platform.
                </p>
            </div>

            {/* Buttons Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-cyan-400 border-b border-gray-700 pb-2">Buttons</h2>
                <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full transition-all shadow-lg shadow-cyan-500/50">
                        Primary Action
                    </button>
                    <button className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full transition-all shadow-lg shadow-purple-500/50">
                        Secondary Action
                    </button>
                    <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full transition-all">
                        Neutral Action
                    </button>
                    <button className="px-6 py-2 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 font-bold rounded-full transition-all">
                        Outline Action
                    </button>
                </div>
            </section>

            {/* Cards Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-cyan-400 border-b border-gray-700 pb-2">Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-cyan-400/50 transition-all">
                        <div className="mb-4 p-3 bg-gray-900 rounded-full w-fit">
                            <Cpu className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Feature Card</h3>
                        <p className="text-gray-400 text-sm">Standard card component used for features or dashboard widgets.</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold">Stat Card</h3>
                            <Activity className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">$1,234.56</div>
                        <div className="text-green-400 text-sm flex items-center">
                            +12.5% <span className="text-gray-500 ml-1">vs last month</span>
                        </div>
                    </div>

                    <div className="bg-red-900/20 p-6 rounded-xl border border-red-500/30">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-5 h-5 text-red-400" />
                            <h3 className="text-lg font-semibold text-red-200">Alert Card</h3>
                        </div>
                        <p className="text-red-300/80 text-sm">Used for critical warnings or security alerts within the system.</p>
                    </div>
                </div>
            </section>

            {/* Form Elements */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-cyan-400 border-b border-gray-700 pb-2">Form Elements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Input Field</label>
                        <input 
                            type="text" 
                            placeholder="Enter value..." 
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Select Menu</label>
                        <select className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors">
                            <option>Option 1</option>
                            <option>Option 2</option>
                            <option>Option 3</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Status Indicators */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-cyan-400 border-b border-gray-700 pb-2">Status Indicators</h2>
                <div className="flex flex-wrap gap-4">
                    <span className="flex items-center gap-2 px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm border border-green-500/30">
                        <CheckCircle className="w-4 h-4" /> Active
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-sm border border-yellow-500/30">
                        <AlertTriangle className="w-4 h-4" /> Pending
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-sm border border-red-500/30">
                        <Shield className="w-4 h-4" /> Blocked
                    </span>
                </div>
            </section>
        </div>
    );
};

export default ComponentLibraryView;