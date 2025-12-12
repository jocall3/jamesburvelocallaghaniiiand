import React, { useState } from 'react';

// ================================================================================================
// TYPE DEFINITIONS
// ================================================================================================

interface AIEthicalMetric {
  name: 'Fairness' | 'Transparency' | 'Accountability' | 'Security' | 'Privacy';
  score: number; // 0-100
  description: string;
}

interface AIAgent {
  id: string;
  name: string;
  version: string;
  status: 'Active' | 'Training' | 'Degraded' | 'Offline';
  complianceScore: number;
  primaryMetric: string;
  primaryMetricValue: string;
  modelDrift: number; // percentage, can be negative
}

interface AnomalyEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
}

// ================================================================================================
// MOCK DATA
// ================================================================================================

const mockAgents: AIAgent[] = [
  {
    id: 'agent_advisor_001',
    name: 'AI Advisor (Quantum)',
    version: '2.1.3',
    status: 'Active',
    complianceScore: 98,
    primaryMetric: 'Queries Answered',
    primaryMetricValue: '1.2M',
    modelDrift: -0.2,
  },
  {
    id: 'agent_oracle_002',
    name: 'Quantum Oracle',
    version: '1.8.0',
    status: 'Active',
    complianceScore: 92,
    primaryMetric: 'Simulations Run',
    primaryMetricValue: '480K',
    modelDrift: 1.5,
  },
  {
    id: 'agent_weaver_003',
    name: 'Quantum Weaver',
    version: '1.2.1',
    status: 'Active',
    complianceScore: 95,
    primaryMetric: 'Plans Analyzed',
    primaryMetricValue: '8.2K',
    modelDrift: -0.8,
  },
  {
    id: 'agent_veo_004',
    name: 'AI Ad Studio (Veo)',
    version: '2.0.0',
    status: 'Degraded',
    complianceScore: 85,
    primaryMetric: 'Videos Generated',
    primaryMetricValue: '115K',
    modelDrift: 3.1,
  },
  {
    id: 'agent_plato_005',
    name: 'Marketplace AI (Plato)',
    version: '3.0.5',
    status: 'Training',
    complianceScore: 99,
    primaryMetric: 'Recs Served',
    primaryMetricValue: '25.6M',
    modelDrift: 0.0,
  },
  {
    id: 'agent_governor_006',
    name: 'Ethical Governor',
    version: '4.1.0',
    status: 'Active',
    complianceScore: 100,
    primaryMetric: 'Actions Vetoed',
    primaryMetricValue: '1,421',
    modelDrift: 0.1,
  },
];

const mockEthicalFramework: AIEthicalMetric[] = [
  { name: 'Fairness', score: 92, description: 'Bias mitigation across demographic groups.' },
  { name: 'Transparency', score: 88, description: 'Explainability of AI decisions (XAI).' },
  { name: 'Accountability', score: 95, description: 'Audit trails and decision ownership.' },
  { name: 'Security', score: 98, description: 'Robustness against adversarial attacks.' },
  { name: 'Privacy', score: 97, description: 'Adherence to data minimization principles.' },
];

const mockAnomalies: AnomalyEvent[] = [
  {
    id: 'anom_1',
    timestamp: '2m ago',
    agentId: 'agent_veo_004',
    agentName: 'Veo Ad Studio',
    severity: 'High',
    description: 'Output variance exceeds 3-sigma threshold. Potential model degradation.',
  },
  {
    id: 'anom_2',
    timestamp: '15m ago',
    agentId: 'agent_oracle_002',
    agentName: 'Quantum Oracle',
    severity: 'Medium',
    description: 'Bias detected in risk assessment model for new loan applicants.',
  },
  {
    id: 'anom_3',
    timestamp: '45m ago',
    agentId: 'agent_advisor_001',
    agentName: 'AI Advisor',
    severity: 'Low',
    description: 'Latency spike detected in a subset of financial summary queries.',
  },
   {
    id: 'anom_4',
    timestamp: '2h ago',
    agentId: 'agent_oracle_002',
    agentName: 'Quantum Oracle',
    severity: 'Critical',
    description: 'Explainability module failed for a critical simulation. Audit required.',
  },
];

// ================================================================================================
// HELPER COMPONENTS
// ================================================================================================

const StatusIndicator: React.FC<{ status: AIAgent['status'] }> = ({ status }) => {
  const statusConfig = {
    Active: { color: 'bg-green-500', text: 'Active' },
    Training: { color: 'bg-blue-500', text: 'Training' },
    Degraded: { color: 'bg-yellow-500', text: 'Degraded' },
    Offline: { color: 'bg-red-500', text: 'Offline' },
  };
  const config = statusConfig[status];
  return (
    <div className="flex items-center">
      <div className={`h-2 w-2 rounded-full ${config.color} mr-2`}></div>
      <span className="text-gray-300 text-sm">{config.text}</span>
    </div>
  );
};

const SeverityIndicator: React.FC<{ severity: AnomalyEvent['severity'] }> = ({ severity }) => {
    const severityClasses = {
        Low: 'text-blue-400 border-blue-400',
        Medium: 'text-yellow-400 border-yellow-400',
        High: 'text-orange-400 border-orange-400',
        Critical: 'text-red-500 border-red-500',
    };
    return <span className={`px-2 py-1 text-xs font-semibold border rounded-full ${severityClasses[severity]}`}>{severity}</span>;
}

const AIGovernanceView: React.FC = () => {
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(mockAgents[0].id);
    const globalCompliance = Math.round(mockEthicalFramework.reduce((acc, curr) => acc + curr.score, 0) / mockEthicalFramework.length);

  return (
    <div className="min-h-screen bg-gray-950/50 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.75 1.75v10.5a2.25 2.25 0 01-2.25 2.25h-10.5a2.25 2.25 0 01-2.25-2.25V10.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            AI Governance Command
          </h1>
          <p className="text-gray-400 mt-2">Monitoring the ethical and operational integrity of all autonomous cognitive agents.</p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Left Column (Main Content) */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-gray-900/70 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-gray-800">
                <h2 className="text-xl font-semibold text-white mb-4">Agent Roster</h2>
                <div className="space-y-2">
                    {mockAgents.map(agent => (
                        <div key={agent.id} 
                             className={`p-3 rounded-lg cursor-pointer transition-all duration-300 flex justify-between items-center ${selectedAgentId === agent.id ? 'bg-cyan-900/50' : 'hover:bg-gray-800/60'}`}
                             onClick={() => setSelectedAgentId(agent.id)}>
                            <div>
                                <p className="font-semibold text-white">{agent.name}</p>
                                <p className="text-xs text-gray-400">v{agent.version}</p>
                            </div>
                            <div className="flex items-center space-x-6 text-right">
                               <StatusIndicator status={agent.status} />
                               <div>
                                 <p className="text-sm font-mono text-white">{agent.complianceScore}%</p>
                                 <p className="text-xs text-gray-500">Compliance</p>
                               </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-900/70 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-gray-800">
                <h2 className="text-xl font-semibold text-white mb-4">Model Performance Drift</h2>
                <p className="text-sm text-gray-400 mb-4">Tracking deviation from baseline performance. Positive drift may indicate concept drift.</p>
                <div className="space-y-4">
                    {mockAgents.map(agent => (
                        <div key={agent.id} className="flex items-center">
                            <span className="w-40 text-sm text-gray-300 truncate">{agent.name}</span>
                            <div className="flex-1 bg-gray-700/50 rounded-full h-4 relative">
                                <div className={`absolute top-0 h-4 rounded-full ${agent.modelDrift > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                                     style={{ width: `${Math.abs(agent.modelDrift * 10)}%`, left: agent.modelDrift > 0 ? '50%' : 'auto', right: agent.modelDrift <= 0 ? '50%' : 'auto'}}>
                                </div>
                                <div className="absolute w-px h-full bg-gray-500 left-1/2 top-0"></div>
                            </div>
                            <span className={`w-16 text-right font-mono text-sm ${agent.modelDrift > 1 ? 'text-red-400' : 'text-green-400'}`}>
                                {agent.modelDrift.toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
          
          {/* Right Column (Sidebar) */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-gray-900/70 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-gray-800 flex flex-col items-center justify-center text-center">
                <h2 className="text-lg font-semibold text-white mb-2">Global Compliance Score</h2>
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                        <path className="text-cyan-400" strokeDasharray={`${globalCompliance}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">{globalCompliance}%</span>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Excellent</p>
            </div>

            <div className="bg-gray-900/70 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-4">Ethical Framework Adherence</h2>
                <div className="space-y-3">
                    {mockEthicalFramework.map(metric => (
                        <div key={metric.name}>
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-sm font-medium text-gray-300">{metric.name}</span>
                                <span className="text-sm font-mono text-gray-400">{metric.score}%</span>
                            </div>
                            <div className="w-full bg-gray-700/50 rounded-full h-2">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{width: `${metric.score}%`}}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="bg-gray-900/70 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-4">Real-time Anomaly Feed</h2>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {mockAnomalies.map(anomaly => (
                        <div key={anomaly.id} className="flex items-start space-x-3">
                            <div className="w-16 text-right">
                                <SeverityIndicator severity={anomaly.severity} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-300 leading-tight">{anomaly.description}</p>
                                <p className="text-xs text-gray-500 mt-1">{anomaly.agentName} â¢ {anomaly.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGovernanceView;