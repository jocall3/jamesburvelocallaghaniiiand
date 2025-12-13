import Stripe from 'stripe';

// Load environment variables
// In a real-world application, you would use a library like 'dotenv' to load these.
// For this example, we'll assume they are available in the environment.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
}

if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error('STRIPE_PUBLISHABLE_KEY environment variable is not set.');
}

// Initialize the Stripe client
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10', // Use the latest stable API version
});

export { stripe, STRIPE_PUBLISHABLE_KEY };