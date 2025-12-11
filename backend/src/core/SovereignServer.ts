import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { globalErrorHandler } from '../middleware/errorHandler';
// import apiRoutes from '../api/routes'; // Centralized API router

/**
 * @class SovereignServer
 * @description Encapsulates the core server logic for the Data Orchestration Gateway.
 * It is responsible for initializing middleware, setting up routes, handling errors,
 * and managing the server lifecycle.
 */
class SovereignServer {
    private app: Application;
    private server: http.Server;
    private readonly port: number;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = parseInt(config.PORT || '5000', 10);
        
        this.initializeCore();
    }

    private initializeCore(): void {
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    /**
     * @private
     * @description Initializes all application-level middleware.
     */
    private initializeMiddleware(): void {
        // Security middleware
        this.app.use(helmet());

        // CORS middleware
        this.app.use(cors({
            origin: config.CORS_ORIGIN,
            credentials: true,
        }));

        // Request body parsers
        this.app.use(express.json({ limit: '10kb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));

        // HTTP request logging middleware
        const morganFormat = config.NODE_ENV === 'production' ? 'combined' : 'dev';
        this.app.use(morgan(morganFormat, {
            stream: {
                write: (message: string) => logger.http(message.trim()),
            },
        }));
    }

    /**
     * @private
     * @description Sets up the API routes for the application.
     */
    private initializeRoutes(): void {
        // Health check endpoint for monitoring services
        this.app.get('/health', (_req: Request, res: Response) => {
            res.status(200).json({ 
                status: 'UP', 
                timestamp: new Date().toISOString(),
                service: 'Sovereign Data Orchestration Gateway'
            });
        });

        // Main API routes can be modularized here
        // this.app.use('/api/v1', apiRoutes);

        // Placeholder for a primary orchestration endpoint
        this.app.post('/api/v1/orchestrate', (req: Request, res: Response) => {
            logger.info('Received orchestration request', { body: req.body });
            
            // In a real implementation, this logic would be complex:
            // 1. Parse and validate the incoming request schema against a defined model.
            // 2. Deconstruct the request into sub-tasks for downstream microservices.
            // 3. Use a service discovery mechanism (e.g., Consul, Eureka) to find services.
            // 4. Dispatch requests to services (e.g., via gRPC, REST, or a message queue like Kafka/RabbitMQ).
            // 5. Aggregate, transform, and enrich the data from service responses.
            // 6. Implement patterns like Saga for distributed transactions if needed.
            // 7. Handle partial failures, retries, and circuit breaking.
            
            res.status(202).json({
                message: "Orchestration request accepted and is being processed.",
                trackingId: `txn-${Date.now()}`,
                requestPayload: req.body
            });
        });

        // Catch-all route for unhandled requests
        this.app.all('*', (req: Request, _res: Response, next: NextFunction) => {
            next(new AppError(`The requested URL ${req.originalUrl} was not found on this server.`, 404));
        });
    }

    /**
     * @private
     * @description Initializes the global error handling middleware.
     */
    private initializeErrorHandling(): void {
        this.app.use(globalErrorHandler);
    }
    
    /**
     * @public
     * @description Starts the HTTP server and listens for incoming connections.
     */
    public start(): void {
        this.server.listen(this.port, () => {
            logger.info(`🚀 Sovereign Data Orchestration Gateway is live.`);
            logger.info(`Environment: ${config.NODE_ENV}`);
            logger.info(`Listening on port: ${this.port}`);
        });

        // Set up graceful shutdown
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('SIGINT', () => this.shutdown('SIGINT'));
    }

    /**
     * @private
     * @param signal The signal received (e.g., 'SIGTERM', 'SIGINT').
     * @description Handles graceful shutdown of the server.
     */
    private shutdown(signal: string): void {
        logger.warn(`Received ${signal}. Initiating graceful shutdown...`);
        
        this.server.close(() => {
            logger.info('✅ HTTP server closed.');
            // Disconnect from databases, message queues, etc.
            // For example: mongoose.connection.close(false, () => logger.info('MongoDB connection closed.'));
            process.exit(0);
        });

        // Force shutdown if graceful shutdown fails after a timeout
        setTimeout(() => {
            logger.error('Graceful shutdown timed out. Forcing exit.');
            process.exit(1);
        }, 10000); // 10-second timeout
    }
}

// Application entry point
if (require.main === module) {
    const sovereignServer = new SovereignServer();
    sovereignServer.start();
}

export { SovereignServer };