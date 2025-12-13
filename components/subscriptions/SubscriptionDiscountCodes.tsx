import React, { useState, useEffect } from 'react';

interface DiscountCode {
  id: string;
  code: string;
  percentage: number;
  expiryDate: Date | null;
}

interface SubscriptionDiscountCodesProps {
  subscriptionId: string;
  initialDiscountCodes?: DiscountCode[];
  onDiscountCodesChange: (discountCodes: DiscountCode[]) => void;
}

const SubscriptionDiscountCodes: React.FC<SubscriptionDiscountCodesProps> = ({
  subscriptionId,
  initialDiscountCodes = [],
  onDiscountCodesChange,
}) => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>(initialDiscountCodes);
  const [newCode, setNewCode] = useState('');
  const [newPercentage, setNewPercentage] = useState<number>(0);
  const [newExpiryDate, setNewExpiryDate] = useState<string>('');

  useEffect(() => {
    onDiscountCodesChange(discountCodes);
  }, [discountCodes, onDiscountCodesChange]);

  const handleAddDiscountCode = () => {
    if (!newCode || newPercentage <= 0 || newPercentage > 100) {
      alert('Please enter a valid discount code, percentage (1-100), and expiry date.');
      return;
    }

    const expiry = newExpiryDate ? new Date(newExpiryDate) : null;

    const newDiscountCode: DiscountCode = {
      id: Date.now().toString(), // Simple unique ID generation
      code: newCode.trim(),
      percentage: newPercentage,
      expiryDate: expiry,
    };

    setDiscountCodes([...discountCodes, newDiscountCode]);
    setNewCode('');
    setNewPercentage(0);
    setNewExpiryDate('');
  };

  const handleRemoveDiscountCode = (id: string) => {
    setDiscountCodes(discountCodes.filter((code) => code.id !== id));
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setNewPercentage(isNaN(value) ? 0 : value);
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewExpiryDate(e.target.value);
  };

  return (
    <div className="subscription-discount-codes">
      <h3>Discount Codes for Subscription: {subscriptionId}</h3>
      {discountCodes.length === 0 ? (
        <p>No discount codes applied yet.</p>
      ) : (
        <ul>
          {discountCodes.map((code) => (
            <li key={code.id}>
              <strong>{code.code}</strong> - {code.percentage}% off
              {code.expiryDate && (
                <span>
                  {' '}
                  (Expires: {code.expiryDate.toLocaleDateString()})
                </span>
              )}
              <button onClick={() => handleRemoveDiscountCode(code.id)} className="remove-button">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="add-discount-form">
        <h4>Add New Discount Code</h4>
        <input
          type="text"
          placeholder="Discount Code"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
        />
        <input
          type="number"
          placeholder="Percentage (1-100)"
          value={newPercentage}
          onChange={handlePercentageChange}
          min="1"
          max="100"
        />
        <input
          type="date"
          placeholder="Expiry Date (Optional)"
          value={newExpiryDate}
          onChange={handleExpiryDateChange}
        />
        <button onClick={handleAddDiscountCode}>Add Code</button>
      </div>

      <style jsx>{`
        .subscription-discount-codes {
          border: 1px solid #ccc;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
        }
        .subscription-discount-codes h3 {
          margin-top: 0;
          color: #333;
        }
        .subscription-discount-codes ul {
          list-style: none;
          padding: 0;
        }
        .subscription-discount-codes li {
          background-color: #f9f9f9;
          padding: 10px;
          margin-bottom: 5px;
          border-radius: 3px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .subscription-discount-codes li .remove-button {
          background-color: #ff4d4f;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.8em;
        }
        .add-discount-form {
          margin-top: 15px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .add-discount-form input {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 3px;
        }
        .add-discount-form button {
          background-color: #1890ff;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 3px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionDiscountCodes;