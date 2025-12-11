/**
 * Helper functions for complex date calculations
 * NOTE: These functions operate based on local time provided by the Date object, 
 * but standard ISO week calculation requires UTC awareness to handle year shifts precisely.
 * We adjust `getISOWeek` to use UTC internally for consistency with standard definitions.
 */

/**
 * Calculates the ISO 8601 week number (1-53) for a given date.
 * ISO weeks start on Monday, and week 1 is the first week with at least 4 days in the new year.
 * (i.e., the week containing January 4th).
 * @param date - The input Date object.
 * @returns The ISO week number.
 */
function getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    
    // Set to Thursday of the current week (mid-week rule)
    // d.getUTCDay(): 0 (Sun) - 6 (Sat). We treat Sun (0) as 7 for modulo operations.
    const dayNum = d.getUTCDay() || 7; 
    
    // Add 4 days, then subtract the weekday number to get to the preceding Monday, 
    // then add 3 days to land on Thursday (the middle of the ISO week).
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    
    // Get the start of the ISO year (Jan 1st)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    
    // Calculate difference in milliseconds, convert to days, adjust for 1-based indexing, and calculate week number
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

/**
 * Calculates the Fiscal/Reporting/Manufacturing Year, Quarter, and Month based on a defined start month.
 * This function provides generalized support for different temporal definitions based on offsets.
 * @param date - The input date.
 * @param startMonthIndex - Month index (0=Jan, 11=Dec) when the year starts.
 * @returns { year: number, quarter: number, month: number } (Month/Quarter are relative to the startMonthIndex, 1-based)
 */
function calculateOffsetPeriod(date: Date, startMonthIndex: number): { year: number, quarter: number, month: number } {
    const calendarMonth = date.getMonth(); // 0-11
    const calendarYear = date.getFullYear();

    let periodYear = calendarYear;
    let periodMonth = calendarMonth - startMonthIndex + 1; // 1-indexed relative month (1-12)

    if (periodMonth <= 0) {
        // Date falls into the previous period year (e.g., Dec when FY starts July 1st)
        periodYear = calendarYear - 1;
        periodMonth += 12;
    } else if (periodMonth > 12) {
         // Should generally not happen for 0-11 input range, but ensures result is bounded
         periodMonth -= 12;
    }

    // Quarter calculation (1-based relative to the period start)
    const periodQuarter = Math.ceil(periodMonth / 3);

    return {
        year: periodYear,
        quarter: periodQuarter,
        month: periodMonth,
    };
}


// --- Interfaces and Main Class ---

export interface TemporalDimensions {
    /** Standard Gregorian calendar dimensions */
    calendar: {
        year: number;
        quarter: number; // 1-4
        month: number; // 1-12
        week: number; // ISO Week 1-53 (Used for universal weekly counting)
        dayOfWeek: number; // 0 (Sun) - 6 (Sat)
        dayOfMonth: number;
        dayOfYear: number; // 1-366
    };

    /** ISO 8601 standard dimensions (used widely in business for weekly calendars) */
    iso8601: {
        year: number;
        week: number;
        dayOfWeek: number; // 1 (Mon) - 7 (Sun)
    };

    /** Financial/Fiscal Time dimensions (offset defined by converter instance) */
    fiscal: {
        year: number;
        quarter: number; // 1-4 (Fiscal Q)
        month: number; // 1-12 (Fiscal M)
    };
    
    /** Reporting Time dimensions (offset defined by converter instance) */
    reporting: {
        year: number;
        quarter: number; // 1-4 (Reporting Q)
        month: number; // 1-12 (Reporting M)
    };

    /** Manufacturing Time dimensions (assuming same configuration as Reporting for default) */
    manufacturing: {
        year: number;
        quarter: number; // 1-4 (Manufacturing Q)
        month: number; // 1-12 (Manufacturing M)
    };
}

/**
 * Utility class to convert standard Date objects into various defined temporal dimensions
 * (Calendar, ISO 8601, Fiscal, Reporting, Manufacturing).
 */
export class TemporalConverter {
    private fiscalYearStartMonth: number;
    private reportingYearStartMonth: number;
    private manufacturingYearStartMonth: number;

    /**
     * @param fiscalYearStartMonth The month index (0-11) defining the start of the Fiscal Year. Default: 6 (July).
     * @param reportingYearStartMonth The month index (0-11) defining the start of the Reporting Year. Default: 0 (January).
     * @param manufacturingYearStartMonth The month index (0-11) defining the start of the Manufacturing Year. Default: 0 (January).
     */
    constructor(
        fiscalYearStartMonth: number = 6, 
        reportingYearStartMonth: number = 0, 
        manufacturingYearStartMonth: number = 0
    ) {
        this.fiscalYearStartMonth = fiscalYearStartMonth;
        this.reportingYearStartMonth = reportingYearStartMonth;
        this.manufacturingYearStartMonth = manufacturingYearStartMonth;
    }

    /**
     * Converts a timestamp or Date object into a detailed TemporalDimensions structure.
     * @param timestamp The input date (Date object or UTC timestamp).
     * @returns The converted dimensions.
     */
    public convert(timestamp: Date | number): TemporalDimensions {
        const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
        
        // --- 1. Calendar Calculations ---
        const calendarYear = date.getFullYear();
        const calendarMonth = date.getMonth(); // 0-11
        const dayOfMonth = date.getDate();
        const dayOfWeek = date.getDay(); // 0 (Sun) - 6 (Sat)

        // Calculate Day of Year (1-based)
        const startOfYear = new Date(calendarYear, 0, 1);
        const dayDifferenceMs = date.getTime() - startOfYear.getTime();
        // Calculate days passed, then add 1 for 1-based indexing
        const dayOfYear = Math.floor(dayDifferenceMs / (1000 * 60 * 60 * 24)) + 1;

        // Quarter calculation (1-based)
        const quarter = Math.floor(calendarMonth / 3) + 1;
        
        // Use ISO week for a globally standard 'week of year' definition
        const calendarWeek = getISOWeek(date);
        
        const calendarData = {
            year: calendarYear,
            quarter: quarter,
            month: calendarMonth + 1, // 1-based
            week: calendarWeek,
            dayOfWeek: dayOfWeek,
            dayOfMonth: dayOfMonth,
            dayOfYear: dayOfYear,
        };

        // --- 2. ISO 8601 Calculations ---
        
        // Get the UTC values required for stable ISO calculation
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        
        // Determine ISO Week and Year
        const isoWeek = getISOWeek(utcDate);
        
        // ISO Year calculation relies on the date of the Thursday of that week
        const d = new Date(utcDate.getTime());
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const isoYear = d.getUTCFullYear();
        
        // 1 (Mon) to 7 (Sun)
        const isoDayOfWeek = (dayNum === 0 ? 7 : dayNum); 

        const iso8601Data = {
            year: isoYear,
            week: isoWeek,
            dayOfWeek: isoDayOfWeek, 
        };

        // --- 3. Offset Periods (Fiscal, Reporting, Manufacturing) ---
        
        const fiscalData = calculateOffsetPeriod(date, this.fiscalYearStartMonth);
        const reportingData = calculateOffsetPeriod(date, this.reportingYearStartMonth);
        const manufacturingData = calculateOffsetPeriod(date, this.manufacturingYearStartMonth);

        return {
            calendar: calendarData,
            iso8601: iso8601Data,
            fiscal: fiscalData,
            reporting: reportingData,
            manufacturing: manufacturingData,
        };
    }
}