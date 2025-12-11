import React from 'react';

// Define the structure of the identity object properties based on the project goal
interface IdentityProperties {
  id: string; // Object ID
  displayName: string;
  appId: string; // Application ID
  createdDateTime: string; // ISO 8601 string
  applicationType: string;
  accountEnabled: boolean;
  applicationVisibility: string;
  assignmentRequired: boolean;
  isAppProxy: boolean;
}

interface PropertiesCardProps {
  identity: IdentityProperties;
}

// Helper to format boolean values
const formatBoolean = (value: boolean): string => (value ? 'True' : 'False');

// Helper to format ISO date string to a readable format
const formatDateTime = (isoDateString: string): string => {
  if (!isoDateString) return 'N/A';
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) {
      return isoDateString; // Fallback
    }
    // Format to a readable local string
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  } catch (e) {
    return isoDateString;
  }
};

// Internal utility component for displaying a single property row using inline styles for structure
const PropertyItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
    <span style={{ fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>{label}:</span>
    <span style={{ fontSize: '0.9rem', wordBreak: 'break-all', marginLeft: '16px', textAlign: 'right' }}>{value}</span>
  </div>
);


const PropertiesCard: React.FC<PropertiesCardProps> = ({ identity }) => {

  if (!identity) {
    return <div style={{ padding: '16px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px' }}>No identity data provided.</div>;
  }

  return (
    <div style={{ background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '8px', padding: '24px' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', color: '#333' }}>
        Technical Properties
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        
        <PropertyItem 
          label="Object ID" 
          value={identity.id} 
        />
        
        <PropertyItem 
          label="Application ID (appId)" 
          value={identity.appId} 
        />

        <PropertyItem 
          label="Display Name" 
          value={identity.displayName} 
        />

        <PropertyItem 
          label="Application Type" 
          value={identity.applicationType || 'N/A'} 
        />
        
        <PropertyItem 
          label="Created Date/Time" 
          value={formatDateTime(identity.createdDateTime)} 
        />
        
        <PropertyItem 
          label="Account Enabled" 
          value={formatBoolean(identity.accountEnabled)} 
        />
        
        <PropertyItem 
          label="Visibility" 
          value={identity.applicationVisibility} 
        />
        
        <PropertyItem 
          label="Assignment Required" 
          value={formatBoolean(identity.assignmentRequired)} 
        />
        
        <PropertyItem 
          label="Is App Proxy" 
          value={formatBoolean(identity.isAppProxy)} 
        />
        
      </div>
    </div>
  );
};

export default PropertiesCard;