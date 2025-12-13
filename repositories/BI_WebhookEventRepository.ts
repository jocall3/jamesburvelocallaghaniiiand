import { AI_WebhookEventModel, IWebhookEvent } from '../models/AI_WebhookEventModel';

/**
 * Data access layer for webhook events.
 * Provides methods to interact with the AI_WebhookEventModel, abstracting database operations.
 */
class BI_WebhookEventRepository {
    /**
     * Creates a new webhook event in the database.
     * @param eventData The data for the new webhook event.
     * @returns A promise that resolves to the created webhook event.
     * @throws Error if the creation fails.
     */
    async createEvent(eventData: Partial<IWebhookEvent>): Promise<IWebhookEvent> {
        try {
            const newEvent = await AI_WebhookEventModel.create(eventData);
            return newEvent;
        } catch (error) {
            console.error('BI_WebhookEventRepository: Error creating webhook event:', error);
            throw new Error('Failed to create webhook event.');
        }
    }

    /**
     * Finds a webhook event by its unique ID.
     * @param id The ID of the webhook event to find.
     * @returns A promise that resolves to the webhook event if found, otherwise null.
     * @throws Error if the database query fails.
     */
    async findEventById(id: string): Promise<IWebhookEvent | null> {
        try {
            const event = await AI_WebhookEventModel.findById(id);
            return event;
        } catch (error) {
            console.error(`BI_WebhookEventRepository: Error finding webhook event with ID ${id}:`, error);
            throw new Error(`Failed to find webhook event with ID ${id}.`);
        }
    }

    /**
     * Updates an existing webhook event by its ID.
     * @param id The ID of the webhook event to update.
     * @param updateData The partial data to update the event with.
     * @returns A promise that resolves to the updated webhook event if found, otherwise null.
     * @throws Error if the update operation fails.
     */
    async updateEvent(id: string, updateData: Partial<IWebhookEvent>): Promise<IWebhookEvent | null> {
        try {
            // Ensure updatedAt is always updated
            const updatedEvent = await AI_WebhookEventModel.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: new Date() },
                { new: true } // Return the updated document
            );
            return updatedEvent;
        } catch (error) {
            console.error(`BI_WebhookEventRepository: Error updating webhook event with ID ${id}:`, error);
            throw new Error(`Failed to update webhook event with ID ${id}.`);
        }
    }

    /**
     * Finds webhook events based on their status.
     * @param status The status to filter events by (e.g., 'pending', 'failed').
     * @param limit Optional limit for the number of events to return.
     * @param skip Optional number of events to skip.
     * @returns A promise that resolves to an array of webhook events.
     * @throws Error if the database query fails.
     */
    async findEventsByStatus(
        status: IWebhookEvent['status'],
        limit?: number,
        skip?: number
    ): Promise<IWebhookEvent[]> {
        try {
            let query = AI_WebhookEventModel.find({ status }).sort({ createdAt: 1 }); // Sort by creation date for consistent processing
            if (skip !== undefined) {
                query = query.skip(skip);
            }
            if (limit !== undefined) {
                query = query.limit(limit);
            }
            const events = await query.exec();
            return events;
        } catch (error) {
            console.error(`BI_WebhookEventRepository: Error finding webhook events with status ${status}:`, error);
            throw new Error(`Failed to find webhook events with status ${status}.`);
        }
    }

    /**
     * Increments the attempt count for a webhook event and updates its status and last attempt time.
     * Optionally sets an error message.
     * @param id The ID of the webhook event.
     * @param newStatus Optional new status to set for the event.
     * @param response Optional response object from the webhook target.
     * @param error Optional error message if the attempt failed.
     * @returns A promise that resolves to the updated webhook event or null if not found.
     * @throws Error if the update operation fails.
     */
    async incrementAttemptsAndSetStatus(
        id: string,
        newStatus?: IWebhookEvent['status'],
        response?: object,
        error?: string
    ): Promise<IWebhookEvent | null> {
        try {
            const update: any = {
                $inc: { attempts: 1 },
                lastAttemptAt: new Date(),
                updatedAt: new Date(),
            };
            if (newStatus) {
                update.status = newStatus;
            }
            if (response) {
                update.response = response;
            }
            if (error) {
                update.error = error;
            }

            const updatedEvent = await AI_WebhookEventModel.findByIdAndUpdate(
                id,
                update,
                { new: true }
            );
            return updatedEvent;
        } catch (err) {
            console.error(`BI_WebhookEventRepository: Error incrementing attempts for webhook event ${id}:`, err);
            throw new Error(`Failed to increment attempts for webhook event ${id}.`);
        }
    }

    /**
     * Deletes a webhook event by its ID.
     * @param id The ID of the webhook event to delete.
     * @returns A promise that resolves to true if the event was deleted, false if not found.
     * @throws Error if the deletion operation fails.
     */
    async deleteEvent(id: string): Promise<boolean> {
        try {
            const result = await AI_WebhookEventModel.findByIdAndDelete(id);
            return result !== null;
        } catch (error) {
            console.error(`BI_WebhookEventRepository: Error deleting webhook event with ID ${id}:`, error);
            throw new Error(`Failed to delete webhook event with ID ${id}.`);
        }
    }

    /**
     * Deletes multiple webhook events based on a provided query.
     * @param query The query object to match events for deletion.
     * @returns A promise that resolves to the number of deleted events.
     * @throws Error if the deletion operation fails.
     */
    async deleteManyEvents(query: object): Promise<number> {
        try {
            const result = await AI_WebhookEventModel.deleteMany(query);
            return result.deletedCount;
        } catch (error) {
            console.error('BI_WebhookEventRepository: Error deleting multiple webhook events:', error);
            throw new Error('Failed to delete multiple webhook events.');
        }
    }
}

// Export an instance of the repository for singleton access
export const biWebhookEventRepository = new BI_WebhookEventRepository();