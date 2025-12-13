export enum CouponDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

/**
 * Defines the TypeScript interface for a coupon or promotional code.
 * Used by the discount engine to apply various types of discounts to subscriptions or purchases.
 */
export interface I_Coupon {
  /**
   * A unique identifier for the coupon.
   */
  id: string;

  /**
   * The actual promotional code string that users will enter (e.g., "SAVE10", "FREEMONTH").
   */
  code: string;

  /**
   * The type of discount this coupon provides.
   * @see CouponDiscountType
   */
  discountType: CouponDiscountType;

  /**
   * The value of the discount.
   * - If `discountType` is `PERCENTAGE`, this is the percentage value (e.g., 10 for 10%).
   * - If `discountType` is `FIXED_AMOUNT`, this is the fixed monetary amount (e.g., 5.00 for $5 off).
   */
  amount: number;

  /**
   * The date and time from which the coupon is valid.
   */
  validFrom: Date;

  /**
   * The date and time until which the coupon is valid.
   */
  validUntil: Date;

  /**
   * A boolean indicating whether the coupon is currently active and can be used.
   */
  isActive: boolean;

  /**
   * Optional: The minimum purchase amount required for this coupon to be applicable.
   * If undefined or null, no minimum purchase is required.
   */
  minPurchaseAmount?: number;

  /**
   * Optional: The maximum number of times this coupon can be used in total across all users.
   * If undefined or null, there is no limit on total uses.
   */
  maxUses?: number;

  /**
   * Optional: The current count of how many times this coupon has been successfully used.
   */
  usesCount?: number;

  /**
   * Optional: An array of specific application IDs for which this coupon is valid.
   * If the array is empty or undefined, the coupon is considered valid for all apps.
   */
  applicableAppIds?: string[];

  /**
   * Optional: Timestamp when the coupon was created.
   */
  createdAt?: Date;

  /**
   * Optional: Timestamp when the coupon was last updated.
   */
  updatedAt?: Date;
}