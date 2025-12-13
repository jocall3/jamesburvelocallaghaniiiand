import React from 'react';

// Define the interface for a Stripe-like webhook event structure
interface WebhookEvent {
  id: string;
  type: string;
  created: number; // Unix timestamp
  livemode: boolean;
  data: {
    object: Record<string, any>;
    previous_attributes?: Record<string, any>;
  };
  request?: {
    id: string | null;
    idempotency_key: string | null;
  };
  api_version: string;
  pending_webhooks: number;
  // Add any other relevant fields you might want to display from a Stripe webhook
}

interface WebhookEventDetailsProps {
  event: WebhookEvent | null;
}

const WebhookEventDetails: React.FC<WebhookEventDetailsProps> = ({ event }) => {
  if (!event) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow-sm h-full flex items-center justify-center">
        <p>Select a webhook event from the list to view its details.</p>
      </div>
    );
  }

  // Helper to format Unix timestamp to a readable date string
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          Event ID: <span className="font-mono text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded-md">{event.id}</span>
        </h2>
        <span className="text-sm font-medium text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
          {event.type}
        </span>
      </div>

      {/* Metadata Section */}
      <div className="p-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <span className="font-medium text-gray-600">Created At:</span>{' '}
          {formatTimestamp(event.created)}
        </div>
        <div>
          <span className="font-medium text-gray-600">Livemode:</span>{' '}
          <span className={`font-semibold ${event.livemode ? 'text-green-600' : 'text-red-600'}`}>
            {event.livemode ? 'Yes' : 'No'}
          </span>
        </div>
        {event.request?.id && (
          <div>
            <span className="font-medium text-gray-600">Request ID:</span>{' '}
            <span className="font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{event.request.id}</span>
          </div>
        )}
        {event.request?.idempotency_key && (
          <div>
            <span className="font-medium text-gray-600">Idempotency Key:</span>{' '}
            <span className="font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{event.request.idempotency_key}</span>
          </div>
        )}
        <div>
          <span className="font-medium text-gray-600">API Version:</span>{' '}
          <span className="font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{event.api_version}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Pending Webhooks:</span>{' '}
          {event.pending_webhooks}
        </div>
      </div>

      {/* Payload Section */}
      <div className="flex-grow p-4 overflow-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Payload</h3>
        <pre className="bg-gray-800 text-white p-4 rounded-md text-sm font-mono overflow-x-auto shadow-inner">
          <code>
            {JSON.stringify(event.data, null, 2)}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default WebhookEventDetails;