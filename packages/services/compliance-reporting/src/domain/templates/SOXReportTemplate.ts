import { ReportTemplate } from './ReportTemplate';
import { ReportData } from '../entities/ReportData';

/**
 * SOXReportTemplate class for generating Sarbanes-Oxley (SOX) compliance reports.
 * Extends the base ReportTemplate class.
 */
export class SOXReportTemplate extends ReportTemplate {
  /**
   * Constructor for the SOXReportTemplate class.
   * @param reportData The data to be used in the report.
   */
  constructor(reportData: ReportData) {
    super(reportData);
  }

  /**
   * Generates the SOX compliance report content.
   * This method overrides the abstract method in the base class.
   * @returns The generated report content as a string.
   */
  generateReportContent(): string {
    let content = `
      <h1>Sarbanes-Oxley (SOX) Compliance Report</h1>
      <p>Date Generated: ${new Date().toLocaleDateString()}</p>
      <h2>Company Information</h2>
      <p>Company Name: ${this.reportData.companyName || 'N/A'}</p>
      <p>Fiscal Year End: ${this.reportData.fiscalYearEnd || 'N/A'}</p>

      <h2>Internal Controls Assessment</h2>
      <p>Control Environment: ${this.reportData.controlEnvironment || 'N/A'}</p>
      <p>Risk Assessment: ${this.reportData.riskAssessment || 'N/A'}</p>
      <p>Control Activities: ${this.reportData.controlActivities || 'N/A'}</p>
      <p>Information and Communication: ${this.reportData.informationAndCommunication || 'N/A'}</p>
      <p>Monitoring Activities: ${this.reportData.monitoringActivities || 'N/A'}</p>

      <h2>Key Controls Testing</h2>
      <ul>
        ${this.reportData.keyControls?.map(control => `
          <li>
            <strong>Control ID:</strong> ${control.controlId}<br/>
            <strong>Description:</strong> ${control.description}<br/>
            <strong>Testing Result:</strong> ${control.testingResult}<br/>
            <strong>Remediation Plan:</strong> ${control.remediationPlan || 'N/A'}
          </li>
        `).join('') || '<li>No key controls found.</li>'}
      </ul>

      <h2>Financial Statement Assertions</h2>
      <p>Completeness: ${this.reportData.completeness || 'N/A'}</p>
      <p>Accuracy: ${this.reportData.accuracy || 'N/A'}</p>
      <p>Valuation: ${this.reportData.valuation || 'N/A'}</p>
      <p>Existence: ${this.reportData.existence || 'N/A'}</p>
      <p>Rights and Obligations: ${this.reportData.rightsAndObligations || 'N/A'}</p>

      <h2>Deficiencies and Remediation</h2>
      <ul>
        ${this.reportData.deficiencies?.map(deficiency => `
          <li>
            <strong>Deficiency ID:</strong> ${deficiency.deficiencyId}<br/>
            <strong>Description:</strong> ${deficiency.description}<br/>
            <strong>Severity:</strong> ${deficiency.severity}<br/>
            <strong>Remediation Plan:</strong> ${deficiency.remediationPlan}
            <strong>Status:</strong> ${deficiency.status}
          </li>
        `).join('') || '<li>No deficiencies found.</li>'}
      </ul>

      <h2>Management Representation</h2>
      <p>Management Assertion: ${this.reportData.managementAssertion || 'N/A'}</p>
      <p>Signed By: ${this.reportData.signedBy || 'N/A'}</p>
      <p>Date Signed: ${this.reportData.dateSigned || 'N/A'}</p>
    `;

    return content;
  }

  /**
   * Adds a cover page to the report content.
   * @returns The report content with a cover page.
   */
  addCoverPage(): string {
    const coverPage = `
      <h1>SOX Compliance Report</h1>
      <p>Prepared for: ${this.reportData.companyName || 'N/A'}</p>
      <p>Date: ${new Date().toLocaleDateString()}</p>
    `;
    return coverPage + this.generateReportContent();
  }

  /**
   * Adds a disclaimer to the report content.
   * @returns The report content with a disclaimer.
   */
  addDisclaimer(): string {
    const disclaimer = `
      <hr/>
      <p>Disclaimer: This report is for informational purposes only and should not be considered legal or financial advice.</p>
    `;
    return this.generateReportContent() + disclaimer;
  }

  /**
   * Generates the complete SOX report with cover page and disclaimer.
   * @returns The complete SOX report as a string.
   */
  generateCompleteReport(): string {
    return this.addCoverPage() + this.addDisclaimer();
  }
}