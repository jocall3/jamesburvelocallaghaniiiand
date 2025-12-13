import { Schema, model, Document, Types } from 'mongoose';

/**
 * @interface C_Subscription
 * @description Defines the structure for a subscription document in MongoDB.
 *              Extends Mongoose's Document to include Mongoose-specific properties
 *              like `_id`, `createdAt`, and `updatedAt`.
 */
export interface C_Subscription extends Document {
    /**
     * The ID of the user who owns this subscription.
     * References the 'User' model.
     */
    userId: Types.ObjectId;

    /**
     * The ID of the specific application this subscription is for.
     * References the 'App' model (one of the 500 individual apps).
     */
    appId: Types.ObjectId;

    /**
     * The ID of the subscription plan (e.g., 'premium', 'basic').
     * References the 'SubscriptionPlan' model.
     */
    planId: Types.ObjectId;

    /**
     * The date and time when the subscription started.
     */
    startDate: Date;

    /**
     * The date and time when the subscription is expected to end.
     * Optional, for subscriptions with a fixed term.
     */
    endDate?: Date;

    /**
     * The current status of the subscription.
     * Can be 'active', 'cancelled', 'expired', 'pending', or 'trial'.
     */
    status: 'active' | 'cancelled' | 'expired' | 'pending' | 'trial';

    /**
     * Indicates whether the subscription will automatically renew.
     */
    autoRenew: boolean;

    /**
     * The ID of the payment method used for this subscription.
     * References the 'PaymentMethod' model. Optional.
     */
    paymentMethodId?: Types.ObjectId;

    /**
     * The ID of the payment transaction associated with the latest payment.
     * References the 'Transaction' model. Optional.
     */
    transactionId?: Types.ObjectId;

    /**
     * The price paid for the subscription period.
     */
    price: number;

    /**
     * The currency of the subscription price (e.g., 'USD', 'EUR').
     */
    currency: string;

    /**
     * The date of the last successful payment. Optional.
     */
    lastPaymentDate?: Date;

    /**
     * The date of the next scheduled payment. Optional.
     */
    nextPaymentDate?: Date;

    /**
     * The date when the subscription was cancelled. Optional.
     */
    cancellationDate?: Date;

    /**
     * A flexible field for storing additional, unstructured data related to the subscription. Optional.
     */
    metadata?: Record<string, any>;
}

/**
 * @const SubscriptionSchema
 * @description Defines the Mongoose schema for the Subscription model.
 *              It maps the C_Subscription interface to a MongoDB collection structure.
 */
const SubscriptionSchema = new Schema<C_Subscription>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Assumes a 'User' model exists
        required: true,
        index: true // Index for efficient lookup by user
    },
    appId: {
        type: Schema.Types.ObjectId,
        ref: 'App', // Assumes an 'App' model exists for individual applications
        required: true,
        index: true // Index for efficient lookup by app
    },
    planId: {
        type: Schema.Types.ObjectId,
        ref: 'SubscriptionPlan', // Assumes a 'SubscriptionPlan' model exists
        required: true
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: false
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'pending', 'trial'],
        required: true,
        default: 'pending'
    },
    autoRenew: {
        type: Boolean,
        required: true,
        default: false
    },
    paymentMethodId: {
        type: Schema.Types.ObjectId,
        ref: 'PaymentMethod', // Assumes a 'PaymentMethod' model exists
        required: false
    },
    transactionId: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction', // Assumes a 'Transaction' model exists
        required: false
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'USD'
    },
    lastPaymentDate: {
        type: Date,
        required: false
    },
    nextPaymentDate: {
        type: Date,
        required: false
    },
    cancellationDate: {
        type: Date,
        required: false
    },
    metadata: {
        type: Schema.Types.Mixed, // Allows for flexible data structure
        required: false
    }
}, {
    timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

// Add a compound index for efficient lookup of a user's subscriptions to a specific app.
// This index is not unique, allowing a user to have multiple subscriptions to the same app over time
// (e.g., after cancellation and re-subscription, or different plans if application logic permits).
// If only one *active* subscription per user per app is desired, application logic should enforce this,
// or a more complex unique compound index (e.g., on userId, appId, and status where status is 'active')
// could be considered.
SubscriptionSchema.index({ userId: 1, appId: 1 });

/**
 * @const SubscriptionModel
 * @description The Mongoose model for subscriptions, providing an interface to the 'subscriptions' collection.
 */
const SubscriptionModel = model<C_Subscription>('Subscription', SubscriptionSchema);

export default SubscriptionModel;