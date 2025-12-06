
import React, { useState } from 'react';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Typography,
} from '@mui/material';

const StrategyEditor: React.FC = () => {
  const [strategyName, setStrategyName] = useState('');
  const [asset, setAsset] = useState('');
  const [indicator, setIndicator] = useState('');
  const [condition, setCondition] = useState('');
  const [triggerValue, setTriggerValue] = useState('');

  const assets = ['BTC', 'ETH', 'LTC', 'ADA'];
  const indicators = ['SMA', 'EMA', 'RSI', 'MACD'];
  const conditions = ['above', 'below', 'cross above', 'cross below'];

  const handleSaveStrategy = () => {
    // Implement logic to save the strategy
    console.log('Strategy Name:', strategyName);
    console.log('Asset:', asset);
    console.log('Indicator:', indicator);
    console.log('Condition:', condition);
    console.log('Trigger Value:', triggerValue);
    alert('Strategy Saved!');
  };

  return (
    <Paper elevation={3} sx={{ padding: 3, margin: 2 }}>
      <Typography variant="h6" gutterBottom>
        Strategy Editor
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Strategy Name"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="asset-label">Asset</InputLabel>
            <Select
              labelId="asset-label"
              id="asset-select"
              value={asset}
              onChange={(e) => setAsset(e.target.value as string)}
              label="Asset"
            >
              {assets.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="indicator-label">Indicator</InputLabel>
            <Select
              labelId="indicator-label"
              id="indicator-select"
              value={indicator}
              onChange={(e) => setIndicator(e.target.value as string)}
              label="Indicator"
            >
              {indicators.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="condition-label">Condition</InputLabel>
            <Select
              labelId="condition-label"
              id="condition-select"
              value={condition}
              onChange={(e) => setCondition(e.target.value as string)}
              label="Condition"
            >
              {conditions.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Trigger Value"
            value={triggerValue}
            onChange={(e) => setTriggerValue(e.target.value)}
            variant="outlined"
            type="number"
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveStrategy}
          >
            Save Strategy
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default StrategyEditor;
