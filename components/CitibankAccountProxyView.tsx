
import React, { useState, useCallback } from 'react';
import { useMoneyMovement } from './MoneyMovementContext';
import {
  SourceAccounts,
  AccountProxyTransfersPreprocessResponse,
  AccountProxyTransfersResponse,
  AdhocAccountProxyTransfersPreprocessWithAddPayeeResponse,
} from './sdk';

const CitibankAccountProxyView: React.FC = () => {
  const { api, accessToken, uuid, generateNewUuid } = useMoneyMovement();

  // State for UI and data
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Eligibility State
  const [proxyPaymentTypeForEligibility, setProxyPaymentTypeForEligibility] = useState('PAY_BY_PHONE');
  const [eligibleAccounts, setEligibleAccounts] = useState<SourceAccounts[]>([]);

  // Transfer Form State
  const [isAdhoc, setIsAdhoc] = useState(false);
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [proxyId, setProxyId] = useState('');
  const [proxyIdType, setProxyIdType] = useState('PHONE');
  const [proxyPaymentType, setProxyPaymentType] = useState('PAY_BY_PHONE');
  const [remarks, setRemarks] = useState('Proxy payment');
  const [transferPurpose, setTransferPurpose] = useState('Personal Transfer');
  
  // Ad-hoc specific fields
  const [payeeNickName, setPayeeNickName] = useState('');
  const [enrollPayee, setEnrollPayee] = useState(true);


  // API Response State
  const [preprocessData, setPreprocessData] = useState<AccountProxyTransfersPreprocessResponse | AdhocAccountProxyTransfersPreprocessWithAddPayeeResponse | null>(null);
  const [confirmationData, setConfirmationData] = useState<AccountProxyTransfersResponse | null>(null);

  const handleApiCall = async <T,>(
    apiMethod: () => Promise<T>,
    onSuccess: (data: T) => void
  ) => {
    if (!accessToken || !api) {
      setError('Not authenticated. Please set the access token.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setPreprocessData(null);
    setConfirmationData(null);
    generateNewUuid(); // Generate a new UUID for each request

    try {
      const result = await apiMethod();
      onSuccess(result);
    } catch (e: any) {
      setError(`API Error: ${e.message || 'An unknown error occurred.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckEligibility = useCallback(() => {
    if (!api) return;
    handleApiCall(
      () => api.accountProxyTransfersSourceAccountEligibility(accessToken!, uuid, proxyPaymentTypeForEligibility),
      (data) => {
        const response = data as any; // Casting to any because SDK returns 'any' or generic response
        setEligibleAccounts(response.sourceAccounts || []);
        if (response.sourceAccounts && response.sourceAccounts.length > 0) {
          setSourceAccountId(response.sourceAccounts[0].sourceAccountId);
        }
      }
    );
  }, [api, accessToken, uuid, proxyPaymentTypeForEligibility, generateNewUuid]);

  const handlePreprocess = useCallback(() => {
    if (!api || !sourceAccountId || !amount) {
        setError("Please select a source account and enter an amount.");
        return;
    }

    if (isAdhoc) {
        handleApiCall(
            () => api.adhocAccountProxyTransfersPreprocessWithAddPayee(accessToken!, uuid, {
                proxyPaymentType,
                sourceAccountId,
                transactionAmount: parseFloat(amount),
                transactionCurrencyCode: currency,
                transferCurrencyIndicator: 'SOURCE_CURRENCY',
                proxyAccountId: proxyId,
                proxyAccountIdType: proxyIdType,
                chargeBearer: 'BENEFICIARY',
                remarks,
                transferPurpose,
                payeeNickName,
                payeeEnrollmentFlag: enrollPayee,
            }),
            (data) => setPreprocessData(data)
        );
    } else {
        handleApiCall(
            () => api.createAccountProxyTransfersPreprocess(accessToken!, uuid, {
                proxyPaymentType,
                sourceAccountId,
                transactionAmount: parseFloat(amount),
                transactionCurrencyCode: currency,
                transferCurrencyIndicator: 'SOURCE_CURRENCY',
                proxyAccountId: proxyId,
                proxyAccountIdType: proxyIdType,
                chargeBearer: 'BENEFICIARY',
                remarks,
                transferPurpose,
            }),
            (data) => setPreprocessData(data)
        );
    }
  }, [api, accessToken, uuid, sourceAccountId, amount, currency, proxyId, proxyIdType, proxyPaymentType, remarks, transferPurpose, isAdhoc, payeeNickName, enrollPayee, generateNewUuid]);

  const handleConfirm = useCallback(() => {
    if (!api || !preprocessData?.controlFlowId) {
        setError("No preprocess data available to confirm.");
        return;
    }
    handleApiCall(
        () => api.executeAccountProxyTransfers(accessToken!, uuid, {
            controlFlowId: preprocessData.controlFlowId,
        }),
        (data) => {
            setConfirmationData(data);
            setPreprocessData(null); // Clear preprocess data after confirmation
        }
    );
  }, [api, accessToken, uuid, preprocessData, generateNewUuid]);

  return (
    <div className="container">
      <h2>Account Proxy Transfers</h2>
      <p>Make transfers using identifiers like phone numbers or emails.</p>

      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading-spinner">Loading...</div>}

      {/* Step 1: Eligibility Check */}
      <div className="card">
        <h3>Step 1: Check Source Account Eligibility</h3>
        <div className="form-group">
          <label htmlFor="eligibility-proxy-type">Proxy Payment Type:</label>
          <select
            id="eligibility-proxy-type"
            value={proxyPaymentTypeForEligibility}
            onChange={(e) => setProxyPaymentTypeForEligibility(e.target.value)}
          >
            <option value="PAY_BY_PHONE">Pay by Phone</option>
            <option value="PAY_BY_EMAIL">Pay by Email</option>
            <option value="PAY_BY_NATIONAL_ID">Pay by National ID</option>
          </select>
        </div>
        <button onClick={handleCheckEligibility} disabled={isLoading}>
          Check Eligibility
        </button>
        {eligibleAccounts.length > 0 && (
          <div className="results">
            <h4>Eligible Source Accounts:</h4>
            <pre>{JSON.stringify(eligibleAccounts, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Step 2: Transfer Form & Preprocess */}
      <div className="card">
        <h3>Step 2: Initiate and Preprocess Transfer</h3>
        <div className="form-group">
            <label>
                <input type="checkbox" checked={isAdhoc} onChange={(e) => setIsAdhoc(e.target.value === 'on')} />
                Ad-hoc Transfer (with Payee Creation)
            </label>
        </div>
        <div className="form-group">
          <label htmlFor="source-account">Source Account:</label>
          <select
            id="source-account"
            value={sourceAccountId}
            onChange={(e) => setSourceAccountId(e.target.value)}
            disabled={eligibleAccounts.length === 0}
          >
            <option value="">-- Select Source Account --</option>
            {eligibleAccounts.map((acc) => (
              <option key={acc.sourceAccountId} value={acc.sourceAccountId}>
                {acc.accountNickName || acc.productName} ({acc.displaySourceAccountNumber})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="proxy-payment-type">Proxy Payment Type:</label>
          <select
            id="proxy-payment-type"
            value={proxyPaymentType}
            onChange={(e) => setProxyPaymentType(e.target.value)}
          >
            <option value="PAY_BY_PHONE">Pay by Phone</option>
            <option value="PAY_BY_EMAIL">Pay by Email</option>
            <option value="PAY_BY_NATIONAL_ID">Pay by National ID</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="proxy-id-type">Proxy ID Type:</label>
          <select
            id="proxy-id-type"
            value={proxyIdType}
            onChange={(e) => setProxyIdType(e.target.value)}
          >
            <option value="PHONE">Phone</option>
            <option value="EMAIL">Email</option>
            <option value="NATIONAL_ID">National ID</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="proxy-id">Proxy Identifier (e.g., Phone Number, Email):</label>
          <input
            id="proxy-id"
            type="text"
            value={proxyId}
            onChange={(e) => setProxyId(e.target.value)}
            placeholder="Enter phone, email, or ID"
          />
        </div>
        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 100.00"
          />
        </div>
        <div className="form-group">
          <label htmlFor="currency">Currency:</label>
          <input
            id="currency"
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="e.g., USD"
          />
        </div>
        {isAdhoc && (
            <>
                <div className="form-group">
                    <label htmlFor="payee-nickname">Payee Nickname:</label>
                    <input
                        id="payee-nickname"
                        type="text"
                        value={payeeNickName}
                        onChange={(e) => setPayeeNickName(e.target.value)}
                        placeholder="e.g., John Doe"
                    />
                </div>
                <div className="form-group">
                    <label>
                        <input type="checkbox" checked={enrollPayee} onChange={(e) => setEnrollPayee(e.target.value === 'on')} />
                        Enroll this Payee
                    </label>
                </div>
            </>
        )}
        <button onClick={handlePreprocess} disabled={isLoading || !sourceAccountId || !amount || !proxyId}>
          Preprocess Transfer
        </button>
        {preprocessData && (
          <div className="results">
            <h4>Preprocess Response:</h4>
            <pre>{JSON.stringify(preprocessData, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Step 3: Confirmation */}
      <div className="card">
        <h3>Step 3: Confirm Transfer</h3>
        <button onClick={handleConfirm} disabled={isLoading || !preprocessData?.controlFlowId}>
          Confirm Transfer
        </button>
        {confirmationData && (
          <div className="results success-message">
            <h4>Transfer Confirmed!</h4>
            <pre>{JSON.stringify(confirmationData, null, 2)}</pre>
          </div>
        )}
      </div>

      <style>{`
        .container {
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        .card {
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input[type="text"],
        input[type="number"],
        select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
        }
        button {
          background-color: #00529b;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        button:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }
        .results {
          margin-top: 20px;
          background-color: #f0f0f0;
          padding: 15px;
          border-radius: 4px;
        }
        .error-message {
          color: red;
          background-color: #ffebee;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .success-message {
            color: green;
            background-color: #e8f5e9;
        }
        .loading-spinner {
          text-align: center;
          padding: 20px;
          font-size: 18px;
        }
      `}</style>
    </div>
  );
};

export default CitibankAccountProxyView;
