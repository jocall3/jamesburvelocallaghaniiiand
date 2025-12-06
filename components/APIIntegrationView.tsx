
import React, { useState, useContext, useEffect, useRef } from 'react';
import { DataContext } from '../context/DataContext';
import { APIStatus } from '../types';
import Card from './Card';
import { ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
    );
}

function ScaleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
    );
}

function TruckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17H6V6h12v4l3 3v2h-3z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6v11h4" />
        </svg>
    );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a4 4 0 110-5.292" />
        </svg>
    );
}

const StatusIndicator: React.FC<{ status: APIStatus['status'] }> = ({ status }) => {
    const colors = {
        'Operational': { bg: 'bg-green-500/20', text: 'text-green-300', dot: 'bg-green-400' },
        'Degraded Performance': { bg: 'bg-yellow-500/20', text: 'text-yellow-300', dot: 'bg-yellow-400' },
        'Partial Outage': { bg: 'bg-orange-500/20', text: 'text-orange-300', dot: 'bg-orange-400' },
        'Major Outage': { bg: 'bg-red-500/20', text: 'text-red-300', dot: 'bg-red-400' },
        'Maintenance': { bg: 'bg-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-400' },
        'Unknown': { bg: 'bg-gray-500/20', text: 'text-gray-300', dot: 'bg-gray-400' },
    };
    const style = colors[status] || colors['Unknown'];
    return (
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
            <div className={`w-2 h-2 rounded-full ${style.dot}`}></div>
            {status}
        </div>
    );
};

const AIChatAssistant: React.FC<{ geminiApiKey: string | null }> = ({ geminiApiKey }) => {
    const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai', text: string, timestamp: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatSessionRef = useRef<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (geminiApiKey) {
            try {
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                chatSessionRef.current = ai.chats.create({
                    model: "gemini-2.5-flash",
                    config: {
                        systemInstruction: "You are GEIN (Global Enterprise Intelligence Network), an AI Business Assistant integrated into an Enterprise Operating System. Your purpose is to help users with API monitoring, financial insights, high-frequency trading, legal compliance, supply chain logistics, HR, workflow automation, and business intelligence. Be concise, professional, and helpful.",
                    },
                    history: [],
                });
                setError(null);
            } catch (e: any) {
                console.error("Error initializing Gemini:", e);
                setError("Failed to initialize AI. Please check your API key.");
            }
        }
    }, [geminiApiKey]);

    const handleSendMessage = async () => {
        if (chatInput.trim() === '' || !geminiApiKey || !chatSessionRef.current || isTyping) return;

        const userMessageText = chatInput;
        const newUserMessage = { sender: 'user' as const, text: userMessageText, timestamp: new Date().toLocaleTimeString() };
        setChatMessages(prev => [...prev, newUserMessage]);
        setChatInput('');
        setIsTyping(true);
        setError(null);

        try {
            const stream = await chatSessionRef.current.sendMessageStream({ message: userMessageText });

            let aiResponseText = '';
            setChatMessages(prev => [...prev, { sender: 'ai' as const, text: '', timestamp: new Date().toLocaleTimeString() }]);

            for await (const chunk of stream) {
                const chunkResponse = chunk as GenerateContentResponse;
                const chunkText = chunkResponse.text;
                if (chunkText) {
                    aiResponseText += chunkText;
                    setChatMessages(prev => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage && lastMessage.sender === 'ai') {
                            lastMessage.text = aiResponseText;
                            lastMessage.timestamp = new Date().toLocaleTimeString();
                        }
                        return newMessages;
                    });
                }
            }
        } catch (e: any) {
            console.error("Error sending message to Gemini:", e);
            const errorMessage = e instanceof Error ? e.message : "An error occurred while communicating with the AI.";
            setError(`AI Error: ${errorMessage}`);
            setChatMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai' && lastMessage.text === '') {
                    newMessages.pop();
                }
                return newMessages;
            });
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    return (
        <Card title="AI Business Assistant (GEIN)">
            <div className="flex flex-col h-96">
                <div ref={chatContainerRef} id="chat-messages" className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-900 rounded-lg border border-gray-700 mb-4">
                    {chatMessages.length === 0 && (
                        <div className="text-center text-gray-500 italic">
                            Type a message to start a conversation with GEIN, your AI Business Assistant.
                        </div>
                    )}
                    {chatMessages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-md ${
                                msg.sender === 'user' ? 'bg-cyan-700 text-white' : 'bg-gray-700 text-gray-100'
                            }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                <span className="block text-right text-xs text-gray-400 mt-1">{msg.timestamp}</span>
                            </div>
                        </div>
                    ))}
                     {error && (
                        <div className="text-center text-red-400 italic p-2">
                            {error}
                        </div>
                    )}
                </div>
                <div className="flex">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={geminiApiKey ? "Ask GEIN..." : "Please configure Gemini API key to chat..."}
                        className="flex-grow bg-gray-700/50 border border-gray-600 rounded-l-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        disabled={!geminiApiKey || isTyping}
                    />
                    <button
                        onClick={handleSendMessage}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-r-lg px-4 py-2 transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        disabled={!geminiApiKey || chatInput.trim() === '' || isTyping}
                    >
                        Send
                    </button>
                </div>
            </div>
        </Card>
    );
};

const APIMonitoringDashboard: React.FC<{
    apiStatus: APIStatus[],
    geminiApiKey: string | null,
    onConfigurePlaid: () => void,
    onConfigureStripe: () => void
}> = ({ apiStatus, geminiApiKey, onConfigurePlaid, onConfigureStripe }) => {
    const [selectedAPI, setSelectedAPI] = useState<string | null>(null);
    const [anomalyDetectionEnabled, setAnomalyDetectionEnabled] = useState(false);
    const [aiInsights, setAiInsights] = useState<string[]>([]);

    const apiTrafficData = Array.from({ length: 30 }, (_, i) => ({
        name: `${i + 1}h ago`,
        calls: 100 + Math.random() * 200,
        errors: Math.floor(Math.random() * 10),
        latency: 50 + Math.random() * 150,
    }));

    useEffect(() => {
        if (geminiApiKey && anomalyDetectionEnabled) {
            const insights = [
                "AI detected a 15% increase in API latency for Google Gemini over the last 2 hours, potentially indicating network congestion.",
                "Anomaly: Modern Treasury API error rates spiked briefly at 02:30 UTC, but quickly recovered. Root cause analysis initiated.",
                "Predictive analysis suggests a 70% probability of 'Degraded Performance' for a third-party payment gateway API within the next 48 hours due to observed traffic patterns.",
                "Recommendation: Review rate limits for high-volume endpoints to prevent future throttling issues."
            ];
            setAiInsights(insights);
        } else {
            setAiInsights([]);
        }
    }, [geminiApiKey, anomalyDetectionEnabled, apiStatus]);

    const renderAPIDetails = () => {
        if (!selectedAPI) return <p className="text-gray-400">Select an API provider to view detailed metrics and AI insights.</p>;

        const api = apiStatus.find(a => a.provider === selectedAPI);
        if (!api) return <p className="text-red-400">API details not found.</p>;

        const historicalData = Array.from({ length: 24 }, (_, i) => ({
            time: `${i}:00`,
            latency: api.responseTime + Math.random() * 50 - 25,
            errors: Math.floor(Math.random() * 5),
            throughput: 1000 + Math.random() * 500,
        }));

        return (
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white">{api.provider} - Detailed Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Current Status</p>
                        <StatusIndicator status={api.status} />
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Average Latency</p>
                        <p className="text-2xl font-bold text-cyan-400">{api.responseTime}ms</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Error Rate (24h)</p>
                        <p className="text-2xl font-bold text-red-400">{(Math.random() * 2).toFixed(2)}%</p>
                    </div>
                </div>

                <div className="h-64 bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <h4 className="text-lg font-semibold text-white mb-2">Historical Latency & Errors</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                            <XAxis dataKey="time" stroke="#9ca3af" />
                            <YAxis yAxisId="left" stroke="#06b6d4" label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#06b6d4' }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#ef4444" label={{ value: 'Errors', angle: 90, position: 'insideRight', fill: '#ef4444' }} />
                            <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#4b5563', borderRadius: '8px' }} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#06b6d4" dot={false} name="Latency" />
                            <Line yAxisId="right" type="monotone" dataKey="errors" stroke="#ef4444" dot={false} name="Errors" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {geminiApiKey && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-white">AI Anomaly Detection & Predictive Insights</h4>
                            <label className="flex items-center cursor-pointer">
                                <span className="mr-3 text-sm text-gray-400">Enable AI Analysis</span>
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={anomalyDetectionEnabled} onChange={() => setAnomalyDetectionEnabled(!anomalyDetectionEnabled)} />
                                    <div className={`block w-10 h-6 rounded-full ${anomalyDetectionEnabled ? 'bg-cyan-600' : 'bg-gray-600'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${anomalyDetectionEnabled ? 'translate-x-full' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                        {anomalyDetectionEnabled && aiInsights.length > 0 ? (
                            <ul className="list-disc list-inside text-gray-300 space-y-2 bg-gray-900 p-4 rounded-lg border border-gray-700">
                                {aiInsights.map((insight, idx) => (
                                    <li key={idx} className="text-sm">{insight}</li>
                                ))}
                            </ul>
                        ) : anomalyDetectionEnabled ? (
                            <p className="text-gray-500 italic bg-gray-900 p-4 rounded-lg border border-gray-700">AI is analyzing data... No critical anomalies detected yet.</p>
                        ) : (
                            <p className="text-gray-500 italic">Enable AI Analysis to receive real-time anomaly detection and predictive insights.</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card title="Advanced API Monitoring & AI Diagnostics">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xl font-bold text-white">API Providers</h3>
                    <ul className="space-y-2">
                        {apiStatus.map(api => (
                            <li key={api.provider}>
                                <button
                                    onClick={() => setSelectedAPI(api.provider)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                                        selectedAPI === api.provider ? 'bg-cyan-700 text-white' : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'
                                    }`}
                                >
                                    <span className="font-medium">{api.provider}</span>
                                    <StatusIndicator status={api.status} />
                                </button>
                            </li>
                        ))}
                        <li>
                            <div className="w-full text-left p-3 rounded-lg bg-gray-800/50 text-gray-300 flex items-center justify-between">
                                <span className="font-medium">Plaid</span>
                                <div className="flex items-center gap-4">
                                    <StatusIndicator status={'Unknown'} />
                                    <button onClick={onConfigurePlaid} className="text-gray-400 hover:text-white">
                                        <SettingsIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                            </div>
                        </li>
                        <li>
                            <div className="w-full text-left p-3 rounded-lg bg-gray-800/50 text-gray-300 flex items-center justify-between">
                                <span className="font-medium">Stripe</span>
                                <div className="flex items-center gap-4">
                                    <StatusIndicator status={'Unknown'} />
                                    <button onClick={onConfigureStripe} className="text-gray-400 hover:text-white">
                                        <SettingsIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
                <div className="lg:col-span-3">
                    {renderAPIDetails()}
                </div>
            </div>
        </Card>
    );
};

const FinancialOperationsDashboard: React.FC<{ modernTreasuryApiKey: string | null, modernTreasuryOrganizationId: string | null, geminiApiKey: string | null }> = ({ modernTreasuryApiKey, modernTreasuryOrganizationId, geminiApiKey }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'payments' | 'forecasting'>('overview');
    const [aiFinancialInsights, setAiFinancialInsights] = useState<string[]>([]);
    const [fraudDetectionEnabled, setFraudDetectionEnabled] = useState(false);

    const isConfigured = modernTreasuryApiKey && modernTreasuryOrganizationId;

    const transactionData = Array.from({ length: 7 }, (_, i) => ({
        date: `Day ${i + 1}`,
        incoming: 5000 + Math.random() * 2000,
        outgoing: 3000 + Math.random() * 1500,
    }));

    const paymentFlowData = [
        { name: 'ACH', value: 400 },
        { name: 'Wire', value: 300 },
        { name: 'RTP', value: 200 },
        { name: 'Card', value: 100 },
    ];

    useEffect(() => {
        if (geminiApiKey && isConfigured && fraudDetectionEnabled) {
            const insights = [
                "AI detected a potential anomaly in outgoing payments to a new vendor. Review required for transaction ID: TXN-98765.",
                "Cash flow forecast for Q3 indicates a surplus of $1.2M, exceeding projections by 10%.",
                "Recommendation: Optimize payment routing for international wires to reduce fees by an estimated 5%.",
                "AI identified 3 high-risk transactions in the last 48 hours. Details available in the 'Transactions' tab."
            ];
            setAiFinancialInsights(insights);
        } else {
            setAiFinancialInsights([]);
        }
    }, [geminiApiKey, isConfigured, fraudDetectionEnabled]);

    if (!isConfigured) {
        return (
            <Card title="Financial Operations (Modern Treasury)">
                <div className="p-6 text-center text-gray-400 space-y-4">
                    <p className="text-lg">Modern Treasury API is not configured.</p>
                    <p>Please configure your Modern Treasury API Key and Organization ID to access advanced financial operations, real-time cash management, and AI-powered fraud detection.</p>
                    <button className="py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg">Configure Now</button>
                </div>
            </Card>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-400">Current Balance</p>
                                <p className="text-3xl font-bold text-green-400">$1,234,567.89</p>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-400">Pending Payments</p>
                                <p className="text-3xl font-bold text-yellow-400">$87,654.32</p>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-400">Last 24h Transactions</p>
                                <p className="text-3xl font-bold text-white">128</p>
                            </div>
                        </div>
                        <div className="h-64 bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <h4 className="text-lg font-semibold text-white mb-2">Daily Cash Flow</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={transactionData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                                    <XAxis dataKey="date" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#4b5563', borderRadius: '8px' }} />
                                    <Legend />
                                    <Bar dataKey="incoming" fill="#34d399" name="Incoming" />
                                    <Bar dataKey="outgoing" fill="#ef4444" name="Outgoing" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {geminiApiKey && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-semibold text-white">AI Fraud Detection & Financial Insights</h4>
                                    <label className="flex items-center cursor-pointer">
                                        <span className="mr-3 text-sm text-gray-400">Enable AI Fraud Detection</span>
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={fraudDetectionEnabled} onChange={() => setFraudDetectionEnabled(!fraudDetectionEnabled)} />
                                            <div className={`block w-10 h-6 rounded-full ${fraudDetectionEnabled ? 'bg-cyan-600' : 'bg-gray-600'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${fraudDetectionEnabled ? 'translate-x-full' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>
                                {fraudDetectionEnabled && aiFinancialInsights.length > 0 ? (
                                    <ul className="list-disc list-inside text-gray-300 space-y-2 bg-gray-900 p-4 rounded-lg border border-gray-700">
                                        {aiFinancialInsights.map((insight, idx) => (
                                            <li key={idx} className="text-sm">{insight}</li>
                                        ))}
                                    </ul>
                                ) : fraudDetectionEnabled ? (
                                    <p className="text-gray-500 italic bg-gray-900 p-4 rounded-lg border border-gray-700">AI is actively monitoring transactions... No high-risk activities detected.</p>
                                ) : (
                                    <p className="text-gray-500 italic">Enable AI Fraud Detection to protect your financial operations with real-time anomaly detection.</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 'transactions':
                const transactions = Array.from({ length: 10 }, (_, i) => ({
                    id: `TXN-${1000 + i}`,
                    date: `2024-07-${15 + i}`,
                    description: i % 2 === 0 ? `Payment to Vendor ${i}` : `Incoming from Client ${i}`,
                    amount: i % 2 === 0 ? -(1000 + i * 50) : (2000 + i * 75),
                    status: i % 3 === 0 ? 'Pending' : 'Completed',
                    risk: i % 4 === 0 ? 'High' : 'Low',
                }));
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
                        <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-700">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">AI Risk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {transactions.map((txn) => (
                                        <tr key={txn.id} className="hover:bg-gray-800/70">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{txn.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{txn.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{txn.description}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${txn.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>{txn.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    txn.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>{txn.status}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    txn.risk === 'High' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>{txn.risk}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'payments':
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Payment Flow Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="h-64 bg-gray-900 rounded-lg p-4 border border-gray-700">
                                <h4 className="text-lg font-semibold text-white mb-2">Payment Method Distribution</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={paymentFlowData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                                        <XAxis dataKey="name" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#4b5563', borderRadius: '8px' }} />
                                        <Bar dataKey="value" fill="#06b6d4" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                                <h4 className="text-lg font-semibold text-white">AI Payment Optimization</h4>
                                <p className="text-gray-400 text-sm">
                                    Leverage AI to analyze payment routes, identify cost savings, and optimize settlement times.
                                </p>
                                <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                                    <li>Suggested savings on international wires: <strong>5%</strong></li>
                                    <li>Recommended faster ACH batch processing for payroll.</li>
                                    <li>Identified potential for real-time payment adoption for critical vendors.</li>
                                </ul>
                                <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm">View Optimization Report</button>
                            </div>
                        </div>
                    </div>
                );
            case 'forecasting':
                const forecastData = Array.from({ length: 12 }, (_, i) => ({
                    month: `Month ${i + 1}`,
                    projected: 100000 + Math.random() * 50000,
                    actual: i < 6 ? (100000 + Math.random() * 50000) : null,
                }));
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">AI-Powered Cash Flow Forecasting</h3>
                        <div className="h-80 bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={forecastData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                                    <XAxis dataKey="month" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#4b5563', borderRadius: '8px' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="projected" stroke="#06b6d4" name="Projected Cash Flow" />
                                    <Line type="monotone" dataKey="actual" stroke="#34d399" name="Actual Cash Flow" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                            <h4 className="text-lg font-semibold text-white">AI Forecast Summary</h4>
                            <p className="text-gray-400 text-sm">
                                Our AI model predicts a strong financial outlook for the next 12 months, with consistent growth in revenue streams.
                                Key factors include: increased customer retention, successful product launches, and optimized operational costs.
                            </p>
                            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                                <li>Projected Q4 2024 Revenue: <strong>$5.8M</strong> (+18% YoY)</li>
                                <li>Identified potential for <strong>$250K</strong> in savings through vendor contract renegotiations.</li>
                                <li>Scenario analysis: Impact of a 10% market downturn on cash reserves: <strong>Manageable</strong>.</li>
                            </ul>
                            <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm">Generate Detailed Forecast Report</button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Card title="AI-Powered Financial Operations">
            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {['overview', 'transactions', 'payments', 'forecasting'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200 ${
                                activeTab === tab
                                    ? 'border-cyan-500 text-cyan-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {tab.replace('-', ' ')}
                        </button>
                    ))}
                </nav>
            </div>
            {renderTabContent()}
        </Card>
    );
};

const BusinessIntelligenceDashboard: React.FC<{ geminiApiKey: string | null }> = ({ geminiApiKey }) => {
    const [activeReport, setActiveReport] = useState<'overview' | 'sales' | 'marketing' | 'operations'>('overview');
    const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
    const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(false);

    const kpiData = [
        { name: 'Revenue Growth', value: 12.5, target: 10, unit: '%' },
        { name: 'Customer Acquisition Cost', value: 85, target: 90, unit: '$' },
        { name: 'Customer Lifetime Value', value: 1200, target: 1000, unit: '$' },
        { name: 'Operational Efficiency', value: 92, target: 90, unit: '%' },
    ];

    const salesData = Array.from({ length: 12 }, (_, i) => ({
        month: `M${i + 1}`,
        revenue: 100000 + Math.random() * 50000,
        newCustomers: 50 + Math.random() * 20,
    }));

    useEffect(() => {
        if (geminiApiKey && aiAnalysisEnabled) {
            const recommendations = [
                "AI identified a 20% increase in customer churn for a specific product segment. Recommend targeted re-engagement campaigns.",
                "Predictive analytics suggest optimizing marketing spend towards digital channels for a 15% higher ROI.",
                "Operational bottleneck detected in supply chain logistics. AI suggests alternative suppliers to mitigate risk.",
                "Recommendation: Implement dynamic pricing strategies based on real-time market demand to maximize revenue."
            ];
            setAiRecommendations(recommendations);
        } else {
            setAiRecommendations([]);
        }
    }, [geminiApiKey, aiAnalysisEnabled]);

    const renderReportContent = () => {
        switch (activeReport) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white">Key Performance Indicators (KPIs)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {kpiData.map((kpi, idx) => (
                                <div key={idx} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                    <p className="text-sm text-gray-400">{kpi.name}</p>
                                    <p className="text-2xl font-bold text-white mt-1">
                                        {kpi.unit === '$' ? '$' : ''}{kpi.value.toFixed(kpi.unit === '%' ? 1 : 0)}{kpi.unit}
                                    </p>
                                    <p className={`text-xs mt-1 ${kpi.value >= kpi.target ? 'text-green-400' : 'text-red-400'}`}>
                                        Target: {kpi.unit === '$' ? '$' : ''}{kpi.target}{kpi.unit}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {geminiApiKey && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-semibold text-white">AI Strategic Recommendations</h4>
                                    <label className="flex items-center cursor-pointer">
                                        <span className="mr-3 text-sm text-gray-400">Enable AI Insights</span>
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={aiAnalysisEnabled} onChange={() => setAiAnalysisEnabled(!aiAnalysisEnabled)} />
                                            <div className={`block w-10 h-6 rounded-full ${aiAnalysisEnabled ? 'bg-cyan-600' : 'bg-gray-600'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${aiAnalysisEnabled ? 'translate-x-full' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>
                                {aiAnalysisEnabled && aiRecommendations.length > 0 ? (
                                    <ul className="list-disc list-inside text-gray-300 space-y-2 bg-gray-900 p-4 rounded-lg border border-gray-700">
                                        {aiRecommendations.map((rec, idx) => (
                                            <li key={idx} className="text-sm">{rec}</li>
                                        ))}
                                    </ul>
                                ) : aiAnalysisEnabled ? (
                                    <p className="text-gray-500 italic bg-gray-900 p-4 rounded-lg border border-gray-700">AI is generating strategic recommendations...</p>
                                ) : (
                                    <p className="text-gray-500 italic">Enable AI Insights to receive data-driven strategic recommendations for your business.</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 'sales':
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white">Sales Performance & AI Forecasting</h3>
                        <div className="h-80 bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                                    <XAxis dataKey="month" stroke="#9ca3af" />
                                    <YAxis yAxisId="left" stroke="#06b6d4" label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', fill: '#06b6d4' }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#34d399" label={{ value: 'New Customers', angle: 90, position: 'insideRight', fill: '#34d399' }} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#4b5563', borderRadius: '8px' }} />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#06b6d4" name="Monthly Revenue" />
                                    <Line yAxisId="right" type="monotone" dataKey="newCustomers" stroke="#34d399" name="New Customers" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                            <h4 className="text-lg font-semibold text-white">AI Sales Insights</h4>
                            <p className="text-gray-400 text-sm">
                                AI predicts a 10% increase in sales conversion rates next quarter due to optimized lead scoring and personalized outreach strategies.
                            </p>
                            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                                <li>Top performing sales channels identified: <strong>Enterprise Solutions, Digital Partnerships</strong>.</li>
                                <li>AI-suggested personalized product bundles for high-value clients.</li>
                                <li>Forecasted impact of new sales hires: <strong>+5% revenue growth</strong>.</li>
                            </ul>
                            <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm">Generate Sales Strategy Report</button>
                        </div>
                    </div>
                );
            case 'marketing':
                const marketingData = Array.from({ length: 12 }, (_, i) => ({
                    month: `M${i + 1}`,
                    leads: 500 + Math.random() * 200,
                    conversions: 50 + Math.random() * 30,
                    cpc: 1.5 + Math.random() * 0.5,
                }));
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white">Marketing Performance & AI Optimization</h3>
                        <div className="h-80 bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={marketingData}>
                                    <defs>
                                        <linearGradient id="leadsColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient>
                                        <linearGradient id="conversionsColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                                    <XAxis dataKey="month" stroke="#9ca3af" />
                                    <YAxis yAxisId="left" stroke="#06b6d4" label={{ value: 'Leads', angle: -90, position: 'insideLeft', fill: '#06b6d4' }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#34d399" label={{ value: 'Conversions', angle: 90, position: 'insideRight', fill: '#34d399' }} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#4b5563', borderRadius: '8px' }} />
                                    <Legend />
                                    <Area yAxisId="left" type="monotone" dataKey="leads" stroke="#06b6d4" fill="url(#leadsColor)" name="Leads Generated" />
                                    <Area yAxisId="right" type="monotone" dataKey="conversions" stroke="#34d399" fill="url(#conversionsColor)" name="Conversions" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                            <h4 className="text-lg font-semibold text-white">AI Marketing Optimization</h4>
                            <p className="text-gray-400 text-sm">
                                AI recommends reallocating 20% of your ad budget to social media campaigns, predicting a 15% increase in lead quality.
                            </p>
                            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                                <li>Identified high-performing keywords for SEO: <strong>"AI finance platform", "business OS"</strong>.</li>
                                <li>AI-generated content suggestions for blog posts and email campaigns.</li>
                                <li>Predicted optimal timing for product launch announcements.</li>
                            </ul>
                            <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm">Generate Marketing Strategy Report</button>
                        </div>
                    </div>
                );
            case 'operations':
                const operationsData = Array.from({ length: 12 }, (_, i) => ({
                    month: `M${i + 1}`,
                    tasksCompleted: 1000 + Math.random() * 300,
                    automationRate: 60 + Math.random() * 15,
                    costSavings: 5000 + Math.random() * 2000,
                }));
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white">Operational Efficiency & AI Automation</h3>
                        <div className="h-80 bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={operationsData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                                    <XAxis dataKey="month" stroke="#9ca3af" />
                                    <YAxis yAxisId="left" stroke="#06b6d4" label={{ value: 'Tasks Completed', angle: -90, position: 'insideLeft', fill: '#06b6d4' }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#34d399" label={{ value: 'Automation Rate (%)', angle: 90, position: 'insideRight', fill: '#34d399' }} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#4b5563', borderRadius: '8px' }} />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="tasksCompleted" stroke="#06b6d4" name="Tasks Completed" />
                                    <Line yAxisId="right" type="monotone" dataKey="automationRate" stroke="#34d399" name="Automation Rate" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                            <h4 className="text-lg font-semibold text-white">AI Operational Insights</h4>
                            <p className="text-gray-400 text-sm">
                                AI identifies a 25% potential for further automation in customer support workflows, leading to significant cost savings and improved response times.
                            </p>
                            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                                <li>Recommended process improvements for faster onboarding of new clients.</li>
                                <li>AI-driven resource allocation suggestions for peak operational periods.</li>
                                <li>Predicted maintenance needs for critical infrastructure.</li>
                            </ul>
                            <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm">Generate Operations Efficiency Report</button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Card title="AI-Driven Business Intelligence">
            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Reports Tabs">
                    {['overview', 'sales', 'marketing', 'operations'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveReport(tab as any)}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200 ${
                                activeReport === tab
                                    ? 'border-cyan-500 text-cyan-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {tab.replace('-', ' ')}
                        </button>
                    ))}
                </nav>
            </div>
            {renderReportContent()}
        </Card>
    );
};

const WorkflowAutomation: React.FC<{ geminiApiKey: string | null }> = ({ geminiApiKey }) => {
    const [automationRules, setAutomationRules] = useState([
        { id: 1, name: 'Auto-reconcile Modern Treasury payments', status: 'Active', trigger: 'Daily at 3 AM', aiSuggested: true },
        { id: 2, name: 'Notify team on critical API outage', status: 'Active', trigger: 'API Status: Major Outage', aiSuggested: false },
        { id: 3, name: 'Generate weekly financial summary for executives', status: 'Inactive', trigger: 'Every Friday 5 PM', aiSuggested: true },
        { id: 4, name: 'Flag high-risk transactions for manual review', status: 'Active', trigger: 'AI Fraud Detection: High Risk', aiSuggested: true },
    ]);
    const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
    const [newRuleName, setNewRuleName] = useState('');
    const [newRuleTrigger, setNewRuleTrigger] = useState('');
    const [aiAutomationSuggestions, setAiAutomationSuggestions] = useState<string[]>([]);

    useEffect(() => {
        if (geminiApiKey) {
            const suggestions = [
                "AI suggests automating customer onboarding steps by integrating with CRM and identity verification APIs.",
                "Consider automating the generation of compliance reports based on financial transaction data.",
                "Automate the process of updating inventory levels based on sales data and supplier APIs.",
                "AI recommends setting up alerts for unusual login patterns to enhance security."
            ];
            setAiAutomationSuggestions(suggestions);
        } else {
            setAiAutomationSuggestions([]);
        }
    }, [geminiApiKey]);

    const handleAddRule = () => {
        if (newRuleName.trim() && newRuleTrigger.trim()) {
            setAutomationRules(prev => [...prev, {
                id: prev.length + 1,
                name: newRuleName,
                status: 'Active',
                trigger: newRuleTrigger,
                aiSuggested: false,
            }]);
            setNewRuleName('');
            setNewRuleTrigger('');
            setIsAddRuleModalOpen(false);
        }
    };

    const toggleRuleStatus = (id: number) => {
        setAutomationRules(prev => prev.map(rule =>
            rule.id === id ? { ...rule, status: rule.status === 'Active' ? 'Inactive' : 'Active' } : rule
        ));
    };

    return (
        <>
            {isAddRuleModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setIsAddRuleModalOpen(false)}>
                    <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-white">Add New Automation Rule</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                type="text"
                                value={newRuleName}
                                onChange={(e) => setNewRuleName(e.target.value)}
                                placeholder="Rule Name (e.g., Auto-archive old invoices)"
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            <input
                                type="text"
                                value={newRuleTrigger}
                                onChange={(e) => setNewRuleTrigger(e.target.value)}
                                placeholder="Trigger (e.g., Monthly, New Invoice, API Error)"
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            <button onClick={handleAddRule} className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg">Add Rule</button>
                        </div>
                    </div>
                </div>
            )}
            <Card title="AI-Powered Workflow Automation">
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">Active Automation Rules</h3>
                        <button onClick={() => setIsAddRuleModalOpen(true)} className="py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm">
                            + Add New Rule
                        </button>
                    </div>
                    <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-700">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rule Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trigger</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">AI Suggested</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {automationRules.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-gray-800/70">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{rule.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{rule.trigger}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                rule.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>{rule.status}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {rule.aiSuggested ? <span className="text-cyan-400">Yes</span> : <span className="text-gray-500">No</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => toggleRuleStatus(rule.id)} className="text-cyan-600 hover:text-cyan-900 mr-4">
                                                {rule.status === 'Active' ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button className="text-gray-400 hover:text-white">
                                                <SettingsIcon className="h-5 w-5 inline-block" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {geminiApiKey && aiAutomationSuggestions.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-white">AI-Suggested Automations</h4>
                            <ul className="list-disc list-inside text-gray-300 space-y-2 bg-gray-900 p-4 rounded-lg border border-gray-700">
                                {aiAutomationSuggestions.map((suggestion, idx) => (
                                    <li key={idx} className="text-sm">{suggestion}</li>
                                ))}
                            </ul>
                            <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm">Explore AI Automation Templates</button>
                        </div>
                    )}
                </div>
            </Card>
        </>
    );
};

const UserProfileManagement: React.FC<{ geminiApiKey: string | null }> = ({ geminiApiKey }) => {
    const [userProfile, setUserProfile] = useState({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        role: 'Financial Analyst',
        lastLogin: '2024-07-20 10:30 AM',
        preferredLanguage: 'English',
        aiPersonalizationEnabled: true,
    });
    const [aiPersonalizationInsights, setAiPersonalizationInsights] = useState<string[]>([]);

    useEffect(() => {
        if (geminiApiKey && userProfile.aiPersonalizationEnabled) {
            const insights = [
                "AI suggests tailoring dashboard views to prioritize financial KPIs for 'Financial Analyst' role.",
                "Recommended personalized learning paths for advanced Modern Treasury features based on user activity.",
                "AI detected peak usage hours for this user; optimizing background data sync during off-peak times.",
                "Personalized notification preferences based on user's interaction patterns."
            ];
            setAiPersonalizationInsights(insights);
        } else {
            setAiPersonalizationInsights([]);
        }
    }, [geminiApiKey, userProfile.aiPersonalizationEnabled]);

    const toggleAIPersonalization = () => {
        setUserProfile(prev => ({ ...prev, aiPersonalizationEnabled: !prev.aiPersonalizationEnabled }));
    };

    return (
        <Card title="AI-Enhanced User Profile">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Name</p>
                        <p className="text-lg font-semibold text-white">{userProfile.name}</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Email</p>
                        <p className="text-lg font-semibold text-white">{userProfile.email}</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Role</p>
                        <p className="text-lg font-semibold text-white">{userProfile.role}</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Last Login</p>
                        <p className="text-lg font-semibold text-white">{userProfile.lastLogin}</p>
                    </div>
                </div>

                {geminiApiKey && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-white">AI Personalization & Adaptive UI</h4>
                            <label className="flex items-center cursor-pointer">
                                <span className="mr-3 text-sm text-gray-400">Enable AI Personalization</span>
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={userProfile.aiPersonalizationEnabled} onChange={toggleAIPersonalization} />
                                    <div className={`block w-10 h-6 rounded-full ${userProfile.aiPersonalizationEnabled ? 'bg-cyan-600' : 'bg-gray-600'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${userProfile.aiPersonalizationEnabled ? 'translate-x-full' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                        {userProfile.aiPersonalizationEnabled && aiPersonalizationInsights.length > 0 ? (
                            <ul className="list-disc list-inside text-gray-300 space-y-2 bg-gray-900 p-4 rounded-lg border border-gray-700">
                                {aiPersonalizationInsights.map((insight, idx) => (
                                    <li key={idx} className="text-sm">{insight}</li>
                                ))}
                            </ul>
                        ) : userProfile.aiPersonalizationEnabled ? (
                            <p className="text-gray-500 italic bg-gray-900 p-4 rounded-lg border border-gray-700">AI is learning your preferences to personalize your experience...</p>
                        ) : (
                            <p className="text-gray-500 italic">Enable AI Personalization to get a tailored experience, adaptive dashboards, and smart recommendations.</p>
                        )}
                    </div>
                )}
                <button className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">Edit Profile Settings</button>
            </div>
        </Card>
    );
};

const HighFrequencyTradingDashboard: React.FC<{ geminiApiKey: string | null }> = ({ geminiApiKey }) => {
    const [marketData, setMarketData] = useState<{ time: number; price: number }[]>([]);
    const [strategies, setStrategies] = useState([
        { id: 1, name: 'QuantumLeap Momentum', status: 'Active', pnl: 12530.55, asset: 'BTC/USD' },
        { id: 2, name: 'ArbitrageAlpha', status: 'Active', pnl: 8740.12, asset: 'ETH/USD' },
        { id: 3, name: 'MeanReversion Bot', status: 'Inactive', pnl: -1230.78, asset: 'SOL/USD' },
    ]);
    const [tradeLog, setTradeLog] = useState<{ time: string; type: 'BUY' | 'SELL'; asset: string; price: number; size: number }[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMarketData(prev => {
                const lastPrice = prev.length > 0 ? prev[prev.length - 1].price : 60000;
                const newPrice = lastPrice + (Math.random() - 0.5) * 100;
                const newData = [...prev.slice(-99), { time: Date.now(), price: newPrice }];
                return newData;
            });

            if (Math.random() > 0.7) {
                setTradeLog(prev => {
                    const newTrade = {
                        time: new Date().toLocaleTimeString(),
                        type: (Math.random() > 0.5 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
                        asset: 'BTC/USD',
                        price: 60000 + (Math.random() - 0.5) * 100,
                        size: Math.random() * 2,
                    };
                    return [newTrade, ...prev.slice(0, 99)];
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card title="AI-Powered High-Frequency Trading">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-80 bg-gray-900 rounded-lg p-4 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-2">Live Market Data (BTC/USD)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={marketData}>
                                <defs><linearGradient id="hftColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient></defs>
                                <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} stroke="#9ca3af" />
                                <YAxis domain={['dataMin - 100', 'dataMax + 100']} stroke="#9ca3af" />
                                <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#4b5563' }} />
                                <Area type="monotone" dataKey="price" stroke="#06b6d4" fill="url(#hftColor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-900 rounded-lg border border-gray-700">
                        <h4 className="text-lg font-semibold text-white p-4">Live Trade Log</h4>
                        <div className="overflow-y-auto h-64">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Asset</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Price</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Size</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {tradeLog.map((trade, i) => (
                                        <tr key={i} className="hover:bg-gray-800/70">
                                            <td className="px-4 py-2 text-sm text-gray-300">{trade.time}</td>
                                            <td className={`px-4 py-2 text-sm font-bold ${trade.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{trade.type}</td>
                                            <td className="px-4 py-2 text-sm text-white">{trade.asset}</td>
                                            <td className="px-4 py-2 text-sm text-gray-300">{trade.price.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-sm text-gray-300">{trade.size.toFixed(4)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-2">Trading Strategies</h4>
                        <ul className="space-y-2">
                            {strategies.map(s => (
                                <li key={s.id} className="p-3 bg-gray-800/50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-white">{s.name}</span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${s.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{s.status}</span>
                                    </div>
                                    <p className={`text-lg font-bold ${s.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        PNL: ${s.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full mt-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm">Deploy New Strategy</button>
                    </div>
                    {geminiApiKey && (
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                            <h4 className="text-lg font-semibold text-white">AI Trade Signals & Insights</h4>
                            <ul className="list-disc list-inside text-gray-300 text-sm space-y-2">
                                <li>AI Signal: Strong buy signal for ETH/USD based on order book imbalance. Confidence: 92%.</li>
                                <li>Market Anomaly: Unusual volume spike detected on SOL/USD. Potential for high volatility.</li>
                                <li>Prediction: AI forecasts a 3% upward trend for BTC/USD in the next 60 minutes.</li>
                            </ul>
                            <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm">Execute AI-Suggested Trades</button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

const LegalComplianceAI: React.FC<{ geminiApiKey: string | null }> = ({ geminiApiKey }) => {
    return (
        <Card title="AI-Powered Legal & Compliance">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Compliance Status</p>
                        <p className="text-2xl font-bold text-green-400">99.8% Compliant</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Contracts Analyzed (24h)</p>
                        <p className="text-2xl font-bold text-white">12</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Regulatory Alerts</p>
                        <p className="text-2xl font-bold text-yellow-400">3 Pending Review</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                        <h4 className="text-lg font-semibold text-white">AI Contract Analysis</h4>
                        <p className="text-sm text-gray-400">Upload a contract to have our AI analyze it for risks, non-standard clauses, and compliance issues.</p>
                        <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg text-center">
                            <p className="text-gray-400">Drag & drop a document or click to upload</p>
                            <button className="mt-2 py-1 px-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm">Upload Contract</button>
                        </div>
                        <p className="text-sm text-gray-300">Last analysis: <span className="font-mono">MSA_Vendor_XYZ.pdf</span> - <span className="text-green-400">No critical risks found.</span></p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                        <h4 className="text-lg font-semibold text-white">Real-time Compliance Monitoring</h4>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center justify-between"><span className="text-gray-300">AML/KYC Checks</span><span className="text-green-400">Operational</span></li>
                            <li className="flex items-center justify-between"><span className="text-gray-300">GDPR Data Handling</span><span className="text-green-400">Operational</span></li>
                            <li className="flex items-center justify-between"><span className="text-gray-300">SEC Filing Deadlines</span><span className="text-yellow-400">Approaching</span></li>
                            <li className="flex items-center justify-between"><span className="text-gray-300">OFAC Sanctions Screening</span><span className="text-green-400">Operational</span></li>
                        </ul>
                        <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm">View Full Compliance Report</button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const APIIntegrationView: React.FC = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("APIIntegrationView must be within a DataProvider.");
    const {
        apiStatus,
        geminiApiKey, setGeminiApiKey,
        modernTreasuryApiKey, setModernTreasuryApiKey,
        modernTreasuryOrganizationId, setModernTreasuryOrganizationId
    } = context;

    const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
    const [geminiApiKeyInput, setGeminiApiKeyInput] = useState(geminiApiKey || '');

    const [isMtModalOpen, setIsMtModalOpen] = useState(false);
    const [mtApiKeyInput, setMtApiKeyInput] = useState(modernTreasuryApiKey || '');
    const [mtOrgIdInput, setMtOrgIdInput] = useState(modernTreasuryOrganizationId || '');

    const [isPlaidModalOpen, setIsPlaidModalOpen] = useState(false);
    const [plaidClientIdInput, setPlaidClientIdInput] = useState('');
    const [plaidSecretInput, setPlaidSecretInput] = useState('');

    const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
    const [stripeApiKeyInput, setStripeApiKeyInput] = useState('');

    const [activeMainTab, setActiveMainTab] = useState<'system' | 'finance' | 'hft' | 'bi' | 'automation' | 'legal' | 'profile' | 'chat'>('system');

    const handleSaveGeminiKey = () => {
        setGeminiApiKey(geminiApiKeyInput);
        setIsGeminiModalOpen(false);
    };

    const handleSaveMtKey = () => {
        setModernTreasuryApiKey(mtApiKeyInput);
        setModernTreasuryOrganizationId(mtOrgIdInput);
        setIsMtModalOpen(false);
    };

    const handleSavePlaidKeys = () => {
        // In a real app, you'd save these securely
        setIsPlaidModalOpen(false);
    };

    const handleSaveStripeKey = () => {
        // In a real app, you'd save this securely
        setIsStripeModalOpen(false);
    };

    const renderMainContent = () => {
        switch (activeMainTab) {
            case 'system':
                return (
                    <div className="space-y-6">
                        <Card title="Core System & API Status Overview">
                            <div className="space-y-3">
                                {apiStatus.map(api => (
                                    <div key={api.provider} className="flex flex-col sm:flex-row justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                                        <h4 className="font-semibold text-lg text-white mb-2 sm:mb-0">{api.provider}</h4>
                                        <div className="flex items-center gap-4">
                                            <p className="text-sm text-gray-400 font-mono">{api.responseTime}ms</p>
                                            <StatusIndicator status={api.status} />
                                            {api.provider === 'Google Gemini' && (
                                                <button onClick={() => { setGeminiApiKeyInput(geminiApiKey || ''); setIsGeminiModalOpen(true); }} className="text-gray-400 hover:text-white">
                                                    <SettingsIcon className="h-5 w-5"/>
                                                </button>
                                            )}
                                            {api.provider === 'Modern Treasury' && (
                                                <button onClick={() => { setMtApiKeyInput(modernTreasuryApiKey || ''); setMtOrgIdInput(modernTreasuryOrganizationId || ''); setIsMtModalOpen(true); }} className="text-gray-400 hover:text-white">
                                                    <SettingsIcon className="h-5 w-5"/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                        <Card title="Simulated Live API Traffic">
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={Array.from({length: 20}, (_, i) => ({name: i, calls: 50 + Math.random() * 50}))}>
                                        <defs><linearGradient id="apiColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient></defs>
                                        <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} />
                                        <Area type="monotone" dataKey="calls" stroke="#06b6d4" fill="url(#apiColor)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                        <APIMonitoringDashboard
                            apiStatus={apiStatus}
                            geminiApiKey={geminiApiKey}
                            onConfigurePlaid={() => setIsPlaidModalOpen(true)}
                            onConfigureStripe={() => setIsStripeModalOpen(true)}
                        />
                    </div>
                );
            case 'finance':
                return <FinancialOperationsDashboard modernTreasuryApiKey={modernTreasuryApiKey} modernTreasuryOrganizationId={modernTreasuryOrganizationId} geminiApiKey={geminiApiKey} />;
            case 'hft':
                return <HighFrequencyTradingDashboard geminiApiKey={geminiApiKey} />;
            case 'bi':
                return <BusinessIntelligenceDashboard geminiApiKey={geminiApiKey} />;
            case 'automation':
                return <WorkflowAutomation geminiApiKey={geminiApiKey} />;
            case 'legal':
                return <LegalComplianceAI geminiApiKey={geminiApiKey} />;
            case 'profile':
                return <UserProfileManagement geminiApiKey={geminiApiKey} />;
            case 'chat':
                return <AIChatAssistant geminiApiKey={geminiApiKey} />;
            default:
                return null;
        }
    };

    return (
        <>
            {isPlaidModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setIsPlaidModalOpen(false)}>
                    <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-white">Configure Plaid API</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-400">Enter your Plaid Client ID and Secret to enable financial data aggregation. Your credentials are stored locally.</p>
                            <input
                                type="text"
                                value={plaidClientIdInput}
                                onChange={(e) => setPlaidClientIdInput(e.target.value)}
                                placeholder="Enter your Plaid Client ID"
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                             <input
                                type="password"
                                value={plaidSecretInput}
                                onChange={(e) => setPlaidSecretInput(e.target.value)}
                                placeholder="Enter your Plaid Secret"
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            <button onClick={handleSavePlaidKeys} className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg">Save Credentials</button>
                        </div>
                    </div>
                </div>
            )}
            {isStripeModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setIsStripeModalOpen(false)}>
                    <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-white">Configure Stripe API Key</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-400">Enter your API key to enable payment processing. Your key is stored locally in your browser and is not sent to our servers.</p>
                            <input
                                type="password"
                                value={stripeApiKeyInput}
                                onChange={(e) => setStripeApiKeyInput(e.target.value)}
                                placeholder="Enter your Stripe API Key"
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            <button onClick={handleSaveStripeKey} className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg">Save Key</button>
                        </div>
                    </div>
                </div>
            )}
            {isGeminiModalOpen && (
                 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setIsGeminiModalOpen(false)}>
                    <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-white">Configure Google Gemini API Key</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-400">Enter your API key to enable all AI features. Your key is stored locally in your browser and is not sent to our servers.</p>
                            <input
                                type="password"
                                value={geminiApiKeyInput}
                                onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                                placeholder="Enter your Gemini API Key"
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            <button onClick={handleSaveGeminiKey} className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg">Save Key</button>
                        </div>
                    </div>
                </div>
            )}
             {isMtModalOpen && (
                 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setIsMtModalOpen(false)}>
                    <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-white">Configure Modern Treasury API</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-400">Enter your API key and Organization ID to enable payment operations. Your credentials are stored locally.</p>
                            <input
                                type="password"
                                value={mtApiKeyInput}
                                onChange={(e) => setMtApiKeyInput(e.target.value)}
                                placeholder="Enter your Modern Treasury API Key"
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                             <input
                                type="text"
                                value={mtOrgIdInput}
                                onChange={(e) => setMtOrgIdInput(e.target.value)}
                                placeholder="Enter your Organization ID"
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            <button onClick={handleSaveMtKey} className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg">Save Credentials</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white tracking-wider">Enterprise Operating System Dashboard</h2>

                <div className="border-b border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Main Tabs">
                        {['system', 'finance', 'hft', 'bi', 'automation', 'legal', 'profile', 'chat'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveMainTab(tab as any)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200 ${
                                    activeMainTab === tab
                                        ? 'border-cyan-500 text-cyan-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {tab.replace('-', ' ')}
                            </button>
                        ))}
                    </nav>
                </div>

                {renderMainContent()}
            </div>
        </>
    );
};

export default APIIntegrationView;