import { Schema, model, Document } from 'mongoose';

/**
 * @interface L_WebhookEvent
 * @description Defines the structure for a webhook event.
 * These events are typically received from external services (e.g., payment gateways)
 * and need to be processed by the application.
 */
export interface L_WebhookEvent {
    /**
     * The type of the webhook event (e.g., 'subscription.created', 'payment.failed').
     */
    eventType: string;
    /**
     * The raw payload received from the webhook source. This is typically a JSON object.
     */
    payload: Record<string, any>;
    /**
     * The timestamp when the webhook event was received by our system.
     */
    receivedAt: Date;
    /**
     * The current processing status of the webhook event.
     * 'pending': Event received, awaiting processing.
     * 'processing': Event is currently being processed.
     * 'completed': Event has been successfully processed.
     * 'failed': Event processing failed after all retries.
     * 'retrying': Event processing failed, but retries are still available.
     */
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
    /**
     * The number of times the system has attempted to process this webhook event.
     */
    retries: number;
    /**
     * The timestamp of the last processing attempt.
     * This field is optional and will be present only after the first attempt.
     */
    lastAttemptAt?: Date;
    /**
     * An optional external identifier provided by the webhook source.
     * Useful for correlating with the source system's records.
     */
    externalId?: string;
    /**
     * An optional error message if processing failed.
     */
    processingError?: string;
    /**
     * The timestamp when the event was successfully processed.
     * This field is optional and will be present only if status is 'completed'.
     */
    processedAt?: Date;
    /**
     * An optional identifier for the specific application or subscription
     * this webhook event pertains to, especially relevant for multi-tenant systems.
     */
    appId?: string;
}

/**
 * @interface AI_WebhookEventDocument
 * @description Extends L_WebhookEvent with Mongoose Document properties.
 */
export interface AI_WebhookEventDocument extends L_WebhookEvent, Document {
    /**
     * Mongoose automatically adds `_id` for each document.
     */
    _id: Schema.Types.ObjectId;
    /**
     * Mongoose automatically adds `createdAt` timestamp.
     */
    createdAt: Date;
    /**
     * Mongoose automatically adds `updatedAt` timestamp.
     */
    updatedAt: Date;
}

/**
 * @const AI_WebhookEventSchema
 * @description Mongoose Schema definition for webhook events.
 * Maps the L_WebhookEvent interface to a MongoDB collection.
 */
const AI_WebhookEventSchema = new Schema<AI_WebhookEventDocument>({
    eventType: {
        type: String,
        required: true,
        index: true, // Index for efficient querying by event type
    },
    payload: {
        type: Schema.Types.Mixed, // Use Mixed for flexible JSON objects
        required: true,
    },
    receivedAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true, // Index for chronological order
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'retrying'],
        required: true,
        default: 'pending',
        index: true, // Index for filtering by processing status
    },
    retries: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    lastAttemptAt: {
        type: Date,
        required: false,
    },
    externalId: {
        type: String,
        required: false,
        index: true, // Index for quick lookup by external ID
    },
    processingError: {
        type: String,
        required: false,
    },
    processedAt: {
        type: Date,
        required: false,
    },
    appId: {
        type: String,
        required: false, // Make required if every webhook must belong to an app
        index: true, // Index for filtering by app
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: 'ai_webhook_events', // Explicitly name the MongoDB collection
});

/**
 * @const AI_WebhookEventModel
 * @description Mongoose Model for webhook events.
 * Provides an interface to interact with the 'ai_webhook_events' collection in MongoDB.
 */
export const AI_WebhookEventModel = model<AI_WebhookEventDocument>('AI_WebhookEvent', AI_WebhookEventSchema);