import React from 'react';
import { format, parseISO } from 'date-fns';
import Card from '../../../../components/Card';

export interface LicenseSummary {
    id: string;
    name: string;
    expiryDate: string;
}

interface ComplianceStatsProps {
    activeLicensesCount: number;
    pendingRenewalLicensesCount: number;
    expiredLicensesCount: number;
    upcomingRenewals: LicenseSummary[];
    highSeverityRegUpdates: number;
}

const ComplianceStats: React.FC<ComplianceStatsProps> = ({
    activeLicensesCount,
    pendingRenewalLicensesCount,
    expiredLicensesCount,
    upcomingRenewals,
    highSeverityRegUpdates,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card title="Active Licenses">
                <div className="text-5xl font-extrabold text-green-400">{activeLicensesCount}</div>
                <p className="text-gray-400 mt-2 text-sm">Total currently active licenses.</p>
            </Card>
            
            <Card title="Pending Renewals">
                <div className="text-5xl font-extrabold text-yellow-400">{pendingRenewalLicensesCount}</div>
                <p className="text-gray-400 mt-2 text-sm">Licenses requiring attention soon.</p>
                {upcomingRenewals.length > 0 && (
                    <div className="mt-2 text-xs text-gray-300">
                        <span className="font-semibold text-white">Next:</span> {upcomingRenewals[0].name} ({format(parseISO(upcomingRenewals[0].expiryDate), 'MMM yyyy')})
                    </div>
                )}
            </Card>
            
            <Card title="Expired Licenses">
                <div className="text-5xl font-extrabold text-red-400">{expiredLicensesCount}</div>
                <p className="text-gray-400 mt-2 text-sm">Licenses that have already expired.</p>
            </Card>
            
            <Card title="High Severity Reg. Updates">
                <div className="text-5xl font-extrabold text-red-500">{highSeverityRegUpdates}</div>
                <p className="text-gray-400 mt-2 text-sm">Unaddressed high-priority regulatory changes.</p>
            </Card>
        </div>
    );
};

export default ComplianceStats;