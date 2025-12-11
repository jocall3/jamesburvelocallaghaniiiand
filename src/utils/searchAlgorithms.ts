import { Application } from '../types';

/**
 * Calculates the Levenshtein distance between two strings.
 * @param a The first string.
 * @param b The second string.
 * @returns The Levenshtein distance.
 */
function levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = [];

    for (let i = 0; i <= m; i++) {
        dp[i] = [i];
    }
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,      // Deletion
                dp[i][j - 1] + 1,      // Insertion
                dp[i - 1][j - 1] + cost // Substitution
            );
        }
    }

    return dp[m][n];
}

/**
 * Calculates a normalized fuzzy score based on the Levenshtein distance.
 * Score is between 0 (no match) and 1 (perfect match).
 * @param str1 The first string.
 * @param str2 The second string.
 * @returns The normalized score.
 */
function normalizedFuzzyScore(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    return 1 - (distance / maxLength);
}

/**
 * Implements fuzzy search logic to find applications despite typos.
 * It scores applications based on how closely their displayName or appId matches the query.
 * @param applications The list of applications to search.
 * @param query The search query string.
 * @returns A sorted list of applications with a 'score' property.
 */
export function fuzzySearchApplications(applications: Application[], query: string): (Application & { score: number })[] {
    if (!query) {
        return applications.map(app => ({ ...app, score: 1.0 })); // Return all with perfect score if query is empty
    }

    const lowerCaseQuery = query.toLowerCase();
    const scoredApplications: (Application & { score: number })[] = [];

    for (const app of applications) {
        let maxScore = 0;

        // 1. Score based on displayName
        const displayNameScore = normalizedFuzzyScore(app.displayName, query);
        maxScore = Math.max(maxScore, displayNameScore);

        // 2. Score based on appId (normalized)
        const appIdScore = normalizedFuzzyScore(app.id, query);
        maxScore = Math.max(maxScore, appIdScore);

        // 3. Score based on components of displayName matching parts of the query (simple token matching)
        if (app.displayName) {
            const appTokens = app.displayName.toLowerCase().split(/\s+/);
            for (const token of appTokens) {
                const tokenScore = normalizedFuzzyScore(token, query);
                maxScore = Math.max(maxScore, tokenScore * 0.8); // Weight token match slightly less
            }
        }
        
        // Bonus: If the query is a substring of the displayName (ignoring case)
        if (app.displayName && app.displayName.toLowerCase().includes(lowerCaseQuery)) {
             maxScore = Math.max(maxScore, 0.95);
        }


        if (maxScore > 0) {
            scoredApplications.push({ ...app, score: maxScore });
        }
    }

    // Sort by score descending
    scoredApplications.sort((a, b) => b.score - a.score);

    return scoredApplications;
}
