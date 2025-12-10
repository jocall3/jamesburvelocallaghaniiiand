import React, { useState, useEffect, useCallback } from 'react';

// Define the shape of an integration
interface Integration {
  id: string;
  name: string;
  provider: string; // e.g., 'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta'
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastChecked: string; // ISO string or formatted date
  healthScore?: number; // 0-100, higher is better
  message?: string; // e.g., "Authentication token expired", "API rate limit exceeded"
  configUrl?: string; // URL to configure this integration
}

// Helper function to get status color classes for Tailwind CSS
const getStatusColorClasses = (status: Integration['status']) => {
  switch (status) {
    case 'connected':
      return 'text-green-800 bg-green-50 border-green-200';
    case 'disconnected':
      return 'text-yellow-800 bg-yellow-50 border-yellow-200';
    case 'error':
      return 'text-red-800 bg-red-50 border-red-200';
    case 'pending':
      return 'text-blue-800 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-800 bg-gray-50 border-gray-200';
  }
};

// Helper function to get status icon (using emojis for simplicity, could be SVG/icon library)
const getStatusIcon = (status: Integration['status']) => {
  switch (status) {
    case 'connected':
      return '✅';
    case 'disconnected':
      return '⚠️';
    case 'error':
      return '❌';
    case 'pending':
      return '⏳';
    default:
      return '❓';
  }
};

const IntegrationStatus: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrationStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock data representing various integration statuses
      const mockData: Integration[] = [
        {
          id: 'google-workspace',
          name: 'Google Workspace',
          provider: 'Google',
          status: 'connected',
          lastChecked: new Date().toISOString(),
          healthScore: 95,
          message: 'All services operational.',
          configUrl: '/settings/integrations/google',
        },
        {
          id: 'microsoft-365',
          name: 'Microsoft 365',
          provider: 'Microsoft',
          status: 'connected',
          lastChecked: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
          healthScore: 80,
          message: 'Some calendar sync warnings, but core services connected.',
          configUrl: '/settings/integrations/microsoft',
        },
        {
          id: 'amazon-aws',
          name: 'Amazon AWS',
          provider: 'Amazon',
          status: 'disconnected',
          lastChecked: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
          message: 'Authentication token expired. Please re-authenticate.',
          configUrl: '/settings/integrations/aws',
        },
        {
          id: 'apple-services',
          name: 'Apple Services',
          provider: 'Apple',
          status: 'error',
          lastChecked: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
          message: 'API key invalid or revoked. Check configuration.',
          configUrl: '/settings/integrations/apple',
        },
        {
          id: 'meta-business',
          name: 'Meta Business',
          provider: 'Meta',
          status: 'pending',
          lastChecked: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
          message: 'Awaiting user authorization for page access.',
          configUrl: '/settings/integrations/meta',
        },
        {
          id: 'slack',
          name: 'Slack',
          provider: 'Slack',
          status: 'connected',
          lastChecked: new Date().toISOString(),
          healthScore: 99,
          message: 'Real-time notifications active.',
          configUrl: '/settings/integrations/slack',
        },
      ];
      setIntegrations(mockData);
    } catch (err) {
      setError('Failed to fetch integration statuses. Please try again.');
      console.error('Error fetching integration statuses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrationStatus();
  }, [fetchIntegrationStatus]);

  return (
    <div className="p-6 bg-white shadow rounded-lg max-w-4xl mx-auto my-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Integration Status</h2>
        <button
          onClick={fetchIntegrationStatus}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </span>
          ) : (
            'Refresh Status'
          )}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-4 text-blue-600 bg-blue-50 border border-blue-200 rounded-md">
          <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading integration statuses...
        </div>
      )}

      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-md">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && integrations.length === 0 && !error && (
        <div className="p-4 text-gray-600 bg-gray-50 border border-gray-200 rounded-md text-center">
          No integrations configured yet.
        </div>
      )}

      {!loading && integrations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className={`border rounded-lg p-4 flex flex-col ${getStatusColorClasses(integration.status)}`}
            >
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">{getStatusIcon(integration.status)}</span>
                <h3 className="text-lg font-medium">{integration.name}</h3>
              </div>
              <p className="text-sm text-gray-700 mb-1">
                Provider: <span className="font-semibold">{integration.provider}</span>
              </p>
              <p className="text-sm text-gray-700 mb-1">
                Status: <span className="font-semibold capitalize">{integration.status}</span>
              </p>
              {integration.healthScore !== undefined && (
                <p className="text-sm text-gray-700 mb-1">
                  Health Score: <span className="font-semibold">{integration.healthScore}%</span>
                </p>
              )}
              <p className="text-xs text-gray-600 mb-2">
                Last Checked: {new Date(integration.lastChecked).toLocaleString()}
              </p>
              {integration.message && (
                <p className="text-sm text-gray-800 italic mt-auto">
                  "{integration.message}"
                </p>
              )}
              {integration.configUrl && (
                <a
                  href={integration.configUrl}
                  className="mt-3 text-blue-600 hover:underline text-sm self-start"
                >
                  Configure Integration &rarr;
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IntegrationStatus;