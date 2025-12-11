export interface AccessTokenRequest {
  grant_type: 'authorization_code';
  code: string;
  redirect_uri: string;
}

export interface AccessTokenResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
  scope: string;
  refresh_token: string;
  refresh_token_expires_in: number;
}

export interface CitiErrorResponse {
  error?: string;
  error_description?: string;
  type?: string;
  code?: string;
  details?: string;
  message?: string;
  error_uri?: string;
}

export class CitiAuthError extends Error {
  statusCode: number;
  responseBody: CitiErrorResponse;

  constructor(statusCode: number, responseBody: CitiErrorResponse, message?: string) {
    super(message || responseBody.error_description || responseBody.details || responseBody.error || 'An unknown authentication error occurred.');
    this.name = 'CitiAuthError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
    Object.setPrototypeOf(this, CitiAuthError.prototype);
  }
}

/**
 * Exchanges an authorization code for access and refresh tokens using the Citi OAuth2 token endpoint.
 *
 * @param baseUrl The base URL for the Citi identity authentication API (e.g., 'https://api.citi.com/api/identity/auth/v1').
 * @param clientId The client ID obtained during application registration.
 * @param clientSecret The client secret obtained during application registration.
 * @param authorizationCode The authorization code received from the /authCode/oauth2/authorize endpoint.
 * @param redirectUri The absolute redirect URI used in the initial authorization request.
 * @returns A Promise that resolves with AccessTokenResponse on success.
 * @throws {CitiAuthError} If the API call fails or returns an error.
 */
export async function exchangeAuthorizationCodeForTokens(
  baseUrl: string,
  clientId: string,
  clientSecret: string,
  authorizationCode: string,
  redirectUri: string,
): Promise<AccessTokenResponse> {
  const url = `${baseUrl}/oauth2/token/us/gcb`;

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const headers = {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const body: AccessTokenRequest = {
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: redirectUri,
  };

  const formBody = new URLSearchParams(body as Record<string, string>).toString();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formBody,
    });

    if (!response.ok) {
      const errorData: CitiErrorResponse = await response.json();
      throw new CitiAuthError(response.status, errorData);
    }

    const data: AccessTokenResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof CitiAuthError) {
      throw error;
    }
    // Wrap network errors or other unexpected errors
    throw new CitiAuthError(500, { error: 'server_error', details: 'Network or unexpected error during token exchange' }, (error as Error).message);
  }
}