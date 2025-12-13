export interface AB_CustomerModel {
    id: string;
    name: string;
    email: string;
    subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
    appId: string; // Identifier for the specific app this customer is associated with
    // Add other customer-specific fields as needed, e.g., paymentMethodId, lastLogin, etc.
}

/**
 * Interface for a generic database client, abstracting database operations.
 * In a real application, this would be implemented by an ORM client (e.g., PrismaClient, Mongoose)
 * or a custom data access layer.
 */
interface IDatabaseClient {
    findMany(filter?: Partial<AB_CustomerModel>): Promise<AB_CustomerModel[]>;
    findUnique(id: string): Promise<AB_CustomerModel | null>;
    create(data: Omit<AB_CustomerModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AB_CustomerModel>;
    update(id: string, data: Partial<Omit<AB_CustomerModel, 'id' | 'createdAt'>>): Promise<AB_CustomerModel | null>;
    delete(id: string): Promise<AB_CustomerModel | null>;
}

/**
 * Mock Database Client Implementation for demonstration and testing purposes.
 * This simulates asynchronous database operations using an in-memory array.
 * In a production environment, this would be replaced by an actual ORM or database driver.
 */
class MockDatabaseClient implements IDatabaseClient {
    private customers: AB_CustomerModel[] = [];
    private nextId: number = 1;

    constructor(initialCustomers: AB_CustomerModel[] = []) {
        this.customers = initialCustomers.map(c => ({ ...c })); // Deep copy initial data
        if (initialCustomers.length > 0) {
            const maxIdNum = Math.max(...initialCustomers.map(c => parseInt(c.id.replace('cust_', ''), 10) || 0));
            this.nextId = maxIdNum + 1;
        }
    }

    async findMany(filter?: Partial<AB_CustomerModel>): Promise<AB_CustomerModel[]> {
        return new Promise(resolve => {
            setTimeout(() => {
                let filteredCustomers = this.customers;
                if (filter) {
                    filteredCustomers = this.customers.filter(customer => {
                        for (const key in filter) {
                            if (filter.hasOwnProperty(key)) {
                                const customerValue = customer[key as keyof AB_CustomerModel];
                                const filterValue = filter[key as keyof AB_CustomerModel];

                                // Basic equality check. For more complex filters (e.g., ranges, regex),
                                // a real ORM would handle this.
                                if (customerValue !== filterValue) {
                                    return false;
                                }
                            }
                        }
                        return true;
                    });
                }
                resolve(filteredCustomers.map(c => ({ ...c }))); // Return shallow copies
            }, 50); // Simulate network latency
        });
    }

    async findUnique(id: string): Promise<AB_CustomerModel | null> {
        return new Promise(resolve => {
            setTimeout(() => {
                const customer = this.customers.find(c => c.id === id);
                resolve(customer ? { ...customer } : null); // Return a shallow copy
            }, 50);
        });
    }

    async create(data: Omit<AB_CustomerModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AB_CustomerModel> {
        return new Promise(resolve => {
            setTimeout(() => {
                const newCustomer: AB_CustomerModel = {
                    id: `cust_${this.nextId++}`,
                    ...data,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.customers.push(newCustomer);
                resolve({ ...newCustomer }); // Return a shallow copy
            }, 50);
        });
    }

    async update(id: string, data: Partial<Omit<AB_CustomerModel, 'id' | 'createdAt'>>): Promise<AB_CustomerModel | null> {
        return new Promise(resolve => {
            setTimeout(() => {
                const index = this.customers.findIndex(c => c.id === id);
                if (index === -1) {
                    resolve(null);
                    return;
                }
                const updatedCustomer = {
                    ...this.customers[index],
                    ...data,
                    updatedAt: new Date(),
                };
                this.customers[index] = updatedCustomer;
                resolve({ ...updatedCustomer }); // Return a shallow copy
            }, 50);
        });
    }

    async delete(id: string): Promise<AB_CustomerModel | null> {
        return new Promise(resolve => {
            setTimeout(() => {
                const index = this.customers.findIndex(c => c.id === id);
                if (index === -1) {
                    resolve(null);
                    return;
                }
                const [deletedCustomer] = this.customers.splice(index, 1);
                resolve({ ...deletedCustomer }); // Return a shallow copy
            }, 50);
        });
    }
}

/**
 * BB_CustomerRepository is the data access layer for customer entities.
 * It provides methods to interact with the underlying database (via IDatabaseClient)
 * for CRUD operations and specific customer-related queries.
 */
class BB_CustomerRepository {
    private dbClient: IDatabaseClient;

    /**
     * Initializes the Customer Repository with a database client.
     * This allows for dependency injection, making the repository testable
     * and adaptable to different database implementations.
     * @param dbClient The database client instance (e.g., an ORM client or a mock for testing).
     */
    constructor(dbClient: IDatabaseClient) {
        this.dbClient = dbClient;
    }

    /**
     * Retrieves a customer by their unique ID.
     * @param id The unique identifier of the customer.
     * @returns A Promise that resolves to the customer model or null if not found.
     * @throws Error if the database operation fails.
     */
    async getCustomerById(id: string): Promise<AB_CustomerModel | null> {
        try {
            return await this.dbClient.findUnique(id);
        } catch (error) {
            console.error(`[BB_CustomerRepository] Error fetching customer by ID ${id}:`, error);
            throw new Error('Failed to retrieve customer.');
        }
    }

    /**
     * Retrieves all customers, optionally filtered by specific criteria.
     * @param filter An optional object to filter customers (e.g., { appId: 'app1', subscriptionStatus: 'active' }).
     * @returns A Promise that resolves to an array of customer models.
     * @throws Error if the database operation fails.
     */
    async getAllCustomers(filter?: Partial<AB_CustomerModel>): Promise<AB_CustomerModel[]> {
        try {
            return await this.dbClient.findMany(filter);
        } catch (error) {
            console.error('[BB_CustomerRepository] Error fetching all customers:', error);
            throw new Error('Failed to retrieve customers.');
        }
    }

    /**
     * Creates a new customer record.
     * @param customerData The data for the new customer, excluding ID, createdAt, and updatedAt.
     * @returns A Promise that resolves to the newly created customer model.
     * @throws Error if required data is missing or the database operation fails.
     */
    async createCustomer(customerData: Omit<AB_CustomerModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AB_CustomerModel> {
        try {
            // Basic validation for essential fields
            if (!customerData.email || !customerData.name || !customerData.appId) {
                throw new Error('Customer name, email, and appId are required.');
            }
            // Further validation (e.g., email format, uniqueness) would typically be handled
            // by a service layer or database constraints.

            return await this.dbClient.create(customerData);
        } catch (error) {
            console.error('[BB_CustomerRepository] Error creating customer:', error);
            throw new Error('Failed to create customer.');
        }
    }

    /**
     * Updates an existing customer record.
     * @param id The unique identifier of the customer to update.
     * @param updateData The data to update, excluding ID and createdAt.
     * @returns A Promise that resolves to the updated customer model or null if not found.
     * @throws Error if the database operation fails.
     */
    async updateCustomer(id: string, updateData: Partial<Omit<AB_CustomerModel, 'id' | 'createdAt'>>): Promise<AB_CustomerModel | null> {
        try {
            return await this.dbClient.update(id, updateData);
        } catch (error) {
            console.error(`[BB_CustomerRepository] Error updating customer ${id}:`, error);
            throw new Error('Failed to update customer.');
        }
    }

    /**
     * Deletes a customer record by their unique ID.
     * @param id The unique identifier of the customer to delete.
     * @returns A Promise that resolves to the deleted customer model or null if not found.
     * @throws Error if the database operation fails.
     */
    async deleteCustomer(id: string): Promise<AB_CustomerModel | null> {
        try {
            return await this.dbClient.delete(id);
        } catch (error) {
            console.error(`[BB_CustomerRepository] Error deleting customer ${id}:`, error);
            throw new Error('Failed to delete customer.');
        }
    }

    /**
     * Finds a customer by email address.
     * Note: This assumes email is unique across all customers, or returns the first match found.
     * For multi-tenant applications, consider `getCustomerByEmailAndAppId` for better specificity.
     * @param email The email address of the customer.
     * @returns A Promise that resolves to the customer model or null if not found.
     * @throws Error if the database operation fails.
     */
    async getCustomerByEmail(email: string): Promise<AB_CustomerModel | null> {
        try {
            const customers = await this.dbClient.findMany({ email });
            return customers.length > 0 ? customers[0] : null; // Return the first match
        } catch (error) {
            console.error(`[BB_CustomerRepository] Error fetching customer by email ${email}:`, error);
            throw new Error('Failed to retrieve customer by email.');
        }
    }

    /**
     * Updates a customer's subscription status.
     * @param id The unique identifier of the customer.
     * @param status The new subscription status.
     * @returns A Promise that resolves to the updated customer model or null if not found.
     * @throws Error if the database operation fails.
     */
    async updateSubscriptionStatus(id: string, status: AB_CustomerModel['subscriptionStatus']): Promise<AB_CustomerModel | null> {
        try {
            return await this.dbClient.update(id, { subscriptionStatus: status });
        } catch (error) {
            console.error(`[BB_CustomerRepository] Error updating subscription status for customer ${id}:`, error);
            throw new Error('Failed to update subscription status.');
        }
    }

    /**
     * Retrieves customers associated with a specific application.
     * This is crucial for the project goal of "500 files that are individuals apps that get subscriptions".
     * @param appId The unique identifier of the application.
     * @returns A Promise that resolves to an array of customer models.
     * @throws Error if the database operation fails.
     */
    async getCustomersByAppId(appId: string): Promise<AB_CustomerModel[]> {
        try {
            return await this.dbClient.findMany({ appId });
        } catch (error) {
            console.error(`[BB_CustomerRepository] Error fetching customers for app ID ${appId}:`, error);
            throw new Error('Failed to retrieve customers by app ID.');
        }
    }
}

// --- Singleton Instance Export ---
// In a production application, you would replace `MockDatabaseClient` with an actual
// ORM client (e.g., `new PrismaClient()`) initialized with proper database connection details.
const mockDbClient = new MockDatabaseClient();
export const customerRepository = new BB_CustomerRepository(mockDbClient);

// Export the class and interfaces for flexibility, e.g., for testing or alternative instantiation.
export { BB_CustomerRepository, MockDatabaseClient, IDatabaseClient };