import React, { FC } from 'react';

// Define the interface based on the provided data structure
interface Application {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: string;
  applicationType: string;
  accountEnabled: boolean;
  applicationVisibility: string;
  assignmentRequired: boolean;
  isAppProxy: boolean;
}

interface ApplicationDetailPanelProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
}

// --- Helper Functions ---

const formatBoolean = (value: boolean): string => (value ? 'Yes' : 'No');

const formatDate = (isoString: string): string => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
        });
    } catch (e) {
        return isoString; // Return raw string if parsing fails
    }
};

// --- Styling Constants (Using inline styles for simplicity) ---

const STYLES: { [key: string]: React.CSSProperties } = {
    panel: {
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        maxWidth: '90%',
        height: '100%',
        backgroundColor: '#ffffff',
        boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.15)',
        transition: 'transform 0.3s ease-out',
        zIndex: 1000,
        overflowY: 'auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        borderBottom: '1px solid #e0e0e0',
        paddingBottom: '15px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        margin: 0,
        fontSize: '1.4rem',
        fontWeight: 600,
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '1.8rem',
        cursor: 'pointer',
        color: '#555',
        lineHeight: 1,
        padding: '5px',
    },
    detailItem: {
        marginBottom: '12px',
        padding: '5px 0',
    },
    label: {
        fontWeight: 'bold',
        display: 'block',
        color: '#333',
        marginBottom: '2px',
        fontSize: '0.9rem',
    },
    value: {
        fontSize: '1rem',
        color: '#000',
        wordBreak: 'break-all',
    }
};


const ApplicationDetailPanel: FC<ApplicationDetailPanelProps> = ({ application, isOpen, onClose }) => {

  const dynamicPanelStyle: React.CSSProperties = {
    ...STYLES.panel,
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
  };

  if (!application) {
    // Render the panel structure to allow smooth closing animation even if application data is unset
    return <div style={dynamicPanelStyle} />;
  }

  return (
    <div style={dynamicPanelStyle}>
      <div style={STYLES.header}>
        <h2 style={STYLES.title}>{application.displayName || 'Application Details'}</h2>
        <button style={STYLES.closeButton} onClick={onClose} aria-label="Close panel">
          &times;
        </button>
      </div>

      <div style={{ flexGrow: 1 }}>
        <div style={STYLES.detailItem}>
          <span style={STYLES.label}>ID (Service Principal Object ID)</span>
          <span style={STYLES.value}>{application.id}</span>
        </div>
        
        <div style={STYLES.detailItem}>
          <span style={STYLES.label}>Application ID (Client ID)</span>
          <span style={STYLES.value}>{application.appId}</span>
        </div>

        <div style={STYLES.detailItem}>
          <span style={STYLES.label}>Created Date Time</span>
          <span style={STYLES.value}>{formatDate(application.createdDateTime)}</span>
        </div>

        <div style={STYLES.detailItem}>
          <span style={STYLES.label}>Application Type</span>
          <span style={STYLES.value}>{application.applicationType || 'N/A'}</span>
        </div>

        <div style={STYLES.detailItem}>
          <span style={STYLES.label}>Account Enabled</span>
          <span style={STYLES.value}>{formatBoolean(application.accountEnabled)}</span>
        </div>

        <div style={STYLES.detailItem}>
          <span style={STYLES.label}>Visibility</span>
          <span style={STYLES.value}>{application.applicationVisibility}</span>
        </div>
        
        <div style={STYLES.detailItem}>
          <span style={STYLES.label}>Assignment Required</span>
          <span style={STYLES.value}>{formatBoolean(application.assignmentRequired)}</span>
        </div>
        
        <div style={STYLES.detailItem}>
          <span style={STYLES.label}>Is App Proxy</span>
          <span style={STYLES.value}>{formatBoolean(application.isAppProxy)}</span>
        </div>
      </div>
      
    </div>
  );
};

export default ApplicationDetailPanel;