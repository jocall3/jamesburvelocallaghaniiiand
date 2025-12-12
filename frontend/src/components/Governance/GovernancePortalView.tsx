import React, { useState } from 'react';

// ----------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------

type ProposalStatus = 'Active' | 'Passed' | 'Rejected' | 'Pending';
type ProposalType = 'Protocol Upgrade' | 'Parameter Change' | 'Treasury';

interface VoteStats {
    for: number;
    against: number;
    abstain: number;
}

interface Proposal {
    id: string;
    title: string;
    description: string;
    proposer: string;
    status: ProposalStatus;
    createdAt: string;
    endsAt: string;
    votes: VoteStats;
    type: ProposalType;
}

// ----------------------------------------------------------------------
// Internal Data Generation Functions
// ----------------------------------------------------------------------

const generateRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const generateDateString = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
};

const generateProposal = (idSuffix: number): Proposal => {
    const statuses: ProposalStatus[] = ['Active', 'Passed', 'Rejected', 'Pending'];
    const types: ProposalType[] = ['Protocol Upgrade', 'Parameter Change', 'Treasury'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const type = types[Math.floor(Math.random() * types.length)];

    const daysSinceCreation = Math.floor(Math.random() * 365);
    const daysUntilEnd = status === 'Active' ? Math.floor(Math.random() * 10) + 1 : Math.floor(Math.random() * 30) + 10;

    return {
        id: `GP-${new Date().getFullYear()}-${String(idSuffix).padStart(3, '0')}`,
        title: `Proposal Title ${generateRandomString(10)}`,
        description: `This is a detailed description for proposal ${idSuffix}. It outlines the rationale, expected outcomes, and potential impacts. ${generateRandomString(50)}`,
        proposer: `0x${generateRandomString(10)}...${generateRandomString(4)}`,
        status: status,
        createdAt: generateDateString(daysSinceCreation + daysUntilEnd),
        endsAt: generateDateString(daysUntilEnd),
        votes: {
            for: Math.floor(Math.random() * 1000000),
            against: Math.floor(Math.random() * 500000),
            abstain: Math.floor(Math.random() * 100000),
        },
        type: type,
    };
};

const generateProposals = (count: number): Proposal[] => {
    const proposals: Proposal[] = [];
    for (let i = 1; i <= count; i++) {
        proposals.push(generateProposal(i));
    }
    return proposals;
};

// ----------------------------------------------------------------------
// Components
// ----------------------------------------------------------------------

const VoteBar = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    
    return (
        <div className="flex items-center text-sm py-1">
            <span className="w-16 font-medium text-gray-600">{label}</span>
            <div className="flex-1 mx-3 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color} transition-all duration-500`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <span className="w-10 text-right text-gray-700 font-semibold">{percentage}%</span>
            <span className="w-24 text-right text-gray-400 text-xs">({count.toLocaleString()})</span>
        </div>
    );
};

const GovernancePortalView: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>(generateProposals(10)); // Use generative data
    const [filter, setFilter] = useState<'Active' | 'History'>('Active');

    // Derived state
    const filteredProposals = proposals.filter(p => {
        if (filter === 'Active') return p.status === 'Active';
        return p.status !== 'Active';
    });

    const activeCount = proposals.filter(p => p.status === 'Active').length;
    const totalCount = proposals.length;

    const handleVote = (id: string, voteType: 'for' | 'against' | 'abstain') => {
        // Simulation of voting logic using internal generative functions
        setProposals(prev => prev.map(p => {
            if (p.id === id) {
                // Simulate vote weight increase based on random generation
                const voteIncrease = Math.floor(Math.random() * 5000) + 1000; 
                return {
                    ...p,
                    votes: {
                        ...p.votes,
                        [voteType]: p.votes[voteType] + voteIncrease
                    }
                };
            }
            return p;
        }));
        
        // In a real application, this would trigger a wallet signature
        console.log(`Voted ${voteType} on proposal ${id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Top Navigation Bar Placeholder */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                <div className="text-xl font-bold text-indigo-700 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    DAO Governance
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                        Voting Power: <span className="font-bold text-gray-900">{Math.floor(Math.random() * 20000).toLocaleString()} VP</span> {/* Generative Voting Power */}
                    </div>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                        Connect Wallet
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Governance Overview</h1>
                    <p className="mt-2 text-gray-600">Participate in the decision-making process of the protocol. Vote on upgrades, treasury usage, and parameters.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Proposals</p>
                                <p className="text-3xl font-bold text-indigo-600 mt-2">{activeCount}</p>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Proposals</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{totalCount}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-full text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Delegation</p>
                                <p className="text-sm text-gray-600 mt-2">You are currently delegating to:</p>
                                <p className="font-semibold text-indigo-600">Self (No delegate)</p> {/* Placeholder, could be generative */}
                            </div>
                            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800 underline">
                                Manage
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setFilter('Active')}
                            className={`px-8 py-4 text-sm font-medium transition-colors duration-200 ${
                                filter === 'Active' 
                                    ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Active Proposals
                        </button>
                        <button
                            onClick={() => setFilter('History')}
                            className={`px-8 py-4 text-sm font-medium transition-colors duration-200 ${
                                filter === 'History' 
                                    ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            History
                        </button>
                    </div>

                    {/* Proposal List */}
                    <div className="divide-y divide-gray-100">
                        {filteredProposals.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">No proposals found</h3>
                                <p className="mt-1 text-gray-500">There are no {filter.toLowerCase()} proposals at this time.</p>
                            </div>
                        ) : (
                            filteredProposals.map((proposal) => {
                                const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
                                
                                return (
                                    <div key={proposal.id} className="p-6 hover:bg-gray-50 transition-colors duration-150 group">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                            
                                            {/* Proposal Content */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                        proposal.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' :
                                                        proposal.status === 'Passed' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                                        proposal.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                                                        'bg-gray-100 text-gray-800 border-gray-200'
                                                    }`}>
                                                        {proposal.status}
                                                    </span>
                                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                        {proposal.type}
                                                    </span>
                                                    <span className="text-xs text-gray-400">#{proposal.id}</span>
                                                </div>

                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    {proposal.title}
                                                </h3>
                                                <p className="text-gray-600 mt-2 mb-4 text-sm leading-relaxed max-w-3xl">
                                                    {proposal.description}
                                                </p>

                                                <div className="flex items-center gap-6 text-sm text-gray-500 mt-4">
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        <span>By {proposal.proposer}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>Ends {proposal.endsAt}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Voting Section */}
                                            <div className="w-full md:w-80 bg-white md:bg-gray-50 p-4 rounded-lg border border-gray-100 md:border-gray-200">
                                                <div className="space-y-3 mb-5">
                                                    <VoteBar 
                                                        label="For" 
                                                        count={proposal.votes.for} 
                                                        total={totalVotes} 
                                                        color="bg-green-500" 
                                                    />
                                                    <VoteBar 
                                                        label="Against" 
                                                        count={proposal.votes.against} 
                                                        total={totalVotes} 
                                                        color="bg-red-500" 
                                                    />
                                                    <VoteBar 
                                                        label="Abstain" 
                                                        count={proposal.votes.abstain} 
                                                        total={totalVotes} 
                                                        color="bg-gray-400" 
                                                    />
                                                </div>

                                                {proposal.status === 'Active' ? (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <button
                                                            onClick={() => handleVote(proposal.id, 'for')}
                                                            className="flex justify-center items-center py-2 px-2 bg-white border border-green-500 text-green-600 rounded hover:bg-green-50 text-sm font-medium transition"
                                                        >
                                                            Vote For
                                                        </button>
                                                        <button
                                                            onClick={() => handleVote(proposal.id, 'against')}
                                                            className="flex justify-center items-center py-2 px-2 bg-white border border-red-500 text-red-600 rounded hover:bg-red-50 text-sm font-medium transition"
                                                        >
                                                            Against
                                                        </button>
                                                        <button
                                                            onClick={() => handleVote(proposal.id, 'abstain')}
                                                            className="flex justify-center items-center py-2 px-2 bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-100 text-sm font-medium transition"
                                                        >
                                                            Abstain
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-2 text-sm text-gray-500 bg-gray-100 rounded">
                                                        Voting Closed
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GovernancePortalView;