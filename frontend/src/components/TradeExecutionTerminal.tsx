import React, { useState } from 'react';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Grid,
} from '@mui/material';

interface TradeExecutionTerminalProps {
  onExecuteTrade: (order: Order) => void;
  availableSymbols: string[];
}

interface Order {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit' | 'stop';
  limitPrice?: number;
  stopPrice?: number;
}

const TradeExecutionTerminal: React.FC<TradeExecutionTerminalProps> = ({
  onExecuteTrade,
  availableSymbols,
}) => {
  const [symbol, setSymbol] = useState<string>(availableSymbols[0] || '');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<number>(1);
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [limitPrice, setLimitPrice] = useState<number | undefined>(undefined);
  const [stopPrice, setStopPrice] = useState<number | undefined>(undefined);

  const handleExecute = () => {
    const order: Order = {
      symbol,
      side,
      quantity,
      orderType,
      limitPrice: orderType === 'limit' ? limitPrice : undefined,
      stopPrice: orderType === 'stop' ? stopPrice : undefined,
    };

    onExecuteTrade(order);
    // Reset the form after trade execution
    setQuantity(1);
    setLimitPrice(undefined);
    setStopPrice(undefined);
  };

  return (
    <Grid container spacing={2} sx={{ padding: 2 }}>
      <Grid item xs={12}>
        <Typography variant="h6">Trade Execution Terminal</Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel id="symbol-label">Symbol</InputLabel>
          <Select
            labelId="symbol-label"
            id="symbol"
            value={symbol}
            label="Symbol"
            onChange={(e) => setSymbol(e.target.value)}
          >
            {availableSymbols.map((sym) => (
              <MenuItem key={sym} value={sym}>
                {sym}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel id="side-label">Side</InputLabel>
          <Select
            labelId="side-label"
            id="side"
            value={side}
            label="Side"
            onChange={(e) => setSide(e.target.value as 'buy' | 'sell')}
          >
            <MenuItem value="buy">Buy</MenuItem>
            <MenuItem value="sell">Sell</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          id="quantity"
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          inputProps={{ min: 1 }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel id="order-type-label">Order Type</InputLabel>
          <Select
            labelId="order-type-label"
            id="orderType"
            value={orderType}
            label="Order Type"
            onChange={(e) => setOrderType(e.target.value as 'market' | 'limit' | 'stop')}
          >
            <MenuItem value="market">Market</MenuItem>
            <MenuItem value="limit">Limit</MenuItem>
            <MenuItem value="stop">Stop</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {orderType === 'limit' && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="limitPrice"
            label="Limit Price"
            type="number"
            value={limitPrice !== undefined ? limitPrice : ''}
            onChange={(e) => setLimitPrice(Number(e.target.value))}
          />
        </Grid>
      )}

      {orderType === 'stop' && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="stopPrice"
            label="Stop Price"
            type="number"
            value={stopPrice !== undefined ? stopPrice : ''}
            onChange={(e) => setStopPrice(Number(e.target.value))}
          />
        </Grid>
      )}

      <Grid item xs={12}>
        <Button variant="contained" color="primary" onClick={handleExecute}>
          Execute Trade
        </Button>
      </Grid>
    </Grid>
  );
};

export default TradeExecutionTerminal;