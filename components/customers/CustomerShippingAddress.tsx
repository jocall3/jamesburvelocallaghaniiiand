import React, { useState, useEffect } from 'react';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CustomerShippingAddressProps {
  customerId: string;
  initialAddress?: Address;
  onAddressChange?: (address: Address) => void;
  isEditable?: boolean;
}

const CustomerShippingAddress: React.FC<CustomerShippingAddressProps> = ({
  customerId,
  initialAddress,
  onAddressChange,
  isEditable = false,
}) => {
  const [address, setAddress] = useState<Address>(
    initialAddress || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    }
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
    }
  }, [initialAddress]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prevAddress) => ({
      ...prevAddress,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (onAddressChange) {
      onAddressChange(address);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Revert to initial address if available, otherwise reset to empty
    setAddress(initialAddress || { street: '', city: '', state: '', zipCode: '', country: '' });
    setIsEditing(false);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="customer-shipping-address">
      <h3>Shipping Address for Customer: {customerId}</h3>
      {isEditing ? (
        <div className="address-form">
          <div>
            <label htmlFor="street">Street:</label>
            <input
              type="text"
              id="street"
              name="street"
              value={address.street}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="city">City:</label>
            <input
              type="text"
              id="city"
              name="city"
              value={address.city}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="state">State/Province:</label>
            <input
              type="text"
              id="state"
              name="state"
              value={address.state}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="zipCode">Zip/Postal Code:</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={address.zipCode}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="country">Country:</label>
            <input
              type="text"
              id="country"
              name="country"
              value={address.country}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-actions">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="address-display">
          <p>
            {address.street}, {address.city}, {address.state} {address.zipCode},{' '}
            {address.country}
          </p>
          {isEditable && (
            <button onClick={toggleEdit}>Edit Address</button>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerShippingAddress;