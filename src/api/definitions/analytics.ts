import { OpenAPIObject, SchemaObject, ReferenceObject, ParameterObject, RequestBodyObject, ResponseObject, SecuritySchemeObject } from 'openapi3-ts/oas31';

// --- Reusable Schemas ---
const commonSchemas: { [key: string]: SchemaObject | ReferenceObject } = {
  // Base properties for all analytics events
  BaseEvent: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'The ID of the user associated with the event. Required for "identify" calls.',
        nullable: true,
      },
      anonymousId: {
        type: 'string',
        description: 'An anonymous ID for the user, used when userId is not available.',
        nullable: true,
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: 'The time the event occurred. Defaults to the time the API receives the event.',
        nullable: true,
      },
      context: {
        $ref: '#/components/schemas/Context',
      },
      integrations: {
        $ref: '#/components/schemas/Integrations',
      },
    },
    // userId or anonymousId should be present, but not strictly required by schema for flexibility
  },

  // Context object for events, containing environmental and user-specific data
  Context: {
    type: 'object',
    properties: {
      ip: { type: 'string', format: 'ipv4', description: 'The IP address of the user.' },
      userAgent: { type: 'string', description: 'The user agent string of the client.' },
      locale: { type: 'string', description: 'The locale of the user (e.g., "en-US").' },
      library: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the client library (e.g., "analytics.js").' },
          version: { type: 'string', description: 'Version of the client library.' },
        },
        description: 'Information about the client library used to send the event.',
      },
      device: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique ID for the device.' },
          manufacturer: { type: 'string', description: 'Device manufacturer.' },
          model: { type: 'string', description: 'Device model.' },
          name: { type: 'string', description: 'Device name.' },
          type: { type: 'string', description: 'Device type (e.g., "mobile", "desktop").' },
          version: { type: 'string', description: 'Device OS version.' },
        },
        description: 'Information about the device from which the event originated.',
      },
      os: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Operating system name (e.g., "iOS", "Android", "Windows").' },
          version: { type: 'string', description: 'Operating system version.' },
        },
        description: 'Information about the operating system.',
      },
      screen: {
        type: 'object',
        properties: {
          density: { type: 'number', description: 'Pixel density of the screen.' },
          height: { type: 'number', description: 'Screen height in pixels.' },
          width: { type: 'number', description: 'Screen width in pixels.' },
        },
        description: 'Information about the user\'s screen.',
      },
      referrer: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri', description: 'Full URL of the referring page.' },
          path: { type: 'string', description: 'Path of the referring page.' },
          host: { type: 'string', description: 'Host of the referring page.' },
        },
        description: 'Information about the referring page.',
      },
      campaign: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Campaign name (e.g., "Summer Sale").' },
          source: { type: 'string', description: 'Campaign source (e.g., "google", "facebook").' },
          medium: { type: 'string', description: 'Campaign medium (e.g., "cpc", "email").' },
          term: { type: 'string', description: 'Campaign term (e.g., "keyword").' },
          content: { type: 'string', description: 'Campaign content (e.g., "banner-ad").' },
        },
        description: 'UTM campaign parameters.',
      },
      app: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Application name.' },
          version: { type: 'string', description: 'Application version.' },
          build: { type: 'string', description: 'Application build number.' },
        },
        description: 'Information about the application sending the event.',
      },
      // Allow for arbitrary additional context properties
      additionalProperties: { type: 'object' },
    },
    additionalProperties: true, // Allow for custom context properties not explicitly defined
    description: 'Contextual information about the event, user, and environment.',
  },

  // Integrations object for events, controlling data flow to specific platforms
  Integrations: {
    type: 'object',
    description: 'Control which integrations the event should be sent to. Keys are integration names, values are booleans (true to enable, false to disable).',
    properties: {
      all: {
        type: 'boolean',
        description: 'Set to `false` to disable all integrations for this event, overriding individual settings.',
        default: true,
      },
      // Example specific integrations (can be dynamically extended by the system)
      Segment: { type: 'boolean', description: 'Enable/disable Segment for this event.' },
      Mixpanel: { type: 'boolean', description: 'Enable/disable Mixpanel for this event.' },
      'Google Analytics': { type: 'boolean', description: 'Enable/disable Google Analytics for this event.' },
      Amplitude: { type: 'boolean', description: 'Enable/disable Amplitude for this event.' },
      Heap: { type: 'boolean', description: 'Enable/disable Heap for this event.' },
    },
    additionalProperties: {
      type: 'boolean',
      description: 'Enable/disable a specific integration by its name. Any integration not explicitly listed here will default to the `all` setting.',
    },
  },

  // Schema for a 'track' event
  TrackEvent: {
    allOf: [
      { $ref: '#/components/schemas/BaseEvent' },
      {
        type: 'object',
        properties: {
          event: {
            type: 'string',
            description: 'The name of the event being tracked (e.g., "Product Clicked", "Order Completed").',
          },
          properties: {
            type: 'object',
            description: 'A dictionary of properties describing the event (e.g., { "productId": "123", "price": 9.99 }).',
            additionalProperties: true,
          },
        },
        required: ['event'],
      },
    ],
    description: 'Represents a custom event performed by a user.',
  },

  // Schema for an 'identify' event
  IdentifyUser: {
    allOf: [
      { $ref: '#/components/schemas/BaseEvent' },
      {
        type: 'object',
        properties: {
          traits: {
            type: 'object',
            description: 'A dictionary of traits (user properties) to associate with the user (e.g., { "email": "user@example.com", "plan": "premium" }).',
            additionalProperties: true,
          },
        },
        required: ['userId'], // userId is typically required for identify calls
      },
    ],
    description: 'Associates a user ID with a set of traits, identifying them across sessions and devices.',
  },

  // Schema for a 'page' event
  PageEvent: {
    allOf: [
      { $ref: '#/components/schemas/BaseEvent' },
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the page (e.g., "Product Page", "Checkout").',
            nullable: true,
          },
          category: {
            type: 'string',
            description: 'The category of the page (e.g., "E-commerce", "Blog").',
            nullable: true,
          },
          properties: {
            type: 'object',
            description: 'A dictionary of properties for the page view (e.g., { "url": "/products/123", "title": "My Product" }).',
            additionalProperties: true,
          },
        },
        // name or category or properties should be present, but not strictly required by schema for flexibility
      },
    ],
    description: 'Records a page view, typically when a user navigates to a new page.',
  },

  // Generic API Response schema
  ApiResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Indicates if the API call was successful.',
      },
      message: {
        type: 'string',
        description: 'A human-readable message about the operation.',
        nullable: true,
      },
      data: {
        type: 'object',
        description: 'Optional data returned by the API (e.g., confirmation ID).',
        nullable: true,
        additionalProperties: true,
      },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'A unique error code.' },
            message: { type: 'string', description: 'A detailed error message.' },
            target: { type: 'string', description: 'The field or resource that caused the error.', nullable: true },
          },
          required: ['code', 'message'],
        },
        description: 'An array of error objects if the operation failed.',
        nullable: true,
      },
    },
    required: ['success'],
    description: 'Standard response format for all analytics API operations.',
  },
};

// --- Security Schemes ---
const securitySchemes: { [key: string]: SecuritySchemeObject } = {
  googleAuth: {
    type: 'oauth2',
    description: 'Authentication via Google OAuth 2.0. Users must log in with their Google account.',
    flows: {
      authorizationCode: {
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: {
          openid: 'Authenticate using OpenID Connect to get user ID.',
          email: 'Access to user\'s primary email address.',
          profile: 'Access to user\'s basic profile information (name, picture).',
          'https://www.googleapis.com/auth/drive.file': 'Allows the application to store and retrieve files in Google Drive on behalf of the user.',
          // Add other necessary scopes for future integrations (e.g., Google Ads, Google Cloud)
        },
        'x-auth-redirect-param': 'redirect_uri', // Custom extension to indicate the redirect parameter name for the auth URL
      },
    },
    'x-token-param': 'token', // Custom extension to indicate the parameter name for the API token in requests
  },
};

// --- Paths and Operations ---
const analyticsPaths: OpenAPIObject['paths'] = {
  '/track': {
    post: {
      operationId: 'trackEvent',
      summary: 'Record a custom event.',
      description: 'Sends a custom event with associated properties to configured analytics platforms. This is used for tracking user actions, business events, etc.',
      tags: ['Events'],
      requestBody: {
        description: 'Event data to be tracked.',
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/TrackEvent',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Event successfully recorded and dispatched.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
        '400': {
          description: 'Invalid event data provided in the request body.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized: Authentication token is missing or invalid.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
        '500': {
          description: 'Internal server error during event processing.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
      },
      security: [{ googleAuth: [] }], // This operation requires Google authentication
      'x-pre-script': 'console.log("Executing pre-track script for event: " + request.body.event);',
      'x-post-script': 'console.log("Executing post-track script for event: " + response.data.eventId);',
      'x-workflow': {
        name: 'TrackEventProcessingWorkflow',
        description: 'Workflow for processing a track event.',
        steps: [
          { name: 'ValidateSchema', action: 'validateInput', schema: 'TrackEvent', description: 'Validate the incoming event data against the TrackEvent schema.' },
          { name: 'EnrichContext', action: 'enrichData', config: { ipLookup: true, userAgentParse: true }, description: 'Enrich event context with IP geolocation and user agent parsing.' },
          { name: 'DispatchToIntegrations', action: 'fanOutToIntegrations', config: { dynamic: true }, description: 'Send the event to all enabled analytics integrations.' },
          { name: 'PersistRawEvent', action: 'saveToGoogleDrive', config: { folder: 'raw-analytics-events' }, description: 'Save the raw event data to Google Drive for archival.' },
          { name: 'TriggerGitHubProject', action: 'runGitHubWorkflow', config: { repo: 'analytics-reports', workflow: 'generate-event-report' }, description: 'Trigger a GitHub Actions workflow to generate a report based on the event.' },
        ],
      },
    },
  },
  '/identify': {
    post: {
      operationId: 'identifyUser',
      summary: 'Identify a user and their traits.',
      description: 'Associates a user ID with a set of traits (properties) and sends them to configured analytics platforms. This helps build user profiles.',
      tags: ['Users'],
      requestBody: {
        description: 'User identification data.',
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/IdentifyUser',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'User successfully identified and traits updated.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
        '400': {
          description: 'Invalid identification data provided (e.g., missing userId).',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized: Authentication token is missing or invalid.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
        '500': {
          description: 'Internal server error during user identification.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
      },
      security: [{ googleAuth: [] }],
      'x-pre-script': 'console.log("Executing pre-identify script for user: " + request.body.userId);',
      'x-post-script': 'console.log("Executing post-identify script for user: " + request.body.userId);',
      'x-workflow': {
        name: 'IdentifyUserProcessingWorkflow',
        description: 'Workflow for processing an identify event.',
        steps: [
          { name: 'ValidateSchema', action: 'validateInput', schema: 'IdentifyUser', description: 'Validate the incoming user identification data.' },
          { name: 'UpdateCRM', action: 'updateCustomerProfile', config: { crmSystem: 'Salesforce' }, description: 'Update the user profile in the CRM system.' },
          { name: 'DispatchToIntegrations', action: 'fanOutToIntegrations', config: { dynamic: true }, description: 'Send the identification data to all enabled analytics integrations.' },
          { name: 'SyncUserSegments', action: 'updateUserSegments', description: 'Update user segments based on new traits.' },
        ],
      },
    },
  },
  '/page': {
    post: {
      operationId: 'pageView',
      summary: 'Record a page view.',
      description: 'Sends page view information (name, category, properties) to configured analytics platforms. This tracks user navigation.',
      tags: ['Pages'],
      requestBody: {
        description: 'Page view data.',
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PageEvent',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Page view successfully recorded and dispatched.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
        '400': {
          description: 'Invalid page view data provided.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized: Authentication token is missing or invalid.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
        '500': {
          description: 'Internal server error during page view processing.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
      },
      security: [{ googleAuth: [] }],
      'x-pre-script': 'console.log("Executing pre-page script for page: " + request.body.name);',
      'x-post-script': 'console.log("Executing post-page script for page: " + request.body.name);',
      'x-workflow': {
        name: 'PageViewProcessingWorkflow',
        description: 'Workflow for processing a page view event.',
        steps: [
          { name: 'ValidateSchema', action: 'validateInput', schema: 'PageEvent', description: 'Validate the incoming page view data.' },
          { name: 'EnrichContext', action: 'enrichData', config: { urlMetadata: true }, description: 'Enrich page context with metadata from the URL.' },
          { name: 'DispatchToIntegrations', action: 'fanOutToIntegrations', config: { dynamic: true }, description: 'Send the page view data to all enabled analytics integrations.' },
        ],
      },
    },
  },
};

// --- Full OpenAPI Definition ---
export const analyticsApiDefinition: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Unified Analytics API',
    version: '1.0.0',
    description: 'This API provides a unified interface for sending analytics data (events, user identifications, page views) to various analytics platforms like Segment, Mixpanel, and Google Analytics. It integrates deeply with Google for authentication and can leverage Google Drive for data storage and GitHub for project execution, supporting a wide array of integrations and custom workflows.',
    contact: {
      name: 'AI Programmer',
      url: 'https://example.com/support',
      email: 'support@example.com',
    },
    license: {
      name: 'Apache 2.0',
      url: 'http://www.apache.org/licenses/LICENSE-2.0.html',
    },
  },
  servers: [
    {
      url: '{apiUrl}',
      description: 'Base URL for the Analytics API endpoint. This URL will be dynamically configured.',
      variables: {
        apiUrl: {
          default: 'https://api.yourdomain.com/analytics/v1', // Example default, should be configurable in deployment
          description: 'The base URL where the analytics service is hosted. This should be the entry point for all analytics requests.',
        },
      },
    },
  ],
  // Global security requirement: all operations require Google authentication
  security: [
    {
      googleAuth: [],
    },
  ],
  paths: analyticsPaths,
  components: {
    schemas: commonSchemas,
    securitySchemes: securitySchemes,
    // Additional components like parameters, headers, examples can be added here
  },
  // --- Custom Project-Wide Extensions ---
  'x-project-config': {
    authentication: {
      method: 'google',
      description: 'All API access requires authentication via Google login using OAuth 2.0 authorization code flow.',
      authRedirectUrlParameter: 'authRedirect', // The query parameter name used for the authentication redirect URL
      tokenParameter: 'token', // The query parameter or header name used for the API token
    },
    integrations: {
      googleDrive: {
        enabled: true,
        description: 'Allows saving analytics reports, raw data, or configuration files to Google Drive. Requires specific Google Drive scopes.',
        scopesRequired: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.metadata.readonly'],
      },
      gitHubProjects: {
        enabled: true,
        description: 'Enables triggering and running GitHub projects (e.g., data processing scripts, report generation, CI/CD pipelines) based on analytics events or schedules.',
        // Potentially add GitHub specific scopes or configuration, e.g., 'repo', 'workflow'
        scopesRequired: ['repo', 'workflow'],
      },
      supportedApis: [
        'Segment', 'Mixpanel', 'Google Analytics', 'Amplitude', 'Heap', 'FullStory', 'Intercom', 'Customer.io', 'Braze', 'Iterable',
        'Adobe Analytics', 'Kissmetrics', 'Pendo', 'Hotjar', 'Optimizely', 'VWO', 'LaunchDarkly', 'Firebase Analytics', 'AppsFlyer', 'Adjust',
        // ... This list can dynamically expand to support up to 1000 different APIs.
        // For brevity, only a representative subset is included here.
      ],
      maxSupportedApis: 1000,
      description: 'A comprehensive list of analytics and marketing automation APIs supported by this unified platform.',
    },
    workflowEngine: {
      enabled: true,
      description: 'Supports a robust workflow engine for each operation, allowing for custom pre-scripts, post-scripts, and sequential steps for data processing, enrichment, and dispatch.',
      workflowDefinitionLanguage: 'YAML/JSON', // Example of specifying workflow language
    },
    dataGovernance: {
      enabled: true,
      description: 'Includes features for data privacy, compliance (e.g., GDPR, CCPA), and data retention policies.',
      defaultRetentionDays: 365,
      anonymizationLevels: ['none', 'partial', 'full'],
    },
  },
  // Example of a global workflow definition or common workflow steps that can be referenced
  'x-global-workflows': {
    'data-ingestion-pipeline': {
      description: 'Standard workflow for processing incoming analytics data before specific operation workflows.',
      steps: [
        { name: 'GlobalSchemaValidation', action: 'validateInput', description: 'Perform initial schema validation for all incoming data.' },
        { name: 'GlobalDataTransformation', action: 'applyETL', config: { commonTransforms: ['timestampNormalization', 'dataSanitization'] }, description: 'Apply common ETL processes.' },
        { name: 'GlobalSecurityScan', action: 'scanForMaliciousPayloads', description: 'Scan incoming data for security threats.' },
      ],
    },
    'error-handling-workflow': {
      description: 'Standard workflow for handling API errors.',
      steps: [
        { name: 'LogError', action: 'logToMonitoringSystem', config: { severity: 'error' } },
        { name: 'NotifyTeam', action: 'sendAlert', config: { channel: 'slack' } },
        { name: 'AttemptRetry', action: 'retryOperation', config: { maxRetries: 3, delay: 5000 } },
      ],
    },
  },
};