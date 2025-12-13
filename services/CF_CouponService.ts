export enum CouponType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export interface Coupon {
    id: string;
    code: string;
    type: CouponType;
    value: number; // e.g., 10 for 10% or $10
    minPurchaseAmount?: number;
    maxDiscountAmount?: number; // For percentage coupons, caps the discount
    expiresAt?: Date;
    usageLimit?: number; // Total usage limit across all users
    perUserUsageLimit?: number; // Usage limit per individual user
    isActive: boolean;
    appId?: string; // Optional: coupon specific to an app
    createdAt: Date;
    updatedAt: Date;
}

export interface CouponUsage {
    id: string;
    couponId: string;
    userId: string;
    usedAt: Date;
}

export interface CreateCouponDTO {
    code: string;
    type: CouponType;
    value: number;
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    expiresAt?: Date;
    usageLimit?: number;
    perUserUsageLimit?: number;
    appId?: string;
    isActive?: boolean;
}

export interface UpdateCouponDTO {
    code?: string;
    type?: CouponType;
    value?: number;
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    expiresAt?: Date;
    usageLimit?: number;
    perUserUsageLimit?: number;
    appId?: string;
    isActive?: boolean;
}

export class CouponError extends Error {
    constructor(message: string, public readonly code: string = 'COUPON_ERROR') {
        super(message);
        this.name = 'CouponError';
    }
}

export class CouponNotFoundError extends CouponError {
    constructor(message: string = 'Coupon not found.') {
        super(message, 'COUPON_NOT_FOUND');
    }
}

export class CouponExpiredError extends CouponError {
    constructor(message: string = 'Coupon has expired.') {
        super(message, 'COUPON_EXPIRED');
    }
}

export class CouponInactiveError extends CouponError {
    constructor(message: string = 'Coupon is inactive.') {
        super(message, 'COUPON_INACTIVE');
    }
}

export class CouponUsageLimitExceededError extends CouponError {
    constructor(message: string = 'Coupon usage limit exceeded.') {
        super(message, 'USAGE_LIMIT_EXCEEDED');
    }
}

export class CouponPerUserUsageLimitExceededError extends CouponError {
    constructor(message: string = 'Coupon per-user usage limit exceeded.') {
        super(message, 'PER_USER_USAGE_LIMIT_EXCEEDED');
    }
}

export class CouponMinPurchaseAmountError extends CouponError {
    constructor(message: string = 'Minimum purchase amount not met.') {
        super(message, 'MIN_PURCHASE_AMOUNT_NOT_MET');
    }
}

export class CouponAppMismatchError extends CouponError {
    constructor(message: string = 'Coupon is not valid for this app.') {
        super(message, 'COUPON_APP_MISMATCH');
    }
}

// --- Repository Interface (Abstraction for data access) ---
export interface ICouponRepository {
    findById(id: string): Promise<Coupon | null>;
    findByCode(code: string): Promise<Coupon | null>;
    save(coupon: Coupon): Promise<Coupon>;
    update(id: string, data: Partial<Coupon>): Promise<Coupon | null>;
    delete(id: string): Promise<boolean>;
    getCouponUsageCount(couponId: string): Promise<number>;
    getUserCouponUsageCount(couponId: string, userId: string): Promise<number>;
    createCouponUsage(couponUsage: Omit<CouponUsage, 'id' | 'usedAt'>): Promise<CouponUsage>;
}

// --- Mock Repository Implementation (for demonstration/testing, replace with actual DB integration) ---
class MockCouponRepository implements ICouponRepository {
    private coupons: Map<string, Coupon> = new Map();
    private couponUsages: Map<string, CouponUsage[]> = new Map(); // couponId -> usages

    async findById(id: string): Promise<Coupon | null> {
        return this.coupons.get(id) || null;
    }

    async findByCode(code: string): Promise<Coupon | null> {
        for (const coupon of this.coupons.values()) {
            if (coupon.code === code) {
                return coupon;
            }
        }
        return null;
    }

    async save(coupon: Coupon): Promise<Coupon> {
        const newCoupon = {
            ...coupon,
            id: coupon.id || `coupon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            createdAt: coupon.createdAt || new Date(),
            updatedAt: new Date()
        };
        this.coupons.set(newCoupon.id, newCoupon);
        return newCoupon;
    }

    async update(id: string, data: Partial<Coupon>): Promise<Coupon | null> {
        const existing = this.coupons.get(id);
        if (!existing) {
            return null;
        }
        const updated = { ...existing, ...data, updatedAt: new Date() };
        this.coupons.set(id, updated);
        return updated;
    }

    async delete(id: string): Promise<boolean> {
        return this.coupons.delete(id);
    }

    async getCouponUsageCount(couponId: string): Promise<number> {
        return (this.couponUsages.get(couponId) || []).length;
    }

    async getUserCouponUsageCount(couponId: string, userId: string): Promise<number> {
        return (this.couponUsages.get(couponId) || []).filter(usage => usage.userId === userId).length;
    }

    async createCouponUsage(couponUsage: Omit<CouponUsage, 'id' | 'usedAt'>): Promise<CouponUsage> {
        const newUsage: CouponUsage = {
            ...couponUsage,
            id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            usedAt: new Date(),
        };
        const usages = this.couponUsages.get(couponUsage.couponId) || [];
        usages.push(newUsage);
        this.couponUsages.set(couponUsage.couponId, usages);
        return newUsage;
    }
}

export class CF_CouponService {
    private couponRepository: ICouponRepository;

    constructor(couponRepository: ICouponRepository = new MockCouponRepository()) {
        this.couponRepository = couponRepository;
    }

    /**
     * Creates a new coupon.
     * @param data - The coupon data.
     * @returns The created coupon.
     * @throws CouponError if a coupon with the same code already exists.
     */
    public async createCoupon(data: CreateCouponDTO): Promise<Coupon> {
        const existingCoupon = await this.couponRepository.findByCode(data.code);
        if (existingCoupon) {
            throw new CouponError(`Coupon with code '${data.code}' already exists.`, 'DUPLICATE_COUPON_CODE');
        }

        const newCoupon: Coupon = {
            id: '', // Will be generated by repository
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true, // Default to active if not provided
            ...data,
        };
        return this.couponRepository.save(newCoupon);
    }

    /**
     * Retrieves a coupon by its ID.
     * @param id - The coupon ID.
     * @returns The coupon or null if not found.
     */
    public async getCouponById(id: string): Promise<Coupon | null> {
        return this.couponRepository.findById(id);
    }

    /**
     * Retrieves a coupon by its unique code.
     * @param code - The coupon code.
     * @returns The coupon or null if not found.
     */
    public async getCouponByCode(code: string): Promise<Coupon | null> {
        return this.couponRepository.findByCode(code);
    }

    /**
     * Updates an existing coupon.
     * @param id - The ID of the coupon to update.
     * @param data - The update data.
     * @returns The updated coupon or null if not found.
     * @throws CouponError if a coupon with the new code already exists.
     */
    public async updateCoupon(id: string, data: UpdateCouponDTO): Promise<Coupon | null> {
        const existingCoupon = await this.couponRepository.findById(id);
        if (!existingCoupon) {
            return null;
        }

        // If code is being updated, check for uniqueness against other coupons
        if (data.code && data.code !== existingCoupon.code) {
            const couponWithNewCode = await this.couponRepository.findByCode(data.code);
            if (couponWithNewCode && couponWithNewCode.id !== id) {
                throw new CouponError(`Coupon with code '${data.code}' already exists.`, 'DUPLICATE_COUPON_CODE');
            }
        }

        return this.couponRepository.update(id, data);
    }

    /**
     * Deletes a coupon by its ID.
     * @param id - The coupon ID.
     * @returns True if deleted, false if not found.
     */
    public async deleteCoupon(id: string): Promise<boolean> {
        return this.couponRepository.delete(id);
    }

    /**
     * Validates a coupon against various business rules (AE17).
     * This method checks for coupon existence, activity, expiry, app specificity,
     * minimum purchase amount, and usage limits (global and per-user).
     * @param code - The coupon code.
     * @param userId - The ID of the user attempting to use the coupon.
     * @param appId - The ID of the app the subscription is for.
     * @param currentPrice - The current price of the item/subscription before discount.
     * @returns The validated coupon.
     * @throws CouponError (or specific subclasses) if validation fails.
     */
    public async validateCoupon(code: string, userId: string, appId: string, currentPrice: number): Promise<Coupon> {
        const coupon = await this.couponRepository.findByCode(code);

        if (!coupon) {
            throw new CouponNotFoundError();
        }
        if (!coupon.isActive) {
            throw new CouponInactiveError();
        }
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
            throw new CouponExpiredError();
        }
        if (coupon.appId && coupon.appId !== appId) {
            throw new CouponAppMismatchError();
        }
        if (coupon.minPurchaseAmount !== undefined && currentPrice < coupon.minPurchaseAmount) {
            throw new CouponMinPurchaseAmountError(`Minimum purchase amount for this coupon is $${coupon.minPurchaseAmount}.`);
        }

        // Check global usage limit
        if (coupon.usageLimit !== undefined) {
            const totalUsage = await this.couponRepository.getCouponUsageCount(coupon.id);
            if (totalUsage >= coupon.usageLimit) {
                throw new CouponUsageLimitExceededError();
            }
        }

        // Check per-user usage limit
        if (coupon.perUserUsageLimit !== undefined) {
            const userUsage = await this.couponRepository.getUserCouponUsageCount(coupon.id, userId);
            if (userUsage >= coupon.perUserUsageLimit) {
                throw new CouponPerUserUsageLimitExceededError();
            }
        }

        return coupon;
    }

    /**
     * Calculates the discounted price based on a coupon.
     * @param coupon - The coupon object.
     * @param originalPrice - The original price before discount.
     * @returns The discounted price.
     */
    public calculateDiscountedPrice(coupon: Coupon, originalPrice: number): number {
        let discountAmount = 0;

        if (coupon.type === CouponType.PERCENTAGE) {
            discountAmount = originalPrice * (coupon.value / 100);
            if (coupon.maxDiscountAmount !== undefined && discountAmount > coupon.maxDiscountAmount) {
                discountAmount = coupon.maxDiscountAmount;
            }
        } else if (coupon.type === CouponType.FIXED_AMOUNT) {
            discountAmount = coupon.value;
        }

        const discountedPrice = originalPrice - discountAmount;
        return Math.max(0, discountedPrice); // Ensure price doesn't go below zero
    }

    /**
     * Applies a coupon to a purchase (AE16).
     * This involves validating the coupon, calculating the discount, and marking the coupon as used.
     * @param code - The coupon code.
     * @param userId - The ID of the user.
     * @param appId - The ID of the app.
     * @param originalPrice - The original price of the subscription/item.
     * @returns An object containing the coupon, original price, discounted price, and discount amount.
     * @throws CouponError (or specific subclasses) if validation fails.
     */
    public async applyCoupon(code: string, userId: string, appId: string, originalPrice: number): Promise<{
        coupon: Coupon;
        originalPrice: number;
        discountedPrice: number;
        discountAmount: number;
    }> {
        // 1. Validate the coupon (AE17)
        const coupon = await this.validateCoupon(code, userId, appId, originalPrice);

        // 2. Calculate the discounted price
        const discountedPrice = this.calculateDiscountedPrice(coupon, originalPrice);
        const discountAmount = originalPrice - discountedPrice;

        // 3. Mark coupon as used
        await this.couponRepository.createCouponUsage({ couponId: coupon.id, userId });

        return {
            coupon,
            originalPrice,
            discountedPrice,
            discountAmount,
        };
    }
}