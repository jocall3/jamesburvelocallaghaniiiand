import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// --- Mock Data Structures ---

interface CapitalProject {
  id: number;
  name: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  budget: number; // in millions
  actualSpend: number; // in millions
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  roiForecast: number; // percentage
  milestones: Milestone[];
  documents: Document[];
}

interface Milestone {
  id: number;
  name: string;
  date: string; // YYYY-MM-DD
  isCompleted: boolean;
}

interface Document {
  id: number;
  name: string;
  type: 'Blueprint' | 'Permit' | 'Contract';
  url: string;
}

// --- Mock Data ---

const MOCK_PROJECTS: CapitalProject[] = [
  {
    id: 101,
    name: 'Global HQ Expansion - Phase I',
    status: 'In Progress',
    budget: 500,
    actualSpend: 320,
    startDate: '2023-01-15',
    endDate: '2025-12-31',
    roiForecast: 18.5,
    milestones: [
      { id: 1, name: 'Land Acquisition Complete', date: '2023-03-01', isCompleted: true },
      { id: 2, name: 'Foundation Poured', date: '2023-10-20', isCompleted: true },
      { id: 3, name: 'Structural Steel Erection', date: '2024-06-01', isCompleted: false },
      { id: 4, name: 'Interior Fit-Out Start', date: '2025-01-15', isCompleted: false },
    ],
    documents: [
      { id: 1001, name: 'HQ_Blueprint_V3.pdf', type: 'Blueprint', url: '#' },
      { id: 1002, name: 'Zoning_Permit_A12.pdf', type: 'Permit', url: '#' },
      { id: 1003, name: 'Construction_Contract_2023.docx', type: 'Contract', url: '#' },
    ],
  },
  {
    id: 102,
    name: 'European Manufacturing Hub',
    status: 'Planning',
    budget: 1200,
    actualSpend: 50,
    startDate: '2024-09-01',
    endDate: '2027-06-30',
    roiForecast: 22.1,
    milestones: [
      { id: 5, name: 'Feasibility Study Approved', date: '2024-05-10', isCompleted: true },
      { id: 6, name: 'Financing Secured', date: '2024-11-01', isCompleted: false },
    ],
    documents: [
      { id: 2001, name: 'EMH_Site_Survey.pdf', type: 'Blueprint', url: '#' },
    ],
  },
  {
    id: 103,
    name: 'Data Center Upgrade - West Coast',
    status: 'Completed',
    budget: 150,
    actualSpend: 145,
    startDate: '2022-05-01',
    endDate: '2023-11-30',
    roiForecast: 15.0,
    milestones: [
      { id: 7, name: 'Go-Live', date: '2023-11-15', isCompleted: true },
    ],
    documents: [
      { id: 3001, name: 'Final_Acceptance_Report.pdf', type: 'Contract', url: '#' },
    ],
  },
];

// --- Utility Components ---

const getStatusColor = (status: CapitalProject['status']) => {
  switch (status) {
    case 'In Progress':
      return 'primary';
    case 'Planning':
      return 'info';
    case 'Completed':
      return 'success';
    case 'On Hold':
      return 'warning';
    default:
      return 'default';
  }
};

interface FinancialWidgetProps {
  title: string;
  value: string;
  trend?: number; // Percentage change
}

const FinancialWidget: React.FC<FinancialWidgetProps> = ({ title, value, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardHeader title={title} sx={{ pb: 1 }} />
    <CardContent sx={{ pt: 0 }}>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
      {trend !== undefined && (
        <Typography variant="body2" color={trend >= 0 ? 'success.main' : 'error.main'}>
          {trend >= 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`} vs Forecast
        </Typography>
      )}
    </CardContent>
  </Card>
);

// --- Main View Components ---

const ProjectCard: React.FC<{ project: CapitalProject }> = ({ project }) => {
  const progress = (project.actualSpend / project.budget) * 100;
  const isOverBudget = project.actualSpend > project.budget;

  const [openDetails, setOpenDetails] = useState(false);

  const handleDownload = (doc: Document) => {
    console.log(`Downloading document: ${doc.name} from ${doc.url}`);
    alert(`Simulating download for: ${doc.name}`);
  };

  return (
    <Card elevation={3} sx={{ mb: 3, borderLeft: `5px solid var(--mui-color-primary-${getStatusColor(project.status)})` }}>
      <CardHeader
        title={project.name}
        subheader={`Start: ${project.startDate} | End: ${project.endDate}`}
        action={
          <Chip
            label={project.status}
            color={getStatusColor(project.status)}
            variant="outlined"
            size="small"
          />
        }
      />
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1">Budget (MM): ${project.budget.toFixed(1)}</Typography>
            <Typography variant="subtitle1" color={isOverBudget ? 'error' : 'text.secondary'}>
              Actual Spend (MM): ${project.actualSpend.toFixed(1)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" gutterBottom>
              Progress: {progress.toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(progress, 100)}
              color={isOverBudget ? 'error' : 'primary'}
              sx={{ height: 10, borderRadius: 1 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="secondary.main">
              Forecasted ROI: {project.roiForecast.toFixed(1)}%
            </Typography>
            <Button size="small" onClick={() => setOpenDetails(!openDetails)} variant="text" sx={{ mt: 1 }}>
              {openDetails ? 'Hide Details' : 'View Details & Docs'}
            </Button>
          </Grid>
        </Grid>

        {openDetails && (
          <Box mt={3} p={2} borderTop={1} borderColor="divider">
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Key Milestones</Typography>
                <Timeline position="alternate" dense>
                  {project.milestones.map((m) => (
                    <TimelineItem key={m.id}>
                      <TimelineSeparator>
                        <TimelineDot color={m.isCompleted ? 'success' : 'grey'} variant={m.isCompleted ? 'filled' : 'outlined'} />
                        {!m.isCompleted && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: '12px', px: 2 }}>
                        <Typography variant="body2" component="span">
                          {m.date}
                        </Typography>
                        <Typography>{m.name}</Typography>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Document Repository</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {project.documents.length > 0 ? (
                        project.documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>{doc.type}</TableCell>
                            <TableCell>{doc.name}</TableCell>
                            <TableCell align="right">
                              <Button size="small" variant="outlined" onClick={() => handleDownload(doc)}>
                                Download
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3}>No documents uploaded.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        )}
      </Card>
    );
  };

  return null; // Rendered inside the main component loop
};

// --- Dashboard View Component ---

const CapitalProjectsDashboardView: React.FC = () => {
  const [projects] = useState<CapitalProject[]>(MOCK_PROJECTS);

  // --- Financial Aggregations ---
  const totalBudget = useMemo(() => projects.reduce((sum, p) => sum + p.budget, 0), [projects]);
  const totalActualSpend = useMemo(() => projects.reduce((sum, p) => sum + p.actualSpend, 0), [projects]);
  const overallROI = useMemo(() => {
    // Simple weighted average for demonstration
    const totalWeightedROI = projects.reduce((sum, p) => sum + (p.roiForecast * p.budget), 0);
    return totalBudget > 0 ? totalWeightedROI / totalBudget : 0;
  }, [projects, totalBudget]);

  const budgetVsActualData = useMemo(() => [
    { name: 'Total Budget', Budget: totalBudget, 'Actual Spend': totalActualSpend },
  ], [totalBudget, totalActualSpend]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Capital Projects Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Tracking large-scale CAPEX initiatives across the enterprise.
      </Typography>

      {/* 1. Financial Overview Widgets */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <FinancialWidget
            title="Total Budget Allocated (MM)"
            value={`$${totalBudget.toFixed(1)}`}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FinancialWidget
            title="Total Actual Spend (MM)"
            value={`$${totalActualSpend.toFixed(1)}`}
            trend={((totalActualSpend - totalBudget) / totalBudget) * 100}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FinancialWidget
            title="Weighted ROI Forecast"
            value={`${overallROI.toFixed(1)}%`}
          />
        </Grid>
      </Grid>

      {/* 2. Budget vs Actual Chart */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Budget vs. Actual Spend Summary" />
        <CardContent>
          <Box height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetVsActualData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Millions USD', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => [`$${value.toFixed(1)}M`, 'Amount']} />
                <Legend />
                <Bar dataKey="Budget" fill="#8884d8" />
                <Bar dataKey="Actual Spend" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* 3. Project Cards (Gantt/Timeline representation implied by milestones within) */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Active Capital Projects
      </Typography>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}

      {/* Placeholder for a true Gantt Chart visualization (requires external library, mocked here) */}
      <Card sx={{ mt: 4, p: 2 }}>
        <CardHeader title="Project Timeline Visualization (Gantt Placeholder)" />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            A full Gantt chart visualization would typically be rendered here using a dedicated library (e.g., react-gantt, dhtmlx-gantt).
            For this dependency-free implementation, the timeline view is integrated within each ProjectCard.
          </Typography>
          <Box sx={{ mt: 2, p: 1, border: '1px dashed #ccc' }}>
            <Typography variant="caption">
              [Visual Timeline Representation: Project 101 spans 2023-2025, Milestone 3 due mid-2024]
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CapitalProjectsDashboardView;