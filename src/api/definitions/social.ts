import { OpenAPI } from 'openapi-types';

// Common components that can be shared or referenced across different social APIs
const commonComponents: OpenAPI.V31.ComponentsObject = {
  securitySchemes: {
    // This scheme represents the overall authentication flow for the project.
    // The user logs in with Google, and our backend exchanges that for an API-specific token.
    // The client-side flow would use this to initiate the login.
    googleOAuth2: {
      type: 'oauth2',
      description: 'Authentication via Google Login, which then grants access to the social media API.',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token', // This would likely be our own backend endpoint that handles the token exchange
          scopes: {
            'openid': 'Read basic profile information.',
            'email': 'Read user\'s email address.',
            'profile': 'Read user\'s profile data.',
            'https://www.googleapis.com/auth/drive.file': 'Access to Google Drive for file storage.',
          },
        },
      },
    },
    // This represents the actual token used to authenticate with the target social media API.
    apiBearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT', // Or could be an opaque token depending on the API
      description: 'Bearer token for the specific social media API (e.g., Twitter, LinkedIn).',
    },
  },
  responses: {
    UnauthorizedError: {
      description: 'Authentication information is missing or invalid.',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    NotFoundError: {
      description: 'The requested resource was not found.',
    },
    RateLimitError: {
        description: 'Rate limit exceeded.',
    }
  },
};

// --- Twitter (X) API Definition ---
export const twitterApiDefinition: OpenAPI.V31.Document = {
  openapi: '3.1.0',
  info: {
    title: 'Twitter (X) API',
    version: '2.0',
    description: 'OpenAPI definition for interacting with the Twitter v2 API, integrated with project-specific workflows.',
    contact: {
      name: 'Twitter API Support',
      url: 'https://developer.twitter.com/en/docs/twitter-api',
    },
  },
  servers: [
    {
      url: 'https://api.twitter.com',
      description: 'Production Twitter API Server',
    },
  ],
  security: [
    {
      apiBearerAuth: [], // All endpoints require the API-specific bearer token.
    },
  ],
  tags: [
    { name: 'Tweets', description: 'Operations related to creating and managing Tweets.' },
    { name: 'Users', description: 'Operations related to user profiles.' },
  ],
  paths: {
    '/2/tweets': {
      post: {
        tags: ['Tweets'],
        summary: 'Create a Tweet',
        description: 'Creates a new Tweet on behalf of the authenticated user.',
        operationId: 'createTweet',
        'x-workflow-id': 'social-post-flow',
        'x-pre-script': 'scripts/twitter/pre_create_tweet.js',
        'x-post-script': 'scripts/twitter/post_create_tweet.js',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateTweetRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Tweet created successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Tweet',
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { description: 'Forbidden - you do not have the required permissions.' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
    '/2/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get Authenticated User',
        description: 'Retrieves detailed information about the authenticated user.',
        operationId: 'getMe',
        parameters: [
            {
                name: 'user.fields',
                in: 'query',
                description: 'A comma separated list of User fields to display.',
                schema: {
                    type: 'string',
                    example: 'created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld'
                }
            }
        ],
        responses: {
          '200': {
            description: 'Successful response with user data.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
  },
  components: {
    ...commonComponents,
    schemas: {
      CreateTweetRequest: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The content of the Tweet.',
            maxLength: 280,
          },
          media: {
            type: 'object',
            properties: {
                media_ids: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: 'A list of media IDs to associate with the Tweet.'
                }
            }
          }
        },
        required: ['text'],
      },
      Tweet: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                text: { type: 'string' },
            }
          }
        },
      },
      User: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                username: { type: 'string' },
            }
          }
        },
      },
    },
  },
};

// --- LinkedIn API Definition ---
export const linkedInApiDefinition: OpenAPI.V31.Document = {
    openapi: '3.1.0',
    info: {
      title: 'LinkedIn API',
      version: '2.0',
      description: 'OpenAPI definition for the LinkedIn API, focusing on content sharing and user profiles.',
      contact: {
        name: 'LinkedIn Developer Support',
        url: 'https://developer.linkedin.com/',
      },
    },
    servers: [
      {
        url: 'https://api.linkedin.com',
        description: 'Production LinkedIn API Server',
      },
    ],
    security: [
      {
        apiBearerAuth: [],
      },
    ],
    tags: [
      { name: 'Posts', description: 'Operations for sharing content on LinkedIn.' },
      { name: 'Profiles', description: 'Operations for retrieving user profile information.' },
    ],
    paths: {
      '/v2/ugcPosts': {
        post: {
          tags: ['Posts'],
          summary: 'Create a Share (UGC Post)',
          description: 'Creates a new user-generated content post on behalf of the authenticated user.',
          operationId: 'createLinkedInPost',
          'x-workflow-id': 'social-post-flow',
          'x-pre-script': 'scripts/linkedin/pre_create_post.js',
          'x-post-script': 'scripts/linkedin/post_create_post.js',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UgcPostRequest',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Post created successfully.',
              headers: {
                'x-linkedin-id': {
                    description: 'The URN of the newly created post.',
                    schema: { type: 'string' }
                }
              }
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '429': { $ref: '#/components/responses/RateLimitError' },
          },
        },
      },
      '/v2/me': {
        get: {
          tags: ['Profiles'],
          summary: 'Get Authenticated User Profile',
          description: 'Retrieves the profile of the currently authenticated user.',
          operationId: 'getLinkedInMe',
          responses: {
            '200': {
              description: 'Successful response with user profile data.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/LinkedInProfile',
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
    },
    components: {
      ...commonComponents,
      schemas: {
        UgcPostRequest: {
          type: 'object',
          properties: {
            author: {
              type: 'string',
              description: 'The URN of the authoring user or organization. e.g., "urn:li:person:12345"',
            },
            lifecycleState: {
              type: 'string',
              enum: ['PUBLISHED', 'DRAFT'],
              default: 'PUBLISHED',
            },
            specificContent: {
              type: 'object',
              properties: {
                'com.linkedin.ugc.ShareContent': {
                  type: 'object',
                  properties: {
                    shareCommentary: {
                      type: 'object',
                      properties: {
                        text: { type: 'string', description: 'The main text of the post.' },
                      },
                      required: ['text'],
                    },
                    shareMediaCategory: {
                      type: 'string',
                      enum: ['NONE', 'ARTICLE', 'IMAGE'],
                      default: 'NONE',
                    },
                  },
                  required: ['shareCommentary'],
                },
              },
            },
            visibility: {
              type: 'object',
              properties: {
                'com.linkedin.ugc.MemberNetworkVisibility': {
                  type: 'string',
                  enum: ['PUBLIC', 'CONNECTIONS'],
                  default: 'PUBLIC',
                },
              },
            },
          },
          required: ['author', 'lifecycleState', 'specificContent', 'visibility'],
        },
        LinkedInProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'The unique member ID.' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            profilePicture: {
              type: 'object',
              properties: {
                'displayImage': { type: 'string', description: 'URL to the profile picture.' }
              }
            }
          },
        },
      },
    },
  };

// --- Meta (Facebook/Instagram) API Definition ---
export const metaApiDefinition: OpenAPI.V31.Document = {
    openapi: '3.1.0',
    info: {
      title: 'Meta Graph API',
      version: 'v18.0',
      description: 'OpenAPI definition for the Meta Graph API, covering Facebook Pages and Instagram.',
      contact: {
        name: 'Meta for Developers',
        url: 'https://developers.facebook.com/docs/graph-api',
      },
    },
    servers: [
      {
        url: 'https://graph.facebook.com/{apiVersion}',
        description: 'Production Meta Graph API Server',
        variables: {
            apiVersion: {
                default: 'v18.0',
                description: 'The version of the Graph API to use.'
            }
        }
      },
    ],
    security: [
      {
        apiBearerAuth: [],
      },
    ],
    tags: [
      { name: 'Facebook Pages', description: 'Manage content on Facebook Pages.' },
      { name: 'Users', description: 'Retrieve user information.' },
    ],
    paths: {
      '/{page-id}/feed': {
        post: {
          tags: ['Facebook Pages'],
          summary: 'Create a Page Post',
          description: 'Publishes a new post to a specific Facebook Page.',
          operationId: 'createFacebookPagePost',
          'x-workflow-id': 'social-post-flow',
          parameters: [
            {
              name: 'page-id',
              in: 'path',
              required: true,
              description: 'The ID of the Facebook Page.',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      description: 'The main text of the post.',
                    },
                    link: {
                        type: 'string',
                        format: 'uri',
                        description: 'A URL to be shared in the post.'
                    },
                    access_token: {
                        type: 'string',
                        description: 'The Page access token.'
                    }
                  },
                  required: ['message', 'access_token'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Post created successfully.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', description: 'The ID of the new post, in the format page-id_post-id.' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/me': {
        get: {
          tags: ['Users'],
          summary: 'Get User Profile',
          description: 'Retrieves the profile of the user who granted the access token.',
          operationId: 'getMetaMe',
          parameters: [
            {
                name: 'fields',
                in: 'query',
                schema: { type: 'string' },
                description: 'A comma-separated list of fields to retrieve for the user.',
                example: 'id,name,email'
            },
            {
                name: 'access_token',
                in: 'query',
                required: true,
                schema: { type: 'string' },
                description: 'The user access token.'
            }
          ],
          responses: {
            '200': {
              description: 'Successful response with user data.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/MetaUser',
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
    },
    components: {
      ...commonComponents,
      schemas: {
        MetaUser: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
      },
    },
  };

// --- TikTok API Definition ---
export const tikTokApiDefinition: OpenAPI.V31.Document = {
    openapi: '3.1.0',
    info: {
      title: 'TikTok API',
      version: 'v2',
      description: 'OpenAPI definition for the TikTok API Kit.',
      contact: {
        name: 'TikTok for Developers',
        url: 'https://developers.tiktok.com/',
      },
    },
    servers: [
      {
        url: 'https://open.tiktokapis.com',
        description: 'Production TikTok API Server',
      },
    ],
    security: [
      {
        apiBearerAuth: [],
      },
    ],
    tags: [
      { name: 'Video', description: 'Operations for managing and uploading videos.' },
      { name: 'User', description: 'Operations for retrieving user information.' },
    ],
    paths: {
      '/v2/video/upload/': {
        post: {
          tags: ['Video'],
          summary: 'Upload a Video',
          description: 'Initiates the video upload process to TikTok. This is a direct post method.',
          operationId: 'uploadTikTokVideo',
          'x-workflow-id': 'video-upload-flow',
          'x-github-action': 'tiktok-video-processor',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    video: {
                      type: 'string',
                      format: 'binary',
                      description: 'The video file to upload.',
                    },
                    // Note: TikTok's direct post requires more complex chunking logic
                    // not easily represented here. This is a simplified representation.
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Video upload initiated.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TikTokUploadResponse',
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/v2/user/info/': {
        get: {
          tags: ['User'],
          summary: 'Get User Information',
          description: 'Retrieves information for the authenticated user.',
          operationId: 'getTikTokUser',
          parameters: [
            {
              name: 'fields',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'A comma-separated list of fields to retrieve.',
              example: 'open_id,union_id,avatar_url,display_name,profile_deep_link'
            },
          ],
          responses: {
            '200': {
              description: 'Successful response with user data.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TikTokUserResponse',
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
    },
    components: {
      ...commonComponents,
      schemas: {
        TikTokUploadResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                share_id: { type: 'string', description: 'ID for the uploaded content.' }
              }
            },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                log_id: { type: 'string' },
              }
            }
          }
        },
        TikTokUserResponse: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                    user: {
                        type: 'object',
                        properties: {
                            open_id: { type: 'string' },
                            union_id: { type: 'string' },
                            avatar_url: { type: 'string', format: 'uri' },
                            display_name: { type: 'string' },
                        }
                    }
                }
              },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  log_id: { type: 'string' },
                }
              }
            }
          },
      },
    },
  };