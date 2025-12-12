import React from 'react';

export interface Application {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: string;
  applicationType: string;
  accountEnabled: boolean;
  applicationVisibility: string;
  assignmentRequired: boolean;
  isAppProxy: boolean;
}

interface ExportControlsProps {
  data: Application[];
  filename?: string;
}

const ExportControls: React.FC<ExportControlsProps> = ({ data, filename = 'applications_export.csv' }) => {
  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      console.warn("No data available to export.");
      return;
    }

    const headers: (keyof Application)[] = [
        'id', 'displayName', 'appId', 'createdDateTime', 'applicationType',
        'accountEnabled', 'applicationVisibility', 'assignmentRequired', 'isAppProxy'
    ];

    const csvHeader = headers.join(',');

    const csvRows = data.map(row =>
      headers.map(fieldName => {
        const value = row[fieldName];
        const stringValue = value === null || value === undefined ? '' : String(value);
        const escapedValue = stringValue.replace(/"/g, '""');

        if (/[",\n]/.test(escapedValue)) {
          return `"${escapedValue}"`;
        }
        return escapedValue;
      }).join(',')
    );

    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isDisabled = !data || data.length === 0;

  return (
    <div className="export-controls-container" style={{ padding: '1rem 0', textAlign: 'right' }}>
      <button
        className="export-button"
        onClick={handleExportCSV}
        disabled={isDisabled}
        title={isDisabled ? "No data to export" : "Export data to a CSV file"}
        style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            backgroundColor: isDisabled ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
        }}
      >
        Export to CSV
      </button>
    </div>
  );
};

export default ExportControls;