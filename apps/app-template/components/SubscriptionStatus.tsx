import React from 'react';

interface SubscriptionStatusProps {
  isSubscribed: boolean;
  subscriptionExpiry?: string; // Optional expiry date
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ isSubscribed, subscriptionExpiry }) => {
  return (
    <div>
      {isSubscribed ? (
        <>
          <p>Subscription Status: Active</p>
          {subscriptionExpiry && <p>Expires: {subscriptionExpiry}</p>}
        </>
      ) : (
        <p>Subscription Status: Inactive</p>
      )}
    </div>
  );
};

export default SubscriptionStatus;