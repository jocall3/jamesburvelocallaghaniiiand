import React from 'react';

type AccessLogStatus = 'Success' | 'Failure';

type AccessLogEntry = {
  id: string;
  timestamp: string;
  eventType: 'Login Attempt' | 'Token Granted' | 'API Access' | 'Token Revoked' | 'Token Refresh';
  principal: string;
  ipAddress: string;
  status: AccessLogStatus;
  details: string;
};

// Mock data representing authentication and access events
const mockLogs: AccessLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2023-10-27 14:30:15 UTC',
    eventType: 'Login Attempt',
    principal: 'user@example.com',
    ipAddress: '203.0.113.45',
    status: 'Success',
    details: 'User authenticated via Google SAML IDP.',
  },
  {
    id: 'log-2',
    timestamp: '2023-10-27 14:30:16 UTC',
    eventType: 'Token Granted',
    principal: 'client_id_abc123',
    ipAddress: '203.0.113.45',
    status: 'Success',
    details: 'Authorization code exchanged for access and refresh tokens.',
  },
  {
    id: 'log-3',
    timestamp: '2023-10-27 14:32:05 UTC',
    eventType: 'API Access',
    principal: 'client_id_abc123',
    ipAddress: '203.0.113.45',
    status: 'Success',
    details: 'GET /api/custmgmt/profiles/v1/accounts/xyz789/details',
  },
  {
    id: 'log-4',
    timestamp: '2023-10-27 14:33:10 UTC',
    eventType: 'API Access',
    principal: 'client_id_abc123',
    ipAddress: '203.0.113.45',
    status: 'Success',
    details: 'GET /api/productDirectory/v1/products',
  },
  {
    id: 'log-5',
    timestamp: '2023-10-27 14:40:20 UTC',
    eventType: 'Token Refresh',
    principal: 'client_id_abc123',
    ipAddress: '203.0.113.45',
    status: 'Success',
    details: 'Refresh token exchanged for a new access token.',
  },
  {
    id: 'log-6',
    timestamp: '2023-10-27 15:01:00 UTC',
    eventType: 'Login Attempt',
    principal: 'hacker@malicious.net',
    ipAddress: '198.51.100.12',
    status: 'Failure',
    details: 'Invalid credentials provided.',
  },
  {
    id: 'log-7',
    timestamp: '2023-10-27 15:05:30 UTC',
    eventType: 'API Access',
    principal: 'client_id_def456',
    ipAddress: '192.0.2.88',
    status: 'Failure',
    details: 'POST /api/identity/auth/v1/oauth2/revoke - Invalid token hint.',
  },
   {
    id: 'log-8',
    timestamp: '2023-10-27 16:12:45 UTC',
    eventType: 'Token Revoked',
    principal: 'user@example.com',
    ipAddress: '203.0.113.45',
    status: 'Success',
    details: 'User revoked consent for client_id_abc123.',
  },
];

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
  header: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '20px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '10px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    fontWeight: 600,
    padding: '12px 15px',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
  },
  evenTr: {
    backgroundColor: '#ffffff',
  },
  oddTr: {
    backgroundColor: '#f9fafb',
  },
  td: {
    padding: '12px 15px',
    color: '#4b5563',
    verticalAlign: 'top',
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
  },
  statusIndicator: {
    height: '10px',
    width: '10px',
    borderRadius: '50%',
    marginRight: '8px',
  },
  statusSuccess: {
    backgroundColor: '#10b981', // green-500
  },
  statusFailure: {
    backgroundColor: '#ef4444', // red-500
  },
  principalText: {
    fontFamily: 'monospace',
    backgroundColor: '#e5e7eb',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '13px',
  },
};

const StatusBadge: React.FC<{ status: AccessLogStatus }> = ({ status }) => (
  <div style={styles.statusCell}>
    <span
      style={{
        ...styles.statusIndicator,
        ...(status === 'Success' ? styles.statusSuccess : styles.statusFailure),
      }}
    ></span>
    <span>{status}</span>
  </div>
);

const AccessLogViewer: React.FC = () => {
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Access & Authentication Log</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Timestamp</th>
            <th style={styles.th}>Event Type</th>
            <th style={styles.th}>Principal</th>
            <th style={styles.th}>IP Address</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Details</th>
          </tr>
        </thead>
        <tbody>
          {mockLogs.map((log, index) => (
            <tr key={log.id} style={{ ...styles.tr, ...(index % 2 === 0 ? styles.evenTr : styles.oddTr) }}>
              <td style={styles.td}>{log.timestamp}</td>
              <td style={styles.td}>{log.eventType}</td>
              <td style={styles.td}>
                <span style={styles.principalText}>{log.principal}</span>
              </td>
              <td style={styles.td}>{log.ipAddress}</td>
              <td style={styles.td}>
                <StatusBadge status={log.status} />
              </td>
              <td style={styles.td}>{log.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccessLogViewer;