
import React, { useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { View, StripeBalance, StripeCharge, StripeCustomer, StripeSubscription, AIInsight } from '../types';

// --- Expanded Data Models for Hyper-Dimensional Financial Analysis ---

interface TransactionMetadata {
    ip_address: string;
    geo_location: { country: string; city: string; lat: number; lon: number; };
    device_fingerprint: string;
    risk_score: number; // 0-100
    risk_vector: 'GEO_MISMATCH' | 'VELOCITY_SPIKE' | 'PROXY_DETECTED' | 'NORMAL';
    // --- GEIN Features Start ---
    user_agent: string;
    session_duration_sec: number;
    is_vpn: boolean;
    is_tor: boolean;
    browser_language: string;
    payment_method_type: 'card' | 'bank_transfer' | 'crypto' | 'wallet';
    card_bin: string;
    card_last4: string;
    card_brand: 'Visa' | 'Mastercard' | 'Amex';
    is_3d_secure: boolean;
    feature_1: number; feature_2: string; feature_3: boolean; feature_4: number; feature_5: string;
    feature_6: number; feature_7: string; feature_8: boolean; feature_9: number; feature_10: string;
    // --- GEIN Features End ---
}

interface ExpandedStripeCharge extends StripeCharge {
    metadata: TransactionMetadata;
    type: 'charge' | 'payout' | 'refund' | 'fee';
    // --- GEIN Features Start ---
    fraud_details: {
        user_report: 'safe' | 'fraudulent';
        stripe_report: 'safe' | 'fraudulent';
    };
    dispute_status: 'won' | 'lost' | 'under_review' | 'none';
    payout_id: string | null;
    reversal_id: string | null;
    fee_details: { amount: number; currency: string; type: 'stripe_fee' | 'application_fee' }[];
    source_of_funds: 'credit' | 'debit' | 'prepaid';
    network_status: 'available' | 'degraded' | 'offline';
    processing_latency_ms: number;
    feature_11: number; feature_12: string; feature_13: boolean; feature_14: number; feature_15: string;
    feature_16: number; feature_17: string; feature_18: boolean; feature_19: number; feature_20: string;
    // --- GEIN Features End ---
}

interface CustomerNote {
    id: string;
    text: string;
    timestamp: number;
    author: 'AI System' | 'Support Agent' | 'Compliance Bot' | 'Gein Engine';
}

interface ExpandedStripeCustomer extends StripeCustomer {
    notes: CustomerNote[];
    segment: 'VIP' | 'High-Value' | 'Standard' | 'At-Risk' | 'Dormant';
    last_login_ip: string;
    // --- GEIN Features Start ---
    kyc_status: 'verified' | 'pending' | 'failed' | 'unverified';
    lifetime_value: number;
    average_order_value: number;
    churn_probability: number; // 0-1
    marketing_consent: boolean;
    last_contacted_date: number;
    support_ticket_count: number;
    behavioral_score: number; // 0-1000
    feature_21: number; feature_22: string; feature_23: boolean; feature_24: number; feature_25: string;
    feature_26: number; feature_27: string; feature_28: boolean; feature_29: number; feature_30: string;
    feature_31: number; feature_32: string; feature_33: boolean; feature_34: number; feature_35: string;
    feature_36: number; feature_37: string; feature_38: boolean; feature_39: number; feature_40: string;
    // --- GEIN Features End ---
}

interface ExpandedStripeSubscription extends StripeSubscription {
    // --- GEIN Features Start ---
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    churn_date: number | null;
    activation_channel: 'organic' | 'paid' | 'referral';
    feature_41: number; feature_42: string; feature_43: boolean; feature_44: number; feature_45: string;
    feature_46: number; feature_47: string; feature_48: boolean; feature_49: number; feature_50: string;
    // --- GEIN Features End ---
}

interface MockStripeData {
    balance: StripeBalance;
    charges: ExpandedStripeCharge[];
    customers: ExpandedStripeCustomer[];
    subscriptions: ExpandedStripeSubscription[];
    aiInsights: AIInsight[];
}

// --- High-Frequency, High-Volume Data Synthesis Engine ---

const generateHighVolumeMockStripeData = (): MockStripeData => {
    const currency = 'usd';
    const availableAmount = 985402300000 + Math.floor(Math.random() * 10000000000);
    const pendingAmount = 223456700000 + Math.floor(Math.random() * 5000000000);

    const balance: StripeBalance = {
        available: [{ amount: availableAmount, currency }],
        pending: [{ amount: pendingAmount, currency }],
    };

    const geoLocations = [
        { country: 'USA', city: 'New York', lat: 40.7128, lon: -74.0060 },
        { country: 'GBR', city: 'London', lat: 51.5074, lon: -0.1278 },
        { country: 'JPN', city: 'Tokyo', lat: 35.6895, lon: 139.6917 },
        { country: 'SGP', city: 'Singapore', lat: 1.3521, lon: 103.8198 },
        { country: 'DEU', city: 'Berlin', lat: 52.5200, lon: 13.4050 },
        { country: 'BRA', city: 'São Paulo', lat: -23.5505, lon: -46.6333 },
        { country: 'NGA', city: 'Lagos', lat: 6.5244, lon: 3.3792 },
    ];

    const numCharges = 1000;
    const charges: ExpandedStripeCharge[] = Array.from({ length: numCharges }, (_, i) => {
        const status = ['succeeded', 'pending', 'failed'][i % 5];
        const amount = Math.floor(Math.random() * 500000) + 10000;
        const risk_score = Math.floor(Math.random() * 100);
        const chargeType = Math.random();
        let type: 'charge' | 'payout' | 'refund' | 'fee';
        if (chargeType > 0.8) type = 'payout';
        else if (chargeType > 0.7) type = 'refund';
        else if (chargeType > 0.65) type = 'fee';
        else type = 'charge';

        return {
            id: `ch_3Pabcde${i + Date.now()}`,
            amount: amount,
            currency: currency,
            status: status as 'succeeded' | 'pending' | 'failed',
            created: Math.floor(Date.now() / 1000) - i * 1800, // Higher frequency
            description: `Quantum Asset Transfer #${i + 1} - SKU ${String.fromCharCode(65 + (i % 26))}${i % 100}`,
            customer_id: `cus_${Math.floor(Math.random() * 100)}`,
            type: type,
            metadata: {
                ip_address: `2${Math.floor(Math.random() * 55)}.1${Math.floor(Math.random() * 255)}.10.5`,
                geo_location: geoLocations[i % geoLocations.length],
                device_fingerprint: `fp_${(Math.random() + 1).toString(36).substring(2)}`,
                risk_score: risk_score,
                risk_vector: risk_score > 85 ? 'PROXY_DETECTED' : risk_score > 60 ? 'VELOCITY_SPIKE' : 'NORMAL',
                user_agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_${i%7}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/12${i%5}.0.0.0 Safari/537.36`,
                session_duration_sec: Math.floor(Math.random() * 1800) + 30,
                is_vpn: Math.random() > 0.95,
                is_tor: Math.random() > 0.99,
                browser_language: ['en-US', 'en-GB', 'es-ES', 'de-DE'][i % 4],
                payment_method_type: ['card', 'wallet', 'bank_transfer'][i % 3] as any,
                card_bin: `${Math.floor(Math.random() * 900000) + 100000}`,
                card_last4: `${Math.floor(Math.random() * 9000) + 1000}`,
                card_brand: ['Visa', 'Mastercard', 'Amex'][i % 3] as any,
                is_3d_secure: Math.random() > 0.3,
                feature_1: Math.random(), feature_2: 'val', feature_3: true, feature_4: 123, feature_5: 'abc',
                feature_6: Math.random(), feature_7: 'val', feature_8: false, feature_9: 456, feature_10: 'def',
            },
            fraud_details: { user_report: 'safe', stripe_report: risk_score > 80 ? 'fraudulent' : 'safe' },
            dispute_status: status === 'failed' && Math.random() > 0.5 ? 'under_review' : 'none',
            payout_id: type === 'payout' ? `po_${(Math.random() + 1).toString(36).substring(2)}` : null,
            reversal_id: type === 'refund' ? `re_${(Math.random() + 1).toString(36).substring(2)}` : null,
            fee_details: type === 'fee' ? [{ amount: Math.floor(amount * 0.029) + 30, currency, type: 'stripe_fee' }] : [],
            source_of_funds: ['credit', 'debit', 'prepaid'][i % 3] as any,
            network_status: 'available',
            processing_latency_ms: Math.floor(Math.random() * 200) + 50,
            feature_11: Math.random(), feature_12: 'val', feature_13: true, feature_14: 123, feature_15: 'abc',
            feature_16: Math.random(), feature_17: 'val', feature_18: false, feature_19: 456, feature_20: 'def',
        };
    });

    const numCustomers = 2500;
    const customers: ExpandedStripeCustomer[] = Array.from({ length: numCustomers }, (_, i) => ({
        id: `cus_${i}`,
        email: `entity_${i}@quantum-ent.com`,
        name: `Quantum Entity ${i + 1}`,
        created: Math.floor(Date.now() / 1000) - i * 86400 * 5,
        total_spent: Math.floor(Math.random() * 1000000000),
        last_login_ip: `1${Math.floor(Math.random() * 55)}.2${Math.floor(Math.random() * 255)}.10.5`,
        segment: ['VIP', 'High-Value', 'Standard', 'At-Risk', 'Dormant'][i % 5] as any,
        notes: [{
            id: `note_${i}_1`,
            text: 'Gein Engine Insight: High correlation with Segment-B7 behavioral patterns.',
            timestamp: Date.now() - 86400000 * 5,
            author: 'Gein Engine'
        }],
        kyc_status: ['verified', 'pending', 'failed', 'unverified'][i % 4] as any,
        lifetime_value: Math.floor(Math.random() * 5000000),
        average_order_value: Math.floor(Math.random() * 50000) + 1000,
        churn_probability: Math.random(),
        marketing_consent: Math.random() > 0.4,
        last_contacted_date: Math.floor(Date.now() / 1000) - i * 86400 * 2,
        support_ticket_count: Math.floor(Math.random() * 10),
        behavioral_score: Math.floor(Math.random() * 1000),
        feature_21: Math.random(), feature_22: 'val', feature_23: true, feature_24: 123, feature_25: 'abc',
        feature_26: Math.random(), feature_27: 'val', feature_28: false, feature_29: 456, feature_30: 'def',
        feature_31: Math.random(), feature_32: 'val', feature_33: true, feature_34: 123, feature_35: 'abc',
        feature_36: Math.random(), feature_37: 'val', feature_38: false, feature_39: 456, feature_40: 'def',
    }));

    const numSubscriptions = 800;
    const subscriptions: ExpandedStripeSubscription[] = Array.from({ length: numSubscriptions }, (_, i) => {
        const status = ['active', 'canceled', 'past_due'][i % 3] as 'active' | 'canceled' | 'past_due';
        const amount = (Math.floor(Math.random() * 4) + 1) * 100000;
        return {
            id: `sub_xyz${i}`,
            customer_id: `cus_${Math.floor(Math.random() * numCustomers)}`,
            plan_id: `plan_q_tier_${Math.floor(Math.random() * 5) + 1}`,
            status: status,
            current_period_end: Math.floor(Date.now() / 1000) + (i % 12) * 2592000,
            amount: amount,
            mrr: amount,
            arr: amount * 12,
            churn_date: status === 'canceled' ? Math.floor(Date.now() / 1000) - (i % 30) * 86400 : null,
            activation_channel: ['organic', 'paid', 'referral'][i % 3] as any,
            feature_41: Math.random(), feature_42: 'val', feature_43: true, feature_44: 123, feature_45: 'abc',
            feature_46: Math.random(), feature_47: 'val', feature_48: false, feature_49: 456, feature_50: 'def',
        };
    });

    const aiInsights: AIInsight[] = [
        {
            id: 'ai_risk_001', type: 'Risk Assessment' as any, severity: 'High',
            message: 'Coordinated fraudulent activity detected from a botnet in Eastern Europe.',
            details: 'A cluster of 250+ transactions with high-risk scores and matching device fingerprints originated from a known malicious IP block. Auto-block initiated.',
            timestamp: String(Date.now() - 3600000)
        },
        {
            id: 'ai_optimization_002', type: 'Revenue Optimization' as any, severity: 'Medium',
            message: 'Pricing model suggests a 5% uplift opportunity for Quantum Tier 3 subscriptions in the APAC region.',
            details: 'Demand elasticity models show low churn risk for a price increase. A/B testing recommended before full rollout.',
            timestamp: String(Date.now() - 7200000)
        },
        {
            id: 'ai_compliance_003', type: 'Compliance Flag' as any, severity: 'Low',
            message: 'Automated KYC check failed for 12 new entities pending verification.',
            details: 'Manual review required for entities flagged by the compliance bot. Documents submitted do not match registered entity names.',
            timestamp: String(Date.now() - 1800000)
        },
        {
            id: 'ai_market_004', type: 'Market Anomaly' as any, severity: 'High',
            message: 'Unusual currency fluctuation in JPY/USD pair impacting payout values.',
            details: 'Algorithmic payout strategies have been automatically paused for JPY destinations. Manual override is required to resume.',
            timestamp: String(Date.now() - 900000)
        }
    ];

    return { balance, charges, customers, subscriptions, aiInsights };
};

// --- Sub-Components for Self-Contained Application Modules ---

const EnterpriseMetricCard: React.FC<{ title: string; value: string | number; trend?: 'up' | 'down' | 'neutral'; footerText?: string; colorClass?: string; }> = ({ title, value, trend, footerText, colorClass = "text-white" }) => {
    const trendIcon = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';
    const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
    return (
        <Card title={title} className="shadow-2xl border border-gray-700/50 transition duration-300 hover:shadow-cyan-500/20">
            <div className="flex flex-col h-full justify-between">
                <div className="text-center py-2">
                    <p className={`text-5xl font-extrabold tracking-tight ${colorClass}`}>{value}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-700/50">
                    <div className="flex justify-between items-center text-sm">
                        {footerText ? <p className="text-gray-400 truncate">{footerText}</p> : <p className="text-gray-500">Real-time Data Feed</p>}
                        {trend && <span className={`flex items-center font-semibold ${trendColor}`}>{trendIcon}</span>}
                    </div>
                </div>
            </div>
        </Card>
    );
};

const AIInsightCard: React.FC<{ insight: AIInsight }> = ({ insight }) => {
    const severityClasses = { High: 'border-red-500', Medium: 'border-yellow-500', Low: 'border-cyan-500', Critical: 'border-red-800' };
    const severityText = { High: 'text-red-300', Medium: 'text-yellow-300', Low: 'text-cyan-300', Critical: 'text-red-500' };
    return (
        <Card title={`AI Analysis: ${insight.type}`} className={`border-l-4 ${severityClasses[insight.severity]} shadow-lg bg-gray-800/50`}>
            <div className="space-y-2">
                <p className={`text-lg font-bold ${severityText[insight.severity]}`}>{insight.message}</p>
                <p className="text-sm text-gray-300">{insight.details}</p>
                <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${severityText[insight.severity]}`}>Severity: {insight.severity}</span>
                    <button className="text-xs text-cyan-400 hover:text-cyan-300 transition duration-150">Triage &rarr;</button>
                </div>
            </div>
        </Card>
    );
};

// --- High-Frequency Trading (HFT) & Liquidity Management Module ---
const HFTModule: React.FC<{ initialCharges: ExpandedStripeCharge[]; formatCurrency: (amount: number, currency: string) => string; }> = ({ initialCharges, formatCurrency }) => {
    const [feed, setFeed] = useState<ExpandedStripeCharge[]>(initialCharges.slice(0, 100));
    const [isLive, setIsLive] = useState(true);

    useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(() => {
            const newCharge: ExpandedStripeCharge = {
                ...initialCharges[Math.floor(Math.random() * initialCharges.length)],
                id: `ch_live_${Date.now()}`,
                created: Math.floor(Date.now() / 1000),
                amount: Math.floor(Math.random() * 100000) + 500,
            };
            setFeed(prev => [newCharge, ...prev.slice(0, 99)]);
        }, 200); // High-frequency simulation
        return () => clearInterval(interval);
    }, [isLive, initialCharges]);

    return (
        <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
                <Card title="Real-Time Transaction Ledger" className="p-0 overflow-hidden shadow-2xl border border-cyan-500/30">
                    <div className="flex justify-between items-center p-3 bg-gray-800/70 border-b border-gray-700">
                        <h3 className="text-lg font-bold text-white">Live Feed</h3>
                        <button onClick={() => setIsLive(!isLive)} className={`px-3 py-1 text-xs rounded-full ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                            {isLive ? 'PAUSE FEED' : 'RESUME FEED'}
                        </button>
                    </div>
                    <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {feed.map(charge => (
                            <div key={charge.id} className={`flex justify-between items-center p-3 transition duration-100 ${charge.type === 'payout' ? 'bg-red-900/20' : 'bg-green-900/20'}`}>
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="font-semibold text-white truncate">{charge.description}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {new Date(charge.created * 1000).toLocaleTimeString()} | {charge.metadata.geo_location.country} | Risk: {charge.metadata.risk_score}
                                    </p>
                                </div>
                                <div className="text-right flex items-center space-x-4">
                                    <p className={`font-mono text-lg font-bold w-32 ${charge.type === 'payout' ? 'text-red-400' : 'text-green-400'}`}>
                                        {charge.type === 'payout' ? '-' : '+'} {formatCurrency(charge.amount, charge.currency)}
                                    </p>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full min-w-[80px] text-center ${charge.status === 'succeeded' ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'}`}>
                                        {charge.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
            <div className="col-span-1 space-y-6">
                <Card title="Algorithmic Payout Strategy">
                    <form className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400">Strategy Profile</label>
                            <select className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white mt-1">
                                <option>Aggressive Growth</option>
                                <option>Balanced Risk</option>
                                <option>Capital Preservation</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Risk Threshold Trigger</label>
                            <input type="range" min="50" max="100" defaultValue="85" className="w-full mt-1" />
                        </div>
                        <button type="submit" className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white font-bold">Deploy Strategy</button>
                    </form>
                </Card>
                <Card title="Manual Payout Execution">
                    <form className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400">Amount (USD)</label>
                            <input type="number" placeholder="50000.00" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white mt-1" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Destination Wallet</label>
                            <input type="text" placeholder="0x..." className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white mt-1" />
                        </div>
                        <button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-white font-bold">Execute Payout</button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

// --- Geopolitical & Market Risk Module ---
const GeoRiskModule: React.FC<{ formatCurrency: (amount: number, currency: string) => string; }> = ({ formatCurrency }) => {
    const riskHotspots = [
        { name: 'Eastern Europe', risk: 'High', impact: 'Supply Chain', details: 'Conflict affecting payment processor availability.' },
        { name: 'APAC Region', risk: 'Medium', impact: 'Currency Fluctuation', details: 'New regulations on cross-border transactions.' },
        { name: 'South America', risk: 'Medium', impact: 'Political Instability', details: 'Potential for increased chargeback rates.' },
        { name: 'North Africa', risk: 'Low', impact: 'Regulatory Watch', details: 'Monitoring changes to data localization laws.' },
    ];

    return (
        <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
                <Card title="Global Risk Hotspot Matrix" className="shadow-2xl border border-red-500/30">
                    <div className="relative bg-gray-800 p-4 h-[500px] rounded-lg">
                        <div className="absolute inset-0 bg-world-map-pattern opacity-10"></div>
                        <p className="text-center text-gray-500 absolute inset-0 flex items-center justify-center">[Interactive World Map Visualization]</p>
                        <div className="absolute top-1/4 left-3/4 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                            <p className="text-xs text-red-300">E. Europe</p>
                        </div>
                        <div className="absolute top-1/2 left-3/4 transform -translate-x-1/4 -translate-y-1/2 text-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                            <p className="text-xs text-yellow-300">APAC</p>
                        </div>
                    </div>
                </Card>
            </div>
            <div className="col-span-1 space-y-6">
                {riskHotspots.map(spot => (
                    <Card key={spot.name} title={`${spot.name} - ${spot.impact}`} className={`border-l-4 ${spot.risk === 'High' ? 'border-red-500' : 'border-yellow-500'}`}>
                        <p className="text-sm text-gray-300">{spot.details}</p>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700/50">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${spot.risk === 'High' ? 'text-red-300' : 'text-yellow-300'}`}>Risk Level: {spot.risk}</span>
                            <button className="text-xs text-cyan-400 hover:text-cyan-300">View Report</button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// --- Main Dashboard View Component ---

const StripeDashboardView: React.FC = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("StripeDashboardView must be used within a DataProvider");
    const { stripeApiKey, setActiveView } = context;

    const [isLoading, setIsLoading] = useState(true);
    const [mockData, setMockData] = useState<MockStripeData | null>(null);
    const [activeModule, setActiveModule] = useState<'overview' | 'hft' | 'georisk'>('overview');

    useEffect(() => {
        if (stripeApiKey) {
            setIsLoading(true);
            const timer = setTimeout(() => {
                setMockData(generateHighVolumeMockStripeData());
                setIsLoading(false);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [stripeApiKey]);

    const formatCurrency = useCallback((amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount / 100);
    }, []);

    const calculateKPIs = useMemo(() => {
        if (!mockData) return null;
        const successfulCharges = mockData.charges.filter(c => c.status === 'succeeded');
        const totalRevenue = successfulCharges.reduce((sum, c) => sum + c.amount, 0);
        const successRate = (successfulCharges.length / mockData.charges.length) * 100;
        return {
            grossVolume24h: totalRevenue * 1.5,
            successRate: successRate,
            newCustomers: mockData.customers.length,
            disputes: mockData.charges.filter(c => c.status === 'failed').length,
            activeSubscriptions: mockData.subscriptions.filter(s => s.status === 'active').length,
            totalMRR: mockData.subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.mrr, 0),
            avgAOV: mockData.customers.reduce((sum, c) => sum + c.average_order_value, 0) / mockData.customers.length,
            verifiedKYCPercent: (mockData.customers.filter(c => c.kyc_status === 'verified').length / mockData.customers.length) * 100,
            fraudBlockRate: (mockData.charges.filter(c => c.metadata.risk_score > 85).length / mockData.charges.length) * 100,
        };
    }, [mockData]);

    if (!stripeApiKey) {
        return (
            <div className="p-8 bg-gray-900 min-h-screen flex items-center justify-center">
                <div className="space-y-8 max-w-xl w-full">
                    <h1 className="text-5xl font-extrabold text-white text-center tracking-widest border-b pb-4 border-cyan-600">QuantumPay Integration Portal</h1>
                    <Card title="Stripe API Key Configuration Required" className="shadow-2xl border-l-8 border-red-500">
                        <div className="text-center p-6">
                            <p className="text-lg text-gray-300 mb-6">Secure access to the Stripe Financial Nexus requires a valid, authorized API Key. Please navigate to the System Configuration module to establish the connection credentials.</p>
                            <button onClick={() => setActiveView(View.APIIntegration)} className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition duration-200 shadow-lg shadow-red-500/30">Initiate Secure API Configuration</button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    if (isLoading || !mockData || !calculateKPIs) {
        return (
            <div className="p-8 space-y-6">
                <h2 className="text-4xl font-bold text-white tracking-wider">Stripe Financial Nexus Dashboard</h2>
                <div className="text-center text-cyan-400 pt-10">
                    <svg className="animate-spin h-8 w-8 text-cyan-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 16a8 8 0 110-16 8 8 0 010 16z"></path></svg>
                    <p>Synchronizing Global Transaction Ledger...</p>
                </div>
            </div>
        );
    }

    const kpis = calculateKPIs;

    const renderModule = () => {
        switch (activeModule) {
            case 'hft':
                return <HFTModule initialCharges={mockData.charges} formatCurrency={formatCurrency} />;
            case 'georisk':
                return <GeoRiskModule formatCurrency={formatCurrency} />;
            case 'overview':
            default:
                return (
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center">AI Predictive Intelligence Feed</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                                {mockData.aiInsights.map(insight => <AIInsightCard key={insight.id} insight={insight} />)}
                            </div>
                        </section>
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-800 pb-2">Key Performance Indicators (24H Snapshot)</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-6">
                                <EnterpriseMetricCard title="Gross Volume (24h)" value={formatCurrency(kpis.grossVolume24h, 'usd')} trend="up" footerText={`+1.8% vs Previous Period`} colorClass="text-green-400" />
                                <EnterpriseMetricCard title="Success Rate" value={`${kpis.successRate.toFixed(2)}%`} trend={kpis.successRate > 99 ? 'up' : 'down'} footerText={`Target: 99.5%`} colorClass="text-white" />
                                <EnterpriseMetricCard title="New Enterprise Customers" value={kpis.newCustomers.toLocaleString()} trend="up" footerText={`+${Math.floor(Math.random() * 50)} added today`} colorClass="text-cyan-400" />
                                <EnterpriseMetricCard title="Active Disputes" value={kpis.disputes.toString()} trend={kpis.disputes > 5 ? 'down' : 'neutral'} footerText={`Resolution SLA: 48h`} colorClass="text-red-400" />
                                <EnterpriseMetricCard title="Total MRR" value={formatCurrency(kpis.totalMRR, 'usd')} trend="up" footerText="Recurring Revenue" colorClass="text-green-400" />
                                <EnterpriseMetricCard title="Avg. Order Value" value={formatCurrency(kpis.avgAOV, 'usd')} trend="neutral" footerText="All Segments" colorClass="text-white" />
                                <EnterpriseMetricCard title="KYC Verified" value={`${kpis.verifiedKYCPercent.toFixed(1)}%`} trend="up" footerText="Target: 98%" colorClass="text-cyan-400" />
                                <EnterpriseMetricCard title="Fraud Block Rate" value={`${kpis.fraudBlockRate.toFixed(2)}%`} trend={kpis.fraudBlockRate > 2 ? 'down' : 'neutral'} footerText="Risk Engine" colorClass="text-red-400" />
                            </div>
                        </section>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card title="Stripe Liquidity Pool" className="lg:col-span-1 shadow-2xl border border-gray-700/50">
                                <div className="space-y-6 p-2">
                                    <div>
                                        <p className="text-sm text-gray-400 uppercase tracking-wider">Available Settlement Capital</p>
                                        <p className="text-4xl font-extrabold text-green-400 mt-1">{formatCurrency(mockData.balance.available[0].amount, mockData.balance.available[0].currency)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 uppercase tracking-wider">Pending Reconciliation</p>
                                        <p className="text-3xl font-bold text-yellow-400 mt-1">{formatCurrency(mockData.balance.pending[0].amount, mockData.balance.pending[0].currency)}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card title="Subscription Portfolio Health" className="lg:col-span-2 shadow-2xl border border-gray-700/50">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-4xl font-bold text-white">{kpis.activeSubscriptions.toLocaleString()}</p>
                                        <p className="text-sm text-gray-400 mt-1">Active Contracts</p>
                                    </div>
                                    <div className="border-l border-r border-gray-700">
                                        <p className="text-4xl font-bold text-red-400">{mockData.subscriptions.filter(s => s.status === 'canceled').length}</p>
                                        <p className="text-sm text-gray-400 mt-1">Canceled (L30D)</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-bold text-yellow-400">{mockData.subscriptions.filter(s => s.status === 'past_due').length}</p>
                                        <p className="text-sm text-gray-400 mt-1">Past Due (Dunning)</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                );
        }
    };

    const navTabs = [
        { id: 'overview', label: 'Global Overview' }, { id: 'hft', label: 'HFT & Liquidity' }, { id: 'georisk', label: 'Geopolitical Risk' },
        { id: 'crm', label: 'CRM & Entity Mgmt' }, { id: 'riskmatrix', label: 'Risk & Compliance Matrix' }, { id: 'predictive', label: 'Predictive Analytics' },
        { id: 'treasury', label: 'Global Treasury Ops' }, { id: 'clv', label: 'Customer Lifetime Value' }, { id: 'marketintel', label: 'Market Intelligence Hub' },
        { id: 'supplychain', label: 'Supply Chain Finance' }, { id: 'crypto', label: 'Crypto Asset Management' },
        ...Array.from({ length: 89 }, (_, i) => ({ id: `feat${i}`, label: `Feature Module ${i + 1}` }))
    ];

    return (
        <div className="p-8 space-y-8 bg-gray-900 min-h-screen font-sans">
            <header className="flex justify-between items-center border-b border-gray-800 pb-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tighter">Stripe Financial Nexus</h1>
                    <p className="text-cyan-500 text-sm">Quantum Operations Command Center</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setActiveView(View.Settings)} className="text-sm text-gray-400 hover:text-cyan-400 transition">System Health</button>
                    <button onClick={() => setActiveView(View.APIIntegration)} className="text-sm text-gray-400 hover:text-cyan-400 transition">API Config</button>
                </div>
            </header>

            <nav className="flex space-x-1 bg-gray-800 p-1 rounded-lg overflow-x-auto custom-scrollbar pb-2">
                {navTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => ['overview', 'hft', 'georisk'].includes(tab.id) && setActiveModule(tab.id as any)}
                        className={`flex-shrink-0 whitespace-nowrap text-center px-4 py-2 rounded-md font-bold transition ${activeModule === tab.id
                                ? 'bg-cyan-600 text-white'
                                : ['overview', 'hft', 'georisk'].includes(tab.id)
                                    ? 'text-gray-300 hover:bg-gray-700'
                                    : 'text-gray-500 cursor-not-allowed'
                            }`}
                        disabled={!['overview', 'hft', 'georisk'].includes(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            <main>
                {renderModule()}
            </main>

            <footer className="text-center text-xs text-gray-600 pt-4 border-t border-gray-800">
                Stripe Nexus Platform v11.1.0 | Data Latency: <span className="text-green-500">2ms</span> | Last Sync: {new Date().toLocaleTimeString()}
            </footer>
        </div>
    );
};

export default StripeDashboardView;
