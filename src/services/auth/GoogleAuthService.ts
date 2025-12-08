import { google } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';

/**
 * Interface representing the Google User Profile returned by the OAuth2 flow.
 */
export interface GoogleUserProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  hd?: string; // Hosted domain (e.g., for G Suite)
}

/**
 * Service responsible for handling Google OAuth 2.0 authentication.
 * Enforces "Login with Google" as the sole authentication mechanism.
 * Manages token exchange, refreshing, and integration with Google Drive scopes.
 */
export class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  // Scopes required for the application:
  // - User identity (Profile, Email)
  // - Google Drive access (for saving files/projects)
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/drive', // Full access to Drive
    'https://www.googleapis.com/auth/drive.file', // Per-file access
    'https://www.googleapis.com/auth/drive.appdata' // Application data folder
  ];

  /**
   * Initializes the GoogleAuthService.
   * @param clientId Google Client ID
   * @param clientSecret Google Client Secret
   * @param redirectUri The callback URL registered in Google Cloud Console
   */
  constructor(
    private clientId: string,
    private clientSecret: string,
    private redirectUri: string
  ) {
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('GoogleAuthService configuration missing: clientId, clientSecret, or redirectUri.');
    }

    this.oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
  }

  /**
   * Generates the authentication URL for the user to log in.
   * This enforces the Google-only login requirement.
   * @param state Optional state parameter to prevent CSRF or pass context
   * @returns The URL to redirect the user to
   */
  public generateAuthUrl(state?: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Crucial for receiving a refresh token
      scope: this.SCOPES,
      include_granted_scopes: true,
      prompt: 'consent', // Force consent to ensure refresh token is always returned on login
      state: state
    });
  }

  /**
   * Exchanges the authorization code received from the callback for access and refresh tokens.
   * @param code The authorization code from the query string
   * @returns The credentials object containing access_token, refresh_token, expiry, etc.
   */
  public async exchangeCodeForTokens(code: string): Promise<Credentials> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error exchanging authorization code for tokens:', error);
      throw new Error('Authentication failed: Unable to exchange code for tokens.');
    }
  }

  /**
   * Retrieves the authenticated user's profile information.
   * @param tokens Optional credentials to use for this specific request. If omitted, uses the client's current credentials.
   * @returns The user's profile data
   */
  public async getUserProfile(tokens?: Credentials): Promise<GoogleUserProfile> {
    const client = tokens ? this.createClientFromTokens(tokens) : this.oauth2Client;

    if (!client.credentials || !client.credentials.access_token) {
      throw new Error('Unauthorized: No access token available. User must log in with Google.');
    }

    const oauth2 = google.oauth2({
      auth: client,
      version: 'v2'
    });

    try {
      const response = await oauth2.userinfo.get();
      return response.data as GoogleUserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to retrieve user profile from Google.');
    }
  }

  /**
   * Refreshes an expired access token using a refresh token.
   * @param refreshToken The persistent refresh token stored for the user
   * @returns New credentials containing the fresh access token
   */
  public async refreshAccessToken(refreshToken: string): Promise<Credentials> {
    const client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    client.setCredentials({
      refresh_token: refreshToken
    });

    try {
      const { credentials } = await client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Session expired: Unable to refresh access token. Please log in again.');
    }
  }

  /**
   * Creates a standalone OAuth2Client instance configured with specific tokens.
   * Useful for background jobs or handling multiple users concurrently.
   * @param tokens The user's credentials
   */
  public createClientFromTokens(tokens: Credentials): OAuth2Client {
    const client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
    client.setCredentials(tokens);
    return client;
  }

  /**
   * Revokes a token (access or refresh), effectively logging the user out.
   * @param token The token string to revoke
   */
  public async revokeToken(token: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(token);
    } catch (error) {
      console.warn('Warning: Failed to revoke token with Google:', error);
      // We do not throw here to allow the local logout process to continue
    }
  }

  /**
   * Helper to verify an ID token if provided directly (e.g., from a mobile client).
   * @param idToken The JWT ID token string
   */
  public async verifyIdToken(idToken: string) {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: idToken,
        audience: this.clientId,
      });
      return ticket.getPayload();
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw new Error('Invalid ID token.');
    }
  }

  /**
   * Static factory method to instantiate the service using environment variables.
   * Expects GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI to be set.
   */
  public static fromEnv(): GoogleAuthService {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing environment variables for Google Auth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)');
    }

    return new GoogleAuthService(clientId, clientSecret, redirectUri);
  }
}