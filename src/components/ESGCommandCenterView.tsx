import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Typography,
  Box,
  Button,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Gauge as GaugeIcon,
  TrendingUp as TrendingUpIcon,
  UploadFile as UploadFileIcon,
  Description as DescriptionIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// --- Mock Data & Types ---

interface MetricData {
  name: string;
  value: number;
  target: number;
  unit: string;
}

interface TimeSeriesData {
  name: string;
  data: { x: string; y: number }[];
}

interface ComplianceDocument {
  id: number;
  name: string;
  type: 'Policy' | 'Report' | 'Certification';
  dateUploaded: string;
  status: 'Verified' | 'Pending Review' | 'Expired';
}

const mockESGData = {
  overallScore: 78,
  eScore: 85,
  sScore: 72,
  gScore: 75,
  metrics: [
    { name: 'Carbon Emissions (tCO2e)', value: 15000, target: 12000, unit: 't' },
    { name: 'Water Usage (ML)', value: 450, target: 400, unit: 'ML' },
    { name: 'Workforce Diversity (%)', value: 35, target: 40, unit: '%' },
    { name: 'Board Independence (%)', value: 60, target: 65, unit: '%' },
  ],
  timeSeries: [
    {
      name: 'Carbon Emissions',
      data: [
        { x: '2022 Q1', y: 18000 },
        { x: '2022 Q2', y: 17500 },
        { x: '2022 Q3', y: 16000 },
        { x: '2022 Q4', y: 15000 },
        { x: '2023 Q1', y: 14800 },
        { x: '2023 Q2', y: 14500 },
      ],
    },
    {
      name: 'Water Usage',
      data: [
        { x: '2022 Q1', y: 500 },
        { x: '2022 Q2', y: 480 },
        { x: '2022 Q3', y: 460 },
        { x: '2022 Q4', y: 450 },
        { x: '2023 Q1', y: 440 },
        { x: '2023 Q2', y: 435 },
      ],
    },
  ],
  complianceDocs: [
    { id: 1, name: '2023 Sustainability Report', type: 'Report', dateUploaded: '2024-01-15', status: 'Verified' },
    { id: 2, name: 'Global Water Policy v3.1', type: 'Policy', dateUploaded: '2023-11-01', status: 'Verified' },
    { id: 3, name: 'ISO 14001 Certification', type: 'Certification', dateUploaded: '2024-03-20', status: 'Pending Review' },
  ] as ComplianceDocument[],
};

// --- Utility Components (Self-Contained Mock Chart/Gauge) ---

// Mock Gauge Component (Replaces external charting libraries)
const MockGauge: React.FC<{ score: number; title: string }> = ({ score, title }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const color = normalizedScore >= 80 ? 'success' : normalizedScore >= 60 ? 'warning' : 'error';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={title} avatar={<GaugeIcon color="primary" />} />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ position: 'relative', width: 120, height: 120 }}>
          {/* Mock SVG Circle for Gauge */}
          <svg width="120" height="120" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" strokeWidth="10" />
            {/* Progress Arc */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={2 * Math.PI * 45 * (1 - normalizedScore / 100)}
              stroke={
                score >= 80 ? '#2e7d32' : score >= 60 ? '#ff9800' : '#d32f2f'
              }
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            />
          </svg>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h4" component="div" color="text.primary">
              {score}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Mock Line Chart Component (Replaces external charting libraries)
const MockLineChart: React.FC<{ data: TimeSeriesData }> = ({ data }) => {
  const { name, data: points } = data;
  const values = points.map(p => p.y);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue;

  const getPath = useCallback((width: number, height: number) => {
    if (points.length < 2) return '';

    const xScale = (index: number) => (width / (points.length - 1)) * index;
    const yScale = (value: number) => height - ((value - minValue) / range) * height;

    const pathData = points.map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.y);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return pathData;
  }, [points, minValue, range]);

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title={`${name} Trend`} avatar={<TrendingUpIcon color="secondary" />} />
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Tracking performance over the last 6 periods.
        </Typography>
        <Box sx={{ height: 250, width: '100%', p: 1 }}>
          <svg width="100%" height="100%" viewBox="0 0 400 250">
            {/* X-Axis Labels */}
            {points.map((point, index) => (
              <text
                key={index}
                x={(400 / (points.length - 1)) * index}
                y={240}
                fontSize="10"
                textAnchor="middle"
                fill="#666"
              >
                {point.x}
              </text>
            ))}

            {/* Y-Axis Grid Lines (Simplified) */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line
                key={i}
                x1="0"
                y1={250 - (250 * ratio)}
                x2="380"
                y2={250 - (250 * ratio)}
                stroke="#eee"
                strokeWidth="1"
              />
            ))}

            {/* Line Path */}
            <path
              d={getPath(380, 220)}
              fill="none"
              stroke="#1976d2"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Data Points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={(400 / (points.length - 1)) * index}
                cy={250 - ((point.y - minValue) / range) * 220}
                r="4"
                fill="#1976d2"
                stroke="#fff"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </Box>
      </CardContent>
    </Card>
  );
};

// --- Main Component ---

const ESGCommandCenterView: React.FC = () => {
  const [docs, setDocs] = useState<ComplianceDocument[]>(mockESGData.complianceDocs);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleUploadFile = (file: File) => {
    console.log('Uploading file:', file.name);
    // Mock upload logic
    const newDoc: ComplianceDocument = {
      id: Date.now(),
      name: file.name,
      type: 'Policy', // Simplified type assignment for mock
      dateUploaded: new Date().toISOString().split('T')[0],
      status: 'Pending Review',
    };
    setDocs((prev) => [...prev, newDoc]);
    setUploadDialogOpen(false);
  };

  const handleDeleteDoc = useCallback((id: number) => {
    setDocs((prev) => prev.filter(doc => doc.id !== id));
  }, []);

  const handleGenerateReport = () => {
    alert('Generating comprehensive ESG PDF Report for stakeholders...');
    // In a real app, this would trigger an API call to generate and download a PDF.
  };

  const renderMetricCard = (metric: MetricData) => {
    const progress = (metric.value / metric.target) * 100;
    const isExceeded = metric.value > metric.target && metric.unit !== '%';
    const color = isExceeded ? 'error' : progress >= 80 ? 'primary' : 'warning';

    return (
      <Card key={metric.name}>
        <CardHeader title={metric.name} />
        <CardContent>
          <Typography variant="h4" component="div" color={`var(--mui-color-${color}.main)`}>
            {metric.value.toLocaleString()} {metric.unit}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Target: {metric.target.toLocaleString()} {metric.unit}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, progress)}
            color={color}
            sx={{ height: 10, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {isExceeded ? 'Target Exceeded (Negative)' : progress >= 100 ? 'Target Met' : 'On Track'}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const ComplianceUploadDialog = () => {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        setFile(event.target.files[0]);
      }
    };

    const handleConfirmUpload = () => {
      if (file) {
        handleUploadFile(file);
        setFile(null);
      }
    };

    return (
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Upload Compliance Document</DialogTitle>
        <DialogContent dividers>
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom>
              Select File:
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              fullWidth
            >
              {file ? file.name : 'Browse Files'}
              <input
                type="file"
                hidden
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xlsx"
              />
            </Button>
          </Box>
          {file && (
            <Box display="flex" alignItems="center" justifyContent="space-between" p={1} border={1} borderColor="grey.300" borderRadius={1}>
              <Typography variant="body2">{file.name}</Typography>
              <IconButton size="small" onClick={() => setFile(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUpload}
            color="primary"
            variant="contained"
            disabled={!file}
            startIcon={<CloudUploadIcon />}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const ComplianceTable = useMemo(() => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Document Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Uploaded</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {docs.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.name}</TableCell>
              <TableCell>
                <Chip label={doc.type} size="small" color={doc.type === 'Report' ? 'primary' : 'default'} />
              </TableCell>
              <TableCell>{doc.dateUploaded}</TableCell>
              <TableCell>
                <Chip
                  label={doc.status}
                  size="small"
                  color={doc.status === 'Verified' ? 'success' : doc.status === 'Pending Review' ? 'warning' : 'error'}
                />
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" color="primary" title="View">
                  <DescriptionIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" title="Delete" onClick={() => handleDeleteDoc(doc.id)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ), [docs, handleDeleteDoc]);

  return (
    <Box sx={{ p: 4, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <Typography variant="h3" component="h1" gutterBottom color="primary">
        ESG Command Center Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
        Integrated view of Environmental, Social, and Governance performance across all Fortune 500 operations.
      </Typography>

      {/* 1. Overall Scores Section */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MockGauge score={mockESGData.overallScore} title="Overall ESG Score" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MockGauge score={mockESGData.eScore} title="Environmental Pillar" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MockGauge score={mockESGData.sScore} title="Social Pillar" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MockGauge score={mockESGData.gScore} title="Governance Pillar" />
        </Grid>
      </Grid>

      {/* 2. Key Metrics & Time Series */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={6}>
          <MockLineChart data={mockESGData.timeSeries[0]} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <MockLineChart data={mockESGData.timeSeries[1]} />
        </Grid>
      </Grid>

      {/* 3. Pillar Specific Metrics */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Key Performance Indicators (KPIs)" />
        <CardContent>
          <Grid container spacing={3}>
            {mockESGData.metrics.map(renderMetricCard)}
          </Grid>
        </CardContent>
      </Card>

      {/* 4. Compliance & Reporting */}
      <Card>
        <CardHeader
          title="Compliance & Document Management"
          action={
            <>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<DescriptionIcon />}
                onClick={handleGenerateReport}
                sx={{ mr: 2 }}
              >
                Generate PDF Report
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<UploadFileIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload Document
              </Button>
            </>
          }
        />
        <CardContent>
          {ComplianceTable}
        </CardContent>
      </Card>

      <ComplianceUploadDialog />
    </Box>
  );
};

export default ESGCommandCenterView;