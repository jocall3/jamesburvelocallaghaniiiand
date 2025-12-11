export interface Application {
    id: string;
    displayName: string;
    appId: string;
    createdDateTime: Date | null;
    applicationType: string | null;
    accountEnabled: boolean;
    applicationVisibility: 'Visible' | 'Hidden' | null;
    assignmentRequired: boolean;
    isAppProxy: boolean;
}

const parseCsvLine = (line: string): string[] => {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    currentField += '"';
                    i++;
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
    }
    fields.push(currentField);
    return fields;
};

const parseBoolean = (value: string): boolean => {
    return value.trim().toLowerCase() === 'true';
};

export const parseApplicationsCSV = (csvData: string): Application[] => {
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 2) {
        return [];
    }

    const dataLines = lines.slice(1);

    return dataLines
        .filter(line => line.trim() !== '')
        .map((line, index) => {
            const columns = parseCsvLine(line);

            if (columns.length !== 9) {
                console.warn(`[Line ${index + 2}] Skipping malformed CSV line: expected 9 columns, but found ${columns.length}. Line: "${line}"`);
                return null;
            }

            try {
                const application: Application = {
                    id: columns[0].trim(),
                    displayName: columns[1].trim(),
                    appId: columns[2].trim(),
                    createdDateTime: columns[3] ? new Date(columns[3].trim()) : null,
                    applicationType: columns[4].trim() || null,
                    accountEnabled: parseBoolean(columns[5]),
                    applicationVisibility: (columns[6].trim() as 'Visible' | 'Hidden') || null,
                    assignmentRequired: parseBoolean(columns[7]),
                    isAppProxy: parseBoolean(columns[8]),
                };
                
                if (columns[3] && isNaN(application.createdDateTime!.getTime())) {
                    console.warn(`[Line ${index + 2}] Invalid date format for createdDateTime: "${columns[3]}"`);
                    application.createdDateTime = null;
                }

                return application;
            } catch (error) {
                console.error(`[Line ${index + 2}] Error parsing CSV line: "${line}"`, error);
                return null;
            }
        })
        .filter((app): app is Application => app !== null);
};