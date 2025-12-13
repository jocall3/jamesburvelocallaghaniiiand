import { PaymentMethod, PaymentMethodStatus, PaymentMethodType, BillingDetails } from '../models/CG_PaymentMethod';
import { User } from '../models/CG_User'; // Assuming a User model exists
import { IPaymentGatewayService, GatewayPaymentMethod } from './CG_PaymentGatewayService'; // Interface for gateway interaction
import { IPaymentMethodRepository } from '../repositories/CG_PaymentMethodRepository'; // Interface for DB interaction
import { IEventEmitterService } from './CG_EventEmitterService'; // Interface for event emission
import { logger } from '../utils/logger'; // Simple logger utility
import { CustomError } from '../utils/errors'; // Custom error class for structured errors

// Define specific application event names for AE18, AE49-53
export const PaymentServiceEvents = {
    PAYMENT_METHOD_CREATED: 'paymentMethod.created', // Part of AE18
    PAYMENT_METHOD_UPDATED: 'paymentMethod.updated', // Part of AE18
    PAYMENT_METHOD_DELETED: 'paymentMethod.deleted', // Part of AE18
    PAYMENT_METHOD_RETRIEVED_SUCCESS: 'paymentMethod.retrieved.success', // AE49
    PAYMENT_METHOD_RETRIEVED_FAILURE: 'paymentMethod.retrieved.failure', // AE50
    PAYMENT_METHOD_UPDATE_SUCCESS: 'paymentMethod.update.success', // AE51
    PAYMENT_METHOD_UPDATE_FAILURE: 'paymentMethod.update.failure', // AE52
    PAYMENT_METHOD_DEFAULT_SET: 'paymentMethod.default.set', // AE53
};

/**
 * CG_PaymentService handles business logic for payment method management.
 * This includes adding, updating, retrieving, setting default, and deleting payment methods.
 * It integrates with a payment gateway and emits application events for key actions.
 * Implements AE18, AE49-53.
 */
export class CG_PaymentService {
    private paymentGatewayService: IPaymentGatewayService;
    private paymentMethodRepository: IPaymentMethodRepository;
    private eventEmitter: IEventEmitterService;

    /**
     * Constructs a new CG_PaymentService instance.
     * @param paymentGatewayService An implementation of IPaymentGatewayService for gateway interactions.
     * @param paymentMethodRepository An implementation of IPaymentMethodRepository for database persistence.
     * @param eventEmitter An implementation of IEventEmitterService for emitting application events.
     */
    constructor(
        paymentGatewayService: IPaymentGatewayService,
        paymentMethodRepository: IPaymentMethodRepository,
        eventEmitter: IEventEmitterService
    ) {
        this.paymentGatewayService = paymentGatewayService;
        this.paymentMethodRepository = paymentMethodRepository;
        this.eventEmitter = eventEmitter;
    }

    /**
     * Adds a new payment method for a user.
     * This involves tokenizing/verifying with the payment gateway and storing details locally.
     * If `isDefault` is true, it will also set this new method as the user's default.
     *
     * @param userId The ID of the user.
     * @param paymentToken A token representing the payment method (e.g., Stripe token, PayPal billing agreement ID).
     * @param type The type of payment method (e.g., 'credit_card', 'paypal').
     * @param details Additional details for the payment method (e.g., last4, brand, expiry_month, expiry_year, billingDetails).
     * @param isDefault Whether this should be set as the default payment method. Defaults to false.
     * @returns The newly created PaymentMethod object.
     * @throws CustomError if the operation fails.
     * @emits PAYMENT_METHOD_CREATED (AE18)
     * @emits PAYMENT_METHOD_DEFAULT_SET (AE53) if `isDefault` is true.
     */
    public async addPaymentMethod(
        userId: string,
        paymentToken: string,
        type: PaymentMethodType,
        details: Partial<PaymentMethod>,
        isDefault: boolean = false
    ): Promise<PaymentMethod> {
        logger.info(`Attempting to add payment method for user ${userId} with type ${type}.`);
        try {
            // 1. Interact with payment gateway to create/verify the payment method
            // This step typically involves exchanging a client-side token for a permanent payment method ID on the gateway.
            const gatewayPaymentMethod: GatewayPaymentMethod = await this.paymentGatewayService.createPaymentMethod(
                userId,
                paymentToken,
                type,
                details
            );

            // 2. Store the payment method in our database
            const newPaymentMethod: PaymentMethod = {
                id: gatewayPaymentMethod.id, // Using gateway's ID as our primary ID for simplicity
                userId: userId,
                type: type,
                status: PaymentMethodStatus.ACTIVE,
                isDefault: isDefault, // Will be updated if setDefaultPaymentMethod is called
                last4: details.last4 || gatewayPaymentMethod.last4,
                brand: details.brand || gatewayPaymentMethod.brand,
                expiryMonth: details.expiryMonth || gatewayPaymentMethod.expiryMonth,
                expiryYear: details.expiryYear || gatewayPaymentMethod.expiryYear,
                billingDetails: details.billingDetails || gatewayPaymentMethod.billingDetails,
                gatewayCustomerId: gatewayPaymentMethod.gatewayCustomerId,
                gatewayPaymentMethodId: gatewayPaymentMethod.gatewayPaymentMethodId,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const createdMethod = await this.paymentMethodRepository.create(newPaymentMethod);

            // 3. If it's meant to be default, update other methods and set this one as default
            if (isDefault) {
                await this.setDefaultPaymentMethod(userId, createdMethod.id);
                // The createdMethod object might not reflect the `isDefault: true` change immediately
                // if setDefaultPaymentMethod updates the DB directly. Re-fetch or update locally.
                createdMethod.isDefault = true;
            }

            this.eventEmitter.emit(PaymentServiceEvents.PAYMENT_METHOD_CREATED, { userId, paymentMethodId: createdMethod.id, type: createdMethod.type });
            logger.info(`Payment method ${createdMethod.id} added successfully for user ${userId}.`);
            return createdMethod;
        } catch (error: any) {
            logger.error(`Failed to add payment method for user ${userId}: ${error.message}`, error);
            throw new CustomError('Failed to add payment method.', error.statusCode || 500, 'PAYMENT_ADD_FAILED', error);
        }
    }

    /**
     * Updates an existing payment method for a user.
     * This might involve updating details on the gateway (e.g., billing address, expiry date)
     * and then reflecting those changes in the local database.
     * Note: Card numbers typically cannot be updated; a new payment method must be added.
     *
     * @param userId The ID of the user.
     * @param paymentMethodId The ID of the payment method to update.
     * @param updates Partial updates for the payment method.
     * @returns The updated PaymentMethod object.
     * @throws CustomError if the operation fails or method not found.
     * @emits PAYMENT_METHOD_UPDATE_SUCCESS (AE51) on success.
     * @emits PAYMENT_METHOD_UPDATE_FAILURE (AE52) on failure.
     * @emits PAYMENT_METHOD_UPDATED (AE18)
     */
    public async updatePaymentMethod(
        userId: string,
        paymentMethodId: string,
        updates: Partial<PaymentMethod>
    ): Promise<PaymentMethod> {
        logger.info(`Attempting to update payment method ${paymentMethodId} for user ${userId}.`);
        try {
            const existingMethod = await this.paymentMethodRepository.findById(paymentMethodId);

            if (!existingMethod || existingMethod.userId !== userId) {
                throw new CustomError('Payment method not found or unauthorized.', 404, 'PAYMENT_METHOD_NOT_FOUND');
            }

            // 1. Update on payment gateway if necessary
            // Only specific fields like billing details or expiry can typically be updated on the gateway.
            const gatewayUpdates: Partial<PaymentMethod> = {};
            if (updates.billingDetails) gatewayUpdates.billingDetails = updates.billingDetails;
            if (updates.expiryMonth) gatewayUpdates.expiryMonth = updates.expiryMonth;
            if (updates.expiryYear) gatewayUpdates.expiryYear = updates.expiryYear;

            if (Object.keys(gatewayUpdates).length > 0) {
                await this.paymentGatewayService.updatePaymentMethod(
                    existingMethod.gatewayCustomerId,
                    existingMethod.gatewayPaymentMethodId,
                    gatewayUpdates
                );
            }

            // 2. Update in our database
            const updatedMethod = await this.paymentMethodRepository.update(paymentMethodId, {
                ...updates,
                updatedAt: new Date(),
            });

            if (!updatedMethod) {
                throw new CustomError('Failed to update payment method in database.', 500, 'DB_UPDATE_FAILED');
            }

            this.eventEmitter.emit(PaymentServiceEvents.PAYMENT_METHOD_UPDATE_SUCCESS, { userId, paymentMethodId: updatedMethod.id });
            this.eventEmitter.emit(PaymentServiceEvents.PAYMENT_METHOD_UPDATED, { userId, paymentMethodId: updatedMethod.id, type: updatedMethod.type });
            logger.info(`Payment method ${paymentMethodId} updated successfully for user ${userId}.`);
            return updatedMethod;
        } catch (error: any) {
            logger.error(`Failed to update payment method ${paymentMethodId} for user ${userId}: ${error.message}`, error);
            this.eventEmitter.emit(PaymentServiceEvents.PAYMENT_METHOD_UPDATE_FAILURE, { userId, paymentMethodId, error: error.message });
            throw new CustomError('Failed to update payment method.', error.statusCode || 500, 'PAYMENT_UPDATE_FAILED', error);
        }
    }

    /**
     * Retrieves all active payment methods for a specific user.
     *
     * @param userId The ID of the user.
     * @returns An array of PaymentMethod objects.
     * @throws CustomError if retrieval fails.
     * @emits PAYMENT_METHOD_RETRIEVED_SUCCESS (AE49) on success.
     * @emits PAYMENT_METHOD_RETRIEVED_FAILURE (AE50) on failure.
     */
    public async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
        logger.info(`Attempting to retrieve payment methods for user ${userId}.`);
        try {
            const methods = await this.paymentMethodRepository.findByUserId(userId);
            this.eventEmitter.emit(PaymentServiceEvents.PAYMENT_METHOD_RETRIEVED_SUCCESS, { userId, count: methods.length });
            logger.info(`Retrieved ${methods.length} payment methods for user ${userId}.`);
            return methods;
        } catch (error: any) {
            logger.error(`Failed to retrieve payment methods for user ${userId}: ${error.message}`, error);
            this.eventEmitter.emit(PaymentServiceEvents.PAYMENT_METHOD_RETRIEVED_FAILURE, { userId, error: error.message });
            throw new CustomError('Failed to retrieve payment methods.', 500, 'PAYMENT_RETRIEVAL_FAILED', error);
        }
    }

    /**
     * Retrieves a specific payment method by its ID for a user.
     *
     * @param userId The ID of the user.
     * @param paymentMethodId The ID of the payment method.
     * @returns The PaymentMethod object.
     * @throws CustomError if the method is not found or unauthorized.
     * @emits PAYMENT_METHOD_RETRIEVED_SUCCESS (AE49) on success.
     * @emits PAYMENT_METHOD_RETRIEVED_FAILURE (AE50) on failure.
     */
    public async getPaymentMethodById(userId: string, paymentMethodId: string): Promise<PaymentMethod> {
        logger.info(`Attempting to retrieve payment method ${paymentMethodId} for user ${userId}.`);
        try {
            const method = await this.paymentMethodRepository.findById(paymentMethodId);

            if (!method || method.userId !== userId) {
                throw new CustomError('Payment method not found or unauthorized.', 404, 'PAYMENT_METHOD_NOT_FOUND');
            }

            this.eventEmitter.emit(PaymentServiceEvents.PAYMENT_METHOD_RETRIEVED_SUCCESS, { userId, paymentMethodId: method.id });
            logger.info(`Retrieved payment method ${paymentMethodId} for user ${userId}.`);
            return method;
        } catch (error: any) {
            logger.error(`Failed to retrieve payment method ${paymentMethodId} for user ${userId}: ${error.message}`, error);
            this.eventEmitter.emit(PaymentServiceEvents.PAYMENT_METHOD_RETRIEVED_FAILURE, { userId, paymentMethodId, error: error.message });
            throw new CustomError('Failed to retrieve payment method.', error.statusCode || 500, 'PAYMENT_RETRIEVAL_FAILED', error);
        }
    }

    /**
     * Sets a specific payment method as the default for a user.
     * This involves unsetting the `isDefault` flag for all other methods of the user
     * and then setting it for the specified method.
     *
     * @param userId The ID of the user.
     * @param paymentMethodId The ID of the payment method to set as default.
     * @returns The updated PaymentMethod object.
     * @throws CustomError if the method is not found, unauthorized, or inactive.
     * @emits PAYMENT_METHOD_DEFAULT_SET (AE53) on success.
     * @emits PAYMENT_METHOD_UPDATED (AE18)
     */
    public async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<PaymentMethod> {
        logger.info(`Attempting to set payment method ${paymentMethodId} as default for user ${userId}.`);
        try {
            const methodToSetDefault = await this.paymentMethodRepository.findById(paymentMethodId);

            if (!methodToSetDefault || methodToSetDefault.userId !== userId) {
                throw new CustomError('Payment method not found or unauthorized.', 404, 'PAYMENT_METHOD_NOT_FOUND');
            }
            if (methodToSetDefault.status !== PaymentMethodStatus.ACTIVE) {
                throw new CustomError('Cannot set an inactive payment method as default.', 400, 'INACTIVE_PAYMENT_METHOD');
            }

            // 1. Unset default for all other methods of this user
            await this.paymentMethodRepository.unsetAllDefaultsForUser(userId, paymentMethodId);

            // 2. Set the specified method as default
            const updatedMethod = await this.paymentMethodRepository.update(paymentMethodId, {
                isDefault: true,
                updatedAt: new Date(),
            });

            if (!updatedMethod) {
                throw new CustomError('Failed to set default payment method in database.', 500, 'DB_UPDATE_FAILED');
            }

            this.eventEmitter.emit(PaymentServiceEvents.PAYMENT_METHOD_DEFAULT_SET, { userId, paymentMethodId: updatedMethod.id });
            this.eventEmitter.emit(PaymentServiceEvents.PAYMENT_METHOD_UPDATED, { userId, paymentMethodId: updatedMethod.id, type: updatedMethod.type }); // Also emit general update event
            logger.info(`Payment method ${paymentMethodId} set as default for user ${userId}.`);
            return updatedMethod;
        } catch (error: any) {
            logger.error(`Failed to set default payment method ${paymentMethodId} for user ${userId}: ${error.message}`, error);
            throw new CustomError('Failed to set default payment method.', error.statusCode || 500, 'SET_DEFAULT_FAILED', error);
        }
    }

    /**
     * Deletes a payment method for a user.
     * This involves removing it from the payment gateway and our local database.
     * If the deleted method was the default, the system might need to automatically
     * assign a new default or prompt the user. (Current implementation does not handle this auto-assignment).
     *
     * @param userId The ID of the user.
     * @param paymentMethodId The ID of the payment method to delete.
     * @throws CustomError if the operation fails or method not found.
     * @emits PAYMENT_METHOD_DELETED (AE18)
     */
    public async deletePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
        logger.info(`Attempting to delete payment method ${paymentMethodId} for user ${userId}.`);
        try {
            const existingMethod = await this.paymentMethodRepository.findById(paymentMethodId);

            if (!existingMethod || existingMethod.userId !== userId) {
                throw new CustomError('Payment method not found or unauthorized.', 404, 'PAYMENT_METHOD_NOT_FOUND');
            }

            // 1. Remove from payment gateway
            await this.paymentGatewayService.deletePaymentMethod(
                existingMethod.gatewayCustomerId,
                existingMethod.gatewayPaymentMethodId
            );

            // 2. Remove from our database
            await this.paymentMethodRepository.delete(paymentMethodId);

            this.eventEmitter.emit(PaymentServiceEvents.PAYMENT_METHOD_DELETED, { userId, paymentMethodId });
            logger.info(`Payment method ${paymentMethodId} deleted successfully for user ${userId}.`);
        } catch (error: any) {
            logger.error(`Failed to delete payment method ${paymentMethodId} for user ${userId}: ${error.message}`, error);
            throw new CustomError('Failed to delete payment method.', error.statusCode || 500, 'PAYMENT_DELETE_FAILED', error);
        }
    }
}