import React from 'react';

interface Q_SubscriptionListSubHeaderProps {
  title: string;
  count: number;
}

const Q_SubscriptionListSubHeader: React.FC<Q_SubscriptionListSubHeaderProps> = ({ title, count }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      <span className="text-sm font-medium text-gray-500">{count} subscriptions</span>
    </div>
  );
};

export default Q_SubscriptionListSubHeader;