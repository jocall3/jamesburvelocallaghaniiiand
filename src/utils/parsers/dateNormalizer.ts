```typescript
export const normalizeDate = (dateString: string): string | null => {
  if (!dateString) {
    return null;
  }

  const formats = [
    {
      regex: /(\d{1,2})([a-zA-Z]{3})(\d{4})/,
      parser: (match: string[]) => {
        const day = parseInt(match[1], 10);
        const monthStr = match[2];
        const year = parseInt(match[3], 10);

        const month = getMonthFromString(monthStr);
        if (isNaN(month)) return null;

        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) return null;
        return date.toISOString();
      },
    },
    {
      regex: /(\d{1,2})([a-zA-Z]{3})(\d{2})/,
      parser: (match: string[]) => {
        const day = parseInt(match[1], 10);
        const monthStr = match[2];
        const yearShort = parseInt(match[3], 10);
        const year = 2000 + yearShort; // Assuming 21st century

        const month = getMonthFromString(monthStr);
         if (isNaN(month)) return null;

        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) return null;
        return date.toISOString();
      },
    },
    {
      regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // dd/mm/yyyy
      parser: (match: string[]) => {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        const date = new Date(year, month, day);
         if (isNaN(date.getTime())) return null;
        return date.toISOString();
      },
    },
    {
        regex: /(\d{4})-(\d{2})-(\d{2})/, // yyyy-mm-dd
        parser: (match: string[]) => {
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const day = parseInt(match[3], 10);
          const date = new Date(year, month, day);
           if (isNaN(date.getTime())) return null;
          return date.toISOString();
        },
      },
  ];

  for (const format of formats) {
    const match = dateString.match(format.regex);
    if (match) {
      const parsedDate = format.parser(match);
      if(parsedDate) return parsedDate;
    }
  }

  return null;
};

const getMonthFromString = (monthStr: string): number => {
  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const monthIndex = monthNames.findIndex(
    (monthName) => monthName === monthStr.toLowerCase()
  );
  return monthIndex;
};
```