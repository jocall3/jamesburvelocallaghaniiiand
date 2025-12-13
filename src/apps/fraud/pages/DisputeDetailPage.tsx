import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useStripeApp } from '@stripe/ui-extension-sdk/app'; // Assuming this hook exists for Stripe App SDK access
import {
  Box,
  Button,
  Card,
  Text,
  Stack,
  Spinner,
  Alert,
  Textarea,
  FileUpload,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Link,
} from '@stripe/ui-extension-sdk/ui'; // Assuming these UI components exist

// Define types for dispute data
interface DisputeEvidence {
  product_description?: string;
  customer_communication?: string;
  service_documentation?: string;
  shipping_documentation?: string;
  uncategorized_text?: string;
  uncategorized_file_ids?: string[]; // Assuming file uploads return IDs
  // ... other evidence fields
}

interface Dispute {
  id: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  created: number;
  charge_id: string;
  livemode: boolean;
  metadata: { [key: string]: string };
  evidence: DisputeEvidence;
  // ... other dispute fields
}

interface DisputeParams {
  disputeId: string;
}

const DisputeDetailPage: React.FC = () => {
  const { disputeId } = useParams<DisputeParams>();
  const { sdk } = useStripeApp();

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [evidenceText, setEvidenceText] = useState<string>('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submittingEvidence, setSubmittingEvidence] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  const fetchDisputeDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real Stripe App, you'd use sdk.getDispute or a backend call
      // For this example, we'll mock the data fetch
      const fetchedDispute: Dispute = await new Promise((resolve) =>
        setTimeout(() => {
          resolve({
            id: disputeId,
            amount: 12500, // $125.00
            currency: 'usd',
            reason: 'fraudulent',
            status: 'needs_response',
            created: Date.now() / 1000 - 86400 * 3, // 3 days ago
            charge_id: 'ch_1234567890abcdef',
            livemode: false,
            metadata: {
              customer_email: 'customer@example.com',
              order_id: 'ORD-XYZ-789',
            },
            evidence: {
              product_description: 'Premium subscription for 1 month.',
              customer_communication: 'Customer claimed they did not authorize this charge.',
            },
          });
        }, 1000)
      );
      setDispute(fetchedDispute);
    } catch (err: any) {
      setError(`Failed to load dispute: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    fetchDisputeDetails();
  }, [fetchDisputeDetails]);

  const handleFileChange = (files: File[]) => {
    setEvidenceFiles(files);
  };

  const handleSubmitEvidence = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittingEvidence(true);
    setSubmissionError(null);
    setSubmissionSuccess(false);

    try {
      // In a real Stripe App, you'd upload files to Stripe and then submit evidence
      // This is a simplified mock.
      const uploadedFileIds: string[] = [];
      if (evidenceFiles.length > 0) {
        // Mock file upload to Stripe, returning file IDs
        for (const file of evidenceFiles) {
          console.log(`Uploading file: ${file.name}`);
          // const fileUploadResponse = await sdk.uploadFile({ purpose: 'dispute_evidence', file });
          // uploadedFileIds.push(fileUploadResponse.id);
          uploadedFileIds.push(`file_${Math.random().toString(36).substring(2, 15)}`); // Mock ID
        }
      }

      const evidencePayload = {
        uncategorized_text: evidenceText,
        uncategorized_file_ids: uploadedFileIds,
        // You would map other form fields to specific evidence types here
      };

      console.log('Submitting evidence:', evidencePayload);

      // Mock Stripe SDK call to submit evidence
      await new Promise((resolve, reject) =>
        setTimeout(() => {
          if (Math.random() > 0.1) { // 90% success rate for mock
            resolve({});
          } else {
            reject(new Error('Failed to submit evidence. Please try again.'));
          }
        }, 1500)
      );

      setSubmissionSuccess(true);
      setEvidenceText('');
      setEvidenceFiles([]);
      // Re-fetch dispute details to show updated status/evidence
      fetchDisputeDetails();
    } catch (err: any) {
      setSubmissionError(`Error submitting evidence: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmittingEvidence(false);
    }
  };

  if (loading) {
    return (
      <Box padding="xl" align="center">
        <Spinner size="large" />
        <Text>Loading dispute details...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding="xl">
        <Alert variant="critical" title="Error">
          {error}
        </Alert>
        <Button onClick={fetchDisputeDetails} css={{ marginTop: 'spacing.medium' }}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!dispute) {
    return (
      <Box padding="xl">
        <Alert variant="warning" title="Dispute Not Found">
          The dispute with ID "{disputeId}" could not be found.
        </Alert>
      </Box>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Box padding="xl">
      <Stack spacing="xl">
        <Text type="title" size="large">
          Dispute Details: {dispute.id}
        </Text>

        <Card>
          <Stack spacing="medium">
            <Text type="subtitle">Dispute Overview</Text>
            <Table>
              <TableBody>
                <TableRow>
                  <TableHeaderCell>Amount</TableHeaderCell>
                  <TableCell>{formatCurrency(dispute.amount, dispute.currency)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHeaderCell>Reason</TableHeaderCell>
                  <TableCell>{dispute.reason}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableCell>{dispute.status.replace(/_/g, ' ')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHeaderCell>Created</TableHeaderCell>
                  <TableCell>{formatDate(dispute.created)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHeaderCell>Charge ID</TableHeaderCell>
                  <TableCell>
                    <Link href={`https://dashboard.stripe.com/charges/${dispute.charge_id}`} target="_blank" rel="noopener noreferrer">
                      {dispute.charge_id}
                    </Link>
                  </TableCell>
                </TableRow>
                {Object.entries(dispute.metadata).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableHeaderCell>{key.replace(/_/g, ' ')}</TableHeaderCell>
                    <TableCell>{value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        </Card>

        <Card>
          <Stack spacing="medium">
            <Text type="subtitle">Current Evidence</Text>
            {Object.keys(dispute.evidence).length === 0 ? (
              <Text type="secondary">No evidence has been submitted yet.</Text>
            ) : (
              <Table>
                <TableBody>
                  {Object.entries(dispute.evidence).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableHeaderCell>{key.replace(/_/g, ' ')}</TableHeaderCell>
                      <TableCell>
                        {Array.isArray(value) ? (
                          value.length > 0 ? (
                            <Stack spacing="extra-small">
                              {value.map((item, index) => (
                                <Text key={index}>{item}</Text> // Assuming file IDs or similar
                              ))}
                            </Stack>
                          ) : (
                            <Text type="secondary">None</Text>
                          )
                        ) : (
                          <Text>{value || <Text type="secondary">None</Text>}</Text>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Stack>
        </Card>

        {dispute.status === 'needs_response' && (
          <Card>
            <Stack spacing="medium">
              <Text type="subtitle">Submit New Evidence</Text>
              {submissionSuccess && (
                <Alert variant="success" title="Evidence Submitted">
                  Your evidence has been successfully submitted.
                </Alert>
              )}
              {submissionError && (
                <Alert variant="critical" title="Submission Error">
                  {submissionError}
                </Alert>
              )}
              <form onSubmit={handleSubmitEvidence}>
                <Stack spacing="medium">
                  <Textarea
                    label="General Evidence Text"
                    description="Provide any additional text evidence, such as communication logs, service details, or explanations."
                    value={evidenceText}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEvidenceText(e.target.value)}
                    rows={5}
                  />
                  <FileUpload
                    label="Upload Supporting Documents"
                    description="Upload relevant files (e.g., shipping labels, customer emails, service agreements). Max 5 files, 10MB each."
                    onFilesChange={handleFileChange}
                    accept={['image/*', 'application/pdf']}
                    multiple
                    maxFiles={5}
                    maxFileSize={10 * 1024 * 1024} // 10MB
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submittingEvidence}
                    disabled={submittingEvidence || (evidenceText.trim() === '' && evidenceFiles.length === 0)}
                  >
                    {submittingEvidence ? 'Submitting...' : 'Submit Evidence to Stripe'}
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Card>
        )}
      </Stack>
    </Box>
  );
};

export default DisputeDetailPage;