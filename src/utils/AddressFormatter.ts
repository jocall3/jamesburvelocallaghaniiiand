```typescript
import { getAddress } from 'ethers';

/**
 * Truncates an Ethereum address to a shorter, more readable format.
 * @param address The Ethereum address to truncate.
 * @param startChars The number of characters to show at the beginning of the address. Default is 6.
 * @param endChars The number of characters to show at the end of the address. Default is 4.
 * @returns The truncated address, or an empty string if the input is not a valid address.
 */
export const truncateAddress = (
  address: string | null | undefined,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (!address) {
    return '';
  }

  try {
    const checksummedAddress = getAddress(address); // Validate address and convert to checksummed format

    if (checksummedAddress.length <= startChars + endChars + 2) {
      return checksummedAddress; // No need to truncate if it's already short enough
    }

    return `${checksummedAddress.substring(0, startChars)}...${checksummedAddress.substring(checksummedAddress.length - endChars)}`;
  } catch (error) {
    // Handle invalid address format
    console.warn("Invalid address:", address, error);
    return '';
  }
};


/**
 * Checks if an Ethereum address has a valid checksum.
 * @param address The Ethereum address to validate.
 * @returns True if the address has a valid checksum, false otherwise.  Also returns false if the address is invalid format.
 */
export const isValidChecksumAddress = (address: string | null | undefined): boolean => {
  if (!address) {
    return false;
  }

  try {
    const checksummedAddress = getAddress(address);
    return checksummedAddress === address;
  } catch (error) {
    // Handle invalid address format
    return false;
  }
};

/**
 * Formats an Ethereum address with checksum validation.
 * @param address The Ethereum address to format.
 * @returns The checksummed address, or the original address if it is already valid, or an empty string if the input is not a valid address.
 */
export const formatAddress = (address: string | null | undefined): string => {
  if (!address) {
    return '';
  }

  try {
    return getAddress(address); // Returns the checksummed address
  } catch (error) {
    // Handle invalid address format
    console.warn("Invalid address:", address, error);
    return '';
  }
};
```