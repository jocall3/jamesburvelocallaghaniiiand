export interface Integration {
  id: string;
  name: string;
  provider: string; // e.g., "Google", "Microsoft", "Salesforce"
  type: string; // e.g., "Productivity", "CRM", "Cloud Storage", "Social Media", "ERP"
  status: 'active' | 'inactive' | 'pending_setup' | 'error' | 'disabled';
  lastSync: string | null; // ISO date string
  description: string;
  iconUrl: string; // URL to an icon representing the integration
  connectedApps: string[]; // Specific apps/services within the provider, e.g., ["Gmail", "Google Drive"]
  config: {
    [key: string]: any; // Generic configuration object, can hold API keys, scopes, etc.
  };
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export const integrations: Integration[] = [
  {
    id: 'int_google_workspace_001',
    name: 'Google Workspace Integration',
    provider: 'Google',
    type: 'Productivity Suite',
    status: 'active',
    lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    description: 'Connects with Gmail, Google Drive, Calendar, and Meet for seamless collaboration.',
    iconUrl: 'https://www.gstatic.com/images/branding/product/2x/google_workspace_64dp.png',
    connectedApps: ['Gmail', 'Google Drive', 'Google Calendar', 'Google Meet'],
    config: {
      clientId: '1234567890-abcdefg.apps.googleusercontent.com',
      scopes: ['email', 'profile', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/calendar'],
      enabledFeatures: ['email_sync', 'drive_file_access', 'calendar_events'],
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: 'int_microsoft_365_002',
    name: 'Microsoft 365 Integration',
    provider: 'Microsoft',
    type: 'Productivity Suite',
    status: 'pending_setup',
    lastSync: null,
    description: 'Integrate with Outlook, OneDrive, Teams, and SharePoint for enterprise productivity.',
    iconUrl: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4oHhQ?ver=1716',
    connectedApps: ['Outlook', 'OneDrive', 'Microsoft Teams'],
    config: {
      tenantId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      requiredPermissions: ['Mail.ReadWrite', 'Files.ReadWrite.All', 'User.Read'],
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
  },
  {
    id: 'int_salesforce_crm_003',
    name: 'Salesforce CRM Connector',
    provider: 'Salesforce',
    type: 'CRM',
    status: 'error',
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    description: 'Sync customer data, leads, and opportunities with your Salesforce instance.',
    iconUrl: 'https://www.salesforce.com/content/dam/web/en_us/www/images/salesforce-logo.svg',
    connectedApps: ['Sales Cloud', 'Service Cloud'],
    config: {
      instanceUrl: 'https://yourcompany.my.salesforce.com',
      apiKey: 'SF_API_KEY_ERROR_INVALID',
      webhookUrl: 'https://api.yourplatform.com/webhooks/salesforce',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
  },
  {
    id: 'int_meta_business_004',
    name: 'Meta Business Suite',
    provider: 'Meta',
    type: 'Social Media',
    status: 'active',
    lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    description: 'Manage Facebook Pages, Instagram profiles, and ad campaigns.',
    iconUrl: 'https://static.xx.fbcdn.net/rsrc.php/yD/r/d4w_2yvP_0T.ico',
    connectedApps: ['Facebook Pages', 'Instagram Business'],
    config: {
      accessToken: 'EAAG...LONG_TOKEN...',
      pageIds: ['1234567890', '0987654321'],
      instagramAccountIds: ['insta_123', 'insta_456'],
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
  },
  {
    id: 'int_aws_s3_005',
    name: 'AWS S3 Storage',
    provider: 'Amazon',
    type: 'Cloud Storage',
    status: 'inactive',
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    description: 'Securely store and retrieve files from Amazon S3 buckets.',
    iconUrl: 'https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png',
    connectedApps: ['S3 Buckets'],
    config: {
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      region: 'us-east-1',
      bucketName: 'your-app-data-bucket',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), // 90 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
  },
  {
    id: 'int_adobe_creative_006',
    name: 'Adobe Creative Cloud',
    provider: 'Adobe',
    type: 'Design Tools',
    status: 'active',
    lastSync: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    description: 'Access and manage assets from Photoshop, Illustrator, and other Creative Cloud apps.',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Adobe_Creative_Cloud_logo.svg/1200px-Adobe_Creative_Cloud_logo.svg.png',
    connectedApps: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe XD'],
    config: {
      apiKey: 'ADOBE_API_KEY_123',
      enabledServices: ['asset_sync', 'font_management'],
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
  {
    id: 'int_slack_comm_007',
    name: 'Slack Communication',
    provider: 'Slack',
    type: 'Communication',
    status: 'active',
    lastSync: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    description: 'Send notifications, messages, and manage channels in Slack workspaces.',
    iconUrl: 'https://a.slack-edge.com/8089/img/icons/app-57.png',
    connectedApps: ['Slack Workspaces'],
    config: {
      botToken: 'xoxb-YOUR_BOT_TOKEN',
      defaultChannel: '#general',
      allowedChannels: ['#announcements', '#support', '#dev-updates'],
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(), // 100 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 mins ago
  },
  {
    id: 'int_github_dev_008',
    name: 'GitHub Repository Sync',
    provider: 'GitHub',
    type: 'Version Control',
    status: 'disabled',
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    description: 'Sync code repositories, issues, and pull requests with GitHub.',
    iconUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    connectedApps: ['GitHub Repositories'],
    config: {
      personalAccessToken: 'ghp_YOUR_DISABLED_TOKEN',
      organization: 'your-org',
      repos: ['project-alpha', 'project-beta'],
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 70).toISOString(), // 70 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
  },
  {
    id: 'int_stripe_payments_009',
    name: 'Stripe Payment Gateway',
    provider: 'Stripe',
    type: 'Payment Processing',
    status: 'active',
    lastSync: new Date(Date.now() - 1000 * 60 * 1).toISOString(), // 1 min ago
    description: 'Process payments, manage subscriptions, and retrieve transaction data.',
    iconUrl: 'https://stripe.com/img/v3/home/social.png',
    connectedApps: ['Stripe Dashboard'],
    config: {
      secretKey: 'sk_live_YOUR_SECRET_KEY',
      publishableKey: 'pk_live_YOUR_PUBLISHABLE_KEY',
      webhookSecret: 'whsec_YOUR_WEBHOOK_SECRET',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(), // 120 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 1).toISOString(), // 1 min ago
  },
  {
    id: 'int_zoom_video_010',
    name: 'Zoom Video Conferencing',
    provider: 'Zoom',
    type: 'Video Conferencing',
    status: 'active',
    lastSync: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 mins ago
    description: 'Schedule and manage Zoom meetings directly from your application.',
    iconUrl: 'https://st2.zoom.us/static/6.2.9/image/new/favicon.ico',
    connectedApps: ['Zoom Meetings'],
    config: {
      apiKey: 'YOUR_ZOOM_API_KEY',
      apiSecret: 'YOUR_ZOOM_API_SECRET',
      jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(), // 50 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: 'int_apple_icloud_011',
    name: 'Apple iCloud Drive',
    provider: 'Apple',
    type: 'Cloud Storage',
    status: 'active',
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    description: 'Access files and documents stored in iCloud Drive.',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/ICloud_logo.svg/1200px-ICloud_logo.svg.png',
    connectedApps: ['iCloud Drive'],
    config: {
      appleId: 'user@example.com',
      appSpecificPassword: 'xxxx-xxxx-xxxx-xxxx',
      enabledFeatures: ['file_sync'],
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(), // 80 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'int_sap_erp_012',
    name: 'SAP ERP Integration',
    provider: 'SAP',
    type: 'ERP',
    status: 'active',
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    description: 'Connects to SAP ERP for financial, HR, and supply chain data.',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/SAP_2011_logo.svg/1200px-SAP_2011_logo.svg.png',
    connectedApps: ['SAP S/4HANA', 'SAP ECC'],
    config: {
      systemId: 'PRD',
      client: '100',
      username: 'APIUSER',
      endpoint: 'https://sap.yourcompany.com:8000/sap/bc/bsp/sap/z_api',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(), // 180 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
  },
  {
    id: 'int_oracle_cloud_013',
    name: 'Oracle Cloud Infrastructure',
    provider: 'Oracle',
    type: 'Cloud Platform',
    status: 'pending_setup',
    lastSync: null,
    description: 'Integrate with Oracle Cloud services like Autonomous Database and Compute.',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Oracle_Cloud_logo.svg/1200px-Oracle_Cloud_logo.svg.png',
    connectedApps: ['Oracle Autonomous Database', 'Oracle Compute'],
    config: {
      tenancyOcid: 'ocid1.tenancy.oc1..aaaaaaa...',
      userOcid: 'ocid1.user.oc1..aaaaaaa...',
      fingerprint: 'xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx',
      privateKeyPath: '/path/to/oci_api_key.pem',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
  },
  {
    id: 'int_xero_accounting_014',
    name: 'Xero Accounting',
    provider: 'Xero',
    type: 'Accounting',
    status: 'active',
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
    description: 'Sync invoices, bills, and contacts with Xero accounting software.',
    iconUrl: 'https://www.xero.com/content/dam/xero/images/social-sharing/xero-logo-square.png',
    connectedApps: ['Xero Accounting'],
    config: {
      clientId: 'YOUR_XERO_CLIENT_ID',
      clientSecret: 'YOUR_XERO_CLIENT_SECRET',
      tenantId: 'YOUR_XERO_TENANT_ID',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(), // 40 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
  {
    id: 'int_shopify_ecommerce_015',
    name: 'Shopify E-commerce',
    provider: 'Shopify',
    type: 'E-commerce',
    status: 'active',
    lastSync: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
    description: 'Manage products, orders, and customers for your Shopify store.',
    iconUrl: 'https://cdn.shopify.com/static/images/shopify_logo_with_text.png',
    connectedApps: ['Shopify Storefront', 'Shopify Admin'],
    config: {
      shopName: 'your-store.myshopify.com',
      accessToken: 'shpat_YOUR_SHOPIFY_ACCESS_TOKEN',
      webhookSecret: 'YOUR_SHOPIFY_WEBHOOK_SECRET',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(), // 25 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
  },
];