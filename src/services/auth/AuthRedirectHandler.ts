import {  } from 'url'; // Ensure URL types are available if in Node environment, though this is likely browser-side or universal.

/**
 * Interface representing the extracted authentication data from the redirect URL.
 */
export interface AuthTokenData {
    /** The OAuth2 access token */
    accessToken?: string;
    /** The OIDC ID token if present */
    idToken?: string;
    /** The authorization code (for code flow) */
    code?: string;
    /** The type of token (usually 'Bearer') */
    tokenType: string;
    /** Token expiration time in seconds */
    expiresIn: number;
    /** The scopes granted by the authorization server */
    scope: string;
    /** The state parameter returned for CSRF protection */
    state: string;
    /** Any custom parameters returned by the provider */
    rawParams: Record<string, string>;
}

/**
 * Result object returned by the redirect handler.
 */
export interface AuthParseResult {
    /** Whether the parsing and validation were successful */
    success: boolean;
    /** The extracted token data if successful */
    data?: AuthTokenData;
    /** Error message if unsuccessful */
    error?: string;
}

/**
 * Service responsible for handling the redirect callback from OAuth2 providers (specifically Google).
 * It parses the URL (hash or query string) to extract tokens, codes, and state parameters.
 */
export class AuthRedirectHandler {
    
    /**
     * Parses the provided redirect URL to extract authentication artifacts.
     * Supports both Implicit Flow (Hash fragment) and Authorization Code Flow (Query parameters).
     * 
     * @param currentUrl The full URL received after the redirect (e.g., window.location.href).
     * @param expectedState (Optional) The state value generated before the auth request to validate against CSRF.
     * @returns AuthParseResult containing the extracted data or error details.
     */
    public handleRedirect(currentUrl: string, expectedState?: string): AuthParseResult {
        try {
            // Use the URL API for robust parsing
            const url = new URL(currentUrl);
            
            // 1. Check for errors in Query Parameters (Standard OAuth2 error response)
            if (url.searchParams.has('error')) {
                return this.createErrorResult(url.searchParams);
            }

            // 2. Check for errors in Hash Parameters (Implicit/Hybrid flow error response)
            // Note: URL.hash includes the '#', so we strip it.
            let hashParams: URLSearchParams | null = null;
            if (url.hash && url.hash.length > 1) {
                hashParams = new URLSearchParams(url.hash.substring(1));
                if (hashParams.has('error')) {
                    return this.createErrorResult(hashParams);
                }
            }

            // 3. Attempt to extract success data from Hash (Priority for Implicit Flow)
            if (hashParams && (hashParams.has('access_token') || hashParams.has('id_token') || hashParams.has('code'))) {
                return this.processParams(hashParams, expectedState);
            }

            // 4. Attempt to extract success data from Query (Priority for Code Flow)
            if (url.searchParams.has('code') || url.searchParams.has('access_token')) {
                return this.processParams(url.searchParams, expectedState);
            }

            return {
                success: false,
                error: 'No valid authentication artifacts (token, code, or error) found in the redirect URL.'
            };

        } catch (error: any) {
            return {
                success: false,
                error: `Failed to parse redirect URL: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Processes the extracted URLSearchParams to build the AuthTokenData object.
     * Performs state validation if an expected state is provided.
     */
    private processParams(params: URLSearchParams, expectedState?: string): AuthParseResult {
        const state = params.get('state');

        // CSRF Protection: Validate state
        if (expectedState && state !== expectedState) {
            return {
                success: false,
                error: `Invalid state parameter. Expected '${expectedState}' but received '${state}'. Potential CSRF attack detected.`
            };
        }

        const accessToken = params.get('access_token');
        const code = params.get('code');
        const idToken = params.get('id_token');

        // Ensure at least one major artifact exists
        if (!accessToken && !code && !idToken) {
            return {
                success: false,
                error: 'Redirect URL contained parameters but lacked access_token, code, or id_token.'
            };
        }

        // Parse expiration
        const expiresInStr = params.get('expires_in');
        const expiresIn = expiresInStr ? parseInt(expiresInStr, 10) : 0;

        // Collect all raw params for flexibility
        const rawParams: Record<string, string> = {};
        params.forEach((value, key) => {
            rawParams[key] = value;
        });

        const data: AuthTokenData = {
            accessToken: accessToken || undefined,
            code: code || undefined,
            idToken: idToken || undefined,
            tokenType: params.get('token_type') || 'Bearer',
            expiresIn: expiresIn,
            scope: params.get('scope') || '',
            state: state || '',
            rawParams: rawParams
        };

        return {
            success: true,
            data: data
        };
    }

    /**
     * Helper to construct an error result from params containing 'error' and 'error_description'.
     */
    private createErrorResult(params: URLSearchParams): AuthParseResult {
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        const errorUri = params.get('error_uri');

        let fullMessage = `Auth Error: ${error}`;
        if (errorDescription) {
            fullMessage += ` - ${errorDescription}`;
        }
        if (errorUri) {
            fullMessage += ` (See: ${errorUri})`;
        }

        return {
            success: false,
            error: fullMessage
        };
    }

    /**
     * Cleans the URL bar by removing the query string and hash fragment.
     * This is a security best practice to prevent tokens from remaining visible in the browser history or address bar.
     * Should be called after successful extraction.
     */
    public cleanUrlBar(): void {
        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }

    /**
     * Generates a random state string for CSRF protection to be used in the initial auth request.
     * @returns A cryptographically strong random string.
     */
    public generateState(): string {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint32Array(4);
            crypto.getRandomValues(array);
            return Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('');
        }
        // Fallback for environments without crypto (less secure, but functional)
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}