import React from 'react';

interface ManageSubscriptionButtonProps {
  appId: string;
}

const ManageSubscriptionButton: React.FC<ManageSubscriptionButtonProps> = ({ appId }) => {
  const manageSubscriptionUrl = `/api/manage-subscription?appId=${appId}`;

  return (
    <a href={manageSubscriptionUrl} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
      Manage Subscription
    </a>
  );
};

export default ManageSubscriptionButton;