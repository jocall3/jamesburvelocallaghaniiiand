import React, { useState, useEffect } from 'react';

// Mock data interfaces for demonstration purposes
interface TaxReportSummary {
  totalTaxCollected: number;
  taxableTransactions: number;
  lastUpdated: string;
}

interface TaxCollectedByRegion {
  region: string;
  amount: number;
  transactions: number;
}

interface TaxLiability {
  authority: string;
  amountDue: number;
  dueDate: string;
}

// --- Mock Data ---
const mockTaxSummary: TaxReportSummary = {
  totalTaxCollected: 12345.67,
  taxableTransactions: 567,
  lastUpdated: '2023-10-27 10:30 AM',
};

const mockTaxByRegion: TaxCollectedByRegion[] = [
  { region: 'California, USA', amount: 5123.45, transactions: 210 },
  { region: 'New York, USA', amount: 3210.90, transactions: 150 },
  { region: 'Ontario, Canada', amount: 2100.00, transactions: 90 },
  { region: 'Texas, USA', amount: 1911.32, transactions: 117 },
];

const mockTaxLiability: TaxLiability[] = [
  { authority: 'California CDTFA', amountDue: 5123.45, dueDate: '2023-11-20' },
  { authority: 'New York State Tax Dept.', amountDue: 3210.90, dueDate: '2023-11-20' },
  { authority: 'Canada Revenue Agency', amountDue: 2100.00, dueDate: '2023-12-31' },
];

const TaxComplianceDashboard: React.FC = () => {
  // State for configuration settings
  const [stripeTaxEnabled, setStripeTaxEnabled] = useState<boolean>(true);
  const [nexusAddresses, setNexusAddresses] = useState<string[]>(['123 Main St, Anytown, CA, USA']);
  // Placeholder links to Stripe Dashboard for managing specific tax settings
  const [productTaxCodesLink] = useState<string>('https://dashboard.stripe.com/settings/tax/product-tax-codes');
  const [taxExemptionsLink] = useState<string>('https://dashboard.stripe.com/settings/tax/exemptions');

  // State for report data
  const [summary, setSummary] = useState<TaxReportSummary | null>(null);
  const [byRegion, setByRegion] = useState<TaxCollectedByRegion[]>([]);
  const [liability, setLiability] = useState<TaxLiability[]>([]);

  // Simulate data fetching on component mount
  useEffect(() => {
    // In a real application, these would be API calls to Stripe or a backend service
    setSummary(mockTaxSummary);
    setByRegion(mockTaxByRegion);
    setLiability(mockTaxLiability);
  }, []);

  // --- Event Handlers ---
  const handleToggleStripeTax = () => {
    setStripeTaxEnabled(!stripeTaxEnabled);
    // TODO: Implement API call to update Stripe Tax enablement status
    console.log(`Stripe Tax ${stripeTaxEnabled ? 'disabled' : 'enabled'} (action simulated)`);
  };

  const handleAddNexusAddress = () => {
    const newAddress = prompt('Enter new nexus address (e.g., "456 Oak Ave, Metropolis, NY, USA"):');
    if (newAddress && newAddress.trim() !== '') {
      setNexusAddresses([...nexusAddresses, newAddress.trim()]);
      // TODO: Implement API call to add nexus address
      console.log(`Added nexus address: ${newAddress} (action simulated)`);
    }
  };

  const handleRemoveNexusAddress = (index: number) => {
    const updatedAddresses = nexusAddresses.filter((_, i) => i !== index);
    setNexusAddresses(updatedAddresses);
    // TODO: Implement API call to remove nexus address
    console.log(`Removed nexus address at index ${index} (action simulated)`);
  };

  const handleExportReports = (format: 'csv' | 'pdf') => {
    alert(`Exporting reports in ${format.toUpperCase()} format... (Functionality not implemented)`);
    // TODO: Implement API call to generate and download the report in the specified format
  };

  // --- Inline Styles for basic UI (replace with a UI library in a real project) ---
  const dashboardContainerStyle: React.CSSProperties = {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    color: '#333',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '25px',
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fff',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '28px',
    marginBottom: '25px',
    color: '#333',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  };

  const subHeaderStyle: React.CSSProperties = {
    fontSize: '22px',
    marginBottom: '15px',
    color: '#555',
  };

  const tertiaryHeaderStyle: React.CSSProperties = {
    fontSize: '18px',
    marginBottom: '10px',
    color: '#666',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 18px',
    marginRight: '10px',
    borderRadius: '5px',
    border: '1px solid #007bff',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    borderColor: '#6c757d',
  };

  const dangerButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  };

  const linkButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    textDecoration: 'none',
    display: 'inline-block',
    lineHeight: '1', // Adjust for vertical alignment with text
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
  };

  const thTdStyle: React.CSSProperties = {
    border: '1px solid #ddd',
    padding: '12px',
    textAlign: 'left',
  };

  const thStyle: React.CSSProperties = {
    ...thTdStyle,
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  };

  const infoTextStyle: React.CSSProperties = {
    fontSize: '0.95em',
    color: '#666',
    marginBottom: '10px',
  };

  return (
    <div style={dashboardContainerStyle}>
      <h1 style={headerStyle}>Tax Compliance Dashboard</h1>

      {/* Overview Section */}
      <div style={sectionStyle}>
        <h2 style={subHeaderStyle}>Overview</h2>
        {summary ? (
          <div>
            <p><strong>Total Tax Collected (YTD):</strong> <span style={{ color: '#28a745', fontWeight: 'bold' }}>${summary.totalTaxCollected.toFixed(2)}</span></p>
            <p><strong>Taxable Transactions (YTD):</strong> {summary.taxableTransactions}</p>
            <p style={infoTextStyle}>Last Updated: {summary.lastUpdated}</p>
          </div>
        ) : (
          <p>Loading summary data...</p>
        )}
      </div>

      {/* Configuration Section */}
      <div style={sectionStyle}>
        <h2 style={subHeaderStyle}>Stripe Tax Configuration</h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={stripeTaxEnabled}
              onChange={handleToggleStripeTax}
              style={{ marginRight: '12px', transform: 'scale(1.3)' }}
            />
            <span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>Enable Stripe Tax</span>
          </label>
          <p style={{ ...infoTextStyle, marginTop: '10px' }}>
            {stripeTaxEnabled
              ? 'Stripe Tax is currently enabled. Tax will be automatically calculated and collected for eligible transactions based on your settings.'
              : 'Stripe Tax is currently disabled. Enable it to automate tax calculation and collection across your sales.'}
          </p>
        </div>

        <div style={{ marginTop: '25px' }}>
          <h3 style={tertiaryHeaderStyle}>Nexus Addresses</h3>
          <p style={infoTextStyle}>
            These are the physical locations where your business has a tax obligation. Stripe Tax uses these to determine where you need to collect tax.
          </p>
          {nexusAddresses.length === 0 ? (
            <p>No nexus addresses configured. Add one to ensure correct tax calculation.</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {nexusAddresses.map((address, index) => (
                <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px', border: '1px solid #eee' }}>
                  <span style={{ flexGrow: 1, marginRight: '15px' }}>{address}</span>
                  <button onClick={() => handleRemoveNexusAddress(index)} style={dangerButtonStyle}>Remove</button>
                </li>
              ))}
            </ul>
          )}
          <button onClick={handleAddNexusAddress} style={buttonStyle}>Add Nexus Address</button>
        </div>

        <div style={{ marginTop: '25px' }}>
          <h3 style={tertiaryHeaderStyle}>Product Tax Codes & Exemptions</h3>
          <p style={infoTextStyle}>
            Manage how different products are taxed and configure customer tax exemptions directly in your Stripe Dashboard.
          </p>
          <a href={productTaxCodesLink} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>
            Manage Product Tax Codes
          </a>
          <a href={taxExemptionsLink} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>
            Manage Tax Exemptions
          </a>
        </div>
      </div>

      {/* Reporting Section */}
      <div style={sectionStyle}>
        <h2 style={subHeaderStyle}>Tax Reports</h2>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={tertiaryHeaderStyle}>Tax Collected by Region</h3>
          <p style={infoTextStyle}>
            Breakdown of tax collected across different geographical regions.
          </p>
          {byRegion.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Region</th>
                  <th style={thStyle}>Amount Collected</th>
                  <th style={thStyle}>Transactions</th>
                </tr>
              </thead>
              <tbody>
                {byRegion.map((data, index) => (
                  <tr key={index}>
                    <td style={thTdStyle}>{data.region}</td>
                    <td style={thTdStyle}>${data.amount.toFixed(2)}</td>
                    <td style={thTdStyle}>{data.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No regional tax data available for the current period.</p>
          )}
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={tertiaryHeaderStyle}>Tax Liability</h3>
          <p style={infoTextStyle}>
            Summary of tax amounts owed to various tax authorities, helping you prepare for filings.
          </p>
          {liability.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Tax Authority</th>
                  <th style={thStyle}>Amount Due</th>
                  <th style={thStyle}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {liability.map((data, index) => (
                  <tr key={index}>
                    <td style={thTdStyle}>{data.authority}</td>
                    <td style={thTdStyle}>${data.amountDue.toFixed(2)}</td>
                    <td style={thTdStyle}>{data.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No tax liability data available for the current period.</p>
          )}
        </div>

        <div style={{ marginTop: '25px' }}>
          <h3 style={tertiaryHeaderStyle}>Export Reports</h3>
          <p style={infoTextStyle}>
            Download detailed tax reports for your accounting and compliance needs.
          </p>
          <button onClick={() => handleExportReports('csv')} style={buttonStyle}>Export as CSV</button>
          <button onClick={() => handleExportReports('pdf')} style={secondaryButtonStyle}>Export as PDF</button>
        </div>
      </div>

      {/* Footer/Documentation */}
      <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.9em', color: '#666' }}>
        <p>
          For more detailed information on Stripe Tax, please refer to the official{' '}
          <a href="https://stripe.com/docs/tax" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none' }}>
            Stripe Tax Documentation
          </a>.
        </p>
      </div>
    </div>
  );
};

export default TaxComplianceDashboard;