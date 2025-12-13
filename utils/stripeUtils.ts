import Stripe from 'stripe';

// Initialize Stripe with your secret key.
// It's highly recommended to use environment variables for your secret key.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Use the latest stable API version
});

/**
 * Creates a new Stripe customer.
 * @param email The email address of the customer.
 * @param name The name of the customer.
 * @returns A Promise that resolves with the created Stripe customer object.
 */
export async function createStripeCustomer(email: string, name?: string): Promise<Stripe.Customer> {
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
 * @returns A Promise that resolves with the Stripe customer object, or null if not found.
 */
export async function getStripeCustomer(customerId: string): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    return customer;
  } catch (error: any) {
    if (error.type === 'idempotency_error') {
      console.error('Stripe idempotency error:', error);
      // Handle idempotency errors appropriately, e.g., retry with the same idempotency key
    } else if (error.code === 'resource_missing') {
      console.warn(`Stripe customer with ID ${customerId} not found.`);
      return null;
    } else {
      console.error('Error retrieving Stripe customer:', error);
    }
    throw error;
  }
}

/**
 * Updates an existing Stripe customer.
 * @param customerId The ID of the Stripe customer to update.
 * @param data The data to update the customer with.
 * @returns A Promise that resolves with the updated Stripe customer object.
 */
export async function updateStripeCustomer(customerId: string, data: Stripe.CustomerUpdateParams): Promise<Stripe.Customer> {
  try {
    const customer = await stripe.customers.update(customerId, data);
    return customer;
  } catch (error) {
    console.error('Error updating Stripe customer:', error);
    throw error;
  }
}

/**
 * Creates a new Stripe product.
 * @param name The name of the product.
 * @param description A description of the product.
 * @returns A Promise that resolves with the created Stripe product object.
 */
export async function createStripeProduct(name: string, description?: string): Promise<Stripe.Product> {
  try {
    const product = await stripe.products.create({
      name: name,
      description: description,
    });
    return product;
  } catch (error) {
    console.error('Error creating Stripe product:', error);
    throw error;
  }
}

/**
 * Creates a new Stripe price for a given product.
 * @param productId The ID of the product to associate the price with.
 * @param unitAmount The price in cents.
 * @param currency The currency of the price (e.g., 'usd').
 * @param recurring An object defining the recurring interval (e.g., { interval: 'month' }).
 * @returns A Promise that resolves with the created Stripe price object.
 */
export async function createStripePrice(
  productId: string,
  unitAmount: number,
  currency: string,
  recurring?: Stripe.PriceCreateParams.Recurring
): Promise<Stripe.Price> {
  try {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: unitAmount,
      currency: currency,
      recurring: recurring,
    });
    return price;
  } catch (error) {
    console.error('Error creating Stripe price:', error);
    throw error;
  }
}

/**
 * Creates a new Stripe Checkout Session for subscription creation.
 * @param customerId The ID of the Stripe customer.
 * @param priceId The ID of the Stripe price to subscribe to.
 * @param successUrl The URL to redirect to after successful subscription creation.
 * @param cancelUrl The URL to redirect to if the user cancels the subscription.
 * @returns A Promise that resolves with the created Stripe Checkout Session object.
 */
export async function createStripeCheckoutSession(
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
    console.error('Error creating Stripe Checkout Session:', error);
    throw error;
  }
}

/**
 * Retrieves a Stripe subscription by its ID.
 * @param subscriptionId The ID of the Stripe subscription.
 * @returns A Promise that resolves with the Stripe subscription object.
 */
export async function getStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
    return subscription;
  } catch (error) {
    console.error('Error retrieving Stripe subscription:', error);
    throw error;
  }
}

/**
 * Cancels a Stripe subscription.
 * @param subscriptionId The ID of the Stripe subscription to cancel.
 * @returns A Promise that resolves with the canceled Stripe subscription object.
 */
export async function cancelStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.del(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error canceling Stripe subscription:', error);
    throw error;
  }
}

/**
 * Retrieves a Stripe payment intent by its ID.
 * @param paymentIntentId The ID of the Stripe payment intent.
 * @returns A Promise that resolves with the Stripe payment intent object.
 */
export async function getStripePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId) as Stripe.PaymentIntent;
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving Stripe payment intent:', error);
    throw error;
  }
}

/**
 * Creates a Stripe Payment Method.
 * @param paymentMethodData The data for the payment method.
 * @returns A Promise that resolves with the created Stripe Payment Method object.
 */
export async function createStripePaymentMethod(paymentMethodData: Stripe.PaymentMethodCreateParams): Promise<Stripe.PaymentMethod> {
  try {
    const paymentMethod = await stripe.paymentMethods.create(paymentMethodData);
    return paymentMethod;
  } catch (error) {
    console.error('Error creating Stripe Payment Method:', error);
    throw error;
  }
}

/**
 * Attaches a Payment Method to a Customer.
 * @param customerId The ID of the Stripe customer.
 * @param paymentMethodId The ID of the Stripe Payment Method.
 * @returns A Promise that resolves with the updated Stripe Customer object.
 */
export async function attachPaymentMethodToCustomer(customerId: string, paymentMethodId: string): Promise<Stripe.Customer> {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    // Update the customer to set the default payment method if desired
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });
    return customer;
  } catch (error) {
    console.error('Error attaching Payment Method to Customer:', error);
    throw error;
  }
}

/**
 * Retrieves a list of Stripe subscriptions for a given customer.
 * @param customerId The ID of the Stripe customer.
 * @param status The status of the subscriptions to retrieve (e.g., 'active', 'canceled').
 * @returns A Promise that resolves with a list of Stripe subscription objects.
 */
export async function listStripeSubscriptionsForCustomer(
  customerId: string,
  status?: Stripe.SubscriptionListParams.Status
): Promise<Stripe.ApiList<Stripe.Subscription>> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: status,
    });
    return subscriptions;
  } catch (error) {
    console.error('Error listing Stripe subscriptions for customer:', error);
    throw error;
  }
}

/**
 * Handles Stripe webhook events.
 * @param payload The raw request body of the webhook.
 * @param signature The value of the 'Stripe-Signature' header.
 * @returns A Promise that resolves with the Stripe event object.
 */
export async function constructStripeEvent(payload: string, signature: string): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured.');
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    throw new Error('Webhook signature verification failed.');
  }
}

/**
 * Retrieves a Stripe Price object.
 * @param priceId The ID of the Stripe Price.
 * @returns A Promise that resolves with the Stripe Price object.
 */
export async function getStripePrice(priceId: string): Promise<Stripe.Price> {
  try {
    const price = await stripe.prices.retrieve(priceId) as Stripe.Price;
    return price;
  } catch (error) {
    console.error('Error retrieving Stripe Price:', error);
    throw error;
  }
}

/**
 * Retrieves a Stripe Product object.
 * @param productId The ID of the Stripe Product.
 * @returns A Promise that resolves with the Stripe Product object.
 */
export async function getStripeProduct(productId: string): Promise<Stripe.Product> {
  try {
    const product = await stripe.products.retrieve(productId) as Stripe.Product;
    return product;
  } catch (error) {
    console.error('Error retrieving Stripe Product:', error);
    throw error;
  }
}