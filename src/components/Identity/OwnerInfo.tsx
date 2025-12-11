import React from 'react';

interface OwnerInfoProps {
  applicationId?: string;
  applicationName?: string;
}

/**
 * OwnerInfo Component
 * 
 * Displays simulated owner information for a selected application.
 * This serves as a placeholder for where real Graph API user data would be fetched.
 */
const OwnerInfo: React.FC<OwnerInfoProps> = ({ applicationId, applicationName }) => {
  // Simulated data for the owner
  const simulatedOwner = {
    id: 'a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4',
    displayName: 'System Administrator',
    userPrincipalName: 'admin@contoso.onmicrosoft.com',
    jobTitle: 'Cloud Identity Architect',
    department: 'IT Infrastructure',
    officeLocation: 'Redmond, Building 42',
    contactNumber: '+1 (555) 019-2834'
  };

  const containerStyle: React.CSSProperties = {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #eaeaea',
    maxWidth: '800px',
    margin: '0 auto'
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '20px',
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: '10px'
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#323130'
  };

  const subtitleStyle: React.CSSProperties = {
    margin: '5px 0 0 0',
    fontSize: '13px',
    color: '#605e5c'
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  };

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#605e5c',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#201f1e'
  };

  const avatarPlaceholderStyle: React.CSSProperties = {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#0078d4',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px'
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <div style={avatarPlaceholderStyle}>
          {simulatedOwner.displayName.charAt(0)}
        </div>
        <div style={{ marginLeft: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#201f1e' }}>{simulatedOwner.displayName}</h2>
          <p style={{ margin: '4px 0 0 0', color: '#605e5c', fontSize: '14px' }}>{simulatedOwner.userPrincipalName}</p>
        </div>
      </div>

      <div style={headerStyle}>
        <h3 style={titleStyle}>Primary Owner</h3>
        <p style={subtitleStyle}>
          {applicationName 
            ? `Current owner of application: ${applicationName}`
            : 'Simulated owner information'}
        </p>
      </div>

      <div style={gridStyle}>
        <div style={fieldStyle}>
          <span style={labelStyle}>Job Title</span>
          <span style={valueStyle}>{simulatedOwner.jobTitle}</span>
        </div>

        <div style={fieldStyle}>
          <span style={labelStyle}>Department</span>
          <span style={valueStyle}>{simulatedOwner.department}</span>
        </div>

        <div style={fieldStyle}>
          <span style={labelStyle}>Office Location</span>
          <span style={valueStyle}>{simulatedOwner.officeLocation}</span>
        </div>

        <div style={fieldStyle}>
          <span style={labelStyle}>Contact Number</span>
          <span style={valueStyle}>{simulatedOwner.contactNumber}</span>
        </div>

        <div style={fieldStyle}>
          <span style={labelStyle}>Object ID</span>
          <span style={{ ...valueStyle, fontFamily: 'monospace', background: '#f3f2f1', padding: '2px 4px', borderRadius: '4px', alignSelf: 'flex-start' }}>
            {simulatedOwner.id}
          </span>
        </div>

        <div style={fieldStyle}>
          <span style={labelStyle}>Application ID Managed</span>
          <span style={{ ...valueStyle, fontFamily: 'monospace' }}>
            {applicationId || 'N/A'}
          </span>
        </div>
      </div>

      <div style={{ marginTop: '25px', padding: '10px', backgroundColor: '#fff4ce', borderRadius: '4px', fontSize: '12px', color: '#444' }}>
        <strong>Note:</strong> This is a simulated component. In a production environment, this data would be retrieved via the Microsoft Graph API <code>/users/&#123;id&#125;</code> endpoint based on the application's owner relationship.
      </div>
    </div>
  );
};

export default OwnerInfo;