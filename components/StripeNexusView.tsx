import React, { useState, useMemo, useCallback } from 'react';

// Placeholder for the unified brand Citibankdemobusinessinc
const Citibankdemobusinessinc = {
    // This namespace will be populated with the 10 business models
};

// --- Generative Data Functions ---
const generateRandomString = (length: number = 10): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const generateRandomNumber = (min: number = 0, max: number = 1000000): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRandomDate = (): number => {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    return start.getTime() + Math.random() * (end.getTime() - start.getTime());
};

const generateRandomBoolean = (): boolean => {
    return Math.random() > 0.5;
};

const generateRandomCurrency = (): string => {
    const currencies = ['usd', 'eur', 'gbp', 'jpy'];
    return currencies[Math.floor(Math.random() * currencies.length)];
};

const generateRandomMCC = (): string => {
    const mccCodes = ['5411', '5412', '5941', '7311', '5812'];
    return mccCodes[Math.floor(Math.random() * mccCodes.length)];
};

const generateRandomBusinessType = (): string => {
    const businessTypes = ['sole_proprietor', 'llc', 'corporation', 'partnership'];
    return businessTypes[Math.floor(Math.random() * businessTypes.length)];
};

const generateRandomCapabilityStatus = (): 'active' | 'inactive' | 'pending' => {
    const statuses = ['active', 'inactive', 'pending'];
    return statuses[Math.floor(Math.random() * statuses.length)];
};

const generateRandomCountry = (): string => {
    const countries = ['US', 'CA', 'GB', 'DE', 'FR', 'JP'];
    return countries[Math.floor(Math.random() * countries.length)];
};

const generateRandomEmail = (): string => {
    return `${generateRandomString(8)}@example.com`;
};

const generateRandomAddress = (): object => {
    return {
        city: `City${generateRandomString(4)}`,
        country: generateRandomCountry(),
        line1: `${generateRandomNumber(1, 999)} Main St`,
        line2: null,
        postal_code: `${generateRandomNumber(10000, 99999)}`,
        state: `ST${generateRandomNumber(1, 50)}`,
    };
};

const generateRandomBillingDetails = (): object => {
    return {
        address: generateRandomAddress(),
        email: generateRandomEmail(),
        name: `Customer ${generateRandomString(6)}`,
        phone: `+1-${generateRandomNumber(100, 999)}-${generateRandomNumber(100, 999)}-${generateRandomNumber(1000)}`,
    };
};

const generateRandomSourceTypes = (amount: number): object => {
    return {
        card: amount,
    };
};

const generateRandomBalance = (): object => {
    const availableAmount = generateRandomNumber(0, 1000000);
    const pendingAmount = generateRandomNumber(0, 500000);
    return {
        available: [{ amount: availableAmount, currency: generateRandomCurrency(), source_types: generateRandomSourceTypes(availableAmount) }],
        livemode: generateRandomBoolean(),
        object: 'balance',
        pending: [{ amount: pendingAmount, currency: generateRandomCurrency(), source_types: generateRandomSourceTypes(pendingAmount) }],
    };
};

const generateRandomCharge = (): object => {
    const amount = generateRandomNumber(500, 50000);
    const amountCaptured = generateRandomBoolean() ? amount : generateRandomNumber(0, amount);
    const amountRefunded = generateRandomBoolean() ? generateRandomNumber(0, amountCaptured) : 0;
    const paid = generateRandomBoolean();
    const disputed = generateRandomBoolean() && paid;
    const status = disputed ? 'disputed' : paid ? 'succeeded' : 'failed';

    return {
        amount: amount,
        amount_captured: amountCaptured,
        amount_refunded: amountRefunded,
        balance_transaction: `txn_${generateRandomString(20)}`,
        billing_details: generateRandomBillingDetails(),
        captured: amountCaptured === amount,
        created: generateRandomDate(),
        currency: generateRandomCurrency(),
        description: `Test Charge ${generateRandomString(10)}`,
        disputed: disputed,
        id: `ch_${generateRandomString(20)}`,
        livemode: generateRandomBoolean(),
        object: 'charge',
        paid: paid,
        payment_method: `card_${generateRandomString(20)}`,
        status: status,
    };
};

const generateRandomCustomer = (): object => {
    return {
        address: generateRandomBoolean() ? generateRandomAddress() : null,
        balance: generateRandomNumber(-1000, 1000),
        created: generateRandomDate(),
        currency: generateRandomCurrency(),
        default_source: generateRandomBoolean() ? `card_${generateRandomString(20)}` : null,
        delinquent: generateRandomBoolean(),
        description: generateRandomBoolean() ? `Customer ${generateRandomString(8)}` : null,
        email: generateRandomBoolean() ? generateRandomEmail() : null,
        id: `cus_${generateRandomString(15)}`,
        invoice_prefix: generateRandomString(7).toUpperCase(),
        livemode: generateRandomBoolean(),
        name: generateRandomBoolean() ? `Customer Name ${generateRandomString(5)}` : null,
        next_invoice_sequence: generateRandomNumber(1, 100),
        object: 'customer',
        phone: generateRandomBoolean() ? `+1-${generateRandomNumber(100, 999)}-${generateRandomNumber(100, 999)}-${generateRandomNumber(1000)}` : null,
    };
};

const generateRandomDispute = (): object => {
    const amount = generateRandomNumber(100, 10000);
    const status = ['warning_needs_response', 'lost', 'won', 'under_review'][Math.floor(Math.random() * 4)];
    return {
        amount: amount,
        balance_transactions: [],
        charge: `ch_${generateRandomString(20)}`,
        created: generateRandomDate(),
        currency: generateRandomCurrency(),
        evidence: {
            reason: ['fraudulent', 'duplicate', 'unauthorized_charge'][Math.floor(Math.random() * 3)],
        },
        id: `dp_${generateRandomString(18)}`,
        is_charge_refundable: generateRandomBoolean(),
        livemode: generateRandomBoolean(),
        object: 'dispute',
        reason: 'general',
        status: status,
    };
};

const generateRandomInvoice = (): object => {
    const amount = generateRandomNumber(1000, 100000);
    const amountPaid = generateRandomBoolean() ? amount : generateRandomNumber(0, amount);
    const status = ['draft', 'open', 'paid', 'uncollectible', 'void'][Math.floor(Math.random() * 5)];
    return {
        account_country: generateRandomCountry(),
        amount_due: amount,
        amount_paid: amountPaid,
        amount_remaining: amount - amountPaid,
        attempt_count: generateRandomNumber(0, 5),
        attempted: status !== 'draft',
        auto_advance: generateRandomBoolean(),
        billing_reason: ['manual', 'subscription', 'quote'][Math.floor(Math.random() * 3)],
        collection_method: ['charge_automatically', 'send_invoice'][Math.floor(Math.random() * 2)],
        created: generateRandomDate(),
        currency: generateRandomCurrency(),
        customer: `cus_${generateRandomString(15)}`,
        description: generateRandomBoolean() ? `Invoice ${generateRandomString(8)}` : null,
        id: `in_${generateRandomString(18)}`,
        livemode: generateRandomBoolean(),
        object: 'invoice',
        paid: status === 'paid',
        status: status,
        subtotal: amount,
        total: amount,
    };
};

const generateRandomPayout = (): object => {
    const amount = generateRandomNumber(100, 500000);
    return {
        amount: amount,
        arrival_date: generateRandomDate() + 86400000 * 3, // Payouts take a few days
        automatic: generateRandomBoolean(),
        balance_transaction: `txn_${generateRandomString(20)}`,
        created: generateRandomDate(),
        currency: generateRandomCurrency(),
        description: 'Stripe Payout',
        destination: `ba_${generateRandomString(18)}`,
        id: `po_${generateRandomString(18)}`,
        livemode: generateRandomBoolean(),
        method: 'standard',
        object: 'payout',
        status: ['paid', 'in_transit', 'failed', 'canceled'][Math.floor(Math.random() * 4)],
        type: 'bank_account',
    };
};

const generateRandomRefund = (): object => {
    const amount = generateRandomNumber(10, 10000);
    return {
        amount: amount,
        balance_transaction: generateRandomBoolean() ? `txn_${generateRandomString(20)}` : null,
        charge: `ch_${generateRandomString(20)}`,
        created: generateRandomDate(),
        currency: generateRandomCurrency(),
        id: `re_${generateRandomString(18)}`,
        object: 'refund',
        reason: generateRandomBoolean() ? ['requested_by_customer', 'duplicate', 'fraudulent'][Math.floor(Math.random() * 3)] : null,
        status: 'succeeded',
    };
};

const generateRandomSubscription = (): object => {
    const startDate = generateRandomDate();
    const periodDays = 30 * 24 * 60 * 60 * 1000; // 30 days
    const currentPeriodStart = startDate;
    const currentPeriodEnd = currentPeriodStart + periodDays;
    const status = ['active', 'canceled', 'incomplete', 'past_due', 'trialing'][Math.floor(Math.random() * 5)];
    const cancelAtPeriodEnd = status === 'canceled' ? generateRandomBoolean() : false;

    return {
        application_fee_percent: generateRandomBoolean() ? generateRandomNumber(1, 20) : null,
        billing_cycle_anchor: startDate,
        cancel_at_period_end: cancelAtPeriodEnd,
        collection_method: ['charge_automatically', 'send_invoice'][Math.floor(Math.random() * 2)],
        created: startDate,
        currency: generateRandomCurrency(),
        current_period_end: currentPeriodEnd,
        current_period_start: currentPeriodStart,
        customer: `cus_${generateRandomString(15)}`,
        id: `sub_${generateRandomString(18)}`,
        items: {
            data: [
                {
                    id: `si_${generateRandomString(18)}`,
                    object: 'subscription_item',
                    plan: {
                        id: `plan_${generateRandomString(10)}`,
                        name: `Plan ${generateRandomString(5)}`,
                        amount: generateRandomNumber(1000, 100000),
                        currency: generateRandomCurrency(),
                        interval: ['day', 'week', 'month', 'year'][Math.floor(Math.random() * 4)],
                        interval_count: 1,
                        trial_period_days: generateRandomBoolean() ? generateRandomNumber(1, 30) : 0,
                    },
                    quantity: 1,
                },
            ],
            has_more: false,
            object: 'list',
            url: `/v1/subscription_items?subscription=${'sub_' + generateRandomString(18)}`,
        },
        livemode: generateRandomBoolean(),
        object: 'subscription',
        start_date: startDate,
        status: status,
    };
};

const generateRandomAccount = (): object => {
    const businessType = generateRandomBusinessType();
    const country = generateRandomCountry();
    const capabilities = {
        card_payments: generateRandomCapabilityStatus(),
        transfers: generateRandomCapabilityStatus(),
        // Add more capabilities as needed
    };
    const chargesEnabled = generateRandomBoolean();
    const payoutsEnabled = generateRandomBoolean();
    const detailsSubmitted = generateRandomBoolean();

    return {
        business_profile: {
            mcc: generateRandomBoolean() ? generateRandomMCC() : null,
            name: `Business ${generateRandomString(10)}`,
            product_description: 'A leading provider of innovative solutions.',
            support_address: generateRandomAddress(),
            support_email: generateRandomEmail(),
            support_phone: `+1-${generateRandomNumber(100, 999)}-${generateRandomNumber(100, 999)}-${generateRandomNumber(1000)}`,
            support_url: `https://${generateRandomString(8)}.com`,
            url: `https://${generateRandomString(8)}.com`,
        },
        business_type: businessType,
        capabilities: capabilities,
        charges_enabled: chargesEnabled,
        country: country,
        created: generateRandomDate(),
        default_currency: generateRandomCurrency(),
        details_submitted: detailsSubmitted,
        email: generateRandomEmail(),
        id: `acct_${generateRandomString(16)}`,
        object: 'account',
        payouts_enabled: payoutsEnabled,
        type: 'standard',
    };
};

// --- Mock Data Generation ---
const generateMockStripeData = (): { [key: string]: object } => {
    return {
        account: generateRandomAccount(),
        balance: generateRandomBalance(),
        charge: generateRandomCharge(),
        customer: generateRandomCustomer(),
        dispute: generateRandomDispute(),
        invoice: generateRandomInvoice(),
        payout: generateRandomPayout(),
        refund: generateRandomRefund(),
        subscription: generateRandomSubscription(),
    };
};

// --- Component Definitions ---

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
                <li style={{ ...styles.resourceListItem, cursor: 'default' }}>No results found.</li>
            )}
        </ul>
    </div>
);

// --- Main Application Component ---
const StripeNexusView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResourceKey, setSelectedResourceKey] = useState<string | null>(null);

    // Generate mock data on component mount
    const stripeData = useMemo(() => generateMockStripeData(), []);

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

// --- Styles ---
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

// --- Master Orchestration Layer ---
// This is a placeholder for the master orchestration layer.
// In a real implementation, this would manage the lifecycle and interaction
// of all 10 business models.
const masterOrchestrationLayer = {
    name: "Citibankdemobusinessinc Unified Ecosystem",
    description: "Orchestrates 10 business models to establish open banking as the U.S. standard.",
    businessModels: Citibankdemobusinessinc, // Reference to the populated Citibankdemobusinessinc object
    initialize: () => {
        console.log("Initializing Citibankdemobusinessinc Unified Ecosystem...");
        // In a full implementation, this would involve:
        // - Loading and initializing each of the 10 business models.
        // - Setting up inter-branch communication (e.g., event bus, shared kernel).
        // - Configuring global settings and security primitives.
        // - Starting background services for each model.
        console.log("Citibankdemobusinessinc Unified Ecosystem initialized.");
    },
    shutdown: () => {
        console.log("Shutting down Citibankdemobusinessinc Unified Ecosystem...");
        // Clean up resources, stop services, etc.
        console.log("Citibankdemobusinessinc Unified Ecosystem shut down.");
    }
};

// Example of how a business model might be added (this would happen in separate files)
// Citibankdemobusinessinc.openBankingGateway = { ... };
// Citibankdemobusinessinc.secureDataExchange = { ... };
// ... and so on for all 10 models.

// For demonstration purposes, we'll export the StripeNexusView and the orchestration layer.
// In a real scenario, the orchestration layer would be the main entry point.

export { StripeNexusView, masterOrchestrationLayer };
export default StripeNexusView;