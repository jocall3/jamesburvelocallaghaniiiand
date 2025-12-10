/**
 * A collection of utility functions for common date and time manipulations,
 * formatting, and calculations, ensuring consistency in date handling.
 */

// --- Constants ---
const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
const DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
// ISO 8601 format with milliseconds and timezone offset (e.g., 2023-10-27T10:30:00.123+01:00)
const ISO_8601_LOCAL_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

// --- Helper for zero-padding ---
function padZero(num: number, length: number = 2): string {
  return num.toString().padStart(length, '0');
}

// --- Core Date Formatting Logic ---
/**
 * Formats a Date object into a specified string format.
 * Supports basic tokens: YYYY, MM, DD, HH, mm, ss, SSS, Z (for timezone offset).
 * @param date The Date object to format.
 * @param format The format string (e.g., 'YYYY-MM-DD HH:mm:ss').
 * @returns The formatted date string. Returns an empty string if the date is invalid.
 */
export function formatDateTime(date: Date, format: string = DEFAULT_DATETIME_FORMAT): string {
  if (!isValidDate(date)) {
    return '';
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();

  // Get timezone offset in minutes and convert to +/-HH:mm format
  const offset = date.getTimezoneOffset(); // minutes difference from UTC
  const offsetSign = offset > 0 ? '-' : '+';
  const offsetHours = padZero(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = padZero(Math.abs(offset) % 60);
  const timezoneOffset = `${offsetSign}${offsetHours}:${offsetMinutes}`;

  return format
    .replace(/YYYY/g, year.toString())
    .replace(/MM/g, padZero(month))
    .replace(/DD/g, padZero(day))
    .replace(/HH/g, padZero(hours))
    .replace(/mm/g, padZero(minutes))
    .replace(/ss/g, padZero(seconds))
    .replace(/SSS/g, padZero(milliseconds, 3))
    .replace(/Z/g, timezoneOffset); // 'Z' token replaced with local timezone offset
}

// --- Public Utility Functions ---

/**
 * Checks if a given value is a valid Date object.
 * @param value The value to check.
 * @returns True if the value is a valid Date object, false otherwise.
 */
export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Parses a date string into a Date object.
 * This function relies on the native Date.parse() which can be inconsistent across environments
 * for non-standard formats. For robust parsing of specific formats, a dedicated library is recommended.
 * It works well for ISO 8601 strings and other common formats.
 * @param dateString The date string to parse.
 * @returns A Date object if parsing is successful, otherwise an invalid Date object.
 */
export function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  return date; // Use isValidDate(date) to check if the result is valid
}

/**
 * Returns the current date and time in ISO 8601 format (e.g., '2023-10-27T10:30:00.123Z').
 * This is always UTC time.
 * @returns The current ISO 8601 timestamp in UTC.
 */
export function getCurrentISOTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Returns the current date and time formatted according to the default datetime format.
 * This uses the local timezone of the environment.
 * @returns The current formatted datetime string.
 */
export function getCurrentFormattedDateTime(): string {
  return formatDateTime(new Date(), DEFAULT_DATETIME_FORMAT);
}

/**
 * Returns the current date formatted according to the default date format.
 * This uses the local timezone of the environment.
 * @returns The current formatted date string.
 */
export function getCurrentFormattedDate(): string {
  return formatDateTime(new Date(), DEFAULT_DATE_FORMAT);
}

/**
 * Adds a specified number of days to a given date.
 * @param date The starting Date object.
 * @param days The number of days to add.
 * @returns A new Date object with the added days. Returns an invalid Date if the input is invalid.
 */
export function addDays(date: Date, days: number): Date {
  if (!isValidDate(date)) {
    return new Date(NaN);
  }
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
}

/**
 * Subtracts a specified number of days from a given date.
 * @param date The starting Date object.
 * @param days The number of days to subtract.
 * @returns A new Date object with the subtracted days. Returns an invalid Date if the input is invalid.
 */
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

/**
 * Adds a specified number of hours to a given date.
 * @param date The starting Date object.
 * @param hours The number of hours to add.
 * @returns A new Date object with the added hours. Returns an invalid Date if the input is invalid.
 */
export function addHours(date: Date, hours: number): Date {
  if (!isValidDate(date)) {
    return new Date(NaN);
  }
  const newDate = new Date(date);
  newDate.setHours(date.getHours() + hours);
  return newDate;
}

/**
 * Subtracts a specified number of hours from a given date.
 * @param date The starting Date object.
 * @param hours The number of hours to subtract.
 * @returns A new Date object with the subtracted hours. Returns an invalid Date if the input is invalid.
 */
export function subtractHours(date: Date, hours: number): Date {
  return addHours(date, -hours);
}

/**
 * Calculates the difference in days between two dates.
 * The result is an absolute integer value.
 * @param date1 The first Date object.
 * @param date2 The second Date object.
 * @returns The absolute difference in days. Returns NaN if either date is invalid.
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    return NaN;
  }
  const oneDay = 1000 * 60 * 60 * 24; // milliseconds in a day
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffTime / oneDay);
}

/**
 * Calculates the difference in hours between two dates.
 * The result is an absolute integer value.
 * @param date1 The first Date object.
 * @param date2 The second Date object.
 * @returns The absolute difference in hours. Returns NaN if either date is invalid.
 */
export function getHoursDifference(date1: Date, date2: Date): number {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    return NaN;
  }
  const oneHour = 1000 * 60 * 60; // milliseconds in an hour
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffTime / oneHour);
}

/**
 * Converts a local Date object to its UTC equivalent.
 * @param date The local Date object.
 * @returns A new Date object representing the UTC time. Returns an invalid Date if the input is invalid.
 */
export function toUTC(date: Date): Date {
  if (!isValidDate(date)) {
    return new Date(NaN);
  }
  // getTime() returns milliseconds since epoch, getTimezoneOffset() returns minutes difference from UTC
  // Adding offset converts local time to UTC time in milliseconds
  return new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
}

/**
 * Converts a UTC Date object to its local time equivalent.
 * Note: This assumes the input `date` is already in UTC.
 * @param date The UTC Date object.
 * @returns A new Date object representing the local time. Returns an invalid Date if the input is invalid.
 */
export function toLocal(date: Date): Date {
  if (!isValidDate(date)) {
    return new Date(NaN);
  }
  // Subtracting offset converts UTC time to local time in milliseconds
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
}

/**
 * Formats a Date object into an ISO 8601 string including milliseconds and local timezone offset
 * (e.g., '2023-10-27T10:30:00.123+01:00').
 * For a UTC ISO string, use `date.toISOString()`.
 * @param date The Date object to format.
 * @returns The formatted ISO 8601 string with local timezone offset. Returns an empty string if the date is invalid.
 */
export function formatToISOWithLocalTimezone(date: Date): string {
  if (!isValidDate(date)) {
    return '';
  }
  return formatDateTime(date, ISO_8601_LOCAL_FORMAT);
}

/**
 * Gets the start of the day (midnight, 00:00:00.000) for a given date in local time.
 * @param date The date.
 * @returns A new Date object representing the start of the day. Returns an invalid Date if the input is invalid.
 */
export function startOfDay(date: Date): Date {
  if (!isValidDate(date)) {
    return new Date(NaN);
  }
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Gets the end of the day (23:59:59.999) for a given date in local time.
 * @param date The date.
 * @returns A new Date object representing the end of the day. Returns an invalid Date if the input is invalid.
 */
export function endOfDay(date: Date): Date {
  if (!isValidDate(date)) {
    return new Date(NaN);
  }
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

/**
 * Compares two dates to check if they represent the same day (ignoring time).
 * This comparison is based on local time.
 * @param date1 The first date.
 * @param date2 The second date.
 * @returns True if they are the same day, false otherwise (or if either date is invalid).
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    return false;
  }
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}