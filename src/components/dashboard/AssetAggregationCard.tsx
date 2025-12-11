import React, { useMemo } from 'react';

// Types derived from Products_Partner_View OpenAPI spec
export interface CitiProduct {
  accountId: string;
  status: 'ACTIVE' | string;
  productName: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | string;
  accountNumberDisplay: string;
}

// Extended interface to support the dashboard view with balance information
// (assuming balance is fetched via a separate accounts detail endpoint or enriched locally)
export interface EnrichedAsset extends CitiProduct {
  balance: number;
  currency: string;
  provider: 'Citi' | 'Internal';
  lastUpdated?: string;
}

interface AssetAggregationCardProps {
  assets: EnrichedAsset[];
  isLoading?: boolean;
  error?: string;
}

export const AssetAggregationCard: React.FC<AssetAggregationCardProps> = ({ 
  assets, 
  isLoading = false, 
  error 
}) => {

  const aggregation = useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    const assetBreakdown: Record<string, number> = {
      CHECKING: 0,
      SAVINGS: 0,
    };

    assets.forEach(asset => {
      if (asset.accountType === 'CREDIT_CARD') {
        totalLiabilities += asset.balance;
      } else {
        // Assuming CHECKING and SAVINGS are assets
        totalAssets += asset.balance;
        if (asset.accountType in assetBreakdown) {
          assetBreakdown[asset.accountType] += asset.balance;
        } else {
          assetBreakdown[asset.accountType] = (assetBreakdown[asset.accountType] || 0) + asset.balance;
        }
      }
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      assetBreakdown
    };
  }, [assets]);

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse h-64 w-full">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
        <h3 className="text-lg font-medium text-gray-900">Unable to load assets</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Asset Aggregation</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {assets.length} Accounts Linked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Total Assets</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {formatCurrency(aggregation.totalAssets)}
            </p>
            <div className="mt-2 text-xs text-green-700">
              Checking: {formatCurrency(aggregation.assetBreakdown.CHECKING)} • 
              Savings: {formatCurrency(aggregation.assetBreakdown.SAVINGS)}
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <p className="text-sm font-medium text-red-600 uppercase tracking-wider">Total Liabilities</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {formatCurrency(aggregation.totalLiabilities)}
            </p>
            <p className="mt-2 text-xs text-red-700">
              Credit Card Balances
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
            Connected Citi Accounts
          </h3>
          <ul className="divide-y divide-gray-200">
            {assets.filter(a => a.provider === 'Citi').length === 0 ? (
              <li className="py-3 text-sm text-gray-500 italic">No external Citi accounts connected.</li>
            ) : (
              assets.filter(a => a.provider === 'Citi').map((asset) => (
                <li key={asset.accountId} className="py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs mr-3">
                      Citi
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{asset.productName}</p>
                      <p className="text-xs text-gray-500">
                        {asset.accountNumberDisplay} • {asset.accountType.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${asset.accountType === 'CREDIT_CARD' ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(asset.balance, asset.currency)}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{asset.status.toLowerCase()}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <div className="text-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Net Worth Estimate</span>
            <span className={`font-bold ${aggregation.netWorth >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatCurrency(aggregation.netWorth)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetAggregationCard;