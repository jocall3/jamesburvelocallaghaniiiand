import { format, parseISO, isValid, parse } from 'date-fns';

/**
 * Defines common date formats that might be encountered from Bank of America systems.
 * This list can be extended as needed based on actual API responses or statement formats.
 */
const BOA_DATE_FORMATS = [
  'yyyy-MM-dd',       // Common ISO format
  'MM/dd/yyyy',       // US standard
  'M/d/yyyy',         // US standard without leading zeros
  'yyyyMMdd',         // Compact format
  'MMM dd, yyyy',     // e.g., "Jan 01, 2023"
  'MM-dd-yyyy',       // hyphenated US standard
];

/**
 * Parses a Bank of America date string into a Date object.
 * It attempts to parse the date using a predefined set of common formats.
 *
 * @param dateString The date string to parse.
 * @returns A Date object if parsing is successful, otherwise null.
 */
export function parseBoADateString(dateString: string | null | undefined): Date | null {
  if (!dateString) {
    return null;
  }

  // First, try parsing as ISO string (most robust for standard formats)
  const isoDate = parseISO(dateString);
  if (isValid(isoDate)) {
    return isoDate;
  }

  // If not ISO, try predefined formats
  for (const fmt of BOA_DATE_FORMATS) {
    const parsedDate = parse(dateString, fmt, new Date());
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  }

  console.warn(`[BoA Helper] Could not parse date string: "${dateString}" with known formats.`);
  return null;
}

/**
 * Formats a Date object into a standardized string format (e.g., 'yyyy-MM-dd').
 * This ensures consistency across the application for display or further processing.
 *
 * @param date The Date object to format.
 * @param outputFormat The desired output format string (default: 'yyyy-MM-dd').
 * @returns A formatted date string, or an empty string if the date is invalid.
 */
export function formatBoADate(date: Date | null | undefined, outputFormat: string = 'yyyy-MM-dd'): string {
  if (!date || !isValid(date)) {
    return '';
  }
  return format(date, outputFormat);
}

/**
 * Normalizes a Bank of America transaction description.
 * This function can clean up common patterns, remove unnecessary characters,
 * or standardize vendor names.
 *
 * @param description The raw transaction description string.
 * @returns A normalized transaction description.
 */
export function normalizeBoATransactionDescription(description: string | null | undefined): string {
  if (!description) {
    return '';
  }

  let normalized = description.trim();

  // Convert to uppercase for easier comparison, then revert case later if needed
  normalized = normalized.toUpperCase();

  // Remove common prefixes/suffixes that add little value
  normalized = normalized.replace(/BANK OF AMERICA|BOA|B OF A/g, '');
  normalized = normalized.replace(/PURCHASE|DEBIT|CREDIT|PAYMENT|TRANSFER/g, '');
  normalized = normalized.replace(/ONLINE BANKING|MOBILE BANKING/g, '');
  normalized = normalized.replace(/POS TRANSACTION|ATM WITHDRAWAL/g, '');
  normalized = normalized.replace(/CARD #[0-9]{4}/g, ''); // Remove card numbers like "CARD #1234"

  // Remove multiple spaces and trim again
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Example: Standardize common merchant names
  if (normalized.includes('STARBUCKS')) {
    normalized = 'Starbucks';
  } else if (normalized.includes('AMAZON')) {
    normalized = 'Amazon';
  } else if (normalized.includes('WALMART')) {
    normalized = 'Walmart';
  } else if (normalized.includes('TARGET')) {
    normalized = 'Target';
  } else if (normalized.includes('UBER')) {
    normalized = 'Uber';
  } else if (normalized.includes('LYFT')) {
    normalized = 'Lyft';
  }

  // Capitalize first letter of each word for better readability, unless it's a known acronym
  normalized = normalized.toLowerCase().split(' ').map(word => {
    if (word.length === 0) return '';
    // Keep common acronyms uppercase if they were already
    const originalWord = description.split(' ').find(w => w.toUpperCase() === word.toUpperCase());
    if (originalWord && originalWord === originalWord.toUpperCase() && originalWord.length > 1) {
      return originalWord;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');

  return normalized.trim();
}

/**
 * Formats a numeric amount into a currency string, typically USD.
 *
 * @param amount The numeric amount to format.
 * @param currency The currency code (default: 'USD').
 * @param locale The locale for formatting (default: 'en-US').
 * @returns A formatted currency string (e.g., "$1,234.56").
 */
export function formatBoACurrency(amount: number | null | undefined, currency: string = 'USD', locale: string = 'en-US'): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '';
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Masks a Bank of America account number for display purposes, showing only the last four digits.
 *
 * @param accountNumber The full account number string.
 * @returns A masked account number string (e.g., "XXXXXXXX1234").
 */
export function maskBoAAccountNumber(accountNumber: string | null | undefined): string {
  if (!accountNumber) {
    return '';
  }
  const cleanedNumber = accountNumber.replace(/\D/g, ''); // Remove non-digits
  if (cleanedNumber.length <= 4) {
    return cleanedNumber; // If less than 4 digits, just return it
  }
  const lastFour = cleanedNumber.slice(-4);
  const maskedPart = 'X'.repeat(cleanedNumber.length - 4);
  return maskedPart + lastFour;
}

/**
 * Determines if a given transaction is a credit (money coming in) based on its amount.
 *
 * @param amount The transaction amount.
 * @returns True if the amount is positive (credit), false otherwise.
 */
export function isCreditTransaction(amount: number | null | undefined): boolean {
  return typeof amount === 'number' && amount > 0;
}

/**
 * Determines if a given transaction is a debit (money going out) based on its amount.
 *
 * @param amount The transaction amount.
 * @returns True if the amount is negative (debit), false otherwise.
 */
export function isDebitTransaction(amount: number | null | undefined): boolean {
  return typeof amount === 'number' && amount < 0;
}

/**
 * Safely converts a string to a number, handling null, undefined, or non-numeric strings.
 *
 * @param value The string value to convert.
 * @param defaultValue The value to return if conversion fails (default: 0).
 * @returns The numeric value or the default value.
 */
export function safeParseNumber(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}<ctrl63>