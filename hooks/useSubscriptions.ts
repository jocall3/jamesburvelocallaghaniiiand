import { useState, useEffect } from 'react';

interface Subscription {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  isActive: boolean;
  startDate: Date;
  endDate: Date | null;
}

interface UseSubscriptionsResult {
  subscriptions: Subscription[];
  loading: boolean;
  error: Error | null;
  fetchSubscriptions: () => Promise<void>;
}

const useSubscriptions = (): UseSubscriptionsResult => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real application, this would be an API call to fetch subscription data.
      // For demonstration purposes, we'll simulate fetching data.
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      const mockSubscriptions: Subscription[] = [
        {
          id: 'sub_123',
          name: 'Pro Plan',
          price: 9.99,
          billingCycle: 'monthly',
          isActive: true,
          startDate: new Date('2023-01-15'),
          endDate: null,
        },
        {
          id: 'sub_456',
          name: 'Premium Yearly',
          price: 99.99,
          billingCycle: 'yearly',
          isActive: false,
          startDate: new Date('2022-07-01'),
          endDate: new Date('2023-06-30'),
        },
        {
          id: 'sub_789',
          name: 'Basic Tier',
          price: 4.99,
          billingCycle: 'monthly',
          isActive: true,
          startDate: new Date('2023-03-10'),
          endDate: null,
        },
      ];

      setSubscriptions(mockSubscriptions);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('An unknown error occurred while fetching subscriptions.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []); // Fetch subscriptions when the component mounts

  return {
    subscriptions,
    loading,
    error,
    fetchSubscriptions,
  };
};

export default useSubscriptions;