import Stripe from 'stripe';

/**
 * CustomerApiService provides a service layer for interacting with Stripe's Customer and PaymentMethod APIs.
 * It encapsulates CRUD operations for customers and their associated payment methods,
 * handling API calls and basic error management.
 */
class CustomerApiService {
  private stripe: Stripe;

  /**
   * Constructs a new CustomerApiService instance.
   * @param stripeClient An initialized Stripe client instance.
   */
  constructor(stripeClient: Stripe) {
    this.stripe = stripeClient;
  }

  /**
   * Creates a new customer in Stripe.
   * @param params - Parameters for creating a customer.
   * @returns A promise that resolves to the created Stripe Customer object.
   * @throws An error if the customer creation fails.
   */
  async createCustomer(params: Stripe.CustomerCreateParams): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create(params);
      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error(`Failed to create customer: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves a customer by their ID.
   * @param customerId - The ID of the customer to retrieve.
   * @returns A promise that resolves to the Stripe Customer object.
   * @throws An error if the customer retrieval fails or if the customer is deleted.
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error(`Customer ${customerId} was deleted.`);
      }
      return customer as Stripe.Customer; // Type assertion as retrieve can return Customer | DeletedCustomer
    } catch (error) {
      console.error(`Error retrieving customer ${customerId}:`, error);
      throw new Error(`Failed to retrieve customer: ${(error as Error).message}`);
    }
  }

  /**
   * Updates an existing customer.
   * @param customerId - The ID of the customer to update.
   * @param params - Parameters for updating the customer.
   * @returns A promise that resolves to the updated Stripe Customer object.
   * @throws An error if the customer update fails.
   */
  async updateCustomer(customerId: string, params: Stripe.CustomerUpdateParams): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, params);
      return customer;
    } catch (error) {
      console.error(`Error updating customer ${customerId}:`, error);
      throw new Error(`Failed to update customer: ${(error as Error).message}`);
    }
  }

  /**
   * Deletes a customer.
   * @param customerId - The ID of the customer to delete.
   * @returns A promise that resolves to the deleted Stripe Customer object.
   * @throws An error if the customer deletion fails.
   */
  async deleteCustomer(customerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    try {
      const deletedCustomer = await this.stripe.customers.del(customerId);
      return deletedCustomer;
    } catch (error) {
      console.error(`Error deleting customer ${customerId}:`, error);
      throw new Error(`Failed to delete customer: ${(error as Error).message}`);
    }
  }

  /**
   * Lists customers based on provided parameters.
   * @param params - Parameters for listing customers.
   * @returns A promise that resolves to a list of Stripe Customer objects.
   * @throws An error if the customer listing fails.
   */
  async listCustomers(params?: Stripe.CustomerListParams): Promise<Stripe.ApiList<Stripe.Customer>> {
    try {
      const customers = await this.stripe.customers.list(params);
      return customers;
    } catch (error) {
      console.error('Error listing customers:', error);
      throw new Error(`Failed to list customers: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves a specific PaymentMethod by its ID.
   * @param paymentMethodId - The ID of the PaymentMethod to retrieve.
   * @returns A promise that resolves to the Stripe PaymentMethod object.
   * @throws An error if the payment method retrieval fails.
   */
  async getPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      console.error(`Error retrieving payment method ${paymentMethodId}:`, error);
      throw new Error(`Failed to retrieve payment method: ${(error as Error).message}`);
    }
  }

  /**
   * Attaches a PaymentMethod to a Customer.
   * @param customerId - The ID of the customer to attach the payment method to.
   * @param paymentMethodId - The ID of the PaymentMethod to attach.
   * @returns A promise that resolves to the attached Stripe PaymentMethod object.
   * @throws An error if the attachment fails.
   */
  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        { customer: customerId }
      );
      return paymentMethod;
    } catch (error) {
      console.error(`Error attaching payment method ${paymentMethodId} to customer ${customerId}:`, error);
      throw new Error(`Failed to attach payment method: ${(error as Error).message}`);
    }
  }

  /**
   * Detaches a PaymentMethod from a Customer.
   * @param paymentMethodId - The ID of the PaymentMethod to detach.
   * @returns A promise that resolves to the detached Stripe PaymentMethod object.
   * @throws An error if the detachment fails.
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      console.error(`Error detaching payment method ${paymentMethodId}:`, error);
      throw new Error(`Failed to detach payment method: ${(error as Error).message}`);
    }
  }

  /**
   * Lists PaymentMethods for a specific Customer.
   * @param customerId - The ID of the customer.
   * @param type - The type of PaymentMethods to list (e.g., 'card', 'sepa_debit'). Defaults to 'card'.
   * @param params - Additional parameters for listing payment methods.
   * @returns A promise that resolves to a list of Stripe PaymentMethod objects.
   * @throws An error if the payment method listing fails.
   */
  async listPaymentMethods(
    customerId: string,
    type: Stripe.PaymentMethodListParams.Type = 'card',
    params?: Omit<Stripe.PaymentMethodListParams, 'customer' | 'type'>
  ): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type,
        ...params,
      });
      return paymentMethods;
    } catch (error) {
      console.error(`Error listing payment methods for customer ${customerId}:`, error);
      throw new Error(`Failed to list payment methods: ${(error as Error).message}`);
    }
  }

  /**
   * Sets a customer's default payment method for invoices.
   * This updates the customer object's `invoice_settings.default_payment_method`.
   * @param customerId - The ID of the customer.
   * @param paymentMethodId - The ID of the PaymentMethod to set as default.
   * @returns A promise that resolves to the updated Stripe Customer object.
   * @throws An error if setting the default payment method fails.
   */
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      return customer;
    } catch (error) {
      console.error(`Error setting default payment method ${paymentMethodId} for customer ${customerId}:`, error);
      throw new Error(`Failed to set default payment method: ${(error as Error).message}`);
    }
  }
}

export { CustomerApiService };