
import React from 'react';

interface StripeStatusBadgeProps {
  status: string | null | undefined;
  objectType: string;
}

const StripeStatusBadge: React.FC<StripeStatusBadgeProps> = ({ status, objectType }) => {
  if (!status) {
    return null;
  }

  const getBadgeVariant = (status: string, objectType: string) => {
    const lowerCaseStatus = status.toLowerCase();

    switch (objectType) {
      case 'account':
        if (lowerCaseStatus === 'active') return 'success';
        if (lowerCaseStatus === 'inactive' || lowerCaseStatus === 'pending') return 'warning';
        if (lowerCaseStatus === 'disabled') return 'danger';
        break;
      case 'charge':
        if (lowerCaseStatus === 'succeeded') return 'success';
        if (lowerCaseStatus === 'pending') return 'warning';
        if (lowerCaseStatus === 'failed') return 'danger';
        if (lowerCaseStatus === 'refunded') return 'secondary';
        break;
      case 'payment_intent':
        if (lowerCaseStatus === 'succeeded') return 'success';
        if (lowerCaseStatus === 'requires_payment_method' || lowerCaseStatus === 'processing' || lowerCaseStatus === 'requires_confirmation' || lowerCaseStatus === 'requires_action') return 'warning';
        if (lowerCaseStatus === 'requires_capture') return 'info';
        if (lowerCaseStatus === 'canceled' || lowerCaseStatus === 'requires_capture' || lowerCaseStatus === 'requires_payment_method') return 'danger';
        break;
        case 'checkout.session':
            if (lowerCaseStatus === 'complete') return 'success';
            if (lowerCaseStatus === 'open') return 'warning';
            if (lowerCaseStatus === 'expired' || lowerCaseStatus === 'canceled') return 'danger';
            break;
      case 'subscription':
          if (lowerCaseStatus === 'active') return 'success';
          if (lowerCaseStatus === 'incomplete' || lowerCaseStatus === 'past_due' || lowerCaseStatus === 'trialing') return 'warning';
          if (lowerCaseStatus === 'canceled' || lowerCaseStatus === 'unpaid' || lowerCaseStatus === 'incomplete_expired') return 'danger';
          break;
      case 'dispute':
          if (lowerCaseStatus === 'won') return 'success';
          if (lowerCaseStatus === 'needs_response') return 'warning';
          if (lowerCaseStatus === 'lost') return 'danger';
          break;
      case 'payout':
          if (lowerCaseStatus === 'paid') return 'success';
          if (lowerCaseStatus === 'in_transit') return 'warning';
          if (lowerCaseStatus === 'failed') return 'danger';
          break;
          case 'issuing.authorization':
              if (lowerCaseStatus === 'approved') return 'success';
              if (lowerCaseStatus === 'pending') return 'warning';
              if (lowerCaseStatus === 'declined') return 'danger';
              break;
      default:
        if (lowerCaseStatus === 'active' || lowerCaseStatus === 'succeeded' || lowerCaseStatus === 'paid' || lowerCaseStatus === 'verified') return 'success';
        if (lowerCaseStatus === 'pending' || lowerCaseStatus === 'requires_action' || lowerCaseStatus === 'in_transit' || lowerCaseStatus === 'processing') return 'warning';
        if (lowerCaseStatus === 'failed' || lowerCaseStatus === 'canceled' || lowerCaseStatus === 'declined' || lowerCaseStatus === 'lost' || lowerCaseStatus === 'unpaid' || lowerCaseStatus === 'requires_payment_method' || lowerCaseStatus === 'expired' || lowerCaseStatus === 'disabled') return 'danger';
    }

    return 'default';
  };

  const getBadgeText = (status: string, objectType: string) => {
    const lowerCaseStatus = status.toLowerCase();

    switch (objectType) {
      case 'account':
        if (lowerCaseStatus === 'active') return 'Active';
        if (lowerCaseStatus === 'inactive') return 'Needs Review';
        if (lowerCaseStatus === 'disabled') return 'Restricted';
        if (lowerCaseStatus === 'pending') return 'Pending';
        break;
      case 'charge':
        if (lowerCaseStatus === 'succeeded') return 'Succeeded';
        if (lowerCaseStatus === 'pending') return 'Pending';
        if (lowerCaseStatus === 'failed') return 'Failed';
        if (lowerCaseStatus === 'refunded') return 'Refunded';
        break;
        case 'payment_intent':
            if (lowerCaseStatus === 'succeeded') return 'Succeeded';
            if (lowerCaseStatus === 'requires_payment_method') return 'Requires Payment';
            if (lowerCaseStatus === 'processing') return 'Processing';
            if (lowerCaseStatus === 'requires_confirmation') return 'Requires Confirmation';
            if (lowerCaseStatus === 'requires_action') return 'Requires Action';
            if (lowerCaseStatus === 'canceled') return 'Canceled';
            if (lowerCaseStatus === 'requires_capture') return 'Requires Capture';
            break;
        case 'checkout.session':
            if (lowerCaseStatus === 'complete') return 'Complete';
            if (lowerCaseStatus === 'open') return 'Open';
            if (lowerCaseStatus === 'expired') return 'Expired';
            if (lowerCaseStatus === 'canceled') return 'Canceled';
            break;
        case 'subscription':
            if (lowerCaseStatus === 'active') return 'Active';
            if (lowerCaseStatus === 'incomplete') return 'Incomplete';
            if (lowerCaseStatus === 'past_due') return 'Past Due';
            if (lowerCaseStatus === 'trialing') return 'Trialing';
            if (lowerCaseStatus === 'canceled') return 'Canceled';
            if (lowerCaseStatus === 'unpaid') return 'Unpaid';
            if (lowerCaseStatus === 'incomplete_expired') return 'Incomplete Expired';
            break;
      case 'dispute':
          if (lowerCaseStatus === 'won') return 'Won';
          if (lowerCaseStatus === 'needs_response') return 'Needs Response';
          if (lowerCaseStatus === 'lost') return 'Lost';
          break;
      case 'payout':
          if (lowerCaseStatus === 'paid') return 'Paid';
          if (lowerCaseStatus === 'in_transit') return 'In Transit';
          if (lowerCaseStatus === 'failed') return 'Failed';
          break;
          case 'issuing.authorization':
              if (lowerCaseStatus === 'approved') return 'Approved';
              if (lowerCaseStatus === 'pending') return 'Pending';
              if (lowerCaseStatus === 'declined') return 'Declined';
              break;

      default:
        return status;
    }

    return status;
  };

  const badgeVariant = getBadgeVariant(status, objectType);
  const badgeText = getBadgeText(status, objectType);

  return (
    <span className={`badge bg-${badgeVariant}`}>
      {badgeText}
    </span>
  );
};

export default StripeStatusBadge;
