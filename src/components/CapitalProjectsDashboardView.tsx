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

// --- Citibankdemobusinessinc Core ---

namespace Citibankdemobusinessinc {

  // --- Utility Functions ---
  const generateRandomNumber = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  };

  const generateRandomDate = (start: Date, end: Date): string => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().slice(0, 10);
  };

  const generateRandomStatus = (): 'Planning' | 'In Progress' | 'Completed' | 'On Hold' => {
    const statuses: ('Planning' | 'In Progress' | 'Completed' | 'On Hold')[] = ['Planning', 'In Progress', 'Completed', 'On Hold'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const generateLoremIpsum = (words: number): string => {
    const lorem = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum';
    const wordList = lorem.split(' ');
    let result = '';
    for (let i = 0; i < words; i++) {
      result += wordList[Math.floor(Math.random() * wordList.length)] + ' ';
    }
    return result.trim();
  };

  // --- Data Structures ---

  export interface CapitalProject {
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

  export interface Milestone {
    id: number;
    name: string;
    date: string; // YYYY-MM-DD
    isCompleted: boolean;
  }

  export interface Document {
    id: number;
    name: string;
    type: 'Blueprint' | 'Permit' | 'Contract';
    url: string;
  }

  // --- Data Generators ---

  export const generateCapitalProject = (id: number): CapitalProject => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + Math.floor(generateRandomNumber(1, 5)));

    const budget = generateRandomNumber(50, 2000); // Millions
    const actualSpend = Math.min(budget, generateRandomNumber(0, budget * 0.8));

    return {
      id: id,
      name: `Project ${id}: ${generateLoremIpsum(3)}`,
      status: generateRandomStatus(),
      budget: budget,
      actualSpend: actualSpend,
      startDate: generateRandomDate(startDate, endDate),
      endDate: generateRandomDate(startDate, endDate),
      roiForecast: generateRandomNumber(5, 30),
      milestones: generateMilestones(Math.floor(generateRandomNumber(2, 6))),
      documents: generateDocuments(Math.floor(generateRandomNumber(1, 4))),
    };
  };

  const generateMilestones = (count: number): Milestone[] => {
    const milestones: Milestone[] = [];
    for (let i = 1; i <= count; i++) {
      milestones.push({
        id: i,
        name: `Milestone ${i}: ${generateLoremIpsum(2)}`,
        date: generateRandomDate(new Date(), new Date(new Date().getFullYear() + 3, 0, 0)),
        isCompleted: Math.random() < 0.7,
      });
    }
    return milestones;
  };

  const generateDocuments = (count: number): Document[] => {
    const documentTypes: ('Blueprint' | 'Permit' | 'Contract')[] = ['Blueprint', 'Permit', 'Contract'];
    const documents: Document[] = [];
    for (let i = 1; i <= count; i++) {
      const type = documentTypes[Math.floor(Math.random() * documentTypes.length)];
      documents.push({
        id: i,
        name: `Document_${i}_${generateLoremIpsum(1).toUpperCase()}.${type.slice(0, 3).toUpperCase()}`,
        type: type,
        url: '#', // Placeholder
      });
    }
    return documents;
  };

  // --- Business Models ---

  export namespace Viewit {
    export const missionStatement = "To revolutionize visual data accessibility and understanding for capital project stakeholders.";

    export interface MovieplayformProps {
      projects: CapitalProject[];
    }

    export const Movieplayform: React.FC<MovieplayformProps> = ({ projects }) => {
      return (
        <Card>
          <CardHeader title="Viewit.Movieplayform: Visual Project Overview" />
          <CardContent>
            <Typography variant="body1">
              Interactive visual platform for exploring project timelines and dependencies.
            </Typography>
            {projects.map(project => (
              <Typography key={project.id} variant="subtitle2">
                {project.name} - {project.status}
              </Typography>
            ))}
          </CardContent>
        </Card>
      );
    };
  }

  export namespace Riskdetect {
    export const missionStatement = "To proactively identify and mitigate risks in capital projects through advanced analytics.";

    export interface PredictiveAnalyticsDashboardProps {
      projects: CapitalProject[];
    }

    export const PredictiveAnalyticsDashboard: React.FC<PredictiveAnalyticsDashboardProps> = ({ projects }) => {
      const riskScore = (project: CapitalProject) => {
        let score = 0;
        if (project.status === 'On Hold') score += 50;
        if (project.actualSpend > project.budget) score += 30;
        if (new Date(project.endDate) < new Date()) score += 20;
        return score;
      };

      return (
        <Card>
          <CardHeader title="Riskdetect.PredictiveAnalyticsDashboard: Project Risk Assessment" />
          <CardContent>
            <Typography variant="body1">
              Real-time risk assessment and predictive analytics for proactive risk management.
            </Typography>
            {projects.map(project => (
              <Typography key={project.id} variant="subtitle2">
                {project.name} - Risk Score: {riskScore(project)}
              </Typography>
            ))}
          </CardContent>
        </Card>
      );
    };
  }

  export namespace Budgetflow {
    export const missionStatement = "To optimize capital allocation and budget management through intelligent financial workflows.";

    export interface BudgetOptimizationToolProps {
      projects: CapitalProject[];
    }

    export const BudgetOptimizationTool: React.FC<BudgetOptimizationToolProps> = ({ projects }) => {
      const optimizedBudget = (project: CapitalProject) => {
        // Simplified optimization logic
        return project.budget * (1 + (project.roiForecast / 100));
      };

      return (
        <Card>
          <CardHeader title="Budgetflow.BudgetOptimizationTool: Smart Budget Allocation" />
          <CardContent>
            <Typography variant="body1">
              Intelligent tools for optimizing budget allocation and financial forecasting.
            </Typography>
            {projects.map(project => (
              <Typography key={project.id} variant="subtitle2">
                {project.name} - Optimized Budget: ${optimizedBudget(project).toFixed(1)}M
              </Typography>
            ))}
          </CardContent>
        </Card>
      );
    };
  }

  export namespace Compliancetrust {
    export const missionStatement = "To ensure regulatory compliance and transparency in capital project execution.";

    export interface ComplianceAuditDashboardProps {
      projects: CapitalProject[];
    }

    export const ComplianceAuditDashboard: React.FC<ComplianceAuditDashboardProps> = ({ projects }) => {
      const isCompliant = (project: CapitalProject) => {
        // Simplified compliance check
        return project.documents.length > 0 && project.status !== 'On Hold';
      };

      return (
        <Card>
          <CardHeader title="Compliancetrust.ComplianceAuditDashboard: Regulatory Compliance Monitoring" />
          <CardContent>
            <Typography variant="body1">
              Automated compliance monitoring and audit trails for regulatory adherence.
            </Typography>
            {projects.map(project => (
              <Typography key={project.id} variant="subtitle2">
                {project.name} - Compliant: {isCompliant(project) ? 'Yes' : 'No'}
              </Typography>
            ))}
          </CardContent>
        </Card>
      );
    };
  }

  export namespace Supplynet {
    export const missionStatement = "To streamline supply chain management and procurement processes for capital projects.";

    export interface VendorManagementSystemProps {
      projects: CapitalProject[];
    }

    export const VendorManagementSystem: React.FC<VendorManagementSystemProps> = ({ projects }) => {
      const vendorCount = () => Math.floor(generateRandomNumber(5, 20));

      return (
        <Card>
          <CardHeader title="Supplynet.VendorManagementSystem: Streamlined Procurement" />
          <CardContent>
            <Typography variant="body1">
              Integrated vendor management and procurement platform for efficient supply chain operations.
            </Typography>
            {projects.map(project => (
              <Typography key={project.id} variant="subtitle2">
                {project.name} - Vendors: {vendorCount()}
              </Typography>
            ))}
          </CardContent>
        </Card>
      );
    };
  }

  export namespace Workforcemax {
    export const missionStatement = "To optimize workforce allocation and productivity in capital project execution.";

    export interface ResourceAllocationToolProps {
      projects: CapitalProject[];
    }

    export const ResourceAllocationTool: React.FC<ResourceAllocationToolProps> = ({ projects }) => {
      const resourceCount = () => Math.floor(generateRandomNumber(10, 50));

      return (
        <Card>
          <CardHeader title="Workforcemax.ResourceAllocationTool: Optimized Workforce Management" />
          <CardContent>
            <Typography variant="body1">
              Intelligent resource allocation and workforce management tools for maximizing productivity.
            </Typography>
            {projects.map(project => (
              <Typography key={project.id} variant="subtitle2">
                {project.name} - Resources: {resourceCount()}
              </Typography>
            ))}
          </CardContent>
        </Card>
      );
    };
  }

  export namespace Sustainbuild {
    export const missionStatement = "To promote sustainable practices and environmental responsibility in capital projects.";

    export interface EnvironmentalImpactDashboardProps {
      projects: CapitalProject[];
    }

    export const EnvironmentalImpactDashboard: React.FC<EnvironmentalImpactDashboardProps> = ({ projects }) => {
      const carbonFootprint = () => generateRandomNumber(100, 1000).toFixed(1);

      return (
        <Card>
          <CardHeader title="Sustainbuild.EnvironmentalImpactDashboard: Sustainable Project Monitoring" />
          <CardContent>
            <Typography variant="body1">
              Real-time monitoring of environmental impact and sustainability metrics.
            </Typography>
            {projects.map(project => (
              <Typography key={project.id} variant="subtitle2">
                {project.name} - Carbon Footprint: {carbonFootprint()} tons
              </Typography>
            ))}
          </CardContent>
        </Card>
      );
    };
  }

  export namespace Governwise {
    export const missionStatement = "To provide robust governance and oversight mechanisms for capital project portfolios.";

    export interface GovernanceOversightPlatformProps {
      projects: CapitalProject[];
    }

    export const GovernanceOversightPlatform: React.FC<GovernanceOversightPlatformProps> = ({ projects }) => {
      const auditScore = () => generateRandomNumber(70, 100).toFixed(0);

      return (
        <Card>
          <CardHeader title="Governwise.GovernanceOversightPlatform: Enhanced Project Governance" />
          <CardContent>
            <Typography variant="body1">
              Comprehensive governance and oversight platform for ensuring project success.
            </Typography>
            {projects.map(project => (
              <Typography key={project.id} variant="subtitle2">
                {project.name} - Audit Score: {auditScore()}
              </Typography>
            ))}
          </CardContent>
        </Card>
      );
    };
  }

  export namespace Innovatebuild {
    export const missionStatement = "To foster innovation and technological advancement in capital project design and execution.";

    export interface TechnologyAdoptionPlatformProps {
      projects: CapitalProject[];
    }

    export const TechnologyAdoptionPlatform: React.FC<TechnologyAdoptionPlatformProps> = ({ projects }) => {
      const innovationIndex = () => generateRandomNumber(50, 90).toFixed(0);

      return (
        <Card>
          <CardHeader title="Innovatebuild.TechnologyAdoptionPlatform: Driving Innovation" />
          <CardContent>
            <Typography variant="body1">
              Platform for promoting the adoption of innovative technologies in capital projects.
            </Typography>
            {projects.map(project => (
              <Typography key={project.id} variant="subtitle2">
                {project.name} - Innovation Index: {innovationIndex()}
              </Typography>
            ))}
          </CardContent>
        </Card>
      );
    };
  }

  export namespace Stakeholdercorp {
    export const missionStatement = "To enhance stakeholder engagement and communication throughout the capital project lifecycle.";

    export interface StakeholderEngagementPortalProps {
      projects: CapitalProject[];
    }

    export const StakeholderEngagementPortal: React.FC<StakeholderEngagementPortalProps> = ({ projects }) => {
      const engagementLevel = () => ['High', 'Medium', 'Low'][Math.floor(generateRandomNumber(0, 3))];

      return (
        <Card>
          <CardHeader title="Stakeholdercorp.StakeholderEngagementPortal: Enhanced Communication" />
          <CardContent>
            <Typography variant="body1">
              Portal for facilitating stakeholder engagement and communication.
            </Typography>
            {projects.map(project => (
              <Typography key={project.id} variant="subtitle2">
                {project.name} - Engagement: {engagementLevel()}
              </Typography>
            ))}
          </CardContent>
        </Card>
      );
    };
  }

  // --- Orchestration Layer ---

  export interface CitibankdemobusinessincProps {
    numberOfProjects: number;
  }

  export const CitibankdemobusinessincOrchestrator: React.FC<CitibankdemobusinessincProps> = ({ numberOfProjects }) => {
    const [projects, setProjects] = useState<CapitalProject[]>(() => {
      const initialProjects: CapitalProject[] = [];
      for (let i = 1; i <= numberOfProjects; i++) {
        initialProjects.push(generateCapitalProject(i));
      }
      return initialProjects;
    });

    return (
      <Box>
        <Typography variant="h3" gutterBottom>
          Citibankdemobusinessinc: Open Banking for Capital Projects
        </Typography>
        <Typography variant="subtitle1" paragraph>
          Unifying platform for managing capital projects with integrated financial and operational tools.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Viewit.Movieplayform projects={projects} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Riskdetect.PredictiveAnalyticsDashboard projects={projects} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Budgetflow.BudgetOptimizationTool projects={projects} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Compliancetrust.ComplianceAuditDashboard projects={projects} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Supplynet.VendorManagementSystem projects={projects} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Workforcemax.ResourceAllocationTool projects={projects} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Sustainbuild.EnvironmentalImpactDashboard projects={projects} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Governwise.GovernanceOversightPlatform projects={projects} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Innovatebuild.TechnologyAdoptionPlatform projects={projects} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stakeholdercorp.StakeholderEngagementPortal projects={projects} />
          </Grid>
        </Grid>
      </Box>
    );
  };
}

// --- Utility Components ---

const getStatusColor = (status: Citibankdemobusinessinc.CapitalProject['status']) => {
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

const ProjectCard: React.FC<{ project: Citibankdemobusinessinc.CapitalProject }> = ({ project }) => {
  const progress = (project.actualSpend / project.budget) * 100;
  const isOverBudget = project.actualSpend > project.budget;

  const [openDetails, setOpenDetails] = useState(false);

  const handleDownload = (doc: Citibankdemobusinessinc.Document) => {
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
  const [projects] = useState<Citibankdemobusinessinc.CapitalProject[]>(() => {
    const initialProjects: Citibankdemobusinessinc.CapitalProject[] = [];
    for (let i = 1; i <= 3; i++) {
      initialProjects.push(Citibankdemobusinessinc.generateCapitalProject(i));
    }
    return initialProjects;
  });

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

      {/* 4. Citibankdemobusinessinc Orchestrator */}
      <Citibankdemobusinessinc.CitibankdemobusinessincOrchestrator numberOfProjects={5} />
    </Box>
  );
};

export default CapitalProjectsDashboardView;