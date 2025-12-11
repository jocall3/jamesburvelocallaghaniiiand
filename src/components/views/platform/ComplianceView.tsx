```tsx
import React, { useState } from 'react';
import { View } from '../../types';
import { useOnAnomalyDetectedSubscription } from '../../graphql/generated'; // Mock import
import { AnomalySeverity, AnomalyStatus } from '../../graphql/generated'; // Mock import
import { AiBrainIcon, AnomalyDetectionIcon, OSPOIcon, ComplianceIcon, FortressIcon } from '../../constants'; // Mock import
import { Card, Metric, Text, Title, AreaChart, Select, SelectItem, Button, Flex, CategoryBar, Divider } from '@tremor/react';
import { twMerge } from 'tailwind-merge';

// Mock data and components for demonstration purposes
const mockAnomalies = [
    { id: 'anom_001', description: 'Unusual transaction volume from a new IP address', severity: AnomalySeverity.High, status: AnomalyStatus.New, timestamp: new Date().toISOString(), riskScore: 85, details: 'Transaction volume from IP 203.0.113.19 increased by 300% in the last hour.' },
    { id: 'anom_002', description: 'Suspicious login pattern detected', severity: AnomalySeverity.Medium, status: AnomalyStatus.UnderReview, timestamp: new Date().toISOString(), riskScore: 60, details: 'User account "admin" logged in from two geographically distant locations within 5 minutes.' },
    { id: 'anom_003', description: 'Potential policy violation in code repository', severity: AnomalySeverity.Low, status: AnomalyStatus.Resolved, timestamp: new Date().toISOString(), riskScore: 30, details: 'Detected use of deprecated security library in feature branch "dev-temp-fix".' },
    { id: 'anom_004', description: 'Unusual spike in cloud storage costs', severity: AnomalySeverity.High, status: AnomalyStatus.New, timestamp: new Date().toISOString(), riskScore: 90, details: 'AWS S3 bucket "user-uploads" showed a 50% cost increase due to unexpected large file uploads.' },
];

interface ComplianceViewProps {
    setActiveView: (view: View) => void;
}

const ComplianceView: React.FC<ComplianceViewProps> = ({ setActiveView }) => {
    const [activeTab, setActiveTab] = useState<'anomalies' | 'ospo' | 'ai-governance'>('anomalies');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<AnomalyStatus | 'All'>('All');

    // Mock subscription hook for real-time updates
    // const { data, loading, error } = useOnAnomalyDetectedSubscription();
    // useEffect(() => {
    //     if (data?.onAnomalyDetected) {
    //         // Handle new anomaly data, e.g., add to list or trigger notification
    //         console.log("New anomaly detected:", data.onAnomalyDetected);
    //     }
    // }, [data]);

    const filteredAnomalies = mockAnomalies.filter(anomaly =>
        selectedStatusFilter === 'All' || anomaly.status === selectedStatusFilter
    );

    const getSeverityColor = (severity: AnomalySeverity) => {
        switch (severity) {
            case AnomalySeverity.Critical: return 'red-500';
            case AnomalySeverity.High: return 'orange-500';
            case AnomalySeverity.Medium: return 'yellow-500';
            case AnomalySeverity.Low: return 'green-500';
            default: return 'gray-500';
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'anomalies':
                return (
                    <>
                        <Flex className="mb-4" justifyContent="between" alignItems="center">
                            <Title>Financial Anomalies</Title>
                            <Select
                                value={selectedStatusFilter}
                                onChange={(val) => setSelectedStatusFilter(val as AnomalyStatus | 'All')}
                                placeholder="Filter by Status"
                                className="w-48"
                            >
                                <SelectItem value="All" text="All Statuses" />
                                <SelectItem value={AnomalyStatus.New} text="New" />
                                <SelectItem value={AnomalyStatus.UnderReview} text="Under Review" />
                                <SelectItem value={AnomalyStatus.Dismissed} text="Dismissed" />
                                <SelectItem value={AnomalyStatus.Resolved} text="Resolved" />
                            </Select>
                        </Flex>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredAnomalies.map(anomaly => (
                                <Card key={anomaly.id} className="border-l-4" decoration="top" decorationColor={getSeverityColor(anomaly.severity)}>
                                    <Flex alignItems="start" className="space-x-4">
                                        <div className="flex-shrink-0">
                                             <AiBrainIcon className="h-6 w-6 text-gray-400"/>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <Text className="text-xs text-gray-500">
                                                {new Date(anomaly.timestamp).toLocaleString()}
                                            </Text>
                                            <Title className="truncate font-bold">{anomaly.description}</Title>
                                            <Text className="text-sm truncate">{anomaly.details}</Text>
                                            <Flex justifyContent="between" alignItems="center" className="mt-2">
                                                <CategoryBar
                                                    values={[0, 30, 60, 90, 100]}
                                                    maxValue={100}
                                                    colors={['green-300', 'yellow-300', 'orange-400', 'red-400']}
                                                    className="max-w-xs"
                                                    percentageValue={anomaly.riskScore}
                                                />
                                                <Text className={`font-semibold text-${getSeverityColor(anomaly.severity)}`}>
                                                    {anomaly.status}
                                                </Text>
                                            </Flex>
                                            <Flex justifyContent="end" className="mt-2">
                                                 <Button 
                                                     size="xs" 
                                                     variant="secondary" 
                                                     onClick={() => setActiveView(View.AnomalyDetection)} // Assuming AnomalyDetectionView is a specific detail page
                                                 >
                                                     View Details
                                                 </Button>
                                            </Flex>
                                        </div>
                                    </Flex>
                                </Card>
                            ))}
                        </div>
                    </>
                );
            case 'ospo':
                return (
                    <div className="space-y-6">
                        <Title>Open Source Program Office</Title>
                        <Card>
                            <Title>License Compliance</Title>
                            <Text>Monitor and manage all open-source software licenses used within the project.</Text>
                            <Flex className="mt-4" justifyContent="start">
                                <Button size="xs" icon={OSPOIcon} onClick={() => setActiveView(View.OSPO)}>
                                    Go to OSPO
                                </Button>
                            </Flex>
                        </Card>
                        <Card>
                            <Title>SBOM Generation</Title>
                            <Text>Automated generation of Software Bill of Materials (SBOM) for security audits.</Text>
                            <Flex className="mt-4" justifyContent="start">
                                 <Button size="xs" icon={OSPOIcon}>
                                     Generate SBOM
                                 </Button>
                             </Flex>
                        </Card>
                         <Card>
                            <Title>Contribution Tracking</Title>
                            <Text>Track internal and external contributions to open-source projects.</Text>
                            <Flex className="mt-4" justifyContent="start">
                                 <Button size="xs" icon={OSPOIcon}>
                                     View Contributions
                                 </Button>
                             </Flex>
                        </Card>
                    </div>
                );
            case 'ai-governance':
                return (
                    <div className="space-y-6">
                        <Title>AI Governance & Risk</Title>
                        <Card>
                            <Title>AI Model Registry</Title>
                            <Text>Catalog and manage all AI models used within the platform, including their training data, performance metrics, and ethical guidelines.</Text>
                            <Flex className="mt-4" justifyContent="start">
                                 <Button size="xs" icon={AiBrainIcon} onClick={() => setActiveView(View.AIGovernance)}>
                                     Manage AI Models
                                 </Button>
                             </Flex>
                        </Card>
                        <Card>
                            <Title>AI Risk Assessment</Title>
                            <Text>Evaluate AI models for potential bias, fairness issues, and security vulnerabilities. The AI can perform simulated risk assessments.</Text>
                            <Flex className="mt-4" justifyContent="start">
                                 <Button size="xs" icon={FortressIcon} onClick={() => setActiveView(View.AIRiskRegistry)}>
                                     View Risk Registry
                                 </Button>
                             </Flex>
                        </Card>
                         <Card>
                            <Title>AI Policy Enforcement</Title>
                            <Text>Ensure AI model usage adheres to defined governance policies and ethical standards.</Text>
                             <Flex className="mt-4" justifyContent="start">
                                 <Button size="xs" icon={ComplianceIcon}>
                                     View Policies
                                 </Button>
                             </Flex>
                        </Card>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Flex justifyContent="between" alignItems="center" className="mb-6">
                <Title>Compliance Overview</Title>
                 <Button icon={ComplianceIcon} onClick={() => setActiveView(View.MetaDashboard)}>
                     Back to Dashboard
                 </Button>
            </Flex>

            <div className="border-b border-gray-700 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('anomalies')}
                        className={twMerge(
                            activeTab === 'anomalies'
                                ? 'border-cyan-400 text-cyan-400'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                            'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center space-x-2'
                        )}
                    >
                        <AnomalyDetectionIcon className="h-5 w-5" />
                        <span>Anomalies ({filteredAnomalies.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('ospo')}
                        className={twMerge(
                            activeTab === 'ospo'
                                ? 'border-cyan-400 text-cyan-400'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                            'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center space-x-2'
                        )}
                    >
                        <OSPOIcon className="h-5 w-5" />
                        <span>OSPO</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('ai-governance')}
                        className={twMerge(
                            activeTab === 'ai-governance'
                                ? 'border-cyan-400 text-cyan-400'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                            'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center space-x-2'
                        )}
                    >
                        <AiBrainIcon className="h-5 w-5" />
                        <span>AI Governance</span>
                    </button>
                </nav>
            </div>

            {renderTabContent()}
        </div>
    );
};

export default ComplianceView;
```