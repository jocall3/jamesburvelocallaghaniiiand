import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { Globe, Activity, RefreshCw, AlertTriangle, Briefcase, DollarSign, TrendingUp } from 'lucide-react';

// --- Internal Data Generation ---
const generateRandomNumber = (min: number, max: number): number => Math.random() * (max - min) + min;
const generateCurrency = (): string => ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'][Math.floor(Math.random() * 6)];
const generateTrend = (): number => (Math.random() - 0.5) * 5; // Trend between -2.5% and +2.5%
const generateAmount = (currency: string): number => {
    if (currency === 'JPY') return Math.floor(generateRandomNumber(50_000_000, 200_000_000));
    return Math.floor(generateRandomNumber(1_000_000, 20_000_000));
};
const generateExchangeRate = (currency: string): number => {
    switch (currency) {
        case 'USD': return 1.0;
        case 'EUR': return generateRandomNumber(1.05, 1.10);
        case 'GBP': return generateRandomNumber(1.20, 1.30);
        case 'JPY': return generateRandomNumber(0.0065, 0.0070);
        case 'CAD': return generateRandomNumber(0.70, 0.75);
        case 'AUD': return generateRandomNumber(0.65, 0.70);
        default: return 1.0;
    }
};

const generateCashPositions = (count: number = 5): Array<{ currency: string; amount: number; rate: number; trend: number }> => {
    const positions = [];
    const usedCurrencies = new Set<string>();
    while (positions.length < count) {
        const currency = generateCurrency();
        if (!usedCurrencies.has(currency)) {
            const rate = generateExchangeRate(currency);
            positions.push({
                currency: currency,
                amount: generateAmount(currency),
                rate: rate,
                trend: generateTrend(),
            });
            usedCurrencies.add(currency);
        }
    }
    return positions;
};

const generateForecastData = (months: number = 12): Array<{ month: string; operating: number; investing: number; financing: number; net: number }> => {
    const data = [];
    for (let i = 0; i < months; i++) {
        const operating = generateRandomNumber(4000, 8000);
        const investing = generateRandomNumber(500, 2500);
        const financing = generateRandomNumber(-1500, -500);
        const net = operating + investing + financing;
        data.push({
            month: `Month ${i + 1}`,
            operating: operating,
            investing: investing,
            financing: financing,
            net: net,
        });
    }
    return data;
};

const generateDebtMaturityData = (): Array<{ year: string; amount: number }> => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
        year: (currentYear + i).toString(),
        amount: generateRandomNumber(200_000, 3_000_000),
    }));
};

// --- Internal Model Training & Simulation ---
const simulateRiskDetection = (): { level: 'low' | 'medium' | 'high'; message: string } => {
    const riskLevel = generateRandomNumber(0, 1);
    if (riskLevel < 0.6) return { level: 'low', message: 'All systems nominal.' };
    if (riskLevel < 0.9) return { level: 'medium', message: 'Minor FX volatility detected.' };
    return { level: 'high', message: 'Significant liquidity risk identified.' };
};

const simulateRegulatoryAlignment = (): boolean => generateRandomNumber(0, 1) > 0.1; // 90% chance of alignment

// --- Shared Kernel Components ---
const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-colors ${className}`}>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="text-cyan-400" size={20} /> {title}
        </h3>
        {children}
    </div>
);

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

// --- Treasury View Business Model ---
const TreasuryView: React.FC = () => {
    const [cashPositions, setCashPositions] = useState<Array<{ currency: string; amount: number; rate: number; trend: number }>>([]);
    const [forecastData, setForecastData] = useState<Array<{ month: string; operating: number; investing: number; financing: number; net: number }>>([]);
    const [debtMaturityData, setDebtMaturityData] = useState<Array<{ year: string; amount: number }>>([]);
    const [riskStatus, setRiskStatus] = useState<{ level: 'low' | 'medium' | 'high'; message: string }>({ level: 'low', message: '' });
    const [regulatoryStatus, setRegulatoryStatus] = useState<boolean>(true);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Initial data load
        setCashPositions(generateCashPositions());
        setForecastData(generateForecastData());
        setDebtMaturityData(generateDebtMaturityData());
        setRiskStatus(simulateRiskDetection());
        setRegulatoryStatus(simulateRegulatoryAlignment());

        // Simulate real-time updates
        intervalRef.current = setInterval(() => {
            setCashPositions(generateCashPositions());
            setForecastData(generateForecastData());
            setDebtMaturityData(generateDebtMaturityData());
            setRiskStatus(simulateRiskDetection());
            setRegulatoryStatus(simulateRegulatoryAlignment());
        }, 30000); // Update every 30 seconds

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const totalGlobalLiquidity = cashPositions.reduce((acc, curr) => acc + (curr.amount * curr.rate), 0);
    const formattedTotalLiquidity = `$${totalGlobalLiquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    const riskColorClass = riskStatus.level === 'high' ? 'border-red-500' : riskStatus.level === 'medium' ? 'border-yellow-500' : 'border-green-500';
    const regulatoryColorClass = regulatoryStatus ? 'border-green-500' : 'border-red-500';

    return (
        <div className="space-y-6 p-8 bg-gray-900 text-gray-300 min-h-screen font-sans">
            <div className="flex justify-between items-end border-b border-gray-700 pb-4">
                <div>
                    <h2 className="text-4xl font-bold text-white tracking-wider flex items-center gap-3">
                        <Globe className="text-cyan-400" size={36} /> Global Treasury Operations
                    </h2>
                    <p className="text-gray-400 mt-2 text-lg">Real-time liquidity management, FX exposure, and debt profiling.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Total Global Liquidity (USD Eqv)</p>
                    <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500">
                        {formattedTotalLiquidity}
                    </p>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cashPositions.map(pos => (
                    <MetricTile
                        key={pos.currency}
                        label={`${pos.currency} Position`}
                        value={pos.amount.toLocaleString(undefined, { style: 'currency', currency: pos.currency })}
                        subValue={`${pos.trend > 0 ? '+' : ''}${pos.trend.toFixed(2)}% vs prev day`}
                        trend={pos.trend > 0 ? 'up' : 'down'}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Liquidity Forecast */}
                <Card title="12-Month Liquidity Forecast" className="lg:col-span-2 h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorOperating" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.7}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                                </linearGradient>
                                <linearGradient id="colorFinancing" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.7}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.2}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(val: number) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            />
                            <Legend wrapperStyle={{ color: '#9ca3af' }} />
                            <Area type="monotone" dataKey="net" stroke="#06b6d4" fillOpacity={1} fill="url(#colorNet)" name="Net Cash Flow" />
                            <Area type="monotone" dataKey="operating" stroke="#10b981" fillOpacity={0.6} fill="url(#colorOperating)" strokeDasharray="5 5" name="Operating" />
                            <Area type="monotone" dataKey="financing" stroke="#f43f5e" fillOpacity={0.6} fill="url(#colorFinancing)" strokeDasharray="3 3" name="Financing" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* Actions & Alerts */}
                <div className="flex flex-col gap-6">
                    <Card title="Quick Actions">
                        <div className="space-y-3">
                            <button className="w-full p-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl">
                                <RefreshCw size={16} /> Initiate Internal Transfer / Sweep
                            </button>
                            <button className="w-full p-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl">
                                <Activity size={16} /> Execute FX Spot Trade
                            </button>
                            <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl">
                                <Briefcase size={16} /> Manage Debt Facility
                            </button>
                        </div>
                    </Card>

                    <Card title="Risk & Compliance Status" className={`flex-grow border-l-4 ${riskColorClass}`}>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className={`shrink-0 mt-1 ${riskStatus.level === 'high' ? 'text-red-500' : riskStatus.level === 'medium' ? 'text-yellow-500' : 'text-green-500'}`} size={20} />
                                <div>
                                    <p className="text-sm font-bold text-white capitalize">{riskStatus.level} Risk Level</p>
                                    <p className="text-xs text-gray-400">{riskStatus.message}</p>
                                </div>
                            </div>
                            <div className={`flex items-start gap-3 border-t border-gray-700 pt-4 ${regulatoryColorClass}`}>
                                <TrendingUp className={`shrink-0 mt-1 ${regulatoryStatus ? 'text-green-500' : 'text-red-500'}`} size={20} />
                                <div>
                                    <p className="text-sm font-bold text-white">Regulatory Alignment</p>
                                    <p className="text-xs text-gray-400">{regulatoryStatus ? 'Fully compliant with current regulations.' : 'Potential compliance gap detected.'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Debt Maturity Profile */}
            <Card title="Debt Maturity Profile">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={debtMaturityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                formatter={(val: number) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            />
                            <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} name="Principal Due" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default TreasuryView;