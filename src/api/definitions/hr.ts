/**
 * @file src/api/definitions/hr.ts
 * @purpose OpenAPI 3.1.0 definitions for HR APIs (Gusto, Rippling, BambooHR).
 *
 * @description
 * This file provides structured, machine-readable specifications for interacting with
 * popular Human Resources (HR) platforms. These definitions are designed to be used by
 * API clients, documentation generators, and workflow engines within the project.
 *
 * Each definition is a representative subset of the full API, focusing on key
 * resources like employees and companies. They are designed to be extended as needed.
 *
 * The `x-workflows` extension property is used to link operations to pre-request and
 * post-response scripts, fulfilling a core project requirement.
 */

// Although we are not importing the type directly to avoid dependency issues,
// these objects are structured to conform to the OpenAPIV3_1.Document interface.
// import { OpenAPIV3_1 } from 'openapi-types';

export const hrApiDefinitions = {
  /**
   * OpenAPI 3.1.0 definition for the Gusto API.
   * Gusto is a platform for payroll, benefits, and HR.
   * @see https://docs.gusto.com/
   */
  gusto: {
    openapi: '3.1.0',
    info: {
      title: 'Gusto API',
      version: 'v1',
      description: 'API for payroll, benefits, and HR. This definition covers core employee and company resources.',
      contact: {
        name: 'Gusto API Support',
        url: 'https://docs.gusto.com/support',
      },
    },
    servers: [
      {
        url: 'https://api.gusto.com',
        description: 'Production Server',
      },
      {
        url: 'https://api.gusto-demo.com',
        description: 'Demo/Sandbox Server',
      },
    ],
    security: [
      {
        gustoOAuth: ['employees:read', 'companies:read'],
      },
    ],
    paths: {
      '/v1/companies/{company_uuid}/employees': {
        get: {
          tags: ['Employees'],
          summary: 'Get all employees for a company',
          description: 'Fetches a list of all active and terminated employees for a given company.',
          operationId: 'getCompanyEmployees',
          parameters: [
            {
              name: 'company_uuid',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'The UUID of the company.',
            },
          ],
          responses: {
            '200': {
              description: 'A list of employees.',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Employee',
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Company not found.',
            },
          },
          'x-workflows': {
            postResponse: {
              scriptId: 'syncGustoEmployeesToDataWarehouse',
              description: 'After fetching employees, sync the list to our internal data warehouse.',
            },
          },
        },
      },
      '/v1/employees/{employee_uuid}': {
        get: {
          tags: ['Employees'],
          summary: 'Get a single employee',
          operationId: 'getEmployeeById',
          parameters: [
            {
              name: 'employee_uuid',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'The UUID of the employee.',
            },
          ],
          responses: {
            '200': {
              description: 'Employee object.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Employee',
                  },
                },
              },
            },
            '404': {
              description: 'Employee not found.',
            },
          },
          'x-workflows': {
            postResponse: {
              scriptId: 'saveEmployeeProfileToDrive',
              description: 'Saves the detailed employee profile as a PDF to a designated Google Drive folder.',
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Employee: {
          type: 'object',
          properties: {
            uuid: { type: 'string', format: 'uuid' },
            version: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            job_title: { type: 'string', nullable: true },
            current_jobs: { type: 'array', items: { type: 'object' } }, // Simplified for brevity
          },
        },
      },
      securitySchemes: {
        gustoOAuth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://api.gusto.com/oauth/authorize',
              tokenUrl: 'https://api.gusto.com/oauth/token',
              scopes: {
                'employees:read': 'Read access to employees',
                'employees:write': 'Write access to employees',
                'companies:read': 'Read access to companies',
              },
            },
          },
        },
      },
    },
  },

  /**
   * OpenAPI 3.1.0 definition for the Rippling API.
   * Rippling is a unified platform for HR, IT, and Finance.
   * @see https://developers.rippling.com/
   */
  rippling: {
    openapi: '3.1.0',
    info: {
      title: 'Rippling API',
      version: 'platform',
      description: 'Rippling\'s Platform API for managing employees, payroll, and more.',
    },
    servers: [
      {
        url: 'https://api.rippling.com/platform/api',
        description: 'Rippling Production API',
      },
    ],
    security: [
      {
        ripplingOAuth: ['employee:read'],
      },
    ],
    paths: {
      '/employees': {
        get: {
          tags: ['Employees'],
          summary: 'List all employees',
          description: 'Returns a paginated list of employees, including current and past employees.',
          operationId: 'listEmployees',
          responses: {
            '200': {
              description: 'A list of employee objects.',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Employee',
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/employees/{employee_id}': {
        get: {
          tags: ['Employees'],
          summary: 'Retrieve an employee',
          operationId: 'getEmployee',
          parameters: [
            {
              name: 'employee_id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'The ID of the employee.',
            },
          ],
          responses: {
            '200': {
              description: 'The requested employee.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Employee',
                  },
                },
              },
            },
            '404': {
              description: 'Employee not found.',
            },
          },
          'x-workflows': {
            preRequest: {
              scriptId: 'validateRipplingEmployeeId',
              description: 'Validates the employee ID format before making the API call.',
            },
            postResponse: {
              scriptId: 'triggerGithubOnboardingWorkflow',
              description: 'If the employee is a new hire, trigger a GitHub repository creation and access grant workflow.',
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            personalEmail: { type: 'string', format: 'email' },
            workEmail: { type: 'string', format: 'email', nullable: true },
            role: { $ref: '#/components/schemas/Role' },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            department: { type: 'string', nullable: true },
          },
        },
      },
      securitySchemes: {
        ripplingOAuth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://app.rippling.com/api/oauth/authorize',
              tokenUrl: 'https://api.rippling.com/api/oauth/token',
              scopes: {
                'employee:read': 'Read employee data',
                'employee:write': 'Modify employee data',
              },
            },
          },
        },
      },
    },
  },

  /**
   * OpenAPI 3.1.0 definition for the BambooHR API.
   * BambooHR provides HR software for small and medium businesses.
   * @see https://documentation.bamboohr.com/reference
   */
  bambooHR: {
    openapi: '3.1.0',
    info: {
      title: 'BambooHR API',
      version: 'v1',
      description: 'The official API for BambooHR, allowing you to connect your applications to your BambooHR account.',
    },
    servers: [
      {
        url: 'https://api.bamboohr.com/api/gateway.php/{companyDomain}',
        description: 'BambooHR API Endpoint',
        variables: {
          companyDomain: {
            default: 'mycompany',
            description: 'Your unique company domain in BambooHR.',
          },
        },
      },
    ],
    security: [
      {
        bambooApiToken: [],
      },
    ],
    paths: {
      '/v1/employees/directory': {
        get: {
          tags: ['Employees'],
          summary: 'Get Employee Directory',
          description: 'Returns a list of all employees with a limited set of fields, suitable for a company directory.',
          operationId: 'getEmployeeDirectory',
          responses: {
            '200': {
              description: 'A directory of employees.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      employees: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/DirectoryEmployee',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/v1/employees/{id}': {
        get: {
          tags: ['Employees'],
          summary: 'Get Employee',
          description: 'Returns all data for a single employee.',
          operationId: 'getEmployeeByIdBamboo',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'The numeric ID of the employee.',
            },
            {
              name: 'fields',
              in: 'query',
              schema: {
                type: 'string',
                // Example: 'firstName,lastName,jobTitle,workEmail'
              },
              description: 'A comma-separated list of fields to return. If not specified, all fields are returned.',
            },
          ],
          responses: {
            '200': {
              description: 'The full employee record.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/FullEmployee',
                  },
                },
              },
            },
            '404': {
              description: 'Employee not found.',
            },
          },
        },
      },
    },
    components: {
      schemas: {
        DirectoryEmployee: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            displayName: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            jobTitle: { type: 'string', nullable: true },
            workEmail: { type: 'string', format: 'email', nullable: true },
          },
        },
        FullEmployee: {
          type: 'object',
          // BambooHR has many fields, this is a representative subset
          properties: {
            id: { type: 'integer' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            hireDate: { type: 'string', format: 'date' },
            department: { type: 'string', nullable: true },
            division: { type: 'string', nullable: true },
            location: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['Active', 'Inactive'] },
          },
        },
      },
      securitySchemes: {
        bambooApiToken: {
          type: 'http',
          scheme: 'basic',
          description: 'BambooHR uses HTTP Basic authentication. Provide your API key as the username and any string (e.g., "x") as the password.',
        },
      },
    },
  },
} as const;