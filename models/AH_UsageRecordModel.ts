import { Schema, model, Document } from 'mongoose';

/**
 * @interface K_UsageRecord
 * @description Defines the core structure for a usage record.
 * This interface represents the data shape typically used in application logic
 * or when interacting with APIs, where IDs are usually strings.
 */
export interface K_UsageRecord {
  userId: string;             // The ID of the user associated with this usage.
  appId: string;              // The ID of the specific application where the usage occurred.
  subscriptionId: string;     // The ID of the subscription under which this usage is recorded.
  eventType: string;          // A categorical type for the usage event (e.g., 'API_CALL', 'STORAGE_GB').
  value: number;              // The quantitative value of the usage (e.g., 10 for 10 API calls, 0.5 for 0.5 GB).
  unit: string;               // The unit of measurement for the 'value' (e.g., 'count', 'GB', 'units', 'minutes').
  timestamp: Date;            // The exact date and time when the usage event occurred.
  metadata?: Record<string, any>; // Optional: A flexible object to store additional, unstructured details about the usage.
}

/**
 * @interface AH_UsageRecordDocument
 * @extends K_UsageRecord, Document
 * @description Extends the K_UsageRecord interface with Mongoose-specific document properties
 * like `_id`, `createdAt`, `updatedAt`, and Mongoose document methods.
 * This interface is used for type-checking Mongoose query results and document instances.
 */
export interface AH_UsageRecordDocument extends K_UsageRecord, Document {
  _id: Schema.Types.ObjectId; // Mongoose's default primary key, stored as an ObjectId.
  createdAt: Date;            // Timestamp automatically added by Mongoose for document creation.
  updatedAt: Date;            // Timestamp automatically added by Mongoose for document updates.
}

/**
 * @const AH_UsageRecordSchema
 * @description Defines the Mongoose schema for the Usage Record model.
 * It maps the K_UsageRecord interface to a MongoDB collection structure,
 * including data types, validation rules, and indexing strategies.
 */
const AH_UsageRecordSchema = new Schema<AH_UsageRecordDocument>({
  userId: {
    type: Schema.Types.ObjectId, // Stored as MongoDB ObjectId for efficient referencing.
    required: true,
    ref: 'AH_User', // Establishes a reference to the 'AH_User' model.
    index: true,    // Creates a single-field index for fast lookups by user.
  },
  appId: {
    type: Schema.Types.ObjectId, // Stored as MongoDB ObjectId.
    required: true,
    ref: 'AH_App',  // Establishes a reference to the 'AH_App' model.
    index: true,    // Creates a single-field index for fast lookups by application.
  },
  subscriptionId: {
    type: Schema.Types.ObjectId, // Stored as MongoDB ObjectId.
    required: true,
    ref: 'AH_Subscription', // Establishes a reference to the 'AH_Subscription' model.
    index: true,            // Creates a single-field index for fast lookups by subscription.
  },
  eventType: {
    type: String,
    required: true,
    trim: true, // Removes whitespace from both ends of a string.
    enum: [     // Restricts the eventType to a predefined set of values for consistency.
      'API_CALL',
      'STORAGE_GB',
      'COMPUTE_UNIT',
      'DATA_TRANSFER_GB',
      'FEATURE_ACCESS',
      'EMAIL_SENT',
      'SMS_SENT',
      'CUSTOM_EVENT', // Generic event type for custom tracking.
    ],
    description: 'Categorical type of the usage event.',
  },
  value: {
    type: Number,
    required: true,
    min: 0, // Ensures usage values are non-negative.
    description: 'The quantitative value of the usage.',
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    description: 'The unit of measurement for the usage value.',
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now, // Sets the default value to the current time if not provided.
    index: true,       // Creates a single-field index for time-based queries.
    description: 'The exact date and time when the usage event occurred.',
  },
  metadata: {
    type: Schema.Types.Mixed, // Allows for flexible, unstructured data (JSON-like object).
    required: false,          // Metadata is optional.
    description: 'Optional: Additional context or details about the usage event.',
  },
}, {
  timestamps: true, // Mongoose automatically adds `createdAt` and `updatedAt` fields.
  collection: 'ah_usage_records', // Explicitly names the MongoDB collection for this model.
  minimize: false, // Prevents Mongoose from removing empty objects from the document.
});

// --- Schema Indexes for Performance Optimization ---
// Indexes are crucial for efficient querying, especially with large datasets.

// 1. Compound index for querying usage by user and app, ordered by most recent.
//    Useful for dashboards showing a user's usage across a specific app.
AH_UsageRecordSchema.index({ userId: 1, appId: 1, timestamp: -1 });

// 2. Compound index for querying usage related to a specific subscription, ordered by most recent.
//    Essential for billing and subscription usage tracking.
AH_UsageRecordSchema.index({ subscriptionId: 1, timestamp: -1 });

// 3. Compound index for querying usage by app and event type, ordered by most recent.
//    Helpful for analyzing specific types of usage across an application.
AH_UsageRecordSchema.index({ appId: 1, eventType: 1, timestamp: -1 });

/**
 * @const AH_UsageRecordModel
 * @description The Mongoose model for Usage Records.
 * This model provides an interface for interacting with the 'ah_usage_records' collection
 * in MongoDB, allowing for CRUD operations and data validation.
 */
const AH_UsageRecordModel = model<AH_UsageRecordDocument>('AH_UsageRecord', AH_UsageRecordSchema);

export default AH_UsageRecordModel;