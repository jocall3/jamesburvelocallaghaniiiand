import React, { useState, useEffect, useCallback, useMemo } from 'react';

// NOTE: In a real application, these types and the Plaid client
// would be imported from your generated Plaid SDK.
// The following are illustrative definitions based on the OpenAPI spec.

// --- START MOCK PLAID SDK ---
// This section is for illustration and would be replaced by actual SDK imports.

enum Products {
  Assets = 'assets',
  Auth = 'auth',
  Balance = 'balance',
  Identity = 'identity',
  Investments = 'investments',
  Liabilities = 'liabilities',
  PaymentInitiation = 'payment_initiation',
  Transactions = 'transactions',
}

interface Item {
  item_id: string;
  institution_id: string | null;
  webhook: string | null;
  error: { error_code: string; error_message: string } | null;
  available_products: Products[];
  billed_products: Products[];
  products: Products[];
  consent_expiration_time: string | null;
}

interface Activity {
  activity_id: string;
  initiator: string;
  id: string;
  initiated_date: string;
  initiated_description: string;
  target_application_id: string;
  scopes: Scopes;
}

interface Scopes {
  products: Products[] | null;
  accounts: { account_id: string }[];
  new_accounts: boolean;
}

interface ConnectedApplication {
  application_id: string;
  name: string;
  display_name: string | null;
  logo_url: string | null;
  application_url: string | null;
  reason_for_access: string | null;
  created_at: string;
  scopes: Scopes | null;
}

// Mock Plaid client - replace with your actual client instance
const plaidClient = {
  itemGet: (request: { access_token: string }) => Promise.resolve({ data: { item: {} as Item } }),
  itemActivityList: (request: { access_token: string; count?: number; cursor?: string }) => Promise.resolve({ data: { activities: [] as Activity[] } }),
  itemApplicationList: (request: { access_token: string }) => Promise.resolve({ data: { applications: [] as ConnectedApplication[] } }),
  itemApplicationUnlink: (request: { access_token: string; application_id: string }) => Promise.resolve({ data: { status: 'unlinked' } }),
  itemApplicationScopesUpdate: (request: { access_token: string; application_id: string; scopes: Scopes; context: 'MANUAL_UPDATE' }) => Promise.resolve({ data: { status: 'updated' } }),
};

// --- END MOCK PLAID SDK ---


const styles: { [key: string]: React.CSSProperties } = {
  container: { fontFamily: 'Arial, sans-serif', color: '#333', maxWidth: '1000px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  header: { borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' },
  title: { fontSize: '24px', margin: 0 },
  loading: { textAlign: 'center', padding: '50px', fontSize: '18px' },
  error: { color: 'red', backgroundColor: '#ffeeee', border: '1px solid red', padding: '15px', borderRadius: '4px', margin: '20px 0' },
  infoCard: { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  infoItem: { display: 'flex', flexDirection: 'column' },
  infoLabel: { fontWeight: 'bold', fontSize: '12px', color: '#555', marginBottom: '4px' },
  infoValue: { fontSize: '14px', wordBreak: 'break-all' },
  badge: { display: 'inline-block', padding: '4px 8px', fontSize: '12px', borderRadius: '12px', backgroundColor: '#e0e0e0', marginRight: '5px', marginBottom: '5px' },
  tabs: { display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '20px' },
  tabButton: { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', borderBottom: '3px solid transparent' },
  activeTab: { borderBottom: '3px solid #007bff', fontWeight: 'bold' },
  appList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  appCard: { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  appInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  appLogo: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#eee' },
  appName: { fontWeight: 'bold' },
  appScopes: { fontSize: '12px', color: '#666', marginTop: '4px' },
  appActions: { display: 'flex', gap: '10px' },
  button: { padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', background: '#fff' },
  buttonDanger: { borderColor: '#dc3545', color: '#dc3545' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalContent: { background: 'white', padding: '20px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
  modalHeader: { fontSize: '20px', marginBottom: '20px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
  scopeOption: { display: 'block', marginBottom: '10px' },
};

// --- Helper Components ---

const ItemInfoCard: React.FC<{ item: Item | null }> = ({ item }) => {
  if (!item) return null;
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoItem}><span style={styles.infoLabel}>Item ID</span><span style={styles.infoValue}>{item.item_id}</span></div>
      <div style={styles.infoItem}><span style={styles.infoLabel}>Institution ID</span><span style={styles.infoValue}>{item.institution_id}</span></div>
      <div style={styles.infoItem}><span style={styles.infoLabel}>Products</span><div>{item.products.map(p => <span key={p} style={styles.badge}>{p}</span>)}</div></div>
      <div style={styles.infoItem}><span style={styles.infoLabel}>Consent Expires</span><span style={styles.infoValue}>{item.consent_expiration_time ? new Date(item.consent_expiration_time).toLocaleString() : 'N/A'}</span></div>
    </div>
  );
};

const UpdateScopesModal: React.FC<{
  app: ConnectedApplication;
  onClose: () => void;
  onSave: (newScopes: Scopes) => void;
}> = ({ app, onClose, onSave }) => {
  const allPossibleProducts = Object.values(Products);
  const [selectedProducts, setSelectedProducts] = useState<Products[]>(app.scopes?.products || []);

  const handleCheckboxChange = (product: Products, checked: boolean) => {
    setSelectedProducts(prev =>
      checked ? [...prev, product] : prev.filter(p => p !== product)
    );
  };

  const handleSave = () => {
    const newScopes: Scopes = {
      ...app.scopes,
      products: selectedProducts,
      accounts: app.scopes?.accounts || [],
      new_accounts: app.scopes?.new_accounts || true,
    };
    onSave(newScopes);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h3 style={styles.modalHeader}>Update Scopes for {app.name}</h3>
        <div>
          {allPossibleProducts.map(product => (
            <label key={product} style={styles.scopeOption}>
              <input
                type="checkbox"
                checked={selectedProducts.includes(product)}
                onChange={(e) => handleCheckboxChange(product, e.target.checked)}
              />
              <span style={{ marginLeft: '8px' }}>{product}</span>
            </label>
          ))}
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.button} onClick={onClose}>Cancel</button>
          <button style={{ ...styles.button, ...{ background: '#007bff', color: 'white', borderColor: '#007bff' } }} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

interface PlaidItemManagementViewProps {
  accessToken: string;
}

export const PlaidItemManagementView: React.FC<PlaidItemManagementViewProps> = ({ accessToken }) => {
  const [item, setItem] = useState<Item | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [applications, setApplications] = useState<ConnectedApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'activity' | 'applications'>('activity');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<ConnectedApplication | null>(null);

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setItem(null);
      setActivities([]);
      setApplications([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [itemRes, activityRes, appRes] = await Promise.all([
        plaidClient.itemGet({ access_token: accessToken }),
        plaidClient.itemActivityList({ access_token: accessToken }),
        plaidClient.itemApplicationList({ access_token: accessToken }),
      ]);
      setItem(itemRes.data.item);
      setActivities(activityRes.data.activities);
      setApplications(appRes.data.applications);
    } catch (e: any) {
      setError(e.response?.data?.error_message || e.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUnlink = async (applicationId: string) => {
    if (!window.confirm('Are you sure you want to unlink this application? This action cannot be undone.')) {
      return;
    }
    try {
      await plaidClient.itemApplicationUnlink({ access_token: accessToken, application_id: applicationId });
      alert('Application unlinked successfully.');
      fetchData(); // Refresh data
    } catch (e: any) {
      alert(`Failed to unlink application: ${e.response?.data?.error_message || e.message}`);
    }
  };

  const handleUpdateScopes = async (newScopes: Scopes) => {
    if (!selectedApp) return;
    try {
      await plaidClient.itemApplicationScopesUpdate({
        access_token: accessToken,
        application_id: selectedApp.application_id,
        scopes: newScopes,
        context: 'MANUAL_UPDATE',
      });
      alert('Scopes updated successfully.');
      setSelectedApp(null);
      fetchData(); // Refresh data
    } catch (e: any) {
      alert(`Failed to update scopes: ${e.response?.data?.error_message || e.message}`);
    }
  };

  const memoizedActivities = useMemo(() => (
    <div>
      {activities.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th style={{textAlign: 'left', padding: '8px'}}>Date</th>
              <th style={{textAlign: 'left', padding: '8px'}}>Description</th>
              <th style={{textAlign: 'left', padding: '8px'}}>Initiator</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(activity => (
              <tr key={activity.activity_id}>
                <td style={{padding: '8px'}}>{new Date(activity.initiated_date).toLocaleString()}</td>
                <td style={{padding: '8px'}}>{activity.initiated_description}</td>
                <td style={{padding: '8px'}}>{activity.initiator}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No activity found for this item.</p>
      )}
    </div>
  ), [activities]);

  const memoizedApplications = useMemo(() => (
    <div style={styles.appList}>
      {applications.length > 0 ? (
        applications.map(app => (
          <div key={app.application_id} style={styles.appCard}>
            <div style={styles.appInfo}>
              <img src={app.logo_url || undefined} alt={`${app.name} logo`} style={styles.appLogo} />
              <div>
                <div style={styles.appName}>{app.name}</div>
                <div style={styles.appScopes}>
                  Scopes: {app.scopes?.products?.join(', ') || 'N/A'}
                </div>
              </div>
            </div>
            <div style={styles.appActions}>
              <button style={styles.button} onClick={() => setSelectedApp(app)}>Update Scopes</button>
              <button style={{ ...styles.button, ...styles.buttonDanger }} onClick={() => handleUnlink(app.application_id)}>Unlink</button>
            </div>
          </div>
        ))
      ) : (
        <p>No connected applications found for this item.</p>
      )}
    </div>
  ), [applications, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Plaid Item Management</h1>
      </header>

      {loading && <div style={styles.loading}>Loading item data...</div>}
      {error && <div style={styles.error}><pre>{error}</pre></div>}

      {!loading && !error && item && (
        <>
          <ItemInfoCard item={item} />
          <nav style={styles.tabs}>
            <button
              style={{ ...styles.tabButton, ...(activeTab === 'activity' ? styles.activeTab : {}) }}
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </button>
            <button
              style={{ ...styles.tabButton, ...(activeTab === 'applications' ? styles.activeTab : {}) }}
              onClick={() => setActiveTab('applications')}
            >
              Connected Applications
            </button>
          </nav>
          <div>
            {activeTab === 'activity' && memoizedActivities}
            {activeTab === 'applications' && memoizedApplications}
          </div>
        </>
      )}

      {selectedApp && (
        <UpdateScopesModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onSave={handleUpdateScopes}
        />
      )}
    </div>
  );
};

export default PlaidItemManagementView;