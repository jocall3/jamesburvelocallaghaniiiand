import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { banks } from '../constants'; // Import the centralized bank list
import PlaidLinkButton from './PlaidLinkButton';
import type { PlaidLinkSuccessMetadata, PlaidProduct } from '../types';

// ================================================================================================
// THE FINANCIAL REVOLUTION YOU DIDN'T SEE COMING: 3 WAYS OPEN SOURCE IS LEVELING THE PLAYING FIELD
// ================================================================================================
//
// Ever felt like the world of finance, with its intricate APIs and high barriers to entry, was
// reserved only for the behemoths of Wall Street and Silicon Valley? For too long, building
// innovative financial applications required deep pockets, massive engineering teams, and a
// tolerance for immense complexity. But what if I told you that a quiet revolution is brewing,
// one that's putting the power of financial innovation directly into the hands of anyone with an idea?
// We stumbled upon a piece of code that isn't just functional; it's a manifesto for financial democracy.
// Here are the most surprising takeaways from this game-changing project.
//
//
// **1. The "Sledgehammer" That's Crushing Financial Moats**
// For decades, accessing the core financial infrastructure – the APIs that let apps connect to bank
// accounts, process transactions, and manage data – has been a privilege. The cost and complexity
// created a formidable "moat" around this ecosystem, keeping out indie developers, small businesses,
// and even ambitious students. This project, however, declares war on that exclusivity.
//
// > "This code is a sledgehammer to that moat."
//
// It's a bold statement, but it encapsulates the project's mission: to dismantle the barriers that
// have historically prevented widespread innovation in finance. By open-sourcing production-grade
// tools, it's not just sharing code; it's redistributing power, making sophisticated financial
// application development accessible to the many, not just the few.
//
//
// **2. From Months of Development to 10 Lines of Code**
// Perhaps the most jaw-dropping revelation is the sheer simplicity this toolkit brings to complex
// financial integrations. Connecting to a bank, a process that once involved navigating labyrinthine
// documentation, managing secure tokens, and handling myriad edge cases, can now be achieved with
// astonishing ease.
//
// The `PlaidLinkButton` component, for instance, abstracts away the entire Plaid integration process.
// What used to be a multi-week engineering effort can now be dropped into an application with minimal code.
// Imagine building a secure, robust bank connection with just a handful of lines:
//
// ```typescript
// import React from 'react';
// import PlaidLinkButton from './PlaidLinkButton';
//
// const MyAwesomeApp = () => {
//     const handleSuccess = (publicToken, metadata) => {
//         console.log("It's that easy!", metadata.institution.name);
//         // Now, send the publicToken to your server to get an access token.
//     };
//
//     return (
//         <div>
//             <h1>My Fintech App</h1>
//             <PlaidLinkButton
//                 onSuccess={handleSuccess}
//                 products={['transactions', 'auth']}
//             />
//         </div>
//     );
// };
// ```
// This isn't just a convenience; it's a paradigm shift. It means developers can spend less time
// wrestling with infrastructure and more time innovating on user experience and unique features.
//
//
// **3. Empowering the Next Generation of Financial Innovators**
// Who benefits from this radical simplification? Everyone. The manifesto explicitly states its goal:
// to empower anyone with an idea. This means a student in a dorm room can now realistically build a
// budgeting app that competes with offerings from major corporations. A small business can integrate
// financial data into their operations without needing to hire an expensive team of specialists.
//
// > "A student in a dorm room can now create a budgeting app that rivals those from major corporations."
//
// This isn't just about making development easier; it's about fostering an explosion of creativity
// and problem-solving in the financial space. When the tools are accessible, the potential for
// groundbreaking applications becomes limitless, driven by diverse perspectives and needs.
//
//
// **Conclusion:**
// The journey from exclusive financial APIs to open-source, democratized toolkits marks a pivotal moment.
// This project isn't just a collection of components; it's a declaration that financial data belongs
// to the user, and the means to manage and innovate upon it should be universally accessible.
// We are witnessing a transfer of power, enabling a future where financial technology is built by the many,
// for the many. What groundbreaking financial innovation will *you* build when the barriers are finally gone?
//

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