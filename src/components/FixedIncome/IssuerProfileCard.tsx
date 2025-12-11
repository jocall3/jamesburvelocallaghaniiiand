```tsx
import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

interface IssuerProfileCardProps {
  issuer: string;
  sector: string;
  profileDescription: string;
  ratingAgency?: string;
  rating?: string;
  ratingDate?: string;
}

const IssuerProfileCard: React.FC<IssuerProfileCardProps> = ({
  issuer,
  sector,
  profileDescription,
  ratingAgency,
  rating,
  ratingDate,
}) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="div">
          Issuer Profile
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              Issuer: {issuer}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              Sector: {sector}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2">
              {profileDescription}
            </Typography>
          </Grid>
          {ratingAgency && rating && ratingDate && (
            <>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">
                  Rating Agency: {ratingAgency}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">
                  Rating: {rating}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">
                  Rating Date: {ratingDate}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default IssuerProfileCard;
```