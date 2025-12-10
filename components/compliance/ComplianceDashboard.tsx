import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Tag,
  Badge,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Card,
  CardHeader,
  CardBody,
  Flex,
  Spacer,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tooltip,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Button,
} from '@chakra-ui/react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiCalendar,
  FiActivity,
} from 'react-icons/fi';

// --- Mock Data Interfaces ---
interface ComplianceArea {
  id: string;
  name: string;
  status: 'Compliant' | 'Non-Compliant' | 'At-Risk' | 'In-Progress';
  lastUpdated: string;
  owner: string;
  progress: number; // 0-100
  issuesCount: number;
  description: string;
}

interface ComplianceAlert {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Resolved' | 'Acknowledged';
  reportedAt: string;
  area: string; // e.g., 'GDPR', 'Data Privacy'
  owner: string;
}

interface RegulatoryDeadline {
  id: string;
  regulation: string;
  description: string;
  dueDate: string;
  status: 'Upcoming' | 'Overdue' | 'Completed';
  owner: string;
}

// --- Mock Data ---
const mockComplianceAreas: ComplianceArea[] = [
  {
    id: 'gdpr',
    name: 'GDPR',
    status: 'Compliant',
    lastUpdated: '2023-10-26',
    owner: 'Legal Team',
    progress: 100,
    issuesCount: 0,
    description: 'General Data Protection Regulation compliance for EU users.',
  },
  {
    id: 'ccpa',
    name: 'CCPA',
    status: 'At-Risk',
    lastUpdated: '2023-10-25',
    owner: 'Privacy Office',
    progress: 85,
    issuesCount: 3,
    description: 'California Consumer Privacy Act compliance for CA residents.',
  },
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    status: 'In-Progress',
    lastUpdated: '2023-10-27',
    owner: 'Security Team',
    progress: 60,
    issuesCount: 7,
    description: 'Service Organization Control 2 Type II audit preparation.',
  },
  {
    id: 'hipaa',
    name: 'HIPAA',
    status: 'Compliant',
    lastUpdated: '2023-10-20',
    owner: 'Healthcare Ops',
    progress: 98,
    issuesCount: 1,
    description: 'Health Insurance Portability and Accountability Act for health data.',
  },
  {
    id: 'pci-dss',
    name: 'PCI DSS',
    status: 'Non-Compliant',
    lastUpdated: '2023-10-24',
    owner: 'Finance & Security',
    progress: 40,
    issuesCount: 12,
    description: 'Payment Card Industry Data Security Standard for cardholder data.',
  },
];

const mockComplianceAlerts: ComplianceAlert[] = [
  {
    id: 'alert-001',
    title: 'Unauthorized Data Access Attempt',
    description: 'An attempt to access sensitive customer data was detected from an unknown IP.',
    severity: 'Critical',
    status: 'Open',
    reportedAt: '2023-10-27T10:30:00Z',
    area: 'Data Security',
    owner: 'Security Team',
  },
  {
    id: 'alert-002',
    title: 'GDPR Data Subject Request Backlog',
    description: 'Over 50 data subject access requests are pending beyond the 30-day limit.',
    severity: 'High',
    status: 'Open',
    reportedAt: '2023-10-26T15:00:00Z',
    area: 'GDPR',
    owner: 'Privacy Office',
  },
  {
    id: 'alert-003',
    title: 'Outdated Security Patch on Production Server',
    description: 'A critical security patch for CVE-2023-XXXX is missing on server "prod-web-01".',
    severity: 'Medium',
    status: 'Acknowledged',
    reportedAt: '2023-10-25T09:00:00Z',
    area: 'SOC 2',
    owner: 'DevOps',
  },
  {
    id: 'alert-004',
    title: 'PCI DSS Requirement 3.4 Non-Compliance',
    description: 'Cardholder data is not being masked consistently in development environments.',
    severity: 'High',
    status: 'Open',
    reportedAt: '2023-10-24T11:45:00Z',
    area: 'PCI DSS',
    owner: 'Security Team',
  },
  {
    id: 'alert-005',
    title: 'CCPA Opt-Out Link Broken',
    description: 'The "Do Not Sell My Personal Information" link on the website is returning a 404 error.',
    severity: 'Critical',
    status: 'Open',
    reportedAt: '2023-10-23T14:00:00Z',
    area: 'CCPA',
    owner: 'Marketing Team',
  },
  {
    id: 'alert-006',
    title: 'Minor Data Retention Policy Violation',
    description: 'Some non-critical logs were retained for 95 days instead of 90 days.',
    severity: 'Low',
    status: 'Resolved',
    reportedAt: '2023-10-22T16:00:00Z',
    area: 'Data Privacy',
    owner: 'IT Operations',
  },
];

const mockRegulatoryDeadlines: RegulatoryDeadline[] = [
  {
    id: 'deadline-001',
    regulation: 'SOC 2 Type II Audit Report',
    description: 'Submission of annual SOC 2 Type II audit report.',
    dueDate: '2023-11-15',
    status: 'Upcoming',
    owner: 'Security Team',
  },
  {
    id: 'deadline-002',
    regulation: 'GDPR Data Protection Impact Assessment (DPIA)',
    description: 'Review and update DPIA for new product feature.',
    dueDate: '2023-12-01',
    status: 'Upcoming',
    owner: 'Legal Team',
  },
  {
    id: 'deadline-003',
    regulation: 'CCPA Annual Review',
    description: 'Annual review of CCPA compliance policies and procedures.',
    dueDate: '2023-10-31',
    status: 'Upcoming',
    owner: 'Privacy Office',
  },
  {
    id: 'deadline-004',
    regulation: 'HIPAA Security Rule Self-Assessment',
    description: 'Completion of annual HIPAA Security Rule self-assessment.',
    dueDate: '2023-09-30',
    status: 'Overdue',
    owner: 'Healthcare Ops',
  },
];

// --- Helper Functions ---
const getStatusColor = (status: ComplianceArea['status'] | ComplianceAlert['status'] | RegulatoryDeadline['status']) => {
  switch (status) {
    case 'Compliant':
    case 'Resolved':
    case 'Completed':
      return 'green';
    case 'At-Risk':
    case 'In-Progress':
    case 'Acknowledged':
    case 'Upcoming':
      return 'orange';
    case 'Non-Compliant':
    case 'Open':
    case 'Overdue':
      return 'red';
    default:
      return 'gray';
  }
};

const getSeverityColor = (severity: ComplianceAlert['severity']) => {
  switch (severity) {
    case 'Critical':
      return 'red';
    case 'High':
      return 'orange';
    case 'Medium':
      return 'yellow';
    case 'Low':
      return 'blue';
    default:
      return 'gray';
  }
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const formatDateTime = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const ComplianceDashboard: React.FC = () => {
  const toast = useToast();
  const [complianceAreas, setComplianceAreas] = useState<ComplianceArea[]>(mockComplianceAreas);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>(mockComplianceAlerts);
  const [regulatoryDeadlines, setRegulatoryDeadlines] = useState<RegulatoryDeadline[]>(mockRegulatoryDeadlines);
  const [loading, setLoading] = useState(false);

  const [alertSearchTerm, setAlertSearchTerm] = useState('');
  const [alertFilterSeverity, setAlertFilterSeverity] = useState('');
  const [alertFilterStatus, setAlertFilterStatus] = useState('');

  const refreshData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setComplianceAreas(mockComplianceAreas);
      setComplianceAlerts(mockComplianceAlerts);
      setRegulatoryDeadlines(mockRegulatoryDeadlines);
      setLoading(false);
      toast({
        title: 'Data Refreshed',
        description: 'Compliance data has been updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }, 1000);
  };

  const overallComplianceStatus = useMemo(() => {
    const nonCompliant = complianceAreas.filter(area => area.status === 'Non-Compliant').length;
    const atRisk = complianceAreas.filter(area => area.status === 'At-Risk').length;
    const inProgress = complianceAreas.filter(area => area.status === 'In-Progress').length;
    const compliant = complianceAreas.filter(area => area.status === 'Compliant').length;

    if (nonCompliant > 0) return { status: 'Non-Compliant', color: 'red' };
    if (atRisk > 0) return { status: 'At-Risk', color: 'orange' };
    if (inProgress > 0) return { status: 'In-Progress', color: 'blue' };
    if (compliant === complianceAreas.length && compliant > 0) return { status: 'Fully Compliant', color: 'green' };
    return { status: 'Unknown', color: 'gray' };
  }, [complianceAreas]);

  const criticalAlertsCount = useMemo(() => {
    return complianceAlerts.filter(alert => alert.severity === 'Critical' && alert.status === 'Open').length;
  }, [complianceAlerts]);

  const overdueDeadlinesCount = useMemo(() => {
    return regulatoryDeadlines.filter(deadline => deadline.status === 'Overdue').length;
  }, [regulatoryDeadlines]);

  const filteredAlerts = useMemo(() => {
    return complianceAlerts.filter(alert => {
      const matchesSearch = alert.title.toLowerCase().includes(alertSearchTerm.toLowerCase()) ||
                            alert.description.toLowerCase().includes(alertSearchTerm.toLowerCase()) ||
                            alert.area.toLowerCase().includes(alertSearchTerm.toLowerCase());
      const matchesSeverity = alertFilterSeverity ? alert.severity === alertFilterSeverity : true;
      const matchesStatus = alertFilterStatus ? alert.status === alertFilterStatus : true;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [complianceAlerts, alertSearchTerm, alertFilterSeverity, alertFilterStatus]);

  const handleAlertAction = (alertId: string, action: 'resolve' | 'acknowledge') => {
    setComplianceAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === alertId
          ? { ...alert, status: action === 'resolve' ? 'Resolved' : 'Acknowledged' }
          : alert
      )
    );
    toast({
      title: `Alert ${action === 'resolve' ? 'Resolved' : 'Acknowledged'}`,
      description: `Alert ${alertId} has been ${action === 'resolve' ? 'resolved' : 'acknowledged'}.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box p={6} minH="100vh" bg="gray.50">
      <Flex align="center" mb={8}>
        <VStack align="flex-start" spacing={1}>
          <Heading as="h1" size="xl" color="gray.800">
            Compliance Dashboard
          </Heading>
          <Text fontSize="md" color="gray.600">
            A central hub for monitoring compliance status, alerts, and regulatory requirements across all integrated apps.
          </Text>
        </VStack>
        <Spacer />
        <Button
          leftIcon={<FiRefreshCw />}
          colorScheme="blue"
          onClick={refreshData}
          isLoading={loading}
          loadingText="Refreshing"
          variant="outline"
        >
          Refresh Data
        </Button>
      </Flex>

      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card p={5} shadow="sm" borderRadius="lg" bg="white">
          <Stat>
            <StatLabel fontSize="sm" color="gray.500">Overall Compliance</StatLabel>
            <HStack align="center">
              <StatNumber fontSize="2xl" color={`${overallComplianceStatus.color}.600`}>
                {overallComplianceStatus.status}
              </StatNumber>
              {overallComplianceStatus.status === 'Fully Compliant' && <FiCheckCircle color="green.500" size="24px" />}
              {overallComplianceStatus.status === 'At-Risk' && <FiAlertCircle color="orange.500" size="24px" />}
              {overallComplianceStatus.status === 'Non-Compliant' && <FiAlertCircle color="red.500" size="24px" />}
            </HStack>
            <StatHelpText>
              <StatArrow type={overallComplianceStatus.status === 'Fully Compliant' ? 'increase' : 'decrease'} />
              {complianceAreas.length} areas monitored
            </StatHelpText>
          </Stat>
        </Card>

        <Card p={5} shadow="sm" borderRadius="lg" bg="white">
          <Stat>
            <StatLabel fontSize="sm" color="gray.500">Critical Open Alerts</StatLabel>
            <HStack align="center">
              <StatNumber fontSize="2xl" color={criticalAlertsCount > 0 ? 'red.600' : 'green.600'}>
                {criticalAlertsCount}
              </StatNumber>
              {criticalAlertsCount > 0 ? <FiAlertCircle color="red.500" size="24px" /> : <FiCheckCircle color="green.500" size="24px" />}
            </HStack>
            <StatHelpText>
              <StatArrow type={criticalAlertsCount > 0 ? 'decrease' : 'increase'} />
              {complianceAlerts.filter(a => a.status === 'Open').length} total open alerts
            </StatHelpText>
          </Stat>
        </Card>

        <Card p={5} shadow="sm" borderRadius="lg" bg="white">
          <Stat>
            <StatLabel fontSize="sm" color="gray.500">Overdue Deadlines</StatLabel>
            <HStack align="center">
              <StatNumber fontSize="2xl" color={overdueDeadlinesCount > 0 ? 'red.600' : 'green.600'}>
                {overdueDeadlinesCount}
              </StatNumber>
              {overdueDeadlinesCount > 0 ? <FiClock color="red.500" size="24px" /> : <FiCheckCircle color="green.500" size="24px" />}
            </HStack>
            <StatHelpText>
              <StatArrow type={overdueDeadlinesCount > 0 ? 'decrease' : 'increase'} />
              {regulatoryDeadlines.filter(d => d.status === 'Upcoming').length} upcoming deadlines
            </StatHelpText>
          </Stat>
        </Card>

        <Card p={5} shadow="sm" borderRadius="lg" bg="white">
          <Stat>
            <StatLabel fontSize="sm" color="gray.500">Compliance Score</StatLabel>
            <HStack align="center">
              <StatNumber fontSize="2xl" color="purple.600">
                {Math.round(complianceAreas.reduce((acc, area) => acc + area.progress, 0) / complianceAreas.length) || 0}%
              </StatNumber>
              <FiActivity color="purple.500" size="24px" />
            </HStack>
            <StatHelpText>
              <StatArrow type="increase" />
              Based on average progress
            </StatHelpText>
          </Stat>
        </Card>
      </SimpleGrid>

      {/* Compliance Areas */}
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4} color="gray.700">
          Compliance Areas
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {complianceAreas.map((area) => (
            <Card key={area.id} shadow="sm" borderRadius="lg" bg="white">
              <CardHeader pb={2}>
                <Flex align="center">
                  <Heading size="md" mr={2}>{area.name}</Heading>
                  <Badge colorScheme={getStatusColor(area.status)}>{area.status}</Badge>
                  <Spacer />
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FiMoreVertical />}
                      variant="ghost"
                      size="sm"
                    />
                    <MenuList>
                      <MenuItem>View Details</MenuItem>
                      <MenuItem>Generate Report</MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <Text fontSize="sm" color="gray.600" mb={2}>{area.description}</Text>
                <HStack fontSize="sm" color="gray.500" mb={2}>
                  <Text>Owner: <Tag size="sm" variant="subtle" colorScheme="cyan">{area.owner}</Tag></Text>
                  <Text>Last Updated: {formatDate(area.lastUpdated)}</Text>
                </HStack>
                <VStack align="flex-start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">Progress: {area.progress}%</Text>
                  <Progress value={area.progress} size="sm" colorScheme={getStatusColor(area.status)} w="100%" />
                  {area.issuesCount > 0 && (
                    <HStack fontSize="sm" color="red.500">
                      <FiAlertCircle />
                      <Text>{area.issuesCount} open issues</Text>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      {/* Compliance Alerts */}
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4} color="gray.700">
          Compliance Alerts
        </Heading>
        <Card shadow="sm" borderRadius="lg" bg="white" p={5}>
          <Flex mb={4} wrap="wrap" gap={4}>
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search alerts..."
                value={alertSearchTerm}
                onChange={(e) => setAlertSearchTerm(e.target.value)}
              />
            </InputGroup>
            <Select
              placeholder="Filter by Severity"
              maxW="200px"
              value={alertFilterSeverity}
              onChange={(e) => setAlertFilterSeverity(e.target.value)}
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
            <Select
              placeholder="Filter by Status"
              maxW="200px"
              value={alertFilterStatus}
              onChange={(e) => setAlertFilterStatus(e.target.value)}
            >
              <option value="Open">Open</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Resolved">Resolved</option>
            </Select>
            {(alertSearchTerm || alertFilterSeverity || alertFilterStatus) && (
              <Button onClick={() => {
                setAlertSearchTerm('');
                setAlertFilterSeverity('');
                setAlertFilterStatus('');
              }} variant="ghost">
                Clear Filters
              </Button>
            )}
          </Flex>

          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Area</Th>
                  <Th>Severity</Th>
                  <Th>Status</Th>
                  <Th>Reported At</Th>
                  <Th>Owner</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredAlerts.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center" py={4}>
                      No alerts found matching your criteria.
                    </Td>
                  </Tr>
                ) : (
                  filteredAlerts.map((alert) => (
                    <Tr key={alert.id}>
                      <Td>
                        <Tooltip label={alert.description} placement="top-start">
                          <Text fontWeight="medium" noOfLines={1}>{alert.title}</Text>
                        </Tooltip>
                      </Td>
                      <Td><Tag size="sm" variant="subtle" colorScheme="purple">{alert.area}</Tag></Td>
                      <Td>
                        <Badge colorScheme={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(alert.status)}>{alert.status}</Badge>
                      </Td>
                      <Td>{formatDateTime(alert.reportedAt)}</Td>
                      <Td><Tag size="sm" variant="subtle" colorScheme="cyan">{alert.owner}</Tag></Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FiMoreVertical />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem onClick={() => toast({ title: 'Viewing details...', status: 'info', duration: 1500 })}>
                              View Details
                            </MenuItem>
                            {alert.status === 'Open' && (
                              <>
                                <MenuItem onClick={() => handleAlertAction(alert.id, 'acknowledge')}>
                                  Acknowledge
                                </MenuItem>
                                <MenuItem onClick={() => handleAlertAction(alert.id, 'resolve')}>
                                  Resolve
                                </MenuItem>
                              </>
                            )}
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      {/* Regulatory Deadlines */}
      <Box>
        <Heading as="h2" size="lg" mb={4} color="gray.700">
          Regulatory Deadlines
        </Heading>
        <Card shadow="sm" borderRadius="lg" bg="white" p={5}>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Regulation</Th>
                  <Th>Description</Th>
                  <Th>Due Date</Th>
                  <Th>Status</Th>
                  <Th>Owner</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {regulatoryDeadlines.map((deadline) => (
                  <Tr key={deadline.id}>
                    <Td fontWeight="medium">{deadline.regulation}</Td>
                    <Td>
                      <Tooltip label={deadline.description} placement="top-start">
                        <Text noOfLines={1}>{deadline.description}</Text>
                      </Tooltip>
                    </Td>
                    <Td>
                      <HStack>
                        <FiCalendar />
                        <Text>{formatDate(deadline.dueDate)}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(deadline.status)}>{deadline.status}</Badge>
                    </Td>
                    <Td><Tag size="sm" variant="subtle" colorScheme="cyan">{deadline.owner}</Tag></Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem>View Details</MenuItem>
                          <MenuItem>Mark as Completed</MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
};

export default ComplianceDashboard;