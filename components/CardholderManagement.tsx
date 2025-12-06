import React, { useState, useCallback, useMemo } from 'react';

// --- Types based on the Stripe resource structure ---

interface Address {
  city: string | null;
  country: string | null;
  line1: string | null;
  line2: string | null;
  postal_code: string | null;
  state: string | null;
}

interface SpendingControl {
  amount: number;
  interval: string;
}

interface Cardholder {
  id: string;
  object: 'issuing.cardholder';
  created: number;
  livemode: boolean;
  name: string;
  email: string;
  phone_number: string | null;
  status: 'active' | 'inactive' | 'blocked';
  type: 'individual' | 'company';
  billing: {
    address: Address;
  };
  spending_controls: {
    allowed_categories: string[];
    blocked_categories: string[];
    spending_limits: SpendingControl[];
    spending_limits_currency: string | null;
    allowed_merchant_countries: string[] | null;
    blocked_merchant_countries: string[] | null;
  };
  individual: {
    dob: {
      day: number | null;
      month: number | null;
      year: number | null;
    };
    first_name: string | null;
    last_name: string | null;
    verification: {
      document: {
        back: string | null;
        front: string | null;
      };
    };
  } | null;
  company: {
    tax_id_provided: boolean;
  } | null;
  metadata: Record<string, any>;
  preferred_locales: string[] | null;
  requirements: {
    disabled_reason: string | null;
    past_due: string[];
  };
}

// --- Sample Data mimicking the provided resource ---
const SAMPLE_CARDHOLDER: Cardholder = {
  id: 'ich_1Mcd6kJITzLVzkSmsPNd4Aor',
  object: 'issuing.cardholder',
  created: 1676675570,
  livemode: false,
  name: 'Jenny Rosen',
  email: 'jenny@example.com',
  phone_number: '+18008675309',
  status: 'active',
  type: 'individual',
  billing: {
    address: {
      city: 'Beverly Hills',
      country: 'US',
      line1: '123 Fake St',
      line2: 'Apt 3',
      postal_code: '90210',
      state: 'CA',
    },
  },
  spending_controls: {
    allowed_categories: [],
    blocked_categories: [],
    spending_limits: [],
    spending_limits_currency: null,
    allowed_merchant_countries: null,
    blocked_merchant_countries: null,
  },
  individual: {
    dob: { day: null, month: null, year: null },
    first_name: null,
    last_name: null,
    verification: { document: { back: null, front: null } },
  },
  company: {
    tax_id_provided: true,
  },
  metadata: {},
  preferred_locales: null,
  requirements: {
    disabled_reason: null,
    past_due: [],
  },
};

// --- Utility Components ---

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
    <span style={{ fontWeight: 500, color: '#555' }}>{label}:</span>
    <span>{value ?? 'N/A'}</span>
  </div>
);

const AddressDisplay: React.FC<{ address: Address }> = ({ address }) => (
  <div>
    {address.line1 && <div>{address.line1}</div>}
    {address.line2 && <div>{address.line2}</div>}
    <div>{address.city}, {address.state} {address.postal_code}</div>
    <div>{address.country}</div>
  </div>
);

// --- Main Component ---

const CardholderManagement: React.FC = () => {
  const [cardholder, setCardholder] = useState<Cardholder>(SAMPLE_CARDHOLDER);
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(cardholder.status);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewStatus(e.target.value as Cardholder['status']);
  }, []);

  const handleSave = () => {
    // Mock API call to update status
    setCardholder(prev => ({
      ...prev,
      status: newStatus,
      // In a real app, update other fields here too
    }));
    setIsEditing(false);
    console.log(`Saved new status: ${newStatus}`);
  };

  const handleEdit = () => {
    setNewStatus(cardholder.status);
    setIsEditing(true);
  };

  const formattedCreatedDate = useMemo(() => {
    return new Date(cardholder.created * 1000).toLocaleString();
  }, [cardholder.created]);

  const formattedTypeDetails = useMemo(() => {
    if (cardholder.type === 'individual' && cardholder.individual) {
      return (
        <>
          <DetailRow label="First Name" value={cardholder.individual.first_name} />
          <DetailRow label="Last Name" value={cardholder.individual.last_name} />
          <DetailRow label="DOB" value={
            cardholder.individual.dob.year 
              ? `${cardholder.individual.dob.month}/${cardholder.individual.dob.day}/${cardholder.individual.dob.year}`
              : 'N/A'
          } />
        </>
      );
    }
    if (cardholder.type === 'company' && cardholder.company) {
      return (
        <DetailRow label="Tax ID Provided" value={cardholder.company.tax_id_provided ? 'Yes' : 'No'} />
      );
    }
    return null;
  }, [cardholder]);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '800px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>Issuing Cardholder Management</h2>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: '0' }}>Cardholder Details ({cardholder.id})</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <DetailRow label="Name" value={cardholder.name} />
            <DetailRow label="Email" value={cardholder.email} />
            <DetailRow label="Phone" value={cardholder.phone_number} />
            <DetailRow label="Type" value={cardholder.type.charAt(0).toUpperCase() + cardholder.type.slice(1)} />
            <DetailRow label="Created" value={formattedCreatedDate} />
            <DetailRow label="Livemode" value={cardholder.livemode ? 'True' : 'False'} />
          </div>
          <div>
            <DetailRow 
              label="Billing Address" 
              value={<AddressDisplay address={cardholder.billing.address} />}
            />
          </div>
        </div>

        {formattedTypeDetails && (
          <div style={{ marginTop: '15px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
            <h4>{cardholder.type.toUpperCase()} Specific Details</h4>
            {formattedTypeDetails}
          </div>
        )}

        <div style={{ marginTop: '15px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
          <h4>Status & Controls</h4>
          <DetailRow 
            label="Current Status" 
            value={
              <span style={{ color: cardholder.status === 'active' ? 'green' : 'red', fontWeight: 'bold' }}>
                {cardholder.status.toUpperCase()}
              </span>
            } 
          />
          
          <DetailRow 
            label="Spending Limits" 
            value={cardholder.spending_controls.spending_limits.length > 0 ? 'Configured' : 'None'}
          />
          <DetailRow 
            label="Allowed Categories" 
            value={cardholder.spending_controls.allowed_categories.length > 0 ? cardholder.spending_controls.allowed_categories.join(', ') : 'All'}
          />

          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            {isEditing ? (
              <>
                <label>Update Status:</label>
                <select value={newStatus} onChange={handleStatusChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
                <button onClick={handleSave} style={{ padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>Save Changes</button>
                <button onClick={() => setIsEditing(false)} style={{ padding: '5px 10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>Cancel</button>
              </>
            ) : (
              <button onClick={handleEdit} style={{ padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>Edit Status</button>
            )}
          </div>
        </div>

      </div>

      <div style={{ marginTop: '20px', borderTop: '2px solid #333', paddingTop: '10px' }}>
        <h3>Metadata</h3>
        {Object.keys(cardholder.metadata).length > 0 ? (
          <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(cardholder.metadata, null, 2)}
          </pre>
        ) : (
          <p>No metadata set.</p>
        )}
      </div>
    </div>
  );
};

export default CardholderManagement;