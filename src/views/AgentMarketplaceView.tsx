```typescript
import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    CircularProgress,
    Snackbar,
    Alert,
    Avatar,
    IconButton,
    Tooltip,
    CardActions
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { ethers } from 'ethers'; // Import ethers
import { Agent } from '../models/Agent';
import { Job } from '../models/Job'; // Import the Job model
import { User } from '../models/User'; // Import the User model
import { getAgents } from '../services/agentService';
import { createJob } from '../services/jobService'; // Import the job creation service
import { useAuth } from '../contexts/AuthContext'; // Import the authentication context
import { useNavigate } from 'react-router-dom';

interface AgentCardProps {
    agent: Agent;
    onHire: (agent: Agent, configuration: any) => void;
}

// Mock agent data - replace with API calls later
const mockAgents: Agent[] = [
    {
        id: '1',
        name: 'Algorithmic Trader',
        description: 'Executes automated trades based on predefined algorithms.',
        price: 100,
        image: '/images/agent1.png', // Path to agent image
        tasks: ['Automated trading', 'Risk management', 'Portfolio rebalancing'],
        parameters: [
            { name: 'Risk Tolerance', type: 'number', description: 'Acceptable level of risk (1-10)' },
            { name: 'Trading Pair', type: 'string', description: 'Cryptocurrency trading pair (e.g., BTC/USD)' }
        ]
    },
    {
        id: '2',
        name: 'DeFi Yield Optimizer',
        description: 'Automatically finds and allocates funds to high-yield DeFi protocols.',
        price: 150,
        image: '/images/agent2.png', // Path to agent image
        tasks: ['Yield farming', 'Liquidity providing', 'Protocol analysis'],
        parameters: [
            { name: 'Investment Amount', type: 'number', description: 'Amount to invest in DeFi protocols' },
            { name: 'Max Allocation per Protocol', type: 'number', description: 'Maximum percentage allocation to each protocol' }
        ]
    },
    {
        id: '3',
        name: 'Crypto Arbitrage Bot',
        description: 'Exploits price differences between cryptocurrency exchanges.',
        price: 120,
        image: '/images/agent3.png', // Path to agent image
        tasks: ['Cross-exchange arbitrage', 'Price monitoring', 'Order execution'],
        parameters: [
            { name: 'Minimum Profit Margin', type: 'number', description: 'Minimum acceptable profit margin for arbitrage' },
            { name: 'Exchange 1', type: 'string', description: 'First exchange for arbitrage' },
            { name: 'Exchange 2', type: 'string', description: 'Second exchange for arbitrage' }
        ]
    },
];

const AgentCard: React.FC<AgentCardProps> = ({ agent, onHire }) => {
    const [open, setOpen] = useState(false);
    const [configuration, setConfiguration] = useState<any>({});

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setConfiguration({}); // Reset configuration on close
    };

    const handleHire = () => {
        onHire(agent, configuration);
        handleClose();
    };

    const handleConfigurationChange = (event: React.ChangeEvent<HTMLInputElement>, parameterName: string) => {
        setConfiguration({ ...configuration, [parameterName]: event.target.value });
    };

    return (
        <>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Avatar
                            alt={agent.name}
                            src={agent.image}
                            sx={{ width: 80, height: 80 }}
                        />
                    </Box>
                    <Typography variant="h5" component="div">
                        {agent.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {agent.description}
                    </Typography>
                    <Typography variant="subtitle1" mt={2}>
                        Price: ${agent.price}
                    </Typography>
                    <Typography variant="subtitle2" mt={1}>
                        Tasks:
                    </Typography>
                    <ul>
                        {agent.tasks.map((task, index) => (
                            <li key={index}>{task}</li>
                        ))}
                    </ul>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', padding: '16px' }}>
                    <Button variant="contained" color="primary" onClick={handleClickOpen}>
                        Configure & Hire
                    </Button>
                </CardActions>
            </Card>


            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>Configure {agent.name}</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        Please configure the agent parameters below:
                    </Typography>
                    {agent.parameters && agent.parameters.length > 0 ? (
                        agent.parameters.map((param, index) => (
                            <TextField
                                key={index}
                                autoFocus
                                margin="dense"
                                id={param.name.replace(" ", "").toLowerCase()}
                                label={param.name}
                                type={param.type === 'number' ? 'number' : 'text'}
                                fullWidth
                                variant="standard"
                                value={configuration[param.name] || ''}
                                onChange={(event) => handleConfigurationChange(event, param.name)}
                                helperText={param.description}
                            />
                        ))
                    ) : (
                        <Typography variant="body2">No configuration parameters needed for this agent.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleHire} variant="contained" color="primary">
                        Hire
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};


const AgentMarketplaceView: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { currentUser } = useAuth();
    const navigate = useNavigate();


    useEffect(() => {
        const fetchAgentsData = async () => {
            try {
                setLoading(true);
                // Replace with API call once implemented
                //const fetchedAgents = await getAgents();
                setAgents(mockAgents); //Use mock data
                setLoading(false);
            } catch (err: any) {
                setError(err.message || 'Failed to load agents.');
                setLoading(false);
            }
        };

        fetchAgentsData();
    }, []);

    const handleHireAgent = async (agent: Agent, configuration: any) => {
        if (!currentUser) {
            navigate('/login'); // Redirect to login if not authenticated
            return;
        }

        try {
            // Basic validation - ensure all required parameters are provided
            for (const param of agent.parameters || []) {
                if (!configuration[param.name]) {
                    setError(`Please provide a value for ${param.name}.`);
                    return;
                }
            }

            setLoading(true);

            // Prepare the job data for the createJob service
            const jobData: Job = {
                agentId: agent.id,
                configuration: configuration,
                status: 'Pending', // Initial status
                startedAt: new Date(), // Mark the job as starting now
                completedAt: null,   // Not completed yet
                userId: currentUser.uid, // Store the Firebase UID
            };

            // Call the createJob service to create the job in Firebase
            await createJob(jobData);

            setSuccessMessage(`${agent.name} hired successfully! Check your dashboard for job status.`);
        } catch (err: any) {
            setError(err.message || 'Failed to hire agent.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setError(null);
        setSuccessMessage(null);
    };


    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Agent Marketplace
            </Typography>
            <Typography variant="body1" paragraph>
                Browse our selection of autonomous AI agents for financial tasks. Configure and hire agents to automate your
                investment strategies.
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" onClose={handleCloseSnackbar}>{error}</Alert>
            ) : (
                <Grid container spacing={3}>
                    {agents.map((agent) => (
                        <Grid item xs={12} sm={6} md={4} key={agent.id}>
                            <AgentCard agent={agent} onHire={handleHireAgent} />
                        </Grid>
                    ))}
                </Grid>
            )}
            <Snackbar open={!!error || !!successMessage} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {error ? (
                    <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
                        {error}
                    </Alert>
                ) : successMessage ? (
                    <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                        {successMessage}
                    </Alert>
                ) : null}
            </Snackbar>
        </Container>
    );
};

export default AgentMarketplaceView;
```