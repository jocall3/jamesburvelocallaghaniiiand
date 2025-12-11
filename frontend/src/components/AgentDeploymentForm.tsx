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

// Mock data for available options
const AVAILABLE_AGENT_TYPES = [
  { id: 'financial_analyst', name: 'Financial Analyst Agent' },
  { id: 'logistics_optimizer', name: 'Logistics Optimizer Agent' },
  { id: 'customer_support_bot', name: 'Customer Support Bot' },
];

const AVAILABLE_REGIONS = [
  'us-central1',
  'europe-west1',
  'asia-northeast1',
  'sovereign-eu-a', // Example sovereign region
  'sovereign-apac-b', // Example sovereign region
];

const AVAILABLE_MODEL_VERSIONS = [
  'v2.1.0-sovereign',
  'v2.0.5-stability',
  'latest-beta',
];

const AVAILABLE_COMPUTE_PROFILES = [
  'standard-highcpu',
  'high-memory-xl',
  'gpu-accelerated-small',
];

const AgentDeploymentForm: React.FC = () => {
  const initialConfig: AgentConfig = useMemo(() => ({
    agentName: '',
    agentType: AVAILABLE_AGENT_TYPES[0]?.id || '',
    region: AVAILABLE_REGIONS[0] || '',
    modelVersion: AVAILABLE_MODEL_VERSIONS[0] || '',
    computeProfile: AVAILABLE_COMPUTE_PROFILES[0] || '',
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleResourceChange = useCallback((key: keyof AgentConfig['resourceLimits'], value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setConfig(prev => ({
        ...prev,
        resourceLimits: {
          ...prev.resourceLimits,
          [key]: numValue,
        },
      }));
    } else if (value === '') {
        setConfig(prev => ({
            ...prev,
            resourceLimits: {
                ...prev.resourceLimits,
                [key]: 0, // Allow temporary empty state for typing
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

  const validateConfig = useMemo(() => {
    return (
      config.agentName.trim().length > 0 &&
      config.agentType.length > 0 &&
      config.region.length > 0 &&
      config.modelVersion.length > 0 &&
      config.computeProfile.length > 0 &&
      config.resourceLimits.cpu > 0 &&
      config.resourceLimits.memoryGb > 0
    );
  }, [config]);

  // Mock deployment function - replace with actual API call
  const deployAgent = async () => {
    if (!validateConfig) return;

    setIsDeploying(true);
    setDeploymentStatus(null);

    console.log("Attempting deployment with config:", config);

    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      // In a real application, this would be an axios/fetch call to:
      // POST /v1/agents:deploy
      // where the body is 'config'

      // Mock success condition
      const success = Math.random() > 0.1; // 90% success rate mock

      if (success) {
        setDeploymentStatus({
          success: true,
          message: `Agent '${config.agentName}' deployment initiated successfully in ${config.region}. Monitoring ID: dep-xyz-${Date.now()}`,
          deploymentId: `dep-xyz-${Date.now()}`,
        });
      } else {
        setDeploymentStatus({
          success: false,
          message: "Deployment failed due to internal constraint violation in the target sovereign environment.",
        });
      }
    } catch (error) {
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
    }
  };

  const renderStatusAlert = () => {
    if (!deploymentStatus) return null;

    const severity = deploymentStatus.success ? 'success' : 'error';
    return (
      <Alert severity={severity} sx={{ mt: 2 }}>
        {deploymentStatus.message}
        {deploymentStatus.deploymentId && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            ID: {deploymentStatus.deploymentId}
          </Typography>
        )}
      </Alert>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom component="div" sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
        Sovereign AI Agent Deployment Configuration
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ '& .MuiTextField-root': { mb: 2 } }}>
        <Grid container spacing={3}>
          {/* Section 1: Core Identification */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
              Agent Identity & Target
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Agent Name (Unique Identifier)"
              name="agentName"
              value={config.agentName}
              onChange={handleChange}
              error={!config.agentName.trim()}
              helperText={!config.agentName.trim() ? "Agent name is required" : "A unique name for this deployment instance."}
              disabled={isDeploying}
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
              >
                {AVAILABLE_MODEL_VERSIONS.map((version) => (
                  <MenuItem key={version} value={version}>
                    {version}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Section 2: Compute and Resources */}
          <Grid item xs={12} sx={{ pt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
              Compute Profile & Limits
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
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="GPU Count (0 or more)"
              type="number"
              name="gpuCount"
              value={config.resourceLimits.gpuCount}
              onChange={(e) => handleResourceChange('gpuCount', e.target.value)}
              InputProps={{ inputProps: { min: 0 } }}
              disabled={isDeploying}
            />
          </Grid>

        </Grid>

        {renderStatusAlert()}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!validateConfig || isDeploying}
          >
            {isDeploying ? 'Deploying...' : 'Deploy Sovereign Agent'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default AgentDeploymentForm;