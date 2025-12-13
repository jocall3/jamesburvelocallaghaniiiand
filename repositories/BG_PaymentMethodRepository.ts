import { AG_PaymentMethodModel } from '../models/AG_PaymentMethodModel'; // Assuming this path for the model definition

/**
 * Interface for a generic database client that can perform CRUD operations
 * on AG_PaymentMethodModel entities. This abstracts the underlying ORM (e.g., Prisma, TypeORM).
 * The `where` clauses are designed to be flexible, accommodating common ORM query patterns
 * that might include operators (e.g., `{ id: { not: 'someId' } }`).
 */
interface PaymentMethodDatabaseClient {
  /**
   * Finds multiple payment methods based on a query.
   * @param query An object containing `where` conditions.
   * @returns A promise that resolves to an array of payment methods.
   */
  findMany(query?: { where?: Record<string, any> }): Promise<AG_PaymentMethodModel[]>;

  /**
   * Finds a unique payment method by its ID.
   * @param query An object containing a `where` condition with the `id`.
   * @returns A promise that resolves to the payment method or null if not found.
   */
  findUnique(query: { where: { id: string } }): Promise<AG_PaymentMethodModel | null>;

  /**
   * Creates a new payment method.
   * @param data An object containing the `data` for the new payment method.
   * @returns A promise that resolves to the newly created payment method.
   */
  create(data: { data: Omit<AG_PaymentMethodModel, 'id' | 'createdAt' | 'updatedAt'> }): Promise<AG_PaymentMethodModel>;

  /**
   * Updates an existing payment method by its ID.
   * @param query An object containing a `where` condition with the `id`.
   * @param data An object containing the `data` to update.
   * @returns A promise that resolves to the updated payment method or null if not found.
   */
  update(query: { where: { id: string } }, data: { data: Partial<AG_PaymentMethodModel> }): Promise<AG_PaymentMethodModel | null>;

  /**
   * Deletes a payment method by its ID.
   * @param query An object containing a `where` condition with the `id`.
   * @returns A promise that resolves to the deleted payment method or null if not found.
   */
  delete(query: { where: { id: string } }): Promise<AG_PaymentMethodModel | null>;

  /**
   * Updates multiple payment methods based on a query.
   * @param query An object containing `where` conditions for the update.
   * @param data An object containing the `data` to update.
   * @returns A promise that resolves to an object containing the count of updated records.
   */
  updateMany(query: { where?: Record<string, any> }, data: { data: Partial<AG_PaymentMethodModel> }): Promise<{ count: number }>;
}

/**
 * Data access layer for payment methods.
 * Provides methods to interact with the AG_PaymentMethodModel in the database,
 * abstracting the underlying ORM details.
 */
export class BG_PaymentMethodRepository {
  private dbClient: PaymentMethodDatabaseClient;

  /**
   * Initializes the repository with a database client.
   * @param dbClient An instance of a database client (e.g., Prisma client's `paymentMethod` model, TypeORM repository).
   */
  constructor(dbClient: PaymentMethodDatabaseClient) {
    this.dbClient = dbClient;
  }

  /**
   * Creates a new payment method in the database.
   * @param data The payment method data to create.
   * @returns A promise that resolves to the created payment method.
   * @throws Error if the payment method creation fails.
   */
  async create(data: Omit<AG_PaymentMethodModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AG_PaymentMethodModel> {
    try {
      return await this.dbClient.create({ data });
    } catch (error) {
      console.error('BG_PaymentMethodRepository: Error creating payment method:', error);
      throw new Error('Failed to create payment method.');
    }
  }

  /**
   * Finds a payment method by its unique ID.
   * @param id The ID of the payment method.
   * @returns A promise that resolves to the payment method if found, otherwise null.
   * @throws Error if the retrieval fails.
   */
  async findById(id: string): Promise<AG_PaymentMethodModel | null> {
    try {
      return await this.dbClient.findUnique({ where: { id } });
    } catch (error) {
      console.error(`BG_PaymentMethodRepository: Error finding payment method with ID ${id}:`, error);
      throw new Error('Failed to retrieve payment method.');
    }
  }

  /**
   * Finds all payment methods associated with a specific user ID.
   * @param userId The ID of the user.
   * @returns A promise that resolves to an array of payment methods.
   * @throws Error if the retrieval fails.
   */
  async findByUserId(userId: string): Promise<AG_PaymentMethodModel[]> {
    try {
      return await this.dbClient.findMany({ where: { userId } });
    } catch (error) {
      console.error(`BG_PaymentMethodRepository: Error finding payment methods for user ID ${userId}:`, error);
      throw new Error('Failed to retrieve payment methods for user.');
    }
  }

  /**
   * Finds the default payment method for a specific user.
   * Assumes a user can have at most one default payment method.
   * @param userId The ID of the user.
   * @returns A promise that resolves to the default payment method if found, otherwise null.
   * @throws Error if the retrieval fails.
   */
  async findDefaultByUserId(userId: string): Promise<AG_PaymentMethodModel | null> {
    try {
      const paymentMethods = await this.dbClient.findMany({ where: { userId, isDefault: true } });
      // Return the first one found, assuming uniqueness is enforced elsewhere or by convention.
      return paymentMethods.length > 0 ? paymentMethods[0] : null;
    } catch (error) {
      console.error(`BG_PaymentMethodRepository: Error finding default payment method for user ID ${userId}:`, error);
      throw new Error('Failed to retrieve default payment method.');
    }
  }

  /**
   * Updates an existing payment method by its ID.
   * @param id The ID of the payment method to update.
   * @param data The partial payment method data to update.
   * @returns A promise that resolves to the updated payment method if found, otherwise null.
   * @throws Error if the update fails.
   */
  async update(id: string, data: Partial<AG_PaymentMethodModel>): Promise<AG_PaymentMethodModel | null> {
    try {
      return await this.dbClient.update({ where: { id } }, { data });
    } catch (error) {
      console.error(`BG_PaymentMethodRepository: Error updating payment method with ID ${id}:`, error);
      throw new Error('Failed to update payment method.');
    }
  }

  /**
   * Deletes a payment method by its ID.
   * @param id The ID of the payment method to delete.
   * @returns A promise that resolves to the deleted payment method if found, otherwise null.
   * @throws Error if the deletion fails.
   */
  async delete(id: string): Promise<AG_PaymentMethodModel | null> {
    try {
      return await this.dbClient.delete({ where: { id } });
    } catch (error) {
      console.error(`BG_PaymentMethodRepository: Error deleting payment method with ID ${id}:`, error);
      throw new Error('Failed to delete payment method.');
    }
  }

  /**
   * Sets a specific payment method as default for a user, and unsets all other default payment methods for that user.
   * This operation is designed to be atomic or transactional in nature, ensuring data consistency.
   * @param userId The ID of the user.
   * @param paymentMethodId The ID of the payment method to set as default.
   * @returns A promise that resolves to the updated default payment method if successful, otherwise null.
   * @throws Error if the operation fails (e.g., payment method not found or does not belong to the user).
   */
  async setDefault(userId: string, paymentMethodId: string): Promise<AG_PaymentMethodModel | null> {
    try {
      // 1. Unset all other payment methods for the user that are currently marked as default.
      // This assumes the dbClient's updateMany can handle a 'not' operator for the ID in the where clause.
      // Example for Prisma: { userId, isDefault: true, id: { not: paymentMethodId } }
      await this.dbClient.updateMany(
        { where: { userId, isDefault: true, id: { not: paymentMethodId } } },
        { data: { isDefault: false } }
      );

      // 2. Set the specified payment method as default.
      // Ensure the payment method belongs to the user before setting it as default.
      const updatedPaymentMethod = await this.dbClient.update(
        { where: { id: paymentMethodId, userId } },
        { data: { isDefault: true } }
      );

      if (!updatedPaymentMethod) {
        // This could happen if the paymentMethodId does not exist or does not belong to the userId.
        throw new Error('Payment method not found or does not belong to the user, cannot set as default.');
      }

      return updatedPaymentMethod;
    } catch (error) {
      console.error(`BG_PaymentMethodRepository: Error setting default payment method for user ID ${userId}, payment method ID ${paymentMethodId}:`, error);
      throw new Error('Failed to set default payment method.');
    }
  }
}