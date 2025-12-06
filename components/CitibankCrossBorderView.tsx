import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useMoneyMovement } from './MoneyMovementContext';
import {
  SourceAccountsCrossBorderWireTransfer,
  PayeeSourceAccountCombinationsCrossBorderWireTransfer,
  CrossBorderWireTransfersPreprocessResponse,
  CrossBorderWireTransfersResponse,
  ErrorResponse,
} from './sdk';

// --- Component-Specific State ---
interface EligibilityData {
  sourceAccounts: SourceAccountsCrossBorderWireTransfer[];
  payees: PayeeSourceAccountCombinationsCrossBorderWireTransfer[];
}

interface FormData {
  sourceAccountId: string;
  payeeId: string;
  transactionAmount: string;
  transactionCurrencyCode: string;
  remarks: string;
}

const initialFormData: FormData = {
  sourceAccountId: '',
  payeeId: '',
  transactionAmount: '',
  transactionCurrencyCode: '',
  remarks: '',
};

// --- Styling (Simple CSS-in-JS) ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '2rem',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    borderBottom: '2px solid #eee',
    paddingBottom: '1rem',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#004a9e',
    color: 'white',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
    cursor: 'not-allowed',
  },
  error: {
    color: '#d9534f',
    backgroundColor: '#f2dede',
    border: '1px solid #ebccd1',
    padding: '1rem',
    borderRadius: '4px',
    margin: '1rem 0',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    border: '1px solid #b0e0e6',
    padding: '1rem',
    borderRadius: '4px',
    margin: '1.5rem 0',
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  infoDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.25rem 0',
  },
  success: {
    color: '#3c763d',
    backgroundColor: '#dff0d8',
    border: '1px solid #d6e9c6',
    padding: '1rem',
    borderRadius: '4px',
    textAlign: 'center',
  },
};

// --- Main Component ---
const CitibankCrossBorderView: React.FC = () => {
  const { api, accessToken, uuid } = useMoneyMovement();

  const [eligibilityData, setEligibilityData] = useState<EligibilityData | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [preprocessData, setPreprocessData] = useState<CrossBorderWireTransfersPreprocessResponse | null>(null);
  const [confirmationData, setConfirmationData] = useState<CrossBorderWireTransfersResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch eligibility data on component mount
  useEffect(() => {
    const fetchEligibility = async () => {
      if (!api || !accessToken) {
        setError("API client or access token not available.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.retrieveDestinationSourceAccountCrossBorderTransfer(accessToken, uuid);
        setEligibilityData({
          sourceAccounts: response.sourceAccounts || [],
          payees: response.payeeSourceAccountCombinations || [],
        });
      } catch (err: any) {
        const errorResponse: ErrorResponse = JSON.parse(err.message);
        setError(`Failed to fetch eligibility: ${errorResponse.details || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEligibility();
  }, [api, accessToken, uuid]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePreprocess = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!api || !accessToken) {
      setError("API client or access token not available.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setPreprocessData(null);
    setConfirmationData(null);

    try {
      const response = await api.createCrossBorderTransferPreprocess(accessToken, uuid, {
        sourceAccountId: formData.sourceAccountId,
        payeeId: formData.payeeId,
        transactionAmount: parseFloat(formData.transactionAmount),
        transactionCurrencyCode: formData.transactionCurrencyCode,
        remarks: formData.remarks ? [{ remarks: formData.remarks }] : undefined,
      });
      setPreprocessData(response);
    } catch (err: any) {
      const errorResponse: ErrorResponse = JSON.parse(err.message);
      setError(`Pre-process failed: ${errorResponse.details || 'Please check your input.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [api, accessToken, uuid, formData]);

  const handleConfirm = useCallback(async () => {
    if (!api || !accessToken || !preprocessData?.controlFlowId) {
      setError("Cannot confirm: Missing required data.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.confirmCrossBorderTransfer(accessToken, uuid, {
        controlFlowId: preprocessData.controlFlowId,
      });
      setConfirmationData(response);
      setPreprocessData(null); // Clear preprocess data on success
    } catch (err: any) {
      const errorResponse: ErrorResponse = JSON.parse(err.message);
      setError(`Confirmation failed: ${errorResponse.details || 'An error occurred.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [api, accessToken, uuid, preprocessData]);

  const resetFlow = () => {
    setFormData(initialFormData);
    setPreprocessData(null);
    setConfirmationData(null);
    setError(null);
  };

  const renderContent = () => {
    if (isLoading && !eligibilityData) {
      return <p>Loading eligibility data...</p>;
    }

    if (error && !preprocessData && !confirmationData) {
      return <div style={styles.error}>{error}</div>;
    }

    if (!eligibilityData) {
      return <p>No eligibility data found or failed to load.</p>;
    }

    if (confirmationData) {
      return (
        <div style={styles.success}>
          <h3>Transfer Successful!</h3>
          <p>Your transaction has been submitted.</p>
          <p><strong>Reference ID:</strong> {confirmationData.transactionReferenceId}</p>
          <p><strong>From Account:</strong> {confirmationData.sourceAccountDetails.displaySourceAccountNumber}</p>
          <button style={styles.button} onClick={resetFlow}>
            Start New Cross-Border Transfer
          </button>
        </div>
      );
    }

    if (preprocessData) {
      return (
        <div style={styles.infoBox}>
          <h3 style={styles.infoTitle}>Review Your Transfer</h3>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.infoDetail}>
            <span>Debit Amount:</span>
            <strong>{preprocessData.debitDetails?.transactionDebitAmount} {preprocessData.debitDetails?.currencyCode}</strong>
          </div>
          <div style={styles.infoDetail}>
            <span>Credit Amount:</span>
            <strong>{preprocessData.creditDetails?.transactionCreditAmount} {preprocessData.creditDetails?.currencyCode}</strong>
          </div>
          {preprocessData.foreignExchangeRate && (
            <div style={styles.infoDetail}>
              <span>Exchange Rate:</span>
              <strong>{preprocessData.foreignExchangeRate}</strong>
            </div>
          )}
          {preprocessData.transactionFee && (
            <div style={styles.infoDetail}>
              <span>Transaction Fee:</span>
              <strong>{preprocessData.transactionFee} {preprocessData.feeCurrencyCode}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button style={{...styles.button, backgroundColor: '#6c757d'}} onClick={() => setPreprocessData(null)}>
              Back
            </button>
            <button style={isLoading ? { ...styles.button, ...styles.buttonDisabled } : styles.button} onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? 'Confirming...' : 'Confirm Transfer'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handlePreprocess} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="sourceAccountId" style={styles.label}>From Account</label>
          <select
            id="sourceAccountId"
            name="sourceAccountId"
            value={formData.sourceAccountId}
            onChange={handleInputChange}
            required
            style={styles.input}
          >
            <option value="" disabled>Select a source account</option>
            {eligibilityData.sourceAccounts.map(acc => (
              <option key={acc.sourceAccountId} value={acc.sourceAccountId}>
                {acc.productName} - {acc.displaySourceAccountNumber} ({acc.availableBalance} {acc.sourceAccountCurrencyCode})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="payeeId" style={styles.label}>To Payee</label>
          <select
            id="payeeId"
            name="payeeId"
            value={formData.payeeId}
            onChange={handleInputChange}
            required
            style={styles.input}
          >
            <option value="" disabled>Select a payee</option>
            {eligibilityData.payees.map(payee => (
              <option key={payee.payeeId} value={payee.payeeId}>
                {payee.payeeNickName} ({payee.displayPayeeAccountNumber})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="transactionAmount" style={styles.label}>Amount</label>
          <input
            type="number"
            id="transactionAmount"
            name="transactionAmount"
            value={formData.transactionAmount}
            onChange={handleInputChange}
            placeholder="e.g., 100.00"
            required
            min="0.01"
            step="0.01"
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="transactionCurrencyCode" style={styles.label}>Currency</label>
          <input
            type="text"
            id="transactionCurrencyCode"
            name="transactionCurrencyCode"
            value={formData.transactionCurrencyCode}
            onChange={handleInputChange}
            placeholder="e.g., EUR"
            required
            maxLength={3}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="remarks" style={styles.label}>Remarks (Optional)</label>
          <input
            type="text"
            id="remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            placeholder="Payment for invoice #123"
            style={styles.input}
          />
        </div>

        <button type="submit" style={isLoading ? { ...styles.button, ...styles.buttonDisabled } : styles.button} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Review Transfer'}
        </button>
      </form>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Cross-Border Wire Transfer</h2>
        <p>Send money internationally to your saved payees.</p>
      </div>
      {renderContent()}
    </div>
  );
};

export default CitibankCrossBorderView;