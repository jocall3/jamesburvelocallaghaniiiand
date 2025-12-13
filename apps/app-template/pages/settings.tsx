import React from 'react';
import { Box, Typography, TextField, Button, Container, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const SettingsPage = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Settings
        </Typography>

        <Typography variant="h6" component="h3" mt={3}>
          Profile Information
        </Typography>

        <Box sx={{ mt: 2 }}>
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            margin="normal"
            defaultValue="John Doe" // Replace with actual user data
          />
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            defaultValue="john.doe@example.com" // Replace with actual user data
            type="email"
          />
        </Box>

        <Typography variant="h6" component="h3" mt={3}>
          App Preferences
        </Typography>

        <Box sx={{ mt: 2 }}>
          {/* Add app-specific settings here.  Examples: */}
          <TextField
            label="Notification Frequency"
            variant="outlined"
            fullWidth
            margin="normal"
            defaultValue="Daily" // Replace with actual user data
          />
          {/* Add more app-specific settings as needed */}
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary">
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SettingsPage;