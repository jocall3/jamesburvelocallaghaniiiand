import React, { useState, useEffect } from 'react';

// Define the shape of a dispute
interface Dispute {
  id: string;
  amount: number; // Amount in cents
  currency: string; // e.g., 'usd', 'eur'
  status: 'pending' | 'won' | 'lost' | 'needs_response' | 'closed';
  reason: string; // e.g., 'fraudulent', 'product_not_received'
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  paymentIntentId: string;
  customerEmail?: string;
}

// Mock API call to fetch disputes
// In a real application, this would be an actual API call to your backend
// which in turn would interact with the Stripe API.
const fetchDisputes = async (): Promise<Dispute[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'dp_1A2B3C4D',
          amount: 5000,
          currency: 'usd',
          status: 'needs_response',
          reason: 'fraudulent',
          createdAt: '2023-10-26T10:00:00Z',
          updatedAt: '2023-10-26T10:00:00Z',
          paymentIntentId: 'pi_XYZ123',
          customerEmail: 'alice.smith@example.com',
        },
        {
          id: 'dp_5E6F7G8H',
          amount: 12000,
          currency: 'usd',
          status: 'pending',
          reason: 'product_not_received',
          createdAt: '2023-10-25T14:30:00Z',
          updatedAt: '2023-10-25T14:30:00Z',
          paymentIntentId: 'pi_ABC456',
          customerEmail: 'bob.johnson@example.com',
        },
        {
          id: 'dp_9I0J1K2L',
          amount: 2500,
          currency: 'eur',
          status: 'won',
          reason: 'duplicate',
          createdAt: '2023-10-20T09:15:00Z',
          updatedAt: '2023-10-22T11:00:00Z',
          paymentIntentId: 'pi_DEF789',
          customerEmail: 'charlie.brown@example.com',
        },
        {
          id: 'dp_3M4N5O6P',
          amount: 7500,
          currency: 'gbp',
          status: 'lost',
          reason: 'service_not_as_described',
          createdAt: '2023-10-18T16:00:00Z',
          updatedAt: '2023-10-24T10:00:00Z',
          paymentIntentId: 'pi_GHI012',
          customerEmail: 'diana.prince@example.com',
        },
        {
          id: 'dp_7Q8R9S0T',
          amount: 3000,
          currency: 'usd',
          status: 'closed',
          reason: 'unrecognized',
          createdAt: '2023-10-15T11:00:00Z',
          updatedAt: '2023-10-17T09:00:00Z',
          paymentIntentId: 'pi_JKL345',
          customerEmail: 'eve.adams@example.com',
        },
      ]);
    }, 1000); // Simulate network delay
  });
};

const DisputeList: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getDisputes = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        const data = await fetchDisputes();
        setDisputes(data);
      } catch (err) {
        setError('Failed to fetch disputes. Please try again.');
        console.error('Error fetching disputes:', err);
      } finally {
        setLoading(false);
      }
    };

    getDisputes();
  }, []);

  const handleManageDispute = (disputeId: string) => {
    // In a real application, this would typically navigate to a dedicated
    // dispute detail page or open a modal for managing the dispute.
    console.log(`Managing dispute: ${disputeId}`);
    alert(`Action: Navigate to dispute details for ${disputeId}`);
    // Example: router.push(`/disputes/${disputeId}`);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are typically in the smallest currency unit (e.g., cents)
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClasses = (status: Dispute['status']) => {
    switch (status) {
      case 'needs_response':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-gray-100 text-gray-800';
      case 'closed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Loading disputes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-700 bg-red-50 border border-red-200 rounded-md max-w-lg mx-auto">
        <p className="font-semibold mb-2">Error:</p>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()} // Simple retry mechanism
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Retry
        </button>
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600 bg-gray-50 border border-gray-200 rounded-md max-w-lg mx-auto">
        <p className="text-lg font-semibold mb-2">No disputes found.</p>
        <p>All clear! Keep an eye on this page for any new payment disputes.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Disputes</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dispute ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Email
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Manage</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {disputes.map((dispute) => (
              <tr key={dispute.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {dispute.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatAmount(dispute.amount, dispute.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(dispute.status)}`}>
                    {dispute.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {dispute.reason.replace(/_/g, ' ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(dispute.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {dispute.customerEmail || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleManageDispute(dispute.id)}
                    className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DisputeList;