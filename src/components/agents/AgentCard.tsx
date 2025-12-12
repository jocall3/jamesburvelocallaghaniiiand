import React from 'react';
import { motion } from 'framer-motion';

// ================================================================================================
// TYPE DEFINITIONS
// ================================================================================================

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  stats: {
    version: string;
    deployments: number;
    rating: number;
  };
  status: 'active' | 'inactive' | 'beta';
}

export interface AgentCardProps {
  agent: Agent;
  onAction: (agentId: string) => void;
}

// ================================================================================================
// ICON COMPONENTS (for stats)
// ================================================================================================

const VersionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);

const DeploymentsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
);

const RatingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-3.152a.563.563 0 00-.652 0l-4.725 3.152a.562.562 0 01-.84-.61l1.285-5.385a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);

// ================================================================================================
// STATUS BADGE COMPONENT
// ================================================================================================

const StatusBadge: React.FC<{ status: Agent['status'] }> = ({ status }) => {
    const statusStyles = {
        active: 'bg-green-500/20 text-green-300 border-green-500/30',
        inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        beta: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
    const text = {
        active: 'Active',
        inactive: 'Inactive',
        beta: 'Beta',
    };
    return (
        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full border ${statusStyles[status]}`}>
            {text[status]}
        </span>
    );
};

// ================================================================================================
// MAIN AGENT CARD COMPONENT
// ================================================================================================

const AgentCard: React.FC<AgentCardProps> = ({ agent, onAction }) => {
    const { id, name, description, icon, stats, status } = agent;

    const actionText = {
        active: 'Configure',
        inactive: 'Deploy',
        beta: 'Test Drive',
    };

    const actionButtonStyles = {
        active: 'bg-sky-600 hover:bg-sky-500 border-sky-500',
        inactive: 'bg-cyan-600 hover:bg-cyan-500 border-cyan-500',
        beta: 'bg-amber-600 hover:bg-amber-500 border-amber-500',
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg transition-all duration-300 hover:border-cyan-400 hover:shadow-cyan-400/10"
        >
            <div className="p-6 flex-grow">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 p-3 flex items-center justify-center bg-slate-800/70 rounded-lg border border-slate-700">
                        {React.cloneElement(icon, { className: "w-full h-full text-cyan-400" })}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-100">{name}</h3>
                        <StatusBadge status={status} />
                    </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 h-20 overflow-hidden">
                    {description}
                </p>

                <div className="border-t border-slate-700/50 pt-4 flex justify-around text-center">
                    <div className="flex flex-col items-center w-1/3">
                        <VersionIcon className="w-6 h-6 text-slate-500 mb-1" />
                        <span className="text-lg font-semibold text-slate-200">{stats.version}</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Version</span>
                    </div>
                    <div className="flex flex-col items-center w-1/3">
                        <DeploymentsIcon className="w-6 h-6 text-slate-500 mb-1" />
                        <span className="text-lg font-semibold text-slate-200">{stats.deployments.toLocaleString()}</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Deploys</span>
                    </div>
                    <div className="flex flex-col items-center w-1/3">
                        <RatingIcon className="w-6 h-6 text-slate-500 mb-1" />
                        <span className="text-lg font-semibold text-slate-200">{stats.rating.toFixed(1)}/5</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Rating</span>
                    </div>
                </div>
            </div>

            <div className="px-6 pb-6 mt-auto">
                <button
                    onClick={() => onAction(id)}
                    className={`w-full py-3 text-white font-bold rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${actionButtonStyles[status]}`}
                >
                    {actionText[status]}
                </button>
            </div>
        </motion.div>
    );
};

export default AgentCard;