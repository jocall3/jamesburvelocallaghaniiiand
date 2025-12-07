import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Paper,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line as MapLine
} from 'react-simple-maps';
import ShieldIcon from '@mui/icons-material/Shield';
import GppBadIcon from '@mui/icons-material/GppBad';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import SpeedIcon from '@mui/icons-material/Speed';


// --- THEME ---
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#76ff03', // A vibrant green for highlights
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#b3b3b3',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
});

// --- MOCK DATA GENERATION ---

// Message Flow Data
const generateMessageFlowData = () => {
  const data = [];
  for (let i = 10; i >= 0; i--) {
    const time = new Date();
    time.setMinutes(time.getMinutes() - i);
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pacs008: Math.floor(Math.random() * 200 + 300),
      pacs009: Math.floor(Math.random() * 50 + 80),
      camt053: Math.floor(Math.random() * 100 + 150),
    });
  }
  return data;
};

// Risk Alerts Data
const alertReasons = [
  'AML Threshold Breach',
  'Sanction List Hit (OFAC)',
  'Unusual Activity Pattern',
  'High-Risk Jurisdiction',
  'Transaction Structuring',
  'PEP Match',
];

const alertStatuses = ['Pending Review', 'Investigating', 'Resolved', 'False Positive'];
const generateRiskAlerts = (count: number) => {
  const alerts = [];
  for (let i = 0; i < count; i++) {
    const riskScore = Math.floor(Math.random() * 60 + 40);
    alerts.push({
      id: `TX${Math.floor(Math.random() * 900000) + 100000}`,
      timestamp: new Date(new Date().getTime() - Math.random() * 600000).toISOString(),
      reason: alertReasons[Math.floor(Math.random() * alertReasons.length)],
      riskScore,
      status: alertStatuses[Math.floor(Math.random() * alertStatuses.length)],
      amount: `${(Math.random() * 500000 + 10000).toFixed(2)} USD`,
    });
  }
  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};


// Geographical Risk Data
const geoDataUrl = "https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json";

const highRiskTransactions = [
    { from: "USA", to: "RUS", fromCoords: [-98.5795, 39.8283], toCoords: [105.3188, 61.5240] },
    { from: "GBR", to: "IRN", fromCoords: [-3.4360, 55.3781], toCoords: [53.6880, 32.4279] },
    { from: "CHN", to: "PRK", fromCoords: [104.1954, 35.8617], toCoords: [127.5101, 40.3399] },
    { from: "DEU", to: "SYR", fromCoords: [10.4515, 51.1657], toCoords: [38.9968, 34.8021] },
];

const markers = [
    { markerOffset: -15, name: "New York", coordinates: [-74.006, 40.7128] },
    { markerOffset: 25, name: "London", coordinates: [-0.1278, 51.5074] },
    { markerOffset: 25, name: "Frankfurt", coordinates: [8.6821, 50.1109] },
    { markerOffset: 25, name: "Singapore", coordinates: [103.8198, 1.3521] },
    { markerOffset: -15, name: "Moscow", coordinates: [37.6173, 55.7558] },
    { markerOffset: 25, name: "Tehran", coordinates: [51.3890, 35.6892] },
];


// --- COMPONENTS ---

const KpiCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon}
        <Typography sx={{ ml: 1, color: 'text.secondary', fontWeight: 'bold' }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const getRiskChipColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case 'Pending Review':
      return 'warning';
    case 'Investigating':
      return 'info';
    case 'Resolved':
      return 'success';
    case 'False Positive':
      return 'default';
    default:
      return 'default';
  }
};

const getRiskScoreColor = (score: number) => {
    if (score > 85) return '#f44336'; // red
    if (score > 65) return '#ff9800'; // orange
    return '#ffc107'; // amber
}


export const ComplianceOracleView = () => {
  const [messageFlowData, setMessageFlowData] = useState(generateMessageFlowData());
  const [riskAlerts, setRiskAlerts] = useState(generateRiskAlerts(15));
  const [totalMessages, setTotalMessages] = useState(245890);
  const [highRiskAlertsToday, setHighRiskAlertsToday] = useState(132);
  const [timeFilter, setTimeFilter] = React.useState('24h');

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageFlowData(prevData => {
        const newDataPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pacs008: Math.floor(Math.random() * 200 + 300),
          pacs009: Math.floor(Math.random() * 50 + 80),
          camt053: Math.floor(Math.random() * 100 + 150),
        };
        return [...prevData.slice(1), newDataPoint];
      });

      if (Math.random() > 0.7) { // Occasionally add a new alert
        setRiskAlerts(prevAlerts => [
            ...generateRiskAlerts(1), 
            ...prevAlerts
        ].slice(0,15));
        setHighRiskAlertsToday(prev => prev + 1);
      }
      setTotalMessages(prev => prev + Math.floor(Math.random() * 10));

    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <ShieldIcon color="primary" sx={{ mr: 2, fontSize: '2rem' }} />
            <Typography variant="h5" noWrap sx={{ flexGrow: 1 }}>
              Compliance Oracle Dashboard
            </Typography>
            <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeFilter}
                label="Time Range"
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <MenuItem value={'1h'}>Last Hour</MenuItem>
                <MenuItem value={'6h'}>Last 6 Hours</MenuItem>
                <MenuItem value={'24h'}>Last 24 Hours</MenuItem>
              </Select>
            </FormControl>
          </Toolbar>
        </AppBar>

        <Container maxWidth={false} sx={{ py: 3, flexGrow: 1, overflowY: 'auto' }}>
          <Grid container spacing={3}>
            {/* KPIs */}
            <Grid xs={12} sm={6} md={3}>
              <KpiCard title="Total Messages (24h)" value={totalMessages.toLocaleString()} icon={<AllInboxIcon color="primary"/>} />
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <KpiCard title="High-Risk Alerts (24h)" value={highRiskAlertsToday.toLocaleString()} icon={<GppBadIcon color="error"/>} />
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <KpiCard title="Avg. Resolution Time" value="45 min" icon={<HourglassTopIcon color="info"/>} />
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <KpiCard title="Sanction Hit Rate" value="0.02%" icon={<SyncProblemIcon color="warning"/>} />
            </Grid>

            {/* Message Flow Chart */}
            <Grid xs={12} lg={8}>
              <Paper sx={{ p: 2, height: '400px' }}>
                 <Typography variant="h6" gutterBottom>Real-Time Message Flow</Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={messageFlowData}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="time" stroke={darkTheme.palette.text.secondary} />
                    <YAxis stroke={darkTheme.palette.text.secondary} />
                    <Tooltip contentStyle={{ backgroundColor: darkTheme.palette.background.paper, border: `1px solid ${darkTheme.palette.divider}`}}/>
                    <Legend />
                    <Line type="monotone" dataKey="pacs008" name="pacs.008 (Payments)" stroke="#82ca9d" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pacs009" name="pacs.009 (FI Credit)" stroke="#8884d8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="camt053" name="camt.053 (Statements)" stroke="#ff