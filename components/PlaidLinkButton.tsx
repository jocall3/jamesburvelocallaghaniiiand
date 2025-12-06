
import React, { useState, useContext } from 'react';
import { banks } from '../constants';
import { DataContext } from '../context/DataContext';

interface PlaidLinkButtonProps {
    onSuccess: (publicToken: string, metadata: any) => void;
    className?: string;
    products?: string[];
    disabled?: boolean;
    label?: string;
}

type OSView = 'DASHBOARD' | 'AI_NEXUS' | 'FINANCIAL_LINK' | 'QUANTUM_SECURITY' | 'GLOBAL_MARKETS' | 'SETTINGS';

interface MarketMetric {
    label: string;
    value: number;
    delta: number;
    trend: 'up' | 'down' | 'stable';
}

const Icons = {
    Close: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>,
};

const generateMarketData = (): MarketMetric[] => [
    { label: 'Global Liquidity', value: 842938421, delta: 2.4, trend: 'up' },
    { label: 'Risk Index', value: 12.5, delta: -0.8, trend: 'down' },
    { label: 'AI Efficiency', value: 99.9, delta: 0.1, trend: 'stable' },
    { label: 'Transaction Vol', value: 45210, delta: 15.2, trend: 'up' },
];

const EnterpriseOS: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (publicToken: string, metadata: any) => void;
}> = ({ isOpen, onClose, onSuccess }) => {
    // We prioritize the context for Client ID, but fall back to env var directly if context is missing/empty
    const context = useContext(DataContext);
    const contextClientId = context?.plaidClientId;
    const clientId = contextClientId || process.env.PLAID_CLIENT_ID || 'NOT_CONFIGURED';

    const handleBankSelect = (bank: typeof banks[0]) => {
        console.log(`Initiating link with Client ID: ${clientId}`);

        setTimeout(() => {
            const mockPublicToken = `public-production-${Math.random().toString(36).substring(2)}`;
            const mockMetadata = {
                institution: { name: bank.name, institution_id: bank.institution_id },
                accounts: [{ id: 'acc_123', name: 'Enterprise Checking', mask: '0000', type: 'depository', subtype: 'checking' }],
                link_session_id: `sess_${Math.random().toString(36)}`
            };
            onSuccess(mockPublicToken, mockMetadata);
            onClose();
        }, 3000);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 w-full max-w-4xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Enterprise Link OS</h2>
                    <button onClick={onClose}><Icons.Close /></button>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                    {banks.map(bank => (
                        <button key={bank.name} onClick={() => handleBankSelect(bank)} className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-cyan-500 transition-all flex flex-col items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">{bank.logo}</div>
                            <span className="font-bold text-white">{bank.name}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-800 text-xs text-gray-500 font-mono">
                    Environment: {process.env.PLAID_ENV || 'Sandbox'} | Client ID: {clientId.substring(0, 8)}...
                </div>
            </div>
        </div>
    );
};

const PlaidLinkButton: React.FC<PlaidLinkButtonProps> = ({ onSuccess, className, disabled, label }) => {
    const [isOSOpen, setIsOSOpen] = useState(false);
    
    const handleClick = () => {
        setIsOSOpen(true);
    }
    
    return (
        <>
            <button 
                onClick={handleClick}
                disabled={disabled}
                className={`group relative w-full flex justify-center items-center py-4 px-6 border border-gray-800 rounded-xl shadow-2xl text-sm font-bold text-white bg-black overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 via-purple-900/20 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-x"></div>
                <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                <div className="relative flex items-center z-10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mr-3 text-cyan-400 group-hover:text-white transition-colors"><path d="M16.5 10.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5Z" fill="currentColor"></path><path d="M12.75 10.5c0 2.761-2.239 5-5 5s-5-2.239-5-5 2.239-5 5-5 5 2.239 5 5ZM7.75 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor"></path><path d="M21.25 10.5c0 2.761-2.239 5-5 5s-5-2.239-5-5 2.239-5 5-5 5 2.239 5 5ZM16.25 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor"></path></svg>
                    <span>{label || "INITIALIZE SECURE LINK"}</span>
                </div>
            </button>
            <EnterpriseOS isOpen={isOSOpen} onClose={() => setIsOSOpen(false)} onSuccess={onSuccess} />
        </>
    );
};

export default PlaidLinkButton;
