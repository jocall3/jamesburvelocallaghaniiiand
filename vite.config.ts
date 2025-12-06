
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const root = (process as any).cwd ? (process as any).cwd() : '.';

  return {
    base: './',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),

      // Payment & Banking Gateways
      'process.env.STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.STRIPE_PUBLISHABLE_KEY),
      'process.env.STRIPE_SECRET_KEY': JSON.stringify(env.STRIPE_SECRET_KEY), 
      'process.env.PLAID_CLIENT_ID': JSON.stringify(env.PLAID_CLIENT_ID),
      'process.env.PLAID_SECRET': JSON.stringify(env.PLAID_SECRET),
      'process.env.PLAID_ENV': JSON.stringify(env.PLAID_ENV || 'sandbox'),

      // Database Defaults (Can be overridden in Settings View)
      'process.env.DB_HOST': JSON.stringify(env.DB_HOST || 'localhost'),
      'process.env.DB_PORT': JSON.stringify(env.DB_PORT || '5432'),
      'process.env.DB_USER': JSON.stringify(env.DB_USER || 'postgres'),
      'process.env.DB_PASSWORD': JSON.stringify(env.DB_PASSWORD || 'password'),
      'process.env.DB_NAME': JSON.stringify(env.DB_NAME || 'sovereign_bank'),
    },

    resolve: {
      alias: {
        '@': path.resolve(root, '.'),
      },
    },
  };
});
