import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Avatar
} from '@mui/material';
import {
  Api as ApiIcon,
  Dns as DnsIcon,
  MonitorHeart as MonitorHeartIcon,
  AccountTree as AccountTreeIcon,
  CloudUpload as CloudUploadIcon,
  GitHub as GitHubIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

// --- Mock Data and Types ---

interface ApiSummary {
  id: string;
  name: string;
  version: string;
  status: 'healthy' | 'degraded' | 'down';
}

interface CatalogEntry {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface SystemStatus {
  totalApis: number;
  healthyServices: number;
  activeWorkflows: number;
  integrations: {
    googleDrive: boolean;
    github: boolean;
  };
}

// --- Placeholder Components (In a real app, these would be in separate files) ---

const ApiRegistryList: React.FC<{ apis: ApiSummary[] }> = ({ apis }) => {
  const getStatusIcon = (status: ApiSummary['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon color="success" />;
      case 'degraded':
        return <WarningIcon color="warning" />;
      case 'down':
        return <ErrorIcon color="error" />;
      default:
        return <ApiIcon />;
    }
  };

  return (
    <List dense>
      {apis.map((api) => (
        <ListItem key={api.id}>
          <ListItemIcon>{getStatusIcon(api.status)}</ListItemIcon>
          <ListItemText
            primary={api.name}
            secondary={`Version: ${api.version}`}
          />
          <Chip label={api.status} color={
            api.status === 'healthy' ? 'success' : api.status === 'degraded' ? 'warning' : 'error'
          } size="small" />
        </ListItem>
      ))}
    </List>
  );
};

const ApiCatalogBrowser: React.FC<{ entries: CatalogEntry[] }> = ({ entries }) => {
    const categories = [...new Set(entries.map(e => e.category))];

    return (
        <Box>
            {categories.map(category => (
                <Box key={category} mb={2}>
                    <Typography variant="h6" gutterBottom component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                        <CategoryIcon sx={{ mr: 1 }} /> {category}
                    </Typography>
                    <List dense>
                        {entries.filter(e => e.category === category).map(entry => (
                            <ListItem key={entry.id}>
                                <ListItemText primary={entry.name} secondary={entry.description} />
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                </Box>
            ))}
        </Box>
    );
};

const ApiStatusDashboard: React.FC<{ apis: ApiSummary[] }> = ({ apis }) => {
  const healthyCount = apis.filter(api => api.status === 'healthy').length;
  const degradedCount = apis.filter(api => api.status === 'degraded').length;
  const downCount = apis.filter(api => api.status === 'down').length;

  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <Card sx={{ textAlign: 'center', backgroundColor: 'success.light' }}>
          <CardContent>
            <Typography variant="h4">{healthyCount}</Typography>
            <Typography variant="subtitle1">Healthy</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={4}>
        <Card sx={{ textAlign: 'center', backgroundColor: 'warning.light' }}>
          <CardContent>
            <Typography variant="h4">{degradedCount}</Typography>
            <Typography variant="subtitle1">Degraded</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={4}>
        <Card sx={{ textAlign: 'center', backgroundColor: 'error.light' }}>
          <CardContent>
            <Typography variant="h4">{downCount}</Typography>
            <Typography variant="subtitle1">Down</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// --- Main View Component ---

const ApiEcosystemView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [apiRegistry, setApiRegistry] = useState<ApiSummary[]>([]);
  const [apiCatalog, setApiCatalog] = useState<CatalogEntry[]>([]);

  useEffect(() => {
    // Simulate fetching data from the backend
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock data
        const mockStatus: SystemStatus = {
          totalApis: 15,
          healthyServices: 13,
          activeWorkflows: 25,
          integrations: {
            googleDrive: true,
            github: true,
          },
        };

        const mockRegistry: ApiSummary[] = [
          { id: 'user-service', name: 'User Service', version: '2.1.0', status: 'healthy' },
          { id: 'auth-service', name: 'Authentication Service', version: '1.5.3', status: 'healthy' },
          { id: 'payment-gateway', name: 'Payment Gateway', version: '3.0.1', status: 'degraded' },
          { id: 'notification-service', name: 'Notification Service', version: '1.8.0', status: 'healthy' },
          { id: 'legacy-data-importer', name: 'Legacy Data Importer', version: '0.9.0', status: 'down' },
          { id: 'github-connector', name: 'GitHub Connector', version: '1.2.0', status: 'healthy' },
          { id: 'drive-storage-api', name: 'Drive Storage API', version: '1.1.0', status: 'healthy' },
        ];

        const mockCatalog: CatalogEntry[] = [
            { id: 'cat-user', name: 'User Management', category: 'Core Services', description: 'APIs for creating, reading, updating, and deleting users.' },
            { id: 'cat-auth', name: 'Authentication', category: 'Core Services', description: 'Handles Google OAuth and token management.' },
            { id: 'cat-payment', name: 'Payments', category: 'Financial', description: 'Integrates with Stripe for payment processing.' },
            { id: 'cat-drive', name: 'File Storage', category: 'Integrations', description: 'Connects to Google Drive for file persistence.' },
            { id: 'cat-github', name: 'CI/CD', category: 'Integrations', description: 'Triggers and monitors GitHub Actions workflows.' },
        ];

        setSystemStatus(mockStatus);
        setApiRegistry(mockRegistry);
        setApiCatalog(mockCatalog);
        setError(null);
      } catch (err) {
        setError('Failed to load API ecosystem data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading API Ecosystem...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: 'grey.100', minHeight: '100vh' }}>
      <AppBar position="static" elevation={1} sx={{ backgroundColor: 'white', color: 'primary.main' }}>
        <Toolbar>
          <ApiIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            API Ecosystem Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
                <CardHeader
                    avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><DnsIcon /></Avatar>}
                    title="Total APIs"
                    subheader={systemStatus?.totalApis}
                />
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
                <CardHeader
                    avatar={<Avatar sx={{ bgcolor: 'success.main' }}><MonitorHeartIcon /></Avatar>}
                    title="Healthy Services"
                    subheader={`${systemStatus?.healthyServices} / ${systemStatus?.totalApis}`}
                />
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
                <CardHeader
                    avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}><AccountTreeIcon /></Avatar>}
                    title="Active Workflows"
                    subheader={systemStatus?.activeWorkflows}
                />
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
             <Card>
                <CardHeader
                    avatar={<Avatar sx={{ bgcolor: 'info.main' }}><CloudUploadIcon /></Avatar>}
                    title="Integrations"
                    subheader={
                        <Box>
                            {systemStatus?.integrations.googleDrive && <Chip icon={<CheckCircleIcon />} label="Drive" size="small" color="success" sx={{ mr: 0.5 }} />}
                            {systemStatus?.integrations.github && <Chip icon={<GitHubIcon />} label="GitHub" size="small" color="primary" />}
                        </Box>
                    }
                />
            </Card>
          </Grid>

          {/* API Registry */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h5" component="h2" gutterBottom>
                API Registry
              </Typography>
              <ApiRegistryList apis={apiRegistry} />
            </Paper>
          </Grid>

          {/* API Status */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Live Service Status
              </Typography>
              <ApiStatusDashboard apis={apiRegistry} />
            </Paper>
          </Grid>

          {/* API Catalog */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h5" component="h2" gutterBottom>
                API Catalog
              </Typography>
              <ApiCatalogBrowser entries={apiCatalog} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ApiEcosystemView;