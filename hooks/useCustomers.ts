import { useState, useEffect } from 'react';

interface Customer {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: 'active' | 'canceled' | 'pending';
  createdAt: string;
  updatedAt: string;
}

interface UseCustomersResult {
  customers: Customer[];
  loading: boolean;
  error: Error | null;
  fetchCustomers: () => void;
}

const useCustomers = (): UseCustomersResult => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace with your actual API endpoint for fetching customers
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Customer[] = await response.json();
      setCustomers(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('An unknown error occurred while fetching customers.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
  };
};

export default useCustomers;