import React, { useState, useEffect } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

// Assume these are your actual API endpoints
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

interface PaymentMethodProps {
  customerId: string;
  onPaymentMethodUpdate: (paymentMethodId: string) => void;
  isLoading: boolean;
}

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

const StyledCardElement = styled(CardElement)(({ theme }) => ({
  base: {
    color: '#32325d',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    '::placeholder': {
      color: '#aab7c4',
    },
  },
  invalid: {
    color: '#fa755a',
  },
}));

const SubscriptionPaymentMethod: React.FC<PaymentMethodProps> = ({
  customerId,
  onPaymentMethodUpdate,
  isLoading,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentMethod = async () => {
      if (!customerId) return;
      try {
        const response = await fetch(`${API_BASE_URL}/subscriptions/payment-method/${customerId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch payment method');
        }
        const data = await response.json();
        setPaymentMethodId(data.paymentMethodId);
      } catch (err) {
        console.error('Error fetching payment method:', err);
        setError('Could not load current payment method.');
      }
    };
    fetchPaymentMethod();
  }, [customerId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // If a payment method already exists, we might want to update it or prompt the user.
      // For this example, we'll assume we're always creating a new one or updating if one exists.
      // In a real-world scenario, you'd likely have more sophisticated logic.

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card element not found.');
        setProcessing(false);
        return;
      }

      let paymentMethod;
      if (paymentMethodId) {
        // If a payment method exists, detach it and create a new one.
        // Alternatively, you could use stripe.confirmCardPayment with the existing payment method ID
        // if you were just trying to charge it. For updating, detaching and re-creating is common.
        await fetch(`${API_BASE_URL}/subscriptions/detach-payment-method`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, paymentMethodId }),
        });
        paymentMethod = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            // Add billing details if available from user profile
            // name: user.name,
            // email: user.email,
          },
        });
      } else {
        paymentMethod = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            // Add billing details if available from user profile
            // name: user.name,
            // email: user.email,
          },
        });
      }

      if (paymentMethod.error) {
        setError(paymentMethod.error.message || 'An error occurred with your card details.');
        setProcessing(false);
        return;
      }

      // Attach the new payment method to the customer
      const attachResponse = await fetch(`${API_BASE_URL}/subscriptions/attach-payment-method`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          paymentMethodId: paymentMethod.paymentMethod.id,
        }),
      });

      if (!attachResponse.ok) {
        const errorData = await attachResponse.json();
        throw new Error(errorData.message || 'Failed to attach payment method to customer.');
      }

      const attachData = await attachResponse.json();
      setPaymentMethodId(attachData.paymentMethodId);
      onPaymentMethodUpdate(attachData.paymentMethodId);
      setError(null); // Clear any previous errors
      alert('Payment method updated successfully!');

    } catch (err: any) {
      console.error('Error updating payment method:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Payment Method
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Update your payment details
        </Typography>
        <StyledCardElement
          options={{
            hidePostalCode: true, // Adjust as needed
          }}
        />
      </Box>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={!stripe || processing || isLoading}
        fullWidth
        sx={{ mt: 2 }}
      >
        {processing ? <CircularProgress size={24} color="inherit" /> : 'Update Payment Method'}
      </Button>
      {paymentMethodId && (
        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
          Current Payment Method ID: {paymentMethodId} (masked for security)
        </Typography>
      )}
    </Box>
  );
};

interface SubscriptionPaymentMethodWrapperProps {
  customerId: string;
  onPaymentMethodUpdate: (paymentMethodId: string) => void;
  isLoading: boolean;
}

const SubscriptionPaymentMethodWrapper: React.FC<SubscriptionPaymentMethodWrapperProps> = ({
  customerId,
  onPaymentMethodUpdate,
  isLoading,
}) => {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionPaymentMethod
        customerId={customerId}
        onPaymentMethodUpdate={onPaymentMethodUpdate}
        isLoading={isLoading}
      />
    </Elements>
  );
};

export default SubscriptionPaymentMethodWrapper;