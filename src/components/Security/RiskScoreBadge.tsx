```typescript
import React from 'react';
import { Box, Typography, styled } from '@mui/material';

interface RiskScoreBadgeProps {
  riskScore: 'Low' | 'Medium' | 'High' | null;
}

const RiskScoreBadgeContainer = styled(Box)(({ theme, riskScore }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  fontWeight: 600,
  fontSize: '0.875rem',
  textTransform: 'uppercase',
  ...(riskScore === 'Low' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  }),
  ...(riskScore === 'Medium' && {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  }),
  ...(riskScore === 'High' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  }),
  ...(riskScore === null && {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.text.secondary,
  }),
}));

const RiskScoreBadge: React.FC<RiskScoreBadgeProps> = ({ riskScore }) => {
  let displayValue = riskScore === null ? 'Not Assessed' : riskScore;

  return (
    <RiskScoreBadgeContainer riskScore={riskScore}>
      <Typography variant="body2">{displayValue}</Typography>
    </RiskScoreBadgeContainer>
  );
};

export default RiskScoreBadge;
```