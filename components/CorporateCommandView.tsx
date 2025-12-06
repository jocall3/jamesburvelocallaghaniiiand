

import React, { useContext, useState, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { View, PaymentOrder, Invoice, ComplianceCase, CorporateTransaction } from '../types';
import { GoogleGenAI } from '@google/genai';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

// Analytics Data Structures

export type TimeSeriesData = {
    date: string;
    value: number;
    secondaryValue?: number;
    tertiaryValue?: number;
};

export type CategoricalData = {
    category: string;
    value: number;
    percentage?: number;
    color?: string;
};

export type FinancialRatio = {
    name: string;
    value: number;
    benchmark: number;
    status: 'Healthy' | 'Warning' | 'Critical';
    delta: number;
};

export type VendorPerformanceMetric = {
    vendor: string;
    totalSpend: number;
    transactionCount: number;
    avgTransactionValue: number;
    riskScore: number;
    lastInteraction: string;
};

export type DepartmentalKPI = {
    department: string;
    budgetUtilization: number;
    operationalEfficiency: number;
    complianceScore: number;
    headcountSpend: number;
};

export type RiskAssessmentData = {
    riskCategory: string;
    probability: number;
    impact: number;
    mitigationStatus: string;
    exposureValue: number;
};

export type CashFlowProjection = {
    period: string;
    inflow: number;
    outflow: number;
    netPosition: number;
    cumulativeCash: number;
};

export type AuditLogEntry = {
    timestamp: string;
    user: string;
    action: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    details: string;
};

export type TaxLiabilityBreakdown = {
    jurisdiction: string;
    taxType: string;
    estimatedAmount: number;
    dueDate: string;
    status: 'Accrued' | 'Paid' | 'Pending';
};

// Data Processing Functions

/**
 * Generates daily transaction volume and amount analytics.
 */
export const generateDailyTransactionAnalytics = (transactions: CorporateTransaction[]): TimeSeriesData[] => {
    const dailyMap: Record<string, { count: number; amount: number }> = {};
    transactions.forEach(tx => {
        const date = new Date(tx.date).toISOString().split('T')[0];
        if (!dailyMap[date]) dailyMap[date] = { count: 0, amount: 0 };
        dailyMap[date].count++;
        dailyMap[date].amount += tx.amount;
    });
    return Object.entries(dailyMap)
        .map(([date, data]) => ({ date, value: data.amount, secondaryValue: data.count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Calculates key financial ratios.
 */
export const calculateEnterpriseFinancialRatios = (invoices: Invoice[], orders: PaymentOrder[], transactions: CorporateTransaction[]): FinancialRatio[] => {
    const currentAssets = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0);
    const currentLiabilities = orders.filter(o => o.status !== 'paid').reduce((sum, o) => sum + o.amount, 0);
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const netProfitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    const burnRate = totalExpenses / 30; // Simplified 30-day period for calculation
    
    return [
        { name: 'Current Ratio', value: currentRatio, benchmark: 1.5, status: currentRatio > 1.5 ? 'Healthy' : currentRatio > 1.0 ? 'Warning' : 'Critical', delta: 0.1 },
        { name: 'Net Profit Margin', value: netProfitMargin, benchmark: 20, status: netProfitMargin > 20 ? 'Healthy' : netProfitMargin > 10 ? 'Warning' : 'Critical', delta: -2.5 },
        { name: 'Daily Burn Rate', value: burnRate, benchmark: 5000, status: burnRate < 5000 ? 'Healthy' : 'Warning', delta: 12.4 }
    ];
};

/**
 * Projects cash flow for the next 6 periods.
 */
export const generateCashFlowProjections = (invoices: Invoice[], orders: PaymentOrder[]): CashFlowProjection[] => {
    const projections: CashFlowProjection[] = [];
    const today = new Date();
    let currentCash = 1000000; // Initial capital assumption

    for (let i = 0; i < 6; i++) {
        const futureDate = new Date(today);
        futureDate.setMonth(today.getMonth() + i);
        const periodKey = futureDate.toISOString().substring(0, 7);
        
        // Estimated inflows from receivables
        const projectedInflow = invoices
            .filter(inv => new Date(inv.dueDate).getMonth() === futureDate.getMonth())
            .reduce((sum, inv) => sum + inv.amount, 0) * 0.95; // Assumed 95% collection rate

        // Estimated outflows from payables and recurring expenses
        const projectedOutflow = orders
            .filter(ord => new Date(ord.dueDate || '').getMonth() === futureDate.getMonth())
            .reduce((sum, ord) => sum + ord.amount, 0) * 1.1; // Assumed 10% buffer for variable costs

        const net = projectedInflow - projectedOutflow;
        currentCash += net;

        projections.push({
            period: periodKey,
            inflow: projectedInflow,
            outflow: projectedOutflow,
            netPosition: net,
            cumulativeCash: currentCash
        });
    }
    return projections;
};

/**
 * Analyzes vendor performance and spend.
 */
export const analyzeVendorEcosystem = (transactions: CorporateTransaction[]): VendorPerformanceMetric[] => {
    const vendorMap: Record<string, VendorPerformanceMetric> = {};
    
    transactions.forEach(tx => {
        if (!vendorMap[tx.merchant]) {
            vendorMap[tx.merchant] = {
                vendor: tx.merchant,
                totalSpend: 0,
                transactionCount: 0,
                avgTransactionValue: 0,
                riskScore: Math.floor(Math.random() * 100), // Simulated risk score
                lastInteraction: tx.date
            };
        }
        const v = vendorMap[tx.merchant];
        v.totalSpend += tx.amount;
        v.transactionCount++;
        v.avgTransactionValue = v.totalSpend / v.transactionCount;
        if (new Date(tx.date) > new Date(v.lastInteraction)) {
            v.lastInteraction = tx.date;
        }
    });

    return Object.values(vendorMap).sort((a, b) => b.totalSpend - a.totalSpend);
};

/**
 * Segments operational spend into categories.
 */
export const segmentOperationalSpend = (transactions: CorporateTransaction[]): CategoricalData[] => {
    const categories = {
        'Fixed Infrastructure': 0,
        'Variable COGS': 0,
        'R&D Investment': 0,
        'Sales & Marketing': 0,
        'G&A': 0
    };

    transactions.forEach(tx => {
        if (tx.merchant.includes('Rent') || tx.merchant.includes('AWS') || tx.merchant.includes('Server')) categories['Fixed Infrastructure'] += tx.amount;
        else if (tx.merchant.includes('Supplier') || tx.merchant.includes('Logistics')) categories['Variable COGS'] += tx.amount;
        else if (tx.description.includes('Research') || tx.description.includes('Lab')) categories['R&D Investment'] += tx.amount;
        else if (tx.merchant.includes('Ads') || tx.merchant.includes('Google') || tx.merchant.includes('Facebook')) categories['Sales & Marketing'] += tx.amount;
        else categories['G&A'] += tx.amount;
    });

    return Object.entries(categories).map(([category, value]) => ({ category, value }));
};

/**
 * Estimates tax liabilities.
 */
export const estimateTaxLiabilities = (revenue: number, expenses: number): TaxLiabilityBreakdown[] => {
    const profit = Math.max(0, revenue - expenses);
    return [
        { jurisdiction: 'Federal', taxType: 'Corporate Income Tax', estimatedAmount: profit * 0.21, dueDate: '2024-04-15', status: 'Accrued' },
        { jurisdiction: 'State (CA)', taxType: 'Franchise Tax', estimatedAmount: profit * 0.0884, dueDate: '2024-04-15', status: 'Accrued' },
        { jurisdiction: 'International', taxType: 'VAT/GST', estimatedAmount: revenue * 0.05, dueDate: 'Monthly', status: 'Pending' },
        { jurisdiction: 'Local', taxType: 'Payroll Tax', estimatedAmount: expenses * 0.0765, dueDate: 'Bi-Weekly', status: 'Paid' }
    ];
};

/**
 * Generates risk assessment data.
 */
export const generateEnterpriseRiskHeatmap = (cases: ComplianceCase[], transactions: CorporateTransaction[]): RiskAssessmentData[] => {
    const risks: RiskAssessmentData[] = [
        { riskCategory: 'AML/KYC', probability: 0.15, impact: 0.9, mitigationStatus: 'Monitoring', exposureValue: 500000 },
        { riskCategory: 'Data Privacy (GDPR)', probability: 0.05, impact: 0.95, mitigationStatus: 'Controlled', exposureValue: 2000000 },
        { riskCategory: 'Vendor Fraud', probability: 0.2, impact: 0.4, mitigationStatus: 'Active Investigation', exposureValue: 150000 },
        { riskCategory: 'Tax Compliance', probability: 0.1, impact: 0.7, mitigationStatus: 'Audited', exposureValue: 750000 },
        { riskCategory: 'Cybersecurity', probability: 0.3, impact: 0.99, mitigationStatus: 'Hardened', exposureValue: 5000000 }
    ];

    // Adjusts risk based on data
    if (cases.some(c => c.type === 'AML')) risks[0].probability += 0.2;
    if (transactions.some(t => t.amount > 50000)) risks[2].probability += 0.1;

    return risks;
};

// Main Component

interface CorporateDashboardProps {
    setActiveView?: (view: View) => void;
}

const CorporateCommandView: React.FC<CorporateDashboardProps> = ({ setActiveView }) => {
    const context = useContext(DataContext);
    
    // State Management
    const [activeTab, setActiveTab] = useState<'Overview' | 'Finance' | 'Operations' | 'Risk' | 'Strategy'>('Overview');
    const [aiInsight, setAiInsight] = useState<string>('Initializing AI...');
    const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    if (!context) throw new Error("CorporateCommandView requires DataContext.");
    const { paymentOrders, invoices, complianceCases, corporateTransactions } = context;

    // Data Aggregation
    
    // Financials
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0);
    const totalExpenses = corporateTransactions.reduce((acc, t) => acc + t.amount, 0);
    const netIncome = totalRevenue - totalExpenses;
    const financialRatios = calculateEnterpriseFinancialRatios(invoices, paymentOrders, corporateTransactions);
    const cashFlowForecast = generateCashFlowProjections(invoices, paymentOrders);
    const taxLiabilities = estimateTaxLiabilities(totalRevenue, totalExpenses);

    // Operations
    const dailyVolume = generateDailyTransactionAnalytics(corporateTransactions);
    const operationalSpend = segmentOperationalSpend(corporateTransactions);
    const vendorMetrics = analyzeVendorEcosystem(corporateTransactions);
    const topVendors = vendorMetrics.slice(0, 5);
    
    // Risk
    const riskHeatmap = generateEnterpriseRiskHeatmap(complianceCases, corporateTransactions);
    const openComplianceCases = complianceCases.filter(c => c.status === 'open');
    const criticalRisks = riskHeatmap.filter(r => r.probability * r.impact > 0.15);

    // AI Integration
    useEffect(() => {
        const generateStrategicReport = async () => {
            setIsAiProcessing(true);
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                
                let promptContext = '';
                if (activeTab === 'Overview') {
                    promptContext = `Executive Summary: Revenue $${totalRevenue}, Expenses $${totalExpenses}, Net Income $${netIncome}. Critical Risks: ${criticalRisks.length}. Top Vendor: ${topVendors[0]?.vendor}.`;
                } else if (activeTab === 'Finance') {
                    promptContext = `Financial Deep Dive: Current Ratio ${financialRatios[0].value.toFixed(2)}, Net Margin ${financialRatios[1].value.toFixed(2)}%. Cash Flow Trend: ${cashFlowForecast[0].netPosition > 0 ? 'Positive' : 'Negative'}. Tax Liability: $${taxLiabilities.reduce((s, t) => s + t.estimatedAmount, 0).toFixed(2)}.`;
                } else if (activeTab === 'Operations') {
                    promptContext = `Ops Report: Transaction Volume ${dailyVolume.length} days active. Top Spend Category: ${operationalSpend.sort((a,b) => b.value - a.value)[0]?.category}. Vendor Count: ${vendorMetrics.length}.`;
                } else if (activeTab === 'Risk') {
                    promptContext = `Risk Assessment: Open Cases ${openComplianceCases.length}. Highest Risk Category: ${riskHeatmap.sort((a,b) => b.probability - a.probability)[0]?.riskCategory}. Exposure: $${riskHeatmap.reduce((s,r) => s + r.exposureValue, 0)}.`;
                } else {
                    promptContext = `Strategic Outlook: Based on burn rate of $${financialRatios[2].value.toFixed(2)}/day and projected cash flow. Suggest 3 strategic moves for growth and stability.`;
                }

                const prompt = `You are an advanced Corporate AI Assistant. Analyze the following data context for the '${activeTab}' view and provide a high-level, professional, actionable strategic insight (max 2 sentences). Context: ${promptContext}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                setAiInsight(response.text);
                setLastUpdated(new Date());
            } catch (error) {
                console.error("AI Processing Error:", error);
                setAiInsight("AI link unavailable. Using fallback data.");
            } finally {
                setIsAiProcessing(false);
            }
        };

        generateStrategicReport();
    }, [activeTab, totalRevenue, totalExpenses, netIncome]);

    // Visualization Utilities
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
    
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(val);
    const formatNumber = (val: number) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val);

    // Inline Sub-Components
    
    const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`px-6 py-3 text-sm font-bold tracking-wide transition-all duration-200 border-b-2 ${
                activeTab === id 
                ? 'border-blue-500 text-white bg-gray-800/50' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
        >
            {label}
        </button>
    );

    const MetricCard: React.FC<{ title: string, value: string, subtext?: string, trend?: number, color?: string }> = ({ title, value, subtext, trend, color = 'blue' }) => (
        <div className={`bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg relative overflow-hidden group hover:border-${color}-500 transition-colors`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">{title}</h3>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            {subtext && <div className="text-gray-500 text-sm">{subtext}</div>}
            {trend !== undefined && (
                <div className={`text-sm font-medium mt-3 flex items-center ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% <span className="text-gray-600 ml-1">vs last period</span>
                </div>
            )}
        </div>
    );

    // Component Rendering

    return (
        <div className="min-h-screen bg-gray-900 text-white p-2 space-y-8 font-sans">
            
            {/* HEADER & NAVIGATION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        NEXUS COMMAND
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Enterprise Operating System v4.2.0 • {lastUpdated.toLocaleString()}</p>
                </div>
                <div className="flex space-x-1 mt-4 md:mt-0 bg-gray-900 rounded-lg p-1 border border-gray-800">
                    <TabButton id="Overview" label="EXECUTIVE" />
                    <TabButton id="Finance" label="FINANCE" />
                    <TabButton id="Operations" label="OPERATIONS" />
                    <TabButton id="Risk" label="RISK & COMPLIANCE" />
                    <TabButton id="Strategy" label="STRATEGY" />
                </div>
            </div>

            {/* AI INSIGHT BAR */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-xl rounded-lg" />
                <Card className="relative bg-gray-800/80 backdrop-blur border border-blue-500/30 p-6">
                    <div className="flex items-start space-x-4">
                        <div className="p-3 bg-blue-500/10 rounded-full animate-pulse">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">AI Strategic Intelligence</h3>
                            {isAiProcessing ? (
                                <div className="h-6 bg-gray-700 rounded w-3/4 animate-pulse" />
                            ) : (
                                <p className="text-lg text-gray-100 leading-relaxed font-light">"{aiInsight}"</p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* DYNAMIC CONTENT AREA */}
            <div className="space-y-8 animate-fade-in">
                
                {/* OVERVIEW TAB */}
                {activeTab === 'Overview' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricCard title="Total Revenue (YTD)" value={formatCurrency(totalRevenue)} trend={12.5} color="green" />
                            <MetricCard title="Net Income" value={formatCurrency(netIncome)} trend={8.2} color="blue" />
                            <MetricCard title="Active Risks" value={criticalRisks.length.toString()} subtext="Critical Severity" trend={-5.0} color="red" />
                            <MetricCard title="Cash Runway" value="14.2 Months" subtext="Based on current burn" color="purple" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
                            <Card title="Revenue vs Expenses Trend" className="lg:col-span-2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cashFlowForecast}>
                                        <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
                                        <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                        <Legend />
                                        <Bar dataKey="inflow" name="Inflow" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="outflow" name="Outflow" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                            <Card title="Operational Spend Mix" className="h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={operationalSpend} dataKey="value" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                            {operationalSpend.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>
                        </div>
                    </>
                )}

                {/* FINANCE TAB */}
                {activeTab === 'Finance' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {financialRatios.map((ratio, idx) => (
                                <MetricCard 
                                    key={idx} 
                                    title={ratio.name} 
                                    value={typeof ratio.value === 'number' && ratio.value < 100 ? ratio.value.toFixed(2) : formatNumber(ratio.value)} 
                                    subtext={`Benchmark: ${ratio.benchmark}`}
                                    trend={ratio.delta}
                                    color={ratio.status === 'Healthy' ? 'green' : ratio.status === 'Warning' ? 'yellow' : 'red'}
                                />
                            ))}
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card title="Projected Cash Position (6 Months)" className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cashFlowForecast}>
                                        <XAxis dataKey="period" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" tickFormatter={(val) => `$${val/1000}k`} />
                                        <Tooltip cursor={{fill: '#374151'}} contentStyle={{ backgroundColor: '#1f2937' }} />
                                        <Bar dataKey="cumulativeCash" fill="#3b82f6" name="Cash Balance" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                            <Card title="Estimated Tax Liability Breakdown" className="h-80 overflow-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-gray-800 text-gray-200 uppercase font-bold">
                                        <tr>
                                            <th className="p-3">Jurisdiction</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3 text-right">Amount</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {taxLiabilities.map((tax, i) => (
                                            <tr key={i} className="hover:bg-gray-800/50">
                                                <td className="p-3">{tax.jurisdiction}</td>
                                                <td className="p-3">{tax.taxType}</td>
                                                <td className="p-3 text-right font-mono text-white">{formatCurrency(tax.estimatedAmount)}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${tax.status === 'Paid' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                                        {tax.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        </div>
                    </>
                )}

                {/* OPERATIONS TAB */}
                {activeTab === 'Operations' && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card title="Daily Transaction Volume" className="lg:col-span-2 h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyVolume}>
                                        <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickFormatter={(d) => d.substring(5)} />
                                        <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                                        <Bar yAxisId="left" dataKey="value" fill="#3b82f6" name="Volume ($)" opacity={0.8} />
                                        <Bar yAxisId="right" dataKey="secondaryValue" fill="#10b981" name="Count" barSize={10} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                            <Card title="Top Vendor Ecosystem" className="h-96 overflow-auto">
                                <div className="space-y-4">
                                    {topVendors.map((vendor, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700">
                                            <div>
                                                <div className="font-bold text-white">{vendor.vendor}</div>
                                                <div className="text-xs text-gray-500">{vendor.transactionCount} txns • Risk: {vendor.riskScore}/100</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-blue-400">{formatCurrency(vendor.totalSpend)}</div>
                                                <div className="text-xs text-gray-500">Avg: {formatCurrency(vendor.avgTransactionValue)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </>
                )}

                {/* RISK TAB */}
                {activeTab === 'Risk' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricCard title="Compliance Score" value="94.2" subtext="Top 5% Industry" color="green" />
                            <MetricCard title="Open Cases" value={openComplianceCases.length.toString()} subtext="Requires Attention" color="yellow" />
                            <MetricCard title="Total Risk Exposure" value={formatCurrency(riskHeatmap.reduce((a,b)=>a+b.exposureValue,0))} color="red" />
                            <MetricCard title="Audit Anomalies" value="3" subtext="Last 24 Hours" color="purple" />
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card title="Enterprise Risk Heatmap" className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={riskHeatmap} layout="vertical" margin={{ left: 40 }}>
                                        <XAxis type="number" domain={[0, 1]} hide />
                                        <YAxis type="category" dataKey="riskCategory" stroke="#9ca3af" width={120} fontSize={11} />
                                        <Tooltip cursor={{fill: 'transparent'}} content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-xl">
                                                        <p className="font-bold text-white">{data.riskCategory}</p>
                                                        <p className="text-sm text-gray-400">Prob: {(data.probability * 100).toFixed(0)}% | Impact: {(data.impact * 100).toFixed(0)}%</p>
                                                        <p className="text-sm text-red-400">Exposure: {formatCurrency(data.exposureValue)}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }} />
                                        <Bar dataKey="probability" name="Probability" stackId="a" fill="#f59e0b" barSize={20} />
                                        <Bar dataKey="impact" name="Impact" stackId="a" fill="#ef4444" barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                            <Card title="Compliance Case Log" className="h-96 overflow-auto">
                                <div className="space-y-2">
                                    {complianceCases.map((c, i) => (
                                        <div key={i} className="p-3 border-l-4 border-red-500 bg-gray-800/50 rounded flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-sm text-white">{c.type} Violation</div>
                                                <div className="text-xs text-gray-500">{c.description}</div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded font-bold ${c.status === 'open' ? 'bg-red-900 text-red-200' : 'bg-gray-700 text-gray-300'}`}>
                                                {c.status.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                    {complianceCases.length === 0 && <div className="text-center text-gray-500 py-10">No active compliance cases detected. Systems nominal.</div>}
                                </div>
                            </Card>
                        </div>
                    </>
                )}

                {/* STRATEGY TAB */}
                {activeTab === 'Strategy' && (
                    <div className="grid grid-cols-1 gap-6">
                        <Card title="Strategic Growth Modeling" className="p-8 bg-gradient-to-br from-gray-800 to-gray-900">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 space-y-6">
                                    <h3 className="text-2xl font-bold text-white">Scenario Analysis: Aggressive Expansion</h3>
                                    <p className="text-gray-400">
                                        Based on current liquidity of {formatCurrency(financialRatios[0].value * 1000000)} and a burn rate of {formatCurrency(financialRatios[2].value)}, 
                                        the enterprise can sustain a 15% increase in R&D spend for 8 months before requiring additional capital injection.
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-gray-300">
                                            <span>Market Penetration Probability</span>
                                            <span>78%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-gray-300">
                                            <span>Regulatory Approval Confidence</span>
                                            <span>92%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full md:w-1/3 bg-gray-800 p-6 rounded-xl border border-gray-700">
                                    <h4 className="font-bold text-white mb-4">AI Recommendation Engine</h4>
                                    <ul className="space-y-4">
                                        <li className="flex items-start space-x-3">
                                            <span className="text-green-400 text-xl">✓</span>
                                            <span className="text-sm text-gray-300">Optimize vendor contracts to reduce variable OPEX by 12%.</span>
                                        </li>
                                        <li className="flex items-start space-x-3">
                                            <span className="text-green-400 text-xl">✓</span>
                                            <span className="text-sm text-gray-300">Accelerate receivables collection to improve DSO by 5 days.</span>
                                        </li>
                                        <li className="flex items-start space-x-3">
                                            <span className="text-yellow-400 text-xl">⚠</span>
                                            <span className="text-sm text-gray-300">Monitor geopolitical risk in supply chain region APAC-1.</span>
                                        </li>
                                    </ul>
                                    <button className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors" onClick={() => setActiveView && setActiveView(View.Budgets)}>
                                        Adjust Budgets
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CorporateCommandView;
