import { Schema, model, Document } from 'mongoose';

/**
 * @interface M_Discount
 * @description Interface for a discount document, representing the core data structure.
 */
export interface M_Discount {
    code: string;
    type: 'percentage' | 'fixed_amount' | 'free_shipping';
    value: number; // e.g., 10 for 10% or 5.00 for $5
    min_purchase_amount?: number; // Optional minimum amount for discount to apply
    max_discount_amount?: number; // Optional max discount value for percentage discounts (null for other types)
    usage_limit?: number; // Total number of times this discount can be used (null for unlimited)
    used_count: number; // How many times this discount has been used
    applies_to?: {
        type: 'all' | 'products' | 'categories';
        ids?: string[]; // Array of product or category IDs if type is not 'all'
    };
    valid_from: Date;
    valid_until?: Date; // Optional end date, if null, it's perpetual
    is_active: boolean;
    created_by?: string; // User ID (ObjectId) who created the discount
    app_id: string; // CRITICAL: The ID of the individual app this discount belongs to
}

/**
 * @interface AJ_DiscountDocument
 * @extends M_Discount, Document
 * @description Mongoose document interface for a discount, including Mongoose-specific properties
 * like `_id`, `createdAt`, and `updatedAt`.
 */
export interface AJ_DiscountDocument extends M_Discount, Document {
    // Mongoose automatically adds _id, createdAt, and updatedAt when `timestamps: true` is set.
}

/**
 * @schema AJ_DiscountSchema
 * @description Mongoose schema definition for the Discount model.
 * It maps the M_Discount interface to a MongoDB collection structure,
 * including validation, default values, and indexing for performance.
 */
const AJ_DiscountSchema = new Schema<AJ_DiscountDocument>({
    code: {
        type: String,
        required: true,
        unique: false, // Not globally unique, but unique per app_id
        trim: true,
        uppercase: true,
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed_amount', 'free_shipping'],
        required: true,
    },
    value: {
        type: Number,
        required: true,
        min: 0,
    },
    min_purchase_amount: {
        type: Number,
        min: 0,
        default: 0,
    },
    max_discount_amount: {
        type: Number,
        min: 0,
        // Custom validator to ensure max_discount_amount is only present for percentage discounts
        validate: {
            validator: function(this: AJ_DiscountDocument, v: number | undefined) {
                if (this.type === 'percentage') {
                    return typeof v === 'number' && v >= 0;
                }
                // For other types, max_discount_amount should be null or undefined
                return v === undefined || v === null;
            },
            message: 'Max discount amount is required for percentage discounts and must be null for other types.',
        },
        default: null, // Default to null if not a percentage discount
    },
    usage_limit: {
        type: Number,
        min: 1,
        default: null, // null means unlimited usage
    },
    used_count: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    applies_to: {
        type: {
            type: String,
            enum: ['all', 'products', 'categories'],
            default: 'all',
        },
        ids: [{
            type: Schema.Types.ObjectId, // Assuming product/category IDs are MongoDB ObjectIds
            ref: 'Product', // Placeholder: could be 'Product' or 'Category' model
        }],
    },
    valid_from: {
        type: Date,
        required: true,
    },
    valid_until: {
        type: Date,
        default: null, // null means the discount is perpetual
    },
    is_active: {
        type: Boolean,
        required: true,
        default: true,
    },
    created_by: {
        type: Schema.Types.ObjectId, // Assuming user IDs are MongoDB ObjectIds
        ref: 'User', // Reference to a User model
        default: null,
    },
    app_id: {
        type: String, // Using string for app_id as it might be a custom identifier, not necessarily an ObjectId
        required: true,
        index: true, // Index for efficient querying by app_id
    },
}, {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
    collection: 'discounts', // Explicitly names the MongoDB collection
});

// Add a compound unique index for `app_id` and `code` to ensure discount codes are unique within each app.
AJ_DiscountSchema.index({ app_id: 1, code: 1 }, { unique: true });

// Add an index for efficient querying of active discounts per app, ordered by validity.
AJ_DiscountSchema.index({ app_id: 1, valid_until: 1, is_active: 1 });

/**
 * @model AJ_DiscountModel
 * @description Mongoose model for discounts, providing an interface to interact with the 'discounts' collection.
 */
const AJ_DiscountModel = model<AJ_DiscountDocument>('Discount', AJ_DiscountSchema);

export default AJ_DiscountModel;