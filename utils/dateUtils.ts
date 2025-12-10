export type DateInput = Date | string | number;

/**
 * Checks if a given value is a valid Date object.
 * @param value The value to check.
 * @returns True if the value is a valid Date object, false otherwise.
 */
export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Converts a DateInput into a valid Date object.
 * If the input is already a valid Date, it's returned.
 * If it's a string or number, it attempts to create a Date object.
 * Returns null if the input cannot be converted to a valid Date.
 * @param dateInput The date input (Date, string, or number).
 * @returns A Date object or null if invalid.
 */
export function toDate(dateInput: DateInput): Date | null {
  if (isValidDate(dateInput)) {
    return dateInput;
  }

  let date: Date;
  if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else {
    return null; // Not a recognized input type
  }

  return isValidDate(date) ? date : null;
}

/**
 * Formats a date into a human-readable string using Intl.DateTimeFormat.
 * @param dateInput The date to format (Date, string, or number).
 * @param options Optional formatting options for Intl.DateTimeFormat.
 * @param locale Optional locale string (e.g., 'en-US', 'fr-FR'). Defaults to user's locale.
 * @returns The formatted date string, or an empty string if the date is invalid.
 */
export function formatDate(
  dateInput: DateInput,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale?: string
): string {
  const date = toDate(dateInput);
  if (!date) {
    return '';
  }
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toISOString(); // Fallback to ISO string
  }
}

/**
 * Formats a date to a short date string (e.g., "1/2/2023").
 * @param dateInput The date to format.
 * @param locale Optional locale string.
 * @returns The formatted date string.
 */
export function formatShortDate(dateInput: DateInput, locale?: string): string {
  return formatDate(dateInput, { year: 'numeric', month: 'numeric', day: 'numeric' }, locale);
}

/**
 * Formats a date to a long date string (e.g., "January 2, 2023").
 * @param dateInput The date to format.
 * @param locale Optional locale string.
 * @returns The formatted date string.
 */
export function formatLongDate(dateInput: DateInput, locale?: string): string {
  return formatDate(dateInput, { year: 'numeric', month: 'long', day: 'numeric' }, locale);
}

/**
 * Formats a date to a date and time string (e.g., "Jan 2, 2023, 1:30 PM").
 * @param dateInput The date to format.
 * @param locale Optional locale string.
 * @returns The formatted date and time string.
 */
export function formatDateTime(dateInput: DateInput, locale?: string): string {
  return formatDate(
    dateInput,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    },
    locale
  );
}

/**
 * Formats a date to a time string (e.g., "1:30 PM").
 * @param dateInput The date to format.
 * @param locale Optional locale string.
 * @returns The formatted time string.
 */
export function formatTime(dateInput: DateInput, locale?: string): string {
  return formatDate(
    dateInput,
    {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    },
    locale
  );
}

/**
 * Adds a specified number of days to a date.
 * @param dateInput The base date.
 * @param days The number of days to add.
 * @returns A new Date object with the added days, or null if the input date is invalid.
 */
export function addDays(dateInput: DateInput, days: number): Date | null {
  const date = toDate(dateInput);
  if (!date) {
    return null;
  }
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
}

/**
 * Subtracts a specified number of days from a date.
 * @param dateInput The base date.
 * @param days The number of days to subtract.
 * @returns A new Date object with the subtracted days, or null if the input date is invalid.
 */
export function subtractDays(dateInput: DateInput, days: number): Date | null {
  return addDays(dateInput, -days);
}

/**
 * Adds a specified number of months to a date.
 * @param dateInput The base date.
 * @param months The number of months to add.
 * @returns A new Date object with the added months, or null if the input date is invalid.
 */
export function addMonths(dateInput: DateInput, months: number): Date | null {
  const date = toDate(dateInput);
  if (!date) {
    return null;
  }
  const newDate = new Date(date);
  newDate.setMonth(date.getMonth() + months);
  return newDate;
}

/**
 * Subtracts a specified number of months from a date.
 * @param dateInput The base date.
 * @param months The number of months to subtract.
 * @returns A new Date object with the subtracted months, or null if the input date is invalid.
 */
export function subtractMonths(dateInput: DateInput, months: number): Date | null {
  return addMonths(dateInput, -months);
}

/**
 * Adds a specified number of years to a date.
 * @param dateInput The base date.
 * @param years The number of years to add.
 * @returns A new Date object with the added years, or null if the input date is invalid.
 */
export function addYears(dateInput: DateInput, years: number): Date | null {
  const date = toDate(dateInput);
  if (!date) {
    return null;
  }
  const newDate = new Date(date);
  newDate.setFullYear(date.getFullYear() + years);
  return newDate;
}

/**
 * Subtracts a specified number of years from a date.
 * @param dateInput The base date.
 * @param years The number of years to subtract.
 * @returns A new Date object with the subtracted years, or null if the input date is invalid.
 */
export function subtractYears(dateInput: DateInput, years: number): Date | null {
  return addYears(dateInput, -years);
}

/**
 * Calculates the difference in days between two dates.
 * The time component is ignored for the calculation.
 * @param dateInput1 The first date.
 * @param dateInput2 The second date.
 * @returns The number of days difference (positive if date1 is after date2, negative if before), or 0 if either date is invalid.
 */
export function getDaysDifference(dateInput1: DateInput, dateInput2: DateInput): number {
  const date1 = toDate(dateInput1);
  const date2 = toDate(dateInput2);

  if (!date1 || !date2) {
    return 0;
  }

  // Reset time to midnight for accurate day difference, using UTC to avoid local timezone issues
  const utcDate1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utcDate2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((utcDate1 - utcDate2) / MS_PER_DAY);
}

/**
 * Checks if two dates fall on the same day (ignoring time).
 * @param dateInput1 The first date.
 * @param dateInput2 The second date.
 * @returns True if both dates are valid and fall on the same day, false otherwise.
 */
export function isSameDay(dateInput1: DateInput, dateInput2: DateInput): boolean {
  const date1 = toDate(dateInput1);
  const date2 = toDate(dateInput2);

  if (!date1 || !date2) {
    return false;
  }

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Checks if a given date is today.
 * @param dateInput The date to check.
 * @returns True if the date is today, false otherwise.
 */
export function isToday(dateInput: DateInput): boolean {
  const date = toDate(dateInput);
  if (!date) {
    return false;
  }
  const today = new Date();
  return isSameDay(date, today);
}

/**
 * Checks if a given date is yesterday.
 * @param dateInput The date to check.
 * @returns True if the date is yesterday, false otherwise.
 */
export function isYesterday(dateInput: DateInput): boolean {
  const date = toDate(dateInput);
  if (!date) {
    return false;
  }
  const yesterday = addDays(new Date(), -1);
  return yesterday ? isSameDay(date, yesterday) : false;
}

/**
 * Checks if a given date is tomorrow.
 * @param dateInput The date to check.
 * @returns True if the date is tomorrow, false otherwise.
 */
export function isTomorrow(dateInput: DateInput): boolean {
  const date = toDate(dateInput);
  if (!date) {
    return false;
  }
  const tomorrow = addDays(new Date(), 1);
  return tomorrow ? isSameDay(date, tomorrow) : false;
}

/**
 * Returns a human-readable relative time string (e.g., "2 days ago", "in 5 minutes").
 * Uses Intl.RelativeTimeFormat.
 * @param dateInput The date to compare against the current time.
 * @param locale Optional locale string (e.g., 'en-US', 'fr-FR'). Defaults to user's locale.
 * @returns A relative time string, or an empty string if the date is invalid.
 */
export function getRelativeTime(dateInput: DateInput, locale?: string): string {
  const date = toDate(dateInput);
  if (!date) {
    return '';
  }

  const now = new Date();
  const diffSeconds = (date.getTime() - now.getTime()) / 1000;
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const units: { unit: Intl.RelativeTimeFormatUnit; threshold: number }[] = [
    { unit: 'year', threshold: 365 * 24 * 60 * 60 },
    { unit: 'month', threshold: 30 * 24 * 60 * 60 }, // Approximation
    { unit: 'week', threshold: 7 * 24 * 60 * 60 },
    { unit: 'day', threshold: 24 * 60 * 60 },
    { unit: 'hour', threshold: 60 * 60 },
    { unit: 'minute', threshold: 60 },
    { unit: 'second', threshold: 1 },
  ];

  for (const { unit, threshold } of units) {
    if (Math.abs(diffSeconds) >= threshold) {
      const value = Math.round(diffSeconds / threshold);
      return formatter.format(value, unit);
    }
  }

  // For very small differences, default to 'now' or 'seconds ago/from now'
  return formatter.format(0, 'second');
}

/**
 * Converts a DateInput to an ISO 8601 string (e.g., "2023-01-01T12:00:00.000Z").
 * @param dateInput The date to convert.
 * @returns An ISO 8601 string, or an empty string if the date is invalid.
 */
export function toISOString(dateInput: DateInput): string {
  const date = toDate(dateInput);
  return date ? date.toISOString() : '';
}

/**
 * Converts a DateInput to a YYYY-MM-DD string (local date, no time).
 * @param dateInput The date to convert.
 * @returns A YYYY-MM-DD string, or an empty string if the date is invalid.
 */
export function toYYYYMMDD(dateInput: DateInput): string {
  const date = toDate(dateInput);
  if (!date) {
    return '';
  }
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets the start of the day for a given date (midnight, local time).
 * @param dateInput The date.
 * @returns A new Date object representing the start of the day, or null if the input is invalid.
 */
export function startOfDay(dateInput: DateInput): Date | null {
  const date = toDate(dateInput);
  if (!date) {
    return null;
  }
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Gets the end of the day for a given date (11:59:59.999 PM, local time).
 * @param dateInput The date.
 * @returns A new Date object representing the end of the day, or null if the input is invalid.
 */
export function endOfDay(dateInput: DateInput): Date | null {
  const date = toDate(dateInput);
  if (!date) {
    return null;
  }
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

/**
 * Gets the start of the week for a given date (Sunday by default, local time).
 * @param dateInput The date.
 * @param startOfWeekDay The day to consider as the start of the week (0 for Sunday, 1 for Monday, etc.). Defaults to 0 (Sunday).
 * @returns A new Date object representing the start of the week, or null if the input is invalid.
 */
export function startOfWeek(dateInput: DateInput, startOfWeekDay: number = 0): Date | null {
  const date = toDate(dateInput);
  if (!date) {
    return null;
  }
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = (day < startOfWeekDay) ? (7 - startOfWeekDay + day) : (day - startOfWeekDay);
  const start = new Date(date);
  start.setDate(date.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Gets the end of the week for a given date (Saturday by default, local time).
 * @param dateInput The date.
 * @param startOfWeekDay The day to consider as the start of the week (0 for Sunday, 1 for Monday, etc.). Defaults to 0 (Sunday).
 * @returns A new Date object representing the end of the week, or null if the input is invalid.
 */
export function endOfWeek(dateInput: DateInput, startOfWeekDay: number = 0): Date | null {
  const start = startOfWeek(dateInput, startOfWeekDay);
  if (!start) {
    return null;
  }
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // 6 days after the start of the week
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Gets the start of the month for a given date (local time).
 * @param dateInput The date.
 * @returns A new Date object representing the start of the month, or null if the input is invalid.
 */
export function startOfMonth(dateInput: DateInput): Date | null {
  const date = toDate(dateInput);
  if (!date) {
    return null;
  }
  const newDate = new Date(date);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Gets the end of the month for a given date (local time).
 * @param dateInput The date.
 * @returns A new Date object representing the end of the month, or null if the input is invalid.
 */
export function endOfMonth(dateInput: DateInput): Date | null {
  const date = toDate(dateInput);
  if (!date) {
    return null;
  }
  const newDate = new Date(date);
  newDate.setMonth(date.getMonth() + 1, 0); // Setting day to 0 gets the last day of the previous month
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

/**
 * Gets the number of days in a given month and year.
 * @param year The year.
 * @param month The month (0-indexed, i.e., 0 for January, 11 for December).
 * @returns The number of days in the month.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Compares two dates to determine their chronological order.
 * @param dateInput1 The first date.
 * @param dateInput2 The second date.
 * @returns 0 if dates are equal, -1 if date1 is before date2, 1 if date1 is after date2. Returns 0 if either date is invalid.
 */
export function compareDates(dateInput1: DateInput, dateInput2: DateInput): -1 | 0 | 1 {
  const date1 = toDate(dateInput1);
  const date2 = toDate(dateInput2);

  if (!date1 || !date2) {
    return 0;
  }

  const time1 = date1.getTime();
  const time2 = date2.getTime();

  if (time1 < time2) {
    return -1;
  }
  if (time1 > time2) {
    return 1;
  }
  return 0;
}

/**
 * Checks if the first date is before the second date.
 * @param dateInput1 The first date.
 * @param dateInput2 The second date.
 * @returns True if date1 is before date2, false otherwise (including invalid dates).
 */
export function isBefore(dateInput1: DateInput, dateInput2: DateInput): boolean {
  return compareDates(dateInput1, dateInput2) === -1;
}

/**
 * Checks if the first date is after the second date.
 * @param dateInput1 The first date.
 * @param dateInput2 The second date.
 * @returns True if date1 is after date2, false otherwise (including invalid dates).
 */
export function isAfter(dateInput1: DateInput, dateInput2: DateInput): boolean {
  return compareDates(dateInput1, dateInput2) === 1;
}

/**
 * Checks if the first date is equal to the second date.
 * @param dateInput1 The first date.
 * @param dateInput2 The second date.
 * @returns True if date1 is equal to date2, false otherwise (including invalid dates).
 */
export function isEqual(dateInput1: DateInput, dateInput2: DateInput): boolean {
  return compareDates(dateInput1, dateInput2) === 0;
}

// Note on parsing:
// The `toDate` function relies on the native `new Date(string)` constructor, which is
// generally good for ISO 8601 strings ("YYYY-MM-DDTHH:mm:ss.sssZ") and some other common formats.
// However, its behavior can be inconsistent across browsers for non-standard date strings (e.g., "MM/DD/YYYY" vs "DD/MM/YYYY").
// For robust parsing of arbitrary date string formats, especially those from different
// integrated systems, consider using a dedicated parsing library like `date-fns` or `moment.js`
// if `new Date()` proves insufficient for your specific needs.