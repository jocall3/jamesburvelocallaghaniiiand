import AJ_DiscountModel, { IDiscount } from '../models/AJ_DiscountModel';
import { Document } from 'mongoose';

/**
 * Data access layer for discounts.
 * Provides methods to interact with the AJ_DiscountModel, encapsulating database operations.
 */
class BJ_DiscountRepository {
    /**
     * Creates a new discount entry in the database.
     * @param discountData The data for the new discount.
     * @returns A promise that resolves to the created discount document.
     * @throws Error if the discount creation fails.
     */
    public async createDiscount(discountData: Partial<IDiscount>): Promise<IDiscount & Document> {
        try {
            const newDiscount = new AJ_DiscountModel(discountData);
            await newDiscount.save();
            return newDiscount;
        } catch (error) {
            console.error('BJ_DiscountRepository: Error creating discount:', error);
            throw new Error('Failed to create discount.');
        }
    }

    /**
     * Retrieves a discount by its unique identifier.
     * @param id The ID of the discount to retrieve.
     * @returns A promise that resolves to the discount document, or null if not found.
     * @throws Error if the database query fails.
     */
    public async findDiscountById(id: string): Promise<(IDiscount & Document) | null> {
        try {
            return await AJ_DiscountModel.findById(id).exec();
        } catch (error) {
            console.error(`BJ_DiscountRepository: Error finding discount by ID ${id}:`, error);
            throw new Error('Failed to find discount by ID.');
        }
    }

    /**
     * Retrieves a discount by its unique code.
     * @param code The unique code of the discount.
     * @returns A promise that resolves to the discount document, or null if not found.
     * @throws Error if the database query fails.
     */
    public async findDiscountByCode(code: string): Promise<(IDiscount & Document) | null> {
        try {
            return await AJ_DiscountModel.findOne({ code }).exec();
        } catch (error) {
            console.error(`BJ_DiscountRepository: Error finding discount by code ${code}:`, error);
            throw new Error('Failed to find discount by code.');
        }
    }

    /**
     * Retrieves all discounts, with optional filtering by active status.
     * @param isActive Optional. If true, only active discounts are returned. If false, only inactive. If undefined, all discounts.
     * @returns A promise that resolves to an array of discount documents.
     * @throws Error if the database query fails.
     */
    public async findAllDiscounts(isActive?: boolean): Promise<(IDiscount & Document)[]> {
        try {
            const query: { isActive?: boolean } = {};
            if (typeof isActive === 'boolean') {
                query.isActive = isActive;
            }
            return await AJ_DiscountModel.find(query).exec();
        } catch (error) {
            console.error('BJ_DiscountRepository: Error finding all discounts:', error);
            throw new Error('Failed to retrieve all discounts.');
        }
    }

    /**
     * Updates an existing discount identified by its ID.
     * @param id The ID of the discount to update.
     * @param updateData The partial data to update the discount with.
     * @returns A promise that resolves to the updated discount document, or null if not found.
     * @throws Error if the update operation fails.
     */
    public async updateDiscount(id: string, updateData: Partial<IDiscount>): Promise<(IDiscount & Document) | null> {
        try {
            // { new: true } returns the document after update
            return await AJ_DiscountModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
        } catch (error) {
            console.error(`BJ_DiscountRepository: Error updating discount with ID ${id}:`, error);
            throw new Error('Failed to update discount.');
        }
    }

    /**
     * Deletes a discount identified by its ID.
     * @param id The ID of the discount to delete.
     * @returns A promise that resolves to the deleted discount document, or null if not found.
     * @throws Error if the delete operation fails.
     */
    public async deleteDiscount(id: string): Promise<(IDiscount & Document) | null> {
        try {
            return await AJ_DiscountModel.findByIdAndDelete(id).exec();
        } catch (error) {
            console.error(`BJ_DiscountRepository: Error deleting discount with ID ${id}:`, error);
            throw new Error('Failed to delete discount.');
        }
    }

    /**
     * Increments the `currentUses` count for a specific discount.
     * This is useful for tracking usage limits on discounts.
     * @param id The ID of the discount to update.
     * @returns A promise that resolves to the updated discount document, or null if not found.
     * @throws Error if the increment operation fails.
     */
    public async incrementDiscountUses(id: string): Promise<(IDiscount & Document) | null> {
        try {
            return await AJ_DiscountModel.findByIdAndUpdate(
                id,
                { $inc: { currentUses: 1 } },
                { new: true }
            ).exec();
        } catch (error) {
            console.error(`BJ_DiscountRepository: Error incrementing uses for discount with ID ${id}:`, error);
            throw new Error('Failed to increment discount uses.');
        }
    }

    /**
     * Finds active and unexpired discounts that are applicable to a given application ID.
     * Discounts can be applicable to 'all' apps, or specifically to an array containing the appId.
     * It also checks if the discount has started, not expired, and has available uses.
     * @param appId The ID of the application for which to find applicable discounts.
     * @returns A promise that resolves to an array of applicable discount documents.
     * @throws Error if the database query fails.
     */
    public async findActiveDiscountsForApp(appId: string): Promise<(IDiscount & Document)[]> {
        try {
            const now = new Date();
            return await AJ_DiscountModel.find({
                isActive: true,
                startDate: { $lte: now }, // Discount must have started
                endDate: { $gte: now },   // Discount must not have expired
                $or: [
                    { applicableTo: 'all' }, // Applicable to all apps
                    { applicableTo: appId }, // Applicable to this specific app (if applicableTo is a string)
                    { applicableTo: { $in: [appId] } } // Applicable to this specific app (if applicableTo is an array of strings)
                ],
                $expr: { $lt: ["$currentUses", "$maxUses"] } // currentUses < maxUses
            }).exec();
        } catch (error) {
            console.error(`BJ_DiscountRepository: Error finding active discounts for app ${appId}:`, error);
            throw new Error('Failed to retrieve active discounts for app.');
        }
    }
}

// Export an instance of the repository for singleton usage throughout the application.
export default new BJ_DiscountRepository();