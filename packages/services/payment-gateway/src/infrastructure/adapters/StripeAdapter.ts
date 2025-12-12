import Stripe from 'stripe';
import { PaymentIntent, PaymentMethod } from '../../domain/entities/Payment';
import { PaymentGateway } from '../../domain/ports/PaymentGateway';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StripeAdapter implements PaymentGateway {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
      };
    } catch (error: any) {
      console.error('Error creating Payment Intent:', error);
      throw new Error(`Failed to create Payment Intent: ${error.message}`);
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent) {
        return null;
      }

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
      };
    } catch (error: any) {
      console.error('Error retrieving Payment Intent:', error);
      return null;
    }
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);

      if (!paymentIntent) {
        return null;
      }

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
      };
    } catch (error: any) {
      console.error('Error cancelling Payment Intent:', error);
      return null;
    }
  }

  async createPaymentMethod(type: Stripe.PaymentMethodCreateParams.Type, cardDetails: Stripe.PaymentMethodCreateParams.Card): Promise<PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type,
        card: cardDetails,
      });

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: {
          brand: paymentMethod.card?.brand || null,
          last4: paymentMethod.card?.last4 || null,
          expMonth: paymentMethod.card?.exp_month || null,
          expYear: paymentMethod.card?.exp_year || null,
        },
      };
    } catch (error: any) {
      console.error('Error creating Payment Method:', error);
      throw new Error(`Failed to create Payment Method: ${error.message}`);
    }
  }

  async retrievePaymentMethod(paymentMethodId: string): Promise<PaymentMethod | null> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

      if (!paymentMethod) {
        return null;
      }

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: {
          brand: paymentMethod.card?.brand || null,
          last4: paymentMethod.card?.last4 || null,
          expMonth: paymentMethod.card?.exp_month || null,
          expYear: paymentMethod.card?.exp_year || null,
        },
      };
    } catch (error: any) {
      console.error('Error retrieving Payment Method:', error);
      return null;
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<PaymentMethod | null> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);

      if (!paymentMethod) {
        return null;
      }

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: {
          brand: paymentMethod.card?.brand || null,
          last4: paymentMethod.card?.last4 || null,
          expMonth: paymentMethod.card?.exp_month || null,
          expYear: paymentMethod.card?.exp_year || null,
        },
      };
    } catch (error: any) {
      console.error('Error detaching Payment Method:', error);
      return null;
    }
  }

  async constructEvent(body: string | Buffer, signature: string, webhookSecret: string): Promise<Stripe.Event> {
    try {
      return this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
      console.error('Error constructing webhook event:', error);
      throw new Error(`Failed to construct webhook event: ${error.message}`);
    }
  }

  async createCustomer(email: string, name?: string, metadata?: Record<string, any>): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });
      return customer.id;
    } catch (error: any) {
      console.error('Error creating customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  async retrieveCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        return null;
      }
      return customer as Stripe.Customer;
    } catch (error: any) {
      console.error('Error retrieving customer:', error);
      return null;
    }
  }

  async updateCustomer(customerId: string, updates: Stripe.CustomerUpdateParams): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.update(customerId, updates);
      return customer;
    } catch (error: any) {
      console.error('Error updating customer:', error);
      return null;
    }
  }

  async createSubscription(customerId: string, priceId: string, metadata?: Record<string, any>): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
      });
      return subscription;
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error: any) {
      console.error('Error retrieving subscription:', error);
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      return null;
    }
  }

  async listPaymentMethods(customerId: string, type: Stripe.PaymentMethodListParams.Type): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type,
      });
      return paymentMethods.data;
    } catch (error: any) {
      console.error('Error listing payment methods:', error);
      return [];
    }
  }

  async updateSubscription(subscriptionId: string, updates: Stripe.SubscriptionUpdateParams): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, updates);
      return subscription;
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      return null;
    }
  }

  async createPrice(productId: string, unitAmount: number, currency: string, recurringInterval: Stripe.PriceCreateParams.Recurring.Interval): Promise<Stripe.Price> {
    try {
      const price = await this.stripe.prices.create({
        product: productId,
        unit_amount: unitAmount,
        currency: currency,
        recurring: {
          interval: recurringInterval,
        },
      });
      return price;
    } catch (error: any) {
      console.error('Error creating price:', error);
      throw new Error(`Failed to create price: ${error.message}`);
    }
  }

  async retrievePrice(priceId: string): Promise<Stripe.Price | null> {
    try {
      const price = await this.stripe.prices.retrieve(priceId);
      return price;
    } catch (error: any) {
      console.error('Error retrieving price:', error);
      return null;
    }
  }

  async createProduct(name: string, description?: string, metadata?: Record<string, any>): Promise<Stripe.Product> {
    try {
      const product = await this.stripe.products.create({
        name,
        description,
        metadata,
      });
      return product;
    } catch (error: any) {
      console.error('Error creating product:', error);
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async retrieveProduct(productId: string): Promise<Stripe.Product | null> {
    try {
      const product = await this.stripe.products.retrieve(productId);
      return product;
    } catch (error: any) {
      console.error('Error retrieving product:', error);
      return null;
    }
  }

  async updateProduct(productId: string, updates: Stripe.ProductUpdateParams): Promise<Stripe.Product | null> {
    try {
      const product = await this.stripe.products.update(productId, updates);
      return product;
    } catch (error: any) {
      console.error('Error updating product:', error);
      return null;
    }
  }

  async deleteProduct(productId: string): Promise<Stripe.DeletedProduct | null> {
    try {
      const product = await this.stripe.products.del(productId);
      return product;
    } catch (error: any) {
      console.error('Error deleting product:', error);
      return null;
    }
  }
}