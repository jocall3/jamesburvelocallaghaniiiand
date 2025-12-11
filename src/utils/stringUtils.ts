export const parseCsvLine = (line: string): string[] => {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    // Trim leading whitespace from the line
    line = line.trim();

    while (i < line.length) {
        const char = line[i];

        if (inQuotes) {
            if (char === '"') {
                // Check for escaped quote ("")
                if (i + 1 < line.length && line[i + 1] === '"') {
                    currentField += '"';
                    i++; // Skip the next quote
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                fields.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        i++;
    }

    fields.push(currentField); // Add the last field

    return fields;
};


/**
 * Formats an ISO date string into a more readable format.
 * Example: '2022-05-04T08:14:29Z' -> 'May 4, 2022'
 *
 * @param isoString - The ISO date string.
 * @returns A formatted date string, or an empty string if the input is invalid or empty.
 */
export const formatDate = (isoString: string): string => {
    if (!isoString?.trim()) {
        return '';
    }
    try {
        const date = new Date(isoString);
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return '';
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC', // Ensure consistent parsing regardless of local timezone
        });
    } catch (error) {
        console.error(`Invalid date string: ${isoString}`, error);
        return '';
    }
};

/**
 * Parses a string value ("True", "False") into a boolean.
 * The comparison is case-insensitive.
 *
 * @param value - The string to parse.
 * @returns `true` if the string is 'True', `false` if 'False', otherwise `undefined`.
 */
export const parseBoolean = (value: string): boolean | undefined => {
    if (!value) {
        return undefined;
    }
    const lowercasedValue = value.toLowerCase().trim();
    if (lowercasedValue === 'true') {
        return true;
    }
    if (lowercasedValue === 'false') {
        return false;
    }
    return undefined;
};


/**
 * Truncates a string to a specified length and appends an ellipsis if truncated.
 *
 * @param text - The string to truncate.
 * @param maxLength - The maximum length of the string before truncation.
 * @returns The truncated string.
 */
export const truncateString = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return `${text.substring(0, maxLength).trim()}...`;
};

/**
 * A simple regex to validate if a string is in UUID format.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks if a given string is a valid UUID.
 *
 * @param str - The string to check.
 * @returns `true` if the string is a valid UUID, `false` otherwise.
 */
export const isUUID = (str: string): boolean => {
    if (!str) {
        return false;
    }
    return UUID_REGEX.test(str);
};

/**
 * Converts a string from camelCase to a user-friendly Title Case format.
 * Example: 'displayName' -> 'Display Name'
 *
 * @param camelCaseStr - The camelCase string to convert.
 * @returns The formatted string in Title Case.
 */
export const camelCaseToTitle = (camelCaseStr: string): string => {
    if (!camelCaseStr) {
        return '';
    }
    // Add a space before each uppercase letter
    const result = camelCaseStr.replace(/([A-Z])/g, ' $1');
    // Capitalize the first letter and trim whitespace
    return result.charAt(0).toUpperCase() + result.slice(1).trim();
};