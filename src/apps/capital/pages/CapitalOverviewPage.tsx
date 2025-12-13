import React, { useState, useEffect } from 'react';

// --- Interfaces for Data Structures ---
interface LoanOffer {
  id: string;
  amount: number;
  currency: string;
  termMonths: number;
  interestRate: number; // e.g., 0.05 for 5%
  totalRepayment: number;
  status: 'available' | 'pending_review' | 'declined' | 'accepted';
  applicationLink?: string;
}

interface ActiveLoan {
  id: string;
  originalAmount: number;
  currency: string;
  repaidAmount: number;
  totalRepayment: number;
  nextPaymentDate: string; // ISO date string
  nextPaymentAmount: number;
  status: 'active' | 'completed' | 'defaulted';
}

interface CapitalEligibility {
  status: 'eligible' | 'ineligible' | 'reviewing' | 'not_yet_evaluated';
  reason?: string;
  nextEvaluationDate?: string; // ISO date string
}

interface CapitalData {
  eligibility: CapitalEligibility;
  loanOffers: LoanOffer[];
  activeLoan: ActiveLoan | null;
}

// --- Mock Data and API Simulation ---
const mockCapitalData: CapitalData = {
  eligibility: {
    status: 'eligible',
    reason: 'Based on your recent Stripe activity.',
  },
  loanOffers: [
    {
      id: 'offer_123',
      amount: 10000,
      currency: 'USD',
      termMonths: 12,
      interestRate: 0.08,
      totalRepayment: 10800,
      status: 'available',
      applicationLink: '/capital/apply/offer_123',
    },
    {
      id: 'offer_456',
      amount: 25000,
      currency: 'USD',
      termMonths: 18,
      interestRate: 0.10,
      totalRepayment: 27500,
      status: 'available',
      applicationLink: '/capital/apply/offer_456',
    },
  ],
  activeLoan: {
    id: 'loan_789',
    originalAmount: 5000,
    currency: 'USD',
    repaidAmount: 2500,
    totalRepayment: 5300,
    nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
    nextPaymentAmount: 250,
    status: 'active',
  },
};

const mockCapitalDataNoOffers: CapitalData = {
  eligibility: {
    status: 'eligible',
    reason: 'Based on your recent Stripe activity.',
  },
  loanOffers: [],
  activeLoan: null,
};

const mockCapitalDataIneligible: CapitalData = {
  eligibility: {
    status: 'ineligible',
    reason: 'Your business does not currently meet our eligibility criteria.',
    nextEvaluationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next month
  },
  loanOffers: [],
  activeLoan: null,
};

const mockFetchCapitalData = async (): Promise<CapitalData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate different scenarios
      const scenario = Math.floor(Math.random() * 3);
      if (scenario === 0) {
        resolve(mockCapitalData);
      } else if (scenario === 1) {
        resolve(mockCapitalDataNoOffers);
      } else {
        resolve(mockCapitalDataIneligible);
      }
    }, 1000); // Simulate network delay
  });
};

// --- Helper Components ---

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionClick?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, actionText, onActionClick }) => (
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    {actionText && onActionClick && (
      <button
        onClick={onActionClick}
        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        {actionText}
      </button>
    )}
  </div>
);

interface EligibilityCardProps {
  eligibility: CapitalEligibility;
}

const EligibilityCard: React.FC<EligibilityCardProps> = ({ eligibility }) => {
  let statusColor = 'text-gray-700';
  let statusText = '';
  let icon = 'ℹ️'; // Placeholder for an actual icon

  switch (eligibility.status) {
    case 'eligible':
      statusColor = 'text-green-600';
      statusText = 'Eligible for Stripe Capital';
      icon = '✅';
      break;
    case 'ineligible':
      statusColor = 'text-red-600';
      statusText = 'Not currently eligible';
      icon = '❌';
      break;
    case 'reviewing':
      statusColor = 'text-yellow-600';
      statusText = 'Reviewing your eligibility';
      icon = '⏳';
      break;
    case 'not_yet_evaluated':
      statusColor = 'text-gray-600';
      statusText = 'Eligibility not yet evaluated';
      icon = '❓';
      break;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center mb-2">
        <span className={`text-2xl mr-2 ${statusColor}`}>{icon}</span>
        <h3 className={`text-lg font-medium ${statusColor}`}>{statusText}</h3>
      </div>
      {eligibility.reason && <p className="text-gray-600 text-sm mb-2">{eligibility.reason}</p>}
      {eligibility.nextEvaluationDate && (
        <p className="text-gray-500 text-xs">
          Next evaluation by: {new Date(eligibility.nextEvaluationDate).toLocaleDateString()}
        </p>
      )}
      {eligibility.status === 'ineligible' && (
        <button className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
          Learn more
        </button>
      )}
      {eligibility.status === 'not_yet_evaluated' && (
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
          Check Eligibility
        </button>
      )}
    </div>
  );
};

interface LoanOfferCardProps {
  offer: LoanOffer;
}

const LoanOfferCard: React.FC<LoanOfferCardProps> = ({ offer }) => {
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const handleApplyClick = () => {
    if (offer.applicationLink) {
      window.location.href = offer.applicationLink; // In a real app, this would be a React Router link or a modal
    } else {
      alert('Application link not available.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {formatCurrency(offer.amount, offer.currency)} Loan
        </h3>
        <p className="text-gray-700 text-sm mb-1">
          Repay {formatCurrency(offer.totalRepayment, offer.currency)} over {offer.termMonths} months
        </p>
        <p className="text-gray-500 text-xs">
          Interest Rate: {(offer.interestRate * 100).toFixed(2)}%
        </p>
      </div>
      <div className="mt-4">
        {offer.status === 'available' && (
          <button
            onClick={handleApplyClick}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Apply Now
          </button>
        )}
        {offer.status === 'pending_review' && (
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md cursor-not-allowed font-medium"
          >
            Application Pending
          </button>
        )}
        {offer.status === 'declined' && (
          <button
            disabled
            className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-md cursor-not-allowed font-medium"
          >
            Declined
          </button>
        )}
        {offer.status === 'accepted' && (
          <button
            disabled
            className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-md cursor-not-allowed font-medium"
          >
            Accepted
          </button>
        )}
      </div>
    </div>
  );
};

interface ActiveLoanCardProps {
  loan: ActiveLoan;
}

const ActiveLoanCard: React.FC<ActiveLoanCardProps> = ({ loan }) => {
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const progress = (loan.repaidAmount / loan.totalRepayment) * 100;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        {formatCurrency(loan.originalAmount, loan.currency)} Loan
      </h3>
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-700 mb-1">
          <span>Repaid: {formatCurrency(loan.repaidAmount, loan.currency)}</span>
          <span>Total: {formatCurrency(loan.totalRepayment, loan.currency)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <p className="text-right text-xs text-gray-500 mt-1">{progress.toFixed(1)}% repaid</p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Next Payment</p>
          <p className="font-medium text-gray-800">
            {formatCurrency(loan.nextPaymentAmount, loan.currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-500">Due Date</p>
          <p className="font-medium text-gray-800">
            {new Date(loan.nextPaymentDate).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
          View Details
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
          Make Payment
        </button>
      </div>
    </div>
  );
};

// --- Main Capital Overview Page Component ---
const CapitalOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [capitalData, setCapitalData] = useState<CapitalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCapitalData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await mockFetchCapitalData();
        setCapitalData(data);
      } catch (err) {
        setError('Failed to load capital data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCapitalData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
          Loading capital data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!capitalData) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">No capital data available.</div>
      </div>
    );
  }

  const { eligibility, loanOffers, activeLoan } = capitalData;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Stripe Capital Overview</h1>

      {/* Eligibility Status */}
      <section className="mb-8">
        <SectionHeader title="Eligibility Status" />
        <EligibilityCard eligibility={eligibility} />
      </section>

      {/* Active Loan */}
      {activeLoan && (
        <section className="mb-8">
          <SectionHeader title="Your Active Loan" actionText="View All Payments" onActionClick={() => alert('Navigate to all payments')} />
          <ActiveLoanCard loan={activeLoan} />
        </section>
      )}

      {/* Loan Offers */}
      <section className="mb-8">
        <SectionHeader title="Available Loan Offers" />
        {eligibility.status === 'eligible' && loanOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loanOffers.map((offer) => (
              <LoanOfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : eligibility.status === 'eligible' && loanOffers.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-gray-600 border border-gray-200">
            No new loan offers available at this time. We'll notify you when new offers become available.
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm text-gray-600 border border-gray-200">
            Loan offers are not available while your eligibility is {eligibility.status}.
          </div>
        )}
      </section>

      {/* Past Loans (Placeholder) */}
      <section>
        <SectionHeader title="Loan History" actionText="View All Past Loans" onActionClick={() => alert('Navigate to loan history')} />
        <div className="bg-white p-6 rounded-lg shadow-sm text-gray-600 border border-gray-200 flex items-center justify-between">
          <span>Review details of your completed and past loans.</span>
          <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium">
            View History
          </button>
        </div>
      </section>
    </div>
  );
};

export default CapitalOverviewPage;