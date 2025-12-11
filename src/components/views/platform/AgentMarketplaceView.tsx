```tsx
import React, { useState, Fragment, useMemo } from 'react';
import { Transition } from '@headlessui/react';

// Re-using icons from a central source would be ideal, but for this self-contained file,
// we'll define them here to represent each agent's function.
const SentinelIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);
const StewardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 9m18 3V9" />
    </svg>
);
const OracleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.75 1.75v10.5a2.25 2.25 0 01-2.25 2.25h-10.5a2.25 2.25 0 01-2.25-2.25V10.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ChroniclerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);
const MuseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.25 21.75l-.648-1.178a3.375 3.375 0 00-2.456-2.456L12 17.25l1.178-.648a3.375 3.375 0 002.456-2.456L16.25 13.5l.648 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.648a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);
const AmbassadorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);


type AgentStatus = 'Available' | 'Deployed' | 'Inactive';

type AgentConfig = {
    [key: string]: string | number | boolean;
};

interface Agent {
    id: string;
    name: string;
    description: string;
    longDescription: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    tags: string[];
    status: AgentStatus;
    config: AgentConfig;
    configSchema: {
        key: string;
        label: string;
        type: 'slider' | 'select' | 'toggle';
        options?: { value: string; label: string }[];
        min?: number;
        max?: number;
    }[];
}

const initialAgents: Agent[] = [
    {
        id: 'sentinel',
        name: 'The Sentinel',
        description: 'Guardian of system integrity and security.',
        longDescription: 'Monitors all system activity in real-time to detect, analyze, and neutralize threats. The Sentinel operates on the principle of proactive defense, ensuring the sovereignty of your digital domain against both internal anomalies and external intrusions.',
        icon: SentinelIcon,
        tags: ['Security', 'Real-time', 'Proactive Defense'],
        status: 'Available',
        config: { vigilance: 3, response: 'freeze' },
        configSchema: [
            { key: 'vigilance', label: 'Vigilance Level', type: 'slider', min: 1, max: 5 },
            { key: 'response', label: 'Response Protocol', type: 'select', options: [
                { value: 'alert', label: 'Alert Only' },
                { value: 'freeze', label: 'Alert & Freeze' },
                { value: 'remediate', label: 'Alert & Auto-Remediate' },
            ]},
        ],
    },
    {
        id: 'steward',
        name: 'The Steward',
        description: 'Manager of resources and financial efficiency.',
        longDescription: 'An agent dedicated to the optimization of resources. The Steward analyzes cash flow, budgets, and asset allocation to provide strategic recommendations that align with your long-term financial objectives, ensuring sustainable growth and stability.',
        icon: StewardIcon,
        tags: ['Finance', 'Optimization', 'Strategy'],
        status: 'Available',
        config: { focus: 'stability', frequency: 'weekly' },
        configSchema: [
            { key: 'focus', label: 'Optimization Focus', type: 'select', options: [
                { value: 'growth', label: 'Aggressive Growth' },
                { value: 'stability', label: 'Balanced Stability' },
                { value: 'preservation', label: 'Capital Preservation' },
            ]},
            { key: 'frequency', label: 'Reporting Frequency', type: 'select', options: [
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
            ]},
        ],
    },
    {
        id: 'oracle',
        name: 'The Oracle',
        description: 'Simulator of futures and analyst of probabilities.',
        longDescription: 'The Oracle processes vast datasets and your stated goals to run complex simulations of potential futures. It does not predict, but illuminates the probable consequences of decisions, allowing for more informed and strategic long-term planning.',
        icon: OracleIcon,
        tags: ['Forecasting', 'Simulation', 'Decision Support'],
        status: 'Available',
        config: { horizon: 'long_term', appetite: 3 },
        configSchema: [
            { key: 'horizon', label: 'Simulation Horizon', type: 'select', options: [
                { value: 'short_term', label: 'Short-Term (1-12 Mo)' },
                { value: 'medium_term', label: 'Medium-Term (1-5 Yr)' },
                { value: 'long_term', label: 'Long-Term (5+ Yr)' },
            ]},
            { key: 'appetite', label: 'Risk Appetite', type: 'slider', min: 1, max: 5 },
        ],
    },
    {
        id: 'chronicler',
        name: 'The Chronicler',
        description: 'Keeper of the immutable record and historian of actions.',
        longDescription: 'Ensures every transaction, decision, and system event is recorded with perfect fidelity. The Chronicler maintains the integrity of the ledger, providing a single source of truth and enabling flawless auditability and historical analysis.',
        icon: ChroniclerIcon,
        tags: ['Data Integrity', 'Audit', 'History'],
        status: 'Available',
        config: { level: 'detailed', categorization: true },
        configSchema: [
            { key: 'level', label: 'Logging Level', type: 'select', options: [
                { value: 'concise', label: 'Concise' },
                { value: 'detailed', label: 'Detailed' },
                { value: 'verbose', label: 'Verbose' },
            ]},
            { key: 'categorization', label: 'Enable AI Auto-Categorization', type: 'toggle' },
        ],
    },
    {
        id: 'muse',
        name: 'The Muse',
        description: 'Generator of novel ideas and creative strategies.',
        longDescription: 'The Muse analyzes market trends, your personal assets, and stated interests to generate novel investment ideas, business concepts, and creative solutions. It is designed to break conventional thinking and introduce you to new avenues of potential.',
        icon: MuseIcon,
        tags: ['Creativity', 'Ideation', 'Growth'],
        status: 'Available',
        config: { spectrum: 'exploratory' },
        configSchema: [
            { key: 'spectrum', label: 'Creativity Spectrum', type: 'select', options: [
                { value: 'grounded', label: 'Grounded & Practical' },
                { value: 'exploratory', label: 'Exploratory & Novel' },
                { value: 'unconstrained', label: 'Unconstrained & Abstract' },
            ]},
        ],
    },
    {
        id: 'ambassador',
        name: 'The Ambassador',
        description: 'Diplomat for external integrations and data treaties.',
        longDescription: 'Manages all connections to third-party services, ensuring secure and efficient data exchange. The Ambassador operates under the principle of Zero Trust and Least Privilege, negotiating data treaties that strengthen your ecosystem without compromising its security.',
        icon: AmbassadorIcon,
        tags: ['Integration', 'API', 'Security'],
        status: 'Available',
        config: { stance: 'cautious' },
        configSchema: [
            { key: 'stance', label: 'Negotiation Stance', type: 'select', options: [
                { value: 'open', label: 'Open' },
                { value: 'cautious', label: 'Cautious' },
                { value: 'strict', label: 'Strict (Least Privilege)' },
            ]},
        ],
    },
];

const AgentMarketplaceView: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>(initialAgents);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [tempConfig, setTempConfig] = useState<AgentConfig | null>(null);

    const handleSelectAgent = (agent: Agent) => {
        setSelectedAgent(agent);
        setTempConfig(agent.config);
    };

    const handleCloseModal = () => {
        setSelectedAgent(null);
        setTempConfig(null);
    };

    const handleConfigChange = (key: string, value: string | number | boolean) => {
        if (tempConfig) {
            setTempConfig({ ...tempConfig, [key]: value });
        }
    };

    const handleDeploy = () => {
        if (selectedAgent && tempConfig) {
            setAgents(agents.map(a => 
                a.id === selectedAgent.id 
                    ? { ...a, status: 'Deployed', config: tempConfig } 
                    : a
            ));
            handleCloseModal();
        }
    };
    
    const handleRecall = () => {
        if (selectedAgent) {
            setAgents(agents.map(a => 
                a.id === selectedAgent.id 
                    ? { ...a, status: 'Available' } 
                    : a
            ));
            handleCloseModal();
        }
    };

    const deployedCount = useMemo(() => agents.filter(a => a.status === 'Deployed').length, [agents]);
    const availableCount = useMemo(() => agents.filter(a => a.status === 'Available').length, [agents]);

    return (
        <div className="bg-transparent text-gray-200 min-h-full">
            <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Agent Marketplace</h1>
                <p className="mt-2 text-lg text-gray-400">Assemble your council of specialized AI agents. Each agent is a dedicated instrument designed to amplify a specific facet of your will.</p>
                <div className="mt-4 flex items-center space-x-6 text-sm">
                    <div className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-cyan-400 mr-2"></span>
                        <span>{deployedCount} Deployed</span>
                    </div>
                    <div className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-gray-500 mr-2"></span>
                        <span>{availableCount} Available</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map(agent => (
                    <div
                        key={agent.id}
                        onClick={() => handleSelectAgent(agent)}
                        className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 cursor-pointer transition-all duration-300 hover:border-cyan-400/50 hover:scale-[1.02] hover:bg-gray-800/50"
                    >
                        <div className={`absolute top-4 right-4 flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                            agent.status === 'Deployed' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-gray-600/20 text-gray-400'
                        }`}>
                            <span className={`h-2 w-2 rounded-full mr-2 ${
                                agent.status === 'Deployed' ? 'bg-cyan-400' : 'bg-gray-500'
                            }`}></span>
                            {agent.status}
                        </div>
                        
                        <div className="flex items-center mb-4">
                            <agent.icon className="h-10 w-10 text-cyan-400 mr-4" />
                            <div>
                                <h2 className="text-xl font-bold text-white">{agent.name}</h2>
                                <p className="text-gray-400 text-sm">{agent.description}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-4">
                            {agent.tags.map(tag => (
                                <span key={tag} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Transition show={!!selectedAgent} as={Fragment}>
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={handleCloseModal}></div>
                        </Transition.Child>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <div className="inline-block align-bottom bg-gray-900 border border-gray-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                {selectedAgent && tempConfig && (
                                    <>
                                        <div className="px-6 py-5 bg-gray-800/50 border-b border-gray-700">
                                            <div className="flex items-center">
                                                <selectedAgent.icon className="h-10 w-10 text-cyan-400 mr-4" />
                                                <div>
                                                    <h3 className="text-2xl font-bold leading-6 text-white" id="modal-title">{selectedAgent.name}</h3>
                                                    <p className="mt-1 text-sm text-gray-400">{selectedAgent.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-6 py-6">
                                            <p className="text-gray-300 mb-6">{selectedAgent.longDescription}</p>
                                            
                                            <h4 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Configuration</h4>
                                            <div className="space-y-6">
                                                {selectedAgent.configSchema.map(schema => (
                                                    <div key={schema.key}>
                                                        <label className="block text-sm font-medium text-gray-300 mb-2">{schema.label}</label>
                                                        {schema.type === 'slider' && (
                                                            <div className="flex items-center space-x-4">
                                                                <span className="text-xs text-gray-500">Low</span>
                                                                <input
                                                                    type="range"
                                                                    min={schema.min}
                                                                    max={schema.max}
                                                                    value={tempConfig[schema.key] as number}
                                                                    onChange={(e) => handleConfigChange(schema.key, parseInt(e.target.value, 10))}
                                                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                                                />
                                                                <span className="text-xs text-gray-500">High</span>
                                                            </div>
                                                        )}
                                                        {schema.type === 'select' && schema.options && (
                                                            <select
                                                                value={tempConfig[schema.key] as string}
                                                                onChange={(e) => handleConfigChange(schema.key, e.target.value)}
                                                                className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                                                            >
                                                                {schema.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                            </select>
                                                        )}
                                                        {schema.type === 'toggle' && (
                                                           <label className="relative inline-flex items-center cursor-pointer">
                                                               <input type="checkbox" checked={tempConfig[schema.key] as boolean} onChange={(e) => handleConfigChange(schema.key, e.target.checked)} className="sr-only peer" />
                                                               <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                                           </label>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-gray-800/50 px-6 py-4 flex justify-between items-center">
                                            <div className="text-sm">
                                                <span className="font-semibold text-gray-300">Status: </span>
                                                <span className={`font-bold ${selectedAgent.status === 'Deployed' ? 'text-cyan-400' : 'text-gray-400'}`}>
                                                    {selectedAgent.status}
                                                </span>
                                            </div>
                                            <div className="flex space-x-3">
                                                {selectedAgent.status === 'Deployed' && (
                                                    <button type="button" onClick={handleRecall} className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600/80 text-base font-medium text-white hover:bg-yellow-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:text-sm">
                                                        Recall
                                                    </button>
                                                )}
                                                <button type="button" onClick={handleDeploy} className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:text-sm">
                                                    {selectedAgent.status === 'Deployed' ? 'Update' : 'Deploy'}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Transition.Child>
                    </div>
                </div>
            </Transition>
        </div>
    );
};

export default AgentMarketplaceView;
```