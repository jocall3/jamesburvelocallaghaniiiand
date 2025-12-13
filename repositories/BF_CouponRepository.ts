export interface AF_CouponModel {
    _id?: string; // Unique identifier for the coupon
    code: string; // The coupon code (e.g., "SAVE10", "FREESHIP")
    discountType: 'percentage' | 'fixed'; // Type of discount
    discountValue: number; // The value of the discount (e.g., 10 for 10% or $10)
    minPurchaseAmount?: number; // Minimum order amount for the coupon to be valid
    maxDiscountAmount?: number; // Maximum discount amount for percentage-based coupons
    usageLimit?: number; // Total number of times this coupon can be used across all users
    usedCount: number; // How many times this coupon has been used
    expirationDate?: Date; // Date when the coupon expires
    isActive: boolean; // Whether the coupon is currently active
    applicableTo?: 'all' | 'specific_products' | 'specific_categories'; // What the coupon applies to
    applicableItems?: string[]; // Array of product IDs or category IDs if applicableTo is not 'all'
    createdAt?: Date; // Timestamp when the coupon was created
    updatedAt?: Date; // Timestamp when the coupon was last updated
}

/**
 * MockCouponDatabase simulates a database client/ORM for AF_CouponModel.
 * In a real application, this would be replaced by an actual database client
 * (e.g., Mongoose Model, Prisma Client, TypeORM Repository).
 */
class MockCouponDatabase {
    private coupons: AF_CouponModel[] = [];
    private nextId = 1;

    constructor() {
        // Seed some initial data for demonstration
        this.coupons.push({
            _id: (this.nextId++).toString(),
            code: 'WELCOME10',
            discountType: 'percentage',
            discountValue: 10,
            minPurchaseAmount: 50,
            usageLimit: 100,
            usedCount: 5,
            expirationDate: new Date(Date.now() + 86400000 * 30), // Expires in 30 days
            isActive: true,
            applicableTo: 'all',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        this.coupons.push({
            _id: (this.nextId++).toString(),
            code: 'FREESHIP',
            discountType: 'fixed',
            discountValue: 0, // Representing free shipping
            minPurchaseAmount: 25,
            usageLimit: 50,
            usedCount: 10,
            expirationDate: new Date(Date.now() + 86400000 * 60), // Expires in 60 days
            isActive: true,
            applicableTo: 'all',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        this.coupons.push({
            _id: (this.nextId++).toString(),
            code: 'EXPIRED20',
            discountType: 'percentage',
            discountValue: 20,
            usageLimit: 10,
            usedCount: 10, // Fully used
            expirationDate: new Date(Date.now() - 86400000), // Expired yesterday
            isActive: false,
            applicableTo: 'all',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    /**
     * Finds coupons matching a partial query.
     * @param query A partial AF_CouponModel object to filter by.
     * @returns A promise resolving to an array of matching coupons.
     */
    async find(query: Partial<AF_CouponModel> = {}): Promise<AF_CouponModel[]> {
        return new Promise(resolve => {
            setTimeout(() => {
                const results = this.coupons.filter(coupon => {
                    for (const key in query) {
                        if (query[key as keyof AF_CouponModel] !== undefined &&
                            coupon[key as keyof AF_CouponModel] !== query[key as keyof AF_CouponModel]) {
                            return false;
                        }
                    }
                    return true;
                });
                // Return a deep copy to prevent external modification of internal state
                resolve(JSON.parse(JSON.stringify(results)));
            }, 50); // Simulate async operation
        });
    }

    /**
     * Finds a single coupon matching a partial query.
     * @param query A partial AF_CouponModel object to filter by.
     * @returns A promise resolving to the found coupon or null.
     */
    async findOne(query: Partial<AF_CouponModel>): Promise<AF_CouponModel | null> {
        return new Promise(resolve => {
            setTimeout(() => {
                const found = this.coupons.find(coupon => {
                    for (const key in query) {
                        if (query[key as keyof AF_CouponModel] !== undefined &&
                            coupon[key as keyof AF_CouponModel] !== query[key as keyof AF_CouponModel]) {
                            return false;
                        }
                    }
                    return true;
                });
                resolve(found ? JSON.parse(JSON.stringify(found)) : null);
            }, 50);
        });
    }

    /**
     * Finds a coupon by its unique ID.
     * @param id The ID of the coupon.
     * @returns A promise resolving to the found coupon or null.
     */
    async findById(id: string): Promise<AF_CouponModel | null> {
        return new Promise(resolve => {
            setTimeout(() => {
                const found = this.coupons.find(coupon => coupon._id === id);
                resolve(found ? JSON.parse(JSON.stringify(found)) : null);
            }, 50);
        });
    }

    /**
     * Creates a new coupon.
     * @param data The data for the new coupon, excluding auto-generated fields.
     * @returns A promise resolving to the newly created coupon.
     */
    async create(data: Omit<AF_CouponModel, '_id' | 'createdAt' | 'updatedAt' | 'usedCount'>): Promise<AF_CouponModel> {
        return new Promise(resolve => {
            setTimeout(() => {
                const newCoupon: AF_CouponModel = {
                    _id: (this.nextId++).toString(),
                    ...data,
                    usedCount: 0, // Initialize usedCount
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.coupons.push(newCoupon);
                resolve(JSON.parse(JSON.stringify(newCoupon)));
            }, 50);
        });
    }

    /**
     * Updates an existing coupon by ID.
     * @param id The ID of the coupon to update.
     * @param updateData The partial data to update.
     * @returns A promise resolving to the updated coupon or null if not found.
     */
    async findByIdAndUpdate(id: string, updateData: Partial<AF_CouponModel>): Promise<AF_CouponModel | null> {
        return new Promise(resolve => {
            setTimeout(() => {
                const index = this.coupons.findIndex(coupon => coupon._id === id);
                if (index === -1) {
                    resolve(null);
                    return;
                }
                this.coupons[index] = {
                    ...this.coupons[index],
                    ...updateData,
                    updatedAt: new Date(),
                };
                resolve(JSON.parse(JSON.stringify(this.coupons[index])));
            }, 50);
        });
    }

    /**
     * Deletes a coupon by its ID.
     * @param id The ID of the coupon to delete.
     * @returns A promise resolving to the deleted coupon or null if not found.
     */
    async findByIdAndDelete(id: string): Promise<AF_CouponModel | null> {
        return new Promise(resolve => {
            setTimeout(() => {
                const index = this.coupons.findIndex(coupon => coupon._id === id);
                if (index === -1) {
                    resolve(null);
                    return;
                }
                const [deletedCoupon] = this.coupons.splice(index, 1);
                resolve(JSON.parse(JSON.stringify(deletedCoupon)));
            }, 50);
        });
    }
}

// In a real application, this would be an actual database client/model instance,
// typically initialized once and imported where needed.
const AF_CouponDB = new MockCouponDatabase();

/**
 * BF_CouponRepository provides a data access layer for coupon-related operations.
 * It abstracts the underlying database interactions for AF_CouponModel.
 */
export class BF_CouponRepository {
    private db: MockCouponDatabase; // Type would be your actual ORM model/client

    /**
     * Initializes the repository with a database client.
     * @param dbClient The database client or ORM model for coupons. Defaults to a mock client.
     */
    constructor(dbClient: MockCouponDatabase = AF_CouponDB) {
        this.db = dbClient;
    }

    /**
     * Creates a new coupon in the database.
     * @param couponData The data for the new coupon.
     * @returns A promise that resolves to the newly created coupon.
     * @throws Error if the coupon creation fails.
     */
    async createCoupon(couponData: Omit<AF_CouponModel, '_id' | 'createdAt' | 'updatedAt' | 'usedCount'>): Promise<AF_CouponModel> {
        try {
            const newCoupon = await this.db.create(couponData);
            return newCoupon;
        } catch (error) {
            console.error('Error creating coupon:', error);
            throw new Error('Failed to create coupon.');
        }
    }

    /**
     * Retrieves a coupon by its unique ID.
     * @param id The ID of the coupon.
     * @returns A promise that resolves to the coupon if found, otherwise null.
     * @throws Error if the retrieval fails.
     */
    async getCouponById(id: string): Promise<AF_CouponModel | null> {
        try {
            const coupon = await this.db.findById(id);
            return coupon;
        } catch (error) {
            console.error(`Error getting coupon by ID ${id}:`, error);
            throw new Error('Failed to retrieve coupon by ID.');
        }
    }

    /**
     * Retrieves a coupon by its code.
     * @param code The code of the coupon.
     * @returns A promise that resolves to the coupon if found, otherwise null.
     * @throws Error if the retrieval fails.
     */
    async getCouponByCode(code: string): Promise<AF_CouponModel | null> {
        try {
            const coupon = await this.db.findOne({ code });
            return coupon;
        } catch (error) {
            console.error(`Error getting coupon by code ${code}:`, error);
            throw new Error('Failed to retrieve coupon by code.');
        }
    }

    /**
     * Retrieves all coupons from the database.
     * @returns A promise that resolves to an array of all coupons.
     * @throws Error if the retrieval fails.
     */
    async getAllCoupons(): Promise<AF_CouponModel[]> {
        try {
            const coupons = await this.db.find({});
            return coupons;
        } catch (error) {
            console.error('Error getting all coupons:', error);
            throw new Error('Failed to retrieve all coupons.');
        }
    }

    /**
     * Updates an existing coupon by its ID.
     * @param id The ID of the coupon to update.
     * @param updateData The partial data to update.
     * @returns A promise that resolves to the updated coupon if found, otherwise null.
     * @throws Error if the update fails.
     */
    async updateCoupon(id: string, updateData: Partial<AF_CouponModel>): Promise<AF_CouponModel | null> {
        try {
            const updatedCoupon = await this.db.findByIdAndUpdate(id, updateData);
            return updatedCoupon;
        } catch (error) {
            console.error(`Error updating coupon with ID ${id}:`, error);
            throw new Error('Failed to update coupon.');
        }
    }

    /**
     * Deletes a coupon by its ID.
     * @param id The ID of the coupon to delete.
     * @returns A promise that resolves to the deleted coupon if found, otherwise null.
     * @throws Error if the deletion fails.
     */
    async deleteCoupon(id: string): Promise<AF_CouponModel | null> {
        try {
            const deletedCoupon = await this.db.findByIdAndDelete(id);
            return deletedCoupon;
        } catch (error) {
            console.error(`Error deleting coupon with ID ${id}:`, error);
            throw new Error('Failed to delete coupon.');
        }
    }

    /**
     * Increments the usage count of a coupon.
     * This method first retrieves the coupon to get its current `usedCount`
     * and then updates it.
     * @param id The ID of the coupon to increment usage for.
     * @returns A promise that resolves to the updated coupon if found, otherwise null.
     * @throws Error if the operation fails.
     */
    async incrementCouponUsage(id: string): Promise<AF_CouponModel | null> {
        try {
            const coupon = await this.db.findById(id);
            if (!coupon) {
                return null;
            }
            const updatedCoupon = await this.db.findByIdAndUpdate(id, { usedCount: (coupon.usedCount || 0) + 1 });
            return updatedCoupon;
        } catch (error) {
            console.error(`Error incrementing usage for coupon with ID ${id}:`, error);
            throw new Error('Failed to increment coupon usage.');
        }
    }

    /**
     * Finds all active and valid coupons based on their expiration date and usage limit.
     * @returns A promise that resolves to an array of active coupons.
     * @throws Error if the retrieval fails.
     */
    async findActiveCoupons(): Promise<AF_CouponModel[]> {
        try {
            const now = new Date();
            const allCoupons = await this.db.find({ isActive: true });
            return allCoupons.filter(coupon =>
                (!coupon.expirationDate || coupon.expirationDate > now) && // Not expired
                (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) // Not fully used
            );
        } catch (error) {
            console.error('Error finding active coupons:', error);
            throw new Error('Failed to find active coupons.');
        }
    }

    /**
     * Validates a coupon for a given purchase amount.
     * Checks for existence, activity status, expiration, usage limit, and minimum purchase amount.
     * @param code The coupon code to validate.
     * @param purchaseAmount The total purchase amount to check against `minPurchaseAmount`.
     * @returns A promise that resolves to the valid coupon if all conditions are met, otherwise null.
     * @throws Error if the validation process encounters a database error.
     */
    async validateCoupon(code: string, purchaseAmount: number): Promise<AF_CouponModel | null> {
        try {
            const coupon = await this.getCouponByCode(code);

            if (!coupon || !coupon.isActive) {
                return null; // Coupon not found or inactive
            }

            const now = new Date();
            if (coupon.expirationDate && coupon.expirationDate < now) {
                return null; // Coupon expired
            }

            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                return null; // Coupon usage limit reached
            }

            if (coupon.minPurchaseAmount && purchaseAmount < coupon.minPurchaseAmount) {
                return null; // Minimum purchase amount not met
            }

            // Additional validation logic can be added here, e.g.,
            // - Check if the coupon is applicable to specific products/categories in the cart.
            // - Check for user-specific usage limits if applicable.

            return coupon;
        } catch (error) {
            console.error(`Error validating coupon ${code}:`, error);
            throw new Error('Failed to validate coupon.');
        }
    }
}