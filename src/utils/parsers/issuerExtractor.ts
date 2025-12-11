```typescript
// src/utils/parsers/issuerExtractor.ts

const issuerAliases: { [key: string]: string } = {
  "USA": "United States Treasury",
  "U.S. Treasury": "United States Treasury",
  "United States of America": "United States Treasury",
  // Add more aliases as needed
};

/**
 * Extracts and normalizes the issuer name from a raw string.
 *
 * @param rawIssuer - The raw issuer string to process.
 * @returns The normalized issuer name, or the original string if no normalization is found.
 */
export function extractIssuer(rawIssuer: string): string {
  const trimmedIssuer = rawIssuer.trim();
  return issuerAliases[trimmedIssuer] || trimmedIssuer;
}
```