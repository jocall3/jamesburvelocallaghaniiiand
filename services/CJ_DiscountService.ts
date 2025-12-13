interface Discount {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number; // e.g., 10 for 10% or $10
    currency?: string; // Required if type is 'fixed'
    startDate: Date;
    endDate: Date;
    maxUses?: number; // Maximum number of times this discount can be used in total
    currentUses: number; // Current number of times this discount has been used
    isActive: boolean;
    applicableAppIds?: string[]; // Optional: list of app IDs this discount applies to
    applicableUserIds?: string[]; // Optional: list of user IDs this discount applies to
    createdAt: Date;
    updatedAt: Date;
}

interface CreateDiscountInput {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    currency?: string; // Required if type is 'fixed'
    startDate: Date;
    endDate: Date;
    maxUses?: number;
    applicableAppIds?: string[];
    applicableUserIds?: string[];
}

interface UpdateDiscountInput {
    id: string;
    code?: string;
    type?: 'percentage' | 'fixed';
    value?: number;
    currency?: string;
    startDate?: Date;
    endDate?: Date;
    maxUses?: number;
    isActive?: boolean;
    applicableAppIds?: string[];
    applicableUserIds?: string[];
}

// --- Custom Error Classes ---
class DiscountNotFoundError extends Error {
    constructor(message: string = "Discount not found") {
        super(message);
        this.name = "DiscountNotFoundError";
    }
}

class InvalidDiscountInputError extends Error {
    constructor(message: string = "Invalid discount input") {
        super(message);
        this.name = "InvalidDiscountInputError";
    }
}

class DiscountCodeAlreadyExistsError extends Error {
    constructor(message: string = "Discount code already exists") {
        super(message);
        this.name = "DiscountCodeAlreadyExistsError";
    }
}

// --- Mock Data Access Layer (Repository) ---
// In a real application, this would be an interface implemented by a database-specific class.
class MockDiscountRepository {
    private discounts: Map<string, Discount> = new Map();

    async findById(id: string): Promise<Discount | undefined> {
        return this.discounts.get(id);
    }

    async findByCode(code: string): Promise<Discount | undefined> {
        for (const discount of this.discounts.values()) {
            if (discount.code === code) {
                return discount;
            }
        }
        return undefined;
    }

    async save(discount: Discount): Promise<Discount> {
        // Simulate deep copy to prevent external modification of stored object
        const savedDiscount = { ...discount };
        this.discounts.set(savedDiscount.id, savedDiscount);
        return savedDiscount;
    }

    async delete(id: string): Promise<boolean> {
        return this.discounts.delete(id);
    }

    async listAll(): Promise<Discount[]> {
        return Array.from(this.discounts.values());
    }
}

// --- Utility Functions ---
// Simple UUID generator for demonstration purposes.
// In a production environment, use a robust library like 'uuid' or crypto.randomUUID().
const generateUuid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0,
              v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// --- CJ_DiscountService: Business Logic for Discounts ---
export class CJ_DiscountService {
    private discountRepository: MockDiscountRepository; // In a real app, this would be an interface like IDiscountRepository

    constructor(discountRepository: MockDiscountRepository) {
        this.discountRepository = discountRepository;
    }

    /**
     * AE31: Creates a new discount.
     * @param input - The data for the new discount.
     * @returns The created discount object.
     * @throws InvalidDiscountInputError if input is invalid.
     * @throws DiscountCodeAlreadyExistsError if a discount with the same code already exists.
     */
    async createDiscount(input: CreateDiscountInput): Promise<Discount> {
        this.validateCreateInput(input);

        const existingDiscount = await this.discountRepository.findByCode(input.code);
        if (existingDiscount) {
            throw new DiscountCodeAlreadyExistsError(`Discount with code '${input.code}' already exists.`);
        }

        const now = new Date();
        const newDiscount: Discount = {
            id: generateUuid(),
            code: input.code,
            type: input.type,
            value: input.value,
            currency: input.type === 'fixed' ? input.currency : undefined,
            startDate: input.startDate,
            endDate: input.endDate,
            maxUses: input.maxUses,
            currentUses: 0, // New discounts start with 0 uses
            isActive: true, // New discounts are active by default
            applicableAppIds: input.applicableAppIds,
            applicableUserIds: input.applicableUserIds,
            createdAt: now,
            updatedAt: now,
        };

        return this.discountRepository.save(newDiscount);
    }

    /**
     * AE32: Updates an existing discount.
     * @param input - The data to update the discount.
     * @returns The updated discount object.
     * @throws InvalidDiscountInputError if input is invalid.
     * @throws DiscountNotFoundError if the discount to update does not exist.
     * @throws DiscountCodeAlreadyExistsError if the new code already exists for another discount.
     */
    async updateDiscount(input: UpdateDiscountInput): Promise<Discount> {
        this.validateUpdateInput(input);

        const existingDiscount = await this.discountRepository.findById(input.id);
        if (!existingDiscount) {
            throw new DiscountNotFoundError(`Discount with ID '${input.id}' not found.`);
        }

        // Check if code is being updated and if the new code already exists for another discount
        if (input.code && input.code !== existingDiscount.code) {
            const discountWithNewCode = await this.discountRepository.findByCode(input.code);
            if (discountWithNewCode && discountWithNewCode.id !== input.id) {
                throw new DiscountCodeAlreadyExistsError(`Discount with code '${input.code}' already exists for another discount.`);
            }
        }

        const updatedDiscount: Discount = {
            ...existingDiscount,
            code: input.code ?? existingDiscount.code,
            type: input.type ?? existingDiscount.type,
            value: input.value ?? existingDiscount.value,
            startDate: input.startDate ?? existingDiscount.startDate,
            endDate: input.endDate ?? existingDiscount.endDate,
            maxUses: input.maxUses ?? existingDiscount.maxUses,
            isActive: input.isActive ?? existingDiscount.isActive,
            applicableAppIds: input.applicableAppIds ?? existingDiscount.applicableAppIds,
            applicableUserIds: input.applicableUserIds ?? existingDiscount.applicableUserIds,
            updatedAt: new Date(),
        };

        // Handle currency logic based on type change
        if (updatedDiscount.type === 'fixed') {
            updatedDiscount.currency = input.currency ?? existingDiscount.currency;
            if (!updatedDiscount.currency) {
                throw new InvalidDiscountInputError("Currency is required for fixed-amount discounts.");
            }
        } else { // type is 'percentage'
            updatedDiscount.currency = undefined; // Currency is not applicable for percentage discounts
        }

        // Re-validate dates if they were updated
        if (updatedDiscount.startDate >= updatedDiscount.endDate) {
            throw new InvalidDiscountInputError("Start date must be before end date.");
        }

        return this.discountRepository.save(updatedDiscount);
    }

    /**
     * AE33: Deletes a discount by its ID.
     * @param id - The ID of the discount to delete.
     * @returns True if the discount was deleted, false otherwise.
     * @throws InvalidDiscountInputError if the ID is missing.
     * @throws DiscountNotFoundError if the discount does not exist.
     */
    async deleteDiscount(id: string): Promise<boolean> {
        if (!id) {
            throw new InvalidDiscountInputError("Discount ID is required for deletion.");
        }
        const exists = await this.discountRepository.findById(id);
        if (!exists) {
            throw new DiscountNotFoundError(`Discount with ID '${id}' not found.`);
        }
        return this.discountRepository.delete(id);
    }

    /**
     * Retrieves a single discount by its ID.
     * @param id - The ID of the discount.
     * @returns The discount object.
     * @throws InvalidDiscountInputError if the ID is missing.
     * @throws DiscountNotFoundError if the discount does not exist.
     */
    async getDiscountById(id: string): Promise<Discount> {
        if (!id) {
            throw new InvalidDiscountInputError("Discount ID is required.");
        }
        const discount = await this.discountRepository.findById(id);
        if (!discount) {
            throw new DiscountNotFoundError(`Discount with ID '${id}' not found.`);
        }
        return discount;
    }

    /**
     * Retrieves a list of all discounts.
     * @returns An array of discount objects.
     */
    async listDiscounts(): Promise<Discount[]> {
        return this.discountRepository.listAll();
    }

    /**
     * AE34: Validates if a discount is currently applicable based on various criteria.
     * This method checks the discount's active status, date range, usage limits, and applicability to specific apps/users.
     * It does NOT increment usage count; that would be part of a separate 'apply' or 'redeem' logic.
     * @param discountId - The ID of the discount to validate.
     * @param appId - Optional: The ID of the app for which the discount is being checked.
     * @param userId - Optional: The ID of the user for whom the discount is being checked.
     * @returns True if the discount is currently valid and applicable, false otherwise.
     * @throws DiscountNotFoundError if the discount does not exist.
     */
    async validateDiscountForApplication(discountId: string, appId?: string, userId?: string): Promise<boolean> {
        const discount = await this.getDiscountById(discountId); // Reuses getDiscountById for existence check

        const now = new Date();

        if (!discount.isActive) {
            return false; // Not active
        }
        if (discount.startDate > now || discount.endDate < now) {
            return false; // Outside valid date range
        }
        if (discount.maxUses !== undefined && discount.currentUses >= discount.maxUses) {
            return false; // Usage limit reached
        }
        if (appId && discount.applicableAppIds && !discount.applicableAppIds.includes(appId)) {
            return false; // Not applicable to this app
        }
        if (userId && discount.applicableUserIds && !discount.applicableUserIds.includes(userId)) {
            return false; // Not applicable to this user
        }

        return true;
    }

    /**
     * Increments the usage count for a discount.
     * This method should typically be called after a discount has been successfully applied.
     * @param discountId - The ID of the discount to increment usage for.
     * @returns The updated discount object.
     * @throws DiscountNotFoundError if the discount does not exist.
     * @throws InvalidDiscountInputError if the discount has reached its max uses.
     */
    async incrementDiscountUsage(discountId: string): Promise<Discount> {
        const discount = await this.getDiscountById(discountId);

        if (discount.maxUses !== undefined && discount.currentUses >= discount.maxUses) {
            throw new InvalidDiscountInputError(`Discount '${discount.code}' has reached its maximum uses.`);
        }

        discount.currentUses++;
        discount.updatedAt = new Date();
        return this.discountRepository.save(discount);
    }

    // --- Internal Validation Methods ---
    private validateCreateInput(input: CreateDiscountInput): void {
        if (!input.code || input.code.trim() === '') {
            throw new InvalidDiscountInputError("Discount code is required.");
        }
        if (!['percentage', 'fixed'].includes(input.type)) {
            throw new InvalidDiscountInputError("Discount type must be 'percentage' or 'fixed'.");
        }
        if (input.value <= 0) {
            throw new InvalidDiscountInputError("Discount value must be positive.");
        }
        if (input.type === 'fixed' && (!input.currency || input.currency.trim() === '')) {
            throw new InvalidDiscountInputError("Currency is required for fixed-amount discounts.");
        }
        if (!(input.startDate instanceof Date) || isNaN(input.startDate.getTime())) {
            throw new InvalidDiscountInputError("Valid start date is required.");
        }
        if (!(input.endDate instanceof Date) || isNaN(input.endDate.getTime())) {
            throw new InvalidDiscountInputError("Valid end date is required.");
        }
        if (input.startDate >= input.endDate) {
            throw new InvalidDiscountInputError("Start date must be before end date.");
        }
        if (input.maxUses !== undefined && (input.maxUses < 0 || !Number.isInteger(input.maxUses))) {
            throw new InvalidDiscountInputError("Max uses must be a non-negative integer.");
        }
        if (input.applicableAppIds && (!Array.isArray(input.applicableAppIds) || input.applicableAppIds.some(id => typeof id !== 'string' || id.trim() === ''))) {
            throw new InvalidDiscountInputError("Applicable app IDs must be an array of non-empty strings.");
        }
        if (input.applicableUserIds && (!Array.isArray(input.applicableUserIds) || input.applicableUserIds.some(id => typeof id !== 'string' || id.trim() === ''))) {
            throw new InvalidDiscountInputError("Applicable user IDs must be an array of non-empty strings.");
        }
    }

    private validateUpdateInput(input: UpdateDiscountInput): void {
        if (!input.id || input.id.trim() === '') {
            throw new InvalidDiscountInputError("Discount ID is required for update.");
        }
        if (input.code !== undefined && input.code.trim() === '') {
            throw new InvalidDiscountInputError("Discount code cannot be empty if provided.");
        }
        if (input.type !== undefined && !['percentage', 'fixed'].includes(input.type)) {
            throw new InvalidDiscountInputError("Discount type must be 'percentage' or 'fixed' if provided.");
        }
        if (input.value !== undefined && input.value <= 0) {
            throw new InvalidDiscountInputError("Discount value must be positive if provided.");
        }
        if (input.startDate !== undefined && (!(input.startDate instanceof Date) || isNaN(input.startDate.getTime()))) {
            throw new InvalidDiscountInputError("Valid start date is required for update if provided.");
        }
        if (input.endDate !== undefined && (!(input.endDate instanceof Date) || isNaN(input.endDate.getTime()))) {
            throw new InvalidDiscountInputError("Valid end date is required for update if provided.");
        }
        if (input.maxUses !== undefined && (input.maxUses < 0 || !Number.isInteger(input.maxUses))) {
            throw new InvalidDiscountInputError("Max uses must be a non-negative integer if provided.");
        }
        if (input.applicableAppIds !== undefined && (!Array.isArray(input.applicableAppIds) || input.applicableAppIds.some(id => typeof id !== 'string' || id.trim() === ''))) {
            throw new InvalidDiscountInputError("Applicable app IDs must be an array of non-empty strings if provided.");
        }
        if (input.applicableUserIds !== undefined && (!Array.isArray(input.applicableUserIds) || input.applicableUserIds.some(id => typeof id !== 'string' || id.trim() === ''))) {
            throw new InvalidDiscountInputError("Applicable user IDs must be an array of non-empty strings if provided.");
        }
    }
}