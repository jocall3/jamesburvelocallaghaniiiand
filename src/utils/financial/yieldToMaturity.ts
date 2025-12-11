// Function to calculate the net present value (NPV) of a bond's cash flows
const calculateNPV = (ytm: number, cashFlows: { date: Date, amount: number }[]): number => {
    const presentDate = new Date();
    let npv = 0;

    for (const cf of cashFlows) {
        // Time to cash flow in years (approximation)
        const timeInDays = (cf.date.getTime() - presentDate.getTime()) / (1000 * 60 * 60 * 24);
        if (timeInDays < 0) continue; // Ignore past cash flows if the calculation is run after maturity

        const timeInYears = timeInDays / 365.25; // Use 365.25 for average days in a year
        
        // Discount factor: 1 / (1 + ytm)^t
        const discountFactor = 1 / Math.pow(1 + ytm, timeInYears);
        npv += cf.amount * discountFactor;
    }
    return npv;
};

/**
 * Iteratively solves for Yield to Maturity (YTM) using the Newton-Raphson method 
 * or a simple bisection/trial-and-error approach if derivatives are hard to manage, 
 * given the bond's price and future cash flows.
 * 
 * NOTE: For simplicity and robustness in a general context where day counts are complex, 
 * this implementation will use a simple bisection/trial-and-error method, aiming for a 
 * reasonable precision over a fixed number of iterations, as the exact day count 
 * conventions (like Actual/Actual, 30/360) are not provided for all cash flows here.
 * 
 * @param marketPrice The current market price of the bond (must be positive).
 * @param cashFlows An array of objects representing future cash flows: [{ date: Date, amount: number }].
 * @param guess Initial guess for YTM (e.g., 0.05 for 5%).
 * @param precision Desired precision for the result (e.g., 0.00001).
 * @param maxIterations Maximum number of iterations.
 * @returns The calculated Yield to Maturity (YTM) as a decimal (e.g., 0.045 for 4.5%).
 */
export function calculateYieldToMaturity(
    marketPrice: number,
    cashFlows: { date: Date, amount: number }[],
    guess: number = 0.05,
    precision: number = 1e-6,
    maxIterations: number = 100
): number {
    if (marketPrice <= 0) {
        throw new Error("Market price must be positive.");
    }
    if (cashFlows.length === 0) {
        return 0; // Or throw if a bond must have cash flows
    }
    
    // 1. Sanity check: Calculate NPV at YTM=0 (Sum of undiscounted cash flows)
    const sumOfCashFlows = cashFlows.reduce((sum, cf) => sum + cf.amount, 0);
    
    if (sumOfCashFlows < marketPrice) {
        // If the sum of future cash flows is less than the price, YTM must be negative or the bond is priced too high.
        // This is typical if the bond is trading at a high premium relative to its final maturity value.
        // We will start the search range low, potentially into negative territory if necessary.
    }

    // --- Bisection Method Setup ---
    
    let lowYTM = -1.0; // Lower bound (e.g., -100%)
    let highYTM = 1.0; // Upper bound (e.g., 100%)
    let ytm = guess;

    // Adjust bounds aggressively if initial guess fails or cash flow sum suggests it.
    // Ensure one bound yields NPV > Price and the other yields NPV < Price.
    
    let npvLow = calculateNPV(lowYTM, cashFlows);
    let npvHigh = calculateNPV(highYTM, cashFlows);

    // Expand search range if necessary to bracket the price
    while (npvLow > marketPrice) {
        lowYTM *= 2;
        npvLow = calculateNPV(lowYTM, cashFlows);
    }
    while (npvHigh < marketPrice) {
        highYTM *= 2;
        npvHigh = calculateNPV(highYTM, cashFlows);
    }


    // Iteration Loop
    for (let i = 0; i < maxIterations; i++) {
        const currentNPV = calculateNPV(ytm, cashFlows);
        const difference = currentNPV - marketPrice;

        if (Math.abs(difference) < precision) {
            return ytm; // Found solution
        }

        // Update bounds for bisection
        if (currentNPV > marketPrice) {
            // YTM is too low (discounting too little) -> increase low bound
            lowYTM = ytm;
        } else {
            // YTM is too high (discounting too much) -> decrease high bound
            highYTM = ytm;
        }

        // New guess is the midpoint
        ytm = (lowYTM + highYTM) / 2;
    }

    // Return the best estimate after max iterations
    return ytm;
}
