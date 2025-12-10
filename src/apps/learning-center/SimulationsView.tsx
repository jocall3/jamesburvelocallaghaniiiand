```typescript
import React, { useState, useEffect } from 'react';
import { Typography, Button, Grid, Paper, CircularProgress, Alert } from '@mui/material';

interface SimulationResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  output?: string;
  error?: string;
}

const SimulationsView: React.FC = () => {
  const [simulations, setSimulations] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock API calls
  const fetchSimulations = async (): Promise<SimulationResult[]> => {
    // Simulate fetching data from an API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'sim-1', name: 'Market Volatility', status: 'completed', progress: 100, output: 'Scenario A: 5% gain. Scenario B: -2% loss.' },
          { id: 'sim-2', name: 'Interest Rate Hike', status: 'running', progress: 75 },
          { id: 'sim-3', name: 'Inflation Impact', status: 'pending', progress: 0 },
        ]);
      }, 1000);
    });
  };

  const startSimulation = async (name: string): Promise<SimulationResult> => {
    // Simulate starting a new simulation
    setLoading(true); // Optimistic UI update
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const newSim: SimulationResult = {
          id: `sim-${Date.now()}`,
          name,
          status: 'running',
          progress: 0,
        };
        setSimulations(prev => [...prev, newSim]);
        setLoading(false);
        resolve(newSim);
      }, 500);
    });
  };

  const pollSimulationStatus = (id: string) => {
    const intervalId = setInterval(() => {
      // Simulate fetching updated status
      fetchSimulations().then(allSims => {
        const updatedSim = allSims.find(s => s.id === id);
        if (updatedSim) {
          setSimulations(prev => prev.map(s => (s.id === id ? updatedSim : s)));
          if (updatedSim.status !== 'running' && updatedSim.status !== 'pending') {
            clearInterval(intervalId);
          }
        }
      }).catch(err => {
        console.error("Error polling simulation status:", err);
        clearInterval(intervalId);
        setError("Failed to get simulation status.");
      });
    }, 5000); // Poll every 5 seconds
  };

  useEffect(() => {
    setLoading(true);
    fetchSimulations()
      .then(data => {
        setSimulations(data);
        data.forEach(sim => {
          if (sim.status === 'running' || sim.status === 'pending') {
            pollSimulationStatus(sim.id);
          }
        });
      })
      .catch(err => {
        console.error("Error fetching simulations:", err);
        setError("Failed to load simulations.");
      })
      .finally(() => setLoading(false));

    // Cleanup interval on component unmount
    return () => {
      // In a real app, you'd have a way to clear intervals associated with unmounted components
      // For this example, we'll assume intervals are managed or this is a simplified cleanup.
    };
  }, []);

  const handleStartNewSimulation = async (simulationName: string) => {
    try {
      const newSim = await startSimulation(simulationName);
      pollSimulationStatus(newSim.id);
    } catch (err) {
      console.error("Error starting simulation:", err);
      setError(`Failed to start simulation "${simulationName}".`);
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Financial Simulations
      </Typography>
      <Button variant="contained" color="primary" onClick={() => handleStartNewSimulation("New Scenario " + (simulations.length + 1))} disabled={loading}>
        Start New Simulation
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && <CircularProgress sx={{ mt: 2 }} />}

      <Grid container spacing={3} sx={{ mt: 3 }}>
        {simulations.map((sim) => (
          <Grid item key={sim.id} xs={12} sm={6} md={4}>
            <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 150 }}>
              <Typography variant="h6" gutterBottom>
                {sim.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {sim.status.charAt(0).toUpperCase() + sim.status.slice(1)}
              </Typography>
              {sim.status === 'running' || sim.status === 'pending' ? (
                <div style={{ width: '100%', marginTop: 'auto' }}>
                  <Typography variant="caption">{sim.progress}% Complete</Typography>
                  <CircularProgress variant="determinate" value={sim.progress} sx={{ width: '100% !important', height: '8px' }} />
                </div>
              ) : sim.status === 'completed' && sim.output ? (
                <Typography variant="body1" sx={{ mt: 2, flexGrow: 1 }}>
                  Result: {sim.output}
                </Typography>
              ) : sim.status === 'failed' && sim.error ? (
                <Typography variant="body1" color="error" sx={{ mt: 2, flexGrow: 1 }}>
                  Error: {sim.error}
                </Typography>
              ) : (
                <div style={{ marginTop: 'auto' }}></div>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default SimulationsView;
```