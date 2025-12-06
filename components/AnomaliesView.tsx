
import React from 'react';
import Card from './Card';
import { MOCK_ANOMALIES } from '../data/mockData';
import { FinancialAnomaly } from '../types';
import { AlertTriangle, Zap, BarChart } from 'lucide-react';

const AnomalyCard: React.FC<{ anomaly: FinancialAnomaly }> = ({ anomaly }) => {
    const severityStyles = {
        High: { icon: <AlertTriangle className="text-red-400" />, border: 'border-red-500' },
        Medium: { icon: <Zap className="text-yellow-400" />, border: 'border-yellow-500' },
        Low: { icon: <BarChart className="text-blue-400" />, border: 'border-blue-500' }
    }
    const styles = severityStyles[anomaly.severity];

    return (
        <div className={`p-4 bg-gray-800/50 rounded-xl border-l-4 ${styles.border} flex gap-4`}>
            <div className="mt-1">
                {styles.icon}
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-white">{anomaly.description}</p>
                        <p className="text-xs text-gray-400">{anomaly.entityDescription}</p>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{new Date(anomaly.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-300 mt-2">{anomaly.details}</p>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                    <span>Status: <span className="font-semibold text-white">{anomaly.status}</span></span>
                    <span>Risk Score: <span className="font-mono font-bold text-white">{anomaly.riskScore}</span></span>
                </div>
            </div>
        </div>
    )
}


const AnomaliesView: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider">AI Anomaly Detection Feed</h2>
            <Card>
                <div className="space-y-4">
                    {MOCK_ANOMALIES.map(anomaly => (
                        <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                    ))}
                </div>
            </Card>
        </div>
    );
}

export default AnomaliesView;
