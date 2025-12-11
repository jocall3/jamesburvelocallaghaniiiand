export const validateISIN = (isin: string): boolean => {
  if (!isin || typeof isin !== 'string' || isin.length !== 12) {
    return false;
  }

  const normalizedIsin = isin.toUpperCase();
  const formatRegex = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

  if (!formatRegex.test(normalizedIsin)) {
    return false;
  }

  const digits: number[] = [];

  for (let i = 0; i < normalizedIsin.length; i++) {
    const charCode = normalizedIsin.charCodeAt(i);
    // Digits 0-9
    if (charCode >= 48 && charCode <= 57) {
      digits.push(charCode - 48);
    }
    // Letters A-Z
    else {
      const val = charCode - 55; // 'A' is 65, so 65 - 55 = 10
      digits.push(Math.floor(val / 10));
      digits.push(val % 10);
    }
  }

  let sum = 0;
  let double = false;

  // Process digits from right to left
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];

    if (double) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
};