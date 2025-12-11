export interface RecurringHoliday {
    month: number; // 1-12
    day: number;   // 1-31
    name: string;
    /**
     * How is the holiday observed if it falls on a non-working day (e.g., weekend)?
     * 'nextMonday': Observed the following Monday (Standard US Federal rule for Sat/Sun)
     * 'previousFriday': Observed the preceding Friday
     * 'none': Observed on the actual date, even if it's a non-working day.
     */
    weekendObserved?: 'nextMonday' | 'previousFriday' | 'none';
}

export interface SpecificDateHoliday {
    date: string; // YYYY-MM-DD format (local date)
    name: string;
}

export interface RegionalHolidayConfig {
    name: string;
    // Array of day numbers considered working days (0=Sun, 1=Mon, ..., 6=Sat)
    workingDays: number[];
    recurringHolidays: RecurringHoliday[];
    specificHolidays: SpecificDateHoliday[];
}

// --- Region Definitions ---

// Example configuration for US Federal Holidays (simplified for fixed dates)
const REGION_US_FEDERAL: RegionalHolidayConfig = {
    name: "US_FEDERAL",
    workingDays: [1, 2, 3, 4, 5], // Monday through Friday
    recurringHolidays: [
        { month: 1, day: 1, name: "New Year's Day", weekendObserved: 'nextMonday' },
        { month: 7, day: 4, name: "Independence Day", weekendObserved: 'nextMonday' },
        { month: 11, day: 11, name: "Veterans Day", weekendObserved: 'nextMonday' },
        { month: 12, day: 25, name: "Christmas Day", weekendObserved: 'nextMonday' },
        // Note: Complex holidays like Thanksgiving (4th Thursday in Nov) or MLK Day (3rd Monday in Jan) 
        // would require specific date calculation logic not included in this simple setup.
    ],
    specificHolidays: [], 
};

// Example for a fictional European Region (EU_STANDARD)
const REGION_EU_STANDARD: RegionalHolidayConfig = {
    name: "EU_STANDARD",
    workingDays: [1, 2, 3, 4, 5],
    recurringHolidays: [
        { month: 1, day: 1, name: "New Year's Day", weekendObserved: 'none' },
        { month: 5, day: 1, name: "Labour Day", weekendObserved: 'none' },
        { month: 12, day: 25, name: "Christmas Day", weekendObserved: 'none' },
        { month: 12, day: 26, name: "St. Stephen's Day", weekendObserved: 'none' },
    ],
    specificHolidays: [],
};


export const HOLIDAY_CONFIGS: Record<string, RegionalHolidayConfig> = {
    'US': REGION_US_FEDERAL,
    'EU': REGION_EU_STANDARD,
};

export type SupportedRegion = keyof typeof HOLIDAY_CONFIGS;

/**
 * Utility class to calculate working days and public holidays based on regional rules.
 * This class abstracts the logic required for schema features like IsHoliday, IsWorkingDay, etc.
 * 
 * NOTE: All internal date calculations rely on standard JavaScript Date objects and local timezone logic. 
 * For mission-critical chronological features, explicit timezone handling (e.g., UTC or specific regional timezones) 
 * using a dedicated library (like Luxon or date-fns/tz) is strongly recommended.
 */
export class HolidaysAndWorkdays {
    private config: RegionalHolidayConfig;

    constructor(region: SupportedRegion = 'US') {
        const config = HOLIDAY_CONFIGS[region];
        if (!config) {
            throw new Error(`Unsupported region: ${region}`);
        }
        this.config = config;
    }

    /**
     * Helper function to format Date object into YYYY-MM-DD string (based on local date components).
     */
    private formatToYMD(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Checks if a given date falls on a standard weekend/non-working day defined by the region config.
     */
    private isStandardNonWorkingDay(date: Date): boolean {
        const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
        return !this.config.workingDays.includes(dayOfWeek);
    }

    /**
     * Calculates the actual observed date for a fixed recurring holiday, applying 
     * weekend observance rules if configured.
     */
    private getObservedDate(year: number, holiday: RecurringHoliday): Date {
        // Create a date object for the fixed calendar day (Month/Day)
        const date = new Date(year, holiday.month - 1, holiday.day);
        
        let observedDate = new Date(date);
        const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)
        
        // If it's a working day or observance is 'none', return the original date.
        if (!this.isStandardNonWorkingDay(date) || holiday.weekendObserved === 'none') {
            return observedDate; 
        }

        // Handle observance shifting for non-working days (weekends)

        if (holiday.weekendObserved === 'nextMonday') {
            let daysToAdd = 0;
            // Assuming standard weekend is Sat/Sun
            if (dayOfWeek === 6) daysToAdd = 2; // Saturday -> Monday
            else if (dayOfWeek === 0) daysToAdd = 1; // Sunday -> Monday
            
            observedDate.setDate(date.getDate() + daysToAdd);
            
        } else if (holiday.weekendObserved === 'previousFriday') {
            let daysToAdd = 0;
            if (dayOfWeek === 6) daysToAdd = -1; // Saturday -> Friday
            else if (dayOfWeek === 0) daysToAdd = -2; // Sunday -> Friday

            observedDate.setDate(date.getDate() + daysToAdd);
        }

        return observedDate; 
    }

    /**
     * Implements the logic equivalent to the 'IsHoliday' schema feature.
     * Checks if a specific date is a scheduled public holiday.
     */
    public isHoliday(date: Date): boolean {
        const year = date.getFullYear();
        const ymd = this.formatToYMD(date);

        // 1. Check Specific Holidays (based on YYYY-MM-DD)
        if (this.config.specificHolidays.some(h => h.date === ymd)) {
            return true;
        }

        // 2. Check Recurring Holidays (with observance logic)
        for (const holiday of this.config.recurringHolidays) {
            const observedDate = this.getObservedDate(year, holiday);
            
            if (this.formatToYMD(observedDate) === ymd) {
                 return true;
            }
        }

        return false;
    }

    /**
     * Implements the logic equivalent to the 'IsWorkingDay' schema feature.
     * A working day is defined as: (a) falls on a standard configured working day AND (b) is not a declared holiday.
     */
    public isWorkingDay(date: Date): boolean {
        if (this.isStandardNonWorkingDay(date)) {
            return false;
        }
        
        if (this.isHoliday(date)) {
            return false;
        }

        return true;
    }

    /**
     * Calculates the Nth working day after a starting date (exclusive).
     * @param startDate The date to start counting from.
     * @param days Number of working days to advance (default 1).
     */
    public getNextWorkingDay(startDate: Date, days: number = 1): Date {
        let currentDate = new Date(startDate);
        
        if (days <= 0) {
            return new Date(startDate); 
        }

        for (let i = 0; i < days; ) {
            currentDate.setDate(currentDate.getDate() + 1);
            
            if (this.isWorkingDay(currentDate)) {
                i++; 
            }
        }

        return currentDate;
    }

    /**
     * Calculates the number of working days between two dates (inclusive of start, exclusive of end).
     */
    public calculateWorkingDaysBetween(start: Date, end: Date): number {
        // Ensure comparison happens on date boundaries, independent of time.
        const startYMD = new Date(this.formatToYMD(start));
        const endYMD = new Date(this.formatToYMD(end));

        if (startYMD >= endYMD) {
            return 0;
        }

        let count = 0;
        let current = new Date(startYMD);
        
        // Loop until current date reaches the end date
        while (current < endYMD) {
            if (this.isWorkingDay(current)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }

        return count;
    }
}