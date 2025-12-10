import { Request, Response, NextFunction } from 'express';
import { Server } from 'http'; // Import Server type for graceful shutdown

/**
 * Base custom error class for operational errors.
 * These errors are expected and can be handled gracefully by sending a specific message to the client.
 */
export class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message); // Call parent constructor (Error) with the message

        this.statusCode = statusCode;
        // Determine status based on status code (e.g., 4xx for 'fail', 5xx for 'error')
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Mark as an operational error

        // Capture stack trace to get accurate file and line number where the error occurred
        // This helps in debugging by showing where the AppError was instantiated.
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Specific error classes for common HTTP status codes, extending AppError.
 * This provides semantic clarity and allows for easier error handling.
 */
export class BadRequestError extends AppError {
    constructor(message = 'Bad Request') {
        super(message, 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}

export class InternalServerError extends AppError {
    constructor(message = 'Internal Server Error') {
        super(message, 500);
    }
}

/**
 * Sends detailed error responses during development.
 * Includes stack trace and full error object for debugging.
 */
const sendErrorDev = (err: AppError, res: Response) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

/**
 * Sends simplified error responses in production.
 * Differentiates between operational errors (client-facing message) and
 * programming errors (generic message to prevent leaking sensitive info).
 */
const sendErrorProd = (err: AppError, res: Response) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        // Programming or other unknown error: don't leak error details
        // 1) Log error for internal monitoring
        console.error('ERROR 💥', err);

        // 2) Send generic message to client
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
    }
};

/**
 * Global error handling middleware for Express applications.
 * This catches all errors passed to `next(err)` and formats the response.
 * It distinguishes between development and production environments for error details.
 */
export const globalErrorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
    // Set default status code and status if not already set on the error object
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        // Create a mutable copy of the error object to avoid modifying the original
        // This ensures that the prototype chain is preserved for `instanceof` checks.
        let error: AppError = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
        error.message = err.message; // Ensure message is copied if it's not enumerable

        // --- Add specific error handling logic for common production errors here ---
        // This section can be expanded based on the specific technologies used in the project.
        // For example, if using a database like MongoDB with Mongoose:
        // if (error.name === 'CastError') error = new BadRequestError(`Invalid ${error.path}: ${error.value}.`);
        // if (error.code === 11000) error = new BadRequestError('Duplicate field value. Please use another value!');
        // if (error.name === 'ValidationError') {
        //     const errors = Object.values(error.errors).map((el: any) => el.message);
        //     error = new BadRequestError(`Invalid input data. ${errors.join('. ')}`);
        // }
        // If using JWT for authentication:
        // if (error.name === 'JsonWebTokenError') error = new UnauthorizedError('Invalid token. Please log in again!');
        // if (error.name === 'TokenExpiredError') error = new UnauthorizedError('Your token has expired! Please log in again.');
        // --------------------------------------------------------------------------

        sendErrorProd(error, res);
    }
};

/**
 * Utility function to wrap asynchronous route handlers.
 * This avoids the need for repetitive try-catch blocks in every async controller function
 * by automatically catching any errors and passing them to the global error handler.
 */
export const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};

/**
 * Sets up global process error handlers for uncaught exceptions and unhandled promise rejections.
 * These handlers log the error and gracefully shut down the application.
 * This function should be called once at the application's entry point (e.g., `server.ts` or `app.ts`).
 *
 * @param server An optional HTTP server instance to close gracefully before exiting.
 */
export const setupGlobalProcessErrorHandlers = (server?: Server) => {
    // Handle uncaught exceptions (synchronous errors not caught by try-catch)
    process.on('uncaughtException', (err: Error) => {
        console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        console.error(err.name, err.message, err.stack);
        // For uncaught exceptions, it's generally unsafe to continue.
        // Exit immediately.
        process.exit(1);
    });

    // Handle unhandled promise rejections (asynchronous errors not caught by .catch())
    process.on('unhandledRejection', (err: Error) => {
        console.error('UNHANDLED REJECTION! 💥 Shutting down...');
        console.error(err.name, err.message, err.stack);
        // For unhandled rejections, it's safer to gracefully close the server
        // before exiting, allowing any pending requests to finish.
        if (server) {
            server.close(() => {
                process.exit(1);
            });
        } else {
            // If no server instance is provided, just exit.
            process.exit(1);
        }
    });
};