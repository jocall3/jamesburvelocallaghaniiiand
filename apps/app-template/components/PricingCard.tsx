import React from 'react';
import { Box, Typography, Button, Card, CardContent, styled } from '@mui/material';

interface PricingCardProps {
  planName: string;
  price: number;
  features: string[];
  isPopular?: boolean;
  onSubscribe: () => void;
}

const StyledCard = styled(Card)(({ theme }) => ({
  border: '1px solid',
  borderColor: theme.palette.divider,
  borderRadius: theme.spacing(1),
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const PopularBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(0.5),
  fontSize: '0.75rem',
  fontWeight: 'bold',
}));


const PricingCard: React.FC<PricingCardProps> = ({
  planName,
  price,
  features,
  isPopular,
  onSubscribe,
}) => {
  return (
    <StyledCard>
      {isPopular && <PopularBadge>Popular</PopularBadge>}
      <CardContent>
        <Typography variant="h5" component="div" align="center" gutterBottom>
          {planName}
        </Typography>
        <Typography variant="h4" align="center" color="primary">
          ${price}
        </Typography>
        <Typography variant="subtitle2" align="center" color="textSecondary" gutterBottom>
          per month
        </Typography>
        <Box mt={2}>
          {features.map((feature, index) => (
            <Typography key={index} variant="body2" align="center">
              {feature}
            </Typography>
          ))}
        </Box>
        <Box mt={3} display="flex" justifyContent="center">
          <Button variant="contained" color="primary" onClick={onSubscribe}>
            Subscribe
          </Button>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default PricingCard;