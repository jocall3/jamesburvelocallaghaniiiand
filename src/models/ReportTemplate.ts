export interface ReportField {
  key: keyof ApplicationData;
  header: string;
}

export interface ReportTemplate {
  name: string;
  description: string;
  fields: ReportField[];
}

// Corresponds to the headers in the input CSV
export interface ApplicationData {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: string;
  applicationType: string;
  accountEnabled: string;
  applicationVisibility: string;
  assignmentRequired: string;
  isAppProxy: string;
}


const allFields: ReportField[] = [
  { key: 'id', header: 'ID' },
  { key: 'displayName', header: 'Display Name' },
  { key: 'appId', header: 'Application (Client) ID' },
  { key: 'createdDateTime', header: 'Created Date' },
  { key: 'applicationType', header: 'Application Type' },
  { key: 'accountEnabled', header: 'Enabled' },
  { key: 'applicationVisibility', header: 'Visibility' },
  { key: 'assignmentRequired', header: 'Assignment Required' },
  { key: 'isAppProxy', header: 'App Proxy' },
];

export const ReportTemplates: Record<string, ReportTemplate> = {
  full: {
    name: 'Full Application Report',
    description: 'Includes all available details for each application.',
    fields: allFields,
  },
  summary: {
    name: 'Application Summary',
    description: 'A high-level overview of applications, including their name, type, and status.',
    fields: [
      { key: 'displayName', header: 'Display Name' },
      { key: 'applicationType', header: 'Application Type' },
      { key: 'accountEnabled', header: 'Enabled' },
      { key: 'createdDateTime', header: 'Created Date' },
    ],
  },
  security: {
    name: 'Security Configuration Report',
    description: 'Focuses on security-related settings like assignment requirements and visibility.',
    fields: [
      { key: 'displayName', header: 'Display Name' },
      { key: 'appId', header: 'Application (Client) ID' },
      { key: 'accountEnabled', header: 'Enabled' },
      { key: 'assignmentRequired', header: 'Assignment Required' },
      { key: 'applicationVisibility', header: 'Visibility' },
      { key: 'isAppProxy', header: 'App Proxy' },
    ],
  },
  'enterprise-apps': {
    name: 'Enterprise Applications',
    description: 'A list of all applications classified as "Enterprise Application".',
    fields: [
        { key: 'displayName', header: 'Display Name' },
        { key: 'appId', header: 'Application (Client) ID' },
        { key: 'accountEnabled', header: 'Enabled' },
        { key: 'assignmentRequired', header: 'Assignment Required' },
        { key: 'createdDateTime', header: 'Created Date' },
    ],
  },
  'disabled-apps': {
    name: 'Disabled Applications',
    description: 'A list of all applications that are not enabled.',
    fields: [
        { key: 'displayName', header: 'Display Name' },
        { key: 'appId', header: 'Application (Client) ID' },
        { key: 'applicationType', header: 'Application Type' },
        { key: 'createdDateTime', header: 'Created Date' },
    ],
  },
};