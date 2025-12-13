import React from 'react';

interface ErrorDisplayProps {
  /**
   * The main error message to be displayed.
   */
  message: string;
  /**
   * Optional detailed information about the error. Can be a single string or an array of strings.
   * Each string will be displayed on a new line.
   */
  details?: string | string[];
  /**
   * Optional callback function to be called when the close button is clicked.
   * If provided, a close button will be rendered.
   */
  onClose?: () => void;
  /**
   * Optional additional CSS class names to apply to the root container of the error display.
   * Useful for custom styling or layout adjustments.
   */
  className?: string;
}

/**
 * A UI component for consistently displaying error messages to the user.
 * It provides a clear visual indication of an error, can include detailed information,
 * and optionally allows the user to dismiss the message.
 *
 * Uses Tailwind CSS classes for styling.
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  details,
  onClose,
  className,
}) => {
  // Do not render the component if there's no message to display.
  if (!message) {
    return null;
  }

  // Normalize details into an array for consistent rendering.
  const detailMessages = Array.isArray(details) ? details : (details ? [details] : []);

  return (
    <div
      role="alert"
      aria-live="assertive" // Announce changes to screen readers
      className={`
        bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative
        ${className || ''}
      `}
    >
      <strong className="font-bold mr-2">Error!</strong>
      <span className="block sm:inline">{message}</span>

      {detailMessages.length > 0 && (
        <div className="mt-2 text-sm">
          {detailMessages.map((detail, index) => (
            <p key={index} className="mt-1">{detail}</p>
          ))}
        </div>
      )}

      {onClose && (
        <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded-full p-1"
            aria-label="Close error message"
          >
            {/* SVG for a close icon (X) */}
            <svg
              className="fill-current h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
            </svg>
          </button>
        </span>
      )}
    </div>
  );
};

export default ErrorDisplay;