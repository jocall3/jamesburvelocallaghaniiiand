import React, { useState, useMemo, useCallback } from 'react';
import { View } from '../../../types';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';
import {
    LightbulbIcon,
    SearchIcon,
    PlusIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    SortAscIcon,
    SortDescIcon,
} from '@heroicons/react/24/outline';
import { useGemini } from '../../../hooks/useGemini';
import { Invention, InventionCategory, InventionStatus } from '../../../types/models';
import Chip from '../../../components/Chip';
import { useMockData } from '../../../hooks/useMockData';

// --- MOCK DATA & TYPES ---

type SortKey = 'title' | 'date' | 'status';
type SortDirection = 'asc' | 'desc';

const MOCK_CATEGORIES: InventionCategory[] = [
    'Financial Product',
    'AI Model Architecture',
    'Operational Blueprint',
    'Security Protocol',
    'User Experience'
];

const MOCK_STATUSES: InventionStatus[] = [
    'Draft',
    'Under Review',
    'Validated',
    'Archived',
    'Deployed'
];

// Mock data structure for Inventions
interface MockInvention extends Invention {
    id: string;
    title: string;
    summary: string;
    category: InventionCategory;
    status: InventionStatus;
    patentPending: boolean;
    dateFiled: string; // YYYY-MM-DD
    aiJustification: string;
}

// --- MOCK DATA HOOK ---
const useInventionsData = () => {
    const { mockUsers } = useMockData();

    const generateMockInvention = (index: number): MockInvention => {
        const titleBase = ['Dynamic Risk Hedging Algorithm', 'LLM-based Contract Parser', 'Self-Correcting Service Mesh', 'Zero-Knowledge Proof Wallet', 'Adaptive UI Layer'];
        const category = MOCK_CATEGORIES[index % MOCK_CATEGORIES.length];
        const status = MOCK_STATUSES[Math.floor(Math.random() * MOCK_STATUSES.length)];
        const user = mockUsers[index % mockUsers.length];
        const date = new Date(Date.now() - index * 86400000 * 5); // Staggered dates

        let justification = "Initial spark detected by Autonomous Scientist based on correlated market dissonance.";
        if (status === 'Validated') {
            justification = `Initial model verified against historical data. Predicted ROI: ${((Math.random() * 50) + 50).toFixed(1)}% over 3 years.`;
        }

        return {
            id: `inv-${index + 1}`,
            title: `${titleBase[index % titleBase.length]} v${Math.floor(Math.random() * 3) + 1}`,
            summary: `A novel approach to ${category.toLowerCase()} leveraging emergent AI capabilities.`,
            category,
            status,
            patentPending: status === 'Validated' && Math.random() > 0.4,
            dateFiled: date.toISOString().split('T')[0],
            aiJustification: justification,
            createdBy: user.name,
        };
    };

    const mockInventions: MockInvention[] = useMemo(() => 
        Array.from({ length: 25 }, (_, i) => generateMockInvention(i))
    , [mockUsers]);

    return { mockInventions };
};

// --- UI COMPONENTS ---

interface InventionCardProps {
    invention: MockInvention;
    openDetailView: (invention: MockInvention) => void;
}

const InventionCard: React.FC<InventionCardProps> = ({ invention, openDetailView }) => {
    const getStatusColor = (status: InventionStatus): string => {
        switch (status) {
            case 'Draft': return 'bg-gray-600 text-gray-200';
            case 'Under Review': return 'bg-blue-600 text-blue-100';
            case 'Validated': return 'bg-green-600 text-green-100';
            case 'Deployed': return 'bg-purple-600 text-purple-100';
            case 'Archived': return 'bg-red-600 text-red-100';
            default: return 'bg-gray-500 text-gray-200';
        }
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition duration-300 border border-gray-800">
            <div className="flex justify-between items-start mb-3">
                <Badge className={getStatusColor(invention.status)}>{invention.status}</Badge>
                {invention.patentPending && (
                    <Badge className="bg-yellow-600 text-yellow-100">Patent Pending</Badge>
                )}
            </div>
            <h3 className="text-xl font-semibold text-cyan-300 mb-1 truncate">{invention.title}</h3>
            <p className="text-sm text-gray-400 mb-3 flex-grow line-clamp-2">{invention.summary}</p>
            
            <div className="mt-auto pt-3 border-t border-gray-800">
                <div className="flex flex-wrap gap-2 mb-3">
                    <Chip label={invention.category} size="small" />
                </div>
                <p className="text-xs text-gray-500 mb-2">Filed: {invention.dateFiled}</p>
                <Button 
                    onClick={() => openDetailView(invention)} 
                    variant="secondary"
                    size="small"
                    className="w-full"
                >
                    Review Details
                </Button>
            </div>
        </Card>
    );
};

// --- DETAIL VIEW ---

interface DetailViewProps {
    invention: MockInvention;
    onBack: () => void;
}

const InventionDetailView: React.FC<DetailViewProps> = ({ invention, onBack }) => {
    const { callGemini } = useGemini();
    const [aiExpansion, setAiExpansion] = useState<string | null>(null);
    const [loadingExpansion, setLoadingExpansion] = useState(false);

    const handleExpandAI = useCallback(async () => {
        setLoadingExpansion(true);
        setAiExpansion(null);
        
        const prompt = `Expand upon the initial justification for the invention titled "${invention.title}". Detail the specific challenge it solves in financial engineering and how the AI model achieves novelty. Use a technical yet accessible tone.`;
        
        try {
            const result = await callGemini(prompt, {
                model: 'gemini-2.5-pro',
                maxOutputTokens: 1024
            });
            setAiExpansion(result.response);
        } catch (e) {
            setAiExpansion("Error: Could not retrieve expanded AI justification.");
            console.error("AI Expansion Error:", e);
        } finally {
            setLoadingExpansion(false);
        }
    }, [callGemini, invention.title]);

    const getStatusColor = (status: InventionStatus): string => {
        switch (status) {
            case 'Draft': return 'text-gray-400 border-gray-600';
            case 'Under Review': return 'text-blue-400 border-blue-600';
            case 'Validated': return 'text-green-400 border-green-600';
            case 'Deployed': return 'text-purple-400 border-purple-600';
            case 'Archived': return 'text-red-400 border-red-600';
            default: return 'text-gray-500 border-gray-700';
        }
    };

    const getCategoryColor = (category: InventionCategory): string => {
        switch (category) {
            case 'Financial Product': return 'bg-red-900/50 text-red-300';
            case 'AI Model Architecture': return 'bg-cyan-900/50 text-cyan-300';
            case 'Operational Blueprint': return 'bg-green-900/50 text-green-300';
            case 'Security Protocol': return 'bg-yellow-900/50 text-yellow-300';
            case 'User Experience': return 'bg-indigo-900/50 text-indigo-300';
            default: return 'bg-gray-800 text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            <Button onClick={onBack} variant="ghost" className="flex items-center text-cyan-400 hover:text-cyan-300">
                <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to Invention Catalog
            </Button>

            <Card className="p-6 border border-gray-800">
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-700">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">{invention.title}</h1>
                        <p className="text-base text-gray-400">{invention.summary}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <Badge className={`text-sm ${getStatusColor(invention.status)} border`}>{invention.status}</Badge>
                        {invention.patentPending && (
                            <Badge className="bg-yellow-600 text-yellow-100">Patent Pending</Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
                    <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-500 mb-1">Category</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(invention.category)}`}>
                            {invention.category}
                        </span>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-500 mb-1">Date Filed</p>
                        <p className="font-medium text-white">{invention.dateFiled}</p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-gray-500 mb-1">Created By</p>
                        <p className="font-medium text-white">{invention.createdBy}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">AI Genesis Record</h2>
                    
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-gray-400 mb-2 font-medium">Initial Justification:</p>
                        <p className="text-sm whitespace-pre-wrap text-gray-300">{invention.aiJustification}</p>
                    </div>

                    {aiExpansion ? (
                        <div className="bg-gray-800 p-4 rounded-lg border border-cyan-600 shadow-lg">
                            <p className="text-cyan-400 mb-2 font-medium">AI Deep Dive (Expanded View):</p>
                            <p className="text-sm whitespace-pre-wrap text-gray-300">{aiExpansion}</p>
                        </div>
                    ) : (
                        <Button 
                            onClick={handleExpandAI} 
                            variant="primary"
                            disabled={loadingExpansion}
                            className="w-full"
                        >
                            {loadingExpansion ? (
                                <div className='flex items-center justify-center'>
                                    <div className="w-4 h-4 border-2 border-t-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Analyzing Novelty...
                                </div>
                            ) : (
                                <div className='flex items-center justify-center'>
                                    <LightbulbIcon className="w-5 h-5 mr-2" />
                                    Request AI Deep Dive Expansion
                                </div>
                            )}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};


// --- MAIN VIEW ---

const InventionsView: React.FC = () => {
    const { mockInventions } = useInventionsData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<InventionCategory | 'All'>('All');
    const [selectedStatus, setSelectedStatus] = useState<InventionStatus | 'All'>('All');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: SortDirection }>({ key: 'date', direction: 'desc' });
    const [selectedInvention, setSelectedInvention] = useState<MockInvention | null>(null);

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <SortAscIcon className="w-3 h-3 ml-1 text-gray-500" />;
        return sortConfig.direction === 'asc' 
            ? <SortAscIcon className="w-3 h-3 ml-1 text-cyan-400" /> 
            : <SortDescIcon className="w-3 h-3 ml-1 text-cyan-400" />;
    };

    const filteredAndSortedInventions = useMemo(() => {
        let filtered = mockInventions.filter(inv => {
            const matchesSearch = inv.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 inv.summary.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || inv.category === selectedCategory;
            const matchesStatus = selectedStatus === 'All' || inv.status === selectedStatus;
            return matchesSearch && matchesCategory && matchesStatus;
        });

        filtered.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            let comparison = 0;
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else if (aValue < bValue) {
                comparison = -1;
            } else if (aValue > bValue) {
                comparison = 1;
            }

            return sortConfig.direction === 'asc' ? comparison : comparison * -1;
        });

        return filtered;
    }, [mockInventions, searchTerm, selectedCategory, selectedStatus, sortConfig]);

    const openDetailView = (invention: MockInvention) => {
        setSelectedInvention(invention);
    };

    if (selectedInvention) {
        return <InventionDetailView invention={selectedInvention} onBack={() => setSelectedInvention(null)} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white flex items-center">
                    <LightbulbIcon className="w-8 h-8 mr-3 text-yellow-400" />
                    Autonomous Scientist Inventions Catalog
                </h1>
                <Button variant="primary" className="flex items-center">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Invention Log
                </Button>
            </div>

            {/* Filter and Search Bar */}
            <Card className="p-4 border border-gray-800">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Search Input */}
                    <div className="relative flex-grow min-w-[200px]">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by title or summary..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as InventionCategory | 'All')}
                        className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-white min-w-[150px]"
                    >
                        <option value="All">All Categories</option>
                        {MOCK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>

                     {/* Status Filter */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as InventionStatus | 'All')}
                        className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-white min-w-[150px]"
                    >
                        <option value="All">All Statuses</option>
                        {MOCK_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
            </Card>

            {/* Sorting Controls */}
            <div className="flex space-x-4 text-sm text-gray-400">
                <span className="font-medium">Sort By:</span>
                {['date', 'title', 'status'].map(key => (
                    <button
                        key={key}
                        onClick={() => handleSort(key as SortKey)}
                        className={`flex items-center transition hover:text-cyan-400 ${sortConfig.key === key ? 'text-cyan-400' : ''}`}
                    >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                        {getSortIcon(key as SortKey)}
                    </button>
                ))}
            </div>

            {/* Invention Grid */}
            {filteredAndSortedInventions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAndSortedInventions.map(invention => (
                        <InventionCard 
                            key={invention.id} 
                            invention={invention} 
                            openDetailView={openDetailView}
                        />
                    ))}
                </div>
            ) : (
                <Card className="text-center p-10 border border-gray-700">
                    <h3 className="text-xl text-white mb-2">No Inventions Match Criteria</h3>
                    <p className="text-gray-400">Adjust your search or filters to find the desired artifacts of the Autonomous Scientist.</p>
                </Card>
            )}

            {/* Pagination Placeholder (If needed for large datasets) */}
            <div className="flex justify-center mt-6">
                {/* Pagination controls would go here */}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Page 1 of 1</span>
                    <ArrowRightIcon className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
};

export default InventionsView;