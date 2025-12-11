/**
 * Formats an ISO 8601 date string into a more readable, localized format including time.
 * Handles null, undefined, or empty strings by returning 'N/A'.
 *
 * @param isoString The ISO date string to format (e.g., "2022-05-04T08:14:29Z").
 * @returns A formatted string like "May 4, 2022, 08:14:29" (locale-dependent) or "N/A".
 */
export const formatIsoDateTime = (isoString: string | null | undefined): string => {
  if (!isoString) {
    return 'N/A';
  }

  try {
    const date = new Date(isoString);

    // An empty or invalid date string will result in an invalid Date object.
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    
    // Using `undefined` for locale uses the runtime's default locale,
    // providing a format familiar to the user.
    const formattedDate = date.toLocaleDateString(undefined, dateOptions);
    const formattedTime = date.toLocaleTimeString(undefined, timeOptions);

    return `${formattedDate} ${formattedTime}`;

  } catch (error) {
    console.error(`Error formatting date string: "${isoString}"`, error);
    return 'Invalid Date';
  }
};

/**
 * Formats an ISO 8601 date string into a short, localized date-only format.
 * Handles null, undefined, or empty strings by returning 'N/A'.
 *
 * @param isoString The ISO date string to format (e.g., "2022-05-04T08:14:29Z").
 * @returns A formatted string like "May 4, 2022" (locale-dependent) or "N/A".
 */
export const formatIsoDate = (isoString: string | null | undefined): string => {
    if (!isoString) {
      return 'N/A';
    }
  
    try {
      const date = new Date(isoString);
  
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
  
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
  
      return date.toLocaleDateString(undefined, options);
  
    } catch (error) {
        console.error(`Error formatting date string: "${isoString}"`, error);
        return 'Invalid Date';
    }
  };