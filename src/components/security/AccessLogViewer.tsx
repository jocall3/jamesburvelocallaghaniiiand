import React from 'react';

namespace Citibankdemobusinessinc {

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

  function generateRandomIP(): string {
    return `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  function generateTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  function generatePrincipal(): string {
    const names = ['user', 'admin', 'client', 'service'];
    const domains = ['example.com', 'citibank.com', 'partner.org'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    return `${randomName}@${randomDomain}`;
  }

  function generateEvent(): 'Login Attempt' | 'Token Granted' | 'API Access' | 'Token Revoked' | 'Token Refresh' {
    const events = ['Login Attempt', 'Token Granted', 'API Access', 'Token Revoked', 'Token Refresh'];
    return events[Math.floor(Math.random() * events.length)];
  }

  function generateStatus(): AccessLogStatus {
    return Math.random() > 0.2 ? 'Success' : 'Failure'; // Simulate some failures
  }

  function generateDetails(eventType: string, status: AccessLogStatus, principal: string): string {
    if (eventType === 'Login Attempt') {
      return status === 'Success' ? `User ${principal} authenticated successfully.` : `Failed login attempt for user ${principal}.`;
    } else if (eventType === 'Token Granted') {
      return `Token granted to ${principal}.`;
    } else if (eventType === 'API Access') {
      const apiEndpoints = ['/api/accounts', '/api/transactions', '/api/profile', '/api/security'];
      const endpoint = apiEndpoints[Math.floor(Math.random() * apiEndpoints.length)];
      return `Access to ${endpoint} by ${principal}.`;
    } else if (eventType === 'Token Revoked') {
      return `Token revoked for ${principal}.`;
    } else if (eventType === 'Token Refresh') {
      return `Token refreshed for ${principal}.`;
    }
    return 'No details available.';
  }

  function generateLogEntry(id: string): AccessLogEntry {
    const eventType = generateEvent();
    const principal = generatePrincipal();
    const status = generateStatus();
    return {
      id: id,
      timestamp: generateTimestamp(),
      eventType: eventType,
      principal: principal,
      ipAddress: generateRandomIP(),
      status: status,
      details: generateDetails(eventType, status, principal),
    };
  }

  function generateLogs(count: number): AccessLogEntry[] {
    const logs: AccessLogEntry[] = [];
    for (let i = 0; i < count; i++) {
      logs.push(generateLogEntry(`log-${i + 1}`));
    }
    return logs;
  }

  const generatedLogs = generateLogs(20); // Generate 20 log entries

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

  export const AccessLogViewer: React.FC = () => {
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
            {generatedLogs.map((log, index) => (
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

  // Citibankdemobusinessinc.security.AccessLogViewer
  export namespace security {
    export const AccessLogViewer = Citibankdemobusinessinc.AccessLogViewer;
  }
}

export default Citibankdemobusinessinc.AccessLogViewer;