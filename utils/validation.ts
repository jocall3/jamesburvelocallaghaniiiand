import * as yup from 'yup';

/**
 * Defines validation schemas for various parts of API requests.
 * This module provides a centralized place to define and export
 * reusable validation schemas, making it easier to maintain and
 * apply consistent validation rules across the application.
 */

// Example Schema for a generic subscription creation request
export const subscriptionCreateSchema = yup.object({
  planId: yup.string().required('Plan ID is required'),
  userId: yup.string().required('User ID is required'),
  startDate: yup.date().optional(),
  endDate: yup.date().optional(),
  metadata: yup.object().optional(),
});

// Example Schema for updating an existing subscription
export const subscriptionUpdateSchema = yup.object({
  subscriptionId: yup.string().required('Subscription ID is required'),
  status: yup.string().oneOf(['active', 'canceled', 'paused', 'expired']).optional(),
  endDate: yup.date().optional(),
  metadata: yup.object().optional(),
});

// Example Schema for retrieving a subscription
export const subscriptionGetSchema = yup.object({
  subscriptionId: yup.string().required('Subscription ID is required'),
});

// Example Schema for a generic user profile
export const userProfileSchema = yup.object({
  name: yup.string().min(2).max(50).required('Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  age: yup.number().integer().min(18).optional(),
});

// Example Schema for a product
export const productSchema = yup.object({
  name: yup.string().min(3).max(100).required('Product name is required'),
  description: yup.string().optional(),
  price: yup.number().positive().required('Price is required'),
  currency: yup.string().length(3).uppercase().required('Currency is required'),
});

// Example Schema for a payment intent
export const paymentIntentSchema = yup.object({
  amount: yup.number().positive().required('Amount is required'),
  currency: yup.string().length(3).uppercase().required('Currency is required'),
  paymentMethodId: yup.string().optional(),
  customerId: yup.string().optional(),
});

/**
 * A utility function to validate data against a given Yup schema.
 * @param data - The data to validate.
 * @param schema - The Yup validation schema.
 * @returns A Promise that resolves if validation passes, or rejects with a validation error.
 */
export async function validateData<T>(data: T, schema: yup.Schema<T>): Promise<void> {
  try {
    await schema.validate(data, { abortEarly: false });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      // You might want to format this error more nicely for API responses
      throw new Error(`Validation failed: ${error.errors.join(', ')}`);
    }
    throw error; // Re-throw other types of errors
  }
}

/**
 * Middleware function to validate request body against a Yup schema.
 * This is useful for Express.js or similar frameworks.
 * @param schema - The Yup validation schema to use for the request body.
 * @returns A middleware function.
 */
export const validateRequestBody = (schema: yup.AnySchema) => async (req: any, res: any, next: any) => {
  try {
    await schema.validate(req.body, { abortEarly: false });
    next();
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    next(error); // Pass other errors to the error handler
  }
};

/**
 * Middleware function to validate request parameters against a Yup schema.
 * This is useful for Express.js or similar frameworks.
 * @param schema - The Yup validation schema to use for the request parameters.
 * @returns A middleware function.
 */
export const validateRequestParams = (schema: yup.AnySchema) => async (req: any, res: any, next: any) => {
  try {
    await schema.validate(req.params, { abortEarly: false });
    next();
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    next(error); // Pass other errors to the error handler
  }
};

/**
 * Middleware function to validate request query against a Yup schema.
 * This is useful for Express.js or similar frameworks.
 * @param schema - The Yup validation schema to use for the request query.
 * @returns A middleware function.
 */
export const validateRequestQuery = (schema: yup.AnySchema) => async (req: any, res: any, next: any) => {
  try {
    await schema.validate(req.query, { abortEarly: false });
    next();
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    next(error); // Pass other errors to the error handler
  }
};