import { Identity } from "../identity";

const APPLICATION_TYPES = ['Enterprise Application', 'Microsoft Application', 'Managed Identity', ''];
const VISIBILITY_TYPES = ['Visible', 'Hidden'];
const DISPLAY_NAME_WORDS = [
  'Azure', 'Microsoft', 'Office', 'Data', 'Service', 'Management',
  'API', 'Connector', 'Provider', 'Application', 'Online', 'Cloud',
  'Platform', 'Security', 'Identity', 'Resource', 'Gateway', 'Proxy',
  'Test', 'Dev', 'Prod', 'System', 'Client', 'Server', 'Storage', 'Dynamics',
  'Power', 'Automation', 'Graph', 'Analytics', 'Virtual', 'Desktop', 'Bot',
  'Machine Learning', 'Exchange', 'SharePoint', 'Teams', 'Intune', 'Defender'
];
const CSV_HEADER = 'id,displayName,appId,createdDateTime,applicationType,accountEnabled,applicationVisibility,assignmentRequired,isAppProxy';

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomBoolean(trueProbability = 0.5): boolean {
  return Math.random() < trueProbability;
}

function generateRandomDate(start: Date, end: Date): string {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString();
}

/**
 * Generates a single mock identity object.
 */
function generateMockIdentity(): Identity {
    const startDate = new Date(2020, 0, 1);
    const endDate = new Date();
    const wordCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 words
    
    const words = Array.from({ length: wordCount }, () => getRandomItem(DISPLAY_NAME_WORDS));
    let displayName = words.join(' ');

    if (generateRandomBoolean(0.2)) { // 20% chance to add a suffix
        displayName += `-${Math.floor(Math.random() * 10000)}`;
    }
    
    if (generateRandomBoolean(0.05)) { // 5% chance to have a trailing space
        displayName += ' ';
    }

    return {
        id: generateUuid(),
        displayName: displayName,
        appId: generateUuid(),
        createdDateTime: generateRandomDate(startDate, endDate),
        applicationType: getRandomItem(APPLICATION_TYPES),
        accountEnabled: generateRandomBoolean(0.9),
        applicationVisibility: getRandomItem(VISIBILITY_TYPES),
        assignmentRequired: generateRandomBoolean(0.4),
        isAppProxy: generateRandomBoolean(0.05),
    };
}

/**
 * Generates an array of mock identity objects.
 * @param count The number of identities to generate.
 * @returns An array of Identity objects.
 */
export function generateMockIdentities(count: number): Identity[] {
    const identities: Identity[] = [];
    for (let i = 0; i < count; i++) {
        identities.push(generateMockIdentity());
    }
    return identities;
}

/**
 * Generates a mock CSV string of identity data.
 * @param count The number of data rows to generate (excluding the header).
 * @returns a CSV formatted string.
 */
export function generateMockCsv(count: number): string {
    const identities = generateMockIdentities(count);
    
    const rows = identities.map(identity => {
        // Simple quoting for display names that might contain commas, as seen in sample data.
        const displayNameField = identity.displayName.includes(',') ? `"${identity.displayName}"` : identity.displayName;
        
        const toTitleCase = (b: boolean) => b ? 'True' : 'False';

        return [
            identity.id,
            displayNameField,
            identity.appId,
            identity.createdDateTime,
            identity.applicationType,
            toTitleCase(identity.accountEnabled),
            identity.applicationVisibility,
            toTitleCase(identity.assignmentRequired),
            toTitleCase(identity.isAppProxy),
        ].join(',');
    });

    return [CSV_HEADER, ...rows].join('\n');
}