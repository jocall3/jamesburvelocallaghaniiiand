import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { globalErrorHandler } from '../middleware/errorHandler';
import { CitibankdemobusinessincOrchestrator } from './CitibankdemobusinessincOrchestrator'; // Import the orchestrator

/**
 * @class SovereignServer
 * @description Encapsulates the core server logic for the Citibankdemobusinessinc ecosystem.
 * It is responsible for initializing middleware, setting up routes, handling errors,
 * and managing the server lifecycle, including the orchestration layer.
 */
class SovereignServer {
    private app: Application;
    private server: http.Server;
    private readonly port: number;
    private orchestrator: CitibankdemobusinessincOrchestrator;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = parseInt(config.PORT || '5000', 10);
        this.orchestrator = new CitibankdemobusinessincOrchestrator(); // Initialize the orchestrator
        
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
     * @description Sets up the API routes for the application, including the main orchestration endpoint.
     */
    private initializeRoutes(): void {
        // Health check endpoint for monitoring services
        this.app.get('/health', (_req: Request, res: Response) => {
            res.status(200).json({ 
                status: 'UP', 
                timestamp: new Date().toISOString(),
                service: 'Citibankdemobusinessinc Ecosystem Orchestrator'
            });
        });

        // Main orchestration endpoint for the Citibankdemobusinessinc ecosystem
        this.app.post('/api/v1/citibankdemobusinessinc/orchestrate', async (req: Request, res: Response, next: NextFunction) => {
            try {
                logger.info('Received Citibankdemobusinessinc ecosystem orchestration request', { body: req.body });
                
                // Delegate orchestration logic to the CitibankdemobusinessincOrchestrator
                const result = await this.orchestrator.handleOrchestration(req.body);
                
                res.status(200).json({
                    message: "Citibankdemobusinessinc ecosystem orchestration successful.",
                    trackingId: result.trackingId,
                    data: result.data
                });
            } catch (error) {
                logger.error('Error during Citibankdemobusinessinc ecosystem orchestration', { error });
                next(error); // Pass error to the global error handler
            }
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
            logger.info(`ðŸš€ Citibankdemobusinessinc Ecosystem Orchestrator is live.`);
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
            logger.info('âœ… HTTP server closed.');
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