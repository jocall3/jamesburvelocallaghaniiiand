import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Spinner, Text, Box, Link } from '@stripe/ui-extension-sdk/ui';
import { useStripe, useApp } from '@stripe/ui-extension-sdk/context';

/**
 * Defines the possible states of the Connect onboarding process.
 */
type OnboardingState = 'initial' | 'loading' | 'pending' | 'completed' | 'error';

interface OnboardingFlowProps {
  /**
   * The ID of the Stripe Connect Account that needs onboarding.
   */
  accountId: string;
  /**
   * Callback function executed when onboarding is successfully completed.
   */
  onOnboardingComplete: () => void;
}

/**
 * A component that embeds or links to the Stripe Connect onboarding flow for new platform users.
 *
 * This component handles the creation of the Account Link (URL) required to start the
 * Connect onboarding process and manages the state transitions.
 */
const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ accountId, onOnboardingComplete }) => {
  const stripe = useStripe();
  const app = useApp();
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>('initial');
  const [error, setError] = useState<string | null>(null);

  // Determine the return URL based on the current environment
  const getReturnUrl = useCallback(() => {
    // In a real Stripe App environment, you might use a specific endpoint
    // or the current app URL if available. For this mock, we use a placeholder.
    return `${window.location.origin}/stripe-app-return?account_id=${accountId}`;
  }, [accountId]);

  // Determine the refresh URL (used if the user closes the flow)
  const getRefreshUrl = useCallback(() => {
    // This URL should typically trigger a new link creation if the old one expired
    return `${window.location.origin}/stripe-app-refresh?account_id=${accountId}`;
  }, [accountId]);

  /**
   * Step 1: Create the Account Link using the Stripe API.
   */
  const createAccountLink = useCallback(async () => {
    if (onboardingState === 'loading') return;

    setOnboardingState('loading');
    setError(null);

    try {
      // In a real Stripe App, this call would typically go to your backend
      // which then calls the Stripe API to create the Account Link.
      // Since we are in a Stripe UI Extension, we simulate the backend call
      // or assume a custom API endpoint is available via the App context.

      // Mocking the API call to create the Account Link
      // In a production Stripe App, you would use `app.api.post` to call your backend.
      // Example: const response = await app.api.post('/create-account-link', { accountId, returnUrl, refreshUrl });

      // For demonstration, we simulate a successful response after a delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockLink = `https://connect.stripe.com/onboard/v1/link_mock_${accountId}?return_url=${encodeURIComponent(getReturnUrl())}`;

      setOnboardingUrl(mockLink);
      setOnboardingState('pending');

    } catch (err) {
      console.error('Error creating account link:', err);
      setError('Failed to generate the onboarding link. Please try again.');
      setOnboardingState('error');
    }
  }, [accountId, getReturnUrl, onboardingState]);

  useEffect(() => {
    // Automatically start the process when the component mounts
    if (onboardingState === 'initial') {
      createAccountLink();
    }
  }, [createAccountLink, onboardingState]);

  /**
   * Step 2: Handle the user clicking the link.
   */
  const handleStartOnboarding = () => {
    if (onboardingUrl) {
      // Open the link in a new tab/window
      window.open(onboardingUrl, '_blank');
      // Transition state to pending, waiting for the user to complete the flow
      setOnboardingState('pending');
    }
  };

  /**
   * Step 3: Check the status of the Connect Account (simulated).
   * In a real app, this would poll your backend or listen for webhooks.
   */
  const checkAccountStatus = useCallback(async () => {
    // Simulate checking the account status
    setOnboardingState('loading');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real scenario, you'd check `account.details_submitted` and `account.charges_enabled`
    const isCompleted = Math.random() > 0.5; // Mock completion status

    if (isCompleted) {
      setOnboardingState('completed');
      onOnboardingComplete();
    } else {
      // If not completed, revert to pending and allow the user to try again
      setOnboardingState('pending');
      setError('Account setup is not yet complete. Please continue the flow.');
    }
  }, [onOnboardingComplete]);


  // --- Render Logic ---

  if (onboardingState === 'loading' && !onboardingUrl) {
    return (
      <Card>
        <Box align="center" direction="column" padding="large">
          <Spinner size="medium" />
          <Text weight="bold" css={{ marginTop: '1rem' }}>
            Preparing Connect Onboarding Link...
          </Text>
        </Box>
      </Card>
    );
  }

  if (onboardingState === 'error' && error) {
    return (
      <Card>
        <Box padding="large">
          <Text color="negative" weight="bold">Error:</Text>
          <Text>{error}</Text>
          <Button
            type="primary"
            onClick={createAccountLink}
            css={{ marginTop: '1rem' }}
          >
            Retry Link Generation
          </Button>
        </Box>
      </Card>
    );
  }

  if (onboardingState === 'pending' || onboardingState === 'initial' || onboardingUrl) {
    return (
      <Card title="Stripe Connect Onboarding Required">
        <Box padding="large" direction="column" gap="medium">
          <Text>
            To fully utilize this app and process payments, the associated Stripe Connect account (ID: <code>{accountId}</code>) must complete its onboarding process.
          </Text>

          {onboardingState === 'pending' && (
            <Box css={{
              padding: '1rem',
              backgroundColor: 'var(--color-surface-secondary)',
              borderRadius: 'var(--border-radius-default)'
            }}>
              <Text weight="bold">Waiting for Completion</Text>
              <Text size="small">
                Please complete the setup in the new window that opened. If you already finished, click "Check Status" below.
              </Text>
            </Box>
          )}

          {onboardingUrl && (
            <Button
              type="primary"
              onClick={handleStartOnboarding}
              disabled={onboardingState === 'loading'}
            >
              {onboardingState === 'pending' ? 'Continue Onboarding' : 'Start Stripe Setup'}
            </Button>
          )}

          {onboardingState === 'pending' && (
            <Button
              type="secondary"
              onClick={checkAccountStatus}
              disabled={onboardingState === 'loading'}
            >
              {onboardingState === 'loading' ? <Spinner size="small" /> : 'Check Status'}
            </Button>
          )}

          {error && onboardingState !== 'error' && (
            <Text color="negative" size="small">{error}</Text>
          )}

          <Text size="small" color="secondary">
            This process links your account to our platform securely via Stripe Connect.
          </Text>
        </Box>
      </Card>
    );
  }

  // Should not be reached if logic is correct, but as a fallback
  return (
    <Card>
      <Text>Unexpected state encountered for account {accountId}.</Text>
    </Card>
  );
};

export default OnboardingFlow;