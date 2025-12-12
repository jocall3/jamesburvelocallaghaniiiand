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

// --- Data Interfaces ---
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
  area: string;
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

// --- Internal Generative-Data Functions ---
const randomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start: Date, end: Date): Date => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generateComplianceAreas = (count: number): ComplianceArea[] => {
  const names = ['GDPR', 'CCPA', 'SOC 2 Type II', 'HIPAA', 'PCI DSS', 'SOX', 'ISO 27001', 'AML/KYC'];
  const owners = ['Legal Team', 'Privacy Office', 'Security Team', 'Healthcare Ops', 'Finance & Security', 'Internal Audit'];
  const statuses: ComplianceArea['status'][] = ['Compliant', 'Non-Compliant', 'At-Risk', 'In-Progress'];
  const descriptions = {
    'GDPR': 'General Data Protection Regulation compliance for EU users.',
    'CCPA': 'California Consumer Privacy Act compliance for CA residents.',
    'SOC 2 Type II': 'Service Organization Control 2 Type II audit preparation.',
    'HIPAA': 'Health Insurance Portability and Accountability Act for health data.',
    'PCI DSS': 'Payment Card Industry Data Security Standard for cardholder data.',
    'SOX': 'Sarbanes-Oxley Act for financial reporting controls.',
    'ISO 27001': 'Information security management system standard.',
    'AML/KYC': 'Anti-Money Laundering and Know Your Customer regulations.',
  };

  return Array.from({ length: count }, (_, i) => {
    const name = randomElement(names);
    const status = randomElement(statuses);
    const progress = status === 'Compliant' ? 100 : (status === 'Non-Compliant' ? randomInt(0, 50) : randomInt(51, 99));
    const issuesCount = status === 'Compliant' ? 0 : (status === 'Non-Compliant' ? randomInt(5, 20) : randomInt(1, 5));
    return {
      id: `${name.toLowerCase().replace(/ /g, '-')}-${i}`,
      name,
      status,
      lastUpdated: randomDate(new Date(2023, 9, 1), new Date()).toISOString().split('T')[0],
      owner: randomElement(owners),
      progress,
      issuesCount,
      description: descriptions[name] || 'Standard compliance area monitoring.',
    };
  });
};

const generateComplianceAlerts = (count: number): ComplianceAlert[] => {
  const titles = [
    'Unauthorized Data Access Attempt', 'GDPR Data Subject Request Backlog', 'Outdated Security Patch',
    'PCI DSS Requirement Non-Compliance', 'CCPA Opt-Out Link Broken', 'Minor Data Retention Policy Violation',
    'Suspicious Login Activity', 'Firewall Misconfiguration Detected', 'Missing Audit Logs'
  ];
  const severities: ComplianceAlert['severity'][] = ['Critical', 'High', 'Medium', 'Low'];
  const statuses: ComplianceAlert['status'][] = ['Open', 'Resolved', 'Acknowledged'];
  const areas = ['Data Security', 'GDPR', 'SOC 2', 'PCI DSS', 'CCPA', 'Data Privacy', 'Infrastructure'];
  const owners = ['Security Team', 'Privacy Office', 'DevOps', 'Marketing Team', 'IT Operations'];

  return Array.from({ length: count }, (_, i) => ({
    id: `alert-${String(i).padStart(3, '0')}`,
    title: randomElement(titles),
    description: 'A dynamically generated description of the alert, providing context and potential impact.',
    severity: randomElement(severities),
    status: randomElement(statuses),
    reportedAt: randomDate(new Date(2023, 9, 1), new Date()).toISOString(),
    area: randomElement(areas),
    owner: randomElement(owners),
  }));
};

const generateRegulatoryDeadlines = (count: number): RegulatoryDeadline[] => {
  const regulations = [
    'SOC 2 Type II Audit Report', 'GDPR DPIA Review', 'CCPA Annual Review',
    'HIPAA Security Self-Assessment', 'Quarterly PCI DSS Scan', 'Annual SOX Attestation'
  ];
  const statuses: RegulatoryDeadline['status'][] = ['Upcoming', 'Overdue', 'Completed'];
  const owners = ['Security Team', 'Legal Team', 'Privacy Office', 'Healthcare Ops', 'Internal Audit'];

  return Array.from({ length: count }, (_, i) => {
    const status = randomElement(statuses);
    let dueDate;
    if (status === 'Upcoming') dueDate = randomDate(new Date(), new Date(new Date().getFullYear() + 1, 11, 31));
    else if (status === 'Overdue') dueDate = randomDate(new Date(2023, 0, 1), new Date());
    else dueDate = randomDate(new Date(2023, 0, 1), new Date());

    return {
      id: `deadline-${String(i).padStart(3, '0')}`,
      regulation: randomElement(regulations),
      description: 'Dynamically generated description for the regulatory deadline submission or review.',
      dueDate: dueDate.toISOString().split('T')[0],
      status,
      owner: randomElement(owners),
    };
  });
};

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
  const [complianceAreas, setComplianceAreas] = useState<ComplianceArea[]>(() => generateComplianceAreas(6));
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>(() => generateComplianceAlerts(15));
  const [regulatoryDeadlines, setRegulatoryDeadlines] = useState<RegulatoryDeadline[]>(() => generateRegulatoryDeadlines(5));
  const [loading, setLoading] = useState(false);

  const [alertSearchTerm, setAlertSearchTerm] = useState('');
  const [alertFilterSeverity, setAlertFilterSeverity] = useState('');
  const [alertFilterStatus, setAlertFilterStatus] = useState('');

  const refreshData = () => {
    setLoading(true);
    // Simulate API call with generative data
    setTimeout(() => {
      setComplianceAreas(generateComplianceAreas(6));
      setComplianceAlerts(generateComplianceAlerts(15));
      setRegulatoryDeadlines(generateRegulatoryDeadlines(5));
      setLoading(false);
      toast({
        title: 'Data Refreshed',
        description: 'Compliance data has been regenerated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }, 1000);
  };

  const overallComplianceStatus = useMemo(() => {
    if (complianceAreas.length === 0) return { status: 'Unknown', color: 'gray' };
    const nonCompliant = complianceAreas.filter(area => area.status === 'Non-Compliant').length;
    const atRisk = complianceAreas.filter(area => area.status === 'At-Risk').length;
    const inProgress = complianceAreas.filter(area => area.status === 'In-Progress').length;
    const compliant = complianceAreas.filter(area => area.status === 'Compliant').length;

    if (nonCompliant > 0) return { status: 'Non-Compliant', color: 'red' };
    if (atRisk > 0) return { status: 'At-Risk', color: 'orange' };
    if (inProgress > 0) return { status: 'In-Progress', color: 'blue' };
    if (compliant === complianceAreas.length) return { status: 'Fully Compliant', color: 'green' };
    return { status: 'Partially Compliant', color: 'yellow' };
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
            Citibankdemobusinessinc Compliance Dashboard
          </Heading>
          <Text fontSize="md" color="gray.600">
            Centralized compliance monitoring for the Citibankdemobusinessinc ecosystem.
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