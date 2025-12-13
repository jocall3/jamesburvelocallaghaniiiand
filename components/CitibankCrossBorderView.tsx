```typescript
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useMoneyMovement } from './MoneyMovementContext';
import {
    SourceAccountsCrossBorderWireTransfer,
    PayeeSourceAccountCombinationsCrossBorderWireTransfer,
    CrossBorderWireTransfersPreprocessResponse,
    CrossBorderWireTransfersResponse,
    ErrorResponse,
} from './sdk';

// --- The James Burvel O’Callaghan III Code: Citibank Cross-Border Wire Transfer System ---
// --- Component A: Core State and Data Definitions ---
interface A_EligibilityData {
    sourceAccounts: SourceAccountsCrossBorderWireTransfer[];
    payees: PayeeSourceAccountCombinationsCrossBorderWireTransfer[];
}

interface B_FormData {
    sourceAccountId: string;
    payeeId: string;
    transactionAmount: string;
    transactionCurrencyCode: string;
    remarks: string;
}

const C_initialFormData: B_FormData = {
    sourceAccountId: '',
    payeeId: '',
    transactionAmount: '',
    transactionCurrencyCode: '',
    remarks: '',
};

// --- Component B: UI Styling and Layout Definitions (The James Burvel O’Callaghan III Code) ---
const D_styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: '2rem',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        maxWidth: '1200px',
        margin: '2rem auto',
        border: '2px solid #333',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        backgroundColor: '#f9f9f9',
    },
    header: {
        borderBottom: '3px solid #666',
        paddingBottom: '1.5rem',
        marginBottom: '2rem',
    },
    headerTitle: {
        fontSize: '2.2rem',
        fontWeight: '700',
        color: '#1a73e8',
        marginBottom: '0.5rem',
    },
    headerSubtitle: {
        fontSize: '1.1rem',
        color: '#555',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '1.5rem',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#fff',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        marginBottom: '0.6rem',
        fontWeight: '600',
        color: '#444',
        fontSize: '1.05rem',
    },
    input: {
        padding: '0.9rem',
        border: '1px solid #999',
        borderRadius: '6px',
        fontSize: '1.05rem',
        transition: 'border-color 0.2s',
        ':focus': {
            borderColor: '#1a73e8',
            outline: 'none',
        },
    },
    select: {
        padding: '0.9rem',
        border: '1px solid #999',
        borderRadius: '6px',
        fontSize: '1.05rem',
        transition: 'border-color 0.2s',
        ':focus': {
            borderColor: '#1a73e8',
            outline: 'none',
        },
    },
    button: {
        padding: '0.95rem 2rem',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: '#1a73e8',
        color: 'white',
        fontSize: '1.1rem',
        cursor: 'pointer',
        marginTop: '1.2rem',
        transition: 'background-color 0.2s, transform 0.1s',
        fontWeight: '600',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
        ':hover': {
            backgroundColor: '#0d6efd',
            transform: 'translateY(-1px)',
        },
    },
    buttonDisabled: {
        backgroundColor: '#bbb',
        cursor: 'not-allowed',
        boxShadow: 'none',
        ':hover': {
            transform: 'none',
        },
    },
    error: {
        color: '#d93025',
        backgroundColor: '#fde5e5',
        border: '1px solid #f00020',
        padding: '1.2rem',
        borderRadius: '6px',
        margin: '1.5rem 0',
        fontSize: '1.05rem',
        fontWeight: '500',
    },
    infoBox: {
        backgroundColor: '#e8f0fe',
        border: '1px solid #91c0f8',
        padding: '1.2rem',
        borderRadius: '6px',
        margin: '1.8rem 0',
    },
    infoTitle: {
        fontWeight: '700',
        marginBottom: '0.7rem',
        fontSize: '1.15rem',
        color: '#1a73e8',
    },
    infoDetail: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.3rem 0',
        fontSize: '1.05rem',
        color: '#333',
    },
    success: {
        color: '#155724',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        padding: '1.2rem',
        borderRadius: '6px',
        textAlign: 'center',
        fontSize: '1.1rem',
        fontWeight: '500',
        margin: '1.5rem 0',
    },
    backButton: {
        ...D_styles.button,
        backgroundColor: '#6c757d',
        ':hover': {
            backgroundColor: '#5a6268',
        },
    },
    resetButton: {
        ...D_styles.button,
        backgroundColor: '#28a745',
        ':hover': {
            backgroundColor: '#218838',
        },
    },
};

// --- Component C: Core API Interaction and Data Handling (The James Burvel O’Callaghan III Code) ---
const E_CitibankCrossBorderView: React.FC = () => {
    const { api, accessToken, uuid } = useMoneyMovement();
    const [F_eligibilityData, setEligibilityData] = useState<A_EligibilityData | null>(null);
    const [G_formData, setFormData] = useState<B_FormData>(C_initialFormData);
    const [H_preprocessData, setPreprocessData] = useState<CrossBorderWireTransfersPreprocessResponse | null>(null);
    const [I_confirmationData, setConfirmationData] = useState<CrossBorderWireTransfersResponse | null>(null);
    const [J_isLoading, setIsLoading] = useState<boolean>(false);
    const [K_error, setError] = useState<string | null>(null);

    // --- Feature 1: Eligibility Data Retrieval (James Burvel O’Callaghan III Code - JBO3C) ---
    useEffect(() => {
        const L_fetchEligibility = async () => {
            if (!api || !accessToken) {
                setError("API client or access token not available. Please check your configuration (Error Code: CBW-001).");
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const response = await api.retrieveDestinationSourceAccountCrossBorderTransfer(accessToken, uuid);
                if (!response) {
                    throw new Error("No response received from the API (Error Code: CBW-002).");
                }
                if (!response.sourceAccounts || !Array.isArray(response.sourceAccounts)) {
                    throw new Error("Invalid source accounts data (Error Code: CBW-003).");
                }
                if (!response.payeeSourceAccountCombinations || !Array.isArray(response.payeeSourceAccountCombinations)) {
                    throw new Error("Invalid payee data (Error Code: CBW-004).");
                }
                setEligibilityData({
                    sourceAccounts: response.sourceAccounts || [],
                    payees: response.payeeSourceAccountCombinations || [],
                });
            } catch (err: any) {
                const errorResponse: ErrorResponse = JSON.parse(err.message || '{}');
                setError(`Failed to fetch eligibility: ${errorResponse.details || 'An unknown error occurred while fetching eligibility data. Please contact support and provide error code CBW-005.'}`);
            } finally {
                setIsLoading(false);
            }
        };
        L_fetchEligibility();
    }, [api, accessToken, uuid]);

    // --- Feature 2: Input Change Handler (James Burvel O’Callaghan III Code - JBO3C) ---
    const M_handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Feature 3: Preprocess Wire Transfer (James Burvel O’Callaghan III Code - JBO3C) ---
    const N_handlePreprocess = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        if (!api || !accessToken) {
            setError("API client or access token not available (Error Code: CBW-006).");
            return;
        }
        if (!G_formData.sourceAccountId || !G_formData.payeeId || !G_formData.transactionAmount || !G_formData.transactionCurrencyCode) {
            setError("Please fill in all required fields before proceeding (Error Code: CBW-007).");
            return;
        }
        setIsLoading(true);
        setError(null);
        setPreprocessData(null);
        setConfirmationData(null);
        try {
            const parsedAmount = parseFloat(G_formData.transactionAmount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error("Invalid transaction amount. Please enter a valid positive number (Error Code: CBW-008).");
            }
            if (!/^[A-Z]{3}$/.test(G_formData.transactionCurrencyCode)) {
                throw new Error("Invalid currency code. Please enter a 3-letter ISO currency code (Error Code: CBW-009).");
            }
            const response = await api.createCrossBorderTransferPreprocess(accessToken, uuid, {
                sourceAccountId: G_formData.sourceAccountId,
                payeeId: G_formData.payeeId,
                transactionAmount: parsedAmount,
                transactionCurrencyCode: G_formData.transactionCurrencyCode,
                remarks: G_formData.remarks ? [{ remarks: G_formData.remarks }] : undefined,
            });
            if (!response) {
                throw new Error("No response received from the preprocess API (Error Code: CBW-010).");
            }
            setPreprocessData(response);
        } catch (err: any) {
            const errorResponse: ErrorResponse = JSON.parse(err.message || '{}');
            setError(`Pre-process failed: ${errorResponse.details || 'An error occurred during the pre-processing of your transfer. Please check your input and try again (Error Code: CBW-011).'} `);
        } finally {
            setIsLoading(false);
        }
    }, [api, accessToken, uuid, G_formData]);

    // --- Feature 4: Confirm Wire Transfer (James Burvel O’Callaghan III Code - JBO3C) ---
    const O_handleConfirm = useCallback(async () => {
        if (!api || !accessToken || !H_preprocessData?.controlFlowId) {
            setError("Cannot confirm: Missing required data. Please ensure the pre-process step was completed successfully (Error Code: CBW-012).");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.confirmCrossBorderTransfer(accessToken, uuid, {
                controlFlowId: H_preprocessData.controlFlowId,
            });
            if (!response) {
                throw new Error("No response received from the confirmation API (Error Code: CBW-013).");
            }
            setConfirmationData(response);
            setPreprocessData(null);
        } catch (err: any) {
            const errorResponse: ErrorResponse = JSON.parse(err.message || '{}');
            setError(`Confirmation failed: ${errorResponse.details || 'An error occurred while confirming your transfer. Please contact support and provide error code CBW-014.'}`);
        } finally {
            setIsLoading(false);
        }
    }, [api, accessToken, uuid, H_preprocessData]);

    // --- Feature 5: Reset Flow (James Burvel O’Callaghan III Code - JBO3C) ---
    const P_resetFlow = () => {
        setFormData(C_initialFormData);
        setPreprocessData(null);
        setConfirmationData(null);
        setError(null);
    };

    // --- Feature 6: Render Content Logic (James Burvel O’Callaghan III Code - JBO3C) ---
    const Q_renderContent = () => {
        if (J_isLoading && !F_eligibilityData) {
            return <p style={{ fontSize: '1.1rem', color: '#555', textAlign: 'center' }}>Loading eligibility data... Please wait (Status: Retrieving Account Information - Code: CBW-015).</p>;
        }
        if (K_error && !H_preprocessData && !I_confirmationData) {
            return <div style={D_styles.error}>{K_error}</div>;
        }
        if (!F_eligibilityData) {
            return <p style={{ fontSize: '1.1rem', color: '#555', textAlign: 'center' }}>No eligibility data found or failed to load. Please refresh the page or contact support (Error Code: CBW-016).</p>;
        }
        if (I_confirmationData) {
            return (
                <div style={D_styles.success}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.8rem' }}>Transfer Successful!</h3>
                    <p style={{ fontSize: '1.1rem', marginBottom: '0.6rem' }}>Your transaction has been submitted and is being processed. (Transaction ID: {I_confirmationData.transactionReferenceId} - Code: CBW-017)</p>
                    <p style={{ fontSize: '1.1rem', marginBottom: '0.6rem' }}><strong>Reference ID:</strong> {I_confirmationData.transactionReferenceId}</p>
                    <p style={{ fontSize: '1.1rem', marginBottom: '0.6rem' }}><strong>From Account:</strong> {I_confirmationData.sourceAccountDetails.displaySourceAccountNumber}</p>
                    <button style={D_styles.resetButton} onClick={P_resetFlow}>Start New Cross-Border Transfer</button>
                </div>
            );
        }
        if (H_preprocessData) {
            return (
                <div style={D_styles.infoBox}>
                    <h3 style={D_styles.infoTitle}>Review Your Transfer Details</h3>
                    {K_error && <div style={D_styles.error}>{K_error}</div>}
                    <div style={D_styles.infoDetail}>
                        <span>Debit Amount:</span>
                        <strong>{H_preprocessData.debitDetails?.transactionDebitAmount} {H_preprocessData.debitDetails?.currencyCode}</strong>
                    </div>
                    <div style={D_styles.infoDetail}>
                        <span>Credit Amount:</span>
                        <strong>{H_preprocessData.creditDetails?.transactionCreditAmount} {H_preprocessData.creditDetails?.currencyCode}</strong>
                    </div>
                    {H_preprocessData.foreignExchangeRate && (
                        <div style={D_styles.infoDetail}>
                            <span>Exchange Rate:</span>
                            <strong>{H_preprocessData.foreignExchangeRate}</strong>
                        </div>
                    )}
                    {H_preprocessData.transactionFee && (
                        <div style={D_styles.infoDetail}>
                            <span>Transaction Fee:</span>
                            <strong>{H_preprocessData.transactionFee} {H_preprocessData.feeCurrencyCode}</strong>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.8rem' }}>
                        <button style={D_styles.backButton} onClick={() => setPreprocessData(null)}>Back</button>
                        <button style={J_isLoading ? { ...D_styles.button, ...D_styles.buttonDisabled } : D_styles.button} onClick={O_handleConfirm} disabled={J_isLoading}>
                            {J_isLoading ? 'Confirming...' : 'Confirm Transfer'}
                        </button>
                    </div>
                </div>
            );
        }
        return (
            <form onSubmit={N_handlePreprocess} style={D_styles.form}>
                <div style={D_styles.formGroup}>
                    <label htmlFor="sourceAccountId" style={D_styles.label}>From Account</label>
                    <select
                        id="sourceAccountId"
                        name="sourceAccountId"
                        value={G_formData.sourceAccountId}
                        onChange={M_handleInputChange}
                        required
                        style={D_styles.select}
                    >
                        <option value="" disabled>Select a source account (Code: CBW-018)</option>
                        {F_eligibilityData.sourceAccounts.map(acc => (
                            <option key={acc.sourceAccountId} value={acc.sourceAccountId}>
                                {acc.productName} - {acc.displaySourceAccountNumber} ({acc.availableBalance} {acc.sourceAccountCurrencyCode})
                            </option>
                        ))}
                    </select>
                </div>
                <div style={D_styles.formGroup}>
                    <label htmlFor="payeeId" style={D_styles.label}>To Payee</label>
                    <select
                        id="payeeId"
                        name="payeeId"
                        value={G_formData.payeeId}
                        onChange={M_handleInputChange}
                        required
                        style={D_styles.select}
                    >
                        <option value="" disabled>Select a payee (Code: CBW-019)</option>
                        {F_eligibilityData.payees.map(payee => (
                            <option key={payee.payeeId} value={payee.payeeId}>
                                {payee.payeeNickName} ({payee.displayPayeeAccountNumber})
                            </option>
                        ))}
                    </select>
                </div>
                <div style={D_styles.formGroup}>
                    <label htmlFor="transactionAmount" style={D_styles.label}>Amount</label>
                    <input
                        type="number"
                        id="transactionAmount"
                        name="transactionAmount"
                        value={G_formData.transactionAmount}
                        onChange={M_handleInputChange}
                        placeholder="e.g., 100.00"
                        required
                        min="0.01"
                        step="0.01"
                        style={D_styles.input}
                    />
                </div>
                <div style={D_styles.formGroup}>
                    <label htmlFor="transactionCurrencyCode" style={D_styles.label}>Currency</label>
                    <input
                        type="text"
                        id="transactionCurrencyCode"
                        name="transactionCurrencyCode"
                        value={G_formData.transactionCurrencyCode}
                        onChange={M_handleInputChange}
                        placeholder="e.g., EUR"
                        required
                        maxLength={3}
                        style={D_styles.input}
                    />
                </div>
                <div style={D_styles.formGroup}>
                    <label htmlFor="remarks" style={D_styles.label}>Remarks (Optional)</label>
                    <input
                        type="text"
                        id="remarks"
                        name="remarks"
                        value={G_formData.remarks}
                        onChange={M_handleInputChange}
                        placeholder="Payment for invoice #123 (Code: CBW-020)"
                        style={D_styles.input}
                    />
                </div>
                <button type="submit" style={J_isLoading ? { ...D_styles.button, ...D_styles.buttonDisabled } : D_styles.button} disabled={J_isLoading}>
                    {J_isLoading ? 'Processing...' : 'Review Transfer'}
                </button>
            </form>
        );
    };

    // --- Feature 7: Main Render Component (James Burvel O’Callaghan III Code - JBO3C) ---
    return (
        <div style={D_styles.container}>
            <div style={D_styles.header}>
                <h2 style={D_styles.headerTitle}>Cross-Border Wire Transfer</h2>
                <p style={D_styles.headerSubtitle}>Initiate and manage international money transfers with ease. This tool is designed for expert users. (Code: CBW-021)</p>
            </div>
            {Q_renderContent()}
        </div>
    );
};

// --- The James Burvel O’Callaghan III Code: Additional Features and Enhancements ---

// --- Feature 8: Validation Function - ensuring valid input
const R_validateInput = (input: string, type: 'amount' | 'currency'): boolean => {
    if (type === 'amount') {
        const amount = parseFloat(input);
        return !isNaN(amount) && amount > 0;
    } else if (type === 'currency') {
        return /^[A-Z]{3}$/.test(input);
    }
    return false;
};

// --- Feature 9: Error Handling with detailed error codes (James Burvel O’Callaghan III Code - JBO3C) ---
const S_handleError = (error: Error, errorCode: string): string => {
    const errorDetails = (error.message || 'An unexpected error occurred.') + ` (Error Code: ${errorCode})`;
    console.error(errorDetails);
    return errorDetails;
};

// --- Feature 10: Advanced Form Field Validation (James Burvel O’Callaghan III Code - JBO3C) ---
const T_validateFormFields = (formData: B_FormData): boolean => {
    if (!formData.sourceAccountId || formData.sourceAccountId.trim() === "") return false;
    if (!formData.payeeId || formData.payeeId.trim() === "") return false;
    if (!R_validateInput(formData.transactionAmount, 'amount')) return false;
    if (!R_validateInput(formData.transactionCurrencyCode, 'currency')) return false;
    return true;
};

// --- Feature 11: Real-time currency conversion (James Burvel O’Callaghan III Code - JBO3C) ---
// Note: Requires integration with a real-time FX API.  This is a placeholder.
const U_getExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<number | null> => {
    // Replace with actual API call
    if (fromCurrency === toCurrency) return 1;
    // Simulate some logic
    if (fromCurrency === "USD" && toCurrency === "EUR") return 0.92;
    if (fromCurrency === "EUR" && toCurrency === "USD") return 1.09;
    return null;
};

// --- Feature 12: Transaction Summary Component (James Burvel O’Callaghan III Code - JBO3C) ---
interface V_TransactionSummaryProps {
    debitAmount: string;
    debitCurrency: string;
    creditAmount: string;
    creditCurrency: string;
    exchangeRate?: number;
    transactionFee?: string;
    feeCurrency?: string;
}

const W_TransactionSummary: React.FC<V_TransactionSummaryProps> = ({ debitAmount, debitCurrency, creditAmount, creditCurrency, exchangeRate, transactionFee, feeCurrency }) => {
    return (
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '15px', backgroundColor: '#f9f9f9' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>Transaction Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Debit Amount:</span>
                <span>{debitAmount} {debitCurrency}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Credit Amount:</span>
                <span>{creditAmount} {creditCurrency}</span>
            </div>
            {exchangeRate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Exchange Rate:</span>
                    <span>{exchangeRate.toFixed(4)}</span>
                </div>
            )}
            {transactionFee && feeCurrency && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Transaction Fee:</span>
                    <span>{transactionFee} {feeCurrency}</span>
                </div>
            )}
        </div>
    );
};

// --- Feature 13: Detailed Error Display - Component (James Burvel O’Callaghan III Code - JBO3C) ---
interface X_ErrorDisplayProps {
    errorMessage: string;
}
const Y_ErrorDisplay: React.FC<X_ErrorDisplayProps> = ({ errorMessage }) => {
    return (
        <div style={D_styles.error}>
            <p>{errorMessage}</p>
        </div>
    );
};

// --- Feature 14: Success Display - Component (James Burvel O’Callaghan III Code - JBO3C) ---
interface Z_SuccessDisplayProps {
    message: string;
    referenceId?: string;
    onReset: () => void;
}
const AA_SuccessDisplay: React.FC<Z_SuccessDisplayProps> = ({ message, referenceId, onReset }) => {
    return (
        <div style={D_styles.success}>
            <p>{message}</p>
            {referenceId && <p><strong>Transaction Reference ID:</strong> {referenceId}</p>}
            <button style={D_styles.resetButton} onClick={onReset}>Start New Transfer</button>
        </div>
    );
};

// --- The James Burvel O’Callaghan III Code: Company-Specific API Endpoints (100+) ---

// --- Company 1: AlphaCorp Financial - API Endpoint 1
const AB_alphaCorpRetrieveSourceAccounts = async (accessToken: string, uuid: string): Promise<SourceAccountsCrossBorderWireTransfer[]> => {
    // Simulated API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        { sourceAccountId: 'AC123', productName: 'AlphaCorp Checking', displaySourceAccountNumber: '1234-5678-9012', availableBalance: 10000, sourceAccountCurrencyCode: 'USD' },
        { sourceAccountId: 'AC456', productName: 'AlphaCorp Savings', displaySourceAccountNumber: '9876-5432-1098', availableBalance: 5000, sourceAccountCurrencyCode: 'EUR' },
    ];
};

// --- Company 1: AlphaCorp Financial - API Endpoint 2
const AC_alphaCorpRetrievePayees = async (accessToken: string, uuid: string): Promise<PayeeSourceAccountCombinationsCrossBorderWireTransfer[]> => {
    // Simulated API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        { payeeId: 'PAY123', payeeNickName: 'John Doe - UK', displayPayeeAccountNumber: 'GB123456789012345678', sourceAccountCurrencyCode: 'GBP' },
        { payeeId: 'PAY456', payeeNickName: 'Jane Smith - CA', displayPayeeAccountNumber: 'CA123456789012345678', sourceAccountCurrencyCode: 'CAD' },
    ];
};

// --- Company 1: AlphaCorp Financial - API Endpoint 3
const AD_alphaCorpPreprocessTransfer = async (accessToken: string, uuid: string, data: { sourceAccountId: string; payeeId: string; transactionAmount: number; transactionCurrencyCode: string; remarks?: { remarks: string }[] }): Promise<CrossBorderWireTransfersPreprocessResponse> => {
    await new Promise(resolve => setTimeout(resolve, 700));
    const exchangeRate = await U_getExchangeRate(data.transactionCurrencyCode, 'USD') || 1;
    return {
        controlFlowId: 'CF-ALPHACORP-12345',
        debitDetails: {
            transactionDebitAmount: data.transactionAmount.toString(),
            currencyCode: data.transactionCurrencyCode,
        },
        creditDetails: {
            transactionCreditAmount: (data.transactionAmount * exchangeRate).toString(),
            currencyCode: 'USD',
        },
        foreignExchangeRate: exchangeRate.toFixed(4),
        transactionFee: '25.00',
        feeCurrencyCode: 'USD',
    };
};

// --- Company 1: AlphaCorp Financial - API Endpoint 4
const AE_alphaCorpConfirmTransfer = async (accessToken: string, uuid: string, controlFlowId: string): Promise<CrossBorderWireTransfersResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        transactionReferenceId: 'TRX-ALPHACORP-98765',
        sourceAccountDetails: {
            displaySourceAccountNumber: '1234-5678-9012',
        },
    };
};

// --- Company 2: BetaFin Solutions - API Endpoint 5
const AF_betaFinRetrieveSourceAccounts = async (accessToken: string, uuid: string): Promise<SourceAccountsCrossBorderWireTransfer[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return [
        { sourceAccountId: 'BF111', productName: 'BetaFin Business', displaySourceAccountNumber: '2222-3333-4444', availableBalance: 15000, sourceAccountCurrencyCode: 'GBP' },
    ];
};

// --- Company 2: BetaFin Solutions - API Endpoint 6
const AG_betaFinRetrievePayees = async (accessToken: string, uuid: string): Promise<PayeeSourceAccountCombinationsCrossBorderWireTransfer[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return [
        { payeeId: 'PAY789', payeeNickName: 'Peter Jones - DE', displayPayeeAccountNumber: 'DE98765432109876543210', sourceAccountCurrencyCode: 'EUR' },
    ];
};

// --- Company 2: BetaFin Solutions - API Endpoint 7
const AH_betaFinPreprocessTransfer = async (accessToken: string, uuid: string, data: { sourceAccountId: string; payeeId: string; transactionAmount: number; transactionCurrencyCode: string; remarks?: { remarks: string }[] }): Promise<CrossBorderWireTransfersPreprocessResponse> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const exchangeRate = await U_getExchangeRate(data.transactionCurrencyCode, 'EUR') || 1;
    return {
        controlFlowId: 'CF-BETAFIN-67890',
        debitDetails: {
            transactionDebitAmount: data.transactionAmount.toString(),
            currencyCode: data.transactionCurrencyCode,
        },
        creditDetails: {
            transactionCreditAmount: (data.transactionAmount * exchangeRate).toString(),
            currencyCode: 'EUR',
        },
        foreignExchangeRate: exchangeRate.toFixed(4),
        transactionFee: '20.00',
        feeCurrencyCode: 'EUR',
    };
};

// --- Company 2: BetaFin Solutions - API Endpoint 8
const AI_betaFinConfirmTransfer = async (accessToken: string, uuid: string, controlFlowId: string): Promise<CrossBorderWireTransfersResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1100));
    return {
        transactionReferenceId: 'TRX-BETAFIN-12345',
        sourceAccountDetails: {
            displaySourceAccountNumber: '2222-3333-4444',
        },
    };
};

// --- Company 3: GammaGlobal Payments - API Endpoint 9
const AJ_gammaGlobalRetrieveSourceAccounts = async (accessToken: string, uuid: string): Promise<SourceAccountsCrossBorderWireTransfer[]> => {
    await new Promise(resolve => setTimeout(resolve, 700));
    return [
        { sourceAccountId: 'GG222', productName: 'GammaGlobal Corporate', displaySourceAccountNumber: '5555-6666-7777', availableBalance: 20000, sourceAccountCurrencyCode: 'CAD' },
    ];
};

// --- Company 3: GammaGlobal Payments - API Endpoint 10
const AK_gammaGlobalRetrievePayees = async (accessToken: string, uuid: string): Promise<PayeeSourceAccountCombinationsCrossBorderWireTransfer[]> => {
    await new Promise(resolve => setTimeout(resolve, 700));
    return [
        { payeeId: 'PAY012', payeeNickName: 'Maria Garcia - ES', displayPayeeAccountNumber: 'ES01234567890123456789', sourceAccountCurrencyCode: 'EUR' },
    ];
};

// --- Company 3: GammaGlobal Payments - API Endpoint 11
const AL_gammaGlobalPreprocessTransfer = async (accessToken: string, uuid: string, data: { sourceAccountId: string; payeeId: string; transactionAmount: number; transactionCurrencyCode: string; remarks?: { remarks: string }[] }): Promise<CrossBorderWireTransfersPreprocessResponse> => {
    await new Promise(resolve => setTimeout(resolve, 900));
    const exchangeRate = await U_getExchangeRate(data.transactionCurrencyCode, 'CAD') || 1;
    return {
        controlFlowId: 'CF-GAMMAGLOBAL-23456',
        debitDetails: {
            transactionDebitAmount: data.transactionAmount.toString(),
            currencyCode: data.transactionCurrencyCode,
        },
        creditDetails: {
            transactionCreditAmount: (data.transaction