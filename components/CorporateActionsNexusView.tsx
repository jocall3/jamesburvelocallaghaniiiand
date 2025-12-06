
import React, { useState } from 'react';
import Card from './Card';
import { Calendar, CheckCircle, Clock, AlertOctagon, FileText, ChevronRight } from 'lucide-react';

interface CorporateAction {
    id: string;
    type: 'DIVIDEND' | 'MERGER' | 'SPLIT' | 'RIGHTS_ISSUE';
    securityName: string;
    securityTicker: string;
    announcementDate: string;
    exDate: string;
    paymentDate: string;
    status: 'ANNOUNCED' | 'ACTION_REQUIRED' | 'PROCESSED';
    description: string;
    financialImpact?: string;
}

const MOCK_ACTIONS: CorporateAction[] = [
    {
        id: 'CA-001',
        type: 'DIVIDEND',
        securityName: 'Apple Inc.',
        securityTicker: 'AAPL',
        announcementDate: '2024-05-02',
        exDate: '2024-05-10',
        paymentDate: '2024-05-16',
        status: 'PROCESSED',
        description: 'Cash Dividend of $0.25 per share',
        financialImpact: '+$12,500.00 USD'
    },
    {
        id: 'CA-002',
        type: 'MERGER',
        securityName: 'Fusion Dynamics',
        securityTicker: 'FUSN',
        announcementDate: '2024-06-01',
        exDate: '2024-07-15',
        paymentDate: '2024-07-20',
        status: 'ACTION_REQUIRED',
        description: 'Mandatory merger with Galactic Core. 1.5 share swap ratio.',
        financialImpact: 'Portfolio Rebalancing Required'
    },
    {
        id: 'CA-003',
        type: 'RIGHTS_ISSUE',
        securityName: 'Quantum Compute Corp',
        securityTicker: 'QCC',
        announcementDate: '2024-06-10',
        exDate: '2024-06-25',
        paymentDate: '2024-07-01',
        status: 'ANNOUNCED',
        description: 'Rights issue 1 for 5 at discounted price.',
    }
];

const CorporateActionsNexusView: React.FC = () => {
    const [selectedAction, setSelectedAction] = useState<CorporateAction | null>(MOCK_ACTIONS[1]);

    const getStatusInfo = (status: string) => {
        switch(status) {
            case 'PROCESSED': return { icon: <CheckCircle className="text-green-400" size={16}/>, classes: 'text-green-400 bg-green-400/10 border-green-400/20' };
            case 'ACTION_REQUIRED': return { icon: <AlertOctagon className="text-red-400 animate-pulse" size={16}/>, classes: 'text-red-400 bg-red-400/10 border-red-400/20 animate-pulse' };
            case 'ANNOUNCED': return { icon: <Clock className="text-blue-400" size={16}/>, classes: 'text-blue-400 bg-blue-400/10 border-blue-400/20' };
            default: return { icon: null, classes: 'text-gray-400' };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-wider">Corporate Actions Nexus</h2>
                    <p className="text-gray-400 mt-1">Lifecycle management for mandatory and voluntary events.</p>
                </div>
                <div className="flex gap-3">
                    <div className="text-center px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-500 uppercase">Pending Actions</p>
                        <p className="text-xl font-bold text-white">2</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-500 uppercase">Projected Income</p>
                        <p className="text-xl font-bold text-green-400">$45.2k</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline List */}
                <Card className="lg:col-span-2">
                    <div className="space-y-4">
                        {MOCK_ACTIONS.map(action => {
                            const statusInfo = getStatusInfo(action.status);
                            return (
                                <div 
                                    key={action.id}
                                    onClick={() => setSelectedAction(action)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${selectedAction?.id === action.id ? 'bg-indigo-900/30 border-indigo-500' : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl bg-gray-700 text-white`}>
                                            {action.securityTicker.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{action.securityName}</h4>
                                            <p className="text-sm text-gray-400">{action.type} • {action.securityTicker}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-gray-500">Ex-Date</p>
                                            <p className="text-sm text-white font-mono">{action.exDate}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusInfo.classes}`}>
                                            {statusInfo.icon}
                                            {action.status.replace('_', ' ')}
                                        </span>
                                        <ChevronRight className="text-gray-500" size={20} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Card>

                {/* Details Panel */}
                <Card title="Event Details" className="border-l-4 border-purple-500">
                    {selectedAction ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">{selectedAction.type}</h3>
                                <p className="text-indigo-400 text-lg">{selectedAction.securityName}</p>
                            </div>

                            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    {selectedAction.description}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-gray-700 pb-2">
                                    <span className="text-gray-400">Announcement</span>
                                    <span className="text-white">{selectedAction.announcementDate}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-700 pb-2">
                                    <span className="text-gray-400">Ex-Date</span>
                                    <span className="text-white">{selectedAction.exDate}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-700 pb-2">
                                    <span className="text-gray-400">Payment Date</span>
                                    <span className="text-white">{selectedAction.paymentDate}</span>
                                </div>
                                {selectedAction.financialImpact && (
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-gray-400">Estimated Impact</span>
                                        <span className="text-green-400 font-bold font-mono">{selectedAction.financialImpact}</span>
                                    </div>
                                )}
                            </div>

                            {selectedAction.status === 'ACTION_REQUIRED' && (
                                <div className="pt-4 border-t border-gray-700">
                                    <p className="text-sm text-red-400 mb-3 font-bold flex items-center gap-2">
                                        <AlertOctagon size={16} /> Election Required
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-sm">Accept Offer</button>
                                        <button className="py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold text-sm">Reject / Sell</button>
                                    </div>
                                </div>
                            )}
                             {selectedAction.status !== 'ACTION_REQUIRED' && (
                                 <div className="pt-4 border-t border-gray-700">
                                     <button className="w-full py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded flex items-center justify-center gap-2">
                                         <FileText size={16} /> Download Notice
                                     </button>
                                 </div>
                             )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 py-20">
                            <Calendar size={48} className="mb-4 opacity-20" />
                            <p>Select an event to view details</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default CorporateActionsNexusView;
