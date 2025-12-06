
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
