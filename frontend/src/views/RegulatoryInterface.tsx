import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Mock API/Data Structures
interface Decision {
  id: string;
  model: string;
  timestamp: string;
  flaggedReason: string;
  currentStatus: 'PENDING_REVIEW' | 'APPROVED' | 'OVERRIDDEN';
  action: 'ALLOW' | 'DENY';
  userContext: string;
  overrideJustification: string;
}

// Mock Data - In a real app, this would come from an API call (e.g., using apis/regulatory/v1/decisions:list)
const mockDecisions: Decision[] = [
  {
    id: 'd1001',
    model: 'AdPolicyChecker-v2',
    timestamp: '2024-07-20T10:00:00Z',
    flaggedReason: 'Potential violation of Section 3.1 (Harmful Content)',
    currentStatus: 'PENDING_REVIEW',
    action: 'DENY',
    userContext: 'User ID: 4567, Region: EU',
    overrideJustification: '',
  },
  {
    id: 'd1002',
    model: 'LoanApprovalEngine-v3',
    timestamp: '2024-07-20T10:15:00Z',
    flaggedReason: 'High bias detected against demographic group X',
    currentStatus: 'PENDING_REVIEW',
    action: 'ALLOW',
    userContext: 'User ID: 9876, Credit Score: 720',
    overrideJustification: '',
  },
  {
    id: 'd1003',
    model: 'ContentModeration-v1',
    timestamp: '2024-07-19T15:30:00Z',
    flaggedReason: 'Misclassification of mature theme',
    currentStatus: 'APPROVED',
    action: 'ALLOW',
    userContext: 'User ID: 1122, Content ID: C998',
    overrideJustification: 'False positive confirmed by manual review on 2024-07-20.',
  },
];

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1),
}));

const StatusChip: React.FC<{ status: Decision['currentStatus'] }> = ({ status }) => {
  let color: 'default' | 'primary' | 'success' | 'error';
  switch (status) {
    case 'PENDING_REVIEW':
      color = 'primary';
      break;
    case 'APPROVED':
      color = 'success';
      break;
    case 'OVERRIDDEN':
      color = 'error';
      break;
    default:
      color = 'default';
  }
  return <Chip label={status.replace('_', ' ')} color={color} size="small" />;
};

const ActionChip: React.FC<{ action: Decision['action'] }> = ({ action }) => {
  const color = action === 'ALLOW' ? 'success' : 'error';
  return <Chip label={action} color={color} size="small" />;
};

const RegulatoryInterface: React.FC = () => {
  const [decisions, setDecisions] = useState<Decision[]>(mockDecisions);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [newAction, setNewAction] = useState<Decision['action']>('ALLOW');
  const [justification, setJustification] = useState<string>('');

  // Simulate fetching data on load
  useEffect(() => {
    // In a real scenario: fetchDecisions();
  }, []);

  const handleFetchDecisions = () => {
    setLoading(true);
    setTimeout(() => {
      setDecisions(mockDecisions); // Re-fetch mock data
      setLoading(false);
      showAlert('Decisions refreshed successfully.', 'success');
    }, 1000);
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ message, severity });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleStartEdit = (decision: Decision) => {
    setEditRowId(decision.id);
    setNewAction(decision.action);
    setJustification(decision.overrideJustification || '');
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setJustification('');
  };

  const handleSaveOverride = (decisionId: string) => {
    if (!justification.trim()) {
        showAlert('Justification cannot be empty for an override.', 'error');
        return;
    }

    setLoading(true);
    setTimeout(() => {
      setDecisions((prev) =>
        prev.map((d) =>
          d.id === decisionId
            ? {
                ...d,
                currentStatus: 'OVERRIDDEN',
                action: newAction,
                overrideJustification: justification,
              }
            : d
        )
      );
      setEditRowId(null);
      setJustification('');
      setLoading(false);
      showAlert(`Decision ${decisionId} overridden successfully.`, 'success');
    }, 1000);
  };

  const handleApproveAction = (decisionId: string) => {
    setLoading(true);
    setTimeout(() => {
        setDecisions((prev) =>
          prev.map((d) =>
            d.id === decisionId
              ? {
                  ...d,
                  currentStatus: 'APPROVED',
                  overrideJustification: d.overrideJustification || 'Approved by Ethics Officer without explicit override note.',
                }
              : d
          )
        );
        setLoading(false);
        showAlert(`Decision ${decisionId} approved.`, 'success');
    }, 1000);
  }


  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Decision Regulatory Override Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
        Review and manage AI-flagged decisions requiring Ethics Officer intervention.
      </Typography>

      {alert && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleFetchDecisions} disabled={loading}>
          Refresh Decisions
        </Button>
      </Box>

      {loading && <Alert severity="info">Loading/Processing...</Alert>}

      <TableContainer component={Paper} sx={{ border: `1px solid #ccc` }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <StyledTableCell>ID</StyledTableCell>
              <StyledTableCell>Model</StyledTableCell>
              <StyledTableCell>Flagged Reason</StyledTableCell>
              <StyledTableCell>Proposed Action</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell>Context</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {decisions.length === 0 ? (
                <TableRow>
                    <StyledTableCell colSpan={7} align="center">
                        No pending decisions requiring immediate review.
                    </StyledTableCell>
                </TableRow>
            ) : (
                decisions.map((decision) => (
                <TableRow key={decision.id} hover>
                  <StyledTableCell>{decision.id}</StyledTableCell>
                  <StyledTableCell>{decision.model}</StyledTableCell>
                  <StyledTableCell>{decision.flaggedReason}</StyledTableCell>
                  <StyledTableCell><ActionChip action={decision.action} /></StyledTableCell>
                  <StyledTableCell><StatusChip status={decision.currentStatus} /></StyledTableCell>
                  <StyledTableCell>{decision.userContext}</StyledTableCell>
                  <StyledTableCell>
                    {decision.currentStatus === 'PENDING_REVIEW' ? (
                      <>
                        {editRowId === decision.id ? (
                          <>
                            <Button
                              size="small"
                              color="primary"
                              onClick={() => handleSaveOverride(decision.id)}
                              disabled={loading}
                              sx={{ mr: 1 }}
                            >
                              Save Override
                            </Button>
                            <Button size="small" color="secondary" onClick={handleCancelEdit} disabled={loading}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleApproveAction(decision.id)}
                              disabled={loading || decision.currentStatus !== 'PENDING_REVIEW'}
                              sx={{ mr: 1 }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleStartEdit(decision)}
                              disabled={loading || decision.currentStatus !== 'PENDING_REVIEW'}
                            >
                              Override
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <Typography variant="caption">
                        {decision.currentStatus === 'OVERRIDDEN' ? 'Overridden' : 'Final'}
                        <br />
                        <Button size="small" onClick={() => alert(`Viewing justification for ${decision.id}`)}>
                            View Note
                        </Button>
                      </Typography>
                    )}
                  </StyledTableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {editRowId && (
        <OverrideForm
          decisionId={editRowId}
          initialAction={newAction}
          initialJustification={justification}
          setNewAction={setNewAction}
          setJustification={setJustification}
          loading={loading}
          onSave={handleSaveOverride}
          onCancel={handleCancelEdit}
        />
      )}
    </Box>
  );
};


interface OverrideFormProps {
    decisionId: string;
    initialAction: Decision['action'];
    initialJustification: string;
    setNewAction: React.Dispatch<React.SetStateAction<Decision['action']>>;
    setJustification: React.Dispatch<React.SetStateAction<string>>;
    loading: boolean;
    onSave: (id: string) => void;
    onCancel: () => void;
}

const OverrideForm: React.FC<OverrideFormProps> = ({
    decisionId,
    initialAction,
    initialJustification,
    setNewAction,
    setJustification,
    loading,
    onSave,
    onCancel,
}) => {
    const decisionToEdit = mockDecisions.find(d => d.id === decisionId);

    if (!decisionToEdit) return null;

    return (
        <Paper elevation={3} sx={{ mt: 3, p: 3, border: '2px solid #d32f2f' }}>
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                Override Decision: {decisionId} (Currently proposing action: {initialAction})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                
                <FormControl fullWidth>
                    <InputLabel id="action-select-label">New Final Action</InputLabel>
                    <Select
                        labelId="action-select-label"
                        value={initialAction}
                        onChange={(e) => setNewAction(e.target.value as Decision['action'])}
                        disabled={loading}
                    >
                        <MenuItem value="ALLOW">ALLOW (Override Deny)</MenuItem>
                        <MenuItem value="DENY">DENY (Override Allow)</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel htmlFor="justification-input">Override Justification (Required)</InputLabel>
                    <StyledTextArea
                        id="justification-input"
                        value={initialJustification}
                        onChange={(e) => setJustification(e.target.value)}
                        minRows={3}
                        placeholder={`Mandatory reason for overriding the AI decision for ${decisionId}`}
                        disabled={loading}
                    />
                </FormControl>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button variant="outlined" color="secondary" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="error" onClick={() => onSave(decisionId)} disabled={loading || initialJustification.trim().length < 10}>
                        Confirm Override & Save
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

// Custom styled component for textarea appearance
const StyledTextArea = styled('textarea')(({ theme }) => ({
    width: '100%',
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.grey[400]}`,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.body1.fontSize,
    '&:disabled': {
        backgroundColor: theme.palette.grey[100],
        color: theme.palette.text.disabled,
    }
}));

export default RegulatoryInterface;