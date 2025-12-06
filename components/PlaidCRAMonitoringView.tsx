import React, { useState, useCallback } from 'react';
import {
  CraMonitoringInsightsGetResponse,
  CraMonitoringInsightsSubscribeResponse,
  PlaidError,
} from 'plaid';

// A simple component to display JSON data
const JsonDisplay = ({ data }: { data: object | null }) => {
  if (!data) return null;
  return (
    <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
};

// A simple component for displaying loading spinners
const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
);

const PlaidCRAMonitoringView: React.FC = () => {
  const [userToken, setUserToken] = useState<string>('');
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [insights, setInsights] = useState<CraMonitoringInsightsGetResponse | null>(null);
  const [apiResponse, setApiResponse] = useState<object | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<PlaidError | null>(null);

  const callApi = async (endpoint: string, body: object) => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    setInsights(null);

    try {
      const response = await fetch(`/api/plaid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint, ...body }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data as PlaidError);
        throw new Error(data.error_message || 'An unknown error occurred');
      }
      
      setApiResponse(data);
      return data;

    } catch (err: any) {
      console.error(`Error calling ${endpoint}:`, err);
      if (!error) { // Don't overwrite PlaidError if it was already set
        setError({
            error_type: 'API_ERROR',
            error_code: 'CLIENT_ERROR',
            error_message: err.message,
            display_message: null,
            request_id: '',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = useCallback(async () => {
    if (!userToken) {
      setError({
        error_type: 'INVALID_INPUT',
        error_code: 'MISSING_USER_TOKEN',
        error_message: 'User Token is required to subscribe.',
        display_message: null,
        request_id: '',
      });
      return;
    }
    const data: CraMonitoringInsightsSubscribeResponse | undefined = await callApi('cra/monitoring_insights/subscribe', { user_token: userToken });
    if (data?.subscription_id) {
      setSubscriptionId(data.subscription_id);
    }
  }, [userToken]);

  const handleUnsubscribe = useCallback(async () => {
    if (!subscriptionId) {
      setError({
        error_type: 'INVALID_INPUT',
        error_code: 'MISSING_SUBSCRIPTION_ID',
        error_message: 'Subscription ID is required to unsubscribe. Please subscribe first.',
        display_message: null,
        request_id: '',
      });
      return;
    }
    await callApi('cra/monitoring_insights/unsubscribe', { subscription_id: subscriptionId });
    setSubscriptionId(null); // Clear subscription ID on successful unsubscribe
  }, [subscriptionId]);

  const handleGetInsights = useCallback(async () => {
    if (!userToken) {
      setError({
        error_type: 'INVALID_INPUT',
        error_code: 'MISSING_USER_TOKEN',
        error_message: 'User Token is required to get insights.',
        display_message: null,
        request_id: '',
      });
      return;
    }
    const data: CraMonitoringInsightsGetResponse | undefined = await callApi('cra/monitoring_insights/get', { user_token: userToken });
    if (data) {
        setInsights(data);
    }
  }, [userToken]);

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">CRA Monitoring Insights</h1>
      <p className="mb-6 text-gray-600">
        Manage CRA Monitoring subscriptions and retrieve the latest insights report for a user.
      </p>

      {/* Input Section */}
      <div className="mb-6">
        <label htmlFor="userToken" className="block text-sm font-medium text-gray-700 mb-2">
          User Token
        </label>
        <input
          type="text"
          id="userToken"
          value={userToken}
          onChange={(e) => setUserToken(e.target.value)}
          placeholder="Enter user_token..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleSubscribe}
          disabled={isLoading || !userToken}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {isLoading ? <Spinner /> : 'Subscribe'}
        </button>
        <button
          onClick={handleUnsubscribe}
          disabled={isLoading || !subscriptionId}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
        >
          {isLoading ? <Spinner /> : 'Unsubscribe'}
        </button>
        <button
          onClick={handleGetInsights}
          disabled={isLoading || !userToken}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
        >
          {isLoading ? <Spinner /> : 'Get Insights'}
        </button>
      </div>
      
      {subscriptionId && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-md text-blue-800">
          <p><strong>Active Subscription ID:</strong> {subscriptionId}</p>
        </div>
      )}

      {/* Results Section */}
      <div className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error.error_message} ({error.error_code})</span>
          </div>
        )}

        {apiResponse && (
          <div>
            <h2 className="text-xl font-semibold mb-2 text-gray-700">API Response</h2>
            <JsonDisplay data={apiResponse} />
          </div>
        )}

        {insights && (
          <div>
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Formatted Insights Report</h2>
            <div className="p-4 border rounded-md bg-gray-50 space-y-4">
              <p><strong>User Insights ID:</strong> {insights.user_insights_id}</p>
              {insights.items.map((item, index) => (
                <div key={index} className="p-4 border rounded-md bg-white">
                  <h3 className="text-lg font-semibold text-indigo-700">Item: {item.item_id}</h3>
                  <p><strong>Institution:</strong> {item.institution_name} ({item.institution_id})</p>
                  <p><strong>Generated:</strong> {new Date(item.date_generated).toLocaleString()}</p>
                  <p><strong>Status:</strong> <span className="font-mono bg-gray-200 px-2 py-1 rounded">{item.status.status_code}</span></p>
                  
                  {item.insights && (
                    <div className="mt-4">
                      <h4 className="font-semibold">Insights Summary</h4>
                      <div className="pl-4 border-l-2 mt-2 space-y-2">
                        {item.insights.income && (
                            <div>
                                <p><strong>Forecasted Monthly Income:</strong> ${item.insights.income.forecasted_monthly_income?.current_amount.toFixed(2)}</p>
                                <p><strong>Total Monthly Income:</strong> ${item.insights.income.total_monthly_income?.current_amount.toFixed(2)}</p>
                                <p><strong>Historical Annual Income:</strong> ${item.insights.income.historical_annual_income?.current_amount.toFixed(2)}</p>
                            </div>
                        )}
                        {item.insights.loans && (
                            <div>
                                <p><strong>Loan Payments Count:</strong> {item.insights.loans.loan_payments_counts?.current_count}</p>
                                <p><strong>Loan Disbursements Count:</strong> {item.insights.loans.loan_disbursements_count}</p>
                            </div>
                        )}
                      </div>
                    </div>
                  )}

                  {item.accounts.map((account, accIndex) => (
                    <div key={accIndex} className="mt-4 p-3 border rounded-md bg-gray-50">
                      <h4 className="font-semibold">Account: {account.name} ({account.mask})</h4>
                      <p><strong>Type:</strong> {account.type} / {account.subtype}</p>
                      <p><strong>Current Balance:</strong> {account.balances.current} {account.balances.iso_currency_code}</p>
                      <p><strong>Available Balance:</strong> {account.balances.available} {account.balances.iso_currency_code}</p>
                      
                      <h5 className="font-semibold mt-2">Transactions:</h5>
                      {account.transactions && account.transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 mt-1">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {account.transactions.map((tx, txIndex) => (
                                <tr key={txIndex}>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm">{tx.date}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm">{tx.merchant_name || tx.original_description}</td>
                                  <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-mono ${tx.amount < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.amount.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No transactions available for this account.</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaidCRAMonitoringView;