import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

/**
 * Type definition for a single application identity object,
 * matching the structure of the provided CSV data.
 */
interface Application {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: string;
  applicationType: string;
  accountEnabled: string;
  applicationVisibility: string;
  assignmentRequired: string;
  isAppProxy: string;
}

/**
 * Props for the ApplicationRow component.
 */
interface ApplicationRowProps {
  app: Application;
}

/**
 * Helper to determine the Tailwind CSS classes for the application type badge.
 * @param type - The application type string.
 * @returns A string of CSS classes for styling.
 */
const getApplicationTypeClasses = (type: string): string => {
  switch (type) {
    case 'Enterprise Application':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'Microsoft Application':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case 'Managed Identity':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case '': // Handle empty type
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default:
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
  }
};

/**
 * A small component to render a boolean value as a styled icon.
 * @param {boolean} isTrue - The boolean value to represent.
 */
const BooleanIcon = ({ isTrue }: { isTrue: boolean }) => {
  return isTrue ? (
    <CheckCircleIcon className="h-5 w-5 text-green-500" title="True" />
  ) : (
    <XCircleIcon className="h-5 w-5 text-red-500" title="False" />
  );
};

/**
 * Renders a single row (<tr>) in the applications table.
 * It takes an application object and displays its properties in table cells (<td>).
 */
const ApplicationRow: React.FC<ApplicationRowProps> = ({ app }) => {
  // Format the date for better readability.
  const formattedDate = app.createdDateTime
    ? new Date(app.createdDateTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  const applicationTypeDisplay = app.applicationType || 'N/A';

  return (
    <tr className="group border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
      <td className="py-3 px-4 text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {app.id}
      </td>
      
      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
        {app.displayName}
      </td>

      <td className="py-3 px-4 text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {app.appId}
      </td>
      
      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
        {formattedDate}
      </td>
      
      <td className="py-3 px-4 text-center">
        <span
          className={`py-1 px-2.5 rounded-full text-xs font-medium ${getApplicationTypeClasses(app.applicationType)}`}
        >
          {applicationTypeDisplay}
        </span>
      </td>
      
      <td className="py-3 px-4">
        <div className="flex justify-center">
          <BooleanIcon isTrue={app.accountEnabled === 'True'} />
        </div>
      </td>
      
      <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-300">
        {app.applicationVisibility}
      </td>
      
      <td className="py-3 px-4">
        <div className="flex justify-center">
          <BooleanIcon isTrue={app.assignmentRequired === 'True'} />
        </div>
      </td>
      
      <td className="py-3 px-4">
        <div className="flex justify-center">
          <BooleanIcon isTrue={app.isAppProxy === 'True'} />
        </div>
      </td>
    </tr>
  );
};

export default ApplicationRow;