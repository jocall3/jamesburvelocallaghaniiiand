import React, { useState, useEffect, useRef, useCallback } from 'react';

// Define the structure of a Stripe API Log entry
interface StripeApiLog {
  id: string;
  timestamp: number; // Unix timestamp
  requestId: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  status: number; // HTTP status code
  durationMs: number;
  requestBody: Record<string, any> | null;
  responseBody: Record<string, any> | null;
  ipAddress: string;
  userAgent: string;
  livemode: boolean;
  apiVersion: string;
}

// Helper to generate mock logs for demonstration purposes
const generateMockLog = (index: number): StripeApiLog => {
  const methods: StripeApiLog['method'][] = ['GET', 'POST', 'PUT', 'DELETE'];
  const paths = [
    '/v1/customers',
    '/v1/charges',
    '/v1/payment_intents',
    '/v1/subscriptions',
    '/v1/invoices',
    '/v1/webhooks',
    '/v1/setup_intents',
    '/v1/refunds',
  ];
  const statuses = [200, 201, 204, 400, 401, 403, 404, 429, 500, 503];

  const method = methods[Math.floor(Math.random() * methods.length)];
  const path = paths[Math.floor(Math.random() * paths.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const livemode = Math.random() > 0.5;

  const requestBody = method !== 'GET' && Math.random() > 0.2 ? {
    amount: Math.floor(Math.random() * 10000) + 100,
    currency: 'usd',
    customer: `cus_${Math.random().toString(36).substring(2, 12)}`,
    description: `Test request ${index}`,
    metadata: {
      app_id: 'dev_tools_app',
      correlation_id: `corr_${Math.random().toString(36).substring(2, 10)}`,
    },
  } : null;

  const responseBody = status < 400 ? {
    id: `${path.split('/')[2].slice(0, -1)}_${Math.random().toString(36).substring(2, 12)}`,
    object: path.split('/')[2].slice(0, -1),
    status: 'succeeded',
    amount: requestBody?.amount,
    created: Math.floor(Date.now() / 1000),
  } : {
    error: {
      code: status === 400 ? 'invalid_request_error' : (status === 401 ? 'authentication_error' : 'api_error'),
      message: status === 400 ? 'Invalid parameters were provided.' : (status === 401 ? 'Authentication failed.' : 'An unexpected error occurred.'),
      type: 'api_error',
    }
  };

  return {
    id: `log_${Date.now()}_${index}`,
    timestamp: Date.now() - Math.floor(Math.random() * 10000), // Simulate slightly older logs
    requestId: `req_${Math.random().toString(36).substring(2, 12)}`,
    method,
    path,
    status,
    durationMs: Math.floor(Math.random() * 500) + 50,
    requestBody,
    responseBody,
    ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
    userAgent: 'StripeApp/1.0 (Mock)',
    livemode,
    apiVersion: '2020-08-27',
  };
};

// Basic inline styles for a Stripe-like appearance
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Stripe, -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
    fontSize: '14px',
    color: '#303238',
    backgroundColor: '#f6f9fc',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#fff',
    padding: '16px 24px',
    borderBottom: '1px solid #e6ebf1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    margin: 0,
  },
  mainContent: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
  },
  logStreamContainer: {
    flex: 2,
    padding: '16px 24px',
    overflowY: 'auto',
    borderRight: '1px solid #e6ebf1',
    backgroundColor: '#fff',
  },
  logDetailsContainer: {
    flex: 1,
    padding: '16px 24px',
    overflowY: 'auto',
    backgroundColor: '#fcfdff',
  },
  logEntry: {
    padding: '12px 0',
    borderBottom: '1px solid #f6f9fc',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logEntryHover: {
    backgroundColor: '#fcfdff',
  },
  logEntrySelected: {
    backgroundColor: '#e0f2f7', // Light blue for selected
  },
  logTimestamp: {
    color: '#6b7c93',
    fontSize: '12px',
    minWidth: '120px',
  },
  logMethod: {
    fontWeight: 600,
    minWidth: '60px',
    textAlign: 'center',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
  },
  logPath: {
    flexGrow: 1,
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logStatus: {
    fontWeight: 600,
    minWidth: '40px',
    textAlign: 'right',
  },
  logDuration: {
    color: '#6b7c93',
    fontSize: '12px',
    minWidth: '60px',
    textAlign: 'right',
  },
  filterBar: {
    padding: '16px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e6ebf1',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterInput: {
    padding: '8px 12px',
    border: '1px solid #e6ebf1',
    borderRadius: '4px',
    fontSize: '14px',
    flexGrow: 1,
    minWidth: '150px',
    maxWidth: '300px',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #e6ebf1',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  detailsPre: {
    backgroundColor: '#f0f2f7',
    padding: '10px',
    borderRadius: '4px',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    fontFamily: 'monospace',
    fontSize: '12px',
    maxHeight: '300px',
    marginBottom: '10px',
  },
  detailsSection: {
    marginBottom: '20px',
  },
  detailsSectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '10px',
    borderBottom: '1px solid #e6ebf1',
    paddingBottom: '5px',
    color: '#303238',
  },
  detailsKeyValue: {
    display: 'flex',
    marginBottom: '5px',
    alignItems: 'baseline',
  },
  detailsKey: {
    fontWeight: 600,
    minWidth: '120px',
    color: '#6b7c93',
  },
  detailsValue: {
    flexGrow: 1,
    fontFamily: 'monospace',
    wordBreak: 'break-word',
  },
  badge: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#fff',
  },
  badgeLivemode: {
    backgroundColor: '#6772e5',
  },
  badgeTestmode: {
    backgroundColor: '#6b7c93',
  },
};

// Helper for status colors
const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return '#28a745'; // Success
  if (status >= 300 && status < 400) return '#ffc107'; // Redirect (Warning)
  if (status >= 400 && status < 500) return '#dc3545'; // Client Error
  if (status >= 500) return '#dc3545'; // Server Error
  return '#6b7c93'; // Default
};

const getMethodColor = (method: StripeApiLog['method']) => {
  switch (method) {
    case 'GET': return '#007bff';
    case 'POST': return '#28a745';
    case 'PUT': return '#ffc107';
    case 'DELETE': return '#dc3545';
    default: return '#6b7c93';
  }
};

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const ApiLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<StripeApiLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<StripeApiLog | null>(null);
  const [filterPath, setFilterPath] = useState<string>('');
  const [filterMethod, setFilterMethod] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLivemode, setFilterLivemode] = useState<string>('all'); // 'all', 'live', 'test'

  const logStreamRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(true);

  // Simulate real-time log stream
  useEffect(() => {
    let logIndex = 0;
    const interval = setInterval(() => {
      setLogs((prevLogs) => {
        const newLog = generateMockLog(logIndex++);
        // Keep a reasonable number of logs in memory, e.g., 500
        return [newLog, ...prevLogs].slice(0, 500);
      });
    }, 1500); // Add a new log every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to top when new logs arrive, if user hasn't scrolled away
  useEffect(() => {
    if (logStreamRef.current && isAutoScrolling.current) {
      logStreamRef.current.scrollTop = 0;
    }
  }, [logs]);

  const handleScroll = useCallback(() => {
    if (logStreamRef.current) {
      const { scrollTop } = logStreamRef.current;
      // If scrolled away from the top by more than a small threshold, disable auto-scroll
      isAutoScrolling.current = scrollTop < 50;
    }
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesPath = filterPath ? log.path.toLowerCase().includes(filterPath.toLowerCase()) : true;
    const matchesMethod = filterMethod ? log.method === filterMethod : true;
    const matchesStatus = filterStatus ? log.status.toString().startsWith(filterStatus) : true;
    const matchesLivemode = filterLivemode === 'all' ? true : (filterLivemode === 'live' ? log.livemode : !log.livemode);
    return matchesPath && matchesMethod && matchesStatus && matchesLivemode;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Stripe API Logs</h1>
        {/* Potentially add actions like "Clear Logs", "Pause Stream" here */}
      </div>

      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Filter by path..."
          value={filterPath}
          onChange={(e) => setFilterPath(e.target.value)}
          style={styles.filterInput}
        />
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Statuses</option>
          <option value="2">2xx Success</option>
          <option value="3">3xx Redirect</option>
          <option value="4">4xx Client Error</option>
          <option value="5">5xx Server Error</option>
          <option value="200">200 OK</option>
          <option value="201">201 Created</option>
          <option value="400">400 Bad Request</option>
          <option value="401">401 Unauthorized</option>
          <option value="404">404 Not Found</option>
          <option value="500">500 Internal Server Error</option>
        </select>
        <select
          value={filterLivemode}
          onChange={(e) => setFilterLivemode(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Modes</option>
          <option value="live">Livemode</option>
          <option value="test">Testmode</option>
        </select>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.logStreamContainer} ref={logStreamRef} onScroll={handleScroll}>
          {filteredLogs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7c93', marginTop: '20px' }}>
              No API logs found matching your criteria.
            </p>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  ...styles.logEntry,
                  ...(selectedLog?.id === log.id ? styles.logEntrySelected : {}),
                }}
                onClick={() => setSelectedLog(log)}
                onMouseEnter={(e) => {
                  if (selectedLog?.id !== log.id) {
                    e.currentTarget.style.backgroundColor = styles.logEntryHover.backgroundColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLog?.id !== log.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={styles.logTimestamp}>{formatTimestamp(log.timestamp)}</span>
                <span
                  style={{
                    ...styles.logMethod,
                    backgroundColor: getMethodColor(log.method),
                  }}
                >
                  {log.method}
                </span>
                <span style={styles.logPath}>{log.path}</span>
                <span
                  style={{
                    ...styles.logStatus,
                    color: getStatusColor(log.status),
                  }}
                >
                  {log.status}
                </span>
                <span style={styles.logDuration}>{log.durationMs}ms</span>
                <span
                  style={{
                    ...styles.badge,
                    ...(log.livemode ? styles.badgeLivemode : styles.badgeTestmode),
                  }}
                >
                  {log.livemode ? 'LIVE' : 'TEST'}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={styles.logDetailsContainer}>
          {selectedLog ? (
            <div>
              <h2 style={styles.detailsSectionTitle}>Log Details</h2>
              <div style={styles.detailsSection}>
                <div style={styles.detailsKeyValue}>
                  <span style={styles.detailsKey}>Request ID:</span>
                  <span style={styles.detailsValue}>{selectedLog.requestId}</span>
                </div>
                <div style={styles.detailsKeyValue}>
                  <span style={styles.detailsKey}>Timestamp:</span>
                  <span style={styles.detailsValue}>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
                <div style={styles.detailsKeyValue}>
                  <span style={styles.detailsKey}>Method:</span>
                  <span style={styles.detailsValue}>{selectedLog.method}</span>
                </div>
                <div style={styles.detailsKeyValue}>
                  <span style={styles.detailsKey}>Path:</span>
                  <span style={styles.detailsValue}>{selectedLog.path}</span>
                </div>
                <div style={styles.detailsKeyValue}>
                  <span style={styles.detailsKey}>Status:</span>
                  <span style={styles.detailsValue}>{selectedLog.status}</span>
                </div>
                <div style={styles.detailsKeyValue}>
                  <span style={styles.detailsKey}>Duration:</span>
                  <span style={styles.detailsValue}>{selectedLog.durationMs}ms</span>
                </div>
                <div style={styles.detailsKeyValue}>
                  <span style={styles.detailsKey}>IP Address:</span>
                  <span style={styles.detailsValue}>{selectedLog.ipAddress}</span>
                </div>
                <div style={styles.detailsKeyValue}>
                  <span style={styles.detailsKey}>User Agent:</span>
                  <span style={styles.detailsValue}>{selectedLog.userAgent}</span>
                </div>
                <div style={styles.detailsKeyValue}>
                  <span style={styles.detailsKey}>API Version:</span>
                  <span style={styles.detailsValue}>{selectedLog.apiVersion}</span>
                </div>
                <div style={styles.detailsKeyValue}>
                  <span style={styles.detailsKey}>Mode:</span>
                  <span style={styles.detailsValue}>{selectedLog.livemode ? 'Livemode' : 'Testmode'}</span>
                </div>
              </div>

              <h3 style={styles.detailsSectionTitle}>Request Body</h3>
              <pre style={styles.detailsPre}>
                {selectedLog.requestBody ? JSON.stringify(selectedLog.requestBody, null, 2) : 'N/A'}
              </pre>

              <h3 style={styles.detailsSectionTitle}>Response Body</h3>
              <pre style={styles.detailsPre}>
                {selectedLog.responseBody ? JSON.stringify(selectedLog.responseBody, null, 2) : 'N/A'}
              </pre>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#6b7c93', marginTop: '20px' }}>
              Select a log entry to view its details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiLogsPage;