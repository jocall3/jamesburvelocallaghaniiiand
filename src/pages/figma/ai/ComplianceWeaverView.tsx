```tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  getFile,
  getFileNodes,
  getFileMeta,
  getTeamProjects,
  getProjectFiles,
} from '../../../api/figmaApi'; // Adjust the path as needed
import {
  ComplianceCheckResults,
  runComplianceChecks,
} from '../../../utils/complianceChecker'; // Adjust the path as needed
import {
  FileResponse,
  GetFileNodesResponse,
  GetFileMetaResponse,
  Project,
  File,
  Node,
  DocumentNode,
} from '../../../types/figma'; // Adjust the path as needed
import { Box, Typography, CircularProgress, Button, Grid, Paper } from '@mui/material';
import { styled } from '@mui/system';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const ComplianceWeaverView = () => {
  const { fileKey } = useParams<{ fileKey: string }>();
  const [fileData, setFileData] = useState<FileResponse | null>(null);
  const [fileNodes, setFileNodes] = useState<GetFileNodesResponse | null>(null);
  const [fileMetadata, setFileMetadata] = useState<GetFileMetaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [complianceResults, setComplianceResults] = useState<ComplianceCheckResults | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);


  useEffect(() => {
    const fetchData = async () => {
      if (!fileKey) {
        setError("No file key provided.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch file data
        const fileResponse = await getFile(fileKey, { depth: 1 });
        setFileData(fileResponse);

        // Fetch file metadata
        const metaResponse = await getFileMeta(fileKey);
        setFileMetadata(metaResponse);

        if (fileResponse && fileResponse.document) {
          // Fetch specific nodes (e.g., pages)
          const nodeIds = fileResponse.document.children.map(child => child.id).join(',');
          const nodesResponse = await getFileNodes(fileKey, { ids: nodeIds });
          setFileNodes(nodesResponse);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch file data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fileKey]);

  const handleRunChecks = async () => {
    if (fileData && fileData.document) {
      setIsChecking(true);
      setError(null);
      try {
        const results = await runComplianceChecks(fileData.document); // Pass the document
        setComplianceResults(results);
      } catch (err: any) {
        setError(err.message || "Failed to run compliance checks.");
      } finally {
        setIsChecking(false);
      }
    } else {
      setError("File data not available to run checks.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Compliance Weaver - {fileMetadata?.name || 'File'}
      </Typography>

      <Button
        variant="contained"
        onClick={handleRunChecks}
        disabled={isChecking}
        sx={{ marginBottom: 2 }}
      >
        {isChecking ? <CircularProgress size={24} /> : 'Run Compliance Checks'}
      </Button>


      {complianceResults && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Compliance Check Results
          </Typography>

          <Grid container spacing={2}>
            {Object.entries(complianceResults).map(([checkType, results]) => (
              <Grid item xs={12} md={6} key={checkType}>
                <StyledPaper>
                  <Typography variant="h6" gutterBottom>
                    {checkType}
                  </Typography>
                  {results.length > 0 ? (
                    results.map((result, index) => (
                      <Typography key={index} variant="body2" color={result.isCompliant ? "success.main" : "error.main"}>
                        {result.message}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2">No issues found.</Typography>
                  )}
                </StyledPaper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ComplianceWeaverView;
```