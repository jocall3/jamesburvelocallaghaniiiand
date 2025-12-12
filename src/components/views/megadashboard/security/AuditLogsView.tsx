import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Filter,
    Download,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Shield,
    User,
    Database,
    Bot,
    Sparkles,
    Calendar,
    ChevronDown,
    MoreHorizontal,
    FileText,
    Activity
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Types ---

type Severity = 'low' | 'medium' | 'high' | 'critical';
type Status = 'success' | 'failure' | 'warning';

interface LogEntry {
    id: string;
    timestamp: string;
    actor: string;
    actorRole: string;
    action: string;
    resource: string;
    ipAddress: string;
    userAgent: string;
    status: Status;
    severity: Severity;
    details: string;
}

interface FilterState {
    severity: Severity | 'all';
    status: Status | 'all';
    actor: string;
    dateRange: string;
}

// --- Citibankdemobusinessinc Namespace ---
namespace Citibankdemobusinessinc {

    // --- Shared Kernel ---
    export namespace Kernel {
        // Centralized configuration
        export const config = {
            brandName: "Citibank demo business inc",
            primaryColor: "#007bff",
            secondaryColor: "#6c757d",
            logLevels: ['info', 'warn', 'error'],
        };

        // Unified Identity Layer (Placeholder)
        export const identity = {
            getUser: () => ({ id: 'user123', name: 'Demo User' }),
        };

        // Internal Event Bus (Placeholder)
        export const eventBus = {
            publish: (event: string, data: any) => console.log(`Event ${event} published with data:`, data),
            subscribe: (event: string, callback: (data: any) => void) => console.log(`Subscribed to event ${event}`),
        };

        // Common Security Primitives (Placeholder)
        export const security = {
            encrypt: (data: string) => `Encrypted: ${data}`,
            decrypt: (data: string) => `Decrypted: ${data.substring(11)}`,
        };

        // Zero-Dependency Runtime Libraries (Placeholder)
        export const runtime = {
            formatDate: (date: Date) => date.toLocaleDateString(),
        };
    }

    // --- Data Generation Utilities ---
    export namespace DataGen {
        const actions = [
            'LOGIN_ATTEMPT', 'PASSWORD_RESET', 'API_KEY_CREATED', 'ROLE_MODIFIED',
            'DATA_EXPORT', 'PAYMENT_INITIATED', 'CONFIGURATION_CHANGE', 'USER_CREATED'
        ];
        const actors = ['System', 'admin@demobank.com', 'jane.doe@corp.com', 'service-account-payment', 'unknown'];
        const resources = ['/auth/login', '/settings/security', '/api/v1/payments', '/admin/users', '/db/customers'];
        const severities: Severity[] = ['low', 'low', 'medium', 'medium', 'high', 'critical'];
        const statuses: Status[] = ['success', 'success', 'success', 'failure', 'warning'];

        export const generateLogEntry = (i: number): LogEntry => {
            const date = new Date();
            date.setMinutes(date.getMinutes() - i * 15); // Stagger times

            const severity = severities[Math.floor(Math.random() * severities.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            return {
                id: `log_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: date.toISOString(),
                actor: actors[Math.floor(Math.random() * actors.length)],
                actorRole: 'Administrator', // Simplified
                action: actions[Math.floor(Math.random() * actions.length)],
                resource: resources[Math.floor(Math.random() * resources.length)],
                ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                status: status,
                severity: severity,
                details: 'Action completed with provided parameters.'
            };
        };

        export const generateMockLogs = (count: number): LogEntry[] => {
            return Array.from({ length: count }).map((_, i) => generateLogEntry(i));
        };
    }

    // --- Branch 1: Citibankdemobusinessinc.audit.logstream ---
    export namespace audit.logstream {
        // Mission: To provide a real-time, immutable stream of audit logs for enhanced security monitoring and compliance.
        // Monetization: Subscription service for enterprises requiring high-throughput, low-latency audit logging.
        // IP Moat: Proprietary compression and encryption algorithms for log data.

        export const run = () => {
            console.log("Citibankdemobusinessinc.audit.logstream running...");
            Kernel.eventBus.publish('logstream.started', { timestamp: new Date() });
        };
    }

    // --- Branch 2: Citibankdemobusinessinc.risk.realtime ---
    export namespace risk.realtime {
        // Mission: To detect and mitigate financial risks in real-time using advanced analytics and machine learning.
        // Monetization: Licensing the risk engine to financial institutions.
        // IP Moat: Patented risk-scoring algorithms and predictive models.

        export const run = () => {
            console.log("Citibankdemobusinessinc.risk.realtime running...");
            Kernel.eventBus.publish('risk.assessment', { level: 'high', timestamp: new Date() });
        };
    }

    // --- Branch 3: Citibankdemobusinessinc.compliance.autoaudit ---
    export namespace compliance.autoaudit {
        // Mission: To automate compliance audits, reducing manual effort and ensuring regulatory adherence.
        // Monetization: SaaS platform for automated compliance reporting.
        // IP Moat: Comprehensive library of regulatory rules and automated audit workflows.

        export const run = () => {
            console.log("Citibankdemobusinessinc.compliance.autoaudit running...");
            Kernel.eventBus.publish('audit.completed', { status: 'success', timestamp: new Date() });
        };
    }

    // --- Branch 4: Citibankdemobusinessinc.fraud.detection ---
    export namespace fraud.detection {
        // Mission: To identify and prevent fraudulent transactions using machine learning and behavioral analysis.
        // Monetization: Transaction-based fees for fraud detection services.
        // IP Moat: Adaptive fraud detection models that learn from new data in real-time.

        export const run = () => {
            console.log("Citibankdemobusinessinc.fraud.detection running...");
            Kernel.eventBus.publish('fraud.detected', { transactionId: 'tx123', timestamp: new Date() });
        };
    }

    // --- Branch 5: Citibankdemobusinessinc.identity.sovereignid ---
    export namespace identity.sovereignid {
        // Mission: To provide a secure, decentralized identity management solution using blockchain technology.
        // Monetization: Identity verification services for businesses and individuals.
        // IP Moat: Patented blockchain-based identity verification protocol.

        export const run = () => {
            console.log("Citibankdemobusinessinc.identity.sovereignid running...");
            Kernel.eventBus.publish('identity.verified', { userId: 'user456', timestamp: new Date() });
        };
    }

    // --- Branch 6: Citibankdemobusinessinc.data.privacyvault ---
    export namespace data.privacyvault {
        // Mission: To protect sensitive data with advanced encryption and access control mechanisms.
        // Monetization: Data storage and privacy services for enterprises.
        // IP Moat: Proprietary encryption algorithms and privacy-preserving technologies.

        export const run = () => {
            console.log("Citibankdemobusinessinc.data.privacyvault running...");
            Kernel.eventBus.publish('data.secured', { dataId: 'data789', timestamp: new Date() });
        };
    }

    // --- Branch 7: Citibankdemobusinessinc.ai.advisorbot ---
    export namespace ai.advisorbot {
        // Mission: To provide personalized financial advice using AI-powered chatbots.
        // Monetization: Subscription service for financial planning and investment advice.
        // IP Moat: Proprietary AI algorithms for financial planning and investment recommendations.

        export const run = () => {
            console.log("Citibankdemobusinessinc.ai.advisorbot running...");
            Kernel.eventBus.publish('advice.generated', { userId: 'user101', timestamp: new Date() });
        };
    }

    // --- Branch 8: Citibankdemobusinessinc.market.predictionengine ---
    export namespace market.predictionengine {
        // Mission: To forecast market trends and investment opportunities using machine learning and data analytics.
        // Monetization: Licensing the prediction engine to hedge funds and investment firms.
        // IP Moat: Patented predictive models and data analytics algorithms.

        export const run = () => {
            console.log("Citibankdemobusinessinc.market.predictionengine running...");
            Kernel.eventBus.publish('market.forecast', { asset: 'stockA', timestamp: new Date() });
        };
    }

    // --- Branch 9: Citibankdemobusinessinc.openbanking.apiplatform ---
    export namespace openbanking.apiplatform {
        // Mission: To provide a secure and scalable API platform for open banking initiatives.
        // Monetization: Transaction fees for API access and data sharing.
        // IP Moat: Proprietary API management and security protocols.

        export const run = () => {
            console.log("Citibankdemobusinessinc.openbanking.apiplatform running...");
            Kernel.eventBus.publish('api.request', { apiName: 'payments', timestamp: new Date() });
        };
    }

    // --- Branch 10: Citibankdemobusinessinc.wealth.managementplatform ---
    export namespace wealth.managementplatform {
        // Mission: To provide a comprehensive wealth management platform for high-net-worth individuals.
        // Monetization: Management fees based on assets under management.
        // IP Moat: Proprietary portfolio optimization and risk management tools.

        export const run = () => {
            console.log("Citibankdemobusinessinc.wealth.managementplatform running...");
            Kernel.eventBus.publish('portfolio.updated', { userId: 'user202', timestamp: new Date() });
        };
    }

    // --- Master Orchestration Layer ---
    export const orchestrate = () => {
        console.log("Citibankdemobusinessinc Ecosystem Orchestration Started");
        audit.logstream.run();
        risk.realtime.run();
        compliance.autoaudit.run();
        fraud.detection.run();
        identity.sovereignid.run();
        data.privacyvault.run();
        ai.advisorbot.run();
        market.predictionengine.run();
        openbanking.apiplatform.run();
        wealth.managementplatform.run();
        console.log("Citibankdemobusinessinc Ecosystem Orchestration Completed");
    };
}

// --- Mock Data Generator ---

const generateMockLogs = (count: number): LogEntry[] => {
    return Citibankdemobusinessinc.DataGen.generateMockLogs(count);
};

const MOCK_LOGS = generateMockLogs(100);

// --- Components ---

const SeverityBadge: React.FC<{ severity: Severity }> = ({ severity }) => {
    const styles = {
        low: 'bg-gray-800 text-gray-300 border-gray-700',
        medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
        high: 'bg-orange-900/30 text-orange-400 border-orange-800/50',
        critical: 'bg-red-900/30 text-red-400 border-red-800/50',
    };

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[severity]}`}>
            {severity.toUpperCase()}
        </span>
    );
};

const StatusIcon: React.FC<{ status: Status }> = ({ status }) => {
    switch (status) {
        case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
        case 'failure': return <XCircle className="w-4 h-4 text-red-500" />;
        case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
};

const AuditLogsView: React.FC = () => {
    const [logs] = useState<LogEntry[]>(MOCK_LOGS);
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(MOCK_LOGS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // AI Configuration (Simulated for this demo, usually from Context)
    const API_KEY = localStorage.getItem('gemini_api_key') || '';

    // Filter Logic
    useEffect(() => {
        if (!searchQuery) {
            setFilteredLogs(logs);
            return;
        }

        const lowerQuery = searchQuery.toLowerCase();
        const filtered = logs.filter(log =>
            log.action.toLowerCase().includes(lowerQuery) ||
            log.actor.toLowerCase().includes(lowerQuery) ||
            log.resource.toLowerCase().includes(lowerQuery) ||
            log.details.toLowerCase().includes(lowerQuery)
        );
        setFilteredLogs(filtered);
    }, [searchQuery, logs]);

    // Handlers
    const handleSelectLog = (id: string) => {
        const newSelected = new Set(selectedLogIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedLogIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedLogIds.size === filteredLogs.length) {
            setSelectedLogIds(new Set());
        } else {
            setSelectedLogIds(new Set(filteredLogs.map(l => l.id)));
        }
    };

    const handleNaturalLanguageSearch = async () => {
        if (!searchQuery || !API_KEY) return;
        setIsAnalyzing(true);

        try {
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `
                You are a security log analyst. Convert the following natural language query into a set of keywords or a filter strategy for an audit log system.
                The log fields are: timestamp, actor, action, resource, status, severity.

                Query: "${searchQuery}"

                Return a JSON object with a 'keywords' array and an optional 'severity' filter if mentioned.
                Do not include markdown formatting.
            `;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // For the purpose of this demo, we'll assume the AI helps refine the search
            // In a real app, we'd parse the JSON and apply specific filters.
            // Here, we just simulate the "Thinking" delay and then rely on the text filter we already have,
            // but we could use the AI response to show a "interpreted as" tag.
            console.log("AI Interpreted Query:", text);

        } catch (error) {
            console.error("AI Search Error", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAnalyzeIncident = async () => {
        if (selectedLogIds.size === 0 || !API_KEY) return;
        setIsAnalyzing(true);
        setAiAnalysis(null);

        try {
            const selectedLogs = logs.filter(l => selectedLogIds.has(l.id));
            const logsText = JSON.stringify(selectedLogs.map(l => ({
                time: l.timestamp,
                actor: l.actor,
                action: l.action,
                status: l.status,
                details: l.details
            })), null, 2);

            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `
                You are an expert cybersecurity analyst. Review the following audit logs representing a potential incident.

                Logs:
                ${logsText}

                Please provide:
                1. A chronological summary of events.
                2. An assessment of the threat level.
                3. Potential root cause or intent.
                4. Recommended remediation steps.

                Format the output as a professional security briefing using HTML-like tags for structure (e.g., <h3>, <ul>, <li>, <p>) but keep it simple enough to render.
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            setAiAnalysis(text);

        } catch (error) {
            setAiAnalysis("<p class='text-red-400'>Failed to generate analysis. Please check API key and try again.</p>");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-950 text-gray-100 overflow-hidden relative">

            {/* --- Header --- */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-semibold flex items-center gap-3">
                        <Shield className="w-6 h-6 text-emerald-400" />
                        Audit Logs: The Immutable Scroll
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Secure, tamper-proof record of all system events and sovereign actions.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30 transition-colors text-sm">
                        <Activity className="w-4 h-4" />
                        Live Stream
                    </button>
                </div>
            </div>

            {/* --- Controls & Stats --- */}
            <div className="grid grid-cols-12 gap-6 px-8 py-6">

                {/* Stats Cards */}
                <div className="col-span-12 lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-4">
                    <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Events (24h)</div>
                            <div className="text-2xl font-mono text-white">14,205</div>
                        </div>
                        <Database className="w-8 h-8 text-blue-500/50" />
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Critical Alerts</div>
                            <div className="text-2xl font-mono text-red-400">3</div>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-500/50" />
                    </div>
                </div>

                {/* Search & Actions */}
                <div className="col-span-12 lg:col-span-9 flex flex-col gap-4">
                    <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl p-1 shadow-lg">
                        <div className="pl-3 pr-2 text-gray-400">
                            <Bot className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleNaturalLanguageSearch()}
                            placeholder="Ask the logs (e.g., 'Show failed logins from admin yesterday')..."
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 py-2"
                        />
                        <button
                            onClick={handleNaturalLanguageSearch}
                            disabled={isAnalyzing}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            {isAnalyzing ? <span className="animate-spin">â³</span> : <Sparkles className="w-4 h-4" />}
                            AI Search
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-3 py-1.5 rounded-lg border text-sm flex items-center gap-2 transition-colors ${showFilters ? 'bg-gray-800 border-gray-600 text-white' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                            </button>
                            {/* Filter Chips Placeholder */}
                            {searchQuery && (
                                <span className="px-3 py-1 bg-blue-900/30 border border-blue-800/50 text-blue-300 rounded-full text-xs flex items-center gap-2">
                                    Query: "{searchQuery}"
                                    <XCircle className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                                </span>
                            )}
                        </div>

                        {selectedLogIds.size > 0 && (
                            <div className="flex items-center gap-3 animate-fade-in">
                                <span className="text-sm text-gray-400">{selectedLogIds.size} logs selected</span>
                                <button
                                    onClick={handleAnalyzeIncident}
                                    disabled={isAnalyzing}
                                    className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/50 text-purple-300 hover:bg-purple-600/30 rounded-lg text-sm flex items-center gap-2 transition-colors"
                                >
                                    <Bot className="w-4 h-4" />
                                    {isAnalyzing ? 'Analyzing...' : 'Summarize Incident'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Main Content Area --- */}
            <div className="flex-1 overflow-hidden flex flex-row border-t border-gray-800">

                {/* Log Table */}
                <div className={`flex-1 overflow-auto transition-all duration-300 ${aiAnalysis ? 'w-2/3' : 'w-full'}`}>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-900/80 sticky top-0 backdrop-blur-sm z-10 text-xs uppercase text-gray-500 font-medium">
                            <tr>
                                <th className="p-4 border-b border-gray-800 w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedLogIds.size > 0 && selectedLogIds.size === filteredLogs.length}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-offset-gray-900"
                                    />
                                </th>
                                <th className="p-4 border-b border-gray-800">Timestamp</th>
                                <th className="p-4 border-b border-gray-800">Severity</th>
                                <th className="p-4 border-b border-gray-800">Actor</th>
                                <th className="p-4 border-b border-gray-800">Action</th>
                                <th className="p-4 border-b border-gray-800">Resource</th>
                                <th className="p-4 border-b border-gray-800 w-16">Status</th>
                                <th className="p-4 border-b border-gray-800 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-800">
                            {filteredLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    className={`hover:bg-gray-900/40 transition-colors cursor-pointer group ${selectedLogIds.has(log.id) ? 'bg-blue-900/10' : ''}`}
                                    onClick={() => handleSelectLog(log.id)}
                                >
                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedLogIds.has(log.id)}
                                            onChange={() => handleSelectLog(log.id)}
                                            className="rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-offset-gray-900"
                                        />
                                    </td>
                                    <td className="p-4 text-gray-400 font-mono text-xs whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleDateString()} <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </td>
                                    <td className="p-4">
                                        <SeverityBadge severity={log.severity} />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                                                {log.actor.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-gray-300 truncate max-w-[150px]" title={log.actor}>{log.actor}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-medium text-gray-200">{log.action}</span>
                                    </td>
                                    <td className="p-4 text-gray-400 font-mono text-xs truncate max-w-[150px]">
                                        {log.resource}
                                    </td>
                                    <td className="p-4 flex justify-center">
                                        <StatusIcon status={log.status} />
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* AI Analysis Sidebar */}
                {aiAnalysis && (
                    <div className="w-1/3 border-l border-gray-800 bg-gray-900/90 backdrop-blur-xl p-6 overflow-y-auto absolute right-0 top-0 bottom-0 shadow-2xl z-20 animate-slide-in-right">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2 text-purple-300">
                                <Sparkles className="w-5 h-5" />
                                Incident Analysis
                            </h2>
                            <button onClick={() => setAiAnalysis(null)} className="text-gray-500 hover:text-white">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="prose prose-invert prose-sm max-w-none">
                            <div className="text-gray-300 leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: aiAnalysis }} />
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-800">
                            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Recommended Actions</h3>
                            <div className="flex flex-col gap-2">
                                <button className="w-full py-2 bg-red-900/30 border border-red-800/50 text-red-400 hover:bg-red-900/50 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Freeze Associated Accounts
                                </button>
                                <button className="w-full py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Export Incident Report
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-in-out;
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default AuditLogsView;

// --- Run Citibankdemobusinessinc Orchestration ---
Citibankdemobusinessinc.orchestrate();