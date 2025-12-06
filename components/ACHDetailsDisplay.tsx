
import React from 'react';
import { ACHDetails } from '../types';

/**
 * Props for the ACHDetailsDisplay component.
 */
interface ACHDetailsDisplayProps {
  /** The ACH details object containing routing and account numbers. */
  details: ACHDetails;
  /** Optional flag to hide sensitive numbers by default (shows obfuscated versions). Defaults to true. */
  hideSensitive?: boolean;
}

/**
 * A secure component to display sensitive ACH account and routing numbers.
 *
 * It defaults to displaying partially obscured numbers and provides a mechanism
 * (though external state management or component logic would control the actual reveal)
 * to indicate when the sensitive data is intended to be visible.
 *
 * NOTE: In a real-world application, the display logic (showing real numbers)
 * would be tied to strong authentication/authorization checks and an audit trail.
 */
const ACHDetailsDisplay: React.FC<ACHDetailsDisplayProps> = ({
  details,
  hideSensitive = true,
}) => {
  const [showFullDetails, setShowFullDetails] = React.useState(!hideSensitive);

  if (!details) {
    return <div>No ACH details available.</div>;
  }

  // Helper function to obscure numbers securely
  const obscureNumber = (num: string | undefined): string => {
    if (!num) return 'N/A';
    if (num.length <= 4) return `****`;
    const visibleLength = 4;
    return `****${num.slice(-visibleLength)}`;
  };

  const displayRoutingNumber = showFullDetails
    ? details.routingNumber
    : obscureNumber(details.routingNumber);

  const displayAccountNumber = showFullDetails
    ? details.realAccountNumber
    : obscureNumber(details.realAccountNumber);

  const toggleVisibility = () => {
    setShowFullDetails(prev => !prev);
  };

  return (
    <div className="ach-details-display p-4 border rounded-lg bg-gray-50 shadow-sm">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">ACH Payment Details</h3>

      <div className="space-y-2">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-sm font-medium text-gray-600">Routing Number:</span>
          <span
            className={`font-mono text-base ${showFullDetails ? 'text-green-700' : 'text-red-500'}`}
            data-testid="routing-number"
          >
            {displayRoutingNumber}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Account Number:</span>
          <span
            className={`font-mono text-base ${showFullDetails ? 'text-green-700' : 'text-red-500'}`}
            data-testid="account-number"
          >
            {displayAccountNumber}
          </span>
        </div>
      </div>

      {hideSensitive && (
        <button
          onClick={toggleVisibility}
          className="mt-4 text-sm px-3 py-1 rounded-md transition-colors duration-150"
          style={{
            backgroundColor: showFullDetails ? '#fcd34d' : '#3b82f6',
            color: showFullDetails ? '#1f2937' : 'white',
          }}
          data-testid="toggle-visibility-button"
        >
          {showFullDetails ? 'Hide Sensitive Details' : 'Show Full Details'}
        </button>
      )}

      {!hideSensitive && (
        <p className="mt-4 text-xs text-gray-500">
          Note: Details are displayed in full as configured by component props.
        </p>
      )}
    </div>
  );
};

export default ACHDetailsDisplay;
