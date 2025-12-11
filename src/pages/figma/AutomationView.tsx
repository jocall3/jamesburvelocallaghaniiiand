```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTeamProjects,
  getProjectFiles,
  getWebhooks,
  postWebhook,
  putWebhook,
  deleteWebhook,
} from '../../api/figmaApi'; // Assuming you have a figmaApi.ts
import { useAuth } from '../../components/AuthProvider';
import {
  Project,
  File,
  WebhookV2,
  WebhookV2Event,
  WebhookV2Status,
} from '../../types/figma'; // Assuming you have a figma types file
import {
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';

const AutomationView: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // State for fetching data
  const [teamId, setTeamId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookV2[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for webhook form
  const [webhookEventType, setWebhookEventType] =
    useState<WebhookV2Event>('FILE_UPDATE');
  const [webhookContext, setWebhookContext] = useState<'team' | 'project' | 'file'>(
    'file'
  );
  const [webhookContextId, setWebhookContextId] = useState<string>('');
  const [webhookEndpoint, setWebhookEndpoint] = useState<string>('');
  const [webhookPasscode, setWebhookPasscode] = useState<string>('');
  const [webhookDescription, setWebhookDescription] = useState<string>('');

  // State for edit/delete operations
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);
  const [deletingWebhookId, setDeletingWebhookId] = useState<string | null>(
    null
  );
  const [editWebhookEndpoint, setEditWebhookEndpoint] =
    useState<string>('');
  const [editWebhookPasscode, setEditWebhookPasscode] = useState<string>('');
  const [editWebhookDescription, setEditWebhookDescription] =
    useState<string>('');
  const [editWebhookEventType, setEditWebhookEventType] =
    useState<WebhookV2Event>('FILE_UPDATE');

  // Dialog state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // Helper function to show alert
  const handleShowAlert = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
    }, 3000); // Hide alert after 3 seconds
  };

  // Helper functions for form control changes
  const handleWebhookContextChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setWebhookContext(event.target.value as 'team' | 'project' | 'file');
  };

  const handleWebhookContextIdChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWebhookContextId(event.target.value);
  };

  const handleWebhookEventTypeChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setWebhookEventType(event.target.value as WebhookV2Event);
  };

  const handleWebhookEndpointChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWebhookEndpoint(event.target.value);
  };

  const handleWebhookPasscodeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWebhookPasscode(event.target.value);
  };

  const handleWebhookDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWebhookDescription(event.target.value);
  };

  // Edit Webhook Handlers
  const handleEditWebhookEndpointChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditWebhookEndpoint(event.target.value);
  };

  const handleEditWebhookPasscodeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditWebhookPasscode(event.target.value);
  };

  const handleEditWebhookDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditWebhookDescription(event.target.value);
  };

  const handleEditWebhookEventTypeChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setEditWebhookEventType(event.target.value as WebhookV2Event);
  };

  // Fetch team projects (assuming this is how you start)
  useEffect(() => {
    if (!token || !user?.team_id) {
      return;
    }
    setTeamId(user.team_id);
    setLoading(true);
    setError(null);

    getTeamProjects(token, user.team_id)
      .then((data) => {
        setProjects(data.projects);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch projects');
      })
      .finally(() => setLoading(false));
  }, [token, user?.team_id]);

  // Fetch files based on project selection
  useEffect(() => {
    if (!token || !selectedProjectId) {
      setFiles([]);
      return;
    }
    setLoading(true);
    setError(null);
    setFiles([]);

    getProjectFiles(token, selectedProjectId)
      .then((data) => {
        setFiles(data.files);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch files');
      })
      .finally(() => setLoading(false));
  }, [token, selectedProjectId]);

  // Fetch webhooks, using a combination of context and contextId
  useEffect(() => {
    if (!token || !webhookContextId) {
      setWebhooks([]);
      return;
    }
    setLoading(true);
    setError(null);

    const fetchWebhooks = async () => {
      try {
        let data;
        if (webhookContext === 'team') {
          data = await getWebhooks(token, {
            context: 'team',
            context_id: webhookContextId,
          });
        } else if (webhookContext === 'project') {
          data = await getWebhooks(token, {
            context: 'project',
            context_id: webhookContextId,
          });
        } else if (webhookContext === 'file') {
          data = await getWebhooks(token, {
            context: 'file',
            context_id: webhookContextId,
          });
        } else {
          console.warn('Invalid webhook context'); // Or handle this case as needed
          return;
        }

        setWebhooks(data.webhooks);
      } catch (err) {
        setError(err.message || 'Failed to fetch webhooks');
      } finally {
        setLoading(false);
      }
    };

    fetchWebhooks();
  }, [token, webhookContext, webhookContextId]);

  // Handle the creation of a new webhook
  const handleCreateWebhook = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const newWebhook = await postWebhook(token, {
        event_type: webhookEventType,
        context: webhookContext,
        context_id: webhookContextId,
        endpoint: webhookEndpoint,
        passcode: webhookPasscode,
        description: webhookDescription,
        status: 'ACTIVE',
      });

      if (newWebhook) {
        setWebhooks([...webhooks, newWebhook]); // Optimistically update UI
        handleShowAlert('Webhook created successfully!', 'success');
      } else {
        handleShowAlert('Failed to create webhook.', 'error');
      }

      // Clear form
      setWebhookEventType('FILE_UPDATE');
      setWebhookEndpoint('');
      setWebhookPasscode('');
      setWebhookDescription('');
    } catch (err: any) {
      handleShowAlert(err.message || 'Failed to create webhook.', 'error');
      setError(err.message || 'Failed to create webhook');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening edit dialog
  const handleOpenEditDialog = (webhookId: string) => {
    const webhookToEdit = webhooks.find((webhook) => webhook.id === webhookId);
    if (webhookToEdit) {
      setEditingWebhookId(webhookId);
      setEditWebhookEndpoint(webhookToEdit.endpoint);
      setEditWebhookPasscode(webhookToEdit.passcode);
      setEditWebhookDescription(webhookToEdit.description || "");
      setEditWebhookEventType(webhookToEdit.event_type);
      setOpenEditDialog(true);
    }
  };

  // Handle closing edit dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingWebhookId(null);
  };

  const handleConfirmEditWebhook = async () => {
    if (!token || !editingWebhookId) return;
    setLoading(true);
    setError(null);

    try {
      const updatedWebhook = await putWebhook(token, editingWebhookId, {
        event_type: editWebhookEventType,
        endpoint: editWebhookEndpoint,
        passcode: editWebhookPasscode,
        description: editWebhookDescription,
      });

      if (updatedWebhook) {
        setWebhooks(
          webhooks.map((webhook) =>
            webhook.id === editingWebhookId ? updatedWebhook : webhook
          )
        );
        handleShowAlert('Webhook updated successfully!', 'success');
      } else {
        handleShowAlert('Failed to update webhook.', 'error');
      }
      handleCloseEditDialog();
    } catch (err: any) {
      handleShowAlert(err.message || 'Failed to update webhook', 'error');
      setError(err.message || 'Failed to update webhook');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening delete dialog
  const handleOpenDeleteDialog = (webhookId: string) => {
    setDeletingWebhookId(webhookId);
    setOpenDeleteDialog(true);
  };

  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    setDeletingWebhookId(null);
    setOpenDeleteDialog(false);
  };

  // Handle confirming webhook deletion
  const handleConfirmDeleteWebhook = async () => {
    if (!token || !deletingWebhookId) return;
    setLoading(true);
    setError(null);

    try {
      await deleteWebhook(token, deletingWebhookId);
      setWebhooks(webhooks.filter((webhook) => webhook.id !== deletingWebhookId));
      handleShowAlert('Webhook deleted successfully!', 'success');
    } catch (err: any) {
      handleShowAlert(err.message || 'Failed to delete webhook', 'error');
      setError(err.message || 'Failed to delete webhook');
    } finally {
      handleCloseDeleteDialog();
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Typography variant="h6" align="center">
        Please log in to view Automations.
      </Typography>
    );
  }

  return (
    <div>
      {showAlert && (
        <Alert severity={alertSeverity} sx={{ marginBottom: 2 }}>
          {alertMessage}
        </Alert>
      )}
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        Automation Workflows
      </Typography>

      {loading && <Typography>Loading...</Typography>}
      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth sx={{ marginBottom: 2 }}>
        <InputLabel id="project-select-label">Select a project</InputLabel>
        <Select
          labelId="project-select-label"
          id="project-select"
          value={selectedProjectId}
          label="Select a project"
          onChange={(e) => setSelectedProjectId(e.target.value as string)}
          disabled={loading || !projects?.length}
        >
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedProjectId && (
        <Typography variant="h6" sx={{ marginBottom: 1 }}>
          Files in Project
        </Typography>
      )}
      {selectedProjectId && files.length === 0 && !loading && (
        <Typography>No files found in this project.</Typography>
      )}
      {selectedProjectId && files.length > 0 && (
        <TableContainer component={Paper} sx={{ marginBottom: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell>File Key</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.key}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>{file.key}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Webhook Creation Form */}
      <Typography variant="h6" sx={{ marginBottom: 1 }}>
        Create Webhook
      </Typography>

      <FormControl fullWidth sx={{ marginBottom: 2 }}>
        <InputLabel id="context-select-label">Webhook Context</InputLabel>
        <Select
          labelId="context-select-label"
          id="context-select"
          value={webhookContext}
          label="Webhook Context"
          onChange={handleWebhookContextChange}
          disabled={loading}
        >
          <MenuItem value="file">File</MenuItem>
          <MenuItem value="project">Project</MenuItem>
          {/*<MenuItem value="team">Team</MenuItem>  Temporarily disabled*/}
        </Select>
      </FormControl>

      {webhookContext && (
          <TextField
            fullWidth
            label={`${webhookContext.charAt(0).toUpperCase() + webhookContext.slice(1)} ID`}
            value={webhookContextId}
            onChange={handleWebhookContextIdChange}
            sx={{ marginBottom: 2 }}
            disabled={loading}
          />
      )}

      <FormControl fullWidth sx={{ marginBottom: 2 }}>
        <InputLabel id="event-type-select-label">Event Type</InputLabel>
        <Select
          labelId="event-type-select-label"
          id="event-type-select"
          value={webhookEventType}
          label="Event Type"
          onChange={handleWebhookEventTypeChange}
          disabled={loading}
        >
          <MenuItem value="FILE_UPDATE">File Update</MenuItem>
          <MenuItem value="FILE_VERSION_UPDATE">File Version Update</MenuItem>
          <MenuItem value="FILE_DELETE">File Delete</MenuItem>
          <MenuItem value="LIBRARY_PUBLISH">Library Publish</MenuItem>
          <MenuItem value="FILE_COMMENT">File Comment</MenuItem>
          <MenuItem value="DEV_MODE_STATUS_UPDATE">
            Dev Mode Status Update
          </MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Endpoint URL"
        value={webhookEndpoint}
        onChange={handleWebhookEndpointChange}
        sx={{ marginBottom: 2 }}
        disabled={loading}
      />
      <TextField
        fullWidth
        label="Passcode"
        value={webhookPasscode}
        onChange={handleWebhookPasscodeChange}
        sx={{ marginBottom: 2 }}
        disabled={loading}
      />
      <TextField
        fullWidth
        label="Description"
        value={webhookDescription}
        onChange={handleWebhookDescriptionChange}
        sx={{ marginBottom: 2 }}
        disabled={loading}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={handleCreateWebhook}
        disabled={loading || !webhookContextId || !webhookEndpoint || !webhookPasscode}
        sx={{ marginBottom: 2 }}
      >
        Create Webhook
      </Button>

      {/* Webhook List */}
      <Typography variant="h6" sx={{ marginBottom: 1 }}>
        Webhooks
      </Typography>

      {webhooks.length === 0 && !loading && (
        <Typography>No webhooks found.</Typography>
      )}

      {webhooks.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event Type</TableCell>
                <TableCell>Context</TableCell>
                <TableCell>Context ID</TableCell>
                <TableCell>Endpoint</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell>{webhook.event_type}</TableCell>
                  <TableCell>{webhook.context}</TableCell>
                  <TableCell>{webhook.context_id}</TableCell>
                  <TableCell>{webhook.endpoint}</TableCell>
                  <TableCell>{webhook.description || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="edit"
                      onClick={() => handleOpenEditDialog(webhook.id)}
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      aria-label="delete"
                      onClick={() => handleOpenDeleteDialog(webhook.id)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Webhook Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Webhook</DialogTitle>
        <DialogContent>
            <FormControl fullWidth sx={{ marginBottom: 2 }}>
              <InputLabel id="edit-event-type-select-label">Event Type</InputLabel>
              <Select
                labelId="edit-event-type-select-label"
                id="edit-event-type-select"
                value={editWebhookEventType}
                label="Event Type"
                onChange={handleEditWebhookEventTypeChange}
              >
                <MenuItem value="FILE_UPDATE">File Update</MenuItem>
                <MenuItem value="FILE_VERSION_UPDATE">File Version Update</MenuItem>
                <MenuItem value="FILE_DELETE">File Delete</MenuItem>
                <MenuItem value="LIBRARY_PUBLISH">Library Publish</MenuItem>
                <MenuItem value="FILE_COMMENT">File Comment</MenuItem>
                <MenuItem value="DEV_MODE_STATUS_UPDATE">
                  Dev Mode Status Update
                </MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Endpoint URL"
              value={editWebhookEndpoint}
              onChange={handleEditWebhookEndpointChange}
              sx={{ marginBottom: 2 }}
            />
            <TextField
              fullWidth
              label="Passcode"
              value={editWebhookPasscode}
              onChange={handleEditWebhookPasscodeChange}
              sx={{ marginBottom: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={editWebhookDescription}
              onChange={handleEditWebhookDescriptionChange}
              sx={{ marginBottom: 2 }}
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmEditWebhook} color="primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Webhook Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Webhook</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this webhook? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDeleteWebhook} color="secondary" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AutomationView;
```