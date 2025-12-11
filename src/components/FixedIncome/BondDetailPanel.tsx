```typescript
import React from 'react';
import { Box, Typography, Grid } from '@mui/material';

interface BondDetailPanelProps {
  isin: string | null;
  cusip: string | null;
  maturityDate: string | null;
  couponRate: string | null;
  countryOfRisk: string | null;
  faceValue: string | null;
  currency: string | null;
  issuer: string | null;
  bondType: string | null;
  status: string | null;
  amount: string | null;
}

const BondDetailPanel: React.FC<BondDetailPanelProps> = ({
  isin,
  cusip,
  maturityDate,
  couponRate,
  countryOfRisk,
  faceValue,
  currency,
  issuer,
  bondType,
  status,
  amount
}) => {
  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        Bond Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">ISIN:</Typography>
          <Typography>{isin || 'No data'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">CUSIP:</Typography>
          <Typography>{cusip || 'No data'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Maturity Date:</Typography>
          <Typography>{maturityDate || 'No data'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Coupon Rate:</Typography>
          <Typography>{couponRate || 'No data'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Country of Risk:</Typography>
          <Typography>{countryOfRisk || 'No data'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Face Value:</Typography>
          <Typography>{faceValue || 'No data'}</Typography>
        </Grid>
         <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Currency:</Typography>
          <Typography>{currency || 'No data'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Issuer:</Typography>
          <Typography>{issuer || 'No data'}</Typography>
        </Grid>
         <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Bond Type:</Typography>
          <Typography>{bondType || 'No data'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Status:</Typography>
          <Typography>{status || 'No data'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Amount:</Typography>
          <Typography>{amount || 'No data'}</Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BondDetailPanel;
```