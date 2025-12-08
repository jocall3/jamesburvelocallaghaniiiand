import { OpenAPI } from 'openapi-types';

/**
 * Common security scheme for Google OAuth 2.0 as requested by the project goals.
 * This scheme is intended to be the single point of authentication for all integrated APIs.
 */
const googleOauth2SecurityScheme: OpenAPI.V31.SecuritySchemeObject = {
  type: 'oauth2',
  description: 'Authentication using Google OAuth 2.0. This single authentication method is used to gain access to all integrated cloud provider APIs, Google Drive, and GitHub, potentially through identity federation.',
  flows: {
    authorizationCode: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: {
        // Scopes for Google Services
        'https://www.googleapis.com/auth/userinfo.email': 'Read your email address',
        'https://www.googleapis.com/auth/userinfo.profile': 'See your personal info, including any personal info you\'ve made publicly available',
        'https://www.googleapis.com/auth/drive': 'See, edit, create, and delete all of your Google Drive files',
        
        // Scopes for Cloud Providers (assuming federation or direct integration)
        'https://www.googleapis.com/auth/cloud-platform': 'Manage your Google Cloud Platform resources',
        
        // Custom scopes representing access to other platforms
        'api://aws/full_access': 'Full access to AWS resources via federated identity',
        'api://azure/full_access': 'Full access to Azure resources via federated identity',
        'api://digitalocean/full_access': 'Full access to DigitalOcean resources via federated identity',
        'repo': 'Full control of private repositories (for GitHub integration)',
      },
    },
  },
};

/**
 * Common components shared across all API definitions, including security schemes,
 * standard error responses, and schemas for integrated services like Google Drive.
 */
const commonComponents: OpenAPI.V31.ComponentsObject = {
  securitySchemes: {
    googleOAuth2: googleOauth2SecurityScheme,
  },
  schemas: {
    Error: {
      type: 'object',
      properties: {
        code: {
          type: 'integer',
          format: 'int32',
          description: 'A service-specific error code.',
        },
        message: {
          type: 'string',
          description: 'A human-readable error message.',
        },
        requestId: {
            type: 'string',
            description: 'The unique ID for this request, useful for tracing.'
        }
      },
      required: ['code', 'message'],
    },
    GoogleDriveFileLink: {
        type: 'object',
        description: 'A reference to a file stored in Google Drive, used for saving outputs.',
        properties: {
            fileId: {
                type: 'string',
                description: 'The unique ID of the file in Google Drive.',
                example: '1a2b3c4d5e6f7g8h9i0j'
            },
            fileName: {
                type: 'string',
                description: 'The name of the file.',
                example: 'project-output.zip'
            },
            mimeType: {
                type: 'string',
                example: 'application/zip'
            },
            webViewLink: {
                type: 'string',
                format: 'uri',
                description: 'A direct link to view the file in the browser.'
            }
        },
        required: ['fileId', 'fileName', 'webViewLink']
    }
  },
  responses: {
    UnauthorizedError: {
      description: 'Authentication information is missing or invalid. The OAuth2 token may be expired or lack the required scopes.',
      headers: {
        'WWW-Authenticate': {
          schema: {
            type: 'string',
          },
        },
      },
    },
    NotFoundError: {
      description: 'The specified resource was not found.',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error',
          },
        },
      },
    },
    GenericError: {
        description: 'An unexpected server-side error occurred.',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/Error'
                }
            }
        }
    }
  },
};

// --- AWS OpenAPI Definition ---
const awsApiDefinition: OpenAPI.V31.Document = {
  openapi: '3.1.0',
  info: {
    title: 'AWS API',
    version: '2023-11-01',
    description: 'An illustrative OpenAPI definition for key AWS services, integrated with project-specific workflows and Google OAuth for authentication.',
  },
  servers: [
    {
      url: 'https://s3.{region}.amazonaws.com',
      variables: {
        region: {
          default: 'us-east-1',
          description: 'AWS Region for the S3 service.',
          enum: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
        },
      },
    },
  ],
  security: [
    {
      googleOAuth2: ['api://aws/full_access'],
    },
  ],
  components: {
    ...commonComponents,
    schemas: {
        ...commonComponents.schemas,
        S3Bucket: {
            type: 'object',
            properties: {
                Name: { type: 'string' },
                CreationDate: { type: 'string', format: 'date-time' }
            }
        },
        ListBucketsResponse: {
            type: 'object',
            properties: {
                Buckets: {
                    type: 'object',
                    properties: {
                        Bucket: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/S3Bucket'
                            }
                        }
                    }
                },
                Owner: {
                    type: 'object',
                    properties: {
                        DisplayName: { type: 'string' },
                        ID: { type: 'string' }
                    }
                }
            }
        }
    }
  },
  paths: {
    '/': {
      get: {
        operationId: 'awsListS3Buckets',
        summary: 'List S3 Buckets',
        description: 'Retrieves a list of all S3 buckets owned by the authenticated sender of the request.',
        tags: ['S3'],
        'x-workflow-id': 'aws-s3-list-and-archive',
        'x-pre-script': 'aws_auth_refresh.js',
        'x-post-script': 'archive_to_drive.js',
        responses: {
          '200': {
            description: 'A list of S3 buckets.',
            content: {
              'application/xml': {
                schema: {
                  $ref: '#/components/schemas/ListBucketsResponse'
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/GenericError' }
        }
      }
    }
  }
};

// --- GCP OpenAPI Definition ---
const gcpApiDefinition: OpenAPI.V31.Document = {
    openapi: '3.1.0',
    info: {
        title: 'Google Cloud Platform API',
        version: 'v1',
        description: 'An illustrative OpenAPI definition for key GCP services, using the project\'s central Google OAuth flow.',
    },
    servers: [
        {
            url: 'https://storage.googleapis.com/storage/v1',
        },
    ],
    security: [
        {
            googleOAuth2: ['https://www.googleapis.com/auth/cloud-platform'],
        },
    ],
    components: {
        ...commonComponents,
        schemas: {
            ...commonComponents.schemas,
            GCSBucket: {
                type: 'object',
                properties: {
                    kind: { type: 'string', example: 'storage#bucket' },
                    id: { type: 'string' },
                    name: { type: 'string' },
                    timeCreated: { type: 'string', format: 'date-time' }
                }
            },
            ListBucketsResponse: {
                type: 'object',
                properties: {
                    kind: { type: 'string', example: 'storage#buckets' },
                    items: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/GCSBucket'
                        }
                    }
                }
            }
        }
    },
    paths: {
        '/b': {
            get: {
                operationId: 'gcpListGCSBuckets',
                summary: 'List Cloud Storage Buckets',
                description: 'Retrieves a list of buckets for a given project.',
                tags: ['Cloud Storage'],
                parameters: [
                    {
                        name: 'project',
                        in: 'query',
                        required: true,
                        description: 'A valid GCP project ID.',
                        schema: {
                            type: 'string'
                        }
                    }
                ],
                'x-workflow-id': 'gcp-storage-backup-to-github',
                'x-pre-script': 'gcp_check_project_id.js',
                'x-post-script': 'trigger_github_action.js',
                responses: {
                    '200': {
                        description: 'A list of GCS buckets.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ListBucketsResponse'
                                }
                            }
                        }
                    },
                    '401': { $ref: '#/components/responses/UnauthorizedError' },
                    '500': { $ref: '#/components/responses/GenericError' }
                }
            }
        }
    }
};

// --- Azure OpenAPI Definition ---
const azureApiDefinition: OpenAPI.V31.Document = {
    openapi: '3.1.0',
    info: {
        title: 'Microsoft Azure API',
        version: '2023-11-03',
        description: 'An illustrative OpenAPI definition for Azure services, assuming federated identity via Google OAuth.',
    },
    servers: [
        {
            url: 'https://{storageAccountName}.blob.core.windows.net',
            variables: {
                storageAccountName: {
                    default: 'mystorageaccount',
                    description: 'The name of the Azure Storage account.'
                }
            }
        }
    ],
    security: [
        {
            googleOAuth2: ['api://azure/full_access'],
        },
    ],
    components: {
        ...commonComponents,
        schemas: {
            ...commonComponents.schemas,
            BlobContainer: {
                type: 'object',
                properties: {
                    Name: { type: 'string' },
                    Properties: {
                        type: 'object',
                        properties: {
                            'Last-Modified': { type: 'string', format: 'date-time' },
                            'Etag': { type: 'string' }
                        }
                    }
                }
            },
            ListContainersResponse: {
                type: 'object',
                properties: {
                    EnumerationResults: {
                        type: 'object',
                        properties: {
                            Containers: {
                                type: 'object',
                                properties: {
                                    Container: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/BlobContainer'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    paths: {
        '/': {
            get: {
                operationId: 'azureListBlobContainers',
                summary: 'List Blob Containers',
                description: 'The List Containers operation returns a list of the containers under the specified storage account.',
                tags: ['Blob Storage'],
                parameters: [
                    {
                        name: 'comp',
                        in: 'query',
                        required: true,
                        schema: {
                            type: 'string',
                            enum: ['list']
                        }
                    }
                ],
                'x-workflow-id': 'azure-blob-report-to-drive',
                'x-pre-script': 'azure_check_account.js',
                'x-post-script': 'generate_report_and_save.js',
                responses: {
                    '200': {
                        description: 'An enumeration of containers.',
                        content: {
                            'application/xml': {
                                schema: {
                                    $ref: '#/components/schemas/ListContainersResponse'
                                }
                            }
                        }
                    },
                    '401': { $ref: '#/components/responses/UnauthorizedError' },
                    '500': { $ref: '#/components/responses/GenericError' }
                }
            }
        }
    }
};

// --- DigitalOcean OpenAPI Definition ---
const digitalOceanApiDefinition: OpenAPI.V31.Document = {
    openapi: '3.1.0',
    info: {
        title: 'DigitalOcean API',
        version: 'v2',
        description: 'An illustrative OpenAPI definition for the DigitalOcean API, assuming federated identity via Google OAuth.',
    },
    servers: [
        {
            url: 'https://api.digitalocean.com/v2',
        }
    ],
    security: [
        {
            googleOAuth2: ['api://digitalocean/full_access'],
        },
    ],
    components: {
        ...commonComponents,
        schemas: {
            ...commonComponents.schemas,
            Droplet: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    status: { type: 'string', enum: ['new', 'active', 'off', 'archive'] },
                    created_at: { type: 'string', format: 'date-time' }
                }
            },
            ListDropletsResponse: {
                type: 'object',
                properties: {
                    droplets: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/Droplet'
                        }
                    }
                }
            }
        }
    },
    paths: {
        '/droplets': {
            get: {
                operationId: 'digitalOceanListDroplets',
                summary: 'List All Droplets',
                description: 'To list all Droplets in your account.',
                tags: ['Droplets'],
                'x-workflow-id': 'do-droplet-health-check',
                'x-pre-script': 'do_check_rate_limit.js',
                'x-post-script': 'log_droplet_status.js',
                responses: {
                    '200': {
                        description: 'A list of Droplet objects.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ListDropletsResponse'
                                }
                            }
                        }
                    },
                    '401': { $ref: '#/components/responses/UnauthorizedError' },
                    '500': { $ref: '#/components/responses/GenericError' }
                }
            }
        }
    }
};


/**
 * A collection of OpenAPI 3.1.0 definitions for major cloud providers.
 *
 * These definitions are illustrative and focus on a single, common operation for each provider
 * to demonstrate the structure. They incorporate the project's specific requirements, such as:
 * - Authentication via a single Google OAuth 2.0 flow.
 * - Custom `x-` extensions for pre-scripts, post-scripts, and workflows.
 * - Schemas for interacting with other services like Google Drive.
 *
 * This structure is designed to be extensible to cover the "100s or 1000s" of APIs
 * mentioned in the project goal by adding more paths and schemas under each provider.
 */
export const cloudApiDefinitions: Record<string, OpenAPI.V31.Document> = {
    aws: awsApiDefinition,
    gcp: gcpApiDefinition,
    azure: azureApiDefinition,
    digitalocean: digitalOceanApiDefinition,
};