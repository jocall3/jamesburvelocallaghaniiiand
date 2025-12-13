import { Schema, model, Document } from 'mongoose';

/**
 * @interface T_Tenant
 * @description Defines the core structure of a tenant object, representing the data
 *              without Mongoose-specific methods or properties. This is useful for
 *              type safety in services, controllers, or API responses.
 */
export type T_Tenant = {
  _id?: string; // Mongoose's default ID, optional when creating, present when retrieved
  name: string; // The human-readable name of the tenant (e.g., "Acme Corporation")
  slug: string; // A unique, URL-friendly identifier for the tenant (e.g., "acme-corporation")
  status: 'active' | 'inactive' | 'pending' | 'suspended'; // Current operational status of the tenant
  subscriptionPlan: 'free' | 'basic' | 'premium' | 'enterprise'; // The tenant's current subscription tier
  appIds: string[]; // An array of IDs for the individual apps associated with this tenant
  createdAt?: Date; // Timestamp for when the tenant record was created
  updatedAt?: Date; // Timestamp for when the tenant record was last updated
};

/**
 * @interface ITenant
 * @extends T_Tenant, Document
 * @description Extends the T_Tenant interface with Mongoose's Document properties,
 *              providing full type safety when working with Mongoose models and documents.
 */
export interface ITenant extends T_Tenant, Document {
  _id: string; // Mongoose's default ID, always present on a retrieved document
  createdAt: Date; // Mongoose automatically manages this field with `timestamps: true`
  updatedAt: Date; // Mongoose automatically manages this field with `timestamps: true`
}

/**
 * @const TenantSchema
 * @description Defines the Mongoose schema for the Tenant model.
 *              It maps the ITenant interface to a MongoDB collection structure,
 *              including validation rules, default values, and indexing.
 */
const TenantSchema = new Schema<ITenant>({
  name: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true,
    maxlength: [100, 'Tenant name cannot be more than 100 characters'],
  },
  slug: {
    type: String,
    required: [true, 'Tenant slug is required'],
    unique: true, // Ensures each tenant has a unique slug
    trim: true,
    lowercase: true,
    // Regex for URL-friendly slugs: lowercase alphanumeric, hyphens, no leading/trailing hyphens, no double hyphens
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly (lowercase, alphanumeric, hyphens, no leading/trailing/double hyphens)'],
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'pending',
    required: true,
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free',
    required: true,
  },
  appIds: {
    type: [String], // An array of strings, typically representing MongoDB ObjectIDs of associated apps
    default: [],
  },
}, {
  timestamps: true, // Mongoose automatically adds `createdAt` and `updatedAt` fields
  collection: 'tenants', // Explicitly names the MongoDB collection
});

// Add an index to the slug field for efficient querying and to enforce uniqueness at the database level
TenantSchema.index({ slug: 1 }, { unique: true });

/**
 * @const AN_TenantModel
 * @description The Mongoose model for the Tenant. This model provides an interface
 *              for interacting with the 'tenants' collection in MongoDB, allowing
 *              for CRUD operations and schema validation.
 */
const AN_TenantModel = model<ITenant>('Tenant', TenantSchema);

export default AN_TenantModel;