import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Grid, Select, MenuItem, InputLabel, FormControl } from '@mui/material';

interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  subscriptionEnabled: boolean;
  subscriptionPrice?: number;
  subscriptionInterval?: 'month' | 'year';
}

interface ProductFormProps {
  initialProduct?: Product;
  onSubmit: (product: Product) => void;
  isEditing?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialProduct, onSubmit, isEditing = false }) => {
  const [product, setProduct] = useState<Product>({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    subscriptionEnabled: false,
    subscriptionPrice: 0,
    subscriptionInterval: 'month',
  });

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
    }
  }, [initialProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setProduct((prevProduct) => ({
      ...prevProduct,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setProduct((prevProduct) => ({
      ...prevProduct,
      [name]: checked,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(product);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        {isEditing ? 'Edit Product' : 'Create New Product'}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Product Name"
            name="name"
            value={product.name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            multiline
            rows={4}
            label="Description"
            name="description"
            value={product.description}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            required
            fullWidth
            type="number"
            label="Price"
            name="price"
            value={product.price}
            onChange={handleChange}
            InputProps={{
              startAdornment: <InputLabel sx={{ mr: 1 }}>{product.currency}</InputLabel>,
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth required>
            <InputLabel id="currency-label">Currency</InputLabel>
            <Select
              labelId="currency-label"
              name="currency"
              value={product.currency}
              onChange={handleChange as any} // Cast to any to satisfy Select's onChange type
              label="Currency"
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="GBP">GBP</MenuItem>
              {/* Add more currencies as needed */}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={product.subscriptionEnabled}
                onChange={handleCheckboxChange}
                name="subscriptionEnabled"
              />
            }
            label="Enable Subscription"
          />
        </Grid>

        {product.subscriptionEnabled && (
          <>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Subscription Price"
                name="subscriptionPrice"
                value={product.subscriptionPrice}
                onChange={handleChange}
                disabled={!product.subscriptionEnabled}
                InputProps={{
                  startAdornment: <InputLabel sx={{ mr: 1 }}>{product.currency}</InputLabel>,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth disabled={!product.subscriptionEnabled}>
                <InputLabel id="subscription-interval-label">Subscription Interval</InputLabel>
                <Select
                  labelId="subscription-interval-label"
                  name="subscriptionInterval"
                  value={product.subscriptionInterval}
                  onChange={handleChange as any} // Cast to any to satisfy Select's onChange type
                  label="Subscription Interval"
                >
                  <MenuItem value="month">Monthly</MenuItem>
                  <MenuItem value="year">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </>
        )}
      </Grid>
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        {isEditing ? 'Update Product' : 'Create Product'}
      </Button>
    </Box>
  );
};

export default ProductForm;