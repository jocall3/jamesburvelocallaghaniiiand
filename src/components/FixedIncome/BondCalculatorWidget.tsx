import React, { useState } from 'react';
import { TextField, Button, Typography, Grid, Box } from '@mui/material';

interface BondCalculatorWidgetProps {
  // Add any props needed for the widget here
}

const BondCalculatorWidget: React.FC<BondCalculatorWidgetProps> = () => {
  const [yieldToMaturity, setYieldToMaturity] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);

  const handleCalculatePrice = () => {
    // Placeholder for the bond pricing calculation logic
    // This is where you would implement the actual math
    if (yieldToMaturity !== null) {
      const calculatedPrice = 100 - (yieldToMaturity * 0.5); // Example calculation
      setPrice(calculatedPrice);
    }
  };

  const handleCalculateYield = () => {
    // Placeholder for the yield calculation logic
    // This is where you would implement the actual math
    if (price !== null) {
      const calculatedYield = (100 - price) * 2;  // Example calculation
      setYieldToMaturity(calculatedYield);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        Bond Calculator
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Yield to Maturity (%)"
            type="number"
            fullWidth
            value={yieldToMaturity !== null ? yieldToMaturity.toString() : ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setYieldToMaturity(isNaN(value) ? null : value);
              setPrice(null); // Clear the other field
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Price"
            type="number"
            fullWidth
            value={price !== null ? price.toString() : ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setPrice(isNaN(value) ? null : value);
              setYieldToMaturity(null); // Clear the other field
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button variant="contained" color="primary" onClick={handleCalculatePrice} disabled={yieldToMaturity === null}>
            Calculate Price
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button variant="contained" color="primary" onClick={handleCalculateYield} disabled={price === null}>
            Calculate Yield
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BondCalculatorWidget;