import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Define a type for a Stripe Customer (simplified for this example)
interface StripeCustomer {
  id: string;
  name: string;
  email: string;
  description?: string;
  created: number; // Unix timestamp
  balance: number; // In cents
  currency: string;
  livemode: boolean;
  metadata: { [key: string]: string };
}

// Mock API utility to simulate fetching Stripe customers
// In a real Stripe App, this would interact with your backend
// which in turn uses the Stripe API or the Stripe App SDK.
const mockFetchCustomers = async (
  searchTerm: string = '',
  page: number = 1,
  limit: number = 10
): Promise<{ customers: StripeCustomer[]; totalCount: number }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allCustomers: StripeCustomer[] = Array.from({ length: 100 }).map((_, i) => ({
        id: `cus_${String(i + 1).padStart(3, '0')}`,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        description: i % 3 === 0 ? `VIP Client ${i + 1}` : undefined,
        created: Date.now() - (100 - i) * 86400000, // Older customers first
        balance: Math.floor(Math.random() * 100000) - 50000, // -500 to 500 USD
        currency: 'usd',
        livemode: true,
        metadata: {
          source: i % 2 === 0 ? 'website' : 'referral',
          tier: i < 10 ? 'gold' : i < 30 ? 'silver' : 'bronze',
        },
      }));

      const filteredCustomers = allCustomers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.id.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const totalCount = filteredCustomers.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

      resolve({ customers: paginatedCustomers, totalCount });
    }, 700); // Simulate network delay
  });
};

const ITEMS_PER_PAGE = 10;

const CustomersListPage: React.FC = () => {
  const [customers, setCustomers] = useState<StripeCustomer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);

  const totalPages = useMemo(() => Math.ceil(totalCustomers / ITEMS_PER_PAGE), [totalCustomers]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { customers: fetchedCustomers, totalCount } = await mockFetchCustomers(
        searchTerm,
        currentPage,
        ITEMS_PER_PAGE
      );
      setCustomers(fetchedCustomers);
      setTotalCustomers(totalCount);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatBalance = (balance: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(balance / 100); // Convert cents to dollars
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Customer Management</h1>

      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="Search customers by name, email, or ID..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={styles.searchInput}
        />
      </div>

      {loading && <div style={styles.loading}>Loading customers...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {!loading && !error && customers.length === 0 && (
        <div style={styles.noResults}>No customers found matching your search.</div>
      )}

      {!loading && !error && customers.length > 0 && (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Customer ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Balance</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Description</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} style={styles.tr}>
                  <td style={styles.td}>{customer.id}</td>
                  <td style={styles.td}>{customer.name}</td>
                  <td style={styles.td}>{customer.email}</td>
                  <td style={styles.td}>
                    {formatBalance(customer.balance, customer.currency)}
                  </td>
                  <td style={styles.td}>{formatTimestamp(customer.created)}</td>
                  <td style={styles.td}>{customer.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.pagination}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              style={styles.paginationButton}
            >
              Previous
            </button>
            <span style={styles.pageInfo}>
              Page {currentPage} of {totalPages} ({totalCustomers} customers)
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              style={styles.paginationButton}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Basic inline styles for a clean, Stripe-like appearance
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    fontFamily: '"Stripe Sans", Helvetica, Arial, sans-serif',
    backgroundColor: '#f6f9fc',
    minHeight: '100vh',
  },
  header: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#32325d',
    marginBottom: '24px',
  },
  searchBar: {
    marginBottom: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid #e0e6ed',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(50, 50, 93, 0.1), 0 1px 0 rgba(0, 0, 0, 0.02)',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#6772e5',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#e03e2f',
    backgroundColor: '#ffe0e0',
    borderRadius: '4px',
  },
  noResults: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#525f7f',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(50, 50, 93, 0.1), 0 1px 0 rgba(0, 0, 0, 0.02)',
    marginBottom: '20px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    borderBottom: '1px solid #e0e6ed',
    color: '#525f7f',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#fcfdff',
  },
  td: {
    textAlign: 'left',
    padding: '12px 16px',
    borderBottom: '1px solid #e0e6ed',
    color: '#32325d',
    fontSize: '14px',
  },
  tr: {
    transition: 'background-color 0.1s ease',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 0',
  },
  paginationButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#6772e5',
    backgroundColor: '#ffffff',
    border: '1px solid #e0e6ed',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
  },
  pageInfo: {
    fontSize: '14px',
    color: '#525f7f',
  },
};

export default CustomersListPage;