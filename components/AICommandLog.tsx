
import React from 'react';

// Type definition for a command log entry
type CommandLogEntry = {
  id: number;
  command: string;
  timestamp: string;
  status: 'Completed' | 'Failed' | 'Pending';
};

// Mock data for AI command log
const commandLogData: CommandLogEntry[] = [
  { id: 1, command: "Generate Q4 2023 balance report for 'Operating Account'", timestamp: "2 minutes ago", status: "Completed" },
  { id: 2, command: "Initiate a $10,000 wire transfer to 'Vendor ABC'", timestamp: "15 minutes ago", status: "Completed" },
  { id: 3, command: "List all pending payment orders over $5,000", timestamp: "1 hour ago", status: "Completed" },
  { id: 4, command: "Create a new virtual account for 'Project Phoenix'", timestamp: "3 hours ago", status: "Failed" },
  { id: 5, command: "Analyze cash flow trends for the last 90 days", timestamp: "5 hours ago", status: "Pending" },
  { id: 6, command: "Reconcile expected payments from 'Client XYZ'", timestamp: "yesterday", status: "Completed" },
  { id: 7, command: "Summarize transaction activity for the past 7 days", timestamp: "yesterday", status: "Completed" },
  { id: 8, command: "Find transaction with reference number 'XYZ123'", timestamp: "2 days ago", status: "Completed" },
];


// SVG Icon Components
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
);


// Helper to get icon based on status
const getStatusIcon = (status: CommandLogEntry['status']) => {
  switch (status) {
    case 'Completed':
      return { Icon: CheckCircleIcon, bgColor: 'bg-green-100 dark:bg-green-900/30' };
    case 'Failed':
      return { Icon: XCircleIcon, bgColor: 'bg-red-100 dark:bg-red-900/30' };
    case 'Pending':
      return { Icon: ClockIcon, bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
    default:
      return { Icon: CheckCircleIcon, bgColor: 'bg-gray-100 dark:bg-gray-700' };
  }
};

const AICommandLog = () => {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 shadow-sm rounded-lg p-4 sm:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Command Log</h3>
        <a href="#" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-500">
          View all
        </a>
      </div>
      <div className="flex-grow overflow-y-auto -mr-4 pr-4">
        <ul className="space-y-4">
          {commandLogData.map((item, index) => {
            const { Icon, bgColor } = getStatusIcon(item.status);
            return (
              <li key={item.id}>
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${bgColor}`}>
                    <Icon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-tight">
                      {item.command}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.timestamp} &middot; {item.status}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AICommandLog;