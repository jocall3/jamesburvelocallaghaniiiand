function calculateConvexity(
    faceValue: number,
    couponRate: number,
    maturityInYears: number,
    yieldToMaturity: number,
    frequency: number = 2, // Assuming semi-annual payments for typical US bonds if not specified, but this is a zero-coupon bond.
    settlementDate: Date = new Date(),
    maturityDate: Date = new Date(new Date().setFullYear(settlementDate.getFullYear() + maturityInYears, settlementDate.getMonth(), settlementDate.getDate())) // Simple approximation for zero-coupon maturity date
): number {
    // The provided data indicates a Zero-coupon bond maturing on 21dec2021.
    // For zero-coupon bonds, convexity calculation simplifies significantly,
    // but standard convexity formulas often assume periodic cash flows.

    // Given the bond is a Zero-coupon bond, the cash flow occurs only at maturity (t = T).
    // P(y) = FV / (1 + y/f)^(f*T) where T is maturity in years, f is frequency (here f=1 since it's annual compounding for zero-coupon usually, or determined by its term structure).

    // For simplicity and based on the zero-coupon nature where all cash flow is at T:
    // If y is the yield to maturity (expressed as a decimal rate per period, e.g., semi-annually or annually depending on convention)
    // and t is the time to maturity in periods (or years if y is the annual rate compounded annually).

    // Standard formula for a zero-coupon bond where y is the continuously compounded yield (y_c) or annual yield (y_a):
    // Price P = FV * e^(-y_c * T) (continuous) OR P = FV / (1 + y_a)^T (discrete, annual)

    // Let's use the discrete annual compounding model as it's easier to relate to typical financial representations for zero-coupon bonds:
    // P(y) = FV * (1 + y)^(-T)
    // Where y is the annual yield (decimal) and T is years to maturity.

    // First derivative (Modified Duration * Price): D_mod * P = -T * FV * (1 + y)^(-T-1)
    const D_mod_times_P = -maturityInYears * faceValue * Math.pow(1 + yieldToMaturity, -maturityInYears - 1);

    // Second derivative (Convexity * Price): C * P = T * (T + 1) * FV * (1 + y)^(-T-2)
    const Convexity_times_P = maturityInYears * (maturityInYears + 1) * faceValue * Math.pow(1 + yieldToMaturity, -maturityInYears - 2);

    // Price P = FV * (1 + y)^(-T)
    const price = faceValue * Math.pow(1 + yieldToMaturity, -maturityInYears);

    if (price === 0) {
        return 0; // Avoid division by zero if price is zero (theoretically impossible for a non-zero FV bond unless yield is infinite)
    }

    // Convexity = (Second Derivative) / Price
    const convexity = Convexity_times_P / price;

    // For zero-coupon bonds, Convexity = T * (T + 1) / (1 + y)^2, where T is years to maturity and y is the annual yield.
    // Let's verify against the derived formula:
    // Convexity = [T * (T + 1) * FV * (1 + y)^(-T-2)] / [FV * (1 + y)^(-T)]
    // Convexity = T * (T + 1) * (1 + y)^(-2)
    // Convexity = T * (T + 1) / (1 + y)^2

    const verificationConvexity = maturityInYears * (maturityInYears + 1) / Math.pow(1 + yieldToMaturity, 2);

    // Since the input bond description suggests it Matured on 21dec2021, and we are calculating for a theoretical yield,
    // we must rely on the mathematical structure based on the maturity date provided implicitly by maturityInYears.
    // We return the mathematically derived convexity for a standard discrete zero-coupon bond.
    return verificationConvexity;
}

/**
 * Calculates the Macaulay Duration for a zero-coupon bond.
 * For zero-coupon bonds, Macaulay Duration = Time to Maturity (in the compounding periods used for the yield).
 * If yieldToMaturity is the annual rate (y_a) compounded annually, Macaulay Duration = Maturity in Years.
 *
 * @param maturityInYears Time remaining until maturity in years.
 * @param yieldToMaturity Annual yield to maturity (decimal).
 * @returns Macaulay Duration in years.
 */
function calculateMacaulayDurationZeroCoupon(maturityInYears: number, yieldToMaturity: number): number {
    // For zero-coupon bonds, Macaulay Duration = T (Time to Maturity in compounding periods).
    // If the yield is quoted annually (y_a), then Macaulay Duration is T years.
    return maturityInYears;
}

/**
 * Calculates the Modified Duration for a zero-coupon bond.
 * Modified Duration = Macaulay Duration / (1 + y/f)
 * Assuming y is the annual yield and compounding is annual (f=1) for simplicity with the derived convexity model.
 *
 * @param maturityInYears Time remaining until maturity in years.
 * @param yieldToMaturity Annual yield to maturity (decimal).
 * @returns Modified Duration.
 */
function calculateModifiedDurationZeroCoupon(maturityInYears: number, yieldToMaturity: number): number {
    const macDur = calculateMacaulayDurationZeroCoupon(maturityInYears, yieldToMaturity);
    // Using annual compounding adjustment for simplicity: 1 + y
    return macDur / (1 + yieldToMaturity);
}

// --- Standardized function for usage, prioritizing the standard zero-coupon convexity formula ---

/**
 * Calculates the Convexity of a zero-coupon bond based on its time to maturity and yield.
 * Convexity measures the curvature of the price-yield relationship.
 *
 * Note: This implementation assumes annual compounding for the yield (y) based on the simple zero-coupon price model P = FV / (1 + y)^T.
 *
 * @param faceValue The par value of the bond (e.g., 100).
 * @param yieldToMaturity The current annual yield to maturity (YTM) expressed as a decimal (e.g., 0.02 for 2%).
 * @param maturityInYears Time remaining until maturity in years (T).
 * @returns The calculated Convexity value.
 */
export function calculateZeroCouponConvexity(
    faceValue: number,
    yieldToMaturity: number,
    maturityInYears: number
): number {
    if (maturityInYears <= 0) {
        return 0;
    }

    // Convexity C = T * (T + 1) / (1 + y)^2
    const base = 1 + yieldToMaturity;
    const convexity = (maturityInYears * (maturityInYears + 1)) / (base * base);

    return convexity;
}

// For completeness, exporting duration functions as they are intrinsically related.
export { calculateMacaulayDurationZeroCoupon, calculateModifiedDurationZeroCoupon };