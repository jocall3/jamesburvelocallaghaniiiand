
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  IdentityVerificationSession,
  IdentityVerificationReport,
  Stripe,
} from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Alert,
  Stack,
} from '@mui/material';

// Replace with your actual publishable key
const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';

interface IdentityViewProps {
  // Define any props if necessary
}

const IdentityView: React.FC<IdentityViewProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [verificationSession, setVerificationSession] =
    useState<IdentityVerificationSession | null>(null);
  const [verificationReport, setVerificationReport] =
    useState<IdentityVerificationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripePublishableKey) {
      setError('Missing Stripe publishable key.  Please set REACT_APP_STRIPE_PUBLISHABLE_KEY in your .env file.');
      setLoading(false);
      return;
    }
    const initializeStripe = async () => {
      try {
        const stripeInstance = await loadStripe(stripePublishableKey);
        setStripe(stripeInstance);
      } catch (err) {
        console.error('Error loading Stripe.js', err);
        setError('Failed to load Stripe.  Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const clientSecretFromParams = searchParams.get('client_secret');
    if (clientSecretFromParams) {
      setClientSecret(clientSecretFromParams);
    }
  }, [location.search]);


  useEffect(() => {
    const fetchVerificationSessionAndReport = async () => {
      if (!clientSecret || !stripe) {
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const verificationSessionResult =
          await stripe.identity.getVerificationSession(clientSecret);

        if (verificationSessionResult.error) {
          throw new Error(
            `Failed to retrieve verification session: ${verificationSessionResult.error.message}`,
          );
        }
        setVerificationSession(verificationSessionResult);

        if (verificationSessionResult.status === "verified") {
            setSuccessMessage("Verification successful!");
            const verificationReportResult = await stripe.identity.getVerificationReport(verificationSessionResult.last_verification_report as string)
          if (verificationReportResult.error) {
            throw new Error(
                `Failed to retrieve verification report: ${verificationReportResult.error.message}`,
            );
          }
          setVerificationReport(verificationReportResult);
        }
      } catch (err: any) {
        console.error('Error fetching verification session or report', err);
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationSessionAndReport();
  }, [clientSecret, stripe]);


  const handleStartVerification = async () => {
      if (!stripe) {
          setError("Stripe is not initialized.");
          return;
      }

      setLoading(true);
      setError(null);

      try {
          const response = await fetch("/.netlify/functions/create-verification-session", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({ return_url: window.location.href })
          });
          const data = await response.json();

          if (data.error) {
              throw new Error(data.error.message || "Failed to create verification session.");
          }

          if (data.clientSecret) {
              setClientSecret(data.clientSecret);
              // Navigate to the verification page
              window.location.href = `?client_secret=${data.clientSecret}`;
          }
          else {
              throw new Error("No clientSecret received.");
          }

      } catch (err: any) {
          console.error("Error creating verification session:", err);
          setError(err.message || "Failed to start verification.");
      } finally {
          setLoading(false);
      }

  }

  const renderVerificationStatus = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ margin: 2 }}>
          {error}
        </Alert>
      );
    }

    if (successMessage) {
        return (
          <Alert severity="success" sx={{ margin: 2 }}>
            {successMessage}
          </Alert>
        )
    }

    if (verificationSession) {
      switch (verificationSession.status) {
        case 'processing':
          return (
            <Box sx={{ padding: 2 }}>
              <Typography variant="h6">Verification in progress...</Typography>
              <CircularProgress />
            </Box>
          );
        case 'verified':
          return (
            <Box sx={{ padding: 2 }}>
              <Alert severity="success">Verification successful!</Alert>
              {verificationReport && (
                  <Box>
                      <Typography variant="subtitle1">Verification Report:</Typography>
                      <pre>{JSON.stringify(verificationReport, null, 2)}</pre>
                  </Box>
              )}
            </Box>
          );

        case 'requires_input':
          if (stripe && clientSecret) {
            return (
              <Box sx={{ padding: 2 }}>
                <Typography variant="h6">
                  Provide Identity Verification Information
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                      if (stripe) {
                          stripe.identity.verifyIdentity({
                              clientSecret: clientSecret,
                          });
                      }
                  }}
                  disabled={loading}
                >
                  Continue Verification
                </Button>
              </Box>
            );
          } else {
            return <Alert severity="warning">Client Secret not found.  Please try again.</Alert>;
          }
        case 'canceled':
            return (
                <Alert severity="warning" sx={{ margin: 2 }}>
                    Verification was cancelled.
                </Alert>
            );
        case 'failed':
            return (
                <Alert severity="error" sx={{ margin: 2 }}>
                    Verification failed.
                </Alert>
            );
        default:
          return (
            <Alert severity="info" sx={{ margin: 2 }}>
              Verification status: {verificationSession.status}
            </Alert>
          );
      }
    }

    // Initial state, no session yet
    return (
        <Stack spacing={2} sx={{ padding: 2 }}>
          <Typography variant="h6">Start Identity Verification</Typography>
          <Button variant="contained" color="primary" onClick={handleStartVerification} disabled={loading}>
            Start Verification
          </Button>
        </Stack>
    );
  };



  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Identity Verification
      </Typography>
      {renderVerificationStatus()}
    </Box>
  );
};

export default IdentityView;
