import React from 'react';

// A simple, inline SVG for the Google "G" logo.
const GoogleLogo = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
      fill="#4285F4"
    />
    <path
      d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
      fill="#34A853"
    />
    <path
      d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29H0.957275C0.347727 8.46318 0 10.095 0 11.8182C0 13.5414 0.347727 15.1732 0.957275 16.3464L3.96409 14.0145V10.71Z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
      fill="#EA4335"
    />
  </svg>
);

interface GoogleLoginButtonProps {
  /**
   * Additional classes to apply to the button.
   */
  className?: string;
  /**
   * Whether the button should be disabled.
   */
  disabled?: boolean;
}

/**
 * A styled button component that initiates the Google OAuth 2.0 authorization code flow.
 * It redirects the user to Google's consent screen.
 *
 * This component relies on environment variables for configuration:
 * - `VITE_GOOGLE_CLIENT_ID`: Your Google Cloud project's OAuth 2.0 Client ID.
 * - `VITE_GOOGLE_REDIRECT_URI`: The callback URL in your application that Google will redirect to.
 */
const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  className = '',
  disabled = false,
}) => {
  const handleLogin = () => {
    if (disabled) return;

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const googleRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

    if (!googleClientId || !googleRedirectUri) {
      console.error(
        'Google OAuth environment variables (VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_REDIRECT_URI) are not set.'
      );
      // Optionally, provide user feedback here (e.g., an alert or toast).
      alert('Authentication is currently unavailable. Please contact support.');
      return;
    }

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

    const options = {
      redirect_uri: googleRedirectUri,
      client_id: googleClientId,
      access_type: 'offline', // 'offline' gets a refresh token
      response_type: 'code', // Using the Authorization Code Flow
      prompt: 'consent', // Ensures the user is prompted for consent every time
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/drive.file', // Scope for Google Drive file access
      ].join(' '),
      // state: '...' // Optional: A random string for CSRF protection, should be generated and validated
    };

    const qs = new URLSearchParams(options);
    const authUrl = `${rootUrl}?${qs.toString()}`;

    // Redirect the user to the Google authentication page
    window.location.href = authUrl;
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center w-full px-4 py-2 
        border border-gray-300 dark:border-gray-600 
        rounded-md shadow-sm 
        text-sm font-medium text-gray-700 dark:text-gray-200 
        bg-white dark:bg-gray-800 
        hover:bg-gray-50 dark:hover:bg-gray-700 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
      aria-label="Sign in with Google"
    >
      <GoogleLogo />
      <span className="ml-3">Sign in with Google</span>
    </button>
  );
};

export default GoogleLoginButton;