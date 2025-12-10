import React from 'react';

interface ErrorDisplayProps {
  /** The error message string or an Error object to display. If null or undefined, the component will not render. */
  error: string | Error | null | undefined;
  /** An optional prefix to add before the error message (e.g., "Error loading data: "). */
  messagePrefix?: string;
  /** An optional callback function to execute when the retry button is clicked. If not provided, no retry button will be displayed. */
  onRetry?: () => void;
  /** The label for the retry button. Defaults to "Try again". */
  retryLabel?: string;
  /** Optional CSS class name for the main container div. */
  className?: string;
  /** Optional inline styles for the main container div. */
  style?: React.CSSProperties;
}

/**
 * A generic component for displaying error messages, potentially with retry options.
 * It accepts an error message string or an Error object and can render a retry button
 * if an `onRetry` callback is provided.
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  messagePrefix,
  onRetry,
  retryLabel = 'Try again',
  className,
  style,
}) => {
  // Do not render the component if there's no error to display
  if (!error) {
    return null;
  }

  let errorMessage: string;
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    // Fallback for unexpected error types, though `error` prop type should prevent this
    errorMessage = 'An unknown error occurred.';
  }

  const fullMessage = messagePrefix ? `${messagePrefix} ${errorMessage}` : errorMessage;

  return (
    <div
      className={`flex flex-col items-center justify-center p-4 text-red-700 bg-red-50 border border-red-200 rounded-md shadow-sm ${className || ''}`}
      style={style}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center mb-2 text-center">
        {/* Simple SVG icon for an error/warning */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 mr-2 text-red-500 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="font-medium text-lg">{fullMessage}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;