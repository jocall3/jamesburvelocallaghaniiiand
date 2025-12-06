
import React, { useState, useEffect, useCallback } from 'react';
import {
  Payee,
  PayeeListResponse,
  PayeeDetailsResponse,
  useMoneyMovement,
} from './MoneyMovementProvider'; // Assuming MoneyMovementProvider is in the same directory or accessible path

interface CitibankPayeeManagementViewProps {
  onSelectPayee?: (payee: Payee) => void;
  onAddPayee?: () => void;
}

const CitibankPayeeManagementView: React.FC<CitibankPayeeManagementViewProps> = ({
  onSelectPayee,
  onAddPayee,
}) => {
  const { api, accessToken, uuid } = useMoneyMovement();
  const [payees, setPayees] = useState<Payee[]>([]);
  const [selectedPayeeDetails, setSelectedPayeeDetails] = useState<PayeeDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPayeeId, setSelectedPayeeId] = useState<string | null>(null);

  const fetchPayees = useCallback(async () => {
    if (!api || !accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response: PayeeListResponse = await api.retrievePayeeList(accessToken, uuid);
      setPayees(response.payeeList || []);
    } catch (err: any) {
      console.error('Error fetching payees:', err);
      setError(err.message || 'Failed to fetch payees.');
    } finally {
      setLoading(false);
    }
  }, [api, accessToken, uuid]);

  useEffect(() => {
    fetchPayees();
  }, [fetchPayees]);

  const handlePayeeClick = async (payeeId: string, payee: Payee) => {
    if (!api || !accessToken) return;
    setSelectedPayeeId(payeeId);
    setLoading(true);
    setError(null);
    try {
      const details: PayeeDetailsResponse = await api.retrievePayeeDetailsById(accessToken, uuid, payeeId);
      setSelectedPayeeDetails(details);
      if (onSelectPayee) {
        onSelectPayee(payee); // Pass the selected payee to the parent component
      }
    } catch (err: any) {
      console.error(`Error fetching details for payee ${payeeId}:`, err);
      setError(err.message || `Failed to fetch details for payee ${payeeId}.`);
      setSelectedPayeeDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayees = payees.filter((payee) =>
    payee.payeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payee.payeeNickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payee.payeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="citibank-payee-management">
      <h2>Payee Management</h2>

      <div className="payee-controls">
        <input
          type="text"
          placeholder="Search payees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button onClick={onAddPayee} className="add-payee-button">
          Add New Payee
        </button>
      </div>

      {loading && <p>Loading payees...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {!loading && !error && filteredPayees.length === 0 && (
        <p>No payees found.</p>
      )}

      {!loading && !error && filteredPayees.length > 0 && (
        <div className="payee-list">
          <h3>Your Payees</h3>
          <ul>
            {filteredPayees.map((payee) => (
              <li
                key={payee.payeeId}
                className={`payee-item ${selectedPayeeId === payee.payeeId ? 'selected' : ''}`}
                onClick={() => handlePayeeClick(payee.payeeId, payee)}
              >
                <div className="payee-info">
                  <strong>{payee.payeeName || payee.payeeNickname || 'Unnamed Payee'}</strong>
                  <br />
                  <small>Type: {payee.paymentType}</small>
                  {payee.displayAccountNumber && <small> | Account: {payee.displayAccountNumber}</small>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedPayeeDetails && (
        <div className="payee-details">
          <h3>Payee Details</h3>
          <pre>{JSON.stringify(selectedPayeeDetails, null, 2)}</pre>
          {/* You can render specific details here instead of raw JSON */}
          {/* Example:
          <p><strong>Name:</strong> {selectedPayeeDetails.internalDomesticPayee?.payeeName}</p>
          <p><strong>Nickname:</strong> {selectedPayeeDetails.internalDomesticPayee?.payeeNickName}</p>
          <p><strong>Account Number:</strong> {selectedPayeeDetails.internalDomesticPayee?.displayAccountNumber}</p>
          */}
        </div>
      )}
    </div>
  );
};

export default CitibankPayeeManagementView;
