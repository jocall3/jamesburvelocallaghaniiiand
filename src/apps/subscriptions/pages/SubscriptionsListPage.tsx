import React, { useState, useEffect, useMemo } from 'react';
// Assume these are available from Stripe UI Extension SDK
// In a real Stripe App, you would import these directly from the SDK.
// For this example, we're simulating their usage.
import {
  Box,
  Text,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Select,
  Button,
  Spinner,
  Stack,
  Card,
  Badge,
} from '@stripe/ui-extension-sdk/components'; // Hypothetical import path for Stripe UI components

// --- Mock Data and Types (would typically come from an API/backend in a real app) ---
interface Subscription {
  id: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'active' | 'canceled' | 'pending' | 'past_due';
  startDate: string;
  endDate?: string; // For canceled subscriptions
  nextBillingDate: string;
}

const generateMockSubscriptions = (count: number): Subscription[] => {
  const statuses: Subscription['status'][] = ['active', 'canceled', 'pending', 'past_due'];
  const plans = ['Basic Monthly', 'Pro Annual', 'Enterprise Custom', 'Starter Pack'];
  const customers = [
    { name: 'Alice Smith', email: 'alice@example.com' },
    { name: 'Bob Johnson', email: 'bob@example.com' },
    { name: 'Charlie Brown', email: 'charlie@example.com' },
    { name: 'Diana Prince', email: 'diana@example.com' },
    { name: 'Eve Adams', email: 'eve@example.com' },
    { name: 'Frank White', email: 'frank@example.com' },
    { name: 'Grace Lee', email: 'grace@example.com' },
    { name: 'Henry King', email: 'henry@example.com' },
    { name: 'Ivy Chen', email: 'ivy@example.com' },
    { name: 'Jack Green', email: 'jack@example.com' },
  ];

  const subscriptions: Subscription[] = [];
  for (let i = 1; i <= count; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const planName = plans[Math.floor(Math.random() * plans.length)];
    const amount = Math.floor(Math.random() * 100) + 10 + (Math.random() < 0.5 ? 0 : 0.99); // $10.00 - $109.99
    const startDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextBillingDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    let endDate: string | undefined = undefined;
    if (status === 'canceled') {
      endDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    subscriptions.push({
      id: `sub_${i.toString().padStart(4, '0')}`,
      customerName: customer.name,
      customerEmail: customer.email,
      planName,
      amount: parseFloat(amount.toFixed(2)),
      currency: 'USD',
      status: status,
      startDate,
      endDate,
      nextBillingDate,
    });
  }
  return subscriptions;
};
// --- End Mock Data ---

const SubscriptionsListPage: React.FC = () => {
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Subscription['status']>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Simulate data fetching
  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real Stripe App, this would be an API call to your backend
        // that interacts with the Stripe API to fetch subscriptions.
        // Example: const response = await fetch('/api/subscriptions');
        // const data = await response.json();
        await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay
        const data = generateMockSubscriptions(50); // Generate 50 mock subscriptions
        setAllSubscriptions(data);
      } catch (err) {
        setError('Failed to load subscriptions. Please try again.');
        console.error('Error fetching subscriptions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    let filtered = allSubscriptions;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus);
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        sub =>
          sub.customerName.toLowerCase().includes(lowerCaseSearchTerm) ||
          sub.customerEmail.toLowerCase().includes(lowerCaseSearchTerm) ||
          sub.planName.toLowerCase().includes(lowerCaseSearchTerm) ||
          sub.id.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    return filtered;
  }, [allSubscriptions, filterStatus, searchTerm]);

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const paginatedSubscriptions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSubscriptions.slice(startIndex, endIndex);
  }, [filteredSubscriptions, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusBadgeColor = (status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'canceled':
        return 'red';
      case 'pending':
        return 'yellow';
      case 'past_due':
        return 'orange';
      default:
        return 'gray'; // Fallback
    }
  };

  const formatStatusText = (status: Subscription['status']) => {
    return status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Box padding="large">
      <Text type="title" size="large" css={{ marginBottom: '24px' }}>
        Subscriptions
      </Text>

      <Card css={{ marginBottom: '24px' }}>
        <Stack direction="horizontal" spacing="medium" alignment="center">
          <Input
            label="Search"
            placeholder="Search by customer, plan, or ID"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
            css={{ flexGrow: 1 }}
          />
          <Select
            label="Status"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as 'all' | Subscription['status']);
              setCurrentPage(1); // Reset page on filter change
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="canceled">Canceled</option>
            <option value="pending">Pending</option>
            <option value="past_due">Past Due</option>
          </Select>
        </Stack>
      </Card>

      {loading ? (
        <Box css={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Spinner size="large" />
          <Text css={{ marginLeft: '16px', color: 'var(--text-color-secondary)' }}>Loading subscriptions...</Text>
        </Box>
      ) : error ? (
        <Box css={{ textAlign: 'center', padding: '24px' }}>
          <Text type="danger">{error}</Text>
          <Button type="primary" onClick={() => window.location.reload()} css={{ marginTop: '16px' }}>
            Retry
          </Button>
        </Box>
      ) : paginatedSubscriptions.length === 0 && (searchTerm || filterStatus !== 'all') ? (
        <Box css={{ textAlign: 'center', padding: '24px' }}>
          <Text type="secondary">No subscriptions found matching your current search and filter criteria.</Text>
          <Button type="secondary" onClick={() => { setSearchTerm(''); setFilterStatus('all'); setCurrentPage(1); }} css={{ marginTop: '16px' }}>
            Clear Filters
          </Button>
        </Box>
      ) : paginatedSubscriptions.length === 0 ? (
        <Box css={{ textAlign: 'center', padding: '24px' }}>
          <Text type="secondary">No subscriptions available yet.</Text>
          <Text type="caption" css={{ marginTop: '8px', color: 'var(--text-color-secondary)' }}>
            Start by creating your first subscription.
          </Text>
          <Button type="primary" css={{ marginTop: '16px' }}>
            Create New Subscription
          </Button>
        </Box>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Next Billing</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSubscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.id}</TableCell>
                  <TableCell>
                    <Text type="body">{sub.customerName}</Text>
                    <Text type="caption" css={{ color: 'var(--text-color-secondary)' }}>{sub.customerEmail}</Text>
                  </TableCell>
                  <TableCell>{sub.planName}</TableCell>
                  <TableCell>{sub.amount.toFixed(2)} {sub.currency}</TableCell>
                  <TableCell>
                    <Badge color={getStatusBadgeColor(sub.status)}>
                      {formatStatusText(sub.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{sub.startDate}</TableCell>
                  <TableCell>{sub.nextBillingDate}</TableCell>
                  <TableCell>
                    <Stack direction="horizontal" spacing="extra-small">
                      <Button type="secondary" size="small" onClick={() => console.log('View subscription:', sub.id)}>
                        View
                      </Button>
                      {sub.status === 'active' && (
                        <Button type="destructive" size="small" onClick={() => console.log('Cancel subscription:', sub.id)}>
                          Cancel
                        </Button>
                      )}
                      {sub.status === 'past_due' && (
                        <Button type="primary" size="small" onClick={() => console.log('Collect payment for:', sub.id)}>
                          Collect
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Stack direction="horizontal" alignment="center" justify="space-between" css={{ marginTop: '24px', padding: '16px' }}>
            <Text type="caption">
              Showing {paginatedSubscriptions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              -
              {Math.min(currentPage * itemsPerPage, filteredSubscriptions.length)} of {filteredSubscriptions.length} subscriptions
            </Text>
            <Stack direction="horizontal" spacing="small">
              <Button
                type="secondary"
                size="small"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Text type="body" css={{ alignSelf: 'center' }}>
                Page {currentPage} of {totalPages || 1}
              </Text>
              <Button
                type="secondary"
                size="small"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </Card>
      )}
    </Box>
  );
};

export default SubscriptionsListPage;