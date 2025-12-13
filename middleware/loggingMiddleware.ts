import { Request, Response, NextFunction } from 'express';

const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, body, query, params } = req;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] Incoming Request: ${method} ${url}`);
  if (Object.keys(body).length > 0) {
    console.log(`  Body: ${JSON.stringify(body)}`);
  }
  if (Object.keys(query).length > 0) {
    console.log(`  Query: ${JSON.stringify(query)}`);
  }
  if (Object.keys(params).length > 0) {
    console.log(`  Params: ${JSON.stringify(params)}`);
  }

  // Capture response data
  const originalSend = res.send;
  let responseBody: any;

  res.send = function (body: any): Response {
    responseBody = body;
    return originalSend.apply(this, arguments as any);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode, statusMessage } = res;
    const responseTimestamp = new Date().toISOString();

    console.log(`[${responseTimestamp}] Outgoing Response: ${method} ${url} - ${statusCode} ${statusMessage} (${duration}ms)`);
    if (responseBody) {
      try {
        const parsedBody = JSON.parse(responseBody);
        console.log(`  Response Body: ${JSON.stringify(parsedBody)}`);
      } catch (e) {
        console.log(`  Response Body: ${responseBody}`);
      }
    }
  });

  next();
};

export default loggingMiddleware;