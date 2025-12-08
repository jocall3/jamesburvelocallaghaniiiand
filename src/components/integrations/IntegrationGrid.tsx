import React, { useState, useMemo } from 'react';
import { Search, ExternalLink, CheckCircle2, XCircle, Settings, GitBranch, Database, Bot } from 'lucide-react';

// --- TYPE DEFINITIONS ---

type IntegrationStatus = 'connected' | 'not_connected' | 'coming_soon';

interface Integration {
  id: string;
  name: string;
  description: string;
  logo: React.ReactNode;
  status: IntegrationStatus;
  category: 'Storage' | 'Code' | 'Communication' | 'Payments' | 'Automation' | 'Data';
}

// --- MOCK DATA ---
// In a real application, this data would be fetched from an API.
// The component is designed to handle 100+ integrations.
const mockIntegrations: Integration[] = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Store and access files from your Google Drive account.',
    logo: <img src="/logos/google-drive.svg" alt="Google Drive" className="w-12 h-12" />,
    status: 'connected',
    category: 'Storage',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect repositories, manage issues, and trigger workflows.',
    logo: <img src="/logos/github.svg" alt="GitHub" className="w-12 h-12" />,
    status: 'connected',
    category: 'Code',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications and messages to your Slack channels.',
    logo: <img src="/logos/slack.svg" alt="Slack" className="w-12 h-12" />,
    status: 'not_connected',
    category: 'Communication',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Process payments and manage subscriptions.',
    logo: <img src="/logos/stripe.svg" alt="Stripe" className="w-12 h-12" />,
    status: 'not_connected',
    category: 'Payments',
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Sync issues, projects, and sprints with your Jira instance.',
    logo: <img src="/logos/jira.svg" alt="Jira" className="w-12 h-12" />,
    status: 'not_connected',
    category: 'Code',
  },
  {
    id: 'aws-s3',
    name: 'AWS S3',
    description: 'Use S3 buckets for scalable object storage.',
    logo: <img src="/logos/aws-s3.svg" alt="AWS S3" className="w-12 h-12" />,
    status: 'not_connected',
    category: 'Storage',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Integrate powerful AI models like GPT-4 into your workflows.',
    logo: <img src="/logos/openai.svg" alt="OpenAI" className="w-12 h-12" />,
    status: 'connected',
    category: 'Automation',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Reliable email delivery, scaling, and analytics.',
    logo: <img src="/logos/sendgrid.svg" alt="SendGrid" className="w-12 h-12" />,
    status: 'not_connected',
    category: 'Communication',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'Connect to your PostgreSQL database for direct data access.',
    logo: <Database className="w-12 h-12 text-blue-600" />,
    status: 'not_connected',
    category: 'Data',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect your apps and automate workflows with Zapier.',
    logo: <img src="/logos/zapier.svg" alt="Zapier" className="w-12 h-12" />,
    status: 'coming_soon',
    category: 'Automation',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Connect GitLab repositories, CI/CD pipelines, and more.',
    logo: <img src="/logos/gitlab.svg" alt="GitLab" className="w-12 h-12" />,
    status: 'coming_soon',
    category: 'Code',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, deals, and marketing data from HubSpot.',
    logo: <img src="/logos/hubspot.svg" alt="HubSpot" className="w-12 h-12" />,
    status: 'not_connected',
    category: 'Data',
  },
];


// --- SUB-COMPONENTS ---

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (id: string) => void;
  onManage: (id: string) => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ integration, onConnect, onManage }) => {
  const { id, name, description, logo, status } = integration;

  const renderStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-1 text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle2 size={14} />
            <span>Connected</span>
          </div>
        );
      case 'not_connected':
        return (
          <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            <XCircle size={14} />
            <span>Not Connected</span>
          </div>
        );
      case 'coming_soon':
        return (
          <div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            <Bot size={14} />
            <span>Coming Soon</span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionButton = () => {
    switch (status) {
      case 'connected':
        return (
          <button
            onClick={() => onManage(id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Settings size={16} />
            Manage
          </button>
        );
      case 'not_connected':
        return (
          <button
            onClick={() => onConnect(id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ExternalLink size={16} />
            Connect
          </button>
        );
      case 'coming_soon':
        return (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-gray-500 bg-gray-200 cursor-not-allowed"
          >
            Coming Soon
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col justify-between bg-white border border-gray-200 rounded-lg shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          {logo}
          {renderStatusBadge()}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <p className="mt-1 text-sm text-gray-500 h-10">{description}</p>
      </div>
      <div className="p-6 pt-0">
        {renderActionButton()}
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---

/**
 * A grid view displaying all available integrations with connection status.
 * Allows users to search and filter integrations.
 */
const IntegrationGrid: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [integrations] = useState<Integration[]>(mockIntegrations); // In a real app, this would come from props or a data store.

  const handleConnect = (id: string) => {
    console.log(`Initiating connection for integration: ${id}`);
    // Here you would typically open an OAuth flow or a configuration modal.
    alert(`Connecting to ${id}...`);
  };

  const handleManage = (id:string) => {
    console.log(`Managing settings for integration: ${id}`);
    // Here you would navigate to a settings page or open a management modal.
    alert(`Managing ${id}...`);
  };

  const filteredIntegrations = useMemo(() => {
    if (!searchTerm) {
      return integrations;
    }
    return integrations.filter(
      (integration) =>
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, integrations]);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Integrations</h1>
          <p className="mt-2 text-lg text-gray-600">
            Connect your favorite tools and services to supercharge your workflows.
          </p>
        </header>

        <div className="mb-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              className="block w-full max-w-lg rounded-md border-gray-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredIntegrations.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onConnect={handleConnect}
                onManage={handleManage}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 rounded-lg">
            <GitBranch className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No integrations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your search for "{searchTerm}" did not match any integrations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationGrid;