import { Schema, model } from 'mongoose';

/**
 * @interface N_SubscriptionSchedule
 * @description Defines the structure for a subscription schedule document.
 * Mongoose will automatically add `_id`, `createdAt`, and `updatedAt` fields.
 */
export interface N_SubscriptionSchedule {
  /**
   * The ID of the main subscription this schedule belongs to.
   * References the 'AK_Subscription' model.
   */
  subscriptionId: Schema.Types.ObjectId;

  /**
   * The ID of the user who owns this subscription schedule.
   * References the 'AK_User' model.
   */
  userId: Schema.Types.ObjectId;

  /**
   * The date when this subscription schedule becomes active.
   */
  startDate: Date;

  /**
   * The date when this subscription schedule is set to end.
   * Optional, for fixed-term subscriptions.
   */
  endDate?: Date;

  /**
   * The frequency of the billing cycle.
   * e.g., 'daily', 'weekly', 'monthly', 'annually'.
   */
  billingCycle: 'daily' | 'weekly' | 'monthly' | 'annually';

  /**
   * The number of billing cycles to wait between charges.
   * e.g., 1 for monthly, 3 for quarterly (if billingCycle is 'month').
   */
  billingCycleInterval: number;

  /**
   * The amount to be charged per billing cycle.
   */
  price: number;

  /**
   * The currency in which the price is denominated (e.g., 'USD', 'EUR').
   */
  currency: string;

  /**
   * The date of the next scheduled billing attempt.
   */
  nextBillingDate: Date;

  /**
   * The current status of the subscription schedule.
   * e.g., 'active', 'paused', 'cancelled', 'pending', 'trialing', 'expired'.
   */
  status: 'active' | 'paused' | 'cancelled' | 'pending' | 'trialing' | 'expired';

  /**
   * The date when any trial period associated with this schedule ends.
   * Optional.
   */
  trialEndDate?: Date;

  /**
   * The date of the last successful billing for this schedule.
   * Optional.
   */
  lastBilledDate?: Date;

  /**
   * The number of consecutive failed payment attempts for this schedule.
   * Resets to 0 upon successful payment.
   */
  failedPaymentAttempts: number;

  /**
   * The reason provided if the subscription schedule was cancelled.
   * Optional.
   */
  cancellationReason?: string;
}

/**
 * @schema AK_SubscriptionScheduleSchema
 * @description Mongoose schema for the Subscription Schedule model.
 */
const AK_SubscriptionScheduleSchema = new Schema<N_SubscriptionSchedule>({
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'AK_Subscription', // Assumes a Mongoose model named 'AK_Subscription' exists
    required: true,
    index: true, // Index for efficient lookups
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'AK_User', // Assumes a Mongoose model named 'AK_User' exists
    required: true,
    index: true, // Index for efficient lookups
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: false,
  },
  billingCycle: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'annually'],
    required: true,
  },
  billingCycleInterval: {
    type: Number,
    required: true,
    min: 1, // Interval must be at least 1
  },
  price: {
    type: Number,
    required: true,
    min: 0, // Price cannot be negative
  },
  currency: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    minlength: 3,
    maxlength: 3, // e.g., USD, EUR
  },
  nextBillingDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'pending', 'trialing', 'expired'],
    required: true,
    default: 'pending', // Default status for a new schedule
  },
  trialEndDate: {
    type: Date,
    required: false,
  },
  lastBilledDate: {
    type: Date,
    required: false,
  },
  failedPaymentAttempts: {
    type: Number,
    required: true,
    default: 0,
    min: 0, // Cannot have negative failed attempts
  },
  cancellationReason: {
    type: String,
    required: false,
    trim: true,
  },
}, {
  timestamps: true, // Mongoose automatically adds `createdAt` and `updatedAt` fields
  collection: 'ak_subscription_schedules', // Explicitly name the MongoDB collection
});

/**
 * @model AK_SubscriptionScheduleModel
 * @description Mongoose model for interacting with the 'ak_subscription_schedules' collection.
 */
export const AK_SubscriptionScheduleModel = model<N_SubscriptionSchedule>('AK_SubscriptionSchedule', AK_SubscriptionScheduleSchema);

// Export the model as default for easier import
export default AK_SubscriptionScheduleModel;