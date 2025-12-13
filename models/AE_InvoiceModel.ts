import { Schema, model, Document } from 'mongoose';

/**
 * @interface H_InvoiceItem
 * @description Defines the structure for a single line item within an invoice.
 */
export interface H_InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

/**
 * @interface H_Invoice
 * @description Defines the core data structure for an invoice.
 * This interface serves as the blueprint for the invoice document
 * and is mapped to the database schema.
 */
export interface H_Invoice {
    _id?: string; // MongoDB's default primary key, optional as Mongoose adds it
    invoiceNumber: string; // Unique identifier for the invoice (e.g., INV-2023-0001)
    userId: string; // Reference to the user/customer associated with this invoice
    subscriptionId: string; // Reference to the subscription this invoice is for
    issueDate: Date; // The date the invoice was generated
    dueDate: Date; // The date the invoice payment is due
    periodStartDate: Date; // The start date of the billing period covered by this invoice
    periodEndDate: Date; // The end date of the billing period covered by this invoice
    amount: number; // The total amount of the invoice
    currency: string; // The currency of the invoice amount (e.g., 'USD', 'EUR')
    status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded'; // Current status of the invoice
    items: H_InvoiceItem[]; // Array of line items included in the invoice
    paymentMethod?: string; // Optional: Method used for payment (e.g., 'credit_card', 'paypal')
    paymentDate?: Date; // Optional: Date when the payment was received
    transactionId?: string; // Optional: ID from the payment gateway for the transaction
    pdfUrl?: string; // Optional: URL to the generated PDF version of the invoice
    notes?: string; // Optional: Any additional notes for the invoice
    createdAt?: Date; // Timestamp for when the invoice was created (managed by Mongoose)
    updatedAt?: Date; // Timestamp for when the invoice was last updated (managed by Mongoose)
}

/**
 * @interface AE_InvoiceDocument
 * @description Extends the H_Invoice interface with Mongoose's Document properties.
 * This interface represents a Mongoose document instance of an invoice.
 */
export interface AE_InvoiceDocument extends H_Invoice, Document {}

/**
 * @const AE_InvoiceSchema
 * @description Defines the Mongoose schema for the Invoice model.
 * It maps the H_Invoice interface to a MongoDB collection structure,
 * including data types, validation rules, and relationships.
 */
const AE_InvoiceSchema = new Schema<AE_InvoiceDocument>({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true, // Add index for faster lookups
    },
    userId: {
        type: Schema.Types.ObjectId, // Assumes user IDs are MongoDB ObjectIds
        ref: 'AE_User', // Reference to the 'AE_User' model (assuming it exists)
        required: true,
        index: true,
    },
    subscriptionId: {
        type: Schema.Types.ObjectId, // Assumes subscription IDs are MongoDB ObjectIds
        ref: 'AE_Subscription', // Reference to the 'AE_Subscription' model (assuming it exists)
        required: true,
        index: true,
    },
    issueDate: {
        type: Date,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    periodStartDate: {
        type: Date,
        required: true,
    },
    periodEndDate: {
        type: Date,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0, // Amount cannot be negative
    },
    currency: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD'], // Example common currencies
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded'],
        default: 'pending',
        index: true,
    },
    items: [
        {
            description: { type: String, required: true, trim: true },
            quantity: { type: Number, required: true, min: 1 },
            unitPrice: { type: Number, required: true, min: 0 },
            total: { type: Number, required: true, min: 0 },
            _id: false, // Prevent Mongoose from creating an _id for subdocuments
        },
    ],
    paymentMethod: {
        type: String,
        trim: true,
    },
    paymentDate: {
        type: Date,
    },
    transactionId: {
        type: String,
        trim: true,
        index: true, // Index for payment gateway transaction IDs
    },
    pdfUrl: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
    collection: 'invoices', // Explicitly sets the collection name in MongoDB
});

/**
 * @const AE_InvoiceModel
 * @description Mongoose model for invoices.
 * This model provides an interface for interacting with the 'invoices' collection
 * in the database, allowing for CRUD operations and data validation.
 */
const AE_InvoiceModel = model<AE_InvoiceDocument>('AE_Invoice', AE_InvoiceSchema);

export default AE_InvoiceModel;