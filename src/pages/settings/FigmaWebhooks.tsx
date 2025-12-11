```typescript
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

import {
  GetWebhooksResponse,
  PostWebhookResponse,
  PutWebhookResponse,
  WebhookV2,
  WebhookV2Event,
  WebhookV2Status,
} from '../../types/figma'; // Adjust path as necessary
import { useFigmaAPI } from '../../hooks/useFigmaAPI'; // Adjust path as necessary

const FigmaWebhooks: React.FC = () => {
  const { getWebhooks, postWebhook, putWebhook, deleteWebhook } = useFigmaAPI();
  const [webhooks, setWebhooks] = useState<WebhookV2[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookV2 | null>(null);

  const [newWebhookData, setNewWebhookData] = useState<{
    context: string;
    context_id: string;
    event_type: WebhookV2Event;
    endpoint: string;
    passcode: string;
    status: WebhookV2Status;
    description: string;
  }>({
    context: '',
    context_id: '',
    event_type: 'FILE_UPDATE',
    endpoint: '',
    passcode: '',
    status: 'ACTIVE',
    description: '',
  });

  const fetchWebhooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: GetWebhooksResponse | null = await getWebhooks();
      if (response && response.webhooks) {
        setWebhooks(response.webhooks);
      } else {
        setError('Failed to fetch webhooks or no webhooks found.');
        setWebhooks([]);
      }
    } catch (err: any) {
      setError(`Error fetching webhooks: ${err.message}`);
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [getWebhooks]);

  const handleCreateWebhook = async () => {
    try {
      const response: PostWebhookResponse | null = await postWebhook(
        newWebhookData.event_type,
        newWebhookData.context,
        newWebhookData.context_id,
        newWebhookData.endpoint,
        newWebhookData.passcode,
        newWebhookData.status,
        newWebhookData.description
      );

      if (response) {
        setWebhooks([...webhooks, response]);
        setOpenCreateDialog(false);
        setNewWebhookData({
            context: '',
            context_id: '',
            event_type: 'FILE_UPDATE',
            endpoint: '',
            passcode: '',
            status: 'ACTIVE',
            description: '',
          });
      } else {
        setError('Failed to create webhook.');
      }
    } catch (err: any) {
      setError(`Error creating webhook: ${err.message}`);
    }
  };

  const handleUpdateWebhook = async () => {
    if (!selectedWebhook) return;

    try {
      const response: PutWebhookResponse | null = await putWebhook(
        selectedWebhook.id,
        selectedWebhook.event_type,
        selectedWebhook.endpoint,
        selectedWebhook.passcode,
        selectedWebhook.status,
        selectedWebhook.description
      );

      if (response) {
        setWebhooks(
          webhooks.map((webhook) => (webhook.id === response.id ? response : webhook))
        );
        setOpenEditDialog(false);
        setSelectedWebhook(null);
      } else {
        setError('Failed to update webhook.');
      }
    } catch (err: any) {
      setError(`Error updating webhook: ${err.message}`);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      const success = await deleteWebhook(webhookId);
      if (success) {
        setWebhooks(webhooks.filter((webhook) => webhook.id !== webhookId));
      } else {
        setError('Failed to delete webhook.');
      }
    } catch (err: any) {
      setError(`Error deleting webhook: ${err.message}`);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="200px"><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Figma Webhooks Management
      </Typography>
      <Button variant="contained" color="primary" onClick={() => setOpenCreateDialog(true)}>
        Create New Webhook
      </Button>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table aria-label="webhooks table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell>Context</TableCell>
              <TableCell>Context ID</TableCell>
              <TableCell>Endpoint</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {webhooks.map((webhook) => (
              <TableRow key={webhook.id}>
                <TableCell>{webhook.id}</TableCell>
                <TableCell>{webhook.event_type}</TableCell>
                <TableCell>{webhook.context}</TableCell>
                <TableCell>{webhook.context_id}</TableCell>
                <TableCell>{webhook.endpoint}</TableCell>
                <TableCell>{webhook.status}</TableCell>
                <TableCell>{webhook.description}</TableCell>
                <TableCell>
                  <Button onClick={() => {
                      setSelectedWebhook(webhook);
                      setOpenEditDialog(true);
                    }}>
                    <EditIcon />
                  </Button>
                  <Button onClick={() => handleDeleteWebhook(webhook.id)}>
                    <DeleteIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Webhook Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Create New Webhook</DialogTitle>
        <DialogContent>
          <TextField
            label="Context"
            value={newWebhookData.context}
            onChange={(e) => setNewWebhookData({ ...newWebhookData, context: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Context ID"
            value={newWebhookData.context_id}
            onChange={(e) => setNewWebhookData({ ...newWebhookData, context_id: e.target.value })}
            fullWidth
            margin="dense"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="event-type-label">Event Type</InputLabel>
            <Select
              labelId="event-type-label"
              value={newWebhookData.event_type}
              label="Event Type"
              onChange={(e) =>
                setNewWebhookData({ ...newWebhookData, event_type: e.target.value as WebhookV2Event })
              }
            >
              <MenuItem value="PING">PING</MenuItem>
              <MenuItem value="FILE_UPDATE">FILE_UPDATE</MenuItem>
              <MenuItem value="FILE_VERSION_UPDATE">FILE_VERSION_UPDATE</MenuItem>
              <MenuItem value="FILE_DELETE">FILE_DELETE</MenuItem>
              <MenuItem value="LIBRARY_PUBLISH">LIBRARY_PUBLISH</MenuItem>
              <MenuItem value="FILE_COMMENT">FILE_COMMENT</MenuItem>
              <MenuItem value="DEV_MODE_STATUS_UPDATE">DEV_MODE_STATUS_UPDATE</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Endpoint"
            value={newWebhookData.endpoint}
            onChange={(e) => setNewWebhookData({ ...newWebhookData, endpoint: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Passcode"
            value={newWebhookData.passcode}
            onChange={(e) => setNewWebhookData({ ...newWebhookData, passcode: e.target.value })}
            fullWidth
            margin="dense"
          />
           <FormControl fullWidth margin="dense">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              value={newWebhookData.status}
              label="Status"
              onChange={(e) =>
                setNewWebhookData({ ...newWebhookData, status: e.target.value as WebhookV2Status })
              }
            >
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="PAUSED">PAUSED</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Description"
            value={newWebhookData.description}
            onChange={(e) => setNewWebhookData({ ...newWebhookData, description: e.target.value })}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateWebhook} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Webhook Dialog */}
      <Dialog open={openEditDialog && selectedWebhook !== null} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Webhook</DialogTitle>
        <DialogContent>
        {selectedWebhook && (
          <>
             <TextField
                label="ID"
                value={selectedWebhook.id}
                fullWidth
                margin="dense"
                disabled
              />
            <FormControl fullWidth margin="dense">
                <InputLabel id="event-type-label">Event Type</InputLabel>
                <Select
                  labelId="event-type-label"
                  value={selectedWebhook.event_type}
                  label="Event Type"
                  onChange={(e) =>
                    setSelectedWebhook({ ...selectedWebhook, event_type: e.target.value as WebhookV2Event })
                  }
                >
                  <MenuItem value="PING">PING</MenuItem>
                  <MenuItem value="FILE_UPDATE">FILE_UPDATE</MenuItem>
                  <MenuItem value="FILE_VERSION_UPDATE">FILE_VERSION_UPDATE</MenuItem>
                  <MenuItem value="FILE_DELETE">FILE_DELETE</MenuItem>
                  <MenuItem value="LIBRARY_PUBLISH">LIBRARY_PUBLISH</MenuItem>
                  <MenuItem value="FILE_COMMENT">FILE_COMMENT</MenuItem>
                  <MenuItem value="DEV_MODE_STATUS_UPDATE">DEV_MODE_STATUS_UPDATE</MenuItem>
                </Select>
              </FormControl>
            <TextField
              label="Endpoint"
              value={selectedWebhook.endpoint}
              onChange={(e) =>
                setSelectedWebhook({ ...selectedWebhook, endpoint: e.target.value })
              }
              fullWidth
              margin="dense"
            />
            <TextField
              label="Passcode"
              value={selectedWebhook.passcode}
              onChange={(e) =>
                setSelectedWebhook({ ...selectedWebhook, passcode: e.target.value })
              }
              fullWidth
              margin="dense"
            />
               <FormControl fullWidth margin="dense">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={selectedWebhook.status}
                  label="Status"
                  onChange={(e) =>
                    setSelectedWebhook({ ...selectedWebhook, status: e.target.value as WebhookV2Status })
                  }
                >
                  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                  <MenuItem value="PAUSED">PAUSED</MenuItem>
                </Select>
              </FormControl>
            <TextField
              label="Description"
              value={selectedWebhook.description || ''}
              onChange={(e) =>
                setSelectedWebhook({ ...selectedWebhook, description: e.target.value })
              }
              fullWidth
              margin="dense"
            />
            </>
             )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateWebhook} color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FigmaWebhooks;
```