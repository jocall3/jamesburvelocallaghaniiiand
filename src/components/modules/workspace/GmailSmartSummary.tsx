```tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, CircularProgress, Button } from '@mui/material';
import axios from 'axios';

interface SummaryResponse {
  summary: string;
}

const GmailSmartSummary: React.FC<{ emailBody: string }> = ({ emailBody }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailBody) {
      generateSummary(emailBody);
    }
  }, [emailBody]);

  const generateSummary = async (body: string) => {
    setLoading(true);
    setError(null);

    try {
      // Replace with your actual backend endpoint
      const response = await axios.post<SummaryResponse>(
        '/api/summarize', // Ensure this endpoint exists and handles the summarization
        { text: body },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        setSummary(response.data.summary);
      } else {
        setError(`Failed to generate summary. Status code: ${response.status}`);
      }
    } catch (e: any) {
      setError(`Error generating summary: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (emailBody) {
      generateSummary(emailBody);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Smart Summary</Typography>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : summary ? (
          <>
            <Typography variant="body1">{summary}</Typography>
            <Button onClick={handleRegenerate} variant="outlined" style={{ marginTop: '10px' }}>
              Regenerate Summary
            </Button>
          </>
        ) : (
          <Typography variant="body2">
            No summary available. Please provide an email body to generate a summary.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default GmailSmartSummary;
```