import { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthProvider'; // Adjust path as needed
import { getSubscriptionStatus } from '../api/subscriptionService'; // Adjust path as needed

interface SubscriptionStatus {
  isSubscribed: boolean;
  subscriptionExpiry?: string; // ISO date string
  error?: string;
  isLoading: boolean;
}

const useAppSubscription = (appId: string): SubscriptionStatus => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    isLoading: true,
  });

  useEffect(() => {
    if (!user) {
      setSubscriptionStatus({ isSubscribed: false, isLoading: false, error: 'No user logged in' });
      return;
    }

    const fetchSubscription = async () => {
      try {
        const data = await getSubscriptionStatus(user.uid, appId);
        setSubscriptionStatus({
          isSubscribed: data.isSubscribed,
          subscriptionExpiry: data.subscriptionExpiry,
          isLoading: false,
        });
      } catch (error: any) {
        console.error('Error fetching subscription status:', error);
        setSubscriptionStatus({
          isSubscribed: false,
          isLoading: false,
          error: error.message || 'Failed to fetch subscription status',
        });
      }
    };

    fetchSubscription();
  }, [user, appId]);

  return subscriptionStatus;
};

export default useAppSubscription;