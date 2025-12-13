import React from 'react';

const T_SubscriptionListEmpty: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <p className="text-gray-500">No subscriptions found.</p>
      <p className="text-sm text-gray-400 mt-2">
        Start by adding your first subscription to see it listed here.
      </p>
    </div>
  );
};

export default T_SubscriptionListEmpty;