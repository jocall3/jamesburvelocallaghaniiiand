import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';

// --- Types ---

interface Policy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  type: 'Ethical' | 'Compliance' | 'Security';
  scope: 'Global' | 'Data Pipeline' | 'Model Deployment';
  enforcementMechanism: string;
  details: string;
}

interface PolicyUpdate {
  isActive?: boolean;
  enforcementMechanism?: string;
  details?: string;
}

// --- Mock Data ---

const initialPolicies: Policy[] = [
  {
    id: 'P001',
    name: 'Fairness and Bias Mitigation Policy',
    description: 'Ensures models do not perpetuate unfair biases across demographic groups.',
    isActive: true,
    type: 'Ethical',
    scope: 'Data Pipeline',
    enforcementMechanism: 'Post-training bias scan and dataset reweighting.',
    details: 'Monitors DI and EOE metrics for protected attributes (age, gender, ethnicity) with a threshold variance of 5%.',
  },
  {
    id: 'P002',
    name: 'Data Privacy (GDPR/CCPA) Compliance',
    description: 'Mandates adherence to global data privacy regulations during processing.',
    isActive: true,
    type: 'Compliance',
    scope: 'Global',
    enforcementMechanism: 'Automated PII scrubbing and anonymization layers.',
    details: 'All incoming user data must pass through the DPL (Data Privacy Layer) before reaching training infrastructure.',
  },
  {
    id: 'P003',
    name: 'Model Interpretability Standard',
    description: 'Requires all high-stakes models to provide explainability artifacts (LIME/SHAP).',
    isActive: false,
    type: 'Ethical',
    scope: 'Model Deployment',
    enforcementMechanism: 'Mandatory SHAP generation post-deployment.',
    details: 'Interpretability scores (fidelity > 0.8) must be logged and audited quarterly.',
  },
  {
    id: 'P004',
    name: 'Input Validation and Adversarial Robustness',
    description: 'Protects deployed models against adversarial attacks and malicious inputs.',
    isActive: true,
    type: 'Security',
    scope: 'Model Deployment',
    enforcementMechanism: 'Fuzz testing and input sanitization filters.',
    details: 'Models must achieve an FGS (Fast Gradient Sign) attack resilience score > 0.9.',
  },
];

// --- Utility Functions ---

const getTypeColor = (type: Policy['type']) => {
  switch (type) {
    case 'Ethical':
      return 'secondary';
    case 'Compliance':
      return 'primary';
    case 'Security':
      return 'error';
    default:
      return 'default';
  }
};

const getScopeColor = (scope: Policy['scope']) => {
  switch (scope) {
    case 'Global':
      return 'info';
    case 'Data Pipeline':
      return 'success';
    case 'Model Deployment':
      return 'warning';
    default:
      return 'default';
  }
};

// --- Component ---

const AIGovernancePolicies: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies);
  const [filterType, setFilterType] = useState<string>('All');

  const handleUpdatePolicy = (id: string, updates: PolicyUpdate) => {
    setPolicies(prevPolicies =>
      prevPolicies.map(policy =>
        policy.id === id ? { ...policy, ...updates } : policy
      )
    );
  };

  const filteredPolicies = policies.filter(policy => 
    filterType === 'All' || policy.type === filterType
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Governance & Compliance Policies
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
        Manage and enforce the ethical, regulatory, and security policies governing your AI services.
      </Typography>

      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Filter by Policy Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              fullWidth
            >
              <MenuItem value="All">All Types</MenuItem>
              <MenuItem value="Ethical">Ethical</MenuItem>
              <MenuItem value="Compliance">Compliance</MenuItem>
              <MenuItem value="Security">Security</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={9} sx={{ textAlign: { md: 'right' } }}>
            <Button variant="contained" color="success" startIcon={<SaveIcon />}>
              Save All Configuration
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box>
        {filteredPolicies.map((policy) => (
          <Accordion key={policy.id} component={Paper} elevation={2} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8} sm={6}>
                  <Typography variant="h6">{policy.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {policy.description}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={3} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={policy.type} color={getTypeColor(policy.type)} size="small" />
                  <Chip label={policy.scope} color={getScopeColor(policy.scope)} size="small" />
                </Grid>
                <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={policy.isActive}
                        onChange={(e) => handleUpdatePolicy(policy.id, { isActive: e.target.checked })}
                        onClick={(e) => e.stopPropagation()} // Prevent accordion toggle
                        name="policyActive"
                      />
                    }
                    label={policy.isActive ? 'Active' : 'Inactive'}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Grid>
              </Grid>
            </AccordionSummary>
            <AccordionDetails sx={{ borderTop: '1px solid #eee' }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Enforcement Details
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Enforcement Mechanism"
                    fullWidth
                    variant="outlined"
                    value={policy.enforcementMechanism}
                    onChange={(e) => handleUpdatePolicy(policy.id, { enforcementMechanism: e.target.value })}
                    helperText="How is this policy technically enforced (e.g., specific algorithms, checkpoints, filters)?"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Specific Policy Thresholds/Rules"
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    value={policy.details}
                    onChange={(e) => handleUpdatePolicy(policy.id, { details: e.target.value })}
                    helperText="Detailed rules, KPIs, or thresholds required for compliance."
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

        {filteredPolicies.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              No policies found matching the filter criteria.
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default AIGovernancePolicies;
