
import React, { useState, FormEvent } from 'react';

// Based on the OpenAPI schema for external_account_create_request
interface ExternalAccountData {
  counterparty_id: string;
  name?: string;
  party_name: string;
  account_type?: 'cash' | 'checking' | 'loan' | 'non_resident' | 'other' | 'overdraft' | 'savings';
  party_type?: 'business' | 'individual';
  party_address?: {
    line1?: string;
    line2?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  account_details: Array<{
    account_number: string;
    account_number_type: 'iban' | 'clabe' | 'wallet_address' | 'pan' | 'other';
  }>;
  routing_details: Array<{
    routing_number: string;
    routing_number_type: 'aba' | 'swift' | 'au_bsb' | 'ca_cpa' | 'cnaps' | 'gb_sort_code' | 'in_ifsc' | 'my_branch_code' | 'br_codigo';
    payment_type?: 'ach' | 'au_becs' | 'bacs' | 'book' | 'card' | 'check' | 'eft' | 'cross_border' | 'interac' | 'masav' | 'neft' | 'provxchange' | 'rtp' | 'sen' | 'sepa' | 'signet' | 'wire';
  }>;
}

interface Counterparty {
  id: string;
  name: string;
}

interface ExternalAccountFormProps {
  counterparties: Counterparty[];
  onSubmit: (data: ExternalAccountData) => void;
  onCancel: () => void;
}

const initialFormData: ExternalAccountData = {
  counterparty_id: '',
  name: '',
  party_name: '',
  account_type: 'checking',
  party_type: 'business',
  party_address: {
    line1: '',
    line2: '',
    locality: '',
    region: '',
    postal_code: '',
    country: 'US',
  },
  account_details: [{ account_number: '', account_number_type: 'other' }],
  routing_details: [{ routing_number: '', routing_number_type: 'aba', payment_type: 'ach' }],
};

const formStyles: { [key: string]: React.CSSProperties } = {
  form: { display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px', margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' },
  fieldset: { display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #ddd', borderRadius: '4px', padding: '15px' },
  legend: { fontWeight: 'bold', padding: '0 5px', color: '#333' },
  label: { display: 'flex', flexDirection: 'column', gap: '5px', fontWeight: '500', fontSize: '14px' },
  input: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
  select: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
  button: { padding: '10px 15px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#007bff', color: 'white' },
  cancelButton: { backgroundColor: '#6c757d', color: 'white' },
  addButton: { backgroundColor: '#28a745', color: 'white', alignSelf: 'flex-start' },
  removeButton: { backgroundColor: '#dc3545', color: 'white', alignSelf: 'flex-end', padding: '4px 8px', fontSize: '12px' },
  buttonGroup: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' },
  dynamicSection: { display: 'flex', flexDirection: 'column', gap: '15px' },
  dynamicItem: { border: '1px solid #eee', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'white' },
};


const ExternalAccountForm: React.FC<ExternalAccountFormProps> = ({ counterparties, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<ExternalAccountData>(initialFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      party_address: {
        ...prev.party_address!,
        [name]: value,
      },
    }));
  };

  const handleArrayChange = <T,>(
    arrayName: keyof ExternalAccountData,
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newArray = [...(formData[arrayName] as Array<T>)] as Array<any>;
    newArray[index] = { ...newArray[index], [name]: value };
    setFormData(prev => ({ ...prev, [arrayName]: newArray }));
  };

  const addArrayItem = (arrayName: 'account_details' | 'routing_details') => {
    const newItem = arrayName === 'account_details'
      ? { account_number: '', account_number_type: 'other' }
      : { routing_number: '', routing_number_type: 'aba', payment_type: 'ach' };
    
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] as any[]), newItem],
    }));
  };

  const removeArrayItem = (arrayName: keyof ExternalAccountData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: (prev[arrayName] as any[]).filter((_, i) => i !== index),
    }));
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={formStyles.form}>
      <h2>Create External Account</h2>

      <fieldset style={formStyles.fieldset}>
        <legend style={formStyles.legend}>Basic Information</legend>
        <label style={formStyles.label}>
          Counterparty
          <select name="counterparty_id" value={formData.counterparty_id} onChange={handleChange} required style={formStyles.select}>
            <option value="" disabled>Select a counterparty</option>
            {counterparties.map(cp => (
              <option key={cp.id} value={cp.id}>{cp.name}</option>
            ))}
          </select>
        </label>
        <label style={formStyles.label}>
          Account Nickname (Optional)
          <input type="text" name="name" value={formData.name} onChange={handleChange} style={formStyles.input} />
        </label>
        <label style={formStyles.label}>
          Legal Party Name
          <input type="text" name="party_name" value={formData.party_name} onChange={handleChange} required style={formStyles.input} />
        </label>
        <label style={formStyles.label}>
            Account Type
            <select name="account_type" value={formData.account_type} onChange={handleChange} style={formStyles.select}>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="cash">Cash</option>
                <option value="loan">Loan</option>
                <option value="non_resident">Non-resident</option>
                <option value="other">Other</option>
                <option value="overdraft">Overdraft</option>
            </select>
        </label>
         <label style={formStyles.label}>
            Party Type
            <select name="party_type" value={formData.party_type} onChange={handleChange} style={formStyles.select}>
                <option value="business">Business</option>
                <option value="individual">Individual</option>
            </select>
        </label>
      </fieldset>
      
      <fieldset style={formStyles.fieldset}>
        <legend style={formStyles.legend}>Party Address (Optional)</legend>
        <label style={formStyles.label}>Line 1 <input type="text" name="line1" value={formData.party_address?.line1} onChange={handleAddressChange} style={formStyles.input} /></label>
        <label style={formStyles.label}>Line 2 <input type="text" name="line2" value={formData.party_address?.line2} onChange={handleAddressChange} style={formStyles.input} /></label>
        <label style={formStyles.label}>City / Locality <input type="text" name="locality" value={formData.party_address?.locality} onChange={handleAddressChange} style={formStyles.input} /></label>
        <label style={formStyles.label}>State / Region <input type="text" name="region" value={formData.party_address?.region} onChange={handleAddressChange} style={formStyles.input} /></label>
        <label style={formStyles.label}>Postal Code <input type="text" name="postal_code" value={formData.party_address?.postal_code} onChange={handleAddressChange} style={formStyles.input} /></label>
        <label style={formStyles.label}>Country <input type="text" name="country" value={formData.party_address?.country} onChange={handleAddressChange} style={formStyles.input} /></label>
      </fieldset>

      <fieldset style={formStyles.fieldset}>
        <legend style={formStyles.legend}>Account Details</legend>
        <div style={formStyles.dynamicSection}>
          {formData.account_details.map((detail, index) => (
            <div key={index} style={formStyles.dynamicItem}>
              {formData.account_details.length > 1 && (
                  <button type="button" onClick={() => removeArrayItem('account_details', index)} style={formStyles.removeButton}>Remove</button>
              )}
              <label style={formStyles.label}>Account Number <input type="text" name="account_number" value={detail.account_number} onChange={(e) => handleArrayChange('account_details', index, e)} required style={formStyles.input} /></label>
              <label style={formStyles.label}>Account Number Type
                <select name="account_number_type" value={detail.account_number_type} onChange={(e) => handleArrayChange('account_details', index, e)} style={formStyles.select}>
                  <option value="other">Other</option>
                  <option value="iban">IBAN</option>
                  <option value="clabe">CLABE</option>
                  <option value="pan">PAN</option>
                  <option value="wallet_address">Wallet Address</option>
                </select>
              </label>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => addArrayItem('account_details')} style={{...formStyles.button, ...formStyles.addButton, marginTop: '10px' }}>Add Account Detail</button>
      </fieldset>
      
      <fieldset style={formStyles.fieldset}>
        <legend style={formStyles.legend}>Routing Details</legend>
        <div style={formStyles.dynamicSection}>
          {formData.routing_details.map((detail, index) => (
            <div key={index} style={formStyles.dynamicItem}>
               {formData.routing_details.length > 1 && (
                  <button type="button" onClick={() => removeArrayItem('routing_details', index)} style={formStyles.removeButton}>Remove</button>
               )}
              <label style={formStyles.label}>Routing Number <input type="text" name="routing_number" value={detail.routing_number} onChange={(e) => handleArrayChange('routing_details', index, e)} required style={formStyles.input} /></label>
              <label style={formStyles.label}>Routing Number Type
                <select name="routing_number_type" value={detail.routing_number_type} onChange={(e) => handleArrayChange('routing_details', index, e)} style={formStyles.select}>
                  <option value="aba">ABA</option>
                  <option value="swift">SWIFT</option>
                  <option value="au_bsb">AU BSB</option>
                  <option value="ca_cpa">CA CPA</option>
                  <option value="cnaps">CNAPS</option>
                  <option value="gb_sort_code">GB Sort Code</option>
                  <option value="in_ifsc">IN IFSC</option>
                  <option value="my_branch_code">MY Branch Code</option>
                  <option value="br_codigo">BR Codigo</option>
                </select>
              </label>
              <label style={formStyles.label}>Payment Type (Optional)
                <select name="payment_type" value={detail.payment_type} onChange={(e) => handleArrayChange('routing_details', index, e)} style={formStyles.select}>
                    <option value="">None</option>
                    <option value="ach">ACH</option><option value="au_becs">AU BECS</option><option value="bacs">BACS</option><option value="book">Book</option><option value="card">Card</option><option value="check">Check</option><option value="cross_border">Cross Border</option><option value="eft">EFT</option><option value="interac">Interac</option><option value="masav">Masav</option><option value="neft">NEFT</option><option value="provxchange">ProvXchange</option><option value="rtp">RTP</option><option value="sen">SEN</option><option value="sepa">SEPA</option><option value="signet">Signet</option><option value="wire">Wire</option>
                </select>
              </label>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => addArrayItem('routing_details')} style={{...formStyles.button, ...formStyles.addButton, marginTop: '10px' }}>Add Routing Detail</button>
      </fieldset>
      
      <div style={formStyles.buttonGroup}>
        <button type="button" onClick={onCancel} style={{...formStyles.button, ...formStyles.cancelButton}}>Cancel</button>
        <button type="submit" style={{...formStyles.button, ...formStyles.submitButton}}>Create Account</button>
      </div>
    </form>
  );
};

export default ExternalAccountForm;
