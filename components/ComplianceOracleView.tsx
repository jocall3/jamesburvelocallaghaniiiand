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

import ShieldIcon from '@mui/icons-material/Shield';
import GppBadIcon from '@mui/icons-material/GppBad';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import SpeedIcon from '@mui/icons-material/Speed';

// --- Leaflet Imports ---
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- THEME ---
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#76ff03' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: { primary: '#e0e0e0', secondary: '#b3b3b3' },
  },
  typography: {
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 }
  }
});

// --- MOCK DATA ---
const generateMessageFlowData = () => {
  const data = [];
  for (let i = 10; i >= 0; i--) {
    const time = new Date();
    time.setMinutes(time.getMinutes() - i);
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pacs008: Math.random() * 200 + 300,
      pacs009: Math.random() * 50 + 80,
      camt053: Math.random() * 100 + 150,
    });
  }
  return data;
};

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
      timestamp: new Date(Date.now() - Math.random() * 600000).toISOString(),
      reason: alertReasons[Math.floor(Math.random() * alertReasons.length)],
      riskScore,
      status: alertStatuses[Math.floor(Math.random() * alertStatuses.length)],
      amount: `${(Math.random() * 500000 + 10000).toFixed(2)} USD`,
    });
  }
  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// High-risk transaction routes
const highRiskTransactions = [
  { fromCoords: [-98.5795, 39.8283], toCoords: [105.3188, 61.5240] }, // USA -> Russia
  { fromCoords: [-3.4360, 55.3781], toCoords: [53.6880, 32.4279] },  // UK -> Iran
  { fromCoords: [104.1954, 35.8617], toCoords: [127.5101, 40.3399] }, // China -> NK
  { fromCoords: [10.4515, 51.1657], toCoords: [38.9968, 34.8021] }, // Germany -> Syria
];

// Map markers
const markers = [
  { name: "New York", coordinates: [-74.006, 40.7128] },
  { name: "London", coordinates: [-0.1278, 51.5074] },
  { name: "Frankfurt", coordinates: [8.6821, 50.1109] },
  { name: "Singapore", coordinates: [103.8198, 1.3521] },
  { name: "Moscow", coordinates: [37.6173, 55.7558] },
  { name: "Tehran", coordinates: [51.3890, 35.6892] },
];

// --- COMPONENTS ---
const KpiCard = ({ title, value, icon }: { title: string; value: string; icon: any }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon}
        <Typography sx={{ ml: 1, color: 'text.secondary', fontWeight: 'bold' }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4">{value}</Typography>
    </CardContent>
  </Card>
);

const getRiskChipColor = (status: string) => ({
  'Pending Review': 'warning',
  'Investigating': 'info',
  'Resolved': 'success',
  'False Positive': 'default',
}[status] || 'default');

const getRiskScoreColor = (score: number) =>
  score > 85 ? '#f44336' : score > 65 ? '#ff9800' : '#ffc107';


// --- MAIN VIEW ---
export const ComplianceOracleView = () => {
  const [messageFlowData, setMessageFlowData] = useState(generateMessageFlowData());
  const [riskAlerts, setRiskAlerts] = useState(generateRiskAlerts(15));
  const [totalMessages, setTotalMessages] = useState(245890);
  const [highRiskAlertsToday, setHighRiskAlertsToday] = useState(132);
  const [timeFilter, setTimeFilter] = useState('24h');

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageFlowData(prev => {
        const next = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pacs008: Math.random() * 200 + 300,
          pacs009: Math.random() * 50 + 80,
          camt053: Math.random() * 100 + 150,
        };
        return [...prev.slice(1), next];
      });

      if (Math.random() > 0.7) {
        setRiskAlerts(prev => [...generateRiskAlerts(1), ...prev].slice(0, 15));
        setHighRiskAlertsToday(a => a + 1);
      }

      setTotalMessages(t => t + Math.floor(Math.random() * 10));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <ShieldIcon color="primary" sx={{ mr: 2, fontSize: '2rem' }} />
            <Typography variant="h5" sx={{ flexGrow: 1 }}>
              Compliance Oracle Dashboard
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeFilter}
                label="Time Range"
                onChange={e => setTimeFilter(e.target.value)}
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
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                title="Total Messages (24h)"
                value={totalMessages.toLocaleString()}
                icon={<AllInboxIcon color="primary" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                title="High-Risk Alerts (24h)"
                value={highRiskAlertsToday.toLocaleString()}
                icon={<GppBadIcon color="error" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Avg. Resolution Time" value="45 min" icon={<HourglassTopIcon color="info" />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Sanction Hit Rate" value="0.02%" icon={<SyncProblemIcon color="warning" />} />
            </Grid>

            {/* Message Flow Chart */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 2, height: '400px' }}>
                <Typography variant="h6">Real-Time Message Flow</Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={messageFlowData}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pacs008" name="pacs.008" stroke="#82ca9d" dot={false} />
                    <Line type="monotone" dataKey="pacs009" name="pacs.009" stroke="#8884d8" dot={false} />
                    <Line type="monotone" dataKey="camt053" name="camt.053" stroke="#ffc658" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Compliance Status */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 2, height: '400px' }}>
                <Typography variant="h6">Regulatory Compliance Status</Typography>
                <Box sx={{ mt: 2 }}>
                  {[
                    { name: 'BSA/AML Reporting', status: 'Compliant' },
                    { name: 'OFAC Sanctions Screening', status: 'Compliant' },
                    { name: 'MiFID II Transaction Reporting', status: 'Compliant' },
                    { name: 'GDPR Data Privacy', status: 'Compliant' },
                    { name: 'FATF Travel Rule', status: 'Monitoring' },
                  ].map(reg => (
                    <Box key={reg.name} sx={{ display: 'flex', mb: 2 }}>
                      {reg.status === 'Compliant'
                        ? <CheckCircleIcon color="success" />
                        : <SpeedIcon color="warning" />}
                      <Typography sx={{ ml: 2, flexGrow: 1 }}>{reg.name}</Typography>
                      <Chip label={reg.status} color={reg.status === 'Compliant' ? 'success' : 'warning'} />
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* Alerts Table */}
            <Grid item xs={12} lg={7}>
              <Paper sx={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ p: 2, pb: 0 }}>Recent High-Risk Alerts</Typography>
                <TableContainer sx={{ flexGrow: 1 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Transaction ID</TableCell>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell align="center">Risk Score</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {riskAlerts.map(alert => (
                        <TableRow hover key={alert.id}>
                          <TableCell>{alert.id}</TableCell>
                          <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{alert.reason}</TableCell>
                          <TableCell>{alert.amount}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={alert.riskScore}
                              sx={{
                                backgroundColor: getRiskScoreColor(alert.riskScore),
                                color: '#000',
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip label={alert.status} color={getRiskChipColor(alert.status)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Leaflet Map */}
            <Grid item xs={12} lg={5}>
              <Paper sx={{ p: 2, height: '500px' }}>
                <Typography variant="h6" gutterBottom>Geographical Risk Flow</Typography>
                <Box sx={{ height: '430px', borderRadius: 2, overflow: 'hidden' }}>
                  <MapContainer
                    center={[20, 0]}
                    zoom={2}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Red Polylines */}
                    {highRiskTransactions.map((tx, i) => (
                      <Polyline
                        key={i}
                        positions={[
                          [tx.fromCoords[1], tx.fromCoords[0]],
                          [tx.toCoords[1], tx.toCoords[0]]
                        ]}
                        pathOptions={{ color: '#f44336', weight: 3, opacity: 0.7 }}
                      />
                    ))}

                    {/* Markers */}
                    {markers.map(m => (
                      <Marker key={m.name} position={[m.coordinates[1], m.coordinates[0]]}>
                        <Popup>
                          <strong>{m.name}</strong><br />
                          Risk Node Active
                        </Popup>
                      </Marker>
                    ))}

                  </MapContainer>
                </Box>
              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};