import { OpenAPIObject } from 'openapi3-ts/oas31';

/**
 * OpenAPI 3.1.0 definition for the Slack Web API.
 * This definition covers a subset of the most common Slack API endpoints.
 * The authentication flow is designed to be initiated by a Google Sign-In process
 * in the consuming application, which then triggers the Slack OAuth2 flow.
 */
export const slackApiDefinition: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Slack API',
    version: '1.16.0',
    description: 'A partial OpenAPI 3.1.0 definition for the Slack Web API, focusing on messaging and user management. Authentication tokens are expected to be obtained via an OAuth2 flow, potentially initiated after a primary Google authentication.',
    contact: {
      name: 'Slack API Support',
      url: 'https://api.slack.com/support',
    },
  },
  servers: [
    {
      url: 'https://slack.com/api',
      description: 'Slack Web API Server',
    },
  ],
  components: {
    securitySchemes: {
      slackAuth: {
        type: 'oauth2',
        description: 'OAuth2 flow for Slack. The consuming application should manage the token exchange.',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://slack.com/oauth/v2/authorize',
            tokenUrl: 'https://slack.com/api/oauth.v2.access',
            scopes: {
              'chat:write': 'Send messages as your app',
              'chat:write.public': 'Send messages to public channels',
              'users:read': 'View basic information about users in a workspace',
              'users:read.email': 'View email addresses of users in a workspace',
            },
          },
        },
      },
    },
    schemas: {
      SlackError: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', enum: [false] },
          error: { type: 'string' },
          response_metadata: {
            type: 'object',
            properties: {
              messages: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
        required: ['ok', 'error'],
      },
      SlackUser: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID, e.g., W012A3CDE' },
          team_id: { type: 'string' },
          name: { type: 'string', description: 'Username' },
          real_name: { type: 'string' },
          is_admin: { type: 'boolean' },
          is_owner: { type: 'boolean' },
          is_bot: { type: 'boolean' },
          profile: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              image_72: { type: 'string', format: 'uri' },
              display_name: { type: 'string' },
            },
          },
        },
      },
      SlackMessage: {
        type: 'object',
        properties: {
          ts: { type: 'string', description: 'Timestamp of the message' },
          channel: { type: 'string', description: 'Channel ID' },
          text: { type: 'string', description: 'Plain text content of the message' },
        },
      },
    },
  },
  paths: {
    '/chat.postMessage': {
      post: {
        summary: 'Sends a message to a channel.',
        operationId: 'slackChatPostMessage',
        tags: ['Messaging'],
        security: [{ slackAuth: ['chat:write'] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  channel: { type: 'string', description: 'Channel, private group, or IM channel to send message to. Can be an encoded ID, or a name.' },
                  text: { type: 'string', description: 'The formatted text of the message to be published.' },
                  as_user: { type: 'boolean', description: 'Pass true to post the message as the authed user, instead of as a bot.' },
                },
                required: ['channel', 'text'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Message sent successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', enum: [true] },
                    channel: { type: 'string' },
                    ts: { type: 'string' },
                    message: { $ref: '#/components/schemas/SlackMessage' },
                  },
                },
              },
            },
          },
          default: {
            description: 'An error occurred.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SlackError' },
              },
            },
          },
        },
        'x-pre-execution-script': 'console.log("Preparing to post Slack message...");',
        'x-post-execution-script': 'const data = JSON.parse(response.body); if(!data.ok) { throw new Error(`Slack API Error: ${data.error}`); } return data;',
        'x-workflow-id': 'send-notification-slack',
      },
    },
    '/users.list': {
      get: {
        summary: 'Lists all users in a Slack team.',
        operationId: 'slackUsersList',
        tags: ['Users'],
        security: [{ slackAuth: ['users:read'] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'The maximum number of items to return.',
            schema: { type: 'integer', default: 100 },
          },
          {
            name: 'cursor',
            in: 'query',
            description: 'Pagination cursor for the next page of results.',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'A list of users.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', enum: [true] },
                    members: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SlackUser' },
                    },
                    response_metadata: {
                      type: 'object',
                      properties: {
                        next_cursor: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          default: {
            description: 'An error occurred.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SlackError' },
              },
            },
          },
        },
      },
    },
  },
};

/**
 * OpenAPI 3.1.0 definition for the Notion API.
 * This definition covers a subset of page and block manipulation endpoints.
 */
export const notionApiDefinition: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Notion API',
    version: '2022-06-28',
    description: 'A partial OpenAPI 3.1.0 definition for the Notion API. The `Notion-Version` header is required for all requests.',
  },
  servers: [
    {
      url: 'https://api.notion.com/v1',
      description: 'Notion API v1 Server',
    },
  ],
  components: {
    securitySchemes: {
      notionAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'secret_...',
        description: 'Notion integration token.',
      },
    },
    schemas: {
      NotionPage: {
        type: 'object',
        properties: {
          object: { type: 'string', enum: ['page'] },
          id: { type: 'string', format: 'uuid' },
          created_time: { type: 'string', format: 'date-time' },
          last_edited_time: { type: 'string', format: 'date-time' },
          parent: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              database_id: { type: 'string', format: 'uuid' },
            },
          },
          archived: { type: 'boolean' },
          url: { type: 'string', format: 'uri' },
          properties: { type: 'object' }, // Complex, varies by database
        },
      },
      NotionBlock: {
        type: 'object',
        properties: {
          object: { type: 'string', enum: ['block'] },
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string' },
          // ... other block properties
        },
      },
      NotionError: {
        type: 'object',
        properties: {
          object: { type: 'string', enum: ['error'] },
          status: { type: 'integer' },
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/pages': {
      post: {
        summary: 'Create a page',
        operationId: 'notionCreatePage',
        tags: ['Pages'],
        requestBody: {
          description: 'The page object to create.',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  parent: {
                    type: 'object',
                    properties: {
                      database_id: { type: 'string' },
                    },
                    required: ['database_id'],
                  },
                  properties: {
                    type: 'object',
                    description: 'Property values for the new page.',
                  },
                  children: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/NotionBlock' },
                    description: 'Content blocks for the new page.',
                  },
                },
                required: ['parent', 'properties'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'The newly created page object.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotionPage' },
              },
            },
          },
          default: {
            description: 'Error response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotionError' },
              },
            },
          },
        },
      },
    },
    '/pages/{page_id}': {
      get: {
        summary: 'Retrieve a page',
        operationId: 'notionGetPage',
        tags: ['Pages'],
        parameters: [
          {
            name: 'page_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'The requested page object.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotionPage' },
              },
            },
          },
          default: {
            description: 'Error response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotionError' },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      notionAuth: [],
    },
  ],
};

/**
 * OpenAPI 3.1.0 definition for the Trello API.
 * This definition covers a subset of card and board manipulation endpoints.
 */
export const trelloApiDefinition: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Trello API',
    version: '1.0',
    description: 'A partial OpenAPI 3.1.0 definition for the Trello REST API.',
  },
  servers: [
    {
      url: 'https://api.trello.com/1',
      description: 'Trello API v1 Server',
    },
  ],
  components: {
    securitySchemes: {
      trelloAuth: {
        type: 'apiKey',
        in: 'query',
        name: 'key',
        description: 'Trello API Key. A token must also be provided.',
      },
      trelloToken: {
        type: 'apiKey',
        in: 'query',
        name: 'token',
        description: 'Trello API Token, obtained via OAuth or manually.',
      },
    },
    schemas: {
      TrelloCard: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          desc: { type: 'string' },
          idBoard: { type: 'string' },
          idList: { type: 'string' },
          due: { type: 'string', format: 'date-time', nullable: true },
          url: { type: 'string', format: 'uri' },
        },
      },
      TrelloError: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          error: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/cards': {
      post: {
        summary: 'Create a new card',
        operationId: 'trelloCreateCard',
        tags: ['Cards'],
        parameters: [
          { name: 'idList', in: 'query', required: true, schema: { type: 'string' }, description: 'The ID of the list the card should be created in.' },
          { name: 'name', in: 'query', required: true, schema: { type: 'string' }, description: 'The name for the new card.' },
          { name: 'desc', in: 'query', schema: { type: 'string' }, description: 'The description for the new card.' },
        ],
        responses: {
          '200': {
            description: 'The newly created card.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TrelloCard' },
              },
            },
          },
          default: {
            description: 'Error response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TrelloError' },
              },
            },
          },
        },
      },
    },
    '/cards/{id}': {
      get: {
        summary: 'Get a card by ID',
        operationId: 'trelloGetCard',
        tags: ['Cards'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'The requested card.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TrelloCard' },
              },
            },
          },
          default: {
            description: 'Error response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TrelloError' },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      trelloAuth: [],
      trelloToken: [],
    },
  ],
};

/**
 * OpenAPI 3.1.0 definition for the Asana API.
 * This definition covers a subset of task and project manipulation endpoints.
 */
export const asanaApiDefinition: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Asana API',
    version: '1.0',
    description: 'A partial OpenAPI 3.1.0 definition for the Asana API.',
  },
  servers: [
    {
      url: 'https://app.asana.com/api/1.0',
      description: 'Asana API v1.0 Server',
    },
  ],
  components: {
    securitySchemes: {
      asanaAuth: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://app.asana.com/-/oauth_authorize',
            tokenUrl: 'https://app.asana.com/-/oauth_token',
            scopes: {},
          },
        },
      },
    },
    schemas: {
      AsanaTask: {
        type: 'object',
        properties: {
          gid: { type: 'string', description: 'Globally unique identifier of the resource.' },
          resource_type: { type: 'string', enum: ['task'] },
          name: { type: 'string' },
          notes: { type: 'string' },
          completed: { type: 'boolean' },
          due_on: { type: 'string', format: 'date', nullable: true },
          workspace: {
            type: 'object',
            properties: {
              gid: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
      AsanaError: {
        type: 'object',
        properties: {
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                help: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/tasks': {
      post: {
        summary: 'Create a task',
        operationId: 'asanaCreateTask',
        tags: ['Tasks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      notes: { type: 'string' },
                      workspace: { type: 'string', description: 'GID of the workspace.' },
                      projects: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['name', 'workspace'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'The newly created task.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/AsanaTask' },
                  },
                },
              },
            },
          },
          default: {
            description: 'Error response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AsanaError' },
              },
            },
          },
        },
      },
    },
    '/tasks/{task_gid}': {
      get: {
        summary: 'Get a task',
        operationId: 'asanaGetTask',
        tags: ['Tasks'],
        parameters: [
          { name: 'task_gid', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'The requested task.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/AsanaTask' },
                  },
                },
              },
            },
          },
          default: {
            description: 'Error response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AsanaError' },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      asanaAuth: [],
    },
  ],
};