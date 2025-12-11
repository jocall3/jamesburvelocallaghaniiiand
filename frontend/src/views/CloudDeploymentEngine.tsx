import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CheckCircleOutline, ErrorOutline, CloudUpload, ArrowForward } from '@mui/icons-material';

// --- Configuration Data (Simulating a backend fetch) ---
const STACKS_DATA = [
  { id: 'banking_core', name: 'Digital Banking Core', regions: ['us-central1', 'eu-west1'], description: 'High-availability core banking services.' },
  { id: 'trading_platform', name: 'Low-Latency Trading Platform', regions: ['us-east4', 'asia-east1'], description: 'Optimized infrastructure for algorithmic trading.' },
  { id: 'risk_analytics', name: 'Real-time Risk Analytics Cluster', regions: ['us-central1', 'eu-west1', 'asia-southeast2'], description: 'Spark/Dataproc cluster for complex risk modeling.' },
];

const GCP_PROJECTS = ['fintech-sandbox-101', 'prod-banking-us', 'dev-analytics-eu'];

const STEPS = ['Select Stack', 'Configure Deployment', 'Review & Deploy'];

// --- Helper Functions (Simulating API Calls) ---

const simulateDeployment = (config: DeploymentConfig) => {
  return new Promise<{ success: boolean; message: string; deploymentId: string }>((resolve) => {
    console.log('Simulating deployment with config:', config);
    setTimeout(() => {
      if (Math.random() > 0.1) { // 90% success rate
        resolve({
          success: true,
          message: `Deployment of ${config.stackId} started successfully. Monitoring dashboard link will be available shortly.`,
          deploymentId: `dep-${Date.now()}`,
        });
      } else {
        resolve({
          success: false,
          message: 'Deployment failed during initial provisioning checks. Check project permissions.',
          deploymentId: '',
        });
      }
    }, 2500); // Simulate API latency
  });
};

// --- Types ---
interface Stack {
  id: string;
  name: string;
  regions: string[];
  description: string;
}

interface DeploymentConfig {
  stackId: string;
  projectName: string;
  region: string;
  environment: 'development' | 'staging' | 'production';
}

// --- Components ---

interface Step1Props {
  onNext: (config: Partial<DeploymentConfig>) => void;
  currentConfig: Partial<DeploymentConfig>;
}

const Step1SelectStack: React.FC<Step1Props> = ({ onNext, currentConfig }) => {
  const [selectedStackId, setSelectedStackId] = useState(currentConfig.stackId || '');
  const selectedStack = STACKS_DATA.find(s => s.id === selectedStackId);

  const handleSelectStack = (stackId: string) => {
    setSelectedStackId(stackId);
  };

  const handleNext = () => {
    if (selectedStack) {
      // Clear region if the new stack doesn't support the old region
      const newRegion = selectedStack.regions.includes(currentConfig.region || '')
        ? currentConfig.region
        : selectedStack.regions[0];

      onNext({
        stackId: selectedStack.id,
        region: newRegion,
      });
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>1. Choose Financial Infrastructure Stack</Typography>
      <Grid container spacing={3}>
        {STACKS_DATA.map((stack) => (
          <Grid item xs={12} sm={6} md={4} key={stack.id}>
            <Paper
              elevation={selectedStackId === stack.id ? 8 : 1}
              sx={{
                p: 3,
                cursor: 'pointer',
                border: selectedStackId === stack.id ? '2px solid' : '1px solid',
                borderColor: selectedStackId === stack.id ? 'primary.main' : 'divider',
                transition: 'border-color 0.2s',
                height: '100%',
              }}
              onClick={() => handleSelectStack(stack.id)}
            >
              <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 'bold' }}>
                {stack.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {stack.description}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Supported Regions: {stack.regions.join(', ')}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!selectedStackId}
          endIcon={<ArrowForward />}
        >
          Next: Configuration
        </Button>
      </Box>
    </Box>
  );
};

interface Step2Props {
  onNext: (config: Partial<DeploymentConfig>) => void;
  onBack: () => void;
  currentConfig: Partial<DeploymentConfig>;
}

const Step2Configure: React.FC<Step2Props> = ({ onNext, onBack, currentConfig }) => {
  const theme = useTheme();
  const [config, setConfig] = useState<Partial<DeploymentConfig>>(currentConfig);

  const selectedStack = STACKS_DATA.find(s => s.id === config.stackId);
  const regions = selectedStack?.regions || [];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setConfig({
      ...config,
      [event.target.name]: event.target.value,
    });
  };

  const isConfigValid = config.projectName && config.region && config.environment;

  const handleNext = () => {
    if (isConfigValid) {
      onNext(config);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>2. Define Target Environment</Typography>

      <Paper sx={{ p: 3, mb: 3, backgroundColor: theme.palette.grey[50] }}>
        <Typography variant="subtitle2" color="primary">Selected Stack:</Typography>
        <Typography variant="h5">{selectedStack?.name}</Typography>
        <Typography variant="body2" color="text.secondary">{selectedStack?.description}</Typography>
      </Paper>

      <Grid container spacing={4}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            required
            label="GCP Project"
            name="projectName"
            value={config.projectName || ''}
            onChange={handleChange}
            helperText="Select the target Google Cloud Project for deployment."
          >
            {GCP_PROJECTS.map((project) => (
              <MenuItem key={project} value={project}>
                {project}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            required
            label="Deployment Region"
            name="region"
            value={config.region || ''}
            onChange={handleChange}
            helperText={`Choose the primary region. Supported regions: ${regions.join(', ')}`}
          >
            {regions.map((region) => (
              <MenuItem key={region} value={region}>
                {region}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            required
            label="Environment Type"
            name="environment"
            value={config.environment || ''}
            onChange={handleChange}
            helperText="Define the scope and scale of this infrastructure instance."
          >
            {['development', 'staging', 'production'].map((env) => (
              <MenuItem key={env} value={env}>
                {env.charAt(0).toUpperCase() + env.slice(1)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} variant="outlined">
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!isConfigValid}
          endIcon={<ArrowForward />}
        >
          Next: Review
        </Button>
      </Box>
    </Box>
  );
};

interface Step3Props {
  onDeploy: (config: DeploymentConfig) => void;
  onBack: () => void;
  currentConfig: DeploymentConfig;
}

const Step3ReviewAndDeploy: React.FC<Step3Props> = ({ onDeploy, onBack, currentConfig }) => {
  const selectedStack = STACKS_DATA.find(s => s.id === currentConfig.stackId);

  const handleDeploy = () => {
    onDeploy(currentConfig);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>3. Review Deployment Configuration</Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        Warning: Initiating deployment will incur Google Cloud usage charges. Review configuration carefully.
      </Alert>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          {selectedStack?.name}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">GCP Project:</Typography>
            <Typography variant="body1">{currentConfig.projectName}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">Deployment Region:</Typography>
            <Typography variant="body1">{currentConfig.region}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">Environment:</Typography>
            <Typography variant="body1">{currentConfig.environment.toUpperCase()}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary">Resources to be provisioned (Example):</Typography>
            <ul>
              <li>VPC Network (High-Security Subnets)</li>
              <li>{currentConfig.environment === 'production' ? 'GKE Standard Cluster' : 'GKE Autopilot Cluster'}</li>
              <li>Cloud SQL (PostgreSQL HA Instance)</li>
              <li>Cloud IAM Roles and Service Accounts</li>
              <li>Stackdriver Monitoring and Logging</li>
            </ul>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} variant="outlined">
          Back
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleDeploy}
          startIcon={<CloudUpload />}
        >
          Confirm & Deploy Infrastructure
        </Button>
      </Box>
    </Box>
  );
};

const CloudDeploymentEngine: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<Partial<DeploymentConfig>>({
    environment: 'development',
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<{ success: boolean; message: string; deploymentId: string } | null>(null);

  const handleNext = useCallback((newConfig: Partial<DeploymentConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  }, []);

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDeploy = async (finalConfig: DeploymentConfig) => {
    setIsDeploying(true);
    setDeploymentResult(null);
    const result = await simulateDeployment(finalConfig);
    setDeploymentResult(result);
    setIsDeploying(false);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <Step1SelectStack onNext={handleNext} currentConfig={config} />;
      case 1:
        return (
          <Step2Configure
            onNext={handleNext}
            onBack={handleBack}
            currentConfig={config}
          />
        );
      case 2:
        if (!config.stackId || !config.projectName || !config.region || !config.environment) {
            // Should not happen if previous steps were validated, but good for safety
            return <Alert severity="error">Configuration incomplete. Please go back.</Alert>;
        }
        return (
          <Step3ReviewAndDeploy
            onDeploy={handleDeploy}
            onBack={handleBack}
            currentConfig={config as DeploymentConfig}
          />
        );
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setConfig({ environment: 'development' });
    setDeploymentResult(null);
    setIsDeploying(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Financial Infrastructure Deployment Engine
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Provision secure, pre-validated infrastructure stacks directly onto Google Cloud.
      </Typography>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {deploymentResult ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 5 }}>
            {deploymentResult.success ? (
              <CheckCircleOutline color="success" sx={{ fontSize: 60, mb: 2 }} />
            ) : (
              <ErrorOutline color="error" sx={{ fontSize: 60, mb: 2 }} />
            )}
            <Typography variant="h5" sx={{ mb: 2 }}>
              {deploymentResult.success ? 'Deployment Initiated' : 'Deployment Failed'}
            </Typography>
            <Alert severity={deploymentResult.success ? 'success' : 'error'} sx={{ width: '100%', maxWidth: 600, mb: 3 }}>
              {deploymentResult.message}
            </Alert>
            {deploymentResult.success && (
              <Typography variant="body1" color="text.secondary">
                Deployment ID: {deploymentResult.deploymentId}
              </Typography>
            )}
            <Button onClick={handleReset} variant="contained" sx={{ mt: 3 }}>
              Start New Deployment
            </Button>
          </Box>
        ) : (
          <Box>
            {isDeploying ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 5 }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" color="primary">
                  Deploying infrastructure...
                </Typography>
                <Typography color="text.secondary">
                  This typically takes a few minutes. Please wait.
                </Typography>
              </Box>
            ) : (
              renderStepContent()
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CloudDeploymentEngine;