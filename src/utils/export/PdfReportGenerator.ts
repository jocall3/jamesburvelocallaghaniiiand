```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Interface representing a single service principal record for the report.
 * This should match the structure of the parsed data objects.
 */
export interface ServicePrincipalForReport {
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

/**
 * Interface for the structured analysis data required to generate the PDF report.
 */
export interface ReportAnalysisData {
    totalPrincipals: number;
    enabledPrincipals: number;
    disabledPrincipals: number;
    principalsByApplicationType: { type: string; count: number }[];
    principalsByVisibility: { visibility: string; count: number }[];
    assignmentNotRequiredCount: number;
    appProxyEnabledCount: number;
    principals: ServicePrincipalForReport[];
}

/**
 * Utility class to generate a PDF report of the current identity posture.
 */
export class PdfReportGenerator {
    private readonly MARGIN = 15;
    private readonly FONT_SIZE_TITLE = 22;
    private readonly FONT_SIZE_H1 = 16;
    private readonly FONT_SIZE_BODY = 12;
    private readonly FONT_SIZE_FOOTER = 10;
    private readonly LINE_SPACING = 7;
    private readonly PRIMARY_COLOR: [number, number, number] = [41, 128, 185]; // A shade of blue

    /**
     * Generates the PDF report from the provided analysis data.
     * @param data The analyzed identity posture data.
     * @returns A promise that resolves with the PDF file as a Blob.
     */
    public async generate(data: ReportAnalysisData): Promise<Blob> {
        const doc = new jsPDF();
        let currentY = this.MARGIN + 10;

        // --- Title Page ---
        doc.setFontSize(this.FONT_SIZE_TITLE);
        doc.text('Identity Posture Report', doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
        currentY += this.LINE_SPACING * 1.5;

        doc.setFontSize(this.FONT_SIZE_BODY);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
        currentY += this.LINE_SPACING * 3;

        // --- Summary Section ---
        doc.setFontSize(this.FONT_SIZE_H1);
        doc.text('Executive Summary', this.MARGIN, currentY);
        currentY += this.LINE_SPACING * 1.5;

        doc.setFontSize(this.FONT_SIZE_BODY);
        const summaryText = [
            `- Total Service Principals Analyzed: ${data.totalPrincipals}`,
            `- Enabled Accounts: ${data.enabledPrincipals} (${((data.enabledPrincipals / data.totalPrincipals) * 100 || 0).toFixed(1)}%)`,
            `- Disabled Accounts: ${data.disabledPrincipals} (${((data.disabledPrincipals / data.totalPrincipals) * 100 || 0).toFixed(1)}%)`,
            `- Principals Not Requiring Assignment: ${data.assignmentNotRequiredCount}`,
            `- Principals with App Proxy Enabled: ${data.appProxyEnabledCount}`,
        ];
        summaryText.forEach(line => {
            doc.text(line, this.MARGIN, currentY);
            currentY += this.LINE_SPACING;
        });
        currentY += this.LINE_SPACING;
        
        // --- Breakdown Tables ---
        currentY = this.addBreakdownTables(doc, data, currentY);
        
        // --- Full Data Table ---
        this.addFullDataTable(doc, data, currentY);

        // Add headers and footers to all pages after content generation is complete
        this.addHeadersAndFooters(doc);

        return doc.output('blob');
    }
    
    /**
     * Adds two side-by-side tables for data breakdown.
     */
    private addBreakdownTables(doc: jsPDF, data: ReportAnalysisData, startY: number): number {
        const pageHeight = doc.internal.pageSize.getHeight();
        let currentY = startY;

        if (currentY > pageHeight - 80) { // Check if we have enough space for the section
            doc.addPage();
            currentY = this.MARGIN;
        }

        doc.setFontSize(this.FONT_SIZE_H1);
        doc.text('Breakdown by Type and Visibility', this.MARGIN, currentY);
        currentY += this.LINE_SPACING;

        const typeBody = data.principalsByApplicationType.map(item => [item.type || 'N/A', item.count.toString()]);
        autoTable(doc, {
            head: [['Application Type', 'Count']],
            body: typeBody,
            startY: currentY,
            theme: 'grid',
            headStyles: { fillColor: this.PRIMARY_COLOR },
            margin: { left: this.MARGIN, right: doc.internal.pageSize.getWidth() / 2 + 5 },
        });

        const visibilityBody = data.principalsByVisibility.map(item => [item.visibility, item.count.toString()]);
        autoTable(doc, {
            head: [['Visibility', 'Count']],
            body: visibilityBody,
            startY: currentY,
            theme: 'grid',
            headStyles: { fillColor: this.PRIMARY_COLOR },
            margin: { left: doc.internal.pageSize.getWidth() / 2 + 5, right: this.MARGIN },
        });

        // The final Y position is determined by the taller of the two tables
        const finalY = (doc as any).lastAutoTable.finalY;
        currentY = finalY + this.LINE_SPACING * 2;
        
        if (currentY > pageHeight - 50) {
             doc.addPage();
             return this.MARGIN;
        }

        return currentY;
    }

    /**
     * Adds the main table with all service principal data.
     */
    private addFullDataTable(doc: jsPDF, data: ReportAnalysisData, startY: number) {
        let currentY = startY;
        const pageHeight = doc.internal.pageSize.getHeight();
        
        if (currentY > pageHeight - 50) {
             doc.addPage();
             currentY = this.MARGIN;
        }
        
        doc.setFontSize(this.FONT_SIZE_H1);
        doc.text('All Service Principals', this.MARGIN, currentY);
        currentY += this.LINE_SPACING;

        const tableHeaders = ['Display Name', 'Application Type', 'Enabled', 'Assignment Req.', 'Visibility'];
        const tableBody = data.principals.map(p => [
            p.displayName.substring(0, 45) + (p.displayName.length > 45 ? '...' : ''),
            p.applicationType || 'N/A',
            p.accountEnabled ? 'Yes' : 'No',
            p.assignmentRequired ? 'Yes' : 'No',
            p.applicationVisibility
        ]);

        autoTable(doc, {
            head: [tableHeaders],
            body: tableBody,
            startY: currentY,
            theme: 'striped',
            headStyles: { fillColor: this.PRIMARY_COLOR },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 35 },
                2: { cellWidth: 20 },
                3: { cellWidth: 30 },
                4: { cellWidth: 25 },
            },
            margin: { left: this.MARGIN, right: this.MARGIN },
        });
    }

    /**
     * Loops through all pages of the document to add a consistent header and footer.
     */
    private addHeadersAndFooters(doc: jsPDF) {
        const pageCount = (doc as any).internal.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Header
            doc.setFontSize(this.FONT_SIZE_FOOTER);
            doc.setTextColor(150);
            doc.text('Identity Posture Analysis Report', this.MARGIN, this.MARGIN - 5);
            doc.line(this.MARGIN, this.MARGIN - 2, pageWidth - this.MARGIN, this.MARGIN - 2);


            // Footer
            doc.setFontSize(this.FONT_SIZE_FOOTER);
            doc.setTextColor(150);
            const footerText = `Page ${i} of ${pageCount}`;
            doc.text(footerText, pageWidth - this.MARGIN, pageHeight - 10, { align: 'right' });
        }
    }
}
```