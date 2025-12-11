/**
 * Calculates the Net Present Value (NPV) for a series of cash flows,
 * which typically represent loan payments or investments, discounted
 * at a specific rate.
 */
export class NPVCalculator {
  /**
   * Calculates the Net Present Value (NPV).
   *
   * NPV is calculated as:
   * NPV = Σ [CF_t / (1 + r)^t] - Initial Investment (CF_0)
   *
   * Since this class is primarily used for evaluating *offers* (which are future streams of cost/benefit),
   * we assume the initial investment (CF_0) is the immediate benefit/cost received/paid (e.g., the loan amount).
   *
   * @param rate The discount rate per period (expressed as a decimal, e.g., 0.05 for 5%).
   * @param cashFlows An array of cash flows, where the first element (index 0) is the initial cash flow (usually the loan principal/disbursement),
   *                  and subsequent elements are periodic payments (cost, usually negative).
   * @returns The Net Present Value (NPV).
   */
  public static calculate(rate: number, cashFlows: number[]): number {
    if (!cashFlows || cashFlows.length === 0) {
      return 0;
    }

    if (rate <= -1) {
      // Prevents division by zero or negative number if rate is too low.
      // In financial modeling, a rate below -100% is usually considered invalid.
      throw new Error("Discount rate must be greater than -1.");
    }

    let npv = 0;

    // The initial cash flow (at t=0) is not discounted.
    const initialCashFlow = cashFlows[0];

    // Add the immediate cash flow
    npv += initialCashFlow;

    // Calculate the present value for subsequent cash flows (t=1 onwards)
    for (let t = 1; t < cashFlows.length; t++) {
      const cashFlow = cashFlows[t];
      // Discount factor: (1 + rate)^t
      const discountFactor = Math.pow(1 + rate, t);
      npv += cashFlow / discountFactor;
    }

    return npv;
  }
}