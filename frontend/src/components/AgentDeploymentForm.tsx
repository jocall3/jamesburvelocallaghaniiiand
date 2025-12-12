import React, { useState, useCallback, useMemo } from 'react';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Box,
  Paper,
  Alert,
} from '@mui/material';

// Define types based on likely API/project structure
interface AgentConfig {
  agentName: string;
  agentType: string;
  region: string;
  modelVersion: string;
  computeProfile: string;
  resourceLimits: {
    cpu: number;
    memoryGb: number;
    gpuCount: number;
  };
  deploymentStrategy: 'standard' | 'canary' | 'blue-green';
}

interface AgentDeploymentResult {
  success: boolean;
  message: string;
  deploymentId?: string;
}

// Mock data for available options - In a real system, these would be dynamically fetched.
// For this self-contained example, they are hardcoded.
const AVAILABLE_AGENT_TYPES = [
  { id: 'financial_analyst', name: 'Financial Analyst Agent' },
  { id: 'logistics_optimizer', name: 'Logistics Optimizer Agent' },
  { id: 'customer_support_bot', name: 'Customer Support Bot' },
  { id: 'risk_assessor', name: 'Risk Assessment Agent' },
  { id: 'compliance_officer', name: 'Compliance Officer Agent' },
  { id: 'market_predictor', name: 'Market Prediction Agent' },
  { id: 'fraud_detector', name: 'Fraud Detection Agent' },
  { id: 'portfolio_manager', name: 'Portfolio Management Agent' },
  { id: 'regulatory_reporter', name: 'Regulatory Reporting Agent' },
  { id: 'economic_forecaster', name: 'Economic Forecasting Agent' },
];

const AVAILABLE_REGIONS = [
  'us-central1',
  'europe-west1',
  'asia-northeast1',
  'sovereign-eu-a', // Example sovereign region
  'sovereign-apac-b', // Example sovereign region
  'us-east1',
  'us-west2',
  'asia-southeast1',
];

const AVAILABLE_MODEL_VERSIONS = [
  'v2.1.0-sovereign',
  'v2.0.5-stability',
  'latest-beta',
  'v1.9.2-enterprise',
  'v2.2.0-rc1',
  'v2.1.5-secure',
];

const AVAILABLE_COMPUTE_PROFILES = [
  'standard-highcpu',
  'high-memory-xl',
  'gpu-accelerated-small',
  'compute-optimized-medium',
  'memory-optimized-large',
  'gpu-accelerated-xl',
];

const AgentDeploymentForm: React.FC = () => {
  // Initialize with default values, ensuring they exist
  const initialConfig: AgentConfig = useMemo(() => ({
    agentName: '',
    agentType: AVAILABLE_AGENT_TYPES[0]?.id || 'financial_analyst',
    region: AVAILABLE_REGIONS[0] || 'us-central1',
    modelVersion: AVAILABLE_MODEL_VERSIONS[0] || 'v2.1.0-sovereign',
    computeProfile: AVAILABLE_COMPUTE_PROFILES[0] || 'standard-highcpu',
    resourceLimits: {
      cpu: 4,
      memoryGb: 16,
      gpuCount: 1,
    },
    deploymentStrategy: 'standard',
  }), []);

  const [config, setConfig] = useState<AgentConfig>(initialConfig);
  const [deploymentStatus, setDeploymentStatus] = useState<AgentDeploymentResult | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  // --- Event Handlers ---

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleResourceChange = useCallback((key: keyof AgentConfig['resourceLimits'], value: string) => {
    const numValue = parseInt(value, 10);
    // Allow 0 for GPU count, but require positive for CPU/Memory
    const isValid = (key === 'gpuCount' && !isNaN(numValue) && numValue >= 0) ||
                    ((key === 'cpu' || key === 'memoryGb') && !isNaN(numValue) && numValue > 0);

    if (isValid) {
      setConfig(prev => ({
        ...prev,
        resourceLimits: {
          ...prev.resourceLimits,
          [key]: numValue,
        },
      }));
    } else if (value === '' && key === 'gpuCount') {
      // Allow empty for GPU count to reset to 0
      setConfig(prev => ({
        ...prev,
        resourceLimits: {
          ...prev.resourceLimits,
          [key]: 0,
        },
      }));
    } else if (value === '' && (key === 'cpu' || key === 'memoryGb')) {
      // Do not allow empty for required fields, but clear if user backspaces
      setConfig(prev => ({
        ...prev,
        resourceLimits: {
          ...prev.resourceLimits,
          [key]: 0, // Temporarily set to 0, validation will catch it
        },
      }));
    }
  }, []);

  const handleSelectChange = useCallback((name: keyof Omit<AgentConfig, 'resourceLimits'>, value: string) => {
    setConfig(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // --- Validation ---

  const validateConfig = useMemo(() => {
    return (
      config.agentName.trim().length > 0 &&
      config.agentType.length > 0 &&
      config.region.length > 0 &&
      config.modelVersion.length > 0 &&
      config.computeProfile.length > 0 &&
      config.resourceLimits.cpu > 0 &&
      config.resourceLimits.memoryGb > 0 &&
      config.deploymentStrategy.length > 0
    );
  }, [config]);

  // --- Deployment Logic ---

  // Mock deployment function - In a real system, this would interact with a backend API.
  // For this self-contained example, it simulates a network request and response.
  const deployAgent = async () => {
    if (!validateConfig) {
      setDeploymentStatus({ success: false, message: "Please fill in all required fields correctly." });
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus(null);

    console.log("Attempting deployment with config:", config);

    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      // In a real application, this would be an axios/fetch call to:
      // POST /v1/agents:deploy
      // where the body is 'config'

      // Simulate success/failure based on a random chance or specific conditions
      const success = Math.random() > 0.15; // 85% success rate mock

      if (success) {
        const deploymentId = `dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setDeploymentStatus({
          success: true,
          message: `Agent '${config.agentName}' deployment initiated successfully in ${config.region}. Monitoring ID: ${deploymentId}`,
          deploymentId: deploymentId,
        });
        // Reset form after successful deployment initiation
        setConfig(initialConfig);
      } else {
        const errorMessages = [
          "Deployment failed due to insufficient resource allocation in the target region.",
          "Internal service error during agent provisioning.",
          "Configuration validation failed at the deployment endpoint.",
          "Network instability detected in the sovereign environment.",
          "Agent type not compatible with selected model version.",
        ];
        const errorMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        setDeploymentStatus({
          success: false,
          message: `Deployment failed: ${errorMessage}`,
        });
      }
    } catch (error) {
      console.error("Deployment error:", error);
      setDeploymentStatus({
        success: false,
        message: `An unexpected error occurred during deployment: ${error instanceof Error ? error.message : 'Unknown Error'}`,
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateConfig) {
      deployAgent();
    } else {
      setDeploymentStatus({ success: false, message: "Please review the form for errors and missing required fields." });
    }
  };

  // --- Rendering ---

  const renderStatusAlert = () => {
    if (!deploymentStatus) return null;

    const severity = deploymentStatus.success ? 'success' : 'error';
    return (
      <Alert severity={severity} sx={{ mt: 2, mb: 2 }}>
        {deploymentStatus.message}
        {deploymentStatus.deploymentId && (
          <Typography variant="body2" sx={{ mt: 1, color: 'inherit' }}>
            Deployment ID: {deploymentStatus.deploymentId}
          </Typography>
        )}
      </Alert>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, maxWidth: 900, mx: 'auto', mt: 4, mb: 4 }}>
      <Typography variant="h5" gutterBottom component="div" sx={{ mb: 3, fontWeight: 'bold', color: '#0070d2' }}>
        Citibankdemobusinessinc.deploy.agent
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3, color: '#555' }}>
        Configure and deploy your sovereign AI agent for enhanced financial operations.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ '& .MuiTextField-root, & .MuiFormControl-root': { mb: 2 } }}>
        <Grid container spacing={3}>
          {/* Section 1: Core Identification & Targeting */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #e0e0e0', pb: 1, color: '#0070d2' }}>
              Agent Identity & Deployment Target
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Agent Name"
              name="agentName"
              value={config.agentName}
              onChange={handleChange}
              error={!config.agentName.trim()}
              helperText={!config.agentName.trim() ? "Agent name is required" : "A unique, human-readable name for this agent instance."}
              disabled={isDeploying}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={isDeploying}>
              <InputLabel id="agentTypeLabel">Agent Type</InputLabel>
              <Select
                labelId="agentTypeLabel"
                name="agentType"
                value={config.agentType}
                label="Agent Type"
                onChange={(e) => handleSelectChange('agentType', e.target.value)}
                variant="outlined"
              >
                {AVAILABLE_AGENT_TYPES.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={isDeploying}>
              <InputLabel id="regionLabel">Deployment Sovereign Region</InputLabel>
              <Select
                labelId="regionLabel"
                name="region"
                value={config.region}
                label="Deployment Sovereign Region"
                onChange={(e) => handleSelectChange('region', e.target.value)}
                variant="outlined"
              >
                {AVAILABLE_REGIONS.map((region) => (
                  <MenuItem key={region} value={region}>
                    {region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={isDeploying}>
              <InputLabel id="modelVersionLabel">AI Model Version</InputLabel>
              <Select
                labelId="modelVersionLabel"
                name="modelVersion"
                value={config.modelVersion}
                label="AI Model Version"
                onChange={(e) => handleSelectChange('modelVersion', e.target.value)}
                variant="outlined"
              >
                {AVAILABLE_MODEL_VERSIONS.map((version) => (
                  <MenuItem key={version} value={version}>
                    {version}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Section 2: Compute Profile & Resource Allocation */}
          <Grid item xs={12} sx={{ pt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #e0e0e0', pb: 1, color: '#0070d2' }}>
              Compute Profile & Resource Allocation
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={isDeploying}>
              <InputLabel id="computeProfileLabel">Compute Profile Template</InputLabel>
              <Select
                labelId="computeProfileLabel"
                name="computeProfile"
                value={config.computeProfile}
                label="Compute Profile Template"
                onChange={(e) => handleSelectChange('computeProfile', e.target.value)}
                variant="outlined"
              >
                {AVAILABLE_COMPUTE_PROFILES.map((profile) => (
                  <MenuItem key={profile} value={profile}>
                    {profile}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={isDeploying}>
              <InputLabel id="deploymentStrategyLabel">Deployment Strategy</InputLabel>
              <Select
                labelId="deploymentStrategyLabel"
                name="deploymentStrategy"
                value={config.deploymentStrategy}
                label="Deployment Strategy"
                onChange={(e) => handleSelectChange('deploymentStrategy', e.target.value)}
                variant="outlined"
              >
                <MenuItem value="standard">Standard Rolling Update</MenuItem>
                <MenuItem value="canary">Canary Release</MenuItem>
                <MenuItem value="blue-green">Blue/Green Swap</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Required CPU Cores"
              type="number"
              name="cpuLimit"
              value={config.resourceLimits.cpu}
              onChange={(e) => handleResourceChange('cpu', e.target.value)}
              InputProps={{ inputProps: { min: 1 } }}
              required
              disabled={isDeploying}
              variant="outlined"
              helperText="Minimum 1 core"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Required Memory (GB)"
              type="number"
              name="memoryGbLimit"
              value={config.resourceLimits.memoryGb}
              onChange={(e) => handleResourceChange('memoryGb', e.target.value)}
              InputProps={{ inputProps: { min: 1 } }}
              required
              disabled={isDeploying}
              variant="outlined"
              helperText="Minimum 1 GB"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="GPU Count"
              type="number"
              name="gpuCount"
              value={config.resourceLimits.gpuCount}
              onChange={(e) => handleResourceChange('gpuCount', e.target.value)}
              InputProps={{ inputProps: { min: 0 } }}
              disabled={isDeploying}
              variant="outlined"
              helperText="0 or more GPUs"
            />
          </Grid>

        </Grid>

        {renderStatusAlert()}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            color="primary"
            disabled={!validateConfig || isDeploying}
            sx={{ px: 4, py: 1.5 }}
          >
            {isDeploying ? 'Deploying...' : 'Initiate Sovereign Agent Deployment'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default AgentDeploymentForm;