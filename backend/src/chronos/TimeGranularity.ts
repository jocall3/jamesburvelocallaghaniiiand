import { Interval, DateTime, Duration, DurationUnit } from 'luxon';

/**
 * Represents the hierarchical structure of time granularities, 
 * defining constants for calculation and display.
 */
export const TimeGranularity = {
    NANOSECOND: 'nanosecond',
    MICROSECOND: 'microsecond',
    MILLISECOND: 'millisecond',
    SECOND: 'second',
    MINUTE: 'minute',
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    QUARTER: 'quarter',
    YEAR: 'year',
    DECADE: 'decade',
    CENTURY: 'century',
} as const;

export type TimeGranularityKey = keyof typeof TimeGranularity;
export type TimeGranularityValue = typeof TimeGranularity[TimeGranularityKey];

/**
 * Mapping from TimeGranularityKey to Luxon's DurationUnit (where applicable).
 * This is used for creating durations and calculating diffs.
 */
const LUXON_UNIT_MAP: { [K in TimeGranularityKey]: DurationUnit | undefined } = {
    NANOSECOND: undefined,
    MICROSECOND: undefined,
    MILLISECOND: 'millisecond',
    SECOND: 'second',
    MINUTE: 'minute',
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    QUARTER: 'quarter',
    YEAR: 'year',
    DECADE: undefined, // Luxon does not support Decade directly
    CENTURY: undefined, // Luxon does not support Century directly
};

/**
 * Defines the canonical order and relative scaling of granularities.
 * Values represent the scaling factor relative to the next smaller unit (e.g., 1000 ms per second, 60 seconds per minute).
 * Custom units (like Decade and Century) use standard relative scaling where possible.
 */
const SCALING_FACTORS: { [K in TimeGranularityKey]: number } = {
    NANOSECOND: 1000, // 1000 Nanoseconds per Microsecond
    MICROSECOND: 1000, // 1000 Microseconds per Millisecond
    MILLISECOND: 1000, // 1000 Milliseconds per Second
    SECOND: 60, // 60 Seconds per Minute
    MINUTE: 60, // 60 Minutes per Hour
    HOUR: 24, // 24 Hours per Day
    DAY: 7, // 7 Days per Week
    WEEK: 4.3482, // Approximate weeks per month (52.17857 / 12) - USE MONTH FOR ACCURATE DIFFS
    MONTH: 3, // 3 Months per Quarter
    QUARTER: 4, // 4 Quarters per Year
    YEAR: 10, // 10 Years per Decade
    DECADE: 10, // 10 Decades (100 years) per Century
    CENTURY: 1, // Top level
};

/**
 * Ordered list of granularities from smallest (NANOSECOND) to largest (CENTURY).
 */
export const ORDERED_GRANULARITIES: TimeGranularityKey[] = [
    'NANOSECOND',
    'MICROSECOND',
    'MILLISECOND',
    'SECOND',
    'MINUTE',
    'HOUR',
    'DAY',
    'WEEK',
    'MONTH',
    'QUARTER',
    'YEAR',
    'DECADE',
    'CENTURY',
];

/**
 * Helper class for time granularity operations.
 */
export class GranularityManager {

    /**
     * Determines if a given key is a recognized TimeGranularity key.
     * @param key The string key to check.
     */
    static isValidGranularityKey(key: string): key is TimeGranularityKey {
        return ORDERED_GRANULARITIES.includes(key as TimeGranularityKey);
    }

    /**
     * Finds the next larger granularity unit.
     * @param current The current granularity key.
     * @returns The next larger granularity key, or undefined if it's the largest.
     */
    static getNextLargerGranularity(current: TimeGranularityKey): TimeGranularityKey | undefined {
        const index = ORDERED_GRANULARITIES.indexOf(current);
        if (index === -1 || index === ORDERED_GRANULARITIES.length - 1) {
            return undefined;
        }
        return ORDERED_GRANULARITIES[index + 1];
    }

    /**
     * Calculates the total duration between two DateTimes in the specified granularity unit.
     *
     * Note: For WEEK, MONTH, QUARTER, YEAR, DECADE, CENTURY, Luxon is used for precise interval calculations.
     * For high-precision units (NS, US, MS), Luxon milliseconds are used, and custom scaling applied.
     *
     * @param start The start DateTime.
     * @param end The end DateTime.
     * @param granularity The unit of measurement (e.g., 'HOUR', 'YEAR').
     * @returns The number of units between start and end (float).
     */
    static calculateDurationInUnits(start: DateTime, end: DateTime, granularity: TimeGranularityKey): number {
        const luxonUnit = LUXON_UNIT_MAP[granularity];

        if (luxonUnit) {
            // Use Luxon's built-in diff for calendar-aware units (MS up to YEAR/QUARTER)
            const duration = end.diff(start, luxonUnit);
            return duration.as(luxonUnit);
        }

        // Custom handling for units Luxon doesn't support directly or highly precise units

        const diffMilliseconds = end.diff(start, 'milliseconds').as('milliseconds');

        switch (granularity) {
            case 'MILLISECOND':
                return diffMilliseconds;
            case 'MICROSECOND':
                return diffMilliseconds * SCALING_FACTORS['MILLISECOND'];
            case 'NANOSECOND':
                return diffMilliseconds * SCALING_FACTORS['MILLISECOND'] * SCALING_FACTORS['MICROSECOND'];

            case 'DECADE':
                // Calculate years and divide by 10.
                const years = end.diff(start, 'years').as('years');
                return years / SCALING_FACTORS['YEAR'];

            case 'CENTURY':
                // Calculate years and divide by 100.
                const totalYears = end.diff(start, 'years').as('years');
                return totalYears / (SCALING_FACTORS['YEAR'] * SCALING_FACTORS['DECADE']);

            case 'WEEK':
                // Use built-in week diff for accuracy, despite the approximation in SCALING_FACTORS
                return end.diff(start, 'weeks').as('weeks');

            default:
                // This case should ideally not be hit if LUXON_UNIT_MAP is defined correctly,
                // but acts as a fallback or if new unsupported Luxon units are added.
                throw new Error(`Unsupported granularity for duration calculation: ${granularity}`);
        }
    }

    /**
     * Converts a Duration object into a duration expressed in the specified granularity unit.
     * @param duration The Luxon Duration object.
     * @param granularity The target granularity unit.
     * @returns The duration magnitude in the specified unit.
     */
    static convertDurationToUnits(duration: Duration, granularity: TimeGranularityKey): number {
        const luxonUnit = LUXON_UNIT_MAP[granularity];

        if (luxonUnit) {
            return duration.as(luxonUnit);
        }

        // Handle custom/high-precision units by converting to MS first
        const ms = duration.as('milliseconds');

        switch (granularity) {
            case 'MICROSECOND':
                return ms * SCALING_FACTORS['MILLISECOND'];
            case 'NANOSECOND':
                return ms * SCALING_FACTORS['MILLISECOND'] * SCALING_FACTORS['MICROSECOND'];
            case 'DECADE':
                // Need to convert milliseconds to years and then decades. This is an approximation.
                // For accurate calendar calculation use calculateDurationInUnits with DateTime objects.
                const approxYears = ms / Duration.fromObject({ year: 1 }).as('milliseconds');
                return approxYears / SCALING_FACTORS['YEAR'];
            case 'CENTURY':
                const approxYearsC = ms / Duration.fromObject({ year: 1 }).as('milliseconds');
                return approxYearsC / (SCALING_FACTORS['YEAR'] * SCALING_FACTORS['DECADE']);
            default:
                throw new Error(`Unsupported granularity for duration conversion: ${granularity}`);
        }
    }

    /**
     * Rounds a DateTime object down (truncates) to the start of the specified granularity unit.
     * E.g., truncate(2023-10-15 14:30, 'DAY') -> 2023-10-15 00:00.
     * @param dt The DateTime object to truncate.
     * @param granularity The unit to truncate to.
     * @returns A new DateTime object truncated to the start of the unit.
     */
    static truncate(dt: DateTime, granularity: TimeGranularityKey): DateTime {
        const unit = LUXON_UNIT_MAP[granularity];

        if (unit && unit !== 'week') {
            // Luxon supports truncation for milliseconds up to year/quarter
            return dt.startOf(unit);
        }

        // Custom handling for Week, Decade, Century, and high precision units
        switch (granularity) {
            case 'NANOSECOND':
            case 'MICROSECOND':
                // Luxon only handles down to milliseconds naturally.
                // Truncate to millisecond, high precision is preserved as 0 in this context.
                return dt.startOf('millisecond');

            case 'WEEK':
                return dt.startOf('week');

            case 'DECADE':
                // Truncate to the start of the current decade (e.g., 2023 -> 2020)
                const startYearDecade = Math.floor(dt.year / 10) * 10;
                return dt.set({ year: startYearDecade, month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });

            case 'CENTURY':
                // Truncate to the start of the current century (e.g., 2023 -> 2000)
                const startYearCentury = Math.floor(dt.year / 100) * 100;
                return dt.set({ year: startYearCentury, month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });

            default:
                // Fallback for safety, though should be covered by Luxon unit check
                return dt.startOf('year');
        }
    }

    /**
     * Advances a DateTime object by exactly one unit of the specified granularity.
     * Useful for stepping through time series data.
     *
     * @param dt The base DateTime.
     * @param granularity The unit to advance by.
     * @returns A new DateTime object advanced by one unit.
     */
    static advance(dt: DateTime, granularity: TimeGranularityKey): DateTime {
        const luxonUnit = LUXON_UNIT_MAP[granularity];

        if (luxonUnit) {
            // Handle standard Luxon units
            const durationObject = { [luxonUnit]: 1 };
            return dt.plus(durationObject);
        }

        // Custom handling for non-standard Luxon units or high precision
        switch (granularity) {
            case 'NANOSECOND':
                // Not supported practically via Luxon, fall back to millisecond increment
                return dt.plus({ milliseconds: 0 }); // Effectively does nothing unless high-res support is added

            case 'MICROSECOND':
                return dt.plus({ milliseconds: 0 });

            case 'DECADE':
                return dt.plus({ years: 10 });

            case 'CENTURY':
                return dt.plus({ years: 100 });

            default:
                // Should be unreachable if LUXON_UNIT_MAP is exhaustive for all supported types
                throw new Error(`Cannot advance date for granularity: ${granularity}`);
        }
    }

    /**
     * Gets the Luxon DurationUnit corresponding to a TimeGranularityKey.
     * @param granularity The granularity key.
     * @returns The corresponding Luxon DurationUnit or undefined if none exists.
     */
    static getLuxonUnit(granularity: TimeGranularityKey): DurationUnit | undefined {
        return LUXON_UNIT_MAP[granularity];
    }
}
