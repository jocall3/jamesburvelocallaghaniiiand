export const formatPercentage = (
  value: number | string | null | undefined,
  options: {
    decimals?: number;
    placeholder?: string;
    multiplier?: number;
    includeSymbol?: boolean;
  } = {}
): string => {
  const {
    decimals = 3, // Bond yields often use 3 decimal places (e.g., 3.875%)
    placeholder = '-',
    multiplier = 1, // Use 100 if input is 0.05 for 5%, use 1 if input is 5 for 5%
    includeSymbol = true,
  } = options;

  if (value === null || value === undefined || value === '') {
    return placeholder;
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return placeholder;
  }

  const finalValue = numericValue * multiplier;

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(finalValue);

  return includeSymbol ? `${formattedNumber}%` : formattedNumber;
};