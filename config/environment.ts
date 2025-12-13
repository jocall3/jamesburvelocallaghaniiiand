import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  APP_URL: string;
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  EMAIL_FROM: string;
  REDIS_URL: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  S3_BUCKET_NAME?: string;
}

const environment: Environment = {
  NODE_ENV: (process.env.NODE_ENV as Environment['NODE_ENV']) || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@host:port/database',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_...',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.example.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_USER: process.env.EMAIL_USER || 'user@example.com',
  EMAIL_PASS: process.env.EMAIL_PASS || 'password',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@example.com',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
};

// Basic validation for critical variables
if (!environment.DATABASE_URL) {
  console.error('FATAL ERROR: DATABASE_URL is not defined.');
  process.exit(1);
}
if (!environment.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}
if (!environment.STRIPE_SECRET_KEY) {
  console.error('FATAL ERROR: STRIPE_SECRET_KEY is not defined.');
  process.exit(1);
}
if (!environment.STRIPE_WEBHOOK_SECRET) {
  console.error('FATAL ERROR: STRIPE_WEBHOOK_SECRET is not defined.');
  process.exit(1);
}

export default environment;