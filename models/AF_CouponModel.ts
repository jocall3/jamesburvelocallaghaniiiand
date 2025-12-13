import { Schema, model, Document } from 'mongoose';

/**
 * @interface I_Coupon
 * @description Defines the structure for a coupon document.
 */
export interface I_Coupon {
  /** The unique code for the coupon (e.g., "SAVE10"). */
  code: string;
  /** An optional description for the coupon. */
  description?: string;
  /** The type of discount: 'percentage' or 'fixed_amount'. */
  discountType: 'percentage' | 'fixed_amount';
  /** The value of the discount (e.g., 10 for 10% or $10). */
  discountValue: number;
  /** Optional: The minimum purchase amount required for the coupon to be valid. */
  minimumPurchaseAmount?: number;
  /** Optional: The date when the coupon expires. */
  expirationDate?: Date;
  /** Optional: The total number of times this coupon can be used across all users. */
  usageLimit?: number;
  /** The current count of how many times this coupon has been used. */
  usedCount: number;
  /** Optional: The maximum number of times a single user can use this coupon. */
  perUserUsageLimit?: number;
  /** Indicates whether the coupon is currently active. */
  isActive: boolean;
  /** Optional: The ID of the specific individual app this coupon applies to. */
  appId?: string;
  /** Optional: An array of subscription plan IDs that this coupon is applicable for. */
  applicableSubscriptionPlans?: string[];
  /** Automatically added by Mongoose: The date when the coupon was created. */
  createdAt?: Date;
  /** Automatically added by Mongoose: The date when the coupon was last updated. */
  updatedAt?: Date;
}

/**
 * @interface I_CouponDocument
 * @description Extends I_Coupon with Mongoose's Document properties, including _id.
 */
export interface I_CouponDocument extends I_Coupon, Document {}

/**
 * @const AF_CouponSchema
 * @description Defines the Mongoose schema for the Coupon model.
 */
const AF_CouponSchema = new Schema<I_CouponDocument>({
  code: {
    type: String,
    required: [true, 'Coupon code is required.'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true, // Index for efficient lookup by code
  },
  description: {
    type: String,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed_amount'],
    required: [true, 'Discount type is required.'],
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required.'],
    min: [0, 'Discount value cannot be negative.'],
  },
  minimumPurchaseAmount: {
    type: Number,
    min: [0, 'Minimum purchase amount cannot be negative.'],
    default: 0,
  },
  expirationDate: {
    type: Date,
    index: true, // Index for efficient querying of expired coupons
  },
  usageLimit: {
    type: Number,
    min: [1, 'Usage limit must be at least 1.'],
  },
  usedCount: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Used count cannot be negative.'],
  },
  perUserUsageLimit: {
    type: Number,
    min: [1, 'Per user usage limit must be at least 1.'],
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
    index: true, // Index for efficient querying of active coupons
  },
  appId: {
    type: String, // Assuming appId is a string identifier for the individual app
    index: true, // Index for app-specific coupons
  },
  applicableSubscriptionPlans: [{
    type: String, // Assuming plan IDs are string identifiers
  }],
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  collection: 'af_coupons', // Explicitly names the MongoDB collection
});

// Optional: Add a compound index if coupons need to be unique per app
// AF_CouponSchema.index({ appId: 1, code: 1 }, { unique: true, partialFilterExpression: { appId: { $exists: true } } });

/**
 * @const AF_CouponModel
 * @description Mongoose model for coupons, providing an interface to the 'af_coupons' collection.
 */
const AF_CouponModel = model<I_CouponDocument>('AF_Coupon', AF_CouponSchema);

export default AF_CouponModel;