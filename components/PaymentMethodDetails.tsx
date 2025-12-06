
import React from 'react';
import { DetailItem } from './shared/DetailItem';

export const PaymentMethodDetails: React.FC<{ details: any }> = ({ details }) => {
  if (!details) return null;
  const type = details.type;
  const info = details[type];

  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <h4 className="text-sm font-semibold text-gray-300 mb-2">Payment Method: {type ? type.toUpperCase() : 'UNKNOWN'}</h4>
      {type === 'card' && info && (
        <>
          <DetailItem title="Brand" value={info.brand?.toUpperCase()} />
          <DetailItem title="Last 4" value={info.last4} isMono />
          <DetailItem title="Exp" value={`${info.exp_month}/${info.exp_year}`} />
        </>
      )}
      {type === 'us_bank_account' && info && (
         <>
            <DetailItem title="Bank Name" value={info.bank_name} />
            <DetailItem title="Last 4" value={info.last4} isMono />
            <DetailItem title="Account Type" value={info.account_type} />
         </>
      )}
      {/* Add other payment types as needed */}
    </div>
  );
};

export default PaymentMethodDetails;
