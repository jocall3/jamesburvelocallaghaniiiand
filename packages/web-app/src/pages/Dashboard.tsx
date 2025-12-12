import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  Spinner,
  useColorModeValue,
  Flex,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
  useToast,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Divider,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, ExternalLinkIcon, RepeatIcon, QuestionOutlineIcon } from '@chakra-ui/icons';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newItem, setNewItem] = useState('');
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  useEffect(() => {
    // Simulate fetching data from an API
    setTimeout(() => {
      const mockData = {
        totalUsers: 1234,
        activeUsers: 567,
        dailyTransactions: 890,
        averageTransactionValue: 45.67,
        newItemCount: 5,
      };

      const mockChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Users',
            data: [65, 59, 80, 81, 56, 55],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      };

      setData(mockData);
      setChartData(mockChartData);
      setLoading(false);
    }, 1500);
  }, []);

  const handleAddItem = () => {
    if (newItem.trim() !== '') {
      toast({
        title: 'Item added.',
        description: `Added: ${newItem}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNewItem('');
      onClose();
    } else {
      toast({
        title: 'Error.',
        description: 'Item cannot be empty.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const refreshData = () => {
    setLoading(true);
    // Simulate refreshing data
    setTimeout(() => {
      const newMockData = {
        totalUsers: Math.floor(Math.random() * 2000),
        activeUsers: Math.floor(Math.random() * 1000),
        dailyTransactions: Math.floor(Math.random() * 1500),
        averageTransactionValue: parseFloat((Math.random() * 60).toFixed(2)),
        newItemCount: Math.floor(Math.random() * 10),
      };
      setData(newMockData);
      setLoading(false);
      toast({
        title: 'Data Refreshed.',
        description: 'Dashboard data has been updated.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }, 1000);
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Growth',
      },
    },
  };

  return (
    <Box p={5}>
      <Flex justify="space-between" align="center" mb={5}>
        <Heading as="h1" size="xl" color={textColor}>
          Dashboard
        </Heading>
        <Flex>
          <Tooltip label="Refresh Data">
            <IconButton
              aria-label="Refresh Data"
              icon={<RepeatIcon />}
              onClick={refreshData}
              isLoading={loading}
              mr={2}
            />
          </Tooltip>
          <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={onOpen}>
            Add Item
          </Button>
        </Flex>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <>
          <SimpleGrid columns={{ sm: 1, md: 2, lg: 4 }} spacing={5}>
            <Card bg={cardBg} color={textColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Users</StatLabel>
                  <StatNumber>{data.totalUsers}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    23.36% since last month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} color={textColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Active Users</StatLabel>
                  <StatNumber>{data.activeUsers}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    9.05% since last month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} color={textColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Daily Transactions</StatLabel>
                  <StatNumber>{data.dailyTransactions}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    12.18% since last month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} color={textColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Average Transaction Value</StatLabel>
                  <StatNumber>${data.averageTransactionValue}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    5.24% since last month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          <Divider my={5} />

          <Grid templateColumns="repeat(1, 1fr)" gap={5}>
            <GridItem>
              <Card bg={cardBg} color={textColor}>
                <CardHeader>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">User Growth Chart</Heading>
                    <Tooltip label="Learn More">
                      <IconButton
                        aria-label="Learn More"
                        icon={<QuestionOutlineIcon />}
                        size="sm"
                      />
                    </Tooltip>
                  </Flex>
                </CardHeader>
                <CardBody>
                  {chartData && <Line options={chartOptions} data={chartData} />}
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Item</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Item name"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
            />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAddItem}>
              Add
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Dashboard;