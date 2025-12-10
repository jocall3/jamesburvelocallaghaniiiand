import {
  ExpectedPayment,
  CreateExpectedPaymentDto,
  UpdateExpectedPaymentDto,
} from '../types/expectedPayment';
import { IExpectedPaymentsRepository } from '../repositories/expectedPaymentsRepository';
import { NotFoundError, ValidationError } from '../utils/errors';

/**
 * Service class for managing expected payments.
 * It encapsulates the business logic for creating, retrieving, updating, and deleting expected payments.
 * This service interacts with the `IExpectedPaymentsRepository` to perform data operations.
 */
export class ExpectedPaymentsService {
  private repository: IExpectedPaymentsRepository;

  /**
   * Constructs an instance of ExpectedPaymentsService.
   * @param repository An implementation of IExpectedPaymentsRepository to interact with the data store.
   */
  constructor(repository: IExpectedPaymentsRepository) {
    this.repository = repository;
  }

  /**
   * Creates a new expected payment.
   * @param createDto The data transfer object containing details for the new expected payment.
   * @returns A promise that resolves to the newly created ExpectedPayment object.
   * @throws {ValidationError} If the input DTO is invalid (e.g., amount is negative, dueDate is in the past).
   */
  public async createExpectedPayment(createDto: CreateExpectedPaymentDto): Promise<ExpectedPayment> {
    // Basic validation
    if (createDto.amount <= 0) {
      throw new ValidationError('Amount must be a positive number.');
    }
    if (new Date(createDto.dueDate) < new Date()) {
      // Allow due dates in the past if it's for historical data, but generally,
      // expected payments are for future or current periods. Adjust as per business rule.
      // For now, let's assume it can be in the past for historical tracking.
      // If strictly future, uncomment: throw new ValidationError('Due date cannot be in the past.');
    }
    if (!createDto.currency || createDto.currency.length !== 3) {
      throw new ValidationError('Currency must be a 3-letter ISO code.');
    }

    // Add default status if not provided, or ensure it's valid
    const paymentToCreate = {
      ...createDto,
      status: createDto.status || 'pending', // Default to 'pending'
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.repository.create(paymentToCreate);
  }

  /**
   * Retrieves an expected payment by its unique identifier.
   * @param id The unique identifier of the expected payment.
   * @returns A promise that resolves to the ExpectedPayment object, or null if not found.
   */
  public async getExpectedPaymentById(id: string): Promise<ExpectedPayment | null> {
    return this.repository.findById(id);
  }

  /**
   * Retrieves all expected payments.
   * @returns A promise that resolves to an array of ExpectedPayment objects.
   */
  public async getAllExpectedPayments(): Promise<ExpectedPayment[]> {
    return this.repository.findAll();
  }

  /**
   * Updates an existing expected payment.
   * @param id The unique identifier of the expected payment to update.
   * @param updateDto The data transfer object containing the fields to update.
   * @returns A promise that resolves to the updated ExpectedPayment object, or null if not found.
   * @throws {NotFoundError} If no expected payment with the given ID is found.
   * @throws {ValidationError} If the update DTO contains invalid data (e.g., amount is negative).
   */
  public async updateExpectedPayment(id: string, updateDto: UpdateExpectedPaymentDto): Promise<ExpectedPayment | null> {
    const existingPayment = await this.repository.findById(id);
    if (!existingPayment) {
      throw new NotFoundError(`Expected payment with ID ${id} not found.`);
    }

    // Validation for update fields
    if (updateDto.amount !== undefined && updateDto.amount <= 0) {
      throw new ValidationError('Amount must be a positive number.');
    }
    if (updateDto.currency !== undefined && updateDto.currency.length !== 3) {
      throw new ValidationError('Currency must be a 3-letter ISO code.');
    }
    if (updateDto.status && !['pending', 'paid', 'overdue'].includes(updateDto.status)) {
      throw new ValidationError('Invalid status. Must be one of: pending, paid, overdue.');
    }

    const paymentToUpdate = {
      ...updateDto,
      updatedAt: new Date(),
    };

    return this.repository.update(id, paymentToUpdate);
  }

  /**
   * Deletes an expected payment by its unique identifier.
   * @param id The unique identifier of the expected payment to delete.
   * @returns A promise that resolves to a boolean indicating whether the deletion was successful.
   * @throws {NotFoundError} If no expected payment with the given ID is found.
   */
  public async deleteExpectedPayment(id: string): Promise<boolean> {
    const existingPayment = await this.repository.findById(id);
    if (!existingPayment) {
      throw new NotFoundError(`Expected payment with ID ${id} not found.`);
    }
    return this.repository.delete(id);
  }

  // Potentially add more business logic methods here, e.g.:
  // - `getOverduePayments()`
  // - `getPaymentsByCloudProvider(provider: string)`
  // - `calculateTotalExpectedAmount(currency: string)`
}