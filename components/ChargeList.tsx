import React, { useState, useMemo, useEffect } from 'react';

// Based on the 'charge' object from the project description
interface Charge {
  id: string;
  object: 'charge';
  amount: number;
  currency: string;
  customer: string | null;
  description: string | null;
  created: number;
  status: 'succeeded' | 'pending' | 'failed';
  paid: boolean;
  receipt_url: string | null;
  billing_details: {
    name: string | null;
  };
}

const sampleCharge: Charge = {
  id: 'ch_1Mcd6UJITzLVzkSmp1XIBHoW',
  object: 'charge',
  amount: 10000,
  currency: 'usd',
  customer: 'cus_NMLsOPQRSsLoG',
  description: 'My First Test Charge (created for API docs)',
  created: 1678886400, // A fixed base timestamp
  status: 'succeeded',
  paid: true,
  receipt_url: 'https://rwashburne-manage-mydev.dev.stripe.me/receipts/payment/...',
  billing_details: {
    name: 'Jenny Rosen',
  },
};

const generateMockCharges = (count: number): Charge[] => {
  const charges: Charge[] = [];
  const statuses: Charge['status'][] = ['succeeded', 'failed', 'pending'];
  const currencies = ['usd', 'eur', 'gbp'];

  for (let i = 0; i < count; i++) {
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];
    const randomAmount = Math.floor(Math.random() * 50000) + 500; // 5.00 to 500.00
    const randomCustomer = `cus_${Math.random().toString(36).substring(2, 16)}`;

    charges.push({
      ...sampleCharge,
      id: `ch_${Math.random().toString(36).substring(2, 26)}`,
      amount: randomAmount,
      currency: randomCurrency,
      status: randomStatus,
      paid: randomStatus === 'succeeded',
      customer: Math.random() > 0.2 ? randomCustomer : null,
      description: `Charge for order #${Math.floor(Math.random() * 10000)}`,
      created: sampleCharge.created - i * 3600 * Math.floor(Math.random() * 24 + 1), // one charge per random day interval
      billing_details: {
        name: `Customer ${i + 1}`,
      },
    });
  }
  return charges;
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};


const ChargeList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allCharges = useMemo(() => generateMockCharges(150), []);

  const filteredCharges = useMemo(() => {
    return allCharges.filter(charge => {
      const statusMatch = statusFilter === 'all' || charge.status === statusFilter;
      const currencyMatch = currencyFilter === 'all' || charge.currency === currencyFilter;
      return statusMatch && currencyMatch;
    });
  }, [allCharges, statusFilter, currencyFilter]);

  const paginatedCharges = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCharges.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCharges, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCharges.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, currencyFilter]);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };
  
  const getStatusBadge = (status: Charge['status']) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'succeeded':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Succeeded</span>;
      case 'failed':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Failed</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Charges</h1>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">All</option>
                <option value="succeeded">Succeeded</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label htmlFor="currency-filter" className="block text-sm font-medium text-gray-700">Currency</label>
              <select
                id="currency-filter"
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">All</option>
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="align-middle inline-block min-w-full">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCharges.map((charge) => (
                    <tr key={charge.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(charge.amount, charge.currency)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusBadge(charge.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{charge.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{charge.billing_details.name}</div>
                        {charge.customer && <code className="text-xs text-gray-400">{charge.customer}</code>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(charge.created)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paginatedCharges.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  No charges found for the selected filters.
                </div>
              )}
            </div>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="py-4 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={handlePrevPage} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
              <button onClick={handleNextPage} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredCharges.length)}</span> of <span className="font-medium">{filteredCharges.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button onClick={handlePrevPage} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                    <span>Previous</span>
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button onClick={handleNextPage} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                    <span>Next</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChargeList;
