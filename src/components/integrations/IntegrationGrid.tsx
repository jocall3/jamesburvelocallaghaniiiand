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
  category: 'Storage' | 'Code' | 'Communication' | 'Payments' | 'Automation' | 'Data' | 'Open Banking';
}

// --- UTILITY FUNCTIONS ---

// Generates a random string ID
const generateId = (): string => Math.random().toString(36).substring(2, 15);

// Generates a random integer within a range
const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generates a random status
const generateStatus = (): IntegrationStatus => {
  const statuses: IntegrationStatus[] = ['connected', 'not_connected', 'coming_soon'];
  return statuses[getRandomInt(0, statuses.length - 1)];
};

// Generates a random category
const generateCategory = (): Integration['category'] => {
  const categories: Integration['category'][] = ['Storage', 'Code', 'Communication', 'Payments', 'Automation', 'Data', 'Open Banking'];
  return categories[getRandomInt(0, categories.length - 1)];
};

// Generates a random description
const generateDescription = (): string => {
  const descriptions = [
    'Seamlessly integrate with our platform.',
    'Enhance your workflow with our powerful tools.',
    'Connect and automate your daily tasks.',
    'Unlock new possibilities with our open banking solutions.',
    'Securely store and access your data.',
    'Collaborate and communicate effectively.',
    'Process payments with ease.',
    'Automate your business processes.',
    'Gain insights from your data.',
    'Develop and deploy code efficiently.',
  ];
  return descriptions[getRandomInt(0, descriptions.length - 1)];
};

// --- INTEGRATION GENERATOR ---

const generateIntegration = (index: number): Integration => {
  const name = `Integration ${index + 1}`;
  return {
    id: generateId(),
    name: name,
    description: generateDescription(),
    logo: <Bot className="w-12 h-12 text-gray-600" />,
    status: generateStatus(),
    category: generateCategory(),
  };
};

// --- MOCK DATA ---
// Generates 50 integrations using the generative functions
const mockIntegrations: Integration[] = Array.from({ length: 50 }, (_, i) => generateIntegration(i));

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