```typescript
import React, { useState, useEffect } from 'react';
import {
  ListSecretsRequest,
  Secret,
  SecretManagerServiceClient,
  CreateSecretRequest,
  AccessSecretVersionRequest,
  SecretVersion,
} from '@google-cloud/secret-manager';
import { v1 } from '@google-cloud/secret-manager';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material';

interface SecretManagerDashboardProps {
  projectId: string;
}

const SecretManagerDashboard: React.FC<SecretManagerDashboardProps> = ({ projectId }) => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [newSecretName, setNewSecretName] = useState('');
  const [newSecretPayload, setNewSecretPayload] = useState('');
  const [createSecretDialogOpen, setCreateSecretDialogOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [secretValue, setSecretValue] = useState('');
  const [accessSecretDialogOpen, setAccessSecretDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('success');

  const client = new SecretManagerServiceClient();

  useEffect(() => {
    fetchSecrets();
  }, [projectId]);

  const fetchSecrets = async () => {
    if (!projectId) return;
    try {
      const request: ListSecretsRequest = {
        parent: `projects/${projectId}`,
      };
      const [response] = await client.listSecrets(request);
      if (response.secrets) {
        setSecrets(response.secrets);
      }
    } catch (error: any) {
      console.error('Error fetching secrets:', error);
      showSnackbar('error', `Error fetching secrets: ${error.message}`);
    }
  };


  const handleCreateSecret = async () => {
    if (!projectId || !newSecretName || !newSecretPayload) {
      showSnackbar('warning', 'Please fill in all fields.');
      return;
    }

    try {
      const request: CreateSecretRequest = {
        parent: `projects/${projectId}`,
        secretId: newSecretName,
        secret: {
          replication: {
            automatic: {},
          },
        },
      };

      const [secretResponse] = await client.createSecret(request);
      const secretName = secretResponse.name;

        const addVersionRequest = {
            parent: secretName,
            payload: {
                data: Buffer.from(newSecretPayload, 'utf8'),
            },
        };
        const [versionResponse] = await client.addSecretVersion(addVersionRequest);

      showSnackbar('success', 'Secret created successfully!');
      setCreateSecretDialogOpen(false);
      setNewSecretName('');
      setNewSecretPayload('');
      fetchSecrets();
    } catch (error: any) {
      console.error('Error creating secret:', error);
      showSnackbar('error', `Error creating secret: ${error.message}`);
    }
  };


  const handleAccessSecret = async (secret: Secret) => {
    if (!secret.name) {
      console.error("Secret name is missing.");
      return;
    }

    try {
        const request: AccessSecretVersionRequest = {
            name: `${secret.name}/versions/latest`,
        };
        const [response] = await client.accessSecretVersion(request);
        if (response.payload?.data) {
          const decodedValue = Buffer.from(response.payload.data).toString('utf8');
          setSecretValue(decodedValue);
          setSelectedSecret(secret);
          setAccessSecretDialogOpen(true);
        } else {
          showSnackbar('warning', 'Secret has no value.');
        }

    } catch (error: any) {
      console.error('Error accessing secret:', error);
      showSnackbar('error', `Error accessing secret: ${error.message}`);
    }
  };

  const handleOpenCreateSecretDialog = () => {
    setCreateSecretDialogOpen(true);
  };

  const handleCloseCreateSecretDialog = () => {
    setCreateSecretDialogOpen(false);
    setNewSecretName('');
    setNewSecretPayload('');
  };

  const handleCloseAccessSecretDialog = () => {
    setAccessSecretDialogOpen(false);
    setSelectedSecret(null);
    setSecretValue('');
  };


  const showSnackbar = (severity: 'success' | 'info' | 'warning' | 'error', message: string) => {
    setSnackbarSeverity(severity);
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <div>
      <h2>Secret Manager Dashboard</h2>
      <Button variant="contained" color="primary" onClick={handleOpenCreateSecretDialog}>
        Create Secret
      </Button>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Secret Name</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {secrets.map((secret) => (
              <TableRow key={secret.name}>
                <TableCell component="th" scope="row">
                  {secret.name ? secret.name.split('/').pop() : 'N/A'}
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleAccessSecret(secret)}
                  >
                    View Value
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={createSecretDialogOpen} onClose={handleCloseCreateSecretDialog}>
        <DialogTitle>Create Secret</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Secret Name"
            type="text"
            fullWidth
            value={newSecretName}
            onChange={(e) => setNewSecretName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Secret Payload"
            type="password"
            fullWidth
            value={newSecretPayload}
            onChange={(e) => setNewSecretPayload(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateSecretDialog}>Cancel</Button>
          <Button onClick={handleCreateSecret}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={accessSecretDialogOpen} onClose={handleCloseAccessSecretDialog}>
          <DialogTitle>Secret Value</DialogTitle>
          <DialogContent>
              {secretValue ? (
                  <TextField
                      label="Secret Value"
                      multiline
                      rows={4}
                      fullWidth
                      value={secretValue}
                      InputProps={{
                          readOnly: true,
                      }}
                  />
              ) : (
                  <p>Loading...</p>
              )}
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseAccessSecretDialog}>Close</Button>
          </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SecretManagerDashboard;
```