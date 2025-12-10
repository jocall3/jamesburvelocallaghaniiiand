import React, { useState, useEffect, FormEvent } from 'react';

// --- Interfaces (could be in a shared types file in a real project) ---
interface Payee {
  id: string;
  name: string;
  accountNumber: string; // Could be masked for display
  address: string;
}

interface BillPayment {
  id: string;
  payeeId: string;
  payeeName: string; // Denormalized for display convenience
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: 'Scheduled' | 'Processing' | 'Paid' | 'Cancelled' | 'Failed';
  frequency: 'One-time' | 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Quarterly' | 'Annually';
  nextPaymentDate: string; // YYYY-MM-DD - The date the next payment is due/will be processed
  confirmationNumber?: string;
}

// --- Mock API Service (would be a real API client in a production environment) ---
// This simulates network requests and server-side logic.
const mockApi = {
  fetchPayees: async (): Promise<Payee[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'p1', name: 'Utility Company', accountNumber: 'XXXX-XXXX-789', address: '123 Main St, Anytown, USA' },
          { id: 'p2', name: 'Internet Provider', accountNumber: 'XXXX-XXXX-321', address: '456 Oak Ave, Anytown, USA' },
          { id: 'p3', name: 'Credit Card Co.', accountNumber: 'XXXX-XXXX-455', address: '789 Pine Ln, Anytown, USA' },
        ]);
      }, 500); // Simulate network delay
    });
  },
  fetchBillPayments: async (): Promise<BillPayment[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'bp1',
            payeeId: 'p1',
            payeeName: 'Utility Company',
            amount: 75.50,
            dueDate: '2023-11-15',
            status: 'Scheduled',
            frequency: 'Monthly',
            nextPaymentDate: '2023-11-15',
          },
          {
            id: 'bp2',
            payeeId: 'p2',
            payeeName: 'Internet Provider',
            amount: 60.00,
            dueDate: '2023-11-20',
            status: 'Scheduled',
            frequency: 'Monthly',
            nextPaymentDate: '2023-11-20',
          },
          {
            id: 'bp3',
            payeeId: 'p3',
            payeeName: 'Credit Card Co.',
            amount: 250.00,
            dueDate: '2023-10-28',
            status: 'Paid',
            frequency: 'One-time',
            nextPaymentDate: '2023-10-28',
            confirmationNumber: 'CONF12345'
          },
        ]);
      }, 700); // Simulate network delay
    });
  },
  scheduleBillPayment: async (payment: Omit<BillPayment, 'id' | 'status' | 'confirmationNumber'>): Promise<BillPayment> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPayment: BillPayment = {
          ...payment,
          id: `bp${Date.now()}`, // Generate a unique ID
          status: 'Scheduled',
          confirmationNumber: undefined,
        };
        resolve(newPayment);
      }, 600); // Simulate network delay
    });
  },
  updateBillPayment: async (payment: BillPayment): Promise<BillPayment> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real scenario, the backend would handle status changes.
        // Here, we assume an update resets the status to 'Scheduled' if it was 'Paid' or 'Processing'.
        resolve({ ...payment, status: 'Scheduled' });
      }, 600); // Simulate network delay
    });
  },
  cancelBillPayment: async (paymentId: string): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 400); // Simulate network delay
    });
  },
};

// --- Helper for date formatting ---
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// --- BillPayManagement Component ---
const BillPayManagement: React.FC = () => {
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<BillPayment | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [fetchedPayments, fetchedPayees] = await Promise.all([
          mockApi.fetchBillPayments(),
          mockApi.fetchPayees(),
        ]);
        setPayments(fetchedPayments);
        setPayees(fetchedPayees);
      } catch (err) {
        setError('Failed to load bill payments or payees. Please try again.');
        console.error('Error fetching bill pay data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handler to open modal for scheduling a new payment
  const handleScheduleNewPayment = () => {
    setEditingPayment(null); // Clear any existing editing state
    setShowModal(true);
  };

  // Handler to open modal for editing an existing payment
  const handleEditPayment = (payment: BillPayment) => {
    setEditingPayment(payment);
    setShowModal(true);
  };

  // Handler to cancel a scheduled payment
  const handleCancelPayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this payment? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await mockApi.cancelBillPayment(paymentId);
      setPayments(prev => prev.filter(p => p.id !== paymentId)); // Remove from UI
      setFeedbackMessage('Payment cancelled successfully!');
    } catch (err) {
      setError('Failed to cancel payment. Please try again.');
      console.error('Error cancelling payment:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMessage(null), 3000); // Clear feedback after 3 seconds
    }
  };

  // Handler to save (schedule or update) a payment
  const handleSavePayment = async (paymentData: Omit<BillPayment, 'id' | 'status' | 'confirmationNumber'> | BillPayment) => {
    setLoading(true);
    setError(null);
    try {
      if ('id' in paymentData && editingPayment) { // It's an update operation
        const updatedPayment = await mockApi.updateBillPayment(paymentData as BillPayment);
        setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
        setFeedbackMessage('Payment updated successfully!');
      } else { // It's a new schedule operation
        const newPayment = await mockApi.scheduleBillPayment(paymentData as Omit<BillPayment, 'id' | 'status' | 'confirmationNumber'>);
        setPayments(prev => [...prev, newPayment]);
        setFeedbackMessage('Payment scheduled successfully!');
      }
      setShowModal(false); // Close modal on success
      setEditingPayment(null); // Clear editing state
    } catch (err) {
      setError('Failed to save payment. Please try again.');
      console.error('Error saving payment:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMessage(null), 3000); // Clear feedback after 3 seconds
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Bank of America Bill Pay Management</h2>

      {feedbackMessage && (
        <div style={styles.feedbackMessage} role="status" aria-live="polite">
          {feedbackMessage}
        </div>
      )}

      {loading && <p style={styles.loading}>Loading bill payments...</p>}
      {error && <p style={styles.error} role="alert" aria-live="assertive">{error}</p>}

      {!loading && !error && (
        <>
          <div style={styles.sectionHeader}>
            <h3>Scheduled & Recent Payments</h3>
            <button onClick={handleScheduleNewPayment} style={styles.primaryButton}>
              Schedule New Payment
            </button>
          </div>

          {payments.length === 0 ? (
            <p style={styles.noPayments}>No bill payments found. Click "Schedule New Payment" to get started.</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Payee</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Next Payment Date</th>
                    <th style={styles.th}>Frequency</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} style={styles.tr}>
                      <td style={styles.td}>{payment.payeeName}</td>
                      <td style={styles.td}>${payment.amount.toFixed(2)}</td>
                      <td style={styles.td}>{formatDate(payment.nextPaymentDate)}</td>
                      <td style={styles.td}>{payment.frequency}</td>
                      <td style={styles.td}>{payment.status}</td>
                      <td style={styles.td}>
                        {payment.status === 'Scheduled' && (
                          <>
                            <button onClick={() => handleEditPayment(payment)} style={styles.actionButton} aria-label={`Edit payment for ${payment.payeeName}`}>Edit</button>
                            <button onClick={() => handleCancelPayment(payment.id)} style={{ ...styles.actionButton, ...styles.cancelButton }} aria-label={`Cancel payment for ${payment.payeeName}`}>Cancel</button>
                          </>
                        )}
                        {payment.status === 'Paid' && payment.confirmationNumber && (
                          <span style={styles.confirmationText}>Conf: {payment.confirmationNumber}</span>
                        )}
                        {(payment.status === 'Processing' || payment.status === 'Failed') && (
                          <span style={styles.statusText}>{payment.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showModal && (
        <PaymentModal
          onClose={() => {
            setShowModal(false);
            setEditingPayment(null); // Ensure editing state is cleared when modal closes
          }}
          onSave={handleSavePayment}
          payees={payees}
          initialPayment={editingPayment}
          isLoading={loading} // Pass main loading state to disable modal inputs during API calls
        />
      )}
    </div>
  );
};

// --- PaymentModal Component (for scheduling/editing bill payments) ---
interface PaymentModalProps {
  onClose: () => void;
  onSave: (payment: Omit<BillPayment, 'id' | 'status' | 'confirmationNumber'> | BillPayment) => void;
  payees: Payee[];
  initialPayment: BillPayment | null;
  isLoading: boolean; // Indicates if a save/update operation is in progress
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSave, payees, initialPayment, isLoading }) => {
  const [selectedPayeeId, setSelectedPayeeId] = useState(initialPayment?.payeeId || '');
  const [amount, setAmount] = useState(initialPayment?.amount.toFixed(2) || '');
  const [dueDate, setDueDate] = useState(initialPayment?.dueDate || new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState<BillPayment['frequency']>(initialPayment?.frequency || 'One-time');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null); // Clear previous errors

    // Client-side validation
    if (!selectedPayeeId || !amount || !dueDate || !frequency) {
      setFormError('All fields are required.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Amount must be a positive number.');
      return;
    }

    const selectedPayee = payees.find(p => p.id === selectedPayeeId);
    if (!selectedPayee) {
      setFormError('Selected payee not found. Please select a valid payee.');
      return;
    }

    // Construct payment data
    const paymentData: Omit<BillPayment, 'id' | 'status' | 'confirmationNumber'> = {
      payeeId: selectedPayeeId,
      payeeName: selectedPayee.name,
      amount: parsedAmount,
      dueDate: dueDate,
      frequency: frequency,
      nextPaymentDate: dueDate, // For simplicity, nextPaymentDate is dueDate.
                                // In a real app, recurring payments would have complex logic here.
    };

    if (initialPayment) {
      // If editing, merge with initial payment data (preserving ID, etc.)
      onSave({ ...initialPayment, ...paymentData });
    } else {
      // If scheduling new, just pass the new data
      onSave(paymentData);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute of date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={modalStyles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div style={modalStyles.modalContent}>
        <h3 id="modal-title" style={modalStyles.header}>
          {initialPayment ? 'Edit Bill Payment' : 'Schedule New Bill Payment'}
        </h3>
        <form onSubmit={handleSubmit} style={modalStyles.form}>
          {formError && <p style={styles.error} role="alert">{formError}</p>}

          <div style={modalStyles.formGroup}>
            <label htmlFor="payee" style={modalStyles.label}>Payee:</label>
            <select
              id="payee"
              value={selectedPayeeId}
              onChange={(e) => setSelectedPayeeId(e.target.value)}
              required
              style={modalStyles.input}
              disabled={isLoading}
              aria-required="true"
            >
              <option value="">Select a Payee</option>
              {payees.map((payee) => (
                <option key={payee.id} value={payee.id}>
                  {payee.name} (Acct: {payee.accountNumber})
                </option>
              ))}
            </select>
          </div>

          <div style={modalStyles.formGroup}>
            <label htmlFor="amount" style={modalStyles.label}>Amount ($):</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              required
              style={modalStyles.input}
              disabled={isLoading}
              aria-required="true"
              aria-describedby="amount-help"
            />
            <small id="amount-help" style={modalStyles.helpText}>Enter the amount to pay (e.g., 75.50)</small>
          </div>

          <div style={modalStyles.formGroup}>
            <label htmlFor="dueDate" style={modalStyles.label}>Due Date:</label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              style={modalStyles.input}
              min={today} // Cannot schedule for past dates
              disabled={isLoading}
              aria-required="true"
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label htmlFor="frequency" style={modalStyles.label}>Frequency:</label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as BillPayment['frequency'])}
              required
              style={modalStyles.input}
              disabled={isLoading}
              aria-required="true"
            >
              <option value="One-time">One-time</option>
              <option value="Weekly">Weekly</option>
              <option value="Bi-weekly">Bi-weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annually">Annually</option>
            </select>
          </div>

          <div style={modalStyles.buttonGroup}>
            <button type="submit" style={styles.primaryButton} disabled={isLoading}>
              {isLoading ? 'Saving...' : (initialPayment ? 'Update Payment' : 'Schedule Payment')}
            </button>
            <button type="button" onClick={onClose} style={styles.secondaryButton} disabled={isLoading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Basic Inline Styles (for demonstration purposes; in a real project, use CSS modules, styled-components, or a UI library) ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '900px',
    margin: '20px auto',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    color: '#333',
  },
  header: {
    color: '#0056b3',
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.2s ease',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.2s ease',
    marginLeft: '10px',
  },
  actionButton: {
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    marginRight: '5px',
    transition: 'background-color 0.2s ease',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  loading: {
    textAlign: 'center',
    color: '#007bff',
    fontSize: '1.1rem',
    padding: '20px',
  },
  error: {
    textAlign: 'center',
    color: '#dc3545',
    fontWeight: 'bold',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '5px',
    padding: '10px',
    marginBottom: '15px',
  },
  feedbackMessage: {
    textAlign: 'center',
    color: '#155724',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '5px',
    padding: '10px',
    marginBottom: '15px',
  },
  noPayments: {
    textAlign: 'center',
    color: '#6c757d',
    padding: '20px',
    border: '1px dashed #ced4da',
    borderRadius: '5px',
    marginTop: '20px',
  },
  tableWrapper: {
    overflowX: 'auto', // Ensures table is scrollable on small screens
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  th: {
    backgroundColor: '#e9ecef',
    padding: '12px 15px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    color: '#495057',
  },
  td: {
    padding: '12px 15px',
    borderBottom: '1px solid #dee2e6',
    verticalAlign: 'middle',
  },
  tr: {
    transition: 'background-color 0.2s ease',
  },
  confirmationText: {
    fontSize: '0.9rem',
    color: '#6c757d',
  },
  statusText: {
    fontSize: '0.9rem',
    color: '#ffc107', // Example color for processing/failed
    fontWeight: 'bold',
  }
};

const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    width: '90%',
    maxWidth: '500px',
    position: 'relative',
  },
  header: {
    color: '#0056b3',
    marginBottom: '25px',
    textAlign: 'center',
    fontSize: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#343a40',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  helpText: {
    fontSize: '0.85rem',
    color: '#6c757d',
    marginTop: '5px',
    display: 'block',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
};

export default BillPayManagement;