
import React, { useState, useMemo, useCallback } from 'react';

// Instead of parsing a massive YAML string which requires an external library,
// we define the data directly as a JavaScript object. This is safer and faster for this view.

const stripeResourcesData = {
  "account": {
    "business_profile": {
      "mcc": null,
      "name": null,
      "product_description": null,
      "support_address": null,
      "support_email": null,
      "support_phone": null,
      "support_url": null,
      "url": null
    },
    "business_type": null,
    "capabilities": {
      "card_payments": "active",
      "transfers": "active"
    },
    "charges_enabled": false,
    "country": "US",
    "created": 1234567890,
    "default_currency": "usd",
    "details_submitted": false,
    "email": "site@stripe.com",
    "id": "acct_1MWlHDJITzLVzkSm",
    "object": "account",
    "payouts_enabled": false,
    "type": "standard"
  },
  "balance": {
    "available": [
      {
        "amount": 0,
        "currency": "usd",
        "source_types": {
          "card": 0
        }
      }
    ],
    "livemode": false,
    "object": "balance",
    "pending": [
      {
        "amount": 0,
        "currency": "usd",
        "source_types": {
          "card": 0
        }
      }
    ]
  },
  "charge": {
    "amount": 100,
    "amount_captured": 0,
    "amount_refunded": 0,
    "balance_transaction": "txn_1MlLhiJITzLVzkSm0tDIM70A",
    "billing_details": {
      "address": {
        "city": null,
        "country": null,
        "line1": null,
        "line2": null,
        "postal_code": null,
        "state": null
      },
      "email": null,
      "name": "Jenny Rosen",
      "phone": null
    },
    "captured": false,
    "created": 1234567890,
    "currency": "usd",
    "description": "My First Test Charge (created for API docs)",
    "disputed": false,
    "id": "ch_1Mcd6UJITzLVzkSmp1XIBHoW",
    "livemode": false,
    "object": "charge",
    "paid": true,
    "payment_method": "card_1Mcd6SJITzLVzkSmqkE2eJHO",
    "status": "succeeded"
  },
  "customer": {
    "address": null,
    "balance": 0,
    "created": 1234567890,
    "currency": "usd",
    "default_source": null,
    "delinquent": false,
    "description": null,
    "email": null,
    "id": "cus_NNNslJKODLsLoG",
    "invoice_prefix": "1A66DA4",
    "livemode": false,
    "name": null,
    "next_invoice_sequence": 1,
    "object": "customer",
    "phone": null
  },
  "dispute": {
    "amount": 1000,
    "balance_transactions": [],
    "charge": "ch_1Mcd6UJITzLVzkSmp1XIBHoW",
    "created": 1234567890,
    "currency": "usd",
    "evidence": {
        "reason": "fraudulent"
    },
    "id": "dp_1MlLi1JITzLVzkSmdqrdx0Ir",
    "is_charge_refundable": true,
    "livemode": false,
    "object": "dispute",
    "reason": "general",
    "status": "warning_needs_response"
  },
  "invoice": {
    "account_country": "US",
    "amount_due": 1000,
    "amount_paid": 0,
    "amount_remaining": 1000,
    "attempt_count": 0,
    "attempted": false,
    "auto_advance": true,
    "billing_reason": "manual",
    "collection_method": "charge_automatically",
    "created": 1234567890,
    "currency": "usd",
    "customer": "cus_NNNslJKODLsLoG",
    "description": null,
    "id": "in_1MlLhvJITzLVzkSmcKw0tIgl",
    "livemode": false,
    "object": "invoice",
    "paid": false,
    "status": "draft",
    "subtotal": 1000,
    "total": 1000
  },
  "payout": {
    "amount": 1100,
    "arrival_date": 1234567890,
    "automatic": true,
    "balance_transaction": "txn_1MlLhiJITzLVzkSm0tDIM70A",
    "created": 1234567890,
    "currency": "usd",
    "description": "STRIPE PAYOUT",
    "destination": "ba_1MlLiCJITzLVzkSmzTHBeJt2",
    "id": "po_1MlLiCJITzLVzkSmTO8DFctc",
    "livemode": false,
    "method": "standard",
    "object": "payout",
    "status": "in_transit",
    "type": "bank_account"
  },
  "refund": {
    "amount": 100,
    "balance_transaction": null,
    "charge": "ch_1Mcd6UJITzLVzkSmp1XIBHoW",
    "created": 1234567890,
    "currency": "usd",
    "id": "re_1MlLi1JITzLVzkSmYjN8VXsL",
    "object": "refund",
    "reason": null,
    "status": "succeeded"
  },
  "subscription": {
    "application_fee_percent": null,
    "billing_cycle_anchor": 1234567890,
    "cancel_at_period_end": false,
    "collection_method": "charge_automatically",
    "created": 1234567890,
    "currency": "usd",
    "current_period_end": 1234567890,
    "current_period_start": 1234567890,
    "customer": "cus_NNNslJKODLsLoG",
    "id": "sub_1MlLi1JITzLVzkSmbGPN6d9R",
    "items": {
      "data": [],
      "has_more": false,
      "object": "list",
      "url": "/v1/subscription_items?subscription=sub_1MlLi1JITzLVzkSmbGPN6d9R"
    },
    "livemode": false,
    "object": "subscription",
    "start_date": 1234567890,
    "status": "active"
  }
};

const JsonViewer: React.FC<{ data: object }> = ({ data }) => (
  <pre style={styles.jsonViewer}>
    {JSON.stringify(data, null, 2)}
  </pre>
);

interface ResourceViewProps {
  resourceKey: string | null;
  resourceData: any;
}

const ResourceView: React.FC<ResourceViewProps> = ({ resourceKey, resourceData }) => {
  if (!resourceKey || !resourceData) {
    return (
      <div style={styles.resourceViewWelcome}>
        <h2>Welcome to Stripe Nexus</h2>
        <p>Select a resource from the list on the left to view its details.</p>
      </div>
    );
  }

  return (
    <div style={styles.resourceViewContainer}>
      <h2 style={styles.resourceViewHeader}>{resourceKey}</h2>
      <JsonViewer data={resourceData} />
    </div>
  );
};

interface SidebarProps {
  resourceKeys: string[];
  searchTerm: string;
  selectedResourceKey: string | null;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectResource: (key: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  resourceKeys,
  searchTerm,
  selectedResourceKey,
  onSearchChange,
  onSelectResource,
}) => (
  <div style={styles.sidebar}>
    <div style={styles.sidebarHeader}>
      <h1 style={styles.sidebarTitle}>Stripe Nexus</h1>
      <input
        type="text"
        placeholder="Search resources..."
        value={searchTerm}
        onChange={onSearchChange}
        style={styles.searchInput}
      />
    </div>
    <ul style={styles.resourceList}>
      {resourceKeys.length > 0 ? (
        resourceKeys.map((key) => (
          <li
            key={key}
            onClick={() => onSelectResource(key)}
            style={
              key === selectedResourceKey
                ? { ...styles.resourceListItem, ...styles.resourceListItemSelected }
                : styles.resourceListItem
            }
          >
            {key}
          </li>
        ))
      ) : (
        <li style={{...styles.resourceListItem, cursor: 'default'}}>No results found.</li>
      )}
    </ul>
  </div>
);


const StripeNexusView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResourceKey, setSelectedResourceKey] = useState<string | null>(null);

    // Use the static data directly
    const stripeData = stripeResourcesData as any;

    const allResourceKeys = useMemo(() => Object.keys(stripeData).sort(), [stripeData]);

    const filteredResourceKeys = useMemo(() => {
        if (!searchTerm) {
            return allResourceKeys;
        }
        return allResourceKeys.filter(key =>
            key.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allResourceKeys, searchTerm]);
    
    const handleSelectResource = useCallback((key: string) => {
        setSelectedResourceKey(key);
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);
    
    const selectedResourceData = useMemo(() => {
        return selectedResourceKey ? stripeData[selectedResourceKey] : null;
    }, [selectedResourceKey, stripeData]);

    return (
        <div style={styles.container}>
            <Sidebar
                resourceKeys={filteredResourceKeys}
                searchTerm={searchTerm}
                selectedResourceKey={selectedResourceKey}
                onSearchChange={handleSearchChange}
                onSelectResource={handleSelectResource}
            />
            <main style={styles.mainContent}>
                <ResourceView 
                    resourceKey={selectedResourceKey}
                    resourceData={selectedResourceData}
                />
            </main>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        height: '100vh',
        width: '100vw',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        color: '#333',
        overflow: 'hidden',
    },
    sidebar: {
        width: '300px',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f7f7f7',
        flexShrink: 0,
    },
    sidebarHeader: {
        padding: '1rem',
        borderBottom: '1px solid #e0e0e0',
    },
    sidebarTitle: {
        margin: '0 0 0.5rem 0',
        fontSize: '1.5rem',
    },
    searchInput: {
        width: '100%',
        padding: '0.5rem',
        borderRadius: '5px',
        border: '1px solid #ccc',
        boxSizing: 'border-box',
    },
    resourceList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        overflowY: 'auto',
        flexGrow: 1,
    },
    resourceListItem: {
        padding: '0.75rem 1rem',
        cursor: 'pointer',
        borderBottom: '1px solid #eee',
        transition: 'background-color 0.2s',
        fontSize: '14px',
    },
    resourceListItemSelected: {
        backgroundColor: '#e0e7ff',
        color: '#3730a3',
        fontWeight: 600,
    },
    mainContent: {
        flexGrow: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        backgroundColor: '#fff',
    },
    resourceViewContainer: {
        height: '100%',
    },
    resourceViewHeader: {
        marginTop: 0,
        marginBottom: '1rem',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '0.5rem',
    },
    resourceViewWelcome: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: 'calc(100vh - 3rem)',
        color: '#777',
        textAlign: 'center',
    },
    jsonViewer: {
        backgroundColor: '#f4f4f4',
        border: '1px solid #ddd',
        borderRadius: '5px',
        padding: '1rem',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        fontSize: '14px',
        color: '#333',
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'auto',
    },
};

export default StripeNexusView;
