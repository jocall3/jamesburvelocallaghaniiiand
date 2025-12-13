import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface CustomerLocationProps {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const CustomerLocation: React.FC<CustomerLocationProps> = ({
  address,
  city,
  state,
  zipCode,
  country,
}) => {
  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Customer Location
        </Typography>
        <Box>
          <Typography variant="body1">
            <strong>Address:</strong> {address}
          </Typography>
          <Typography variant="body1">
            <strong>City:</strong> {city}
          </Typography>
          <Typography variant="body1">
            <strong>State:</strong> {state}
          </Typography>
          <Typography variant="body1">
            <strong>Zip Code:</strong> {zipCode}
          </Typography>
          <Typography variant="body1">
            <strong>Country:</strong> {country}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CustomerLocation;