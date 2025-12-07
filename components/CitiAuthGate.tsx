

import React, { useState } from 'react';
import Card from './Card';
import { Building, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

interface CitiAuthGateProps {
    children: React.ReactNode;
}

const CitiAuthGate: React.FC<CitiAuthGateProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = () => {
        setError('');
        setIsAuthenticating(true);
        
        // Simulate network delay
        setTimeout(() => {
            if (clientId.trim() && clientSecret.trim()) {
                setIsAuthenticated(true);
            } else {
                setError('Invalid credentials. Please provide Client ID and Secret.');
            }
            setIsAuthenticating(false);
        }, 1500);
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="flex items-center justify-center h-full min-h-[500px] p-6">
            <Card title="Citi Connect Core Authorization" className="w-full max-w-md border-blue-500/50">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Building className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Secure Gateway</h2>
                    <p className="text-sm text-gray-400 text-center mt-2">
                        Enter your Citi Developer Portal credentials to access the simulation environment.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client ID</label>
                        <input 
                            type="text" 
                            value={clientId} 
                            onChange={(e) => setClientId(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                            placeholder="e.g., client_id_sandbox..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client Secret</label>
                        <input 
                            type="password" 
                            value={clientSecret} 
                            onChange={(e) => setClientSecret(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                            placeholder="••••••••••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded flex items-center text-red-300 text-xs">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {error}
                        </div>
                    )}

                    <button 
                        onClick={handleLogin}
                        disabled={isAuthenticating}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAuthenticating ? (
                            <>Authenticating...</>
                        ) : (
                            <><Lock className="w-4 h-4 mr-2" /> Secure Login</>
                        )}
                    </button>
                    
                    <p className="text-xs text-center text-gray-600 mt-4">
                        This environment simulates OAuth 2.0 flow using mock credentials.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default CitiAuthGate;
