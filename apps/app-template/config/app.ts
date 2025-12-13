export interface AppConfig {
  appId: string;
  appName: string;
  apiBaseUrl: string;
  subscriptionTiers: SubscriptionTier[];
  features: string[];
  theme?: ThemeConfig;
  supportEmail: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  contactUsUrl: string;
  logoUrl?: string;
  accentColor?: string;
}

export interface SubscriptionTier {
  name: string;
  price: number;
  features: string[];
  description: string;
  stripeProductId?: string; // Optional: Stripe Product ID for automated billing
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

const appConfig: AppConfig = {
  appId: 'app-template', // Replace with a unique ID for each app
  appName: 'App Template', // Replace with the app's name
  apiBaseUrl: '/api', // Replace with the actual API base URL
  subscriptionTiers: [
    {
      name: 'Basic',
      price: 0,
      features: ['Feature 1', 'Feature 2'],
      description: 'Free tier with basic features.',
    },
    {
      name: 'Premium',
      price: 9.99,
      features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],
      description: 'Premium tier with advanced features.',
      stripeProductId: 'your_stripe_product_id', // Replace with your Stripe Product ID
    },
  ],
  features: ['Feature 1', 'Feature 2'],
  theme: {
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    fontFamily: 'Arial, sans-serif',
  },
  supportEmail: 'support@example.com', // Replace with the actual support email
  privacyPolicyUrl: '/privacy-policy', // Replace with the actual privacy policy URL
  termsOfServiceUrl: '/terms-of-service', // Replace with the actual terms of service URL
  contactUsUrl: '/contact-us', // Replace with the actual contact us URL
  logoUrl: '/logo.png', // Replace with the actual logo URL
  accentColor: '#28a745',
};

export default appConfig;