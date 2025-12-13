import { AE_InvoiceModel, AE_InvoiceCreateInput, AE_InvoiceUpdateInput } from '../models/AE_InvoiceModel';

// In a real application, this would be an actual database connection or ORM client.
// For demonstration purposes, we'll simulate an in-memory store.
let invoices: AE_InvoiceModel[] = [];
let nextId = 1;

// Helper to simulate database latency for async operations
const simulateDbLatency = (ms: number = 50): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Data access layer for invoices.
 * Provides methods to interact with the AE_InvoiceModel, performing CRUD operations
 * and specific queries related to invoices.
 */
class BE_InvoiceRepository {

    /**
     * Creates a new invoice record in the database.
     * @param invoiceData The data for the new invoice.
     * @returns A promise that resolves with the newly created AE_InvoiceModel.
     */
    public async createInvoice(invoiceData: AE_InvoiceCreateInput): Promise<AE_InvoiceModel> {
        await simulateDbLatency();
        const now = new Date();
        const newInvoice: AE_InvoiceModel = {
            id: `inv_${nextId++}`, // Simulate unique ID generation
            issueDate: now,
            status: 'pending', // Default status for a new invoice
            createdAt: now,
            updatedAt: now,
            ...invoiceData,
        };
        invoices.push(newInvoice);
        return { ...newInvoice }; // Return a shallow copy to prevent external modification of stored object
    }

    /**
     * Retrieves a single invoice by its unique identifier.
     * @param id The unique ID of the invoice.
     * @returns A promise that resolves with the AE_InvoiceModel if found, otherwise null.
     */
    public async getInvoiceById(id: string): Promise<AE_InvoiceModel | null> {
        await simulateDbLatency();
        const invoice = invoices.find(inv => inv.id === id);
        return invoice ? { ...invoice } : null;
    }

    /**
     * Retrieves all invoices associated with a specific user.
     * @param userId The ID of the user.
     * @returns A promise that resolves with an array of AE_InvoiceModel.
     */
    public async getInvoicesByUserId(userId: string): Promise<AE_InvoiceModel[]> {
        await simulateDbLatency();
        return invoices.filter(inv => inv.userId === userId).map(inv => ({ ...inv }));
    }

    /**
     * Retrieves all invoices associated with a specific application.
     * @param appId The ID of the application.
     * @returns A promise that resolves with an array of AE_InvoiceModel.
     */
    public async getInvoicesByAppId(appId: string): Promise<AE_InvoiceModel[]> {
        await simulateDbLatency();
        return invoices.filter(inv => inv.appId === appId).map(inv => ({ ...inv }));
    }

    /**
     * Updates an existing invoice identified by its ID.
     * @param id The ID of the invoice to update.
     * @param updates An object containing the fields to update.
     * @returns A promise that resolves with the updated AE_InvoiceModel if found, otherwise null.
     */
    public async updateInvoice(id: string, updates: AE_InvoiceUpdateInput): Promise<AE_InvoiceModel | null> {
        await simulateDbLatency();
        const index = invoices.findIndex(inv => inv.id === id);
        if (index === -1) {
            return null;
        }
        invoices[index] = {
            ...invoices[index],
            ...updates,
            updatedAt: new Date(), // Update timestamp on modification
        };
        return { ...invoices[index] };
    }

    /**
     * Deletes an invoice by its unique identifier.
     * @param id The ID of the invoice to delete.
     * @returns A promise that resolves to true if the invoice was successfully deleted, false otherwise.
     */
    public async deleteInvoice(id: string): Promise<boolean> {
        await simulateDbLatency();
        const initialLength = invoices.length;
        invoices = invoices.filter(inv => inv.id !== id);
        return invoices.length < initialLength;
    }

    /**
     * Marks an invoice as 'paid' and sets the `paidDate`.
     * @param id The ID of the invoice to mark as paid.
     * @returns A promise that resolves with the updated AE_InvoiceModel if found, otherwise null.
     */
    public async markInvoiceAsPaid(id: string): Promise<AE_InvoiceModel | null> {
        await simulateDbLatency();
        const index = invoices.findIndex(inv => inv.id === id);
        if (index === -1) {
            return null;
        }
        invoices[index] = {
            ...invoices[index],
            status: 'paid',
            paidDate: new Date(),
            updatedAt: new Date(),
        };
        return { ...invoices[index] };
    }

    /**
     * Retrieves invoices based on their current status.
     * @param status The status to filter invoices by (e.g., 'pending', 'paid', 'overdue').
     * @returns A promise that resolves with an array of AE_InvoiceModel matching the status.
     */
    public async getInvoicesByStatus(status: AE_InvoiceModel['status']): Promise<AE_InvoiceModel[]> {
        await simulateDbLatency();
        return invoices.filter(inv => inv.status === status).map(inv => ({ ...inv }));
    }

    /**
     * Retrieves invoices that are due before a specified date.
     * @param date The cutoff date. Invoices with `dueDate` before this date will be returned.
     * @returns A promise that resolves with an array of AE_InvoiceModel.
     */
    public async getInvoicesDueBefore(date: Date): Promise<AE_InvoiceModel[]> {
        await simulateDbLatency();
        return invoices.filter(inv => inv.dueDate < date).map(inv => ({ ...inv }));
    }

    /**
     * Retrieves invoices for a specific subscription.
     * @param subscriptionId The ID of the subscription.
     * @returns A promise that resolves with an array of AE_InvoiceModel.
     */
    public async getInvoicesBySubscriptionId(subscriptionId: string): Promise<AE_InvoiceModel[]> {
        await simulateDbLatency();
        return invoices.filter(inv => inv.subscriptionId === subscriptionId).map(inv => ({ ...inv }));
    }

    // --- Utility methods for testing/development (not for production use with real DB) ---
    /**
     * Resets the in-memory invoice store.
     * ONLY FOR TESTING/DEVELOPMENT PURPOSES. Do not use with a real database.
     */
    public _resetInvoices(): void {
        invoices = [];
        nextId = 1;
    }

    /**
     * Populates the in-memory store with initial data.
     * ONLY FOR TESTING/DEVELOPMENT PURPOSES. Do not use with a real database.
     * @param data An array of invoice models to add.
     */
    public _populateInvoices(data: AE_InvoiceModel[]): void {
        invoices = [...data];
        // Ensure nextId is higher than any existing ID if IDs are numeric
        const maxId = data.reduce((max, inv) => {
            const numId = parseInt(inv.id.replace('inv_', ''), 10);
            return isNaN(numId) ? max : Math.max(max, numId);
        }, 0);
        nextId = maxId + 1;
    }
}

// Export a singleton instance of the repository
export const invoiceRepository = new BE_InvoiceRepository();