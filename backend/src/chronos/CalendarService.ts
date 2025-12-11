import { ParsedTimeFeature, TimeFeatureType } from './TimeFeatureParser';
import { DateRange, CalendarInstance, DateGranularity } from './types';

/**
 * Service responsible for generating specific calendar instances (like Fiscal Year, Quarter, Week, etc.)
 * based on the extracted time features.
 */
export class CalendarService {

    /**
     * Generates a CalendarInstance based on a single parsed time feature.
     * @param feature The parsed time feature object.
     * @returns A CalendarInstance object defining the period and granularity.
     */
    public generateInstance(feature: ParsedTimeFeature): CalendarInstance | null {
        switch (feature.type) {
            case TimeFeatureType.YEAR:
                return this.generateYearInstance(feature.value);
            case TimeFeatureType.FISCAL_YEAR:
                return this.generateFiscalYearInstance(feature.value);
            case TimeFeatureType.QUARTER:
                return this.generateQuarterInstance(feature.value);
            case TimeFeatureType.FISCAL_QUARTER:
                // Assuming fiscal quarter data structure is { year: number, quarter: number }
                if (typeof feature.value === 'object' && feature.value !== null && 'year' in feature.value && 'quarter' in feature.value) {
                    const { year, quarter } = feature.value as { year: number, quarter: number };
                    return this.generateFiscalQuarterInstance(year, quarter);
                }
                return null;
            case TimeFeatureType.MONTH:
                // Assuming month data structure is { year: number, month: number (1-12) }
                if (typeof feature.value === 'object' && feature.value !== null && 'year' in feature.value && 'month' in feature.value) {
                    const { year, month } = feature.value as { year: number, month: number };
                    return this.generateMonthInstance(year, month);
                }
                return null;
            case TimeFeatureType.WEEK:
                // Assuming ISO week data structure is { year: number, week: number }
                if (typeof feature.value === 'object' && feature.value !== null && 'year' in feature.value && 'week' in feature.value) {
                    const { year, week } = feature.value as { year: number, week: number };
                    return this.generateWeekInstance(year, week);
                }
                return null;
            case TimeFeatureType.DAY:
                return this.generateDayInstance(feature.value as Date);
            default:
                console.warn(`[CalendarService] Unsupported feature type: ${feature.type}`);
                return null;
        }
    }

    // --- Specific Generator Methods ---

    /**
     * Generates a CalendarInstance for a standard calendar year.
     * @param year The year number (e.g., 2024).
     */
    private generateYearInstance(year: number): CalendarInstance {
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 0); // Dec 31st of the year
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return {
            name: `Year ${year}`,
            granularity: DateGranularity.YEAR,
            range: { start, end },
        };
    }

    /**
     * Generates a CalendarInstance for a fiscal year.
     * Assumption: Fiscal year starts on October 1st of the preceding calendar year. (e.g., FY2024 starts 2023-10-01)
     * @param fiscalYear The fiscal year number (e.g., 2024).
     */
    private generateFiscalYearInstance(fiscalYear: number): CalendarInstance {
        // FY starts October 1st (Month index 9) of (Year - 1)
        const startYear = fiscalYear - 1;
        const endYear = fiscalYear;
        
        const start = new Date(startYear, 9, 1);
        const end = new Date(endYear, 9, 0); // September 30th of the end year
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return {
            name: `Fiscal Year ${fiscalYear}`,
            granularity: DateGranularity.FISCAL_YEAR,
            range: { start, end },
        };
    }

    /**
     * Generates a CalendarInstance for a standard quarter.
     * @param value An object containing { year: number, quarter: number (1-4) }.
     */
    private generateQuarterInstance(value: { year: number, quarter: number }): CalendarInstance | null {
        const { year, quarter } = value;
        if (quarter < 1 || quarter > 4) return null;

        const startMonthIndex = (quarter - 1) * 3; // 0, 3, 6, 9
        const endMonthIndex = startMonthIndex + 3;

        const start = new Date(year, startMonthIndex, 1);
        // Date(Y, M, 0) gives the last day of the previous month (M-1)
        const end = new Date(year, endMonthIndex, 0);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return {
            name: `Q${quarter} ${year}`,
            granularity: DateGranularity.QUARTER,
            range: { start, end },
        };
    }

    /**
     * Generates a CalendarInstance for a fiscal quarter.
     * Assumption: FY starts Oct 1 (Q1 = Oct, Nov, Dec; Q2 = Jan, Feb, Mar, etc.)
     * @param year The fiscal year.
     * @param quarter The fiscal quarter (1-4).
     */
    private generateFiscalQuarterInstance(year: number, quarter: number): CalendarInstance | null {
        if (quarter < 1 || quarter > 4) return null;

        // Fiscal start month index (October = 9)
        const fiscalStartMonthIndex = 9; // October

        // Calculate the actual calendar month index for the start of the fiscal quarter
        // Q1 starts 9 (Oct), Q2 starts 0 (Jan), Q3 starts 3 (Apr), Q4 starts 6 (Jul)
        const startMonthOffset = (quarter - 1) * 3;
        let actualStartMonthIndex = (fiscalStartMonthIndex + startMonthOffset) % 12;

        let startYear: number;

        // Adjust the calendar year based on the quarter
        // Q1 starts in (FY - 1), Q2, Q3, Q4 start in FY
        if (quarter === 1) {
            startYear = year - 1;
        } else {
            startYear = year;
        }

        const start = new Date(startYear, actualStartMonthIndex, 1);
        
        // Calculate the end month index (3 months after start month)
        const endMonthIndex = actualStartMonthIndex + 3;
        
        // The end date is the last day of the 3rd month of the quarter.
        const end = new Date(startYear, endMonthIndex, 0);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return {
            name: `FY ${year} Q${quarter}`,
            granularity: DateGranularity.FISCAL_QUARTER,
            range: { start, end },
        };
    }


    /**
     * Generates a CalendarInstance for a specific month.
     * @param year The calendar year.
     * @param month The month number (1-12).
     */
    private generateMonthInstance(year: number, month: number): CalendarInstance | null {
        if (month < 1 || month > 12) return null;

        const monthIndex = month - 1; // 0-11

        const start = new Date(year, monthIndex, 1);
        // The day 0 of the next month
        const end = new Date(year, monthIndex + 1, 0);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return {
            name: `${start.toLocaleString('default', { month: 'long' })} ${year}`,
            granularity: DateGranularity.MONTH,
            range: { start, end },
        };
    }

    /**
     * Generates a CalendarInstance for a specific ISO 8601 week.
     * Note: This implementation uses external helper logic (to be assumed/simplified here)
     * as calculating ISO weeks accurately is complex due to year rollover rules.
     * For simplicity, we use a basic approximation or rely on date manipulation.
     * @param year The ISO week year.
     * @param week The week number (1-53).
     */
    private generateWeekInstance(year: number, week: number): CalendarInstance | null {
        if (week < 1 || week > 53) return null;

        // Helper function to find the start date of an ISO week (Monday)
        const getDateOfISOWeek = (w: number, y: number): Date => {
            const simple = new Date(y, 0, 1 + (w - 1) * 7);
            const dow = simple.getDay();
            const ISOweekStart = simple;

            // Adjust date to the nearest Thursday of that week
            ISOweekStart.setDate(ISOweekStart.getDate() + 4 - dow);
            // Then calculate Monday (4 days back)
            ISOweekStart.setDate(ISOweekStart.getDate() - 3); 
            
            return ISOweekStart;
        };

        const start = getDateOfISOWeek(week, year);
        const end = new Date(start);
        end.setDate(end.getDate() + 6); // Sunday

        // Reset time components
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        return {
            name: `Week ${week}, ${year}`,
            granularity: DateGranularity.WEEK,
            range: { start, end },
        };
    }

    /**
     * Generates a CalendarInstance for a specific day.
     * @param date The Date object representing the day.
     */
    private generateDayInstance(date: Date): CalendarInstance {
        const start = new Date(date);
        const end = new Date(date);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return {
            name: start.toISOString().substring(0, 10),
            granularity: DateGranularity.DAY,
            range: { start, end },
        };
    }
}
