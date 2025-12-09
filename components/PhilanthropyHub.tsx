import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

// --- GEINOS_Icon_Library: Internal Icon System ---
// Reduced list of icons to keep file size manageable while supporting the UI
type IconName = 
    | 'DollarSign' | 'Zap' | 'Target' | 'BarChart2' | 'TrendingUp' | 'Briefcase' | 'Cpu' | 'Layers' | 'Plus' | 'X' 
    | 'ArrowRight' | 'Bot' | 'ChevronsRight' | 'FileText' | 'Filter' | 'Settings' | 'ShieldCheck' | 'Heart' | 'Info' 
    | 'AlertTriangle' | 'CheckCircle' | 'Clock' | 'Database' | 'Key' | 'Lock' | 'Globe' | 'Code' | 'Terminal' | 'Cloud' 
    | 'Server' | 'GitBranch' | 'Package' | 'Bug' | 'Users' | 'Book' | 'Lightbulb' | 'Search' | 'Menu' | 'User' | 'Mail'
    | 'Calendar' | 'CreditCard' | 'Gift' | 'Award' | 'ExternalLink' | 'Trash' | 'Edit' | 'Save' | 'Download' | 'Upload'
    | 'Activity';

const GEINOS_ICON_MAP: Record<IconName, string> = {
    DollarSign: `<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`,
    Zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
    Target: `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
    BarChart2: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
    TrendingUp: `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`,
    Briefcase: `<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>`,
    Cpu: `<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M20 15h2M9 2v2M9 20v2M2 9h2M20 9h2"/>`,
    Layers: `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,
    Plus: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
    X: `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
    ArrowRight: `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`,
    Bot: `<path d="M12 8V4H8"/><rect x="2" y="12" width="20" height="10" rx="2"/><path d="M10 12v2"/><path d="M14 12v2"/><path d="M12 2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>`,
    ChevronsRight: `<polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>`,
    FileText: `<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>`,
    Filter: `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`,
    Settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
    ShieldCheck: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>`,
    Heart: `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`,
    Info: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/>`,
    AlertTriangle: `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/>`,
    CheckCircle: `<path d="M22 11.08V12a10 10 0 1 1-5.93-8.9"/><polyline points="22 4 12 14.01 9 11.01"/>`,
    Clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
    Database: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M21 19c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`,
    Key: `<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.77-7.77l7.77-7.77zm0 0L15.5 7.5l7.5-7.5"/><path d="M11 11l-6 6a2 2 0 0 0 0 2.82l2.18 2.18a2 2 0 0 0 2.82 0l6-6"/>`,
    Lock: `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
    Globe: `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/>`,
    Code: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`,
    Terminal: `<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>`,
    Cloud: `<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>`,
    Server: `<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6" y2="6"/><line x1="6" y1="18" x2="6" y2="18"/>`,
    GitBranch: `<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>`,
    Package: `<line x1="16.5" y1="9.4" x2="7.5" y2="4.2"/><path d="M2.5 7.6V16L12 21.5 21.5 16V7.6L12 2.5z"/><path d="M12 2.5v19"/><path d="M2.5 7.6L12 12.5L21.5 7.6"/>`,
    Bug: `<path d="M19 11.5a7 7 0 0 1-14 0V2H2v10a10 10 0 0 0 20 0V2h-3.5z"/><path d="M4 12h16"/><path d="M12 2v10"/><path d="M12 12h0"/>`,
    Users: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    Book: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,
    Lightbulb: `<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>`,
    Search: `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
    Menu: `<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>`,
    User: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
    Mail: `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>`,
    Calendar: `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
    CreditCard: `<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>`,
    Gift: `<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>`,
    Award: `<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>`,
    ExternalLink: `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>`,
    Trash: `<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`,
    Edit: `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
    Save: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>`,
    Download: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`,
    Upload: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>`,
    Activity: `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`
};

interface IconProps {
    name: IconName;
    size?: number;
    color?: string;
    className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, color = 'currentColor', className = '' }) => {
    const path = GEINOS_ICON_MAP[name];
    if (!path) return null;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            dangerouslySetInnerHTML={{ __html: path }}
        />
    );
};

// --- PhilanthropyHub Component ---

interface Charity {
    id: string;
    name: string;
    category: string;
    description: string;
    impactScore: number;
    raised: number;
    goal: number;
}

const MOCK_CHARITIES: Charity[] = [
    {
        id: '1',
        name: 'Global Clean Water Initiative',
        category: 'Environment',
        description: 'Providing clean and safe drinking water to communities in need.',
        impactScore: 95,
        raised: 125000,
        goal: 200000
    },
    {
        id: '2',
        name: 'Tech Education for All',
        category: 'Education',
        description: 'Empowering underprivileged youth with coding and digital skills.',
        impactScore: 92,
        raised: 75000,
        goal: 100000
    },
    {
        id: '3',
        name: 'Wildlife Conservation Fund',
        category: 'Animals',
        description: 'Protecting endangered species and preserving natural habitats.',
        impactScore: 88,
        raised: 45000,
        goal: 80000
    },
    {
        id: '4',
        name: 'Disaster Relief Corps',
        category: 'Humanitarian',
        description: 'Rapid response team for natural disasters worldwide.',
        impactScore: 98,
        raised: 300000,
        goal: 500000
    }
];

const PhilanthropyHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'charities' | 'impact'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);

    const filteredCharities = useMemo(() => {
        return MOCK_CHARITIES.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const totalDonated = 54200;
    const totalImpactScore = 94;
    const projectsSupported = 12;

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
                        <Icon name="DollarSign" size={32} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Total Donated</p>
                        <h3 className="text-2xl font-bold text-white">${totalDonated.toLocaleString()}</h3>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                        <Icon name="Activity" size={32} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Lives Impacted</p>
                        <h3 className="text-2xl font-bold text-white">1,240+</h3>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center space-x-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
                        <Icon name="Globe" size={32} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Projects Supported</p>
                        <h3 className="text-2xl font-bold text-white">{projectsSupported}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Icon name="TrendingUp" className="mr-2 text-emerald-400" />
                    Recent Activity
                </h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-slate-600 rounded-full">
                                    <Icon name="CheckCircle" size={16} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Donation to Clean Water Initiative</p>
                                    <p className="text-slate-400 text-xs">2 days ago</p>
                                </div>
                            </div>
                            <span className="text-white font-bold">$500.00</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderCharities = () => (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                <Icon name="Search" className="text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search charities..." 
                    className="bg-transparent border-none outline-none text-white w-full placeholder-slate-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCharities.map(charity => (
                    <div key={charity.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-emerald-500/50 transition-colors">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full mb-2 inline-block">
                                        {charity.category}
                                    </span>
                                    <h3 className="text-xl font-bold text-white">{charity.name}</h3>
                                </div>
                                <div className="p-2 bg-slate-700 rounded-lg">
                                    <Icon name="Award" className="text-yellow-400" />
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm mb-6 h-10 line-clamp-2">
                                {charity.description}
                            </p>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Raised</span>
                                    <span className="text-white font-medium">${charity.raised.toLocaleString()} / ${charity.goal.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full" 
                                        style={{ width: `${(charity.raised / charity.goal) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex space-x-3">
                                <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center">
                                    <Icon name="Heart" size={18} className="mr-2" />
                                    Donate
                                </button>
                                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                                    <Icon name="Info" size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center">
                            <Icon name="Heart" className="mr-3 text-emerald-500" size={32} />
                            Philanthropy Hub
                        </h1>
                        <p className="text-slate-400 mt-2">Manage your impact and discover new causes.</p>
                    </div>
                    <div className="flex space-x-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                        {(['overview', 'charities', 'impact'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    activeTab === tab 
                                    ? 'bg-slate-700 text-white shadow-sm' 
                                    : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </header>

                <main>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'charities' && renderCharities()}
                    {activeTab === 'impact' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-800 rounded-xl border border-slate-700">
                            <div className="p-6 bg-slate-700/50 rounded-full mb-6">
                                <Icon name="BarChart2" size={48} className="text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Impact Analytics</h2>
                            <p className="text-slate-400 max-w-md">
                                Detailed impact reports and visualization tools are coming soon. Track exactly how your contributions are making a difference.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default PhilanthropyHub;