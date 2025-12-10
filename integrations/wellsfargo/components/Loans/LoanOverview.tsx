import React, { useState, useEffect } from 'react';

// --- Interfaces ---
interface Payment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed';
  type: 'Principal' | 'Interest' | 'Escrow' | 'Fee';
}

interface Loan {
  id: string;
  accountNumber: string;
  type: 'Mortgage' | 'Auto Loan' | 'Personal Loan' | 'Student Loan';
  originalAmount: number;
  outstandingBalance: number;
  interestRate: number; // as a percentage, e.g., 3.875 for 3.875%
  minimumPaymentDue: number;
  nextPaymentDueDate: string; // YYYY-MM-DD
  lastPaymentDate: string | null; // YYYY-MM-DD
  lastPaymentAmount: number | null;
  paymentHistory: Payment[];
  status: 'Active' | 'Paid Off' | 'Delinquent';
  escrowBalance?: number; // For mortgage
  propertyAddress?: string; // For mortgage
  vehicleVIN?: string; // For auto loan
}

// --- Mock API Service (In a real application, this would be in a separate service file) ---
// This array simulates a database or external API state.
const mockLoans: Loan[] = [
  {
    id: 'loan-12345',
    accountNumber: '1234-5678-9012',
    type: 'Mortgage',
    originalAmount: 300000,
    outstandingBalance: 250000,
    interestRate: 3.875,
    minimumPaymentDue: 1500.75,
    nextPaymentDueDate: '2023-11-01',
    lastPaymentDate: '2023-10-01',
    lastPaymentAmount: 1500.75,
    paymentHistory: [
      { id: 'pay-001', date: '2023-10-01', amount: 1500.75, status: 'Paid', type: 'Principal' },
      { id: 'pay-002', date: '2023-09-01', amount: 1500.75, status: 'Paid', type: 'Principal' },
      { id: 'pay-003', date: '2023-08-01', amount: 1500.75, status: 'Paid', type: 'Principal' },
    ],
    status: 'Active',
    escrowBalance: 2500,
    propertyAddress: '123 Main St, Anytown, CA 90210',
  },
  {
    id: 'loan-67890',
    accountNumber: '9876-5432-1098',
    type: 'Auto Loan',
    originalAmount: 35000,
    outstandingBalance: 22000,
    interestRate: 4.5,
    minimumPaymentDue: 450.00,
    nextPaymentDueDate: '2023-11-15',
    lastPaymentDate: '2023-10-15',
    lastPaymentAmount: 450.00,
    paymentHistory: [
      { id: 'pay-004', date: '2023-10-15', amount: 450.00, status: 'Paid', type: 'Principal' },
      { id: 'pay-005', date: '2023-09-15', amount: 450.00, status: 'Paid', type: 'Principal' },
    ],
    status: 'Active',
    vehicleVIN: '1HGFC1234567890AB',
  },
  {
    id: 'loan-11223',
    accountNumber: '1122-3344-5566',
    type: 'Personal Loan',
    originalAmount: 10000,
    outstandingBalance: 5000,
    interestRate: 7.99,
    minimumPaymentDue: 200.00,
    nextPaymentDueDate: '2023-11-20',
    lastPaymentDate: '2023-10-20',
    lastPaymentAmount: 200.00,
    paymentHistory: [
      { id: 'pay-006', date: '2023-10-20', amount: 200.00, status: 'Paid', type: 'Principal' },
    ],
    status: 'Active',
  },
];

const fetchLoanDetails = (loanId: string): Promise<Loan | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const loan = mockLoans.find((l) => l.id === loanId);
      resolve(loan || null);
    }, 500); // Simulate network delay
  });
};

const makeLoanPayment = (loanId: string, amount: number): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const loanIndex = mockLoans.findIndex((l) => l.id === loanId);
      if (loanIndex !== -1) {
        const loan = mockLoans[loanIndex];
        if (amount > 0 && amount <= loan.outstandingBalance) {
          loan.outstandingBalance -= amount;
          loan.lastPaymentDate = new Date().toISOString().split('T')[0];
          loan.lastPaymentAmount = amount;
          loan.paymentHistory.unshift({
            id: `pay-${Date.now()}`,
            date: loan.lastPaymentDate,
            amount: amount,
            status: 'Paid',
            type: 'Principal', // Simplified for mock, could be more complex in real app
          });
          resolve({ success: true, message: 'Payment successful!' });
        } else {
          resolve({ success: false, message: 'Invalid payment amount or exceeds outstanding balance.' });
        }
      } else {
        resolve({ success: false, message: 'Loan not found.' });
      }
    }, 1000); // Simulate network delay
  });
};

// --- Helper for currency formatting ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// --- Payment Modal Component ---
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  loanBalance: number;
  minimumPayment: number;
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, loanId, loanBalance, minimumPayment, onPaymentSuccess }) => {
  const [paymentAmount, setPaymentAmount] = useState<string>(minimumPayment.toFixed(2));
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount(minimumPayment.toFixed(2));
      setPaymentError(null);
      setPaymentSuccessMessage(null);
    }
  }, [isOpen, minimumPayment]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentSuccessMessage(null);
    setIsProcessing(true);

    const amount = parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Please enter a valid positive amount.');
      setIsProcessing(false);
      return;
    }
    if (amount > loanBalance) {
      setPaymentError(`Payment amount cannot exceed outstanding balance (${formatCurrency(loanBalance)}).`);
      setIsProcessing(false);
      return;
    }

    try {
      const result = await makeLoanPayment(loanId, amount);
      if (result.success) {
        setPaymentSuccessMessage(result.message);
        onPaymentSuccess(); // Notify parent to refresh data
        setTimeout(() => {
          onClose(); // Close modal after a short delay
        }, 1500);
      } else {
        setPaymentError(result.message);
      }
    } catch (err) {
      setPaymentError('An unexpected error occurred during payment.');
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Make a Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-semibold leading-none">&times;</button>
        </div>
        <form onSubmit={handlePaymentSubmit}>
          <div className="mb-4">
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount
            </label>
            <input
              type="number"
              id="paymentAmount"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              step="0.01"
              min="0.01"
              max={loanBalance}
              required
              disabled={isProcessing}
            />
            <p className="mt-1 text-sm text-gray-500">
              Minimum payment due: {formatCurrency(minimumPayment)}
            </p>
            <p className="text-sm text-gray-500">
              Outstanding balance: {formatCurrency(loanBalance)}
            </p>
          </div>
          {paymentError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{paymentError}</span>
            </div>
          )}
          {paymentSuccessMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{paymentSuccessMessage}</span>
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- Main LoanOverview Component ---
interface LoanOverviewProps {
  loanId: string;
}

const LoanOverview: React.FC<LoanOverviewProps> = ({ loanId }) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to re-fetch data after payment

  useEffect(() => {
    const getLoanDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLoanDetails(loanId);
        if (data) {
          setLoan(data);
        } else {
          setError('Loan not found.');
        }
      } catch (err) {
        setError('Failed to fetch loan details.');
        console.error('Error fetching loan details:', err);
      } finally {
        setLoading(false);
      }
    };

    getLoanDetails();
  }, [loanId, refreshTrigger]); // Re-fetch when loanId changes or refreshTrigger is updated

  const handlePaymentSuccess = () => {
    setRefreshTrigger(prev => prev + 1); // Increment to trigger useEffect
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-600">Loading loan details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md max-w-2xl mx-auto mt-8">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="p-6 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg shadow-md max-w-2xl mx-auto mt-8">
        <h2 className="text-xl font-semibold mb-2">No Loan Data</h2>
        <p>No loan details available for the provided ID.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg my-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{loan.type} Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Loan Summary Card */}
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Loan Summary</h2>
          <div className="space-y-2 text-gray-700">
            <p><strong>Account Number:</strong> {loan.accountNumber}</p>
            <p><strong>Status:</strong> <span className={`font-medium ${loan.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>{loan.status}</span></p>
            <p><strong>Original Amount:</strong> {formatCurrency(loan.originalAmount)}</p>
            <p className="text-2xl font-bold text-blue-700">
              Outstanding Balance: {formatCurrency(loan.outstandingBalance)}
            </p>
            <p><strong>Interest Rate:</strong> {loan.interestRate}%</p>
            {loan.type === 'Mortgage' && loan.escrowBalance !== undefined && (
              <p><strong>Escrow Balance:</strong> {formatCurrency(loan.escrowBalance)}</p>
            )}
            {loan.type === 'Mortgage' && loan.propertyAddress && (
              <p><strong>Property Address:</strong> {loan.propertyAddress}</p>
            )}
            {loan.type === 'Auto Loan' && loan.vehicleVIN && (
              <p><strong>Vehicle VIN:</strong> {loan.vehicleVIN}</p>
            )}
          </div>
        </div>

        {/* Next Payment & Actions Card */}
        <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Next Payment</h2>
          <div className="space-y-2 text-gray-700 mb-6">
            <p><strong>Minimum Payment Due:</strong> <span className="text-xl font-bold text-green-700">{formatCurrency(loan.minimumPaymentDue)}</span></p>
            <p><strong>Due Date:</strong> <span className="font-medium">{loan.nextPaymentDueDate}</span></p>
            <p><strong>Last Payment Date:</strong> {loan.lastPaymentDate || 'N/A'}</p>
            <p><strong>Last Payment Amount:</strong> {loan.lastPaymentAmount ? formatCurrency(loan.lastPaymentAmount) : 'N/A'}</p>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Make a Payment
          </button>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Payment History</h2>
        {loan.paymentHistory.length === 0 ? (
          <p className="text-gray-600">No payment history available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loan.paymentHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(payment.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          loanId={loan.id}
          loanBalance={loan.outstandingBalance}
          minimumPayment={loan.minimumPaymentDue}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default LoanOverview;