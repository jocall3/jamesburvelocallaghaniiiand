import React from 'react';

// Interfaces for the invoice data structure
interface CompanyInfo {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
}

interface CustomerInfo {
  name: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceDetails {
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  purchaseOrderNumber?: string;
  currency: string; // e.g., "USD", "EUR"
  subtotal: number;
  taxRate?: number; // e.g., 0.08 for 8%
  taxAmount?: number;
  discountAmount?: number;
  total: number;
  paymentTerms?: string;
  notes?: string;
}

interface InvoiceTemplateProps {
  company: CompanyInfo;
  customer: CustomerInfo;
  invoice: InvoiceDetails;
  lineItems: InvoiceLineItem[];
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  company,
  customer,
  invoice,
  lineItems,
}) => {
  // Helper function for currency formatting
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Inline styles for a professional, self-contained look.
  // In a larger project, these might be moved to a CSS module or a styling library.
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      fontFamily: "'Helvetica Neue', 'Helvetica', Arial, sans-serif",
      fontSize: '12px',
      lineHeight: '1.5',
      color: '#333',
      maxWidth: '800px',
      margin: '20px auto',
      padding: '30px',
      border: '1px solid #eee',
      boxShadow: '0 0 10px rgba(0, 0, 0, .15)',
      backgroundColor: '#fff',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '40px',
      borderBottom: '1px solid #eee',
      paddingBottom: '20px',
    },
    logo: {
      maxWidth: '150px',
      maxHeight: '70px',
      objectFit: 'contain',
    },
    invoiceTitle: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'right',
      margin: 0,
    },
    addressBlock: {
      marginBottom: '30px',
      display: 'flex',
      justifyContent: 'space-between',
    },
    senderAddress: {
      width: '48%',
      textAlign: 'left',
    },
    recipientAddress: {
      width: '48%',
      textAlign: 'right',
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: 'bold',
      marginBottom: '5px',
      color: '#555',
    },
    invoiceDetails: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '30px',
      borderBottom: '1px solid #eee',
      paddingBottom: '20px',
    },
    invoiceMeta: {
      width: '48%',
      textAlign: 'left',
    },
    invoiceDates: {
      width: '48%',
      textAlign: 'right',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '30px',
    },
    th: {
      backgroundColor: '#f9f9f9',
      borderBottom: '1px solid #ddd',
      padding: '10px',
      textAlign: 'left',
      fontWeight: 'bold',
      color: '#555',
    },
    td: {
      borderBottom: '1px solid #eee',
      padding: '10px',
      textAlign: 'left',
    },
    totalRow: {
      textAlign: 'right',
      padding: '8px 10px',
      borderBottom: '1px solid #eee',
    },
    grandTotalRow: {
      textAlign: 'right',
      fontWeight: 'bold',
      fontSize: '16px',
      padding: '10px',
      backgroundColor: '#f9f9f9',
      borderTop: '2px solid #ddd',
    },
    notesSection: {
      marginTop: '30px',
      borderTop: '1px solid #eee',
      paddingTop: '20px',
    },
    footer: {
      marginTop: '40px',
      textAlign: 'center',
      fontSize: '10px',
      color: '#888',
      borderTop: '1px solid #eee',
      paddingTop: '20px',
    },
    paragraph: {
      margin: '0 0 5px 0',
    }
  };

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={{ flex: 1 }}>
          {company.logoUrl && (
            <img src={company.logoUrl} alt={`${company.name} Logo`} style={styles.logo} />
          )}
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <h1 style={styles.invoiceTitle}>INVOICE</h1>
        </div>
      </div>

      {/* Address Blocks (Sender and Recipient) */}
      <div style={styles.addressBlock}>
        <div style={styles.senderAddress}>
          <div style={styles.sectionTitle}>From:</div>
          <p style={styles.paragraph}><strong>{company.name}</strong></p>
          <p style={styles.paragraph}>{company.addressLine1}</p>
          {company.addressLine2 && <p style={styles.paragraph}>{company.addressLine2}</p>}
          <p style={styles.paragraph}>{company.city}, {company.state} {company.zip}</p>
          <p style={styles.paragraph}>{company.country}</p>
          {company.phone && <p style={styles.paragraph}>Phone: {company.phone}</p>}
          {company.email && <p style={styles.paragraph}>Email: {company.email}</p>}
          {company.website && <p style={styles.paragraph}>Website: {company.website}</p>}
        </div>
        <div style={styles.recipientAddress}>
          <div style={styles.sectionTitle}>Bill To:</div>
          <p style={styles.paragraph}><strong>{customer.name}</strong></p>
          <p style={styles.paragraph}>{customer.addressLine1}</p>
          {customer.addressLine2 && <p style={styles.paragraph}>{customer.addressLine2}</p>}
          <p style={styles.paragraph}>{customer.city}, {customer.state} {customer.zip}</p>
          <p style={styles.paragraph}>{customer.country}</p>
          {customer.email && <p style={styles.paragraph}>Email: {customer.email}</p>}
        </div>
      </div>

      {/* Invoice Details (Number, Dates, PO) */}
      <div style={styles.invoiceDetails}>
        <div style={styles.invoiceMeta}>
          <p style={styles.paragraph}><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
          {invoice.purchaseOrderNumber && (
            <p style={styles.paragraph}><strong>PO #:</strong> {invoice.purchaseOrderNumber}</p>
          )}
        </div>
        <div style={styles.invoiceDates}>
          <p style={styles.paragraph}><strong>Invoice Date:</strong> {invoice.invoiceDate}</p>
          <p style={styles.paragraph}><strong>Due Date:</strong> {invoice.dueDate}</p>
        </div>
      </div>

      {/* Line Items Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: '50%' }}>Description</th>
            <th style={{ ...styles.th, width: '15%', textAlign: 'center' }}>Qty</th>
            <th style={{ ...styles.th, width: '15%', textAlign: 'right' }}>Unit Price</th>
            <th style={{ ...styles.th, width: '20%', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => (
            <tr key={item.id}>
              <td style={styles.td}>{item.description}</td>
              <td style={{ ...styles.td, textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ ...styles.td, textAlign: 'right' }}>{formatCurrency(item.unitPrice, invoice.currency)}</td>
              <td style={{ ...styles.td, textAlign: 'right' }}>{formatCurrency(item.quantity * item.unitPrice, invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Summary */}
      <table style={{ ...styles.table, width: 'auto', marginLeft: 'auto' }}>
        <tbody>
          <tr>
            <td style={{ ...styles.totalRow, fontWeight: 'bold' }}>Subtotal:</td>
            <td style={{ ...styles.totalRow, fontWeight: 'bold' }}>{formatCurrency(invoice.subtotal, invoice.currency)}</td>
          </tr>
          {invoice.discountAmount !== undefined && invoice.discountAmount > 0 && (
            <tr>
              <td style={{ ...styles.totalRow, fontWeight: 'bold' }}>Discount:</td>
              <td style={{ ...styles.totalRow, fontWeight: 'bold', color: '#dc3545' }}>- {formatCurrency(invoice.discountAmount, invoice.currency)}</td>
            </tr>
          )}
          {invoice.taxAmount !== undefined && invoice.taxAmount > 0 && (
            <tr>
              <td style={{ ...styles.totalRow, fontWeight: 'bold' }}>Tax {invoice.taxRate ? `(${(invoice.taxRate * 100).toFixed(2)}%)` : ''}:</td>
              <td style={{ ...styles.totalRow, fontWeight: 'bold' }}>{formatCurrency(invoice.taxAmount, invoice.currency)}</td>
            </tr>
          )}
          <tr>
            <td style={styles.grandTotalRow}>TOTAL DUE:</td>
            <td style={styles.grandTotalRow}>{formatCurrency(invoice.total, invoice.currency)}</td>
          </tr>
        </tbody>
      </table>

      {/* Notes and Payment Terms */}
      {(invoice.paymentTerms || invoice.notes) && (
        <div style={styles.notesSection}>
          {invoice.paymentTerms && (
            <>
              <div style={styles.sectionTitle}>Payment Terms:</div>
              <p style={styles.paragraph}>{invoice.paymentTerms}</p>
            </>
          )}
          {invoice.notes && (
            <>
              <div style={styles.sectionTitle}>Notes:</div>
              <p style={styles.paragraph}>{invoice.notes}</p>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.paragraph}>Thank you for your business!</p>
        <p style={styles.paragraph}>
          {company.name} &bull; {company.addressLine1}, {company.city}, {company.state} {company.zip}
          {company.phone && ` \u2022 ${company.phone}`}
          {company.email && ` \u2022 ${company.email}`}
        </p>
      </div>
    </div>
  );
};

export default InvoiceTemplate;