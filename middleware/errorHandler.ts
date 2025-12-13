import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  status: string;
  statusCode: number;
  message: string;
  stack?: string;
}

const errorHandler = (
  err: any,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  console.error('Unhandled Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const errorResponse: ErrorResponse = {
    status: 'error',
    statusCode: statusCode,
    message: message,
  };

  // Optionally, include stack trace in development environment
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;