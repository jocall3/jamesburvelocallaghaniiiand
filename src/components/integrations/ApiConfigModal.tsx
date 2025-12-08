import React, { useState, useEffect, FormEvent } from 'react';

// Define types for clarity and type safety

/**
 * Represents a specific API integration service (e.g., Google Drive, GitHub, Stripe).
 * This structure allows the modal to be generic and data-driven.
 */
export interface Integration {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  // Defines the fields required for configuration, rendered as form inputs.
  configFields: ConfigField[];
  // Specifies the authentication method to customize the UI.
  authType: 'apiKey' | 'oauth2' | 'token';
}

/**
 * Describes a single configuration field for an integration.
 */
export interface ConfigField {
  id: string; // e.g., 'apiKey', 'apiUrl', 'clientId'
  label: string; // e.g., 'API Key', 'API Base URL', 'Client ID'
  type: 'text' | 'password' | 'url';
  placeholder?: string;
  required: boolean;
  description?: string;
}

/**
 * A generic type for the configuration data object, mapping field IDs to their values.
 */
export type ApiConfig = Record<string, string>;

/**
 * Props for the ApiConfigModal component.
 */
export interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ApiConfig) => Promise<void>;
  integration: Integration | null;
  initialConfig?: ApiConfig;
}

/**
 * A simple spinner component for indicating loading states.
 */
const Spinner: React.FC = () => (
  <div className="api-config-spinner" role="status">
    <span className="sr-only">Loading...</span>
  </div>
);

/**
 * A modal dialog for configuring API keys and settings for a specific integration.
 * It dynamically renders form fields based on the integration's requirements
 * and provides special UI for OAuth flows like Google authentication.
 */
const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  integration,
  initialConfig = {},
}) => {
  const [config, setConfig] = useState<ApiConfig>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to reset the form state when the modal is opened for a new integration
  useEffect(() => {
    if (integration) {
      // Initialize state from initialConfig or with empty strings for all required fields
      const initialFormState = integration.configFields.reduce((acc, field) => {
        acc[field.id] = initialConfig[field.id] || '';
        return acc;
      }, {} as ApiConfig);
      setConfig(initialFormState);
    }
    // Reset error and saving state when modal opens or integration changes
    setError(null);
    setIsSaving(false);
  }, [integration, initialConfig, isOpen]);

  if (!isOpen || !integration) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prevConfig => ({
      ...prevConfig,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onSave(config);
      onClose(); // Close modal on successful save
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleConnect = () => {
    // In a real application, this would trigger the OAuth 2.0 flow.
    // This could involve redirecting the user or opening a popup window.
    // The logic would be handled by a dedicated auth service or hook.
    console.log(`Initiating Google OAuth flow for ${integration.name}...`);
    // Example of what might happen:
    // window.location.href = `/api/auth/google/start?integrationId=${integration.id}&redirectUri=${window.location.href}`;
    alert('Google authentication flow would be initiated here. This is a placeholder.');
  };

  const renderAuthSection = () => {
    if (integration.authType === 'oauth2' && integration.id.toLowerCase().includes('google')) {
      return (
        <div className="api-config-auth-section">
          <p>This integration uses Google to authenticate. Connect your account to proceed.</p>
          <button type="button" className="api-config-google-connect-btn" onClick={handleGoogleConnect}>
            <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.20455c0-.63864-.05727-1.25182-.16364-1.84091H9.18182v3.48182h4.79091c-.20455 1.125-.82273 2.07273-1.72273 2.70455v2.25909h2.90909c1.70455-1.56818 2.68182-3.87273 2.68182-6.60455z"></path><path fill="#34A853" d="M9.18182 18c2.43182 0 4.46364-.80455 5.95455-2.18182l-2.90909-2.25909c-.80455.54545-1.83636.87273-2.99091.87273-2.30455 0-4.25455-1.56818-4.95-3.67273H1.22727v2.33182C2.71818 16.13182 5.70455 18 9.18182 18z"></path><path fill="#FBBC05" d="M4.23182 10.8182c-.22727-.67045-.22727-1.4.0-2.07273V6.41364H1.22727C.45455 7.94545 0 9.89545 0 12s.45455 4.05455 1.22727 5.58636l3.00455-2.33182c-.22727-.67045-.22727-1.4-.0-2.43636z"></path><path fill="#EA4335" d="M9.18182 3.54545c1.32273 0 2.50909.45455 3.44091 1.34545l2.58182-2.58182C13.64545.88636 11.61364 0 9.18182 0 5.70455 0 2.71818 1.86818 1.22727 4.08182l3.00455 2.33182c.69545-2.10455 2.64545-3.67273 4.95-3.67273z"></path></svg>
            Connect with Google
          </button>
        </div>
      );
    }
    return null;
  };

  const renderFormFields = () => {
    // Don't render standard fields if it's a managed OAuth flow like Google
    if (integration.authType === 'oauth2' && integration.id.toLowerCase().includes('google')) {
      return null;
    }

    return integration.configFields.map((field) => (
      <div key={field.id} className="api-config-form-group">
        <label htmlFor={field.id}>
          {field.label} {field.required && <span className="api-config-required">*</span>}
        </label>
        <input
          type={field.type}
          id={field.id}
          name={field.id}
          value={config[field.id] || ''}
          onChange={handleInputChange}
          placeholder={field.placeholder}
          required={field.required}
          disabled={isSaving}
          autoComplete="off"
        />
        {field.description && <p className="api-config-field-description">{field.description}</p>}
      </div>
    ));
  };

  return (
    <div className="api-config-modal-overlay">
      <div className="api-config-modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="api-config-modal-header">
          <div className="api-config-modal-title-container">
            {integration.logoUrl && <img src={integration.logoUrl} alt={`${integration.name} logo`} className="api-config-integration-logo" />}
            <h2 id="modal-title">Configure {integration.name}</h2>
          </div>
          <button onClick={onClose} className="api-config-close-button" aria-label="Close modal" disabled={isSaving}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="api-config-modal-body">
            <p className="api-config-integration-description">{integration.description}</p>
            {error && <div className="api-config-error-message">{error}</div>}
            {renderAuthSection()}
            {renderFormFields()}
          </div>
          <div className="api-config-modal-footer">
            <button type="button" onClick={onClose} className="api-config-btn api-config-btn-secondary" disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="api-config-btn api-config-btn-primary" disabled={isSaving}>
              {isSaving ? <Spinner /> : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
      {/* Basic styling for the modal. In a real app, this would be in a CSS/SCSS file. */}
      <style jsx global>{`
        .api-config-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .api-config-modal-content {
          background: #ffffff;
          padding: 2rem;
          border-radius: 8px;
          width: 100%;
          max-width: 550px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
        }
        .api-config-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }
        .api-config-modal-title-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .api-config-integration-logo {
          width: 28px;
          height: 28px;
        }
        #modal-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }
        .api-config-close-button {
          background: none;
          border: none;
          font-size: 1.75rem;
          cursor: pointer;
          color: #6b7280;
          line-height: 1;
        }
        .api-config-close-button:hover {
          color: #111827;
        }
        .api-config-modal-body {
          flex-grow: 1;
        }
        .api-config-integration-description {
          font-size: 0.9rem;
          color: #4b5563;
          margin-top: 0;
          margin-bottom: 1.5rem;
        }
        .api-config-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
          margin-top: 1.5rem;
        }
        .api-config-btn {
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem;
          transition: background-color 0.2s ease;
        }
        .api-config-btn-primary {
          background-color: #2563eb;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .api-config-btn-primary:hover {
          background-color: #1d4ed8;
        }
        .api-config-btn-primary:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
        .api-config-btn-secondary {
          background-color: #ffffff;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        .api-config-btn-secondary:hover {
          background-color: #f9fafb;
        }
        .api-config-btn-secondary:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }
        .api-config-form-group {
          margin-bottom: 1.25rem;
        }
        .api-config-form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }
        .api-config-form-group input {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          box-sizing: border-box;
          font-size: 0.9rem;
        }
        .api-config-form-group input:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.5);
        }
        .api-config-form-group input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }
        .api-config-required {
          color: #ef4444;
          margin-left: 0.25rem;
        }
        .api-config-field-description {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.3rem;
        }
        .api-config-error-message {
          background-color: #fee2e2;
          color: #b91c1c;
          padding: 0.75rem 1rem;
          border: 1px solid #fecaca;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .api-config-auth-section {
          text-align: center;
          padding: 1.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          background-color: #f9fafb;
        }
        .api-config-auth-section p {
            margin-top: 0;
            margin-bottom: 1rem;
            color: #4b5563;
        }
        .api-config-google-connect-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 1.2rem;
          background-color: #ffffff;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }
        .api-config-google-connect-btn:hover {
            background-color: #f3f4f6;
        }
        .api-config-spinner {
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: api-config-spin 1s linear infinite;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        @keyframes api-config-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ApiConfigModal;