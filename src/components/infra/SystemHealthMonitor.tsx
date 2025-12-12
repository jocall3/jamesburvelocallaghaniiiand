import React, { useState, useEffect, useCallback } from 'react';

// Define the type for a single API's health status
interface ApiHealth {
  id: string;
  name: string;
  status: 'Operational' | 'Degraded' | 'Outage';
  latency: number; // in ms
  errorRate: number; // percentage
  uptime: number; // percentage
}

// Mock data generation function
const generateMockData = (): ApiHealth[] => {
  const apis = [
    { id: 'cust_profiles', name: 'Customer Profiles API' },
    { id: 'token_auth', name: 'Token Authorization API' },
    { id: 'rewards_linkage', name: 'Rewards Linkage API' },
    { id: 'products_view', name: 'Products View API' },
  ];

  return apis.map(api => {
    const randomFactor = Math.random();
    let status: 'Operational' | 'Degraded' | 'Outage' = 'Operational';
    let latency = 50 + Math.random() * 100; // 50-150ms
    let errorRate = Math.random() * 0.1; // 0-0.1%
    let uptime = 100 - Math.random() * 0.05; // 99.95-100%

    if (randomFactor > 0.95) {
      status = 'Outage';
      latency = 5000 + Math.random() * 2000;
      errorRate = 20 + Math.random() * 30;
      uptime -= 5;
    } else if (randomFactor > 0.85) {
      status = 'Degraded';
      latency = 400 + Math.random() * 600;
      errorRate = 1 + Math.random() * 4;
      uptime -= 0.5;
    }

    return {
      ...api,
      status,
      latency: parseFloat(latency.toFixed(0)),
      errorRate: parseFloat(errorRate.toFixed(2)),
      uptime: parseFloat(uptime.toFixed(4)),
    };
  });
};

// Main Component
const SystemHealthMonitor: React.FC = () => {
  const [apiHealth, setApiHealth] = useState<ApiHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setApiHealth(generateMockData());
      setLastUpdated(new Date());
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getStatusColor = (status: ApiHealth['status'] | 'Major Outage' | 'Degraded Performance' | 'All Systems Operational') => {
    switch (status) {
      case 'Operational':
      case 'All Systems Operational':
        return '#2ecc71'; // green
      case 'Degraded':
      case 'Degraded Performance':
        return '#f39c12'; // orange
      case 'Outage':
      case 'Major Outage':
        return '#e74c3c'; // red
      default:
        return '#95a5a6'; // gray
    }
  };
  
  const getLatencyColor = (latency: number) => {
      if (latency > 500) return getStatusColor('Outage');
      if (latency > 200) return getStatusColor('Degraded');
      return getStatusColor('Operational');
  }

  const overallStatus = apiHealth.some(api => api.status === 'Outage')
    ? 'Major Outage'
    : apiHealth.some(api => api.status === 'Degraded')
    ? 'Degraded Performance'
    : 'All Systems Operational';
    
  const overallUptime = apiHealth.length > 0
    ? (apiHealth.reduce((acc, api) => acc + api.uptime, 0) / apiHealth.length).toFixed(4)
    : '...';


  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>System Health Monitor</h1>
        <div style={styles.headerControls}>
          <span style={styles.lastUpdated}>
            Last Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}
          </span>
          <button onClick={fetchData} disabled={loading} style={styles.refreshButton}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {loading && !lastUpdated ? (
        <div style={styles.loader}>Loading System Status...</div>
      ) : (
        <>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <h2 style={styles.cardTitle}>Overall Status</h2>
              <p style={{ ...styles.statusText, color: getStatusColor(overallStatus) }}>
                {overallStatus}
              </p>
            </div>
            <div style={styles.summaryCard}>
              <h2 style={styles.cardTitle}>Average Uptime (Last 24h)</h2>
              <p style={styles.uptimeText}>{overallUptime}%</p>
            </div>
          </div>

          <div style={styles.apiTableContainer}>
            <h2 style={styles.subHeader}>API Services Status</h2>
            <div style={styles.apiTableHeader}>
              <div style={{ ...styles.apiTableCell, flex: 3 }}>Service</div>
              <div style={{ ...styles.apiTableCell, flex: 1, textAlign: 'center' }}>Status</div>
              <div style={{ ...styles.apiTableCell, flex: 1, textAlign: 'right' }}>Latency</div>
              <div style={{ ...styles.apiTableCell, flex: 1, textAlign: 'right' }}>Error Rate</div>
              <div style={{ ...styles.apiTableCell, flex: 1, textAlign: 'right' }}>Uptime</div>
            </div>
            {apiHealth.map(api => (
              <div key={api.id} style={styles.apiTableRow}>
                <div style={{ ...styles.apiTableCell, flex: 3, fontWeight: 500 }}>{api.name}</div>
                <div style={{ ...styles.apiTableCell, flex: 1, textAlign: 'center' }}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(api.status),
                  }}>
                    {api.status}
                  </span>
                </div>
                <div style={{ ...styles.apiTableCell, flex: 1, textAlign: 'right', color: getLatencyColor(api.latency) }}>
                  {api.latency} ms
                </div>
                <div style={{ ...styles.apiTableCell, flex: 1, textAlign: 'right' }}>
                  {api.errorRate}%
                </div>
                <div style={{ ...styles.apiTableCell, flex: 1, textAlign: 'right' }}>
                  {api.uptime}%
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#f0f2f5',
    color: '#333',
    padding: '2rem',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    borderBottom: '1px solid #dfe4ea',
    paddingBottom: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    color: '#1e272e',
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  lastUpdated: {
    color: '#576574',
    fontSize: '0.9rem',
  },
  refreshButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  loader: {
      textAlign: 'center',
      padding: '4rem',
      fontSize: '1.2rem',
      color: '#576574',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: '1rem',
    fontSize: '1.1rem',
    color: '#576574',
    fontWeight: 500,
  },
  statusText: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    margin: 0,
  },
  uptimeText: {
      fontSize: '1.8rem',
      fontWeight: 'bold',
      color: '#1e272e',
      margin: 0,
  },
  apiTableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  subHeader: {
    padding: '1.5rem',
    margin: 0,
    borderBottom: '1px solid #dfe4ea',
    fontSize: '1.2rem',
  },
  apiTableHeader: {
    display: 'flex',
    padding: '1rem 1.5rem',
    backgroundColor: '#f8f9fa',
    color: '#576574',
    fontWeight: 600,
    fontSize: '0.9rem',
    textTransform: 'uppercase',
  },
  apiTableRow: {
    display: 'flex',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #dfe4ea',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  },
  apiTableCell: {
    padding: '0 0.5rem',
  },
  statusBadge: {
    color: 'white',
    padding: '0.3rem 0.7rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
};

export default SystemHealthMonitor;