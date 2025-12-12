import { OpenAPIV3_1 } from 'openapi-types';

/**
 * Common OpenAPI components shared across legal API definitions.
 * This includes standard error responses, a file reference schema for Google Drive integration,
 * and the project-wide Google OAuth 2.0 security scheme.
 */
const commonComponents: OpenAPIV3_1.ComponentsObject = {
  schemas: {
    Error: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'A unique error code for programmatic handling.' },
        message: { type: 'string', description: 'A human-readable error message.' },
        details: { type: 'string', description: 'Detailed information about the error, if available.' },
      },
      required: ['code', 'message'],
      example: {
        code: 'INVALID_INPUT',
        message: 'The provided input was invalid.',
        details: 'Field "name" is required and cannot be empty.'
      }
    },
    FileReference: {
      type: 'object',
      description: 'Reference to a file, potentially stored in Google Drive or another integrated file service.',
      properties: {
        fileId: { type: 'string', description: 'Unique identifier for the file (e.g., Google Drive File ID).' },
        fileName: { type: 'string', description: 'Original name of the file.' },
        mimeType: { type: 'string', description: 'MIME type of the file (e.g., application/pdf, image/jpeg).' },
        downloadUrl: { type: 'string', format: 'uri', description: 'URL to download the file content.' },
        uploadedAt: { type: 'string', format: 'date-time', description: 'Timestamp when the file was uploaded or last updated.' },
        'x-drive-link': { type: 'string', format: 'uri', description: 'Direct link to view the file in Google Drive (custom extension).' },
      },
      required: ['fileId', 'fileName', 'mimeType'],
      example: {
        fileId: '1sB03_X_Y_Z_A_B_C_D_E_F_G_H_I_J_K',
        fileName: 'Legal_Contract_2023.pdf',
        mimeType: 'application/pdf',
        downloadUrl: 'https://drive.google.com/uc?id=1sB03_X_Y_Z_A_B_C_D_E_F_G_H_I_J_K',
        uploadedAt: '2023-10-27T10:00:00Z',
        'x-drive-link': 'https://drive.google.com/file/d/1sB03_X_Y_Z_A_B_C_D_E_F_G_H_I_J_K/view?usp=sharing'
      }
    },
  },
  responses: {
    UnauthorizedError: {
      description: 'Authentication information is missing or invalid. User needs to log in with Google.',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
          examples: {
            unauthorized: {
              value: {
                code: 'UNAUTHORIZED',
                message: 'Invalid or missing authentication token. Please log in with Google.',
              },
            },
          },
        },
      },
    },
    NotFoundError: {
      description: 'The specified resource was not found.',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
          examples: {
            notFound: {
              value: {
                code: 'NOT_FOUND',
                message: 'Resource with the given ID not found.',
              },
            },
          },
        },
      },
    },
    InternalServerError: {
      description: 'An unexpected error occurred on the server.',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
          examples: {
            internalError: {
              value: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred.',
              },
            },
          },
        },
      },
    },
  },
  securitySchemes: {
    googleOAuth: {
      type: 'oauth2',
      description: 'Authentication using Google OAuth 2.0. Requires a Google account login for API access and Drive integration.',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token',
          scopes: {
            'openid': 'Authenticate with Google and get user ID.',
            'email': 'Access your email address.',
            'profile': 'Access your basic profile information.',
            'https://www.googleapis.com/auth/drive.file': 'View and manage Google Drive files and folders that you have opened or created with this app.',
            'https://www.googleapis.com/auth/drive.readonly': 'View files in Google Drive.',
            'https://www.googleapis.com/auth/drive': 'View, edit, create, and delete all of your Google Drive files (full access).',
          },
          // Project-specific extensions for dynamic configuration of OAuth URLs
          'x-authorization-url-param': 'GOOGLE_AUTH_URL', // Environment variable or config key for Authorization URL
          'x-token-url-param': 'GOOGLE_TOKEN_URL',       // Environment variable or config key for Token URL
          'x-auth-redirect-url-param': 'GOOGLE_AUTH_REDIRECT_URL', // Environment variable or config key for OAuth Redirect URL
        },
      },
    },
  },
};

/**
 * Base security requirement applied to all legal APIs, enforcing Google OAuth 2.0.
 * Includes scopes for basic profile info and full Google Drive access.
 */
const baseSecurity: OpenAPIV3_1.SecurityRequirementObject[] = [
  {
    googleOAuth: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/drive', // Full Drive access as per project requirements
    ],
  },
];

/**
 * OpenAPI 3.1.0 definition for the Clio API.
 * Focuses on legal matter and contact management, with integration points for Google Drive.
 */
const clioApi: OpenAPIV3_1.Document = {
  openapi: '3.1.0',
  info: {
    title: 'Clio API',
    version: 'v4',
    description: 'API for managing legal matters, contacts, and activities in Clio. Integrates with Google Drive for document management and leverages project-specific workflows.',
    contact: {
      name: 'Clio Support',
      url: 'https://app.clio.com/api_docs',
      email: 'api@clio.com',
    },
    license: {
      name: 'Proprietary',
      url: 'https://www.clio.com/legal/terms/',
    },
  },
  servers: [
    {
      url: 'https://app.clio.com/api/v4',
      description: 'Clio Production API server',
    },
  ],
  security: baseSecurity,
  tags: [
    { name: 'Matters', description: 'Operations related to legal matters within Clio.' },
    { name: 'Contacts', description: 'Operations related to client and firm contacts in Clio.' },
  ],
  paths: {
    '/matters': {
      get: {
        operationId: 'listMatters',
        summary: 'Retrieve a list of legal matters',
        description: 'Fetches a paginated list of legal matters, with optional filtering by status or other criteria.',
        tags: ['Matters'],
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filter matters by their current status.',
            schema: { type: 'string', enum: ['open', 'closed', 'pending'] },
            required: false,
            example: 'open',
          },
          {
            name: 'per_page',
            in: 'query',
            description: 'Number of matters to return per page.',
            schema: { type: 'integer', format: 'int32', default: 50, minimum: 1, maximum: 200 },
            required: false,
            example: 100,
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number to retrieve.',
            schema: { type: 'integer', format: 'int32', default: 1, minimum: 1 },
            required: false,
            example: 2,
          },
        ],
        responses: {
          '200': {
            description: 'A list of matters.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Matter' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer', example: 1 },
                        per_page: { type: 'integer', example: 50 },
                        total_entries: { type: 'integer', example: 123 },
                      },
                    },
                  },
                  required: ['data', 'meta'],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        'x-workflow-id': 'clio-matter-listing-workflow',
        'x-pre-script': 'clio-validate-matter-access.js',
        'x-after-script': 'clio-log-matter-retrieval.js',
      },
      post: {
        operationId: 'createMatter',
        summary: 'Create a new legal matter',
        description: 'Creates a new legal matter with the provided details, linking it to a client contact.',
        tags: ['Matters'],
        requestBody: {
          description: 'Matter object to be created.',
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MatterInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Matter created successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Matter' },
              },
            },
          },
          '400': {
            description: 'Invalid input provided for matter creation.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        'x-workflow-id': 'clio-matter-creation-workflow',
        'x-pre-script': 'clio-validate-matter-input.js',
        'x-after-script': 'clio-notify-matter-creation.js',
      },
    },
    '/matters/{matterId}': {
      get: {
        operationId: 'getMatterById',
        summary: 'Retrieve a specific legal matter',
        description: 'Fetches details for a single legal matter by its unique ID.',
        tags: ['Matters'],
        parameters: [
          {
            name: 'matterId',
            in: 'path',
            description: 'ID of the matter to retrieve.',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          },
        ],
        responses: {
          '200': {
            description: 'Matter details.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Matter' },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        'x-workflow-id': 'clio-matter-details-workflow',
        'x-pre-script': 'clio-check-matter-permissions.js',
      },
    },
  },
  components: {
    schemas: {
      ...commonComponents.schemas, // Merge common schemas
      Matter: {
        type: 'object',
        description: 'A legal matter in Clio, representing a case or project.',
        properties: {
          id: { type: 'string', format: 'uuid', readOnly: true, description: 'Unique identifier for the matter.', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
          status: { type: 'string', enum: ['open', 'closed', 'pending'], default: 'open', description: 'Current status of the matter.', example: 'open' },
          client: { $ref: '#/components/schemas/Contact', description: 'The primary client associated with this matter.' },
          description: { type: 'string', description: 'A brief description of the matter.', example: 'Representing client in breach of contract dispute.' },
          open_date: { type: 'string', format: 'date', description: 'The date the matter was opened.', example: '2023-01-15' },
          close_date: { type: 'string', format: 'date', nullable: true, description: 'The date the matter was closed, if applicable.', example: null },
          custom_field_values: {
            type: 'object',
            additionalProperties: true,
            description: 'Custom fields associated with the matter, defined by the Clio account.',
            example: { 'case_type': 'Litigation', 'court_jurisdiction': 'State of California' }
          },
          documents: {
            type: 'array',
            items: { $ref: '#/components/schemas/FileReference' },
            description: 'Associated documents for this matter, potentially stored in Google Drive and linked here.',
            readOnly: true,
          },
        },
        required: ['id', 'status', 'client', 'description', 'open_date'],
      },
      MatterInput: {
        type: 'object',
        description: 'Input schema for creating or updating a legal matter.',
        properties: {
          status: { type: 'string', enum: ['open', 'closed', 'pending'], default: 'open', description: 'Initial status of the matter.', example: 'open' },
          client_id: { type: 'string', format: 'uuid', description: 'ID of the client contact to associate with this matter.', example: 'f1e2d3c4-b5a6-9876-5432-10fedcba9876' },
          description: { type: 'string', description: 'Description of the new matter.', example: 'New client onboarding for intellectual property.' },
          open_date: { type: 'string', format: 'date', description: 'The date the matter is being opened.', example: '2023-10-26' },
          close_date: { type: 'string', format: 'date', nullable: true, description: 'Optional close date for the matter.', example: null },
          custom_field_values: {
            type: 'object',
            additionalProperties: true,
            description: 'Custom fields to set for the new matter.',
            example: { 'practice_area': 'IP Law' }
          },
        },
        required: ['client_id', 'description', 'open_date'],
      },
      Contact: {
        type: 'object',
        description: 'A contact (client, lawyer, etc.) in Clio.',
        properties: {
          id: { type: 'string', format: 'uuid', readOnly: true, description: 'Unique identifier for the contact.', example: 'f1e2d3c4-b5a6-9876-5432-10fedcba9876' },
          type: { type: 'string', enum: ['person', 'company'], description: 'Type of contact: person or company.', example: 'person' },
          first_name: { type: 'string', nullable: true, description: 'First name of the contact (if a person).', example: 'John' },
          last_name: { type: 'string', nullable: true, description: 'Last name of the contact (if a person).', example: 'Doe' },
          company_name: { type: 'string', nullable: true, description: 'Company name of the contact (if a company).', example: null },
          email_addresses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid', description: 'ID of the email address entry.' },
                address: { type: 'string', format: 'email', description: 'The email address.' },
                primary: { type: 'boolean', description: 'Indicates if this is the primary email address.' },
              },
              required: ['address', 'primary'],
            },
            example: [{ id: 'e1a2b3c4-d5e6-7890-1234-567890abcdef', address: 'john.doe@example.com', primary: true }]
          },
          phone_numbers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid', description: 'ID of the phone number entry.' },
                number: { type: 'string', description: 'The phone number.' },
                primary: { type: 'boolean', description: 'Indicates if this is the primary phone number.' },
              },
              required: ['number', 'primary'],
            },
            example: [{ id: 'p1q2r3s4-t5u6-7890-1234-567890abcdef', number: '+15551234567', primary: true }]
          },
        },
        required: ['id', 'type'],
        oneOf: [ // A contact must have either a name (first/last) or a company name
          { required: ['first_name', 'last_name'] },
          { required: ['company_name'] },
        ],
      },
    },
    responses: {
      ...commonComponents.responses, // Merge common responses
    },
    securitySchemes: {
      ...commonComponents.securitySchemes, // Merge common security schemes
    },
  },
  webhooks: {
    matterUpdated: {
      post: {
        summary: 'Webhook for matter updates',
        description: 'Receives notifications when a matter is updated in Clio, enabling real-time synchronization or workflow triggers.',
        operationId: 'clioMatterUpdatedWebhook',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  event: { type: 'string', example: 'matter.updated', description: 'The type of event that occurred.' },
                  data: { $ref: '#/components/schemas/Matter', description: 'The updated matter object.' },
                },
                required: ['event', 'data'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Webhook received successfully' },
        },
      },
    },
  },
  externalDocs: {
    description: 'Find more information and detailed documentation about the Clio API.',
    url: 'https://app.clio.com/api_docs',
  },
};

/**
 * OpenAPI 3.1.0 definition for the DocuSign eSignature API.
 * Facilitates creating, sending, and managing electronic signature envelopes,
 * with robust support for documents sourced from Google Drive.
 */
const docusignApi: OpenAPIV3_1.Document = {
  openapi: '3.1.0',
  info: {
    title: 'DocuSign eSignature API',
    version: 'v2.1',
    description: 'API for creating, sending, and managing electronic signature envelopes. Supports document content from Google Drive and integrates with project workflows.',
    contact: {
      name: 'DocuSign Developer Support',
      url: 'https://developers.docusign.com/docs/esign-rest-api/reference/',
      email: 'devsupport@docusign.com',
    },
    license: {
      name: 'DocuSign API License',
      url: 'https://www.docusign.com/legal/terms-of-use',
    },
  },
  servers: [
    {
      url: 'https://{environment}.docusign.net/restapi/v2.1/accounts/{accountId}',
      description: 'DocuSign API server for various environments.',
      variables: {
        environment: {
          default: 'demo',
          enum: ['demo', 'na2', 'eu1', 'au1'],
          description: 'DocuSign environment (e.g., demo for testing, na2 for North America production).',
        },
        accountId: {
          default: 'YOUR_ACCOUNT_ID',
          description: 'Your DocuSign account ID, typically found in your DocuSign developer dashboard.',
        },
      },
    },
  ],
  security: baseSecurity,
  tags: [
    { name: 'Envelopes', description: 'Operations related to signature envelopes, the primary container for documents and signers.' },
    { name: 'Documents', description: 'Operations related to documents within envelopes, including retrieval and management.' },
  ],
  paths: {
    '/envelopes': {
      post: {
        operationId: 'createEnvelope',
        summary: 'Create and send an envelope',
        description: 'Creates a new envelope with specified documents and recipients, then sends it for signing. Documents can be provided as base64 encoded strings or referenced from Google Drive.',
        tags: ['Envelopes'],
        requestBody: {
          description: 'Envelope definition to create.',
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EnvelopeDefinition' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Envelope created and sent successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EnvelopeSummary' },
              },
            },
          },
          '400': {
            description: 'Invalid envelope definition provided.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        'x-workflow-id': 'docusign-document-signing-workflow',
        'x-pre-script': 'docusign-prepare-envelope.js',
        'x-after-script': 'docusign-log-envelope-creation.js',
      },
      get: {
        operationId: 'listEnvelopes',
        summary: 'List envelopes',
        description: 'Retrieves a list of envelopes for the current account, with optional filtering by status.',
        tags: ['Envelopes'],
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filter envelopes by their current status.',
            schema: { type: 'string', enum: ['sent', 'delivered', 'completed', 'voided', 'declined'] },
            required: false,
            example: 'completed',
          },
        ],
        responses: {
          '200': {
            description: 'A list of envelopes.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    envelopes: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/EnvelopeSummary' },
                    },
                  },
                  required: ['envelopes'],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/envelopes/{envelopeId}/documents': {
      get: {
        operationId: 'listEnvelopeDocuments',
        summary: 'List documents in an envelope',
        description: 'Retrieves a list of documents associated with a specific envelope, providing metadata for each.',
        tags: ['Documents'],
        parameters: [
          {
            name: 'envelopeId',
            in: 'path',
            description: 'ID of the envelope to retrieve documents from.',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          },
        ],
        responses: {
          '200': {
            description: 'A list of documents within the specified envelope.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    envelopeDocuments: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/EnvelopeDocument' },
                    },
                  },
                  required: ['envelopeDocuments'],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/envelopes/{envelopeId}/documents/{documentId}': {
      get: {
        operationId: 'downloadEnvelopeDocument',
        summary: 'Download a specific document from an envelope',
        description: 'Downloads the content of a specific document from an envelope. The response can be directly linked to a Google Drive save operation.',
        tags: ['Documents'],
        parameters: [
          {
            name: 'envelopeId',
            in: 'path',
            description: 'ID of the envelope containing the document.',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          },
          {
            name: 'documentId',
            in: 'path',
            description: 'ID of the document to download within the envelope.',
            required: true,
            schema: { type: 'string' },
            example: '1',
          },
        ],
        responses: {
          '200': {
            description: 'Document content (e.g., PDF).',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary', description: 'Binary content of the PDF document.' },
              },
              'application/octet-stream': {
                schema: { type: 'string', format: 'binary', description: 'Generic binary content for other file types.' },
              },
            },
            links: {
              saveToDrive: {
                // This link assumes a global 'saveFileToDrive' operation exists in the overall project
                // which would handle saving binary content to Google Drive.
                operationId: 'saveFileToDrive', // Placeholder for a global operation ID
                parameters: {
                  fileContent: '$response.body',
                  fileName: 'docusign-document-{documentId}.pdf',
                  mimeType: 'application/pdf',
                },
                description: 'Save the downloaded document directly to Google Drive using a global file saving operation.',
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        'x-after-script': 'docusign-archive-document-to-drive.js', // Example of script for Drive integration
      },
    },
  },
  components: {
    schemas: {
      ...commonComponents.schemas, // Merge common schemas
      EnvelopeDefinition: {
        type: 'object',
        description: 'Definition for creating a DocuSign envelope, including documents and recipients.',
        properties: {
          documents: {
            type: 'array',
            items: { $ref: '#/components/schemas/Document' },
            description: 'List of documents to include in the envelope. Each document can be base64 encoded or a Google Drive reference.',
            minItems: 1,
          },
          recipients: {
            type: 'object',
            properties: {
              signers: {
                type: 'array',
                items: { $ref: '#/components/schemas/Signer' },
                description: 'List of signers for the envelope.',
                minItems: 1,
              },
            },
            required: ['signers'],
          },
          status: { type: 'string', enum: ['created', 'sent'], default: 'sent', description: 'Initial status of the envelope. "sent" will send it immediately.', example: 'sent' },
          emailSubject: { type: 'string', default: 'Please sign this document', description: 'Subject line for the email sent to recipients.', example: 'Legal Agreement for Review' },
          emailBlurb: { type: 'string', nullable: true, description: 'Custom message body for the email sent to recipients.', example: 'Please review and sign the attached agreement at your earliest convenience.' },
        },
        required: ['documents', 'recipients', 'status'],
      },
      Document: {
        type: 'object',
        description: 'A document to be included in a DocuSign envelope. Can be provided as base64 content or a reference to a Google Drive file.',
        properties: {
          documentId: { type: 'string', description: 'Unique ID for the document within the envelope (e.g., "1").', example: '1' },
          name: { type: 'string', description: 'Name of the document (e.g., "NDA.pdf").', example: 'NDA.pdf' },
          fileExtension: { type: 'string', description: 'File extension (e.g., "pdf", "docx").', example: 'pdf' },
          documentBase64: { type: 'string', format: 'byte', description: 'Base64 encoded document content. Mutually exclusive with `driveFileReference`.', nullable: true },
          driveFileReference: { $ref: '#/components/schemas/FileReference', description: 'Reference to a file in Google Drive to be used as the document content. Mutually exclusive with `documentBase64`.', nullable: true },
        },
        required: ['documentId', 'name', 'fileExtension'],
        oneOf: [ // Document content must come from either base64 or a Drive reference
          { required: ['documentBase64'] },
          { required: ['driveFileReference'] },
        ],
      },
      Signer: {
        type: 'object',
        description: 'A recipient who needs to sign the document within an envelope.',
        properties: {
          recipientId: { type: 'string', description: 'Unique ID for the recipient within the envelope.', example: '1' },
          name: { type: 'string', description: 'Full name of the signer.', example: 'Jane Doe' },
          email: { type: 'string', format: 'email', description: 'Email address of the signer.', example: 'jane.doe@example.com' },
          routingOrder: { type: 'integer', default: 1, description: 'Order in which the signer receives the envelope.', example: 1 },
          tabs: {
            type: 'object',
            description: 'Defines where signature and other fields should be placed on the document.',
            properties: {
              signHereTabs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    documentId: { type: 'string', description: 'The ID of the document to place the tab on.', example: '1' },
                    pageNumber: { type: 'string', description: 'The page number for the tab (1-based).', example: '1' },
                    xPosition: { type: 'string', description: 'X-coordinate of the tab on the page.', example: '100' },
                    yPosition: { type: 'string', description: 'Y-coordinate of the tab on the page.', example: '100' },
                  },
                  required: ['documentId', 'pageNumber', 'xPosition', 'yPosition'],
                },
                description: 'List of "Sign Here" tabs to place for this signer.',
              },
            },
          },
        },
        required: ['recipientId', 'name', 'email'],
      },
      EnvelopeSummary: {
        type: 'object',
        description: 'Summary information about a DocuSign envelope.',
        properties: {
          envelopeId: { type: 'string', format: 'uuid', readOnly: true, description: 'Unique identifier for the envelope.', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
          status: { type: 'string', readOnly: true, description: 'Current status of the envelope (e.g., "sent", "completed").', example: 'sent' },
          uri: { type: 'string', format: '