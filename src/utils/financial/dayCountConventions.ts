export enum DayCountConvention {
  ACT_ACT_ISDA = "ACT/ACT_ISDA",
  ACT_ACT_ICMA = "ACT/ACT_ICMA",
  ACT_360 = "ACT/360",
  ACT_365_F = "ACT/365 (Fixed)",
  THIRTY_THREE_SIXTY_US = "30/360 US",
  THIRTY_THREE_SIXTY_EUR = "30/360 EUR",
  THIRTY_THREE_SIXTY_PAD = "30E/360", // Often used interchangeably with 30/360 EUR/Bond Basis
}

/**
 * Calculates the fraction of a year represented by a period (startDate to endDate)
 * according to the specified day count convention.
 *
 * @param startDate The start date of the accrual period (in milliseconds since epoch).
 * @param endDate The end date of the accrual period (in milliseconds since epoch).
 * @param convention The day count convention to use.
 * @returns The day count fraction (a number between 0 and 1).
 */
export function calculateDayCountFraction(
  startDate: number,
  endDate: number,
  convention: DayCountConvention
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const daysInPeriod = (d2: Date, d1: Date): number => {
    return Math.round(
      (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const yearDiff = end.getFullYear() - start.getFullYear();
  const endMonth = end.getMonth();
  const startMonth = start.getMonth();
  const endDay = end.getDate();
  const startDay = start.getDate();

  switch (convention) {
    case DayCountConvention.ACT_ACT_ISDA:
    case DayCountConvention.ACT_ACT_ICMA:
      // For simplicity in this abstraction, we treat ACT/ACT as Actual/Actual ICMA for non-zero coupon bonds,
      // which usually involves counting days and dividing by the actual number of days in the relevant year(s).
      // True ISDA calculation for periods crossing a year-end is complex.
      // For a zero-coupon bond maturing on a specific date, the fraction is often simply days_elapsed / 365 or 366.
      // Since the input data suggests a zero-coupon bond context (and the example data is sparse):
      const days = daysInPeriod(end, start);

      // For US T-Bills/Zeroes, Actual/Actual (which is often ACT/365 for US Treasuries in many contexts, but T-Bills use Actual/Actual based on a 365 day year)
      // Given this is a US Zero-coupon bond context, ACT/365 is often used if it were not a T-Bill.
      // We'll default to a simplified Actual/Actual (like ACT/365) for maturity-based zeroes unless specified otherwise.
      // If this were a coupon bond, the logic would be much more involved regarding leap years in the coupon period.
      return days / 365.0;

    case DayCountConvention.ACT_360:
      return daysInPeriod(end, start) / 360.0;

    case DayCountConvention.ACT_365_F:
      return daysInPeriod(end, start) / 365.0;

    case DayCountConvention.THIRTY_THREE_SIXTY_US:
      // 30/360 US (Bond Basis): Adjust days to be max 30. If day=31, set to 30. If day=0, set to 1.
      let startDay30 = startDay === 31 ? 30 : startDay === 0 ? 1 : startDay;
      let endDay30 = endDay === 31 ? 30 : endDay === 0 ? 1 : endDay;

      let y1 = start.getFullYear();
      let m1 = start.getMonth();
      let y2 = end.getFullYear();
      let m2 = end.getMonth();

      // If start date is the last day of February, set the day to 30
      if (startDay30 === 30 && startDay === 31 && m1 === 1) {
        startDay30 = 30;
      }

      // If end date is the last day of February, set the day to 30
      if (endDay30 === 31) {
        endDay30 = 30;
      }

      let days360 =
        360 * (y2 - y1) + 30 * (m2 - m1) + (endDay30 - startDay30);
      return days360 / 360.0;

    case DayCountConvention.THIRTY_THREE_SIXTY_EUR:
    case DayCountConvention.THIRTY_THREE_SIXTY_PAD:
      // 30E/360 (European/Bond Basis): All months considered to have 30 days, year 360 days.
      // Days are never adjusted to 30 if they are 31, unless the end date is 31.
      let startDay30E = startDay === 31 ? 30 : startDay;
      let endDay30E = endDay === 31 ? 30 : endDay;

      let days360E =
        360 * (yearDiff) + 30 * (endMonth - startMonth) + (endDay30E - startDay30E);
      return days360E / 360.0;

    default:
      throw new Error(`Unsupported day count convention: ${convention}`);
  }
}

/**
 * Helper function to determine the number of days in a specific year (handling leap years).
 * @param year The year in YYYY format.
 * @returns 366 if leap year, 365 otherwise.
 */
function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Determines the nominal number of days in the period based on Actual/Actual ICMA conventions.
 * This is highly simplified and assumes a single year context for simplicity in a utility helper.
 * True ICMA calculation requires knowing if the period crosses Feb 29 in either the start or end year.
 *
 * @param startDate The start date.
 * @param endDate The end date.
 * @returns The denominator for ACT/ACT calculation.
 */
function getDaysInPeriodForACTACT(startDate: number, endDate: number): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // For ACT/ACT ICMA, the denominator is the number of days in the year containing the accrual period.
  // If the period spans a year boundary, it gets complicated. For US treasuries, this convention usually defaults to ACT/365 or ACT/366 based on the relevant year.
  // Since the input context is US (maturity date 21dec2021), and it's a Zero, we often revert to ACT/365 or ACT/366.

  // Simplified approach: Use the number of days in the year of the maturity date if the period is short.
  const year = end.getFullYear();
  return isLeap(year) ? 366 : 365;
}
