/**
 * @file Defines the TypeScript interface for a discount applied to a subscription.
 * This interface includes properties for the discount's unique identifier,
 * the amount of the discount, and a reference to the associated coupon.
 * It is distinct from the I_Coupon (or M_Coupon) interface, which would define
 * the coupon itself.
 */

/**
 * Represents a discount applied to a subscription.
 * This interface defines the structure for storing and managing discount information.
 */
export interface M_Discount {
  /**
   * A unique identifier for this specific discount application.
   * This ID distinguishes one discount instance from another, even if they
   * originate from the same coupon.
   */
  id: string;

  /**
   * The value of the discount. This could represent:
   * - A fixed amount (e.g., 5.00 for $5 off).
   * - A percentage (e.g., 0.10 for 10% off).
   * The interpretation (fixed vs. percentage) would typically be determined
   * by the associated coupon's type or a separate field on the discount itself
   * if it can vary independently of the coupon. For simplicity, we assume
   * the coupon type dictates the interpretation.
   */
  amount: number;

  /**
   * The ID of the coupon that generated this discount.
   * This acts as a foreign key linking to an M_Coupon (or I_Coupon) entity,
   * providing details about the coupon's rules, validity, and type.
   */
  couponId: string;

  /**
   * The date and time when this discount was created or applied.
   */
  createdAt: Date;

  /**
   * The date and time when this discount was last updated.
   */
  updatedAt: Date;
}