import React, { useContext } from 'react';
import { View } from '../types';
import { DataContext } from '../context/DataContext';

interface FeatureGuardProps {
    view: View;
    children: React.ReactNode;
}

/**
 * FeatureGuard
 * 
 * A higher-order component that acts as the Sentinel for the application's views.
 * It enforces the "Charter" (access control policies) defined in the DataContext.
 * 
 * In the context of The Sovereign's Ledger, this component ensures that the
 * Architect (user) only accesses domains that have been ratified and enabled
 * within their current operational reality.
 */
const FeatureGuard: React.FC<FeatureGuardProps> = ({ view, children }) => {
    const context = useContext(DataContext);

    // In a production environment, we would check specific permissions here.
    // For the purpose of the simulation, we assume the Sovereign has full dominion,
    // unless a specific flag is set in the context or if the view is explicitly restricted.
    
    // Example placeholder logic:
    // const isAllowed = context?.charter?.allowedViews?.includes(view) ?? true;
    const isAllowed = true;

    if (!isAllowed) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-950/50 backdrop-blur-sm rounded-xl border border-gray-800/50">
                <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center border border-gray-800 mb-6 shadow-lg shadow-black/50">
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-10 w-10 text-gray-500" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="text-3xl font-thin text-white mb-4 tracking-tight">
                    Domain Sealed
                </h2>
                <p className="text-gray-400 max-w-md leading-relaxed text-lg font-light mb-8">
                    Access to the <span className="text-gray-300 font-normal font-mono mx-1">{view}</span> module is currently restricted by the active Charter.
                </p>
                <div className="py-2 px-4 rounded border border-red-900/30 bg-red-900/10 text-red-400/70 text-xs font-mono tracking-widest uppercase">
                    Clearance Level Insufficient
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            {children}
        </div>
    );
};

export default FeatureGuard;