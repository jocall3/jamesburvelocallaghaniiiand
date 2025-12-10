export enum View {
  // --- Core Dashboard & System Views ---
  DashboardHome = 'DashboardHome',
  Settings = 'Settings',
  UserProfile = 'UserProfile',
  Notifications = 'Notifications',
  Search = 'Search',
  IntegrationsManager = 'IntegrationsManager', // Manages connections to various services
  ActivityLog = 'ActivityLog',
  HelpAndSupport = 'HelpAndSupport',

  // --- Google Ecosystem Views ---
  GoogleDashboard = 'GoogleDashboard',
  GoogleGmail = 'GoogleGmail',
  GoogleCalendar = 'GoogleCalendar',
  GoogleDrive = 'GoogleDrive',
  GoogleDocs = 'GoogleDocs',
  GoogleSheets = 'GoogleSheets',
  GoogleSlides = 'GoogleSlides',
  GoogleMeet = 'GoogleMeet',
  GoogleChat = 'GoogleChat',
  GoogleYouTube = 'GoogleYouTube',
  GooglePhotos = 'GooglePhotos',
  GoogleMaps = 'GoogleMaps',
  GoogleAnalytics = 'GoogleAnalytics',
  GoogleAds = 'GoogleAds',
  GoogleSearchConsole = 'GoogleSearchConsole',
  GoogleCloudConsole = 'GoogleCloudConsole',
  GooglePlayConsole = 'GooglePlayConsole',

  // --- Microsoft Ecosystem Views ---
  MicrosoftDashboard = 'MicrosoftDashboard',
  MicrosoftOutlook = 'MicrosoftOutlook',
  MicrosoftTeams = 'MicrosoftTeams',
  MicrosoftOneDrive = 'MicrosoftOneDrive',
  MicrosoftSharePoint = 'MicrosoftSharePoint',
  MicrosoftWord = 'MicrosoftWord',
  MicrosoftExcel = 'MicrosoftExcel',
  MicrosoftPowerPoint = 'MicrosoftPowerPoint',
  MicrosoftOneNote = 'MicrosoftOneNote',
  MicrosoftAzure = 'MicrosoftAzure',
  MicrosoftGitHub = 'MicrosoftGitHub',
  MicrosoftLinkedIn = 'MicrosoftLinkedIn',
  MicrosoftDynamics365 = 'MicrosoftDynamics365',
  MicrosoftPowerBI = 'MicrosoftPowerBI',
  MicrosoftXbox = 'MicrosoftXbox',

  // --- Apple Ecosystem Views ---
  AppleDashboard = 'AppleDashboard',
  AppleiCloud = 'AppleiCloud',
  AppleMail = 'AppleMail',
  AppleCalendar = 'AppleCalendar',
  ApplePhotos = 'ApplePhotos',
  AppleMusic = 'AppleMusic',
  AppleAppStoreConnect = 'AppleAppStoreConnect', // For developers
  AppleHealth = 'AppleHealth',
  AppleWallet = 'AppleWallet',
  AppleTV = 'AppleTV',
  AppleMaps = 'AppleMaps',

  // --- Amazon Ecosystem Views ---
  AmazonDashboard = 'AmazonDashboard',
  AmazonAWSConsole = 'AmazonAWSConsole',
  AmazonS3 = 'AmazonS3',
  AmazonEC2 = 'AmazonEC2',
  AmazonLambda = 'AmazonLambda',
  AmazonRDS = 'AmazonRDS',
  AmazonCloudWatch = 'AmazonCloudWatch',
  AmazonSellerCentral = 'AmazonSellerCentral',
  AmazonVendorCentral = 'AmazonVendorCentral',
  AmazonPrimeVideo = 'AmazonPrimeVideo',
  AmazonMusic = 'AmazonMusic',
  AmazonKindle = 'AmazonKindle',
  AmazonAlexa = 'AmazonAlexa',
  AmazonShopping = 'AmazonShopping',

  // --- Meta (Facebook) Ecosystem Views ---
  MetaDashboard = 'MetaDashboard',
  MetaFacebookFeed = 'MetaFacebookFeed',
  MetaInstagramFeed = 'MetaInstagramFeed',
  MetaWhatsApp = 'MetaWhatsApp',
  MetaMessenger = 'MetaMessenger',
  MetaAdsManager = 'MetaAdsManager',
  MetaBusinessSuite = 'MetaBusinessSuite',
  MetaQuest = 'MetaQuest', // VR/AR

  // --- X (Twitter) Ecosystem Views ---
  XDashboard = 'XDashboard',
  XFeed = 'XFeed',
  XAnalytics = 'XAnalytics',
  XAds = 'XAds',
  XSpaces = 'XSpaces',

  // --- Salesforce Ecosystem Views ---
  SalesforceDashboard = 'SalesforceDashboard',
  SalesforceSalesCloud = 'SalesforceSalesCloud',
  SalesforceServiceCloud = 'SalesforceServiceCloud',
  SalesforceMarketingCloud = 'SalesforceMarketingCloud',
  SalesforceExperienceCloud = 'SalesforceExperienceCloud',
  SalesforceSlack = 'SalesforceSlack',
  SalesforceTableau = 'SalesforceTableau',
  SalesforceMuleSoft = 'SalesforceMuleSoft',

  // --- Adobe Ecosystem Views ---
  AdobeDashboard = 'AdobeDashboard',
  AdobeCreativeCloud = 'AdobeCreativeCloud',
  AdobePhotoshop = 'AdobePhotoshop',
  AdobeIllustrator = 'AdobeIllustrator',
  AdobeInDesign = 'AdobeInDesign',
  AdobePremierePro = 'AdobePremierePro',
  AdobeAfterEffects = 'AdobeAfterEffects',
  AdobeAcrobat = 'AdobeAcrobat',
  AdobeXD = 'AdobeXD',
  AdobeExperienceCloud = 'AdobeExperienceCloud',

  // --- Atlassian Ecosystem Views ---
  AtlassianDashboard = 'AtlassianDashboard',
  AtlassianJira = 'AtlassianJira',
  AtlassianConfluence = 'AtlassianConfluence',
  AtlassianTrello = 'AtlassianTrello',
  AtlassianBitbucket = 'AtlassianBitbucket',
  AtlassianOpsgenie = 'AtlassianOpsgenie',

  // --- Communication & Collaboration Tools (Standalone/Deep Integrations) ---
  SlackChannels = 'SlackChannels',
  ZoomMeetings = 'ZoomMeetings',
  ZoomChat = 'ZoomChat',
  ZoomPhone = 'ZoomPhone',
  WebexMeetings = 'WebexMeetings',
  DiscordServers = 'DiscordServers',

  // --- E-commerce & Payments ---
  ShopifyAdmin = 'ShopifyAdmin',
  ShopifyStorefront = 'ShopifyStorefront',
  StripePayments = 'StripePayments',
  StripeConnect = 'StripeConnect',
  PayPalTransactions = 'PayPalTransactions',
  PayPalInvoicing = 'PayPalInvoicing',
  SquarePOS = 'SquarePOS',

  // --- Developer Tools & Cloud Platforms (Additional) ---
  GitHubRepositories = 'GitHubRepositories',
  GitLabProjects = 'GitLabProjects',
  AzureDevOps = 'AzureDevOps',
  HerokuApps = 'HerokuApps',
  VercelProjects = 'VercelProjects',
  NetlifySites = 'NetlifySites',
  DigitalOceanDroplets = 'DigitalOceanDroplets',
  CloudflareDNS = 'CloudflareDNS',
  DatadogMonitoring = 'DatadogMonitoring',
  NewRelicAPM = 'NewRelicAPM',
  SplunkLogs = 'SplunkLogs',
  SnowflakeDataExplorer = 'SnowflakeDataExplorer',
  DatabricksWorkspaces = 'DatabricksWorkspaces',

  // --- Enterprise Software & CRM/ERP (Additional) ---
  SAPERP = 'SAPERP',
  SAPS4HANA = 'SAPS4HANA',
  SAPSuccessFactors = 'SAPSuccessFactors',
  ServiceNowITSM = 'ServiceNowITSM',
  ServiceNowHRSD = 'ServiceNowHRSD',
  OracleCloudApps = 'OracleCloudApps',
  OracleNetSuite = 'OracleNetSuite',
  WorkdayHCM = 'WorkdayHCM',
  ZendeskSupport = 'ZendeskSupport',
  HubSpotCRM = 'HubSpotCRM',
  PipedriveCRM = 'PipedriveCRM',

  // --- Marketing & Analytics (Additional) ---
  MailchimpCampaigns = 'MailchimpCampaigns',
  ConstantContact = 'ConstantContact',
  SEMRush = 'SEMRush',
  Ahrefs = 'Ahrefs',
  GoogleTagManager = 'GoogleTagManager',
  MixpanelAnalytics = 'MixpanelAnalytics',
  AmplitudeAnalytics = 'AmplitudeAnalytics',

  // --- Project Management ---
  AsanaProjects = 'AsanaProjects',
  MondayComBoards = 'MondayComBoards',
  ClickUpTasks = 'ClickUpTasks',
  Smartsheet = 'Smartsheet',

  // --- Security & Identity ---
  OktaDashboard = 'OktaDashboard',
  Auth0Dashboard = 'Auth0Dashboard',
  OneLoginDashboard = 'OneLoginDashboard',
}