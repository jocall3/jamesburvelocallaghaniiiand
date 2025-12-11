import React, { useMemo } from 'react';
import { ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, BoltIcon, CloudIcon, ChipIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import ViewContainer from '../../ViewContainer';

// --- Types ---

enum ServiceHealth {
    Operational = 'Operational',
    DegradedPerformance = 'Degraded Performance',
    PartialOutage = 'Partial Outage',
    MajorOutage = 'Major Outage',
    Maintenance = 'Under Maintenance',
}

interface ApiService {
    name: string;
    health: ServiceHealth;
    lastChecked: string;
    description: string;
}

interface ServiceGroup {
    groupName: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    services: ApiService[];
}

// --- Mock Data ---

const MOCK_SERVICES: ServiceGroup[] = [
    {
        groupName: 'Core Banking & Transactions',
        icon: ChipIcon,
        services: [
            { name: 'Transaction Processing API', health: ServiceHealth.Operational, lastChecked: 'Just now', description: 'Handles all real-time ledger entries and transfers.' },
            { name: 'Account Balances API', health: ServiceHealth.Operational, lastChecked: 'Just now', description: 'Provides up-to-date account balance information.' },
            { name: 'Payment Gateway (Stripe/Marqeta)', health: ServiceHealth.DegradedPerformance, lastChecked: '1 minute ago', description: 'Slight increase in latency (P95) for payment orders due to high volume.' },
            { name: 'Webhooks & Events', health: ServiceHealth.Operational, lastChecked: 'Just now', description: 'Real-time event notification system is healthy.' },
        ],
    },
    {
        groupName: 'AI & Computational Services',
        icon: BoltIcon,
        services: [
            { name: 'Quantum Oracle (Simulation)', health: ServiceHealth.Operational, lastChecked: 'Just now', description: 'Predictive modeling engine is running at full capacity.' },
            { name: 'AI Advisor (Conversational)', health: ServiceHealth.Operational, lastChecked: '2 minutes ago', description: 'AI chat endpoints are responsive.' },
            { name: 'Quantum Weaver (Incubation)', health: ServiceHealth.Maintenance, lastChecked: '1 hour ago', description: 'Scheduled update to the model infrastructure (Expected completion: 12:00 UTC).' },
            { name: 'Ad Studio (Video Generation)', health: ServiceHealth.Operational, lastChecked: 'Just now', description: 'Generative AI endpoints are stable.' },
        ],
    },
    {
        groupName: 'Corporate Finance & Compliance',
        icon: LockClosedIcon,
        services: [
            { name: 'Corporate Cards API', health: ServiceHealth.Operational, lastChecked: 'Just now', description: 'Manages virtual and physical corporate card controls.' },
            { name: 'Anomaly Detection System', health: ServiceHealth.PartialOutage, lastChecked: '5 minutes ago', description: 'Sporadic failures in real-time fraud scoring service.' },
            { name: 'Invoicing & Counterparties', health: ServiceHealth.Operational, lastChecked: 'Just now', description: 'Business finance document management is stable.' },
        ],
    },
    {
        groupName: 'Platform & Developer Experience',
        icon: CloudIcon,
        services: [
            { name: 'Authentication & Identity', health: ServiceHealth.Operational, lastChecked: 'Just now', description: 'User login and token validation services are fully functional.' },
            { name: 'API Gateway Management', health: ServiceHealth.Operational, lastChecked: 'Just now', description: 'Traffic routing and rate limiting are healthy.' },
            { name: 'Documentation Hosting', health: ServiceHealth.Operational, lastChecked: 'Just now', description: 'Developer documentation site is available.' },
        ],
    },
];

// --- Utility Functions ---

const getHealthColor = (health: ServiceHealth) => {
    switch (health) {
        case ServiceHealth.Operational:
            return 'bg-green-700 text-green-100';
        case ServiceHealth.DegradedPerformance:
        case ServiceHealth.PartialOutage:
            return 'bg-yellow-700 text-yellow-100';
        case ServiceHealth.MajorOutage:
            return 'bg-red-700 text-red-100';
        case ServiceHealth.Maintenance:
            return 'bg-blue-700 text-blue-100';
    }
};

const getHealthIndicator = (health: ServiceHealth) => {
    switch (health) {
        case ServiceHealth.Operational:
            return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        case ServiceHealth.DegradedPerformance:
        case ServiceHealth.PartialOutage:
            return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
        case ServiceHealth.MajorOutage:
            return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
        case ServiceHealth.Maintenance:
            return <ClockIcon className="w-5 h-5 text-blue-500" />;
    }
};

const getOverallStatus = (groups: ServiceGroup[]): ServiceHealth => {
    const allServices = groups.flatMap(g => g.services);
    
    if (allServices.some(s => s.health === ServiceHealth.MajorOutage)) return ServiceHealth.MajorOutage;
    if (allServices.some(s => s.health === ServiceHealth.PartialOutage)) return ServiceHealth.PartialOutage;
    if (allServices.some(s => s.health === ServiceHealth.DegradedPerformance)) return ServiceHealth.DegradedPerformance;
    if (allServices.every(s => s.health === ServiceHealth.Operational || s.health === ServiceHealth.Maintenance)) return ServiceHealth.Operational;
    
    return ServiceHealth.Operational; // Default fallback
};

// --- Sub-components ---

const OverallStatus: React.FC<{ status: ServiceHealth }> = ({ status }) => {
    const statusText = status === ServiceHealth.Operational ? 'All Systems Operational' : status;
    
    let colorClass = 'bg-green-600';
    let icon = <CheckCircleIcon className="w-8 h-8 mr-4" />;
    
    switch (status) {
        case ServiceHealth.DegradedPerformance:
        case ServiceHealth.PartialOutage:
            colorClass = 'bg-yellow-600';
            icon = <ExclamationTriangleIcon className="w-8 h-8 mr-4" />;
            break;
        case ServiceHealth.MajorOutage:
            colorClass = 'bg-red-700';
            icon = <ExclamationTriangleIcon className="w-8 h-8 mr-4" />;
            break;
    }

    return (
        <div className={`p-6 rounded-lg shadow-xl text-white flex items-center mb-8 ${colorClass}`}>
            {icon}
            <h2 className="text-3xl font-bold">{statusText}</h2>
        </div>
    );
};

const ServiceGroupComponent: React.FC<{ group: ServiceGroup }> = ({ group }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const Icon = group.icon;

    // Determine the group status for the badge
    const groupHealth = group.services.some(s => s.health !== ServiceHealth.Operational && s.health !== ServiceHealth.Maintenance) 
        ? ServiceHealth.PartialOutage : ServiceHealth.Operational;
    
    const statusText = groupHealth === ServiceHealth.Operational ? 'Operational' : 'Issues Detected';

    return (
        <div className="border border-gray-700 rounded-lg overflow-hidden mb-4 bg-gray-800/50 backdrop-blur-sm">
            <button
                className="w-full p-4 flex justify-between items-center text-left hover:bg-gray-700/50 transition duration-150"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center">
                    <Icon className="w-6 h-6 mr-3 text-cyan-400" />
                    <h3 className="text-xl font-semibold text-gray-100">{group.groupName}</h3>
                </div>
                <div className="flex items-center">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${groupHealth === ServiceHealth.Operational ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'}`}>
                        {statusText}
                    </span>
                    <svg
                        className={`w-5 h-5 ml-2 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </button>
            
            {isExpanded && (
                <div className="divide-y divide-gray-700 border-t border-gray-700">
                    {group.services.map((service, index) => (
                        <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-700/30 transition duration-150">
                            <div className="flex items-center">
                                {getHealthIndicator(service.health)}
                                <div className="ml-3">
                                    <p className="text-gray-200 font-medium">{service.name}</p>
                                    <p className="text-xs text-gray-500">{service.description}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getHealthColor(service.health)}`}>
                                    {service.health}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">Checked: {service.lastChecked}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main Component ---

const APIStatusView: React.FC = () => {
    const overallStatus = useMemo(() => getOverallStatus(MOCK_SERVICES), []);

    const mockIncidents = [
        { id: 1, title: 'Monitoring: Increased Latency in Payment Processing', status: 'Investigating', date: 'Jul 25, 2024 - 11:30 UTC' },
        { id: 2, title: 'Scheduled Maintenance: Quantum Weaver Model Update', status: 'In Progress', date: 'Jul 24, 2024 - 01:00 UTC' },
        { id: 3, title: 'Resolved: Sporadic Account Balance Retrieval Errors', status: 'Resolved', date: 'Jul 23, 2024 - 15:45 UTC' },
    ];

    return (
        <ViewContainer
            title="API Status Console"
            icon={<BoltIcon className="w-6 h-6" />}
            description="Real-time health and uptime report for all Sovereign's Ledger Core APIs and services."
        >
            <div className="max-w-4xl mx-auto">
                {/* Overall Status */}
                <OverallStatus status={overallStatus} />

                {/* Service Group List */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-100 mb-4 border-b border-gray-700 pb-2">Service Health Metrics</h2>
                    {MOCK_SERVICES.map((group, index) => (
                        <ServiceGroupComponent key={index} group={group} />
                    ))}
                </div>

                {/* Incidents and History */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-100 mb-4 border-b border-gray-700 pb-2">Recent Incidents & Maintenance</h2>
                    <div className="space-y-4">
                        {mockIncidents.map((incident) => (
                            <div key={incident.id} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 shadow-lg flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-medium text-cyan-400">{incident.title}</p>
                                    <p className="text-sm text-gray-500">{incident.date}</p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                    incident.status === 'Resolved' ? 'bg-green-700 text-green-100' :
                                    incident.status === 'Investigating' ? 'bg-red-700 text-red-100' :
                                    'bg-blue-700 text-blue-100'
                                }`}>
                                    {incident.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="mt-12 pt-6 border-t border-gray-700 text-center">
                    <p className="text-xs text-gray-600">
                        All times are displayed in Coordinated Universal Time (UTC). This status page reflects the current operational state of the Sovereign's Ledger Platform.
                    </p>
                </div>
            </div>
        </ViewContainer>
    );
};

export default APIStatusView;
```