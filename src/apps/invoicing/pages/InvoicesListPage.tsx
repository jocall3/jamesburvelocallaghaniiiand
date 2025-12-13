import React, { useState, useEffect, useMemo } from 'react';

// Define the Invoice interface
interface Invoice {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void';
  dueDate: string; // ISO date string (e.g., "2023-10-26")
  createdAt: string; // ISO date string (e.g., "2023-09-26")
  invoiceNumber: string;
}

// Helper function to generate mock invoice data
const generateMockInvoices = (count: number): Invoice[] => {
  const statuses: Invoice['status'][] = ['draft', 'open', 'paid', 'void'];
  const customers = [
    { name: 'Acme Corp', email: 'billing@acmecorp.com' },
    { name: 'Globex Inc', email: 'accounts@globex.net' },
    { name: 'Soylent Corp', email: 'finance@soylent.io' },
    { name: 'Initech', email: 'invoices@initech.biz' },
    { name: 'Umbrella Corp', email: 'payments@umbrellacorp.com' },
    { name: 'Cyberdyne Systems', email: 'info@cyberdyne.com' },
    { name: 'Tyrell Corporation', email: 'contact@tyrellcorp.com' },
    { name: 'Weyland-Yutani Corp', email: 'billing@weyland.com' },
    { name: 'Stark Industries', email: 'accounts@stark.com' },
  ];

  const invoices: Invoice[] = [];
  for (let i = 1; i <= count; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = parseFloat((Math.random() * 1000 + 50).toFixed(2));
    const daysAgoCreated = Math.floor(Math.random() * 120); // Invoices created up to 120 days ago
    const createdAt = new Date(Date.now() - daysAgoCreated * 24 * 60 * 60 * 1000);
    
    // Due date is typically 15-30 days after creation
    const daysUntilDue = Math.floor(Math.random() * 15) + 15; 
    const dueDate = new Date(createdAt.getTime() + daysUntilDue * 24 * 60 * 60 * 1000);

    invoices.push({
      id: `inv_${Math.random().toString(36).substr(2, 9)}`,
      customerName: customer.name,
      customerEmail: customer.email,
      amount: amount,
      currency: 'USD',
      status: status,
      dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
      createdAt: createdAt.toISOString().split('T')[0], // YYYY-MM-DD
      invoiceNumber: `INV-${1000 + i}`,
    });
  }
  return invoices;
};

const InvoicesListPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | Invoice['status']>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10); // Number of invoices per page

  // Simulate fetching invoice data from an API
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockInvoices: Invoice[] = generateMockInvoices(50); // Generate 50 mock invoices
        setInvoices(mockInvoices);
      } catch (err) {
        setError('Failed to fetch invoices. Please try again.');
        console.error('Error fetching invoices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // Memoized filtered and searched invoices
  const filteredAndSearchedInvoices = useMemo(() => {
    let filtered = invoices;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        invoice =>
          invoice.customerName.toLowerCase().includes(lowerCaseSearchTerm) ||
          invoice.invoiceNumber.toLowerCase().includes(lowerCaseSearchTerm) ||
          invoice.customerEmail.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    return filtered;
  }, [invoices, filterStatus, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSearchedInvoices.length / itemsPerPage);
  const currentInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSearchedInvoices.slice(startIndex, endIndex);
  }, [filteredAndSearchedInvoices, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Basic inline styles for demonstration purposes, assuming a global stylesheet would handle this in production
  const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: {
      padding: '20px',
      fontFamily: 'Inter, sans-serif', // Using a common modern font
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f9fafb',
      minHeight: '100vh',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      borderBottom: '1px solid #e5e7eb',
      paddingBottom: '15px',
    },
    h1: {
      margin: 0,
      fontSize: '28px',
      color: '#1f2937',
      fontWeight: '600',
    },
    createButton: {
      backgroundColor: '#6366f1', // Indigo 500
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      transition: 'background-color 0.2s ease-in-out',
    },
    createButtonHover: {
      backgroundColor: '#4f46e5', // Indigo 600
    },
    controlsSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '15px',
    },
    statusTabs: {
      display: 'flex',
      gap: '5px',
      backgroundColor: 'white',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
      padding: '4px',
    },
    tabButton: {
      padding: '8px 15px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#4b5563',
      fontWeight: '500',
      transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out',
    },
    tabButtonActive: {
      backgroundColor: '#e0e7ff', // Indigo 100
      color: '#4f46e5', // Indigo 600
      fontWeight: '600',
    },
    searchInput: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      width: '280px',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    tableContainer: {
      overflowX: 'auto',
      marginBottom: '20px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '800px', // Ensure table doesn't get too small
    },
    th: {
      textAlign: 'left',
      padding: '12px 15px',
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb',
      color: '#4b5563',
      fontSize: '14px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    td: {
      textAlign: 'left',
      padding: '12px 15px',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '14px',
      color: '#374151',
    },
    statusBadge: {
      padding: '4px 10px',
      borderRadius: '9999px', // Full rounded
      fontSize: '12px',
      fontWeight: '600',
      color: 'white',
      display: 'inline-block',
      minWidth: '70px',
      textAlign: 'center',
    },
    statusDraft: { backgroundColor: '#9ca3af' }, // Gray 400
    statusOpen: { backgroundColor: '#6366f1' },   // Indigo 500
    statusPaid: { backgroundColor: '#10b981' },   // Green 500
    statusVoid: { backgroundColor: '#ef4444' },   // Red 500
    actionButton: {
      backgroundColor: 'transparent',
      color: '#6366f1', // Indigo 500
      border: 'none',
      padding: '5px 10px',
      cursor: 'pointer',
      fontSize: '13px',
      marginRight: '5px',
      borderRadius: '4px',
      transition: 'background-color 0.2s ease-in-out',
    },
    actionButtonHover: {
      backgroundColor: '#e0e7ff', // Indigo 100
    },
    pagination: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '10px',
      marginTop: '20px',
      color: '#4b5563',
      fontSize: '14px',
    },
    paginationButton: {
      padding: '8px 15px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#4b5563',
      fontWeight: '500',
      transition: 'background-color 0.2s ease-in-out',
    },
    paginationButtonHover: {
      backgroundColor: '#f3f4f6',
    },
    paginationButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      backgroundColor: '#f9fafb',
    },
    errorMessage: {
      color: '#ef4444', // Red 500
      padding: '15px',
      backgroundColor: '#fee2e2', // Red 100
      border: '1px solid #fca5a5', // Red 300
      borderRadius: '8px',
      marginBottom: '20px',
      fontWeight: '500',
    },
    loadingMessage: {
      textAlign: 'center',
      padding: '40px',
      fontSize: '16px',
      color: '#6b7280', // Gray 500
    },
    noInvoicesMessage: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280', // Gray 500
      fontSize: '16px',
    }
  };

  const getStatusBadgeStyle = (status: Invoice['status']): React.CSSProperties => {
    switch (status) {
      case 'draft': return styles.statusDraft;
      case 'open': return styles.statusOpen;
      case 'paid': return styles.statusPaid;
      case 'void': return styles.statusVoid;
      default: return {};
    }
  };

  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Invoices</h1>
        <button 
          style={styles.createButton} 
          onClick={() => alert('Navigating to Create Invoice page...')}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.createButtonHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.createButton)}
        >
          + Create Invoice
        </button>
      </header>

      <div style={styles.controlsSection}>
        <div style={styles.statusTabs}>
          {['all', 'draft', 'open', 'paid', 'void'].map(status => (
            <button
              key={status}
              style={{
                ...styles.tabButton,
                ...(filterStatus === status ? styles.tabButtonActive : {}),
              }}
              onClick={() => {
                setFilterStatus(status as any);
                setCurrentPage(1); // Reset page on filter change
              }}
              onMouseEnter={(e) => {
                if (filterStatus !== status) Object.assign(e.currentTarget.style, { backgroundColor: '#f3f4f6' });
              }}
              onMouseLeave={(e) => {
                if (filterStatus !== status) Object.assign(e.currentTarget.style, { backgroundColor: 'transparent' });
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by customer, invoice #, email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset page on search change
          }}
          style={styles.searchInput}
        />
      </div>

      {loading && <p style={styles.loadingMessage}>Loading invoices...</p>}
      {error && <p style={styles.errorMessage}>{error}</p>}

      {!loading && !error && (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Invoice #</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Due Date</th>
                  <th style={styles.th}>Created At</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, ...styles.noInvoicesMessage }}>No invoices found matching your criteria.</td>
                  </tr>
                ) : (
                  currentInvoices.map(invoice => (
                    <tr key={invoice.id}>
                      <td style={styles.td}>{invoice.invoiceNumber}</td>
                      <td style={styles.td}>{invoice.customerName}</td>
                      <td style={styles.td}>{invoice.currency} {invoice.amount.toFixed(2)}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(invoice.status) }}>
                          {invoice.status}
                        </span>
                      </td>
                      <td style={styles.td}>{new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td style={styles.td}>{new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td style={styles.td}>
                        <button 
                          style={styles.actionButton} 
                          onClick={() => alert(`Viewing invoice ${invoice.invoiceNumber}`)}
                          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionButtonHover)}
                          onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.actionButton)}
                        >
                          View
                        </button>
                        {invoice.status === 'draft' && (
                          <button 
                            style={styles.actionButton} 
                            onClick={() => alert(`Editing invoice ${invoice.invoiceNumber}`)}
                            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionButtonHover)}
                            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.actionButton)}
                          >
                            Edit
                          </button>
                        )}
                        {invoice.status === 'open' && (
                          <button 
                            style={styles.actionButton} 
                            onClick={() => alert(`Sending invoice ${invoice.invoiceNumber}`)}
                            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionButtonHover)}
                            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.actionButton)}
                          >
                            Send
                          </button>
                        )}
                        {/* Add more actions based on status, e.g., 'Mark as Paid', 'Void', 'Download PDF' */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={{ ...styles.paginationButton, ...(currentPage === 1 ? styles.paginationButtonDisabled : {}) }}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                onMouseEnter={(e) => { if (currentPage !== 1) Object.assign(e.currentTarget.style, styles.paginationButtonHover); }}
                onMouseLeave={(e) => { if (currentPage !== 1) Object.assign(e.currentTarget.style, styles.paginationButton); }}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                style={{ ...styles.paginationButton, ...(currentPage === totalPages ? styles.paginationButtonDisabled : {}) }}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                onMouseEnter={(e) => { if (currentPage !== totalPages) Object.assign(e.currentTarget.style, styles.paginationButtonHover); }}
                onMouseLeave={(e) => { if (currentPage !== totalPages) Object.assign(e.currentTarget.style, styles.paginationButton); }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvoicesListPage;