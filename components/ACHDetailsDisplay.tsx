/*
# Beyond the Stars: 3 Critical Security Lessons from a Simple ACH Display Component

In the digital age, handling sensitive financial data is a daily reality for many applications. Whether it's credit card numbers, bank details, or ACH information, the challenge is always the same: how do we display this data to authorized users while keeping it absolutely secure? You might think a well-designed UI component that masks sensitive numbers is the answer. And while it's a crucial first step, the truth about true data security often lies far beyond what meets the eye. Let's dive into a seemingly simple React component for displaying ACH details and uncover some surprising, yet vital, security lessons.

### Takeaway 1: Security by Default is Your Best Friend

When building components that touch sensitive data, the safest default is always to hide or obscure. Our `ACHDetailsDisplay` component exemplifies this with its `hideSensitive = true` prop. By default, it presents a masked version of the routing and account numbers, showing only the last four digits. This isn't just good practice; it's a fundamental principle of "least privilege" applied to data display. It ensures that even if a component is accidentally rendered without explicit security configurations, sensitive data isn't immediately exposed. It's a small detail that makes a big difference in preventing accidental data leaks.

### Takeaway 2: The Client-Side Illusion: True Security Lives Server-Side

Here's where things get counter-intuitive. Our component has a `toggleVisibility` function and a button to reveal the full details. It *looks* like the component is handling the security. But this is a critical illusion. The client-side toggle is merely a user interface convenience. The real security decision – whether a user is *authorized* to see the full, unmasked numbers – must never be made solely on the client. If the full numbers are already available in the client-side code (even if hidden), a determined attacker could potentially bypass the UI. This leads us to the most impactful insight from our component's internal notes:

> "In a real-world application, the display logic (showing real numbers) would be tied to strong authentication/authorization checks and an audit trail."

This quote is a stark reminder that the client-side is for presentation, not for ultimate security enforcement.

### Takeaway 3: The Unseen Guardians: Authentication, Authorization, and Audit Trails

The true heavy lifting for sensitive data security happens behind the scenes. Before our `ACHDetailsDisplay` component ever receives the *real* account numbers, a robust backend system should have already performed several critical checks:
*   **Authentication:** Is the user who they claim to be? (e.g., password, MFA).
*   **Authorization:** Does this *specific* authenticated user have the *permission* to view *this specific* sensitive data? (e.g., only an account owner or a specific admin role).
*   **Audit Trail:** If the sensitive data is revealed, is there an immutable record of *who* viewed it, *when*, and from *where*? This is crucial for compliance, forensics, and accountability.

Without these server-side guardians, a client-side display component, no matter how well-designed, is merely a facade.

### Conclusion:

Building secure applications is a multi-layered endeavor. While a well-crafted UI component like our `ACHDetailsDisplay` provides essential user experience and a first line of defense through obfuscation, it's vital to remember its place in the larger security architecture. The true power to protect sensitive data lies not in how it's displayed, but in the robust authentication, authorization, and auditing mechanisms that control access to it. So, as you design your next application, ask yourself: Is my client-side component merely *hiding* sensitive data, or is my entire system truly *protecting* it?
*/
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