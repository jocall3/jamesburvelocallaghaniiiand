```typescript
import React from 'react';
import { Card, CardContent, Typography, Grid, Avatar, Box, LinearProgress } from '@mui/material';
import { styled } from '@mui/system';

// Styled Components
const AgentCardContainer = styled(Card)(({ theme }) => ({
  maxWidth: 345,
  margin: theme.spacing(2),
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const AvatarStyled = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(7),
  height: theme.spacing(7),
  marginRight: theme.spacing(2),
}));

const StatBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  textAlign: 'center',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
}));

const CostIndicator = styled(LinearProgress)(({ theme, value }) => ({
  height: 8,
  borderRadius: theme.shape.borderRadius,
  ...(value > 70 && {
    backgroundColor: theme.palette.error.main,
  }),
}));


// Interface for the Agent Data
interface Agent {
  id: string;
  name: string;
  specialization: string;
  avatarUrl: string;
  successRate: number;
  averageSpeed: number;
  costEfficiency: number;
}

// AgentCard Component
interface AgentCardProps {
  agent: Agent;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  return (
    <AgentCardContainer>
      <CardContent>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <AvatarStyled alt={agent.name} src={agent.avatarUrl} />
          </Grid>
          <Grid item>
            <Typography variant="h6" component="h2">
              {agent.name}
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {agent.specialization}
            </Typography>
          </Grid>
        </Grid>

        <Box mt={2}>
          <Typography variant="subtitle1">Performance Stats:</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <StatBox>
                <Typography variant="body2">Success Rate</Typography>
                <Typography variant="h6">{agent.successRate}%</Typography>
              </StatBox>
            </Grid>
            <Grid item xs={6}>
              <StatBox>
                <Typography variant="body2">Avg. Speed</Typography>
                <Typography variant="h6">{agent.averageSpeed}s</Typography>
              </StatBox>
            </Grid>
          </Grid>
        </Box>

        <Box mt={2}>
          <Typography variant="subtitle1">Cost Efficiency:</Typography>
          <CostIndicator variant="determinate" value={agent.costEfficiency} />
          <Typography variant="caption" color="textSecondary">
            {agent.costEfficiency}% (Lower is better)
          </Typography>
        </Box>
      </CardContent>
    </AgentCardContainer>
  );
};

export default AgentCard;
```