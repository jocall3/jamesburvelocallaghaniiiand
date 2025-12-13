import { Schema, model, Document } from 'mongoose';

/**
 * @interface F_SubscriptionPlan
 * Defines the structure for a single subscription plan associated with a product.
 */
export interface F_SubscriptionPlan {
    planId: string;   // Unique identifier for the plan (e.g., 'basic_monthly', 'premium_yearly')
    name: string;     // Display name of the plan (e.g., "Basic Monthly", "Premium Yearly")
    description: string; // Detailed description of the plan
    price: number;    // Price per billing interval
    currency: string; // Currency code (e.g., "USD", "EUR")
    interval: 'day' | 'week' | 'month' | 'year'; // Billing interval
    intervalCount?: number; // Number of intervals (e.g., 3 for 'every 3 months', default is 1)
    features: string[]; // List of features included in this plan
    isTrialAvailable: boolean; // Whether a trial period is available for this plan
    trialDays?: number; // Number of trial days if available (default 0 if no trial)
    isActive: boolean; // Whether this plan is currently offered
    metadata?: Record<string, any>; // Flexible object for additional plan-specific data
}

/**
 * Mongoose Schema for Subscription Plans.
 * Used as a subdocument within the ProductSchema.
 */
const SubscriptionPlanSchema = new new Schema<F_SubscriptionPlan>({
    planId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'USD' },
    interval: { type: String, required: true, enum: ['day', 'week', 'month', 'year'] },
    intervalCount: { type: Number, min: 1, default: 1 },
    features: [{ type: String, trim: true }],
    isTrialAvailable: { type: Boolean, required: true, default: false },
    trialDays: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
    metadata: { type: Schema.Types.Mixed },
}, { _id: false }); // Subdocuments typically don't need their own _id unless referenced independently

/**
 * @interface F_Product
 * Defines the core data structure for a product (individual app).
 * This interface represents the data without Mongoose-specific fields like _id, createdAt, updatedAt.
 */
export interface F_Product {
    name: string;
    description: string;
    shortDescription?: string; // A brief description for listings
    iconUrl?: string; // URL to the app's icon image
    bannerUrl?: string; // URL to the app's banner image
    developerId: string; // ID of the developer/user who owns this app
    category: string; // e.g., "Productivity", "Games", "Utilities"
    tags?: string[]; // Keywords for searching/categorization
    status: 'draft' | 'pending_review' | 'published' | 'archived' | 'suspended'; // Current lifecycle status
    version: string; // Current version of the app
    releaseDate?: Date; // Date when the app was first published
    averageRating?: number; // Average user rating (0-5)
    totalRatings?: number; // Total number of ratings received
    downloadsCount?: number; // Total number of times the app has been downloaded/acquired
    isActive: boolean; // Overall availability status of the product
    subscriptionPlans: F_SubscriptionPlan[]; // Array of available subscription plans for this product
    metadata?: Record<string, any>; // Flexible object for additional product-specific data
}

/**
 * @interface IAC_Product
 * Extends F_Product with Mongoose-specific document properties.
 * This is the interface used for Mongoose model instances.
 */
export interface IAC_Product extends F_Product, Document {
    _id: string; // Mongoose's default primary key
    createdAt: Date; // Timestamp for document creation
    updatedAt: Date; // Timestamp for last document update
}

/**
 * Mongoose Schema for Products.
 * Maps the F_Product interface to a MongoDB collection schema.
 */
const ProductSchema = new Schema<IAC_Product>({
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, trim: true, maxlength: 255 },
    iconUrl: { type: String, trim: true },
    bannerUrl: { type: String, trim: true },
    developerId: { type: String, required: true, index: true }, // Index for efficient lookup by developer
    category: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],
    status: {
        type: String,
        enum: ['draft', 'pending_review', 'published', 'archived', 'suspended'],
        required: true,
        default: 'draft'
    },
    version: { type: String, required: true, default: '1.0.0' },
    releaseDate: { type: Date },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalRatings: { type: Number, min: 0, default: 0 },
    downloadsCount: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
    subscriptionPlans: { type: [SubscriptionPlanSchema], default: [] }, // Array of embedded subscription plan documents
    metadata: { type: Schema.Types.Mixed }, // Allows for flexible, unstructured data
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: 'products' // Explicitly names the MongoDB collection
});

// Add a compound index for common queries, e.g., finding all published apps by a developer
ProductSchema.index({ developerId: 1, status: 1 });

/**
 * Mongoose Model for Products.
 * Provides an interface to the 'products' collection in MongoDB.
 */
const AC_ProductModel = model<IAC_Product>('AC_Product', ProductSchema);

export default AC_ProductModel;