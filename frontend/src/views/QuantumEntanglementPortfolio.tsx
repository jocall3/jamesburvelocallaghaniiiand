import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Button,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Internal Data Generation Functions ---

const generateUniqueId = (prefix = '') => `${prefix}${Math.random().toString(36).substring(2, 9)}`;

const generateTimestamp = () => new Date().getTime();

const generateQuantumState = () => {
  const states = ['Superposition', 'Entangled', 'Decohered', 'Superposition', 'Entangled'];
  return states[Math.floor(Math.random() * states.length)];
};

const generateCorrelationFactor = (base: number = 0.5, variation: number = 0.3) => {
  const noise = (Math.random() - 0.5) * 2 * variation;
  let correlation = base + noise;
  correlation = Math.max(0, Math.min(1, correlation)); // Clamp between 0 and 1
  return parseFloat(correlation.toFixed(2));
};

const generateAssetName = () => {
  const prefixes = ['Qubit', 'Entangler', 'SuperPositron', 'QuantumNode', 'FluxCapacitor'];
  const suffixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Prime'];
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
};

// --- Internal Model Training & Dataset Simulation ---

// In a real scenario, this would involve complex quantum state simulation and training
// For this demo, we simulate data evolution.
const simulateQuantumEvolution = (asset: any) => {
  const timeDelta = (generateTimestamp() - asset.timestamp) / 1000; // seconds
  let newCorrelation = asset.correlationFactor;
  let newState = asset.state;

  if (asset.state === 'Entangled') {
    const entanglementDecayRate = 0.005; // per second
    const entanglementBoostRate = 0.002; // per second
    const randomFactor = Math.random();

    if (randomFactor < 0.6) { // 60% chance of slight decay
      newCorrelation = Math.max(0, asset.correlationFactor - entanglementDecayRate * timeDelta * (1 + Math.random() * 0.5));
    } else if (randomFactor < 0.8) { // 20% chance of slight boost
      newCorrelation = Math.min(1, asset.correlationFactor + entanglementBoostRate * timeDelta * (1 + Math.random() * 0.5));
    }
    // If correlation drops below a threshold, it might decohere
    if (newCorrelation < 0.3 && Math.random() < 0.1) {
      newState = 'Decohered';
    }
  } else if (asset.state === 'Superposition') {
    const superpositionDriftRate = 0.003;
    newCorrelation = generateCorrelationFactor(asset.correlationFactor, superpositionDriftRate);
    if (Math.random() < 0.05) { // Small chance to become entangled
      newState = 'Entangled';
    }
  } else if (asset.state === 'Decohered') {
    const decoherenceDriftRate = 0.001;
    newCorrelation = generateCorrelationFactor(asset.correlationFactor, decoherenceDriftRate);
    if (Math.random() < 0.02) { // Very small chance to re-enter superposition
      newState = 'Superposition';
    }
  }

  return {
    ...asset,
    correlationFactor: parseFloat(newCorrelation.toFixed(2)),
    state: newState,
    timestamp: generateTimestamp(),
  };
};

// --- Mock Data Store (Internal) ---
let internalQuantumAssets: Array<{ id: string; name: string; state: string; correlationFactor: number; timestamp: number }> = [
  { id: 'qa-001', name: 'Qubit Alpha', state: 'Superposition', correlationFactor: 0.85, timestamp: generateTimestamp() - 60000 },
  { id: 'qa-002', name: 'Entangler Beta', state: 'Entangled', correlationFactor: 0.85, timestamp: generateTimestamp() - 50000 },
  { id: 'qa-003', name: 'SuperPositron Gamma', state: 'Decohered', correlationFactor: 0.1, timestamp: generateTimestamp() - 40000 },
  { id: 'qa-004', name: 'QuantumNode Delta', state: 'Superposition', correlationFactor: 0.7, timestamp: generateTimestamp() - 30000 },
  { id: 'qa-005', name: 'FluxCapacitor Omega', state: 'Entangled', correlationFactor: 0.7, timestamp: generateTimestamp() - 20000 },
];

// --- Internal API Simulation ---
const fetchQuantumAssets = async () => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simulate data evolution
  internalQuantumAssets = internalQuantumAssets.map(simulateQuantumEvolution);

  // Add some random new assets occasionally to simulate discovery
  if (Math.random() < 0.1) {
    internalQuantumAssets.push({
      id: generateUniqueId('qa-'),
      name: generateAssetName(),
      state: generateQuantumState(),
      correlationFactor: generateCorrelationFactor(),
      timestamp: generateTimestamp(),
    });
  }

  // Simulate potential transient errors
  if (Math.random() < 0.05) {
    throw new Error('Simulated network instability');
  }

  return [...internalQuantumAssets]; // Return a copy
};

const addQuantumAsset = async (name: string, correlation: number) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (!name.trim() || isNaN(correlation) || correlation < 0 || correlation > 1) {
    throw new Error('Invalid asset data provided.');
  }
  const newAsset = {
    id: generateUniqueId('qa-'),
    name: name.trim(),
    state: 'Initializing',
    correlationFactor: correlation,
    timestamp: generateTimestamp(),
  };
  internalQuantumAssets.push(newAsset);
  return newAsset;
};

const updateQuantumAssetCorrelation = async (id: string, newCorrelation: number) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (isNaN(newCorrelation) || newCorrelation < 0 || newCorrelation > 1) {
    throw new Error('Invalid correlation factor.');
  }
  const assetIndex = internalQuantumAssets.findIndex(asset => asset.id === id);
  if (assetIndex === -1) {
    throw new Error('Asset not found.');
  }
  internalQuantumAssets[assetIndex] = {
    ...internalQuantumAssets[assetIndex],
    correlationFactor: newCorrelation,
    timestamp: generateTimestamp(),
  };
  return internalQuantumAssets[assetIndex];
};

// --- Component Definition ---

const QuantumEntanglementPortfolio: React.FC = () => {
  const [assets, setAssets] = useState<typeof internalQuantumAssets>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCorrelation, setNewAssetCorrelation] = useState<string>(''); // Keep as string for input handling

  useEffect(() => {
    const loadAssets = async () => {
      setLoading(true);
      setError(null); // Clear previous errors on new load attempt
      try {
        const data = await fetchQuantumAssets();
        setAssets(data);
      } catch (err: any) {
        setError(`Failed to load quantum assets: ${err.message}. Please try again later.`);
        console.error('Error fetching quantum assets:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();

    // Poll for updates every 15 seconds
    const intervalId = setInterval(loadAssets, 15000);

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAsset = async () => {
    if (!newAssetName.trim() || newAssetCorrelation === '') {
      setError('Asset name and correlation factor are required.');
      return;
    }
    const correlation = parseFloat(newAssetCorrelation);
    if (isNaN(correlation) || correlation < 0 || correlation > 1) {
      setError('Correlation factor must be a number between 0.0 and 1.0.');
      return;
    }

    setLoading(true); // Indicate operation in progress
    setError(null);
    try {
      const addedAsset = await addQuantumAsset(newAssetName, correlation);
      setAssets(prevAssets => [...prevAssets, addedAsset]);
      setNewAssetName('');
      setNewAssetCorrelation('');
    } catch (err: any) {
      setError(`Failed to add asset: ${err.message}`);
      console.error('Error adding quantum asset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCorrelation = async (id: string, newCorrelationValue: number) => {
    if (isNaN(newCorrelationValue) || newCorrelationValue < 0 || newCorrelationValue > 1) {
      setError('Invalid correlation factor provided.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updatedAsset = await updateQuantumAssetCorrelation(id, newCorrelationValue);
      setAssets(prevAssets =>
        prevAssets.map(asset => (asset.id === id ? updatedAsset : asset))
      );
    } catch (err: any) {
      setError(`Failed to update asset ${id}: ${err.message}`);
      console.error(`Error updating quantum asset ${id}:`, err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for the chart
  const chartData = assets.map(asset => ({
    name: asset.name,
    correlation: asset.correlationFactor,
  }));

  const handleCorrelationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Allow only numbers, decimal point, and ensure it stays within 0-1 range visually
    if (/^\d*\.?\d*$/.test(value)) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
        setNewAssetCorrelation(value);
      } else if (value === '' || value === '.') { // Allow empty or just a dot for input
        setNewAssetCorrelation(value);
      }
    }
  };

  const handleAssetCorrelationBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0 || value > 1) {
      setNewAssetCorrelation(''); // Reset if invalid
      setError('Correlation factor must be between 0.0 and 1.0.');
    } else {
      setNewAssetCorrelation(value.toFixed(2)); // Format to 2 decimal places
    }
  };

  const handleIndividualAssetCorrelationBlur = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
      handleUpdateCorrelation(id, numValue);
    } else {
      setError('Invalid correlation factor entered.');
      // Optionally reset the input field or show a specific error for that asset
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <Typography variant="h3" gutterBottom sx={{ color: '#003366', fontWeight: 'bold' }}>
        Citibankdemobusinessinc.quantum.portfolio
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
        Monitor and visualize the abstract correlations between your quantum assets. Harnessing the power of entanglement for unparalleled financial insights.
      </Typography>

      {/* Input and Chart Section */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#003366' }}>
                Manage Quantum Assets
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
                  {error}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Asset Name"
                variant="outlined"
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Initial Correlation Factor (0.0 - 1.0)"
                type="text" // Use text for better control over input format
                variant="outlined"
                value={newAssetCorrelation}
                onChange={handleCorrelationInputChange}
                onBlur={handleAssetCorrelationBlur}
                inputProps={{ min: 0, max: 1, step: 0.01 }}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddAsset}
                disabled={!newAssetName.trim() || newAssetCorrelation === '' || loading}
                sx={{ px: 3, py: 1.5, borderRadius: 1 }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Add New Asset'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3, borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#003366' }}>
                Correlation Dynamics
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 250 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 4 }} />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="correlation"
                      stroke="#8884d8"
                      strokeWidth={2}
                      activeDot={{ r: 6, fill: '#8884d8' }}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Asset List Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#003366' }}>
          Quantum Asset Registry
        </Typography>
        <TextField
          fullWidth
          label="Search Assets by Name or ID"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3, backgroundColor: 'white', borderRadius: 1 }}
          InputLabelProps={{ shrink: true }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error && assets.length === 0 ? ( // Show error only if no assets loaded yet
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>{error}</Alert>
        ) : filteredAssets.length === 0 ? (
          <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', mt: 5 }}>
            No quantum assets found matching your search criteria.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredAssets.map(asset => (
              <Grid item key={asset.id} xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', boxShadow: 2, borderRadius: 2, display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: 5 } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" sx={{ color: '#003366', mb: 1 }}>
                      {asset.name}
                    </Typography>
                    <Typography sx={{ mb: 1.5, fontSize: '0.8rem', color: 'text.secondary' }}>
                      ID: {asset.id}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      State: <Typography component="span" variant="body2" sx={{ fontWeight: 'bold', color: asset.state === 'Entangled' ? '#4caf50' : asset.state === 'Decohered' ? '#f44336' : '#2196f3' }}>{asset.state}</Typography>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Correlation Factor: <Typography component="span" variant="body2" sx={{ fontWeight: 'bold' }}>{asset.correlationFactor.toFixed(2)}</Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {new Date(asset.timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                  <CardContent sx={{ mt: 'auto', pt: 0 }}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={8}>
                        <TextField
                          label="Adjust Correlation"
                          type="text"
                          variant="outlined"
                          size="small"
                          defaultValue={asset.correlationFactor.toString()}
                          onBlur={(e) => handleIndividualAssetCorrelationBlur(asset.id, e.target.value)}
                          inputProps={{ min: 0, max: 1, step: 0.01 }}
                          fullWidth
                          sx={{ '& .MuiInputBase-input': { py: 1 } }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Button
                          variant="contained"
                          color="secondary"
                          size="medium"
                          onClick={() => {
                            const newValueStr = prompt(`Enter new correlation for ${asset.name} (0.0-1.0):`, asset.correlationFactor.toString());
                            if (newValueStr !== null) {
                              const newValue = parseFloat(newValueStr);
                              if (!isNaN(newValue) && newValue >= 0 && newValue <= 1) {
                                handleUpdateCorrelation(asset.id, newValue);
                              } else {
                                setError('Invalid input. Please enter a number between 0.0 and 1.0.');
                              }
                            }
                          }}
                          sx={{ width: '100%', py: 1.2, borderRadius: 1 }}
                          disabled={loading}
                        >
                          Set
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default QuantumEntanglementPortfolio;