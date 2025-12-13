export type ReportFormat = 'csv' | 'json';

/**
 * Defines a column for a report, specifying how to extract and format data.
 */
export interface ReportColumn {
  /** The key in the data object corresponding to this column's value. */
  key: string;
  /** The header text to display for this column in the report. */
  header: string;
  /**
   * An optional function to format the value for this column.
   * @param value The raw value from the data object.
   * @param row The entire data row object, useful for contextual formatting.
   * @returns The formatted string representation of the value.
   */
  formatter?: (value: any, row: any) => string;
}

/**
 * A client-side service responsible for formatting data and generating downloadable report files.
 * Supports CSV and JSON formats.
 */
class ReportingService {

  /**
   * Escapes a string for CSV output by doubling any internal double quotes.
   * This function does NOT wrap the string in quotes; that is handled by `generateCsv`.
   * @param value The string value to escape.
   * @returns The string with internal double quotes escaped.
   */
  private escapeCsvInternalQuotes(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).replace(/"/g, '""');
  }

  /**
   * Generates a CSV string from an array of data objects and column definitions.
   * Each field is enclosed in double quotes, and internal double quotes are escaped.
   * @param data The array of data objects.
   * @param columns The array of ReportColumn definitions.
   * @returns A CSV formatted string.
   */
  private generateCsv(data: any[], columns: ReportColumn[]): string {
    // Generate headers
    const headers = columns
      .map(col => `"${this.escapeCsvInternalQuotes(col.header)}"`)
      .join(',');

    // Generate rows
    const rows = data.map(row => {
      return columns
        .map(col => {
          const value = row[col.key];
          // Apply formatter if provided, otherwise use raw value
          const formattedValue = col.formatter ? col.formatter(value, row) : value;
          // Ensure value is a string, handle null/undefined, then escape and wrap in quotes
          return `"${this.escapeCsvInternalQuotes(String(formattedValue === null || formattedValue === undefined ? '' : formattedValue))}"`;
        })
        .join(',');
    });

    return [headers, ...rows].join('\n');
  }

  /**
   * Generates a JSON string from an array of data objects.
   * The JSON is pretty-printed with an indent of 2 spaces.
   * @param data The array of data objects.
   * @returns A JSON formatted string.
   */
  private generateJson(data: any[]): string {
    return JSON.stringify(data, null, 2); // Pretty print JSON
  }

  /**
   * Triggers a file download in the browser using a Blob.
   * @param filename The name of the file to download (e.g., "report.csv").
   * @param content The content of the file as a string.
   * @param mimeType The MIME type of the file (e.g., 'text/csv', 'application/json').
   */
  private downloadFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Append to body and click to trigger download, then remove.
    // This is necessary for cross-browser compatibility (e.g., Firefox).
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Release the object URL to free up memory
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a report in the specified format and triggers its download.
   * The filename will include the report name and a timestamp.
   * @param data The array of data objects for the report.
   * @param columns The array of ReportColumn definitions (primarily used for CSV reports).
   * @param reportName The base name for the report file (e.g., "SalesReport").
   * @param format The desired format for the report ('csv' or 'json').
   */
  public generateAndDownloadReport(
    data: any[],
    columns: ReportColumn[],
    reportName: string,
    format: ReportFormat
  ): void {
    let content: string;
    let filename: string;
    let mimeType: string;

    // Generate a timestamp for the filename (YYYYMMDDHHMMSS)
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '');

    switch (format) {
      case 'csv':
        content = this.generateCsv(data, columns);
        filename = `${reportName}_${timestamp}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
        break;
      case 'json':
        content = this.generateJson(data);
        filename = `${reportName}_${timestamp}.json`;
        mimeType = 'application/json;charset=utf-8;';
        break;
      default:
        // This case should ideally not be reached due to ReportFormat type safety
        console.error(`ReportingService: Unsupported report format: ${format}`);
        return;
    }

    this.downloadFile(filename, content, mimeType);
  }
}

/**
 * Export a singleton instance of the ReportingService for easy consumption throughout the application.
 */
export const reportingService = new ReportingService();