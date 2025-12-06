
import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { ComplianceCase } from '../types';
import iso20022 from '../data/iso20022.json'; // Assuming you'd have a json file
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const ComplianceView: React.FC = () => {
    const context = useContext(DataContext);
    const [searchTerm, setSearchTerm] = useState('');

    if (!context) {
        return <div>Loading...</div>
    }

    const { complianceCases } = context;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open': return <AlertTriangle className="text-red-400" />;
            case 'investigating': return <Clock className="text-yellow-400" />;
            case 'closed': return <CheckCircle className="text-green-400" />;
            default: return null;
        }
    }
    
    const filteredCodes = Object.entries((iso20022 as any).definitions).filter(([key]: [string, any]) => key.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider">Compliance Dashboard</h2>
            
            <Card title="Active Compliance Cases">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {complianceCases.map(c => (
                        <div key={c.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-white">{c.reason}</p>
                                    <p className="text-xs text-gray-400">{c.entityType}: {c.entityId}</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm capitalize">
                                    {getStatusIcon(c.status)}
                                    {c.status}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Opened: {c.openedDate}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <Card title="ISO 20022 Code Explorer">
                <input 
                    type="text"
                    placeholder="Search ISO 20022 codes..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 mb-4 bg-gray-900 border border-gray-700 rounded text-white"
                />
                <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredCodes.map(([key, value]: [string, any]) => (
                        <div key={key} className="p-3 border-b border-gray-800">
                            <p className="font-mono font-bold text-cyan-400">{key}</p>
                            <p className="text-xs text-gray-300 mt-1 whitespace-pre-wrap">{value.description}</p>
                            {value.enum && <p className="text-xs text-gray-500 mt-1 font-mono">Values: {value.enum.join(', ')}</p>}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

export default ComplianceView;
