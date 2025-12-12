import React from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Icon as LucideIcon } from '@heroicons/react/24/outline';

interface StatusDetails {
    icon: React.ElementType<LucideIcon>;
    color: string;
    bg: string;
    label: string;
}

interface PipelineStageProps {
    name: string;
    status: 'success' | 'failure' | 'running' | 'pending';
    duration: string;
    commitHash?: string;
    isFirst: boolean;
    isLast: boolean;
}

// Define the visual mapping for statuses
const statusMap: Record<PipelineStageProps['status'], StatusDetails> = {
    success: {
        icon: CheckCircleIcon,
        color: 'text-emerald-400 border-emerald-500',
        bg: 'bg-emerald-900/30',
        label: 'Success',
    },
    failure: {
        icon: XCircleIcon,
        color: 'text-rose-400 border-rose-500',
        bg: 'bg-rose-900/30',
        label: 'Failure',
    },
    running: {
        icon: ArrowPathIcon,
        color: 'text-cyan-400 border-cyan-500',
        bg: 'bg-cyan-900/30',
        label: 'Running...',
    },
    pending: {
        icon: ClockIcon,
        color: 'text-slate-500 border-slate-700',
        bg: 'bg-slate-800/30',
        label: 'Pending',
    },
};

const PipelineStage: React.FC<PipelineStageProps> = ({
    name,
    status,
    duration,
    commitHash,
    isFirst,
}) => {
    const { icon: Icon, color, bg, label } = statusMap[status];

    // Style for the connector line coming *into* the stage (only if not first)
    const connectorStyle = status === 'success' ? 'bg-emerald-500' :
                           status === 'running' ? 'bg-cyan-500 animate-pulse' :
                           status === 'failure' ? 'bg-rose-500' :
                           'bg-slate-700';
                           
    const baseCardClasses = `relative flex-shrink-0 w-64 p-4 rounded-xl shadow-lg transition-all duration-300 ${bg} ${color} border`;

    return (
        <div className="flex items-center">
            {/* Connector Line (unless it's the very first stage) */}
            {!isFirst && (
                <div className={`h-1 w-12 ${connectorStyle} -translate-x-1`}></div>
            )}

            {/* Stage Card */}
            <div className={baseCardClasses}>
                
                {/* Status Indicator (Icon & Label) */}
                <div className="flex items-center space-x-2 border-b border-current/30 pb-2 mb-2">
                    <Icon className={`w-6 h-6 ${status === 'running' ? 'animate-spin' : ''}`} />
                    <h3 className="text-lg font-semibold">{name}</h3>
                </div>

                {/* Metadata */}
                <div className="text-xs space-y-1 text-gray-400">
                    <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <span className={`font-bold ${color}`}>{label}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Duration:</span>
                        <span>{duration}</span>
                    </div>
                    {commitHash && (
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Commit:</span>
                            <span className="text-[10px] truncate max-w-[100px] text-gray-500 hover:text-white transition cursor-pointer" title={commitHash}>
                                {commitHash.substring(0, 7)}...
                            </span>
                        </div>
                    )}
                </div>

                {/* Progress Bar (for running stages) */}
                {status === 'running' && (
                    <div className="mt-3 h-1 bg-cyan-700 rounded-full overflow-hidden">
                        {/* Mock progress at 66% */}
                        <div className="h-full w-2/3 bg-cyan-400 transition-all duration-1000"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PipelineStage;