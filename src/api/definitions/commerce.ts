import { OpenAPIV3_1 } from 'openapi-types';

// Extended OpenAPI type to support custom vendor extensions requested
export type ExtendedOpenAPIV3_1 = OpenAPIV3_1.Document & {
  'x-pre-script'?: string;
  'x-post-script'?: string;
  'x-workflows'?: Record<string, any>;
  'x-google-auth-config'?: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
  };
};

const googleSecurityScheme: OpenAPIV3_1.SecuritySchemeObject = {
  type: 'oauth2',
  description: 'Google OAuth2 Authentication',
  flows: {
    authorizationCode: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: {
        'openid': 'OpenID Connect',
        'https://www.googleapis.com/auth/userinfo.email': 'Email',
        'https://www.googleapis.com/auth/userinfo.profile': 'Profile',
        'https://www.googleapis.com/auth/drive.file': 'Google Drive File Access'
      }
    }
  }
};

const commonComponents: OpenAPIV3_1.ComponentsObject = {
  securitySchemes: {
    googleAuth: googleSecurityScheme
  },
  schemas: {
    Error: {
      type: 'object',
      properties: {
        code: { type: 'integer' },
        message: { type: 'string' }
      }
    }
  }
};

const commonExtensions = {
  'x-pre-script': `
    console.log("Executing pre-request script...");
    // Logic to validate Google Token
    const token = context.auth.token;
    if (!token) throw new Error("Missing Google Auth Token");
  `,
  'x-post-script': `
    console.log("Executing post-request script...");
    // Logic to save response to Google Drive
    if (response.status === 200) {
      await services.drive.saveFile('api-response.json', JSON.stringify(response.body));
    }
  `,
  'x-workflows': {
    syncInventory: {
      steps: [
        { operationId: 'getProducts', params: {} },
        { operationId: 'updateInventory', params: { source: 'warehouse' } }
      ]
    }
  }
};

/**
 * Shopify Admin API Definition
 */
export const shopifyApi: ExtendedOpenAPIV3_1 = {
  openapi: '3.1.0',
  info: {
    title: 'Shopify Admin API',
    version: '2024-01',
    description: 'Shopify Admin API for managing products, orders, and customers.',
    contact: {
      name: 'Shopify Developer Support',
      url: 'https://shopify.dev'
    }
  },
  servers: [
    {
      url: 'https://{shop_name}.myshopify.com/admin/api/2024-01',
      description: 'Shopify Admin Server',
      variables: {
        shop_name: {
          default: 'demo-store',
          description: 'The name of the user\'s shop'
        }
      }
    }
  ],
  security: [{ googleAuth: [] }],
  ...commonExtensions,
  paths: {
    '/products.json': {
      get: {
        operationId: 'shopifyGetProducts',
        summary: 'Retrieve a list of products',
        responses: {
          '200': {
            description: 'List of products',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          title: { type: 'string' },
                          body_html: { type: 'string' },
                          vendor: { type: 'string' },
                          product_type: { type: 'string' },
                          created_at: { type: 'string', format: 'date-time' }
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
      post: {
        operationId: 'shopifyCreateProduct',
        summary: 'Create a new product',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  product: {
                    type: 'object',
                    required: ['title'],
                    properties: {
                      title: { type: 'string' },
                      body_html: { type: 'string' },
                      vendor: { type: 'string' },
                      product_type: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Product created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Product' }
              }
            }
          }
        }
      }
    },
    '/orders.json': {
      get: {
        operationId: 'shopifyGetOrders',
        summary: 'Retrieve a list of orders',
        responses: {
          '200': {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    orders: { type: 'array', items: { type: 'object' } }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    ...commonComponents,
    schemas: {
      ...commonComponents.schemas,
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' }
        }
      }
    }
  }
};

/**
 * WooCommerce REST API Definition
 */
export const wooCommerceApi: ExtendedOpenAPIV3_1 = {
  openapi: '3.1.0',
  info: {
    title: 'WooCommerce REST API',
    version: 'v3',
    description: 'WooCommerce REST API for WordPress e-commerce.',
  },
  servers: [
    {
      url: '{site_url}/wp-json/wc/v3',
      description: 'WooCommerce API Endpoint',
      variables: {
        site_url: {
          default: 'https://example.com',
          description: 'The base URL of the WordPress site'
        }
      }
    }
  ],
  security: [{ googleAuth: [] }],
  ...commonExtensions,
  paths: {
    '/products': {
      get: {
        operationId: 'wooGetProducts',
        summary: 'List all products',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      slug: { type: 'string' },
                      permalink: { type: 'string' },
                      price: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        operationId: 'wooCreateProduct',
        summary: 'Create a product',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['simple', 'grouped', 'external', 'variable'] },
                  regular_price: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Product created' }
        }
      }
    }
  },
  components: commonComponents
};

/**
 * Magento 2 REST API Definition
 */
export const magentoApi: ExtendedOpenAPIV3_1 = {
  openapi: '3.1.0',
  info: {
    title: 'Magento 2 REST API',
    version: '2.4',
    description: 'Adobe Commerce (Magento) REST API.'
  },
  servers: [
    {
      url: '{store_url}/rest/V1',
      description: 'Magento Store API',
      variables: {
        store_url: {
          default: 'https://magento.test',
          description: 'Base URL of the Magento store'
        }
      }
    }
  ],
  security: [{ googleAuth: [] }],
  ...commonExtensions,
  paths: {
    '/products': {
      get: {
        operationId: 'magentoGetProducts',
        summary: 'Get products list',
        parameters: [
          {
            name: 'searchCriteria',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search criteria for filtering products'
          }
        ],
        responses: {
          '200': {
            description: 'Products list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { type: 'object' } },
                    search_criteria: { type: 'object' },
                    total_count: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/orders/{id}': {
      get: {
        operationId: 'magentoGetOrder',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Order details',
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          }
        }
      }
    }
  },
  components: commonComponents
};

/**
 * BigCommerce API Definition
 */
export const bigCommerceApi: ExtendedOpenAPIV3_1 = {
  openapi: '3.1.0',
  info: {
    title: 'BigCommerce API',
    version: 'v3',
    description: 'BigCommerce Storefront and Management API.'
  },
  servers: [
    {
      url: 'https://api.bigcommerce.com/stores/{store_hash}/v3',
      variables: {
        store_hash: {
          default: 'xxxxx',
          description: 'The store hash'
        }
      }
    }
  ],
  security: [{ googleAuth: [] }],
  ...commonExtensions,
  paths: {
    '/catalog/products': {
      get: {
        operationId: 'bigCommerceGetProducts',
        summary: 'Get All Products',
        responses: {
          '200': {
            description: 'A list of products',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { type: 'object' } },
                    meta: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: commonComponents
};

/**
 * Stripe API Definition (Commerce related)
 */
export const stripeApi: ExtendedOpenAPIV3_1 = {
  openapi: '3.1.0',
  info: {
    title: 'Stripe API',
    version: '2023-10-16',
    description: 'Stripe Payment and Commerce API.'
  },
  servers: [
    {
      url: 'https://api.stripe.com/v1',
      description: 'Stripe API Base URL'
    }
  ],
  security: [{ googleAuth: [] }],
  ...commonExtensions,
  paths: {
    '/products': {
      get: {
        operationId: 'stripeListProducts',
        summary: 'List all products',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    object: { type: 'string', enum: ['list'] },
                    data: { type: 'array', items: { type: 'object' } },
                    has_more: { type: 'boolean' },
                    url: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        operationId: 'stripeCreateProduct',
        summary: 'Create a product',
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  active: { type: 'boolean' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Product created',
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          }
        }
      }
    },
    '/checkout/sessions': {
      post: {
        operationId: 'stripeCreateCheckoutSession',
        summary: 'Create a Checkout Session',
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  mode: { type: 'string', enum: ['payment', 'setup', 'subscription'] },
                  line_items: { type: 'array', items: { type: 'object' } },
                  success_url: { type: 'string' },
                  cancel_url: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Session created',
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          }
        }
      }
    }
  },
  components: commonComponents
};

/**
 * eBay Fulfillment API Definition
 */
export const ebayApi: ExtendedOpenAPIV3_1 = {
  openapi: '3.1.0',
  info: {
    title: 'eBay Fulfillment API',
    version: 'v1.20.0',
    description: 'eBay API for managing orders and fulfillment.'
  },
  servers: [
    {
      url: 'https://api.ebay.com/sell/fulfillment/v1',
      description: 'Production Server'
    }
  ],
  security: [{ googleAuth: [] }],
  ...commonExtensions,
  paths: {
    '/order': {
      get: {
        operationId: 'ebayGetOrders',
        summary: 'Search for orders',
        parameters: [
          { name: 'filter', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          '200': {
            description: 'Order search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    orders: { type: 'array', items: { type: 'object' } },
                    total: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: commonComponents
};

/**
 * Amazon Selling Partner API (SP-API) - Orders
 */
export const amazonSpApi: ExtendedOpenAPIV3_1 = {
  openapi: '3.1.0',
  info: {
    title: 'Amazon Selling Partner API - Orders',
    version: 'v0',
    description: 'Programmatic access to Amazon orders.'
  },
  servers: [
    {
      url: 'https://sellingpartnerapi-na.amazon.com',
      description: 'North America Endpoint'
    },
    {
      url: 'https://sellingpartnerapi-eu.amazon.com',
      description: 'Europe Endpoint'
    }
  ],
  security: [{ googleAuth: [] }],
  ...commonExtensions,
  paths: {
    '/orders/v0/orders': {
      get: {
        operationId: 'amazonGetOrders',
        summary: 'Returns orders created or updated during a time range',
        parameters: [
          { name: 'CreatedAfter', in: 'query', schema: { type: 'string' } },
          { name: 'MarketplaceIds', in: 'query', schema: { type: 'array', items: { type: 'string' } }, required: true }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    payload: {
                      type: 'object',
                      properties: {
                        Orders: { type: 'array', items: { type: 'object' } }
                      }
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
  components: commonComponents
};

/**
 * Square Commerce API
 */
export const squareApi: ExtendedOpenAPIV3_1 = {
  openapi: '3.1.0',
  info: {
    title: 'Square API',
    version: '2024-01-18',
    description: 'Square API for payments and commerce.'
  },
  servers: [
    {
      url: 'https://connect.squareup.com/v2',
      description: 'Square Production API'
    }
  ],
  security: [{ googleAuth: [] }],
  ...commonExtensions,
  paths: {
    '/catalog/list': {
      get: {
        operationId: 'squareListCatalog',
        summary: 'List catalog objects',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    objects: { type: 'array', items: { type: 'object' } }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/payments': {
      post: {
        operationId: 'squareCreatePayment',
        summary: 'Create a payment',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['source_id', 'idempotency_key', 'amount_money'],
                properties: {
                  source_id: { type: 'string' },
                  idempotency_key: { type: 'string' },
                  amount_money: {
                    type: 'object',
                    properties: {
                      amount: { type: 'integer' },
                      currency: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Payment created',
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          }
        }
      }
    }
  },
  components: commonComponents
};

// Export map of all commerce APIs
export const CommerceDefinitions: Record<string, ExtendedOpenAPIV3_1> = {
  shopify: shopifyApi,
  woocommerce: wooCommerceApi,
  magento: magentoApi,
  bigcommerce: bigCommerceApi,
  stripe: stripeApi,
  ebay: ebayApi,
  amazon: amazonSpApi,
  square: squareApi
};