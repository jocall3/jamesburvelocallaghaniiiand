import { OpenAPIV3_1 } from 'openapi-types';

/**
 * ApiCatalog.ts
 * 
 * A massive configuration file listing 100+ API definitions, endpoints, and metadata.
 * Designed to support OpenAPI 3.1.0, Workflow automation, Pre/Post scripts,
 * and deep integration with Google Drive and GitHub.
 */

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type ScriptType = 'javascript' | 'typescript' | 'python';

export interface LifecycleScript {
  enabled: boolean;
  type: ScriptType;
  content: string;
  timeoutMs: number;
}

export interface WorkflowStep {
  stepId: string;
  operationId: string;
  parameters: Record<string, any>;
  dependsOn?: string[];
}

export interface ApiWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface AuthConfiguration {
  method: 'oauth2' | 'apiKey' | 'bearer' | 'basic' | 'none';
  provider: 'google' | 'github' | 'custom';
  oauthConfig?: {
    authorizationUrl: string;
    tokenUrl: string;
    scopes: string[];
    redirectUrl: string;
    clientId?: string; // Often injected via env vars, but placeholder here
  };
  googleLoginRequired: boolean; // Enforces the "only login with Google" rule
}

export interface IntegrationConfig {
  googleDrive: {
    enabled: boolean;
    saveResponsesToDrive: boolean;
    driveFolderId?: string;
  };
  github: {
    enabled: boolean;
    syncWorkflowsToRepo: boolean;
    repositoryUrl?: string;
  };
}

export interface ApiDefinition {
  id: string;
  name: string;
  category: string;
  baseUrl: string;
  apiVersion: string;
  openApiSpecVersion: '3.1.0';
  description: string;
  documentationUrl: string;
  
  // Authentication & Security
  auth: AuthConfiguration;
  
  // Integrations
  integrations: IntegrationConfig;

  // Lifecycle Hooks
  preRequestScript?: LifecycleScript;
  postRequestScript?: LifecycleScript;

  // The Core Schema (Simplified representation for catalog size constraints)
  // In a full runtime, this would load the complete JSON/YAML spec.
  schemaReference: string | OpenAPIV3_1.Document;
  
  // Pre-defined Workflows
  workflows: ApiWorkflow[];
}

// ---------------------------------------------------------------------------
// Helper Factory
// ---------------------------------------------------------------------------

const createApiEntry = (
  id: string, 
  name: string, 
  category: string, 
  baseUrl: string, 
  desc: string,
  scopes: string[] = []
): ApiDefinition => ({
  id,
  name,
  category,
  baseUrl,
  apiVersion: 'v1',
  openApiSpecVersion: '3.1.0',
  description: desc,
  documentationUrl: `https://developer.${id}.com/docs`,
  auth: {
    method: 'oauth2',
    provider: 'google', // Defaulting to Google as primary identity provider where applicable
    googleLoginRequired: true,
    oauthConfig: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['openid', 'email', 'profile', ...scopes],
      redirectUrl: 'https://api.platform.com/auth/callback'
    }
  },
  integrations: {
    googleDrive: { enabled: true, saveResponsesToDrive: true },
    github: { enabled: true, syncWorkflowsToRepo: true }
  },
  preRequestScript: {
    enabled: true,
    type: 'typescript',
    content: `console.log("Preparing request for ${name}...");`,
    timeoutMs: 5000
  },
  postRequestScript: {
    enabled: true,
    type: 'typescript',
    content: `console.log("Response received from ${name}. Syncing to Drive...");`,
    timeoutMs: 10000
  },
  schemaReference: `./schemas/${id}.openapi.json`,
  workflows: []
});

// ---------------------------------------------------------------------------
// The Catalog
// ---------------------------------------------------------------------------

export const ApiCatalog: ApiDefinition[] = [
  // --- Core Integrations ---
  {
    ...createApiEntry('google-drive', 'Google Drive API', 'Productivity', 'https://www.googleapis.com/drive/v3', 'File storage and synchronization service developed by Google.', ['https://www.googleapis.com/auth/drive']),
    workflows: [{
      id: 'backup-file',
      name: 'Backup to Drive',
      description: 'Uploads a file and sets permissions',
      steps: [
        { stepId: 'upload', operationId: 'drive.files.create', parameters: { name: 'backup.json' } },
        { stepId: 'permission', operationId: 'drive.permissions.create', parameters: { role: 'reader' }, dependsOn: ['upload'] }
      ]
    }]
  },
  {
    ...createApiEntry('github', 'GitHub API', 'Developer Tools', 'https://api.github.com', 'Hosting for software development and version control using Git.', ['repo', 'workflow']),
    auth: {
      method: 'oauth2',
      provider: 'github', // Exception for GitHub native auth
      googleLoginRequired: true, // Still requires Google login to access the platform
      oauthConfig: {
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scopes: ['repo', 'workflow'],
        redirectUrl: 'https://api.platform.com/auth/github/callback'
      }
    }
  },

  // --- Cloud Infrastructure (AWS, GCP, Azure) ---
  createApiEntry('aws-s3', 'AWS S3', 'Cloud', 'https://s3.amazonaws.com', 'Object storage built to store and retrieve any amount of data from anywhere.'),
  createApiEntry('aws-ec2', 'AWS EC2', 'Cloud', 'https://ec2.amazonaws.com', 'Secure and resizable compute capacity in the cloud.'),
  createApiEntry('aws-lambda', 'AWS Lambda', 'Cloud', 'https://lambda.amazonaws.com', 'Run code without provisioning or managing servers.'),
  createApiEntry('gcp-compute', 'Google Compute Engine', 'Cloud', 'https://compute.googleapis.com/compute/v1', 'Virtual machines running in Google\'s data center.', ['https://www.googleapis.com/auth/compute']),
  createApiEntry('gcp-storage', 'Google Cloud Storage', 'Cloud', 'https://storage.googleapis.com/storage/v1', 'Unified object storage for developers and enterprises.', ['https://www.googleapis.com/auth/devstorage.read_write']),
  createApiEntry('azure-compute', 'Azure Compute', 'Cloud', 'https://management.azure.com', 'Azure Virtual Machines and compute resources.'),
  createApiEntry('digitalocean', 'DigitalOcean', 'Cloud', 'https://api.digitalocean.com/v2', 'Cloud computing platform designed for developers.'),
  createApiEntry('heroku', 'Heroku', 'Cloud', 'https://api.heroku.com', 'Platform as a service (PaaS) that enables developers to build, run, and operate applications entirely in the cloud.'),
  createApiEntry('linode', 'Linode', 'Cloud', 'https://api.linode.com/v4', 'Cloud hosting services.'),
  createApiEntry('cloudflare', 'Cloudflare', 'Cloud', 'https://api.cloudflare.com/client/v4', 'Web performance and security company.'),
  createApiEntry('fastly', 'Fastly', 'Cloud', 'https://api.fastly.com', 'Edge cloud platform.'),
  createApiEntry('vercel', 'Vercel', 'Cloud', 'https://api.vercel.com', 'Platform for frontend frameworks and static sites.'),
  createApiEntry('netlify', 'Netlify', 'Cloud', 'https://api.netlify.com', 'Build, deploy, and manage modern web projects.'),

  // --- AI & Machine Learning ---
  createApiEntry('openai', 'OpenAI API', 'AI', 'https://api.openai.com/v1', 'Access to GPT-4, DALL-E, and other AI models.'),
  createApiEntry('anthropic', 'Anthropic API', 'AI', 'https://api.anthropic.com', 'Access to Claude and other AI safety-focused models.'),
  createApiEntry('huggingface', 'Hugging Face', 'AI', 'https://api-inference.huggingface.co', 'Platform for building, training, and deploying ML models.'),
  createApiEntry('stability-ai', 'Stability AI', 'AI', 'https://api.stability.ai', 'Generative AI models for image, audio, and video.'),
  createApiEntry('cohere', 'Cohere', 'AI', 'https://api.cohere.ai', 'NLP models for business.'),

  // --- Productivity & Collaboration ---
  createApiEntry('slack', 'Slack', 'Productivity', 'https://slack.com/api', 'Business communication platform.'),
  createApiEntry('discord', 'Discord', 'Productivity', 'https://discord.com/api', 'VoIP, instant messaging and digital distribution platform.'),
  createApiEntry('notion', 'Notion', 'Productivity', 'https://api.notion.com/v1', 'All-in-one workspace for notes, tasks, wikis, and databases.'),
  createApiEntry('trello', 'Trello', 'Productivity', 'https://api.trello.com/1', 'Web-based list-making application.'),
  createApiEntry('asana', 'Asana', 'Productivity', 'https://app.asana.com/api/1.0', 'Web and mobile application designed to help teams organize, track, and manage their work.'),
  createApiEntry('monday', 'Monday.com', 'Productivity', 'https://api.monday.com/v2', 'Cloud-based platform that allows users to create their own applications and work management software.'),
  createApiEntry('clickup', 'ClickUp', 'Productivity', 'https://api.clickup.com/api/v2', 'All-in-one productivity tool.'),
  createApiEntry('airtable', 'Airtable', 'Productivity', 'https://api.airtable.com/v0', 'Cloud collaboration service.'),
  createApiEntry('zoom', 'Zoom', 'Productivity', 'https://api.zoom.us/v2', 'Videotelephony software program.'),
  createApiEntry('microsoft-teams', 'Microsoft Teams', 'Productivity', 'https://graph.microsoft.com/v1.0', 'Business communication platform.'),

  // --- Google Workspace ---
  createApiEntry('gmail', 'Gmail API', 'Google', 'https://gmail.googleapis.com', 'Access to Gmail mailboxes and sending mail.', ['https://www.googleapis.com/auth/gmail.modify']),
  createApiEntry('google-calendar', 'Google Calendar', 'Google', 'https://www.googleapis.com/calendar/v3', 'Time-management and scheduling calendar service.', ['https://www.googleapis.com/auth/calendar']),
  createApiEntry('google-sheets', 'Google Sheets', 'Google', 'https://sheets.googleapis.com/v4', 'Spreadsheet program.', ['https://www.googleapis.com/auth/spreadsheets']),
  createApiEntry('google-docs', 'Google Docs', 'Google', 'https://docs.googleapis.com/v1', 'Word processor program.', ['https://www.googleapis.com/auth/documents']),
  createApiEntry('google-slides', 'Google Slides', 'Google', 'https://slides.googleapis.com/v1', 'Presentation program.', ['https://www.googleapis.com/auth/presentations']),
  createApiEntry('google-analytics', 'Google Analytics', 'Google', 'https://analyticsdata.googleapis.com/v1beta', 'Web analytics service.', ['https://www.googleapis.com/auth/analytics.readonly']),
  createApiEntry('youtube', 'YouTube Data API', 'Google', 'https://www.googleapis.com/youtube/v3', 'Video sharing platform.', ['https://www.googleapis.com/auth/youtube']),

  // --- Social Media ---
  createApiEntry('twitter', 'Twitter (X) API', 'Social', 'https://api.twitter.com/2', 'Social networking service.'),
  createApiEntry('facebook', 'Facebook Graph API', 'Social', 'https://graph.facebook.com', 'Social networking service.'),
  createApiEntry('instagram', 'Instagram Graph API', 'Social', 'https://graph.instagram.com', 'Photo and video sharing social networking service.'),
  createApiEntry('linkedin', 'LinkedIn', 'Social', 'https://api.linkedin.com/v2', 'Business and employment-oriented online service.'),
  createApiEntry('tiktok', 'TikTok', 'Social', 'https://open.tiktokapis.com', 'Short-form video hosting service.'),
  createApiEntry('pinterest', 'Pinterest', 'Social', 'https://api.pinterest.com/v5', 'Image sharing and social media service.'),
  createApiEntry('reddit', 'Reddit', 'Social', 'https://oauth.reddit.com', 'Social news aggregation, web content rating, and discussion website.'),
  createApiEntry('snapchat', 'Snapchat', 'Social', 'https://kit.snapchat.com', 'Multimedia instant messaging app.'),

  // --- Payment & Commerce ---
  createApiEntry('stripe', 'Stripe', 'Finance', 'https://api.stripe.com/v1', 'Payment processing platform.'),
  createApiEntry('paypal', 'PayPal', 'Finance', 'https://api-m.paypal.com', 'Online payments system.'),
  createApiEntry('square', 'Square', 'Finance', 'https://connect.squareup.com', 'Financial services and mobile payment company.'),
  createApiEntry('shopify', 'Shopify', 'Commerce', 'https://{shop}.myshopify.com/admin/api/2023-10', 'E-commerce platform.'),
  createApiEntry('woocommerce', 'WooCommerce', 'Commerce', 'https://example.com/wp-json/wc/v3', 'Open-source e-commerce plugin for WordPress.'),
  createApiEntry('bigcommerce', 'BigCommerce', 'Commerce', 'https://api.bigcommerce.com', 'E-commerce platform.'),
  createApiEntry('magento', 'Magento (Adobe Commerce)', 'Commerce', 'https://example.com/rest/V1', 'E-commerce platform.'),
  createApiEntry('ebay', 'eBay', 'Commerce', 'https://api.ebay.com', 'Multinational e-commerce corporation.'),
  createApiEntry('amazon-sp', 'Amazon Selling Partner', 'Commerce', 'https://sellingpartnerapi-na.amazon.com', 'Amazon marketplace API.'),

  // --- CRM & Support ---
  createApiEntry('salesforce', 'Salesforce', 'CRM', 'https://{instance}.salesforce.com/services/data/v58.0', 'Cloud-based software company provides CRM service.'),
  createApiEntry('hubspot', 'HubSpot', 'CRM', 'https://api.hubapi.com', 'Inbound marketing, sales, and customer service software.'),
  createApiEntry('zendesk', 'Zendesk', 'Support', 'https://{subdomain}.zendesk.com/api/v2', 'Customer service software company.'),
  createApiEntry('intercom', 'Intercom', 'Support', 'https://api.intercom.io', 'Messaging platform.'),
  createApiEntry('freshdesk', 'Freshdesk', 'Support', 'https://{domain}.freshdesk.com/api/v2', 'Customer support software.'),
  createApiEntry('zoho-crm', 'Zoho CRM', 'CRM', 'https://www.zohoapis.com/crm/v2', 'Online office suite and SaaS applications.'),

  // --- Developer Tools & CI/CD ---
  createApiEntry('gitlab', 'GitLab', 'DevTools', 'https://gitlab.com/api/v4', 'DevOps lifecycle tool.'),
  createApiEntry('bitbucket', 'Bitbucket', 'DevTools', 'https://api.bitbucket.org/2.0', 'Git-based source code repository hosting service.'),
  createApiEntry('docker-hub', 'Docker Hub', 'DevTools', 'https://hub.docker.com/v2', 'Container registry.'),
  createApiEntry('circleci', 'CircleCI', 'DevTools', 'https://circleci.com/api/v2', 'Continuous integration and continuous delivery platform.'),
  createApiEntry('travis-ci', 'Travis CI', 'DevTools', 'https://api.travis-ci.com', 'Hosted continuous integration service.'),
  createApiEntry('jenkins', 'Jenkins', 'DevTools', 'https://jenkins.example.com/api/json', 'Open source automation server.'),
  createApiEntry('sentry', 'Sentry', 'DevTools', 'https://sentry.io/api/0', 'Application monitoring and error tracking software.'),
  createApiEntry('datadog', 'Datadog', 'DevTools', 'https://api.datadoghq.com/api/v1', 'Observability service for cloud-scale applications.'),
  createApiEntry('pagerduty', 'PagerDuty', 'DevTools', 'https://api.pagerduty.com', 'Incident response platform.'),
  createApiEntry('splunk', 'Splunk', 'DevTools', 'https://api.splunk.com', 'Software for searching, monitoring, and analyzing machine-generated big data.'),

  // --- Communication ---
  createApiEntry('twilio', 'Twilio', 'Communication', 'https://api.twilio.com/2010-04-01', 'Cloud communications platform.'),
  createApiEntry('sendgrid', 'SendGrid', 'Communication', 'https://api.sendgrid.com/v3', 'Email delivery service.'),
  createApiEntry('mailchimp', 'Mailchimp', 'Communication', 'https://{dc}.api.mailchimp.com/3.0', 'Marketing automation platform and email marketing service.'),
  createApiEntry('whatsapp', 'WhatsApp Business', 'Communication', 'https://graph.facebook.com/v17.0', 'Messaging app for business.'),
  createApiEntry('telegram', 'Telegram Bot API', 'Communication', 'https://api.telegram.org', 'Cloud-based instant messaging service.'),

  // --- Travel & Maps ---
  createApiEntry('google-maps', 'Google Maps Platform', 'Maps', 'https://maps.googleapis.com/maps/api', 'Web mapping platform.', ['https://www.googleapis.com/auth/maps-platform']),
  createApiEntry('mapbox', 'Mapbox', 'Maps', 'https://api.mapbox.com', 'Custom online maps.'),
  createApiEntry('uber', 'Uber', 'Travel', 'https://api.uber.com/v1.2', 'Mobility as a service provider.'),
  createApiEntry('lyft', 'Lyft', 'Travel', 'https://api.lyft.com/v1', 'Ridesharing company.'),
  createApiEntry('airbnb', 'Airbnb', 'Travel', 'https://api.airbnb.com/v2', 'Online marketplace for lodging.'),
  createApiEntry('booking', 'Booking.com', 'Travel', 'https://distribution-xml.booking.com/2.0', 'Online travel agency.'),
  createApiEntry('expedia', 'Expedia', 'Travel', 'https://ean.expedia.com', 'Online travel shopping company.'),
  createApiEntry('skyscanner', 'Skyscanner', 'Travel', 'https://partners.api.skyscanner.net', 'Travel search engine.'),
  createApiEntry('amadeus', 'Amadeus', 'Travel', 'https://test.api.amadeus.com/v1', 'Travel technology company.'),

  // --- Weather & Science ---
  createApiEntry('openweathermap', 'OpenWeatherMap', 'Weather', 'https://api.openweathermap.org/data/2.5', 'Weather forecasting service.'),
  createApiEntry('weatherapi', 'WeatherAPI', 'Weather', 'https://api.weatherapi.com/v1', 'Weather data provider.'),
  createApiEntry('nasa', 'NASA API', 'Science', 'https://api.nasa.gov', 'National Aeronautics and Space Administration data.'),
  createApiEntry('spacex', 'SpaceX API', 'Science', 'https://api.spacexdata.com/v4', 'SpaceX launch data.'),

  // --- Crypto & Finance ---
  createApiEntry('coingecko', 'CoinGecko', 'Crypto', 'https://api.coingecko.com/api/v3', 'Cryptocurrency data aggregator.'),
  createApiEntry('coinmarketcap', 'CoinMarketCap', 'Crypto', 'https://pro-api.coinmarketcap.com', 'Cryptocurrency market data.'),
  createApiEntry('coinbase', 'Coinbase', 'Crypto', 'https://api.coinbase.com/v2', 'Cryptocurrency exchange platform.'),
  createApiEntry('binance', 'Binance', 'Crypto', 'https://api.binance.com/api/v3', 'Cryptocurrency exchange.'),
  createApiEntry('ethereum', 'Ethereum (Infura)', 'Crypto', 'https://mainnet.infura.io/v3', 'Blockchain development suite.'),
  createApiEntry('polygon', 'Polygon.io', 'Finance', 'https://api.polygon.io', 'Financial market data.'),
  createApiEntry('alpha-vantage', 'Alpha Vantage', 'Finance', 'https://www.alphavantage.co', 'Stock API.'),

  // --- Entertainment ---
  createApiEntry('spotify', 'Spotify', 'Entertainment', 'https://api.spotify.com/v1', 'Audio streaming and media services provider.'),
  createApiEntry('apple-music', 'Apple Music', 'Entertainment', 'https://api.music.apple.com/v1', 'Music streaming service.'),
  createApiEntry('soundcloud', 'SoundCloud', 'Entertainment', 'https://api.soundcloud.com', 'Online audio distribution platform.'),
  createApiEntry('twitch', 'Twitch', 'Entertainment', 'https://api.twitch.tv/helix', 'Live streaming service.'),
  createApiEntry('tmdb', 'The Movie Database', 'Entertainment', 'https://api.themoviedb.org/3', 'Movie and TV database.'),

  // --- Design ---
  createApiEntry('figma', 'Figma', 'Design', 'https://api.figma.com/v1', 'Collaborative interface design tool.'),
  createApiEntry('adobe-cc', 'Adobe Creative Cloud', 'Design', 'https://stock.adobe.io/Rest/Media/1', 'Creative software suite.'),
  createApiEntry('canva', 'Canva', 'Design', 'https://api.canva.com/rest/v1', 'Graphic design platform.'),
  createApiEntry('unsplash', 'Unsplash', 'Design', 'https://api.unsplash.com', 'Stock photography website.'),

  // --- Identity ---
  createApiEntry('auth0', 'Auth0', 'Identity', 'https://{tenant}.auth0.com/api/v2', 'Authentication and authorization platform.'),
  createApiEntry('okta', 'Okta', 'Identity', 'https://{domain}.okta.com/api/v1', 'Identity and access management.'),
  createApiEntry('firebase', 'Firebase', 'Identity', 'https://identitytoolkit.googleapis.com/v1', 'App development platform.'),
  createApiEntry('keycloak', 'Keycloak', 'Identity', 'https://{server}/auth/admin/realms/{realm}', 'Open source identity and access management.'),

  // --- Miscellaneous ---
  createApiEntry('wordpress', 'WordPress', 'CMS', 'https://public-api.wordpress.com/wp/v2', 'Content management system.'),
  createApiEntry('ghost', 'Ghost', 'CMS', 'https://{admin_domain}/ghost/api/v3/admin', 'Open source blogging platform.'),
  createApiEntry('strapi', 'Strapi', 'CMS', 'https://{domain}/api', 'Headless CMS.'),
  createApiEntry('contentful', 'Contentful', 'CMS', 'https://cdn.contentful.com', 'Headless CMS.'),
  createApiEntry('ifttt', 'IFTTT', 'Automation', 'https://maker.ifttt.com/trigger', 'Web-based service that allows users to create chains of simple conditional statements.'),
  createApiEntry('zapier', 'Zapier', 'Automation', 'https://zapier.com/api/v1', 'Product that allows end users to integrate the web applications they use.')
];

/**
 * Utility to retrieve an API definition by ID.
 */
export const getApiDefinition = (id: string): ApiDefinition | undefined => {
  return ApiCatalog.find(api => api.id === id);
};

/**
 * Utility to retrieve all APIs in a specific category.
 */
export const getApisByCategory = (category: string): ApiDefinition[] => {
  return ApiCatalog.filter(api => api.category === category);
};