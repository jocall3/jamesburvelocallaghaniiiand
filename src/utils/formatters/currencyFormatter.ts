export const formatCompactCurrency = (
  value: number | string | undefined | null,
  currencyCode: string = 'USD',
  fractionDigits: number = 2
): string => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '-';
  }

  // Determine the currency symbol
  let symbol = currencyCode;
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).formatToParts(0);
    const currencyPart = parts.find((part) => part.type === 'currency');
    if (currencyPart) {
      symbol = currencyPart.value;
    }
  } catch (e) {
    // Fallback if currency code is invalid
    symbol = currencyCode;
  }

  const absValue = Math.abs(num);
  let suffix = '';
  let formattedNumber = num;

  if (absValue >= 1.0e12) {
    suffix = 'T';
    formattedNumber = num / 1.0e12;
  } else if (absValue >= 1.0e9) {
    suffix = 'B';
    formattedNumber = num / 1.0e9;
  } else if (absValue >= 1.0e6) {
    suffix = 'M';
    formattedNumber = num / 1.0e6;
  } else if (absValue >= 1.0e3) {
    suffix = 'K';
    formattedNumber = num / 1.0e3;
  }

  // Format the number to fixed decimals and remove unnecessary trailing zeros
  // e.g., 10.00 -> 10, 10.50 -> 10.5
  const numberString = formattedNumber.toFixed(fractionDigits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1');

  return `${symbol}${numberString}${suffix}`;
};

export const formatStandardCurrency = (
  value: number | string | undefined | null,
  currencyCode: string = 'USD'
): string => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '-';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(num);
  } catch (e) {
    return `${num} ${currencyCode}`;
  }
};