
import React, { useState } from 'react';
import Card from './Card';
import { DollarSign, TrendingUp, Globe, Activity, RefreshCw, AlertTriangle, Briefcase } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

// --- Mock Data ---
const CASH_POSITIONS = [
    { currency: 'USD', amount: 12500000, rate: 1.0, trend: 2.5 },
    { currency: 'EUR', amount: 4500000, rate: 1.08, trend: -0.5 },
    { currency: 'GBP', amount: 2100000, rate: 1.26, trend: 1.2 },
    { currency: 'JPY', amount: 150000000, rate: 0.0067, trend: -1.8 },
];

const FORECAST_DATA = Array.from({length: 12}, (_, i) => ({
    month: `Month ${i+1}`,
    operating: 5000 + Math.random() * 2000,
    investing: 1000 + Math.random() * 3000,
    financing: -1000 - Math.random() * 500,
    net: 0
})).map(d => ({...d, net: d.operating + d.investing + d.financing}));

// --- Helper Components ---
const MetricTile: React.FC<{ label: string; value: string; subValue?: string; trend?: 'up' | 'down' }> = ({ label, value, subValue, trend }) => (
    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-colors">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subValue && (
            <p className={`text-xs mt-1 flex items-center ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-500'}`}>
                {trend === 'up' ? '▲' : trend === 'down' ? '▼' : ''} {subValue}
            </p>
        )}
    </div>
);

const TreasuryView: React.FC = () => {
    const [activeCurrency, setActiveCurrency] = useState('USD');

    const totalGlobalLiquidity = CASH_POSITIONS.reduce((acc, curr) => acc + (curr.amount * curr.rate), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-wider flex items-center gap-3">
                        <Globe className="text-cyan-400" /> Global Treasury
                    </h2>
                    <p className="text-gray-400 mt-1">Real-time liquidity management and FX exposure.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase">Total Global Liquidity (USD Eqv)</p>
                    <p className="text-4xl font-extrabold text-white text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500">
                        ${totalGlobalLiquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                </div>
            </div>

            {/* Cash Positions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {CASH_POSITIONS.map(pos => (
                    <MetricTile 
                        key={pos.currency}
                        label={`${pos.currency} Position`}
                        value={pos.amount.toLocaleString(undefined, { style: 'currency', currency: pos.currency })}
                        subValue={`${pos.trend > 0 ? '+' : ''}${pos.trend}% vs prev day`}
                        trend={pos.trend > 0 ? 'up' : 'down'}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Liquidity Forecast */}
                <Card title="12-Month Liquidity Forecast" className="lg:col-span-2 h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={FORECAST_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                formatter={(val: number) => `$${val.toLocaleString()}`}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="net" stroke="#06b6d4" fillOpacity={1} fill="url(#colorNet)" name="Net Cash Flow" />
                            <Area type="monotone" dataKey="operating" stroke="#10b981" fillOpacity={0} strokeDasharray="5 5" name="Operating" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* Actions & Alerts */}
                <div className="flex flex-col gap-6">
                    <Card title="Quick Actions">
                        <div className="space-y-3">
                            <button className="w-full p-3 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                <RefreshCw size={16} /> Internal Transfer / Sweep
                            </button>
                            <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                <Activity size={16} /> FX Spot Trade
                            </button>
                            <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                <Briefcase size={16} /> Manage Debt Facility
                            </button>
                        </div>
                    </Card>

                    <Card title="Exposure Alerts" className="flex-grow border-l-4 border-yellow-500">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-yellow-500 shrink-0 mt-1" size={18} />
                                <div>
                                    <p className="text-sm font-bold text-white">JPY Exposure High</p>
                                    <p className="text-xs text-gray-400">Current JPY holdings exceed hedging policy limit by 12%.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Activity className="text-cyan-500 shrink-0 mt-1" size={18} />
                                <div>
                                    <p className="text-sm font-bold text-white">Yield Optimization</p>
                                    <p className="text-xs text-gray-400">Found 3 overnight sweep opportunities offering +0.4% APY.</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            
            {/* Debt Profile */}
            <Card title="Debt Maturity Profile">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                            { year: '2024', amount: 500000 },
                            { year: '2025', amount: 1200000 },
                            { year: '2026', amount: 800000 },
                            { year: '2027', amount: 2500000 },
                            { year: '2028', amount: 1500000 },
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="year" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" tickFormatter={(val) => `$${val/1000000}M`} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
                            <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} name="Principal Due" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default TreasuryView;
