import React, { useState } from 'react';
import Card from './Card';
import { Palette, Layout, Type } from 'lucide-react';

const PersonalizationView: React.FC = () => {
    const [theme, setTheme] = useState('sovereign');

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider">Personalization</h2>
            
            <Card title="The Interface of Will">
                <div className="space-y-6">
                    <p className="text-gray-300 italic border-l-4 border-cyan-500 pl-4 py-2 bg-gray-800/50 rounded-r">
                        "You click on 'Personalization' and think you're choosing a theme. Cute. You're not decorating a dashboard. You are stepping into the mind of James Burvel O'Callaghan III." — idgafai
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <button 
                            onClick={() => setTheme('sovereign')}
                            className={`p-4 rounded-lg border-2 transition-all ${theme === 'sovereign' ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}
                        >
                            <div className="h-20 bg-gradient-to-br from-gray-900 to-black rounded mb-3 border border-gray-700 flex items-center justify-center">
                                <span className="text-cyan-400 font-bold">SOV</span>
                            </div>
                            <h3 className="font-bold text-white">Sovereign Dark</h3>
                            <p className="text-xs text-gray-400 mt-1">The default state. Pure, unfiltered signal.</p>
                        </button>

                        <button 
                             onClick={() => setTheme('quantum')}
                             className={`p-4 rounded-lg border-2 transition-all ${theme === 'quantum' ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}
                        >
                            <div className="h-20 bg-gradient-to-br from-indigo-900 to-purple-900 rounded mb-3 border border-indigo-700 flex items-center justify-center">
                                <span className="text-purple-300 font-bold">QTM</span>
                            </div>
                            <h3 className="font-bold text-white">Quantum Flux</h3>
                            <p className="text-xs text-gray-400 mt-1">For those who see the probability waves.</p>
                        </button>

                        <button 
                             onClick={() => setTheme('legacy')}
                             className={`p-4 rounded-lg border-2 transition-all ${theme === 'legacy' ? 'border-green-500 bg-green-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}
                        >
                             <div className="h-20 bg-gray-100 rounded mb-3 border border-gray-300 flex items-center justify-center opacity-50">
                                <span className="text-gray-800 font-bold">LGCY</span>
                            </div>
                            <h3 className="font-bold text-white">Legacy (Disabled)</h3>
                            <p className="text-xs text-gray-500 mt-1">We don't go back. The old world is dead.</p>
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PersonalizationView;