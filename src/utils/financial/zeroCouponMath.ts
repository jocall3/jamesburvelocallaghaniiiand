interface ZeroCouponPricing {
    /**
     * Calculates the present value (price) of a zero-coupon bond.
     * Price = Redemption Value / (1 + Yield)^(Time to Maturity / Periodicity Factor)
     *
     * @param redemptionValue The face value or redemption amount of the bond.
     * @param yield Annual yield (as a decimal, e.g., 0.05 for 5%).
     * @param timeToMaturityInYears Time remaining until maturity in years.
     * @param daysPerYear The day count basis (e.g., 360 or 365).
     * @returns The calculated present value (price).
     */
    calculatePrice(redemptionValue: number, yield: number, timeToMaturityInYears: number, daysPerYear: number): number;

    /**
     * Calculates the yield of a zero-coupon bond given its current price.
     * Yield = ( (Redemption Value / Price)^(Periodicity Factor / Time to Maturity) ) - 1
     *
     * @param price The current market price of the bond.
     * @param redemptionValue The face value or redemption amount of the bond.
     * @param timeToMaturityInYears Time remaining until maturity in years.
     * @param daysPerYear The day count basis (e.g., 360 or 365).
     * @returns The calculated annual yield (as a decimal).
     */
    calculateYield(price: number, redemptionValue: number, timeToMaturityInYears: number, daysPerYear: number): number;

    /**
     * Calculates the accrued interest (accretion amount) for a zero-coupon bond
     * from the issue date up to a specified settlement date based on constant yield accretion.
     * Accreted Value = Redemption Value / (1 + Yield)^(Time from Settlement to Maturity / Periodicity Factor)
     *
     * @param redemptionValue The face value or redemption amount of the bond.
     * @param yield Annual yield (as a decimal).
     * @param timeToMaturityInYears The time remaining from the settlement date to maturity in years.
     * @param daysPerYear The day count basis (e.g., 360 or 365).
     * @returns The accreted value (which serves as the price for the given settlement date).
     */
    calculateAccretedValue(redemptionValue: number, yield: number, timeToMaturityInYears: number, daysPerYear: number): number;
}

/**
 * Specialized math functions for pricing and accretion logic of zero-coupon instruments.
 * Zero-coupon bonds use a single discount factor based on the time to maturity.
 */
export const ZeroCouponMath: ZeroCouponPricing = {
    /**
     * Price = Redemption Value / (1 + Yield)^(T / D)
     */
    calculatePrice(redemptionValue: number, yieldRate: number, timeToMaturityInYears: number, daysPerYear: number): number {
        if (daysPerYear <= 0) {
            throw new Error("Days per year must be positive.");
        }
        if (timeToMaturityInYears < 0) {
             // For expired bonds, the price should theoretically equal the redemption value if yield logic were ignored,
             // but for pricing future cash flows, 0 is often used if T < 0. We'll default to Redemption Value for consistency in the T=0 case.
             return redemptionValue;
        }

        const periods = timeToMaturityInYears * (daysPerYear / daysPerYear); // Assuming T is based on the same day count convention
        const discountFactor = Math.pow(1 + yieldRate, periods);

        return redemptionValue / discountFactor;
    },

    /**
     * Yield = ( (Redemption Value / Price)^(D / T) ) - 1
     */
    calculateYield(price: number, redemptionValue: number, timeToMaturityInYears: number, daysPerYear: number): number {
        if (price <= 0 || redemptionValue <= 0) {
            return NaN;
        }
        if (timeToMaturityInYears <= 0) {
            // If time to maturity is zero, yield is undefined or infinite depending on price vs redemption
            return Infinity;
        }
        if (daysPerYear <= 0) {
            throw new Error("Days per year must be positive.");
        }

        const periods = timeToMaturityInYears * (daysPerYear / daysPerYear);
        const ratio = redemptionValue / price;
        const factor = 1 / periods;

        return Math.pow(ratio, factor) - 1;
    },

    /**
     * Accreted Value is calculated as the present value formula, where the 'present' is the settlement date.
     * Accreted Value = Redemption Value / (1 + Yield)^(Time from Settlement to Maturity / D)
     */
    calculateAccretedValue(redemptionValue: number, yieldRate: number, timeToMaturityInYears: number, daysPerYear: number): number {
        // For zero-coupon bonds, the accrued value is simply the price calculated at the settlement date
        return this.calculatePrice(redemptionValue, yieldRate, timeToMaturityInYears, daysPerYear);
    }
};