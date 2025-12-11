import React from 'react';

// Define the structure for the application metadata based on the project goal data
interface ApplicationMetadata {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: string;
  applicationType: string;
  accountEnabled: string;
  applicationVisibility: string;
  assignmentRequired: string;
  isAppProxy: string;
}

interface MetadataListProps {
  data: ApplicationMetadata;
  title?: string;
}

const MetadataList: React.FC<MetadataListProps> = ({ data, title = "Application Metadata" }) => {

  const metadataItems = [
    { label: 'ID', value: data.id },
    { label: 'Display Name', value: data.displayName },
    { label: 'Application ID (AppId)', value: data.appId },
    { label: 'Created Date/Time', value: data.createdDateTime },
    { label: 'Application Type', value: data.applicationType },
    { label: 'Account Enabled', value: data.accountEnabled },
    { label: 'Application Visibility', value: data.applicationVisibility },
    { label: 'Assignment Required', value: data.assignmentRequired },
    { label: 'Is App Proxy', value: data.isAppProxy },
  ];

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #e0e0e0', 
      borderRadius: '8px', 
      backgroundColor: '#f9f9f9',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h3 style={{ 
        marginBottom: '15px', 
        borderBottom: '2px solid #007bff', 
        paddingBottom: '8px', 
        color: '#333' 
      }}>
        {title}
      </h3>
      <dl style={{ margin: 0 }}>
        {metadataItems.map((item, index) => (
          <div 
            key={item.label} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '10px 0',
              borderBottom: index < metadataItems.length - 1 ? '1px dotted #ccc' : 'none',
              alignItems: 'center'
            }}
          >
            <dt style={{ 
              fontWeight: '600', 
              color: '#333', 
              flexShrink: 0, 
              marginRight: '15px' 
            }}>
              {item.label}
            </dt>
            <dd style={{ 
              margin: 0, 
              textAlign: 'right', 
              color: '#666',
              wordBreak: 'break-all'
            }}>
              {item.value || 'N/A'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default MetadataList;
