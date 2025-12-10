import React, { useState, useEffect, useCallback } from 'react';

// Define a type for a single setting field
interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'password';
  placeholder?: string;
  options?: { value: string; label: string }[]; // For 'select' type
  description?: string;
  required?: boolean;
}

// Define the structure for an integration's settings schema
interface IntegrationSchema {
  name: string;
  description: string;
  fields: SettingField[];
}

// Mock schemas for different integrations
// In a real application, these schemas might be fetched from an API
// or defined in a more centralized configuration system.
const integrationSchemas: Record<string, IntegrationSchema> = {
  google_calendar: {
    name: 'Google Calendar',
    description: 'Configure settings for your Google Calendar integration. This allows syncing events between your app and Google Calendar.',
    fields: [
      { key: 'apiKey', label: 'Google API Key', type: 'password', placeholder: 'Enter your Google API Key', required: true, description: 'Obtain this from Google Cloud Console. Keep it secure!' },
      { key: 'calendarId', label: 'Calendar ID', type: 'text', placeholder: 'e.g., primary or a specific calendar ID', required: true, description: 'The ID of the Google Calendar to sync with.' },
      {
        key: 'syncDirection',
        label: 'Sync Direction',
        type: 'select',
        options: [
          { value: 'two-way', label: 'Two-way Sync' },
          { value: 'app-to-google', label: 'App to Google Only' },
          { value: 'google-to-app', label: 'Google to App Only' },
        ],
        required: true,
        description: 'Choose how events are synchronized between your app and Google Calendar.'
      },
      { key: 'enableNotifications', label: 'Enable Event Notifications', type: 'boolean', description: 'Receive in-app notifications for new or updated calendar events.' },
    ],
  },
  slack: {
    name: 'Slack',
    description: 'Configure settings for your Slack integration. Send notifications and messages to your Slack workspace.',
    fields: [
      { key: 'webhookUrl', label: 'Slack Webhook URL', type: 'password', placeholder: 'https://hooks.slack.com/...', required: true, description: 'The incoming webhook URL for your Slack workspace. Create one in Slack app settings.' },
      { key: 'defaultChannel', label: 'Default Channel', type: 'text', placeholder: '#general or a specific channel name', description: 'The default channel to post messages to if not specified elsewhere.' },
      { key: 'notifyOnNewTask', label: 'Notify on New Task', type: 'boolean', description: 'Send a Slack notification when a new task is created in the app.' },
      { key: 'notifyOnMention', label: 'Notify on @Mention', type: 'boolean', description: 'Send a Slack notification when you are @mentioned in a comment.' },
    ],
  },
  microsoft_teams: {
    name: 'Microsoft Teams',
    description: 'Configure settings for your Microsoft Teams integration. Send messages and alerts to your Teams channels.',
    fields: [
      { key: 'webhookUrl', label: 'Teams Webhook URL', type: 'password', placeholder: 'https://outlook.office.com/webhook/...', required: true, description: 'The incoming webhook URL for your Microsoft Teams channel. Get this from the Teams connector settings.' },
      { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'e.g., a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'Your Microsoft 365 Tenant ID (optional, for advanced configurations).' },
      { key: 'enableAdaptiveCards', label: 'Enable Adaptive Cards', type: 'boolean', description: 'Use rich Adaptive Cards for notifications instead of plain text messages.' },
    ],
  },
  // Add more integrations as the project grows
  // Example: Salesforce, Jira, GitHub, Stripe, etc.
};

interface IntegrationSettingsProps {
  /** The unique identifier for the integration (e.g., 'google_calendar', 'slack'). */
  integrationId: string;
  /** Optional initial settings to pre-fill the form. */
  initialSettings?: Record<string, any>;
  /** Callback function to be called when settings are saved. */
  onSave: (integrationId: string, settings: Record<string, any>) => void;
  /** Callback function to be called when the settings configuration is cancelled. */
  onCancel: () => void;
  /** Indicates if settings are currently being loaded from an external source. */
  isLoading?: boolean;
  /** An error message to display if loading or saving failed. */
  error?: string;
}

/**
 * A component for configuring settings specific to various third-party integrations.
 * It dynamically renders form fields based on the provided `integrationId` and its schema.
 */
const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  integrationId,
  initialSettings = {},
  onSave,
  onCancel,
  isLoading = false,
  error,
}) => {
  const schema = integrationSchemas[integrationId];
  const [currentSettings, setCurrentSettings] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Effect to initialize or reset settings when integrationId or initialSettings change
  useEffect(() => {
    if (schema) {
      const defaultSettings: Record<string, any> = {};
      schema.fields.forEach(field => {
        if (field.type === 'boolean') {
          defaultSettings[field.key] = false; // Default for boolean fields
        } else if (field.type === 'select' && field.options && field.options.length > 0) {
          defaultSettings[field.key] = field.options[0].value; // Default for select fields
        } else {
          defaultSettings[field.key] = ''; // Default for text, number, password
        }
      });
      // Merge default settings with any provided initial settings
      setCurrentSettings({ ...defaultSettings, ...initialSettings });
    }
  }, [integrationId, initialSettings, schema]);

  // Handler for input changes, updates the local state
  const handleChange = useCallback((key: string, value: any) => {
    setCurrentSettings(prevSettings => ({
      ...prevSettings,
      [key]: value,
    }));
  }, []);

  // Handler for form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Basic client-side validation for required fields
      const isValid = schema?.fields.every(field => {
        if (field.required) {
          // For boolean, `false` is a valid value, so check if it's explicitly undefined/null
          if (field.type === 'boolean') return currentSettings[field.key] !== undefined && currentSettings[field.key] !== null;
          return !!currentSettings[field.key]; // Check for truthiness for other types
        }
        return true;
      });

      if (!isValid) {
        // In a production app, replace with a more user-friendly notification (e.g., toast, form errors)
        alert('Please fill in all required fields.');
        return;
      }

      await onSave(integrationId, currentSettings);
    } catch (err) {
      console.error('Error saving integration settings:', err);
      // The parent component is expected to handle the 'error' prop for display
    } finally {
      setIsSaving(false);
    }
  }, [integrationId, currentSettings, onSave, schema]);

  // Render a message if the integration ID is not recognized
  if (!schema) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Integration Settings</h2>
        <p className="text-red-600">
          Integration "{integrationId}" not found or not supported. Please check the integration ID.
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">{schema.name} Settings</h2>
      <p className="text-gray-600 mb-6">{schema.description}</p>

      {isLoading && (
        <div className="text-center py-4 text-indigo-600">Loading settings...</div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {schema.fields.map(field => (
          <div key={field.key} className="flex flex-col">
            <label htmlFor={`${integrationId}-${field.key}`} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-xs text-gray-500 mb-2">{field.description}</p>
            )}
            {field.type === 'text' || field.type === 'password' || field.type === 'number' ? (
              <input
                type={field.type === 'number' ? 'number' : field.type}
                id={`${integrationId}-${field.key}`}
                name={field.key}
                value={currentSettings[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={isLoading || isSaving}
              />
            ) : field.type === 'boolean' ? (
              <div className="flex items-center mt-1">
                <input
                  type="checkbox"
                  id={`${integrationId}-${field.key}`}
                  name={field.key}
                  checked={!!currentSettings[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={isLoading || isSaving}
                />
                <label htmlFor={`${integrationId}-${field.key}`} className="ml-2 block text-sm text-gray-900">
                  {field.label}
                </label>
              </div>
            ) : field.type === 'select' && field.options ? (
              <select
                id={`${integrationId}-${field.key}`}
                name={field.key}
                value={currentSettings[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                disabled={isLoading || isSaving}
              >
                {field.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ))}

        <div className="pt-5 border-t border-gray-200 mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading || isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IntegrationSettings;