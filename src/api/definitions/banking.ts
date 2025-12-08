import { OpenAPIObject, SchemaObject, SecuritySchemeObject } from 'openapi3-ts/oas31';

// --- Reusable Schemas ---

const ErrorSchema: SchemaObject = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      description: 'An application-specific error code.',
    },
    message: {
      type: 'string',
      description: 'A human-readable message providing more details about the error.',
    },
    target: {
      type: 'string',
      description: 'The target of the error (e.g., the name of the invalid field).',
      nullable: true,
    },
  },
  required: ['code', 'message'],
};

const BalanceSchema: SchemaObject = {
  type: 'object',
  properties: {
    amount: {
      type: 'number',
      format: 'double',
      description: 'The amount of money in the account.',
    },
    currency: {
      type: 'string',
      description: 'The ISO 4217 currency code.',
      example: 'USD',
    },
    lastUpdated: {
      type: 'string',
      format: 'date-time',
      description: 'The date and time the balance was last updated.',
    },
  },
  required: ['amount', 'currency', 'lastUpdated'],
};

const AccountSchema: SchemaObject = {
  type: 'object',
  properties: {
    accountId: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the account.',
    },
    accountType: {
      type: 'string',
      enum: ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'LOAN'],
      description: 'The type of the account.',
    },
    accountNumberMask: {
      type: 'string',
      description: 'The last few digits of the account number.',
      example: 'XXXX-XXXX-XXXX-1234',
    },
    displayName: {
      type: 'string',
      description: 'A user-friendly name for the account.',
      example: 'My Primary Checking',
    },
    balance: {
      $ref: '#/components/schemas/Balance',
    },
    status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE', 'CLOSED'],
        description: 'The status of the account.'
    }
  },
  required: ['accountId', 'accountType', 'accountNumberMask', 'displayName', 'balance', 'status'],
};

const TransactionSchema: SchemaObject = {
  type: 'object',
  properties: {
    transactionId: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the transaction.',
    },
    accountId: {
      type: 'string',
      format: 'uuid',
      description: 'The account this transaction belongs to.',
    },
    amount: {
      type: 'number',
      format: 'double',
      description: 'The transaction amount. Positive for credits, negative for debits.',
    },
    currency: {
      type: 'string',
      description: 'The ISO 4217 currency code.',
      example: 'USD',
    },
    description: {
      type: 'string',
      description: 'A description of the transaction.',
      example: 'Starbucks Coffee',
    },
    category: {
      type: 'string',
      description: 'The category of the transaction.',
      example: 'Food & Drink',
    },
    transactionDate: {
      type: 'string',
      format: 'date',
      description: 'The date the transaction occurred.',
    },
    postedDate: {
      type: 'string',
      format: 'date',
      description: 'The date the transaction was posted to the account.',
    },
    status: {
      type: 'string',
      enum: ['PENDING', 'POSTED', 'CANCELLED'],
      description: 'The status of the transaction.',
    },
  },
  required: ['transactionId', 'accountId', 'amount', 'currency', 'description', 'transactionDate', 'status'],
};

const TransferRequestSchema: SchemaObject = {
    type: 'object',
    properties: {
        fromAccountId: {
            type: 'string',
            format: 'uuid',
            description: 'The ID of the account to transfer from.'
        },
        toAccountId: {
            type: 'string',
            format: 'uuid',
            description: 'The ID of the account to transfer to.'
        },
        amount: {
            type: 'number',
            format: 'double',
            description: 'The amount to transfer.'
        },
        currency: {
            type: 'string',
            description: 'The ISO 4217 currency code.',
            example: 'USD'
        },
        memo: {
            type: 'string',
            description: 'A memo for the transfer.',
            nullable: true
        }
    },
    required: ['fromAccountId', 'toAccountId', 'amount', 'currency']
};

const TransferResponseSchema: SchemaObject = {
    type: 'object',
    properties: {
        transferId: {
            type: 'string',
            format: 'uuid',
            description: 'The unique identifier for the transfer.'
        },
        status: {
            type: 'string',
            enum: ['SUBMITTED', 'PROCESSING', 'COMPLETED', 'FAILED'],
            description: 'The status of the transfer.'
        },
        submittedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the transfer was submitted.'
        }
    },
    required: ['transferId', 'status', 'submittedAt']
};


// --- Reusable Components ---

const components = {
  schemas: {
    Account: AccountSchema,
    Balance: BalanceSchema,
    Transaction: TransactionSchema,
    TransferRequest: TransferRequestSchema,
    TransferResponse: TransferResponseSchema,
    Error: ErrorSchema,
  },
  parameters: {
    AccountId: {
      name: 'accountId',
      in: 'path',
      required: true,
      description: 'The unique identifier of the bank account.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  },
  responses: {
    BadRequest: {
      description: 'Bad Request - The server could not understand the request due to invalid syntax.',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    Unauthorized: {
      description: 'Unauthorized - The client must authenticate itself to get the requested response.',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    NotFound: {
      description: 'Not Found - The server can not find the requested resource.',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    InternalServerError: {
        description: 'Internal Server Error - The server has encountered a situation it does not know how to handle.',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
            },
        },
    }
  },
  securitySchemes: {
    // As per project requirements, primary auth is Google OAuth 2.0
    GoogleOAuth2: {
      type: 'oauth2',
      description: 'Authentication using Google OAuth 2.0 for user consent and access.',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token',
          scopes: {
            'https://www.googleapis.com/auth/drive.file': 'Access to Google Drive for saving files.',
            'openid': 'Basic profile information.',
            'email': 'User\'s email address.',
            'profile': 'User\'s profile information.',
            // Placeholder for bank-specific scopes
            'https://api.examplebank.com/accounts.read': 'Read access to bank accounts.',
            'https://api.examplebank.com/transactions.read': 'Read access to transactions.',
            'https://api.examplebank.com/transfers.write': 'Permission to initiate transfers.',
          },
        },
      },
    } as SecuritySchemeObject, // Cast to ensure type correctness for complex objects
    ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
        description: 'API Key for server-to-server authentication or partner integrations.'
    }
  },
};

// --- Paths (API Endpoints) ---

const paths = {
  '/accounts': {
    get: {
      summary: 'List Accounts',
      description: 'Retrieves a list of all bank accounts associated with the authenticated user.',
      operationId: 'listAccounts',
      tags: ['Accounts'],
      security: [{ GoogleOAuth2: ['https://api.examplebank.com/accounts.read'] }],
      responses: {
        '200': {
          description: 'A list of bank accounts.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Account',
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '500': { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },
  '/accounts/{accountId}': {
    get: {
      summary: 'Get Account Details',
      description: 'Retrieves detailed information for a specific bank account.',
      operationId: 'getAccountById',
      tags: ['Accounts'],
      parameters: [{ $ref: '#/components/parameters/AccountId' }],
      security: [{ GoogleOAuth2: ['https://api.examplebank.com/accounts.read'] }],
      responses: {
        '200': {
          description: 'Detailed information for the specified account.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Account' },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
        '500': { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },
  '/accounts/{accountId}/transactions': {
    get: {
      summary: 'List Transactions',
      description: 'Retrieves a list of transactions for a specific bank account.',
      operationId: 'getTransactionsForAccount',
      tags: ['Transactions'],
      parameters: [
        { $ref: '#/components/parameters/AccountId' },
        {
          name: 'startDate',
          in: 'query',
          schema: { type: 'string', format: 'date' },
          description: 'The start date for the transaction query (YYYY-MM-DD).',
        },
        {
          name: 'endDate',
          in: 'query',
          schema: { type: 'string', format: 'date' },
          description: 'The end date for the transaction query (YYYY-MM-DD).',
        },
        {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 100 },
            description: 'The maximum number of transactions to return.'
        }
      ],
      security: [{ GoogleOAuth2: ['https://api.examplebank.com/transactions.read'] }],
      // Example of custom extensions for pre/post scripts and integrations
      'x-pre-script': 'console.log("Fetching transactions for account:", params.accountId);',
      'x-post-script': 'if (response.status === 200) { console.log(`Retrieved ${response.body.length} transactions.`); }',
      'x-integrations': {
          'google-drive': {
              action: 'save-as-csv',
              description: 'Saves the retrieved transactions as a CSV file to the user\'s Google Drive.',
              enabled: true,
              requiresScope: 'https://www.googleapis.com/auth/drive.file'
          },
          'github': {
              action: 'commit-data',
              description: 'Commits the transaction data to a specified repository for analysis.',
              enabled: false,
          }
      },
      responses: {
        '200': {
          description: 'A list of transactions for the specified account.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Transaction',
                },
              },
            },
          },
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
        '500': { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },
  '/transfers': {
    post: {
        summary: 'Initiate a Transfer',
        description: 'Initiates a money transfer between two accounts owned by the user.',
        operationId: 'createTransfer',
        tags: ['Transfers'],
        security: [{ GoogleOAuth2: ['https://api.examplebank.com/transfers.write'] }],
        requestBody: {
            description: 'Transfer details',
            required: true,
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/TransferRequest'
                    }
                }
            }
        },
        responses: {
            '202': {
                description: 'Transfer accepted for processing.',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/TransferResponse'
                        }
                    }
                }
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalServerError' },
        }
    }
  }
};

// --- Webhooks for async operations ---
const webhooks = {
    newTransaction: {
        post: {
            summary: 'New Transaction Webhook',
            description: 'A webhook event that fires whenever a new transaction is posted to any of the user\'s accounts.',
            operationId: 'onNewTransaction',
            requestBody: {
                description: 'New transaction payload',
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Transaction'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Webhook received successfully.'
                }
            }
        }
    },
    transferStatusUpdate: {
        post: {
            summary: 'Transfer Status Update Webhook',
            description: 'A webhook event that fires when the status of a transfer changes (e.g., from PROCESSING to COMPLETED).',
            operationId: 'onTransferStatusUpdate',
            requestBody: {
                description: 'Updated transfer payload',
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/TransferResponse'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Webhook received successfully.'
                }
            }
        }
    }
};

// --- Base Banking API Definition ---

const BaseBankingAPIDefinition: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Generic Banking API',
    version: '1.0.0',
    description: 'A standardized OpenAPI 3.1.0 definition for common banking operations, designed for aggregation and extensibility.',
    contact: {
      name: 'API Support',
      url: 'https://support.example.com',
      email: 'support@example.com',
    },
    license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
    }
  },
  tags: [
    { name: 'Accounts', description: 'Operations related to bank accounts.' },
    { name: 'Transactions', description: 'Operations related to account transactions.' },
    { name: 'Transfers', description: 'Operations related to money transfers.' },
  ],
  paths,
  components,
  webhooks,
  security: [
    { GoogleOAuth2: [] }
  ],
  // Example of a custom extension for defining workflows
  'x-workflows': [
    {
        workflowId: 'transaction-categorization-and-save',
        description: 'When a new transaction webhook is received, categorize it using an AI service, and then save the enriched data to Google Drive.',
        trigger: {
            type: 'webhook',
            operationId: 'onNewTransaction'
        },
        steps: [
            {
                stepId: 'categorize-transaction',
                description: 'Call an external categorization API.',
                service: 'internal-ai-service',
                operation: 'categorizeTransaction',
                inputs: {
                    description: '$trigger.body.description',
                    amount: '$trigger.body.amount'
                }
            },
            {
                stepId: 'save-to-drive',
                description: 'Use the Google Drive integration to save the result.',
                service: 'google-drive-api',
                operation: 'uploadFile',
                inputs: {
                    fileName: '`transaction-${$trigger.body.transactionId}.json`',
                    content: {
                        ...'$trigger.body',
                        'customCategory': '$steps.categorize-transaction.outputs.category'
                    }
                }
            }
        ]
    }
  ]
};

// --- Bank-Specific Definitions (Extending the Base) ---

const ChaseAPIDefinition: OpenAPIObject = {
    ...BaseBankingAPIDefinition,
    info: {
        ...BaseBankingAPIDefinition.info,
        title: 'Chase Bank API (Conceptual)',
        'x-logo': {
            url: 'https://www.chase.com/etc/designs/chase-ux/css/img/new-logo.svg',
            altText: 'Chase Bank Logo'
        }
    },
    servers: [
        {
            url: 'https://api.chase.com/v1',
            description: 'Production Server'
        }
    ]
};

const PlaidAPIDefinition: OpenAPIObject = {
    ...BaseBankingAPIDefinition,
    info: {
        ...BaseBankingAPIDefinition.info,
        title: 'Plaid API (Conceptual)',
        description: 'A conceptual OpenAPI definition for Plaid, which aggregates multiple banking APIs.',
        'x-logo': {
            url: 'https://cdn.plaid.com/brand/logo-name.svg',
            altText: 'Plaid Logo'
        }
    },
    servers: [
        {
            url: 'https://production.plaid.com',
            description: 'Production Server'
        },
        {
            url: 'https://sandbox.plaid.com',
            description: 'Sandbox Server'
        }
    ]
};

// --- Exported Definitions ---

export const bankingApiDefinitions: { [key: string]: OpenAPIObject } = {
  base: BaseBankingAPIDefinition,
  chase: ChaseAPIDefinition,
  plaid: PlaidAPIDefinition,
  // Add other banks like Wells Fargo, Citi, etc. here
};