import React, { useState, useEffect } from 'react';

interface CustomerContactInfoProps {
  customerId: string;
  initialPhoneNumber?: string;
  initialEmail?: string;
  onContactInfoChange?: (phoneNumber: string, email: string) => void;
}

const CustomerContactInfo: React.FC<CustomerContactInfoProps> = ({
  customerId,
  initialPhoneNumber = '',
  initialEmail = '',
  onContactInfoChange,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [email, setEmail] = useState(initialEmail);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setPhoneNumber(initialPhoneNumber);
    setEmail(initialEmail);
  }, [initialPhoneNumber, initialEmail]);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onContactInfoChange) {
      onContactInfoChange(phoneNumber, email);
    }
    // In a real application, you would also make an API call here to save the changes to the backend.
    console.log(`Saving contact info for customer ${customerId}: Phone: ${phoneNumber}, Email: ${email}`);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to initial values if cancel is pressed
    setPhoneNumber(initialPhoneNumber);
    setEmail(initialEmail);
  };

  return (
    <div className="customer-contact-info">
      <h3>Customer Contact Information</h3>
      {isEditing ? (
        <div className="edit-mode">
          <div className="form-group">
            <label htmlFor={`phone-${customerId}`}>Phone Number:</label>
            <input
              id={`phone-${customerId}`}
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="e.g., +1 (555) 123-4567"
            />
          </div>
          <div className="form-group">
            <label htmlFor={`email-${customerId}`}>Email:</label>
            <input
              id={`email-${customerId}`}
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="e.g., john.doe@example.com"
            />
          </div>
          <div className="actions">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="view-mode">
          <p>
            <strong>Phone:</strong> {phoneNumber || 'N/A'}
          </p>
          <p>
            <strong>Email:</strong> {email || 'N/A'}
          </p>
          <button onClick={() => setIsEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
};

export default CustomerContactInfo;