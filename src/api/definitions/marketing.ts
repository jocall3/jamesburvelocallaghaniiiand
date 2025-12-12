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
  Citibankdemobusinessinc: {
    openapi: '3.1.0',
    info: {
      title: 'Citibank Demo Business Inc. - Unified Open Banking Platform',
      version: '1.0',
      description: 'A unified platform for open banking services, designed to standardize and enhance financial interactions.',
    },
    servers: [
      {
        url: 'https://api.citibankdemobusinessinc.com',
        description: 'Main production server',
      },
    ],
    security: [
      {
        oauth2: ['read', 'write'],
      },
    ],
    paths: {
      '/orchestration/status': {
        get: {
          summary: 'Get Orchestration Status',
          operationId: 'getOrchestrationStatus',
          tags: ['Orchestration'],
          description: 'Retrieves the status of the unified orchestration layer.',
          responses: {
            '200': {
              description: 'Orchestration status details.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', description: 'Current status of the orchestration layer.' },
                      lastUpdated: { type: 'string', format: 'date-time', description: 'Timestamp of the last status update.' },
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
        Error: {
          type: 'object',
          properties: {
            code: { type: 'integer', format: 'int32' },
            message: { type: 'string' },
          },
        },
      },
      securitySchemes: {
        oauth2: {
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://api.citibankdemobusinessinc.com/oauth2/authorize',
              scopes: {
                read: 'Grants read access',
                write: 'Grants write access',
              },
            },
          },
        },
      },
    },
  },
  Citibankdemobusinessinc_Lendperfect: {
    openapi: '3.1.0',
    info: {
      title: 'Citibank Demo Business Inc. - Lendperfect',
      version: '1.0',
      description: 'A platform for optimizing lending processes using AI-driven risk assessment and personalized loan products.',
      termsOfService: 'https://citibankdemobusinessinc.com/terms/',
      contact: {
        name: 'Lendperfect Support',
        url: 'https://citibankdemobusinessinc.com/support',
        email: 'support@citibankdemobusinessinc.com',
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
      },
    },
    servers: [
      {
        url: 'https://lendperfect.citibankdemobusinessinc.com',
        description: 'Production server for Lendperfect',
      },
    ],
    tags: [
      {
        name: 'Loans',
        description: 'Operations related to loan applications and management',
      },
      {
        name: 'Risk Assessment',
        description: 'Endpoints for assessing loan risk',
      },
    ],
    paths: {
      '/loans/apply': {
        post: {
          summary: 'Apply for a Loan',
          operationId: 'applyForLoan',
          tags: ['Loans'],
          description: 'Submits a loan application and initiates the risk assessment process.',
          requestBody: {
            description: 'Loan application details',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoanApplication',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Loan application submitted successfully.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/LoanApprovalResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Invalid application data.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
          'x-mission-statement': 'To provide accessible and personalized lending solutions through AI-driven risk assessment.',
          'x-monetization-path': 'Charging interest on loans and fees for premium services.',
          'x-ip-moat': 'Proprietary AI algorithms for risk assessment and loan product personalization.',
          'x-auto-scaling': 'Kubernetes-based auto-scaling to handle loan application volume.',
          'x-regulatory-alignment': 'Compliance with lending regulations and data privacy laws.',
          'x-supervisory-response': 'Automated reporting and response to regulatory inquiries.',
          'x-risk-detection': 'Real-time monitoring for fraudulent loan applications.',
          'x-material-risk-evaluation': 'Assessment of macroeconomic factors affecting loan portfolio risk.',
          'x-liquidity-monitoring': 'Continuous monitoring of available funds for loan disbursement.',
          'x-internal-governance': 'Internal policies and procedures for loan approval and risk management.',
          'x-compliance-automation': 'Automated checks for regulatory compliance.',
          'x-embedded-audit': 'Regular audits to ensure compliance and accuracy.',
        },
      },
      '/risk/assess': {
        post: {
          summary: 'Assess Loan Risk',
          operationId: 'assessLoanRisk',
          tags: ['Risk Assessment'],
          description: 'Evaluates the risk associated with a loan application using AI algorithms.',
          requestBody: {
            description: 'Loan application data for risk assessment',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoanApplication',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Risk assessment results.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RiskAssessmentResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Invalid application data.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
          'x-mission-statement': 'To provide accurate and reliable risk assessments using advanced AI technologies.',
          'x-monetization-path': 'Offering risk assessment services to other financial institutions.',
          'x-ip-moat': 'Patented AI algorithms for risk assessment.',
          'x-auto-scaling': 'Serverless architecture for scaling risk assessment computations.',
          'x-regulatory-alignment': 'Compliance with credit risk assessment standards.',
          'x-supervisory-response': 'Automated reporting of risk assessment methodologies.',
          'x-risk-detection': 'Monitoring for biases in risk assessment algorithms.',
          'x-material-risk-evaluation': 'Incorporating macroeconomic data into risk models.',
          'x-liquidity-monitoring': 'Assessing the impact of loan defaults on liquidity.',
          'x-internal-governance': 'Governance framework for AI model development and validation.',
          'x-compliance-automation': 'Automated validation of risk assessment models.',
          'x-embedded-audit': 'Regular audits of risk assessment processes.',
        },
      },
    },
    components: {
      schemas: {
        LoanApplication: {
          type: 'object',
          required: [
            'applicantName',
            'applicantIncome',
            'loanAmount',
            'loanPurpose',
            'creditScore',
          ],
          properties: {
            applicantName: {
              type: 'string',
              description: 'Name of the loan applicant',
            },
            applicantIncome: {
              type: 'number',
              format: 'float',
              description: 'Annual income of the loan applicant',
            },
            loanAmount: {
              type: 'number',
              format: 'float',
              description: 'Amount of the loan requested',
            },
            loanPurpose: {
              type: 'string',
              description: 'Purpose of the loan',
            },
            creditScore: {
              type: 'integer',
              format: 'int32',
              description: 'Credit score of the applicant',
            },
          },
        },
        LoanApprovalResponse: {
          type: 'object',
          properties: {
            loanId: {
              type: 'string',
              description: 'Unique identifier for the loan',
            },
            approvalStatus: {
              type: 'string',
              enum: ['approved', 'rejected', 'pending'],
              description: 'Status of the loan application',
            },
            interestRate: {
              type: 'number',
              format: 'float',
              description: 'Interest rate applied to the loan',
            },
            approvedAmount: {
              type: 'number',
              format: 'float',
              description: 'Amount of the loan approved',
            },
          },
        },
        RiskAssessmentResponse: {
          type: 'object',
          properties: {
            riskScore: {
              type: 'number',
              format: 'float',
              description: 'Risk score associated with the loan application',
            },
            riskLevel: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Risk level associated with the loan application',
            },
            factors: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Factors contributing to the risk score',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              format: 'int32',
              description: 'Error code',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
      securitySchemes: {
        oauth2: {
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://lendperfect.citibankdemobusinessinc.com/oauth2/authorize',
              scopes: {
                read: 'Grants read access',
                write: 'Grants write access',
              },
            },
          },
        },
      },
    },
  },
  Citibankdemobusinessinc_Investwise: {
    openapi: '3.1.0',
    info: {
      title: 'Citibank Demo Business Inc. - Investwise',
      version: '1.0',
      description: 'An AI-powered investment platform providing personalized investment advice and automated portfolio management.',
      termsOfService: 'https://citibankdemobusinessinc.com/terms/',
      contact: {
        name: 'Investwise Support',
        url: 'https://citibankdemobusinessinc.com/support',
        email: 'support@citibankdemobusinessinc.com',
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
      },
    },
    servers: [
      {
        url: 'https://investwise.citibankdemobusinessinc.com',
        description: 'Production server for Investwise',
      },
    ],
    tags: [
      {
        name: 'Portfolio Management',
        description: 'Endpoints for managing investment portfolios',
      },
      {
        name: 'Investment Advice',
        description: 'Endpoints for generating investment recommendations',
      },
    ],
    paths: {
      '/portfolio/create': {
        post: {
          summary: 'Create Investment Portfolio',
          operationId: 'createPortfolio',
          tags: ['Portfolio Management'],
          description: 'Creates a new investment portfolio based on user preferences and risk profile.',
          requestBody: {
            description: 'Portfolio creation details',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PortfolioCreationRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Portfolio created successfully.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PortfolioResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Invalid portfolio data.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
          'x-mission-statement': 'To democratize investment management through AI-driven personalization and automation.',
          'x-monetization-path': 'Charging management fees on assets under management.',
          'x-ip-moat': 'Proprietary AI algorithms for portfolio optimization and risk management.',
          'x-auto-scaling': 'AWS Lambda and ECS for scalable portfolio management services.',
          'x-regulatory-alignment': 'Compliance with investment advisory regulations.',
          'x-supervisory-response': 'Automated reporting to regulatory bodies.',
          'x-risk-detection': 'Real-time monitoring for market manipulation and fraud.',
          'x-material-risk-evaluation': 'Assessment of macroeconomic factors affecting portfolio performance.',
          'x-liquidity-monitoring': 'Continuous monitoring of portfolio liquidity.',
          'x-internal-governance': 'Internal policies and procedures for investment decisions.',
          'x-compliance-automation': 'Automated compliance checks for investment strategies.',
          'x-embedded-audit': 'Regular audits of portfolio management processes.',
        },
      },
      '/advice/generate': {
        post: {
          summary: 'Generate Investment Advice',
          operationId: 'generateInvestmentAdvice',
          tags: ['Investment Advice'],
          description: 'Generates personalized investment recommendations based on user profile and market conditions.',
          requestBody: {
            description: 'User profile and market data',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/InvestmentAdviceRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Investment advice generated successfully.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/InvestmentAdviceResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Invalid request data.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
          'x-mission-statement': 'To provide accessible and personalized investment advice using advanced AI technologies.',
          'x-monetization-path': 'Subscription fees for premium investment advice services.',
          'x-ip-moat': 'Patented AI algorithms for investment recommendation.',
          'x-auto-scaling': 'Serverless architecture for scaling investment advice computations.',
          'x-regulatory-alignment': 'Compliance with investment advice regulations.',
          'x-supervisory-response': 'Automated reporting of investment advice methodologies.',
          'x-risk-detection': 'Monitoring for biases in investment advice algorithms.',
          'x-material-risk-evaluation': 'Incorporating macroeconomic data into investment models.',
          'x-liquidity-monitoring': 'Assessing the impact of investment decisions on liquidity.',
          'x-internal-governance': 'Governance framework for AI model development and validation.',
          'x-compliance-automation': 'Automated validation of investment advice models.',
          'x-embedded-audit': 'Regular audits of investment advice processes.',
        },
      },
    },
    components: {
      schemas: {
        PortfolioCreationRequest: {
          type: 'object',
          required: [
            'userId',
            'riskTolerance',
            'investmentHorizon',
            'investmentAmount',
          ],
          properties: {
            userId: {
              type: 'string',
              description: 'Unique identifier for the user',
            },
            riskTolerance: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Risk tolerance of the investor',
            },
            investmentHorizon: {
              type: 'string',
              enum: ['short', 'medium', 'long'],
              description: 'Investment horizon of the investor',
            },
            investmentAmount: {
              type: 'number',
              format: 'float',
              description: 'Amount to be invested',
            },
          },
        },
        PortfolioResponse: {
          type: 'object',
          properties: {
            portfolioId: {
              type: 'string',
              description: 'Unique identifier for the portfolio',
            },
            assets: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'List of assets in the portfolio',
            },
            allocation: {
              type: 'object',
              description: 'Asset allocation percentages',
            },
          },
        },
        InvestmentAdviceRequest: {
          type: 'object',
          required: ['userId', 'investmentGoal', 'riskTolerance'],
          properties: {
            userId: {
              type: 'string',
              description: 'Unique identifier for the user',
            },
            investmentGoal: {
              type: 'string',
              description: 'Investment goal of the user',
            },
            riskTolerance: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Risk tolerance of the investor',
            },
          },
        },
        InvestmentAdviceResponse: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'List of investment recommendations',
            },
            rationale: {
              type: 'string',
              description: 'Rationale for the investment recommendations',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              format: 'int32',
              description: 'Error code',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
      securitySche