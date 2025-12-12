import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, deleteUser } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const SettingsPage = () => {
  const { currentUser, updateEmail: updateAuthEmail } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // Example setting
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Example setting
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (currentUser) {
        if (displayName !== currentUser.displayName) {
          await updateProfile(currentUser, { displayName });
        }

        if (email !== currentUser.email) {
          await updateAuthEmail(email);
        }

        if (newPassword && newPassword === confirmPassword) {
          // Implement password update logic here (requires re-authentication)
          // For simplicity, we'll just show a message
          setError('Password update not yet implemented. Requires re-authentication.');
        } else if (newPassword && newPassword !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        setSuccess('Profile updated successfully!');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmationOpen(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleteConfirmationOpen(false);
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (currentUser) {
        await deleteUser(currentUser);
        // User is automatically signed out after deletion
        navigate('/login'); // Redirect to login page
      }
    } catch (e: any) {
      setError(e.message || 'Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSuccess('');
    setError('');
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <StyledPaper>
        <Typography variant="h6" gutterBottom>
          Profile Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Update Profile'}
            </Button>
          </Grid>
        </Grid>
      </StyledPaper>

      <StyledPaper>
        <Typography variant="h6" gutterBottom>
          Preferences
        </Typography>
        <FormControlLabel
          control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
          label="Dark Mode"
        />
        <FormControlLabel
          control={<Switch checked={notificationsEnabled} onChange={() => setNotificationsEnabled(!notificationsEnabled)} />}
          label="Enable Notifications"
        />
      </StyledPaper>

      <StyledPaper>
        <Typography variant="h6" gutterBottom>
          Account Management
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDeleteAccount}
          disabled={loading}
        >
          Delete Account
        </Button>
      </StyledPaper>

      <Dialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
      >
        <DialogTitle>Delete Account?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmationOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteAccount} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SettingsPage;