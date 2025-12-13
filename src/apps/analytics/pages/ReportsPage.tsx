import React, { useState, useEffect, useCallback } from 'react';
import './ReportsPage.css'; // Assuming a CSS file for basic styling

// Define types for report data
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
}

interface RevenueByProduct {
  productName: string;
  totalRevenue: number;
  transactionsCount: number;
}

interface CustomerChurn {
  customerId: string;
  customerEmail: string;
  churnDate: string;
  reason: string;
}

type ReportData = Transaction[] | RevenueByProduct[] | CustomerChurn[] | null;

// Helper function to format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<string>('transaction_summary');
  const [startDate, setStartDate] = useState<string>(formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))); // Default to 30 days ago
  const [endDate, setEndDate] = useState<string>(formatDate(new Date())); // Default to today
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<ReportData>(null);
  const [error, setError] = useState<string | null>(null);

  const availableReportTypes = [
    { value: 'transaction_summary', label: 'Transaction Summary' },
    { value: 'revenue_by_product', label: 'Revenue by Product' },
    { value: 'customer_churn', label: 'Customer Churn Analysis' },
    { value: 'subscription_growth', label: 'Subscription Growth' },
    { value: 'payout_reconciliation', label: 'Payout Reconciliation' },
  ];

  // Mock data generation function
  const generateMockReportData = useCallback((type: string, start: string, end: string): ReportData => {
    const mockTransactions: Transaction[] = [
      { id: 'txn_001', date: '2023-10-26', description: 'Premium Subscription', amount: 99.99, currency: 'USD', status: 'succeeded' },
      { id: 'txn_002', date: '2023-10-27', description: 'API Credits Pack', amount: 25.00, currency: 'USD', status: 'succeeded' },
      { id: 'txn_003', date: '2023-10-28', description: 'Basic Plan', amount: 19.99, currency: 'USD', status: 'succeeded' },
      { id: 'txn_004', date: '2023-11-01', description: 'Enterprise License', amount: 499.00, currency: 'USD', status: 'succeeded' },
      { id: 'txn_005', date: '2023-11-02', description: 'Refund for txn_003', amount: -19.99, currency: 'USD', status: 'refunded' },
      { id: 'txn_006', date: '2023-11-05', description: 'Premium Subscription', amount: 99.99, currency: 'USD', status: 'succeeded' },
      { id: 'txn_007', date: '2023-11-06', description: 'API Credits Pack', amount: 25.00, currency: 'USD', status: 'failed' },
      { id: 'txn_008', date: '2023-11-07', description: 'Basic Plan', amount: 19.99, currency: 'USD', status: 'succeeded' },
      { id: 'txn_009', date: '2023-11-10', description: 'Enterprise License', amount: 499.00, currency: 'USD', status: 'succeeded' },
      { id: 'txn_010', date: '2023-11-12', description: 'Premium Subscription', amount: 99.99, currency: 'USD', status: 'succeeded' },
    ];

    const filteredTransactions = mockTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const startD = new Date(start);
      const endD = new Date(end);
      return transactionDate >= startD && transactionDate <= endD;
    });

    switch (type) {
      case 'transaction_summary':
        return filteredTransactions;
      case 'revenue_by_product':
        const revenueMap = new Map<string, { totalRevenue: number; transactionsCount: number }>();
        filteredTransactions.forEach(t => {
          if (t.status === 'succeeded') {
            const current = revenueMap.get(t.description) || { totalRevenue: 0, transactionsCount: 0 };
            revenueMap.set(t.description, {
              totalRevenue: current.totalRevenue + t.amount,
              transactionsCount: current.transactionsCount + 1,
            });
          }
        });
        return Array.from(revenueMap.entries()).map(([productName, data]) => ({
          productName,
          totalRevenue: parseFloat(data.totalRevenue.toFixed(2)),
          transactionsCount: data.transactionsCount,
        }));
      case 'customer_churn':
        return [
          { customerId: 'cus_abc123', customerEmail: 'john.doe@example.com', churnDate: '2023-10-30', reason: 'High price' },
          { customerId: 'cus_def456', customerEmail: 'jane.smith@example.com', churnDate: '2023-11-05', reason: 'Found alternative' },
        ].filter(c => {
          const churnD = new Date(c.churnDate);
          const startD = new Date(start);
          const endD = new Date(end);
          return churnD >= startD && churnD <= endD;
        });
      case 'subscription_growth':
        // Mock data for subscription growth
        return [
          { month: 'Oct 2023', newSubscriptions: 15, cancelledSubscriptions: 3, netGrowth: 12 },
          { month: 'Nov 2023', newSubscriptions: 20, cancelledSubscriptions: 5, netGrowth: 15 },
        ];
      case 'payout_reconciliation':
        // Mock data for payout reconciliation
        return [
          { payoutId: 'po_123', date: '2023-10-31', amount: 1234.56, status: 'paid', fees: 12.34 },
          { payoutId: 'po_456', date: '2023-11-15', amount: 2345.67, status: 'paid', fees: 23.45 },
        ];
      default:
        return null;
    }
  }, []);

  const handleGenerateReport = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setReportData(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const data = generateMockReportData(reportType, startDate, endDate);
      setReportData(data);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [reportType, startDate, endDate, generateMockReportData]);

  useEffect(() => {
    // Automatically generate a report on initial load or when date range/type changes
    handleGenerateReport();
  }, [handleGenerateReport]); // Dependency array ensures this runs when handleGenerateReport changes

  const convertToCSV = (data: ReportData): string => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(fieldName => {
            const value = (row as any)[fieldName];
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    return csvRows.join('\n');
  };

  const handleDownloadCSV = () => {
    if (!reportData) {
      alert('No report data to download.');
      return;
    }
    const csv = convertToCSV(reportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${reportType}_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    // In a real application, you'd use a library like jsPDF or send data to a backend
    // to generate a PDF. For this example, we'll just show an alert.
    alert('PDF download is not implemented in this demo. In a real app, this would generate a PDF.');
    console.log('Simulating PDF download for:', reportData);
  };

  const renderReportTable = () => {
    if (!reportData || reportData.length === 0) {
      return <p>No data available for this report type and date range.</p>;
    }

    const headers = Object.keys(reportData[0]);

    return (
      <div className="report-table-container">
        <table>
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header}>{header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map(header => (
                  <td key={`${rowIndex}-${header}`}>{(row as any)[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="reports-page">
      <header className="reports-header">
        <h1>Financial Reports</h1>
        <p>Generate, customize, and download your financial reports.</p>
      </header>

      <section className="report-controls">
        <div className="control-group">
          <label htmlFor="report-type">Report Type:</label>
          <select
            id="report-type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            disabled={isLoading}
          >
            {availableReportTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="start-date">Start Date:</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="control-group">
          <label htmlFor="end-date">End Date:</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button onClick={handleGenerateReport} disabled={isLoading} className="generate-button">
          {isLoading ? 'Generating...' : 'Generate Report'}
        </button>
      </section>

      {error && <div className="error-message">{error}</div>}

      <section className="report-display">
        <h2>Generated Report: {availableReportTypes.find(t => t.value === reportType)?.label}</h2>
        {isLoading ? (
          <div className="loading-spinner">Loading report data...</div>
        ) : (
          <>
            {reportData && reportData.length > 0 && (
              <div className="report-actions">
                <button onClick={handleDownloadCSV} className="download-button csv">
                  Download CSV
                </button>
                <button onClick={handleDownloadPDF} className="download-button pdf">
                  Download PDF
                </button>
              </div>
            )}
            {renderReportTable()}
          </>
        )}
      </section>
    </div>
  );
};

export default ReportsPage;

// Basic CSS for ReportsPage.css (would typically be in a separate file)
/*
.reports-page {
  font-family: 'Inter', sans-serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f9fafb;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.reports-header {
  margin-bottom: 30px;
  text-align: center;
}

.reports-header h1 {
  font-size: 2.5em;
  color: #333;
  margin-bottom: 10px;
}

.reports-header p {
  font-size: 1.1em;
  color: #666;
}

.report-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  align-items: flex-end;
}

.control-group {
  display: flex;
  flex-direction: column;
  min-width: 180px;
}

.control-group label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
  font-size: 0.95em;
}

.control-group select,
.control-group input[type="date"] {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  color: #333;
  background-color: #fefefe;
  transition: border-color 0.2s ease-in-out;
}

.control-group select:focus,
.control-group input[type="date"]:focus {
  border-color: #635bff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(99, 91, 255, 0.2);
}

.control-group select:disabled,
.control-group input[type="date"]:disabled {
  background-color: #eee;
  cursor: not-allowed;
}

.generate-button {
  padding: 10px 20px;
  background-color: #635bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease;
  min-width: 150px;
}

.generate-button:hover:not(:disabled) {
  background-color: #524ac7;
  transform: translateY(-1px);
}

.generate-button:active:not(:disabled) {
  transform: translateY(0);
}

.generate-button:disabled {
  background-color: #a7a1ff;
  cursor: not-allowed;
}

.error-message {
  background-color: #ffe0e0;
  color: #cc0000;
  border: 1px solid #cc0000;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: 500;
}

.report-display {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.report-display h2 {
  font-size: 1.8em;
  color: #333;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}

.loading-spinner {
  text-align: center;
  padding: 50px;
  font-size: 1.2em;
  color: #777;
}

.report-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  justify-content: flex-end;
}

.download-button {
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  font-size: 0.95em;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease;
}

.download-button.csv {
  background-color: #28a745;
  color: white;
}

.download-button.csv:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.download-button.pdf {
  background-color: #dc3545;
  color: white;
}

.download-button.pdf:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.report-table-container {
  overflow-x: auto;
}

.report-table-container table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.report-table-container th,
.report-table-container td {
  border: 1px solid #eee;
  padding: 12px 15px;
  text-align: left;
}

.report-table-container th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #444;
  white-space: nowrap;
}

.report-table-container tbody tr:nth-child(even) {
  background-color: #fcfcfc;
}

.report-table-container tbody tr:hover {
  background-color: #f0f0f0;
}

*/