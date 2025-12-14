import React from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock Data
const mockOverallMetrics = {
  totalEmployees: 1250,
  turnoverRate: 0.08, // 8%
  avgTenureYears: 4.2,
  openPositions: 75,
};

const mockHeadcountProjection = [
  { month: 'Jan', actual: 1200, projected: 1200 },
  { month: 'Feb', actual: 1210, projected: 1210 },
  { month: 'Mar', actual: 1225, projected: 1225 },
  { month: 'Apr', actual: 1230, projected: 1235 },
  { month: 'May', actual: 1240, projected: 1245 },
  { month: 'Jun', actual: 1250, projected: 1255 },
  { month: 'Jul', actual: null, projected: 1265 },
  { month: 'Aug', actual: null, projected: 1270 },
  { month: 'Sep', actual: null, projected: 1280 },
  { month: 'Oct', actual: null, projected: 1290 },
  { month: 'Nov', actual: null, projected: 1300 },
  { month: 'Dec', actual: null, projected: 1310 },
];

const mockSkillGapAnalysis = [
  { skill: 'AI/ML Engineering', current: 60, needed: 100 },
  { skill: 'Cloud Architecture', current: 80, needed: 95 },
  { skill: 'Cybersecurity', current: 70, needed: 85 },
  { skill: 'Data Science', current: 55, needed: 70 },
  { skill: 'Product Management', current: 90, needed: 90 },
];

const mockRecruitmentFunnel = [
  { stage: 'Applicants', count: 1500 },
  { stage: 'Screened', count: 750 },
  { stage: 'Interviews', count: 300 },
  { stage: 'Offers', count: 100 },
  { stage: 'Hired', count: 75 },
];

const mockPerformanceDistribution = [
  { name: 'Exceeds Expectations', value: 200 },
  { name: 'Meets Expectations', value: 800 },
  { name: 'Needs Improvement', value: 150 },
  { name: 'Underperforms', value: 100 },
];
const PERFORMANCE_COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#F44336'];

const mockEngagementScore = [
  { category: 'Highly Engaged', value: 40 },
  { category: 'Engaged', value: 35 },
  { category: 'Neutral', value: 15 },
  { category: 'Disengaged', value: 10 },
];
const ENGAGEMENT_COLORS = ['#4CAF50', '#8BC34A', '#FFEB3B', '#FF9800'];

const mockDiversityMetrics = [
  { name: 'Female', value: 45 },
  { name: 'Male', value: 50 },
  { name: 'Non-binary', value: 5 },
];
const DIVERSITY_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1'];

const HRAnalyticsDashboard: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box p={6} minH="100vh" bg={useColorModeValue('gray.50', 'gray.800')}>
      <Heading as="h1" size="xl" mb={6} color={textColor}>
        HR Analytics Dashboard
      </Heading>

      {/* Overall HR Metrics */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardBody>
            <Stat>
              <StatLabel>Total Employees</StatLabel>
              <StatNumber fontSize="2xl">{mockOverallMetrics.totalEmployees}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                2.5% since last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardBody>
            <Stat>
              <StatLabel>Turnover Rate</StatLabel>
              <StatNumber fontSize="2xl">{(mockOverallMetrics.turnoverRate * 100).toFixed(1)}%</StatNumber>
              <StatHelpText>
                <StatArrow type="decrease" />
                0.5% since last quarter
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardBody>
            <Stat>
              <StatLabel>Average Tenure</StatLabel>
              <StatNumber fontSize="2xl">{mockOverallMetrics.avgTenureYears.toFixed(1)} years</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                0.1 years YoY
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardBody>
            <Stat>
              <StatLabel>Open Positions</StatLabel>
              <StatNumber fontSize="2xl">{mockOverallMetrics.openPositions}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                10 new this week
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Workforce Planning */}
      <Heading as="h2" size="lg" mb={4} color={textColor}>
        Workforce Planning
      </Heading>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardHeader>
            <Heading size="md" color={textColor}>Headcount Projection</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockHeadcountProjection}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis dataKey="month" stroke={textColor} />
                <YAxis stroke={textColor} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: useColorModeValue('white', 'gray.700'),
                    borderColor: borderColor,
                  }}
                  itemStyle={{ color: textColor }}
                />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#8884d8" name="Actual Headcount" strokeWidth={2} />
                <Line type="monotone" dataKey="projected" stroke="#82ca9d" name="Projected Headcount" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardHeader>
            <Heading size="md" color={textColor}>Critical Skill Gap Analysis</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockSkillGapAnalysis} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis type="number" stroke={textColor} />
                <YAxis type="category" dataKey="skill" stroke={textColor} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: useColorModeValue('white', 'gray.700'),
                    borderColor: borderColor,
                  }}
                  itemStyle={{ color: textColor }}
                />
                <Legend />
                <Bar dataKey="current" fill="#8884d8" name="Current Employees" />
                <Bar dataKey="needed" fill="#82ca9d" name="Needed Employees" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Talent Metrics */}
      <Heading as="h2" size="lg" mb={4} color={textColor}>
        Talent Metrics
      </Heading>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardHeader>
            <Heading size="md" color={textColor}>Recruitment Funnel</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockRecruitmentFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis type="number" stroke={textColor} />
                <YAxis type="category" dataKey="stage" stroke={textColor} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: useColorModeValue('white', 'gray.700'),
                    borderColor: borderColor,
                  }}
                  itemStyle={{ color: textColor }}
                />
                <Bar dataKey="count" fill="#FFC107" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardHeader>
            <Heading size="md" color={textColor}>Performance Distribution</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockPerformanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {mockPerformanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PERFORMANCE_COLORS[index % PERFORMANCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: useColorModeValue('white', 'gray.700'),
                    borderColor: borderColor,
                  }}
                  itemStyle={{ color: textColor }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Organizational Health */}
      <Heading as="h2" size="lg" mb={4} color={textColor}>
        Organizational Health
      </Heading>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardHeader>
            <Heading size="md" color={textColor}>Employee Engagement Score</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockEngagementScore}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                >
                  {mockEngagementScore.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ENGAGEMENT_COLORS[index % ENGAGEMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: useColorModeValue('white', 'gray.700'),
                    borderColor: borderColor,
                  }}
                  itemStyle={{ color: textColor }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="sm">
          <CardHeader>
            <Heading size="md" color={textColor}>Diversity Metrics (Gender)</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockDiversityMetrics}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {mockDiversityMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DIVERSITY_COLORS[index % DIVERSITY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: useColorModeValue('white', 'gray.700'),
                    borderColor: borderColor,
                  }}
                  itemStyle={{ color: textColor }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default HRAnalyticsDashboard;