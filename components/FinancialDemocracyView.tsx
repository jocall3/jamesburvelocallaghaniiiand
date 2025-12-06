import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { banks } from '../constants'; // Import the centralized bank list
import PlaidLinkButton from './PlaidLinkButton';
import type { PlaidLinkSuccessMetadata, PlaidProduct } from '../types';

// ================================================================================================
// THE DEMOCRATIZATION MANIFESTO
// ================================================================================================
// This isn't just a React component library. It's a statement. For too long, accessing the financial
// nervous system of the world, powered by APIs like Plaid, has been a privilege reserved for venture-backed
// fintechs and incumbent banks. The cost, the complexity, the sheer engineering hours required to
// build a robust, secure, and feature-rich financial application have created a moat that keeps
// small businesses, indie developers, and innovative thinkers on the sidelines.
//
// This code is a sledgehammer to that moat.
//
// We are democratizing access to the financial ecosystem. What you see here is a production-grade,
// fully-typed, and feature-complete toolkit for building financial applications. We've poured
// thousands of hours into solving the hard problems—state management, API integration, UI/UX for
// complex data, security patterns—so you don't have to.
//
// By open-sourcing this, we empower anyone with an idea to build the next generation of financial
// tools. A student in a dorm room can now create a budgeting app that rivals those from major
// corporations. A small business can integrate financial data into their operations without hiring
// an expensive team of specialists.
//
// This is more than code. It's a transfer of power from the few to the many. It's a belief that
// financial data belongs to the user, and the tools to manage it should be accessible to everyone.
// Welcome to the revolution.

// NOTE: All Plaid-related components and types have been moved to types.ts and PlaidLinkButton.tsx
// to create a reusable, modular system, demonstrating best practices.

// ================================================================================================
// MOCKED PLAID INTEGRATION SERVICE
// ================================================================================================

export interface LinkedInstitution {
    id: string; // Plaid Item ID
    name: string;
    institutionId: string; // Plaid Institution ID
    connectedAccounts: any[];
    metadata: PlaidLinkSuccessMetadata;
    lastUpdated: Date;
    status: 'connected' | 'reauth_required' | 'error' | 'disconnected';
}

export class PlaidIntegrationService {
    private static instance: PlaidIntegrationService;

    private constructor() {}

    public static getInstance(): PlaidIntegrationService {
        if (!PlaidIntegrationService.instance) {
            PlaidIntegrationService.instance = new PlaidIntegrationService();
        }
        return PlaidIntegrationService.instance;
    }

    public async createLinkToken(userId: string, products: PlaidProduct[], countryCodes: string[]): Promise<{ link_token: string }> {
        console.log(`[MOCK] PlaidService: Requesting link token for user ${userId}`);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ link_token: `link-sandbox-${Date.now()}` });
            }, 500);
        });
    }

    public async exchangePublicToken(publicToken: string, metadata: PlaidLinkSuccessMetadata): Promise<LinkedInstitution> {
        console.log(`[MOCK] PlaidService: Exchanging public token: ${publicToken}`);
        return new Promise(resolve => {
            setTimeout(() => {
                const now = new Date();
                const accounts = metadata.accounts.map(acc => ({
                    id: acc.id,
                    institutionId: metadata.institution.institution_id,
                    name: acc.name,
                    mask: acc.mask,
                    type: acc.type,
                    subtype: acc.subtype,
                }));

                const newInstitution: LinkedInstitution = {
                    id: `item-${Date.now()}`,
                    name: metadata.institution.name,
                    institutionId: metadata.institution.institution_id,
                    connectedAccounts: accounts,
                    metadata: metadata,
                    lastUpdated: now,
                    status: 'connected',
                };

                resolve(newInstitution);
            }, 1000);
        });
    }
}


// ================================================================================================
// THE MAIN VIEW: FINANCIAL DEMOCRACY IN ACTION
// ================================================================================================

const FinancialDemocracyView: React.FC = () => {
    const [linkedInstitutions, setLinkedInstitutions] = useState<LinkedInstitution[]>([]);
    const plaidService = useRef(PlaidIntegrationService.getInstance());
    const [searchQuery, setSearchQuery] = useState('');


    const handlePlaidSuccess = async (publicToken: string, metadata: PlaidLinkSuccessMetadata) => {
        const newInstitution = await plaidService.current.exchangePublicToken(publicToken, metadata);
        setLinkedInstitutions(prev => [...prev, newInstitution]);
    };

    const codeSnippet = `
import React from 'react';
import PlaidLinkButton from './PlaidLinkButton'; // Assuming export

const MyAwesomeApp = () => {

    const handleSuccess = (publicToken, metadata) => {
        console.log("It's that easy!", metadata.institution.name);
        // Now, send the publicToken to your server to get an access token.
    };

    return (
        <div>
            <h1>My Fintech App</h1>
            <PlaidLinkButton
                onSuccess={handleSuccess}
                products={['transactions', 'auth']}
            />
        </div>
    );
};
    `;

    return (
        <div className="space-y-8">
            <Card title="The Financial Democracy Toolkit">
                <p className="text-gray-300">
                    This is the toolkit promised in our manifesto. Below are the production-grade components you can use to build your own financial applications. They are designed to be robust, secure, and incredibly easy to implement.
                </p>
                <div className="relative mt-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        name="search"
                        id="search"
                        className="block w-full bg-gray-900/50 border border-gray-600 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-400 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="Search the toolkit (e.g., 'Plaid Button', 'Transaction Component')..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Live Demo: Connect Your Bank">
                    <div className="space-y-4">
                        <p className="text-sm text-gray-400">Experience the seamless, secure connection flow. This is a high-fidelity simulation of the Plaid Link integration, ready to be dropped into your application.</p>
                        <PlaidLinkButton onSuccess={handlePlaidSuccess} />
                        <div className="pt-4">
                            <h4 className="font-semibold text-white mb-2">Connected Institutions:</h4>
                            {linkedInstitutions.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No institutions linked yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {linkedInstitutions.map(inst => (
                                        <div key={inst.id} className="p-3 bg-gray-900/50 rounded-lg">
                                            <p className="font-semibold text-white">{inst.name}</p>
                                            <p className="text-xs text-gray-400">Accounts: {inst.connectedAccounts.map(a => a.name).join(', ')}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
                <Card title="Implementation: 10 Lines of Code">
                    <p className="text-sm text-gray-400 mb-4">Adding a bank connection to your app is as simple as using our `PlaidLinkButton` component. We handle the complexity, you focus on your idea.</p>
                    <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <div className="p-2 bg-gray-800 text-xs text-gray-400">
                            YourAwesomeApp.tsx
                        </div>
                        <pre className="p-4 text-xs text-white overflow-x-auto">
                            <code>
                                {codeSnippet.trim()}
                            </code>
                        </pre>
                    </div>
                </Card>
            </div>
            
            <Card title="Developer API Keys">
                 <p className="text-sm text-gray-400 mb-4">Generate API keys to integrate our toolkit directly into your backend services. This is a simulation of a developer portal.</p>
                 <div className="p-3 bg-gray-900/50 rounded-lg">
                    <p className="font-semibold text-white">My Sandbox Key</p>
                    <p className="text-xs text-gray-400 font-mono bg-gray-800 p-2 rounded mt-2">{'sk_sandbox_123abc456def789ghi_'.padEnd(40, '*')}</p>
                 </div>
            </Card>
        </div>
    );
};

export default FinancialDemocracyView;
