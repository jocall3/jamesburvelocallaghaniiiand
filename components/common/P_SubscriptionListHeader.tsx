import React from 'react';

const P_SubscriptionListHeader: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Subscriptions</h1>
        {/* Placeholder for potential actions like "Add Subscription" button */}
        <div>
          {/* <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Add Subscription
          </button> */}
        </div>
      </div>
    </header>
  );
};

export default P_SubscriptionListHeader;