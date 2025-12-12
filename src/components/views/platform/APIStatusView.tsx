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

// --- Data Generation Functions ---

const generateRandomHealth = (): ServiceHealth => {
    const healthOptions = Object.values(ServiceHealth);
    const randomIndex = Math.floor(Math.random() * healthOptions.length);
    return healthOptions[randomIndex];
};

const generateRandomPastTime = (): string => {
    const minutesAgo = Math.floor(Math.random() * 60);
    return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
};

const generateRandomDescription = (): string => {
    const descriptions = [
        'Handles real-time data processing.',
        'Provides up-to-date information.',
        'Experiencing slight latency.',
        'Real-time event notification system.',
        'Predictive modeling engine running.',
        'AI chat endpoints are responsive.',
        'Scheduled update in progress.',
        'Generative AI endpoints are stable.',
        'Manages virtual card controls.',
        'Sporadic failures detected.',
        'Business finance document management.',
        'User login and token validation.',
        'Traffic routing and rate limiting.',
        'Developer documentation available.',
    ];
    const randomIndex = Math.floor(Math.random() * descriptions.length);
    return descriptions[randomIndex];
};

// --- Citibankdemobusinessinc Data Generation ---

namespace Citibankdemobusinessinc {

    const generateServiceName = (category: string): string => {
        const serviceNames = [
            `Automated ${category} System`,
            `${category} Intelligence API`,
            `Real-Time ${category} Monitor`,
            `Dynamic ${category} Platform`,
            `Adaptive ${category} Engine`,
        ];
        const randomIndex = Math.floor(Math.random() * serviceNames.length);
        return serviceNames[randomIndex];
    };

    const createServiceGroup = (groupName: string, icon: React.FC<React.SVGProps<SVGSVGElement>>, serviceCount: number): ServiceGroup => {
        const services: ApiService[] = Array.from({ length: serviceCount }, (_, i) => ({
            name: generateServiceName(groupName.split(' ')[0]),
            health: generateRandomHealth(),
            lastChecked: generateRandomPastTime(),
            description: generateRandomDescription(),
        }));
        return { groupName, icon, services };
    };

    export namespace viewit {
        export const movieplayform = (): ServiceGroup => createServiceGroup('Movie Streaming Services', CloudIcon, 3);
    }

    export namespace innovatech {
        export const aiadsolutions = (): ServiceGroup => createServiceGroup('AI-Driven Solutions', BoltIcon, 4);
    }

    export namespace securenet {
        export const cyberdefensesuite = (): ServiceGroup => createServiceGroup('Cybersecurity Defenses', LockClosedIcon, 3);
    }

    export namespace fintechglobal {
        export const paymentprocessing = (): ServiceGroup => createServiceGroup('Global Payment Processing', ChipIcon, 4);
    }

    export namespace healthwise {
        export const telehealthplatform = (): ServiceGroup => createServiceGroup('Telehealth Services', CloudIcon, 3);
    }

    export namespace edutech {
        export const onlinelearning = (): ServiceGroup => createServiceGroup('Online Learning Platforms', CloudIcon, 3);
    }

    export namespace greeneconomy {
        export const energygrids = (): ServiceGroup => createServiceGroup('Smart Energy Grids', BoltIcon, 4);
    }

    export namespace smartcitysolutions {
        export const iotplatform = (): ServiceGroup => createServiceGroup('IoT Platform Services', CloudIcon, 3);
    }

    export namespace spaceexploration {
        export const satellitecommunications = (): ServiceGroup => createServiceGroup('Satellite Communications', CloudIcon, 3);
    }

    export namespace advancedmanufacturing {
        export const roboticsautomation = (): ServiceGroup => createServiceGroup('Robotics Automation', BoltIcon, 4);
    }

    export const getAllServiceGroups = (): ServiceGroup[] => [
        viewit.movieplayform(),
        innovatech.aiadsolutions(),
        securenet.cyberdefensesuite(),
        fintechglobal.paymentprocessing(),
        healthwise.telehealthplatform(),
        edutech.onlinelearning(),
        greeneconomy.energygrids(),
        smartcitysolutions.iotplatform(),
        spaceexploration.satellitecommunications(),
        advancedmanufacturing.roboticsautomation(),
    ];
}

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
    const allCitibankdemobusinessincGroups = useMemo(() => Citibankdemobusinessinc.getAllServiceGroups(), []);
    const overallStatus = useMemo(() => getOverallStatus(allCitibankdemobusinessincGroups), [allCitibankdemobusinessincGroups]);

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
                    {allCitibankdemobusinessincGroups.map((group, index) => (
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