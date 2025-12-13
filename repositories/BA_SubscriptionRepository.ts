import { AA_SubscriptionModel } from '../models/AA_SubscriptionModel'; // Assuming this model exists
import { db } from '../utils/db'; // Assuming a database client utility exists

/**
 * Interface for creating a new subscription.
 * Omits fields that are typically auto-generated (like `id`, `createdAt`, `updatedAt`).
 */
export interface CreateSubscriptionDTO {
    userId: string;
    appId: string;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'cancelled' | 'expired' | 'pending';
    price: number;
    currency: string;
    renewalType: 'auto' | 'manual';
}

/**
 * Interface for updating an existing subscription.
 * All fields are optional as only specific fields might be updated.
 */
export interface UpdateSubscriptionDTO {
    startDate?: Date;
    endDate?: Date;
    status?: 'active' | 'cancelled' | 'expired' | 'pending';
    price?: number;
    currency?: string;
    renewalType?: 'auto' | 'manual';
}

/**
 * Data access layer for subscriptions.
 * Provides methods to interact with the AA_SubscriptionModel for CRUD operations and queries.
 */
export class BASubscriptionRepository {

    /**
     * Creates a new subscription record in the database.
     * @param data The data for the new subscription.
     * @returns The newly created subscription model.
     */
    public async create(data: CreateSubscriptionDTO): Promise<AA_SubscriptionModel> {
        try {
            const subscription = await db.subscription.create({
                data: {
                    ...data,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            return subscription as AA_SubscriptionModel;
        } catch (error) {
            console.error('Error creating subscription:', error);
            throw new Error('Failed to create subscription.');
        }
    }

    /**
     * Finds a subscription by its unique ID.
     * @param id The ID of the subscription.
     * @returns The subscription model if found, otherwise null.
     */
    public async findById(id: string): Promise<AA_SubscriptionModel | null> {
        try {
            const subscription = await db.subscription.findUnique({
                where: { id },
            });
            return subscription as AA_SubscriptionModel | null;
        } catch (error) {
            console.error(`Error finding subscription by ID ${id}:`, error);
            throw new Error(`Failed to find subscription by ID ${id}.`);
        }
    }

    /**
     * Finds all subscriptions for a specific user.
     * @param userId The ID of the user.
     * @returns An array of subscription models.
     */
    public async findByUserId(userId: string): Promise<AA_SubscriptionModel[]> {
        try {
            const subscriptions = await db.subscription.findMany({
                where: { userId },
                orderBy: { startDate: 'desc' },
            });
            return subscriptions as AA_SubscriptionModel[];
        } catch (error) {
            console.error(`Error finding subscriptions for user ${userId}:`, error);
            throw new Error(`Failed to find subscriptions for user ${userId}.`);
        }
    }

    /**
     * Finds all subscriptions for a specific app.
     * @param appId The ID of the app.
     * @returns An array of subscription models.
     */
    public async findByAppId(appId: string): Promise<AA_SubscriptionModel[]> {
        try {
            const subscriptions = await db.subscription.findMany({
                where: { appId },
                orderBy: { createdAt: 'desc' },
            });
            return subscriptions as AA_SubscriptionModel[];
        } catch (error) {
            console.error(`Error finding subscriptions for app ${appId}:`, error);
            throw new Error(`Failed to find subscriptions for app ${appId}.`);
        }
    }

    /**
     * Finds all subscriptions, with optional pagination and filtering.
     * @param options An object containing pagination (skip, take) and filtering (status, userId, appId) options.
     * @returns An array of subscription models.
     */
    public async findAll(options?: {
        skip?: number;
        take?: number;
        status?: 'active' | 'cancelled' | 'expired' | 'pending';
        userId?: string;
        appId?: string;
    }): Promise<AA_SubscriptionModel[]> {
        try {
            const where: any = {};
            if (options?.status) {
                where.status = options.status;
            }
            if (options?.userId) {
                where.userId = options.userId;
            }
            if (options?.appId) {
                where.appId = options.appId;
            }

            const subscriptions = await db.subscription.findMany({
                skip: options?.skip,
                take: options?.take,
                where,
                orderBy: { createdAt: 'desc' },
            });
            return subscriptions as AA_SubscriptionModel[];
        } catch (error) {
            console.error('Error finding all subscriptions:', error);
            throw new Error('Failed to find all subscriptions.');
        }
    }

    /**
     * Updates an existing subscription record.
     * @param id The ID of the subscription to update.
     * @param data The data to update.
     * @returns The updated subscription model.
     */
    public async update(id: string, data: UpdateSubscriptionDTO): Promise<AA_SubscriptionModel> {
        try {
            const subscription = await db.subscription.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
            });
            return subscription as AA_SubscriptionModel;
        } catch (error) {
            console.error(`Error updating subscription with ID ${id}:`, error);
            throw new Error(`Failed to update subscription with ID ${id}.`);
        }
    }

    /**
     * Deletes a subscription record by its ID.
     * @param id The ID of the subscription to delete.
     * @returns The deleted subscription model.
     */
    public async delete(id: string): Promise<AA_SubscriptionModel> {
        try {
            const subscription = await db.subscription.delete({
                where: { id },
            });
            return subscription as AA_SubscriptionModel;
        } catch (error) {
            console.error(`Error deleting subscription with ID ${id}:`, error);
            throw new Error(`Failed to delete subscription with ID ${id}.`);
        }
    }

    /**
     * Finds subscriptions that are due to expire before a given date.
     * @param date The date to check against (subscriptions ending before this date).
     * @param status Optional status filter (e.g., 'active').
     * @returns An array of subscription models.
     */
    public async findExpiringBefore(date: Date, status?: 'active' | 'pending'): Promise<AA_SubscriptionModel[]> {
        try {
            const where: any = {
                endDate: {
                    lt: date, // Less than the provided date
                },
            };
            if (status) {
                where.status = status;
            }

            const subscriptions = await db.subscription.findMany({
                where,
                orderBy: { endDate: 'asc' },
            });
            return subscriptions as AA_SubscriptionModel[];
        } catch (error) {
            console.error(`Error finding subscriptions expiring before ${date.toISOString()}:`, error);
            throw new Error(`Failed to find expiring subscriptions.`);
        }
    }

    /**
     * Counts the total number of subscriptions, with optional filtering.
     * @param options An object containing filtering (status, userId, appId) options.
     * @returns The total count of subscriptions.
     */
    public async count(options?: {
        status?: 'active' | 'cancelled' | 'expired' | 'pending';
        userId?: string;
        appId?: string;
    }): Promise<number> {
        try {
            const where: any = {};
            if (options?.status) {
                where.status = options.status;
            }
            if (options?.userId) {
                where.userId = options.userId;
            }
            if (options?.appId) {
                where.appId = options.appId;
            }

            const count = await db.subscription.count({
                where,
            });
            return count;
        } catch (error) {
            console.error('Error counting subscriptions:', error);
            throw new Error('Failed to count subscriptions.');
        }
    }
}