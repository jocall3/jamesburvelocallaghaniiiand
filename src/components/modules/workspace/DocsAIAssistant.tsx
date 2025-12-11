```typescript
import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Paper, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';

// Styled Components (example, adjust as needed)
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

interface DocsAIAssistantProps {
  // Define any props the component might receive (e.g., docId)
  docId?: string; // Optional Google Doc ID
}

interface AnalysisResult {
  summary?: string;
  financialData?: {
    income?: number;
    expenses?: number;
    profit?: number;
  };
  keyInformation?: string[];
}

const DocsAIAssistant: React.FC<DocsAIAssistantProps> = ({ docId }) => {
  const [docContent, setDocContent] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Placeholder function to fetch document content.  Replace with actual API call.
  const fetchDocContent = async (documentId: string) => {
    setIsLoading(true);
    setError(null);

    // Simulate an API call to get document content.
    return new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        if (documentId === "error") {
          reject("Failed to fetch document content.  Invalid document ID.");
          return;
        }

        // Placeholder document content.
        const content = `
          ## Financial Report

          Income: $10000
          Expenses: $7000
          Profit: $3000

          This document contains important financial information.
          Key Findings:  Profits are up 10% compared to last quarter.
        `;

        resolve(content);
      }, 1000); // Simulate network delay
    })
    .then(content => {
      setDocContent(content);
      return content;
    })
    .catch(err => {
      setError(String(err));
      return null;
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  // Placeholder function to analyze the document content.  Replace with actual AI API call.
  const analyzeDocContent = async (content: string) => {
    setIsLoading(true);
    setError(null);

    // Simulate an API call to analyze the document.
    return new Promise<AnalysisResult>((resolve, reject) => {
      setTimeout(() => {
        // Placeholder analysis.
        const result: AnalysisResult = {
          summary: "This document is a financial report with positive profit margins.",
          financialData: {
            income: 10000,
            expenses: 7000,
            profit: 3000,
          },
          keyInformation: ["Profits are up 10% compared to last quarter."],
        };

        resolve(result);
      }, 1500); // Simulate network delay
    })
    .then(result => {
      setAnalysisResult(result);
      return result;
    })
    .catch(err => {
      setError(String(err));
      return null;
    })
    .finally(() => {
      setIsLoading(false);
    });
  };


  useEffect(() => {
    if (docId) {
      fetchDocContent(docId)
        .then((content) => {
          if (content) {
            analyzeDocContent(content);
          }
        });
    }
  }, [docId]);

  const handleAnalyzeClick = async () => {
    if (docContent) {
      await analyzeDocContent(docContent);
    } else {
      setError("No document content to analyze. Please provide a document ID.");
    }
  };


  return (
    <div>
      <Typography variant="h6">Docs AI Assistant</Typography>

      <TextField
        label="Google Doc ID"
        variant="outlined"
        size="small"
        value={docId || ''}
        onChange={(e) => {
          //  Ideally you'd want to update a local state here and only update the parent
          //  state (docId) after debouncing or onBlur to avoid excessive re-renders
          // setDocId(e.target.value); //  This assumes docId is a state managed outside the component
        }}
        fullWidth
        margin="normal"
      />

      <StyledButton variant="contained" color="primary" onClick={() => {
        if(docId){
          fetchDocContent(docId)
          .then((content) => {
            if (content) {
              analyzeDocContent(content);
            }
          });
        } else {
          setError("Please provide a document ID.");
        }
      }}>
        Fetch and Analyze
      </StyledButton>

      {error && (
        <Typography color="error" variant="body2">
          Error: {error}
        </Typography>
      )}

      {isLoading && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </div>
      )}

      {analysisResult.summary && (
        <StyledPaper elevation={3}>
          <Typography variant="subtitle1">Summary:</Typography>
          <Typography variant="body1">{analysisResult.summary}</Typography>
        </StyledPaper>
      )}

      {analysisResult.financialData && (
        <StyledPaper elevation={3}>
          <Typography variant="subtitle1">Financial Data:</Typography>
          <Typography variant="body1">Income: ${analysisResult.financialData.income}</Typography>
          <Typography variant="body1">Expenses: ${analysisResult.financialData.expenses}</Typography>
          <Typography variant="body1">Profit: ${analysisResult.financialData.profit}</Typography>
        </StyledPaper>
      )}

      {analysisResult.keyInformation && analysisResult.keyInformation.length > 0 && (
        <StyledPaper elevation={3}>
          <Typography variant="subtitle1">Key Information:</Typography>
          <ul>
            {analysisResult.keyInformation.map((item, index) => (
              <li key={index}>
                <Typography variant="body1">{item}</Typography>
              </li>
            ))}
          </ul>
        </StyledPaper>
      )}
    </div>
  );
};

export default DocsAIAssistant;
```