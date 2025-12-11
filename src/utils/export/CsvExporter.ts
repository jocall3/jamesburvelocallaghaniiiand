import { AzureAdApplication } from '../../types/AzureAdApplication';

export class CsvExporter {
  /**
   * Escapes a field for CSV format.
   * If the field contains a comma, newline, or double quote, it will be enclosed in double quotes.
   * Existing double quotes within the field will be escaped by doubling them.
   * @param field The data to escape.
   * @returns The escaped CSV field as a string.
   */
  private static escapeCsvField(field: any): string {
    if (field === null || field === undefined) {
      return '';
    }

    const stringField = String(field);

    if (/[",\n]/.test(stringField)) {
      const escapedField = stringField.replace(/"/g, '""');
      return `"${escapedField}"`;
    }

    return stringField;
  }

  /**
   * Exports an array of Azure AD applications to a CSV file and triggers a download.
   * @param applications The array of applications to export.
   * @param filename The desired name for the downloaded file (e.g., 'applications.csv').
   */
  public static export(applications: AzureAdApplication[], filename: string = 'applications.csv'): void {
    const headers = [
      'id',
      'displayName',
      'appId',
      'createdDateTime',
      'applicationType',
      'accountEnabled',
      'applicationVisibility',
      'assignmentRequired',
      'isAppProxy',
    ];

    const headerRow = headers.join(',');

    const rows = applications.map(app => {
      const rowData = [
        app.id,
        app.displayName,
        app.appId,
        app.createdDateTime,
        app.applicationType,
        app.accountEnabled ? 'True' : 'False',
        app.applicationVisibility,
        app.assignmentRequired ? 'True' : 'False',
        app.isAppProxy ? 'True' : 'False',
      ];
      return rowData.map(this.escapeCsvField).join(',');
    });

    const csvContent = [headerRow, ...rows].join('\n');

    // Add BOM for Excel compatibility with UTF-8
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}