import React, { useCallback } from 'react';

/**
 * Configuration derived from GoogleIDPMetadata.xml
 * IDP Entity ID: https://accounts.google.com/o/saml2?idpid=C01esbeng
 */
const SAML_CONFIG = {
  ssoUrl: 'https://accounts.google.com/o/saml2/idp?idpid=C01esbeng',
  binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect'
};

interface SAMLLoginButtonProps {
  /**
   * Optional custom CSS class for the button
   */
  className?: string;
  /**
   * Text to display on the button
   */
  label?: string;
  /**
   * Callback fired before redirection occurs
   */
  onBeforeRedirect?: () => void;
  /**
   * Optional inline styles
   */
  style?: React.CSSProperties;
}

export const SAMLLoginButton: React.FC<SAMLLoginButtonProps> = ({
  className = 'btn-saml-login',
  label = 'Login with Enterprise SSO',
  onBeforeRedirect,
  style
}) => {
  const handleLogin = useCallback(() => {
    if (onBeforeRedirect) {
      onBeforeRedirect();
    }

    // In a production environment with SP-initiated SSO, a SAMLRequest parameter 
    // (base64 encoded and signed) is typically appended to this URL.
    // Based on the provided metadata, we target the HTTP-Redirect binding location.
    window.location.assign(SAML_CONFIG.ssoUrl);
  }, [onBeforeRedirect]);

  return (
    <button
      type="button"
      className={className}
      onClick={handleLogin}
      aria-label="Initiate SAML 2.0 Login"
      style={style}
    >
      {label}
    </button>
  );
};

export default SAMLLoginButton;