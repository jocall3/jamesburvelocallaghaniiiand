interface BondCashFlow {
  time: number; // Time to cash flow in years (e.g., 0.5 for 6 months)
  amount: number; // Cash flow amount (coupon or principal)
}

/**
 * Calculates Macaulay Duration for a set of bond cash flows.
 * Macaulay Duration is the weighted average time to receive the bond's cash flows,
 * where the weights are the present values of the cash flows as a proportion of the bond's total price.
 *
 * Formula: MacDur = (Σ [t * CF_t / (1 + y)^t]) / Price
 * Where:
 * t = time to cash flow
 * CF_t = cash flow at time t
 * y = Yield to Maturity (expressed as a periodic rate matching the compounding frequency)
 * Price = Present Value of all cash flows
 *
 * @param cashFlows Array of bond cash flow objects.
 * @param ytm Yield To Maturity (annual rate, e.g., 0.05 for 5%).
 * @param compoundingPeriodsPerYear Number of compounding periods per year (e.g., 2 for semi-annual).
 * @returns The Macaulay Duration.
 */
export function calculateMacaulayDuration(
  cashFlows: BondCashFlow[],
  ytm: number,
  compoundingPeriodsPerYear: number
): number {
  if (cashFlows.length === 0) {
    return 0;
  }

  const periodicYTM = ytm / compoundingPeriodsPerYear;
  let price = 0;
  let weightedTimeSum = 0;

  for (const cf of cashFlows) {
    const presentValueFactor = Math.pow(1 + periodicYTM, cf.time);
    const presentValue = cf.amount / presentValueFactor;
    
    price += presentValue;
    weightedTimeSum += cf.time * presentValue;
  }

  if (price === 0) {
    // This should ideally not happen for a valid bond, but handles division by zero.
    return 0;
  }

  const macaulayDuration = weightedTimeSum / price;
  return macaulayDuration;
}

/**
 * Calculates Modified Duration from Macaulay Duration.
 * Modified Duration measures the price sensitivity of a bond to a 1% change in yield.
 *
 * Formula: ModDur = MacDur / (1 + y/k)
 * Where:
 * MacDur = Macaulay Duration
 * y = Annual Yield To Maturity
 * k = Compounding Periods Per Year
 *
 * @param macaulayDuration The Macaulay Duration.
 * @param ytm Annual Yield To Maturity (e.g., 0.05 for 5%).
 * @param compoundingPeriodsPerYear Number of compounding periods per year (e.g., 2 for semi-annual).
 * @returns The Modified Duration.
 */
export function calculateModifiedDuration(
  macaulayDuration: number,
  ytm: number,
  compoundingPeriodsPerYear: number
): number {
  if (compoundingPeriodsPerYear <= 0) {
    throw new Error("Compounding periods per year must be positive.");
  }
  
  const periodicYTM = ytm / compoundingPeriodsPerYear;
  
  // The denominator is 1 + periodic YTM
  const denominator = 1 + periodicYTM;

  if (denominator === 1) {
    // If YTM is 0, Modified Duration equals Macaulay Duration
    return macaulayDuration;
  }
  
  const modifiedDuration = macaulayDuration / denominator;
  return modifiedDuration;
}

/**
 * Calculates the approximate percentage price change for a small change in YTM.
 *
 * Formula: % Change ≈ -ModDur * Δy
 * Where:
 * Δy = Change in YTM (as a decimal)
 *
 * @param modifiedDuration The bond's Modified Duration.
 * @param deltaYTM The change in YTM (as a decimal, e.g., 0.005 for a 50 basis point increase).
 * @returns The approximate percentage price change (positive for a price drop, negative for a price rise).
 */
export function estimatePriceChangeFromDuration(
  modifiedDuration: number,
  deltaYTM: number
): number {
  // Delta YTM should be provided as a decimal change (e.g., 0.01 for 1%)
  return -modifiedDuration * deltaYTM;
}

/**
 * Calculates Macaulay Duration specifically for a Zero-Coupon Bond.
 * For a zero-coupon bond, Macaulay Duration is simply the time to maturity,
 * expressed in the same compounding units as the yield.
 *
 * @param timeToMaturity Time to maturity in years.
 * @param compoundingPeriodsPerYear Number of compounding periods per year.
 * @returns The Macaulay Duration (in periods).
 */
export function calculateZCB_MacaulayDuration(
    timeToMaturity: number,
    compoundingPeriodsPerYear: number
): number {
    if (compoundingPeriodsPerYear <= 0) {
        return timeToMaturity;
    }
    // Duration is typically reported in years, which aligns with timeToMaturity
    // if the yield (YTM) is annual.
    return timeToMaturity;
}

/**
 * Calculates Modified Duration specifically for a Zero-Coupon Bond.
 * Modified Duration = Macaulay Duration / (1 + y/k)
 *
 * @param macaulayDuration The Macaulay Duration (in years).
 * @param ytm Annual Yield To Maturity (e.g., 0.05 for 5%).
 * @param compoundingPeriodsPerYear Number of compounding periods per year.
 * @returns The Modified Duration.
 */
export function calculateZCB_ModifiedDuration(
    macaulayDuration: number,
    ytm: number,
    compoundingPeriodsPerYear: number
): number {
    if (compoundingPeriodsPerYear <= 0) {
        return macaulayDuration;
    }
    const periodicYTM = ytm / compoundingPeriodsPerYear;
    return macaulayDuration / (1 + periodicYTM);
}