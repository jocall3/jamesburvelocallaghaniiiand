import Stripe from 'stripe';
import { logger } from '../utils/logger'; // Assuming a logger utility exists
import { AppError } from '../utils/errors'; // Assuming a custom error class exists

/**
 * Configuration options for the billing portal service.
 */
interface BillingPortalServiceConfig {
  stripeSecretKey: string;
  // Potentially other configurations like webhook secrets, default return URLs, etc.
}

/**
 * Represents the result of creating a billing portal session.
 */
interface BillingPortalSessionResult {
  sessionUrl: string;
}

/**
 * CL_BillingPortalService
 *
 * Business logic for creating and managing billing portal sessions for customers.
 * Implements AE63: Customer can access their billing portal to manage subscriptions.
 * Implements AE64: Billing portal session creation handles different customer states.
 *
 * This service interacts with the Stripe API to generate secure, temporary URLs
 * that allow customers to manage their subscriptions, payment methods, and billing history.
 */
export class CL_BillingPortalService {
  private stripe: Stripe;

  constructor(config: BillingPortalServiceConfig) {
    if (!config.stripeSecretKey) {
      logger.error('Stripe secret key is missing in BillingPortalService configuration.');
      throw new Error('Stripe secret key is required for CL_BillingPortalService.');
    }
    this.stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2023-10-16', // Use a specific API version for consistency
    });
    logger.info('CL_BillingPortalService initialized.');
  }

  /**
   * Creates a Stripe Billing Portal session for a given customer.
   * This allows customers to manage their subscriptions, payment methods, and view invoices.
   *
   * @param customerId The ID of the customer in Stripe.
   * @param returnUrl The URL where the customer will be redirected after managing their billing.
   * @param appId Optional. The ID of the application associated with the customer's subscription.
   *              Can be used for logging or specific portal configurations if needed.
   * @returns A promise that resolves to an object containing the URL of the billing portal session.
   * @throws AppError if the customerId or returnUrl is invalid, or if the Stripe API call fails.
   */
  public async createBillingPortalSession(
    customerId: string,
    returnUrl: string,
    appId?: string,
  ): Promise<BillingPortalSessionResult> {
    if (!customerId) {
      logger.warn('Attempted to create billing portal session with missing customerId.');
      throw new AppError('Customer ID is required to create a billing portal session.', 400);
    }
    if (!returnUrl) {
      logger.warn(`Attempted to create billing portal session for customer ${customerId} with missing returnUrl.`);
      throw new AppError('Return URL is required to create a billing portal session.', 400);
    }

    try {
      logger.info(`Creating billing portal session for customer: ${customerId}, app: ${appId || 'N/A'}`);

      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
        // You can specify a configuration ID if you have multiple portal configurations
        // configuration: 'bpc_12345',
      });

      if (!session.url) {
        logger.error(`Stripe did not return a URL for billing portal session for customer ${customerId}.`);
        throw new AppError('Failed to retrieve billing portal session URL from Stripe.', 500);
      }

      logger.info(`Successfully created billing portal session for customer ${customerId}. URL: ${session.url}`);
      return { sessionUrl: session.url };
    } catch (error: any) {
      logger.error(`Error creating billing portal session for customer ${customerId}:`, error);

      if (error instanceof Stripe.errors.StripeError) {
        // Handle specific Stripe errors
        if (error.type === 'StripeInvalidRequestError') {
          throw new AppError(`Invalid request to Stripe API: ${error.message}`, 400, error);
        }
        throw new AppError(`Stripe API error: ${error.message}`, 500, error);
      } else if (error instanceof AppError) {
        throw error; // Re-throw our custom errors
      } else {
        throw new AppError('An unexpected error occurred while creating the billing portal session.', 500, error);
      }
    }
  }
}