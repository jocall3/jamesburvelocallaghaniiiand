/**
 * Utility function for formatting Unix timestamps into human-readable date strings.
 * Extracted from the seed file.
 *
 * @param timestamp - The Unix timestamp (in seconds) to format.
 * @param format - The desired output format. Defaults to 'YYYY-MM-DD HH:mm:ss'.
 *                 Supported placeholders:
 *                 - YYYY: Full year (e.g., 2023)
 *                 - YY: Two-digit year (e.g., 23)
 *                 - MM: Month with leading zero (e.g., 01, 12)
 *                 - M: Month without leading zero (e.g., 1, 12)
 *                 - DD: Day with leading zero (e.g., 01, 31)
 *                 - D: Day without leading zero (e.g., 1, 31)
 *                 - HH: Hour (24-hour format) with leading zero (e.g., 00, 23)
 *                 - H: Hour (24-hour format) without leading zero (e.g., 0, 23)
 *                 - hh: Hour (12-hour format) with leading zero (e.g., 01, 12)
 *                 - h: Hour (12-hour format) without leading zero (e.g., 1, 12)
 *                 - mm: Minute with leading zero (e.g., 00, 59)
 *                 - m: Minute without leading zero (e.g., 0, 59)
 *                 - ss: Second with leading zero (e.g., 00, 59)
 *                 - s: Second without leading zero (e.g., 0, 59)
 *                 - A: AM/PM indicator (uppercase)
 *                 - a: am/pm indicator (lowercase)
 * @returns The formatted date string.
 */
export function formatDate(timestamp: number, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const replacements: { [key: string]: string } = {
    YYYY: String(year),
    YY: String(year).slice(-2),
    MM: String(month).padStart(2, '0'),
    M: String(month),
    DD: String(day).padStart(2, '0'),
    D: String(day),
    HH: String(hours).padStart(2, '0'),
    H: String(hours),
    hh: String(hours % 12 || 12).padStart(2, '0'), // 12-hour format, 0 becomes 12
    h: String(hours % 12 || 12),
    mm: String(minutes).padStart(2, '0'),
    m: String(minutes),
    ss: String(seconds).padStart(2, '0'),
    s: String(seconds),
    A: hours >= 12 ? 'PM' : 'AM',
    a: hours >= 12 ? 'pm' : 'am',
  };

  let formattedString = format;
  for (const key in replacements) {
    const regex = new RegExp(key, 'g');
    formattedString = formattedString.replace(regex, replacements[key]);
  }

  return formattedString;
}