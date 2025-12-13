import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Button } from '@mui/material';
import { styled } from '@mui/system';

// Styled components for better visual appearance
const PricingCard = styled(Card)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3),
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const PricingButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

interface PricingPlan {
  name: string;
  price: number;
  features: string[];
  description?: string;
}

const pricingPlans: PricingPlan[] = [
  {
    name: 'Basic',
    price: 9.99,
    features: ['Limited Access', 'Basic Features', 'Standard Support'],
    description: 'Perfect for individuals just getting started.'
  },
  {
    name: 'Premium',
    price: 29.99,
    features: ['Full Access', 'Advanced Features', 'Priority Support', 'Analytics Dashboard'],
    description: 'Ideal for professionals and small teams.'
  },
  {
    name: 'Enterprise',
    price: 99.99,
    features: ['Unlimited Access', 'All Features', '24/7 Support', 'Dedicated Account Manager', 'Custom Integrations'],
    description: 'For large organizations needing comprehensive solutions.'
  },
];

const PricingPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Subscription Plans
      </Typography>
      <Typography variant="body1" align="center" color="textSecondary">
        Choose the plan that best suits your needs.
      </Typography>

      <Grid container spacing={3} mt={3}>
        {pricingPlans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.name}>
            <PricingCard>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {plan.name}
                </Typography>
                <Typography variant="h5" component="p">
                  ${plan.price}/month
                </Typography>
                {plan.description && (
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    {plan.description}
                  </Typography>
                )}
                <Box mt={2}>
                  {plan.features.map((feature, index) => (
                    <Typography variant="body2" key={index}>
                      - {feature}
                    </Typography>
                  ))}
                </Box>
                <PricingButton variant="contained">
                  Subscribe
                </PricingButton>
              </CardContent>
            </PricingCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default PricingPage;