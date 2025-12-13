import Stripe from 'stripe';

// Initialize Stripe with your secret key.
// It's highly recommended to use environment variables for sensitive keys.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Use a specific API version for stability
});

export class CP_StripeIntegrationService {
  /**
   * Creates a new Stripe customer.
   * @param email The email address of the customer.
   * @param name The name of the customer.
   * @returns A Promise that resolves with the created Stripe customer object.
   */
  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email: email,
        name: name,
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Retrieves an existing Stripe customer by their ID.
   * @param customerId The ID of the Stripe customer.
   * @returns A Promise that resolves with the Stripe customer object.
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      console.error(`Error retrieving Stripe customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Creates a Stripe Checkout Session for a one-time payment.
   * @param customerId The ID of the Stripe customer.
   * @param priceId The ID of the Stripe Price object for the product.
   * @param successUrl The URL to redirect to after a successful payment.
   * @param cancelUrl The URL to redirect to if the payment is canceled.
   * @returns A Promise that resolves with the created Stripe Checkout Session object.
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      return session;
    } catch (error) {
      console.error('Error creating Stripe Checkout Session:', error);
      throw error;
    }
  }

  /**
   * Creates a Stripe Checkout Session for a subscription.
   * @param customerId The ID of the Stripe customer.
   * @param priceId The ID of the Stripe Price object for the product.
   * @param successUrl The URL to redirect to after a successful subscription setup.
   * @param cancelUrl The URL to redirect to if the subscription setup is canceled.
   * @returns A Promise that resolves with the created Stripe Checkout Session object.
   */
  async createSubscriptionCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      return session;
    } catch (error) {
      console.error('Error creating Stripe Subscription Checkout Session:', error);
      throw error;
    }
  }

  /**
   * Creates a Stripe Portal Session for managing subscriptions.
   * @param customerId The ID of the Stripe customer.
   * @param returnUrl The URL to redirect to after the customer leaves the portal.
   * @returns A Promise that resolves with the created Stripe Portal Session object.
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return session;
    } catch (error) {
      console.error('Error creating Stripe Portal Session:', error);
      throw error;
    }
  }

  /**
   * Retrieves a Stripe subscription by its ID.
   * @param subscriptionId The ID of the Stripe subscription.
   * @returns A Promise that resolves with the Stripe subscription object.
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error(`Error retrieving Stripe subscription ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Cancels a Stripe subscription.
   * @param subscriptionId The ID of the Stripe subscription to cancel.
   * @returns A Promise that resolves with the canceled Stripe subscription object.
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error(`Error canceling Stripe subscription ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Handles Stripe webhook events.
   * @param payload The raw request body of the webhook.
   * @param signature The value of the 'Stripe-Signature' header.
   * @returns A Promise that resolves with the verified Stripe event object.
   */
  async handleWebhook(payload: string, signature: string): Promise<Stripe.Event> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not configured.');
    }

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      return event;
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      throw new Error('Webhook signature verification failed.');
    }
  }

  /**
   * Retrieves a Stripe product by its ID.
   * @param productId The ID of the Stripe product.
   * @returns A Promise that resolves with the Stripe product object.
   */
  async getProduct(productId: string): Promise<Stripe.Product> {
    try {
      const product = await stripe.products.retrieve(productId);
      return product;
    } catch (error) {
      console.error(`Error retrieving Stripe product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a Stripe price by its ID.
   * @param priceId The ID of the Stripe price.
   * @returns A Promise that resolves with the Stripe price object.
   */
  async getPrice(priceId: string): Promise<Stripe.Price> {
    try {
      const price = await stripe.prices.retrieve(priceId);
      return price;
    } catch (error) {
      console.error(`Error retrieving Stripe price ${priceId}:`, error);
      throw error;
    }
  }
}