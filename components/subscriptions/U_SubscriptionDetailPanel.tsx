import React from 'react';
import { Subscription } from '@/types/subscription'; // Assuming you have a Subscription type defined

interface SubscriptionDetailPanelProps {
  subscription: Subscription;
}

const U_SubscriptionDetailPanel: React.FC<SubscriptionDetailPanelProps> = ({ subscription }) => {
  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        {subscription.name}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase mb-1">
            Plan Name
          </p>
          <p className="text-lg text-gray-700">
            {subscription.planName}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 uppercase mb-1">
            Price
          </p>
          <p className="text-lg text-gray-700">
            ${subscription.price.toFixed(2)}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 uppercase mb-1">
            Billing Cycle
          </p>
          <p className="text-lg text-gray-700">
            {subscription.billingCycle}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 uppercase mb-1">
            Status
          </p>
          <p className={`text-lg font-semibold ${subscription.status === 'active' ? 'text-green-600' : subscription.status === 'canceled' ? 'text-red-600' : 'text-yellow-600'}`}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 uppercase mb-1">
            Start Date
          </p>
          <p className="text-lg text-gray-700">
            {new Date(subscription.startDate).toLocaleDateString()}
          </p>
        </div>

        {subscription.endDate && (
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase mb-1">
              End Date
            </p>
            <p className="text-lg text-gray-700">
              {new Date(subscription.endDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {subscription.nextBillingDate && (
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase mb-1">
              Next Billing Date
            </p>
            <p className="text-lg text-gray-700">
              {new Date(subscription.nextBillingDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {subscription.description && (
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-500 uppercase mb-2">
            Description
          </p>
          <p className="text-gray-700 leading-relaxed">
            {subscription.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default U_SubscriptionDetailPanel;