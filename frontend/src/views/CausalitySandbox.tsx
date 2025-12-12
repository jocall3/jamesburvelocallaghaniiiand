import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Box,
  Alert,
  IconButton,
  Collapse,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

// --- Types ---

interface Simulation {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime: number;
  progress: number; // 0 to 100
  parameters: {
    model: string;
    duration: number; // in steps/days
    shockMagnitude: number;
  };
}

// --- Mock Data & API Simulation ---

const MOCK_MODELS = [
  { value: 'keynesian_dsge', label: 'DSGE Macro Model' },
  { value: 'agent_based_synth', label: 'Agent-Based Simulation (Synthetic)' },
  { value: 'input_output_ramsey', label: 'I/O Model (Ramsey Growth)' },
];

const initialSimulations: Simulation[] = [
  {
    id: 'sim-001',
    name: 'Baseline Inflation Shock - Q3 2024',
    status: 'COMPLETED',
    startTime: Date.now() - 3600000,
    progress: 100,
    parameters: {
      model: 'keynesian_dsge',
      duration: 60,
      shockMagnitude: 0.05,
    },
  },
  {
    id: 'sim-002',
    name: 'Policy Change Test Alpha',
    status: 'RUNNING',
    startTime: Date.now() - 120000,
    progress: 45,
    parameters: {
      model: 'agent_based_synth',
      duration: 120,
      shockMagnitude: 0.10,
    },
  },
];

const useSimulationAPI = () => {
  const [simulations, setSimulations] = useState<Simulation[]>(initialSimulations);

  // Simulate background progress update
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulations(prevSims =>
        prevSims.map(sim => {
          if (sim.status === 'RUNNING') {
            const newProgress = Math.min(100, sim.progress + Math.random() * 5);
            if (newProgress >= 100) {
              return { ...sim, status: 'COMPLETED', progress: 100 };
            }
            return { ...sim, progress: newProgress };
          }
          return sim;
        })
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const launchSimulation = (name: string, model: string, duration: number, shockMagnitude: number) => {
    const newSim: Simulation = {
      id: `sim-${Date.now()}`,
      name,
      status: 'PENDING',
      startTime: Date.now(),
      progress: 0,
      parameters: { model, duration, shockMagnitude },
    };

    setSimulations(prevSims => [...prevSims, newSim]);

    // Simulate starting the process after a short delay
    setTimeout(() => {
      setSimulations(prevSims =>
        prevSims.map(sim =>
          sim.id === newSim.id ? { ...sim, status: 'RUNNING', progress: 1 } : sim
        )
      );
    }, 1000);
  };

  const stopSimulation = (id: string) => {
    setSimulations(prevSims =>
      prevSims.map(sim =>
        sim.id === id && sim.status === 'RUNNING'
          ? { ...sim, status: 'FAILED', progress: 0, name: sim.name + ' (TERMINATED)' }
          : sim
      )
    );
  };

  return { simulations, launchSimulation, stopSimulation };
};

// --- Styled Components ---

const RootContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const PaperStyled = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  minHeight: 150,
}));

const StatusIndicator = styled('span')<{ status: Simulation['status'] }>(({ theme, status }) => {
  let color = '#ccc';
  switch (status) {
    case 'RUNNING':
      color = theme.palette.primary.main;
      break;
    case 'COMPLETED':
      color = theme.palette.success.main;
      break;
    case 'FAILED':
      color = theme.palette.error.main;
      break;
    case 'PENDING':
      color = theme.palette.warning.main;
      break;
    default:
      break;
  }
  return {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: color,
    marginRight: theme.spacing(1),
  };
});

// --- Components ---

interface LaunchFormProps {
  onLaunch: (name: string, model: string, duration: number, shockMagnitude: number) => void;
}

const LaunchForm: React.FC<LaunchFormProps> = ({ onLaunch }) => {
  const [name, setName] = useState('New Simulation Run');
  const [model, setModel] = useState(MOCK_MODELS[0].value);
  const [duration, setDuration] = useState(90);
  const [shockMagnitude, setShockMagnitude] = useState(0.05);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || duration <= 0 || shockMagnitude <= 0) {
      setFormError("Please fill in all fields correctly.");
      return;
    }

    onLaunch(name, model, duration, shockMagnitude);
    setName(`New Run ${new Date().toLocaleTimeString()}`);
  };

  return (
    <PaperStyled component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Launch New Simulation
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <label htmlFor="sim-name">Simulation Name</label>
          <input
            id="sim-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
            required
          />
        </Grid>
        <Grid item xs={6}>
          <label htmlFor="model-select">Economic Model</label>
          <select
            id="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
          >
            {MOCK_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Grid>
        <Grid item xs={3}>
          <label htmlFor="duration-input">Duration (Days)</label>
          <input
            id="duration-input"
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            min="1"
            style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
            required
          />
        </Grid>
        <Grid item xs={3}>
          <label htmlFor="shock-input">Shock Magnitude (%)</label>
          <input
            id="shock-input"
            type="number"
            step="0.01"
            value={shockMagnitude}
            onChange={(e) => setShockMagnitude(parseFloat(e.target.value) || 0)}
            min="0.01"
            style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
            required
          />
        </Grid>

        {formError && (
          <Grid item xs={12}>
            <Alert severity="error">{formError}</Alert>
          </Grid>
        )}

        <Grid item xs={12} sx={{ textAlign: 'right' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            disabled={name.length === 0 || duration <= 0 || shockMagnitude <= 0}
          >
            Start Simulation
          </Button>
        </Grid>
      </Grid>
    </PaperStyled>
  );
};

interface SimulationTableProps {
  simulations: Simulation[];
  onStop: (id: string) => void;
}

const SimulationTable: React.FC<SimulationTableProps> = ({ simulations, onStop }) => {
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString();

  const SimulationRow: React.FC<{ sim: Simulation }> = ({ sim }) => {
    const [open, setOpen] = useState(false);

    const getStatusColor = (status: Simulation['status']) => {
      switch (status) {
        case 'RUNNING':
          return 'primary';
        case 'COMPLETED':
          return 'success';
        case 'FAILED':
          return 'error';
        default:
          return 'secondary';
      }
    };

    return (
      <>
        <TableRow hover>
          <TableCell>
            <IconButton size="small" onClick={() => setOpen(!open)}>
              <InfoIcon fontSize="inherit" />
            </IconButton>
          </TableCell>
          <TableCell component="th" scope="row">
            <StatusIndicator status={sim.status} />
            {sim.name}
          </TableCell>
          <TableCell>{sim.parameters.model}</TableCell>
          <TableCell>{sim.parameters.duration} Days</TableCell>
          <TableCell>{(sim.parameters.shockMagnitude * 100).toFixed(1)}%</TableCell>
          <TableCell>{formatTime(sim.startTime)}</TableCell>
          <TableCell>
            <Typography variant="body2" color={`text.${getStatusColor(sim.status)}`}>
              {sim.status}
            </Typography>
          </TableCell>
          <TableCell align="right">
            {sim.status === 'RUNNING' ? (
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<StopIcon />}
                onClick={() => onStop(sim.id)}
              >
                Terminate
              </Button>
            ) : (
              <Typography variant="caption">N/A</Typography>
            )}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1, padding: 2 }} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="subtitle2" gutterBottom>
                  Run Details (ID: {sim.id})
                </Typography>
                <Typography variant="body2" component="div" gutterBottom>
                  Progress:
                  <Box sx={{ width: '100%', marginY: 0.5 }}>
                    <LinearProgress
                      variant={sim.status === 'RUNNING' ? 'determinate' : 'determinate'}
                      value={sim.progress}
                      color={getStatusColor(sim.status)}
                    />
                  </Box>
                  {sim.status === 'RUNNING' && `${sim.progress.toFixed(1)}% Complete`}
                  {sim.status === 'COMPLETED' && "Simulation complete. Analyzing results..."}
                  {sim.status === 'PENDING' && "Awaiting resource allocation..."}
                </Typography>
                <Typography variant="body2">
                  Environment: GCP Compute Cluster 4
                </Typography>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <PaperStyled>
      <Typography variant="h6" gutterBottom>
        Active & Completed Simulations
      </Typography>
      <TableContainer>
        <Table size="small" aria-label="simulation table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '30px' }}></TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Shock</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {simulations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No simulations currently registered.
                </TableCell>
              </TableRow>
            ) : (
              simulations
                .sort((a, b) => b.startTime - a.startTime) // Sort by newest first
                .map((sim) => <SimulationRow key={sim.id} sim={sim} />)
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </PaperStyled>
  );
};

const QuickStats: React.FC<{ simulations: Simulation[] }> = ({ simulations }) => {
  const totalRuns = simulations.length;
  const running = simulations.filter(s => s.status === 'RUNNING').length;
  const completed = simulations.filter(s => s.status === 'COMPLETED').length;
  const failed = simulations.filter(s => s.status === 'FAILED').length;

  const StatCard: React.FC<{ title: string, value: number, color: string }> = ({ title, value, color }) => (
    <Paper sx={{ p: 2, textAlign: 'center', borderLeft: `5px solid ${color}` }}>
      <Typography variant="h4" color={color}>
        {value}
      </Typography>
      <Typography variant="subtitle2" color="text.secondary">
        {title}
      </Typography>
    </Paper>
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={3}>
        <StatCard title="Total Runs" value={totalRuns} color="#3f51b5" />
      </Grid>
      <Grid item xs={3}>
        <StatCard title="Currently Running" value={running} color="#2196f3" />
      </Grid>
      <Grid item xs={3}>
        <StatCard title="Completed Successfully" value={completed} color="#4caf50" />
      </Grid>
      <Grid item xs={3}>
        <StatCard title="Terminated/Failed" value={failed} color="#f44336" />
      </Grid>
    </Grid>
  );
};

const InfoAlert: React.FC = () => {
  const [open, setOpen] = useState(true);

  return (
    <Collapse in={open}>
      <Alert
        severity="info"
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => {
              setOpen(false);
            }}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{ mb: 3 }}
      >
        Welcome to the Causality Sandbox Command Center. Launch large-scale economic simulations here by configuring models, shocks, and duration parameters. Results are streamed live in the table below.
      </Alert>
    </Collapse>
  );
};


// --- Main Component ---

const CausalitySandbox: React.FC = () => {
  const { simulations, launchSimulation, stopSimulation } = useSimulationAPI();

  return (
    <RootContainer maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Causality Sandbox Command Center
      </Typography>

      <InfoAlert />

      <QuickStats simulations={simulations} />
      
      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} lg={4}>
          <LaunchForm onLaunch={launchSimulation} />
        </Grid>
        <Grid item xs={12} lg={8}>
          <SimulationTable simulations={simulations} onStop={stopSimulation} />
        </Grid>
      </Grid>

      <PaperStyled sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
            Monitoring Dashboard Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">Cluster Health:</Typography>
            <Typography color="success.main" fontWeight="bold">OPTIMAL</Typography>
            <LinearProgress variant="buffer" value={95} sx={{ flexGrow: 1, height: 10 }} />
            <Typography variant="caption">95% Utilization</Typography>
        </Box>
      </PaperStyled>

    </RootContainer>
  );
};

export default CausalitySandbox;