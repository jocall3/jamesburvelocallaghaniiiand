import React from 'react';

// Define severity and status types for better type safety and autocompletion
export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertStatus = 'Open' | 'In Review' | 'Escalated' | 'Closed';

// Define the shape of the props for the component
export interface ComplianceAlertCardProps {
  alertId: string;
  transactionId: string;
  timestamp: string; // ISO 8601 string
  severity: AlertSeverity;
  status: AlertStatus;
  ruleTriggered: string; // e.g., "Sanctions List Hit: OFAC-SDN"
  triggerReason: string; // e.g., "Creditor name 'Osama Bin' matches 'OSAMA BIN LADEN'"
  transactionDetails: {
    amount: number;
    currency: string; // ISO 4217 currency code
    debtor: {
      name: string;
      accountNumber: string;
    };
    creditor: {
      name: string;
      accountNumber: string;
    };
    purposeCode?: string; // Optional: Could be from ExternalPurpose1Code
  };
  onAcknowledge: (alertId: string) => void;
  onEscalate: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
}

// Helper function to map severity to a color scheme (using CSS-in-JS friendly objects)
const getSeverityStyles = (severity: AlertSeverity) => {
  switch (severity) {
    case 'Low':
      return {
        bgColor: '#eff6ff', // blue-100
        textColor: '#1e40af', // blue-800
        borderColor: '#3b82f6', // blue-500
      };
    case 'Medium':
      return {
        bgColor: '#fefce8', // yellow-100
        textColor: '#854d0e', // yellow-800
        borderColor: '#eab308', // yellow-500
      };
    case 'High':
      return {
        bgColor: '#fff7ed', // orange-100
        textColor: '#9a3412', // orange-800
        borderColor: '#f97316', // orange-500
      };
    case 'Critical':
      return {
        bgColor: '#fee2e2', // red-100
        textColor: '#991b1b', // red-800
        borderColor: '#ef4444', // red-500
      };
    default:
      return {
        bgColor: '#f3f4f6', // gray-100
        textColor: '#1f2937', // gray-800
        borderColor: '#6b7280', // gray-500
      };
  }
};

// Helper function to map status to a color scheme
const getStatusStyles = (status: AlertStatus) => {
    switch (status) {
      case 'Open':
        return { backgroundColor: '#dbeafe', color: '#1e40af' }; // blue-200, blue-800
      case 'In Review':
        return { backgroundColor: '#fef08a', color: '#854d0e' }; // yellow-200, yellow-800
      case 'Escalated':
        return { backgroundColor: '#fed7aa', color: '#9a3412' }; // orange-200, orange-800
      case 'Closed':
        return { backgroundColor: '#d1fae5', color: '#065f46' }; // green-200, green-800
      default:
        return { backgroundColor: '#e5e7eb', color: '#374151' }; // gray-200, gray-700
    }
  };


/**
 * A UI card component used to display a detailed compliance alert
 * that has been triggered by the AI analysis engine.
 */
const ComplianceAlertCard: React.FC<ComplianceAlertCardProps> = ({
  alertId,
  transactionId,
  timestamp,
  severity,
  status,
  ruleTriggered,
  triggerReason,
  transactionDetails,
  onAcknowledge,
  onEscalate,
  onDismiss,
}) => {
  const severityStyles = getSeverityStyles(severity);
  const statusStyles = getStatusStyles(status);

  const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency,
    }).format(amount);
  };

  return (
    <div style={{
        borderLeft: `4px solid ${severityStyles.borderColor}`,
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        fontFamily: 'sans-serif',
        color: '#111827'
    }}>
      {/* Card Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Compliance Alert</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Alert ID: {alertId}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
            <span style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                borderRadius: '9999px',
                backgroundColor: severityStyles.bgColor,
                color: severityStyles.textColor,
            }}>
                {severity} Severity
            </span>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>{formatTimestamp(timestamp)}</p>
        </div>
      </header>

      {/* Alert Details */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Trigger Details</h3>
        <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: '#4b5563' }}>Rule Triggered:</strong>
                <p>{ruleTriggered}</p>
            </div>
            <div>
                <strong style={{ color: '#4b5563' }}>Reason:</strong>
                <p style={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: severityStyles.bgColor,
                    color: severityStyles.textColor,
                    wordBreak: 'break-word',
                }}>
                    {triggerReason}
                </p>
            </div>
        </div>
      </section>

      {/* Transaction Details */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Associated Transaction</h3>
        <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#4f46e5' }}>
                    {formatCurrency(transactionDetails.amount, transactionDetails.currency)}
                </span>
                <span style={{ ...statusStyles, padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: '600', borderRadius: '9999px' }}>
                    Alert Status: {status}
                </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                    <strong style={{ color: '#4b5563', display: 'block' }}>Debtor (Sender)</strong>
                    <p>{transactionDetails.debtor.name}</p>
                    <p style={{ color: '#6b7280' }}>{transactionDetails.debtor.accountNumber}</p>
                </div>
                <div>
                    <strong style={{ color: '#4b5563', display: 'block' }}>Creditor (Receiver)</strong>
                    <p>{transactionDetails.creditor.name}</p>
                    <p style={{ color: '#6b7280' }}>{transactionDetails.creditor.accountNumber}</p>
                </div>
            </div>
            {transactionDetails.purposeCode && (
                 <div style={{ marginTop: '1rem' }}>
                     <strong style={{ color: '#4b5563', display: 'block' }}>Purpose Code</strong>
                     <p style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{transactionDetails.purposeCode}</p>
                 </div>
            )}
             <div style={{ marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Transaction ID: {transactionId}</p>
            </div>
        </div>
      </section>

      {/* Action Footer */}
      {status !== 'Closed' && (
        <footer style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
            <button
                onClick={() => onAcknowledge(alertId)}
                style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            >
                Acknowledge
            </button>
            <button
                onClick={() => onDismiss(alertId)}
                style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#065f46', backgroundColor: '#d1fae5', border: '1px solid transparent', borderRadius: '0.375rem' }}
            >
                Dismiss
            </button>
            <button
                onClick={() => onEscalate(alertId)}
                style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: 'white', backgroundColor: '#dc2626', border: '1px solid transparent', borderRadius: '0.375rem' }}
            >
                Escalate
            </button>
        </footer>
      )}
    </div>
  );
};

export default ComplianceAlertCard;
