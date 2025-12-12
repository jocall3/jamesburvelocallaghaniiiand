/*
Beyond the Bank Account Number: 4 Surprising Insights from Managing External Financial Data

Ever tried to integrate with a financial system? What seems like a simple task – just getting an account number, right? – quickly unravels into a labyrinth of details. From routing codes to verification statuses, the world of external financial accounts is far more intricate than most realize. We recently delved into the structure of an `ExternalAccount` component, and what we found wasn't just code; it was a masterclass in handling real-world financial complexity. Here are the most impactful takeaways that might just change how you think about financial data.

**1. The Hidden Depths of an "External Account"**
Forget the simple mental model of an account number and a bank name. This data structure reveals a truly comprehensive view. An "external account" isn't just a destination for funds; it's a rich entity encompassing `Address` details for the party, multiple `RoutingDetail` entries (think SWIFT, ABA, IBAN, all in one place!), and even `ContactDetail` like email or phone numbers. It's a holistic profile, not just a transaction endpoint.

Why this matters: This level of detail underscores the regulatory and operational requirements for financial transactions. It's not enough to know *where* money goes; you often need to know *who* it's going to, *how* it gets there, and *how to contact them*. This comprehensive approach minimizes errors and enhances compliance.

**2. Verification Isn't Binary: The Power of 'Pending'**
In many systems, a status is either "on" or "off," "verified" or "unverified." But the `ExternalAccount` model introduces `pending_verification` as a first-class status. This seemingly small addition is a game-changer for real-world financial operations.

Why this matters: Financial verification processes are rarely instantaneous. They involve external checks, manual reviews, and often take time. A `pending_verification` status allows systems to gracefully handle these asynchronous workflows, providing transparency to users and preventing premature actions. It acknowledges the temporal reality of financial compliance.

**3. Security by Design: Obfuscating Sensitive Data at the Source**
One of the most impactful details isn't about what's *there*, but what's *not* immediately visible. The `AccountDetail` interface includes `account_number_safe: string`, which is explicitly used in the UI to display `••••` followed by the safe part of the number. The full `account_number` is conspicuously absent from the public interface.

Why this matters: This is a powerful example of security by design. By providing only a "safe" or truncated version of sensitive account numbers for display, the system minimizes the risk of exposing full account details in logs, UI, or less secure contexts. It's a subtle but critical architectural decision that prioritizes data protection from the ground up.

**4. The Global Tapestry of Payments: Beyond Your Local Bank**
The sheer variety of `routing_number_type` and `account_number_type` enums is a stark reminder of the global, fragmented nature of financial infrastructure. From `aba` (US) to `swift` (international), `clabe` (Mexico), `iban` (Europe), `in_ifsc` (India), and even `wallet_address`, this component is built to handle a truly worldwide array of payment rails.

Why this matters: For anyone building financial applications, this highlights the immense challenge and necessity of supporting diverse payment methods. It's a clear signal that modern financial platforms must be globally aware, abstracting away the complexities of local banking systems to provide a unified experience. Ignoring this diversity means severely limiting reach and functionality.

**Conclusion:**
What began as a look at a simple React component revealed a sophisticated understanding of financial data management. These insights — from the comprehensive nature of an external account to the nuanced handling of verification, the embedded security practices, and the global scope of payment types — offer a powerful lesson. They remind us that behind every seemingly straightforward financial interaction lies a meticulously crafted system designed to navigate a complex, regulated, and interconnected world.

What other hidden complexities do you think are essential for robust financial systems to manage effectively?
*/
import React from 'react';

// Type definitions based on the Modern Treasury OpenAPI spec

interface Address {
    id: string;
    object: string;
    live_mode: boolean;
    created_at: string;
    updated_at: string;
    line1: string | null;
    line2: string | null;
    locality: string | null;
    region: string | null;
    postal_code: string | null;
    country: string | null;
}

interface AccountDetail {
    id: string;
    object: string;
    live_mode: boolean;
    created_at: string;
    updated_at: string;
    discarded_at: string | null;
    account_number_type: 'clabe' | 'iban' | 'other' | 'pan' | 'wallet_address';
    account_number_safe: string;
}

interface RoutingDetail {
    id: string;
    object: string;
    live_mode: boolean;
    created_at: string;
    updated_at: string;
    discarded_at: string | null;
    routing_number: string;
    routing_number_type: 'aba' | 'au_bsb' | 'br_codigo' | 'ca_cpa' | 'cnaps' | 'gb_sort_code' | 'in_ifsc' | 'my_branch_code' | 'swift';
    payment_type: string | null;
    bank_name: string;
    bank_address: Address | null;
}

interface ContactDetail {
    id: string;
    object: string;
    live_mode: boolean;
    created_at: string;
    updated_at: string;
    discarded_at: string | null;
    contact_identifier: string;
    contact_identifier_type: 'email' | 'phone_number' | 'website';
}

export interface ExternalAccount {
    id: string;
    object: string;
    live_mode: boolean;
    created_at: string;
    updated_at: string;
    discarded_at: string | null;
    account_type: 'cash' | 'checking' | 'loan' | 'non_resident' | 'other' | 'overdraft' | 'savings';
    party_type: 'business' | 'individual' | null;
    party_address: Address | null;
    name: string | null;
    counterparty_id: string | null;
    account_details: AccountDetail[];
    routing_details: RoutingDetail[];
    metadata: { [key: string]: string };
    party_name: string;
    contact_details: ContactDetail[];
    verification_status: 'pending_verification' | 'unverified' | 'verified';
}

interface ExternalAccountsTableProps {
    accounts: ExternalAccount[];
    isLoading?: boolean;
    onVerify?: (accountId: string) => void;
    onEdit?: (accountId: string) => void;
    onDelete?: (accountId: string) => void;
}

const styles: { [key: string]: React.CSSProperties } = {
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: '14px',
    },
    th: {
        textAlign: 'left',
        padding: '12px 15px',
        borderBottom: '2px solid #e0e0e0',
        backgroundColor: '#f8f9fa',
        fontWeight: 600,
        color: '#495057',
    },
    td: {
        textAlign: 'left',
        padding: '12px 15px',
        borderBottom: '1px solid #e9ecef',
    },
    tr: {},
    emptyState: {
        textAlign: 'center',
        padding: '20px',
        color: '#6c757d',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    statusBadge: {
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'white',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
    },
    verified: {
        backgroundColor: '#28a745',
    },
    pending: {
        backgroundColor: '#ffc107',
        color: '#212529',
    },
    unverified: {
        backgroundColor: '#6c757d',
    },
    actionsCell: {
        display: 'flex',
        gap: '10px',
    },
    actionButton: {
        padding: '6px 12px',
        fontSize: '12px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        backgroundColor: 'white',
        cursor: 'pointer',
    }
};

const ExternalAccountsTable: React.FC<ExternalAccountsTableProps> = ({ 
    accounts,
    isLoading,
    onVerify,
    onEdit,
    onDelete 
}) => {
    const renderVerificationStatus = (status: ExternalAccount['verification_status']) => {
        let style: React.CSSProperties;
        const text = status.replace('_', ' ');

        switch (status) {
            case 'verified':
                style = { ...styles.statusBadge, ...styles.verified };
                break;
            case 'pending_verification':
                style = { ...styles.statusBadge, ...styles.pending };
                break;
            case 'unverified':
            default:
                style = { ...styles.statusBadge, ...styles.unverified };
                break;
        }

        return <span style={style}>{text}</span>;
    };

    if (isLoading) {
        return <div style={styles.emptyState}>Loading accounts...</div>;
    }

    if (!accounts || accounts.length === 0) {
        return <div style={styles.emptyState}>No external accounts to display.</div>;
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Party Name</th>
                        <th style={styles.th}>Account Nickname</th>
                        <th style={styles.th}>Account Number</th>
                        <th style={styles.th}>Routing Number</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map((account) => (
                        <tr key={account.id} style={styles.tr}>
                            <td style={styles.td}>{account.party_name}</td>
                            <td style={styles.td}>{account.name || '—'}</td>
                            <td style={styles.td}>
                                {account.account_details?.[0]
                                    ? `•••• ${account.account_details[0].account_number_safe}`
                                    : 'N/A'}
                            </td>
                            <td style={styles.td}>
                                {account.routing_details?.[0]?.routing_number || 'N/A'}
                            </td>
                            <td style={styles.td}>
                                {renderVerificationStatus(account.verification_status)}
                            </td>
                            <td style={styles.td}>
                                <div style={styles.actionsCell}>
                                    {onVerify && account.verification_status !== 'verified' && (
                                        <button style={styles.actionButton} onClick={() => onVerify(account.id)}>
                                            Verify
                                        </button>
                                    )}
                                    {onEdit && (
                                        <button style={styles.actionButton} onClick={() => onEdit(account.id)}>
                                            Edit
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button style={styles.actionButton} onClick={() => onDelete(account.id)}>
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ExternalAccountsTable;