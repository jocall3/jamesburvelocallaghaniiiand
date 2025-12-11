import React, { useState, useMemo } from 'react';

interface Transaction {
  transactionId: string;
  description: string;
  amount: number;
  currencyCode: string;
  date: string;
}

interface PointsRedemptionCardProps {
  accountId: string;
  productName: string;
  accountNumberDisplay: string;
  availablePoints: number;
  conversionRate: number; // Value of 1 point in account currency (e.g., 0.01)
  transactions: Transaction[];
  onRedeem: (transactionId: string, pointsToRedeem: number) => Promise<void>;
}

export const PointsRedemptionCard: React.FC<PointsRedemptionCardProps> = ({
  accountId,
  productName,
  accountNumberDisplay,
  availablePoints,
  conversionRate,
  transactions,
  onRedeem,
}) => {
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const selectedTransaction = useMemo(() => 
    transactions.find(t => t.transactionId === selectedTxId), 
    [transactions, selectedTxId]
  );

  const maxRedeemablePointsForTx = useMemo(() => {
    if (!selectedTransaction) return 0;
    const txAmountPoints = Math.ceil(selectedTransaction.amount / conversionRate);
    return Math.min(availablePoints, txAmountPoints);
  }, [selectedTransaction, availablePoints, conversionRate]);

  const equivalentValue = useMemo(() => {
    const points = parseInt(pointsInput, 10);
    if (isNaN(points)) return 0;
    return points * conversionRate;
  }, [pointsInput, conversionRate]);

  const handleTransactionSelect = (id: string) => {
    if (status === 'submitting') return;
    setSelectedTxId(id === selectedTxId ? null : id);
    setPointsInput('');
    setStatus('idle');
    setErrorMsg('');
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only numeric input
    if (/^\d*$/.test(val)) {
      setPointsInput(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId || !pointsInput) return;

    const points = parseInt(pointsInput, 10);
    
    if (points <= 0) {
      setErrorMsg('Please enter a valid amount of points.');
      return;
    }

    if (points > maxRedeemablePointsForTx) {
      setErrorMsg(`You cannot redeem more than ${maxRedeemablePointsForTx} points for this transaction.`);
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      await onRedeem(selectedTxId, points);
      setStatus('success');
      setPointsInput('');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Redemption failed. Please try again later.');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto border border-gray-200">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800">Shop with Points</h2>
        <p className="text-sm text-gray-600 mt-1">
          {productName} ({accountNumberDisplay})
        </p>
        <div className="mt-4 flex items-center justify-between bg-blue-50 p-3 rounded-md">
          <span className="text-blue-800 font-medium">Available Balance</span>
          <span className="text-blue-900 font-bold text-lg">{availablePoints.toLocaleString()} Points</span>
        </div>
      </div>

      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
          <h3 className="text-green-800 font-bold text-lg mb-2">Redemption Successful!</h3>
          <p className="text-green-700">Your credit will be applied to your account statement within 2-3 business days.</p>
          <button 
            onClick={() => { setStatus('idle'); setSelectedTxId(null); }}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Redeem Another
          </button>
        </div>
      ) : (
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-3">Select a purchase to cover:</h3>
          
          <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-gray-500 italic">No eligible transactions found.</p>
            ) : (
              transactions.map((tx) => (
                <div 
                  key={tx.transactionId}
                  onClick={() => handleTransactionSelect(tx.transactionId)}
                  className={`cursor-pointer border rounded-md p-3 flex justify-between items-center transition-all ${
                    selectedTxId === tx.transactionId 
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-800">{tx.description}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(tx.amount, tx.currencyCode)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedTransaction && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-md border border-gray-200 animate-fade-in">
              <h4 className="font-semibold text-gray-800 mb-4">Redeem for {selectedTransaction.description}</h4>
              
              <div className="mb-4">
                <label htmlFor="pointsInput" className="block text-sm font-medium text-gray-700 mb-1">
                  Points to apply (Max: {maxRedeemablePointsForTx})
                </label>
                <div className="flex items-center">
                  <input
                    id="pointsInput"
                    type="text"
                    value={pointsInput}
                    onChange={handlePointsChange}
                    className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    disabled={status === 'submitting'}
                  />
                  <div className="bg-gray-100 px-4 py-2 border border-l-0 border-gray-300 rounded-r-md text-gray-600">
                    Points
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-sm">
                  <span className="text-gray-500">Value: {formatCurrency(equivalentValue, selectedTransaction.currencyCode)}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTxId(null)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  disabled={status === 'submitting'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={status === 'submitting' || !pointsInput || parseInt(pointsInput) === 0}
                >
                  {status === 'submitting' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Confirm Redemption'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};