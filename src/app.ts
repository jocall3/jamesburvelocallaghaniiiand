import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import billingRoutes from './routes/billingRoutes';
import config from './config';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsAllowedOrigins, // Use a configurable origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// HTTP request logger middleware
// 'dev' for concise output colored by response status for development
// 'combined' for standard Apache combined log output for production
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'Multi-Cloud Billing Normalizer API', version: config.apiVersion });
});

// Mount API routes
app.use('/api/v1/billing', billingRoutes);

// Catch-all for undefined routes (404)
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

export default app;