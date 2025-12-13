import { Schema, model, Document, Types } from 'mongoose';
import { J_PaymentMethod } from '../types/J_PaymentMethod'; // Assuming J_PaymentMethod interface is defined here

/**
 * @interface AG_PaymentMethodDocument
 * @extends Omit<J_PaymentMethod, 'id' | 'userId'>, Document
 *
 * Defines the Mongoose document interface for a Payment Method.
 * It extends the base J_PaymentMethod interface, omitting 'id' (as Mongoose uses '_id')
 * and 'userId' (as Mongoose uses `Types.ObjectId` for references),
 * and adds Mongoose-specific properties like `_id` and `Document` methods.
 */
export interface AG_PaymentMethodDocument extends Omit<J_PaymentMethod, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, Document {
  _id: Types.ObjectId; // Mongoose's internal ID
  userId: Types.ObjectId; // Reference to the User model's _id
  createdAt: Date; // Automatically added by timestamps: true
  updatedAt: Date; // Automatically added by timestamps: true
}

/**
 * @const AG_PaymentMethodSchema
 *
 * Defines the Mongoose schema for the Payment Method model.
 * It maps the properties of the AG_PaymentMethodDocument interface to database types
 * and includes validation, indexing, and transformation logic.
 */
const AG_PaymentMethodSchema = new Schema<AG_PaymentMethodDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'AG_User', // Reference to the User model (assuming 'AG_User' is the name of the User model)
    required: true,
    index: true, // Index for efficient lookup by user
  },
  type: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_account', 'apple_pay', 'google_pay', 'other'], // Extend as needed
    required: true,
  },
  details: {
    // This field is of mixed type to accommodate various payment method details.
    // For production, consider specific sub-schemas or more rigorous validation
    // based on the 'type' field to ensure data integrity.
    type: Schema.Types.Mixed,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  externalPaymentMethodId: {
    type: String,
    required: false, // Not all payment methods might have an external ID (e.g., if manually added)
    index: true, // Useful for linking back to external payment gateways (e.g., Stripe, PayPal)
    sparse: true, // Allows multiple documents to have a null/undefined value for this field
  },
  displayInfo: {
    type: String,
    required: false, // e.g., "Visa **** 1234", "paypal@example.com"
  },
  expiryDate: {
    type: Date,
    required: false, // Relevant for credit cards
  },
}, {
  timestamps: true, // Mongoose automatically adds `createdAt` and `updatedAt` fields
  collection: 'ag_payment_methods', // Explicitly names the MongoDB collection
  toJSON: {
    virtuals: true, // Include virtuals in JSON output
    transform: (doc, ret) => {
      ret.id = ret._id.toString(); // Map Mongoose's _id to 'id' for consistency with J_PaymentMethod
      delete ret._id; // Remove the original _id field
      delete ret.__v; // Remove the Mongoose version key
      // Mongoose usually converts ObjectId to string for referenced fields like userId automatically
      return ret;
    },
  },
  toObject: {
    virtuals: true, // Include virtuals in object output
    transform: (doc, ret) => {
      ret.id = ret._id.toString(); // Map Mongoose's _id to 'id'
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Create a partial unique index to ensure that for a given user,
// there is at most one payment method marked as default.
AG_PaymentMethodSchema.index(
  { userId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

/**
 * @const AG_PaymentMethodModel
 *
 * The Mongoose model for Payment Methods.
 * Use this model to interact with the 'ag_payment_methods' collection in MongoDB.
 */
export const AG_PaymentMethodModel = model<AG_PaymentMethodDocument>('AG_PaymentMethod', AG_PaymentMethodSchema);