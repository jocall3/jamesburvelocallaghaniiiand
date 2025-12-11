import React, { useState, useMemo } from 'react';
import { Lightbulb, CheckCircle, XCircle, Clock, GitPullRequest, Zap, ScrollText, AlertTriangle, Shield, TrendingUp, Cpu, Server, Code, Layers } from 'lucide-react';
import { BarChart, LineChart } from '../data/charts'; // Assuming placeholder chart components

// --- Mock Data Structures ---

interface Pipeline {
    id: string;
    name: string;
    lastRun: string;
    status: 'Success' | 'Failed' | 'Running';
    duration: number; // seconds
    environment: 'Staging' | 'Production' | 'Dev';
}

interface PullRequest {
    id: string;
    title: string;
    author: string;
    status: 'Open' | 'Merged';
    changes: number; // lines changed
    aiReview: 'Pending' | 'Passed' | 'Failed' | 'Running';
}

interface Release {
    id: string;
    version: string;
    date: string;
    status: 'Deployed' | 'RolledBack' | 'Pending';
    commitCount: number;
    notesGenerated: boolean;
}

interface Incident {
    id: string;
    title: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    status: 'Active' | 'Resolved';
    affectedService: string;
    postmortemDrafted: boolean;
}

// --- Mock Data Generation ---

const mockPipelines: Pipeline[] = [
    { id: 'p-1', name: 'Frontend CI/CD', lastRun: '5 mins ago', status: 'Success', duration: 180, environment: 'Production' },
    { id: 'p-2', name: 'Core API Deployment', lastRun: '1 hour ago', status: 'Failed', duration: 450, environment: 'Production' },
    { id: 'p-3', name: 'Database Migrations', lastRun: '1 day ago', status: 'Success', duration: 60, environment: 'Staging' },
    { id: 'p-4', name: 'AI Model Retraining', lastRun: '2 hours ago', status: 'Running', duration: 320, environment: 'Dev' },
];

const mockPullRequests: PullRequest[] = [
    { id: 'pr-101', title: 'Feature: Implement new graph explorer', author: 'The Architect', status: 'Open', changes: 850, aiReview: 'Pending' },
    { id: 'pr-102', title: 'Fix: Null check in transaction history', author: 'Quantum', status: 'Open', changes: 12, aiReview: 'Passed' },
    { id: 'pr-103', title: 'Refactor: Optimize API gateway logic', author: 'Plato', status: 'Open', changes: 1200, aiReview: 'Running' },
    { id: 'pr-104', title: 'Update: dependency version bump', author: 'CI Bot', status: 'Merged', changes: 50, aiReview: 'Passed' },
];

const mockReleases: Release[] = [
    { id: 'r-4.0.1', version: '4.0.1', date: '2024-07-20', status: 'Deployed', commitCount: 45, notesGenerated: true },
    { id: 'r-4.0.2', version: '4.0.2', date: '2024-07-21', status: 'Pending', commitCount: 12, notesGenerated: false },
    { id: 'r-3.9.5', version: '3.9.5', date: '2024-07-15', status: 'RolledBack', commitCount: 20, notesGenerated: true },
];

const mockIncidents: Incident[] = [
    { id: 'inc-005', title: 'Partial outage: Core API', severity: 'Critical', status: 'Active', affectedService: 'Core API' , postmortemDrafted: false },
    { id: 'inc-004', title: 'High latency in transaction service', severity: 'High', status: 'Resolved', affectedService: 'Transaction Service', postmortemDrafted: true },
];

// --- Utility Components ---

const StatusBadge: React.FC<{ status: Pipeline['status'] | PullRequest['aiReview'] | Release['status'] | AnomalySeverity | Incident['status'] }> = ({ status }) => {
    const statusMap = {
        Success: { color: 'bg-green-600', text: 'Success', icon: CheckCircle },
        Failed: { color: 'bg-red-600', text: 'Failed', icon: XCircle },
        Running: { color: 'bg-blue-600', text: 'Running', icon: Clock },
        Pending: { color: 'bg-yellow-600', text: 'Pending', icon: Clock },
        Passed: { color: 'bg-green-600', text: 'Passed', icon: CheckCircle },
        Critical: { color: 'bg-red-700', text: 'Critical', icon: AlertTriangle },
        High: { color: 'bg-orange-600', text: 'High', icon: AlertTriangle },
        Medium: { color: 'bg-yellow-500', text: 'Medium', icon: AlertTriangle },
        Low: { color: 'bg-green-500', text: 'Low', icon: AlertTriangle },
        Active: { color: 'bg-red-600', text: 'Active', icon: AlertTriangle },
        Resolved: { color: 'bg-green-600', text: 'Resolved', icon: CheckCircle },
        Deployed: { color: 'bg-cyan-600', text: 'Deployed', icon: CheckCircle },
        RolledBack: { color: 'bg-purple-600', text: 'Rolled Back', icon: XCircle },
    };
    const { color, text, icon: Icon } = statusMap[status] || { color: 'bg-gray-500', text: status, icon: Clock };

    return (
        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${color} text-white`}>
            <Icon className="h-3 w-3 mr-1" />
            {text}
        </span>
    );
};

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl ${className}`}>
        <h3 className="text-xl font-semibold text-cyan-400 mb-4 border-b border-gray-800 pb-2">{title}</h3>
        {children}
    </div>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: React.ReactElement }> = ({ children, icon, className, ...props }) => (
    <button
        className={`flex items-center justify-center px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition duration-150 shadow-lg ${className}`}
        {...props}
    >
        {React.cloneElement(icon, { className: "h-4 w-4 mr-2" })}
        {children}
    </button>
);

// --- Main Component ---

const DemoBankDevOpsView: React.FC = () => {
    const [aiPostmortemLoading, setAiPostmortemLoading] = useState(false);
    const [aiReleaseNotesLoading, setAiReleaseNotesLoading] = useState(false);
    const [postmortemDraft, setPostmortemDraft] = useState('');

    const pipelineMetrics = useMemo(() => {
        const totalRuns = mockPipelines.length;
        const successCount = mockPipelines.filter(p => p.status === 'Success').length;
        const failedCount = mockPipelines.filter(p => p.status === 'Failed').length;
        const successRate = totalRuns > 0 ? ((successCount / totalRuns) * 100).toFixed(1) : '0';
        const activeIncidents = mockIncidents.filter(i => i.status === 'Active').length;
        return { totalRuns, successRate, failedCount, activeIncidents };
    }, []);

    // --- AI Simulation Handlers ---

    const handleGeneratePostmortem = (incidentId: string) => {
        setAiPostmortemLoading(true);
        setPostmortemDraft('');

        setTimeout(() => {
            const incident = mockIncidents.find(i => i.id === incidentId);
            if (incident) {
                const draft = `
                **Incident Postmortem Draft: ${incident.title} (${incident.id})**

                ---
                ### Summary
                On [Timestamp], the ${incident.affectedService} experienced a partial outage leading to a 30% increase in 5xx errors for 45 minutes. The root cause was identified as a resource leak during the peak usage period.

                ### AI-Driven Root Cause Analysis
                Analysis of logs showed an unexpected spike in connection pool consumption in the [Service Name] microservice immediately following a feature flag rollout on [Date]. The AI correlated this with PR-88 which introduced an unhandled database cursor closure exception.

                ### Mitigating Actions Recommended
                1.  Immediate rollback of the feature flag associated with PR-88. (Done)
                2.  Implement connection pool monitoring with an alert threshold of 80%.
                3.  Code review policy must include static analysis for resource handling in critical paths.

                ### Next Steps
                The team will commit to fixing PR-88 by the end of the current sprint.
                `;
                setPostmortemDraft(draft);
                // Simulate updating the mock data
                // mockIncidents.find(i => i.id === incidentId)!.postmortemDrafted = true;
            }
            setAiPostmortemLoading(false);
        }, 3000);
    };

    const handleGenerateReleaseNotes = (releaseId: string) => {
        setAiReleaseNotesLoading(true);
        setTimeout(() => {
            alert(`AI generated structured release notes for ${releaseId}!`);
            setAiReleaseNotesLoading(false);
        }, 1500);
    };

    const handleRunAiCodeReview = (prId: string) => {
        // Find PR and set to Running state
        const prIndex = mockPullRequests.findIndex(pr => pr.id === prId);
        if (prIndex !== -1) {
            // This is purely for demonstration; in a real app, use state/context
            mockPullRequests[prIndex].aiReview = 'Running';
        }

        setTimeout(() => {
            // Simulate AI Review Result
            const result: PullRequest['aiReview'] = prId === 'pr-101' ? 'Failed' : 'Passed';
            alert(`AI Review for ${prId}: ${result}.`);
             // Simulate updating the mock data
            if (prIndex !== -1) {
                mockPullRequests[prIndex].aiReview = result;
            }
        }, 2500);
    };

    // --- Render Sections ---

    const renderPipelines = () => (
        <Card title="CI/CD Pipelines: The Assembly Line">
            <div className="space-y-4">
                {mockPipelines.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-gray-950 p-3 rounded-lg border border-gray-800 hover:border-cyan-500 transition duration-200">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.environment} | Last Run: {p.lastRun}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <p className={`text-sm ${p.status === 'Success' ? 'text-green-400' : p.status === 'Failed' ? 'text-red-400' : 'text-blue-400'}`}>
                                {p.duration}s
                            </p>
                            <StatusBadge status={p.status} />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );

    const renderPullRequests = () => (
        <Card title="Code Review: AI Oversight">
            <p className="text-sm text-gray-400 mb-4">The AI Code Reviewer acts as a first-line reviewer, checking for best practices, security flaws, and resource leaks.</p>
            <div className="space-y-4">
                {mockPullRequests.filter(pr => pr.status === 'Open').map(pr => (
                    <div key={pr.id} className="flex justify-between items-center bg-gray-950 p-3 rounded-lg border border-gray-800">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-medium text-white truncate">{pr.title}</p>
                            <p className="text-xs text-gray-500">By {pr.author} | {pr.changes} lines changed</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <StatusBadge status={pr.aiReview} />
                            {pr.aiReview === 'Pending' && (
                                <Button
                                    icon={<Code />}
                                    onClick={() => handleRunAiCodeReview(pr.id)}
                                    className="bg-cyan-700 hover:bg-cyan-600 px-3 py-1 text-xs"
                                >
                                    Run AI Review
                                </Button>
                            )}
                            {pr.aiReview === 'Running' && (
                                <span className="text-sm text-blue-400 animate-pulse">Analyzing...</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );

    const renderReleaseManagement = () => (
        <Card title="Release Management: Structured Notes">
            <div className="space-y-4">
                {mockReleases.map(r => (
                    <div key={r.id} className="flex justify-between items-center bg-gray-950 p-3 rounded-lg border border-gray-800">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-medium text-white truncate">Version {r.version}</p>
                            <p className="text-xs text-gray-500">{r.commitCount} commits | Date: {r.date}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <StatusBadge status={r.status} />
                            {r.notesGenerated ? (
                                <p className="text-xs text-green-400">Notes Generated</p>
                            ) : (
                                <Button
                                    icon={<ScrollText />}
                                    onClick={() => handleGenerateReleaseNotes(r.id)}
                                    disabled={aiReleaseNotesLoading}
                                    className="bg-yellow-700 hover:bg-yellow-600 px-3 py-1 text-xs"
                                >
                                    {aiReleaseNotesLoading ? 'Generating...' : 'AI Notes Draft'}
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );

    const renderIncidentManagement = () => (
        <Card title="Incident Management: Postmortem Drafter">
            <p className="text-sm text-gray-400 mb-4">The AI automatically analyzes incident logs and commit history to draft the first pass of a postmortem document.</p>
            {mockIncidents.map(i => (
                <div key={i.id} className="mb-4 p-3 border border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-md font-semibold text-red-400">{i.title}</p>
                        <StatusBadge status={i.severity} />
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Service: {i.affectedService} | Status: <StatusBadge status={i.status} /></p>
                    <Button
                        icon={<Lightbulb />}
                        onClick={() => handleGeneratePostmortem(i.id)}
                        disabled={i.postmortemDrafted || aiPostmortemLoading}
                        className="bg-red-800 hover:bg-red-700 px-3 py-1 text-xs"
                    >
                        {aiPostmortemLoading && !postmortemDraft ? 'Analyzing Logs...' : 'AI Postmortem Draft'}
                    </Button>
                </div>
            ))}
            {postmortemDraft && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-red-700/50">
                    <h4 className="text-yellow-400 font-bold mb-2 flex items-center"><Lightbulb className="w-4 h-4 mr-2"/> AI Draft:</h4>
                    <pre className="whitespace-pre-wrap text-xs text-gray-300 font-mono bg-gray-900 p-3 rounded-md overflow-x-auto">
                        {postmortemDraft}
                    </pre>
                </div>
            )}
        </Card>
    );

    return (
        <div className="DevOpsView space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                    <Layers className="w-8 h-8 mr-3 text-purple-400" />
                    CI/CD Pipelines
                </h1>
                <p className="text-gray-400 text-lg">
                    The Assembly Line: Orchestrate continuous integration and deployment with AI acceleration. Automate code review, manage incidents, and generate comprehensive documentation.
                </p>
            </header>

            {/* KPI Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card title="Total Pipeline Runs" className="text-center">
                    <p className="text-4xl font-extrabold text-white">{pipelineMetrics.totalRuns}</p>
                    <p className="text-sm text-gray-500">Last 24h</p>
                </Card>
                <Card title="Success Rate">
                    <p className="text-4xl font-extrabold text-green-400">{pipelineMetrics.successRate}%</p>
                    <p className="text-sm text-gray-500">Target: 99.5%</p>
                </Card>
                <Card title="Active Incidents">
                    <p className="text-4xl font-extrabold text-red-400">{pipelineMetrics.activeIncidents}</p>
                    <p className="text-sm text-gray-500">Critical & High</p>
                </Card>
                <Card title="PRs Awaiting AI Review">
                    <p className="text-4xl font-extrabold text-cyan-400">{mockPullRequests.filter(pr => pr.aiReview === 'Pending').length}</p>
                    <p className="text-sm text-gray-500">Immediate attention</p>
                </Card>
            </div>
            
            {/* Pipeline and Monitoring Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Deployment Frequency (Last 7 Days)">
                    <LineChart data={{ labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'], datasets: [{ label: 'Deployments', data: [3, 5, 2, 8, 4, 6, 9], borderColor: '#00BCD4' }] }} />
                </Card>
                <Card title="Mean Time to Resolution (MTTR)">
                    <BarChart data={{ labels: ['Inc 001', 'Inc 002', 'Inc 003', 'Inc 004'], datasets: [{ label: 'MTTR (min)', data: [120, 45, 90, 30], backgroundColor: '#8B5CF6' }] }} />
                    <p className="text-xs text-gray-500 mt-2">Target MTTR: 60 minutes</p>
                </Card>
            </div>


            {/* Core DevOps Management */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    {renderPipelines()}
                </div>
                <div className="lg:col-span-1">
                    {renderPullRequests()}
                </div>
                <div className="lg:col-span-1">
                    {renderReleaseManagement()}
                </div>
            </div>

            {/* Incident Management */}
            <div className="lg:col-span-3">
                {renderIncidentManagement()}
            </div>
        </div>
    );
};

export default DemoBankDevOpsView;
```