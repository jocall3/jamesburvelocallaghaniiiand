import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import morgan from 'morgan';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('API Gateway is healthy');
});

// Proxy endpoints
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3004';

// User service proxy
app.use('/users', createProxyMiddleware({
  target: userServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/users': '/', // Remove the /users prefix when forwarding the request
  },
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
}));

// Product service proxy
app.use('/products', createProxyMiddleware({
  target: productServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/products': '/', // Remove the /products prefix when forwarding the request
  },
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
}));

// Order service proxy
app.use('/orders', createProxyMiddleware({
  target: orderServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/orders': '/', // Remove the /orders prefix when forwarding the request
  },
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
}));

// Auth service proxy
app.use('/auth', createProxyMiddleware({
    target: authServiceUrl,
    changeOrigin: true,
    pathRewrite: {
        '^/auth': '/',
    },
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
}));

// Start the server
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});