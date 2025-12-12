import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { router as paymentRoutes } from './routes/paymentRoutes';
import { router as webhookRoutes } from './routes/webhookRoutes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { connectToDatabase } from './config/database';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import { initializeAdmin } from './config/firebaseAdmin';
import { router as adminRoutes } from './routes/adminRoutes';
import { router as healthCheckRoutes } from './routes/healthCheckRoutes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Connect to database
connectToDatabase();

// Initialize Firebase Admin SDK
initializeAdmin();

// Security Middleware
app.use(cors()); // Enable CORS for all origins (for development, configure for production)
app.use(helmet()); // Set security HTTP headers
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(xss()); // Prevent XSS attacks
app.use(mongoSanitize()); // Sanitize data to prevent NoSQL injection

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// Routes
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/health', healthCheckRoutes);

// Error handling middleware
app.use(errorHandler);

// Start the server
const server = app.listen(port, () => {
  console.log(`Payment Gateway Service listening on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error, promise: Promise<any>) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});