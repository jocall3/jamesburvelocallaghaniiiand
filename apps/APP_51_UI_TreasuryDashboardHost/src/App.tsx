/*
 * Copyright 2024 [Your Company Here]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useState, useEffect, Suspense, lazy, ErrorInfo } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  ThemeProvider,
  createTheme,
  CircularProgress,
  Container,
  Alert,
  AlertTitle,
  Grid,
  Paper,
  styled,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  MonetizationOn as MonetizationOnIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// --- Core SDK Imports ---
// These would be imported from the shared SDK package
// import { CoreSDK, AuthService, EventBus, AppManifest } from '@ecosystem/core-sdk';
// Mocking for standalone functionality
const CoreSDK = {
  init: () => console.log('Core SDK Initialized'),
  getAppManifest: (appName: string) => Promise.resolve({
    name: appName,
    version: '1.0.0',
    remoteEntry: `http://localhost:3051/remoteEntry.js`, // Example, would be dynamic
    exposes: {
      './CostBreakdownWidget': 'apps/APP_10_Billing_UsageTracker/src/widgets/CostBreakdownWidget',
      './RevenueProjectionWidget': 'apps/APP_25_Marketplace_VendorPayout/src/widgets/RevenueProjectionWidget',
      './TokenFlowVisualizer': 'apps/APP_10_Billing_UsageTracker/src/widgets/TokenFlowVisualizer',
      './ComplianceStatusWidget': 'apps/APP_37_Governance_AuditTrailEngine/src/widgets/ComplianceStatusWidget',
    }
  })
};
const AuthService = {
  getUser: () => Promise.resolve({ name: 'Treasury Analyst', email: 'analyst@example.com' }),
  logout: () => console.log('User logged out'),
};
const EventBus = {
  subscribe: (topic: string, callback: (data: any) => void) => {
    console.log(`Subscribed to ${topic}`);
    return () => console.log(`Unsubscribed from ${topic}`);
  },
  publish: (topic: string, data: any) => console.log(`Published to ${topic}`, data),
};

// --- Constants ---
const DRAWER_WIDTH = 240;
const APP_NAME = 'APP_51_UI_TreasuryDashboardHost';

// --- Micro-Frontend Dynamic Loader ---
// This is a critical piece for the host application architecture.
// It dynamically loads components from other deployed applications.

const loadRemoteComponent = (remoteName: string, exposedModule: string) => {
  return lazy(async () => {
    // This is a simplified implementation of module federation's dynamic loading.
    // In a real Webpack 5 Module Federation setup, this is handled more elegantly.
    
    // 1. Get app manifest from a central service or the core SDK
    const manifest = await CoreSDK.getAppManifest(remoteName);
    const remoteUrl = manifest.remoteEntry;

    // 2. Check if the remote script is already loaded
    if (!(window as any)[remoteName]) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = remoteUrl;
        script.type = 'text/javascript';
        script.async = true;
        script.onload = () => {
          console.log(`Dynamically loaded remote entry for ${remoteName}`);
          resolve();
        };
        script.onerror = (err) => {
          console.error(`Failed to load remote entry for ${remoteName}:`, err);
          reject(err);
        };
        document.head.appendChild(script);
      });
    }

    // 3. Initialize the remote container and get the exposed module
    const container = (window as any)[remoteName];
    await container.init(__webpack_share_scopes__.default);
    const factory = await container.get(exposedModule);
    return factory();
  });
};

// --- Dynamically Loaded Widgets ---
const CostBreakdownWidget = loadRemoteComponent('APP_10_Billing_UsageTracker', './CostBreakdownWidget');
const RevenueProjectionWidget = loadRemoteComponent('APP_25_Marketplace_VendorPayout', './RevenueProjectionWidget');
const TokenFlowVisualizer = loadRemoteComponent('APP_10_Billing_UsageTracker', './TokenFlowVisualizer');
const ComplianceStatusWidget = loadRemoteComponent('APP_37_Governance_AuditTrailEngine', './ComplianceStatusWidget');


// --- Error Boundary for Micro-Frontends ---
class MicroFrontendErrorBoundary extends React.Component<{ children: React.ReactNode, componentName: string }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode, componentName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error loading micro-frontend ${this.props.componentName}:`, error, errorInfo);
    EventBus.publish('ui.error.microfrontend_load', {
      component: this.props.componentName,
      error: error.message,
      stack: error.stack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', border: '1px dashed red' }}>
          <Typography variant="h6" color="error" gutterBottom>
            <WarningIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Widget Failed to Load
          </Typography>
          <Typography variant="body2">
            The widget '{this.props.componentName}' could not be loaded. This may be due to a network issue or an error within the remote application.
          </Typography>
        </Paper>
      );
    }
    return this.props.children;
  }
}

const WidgetContainer: React.FC<{ children: React.ReactNode, title: string, componentName: string }> = ({ children, title, componentName }) => (
  <Grid item xs={12} md={6} lg={6}>
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 280 }}>
      <Typography component="h2" variant="h6" color="primary" gutterBottom>
        {title}
      </Typography>
      <MicroFrontendErrorBoundary componentName={componentName}>
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>}>
          {children}
        </Suspense>
      </MicroFrontendErrorBoundary>
    </Paper>
  </Grid>
);


// --- Page Components ---

const DashboardOverview = () => (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <Grid container spacing={3}>
      <WidgetContainer title="Real-Time Cost Breakdown" componentName="CostBreakdownWidget">
        <CostBreakdownWidget />
      </WidgetContainer>
      <WidgetContainer title="Revenue & Payout Projections" componentName="RevenueProjectionWidget">
        <RevenueProjectionWidget />
      </WidgetContainer>
      <Grid item xs={12}>
         <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Live Token & Compute Flow
            </Typography>
            <MicroFrontendErrorBoundary componentName="TokenFlowVisualizer">
                <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>}>
                    <TokenFlowVisualizer />
                </Suspense>
            </MicroFrontendErrorBoundary>
         </Paper>
      </Grid>
      <WidgetContainer title="Governance & Compliance Status" componentName="ComplianceStatusWidget">
        <ComplianceStatusWidget />
      </WidgetContainer>
    </Grid>
  </Container>
);

const SystemIntrospection = () => {
    const agentMetadata = {
        purpose: "Provides a centralized, real-time view of the ecosystem's financial and operational health by composing UIs from various specialized service applications. It acts as the primary host for treasury, billing, and governance-related micro-frontends.",
        dependencies: [
            "APP_10_Billing_UsageTracker (for cost/token widgets)",
            "APP_25_Marketplace_VendorPayout (for revenue widgets)",
            "APP_37_Governance_AuditTrailEngine (for compliance widgets)",
            "Shared Core SDK (for auth, service discovery, eventing)"
        ],
        invalidation_conditions: [
            "Major breaking change in the Core SDK's AppManifest or EventBus contract.",
            "Network partitioning preventing access to remote application entry points.",
            "Deprecation of a critical dependent UI application (e.g., Billing)."
        ],
        adjacent_apps: [
            "APP_10_Billing_UsageTracker",
            "APP_25_Marketplace_VendorPayout",
            "APP_37_Governance_AuditTrailEngine",
            "APP_01_Inference_CostRouter"
        ],
        tension: "Centralized Visibility vs. Decentralized Operations. This dashboard provides a single pane of glass over a distributed ecosystem. Its micro-frontend architecture reflects this tension: a central host dynamically composing views from autonomous, independently deployed applications, creating a unified experience from disparate parts."
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>System Introspection</Typography>
                <Typography variant="h6">/introspect</Typography>
                <Box component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mt: 2 }}>
                    {JSON.stringify({ agent_metadata: agentMetadata }, null, 2)}
                </Box>

                <Typography variant="h6" mt={4}>/assumptions</Typography>
                <ul>
                    <li><Typography>Network connectivity exists between the host and remote UI applications.</Typography></li>
                    <li><Typography>Remote applications adhere to the agreed-upon micro-frontend contract (e.g., exposing a `remoteEntry.js` and specific component names).</Typography></li>
                    <li><Typography>The Core SDK provides a reliable service discovery mechanism for locating remote applications.</Typography></li>
                    <li><Typography>All applications share a common authentication context provided by the AuthService.</Typography></li>
                </ul>

                <Typography variant="h6" mt={4}>/failure-modes</Typography>
                <ul>
                    <li><Typography><strong>Cascading Failure:</strong> A critical remote app (e.g., Billing) goes down, causing its widgets to fail and degrading the dashboard.</Typography></li>
                    <li><Typography><strong>Version Mismatch:</strong> A remote app deploys a breaking change to a widget's props API without the host being updated, causing rendering errors.</Typography></li>
                    <li><Typography><strong>Performance Bottleneck:</strong> Slow loading of multiple remote entries can significantly delay the initial dashboard render.</Typography></li>
                    <li><Typography><strong>Security Risk:</strong> A compromised remote application could potentially execute malicious code within the host's security context.</Typography></li>
                </ul>

                <Typography variant="h6" mt={4}>/update-triggers</Typography>
                <ul>
                    <li><Typography>Deployment of a new version of a dependent remote application.</Typography></li>
                    <li><Typography>Update to the Core SDK, especially auth or service discovery modules.</Typography></li>
                    <li><Typography>Changes in the ecosystem's financial model requiring new visualizations.</Typography></li>
                    <li><Typography>Introduction of a new UI application that needs to be integrated into the dashboard.</Typography></li>
                </ul>
            </Paper>
        </Container>
    );
};

// --- Layout and Main App Component ---

const DisclaimerBanner = styled(Alert)(({ theme }) => ({
  borderRadius: 0,
  justifyContent: 'center',
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.warning.dark : theme.palette.warning.light,
}));

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Cost Analysis', icon: <AccountBalanceWalletIcon />, path: '/costs' },
  { text: 'Revenue Streams', icon: <MonetizationOnIcon />, path: '/revenue' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
  { text: 'System', icon: <InfoIcon />, path: '/introspect' },
];

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    CoreSDK.init();
    AuthService.getUser().then(setUser);
  }, []);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: '#673ab7',
          },
          secondary: {
            main: '#00bcd4',
          },
        },
      }),
    [isDarkMode],
  );

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" noWrap component="div">
          AI Ecosystem Treasury
        </Typography>
      </Toolbar>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={NavLink} to={item.path} selected={location.pathname === item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {APP_NAME}
            </Typography>
            <Typography sx={{ mr: 2 }}>{user?.name}</Typography>
            <Tooltip title="Toggle Theme">
              <IconButton onClick={toggleTheme} color="inherit">
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton color="inherit">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout">
              <IconButton color="inherit" onClick={AuthService.logout}>
                <ExitToAppIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          {drawer}
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 0 }}>
          <Toolbar />
          <DisclaimerBanner severity="warning">
            <AlertTitle>Internal Use Only</AlertTitle>
            This dashboard contains sensitive financial and operational data. Do not share or distribute. All actions are logged.
          </DisclaimerBanner>
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/costs" element={<div>Cost Analysis Page (Loads widgets from APP_10)</div>} />
            <Route path="/revenue" element={<div>Revenue Streams Page (Loads widgets from APP_25)</div>} />
            <Route path="/reports" element={<div>Reports Page (Loads widgets from APP_42)</div>} />
            <Route path="/introspect" element={<SystemIntrospection />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

const Root = () => (
  <Router>
    <App />
  </Router>
);

export default Root;

// Mock webpack share scopes for standalone execution
declare const __webpack_share_scopes__: any;
if (typeof __webpack_share_scopes__ === 'undefined') {
  (window as any).__webpack_share_scopes__ = { default: {} };
}