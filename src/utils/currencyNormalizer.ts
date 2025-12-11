/**
 * @file This file contains utility functions for currency normalization and formatting.
 * It provides a way to convert various currencies into a single, unified base
 * currency for consistent display and processing within the application.
 */

// The unified base currency for display across the application.
const BASE_CURRENCY = 'USD';

// Mock exchange rates relative to the BASE_CURRENCY.
// In a real application, these would be fetched from a reliable financial data API.
// The rate represents how many units of the base currency (USD) one unit of the key currency is worth.
// E.g., { 'EUR': 1.08 } means 1 EUR = 1.08 USD.
const MOCK_EXCHANGE_RATES: { [key: string]: number } = {
  USD: 1.00,       // Base currency
  EUR: 1.08,       // 1 Euro = 1.08 US Dollar
  JPY: 0.0064,     // 1 Japanese Yen = 0.0064 US Dollar
  GBP: 1.27,       // 1 British Pound = 1.27 US Dollar
  AUD: 0.66,       // 1 Australian Dollar = 0.66 US Dollar
  CAD: 0.73,       // 1 Canadian Dollar = 0.73 US Dollar
  CHF: 1.11,       // 1 Swiss Franc = 1.11 US Dollar
  CNY: 0.14,       // 1 Chinese Yuan = 0.14 US Dollar
  INR: 0.012,      // 1 Indian Rupee = 0.012 US Dollar
  MXN: 0.060,      // 1 Mexican Peso = 0.060 US Dollar
};

/**
 * Represents a monetary value with its currency.
 */
export interface Money {
  amount: number;
  currency: string; // ISO 4217 currency code
}

/**
 * Converts a monetary value from its original currency to the unified base currency (USD).
 * This function uses a mock, static exchange rate for demonstration purposes.
 * In a real-world scenario, these rates should be fetched from a live API.
 *
 * @param {Money} value The monetary value to convert.
 * @returns {Money} The converted monetary value in the base currency.
 * @throws {Error} If the currency code is not supported.
 */
export const normalizeCurrency = (value: Money): Money => {
  const { amount, currency } = value;
  const upperCaseCurrency = currency.toUpperCase();

  if (!(upperCaseCurrency in MOCK_EXCHANGE_RATES)) {
    // Throw an error for unsupported currencies to ensure the calling code is aware.
    // Alternative strategies could include logging an error and returning the original value
    // or attempting a default conversion.
    throw new Error(`Unsupported currency for normalization: ${currency}`);
  }

  // If the currency is already the base currency, no conversion is needed.
  if (upperCaseCurrency === BASE_CURRENCY) {
    return { amount, currency: BASE_CURRENCY };
  }

  const rate = MOCK_EXCHANGE_RATES[upperCaseCurrency];
  const convertedAmount = amount * rate;

  return {
    amount: convertedAmount,
    currency: BASE_CURRENCY,
  };
};

/**
 * Formats a monetary value for display using the browser's internationalization API.
 * Includes currency symbol and appropriate number formatting for the given locale.
 *
 * @param {Money} value The monetary value to format.
 * @param {string} [locale='en-US'] The BCP 47 language tag for the locale to use for formatting.
 * @returns {string} The formatted currency string (e.g., "$1,234.56").
 */
export const formatCurrency = (value: Money, locale: string = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: value.currency,
  }).format(value.amount);
};

/**
 * A convenience function that combines normalization and formatting.
 * It first converts the given monetary value to the base currency and then
 * formats it for display in a specified locale.
 *
 * @param {Money} value The monetary value to normalize and format.
 * @param {string} [locale='en-US'] The BCP 47 language tag for the locale to use for formatting.
 * @returns {string} The formatted string of the value in the base currency.
 * @throws {Error} If the currency code is not supported.
 */
export const displayInBaseCurrency = (value: Money, locale: string = 'en-US'): string => {
  const normalizedValue = normalizeCurrency(value);
  return formatCurrency(normalizedValue, locale);
};