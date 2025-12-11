```typescript
export const CUSIP_REGEX = /[0-9]{3}[A-Z0-9]{5}[0-9]/g;
export const DATE_REGEX = /(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}/g;
export const AMOUNT_REGEX = /\b(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?\s*(?:USD|EUR|GBP|JPY)?\b/g;
export const ISIN_REGEX = /[A-Z]{2}[A-Z0-9]{9}[0-9]/g;
```