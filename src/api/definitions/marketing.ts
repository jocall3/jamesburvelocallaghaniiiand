import type { OpenAPIObject } from 'openapi3-ts/oas31';

/**
 * This file provides OpenAPI 3.1.0 definitions for common marketing APIs.
 *
 * NOTE: These are representative, simplified examples. The full, official OpenAPI
 * specifications for these services are significantly larger and more complex.
 *
 * Custom extensions (e.g., `x-pre-script`, `x-post-script`, `x-workflow-id`)
 * are included to align with the project's goal of embedding executable logic
 * and workflow metadata directly into the API definitions.
 */
export const marketingApiDefinitions: Record<string, OpenAPIObject> = {
  mailchimp: {
    openapi: '3.1.0',
    info: {
      title: 'Mailchimp Marketing API',
      version: '3.0',
      description: 'A simplified OpenAPI definition for managing Mailchimp lists and campaigns.',
      contact: {
        name: 'Mailchimp API Team',
        url: 'https://mailchimp.com/developer/',
      },
    },
    servers: [
      {
        url: 'https://{dc}.api.mailchimp.com/3.0',
        variables: {
          dc: {
            default: 'us1',
            description: 'The datacenter prefix for your account (e.g., us1, us2, etc.).',
          },
        },
      },
    ],
    security: [
      {
        mailchimp_oauth: [],
      },
    ],
    paths: {
      '/lists': {
        get: {
          summary: 'Get all lists',
          operationId: 'getLists',
          tags: ['Lists'],
          description: 'Get information about all lists in the account.',
          responses: {
            '200': {
              description: 'A collection of lists.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      lists: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/MailchimpList',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a new list',
          operationId: 'createList',
          tags: ['Lists'],
          description: 'Creates a new mailing list.',
          'x-pre-script': 'scripts/mailchimp/validateNewListData.js',
          'x-post-script': 'scripts/mailchimp/logListCreation.js',
          'x-workflow-id': 'wf-001-new-marketing-list',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/NewMailchimpList',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'The newly created list.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/MailchimpList',
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        MailchimpList: {
          type: 'object',
          properties: {
            id: { type: 'string', readOnly: true },
            name: { type: 'string' },
            contact: {
              type: 'object',
              properties: {
                company: { type: 'string' },
                address1: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zip: { type: 'string' },
                country: { type: 'string' },
              },
            },
            permission_reminder: { type: 'string' },
            campaign_defaults: {
              type: 'object',
              properties: {
                from_name: { type: 'string' },
                from_email: { type: 'string' },
                subject: { type: 'string' },
                language: { type: 'string' },
              },
            },
            email_type_option: { type: 'boolean' },
          },
        },
        NewMailchimpList: {
          type: 'object',
          required: ['name', 'contact', 'permission_reminder', 'campaign_defaults', 'email_type_option'],
          properties: {
            name: { type: 'string' },
            contact: {
              type: 'object',
              properties: {
                company: { type: 'string' },
                address1: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zip: { type: 'string' },
                country: { type: 'string' },
              },
            },
            permission_reminder: { type: 'string' },
            campaign_defaults: {
              type: 'object',
              properties: {
                from_name: { type: 'string' },
                from_email: { type: 'string' },
                subject: { type: 'string' },
                language: { type: 'string' },
              },
            },
            email_type_option: { type: 'boolean' },
          },
        },
      },
      securitySchemes: {
        mailchimp_oauth: {
          type: 'oauth2',
          description: 'Mailchimp uses OAuth2 for authentication.',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://login.mailchimp.com/oauth2/authorize',
              tokenUrl: 'https://login.mailchimp.com/oauth2/token',
              scopes: {}, // Scopes are dynamic and not listed here
            },
          },
        },
      },
    },
  },
  hubspot: {
    openapi: '3.1.0',
    info: {
      title: 'HubSpot CRM API',
      version: 'v3',
      description: 'A simplified OpenAPI definition for managing HubSpot CRM objects like Contacts.',
    },
    servers: [
      {
        url: 'https://api.hubapi.com',
      },
    ],
    security: [
      {
        hubspot_oauth: ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
      },
    ],
    paths: {
      '/crm/v3/objects/contacts': {
        get: {
          summary: 'List Contacts',
          operationId: 'getContacts',
          tags: ['Contacts'],
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
            },
            {
              name: 'after',
              in: 'query',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'A paginated list of contacts.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HubspotCollectionResponse',
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a Contact',
          operationId: 'createContact',
          tags: ['Contacts'],
          'x-pre-script': 'scripts/hubspot/validateNewContact.js',
          'x-post-script': 'scripts/hubspot/syncContactToDrive.js',
          'x-workflow-id': 'wf-002-new-crm-contact',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    properties: {
                      $ref: '#/components/schemas/HubspotContactProperties',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Contact created successfully.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HubspotContact',
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        HubspotContactProperties: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            firstname: { type: 'string' },
            lastname: { type: 'string' },
            phone: { type: 'string' },
            company: { type: 'string' },
          },
        },
        HubspotContact: {
          type: 'object',
          properties: {
            id: { type: 'string', readOnly: true },
            properties: {
              $ref: '#/components/schemas/HubspotContactProperties',
            },
            createdAt: { type: 'string', format: 'date-time', readOnly: true },
            updatedAt: { type: 'string', format: 'date-time', readOnly: true },
            archived: { type: 'boolean', readOnly: true },
          },
        },
        HubspotCollectionResponse: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/HubspotContact',
              },
            },
            paging: {
              type: 'object',
              properties: {
                next: {
                  type: 'object',
                  properties: {
                    after: { type: 'string' },
                    link: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      securitySchemes: {
        hubspot_oauth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
              tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
              scopes: {
                'crm.objects.contacts.read': 'Read contacts',
                'crm.objects.contacts.write': 'Write contacts',
                'crm.schemas.contacts.read': 'Read contact schemas',
              },
            },
          },
        },
      },
    },
  },
  salesforce: {
    openapi: '3.1.0',
    info: {
      title: 'Salesforce REST API',
      version: 'v58.0',
      description: 'A simplified OpenAPI definition for interacting with Salesforce SObjects.',
    },
    servers: [
      {
        url: '{instanceUrl}',
        variables: {
          instanceUrl: {
            default: 'https://your-instance.my.salesforce.com',
            description: 'Your Salesforce instance URL.',
          },
        },
      },
    ],
    security: [
      {
        salesforce_oauth: ['api', 'refresh_token'],
      },
    ],
    paths: {
      '/services/data/v58.0/sobjects/Account/{id}': {
        get: {
          summary: 'Get Account Details',
          operationId: 'getAccount',
          tags: ['Account'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Account details.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SalesforceAccount',
                  },
                },
              },
            },
          },
        },
      },
      '/services/data/v58.0/sobjects/Account': {
        post: {
          summary: 'Create an Account',
          operationId: 'createAccount',
          tags: ['Account'],
          'x-pre-script': 'scripts/salesforce/validateAccountData.js',
          'x-post-script': 'scripts/salesforce/triggerGithubWorkflow.js',
          'x-workflow-id': 'wf-003-new-sales-account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/NewSalesforceAccount',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Account created.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      success: { type: 'boolean' },
                      errors: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        SalesforceAccount: {
          type: 'object',
          properties: {
            Id: { type: 'string', readOnly: true },
            Name: { type: 'string' },
            AccountNumber: { type: 'string' },
            Phone: { type: 'string' },
            Website: { type: 'string', format: 'uri' },
            AnnualRevenue: { type: 'number' },
            OwnerId: { type: 'string' },
            CreatedDate: { type: 'string', format: 'date-time', readOnly: true },
            LastModifiedDate: { type: 'string', format: 'date-time', readOnly: true },
          },
        },
        NewSalesforceAccount: {
          type: 'object',
          required: ['Name'],
          properties: {
            Name: { type: 'string' },
            AccountNumber: { type: 'string' },
            Phone: { type: 'string' },
            Website: { type: 'string', format: 'uri' },
            AnnualRevenue: { type: 'number' },
          },
        },
      },
      securitySchemes: {
        salesforce_oauth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
              tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
              scopes: {
                api: 'Full access to the API',
                refresh_token: 'Access to refresh token',
              },
            },
          },
        },
      },
    },
  },
};