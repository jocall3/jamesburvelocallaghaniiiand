import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
  appName: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, appName }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {appName}
          </Typography>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/pricing">Pricing</Button>
          <Button color="inherit" component={Link} to="/account">Account</Button>
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ mt: 3, mb: 2, flexGrow: 1 }}>
        {children}
      </Container>

      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.grey[200] }}>
        <Container maxWidth="sm">
          <Typography variant="body1">
            &copy; {new Date().getFullYear()} {appName}. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default AppLayout;