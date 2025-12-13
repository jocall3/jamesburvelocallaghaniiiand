import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Paper,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Save as SaveIcon, Delete as DeleteIcon, Key as KeyIcon, Speed as SpeedIcon } from '@mui/icons-material';

// --- Mock API Functions (Replace with actual API calls) ---

interface ApiConfig {
  id: 'AD89' | 'AD91';
  apiKey: string;
  rateLimitPerMinute: number;
  isEnabled: boolean;
}

const initialConfigs: Record<string, ApiConfig> = {
  AD89: {
    id: 'AD89',
    apiKey: '****************************************', // Masked for display
    rateLimitPerMinute: 60,
    isEnabled: true,
  },
  AD91: {
    id: 'AD91',
    apiKey: '****************************************', // Masked for display
    rateLimitPerMinute: 120,
    isEnabled: false,
  },
};

const fetchApiConfigs = async (): Promise<Record<string, ApiConfig>> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return initialConfigs;
};

const saveApiConfig = async (config: ApiConfig): Promise<boolean> => {
  console.log(`Saving configuration for ${config.id}:`, {
    apiKey: config.apiKey.length > 10 ? '***MASKED***' : config.apiKey,
    rateLimitPerMinute: config.rateLimitPerMinute,
    isEnabled: config.isEnabled,
  });
  // Simulate network delay and success
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

// --- Component Definition ---

interface ApiSettingsProps {}

const APISettings: React.FC<ApiSettingsProps> = () => {
  const [configs, setConfigs] = useState<Record<string, ApiConfig>>(initialConfigs);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{ message: string; severity: 'success' | 'error' | null }>({ message: null, severity: null });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({ AD89: false, AD91: false });

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const loadedConfigs = await fetchApiConfigs();
      setConfigs(loadedConfigs);
    } catch (error) {
      console.error("Failed to load API configurations:", error);
      setSaveStatus({ message: 'Error loading configurations.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleInputChange = (id: 'AD89' | 'AD91', field: keyof Omit<ApiConfig, 'id'>, value: string | number | boolean) => {
    setConfigs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
    // Clear status message on change
    if (saveStatus.message) {
        setSaveStatus({ message: null, severity: null });
    }
  };

  const handleSave = async (id: 'AD89' | 'AD91') => {
    const configToSave = configs[id];
    setSaveStatus({ message: `Saving ${id}...`, severity: null });

    try {
      const success = await saveApiConfig(configToSave);
      if (success) {
        setSaveStatus({ message: `${id} settings saved successfully!`, severity: 'success' });
      } else {
        setSaveStatus({ message: `Failed to save ${id} settings.`, severity: 'error' });
      }
    } catch (error) {
      console.error(`Error saving ${id}:`, error);
      setSaveStatus({ message: `An unexpected error occurred while saving ${id}.`, severity: 'error' });
    }
    // Clear status after a delay
    setTimeout(() => setSaveStatus({ message: null, severity: null }), 5000);
  };

  const toggleShowKey = (id: 'AD89' | 'AD91') => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderApiCard = (id: 'AD89' | 'AD91') => {
    const config = configs[id];
    const isKeyVisible = showKeys[id];

    return (
      <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
            {id} API Configuration
          </Typography>
          <Tooltip title={config.isEnabled ? "API is Active" : "API is Disabled"}>
            <IconButton color={config.isEnabled ? 'primary' : 'default'}>
              {config.isEnabled ? <SpeedIcon /> : <SpeedIcon color="disabled" />}
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          {/* API Key Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={`${id} API Key`}
              type={isKeyVisible ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => handleInputChange(id, 'apiKey', e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <KeyIcon color="action" sx={{ mr: 1 }} />
                ),
                endAdornment: (
                  <Tooltip title={isKeyVisible ? "Hide Key" : "Show Key"}>
                    <IconButton onClick={() => toggleShowKey(id)} edge="end" size="small">
                      {isKeyVisible ? '👁️' : '🔒'}
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
          </Grid>

          {/* Rate Limit Field */}
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Rate Limit (Requests/Minute)"
              type="number"
              value={config.rateLimitPerMinute}
              onChange={(e) => handleInputChange(id, 'rateLimitPerMinute', parseInt(e.target.value) || 0)}
              variant="outlined"
              size="small"
              inputProps={{ min: 1 }}
            />
          </Grid>

          {/* Enable Switch */}
          <Grid item xs={12} sm={4} display="flex" alignItems="center" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.isEnabled}
                  onChange={(e) => handleInputChange(id, 'isEnabled', e.target.checked)}
                  color="primary"
                />
              }
              label="Enabled"
            />
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={() => handleSave(id)}
            disabled={loading}
          >
            Save {id} Settings
          </Button>
          <Typography variant="caption" color="textSecondary">
            Last Updated: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        External API Management (AD89 & AD91)
      </Typography>
      <Typography variant="body1" paragraph color="textSecondary">
        Manage API keys, enable/disable connections, and configure rate limits for integrated services.
      </Typography>

      {saveStatus.message && (
        <Alert
          severity={saveStatus.severity || 'info'}
          sx={{ mb: 3 }}
          onClose={() => setSaveStatus({ message: null, severity: null })}
        >
          {saveStatus.message}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <Typography>Loading configurations...</Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            {renderApiCard('AD89')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderApiCard('AD91')}
          </Grid>
        </Grid>
      )}

      <Box mt={5} p={2} borderTop={1} borderColor="divider">
        <Typography variant="subtitle2" color="textSecondary">
          Note: API keys are stored securely and masked in the UI after initial load.
        </Typography>
      </Box>
    </Box>
  );
};

export default APISettings;