import React from 'react';
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper } from '@mui/material';

interface ComplianceIssue {
  issueType: string;
  description: string;
  location?: string; // e.g., "Page 1, Frame X"
  severity: 'High' | 'Medium' | 'Low';
}

interface ComplianceReportProps {
  issues: ComplianceIssue[];
}

const ComplianceReport: React.FC<ComplianceReportProps> = ({ issues }) => {
  const groupedIssues = React.useMemo(() => {
    const grouped: { [key: string]: ComplianceIssue[] } = {};
    issues.forEach(issue => {
      if (!grouped[issue.severity]) {
        grouped[issue.severity] = [];
      }
      grouped[issue.severity].push(issue);
    });
    return grouped;
  }, [issues]);

  const severityOrder: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];


  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" gutterBottom>
        Compliance Audit Results
      </Typography>

      {severityOrder.map(severity => {
        if (!groupedIssues[severity]) {
          return null;
        }

        return (
          <Box key={severity} sx={{ marginBottom: 3 }}>
            <Typography variant="h6" sx={{ marginTop: 2, marginBottom: 1 }}>
              {severity} Severity Issues
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Issue Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupedIssues[severity].map((issue, index) => (
                    <TableRow key={index}>
                      <TableCell>{issue.issueType}</TableCell>
                      <TableCell>{issue.description}</TableCell>
                      <TableCell>{issue.location || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      })}


      {Object.keys(groupedIssues).length === 0 && (
        <Typography variant="body1">
          No compliance issues found.
        </Typography>
      )}
    </Box>
  );
};

export default ComplianceReport;