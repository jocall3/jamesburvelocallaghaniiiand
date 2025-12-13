import React, { useState, useCallback } from 'react';

// Define the type for an API log entry.
// In a larger project, this interface would typically be imported from a shared types file.
interface ApiLogEntry {
  id: string;
  timestamp: string; // ISO 8601 string
  method: string;
  path: string;
  status: number;
  request: {
    headers: Record<string, string>;
    body: any; // Can be string, object, array, null, etc.
  };
  response: {
    headers: Record<string, string>;
    body: any; // Can be string, object, array, null, etc.
  };
  // Add other relevant fields as needed, e.g., duration, IP address, etc.
}

interface ApiRequestInspectorProps {
  logEntry: ApiLogEntry | null;
}

/**
 * Formats data into a pretty-printed JSON string.
 * Handles cases where data is already a string (attempting to parse it) or an object.
 * Returns an empty string if data is null/undefined or cannot be formatted as JSON.
 */
const formatJson = (data: any): string => {
  if (data === null || data === undefined) {
    return '';
  }
  if (typeof data === 'string') {
    try {
      // Attempt to parse if it's a string, then stringify for pretty print
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // If it's a string but not valid JSON, return it as is
      return data;
    }
  }
  // If it's an object/array, stringify it
  return JSON.stringify(data, null, 2);
};

/**
 * A simple CodeBlock component for displaying formatted code.
 * In a real application, this would likely be a more sophisticated component
 * using a library like `react-syntax-highlighter` for proper syntax highlighting.
 */
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code }) => (
  <pre className="bg-gray-800 text-white p-4 rounded-md overflow-auto text-sm font-mono max-h-96">
    <code>{code}</code>
  </pre>
);

/**
 * A component for inspecting the full request and response body of a selected API log entry.
 * It displays the request and response bodies in separate tabs, formatted as JSON,
 * and provides a button to copy the content to the clipboard.
 */
const ApiRequestInspector: React.FC<ApiRequestInspectorProps> = ({ logEntry }) => {
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');
  const [copiedRequest, setCopiedRequest] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Display a message if no log entry is selected
  if (!logEntry) {
    return (
      <div className="flex items-center justify-center h-full bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-gray-500">
        <p>Select an API log entry to inspect its details.</p>
      </div>
    );
  }

  const requestBody = formatJson(logEntry.request.body);
  const responseBody = formatJson(logEntry.response.body);

  /**
   * Handles copying text to the clipboard.
   * Provides visual feedback to the user by temporarily changing the button text.
   */
  const handleCopy = useCallback(async (text: string, type: 'request' | 'response') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'request') {
        setCopiedRequest(true);
        setTimeout(() => setCopiedRequest(false), 2000); // Reset "Copied!" message after 2 seconds
      } else {
        setCopiedResponse(true);
        setTimeout(() => setCopiedResponse(false), 2000); // Reset "Copied!" message after 2 seconds
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // In a production app, you might want to show a user-friendly toast notification here.
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header section with basic log entry info */}
      <div className="flex-shrink-0 border-b border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900">API Request/Response Details</h3>
        <p className="text-sm text-gray-600 mt-1">
          <span className="font-medium">{logEntry.method}</span> {logEntry.path} &bull; Status:{' '}
          <span className={logEntry.status >= 400 ? 'text-red-600' : 'text-green-600'}>
            {logEntry.status}
          </span>
          {logEntry.timestamp && (
            <> &bull; {new Date(logEntry.timestamp).toLocaleString()}</>
          )}
        </p>
      </div>

      {/* Tabs for switching between Request and Response */}
      <div className="flex-shrink-0 border-b border-gray-200">
        <div className="flex space-x-4 px-4 pt-2" role="tablist">
          <button
            className={`py-2 px-1 border-b-2 text-sm ${
              activeTab === 'request'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            onClick={() => setActiveTab('request')}
            role="tab"
            aria-selected={activeTab === 'request'}
            id="tab-request"
            aria-controls="panel-request"
          >
            Request Body
          </button>
          <button
            className={`py-2 px-1 border-b-2 text-sm ${
              activeTab === 'response'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            onClick={() => setActiveTab('response')}
            role="tab"
            aria-selected={activeTab === 'response'}
            id="tab-response"
            aria-controls="panel-response"
          >
            Response Body
          </button>
        </div>
      </div>

      {/* Content area for the selected tab */}
      <div className="flex-grow p-4 overflow-auto">
        {activeTab === 'request' && (
          <div role="tabpanel" id="panel-request" aria-labelledby="tab-request">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => handleCopy(requestBody, 'request')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {copiedRequest ? 'Copied!' : 'Copy Request'}
              </button>
            </div>
            {requestBody ? (
              <CodeBlock code={requestBody} language="json" />
            ) : (
              <p className="text-gray-500 italic">No request body available.</p>
            )}
          </div>
        )}

        {activeTab === 'response' && (
          <div role="tabpanel" id="panel-response" aria-labelledby="tab-response">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => handleCopy(responseBody, 'response')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {copiedResponse ? 'Copied!' : 'Copy Response'}
              </button>
            </div>
            {responseBody ? (
              <CodeBlock code={responseBody} language="json" />
            ) : (
              <p className="text-gray-500 italic">No response body available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiRequestInspector;