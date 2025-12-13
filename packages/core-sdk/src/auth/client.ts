/*
 * Copyright 2024-present, The AIEcosystem Project Authors. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { jwtDecode, JwtPayload } from 'jwt-decode';

// --- Type Definitions ---

/**
 * Represents the set of tokens returned by the authentication service.
 * Follows the standard OAuth 2.0 and OIDC specifications.
 */
export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

/**
 * Internal representation of the authentication state, including the calculated
 * expiration timestamp.
 */
export interface AuthState extends TokenSet {
  expires_at: number;
}

/**
 * Defines the contract for a storage adapter, allowing for isomorphic
 * persistence of authentication state in various environments (browser, server, etc.).
 */
export interface StorageAdapter {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

/**
 * Configuration for the AuthClient.
 */
export interface AuthClientConfig {
  /** The base URL of the APP_01_Identity_AuthService. */
  authServiceUrl: string;
  /** The OAuth 2.0 Client ID. */
  clientId: string;
  /** The OAuth 2.0 Client Secret (for confidential clients like backend services). */
  clientSecret?: string;
  /** Default scopes to request. */
  scopes: string[];
  /** The storage adapter for persisting auth state. Defaults to in-memory. */
  storage?: StorageAdapter;
  /** The key to use for storing auth state. */
  storageKey?: string;
  /**
   * Number of seconds before token expiry to initiate a refresh.
   * @default 300 (5 minutes)
   */
  tokenRefreshBufferSeconds?: number;
  /** The redirect URI for browser-based authentication flows. */
  redirectUri?: string;
  /** Optional fetch implementation for environments without a global fetch. */
  fetch?: typeof fetch;
}

// --- Custom Error Classes ---

export class AuthError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'AuthError';
  }
}

export class TokenRefreshError extends AuthError {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

// --- Isomorphic Helpers ---

const isBrowser = () => typeof window !== 'undefined' && typeof window.document !== 'undefined';

// --- Storage Adapters ---

/**
 * A simple in-memory storage adapter. State is lost when the process exits.
 * Suitable for short-lived scripts or serverless functions.
 */
export class InMemoryStorageAdapter implements StorageAdapter {
  private store: Record<string, string> = {};

  async setItem(key: string, value: string): Promise<void> {
    this.store[key] = value;
  }

  async getItem(key: string): Promise<string | null> {
    return this.store[key] || null;
  }

  async removeItem(key: string): Promise<void> {
    delete this.store[key];
  }
}

/**
 * A browser-based storage adapter using `localStorage`.
 * Note: `localStorage` is susceptible to XSS attacks. For higher security needs,
 * consider a more robust strategy like storing tokens in memory and using
 * refresh tokens in HttpOnly cookies.
 */
export class LocalStorageAdapter implements StorageAdapter {
  async setItem(key: string, value: string): Promise<void> {
    if (!isBrowser()) {
      console.warn('LocalStorageAdapter used in a non-browser environment. Data will not be persisted.');
      return;
    }
    localStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    if (!isBrowser()) {
      return null;
    }
    return localStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    if (!isBrowser()) {
      return;
    }
    localStorage.removeItem(key);
  }
}

// --- Main AuthClient Class ---

const DEFAULT_STORAGE_KEY = 'aiecosystem.auth.state';
const DEFAULT_REFRESH_BUFFER = 300; // 5 minutes

export class AuthClient {
  private readonly config: Required<AuthClientConfig>;
  private state: AuthState | null = null;
  private refreshPromise: Promise<void> | null = null;
  private tokenRefreshTimer: any = null;
  private readonly fetchImpl: typeof fetch;

  constructor(config: AuthClientConfig) {
    this.config = {
      storage: new InMemoryStorageAdapter(),
      storageKey: DEFAULT_STORAGE_KEY,
      tokenRefreshBufferSeconds: DEFAULT_REFRESH_BUFFER,
      clientSecret: '',
      redirectUri: '',
      ...config,
      fetch: config.fetch || globalThis.fetch,
    };
    this.fetchImpl = this.config.fetch;
    this.loadState().catch(err => console.error("Failed to load initial auth state:", err));
  }

  /**
   * Retrieves a valid access token, transparently handling renewal.
   * @returns A valid access token, or null if not authenticated.
   */
  public async getAccessToken(): Promise<string | null> {
    if (!this.state) {
      return null;
    }

    const now = Date.now() / 1000;
    const isTokenExpiring = now >= this.state.expires_at - this.config.tokenRefreshBufferSeconds;

    if (isTokenExpiring) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Failed to refresh token during getAccessToken:', error);
        // If refresh fails, the user is effectively logged out.
        await this.clearState();
        return null;
      }
    }

    return this.state?.access_token || null;
  }

  /**
   * Retrieves the decoded ID token payload, if available.
   * @returns The decoded JWT payload or null.
   */
  public getIdTokenPayload(): JwtPayload | null {
    if (!this.state?.id_token) {
      return null;
    }
    try {
      return jwtDecode(this.state.id_token);
    } catch (error) {
      console.error("Failed to decode ID token:", error);
      return null;
    }
  }

  /**
   * Checks if the user is currently authenticated.
   */
  public isAuthenticated(): boolean {
    return !!this.state?.access_token;
  }

  /**
   * Authenticates a service using the Client Credentials flow.
   * @param options - Optional overrides for scopes.
   */
  public async loginWithClientCredentials(options?: { scopes?: string[] }): Promise<void> {
    if (!this.config.clientSecret) {
      throw new AuthError('Client secret must be configured for client credentials flow.');
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: (options?.scopes || this.config.scopes).join(' '),
    });

    const tokenSet = await this.fetchToken(body);
    await this.setState(tokenSet);
  }

  /**
   * Builds the authorization URL for redirecting a user in a browser-based flow.
   * @param options - State, nonce, and other OIDC/OAuth2 parameters.
   * @returns The full URL to redirect the user to.
   */
  public buildAuthorizeUrl(options: {
    state: string;
    nonce?: string;
    scopes?: string[];
    response_type?: 'code' | 'token';
  }): string {
    if (!this.config.redirectUri) {
      throw new AuthError('redirectUri must be configured for authorization code flow.');
    }
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: (options.scopes || this.config.scopes).join(' '),
      response_type: options.response_type || 'code',
      state: options.state,
    });

    if (options.nonce) {
      params.set('nonce', options.nonce);
    }

    return `${this.config.authServiceUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Handles the redirect from the auth service in a browser flow, exchanging the code for tokens.
   * @param url - The full callback URL including query parameters.
   */
  public async handleRedirectCallback(url: string): Promise<void> {
    const params = new URL(url).searchParams;
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      throw new AuthError(`Authorization failed: ${error}`, {
        error_description: params.get('error_description'),
      });
    }

    if (!code) {
      throw new AuthError('Authorization code not found in callback URL.');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret, // For confidential clients
      redirect_uri: this.config.redirectUri,
      code,
    });

    const tokenSet = await this.fetchToken(body);
    await this.setState(tokenSet);
  }

  /**
   * Clears the current authentication state from memory and storage.
   */
  public async logout(): Promise<void> {
    await this.clearState();
  }

  private async refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        if (!this.state?.refresh_token) {
          throw new TokenRefreshError('No refresh token available.');
        }

        const body = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.state.refresh_token,
        });

        const tokenSet = await this.fetchToken(body);
        await this.setState(tokenSet);
      } catch (error) {
        // If refresh fails, clear state as the session is likely invalid.
        await this.clearState();
        if (error instanceof AuthError) {
          throw error;
        }
        throw new TokenRefreshError('An unexpected error occurred during token refresh.', error);
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async fetchToken(body: URLSearchParams): Promise<TokenSet> {
    const response = await this.fetchImpl(`${this.config.authServiceUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'unknown_error', error_description: 'Failed to parse error response.' }));
      throw new AuthError(`Token endpoint request failed with status ${response.status}`, errorBody);
    }

    return response.json() as Promise<TokenSet>;
  }

  private async setState(tokenSet: TokenSet): Promise<void> {
    const now = Date.now() / 1000;
    this.state = {
      ...tokenSet,
      expires_at: now + tokenSet.expires_in,
    };
    await this.config.storage.setItem(this.config.storageKey, JSON.stringify(this.state));
    this.scheduleTokenRefresh();
  }

  private async clearState(): Promise<void> {
    this.state = null;
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    await this.config.storage.removeItem(this.config.storageKey);
  }

  private async loadState(): Promise<void> {
    const storedState = await this.config.storage.getItem(this.config.storageKey);
    if (storedState) {
      try {
        const parsedState: AuthState = JSON.parse(storedState);
        const now = Date.now() / 1000;
        // Discard expired state
        if (parsedState.expires_at > now) {
          this.state = parsedState;
          this.scheduleTokenRefresh();
        } else {
          // If access token is expired but refresh token might be valid
          if (parsedState.refresh_token) {
             this.state = parsedState; // Keep state to allow refresh
             await this.refreshToken().catch(err => {
                console.warn("Initial token refresh on load failed, clearing state.", err);
                this.clearState();
             });
          } else {
             await this.clearState();
          }
        }
      } catch (error) {
        console.error('Failed to parse stored auth state, clearing it.', error);
        await this.clearState();
      }
    }
  }

  private scheduleTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    if (!this.state?.refresh_token) {
      return; // Cannot schedule refresh without a refresh token
    }

    const now = Date.now() / 1000;
    const expiresIn = this.state.expires_at - now - this.config.tokenRefreshBufferSeconds;

    if (expiresIn > 0) {
      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshToken().catch(err => {
          console.error('Scheduled token refresh failed:', err);
          // Depending on the error, we might want to emit an event
          // to notify the application that authentication is lost.
        });
      }, expiresIn * 1000);
    }
  }
}