import axios, { AxiosRequestHeaders } from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface OAuthTokenResponse {
  access_token: string;
  token_type: string; // e.g., Bearer
  expires_in: number; // seconds until token expires
  refresh_token?: string; // Optional: Some flows provide a refresh token
}

class CitiAuthHandler {
  private clientId: string;
  private clientSecret: string;
  private tokenEndpoint: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number = 0; // Unix timestamp in milliseconds

  constructor(clientId: string, clientSecret: string, tokenEndpoint: string) {
    if (!clientId || !clientSecret || !tokenEndpoint) {
      throw new Error('CitiAuthHandler requires client ID, client secret, and token endpoint.');
    }
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.tokenEndpoint = tokenEndpoint;
  }

  /**
   * Checks if the current access token is expired or about to expire.
   * A 60-second buffer is used to trigger refresh proactively.
   * @returns {boolean} True if the token is expired or nearly expired, false otherwise.
   */
  private isTokenExpired(): boolean {
    return !this.accessToken || Date.now() >= (this.tokenExpiresAt - 60 * 1000); // 60 seconds buffer
  }

  /**
   * Fetches a new OAuth access token using the client credentials grant type.
   * Updates the internal access token, refresh token (if provided), and expiry time.
   * @throws {Error} If fetching the token fails.
   */
  private async fetchNewToken(): Promise<void> {
    console.log('CitiAuthHandler: Fetching new OAuth token using client credentials...');
    try {
      const response = await axios.post<OAuthTokenResponse>(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
        }
      );

      const { access_token, expires_in, refresh_token } = response.data;
      this.accessToken = access_token;
      this.tokenExpiresAt = Date.now() + (expires_in * 1000); // Convert seconds to milliseconds
      this.refreshToken = refresh_token || null;
      console.log('CitiAuthHandler: New OAuth token fetched successfully. Expires in:', expires_in, 'seconds.');
    } catch (error) {
      console.error('CitiAuthHandler: Failed to fetch new OAuth token:', (error as any).response?.data || (error as Error).message);
      this.accessToken = null; // Clear token on failure
      this.tokenExpiresAt = 0;
      this.refreshToken = null;
      throw new Error('Failed to fetch OAuth token');
    }
  }

  /**
   * Refreshes the OAuth access token using the refresh token grant type.
   * If a refresh token is not available or refreshing fails, it falls back to fetching a new token.
   * Updates the internal access token, refresh token (if provided), and expiry time.
   * @throws {Error} If fetching a new token (after refresh failure) also fails.
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      console.warn('CitiAuthHandler: No refresh token available, attempting to fetch a new token.');
      return this.fetchNewToken();
    }

    console.log('CitiAuthHandler: Refreshing OAuth token using refresh token...');
    try {
      const response = await axios.post<OAuthTokenResponse>(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
        }
      );

      const { access_token, expires_in, refresh_token } = response.data;
      this.accessToken = access_token;
      this.tokenExpiresAt = Date.now() + (expires_in * 1000);
      this.refreshToken = refresh_token || null; // Refresh tokens can be single-use or rotated
      console.log('CitiAuthHandler: OAuth token refreshed successfully. Expires in:', expires_in, 'seconds.');
    } catch (error) {
      console.error('CitiAuthHandler: Failed to refresh OAuth token:', (error as any).response?.data || (error as Error).message);
      console.log('CitiAuthHandler: Attempting to fetch a completely new token due to refresh failure.');
      // If refresh fails (e.g., refresh token expired or invalid), try to get a completely new token
      return this.fetchNewToken();
    }
  }

  /**
   * Retrieves the necessary authorization headers for making requests to the Citi API.
   * Automatically fetches or refreshes the access token if it's expired or not available.
   * @returns {Promise<AxiosRequestHeaders>} An object containing the Authorization, uuid, client_id, and Accept headers.
   * @throws {Error} If an access token cannot be obtained.
   */
  public async getAuthorizationHeaders(): Promise<AxiosRequestHeaders> {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken(); // Try refreshing first, it will fall back to new token if no refresh token or refresh fails
    }

    if (!this.accessToken) {
      throw new Error('Access token is not available after attempting to fetch/refresh.');
    }

    const headers: AxiosRequestHeaders = {
      'Authorization': `Bearer ${this.accessToken}`,
      'uuid': uuidv4(), // Generate a unique UUID for each request as per spec
      'client_id': this.clientId, // Required header as per OpenAPI definition
      'Accept': 'application/json', // Common default, as shown in examples
    };

    return headers;
  }
}

export { CitiAuthHandler };