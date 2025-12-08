import { OpenAPIObject } from 'openapi3-ts/oas31';

export const supportApiSpec: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Unified Support APIs',
    version: '1.0.0',
    description: 'A consolidated OpenAPI 3.1.0 specification for leading support platforms: Zendesk, Intercom, and Freshdesk. This specification includes common workflows, data schemas, and authentication mechanisms.',
    contact: {
      name: 'API Support Team',
      email: 'support@example.com',
      url: 'https://example.com/support',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'https://{subdomain}.zendesk.com/api/v2',
      description: 'Zendesk API Server',
      variables: {
        subdomain: {
          default: 'your-subdomain',
          description: 'Your Zendesk subdomain',
        },
      },
    },
    {
      url: 'https://api.intercom.io',
      description: 'Intercom API Server',
    },
    {
      url: 'https://{domain}.freshdesk.com/api/v2',
      description: 'Freshdesk API Server',
      variables: {
        domain: {
          default: 'your-domain',
          description: 'Your Freshdesk domain',
        },
      },
    },
  ],
  tags: [
    {
      name: 'Zendesk',
      description: 'Operations related to Zendesk Support',
    },
    {
      name: 'Intercom',
      description: 'Operations related to the Intercom Platform',
    },
    {
      name: 'Freshdesk',
      description: 'Operations related to Freshdesk Support Desk',
    },
  ],
  paths: {
    // Zendesk Paths
    '/tickets.json': {
      get: {
        tags: ['Zendesk'],
        summary: 'List Zendesk Tickets',
        operationId: 'zendeskListTickets',
        description: 'Retrieves a paginated list of tickets from Zendesk.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'The page number to retrieve.',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'per_page',
            in: 'query',
            description: 'Number of tickets per page.',
            schema: { type: 'integer', default: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'A list of Zendesk tickets.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tickets: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ZendeskTicket' },
                    },
                  },
                },
              },
            },
          },
        },
        security: [{ googleAuth: ['support:read'], zendeskApiToken: [] }],
        'x-google-auth-required': true,
        'x-workflow-id': 'wf_list_zendesk_tickets',
        'x-pre-script': 'console.log("Fetching Zendesk tickets...");',
        'x-post-script': 'console.log("Finished fetching Zendesk tickets.");',
      },
      post: {
        tags: ['Zendesk'],
        summary: 'Create Zendesk Ticket',
        operationId: 'zendeskCreateTicket',
        description: 'Creates a new ticket in Zendesk.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ticket: { $ref: '#/components/schemas/ZendeskTicketInput' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Ticket created successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ticket: { $ref: '#/components/schemas/ZendeskTicket' },
                  },
                },
              },
            },
          },
        },
        security: [{ googleAuth: ['support:write'], zendeskApiToken: [] }],
        'x-google-auth-required': true,
        'x-workflow-id': 'wf_create_zendesk_ticket',
      },
    },
    // Intercom Paths
    '/contacts': {
      get: {
        tags: ['Intercom'],
        summary: 'List Intercom Contacts',
        operationId: 'intercomListContacts',
        description: 'Retrieves a list of contacts (users or leads) from Intercom.',
        responses: {
          '200': {
            description: 'A list of Intercom contacts.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/IntercomContact' },
                    },
                  },
                },
              },
            },
          },
        },
        security: [{ googleAuth: ['support:read'], intercomApiToken: [] }],
        'x-google-auth-required': true,
        'x-workflow-id': 'wf_list_intercom_contacts',
      },
    },
    '/conversations': {
      post: {
        tags: ['Intercom'],
        summary: 'Create Intercom Conversation',
        operationId: 'intercomCreateConversation',
        description: 'Creates a new conversation in Intercom, typically initiated by a user.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/IntercomConversationInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Conversation created successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/IntercomConversation' },
              },
            },
          },
        },
        security: [{ googleAuth: ['support:write'], intercomApiToken: [] }],
        'x-google-auth-required': true,
        'x-workflow-id': 'wf_create_intercom_conversation',
      },
    },
    // Freshdesk Paths
    '/tickets': {
      get: {
        tags: ['Freshdesk'],
        summary: 'List Freshdesk Tickets',
        operationId: 'freshdeskListTickets',
        description: 'Retrieves a list of tickets from Freshdesk.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'per_page',
            in: 'query',
            schema: { type: 'integer', default: 30 },
          },
        ],
        responses: {
          '200': {
            description: 'A list of Freshdesk tickets.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/FreshdeskTicket' },
                },
              },
            },
          },
        },
        security: [{ googleAuth: ['support:read'], freshdeskApiToken: [] }],
        'x-google-auth-required': true,
        'x-workflow-id': 'wf_list_freshdesk_tickets',
      },
      post: {
        tags: ['Freshdesk'],
        summary: 'Create Freshdesk Ticket',
        operationId: 'freshdeskCreateTicket',
        description: 'Creates a new ticket in Freshdesk.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FreshdeskTicketInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Ticket created successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FreshdeskTicket' },
              },
            },
          },
        },
        security: [{ googleAuth: ['support:write'], freshdeskApiToken: [] }],
        'x-google-auth-required': true,
        'x-workflow-id': 'wf_create_freshdesk_ticket',
      },
    },
  },
  components: {
    schemas: {
      // Generic Schemas
      SupportUser: {
        type: 'object',
        properties: {
          id: { type: 'string', readOnly: true },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      // Zendesk Schemas
      ZendeskTicket: {
        type: 'object',
        properties: {
          id: { type: 'integer', readOnly: true },
          url: { type: 'string', format: 'uri', readOnly: true },
          subject: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['new', 'open', 'pending', 'solved', 'closed'] },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
          requester_id: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time', readOnly: true },
          updated_at: { type: 'string', format: 'date-time', readOnly: true },
        },
      },
      ZendeskTicketInput: {
        type: 'object',
        required: ['subject', 'comment'],
        properties: {
          subject: { type: 'string' },
          comment: {
            type: 'object',
            properties: {
              body: { type: 'string' },
            },
            required: ['body'],
          },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
          requester: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
          },
        },
      },
      // Intercom Schemas
      IntercomContact: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['contact'] },
          id: { type: 'string', readOnly: true },
          role: { type: 'string', enum: ['user', 'lead'] },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          created_at: { type: 'integer', format: 'int64', readOnly: true },
          updated_at: { type: 'integer', format: 'int64', readOnly: true },
        },
      },
      IntercomConversation: {
        type: 'object',
        properties: {
          id: { type: 'string', readOnly: true },
          created_at: { type: 'integer', format: 'int64', readOnly: true },
          state: { type: 'string', enum: ['open', 'closed'] },
          source: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              id: { type: 'string' },
              body: { type: 'string' },
              author: { $ref: '#/components/schemas/IntercomContact' },
            },
          },
        },
      },
      IntercomConversationInput: {
        type: 'object',
        required: ['from', 'body'],
        properties: {
          from: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['user', 'contact'] },
              id: { type: 'string' },
            },
            description: 'The user or contact initiating the conversation.',
          },
          body: {
            type: 'string',
            description: 'The initial message body.',
          },
        },
      },
      // Freshdesk Schemas
      FreshdeskTicket: {
        type: 'object',
        properties: {
          id: { type: 'integer', readOnly: true },
          subject: { type: 'string' },
          description_text: { type: 'string' },
          status: { type: 'integer', enum: [2, 3, 4, 5], description: '2:Open, 3:Pending, 4:Resolved, 5:Closed' },
          priority: { type: 'integer', enum: [1, 2, 3, 4], description: '1:Low, 2:Medium, 3:High, 4:Urgent' },
          email: { type: 'string', format: 'email' },
          created_at: { type: 'string', format: 'date-time', readOnly: true },
          updated_at: { type: 'string', format: 'date-time', readOnly: true },
        },
      },
      FreshdeskTicketInput: {
        type: 'object',
        required: ['subject', 'description', 'email', 'status', 'priority'],
        properties: {
          subject: { type: 'string' },
          description: { type: 'string' },
          email: { type: 'string', format: 'email' },
          status: { type: 'integer', enum: [2, 3, 4, 5], description: '2:Open, 3:Pending, 4:Resolved, 5:Closed' },
          priority: { type: 'integer', enum: [1, 2, 3, 4], description: '1:Low, 2:Medium, 3:High, 4:Urgent' },
        },
      },
      // Error Schema
      ApiError: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
    securitySchemes: {
      googleAuth: {
        type: 'oauth2',
        description: 'Authentication via Google OAuth2, providing a token to access platform APIs.',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scopes: {
              'https://www.googleapis.com/auth/drive.file': 'Access Google Drive files',
              'https://www.googleapis.com/auth/userinfo.email': 'Read user email address',
              'support:read': 'Read access to support platforms',
              'support:write': 'Write access to support platforms',
            },
          },
        },
      },
      zendeskApiToken: {
        type: 'http',
        scheme: 'basic',
        description: 'Zendesk API token authentication. Use your email address with `/token` appended as the username and the API token as the password.',
      },
      intercomApiToken: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Intercom API token for authentication.',
      },
      freshdeskApiToken: {
        type: 'http',
        scheme: 'basic',
        description: 'Freshdesk API key used for authentication. Use the API key as the username and a dummy value (e.g., "X") as the password.',
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
          },
        },
      },
      NotFoundError: {
        description: 'The requested resource was not found.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
          },
        },
      },
    },
  },
  'x-integrations': {
    googleDrive: {
      description: 'Integration with Google Drive for file attachments and storage.',
      'x-save-file-operation-id': 'googleDriveSaveFile',
    },
    github: {
      description: 'Integration with GitHub to link support tickets to issues and run CI/CD projects.',
      'x-run-project-operation-id': 'githubRunWorkflow',
    },
  },
};