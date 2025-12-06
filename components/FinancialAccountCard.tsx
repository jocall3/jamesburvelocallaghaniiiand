
import React from 'react';
import type Stripe from 'stripe';

// Helper to format currency. In a real app, this would be more robust.
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100); // Assuming amount is in cents
};

const statusColors: { [key: string]: string } = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
};

const FeatureList: React.FC<{ title: string; features: readonly string[] | null | undefined }> = ({ title, features }) => {
  if (!features || features.length === 0) {
    return null;
  }
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-600 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {features.map((feature) => (
          <span key={feature} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md capitalize">
            {feature.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    </div>
  );
};

const BalanceDisplay: React.FC<{ title: string; balance: { [key: string]: number } | undefined }> = ({ title, balance }) => {
  if (!balance || Object.keys(balance).length === 0) {
     return (
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-lg font-semibold text-gray-400">N/A</p>
        </div>
     );
  }
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {Object.entries(balance).map(([currency, amount]) => (
        <p key={currency} className="text-lg font-semibold text-gray-800">
          {formatCurrency(amount as number, currency)}
        </p>
      ))}
    </div>
  );
};

const FinancialAddressDisplay: React.FC<{ address: Stripe.Treasury.FinancialAccount.FinancialAddress }> = ({ address }) => {
    if (address.type !== 'aba' || !address.aba) {
        return <p className="text-sm text-gray-500">Unsupported address type: {address.type}</p>;
    }
    const abaDetails = address.aba;

    return (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h5 className="font-semibold text-gray-700">ABA Address</h5>
            <div className="mt-1 text-sm text-gray-600 space-y-0.5">
                <p><span className="font-medium">Holder:</span> {abaDetails.account_holder_name}</p>
                <p><span className="font-medium">Bank:</span> {abaDetails.bank_name}</p>
                <p><span className="font-medium">Routing:</span> {abaDetails.routing_number}</p>
                <p><span className="font-medium">Account (Last 4):</span> {abaDetails.account_number_last4}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1 items-center">
                <span className="text-xs font-medium text-gray-500 mr-2">Supported Networks:</span>
                {abaDetails.supported_networks?.map(network => (
                    <span key={network} className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">{network}</span>
                ))}
            </div>
        </div>
    );
};


interface FinancialAccountCardProps {
  financialAccount: Stripe.Treasury.FinancialAccount;
}

export const FinancialAccountCard: React.FC<FinancialAccountCardProps> = ({ financialAccount }) => {

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Financial Account
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 font-mono break-all">{financialAccount.id}</p>
          </div>
          <span className={`flex-shrink-0 px-3 py-1 text-sm font-semibold rounded-full capitalize ${statusColors[financialAccount.status] || 'bg-gray-100 text-gray-800'}`}>
            {financialAccount.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Country: <span className="font-medium text-gray-700">{financialAccount.country}</span> | Supported Currencies: <span className="font-medium text-gray-700">{financialAccount.supported_currencies.join(', ').toUpperCase()}</span>
        </p>
      </div>
      
      {/* Body */}
      <div className="px-4 py-5 sm:px-6 space-y-6">
        {/* Balances Section */}
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-2">Balances</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-md border border-slate-200">
            <BalanceDisplay title="Cash" balance={financialAccount.balance.cash} />
            <BalanceDisplay title="Inbound Pending" balance={financialAccount.balance.inbound_pending} />
            <BalanceDisplay title="Outbound Pending" balance={financialAccount.balance.outbound_pending} />
          </div>
        </div>
        
        {/* Financial Addresses Section */}
        {financialAccount.financial_addresses && financialAccount.financial_addresses.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Financial Addresses</h3>
            <div className="space-y-3">
                {financialAccount.financial_addresses.map((address, index) => (
                    <FinancialAddressDisplay key={index} address={address} />
                ))}
            </div>
          </div>
        )}
        
        {/* Features Section */}
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-2">Features</h3>
          <div className="space-y-4">
             <FeatureList title="Active" features={financialAccount.active_features} />
             <FeatureList title="Pending" features={financialAccount.pending_features} />
             <FeatureList title="Restricted" features={financialAccount.restricted_features} />
          </div>
        </div>
        
        {/* Status Details */}
        {financialAccount.status_details.closed && (
            <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">Status Details</h3>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-700">Account Closed</h4>
                    <p className="text-sm text-red-600 mt-1 capitalize">
                        Reasons: {financialAccount.status_details.closed.reasons.join(', ').replace(/_/g, ' ')}
                    </p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default FinancialAccountCard;
