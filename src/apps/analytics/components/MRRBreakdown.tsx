import React from 'react';

interface MRRBreakdownProps {
  /**
   * Monthly Recurring Revenue from new subscriptions.
   */
  newMrr: number;
  /**
   * Monthly Recurring Revenue from existing customers upgrading or adding new services.
   */
  expansionMrr: number;
  /**
   * Monthly Recurring Revenue lost from existing customers downgrading or reducing services.
   */
  contractionMrr: number;
  /**
   * Monthly Recurring Revenue lost from customers canceling their subscriptions.
   */
  churnedMrr: number;
  /**
   * The net change in MRR for the period (newMrr + expansionMrr - contractionMrr - churnedMrr).
   */
  totalMrrChange: number;
  /**
   * The currency code to display (e.g., "USD", "EUR"). Defaults to "USD".
   */
  currency?: string;
  /**
   * The period for which the MRR breakdown is calculated (e.g., "Last 30 Days", "This Month").
   */
  period?: string;
}

/**
 * A component that breaks down Monthly Recurring Revenue (MRR) into
 * new, expansion, contraction, and churned MRR for a given period.
 */
const MRRBreakdown: React.FC<MRRBreakdownProps> = ({
  newMrr,
  expansionMrr,
  contractionMrr,
  churnedMrr,
  totalMrrChange,
  currency = 'USD',
  period = 'This Period',
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const breakdownItems = [
    { label: 'New MRR', value: newMrr, color: 'text-green-600', bgColor: 'bg-green-50', description: 'Revenue from new subscriptions' },
    { label: 'Expansion MRR', value: expansionMrr, color: 'text-blue-600', bgColor: 'bg-blue-50', description: 'Revenue from upgrades or add-ons by existing customers' },
    { label: 'Contraction MRR', value: contractionMrr, color: 'text-orange-600', bgColor: 'bg-orange-50', description: 'Revenue lost from downgrades or reduced services by existing customers' },
    { label: 'Churned MRR', value: churnedMrr, color: 'text-red-600', bgColor: 'bg-red-50', description: 'Revenue lost from customer cancellations' },
  ];

  const totalMrrChangeColor = totalMrrChange >= 0 ? 'text-green-700' : 'text-red-700';
  const totalMrrChangeSign = totalMrrChange >= 0 ? '+' : '';

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">MRR Breakdown</h2>
      <p className="text-sm text-gray-500 mb-6">{period}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {breakdownItems.map((item, index) => (
          <div key={index} className={`p-4 rounded-lg ${item.bgColor} flex flex-col justify-between`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <span className={`text-lg font-bold ${item.color}`}>
                {formatCurrency(item.value)}
              </span>
            </div>
            <p className="text-xs text-gray-500">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
        <span className="text-lg font-semibold text-gray-800">Net MRR Change</span>
        <span className={`text-2xl font-bold ${totalMrrChangeColor}`}>
          {totalMrrChangeSign}{formatCurrency(totalMrrChange)}
        </span>
      </div>
    </div>
  );
};

export default MRRBreakdown;