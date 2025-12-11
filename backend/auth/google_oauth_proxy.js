const { OAuth2Client } = require('google-auth-library');

/**
 * This module provides middleware and handlers for Google OAuth 2.0 authentication.
 * It is designed to be used with an Express application that has session management (e.g., express-session).
 *
 * It handles:
 * 1. Initiating the OAuth flow.
 * 2. Processing the OAuth callback from Google.
 * 3. A middleware to protect routes, ensuring the user is authenticated.
 * 4. Automatic refreshing of expired access tokens.
 * 5. Securely storing tokens in the user's session.
 * 6. Providing an authenticated OAuth2Client instance to downstream handlers.
 * 7. Logging out and revoking tokens.
 */

// --- Configuration ---
// These should be set in your environment variables (.env file).
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  throw new Error('Google OAuth credentials (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI) must be set in environment variables.');
}

// --- Scopes ---
// Define the permissions your application requires.
// Add scopes for all the Google APIs you intend to use.
// A comprehensive list can be found at: https://developers.google.com/identity/protocols/oauth2/scopes
const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  // Example: Add Drive API read-only access
  // 'https://www.googleapis.com/auth/drive.readonly',
  // Example: Add Google Calendar access
  // 'https://www.googleapis.com/auth/calendar',
];

/**
 * Creates a new OAuth2Client instance.
 * @returns {OAuth2Client}
 */
function createOAuth2Client() {
  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Express middleware to initiate the Google OAuth 2.0 authentication flow.
 * Generates the authentication URL and redirects the user to Google's consent screen.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
function redirectToGoogleAuth(req, res) {
  const oAuth2Client = createOAuth2Client();
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // 'offline' is required to get a refresh token
    scope: OAUTH_SCOPES.join(' '),
    prompt: 'consent', // This forces the consent screen every time, ensuring a refresh token is always sent.
  });
  res.redirect(authorizeUrl);
}

/**
 * Express middleware to handle the callback from Google after user authentication.
 * It exchanges the authorization code for access and refresh tokens and stores them in the session.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function handleGoogleCallback(req, res) {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Authorization code is missing.');
  }

  const oAuth2Client = createOAuth2Client();
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    req.session.tokens = tokens;

    // Redirect to a secure part of the application, e.g., the dashboard.
    res.redirect('/');
  } catch (error) {
    console.error('Error retrieving access token:', error.message);
    res.status(500).send('Authentication failed. Please try again.');
  }
}

/**
 * Middleware to protect routes that require Google authentication.
 * It verifies that valid tokens exist in the session. If the access token is expired,
 * it attempts to refresh it using the refresh token. An authenticated OAuth2Client
 * is attached to `req.google.auth` for use by subsequent middleware or route handlers.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
async function googleOAuthProxy(req, res, next) {
  if (!req.session || !req.session.tokens) {
    // If it's a browser request, redirect to the auth flow.
    if (req.accepts('html')) {
      return res.redirect('/auth/google/login'); // Or your specific login route
    }
    // For API requests, return a 401 Unauthorized error.
    return res.status(401).json({ error: 'Unauthorized: No session tokens found.' });
  }

  try {
    const oAuth2Client = createOAuth2Client();
    oAuth2Client.setCredentials(req.session.tokens);

    // Set up a listener to automatically update the session when tokens are refreshed.
    oAuth2Client.on('tokens', (newTokens) => {
      // The `tokens` event may not include a new refresh_token unless one was explicitly issued.
      // So, we merge the new tokens with the existing ones.
      req.session.tokens = { ...req.session.tokens, ...newTokens };
    });

    // `getAccessToken` will automatically handle token refreshing.
    // If the access token is expired, it will use the refresh token to get a new one.
    // The 'tokens' event listener above will then update the session.
    await oAuth2Client.getAccessToken();

    // Attach the authenticated client to the request object for use in API calls.
    if (!req.google) {
      req.google = {};
    }
    req.google.auth = oAuth2Client;

    next();
  } catch (error) {
    console.error('Google OAuth proxy error:', error.message);
    // If there's an error (e.g., invalid refresh token), clear the session and force re-login.
    delete req.session.tokens;
    req.session.save((err) => {
      if (err) {
        console.error('Failed to save session after token error:', err);
      }
      if (req.accepts('html')) {
        return res.redirect('/auth/google/login');
      }
      return res.status(401).json({ error: 'Authentication failed. Please log in again.' });
    });
  }
}

/**
 * Logs the user out by revoking the Google token and destroying the local session.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function logout(req, res) {
  if (req.session && req.session.tokens) {
    const oAuth2Client = createOAuth2Client();
    try {
      // Revoke the token on Google's side to invalidate it.
      // Use either access_token or refresh_token.
      const tokenToRevoke = req.session.tokens.access_token || req.session.tokens.refresh_token;
      if (tokenToRevoke) {
        await oAuth2Client.revokeToken(tokenToRevoke);
      }
    } catch (error) {
      // Log the error but proceed with logout, as the local session is the most important part.
      console.warn('Failed to revoke Google token on logout:', error.message);
    }
  }

  // Destroy the local session.
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Could not log out properly.');
    }
    // Redirect to a public page after logout.
    res.redirect('/login');
  });
}

module.exports = {
  redirectToGoogleAuth,
  handleGoogleCallback,
  googleOAuthProxy,
  logout,
};