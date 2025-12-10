import React, { HTMLAttributes, ReactNode } from 'react';

interface SettingsPanelProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The main title of the settings panel.
   */
  title: string;
  /**
   * An optional subtitle or description for the panel.
   */
  description?: string;
  /**
   * The content to be rendered inside the panel. This typically consists of
   * individual setting sections or components.
   */
  children: ReactNode;
  /**
   * Optional content to be rendered on the right side of the header,
   * e.g., action buttons like "Edit" or "Help".
   */
  headerActions?: ReactNode;
  /**
   * Optional content for the footer of the panel, typically used for
   * action buttons like "Save" or "Cancel".
   */
  footerContent?: ReactNode;
  /**
   * Callback function to be called when the panel's close button is clicked.
   * If provided, a close button will be rendered in the header.
   */
  onClose?: () => void;
  /**
   * Additional CSS classes for the main panel container.
   */
  className?: string;
}

/**
 * A generic panel component for displaying and managing various application settings.
 * It provides a consistent structure with a title, optional description, content area,
 * and optional header actions and footer content.
 *
 * @param {SettingsPanelProps} props - The properties for the SettingsPanel component.
 * @returns {JSX.Element} The rendered settings panel.
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({
  title,
  description,
  children,
  headerActions,
  footerContent,
  onClose,
  className,
  id,
  ...rest
}) => {
  return (
    <div
      id={id}
      className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className || ''}`}
      {...rest}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex-grow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-3 ml-4">
          {headerActions}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label={`Close ${title} settings`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {children}
      </div>

      {/* Footer */}
      {footerContent && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          {footerContent}
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;