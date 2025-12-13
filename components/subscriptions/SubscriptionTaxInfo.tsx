import React from 'react';

interface SubscriptionTaxInfoProps {
  taxRate: number;
  taxAmount: number;
  currencySymbol: string;
}

const SubscriptionTaxInfo: React.FC<SubscriptionTaxInfoProps> = ({
  taxRate,
  taxAmount,
  currencySymbol,
}) => {
  return (
    <div className="subscription-tax-info">
      <p>
        Tax Rate: {taxRate.toFixed(2)}%
      </p>
      <p>
        Tax Amount: {currencySymbol}{taxAmount.toFixed(2)}
      </p>
    </div>
  );
};

export default SubscriptionTaxInfo;