import React, { useState, useEffect } from 'react';
import { TextField, Button, Select, MenuItem, InputLabel, FormControl, Box, Typography } from '@mui/material';

interface SubscriptionFormProps {
  initialData?: SubscriptionDetails;
  onSubmit: (data: SubscriptionDetails) => void;
  isEditing?: boolean;
}

interface SubscriptionDetails {
  id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'annually' | 'quarterly';
  isActive: boolean;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  initialData,
  onSubmit,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<SubscriptionDetails>({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    isActive: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 500,
        margin: 'auto',
        padding: 3,
        border: '1px solid #ccc',
        borderRadius: 2,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        {isEditing ? 'Edit Subscription' : 'Create Subscription'}
      </Typography>

      <TextField
        label="Subscription Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        variant="outlined"
      />

      <TextField
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        multiline
        rows={4}
        variant="outlined"
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="Price"
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          required
          variant="outlined"
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: <InputLabel sx={{ mr: 1 }}>{formData.currency}</InputLabel>,
          }}
        />

        <FormControl variant="outlined" sx={{ minWidth: 120 }}>
          <InputLabel id="currency-label">Currency</InputLabel>
          <Select
            labelId="currency-label"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            label="Currency"
          >
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="EUR">EUR</MenuItem>
            <MenuItem value="GBP">GBP</MenuItem>
            {/* Add more currencies as needed */}
          </Select>
        </FormControl>
      </Box>

      <FormControl variant="outlined" required>
        <InputLabel id="billing-cycle-label">Billing Cycle</InputLabel>
        <Select
          labelId="billing-cycle-label"
          name="billingCycle"
          value={formData.billingCycle}
          onChange={handleChange}
          label="Billing Cycle"
        >
          <MenuItem value="monthly">Monthly</MenuItem>
          <MenuItem value="quarterly">Quarterly</MenuItem>
          <MenuItem value="annually">Annually</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <InputLabel htmlFor="isActive" sx={{ mr: 2 }}>Active:</InputLabel>
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleCheckboxChange}
        />
      </Box>

      <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
        {isEditing ? 'Update Subscription' : 'Create Subscription'}
      </Button>
    </Box>
  );
};

export default SubscriptionForm;