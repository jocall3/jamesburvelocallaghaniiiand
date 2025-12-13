import React, { useState, useEffect } from 'react';
import { TextField, Button, Grid, Typography, Box } from '@mui/material';

interface Customer {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
}

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (customer: Customer) => void;
  onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Customer>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        {customer ? 'Edit Customer' : 'Add New Customer'}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="firstName"
            label="First Name"
            name="firstName"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="lastName"
            label="Last Name"
            name="lastName"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="phone"
            label="Phone Number"
            name="phone"
            autoComplete="tel"
            value={formData.phone || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="address"
            label="Address"
            name="address"
            autoComplete="street-address"
            value={formData.address || ''}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" color="primary">
          {customer ? 'Update Customer' : 'Add Customer'}
        </Button>
      </Box>
    </Box>
  );
};

export default CustomerForm;