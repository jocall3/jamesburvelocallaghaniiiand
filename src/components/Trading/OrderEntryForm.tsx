import React, { useState } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Grid,
} from '@mui/material';

interface OrderEntryFormProps {
  onSubmit: (order: {
    quantity: number;
    priceType: string;
    limitPrice?: number;
  }) => void;
}

const OrderEntryForm: React.FC<OrderEntryFormProps> = ({ onSubmit }) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [priceType, setPriceType] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<number | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (priceType === '' || quantity <= 0) {
      alert('Please fill in all required fields.');
      return;
    }
    onSubmit({ quantity, priceType, limitPrice });
    // Reset form after submission
    setQuantity(0);
    setPriceType('');
    setLimitPrice(undefined);
  };

  const handlePriceTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPriceType(event.target.value as string);
    if(event.target.value !== 'Limit') {
      setLimitPrice(undefined); // Reset limit price if not a limit order
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            fullWidth
            required
            InputProps={{ inputProps: { min: 1 } }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel id="price-type-label">Price Type</InputLabel>
            <Select
              labelId="price-type-label"
              id="price-type-select"
              value={priceType}
              onChange={handlePriceTypeChange}
            >
              <MenuItem value="Market">Market</MenuItem>
              <MenuItem value="Limit">Limit</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {priceType === 'Limit' && (
          <Grid item xs={12}>
            <TextField
              label="Limit Price"
              type="number"
              value={limitPrice === undefined ? '' : limitPrice}
              onChange={(e) => setLimitPrice(Number(e.target.value))}
              fullWidth
              required
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <Button type="submit" variant="contained" color="primary">
            Submit Order
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default OrderEntryForm;