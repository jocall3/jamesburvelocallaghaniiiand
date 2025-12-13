```typescript
import React, { useState, useEffect } from 'react';

// The James Burvel O’Callaghan III Code - BEGIN
// Company: Alpha Corp - External Accounts Table Component

// A1: Address Interface Definition
interface A1_Address {
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
    getAddressDetailsA1: (this: A1_Address) => string;
}
// A1.getAddressDetailsA1 Implementation (placeholder for actual logic)
A1_Address.prototype.getAddressDetailsA1 = function() { return `Address Details: ID - ${this.id}, Line 1 - ${this.line1 || 'N/A'}`; };

// A2: AccountDetail Interface Definition
interface A2_AccountDetail {
    id: string;
    object: string;
    live_mode: boolean;
    created_at: string;
    updated_at: string;
    discarded_at: string | null;
    account_number_type: 'clabe' | 'iban' | 'other' | 'pan' | 'wallet_address';
    account_number_safe: string;
    getAccountDetailSummaryA2: (this: A2_AccountDetail) => string;
}
// A2.getAccountDetailSummaryA2 Implementation (placeholder for actual logic)
A2_AccountDetail.prototype.getAccountDetailSummaryA2 = function() { return `Account Detail: Type - ${this.account_number_type}, Number - ${this.account_number_safe}`; };

// A3: RoutingDetail Interface Definition
interface A3_RoutingDetail {
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
    bank_address: A1_Address | null;
    getRoutingDetailDescriptionA3: (this: A3_RoutingDetail) => string;
}
// A3.getRoutingDetailDescriptionA3 Implementation (placeholder for actual logic)
A3_RoutingDetail.prototype.getRoutingDetailDescriptionA3 = function() { return `Routing Detail: Number - ${this.routing_number}, Bank - ${this.bank_name}`; };

// A4: ContactDetail Interface Definition
interface A4_ContactDetail {
    id: string;
    object: string;
    live_mode: boolean;
    created_at: string;
    updated_at: string;
    discarded_at: string | null;
    contact_identifier: string;
    contact_identifier_type: 'email' | 'phone_number' | 'website';
    getContactDetailSummaryA4: (this: A4_ContactDetail) => string;
}
// A4.getContactDetailSummaryA4 Implementation (placeholder for actual logic)
A4_ContactDetail.prototype.getContactDetailSummaryA4 = function() { return `Contact Detail: Type - ${this.contact_identifier_type}, Value - ${this.contact_identifier}`; };

// A5: ExternalAccount Interface Definition
export interface A5_ExternalAccount {
    id: string;
    object: string;
    live_mode: boolean;
    created_at: string;
    updated_at: string;
    discarded_at: string | null;
    account_type: 'cash' | 'checking' | 'loan' | 'non_resident' | 'other' | 'overdraft' | 'savings';
    party_type: 'business' | 'individual' | null;
    party_address: A1_Address | null;
    name: string | null;
    counterparty_id: string | null;
    account_details: A2_AccountDetail[];
    routing_details: A3_RoutingDetail[];
    metadata: { [key: string]: string };
    party_name: string;
    contact_details: A4_ContactDetail[];
    verification_status: 'pending_verification' | 'unverified' | 'verified';
    getExternalAccountSummaryA5: (this: A5_ExternalAccount) => string;
    getExternalAccountDetailsA5: (this: A5_ExternalAccount) => string;
    verifyAccountA5: (this: A5_ExternalAccount) => void;
    editAccountA5: (this: A5_ExternalAccount) => void;
    deleteAccountA5: (this: A5_ExternalAccount) => void;
}
// A5.getExternalAccountSummaryA5 Implementation (placeholder for actual logic)
A5_ExternalAccount.prototype.getExternalAccountSummaryA5 = function() { return `External Account Summary: ID - ${this.id}, Name - ${this.name || 'N/A'}, Status - ${this.verification_status}`; };
// A5.getExternalAccountDetailsA5 Implementation (placeholder for actual logic)
A5_ExternalAccount.prototype.getExternalAccountDetailsA5 = function() { return `External Account Details: Party - ${this.party_name}, Type - ${this.account_type}`; };
// A5.verifyAccountA5 Implementation (placeholder for actual logic)
A5_ExternalAccount.prototype.verifyAccountA5 = function() { console.log(`Verifying account: ${this.id}`); };
// A5.editAccountA5 Implementation (placeholder for actual logic)
A5_ExternalAccount.prototype.editAccountA5 = function() { console.log(`Editing account: ${this.id}`); };
// A5.deleteAccountA5 Implementation (placeholder for actual logic)
A5_ExternalAccount.prototype.deleteAccountA5 = function() { console.log(`Deleting account: ${this.id}`); };

// A6: ExternalAccountsTableProps Interface Definition
interface A6_ExternalAccountsTableProps {
    accounts: A5_ExternalAccount[];
    isLoading?: boolean;
    onVerify?: (accountId: string) => void;
    onEdit?: (accountId: string) => void;
    onDelete?: (accountId: string) => void;
    getTableTitle?: (this: A6_ExternalAccountsTableProps) => string;
    getTableDescription?: (this: A6_ExternalAccountsTableProps) => string;
}
// A6.getTableTitle Implementation (placeholder for actual logic)
A6_ExternalAccountsTableProps.prototype.getTableTitle = function() { return 'External Accounts Overview'; };
// A6.getTableDescription Implementation (placeholder for actual logic)
A6_ExternalAccountsTableProps.prototype.getTableDescription = function() { return 'A comprehensive table displaying all external accounts, with detailed information and action options.'; };

// B1: Styles Object - The James Burvel O’Callaghan III Code
const B1_styles: { [key: string]: React.CSSProperties } = {
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.05)',
    },
    th: {
        textAlign: 'left',
        padding: '16px 20px',
        borderBottom: '2px solid #e0e0e0',
        backgroundColor: '#f8f9fa',
        fontWeight: 600,
        color: '#495057',
        fontSize: '14px',
        position: 'sticky',
        top: 0,
        zIndex: 1,
    },
    td: {
        textAlign: 'left',
        padding: '16px 20px',
        borderBottom: '1px solid #e9ecef',
        fontSize: '14px',
    },
    tr: {
        transition: 'background-color 0.2s ease-in-out',
        ':hover': {
            backgroundColor: '#f0f0f0',
        },
    },
    emptyState: {
        textAlign: 'center',
        padding: '20px',
        color: '#6c757d',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: '16px',
    },
    statusBadge: {
        padding: '6px 12px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'white',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        minWidth: '80px',
        textAlign: 'center',
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
        justifyContent: 'flex-start',
    },
    actionButton: {
        padding: '8px 16px',
        fontSize: '14px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        backgroundColor: 'white',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
        ':hover': {
            backgroundColor: '#f0f0f0',
            borderColor: '#b0b0b0',
        },
        ':focus': {
            outline: 'none',
            boxShadow: '0 0 0 2px rgba(0, 123, 255, 0.25)',
        },
    },
    headerContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        marginBottom: '10px',
        borderRadius: '4px',
    },
    tableContainer: {
        overflowX: 'auto',
    },
    buttonContainer: {
        display: 'flex',
        gap: '10px',
        marginBottom: '10px',
    },
    filterInput: {
        padding: '8px 12px',
        fontSize: '14px',
        borderRadius: '4px',
        border: '1px solid #ced4da',
        width: '200px',
    },
};

// C1: Functional Component - The James Burvel O’Callaghan III Code
const C1_ExternalAccountsTable: React.FC<A6_ExternalAccountsTableProps> = ({
    accounts,
    isLoading,
    onVerify,
    onEdit,
    onDelete,
}) => {
    // State variables
    const [C1_filterText, setC1_filterText] = useState<string>('');
    const [C1_sortColumn, setC1_sortColumn] = useState<keyof A5_ExternalAccount | null>(null);
    const [C1_sortDirection, setC1_sortDirection] = useState<'asc' | 'desc'>('asc');
    const [C1_currentPage, setC1_currentPage] = useState<number>(1);
    const [C1_itemsPerPage, setC1_itemsPerPage] = useState<number>(10);
    const [C1_showInactive, setShowInactive] = useState<boolean>(false);
    const [C1_selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    // D1: Helper Functions
    const D1_handleVerify = (accountId: string) => {
        if (onVerify) {
            onVerify(accountId);
        }
    };
    const D2_handleEdit = (accountId: string) => {
        if (onEdit) {
            onEdit(accountId);
        }
    };
    const D3_handleDelete = (accountId: string) => {
        if (onDelete) {
            onDelete(accountId);
        }
    };
    const D4_handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setC1_filterText(event.target.value);
        setC1_currentPage(1); // Reset to the first page when filtering
    };
    const D5_handleSort = (column: keyof A5_ExternalAccount) => {
        if (C1_sortColumn === column) {
            setC1_sortDirection(C1_sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setC1_sortColumn(column);
            setC1_sortDirection('asc');
        }
    };
    const D6_handlePageChange = (newPage: number) => {
        setC1_currentPage(newPage);
    };
    const D7_handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setC1_itemsPerPage(parseInt(event.target.value, 10));
        setC1_currentPage(1); // Reset to the first page when changing items per page
    };
    const D8_handleShowInactiveChange = () => {
        setShowInactive(!C1_showInactive);
        setC1_currentPage(1);
    };
    const D9_handleAccountRowClick = (accountId: string) => {
        setSelectedAccountId(C1_selectedAccountId === accountId ? null : accountId);
    };
    const D10_renderVerificationStatus = (status: A5_ExternalAccount['verification_status']) => {
        let style: React.CSSProperties;
        const text = status.replace('_', ' ');

        switch (status) {
            case 'verified':
                style = { ...B1_styles.statusBadge, ...B1_styles.verified };
                break;
            case 'pending_verification':
                style = { ...B1_styles.statusBadge, ...B1_styles.pending };
                break;
            case 'unverified':
            default:
                style = { ...B1_styles.statusBadge, ...B1_styles.unverified };
                break;
        }

        return <span style={style}>{text}</span>;
    };
    const D11_formatAccountNumber = (account: A5_ExternalAccount) => {
        if (!account.account_details || account.account_details.length === 0) {
            return 'N/A';
        }
        return `****${account.account_details[0].account_number_safe.slice(-4)}`;
    };

    // E1: Data Transformation and Filtering
    const E1_filteredAndSortedAccounts = React.useMemo(() => {
        let filteredAccounts = accounts ? [...accounts] : [];

        // Apply Inactive Filter
        if (!C1_showInactive) {
            filteredAccounts = filteredAccounts.filter(account => account.verification_status !== 'unverified' && account.discarded_at === null);
        }

        // Apply Filter Text
        if (C1_filterText) {
            const lowerCaseFilter = C1_filterText.toLowerCase();
            filteredAccounts = filteredAccounts.filter(account =>
                (account.party_name && account.party_name.toLowerCase().includes(lowerCaseFilter)) ||
                (account.name && account.name.toLowerCase().includes(lowerCaseFilter)) ||
                (account.account_details?.[0]?.account_number_safe && account.account_details[0].account_number_safe.toLowerCase().includes(lowerCaseFilter)) ||
                (account.routing_details?.[0]?.routing_number && account.routing_details[0].routing_number.toLowerCase().includes(lowerCaseFilter))
            );
        }

        // Apply Sorting
        if (C1_sortColumn) {
            filteredAccounts.sort((a, b) => {
                const aValue = a[C1_sortColumn];
                const bValue = b[C1_sortColumn];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    const comparison = aValue.localeCompare(bValue);
                    return C1_sortDirection === 'asc' ? comparison : -comparison;
                }

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return C1_sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                }

                return 0; // Fallback for other types
            });
        }

        return filteredAccounts;
    }, [accounts, C1_filterText, C1_sortColumn, C1_sortDirection, C1_showInactive]);

    // E2: Pagination Logic
    const E2_paginatedAccounts = React.useMemo(() => {
        const startIndex = (C1_currentPage - 1) * C1_itemsPerPage;
        return E1_filteredAndSortedAccounts.slice(startIndex, startIndex + C1_itemsPerPage);
    }, [E1_filteredAndSortedAccounts, C1_currentPage, C1_itemsPerPage]);

    // F1: UI Rendering
    if (isLoading) {
        return (
            <div style={B1_styles.emptyState}>
                Loading accounts...
            </div>
        );
    }

    if (!accounts || accounts.length === 0) {
        return (
            <div style={B1_styles.emptyState}>
                No external accounts to display.
            </div>
        );
    }

    // G1: UI Elements - The James Burvel O’Callaghan III Code
    const G1_renderHeader = () => (
        <div style={B1_styles.headerContainer}>
            <div>
                <h2>{new A6_ExternalAccountsTableProps().getTableTitle()}</h2>
                <p>{new A6_ExternalAccountsTableProps().getTableDescription()}</p>
            </div>
            <div style={B1_styles.buttonContainer}>
                <input
                    type="text"
                    placeholder="Filter accounts..."
                    style={B1_styles.filterInput}
                    value={C1_filterText}
                    onChange={D4_handleFilterChange}
                />
                <label>
                    <input
                        type="checkbox"
                        checked={C1_showInactive}
                        onChange={D8_handleShowInactiveChange}
                    />
                    Show Inactive Accounts
                </label>
            </div>
        </div>
    );
    const G2_renderTable = () => (
        <div style={B1_styles.tableContainer}>
            <table style={B1_styles.table}>
                <thead>
                    <tr>
                        <th style={B1_styles.th} onClick={() => D5_handleSort('party_name')}>
                            Party Name {C1_sortColumn === 'party_name' && (C1_sortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                        <th style={B1_styles.th} onClick={() => D5_handleSort('name')}>
                            Account Nickname {C1_sortColumn === 'name' && (C1_sortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                        <th style={B1_styles.th}>
                            Account Number
                        </th>
                        <th style={B1_styles.th} onClick={() => D5_handleSort('routing_details')}>
                            Routing Number {C1_sortColumn === 'routing_details' && (C1_sortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                        <th style={B1_styles.th} onClick={() => D5_handleSort('verification_status')}>
                            Status {C1_sortColumn === 'verification_status' && (C1_sortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                        <th style={B1_styles.th}>
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {E2_paginatedAccounts.map((account) => (
                        <tr
                            key={account.id}
                            style={{
                                ...B1_styles.tr,
                                backgroundColor: C1_selectedAccountId === account.id ? '#e8f0fe' : 'inherit',
                            }}
                            onClick={() => D9_handleAccountRowClick(account.id)}
                        >
                            <td style={B1_styles.td}>{account.party_name}</td>
                            <td style={B1_styles.td}>{account.name || 'N/A'}</td>
                            <td style={B1_styles.td}>{D11_formatAccountNumber(account)}</td>
                            <td style={B1_styles.td}>
                                {account.routing_details?.[0]?.routing_number || 'N/A'}
                            </td>
                            <td style={B1_styles.td}>{D10_renderVerificationStatus(account.verification_status)}</td>
                            <td style={B1_styles.td}>
                                <div style={B1_styles.actionsCell}>
                                    {onVerify && account.verification_status !== 'verified' && (
                                        <button style={B1_styles.actionButton} onClick={() => D1_handleVerify(account.id)}>
                                            Verify
                                        </button>
                                    )}
                                    {onEdit && (
                                        <button style={B1_styles.actionButton} onClick={() => D2_handleEdit(account.id)}>
                                            Edit
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button style={B1_styles.actionButton} onClick={() => D3_handleDelete(account.id)}>
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
    const G3_renderPagination = () => {
        const totalPages = Math.ceil(E1_filteredAndSortedAccounts.length / C1_itemsPerPage);
        if (totalPages <= 1) return null;

        const pageNumbers = [];
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }

        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div>
                    Showing {E2_paginatedAccounts.length} of {E1_filteredAndSortedAccounts.length} accounts.
                </div>
                <div>
                    <select value={C1_itemsPerPage} onChange={D7_handleItemsPerPageChange} style={{ marginRight: '10px', padding: '6px 12px', borderRadius: '4px', border: '1px solid #ced4da' }}>
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                    </select>
                    {pageNumbers.map(number => (
                        <button
                            key={number}
                            onClick={() => D6_handlePageChange(number)}
                            style={{
                                padding: '6px 12px',
                                margin: '0 4px',
                                borderRadius: '4px',
                                border: '1px solid #ced4da',
                                backgroundColor: C1_currentPage === number ? '#007bff' : 'white',
                                color: C1_currentPage === number ? 'white' : '#007bff',
                                cursor: 'pointer',
                            }}
                        >
                            {number}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div>
            {G1_renderHeader()}
            {G2_renderTable()}
            {G3_renderPagination()}
        </div>
    );
};
export default C1_ExternalAccountsTable;
// The James Burvel O’Callaghan III Code - END
```