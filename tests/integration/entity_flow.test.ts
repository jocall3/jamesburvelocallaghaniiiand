import request from 'supertest';
import { Application } from 'express';
import { Server } from 'http'; // Import Server type for explicit server closing
import { setupServer } from '../../src/server'; // Assuming this exports a function that returns an Express app and/or an http.Server

/**
 * Integration tests for the Corporate Registry generation and retrieval endpoints.
 * This suite covers the full lifecycle of a corporate entity: creation, retrieval,
 * update, and deletion, along with various error handling scenarios.
 *
 * It assumes an API structure with endpoints like:
 * - POST /api/v1/corporate-registry/entities
 * - GET /api/v1/corporate-registry/entities
 * - GET /api/v1/corporate-registry/entities/{id}
 * - PUT /api/v1/corporate-registry/entities/{id}
 * - DELETE /api/v1/corporate-registry/entities/{id}
 *
 * Authentication is simulated using a Bearer token.
 */

let app: Application;
let server: Server; // To hold the HTTP server instance for graceful shutdown
let authToken: string; // Authentication token for authorized requests

/**
 * Before all tests, set up the Express server and obtain an authentication token.
 * This ensures the API is running and accessible for all subsequent tests.
 */
beforeAll(async () => {
    // Initialize the server. The `setupServer` function is expected to return
    // either an Express Application instance directly, or an object containing
    // both the app and the underlying http.Server instance.
    const serverResult = await setupServer();

    if (serverResult && typeof serverResult === 'object' && 'app' in serverResult && 'server' in serverResult) {
        app = serverResult.app as Application;
        server = serverResult.server as Server;
    } else {
        // If setupServer just returns the app, supertest can work with it in-memory.
        // In this case, there's no explicit server to close, unless the app itself
        // manages a server instance internally that needs shutdown.
        app = serverResult as Application;
    }

    // Simulate authentication. In a real application, this would involve
    // making a request to a login endpoint and extracting the token.
    // For these tests, we use a static, valid token.
    authToken = 'Bearer test-corporate-registry-secure-token-12345';

    // Optional: Pre-populate database with some base data if needed for specific tests
    // For this suite, we'll create entities dynamically.
});

/**
 * After all tests have run, gracefully shut down the server to free up resources.
 * This is crucial for preventing resource leaks in test environments.
 */
afterAll(async () => {
    if (server && server.listening) {
        await new Promise<void>((resolve, reject) => {
            server.close(err => {
                if (err) {
                    console.error('Error closing server:', err);
                    reject(err);
                } else {
                    console.log('Server closed successfully.');
                    resolve();
                }
            });
        });
    }
});

/**
 * Main test suite for the Corporate Registry Entity Flow.
 * This block groups all tests related to managing corporate entities.
 */
describe('Corporate Registry Entity Flow Integration Tests', () => {
    let createdEntityId: string; // Variable to store the ID of a newly created entity for subsequent tests

    /**
     * Tests for the POST /api/v1/corporate-registry/entities endpoint.
     * This endpoint is responsible for creating new corporate entities.
     */
    describe('POST /api/v1/corporate-registry/entities', () => {
        /**
         * Test case: Successfully create a new corporate entity with all required and optional fields.
         * Verifies that the API returns a 201 Created status and the newly created entity data,
         * including a unique ID and timestamps.
         */
        it('should successfully create a new corporate entity with comprehensive details', async () => {
            const newEntityData = {
                legalName: 'Global Innovations Inc.',
                registrationNumber: 'GII-CRN-987654321',
                jurisdiction: 'Delaware',
                incorporationDate: '2023-03-01T00:00:00.000Z',
                status: 'Active',
                entityType: 'Corporation',
                industry: 'Technology',
                contactEmail: 'info@globalinnovations.com',
                phoneNumber: '+1-555-123-4567',
                website: 'https://www.globalinnovations.com',
                address: {
                    street: '100 Innovation Drive',
                    city: 'Wilmington',
                    state: 'DE',
                    zipCode: '19808',
                    country: 'USA',
                    poBox: 'P.O. Box 123',
                },
                directors: [
                    {
                        firstName: 'Alice',
                        lastName: 'Smith',
                        role: 'CEO',
                        nationality: 'American',
                        dateOfBirth: '1975-01-01',
                        address: {
                            street: '101 Executive Blvd',
                            city: 'Wilmington',
                            state: 'DE',
                            zipCode: '19808',
                            country: 'USA',
                        },
                    },
                    {
                        firstName: 'Bob',
                        lastName: 'Johnson',
                        role: 'CTO',
                        nationality: 'Canadian',
                        dateOfBirth: '1980-05-10',
                        address: {
                            street: '202 Tech Lane',
                            city: 'Toronto',
                            state: 'ON',
                            zipCode: 'M5V 2E1',
                            country: 'Canada',
                        },
                    },
                ],
                shareholders: [
                    {
                        name: 'Venture Capital Fund A',
                        shares: 500000,
                        shareClass: 'Common A',
                        ownershipPercentage: 40.0,
                        isIndividual: false,
                    },
                    {
                        name: 'Emily White',
                        shares: 250000,
                        shareClass: 'Common B',
                        ownershipPercentage: 20.0,
                        isIndividual: true,
                    },
                ],
                filings: [
                    {
                        type: 'Annual Report',
                        filingDate: '2024-01-15T00:00:00.000Z',
                        status: 'Filed',
                        documentUrl: 'https://docs.globalinnovations.com/annual-report-2023.pdf',
                    },
                ],
                metadata: {
                    sourceSystem: 'Internal CRM',
                    lastVerifiedBy: 'compliance_team',
                },
            };

            const response = await request(app)
                .post('/api/v1/corporate-registry/entities')
                .set('Authorization', authToken)
                .send(newEntityData)
                .expect(201); // Expect HTTP 201 Created status

            expect(response.body).toHaveProperty('id');
            expect(typeof response.body.id).toBe('string');
            expect(response.body.legalName).toBe(newEntityData.legalName);
            expect(response.body.registrationNumber).toBe(newEntityData.registrationNumber);
            expect(response.body.status).toBe('Active');
            expect(response.body.address.street).toBe(newEntityData.address.street);
            expect(response.body.directors).toHaveLength(2);
            expect(response.body.shareholders).toHaveLength(2);
            expect(response.body).toHaveProperty('createdAt');
            expect(response.body).toHaveProperty('updatedAt');

            createdEntityId = response.body.id; // Store the ID for subsequent retrieval, update, and delete tests
        });

        /**
         * Test case: Attempt to create an entity with missing required fields.
         * Verifies that the API returns a 400 Bad Request status and an informative error message.
         */
        it('should return 400 Bad Request if required fields are missing', async () => {
            const invalidEntityData = {
                // Missing legalName, registrationNumber, jurisdiction
                status: 'Pending',
                address: {
                    street: 'Missing St',
                    city: 'Nowhere',
                    state: 'XX',
                    zipCode: '00000',
                    country: 'Invalid',
                },
            };

            const response = await request(app)
                .post('/api/v1/corporate-registry/entities')
                .set('Authorization', authToken)
                .send(invalidEntityData)
                .expect(400); // Expect HTTP 400 Bad Request

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Validation failed'); // Or a more specific error message from the API
            expect(response.body).toHaveProperty('errors'); // Expect a detailed errors array
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'legalName', message: expect.any(String) }),
                    expect.objectContaining({ field: 'registrationNumber', message: expect.any(String) }),
                    expect.objectContaining({ field: 'jurisdiction', message: expect.any(String) }),
                ]),
            );
        });

        /**
         * Test case: Attempt to create an entity without providing an authentication token.
         * Verifies that the API returns a 401 Unauthorized status.
         */
        it('should return 401 Unauthorized if no authentication token is provided', async () => {
            const newEntityData = {
                legalName: 'Unauthorized Corp',
                registrationNumber: 'CRN-UNAUTH-001',
                jurisdiction: 'Nevada',
                status: 'Active',
            };

            await request(app)
                .post('/api/v1/corporate-registry/entities')
                .send(newEntityData) // No Authorization header
                .expect(401); // Expect HTTP 401 Unauthorized
        });
    });

    /**
     * Tests for the GET /api/v1/corporate-registry/entities/{id} endpoint.
     * This endpoint is responsible for retrieving a single corporate entity by its unique ID.
     */
    describe('GET /api/v1/corporate-registry/entities/{id}', () => {
        /**
         * Test case: Successfully retrieve a corporate entity using its ID.
         * Verifies that the API returns a 200 OK status and the correct entity data.
         */
        it('should successfully retrieve a corporate entity by its unique ID', async () => {
            // Ensure an entity was successfully created in the previous test
            expect(createdEntityId).toBeDefined();

            const response = await request(app)
                .get(`/api/v1/corporate-registry/entities/${createdEntityId}`)
                .set('Authorization', authToken)
                .expect(200); // Expect HTTP 200 OK status

            expect(response.body).toHaveProperty('id', createdEntityId);
            expect(response.body).toHaveProperty('legalName', 'Global Innovations Inc.');
            expect(response.body).toHaveProperty('registrationNumber', 'GII-CRN-987654321');
            expect(response.body).toHaveProperty('jurisdiction', 'Delaware');
            expect(response.body).toHaveProperty('status', 'Active');
            expect(response.body).toHaveProperty('address');
            expect(response.body.address.street).toBe('100 Innovation Drive');
            expect(response.body).toHaveProperty('directors');
            expect(response.body.directors).toHaveLength(2);
            expect(response.body.directors[0].firstName).toBe('Alice');
        });

        /**
         * Test case: Attempt to retrieve an entity with a non-existent ID.
         * Verifies that the API returns a 404 Not Found status.
         */
        it('should return 404 Not Found if the entity ID does not exist', async () => {
            const nonExistentId = 'non-existent-entity-id-99999';

            await request(app)
                .get(`/api/v1/corporate-registry/entities/${nonExistentId}`)
                .set('Authorization', authToken)
                .expect(404); // Expect HTTP 404 Not Found
        });

        /**
         * Test case: Attempt to retrieve an entity without providing an authentication token.
         * Verifies that the API returns a 401 Unauthorized status.
         */
        it('should return 401 Unauthorized if no authentication token is provided', async () => {
            // Use the ID of a known entity for this test
            expect(createdEntityId).toBeDefined();

            await request(app)
                .get(`/api/v1/corporate-registry/entities/${createdEntityId}`)
                .expect(401); // Expect HTTP 401 Unauthorized
        });
    });

    /**
     * Tests for the GET /api/v1/corporate-registry/entities endpoint.
     * This endpoint is responsible for retrieving a list of corporate entities,
     * supporting pagination and filtering.
     */
    describe('GET /api/v1/corporate-registry/entities', () => {
        /**
         * Test case: Successfully retrieve a list of corporate entities.
         * Verifies that the API returns a 200 OK status and an array of entities.
         */
        it('should successfully retrieve a list of corporate entities', async () => {
            const response = await request(app)
                .get('/api/v1/corporate-registry/entities')
                .set('Authorization', authToken)
                .expect(200); // Expect HTTP 200 OK status

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(1); // At least the one we created
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('legalName');
            expect(response.body[0]).toHaveProperty('status');
        });

        /**
         * Test case: Retrieve a list of entities with pagination and filtering by status.
         * Verifies that the API correctly applies query parameters for filtering and limiting results.
         */
        it('should support pagination and filtering by status', async () => {
            // Create another entity with a different status for effective filtering
            await request(app)
                .post('/api/v1/corporate-registry/entities')
                .set('Authorization', authToken)
                .send({
                    legalName: 'Inactive Holdings LLC',
                    registrationNumber: 'IHL-CRN-001',
                    jurisdiction: 'Nevada',
                    incorporationDate: '2022-05-01T00:00:00.000Z',
                    status: 'Inactive',
                    entityType: 'LLC',
                    address: {
                        street: '456 Oak Ave',
                        city: 'Reno',
                        state: 'NV',
                        zipCode: '89501',
                        country: 'USA',
                    },
                })
                .expect(201);

            // Retrieve only 'Active' entities, with a limit of 1
            const response = await request(app)
                .get('/api/v1/corporate-registry/entities?status=Active&limit=1&offset=0')
                .set('Authorization', authToken)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toHaveLength(1); // Expect only one result due to limit
            expect(response.body[0].status).toBe('Active');
            expect(response.body[0].legalName).toBe('Global Innovations Inc.'); // Assuming this was the first active one created
        });

        /**
         * Test case: Attempt to retrieve a list of entities without providing an authentication token.
         * Verifies that the API returns a 401 Unauthorized status.
         */
        it('should return 401 Unauthorized if no authentication token is provided', async () => {
            await request(app)
                .get('/api/v1/corporate-registry/entities')
                .expect(401); // Expect HTTP 401 Unauthorized
        });
    });

    /**
     * Tests for the PUT /api/v1/corporate-registry/entities/{id} endpoint.
     * This endpoint is responsible for updating an existing corporate entity.
     */
    describe('PUT /api/v1/corporate-registry/entities/{id}', () => {
        /**
         * Test case: Successfully update an existing corporate entity.
         * Verifies that the API returns a 200 OK status and the updated entity data.
         */
        it('should successfully update an existing corporate entity', async () => {
            expect(createdEntityId).toBeDefined();

            const updatedData = {
                legalName: 'Global Innovations Inc. (Updated Name)',
                status: 'Suspended',
                contactEmail: 'support@globalinnovations.com',
                address: {
                    street: '789 New Corporate Blvd',
                    city: 'Newtown',
                    state: 'DE',
                    zipCode: '19802',
                    country: 'USA',
                },
                directors: [
                    {
                        firstName: 'Alice',
                        lastName: 'Smith',
                        role: 'Chairperson', // Role updated
                        nationality: 'American',
                        dateOfBirth: '1975-01-01',
                        address: {
                            street: '101 Executive Blvd',
                            city: 'Wilmington',
                            state: 'DE',
                            zipCode: '19808',
                            country: 'USA',
                        },
                    },
                ],
            };

            const response = await request(app)
                .put(`/api/v1/corporate-registry/entities/${createdEntityId}`)
                .set('Authorization', authToken)
                .send(updatedData)
                .expect(200); // Expect HTTP 200 OK status

            expect(response.body).toHaveProperty('id', createdEntityId);
            expect(response.body.legalName).toBe(updatedData.legalName);
            expect(response.body.status).toBe(updatedData.status);
            expect(response.body.contactEmail).toBe(updatedData.contactEmail);
            expect(response.body.address.street).toBe(updatedData.address.street);
            expect(response.body.directors).toHaveLength(1); // Assuming PUT replaces the array
            expect(response.body.directors[0].role).toBe('Chairperson');
            expect(response.body.updatedAt).not.toBe(response.body.createdAt); // Ensure updatedAt timestamp has changed
        });

        /**
         * Test case: Attempt to update a non-existent entity.
         * Verifies that the API returns a 404 Not Found status.
         */
        it('should return 404 Not Found if trying to update a non-existent entity', async () => {
            const nonExistentId = 'non-existent-update-id-456';
            const updatedData = { legalName: 'Ghost Corp Update' };

            await request(app)
                .put(`/api/v1/corporate-registry/entities/${nonExistentId}`)
                .set('Authorization', authToken)
                .send(updatedData)
                .expect(404); // Expect HTTP 404 Not Found
        });

        /**
         * Test case: Attempt to update an entity without providing an authentication token.
         * Verifies that the API returns a 401 Unauthorized status.
         */
        it('should return 401 Unauthorized if no authentication token is provided for update', async () => {
            // Use the ID of a known entity for this test
            expect(createdEntityId).toBeDefined();
            const updatedData = { legalName: 'Unauthorized Update Attempt' };

            await request(app)
                .put(`/api/v1/corporate-registry/entities/${createdEntityId}`)
                .send(updatedData)
                .expect(401); // Expect HTTP 401 Unauthorized
        });
    });

    /**
     * Tests for the DELETE /api/v1/corporate-registry/entities/{id} endpoint.
     * This endpoint is responsible for deleting an existing corporate entity.
     */
    describe('DELETE /api/v1/corporate-registry/entities/{id}', () => {
        /**
         * Test case: Successfully delete a corporate entity.
         * Verifies that the API returns a 204 No Content status and that the entity
         * can no longer be retrieved.
         */
        it('should successfully delete a corporate entity', async () => {
            expect(createdEntityId).toBeDefined();

            await request(app)
                .delete(`/api/v1/corporate-registry/entities/${createdEntityId}`)
                .set('Authorization', authToken)
                .expect(204); // Expect HTTP 204 No Content for successful deletion

            // Verify the entity is actually deleted by attempting to retrieve it
            await request(app)
                .get(`/api/v1/corporate-registry/entities/${createdEntityId}`)
                .set('Authorization', authToken)
                .expect(404); // Expect HTTP 404 Not Found after deletion
        });

        /**
         * Test case: Attempt to delete a non-existent entity.
         * Verifies that the API returns a 404 Not Found status.
         */
        it('should return 404 Not Found if trying to delete a non-existent entity', async () => {
            const nonExistentId = 'non-existent-delete-id-789';

            await request(app)
                .delete(`/api/v1/corporate-registry/entities/${nonExistentId}`)
                .set('Authorization', authToken)
                .expect(404); // Expect HTTP 404 Not Found
        });

        /**
         * Test case: Attempt to delete an entity without providing an authentication token.
         * Verifies that the API returns a 401 Unauthorized status.
         */
        it('should return 401 Unauthorized if no authentication token is provided for delete', async () => {
            // Create a temporary entity specifically for this unauthorized delete test
            const tempEntityResponse = await request(app)
                .post('/api/v1/corporate-registry/entities')
                .set('Authorization', authToken)
                .send({
                    legalName: 'Temporary Delete Corp',
                    registrationNumber: 'CRN-TEMP-DEL-001',
                    jurisdiction: 'Texas',
                    incorporationDate: '2024-01-01T00:00:00.000Z',
                    status: 'Active',
                    entityType: 'Partnership',
                    address: {
                        street: '100 Temp St',
                        city: 'Austin',
                        state: 'TX',
                        zipCode: '78701',
                        country: 'USA',
                    },
                })
                .expect(201);
            const tempEntityId = tempEntityResponse.body.id;

            // Attempt to delete without authorization
            await request(app)
                .delete(`/api/v1/corporate-registry/entities/${tempEntityId}`)
                .expect(401); // Expect HTTP 401 Unauthorized

            // Clean up the temporary entity with authorization
            await request(app)
                .delete(`/api/v1/corporate-registry/entities/${tempEntityId}`)
                .set('Authorization', authToken)
                .expect(204);
        });
    });
});