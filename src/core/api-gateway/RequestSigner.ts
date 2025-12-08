import { createHmac, createHash } from 'crypto';

// --- Type Definitions for Authentication Configurations ---

/**
 * Specifies where an API key should be placed in the request.
 */
export type ApiKeyLocation = 'header' | 'query';

/**
 * Configuration for API Key authentication.
 */
export interface ApiKeyAuthConfig {
    type: 'apiKey';
    keyName: string;
    keyValue: string;
    in: ApiKeyLocation;
}

/**
 * Configuration for Bearer Token (JWT, OAuth 2.0) authentication.
 * This is commonly used with services like Google Sign-In.
 */
export interface BearerAuthConfig {
    type: 'bearer';
    token: string;
}

/**
 * Configuration for Basic HTTP authentication.
 */
export interface BasicAuthConfig {
    type: 'basic';
    username: string;
    password?: string; // Password can be optional
}

/**
 * Configuration for HMAC (Hash-based Message Authentication Code) authentication.
 * This is a simplified version, real-world implementations (like AWS SigV4) are more complex.
 */
export interface HmacAuthConfig {
    type: 'hmac';
    accessKeyId: string;
    secretAccessKey: string;
    algorithm?: 'sha256' | 'sha512'; // Supported algorithms
    signedHeaders?: string[]; // Headers to include in the signature, 'host' is often implicitly included
}

/**
 * Represents no authentication for public APIs.
 */
export interface NoAuthConfig {
    type: 'none';
}

/**
 * A union type representing all possible authentication configurations.
 */
export type AuthConfig =
    | ApiKeyAuthConfig
    | BearerAuthConfig
    | BasicAuthConfig
    | HmacAuthConfig
    | NoAuthConfig;

/**
 * A simplified representation of an outgoing HTTP request that can be signed.
 * This uses standard Web API interfaces (`URL`, `Headers`) for compatibility.
 */
export interface SignableRequest {
    method: string;
    url: URL;
    headers: Headers;
    body?: string | Buffer | null;
}

/**
 * Handles the signing of outgoing API requests with various authentication schemes.
 * This class modifies the request object (typically by adding headers) to include
 * the necessary authentication credentials before the request is sent.
 */
export class RequestSigner {

    /**
     * Signs a request according to the provided authentication configuration.
     * This method is the main entry point for the class.
     * @param request The request object to be signed. It will be mutated.
     * @param authConfig The authentication configuration.
     * @returns A promise that resolves to the signed request.
     * @throws {Error} if an unsupported authentication type is provided.
     */
    public async sign(request: SignableRequest, authConfig: AuthConfig): Promise<SignableRequest> {
        switch (authConfig.type) {
            case 'none':
                return request; // No changes needed
            case 'bearer':
                return this.signWithBearer(request, authConfig);
            case 'basic':
                return this.signWithBasic(request, authConfig);
            case 'apiKey':
                return this.signWithApiKey(request, authConfig);
            case 'hmac':
                return this.signWithHmac(request, authConfig);
            default:
                // This exhaustive check ensures that all cases of the union type are handled.
                const exhaustiveCheck: never = authConfig;
                throw new Error(`Unsupported authentication type: ${(exhaustiveCheck as any).type}`);
        }
    }

    /**
     * Adds a Bearer token to the Authorization header.
     * @param request The request to sign.
     * @param config The Bearer auth configuration.
     * @returns The signed request.
     */
    private signWithBearer(request: SignableRequest, config: BearerAuthConfig): SignableRequest {
        if (!config.token) {
            console.warn('Bearer auth config provided without a token.');
            return request;
        }
        request.headers.set('Authorization', `Bearer ${config.token}`);
        return request;
    }

    /**
     * Adds a Basic auth credential to the Authorization header.
     * @param request The request to sign.
     * @param config The Basic auth configuration.
     * @returns The signed request.
     */
    private signWithBasic(request: SignableRequest, config: BasicAuthConfig): SignableRequest {
        const credentials = `${config.username}:${config.password || ''}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        request.headers.set('Authorization', `Basic ${encodedCredentials}`);
        return request;
    }

    /**
     * Adds an API key to the request, either in a header or as a query parameter.
     * @param request The request to sign.
     * @param config The API Key auth configuration.
     * @returns The signed request.
     */
    private signWithApiKey(request: SignableRequest, config: ApiKeyAuthConfig): SignableRequest {
        if (config.in === 'header') {
            request.headers.set(config.keyName, config.keyValue);
        } else if (config.in === 'query') {
            request.url.searchParams.set(config.keyName, config.keyValue);
        }
        return request;
    }

    /**
     * Signs a request using a simplified HMAC signature scheme.
     * This involves creating a canonical request string and signing it.
     * @param request The request to sign.
     * @param config The HMAC auth configuration.
     * @returns A promise that resolves to the signed request.
     */
    private async signWithHmac(request: SignableRequest, config: HmacAuthConfig): Promise<SignableRequest> {
        const algorithm = config.algorithm || 'sha256';
        const timestamp = new Date().toISOString();
        // Use a common date header format, similar to AWS
        request.headers.set('X-Request-Date', timestamp);

        // 1. Create Canonical Request String
        const canonicalRequest = this.createCanonicalRequest(request, config.signedHeaders || []);

        // 2. Create String to Sign
        const hashAlgorithm = algorithm.toUpperCase();
        const hashedCanonicalRequest = createHash(algorithm).update(canonicalRequest).digest('hex');
        const stringToSign = [
            `HMAC-${hashAlgorithm}`,
            timestamp,
            hashedCanonicalRequest
        ].join('\n');

        // 3. Calculate Signature
        const signature = createHmac(algorithm, config.secretAccessKey)
            .update(stringToSign)
            .digest('hex');

        // 4. Add Signature to Authorization Header
        const defaultSignedHeaders = ['host', 'x-request-date'];
        const signedHeadersString = [...new Set([...defaultSignedHeaders, ...(config.signedHeaders || [])])]
            .sort()
            .join(';');
            
        const authorizationHeader = [
            `HMAC-${hashAlgorithm} Credential=${config.accessKeyId}`,
            `SignedHeaders=${signedHeadersString}`,
            `Signature=${signature}`
        ].join(', ');

        request.headers.set('Authorization', authorizationHeader);

        return request;
    }

    /**
     * Helper to create a canonical request string for HMAC signing.
     * A canonical request is a standardized, unambiguous representation of the request.
     * @param request The request object.
     * @param signedHeaders The list of headers to include in the signature.
     * @returns The canonical request string.
     */
    private createCanonicalRequest(request: SignableRequest, signedHeaders: string[]): string {
        const httpMethod = request.method.toUpperCase();
        const canonicalUri = request.url.pathname;

        // Canonical Query String: sorted and encoded
        const queryParams = Array.from(request.url.searchParams.entries());
        queryParams.sort((a, b) => a[0].localeCompare(b[0]));
        const canonicalQueryString = queryParams
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        // Canonical Headers: lowercase keys, trimmed values, sorted by key
        const defaultHeadersToSign = ['host', 'x-request-date'];
        const headersToSign = [...new Set([...defaultHeadersToSign, ...signedHeaders.map(h => h.toLowerCase())])];
        
        // Ensure host is present for signing
        if (!request.headers.has('host')) {
            request.headers.set('host', request.url.host);
        }
        
        const headerEntries = Array.from(request.headers.entries())
            .map(([key, value]) => [key.toLowerCase(), value.trim().replace(/\s+/g, ' ')])
            .filter(([key]) => headersToSign.includes(key));
        
        headerEntries.sort((a, b) => a[0].localeCompare(b[0]));

        const canonicalHeadersString = headerEntries
            .map(([key, value]) => `${key}:${value}`)
            .join('\n');
        
        const signedHeadersString = headerEntries.map(([key]) => key).join(';');

        // Hashed Payload
        const payload = request.body || '';
        const hashedPayload = createHash('sha256').update(payload).digest('hex');

        return [
            httpMethod,
            canonicalUri,
            canonicalQueryString,
            canonicalHeadersString + '\n', // Must end with a newline
            signedHeadersString,
            hashedPayload
        ].join('\n');
    }
}