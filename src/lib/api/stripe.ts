export type StripeId = `cus_${string}` | `prod_${string}` | `price_${string}` | `sub_${string}` | `pi_${string}` | `in_${string}` | `ch_${string}` | `re_${string}` | `si_${string}` | `il_${string}`;

export interface StripeObject {
  id: StripeId;
  object: string; // e.g., 'customer', 'product'
  created: number; // Unix timestamp
  livemode: boolean;
  metadata: Record<string, string>;
}

export interface StripeAddress {
  city: string | null;
  country: string | null;
  line1: string | null;
  line2: string | null;
  postal_code: string | null;
  state: string | null;
}

export interface StripeShipping {
  address: StripeAddress;
  name: string | null;
  phone: string | null;
}

export interface StripeCustomer extends StripeObject {
  object: 'customer';
  email: string | null;
  name: string | null;
  description: string | null;
  phone: string | null;
  address: StripeAddress | null;
  currency: string | null;
  default_source: string | null; // ID of a payment method
  delinquent: boolean;
  invoice_prefix: string | null;
  invoice_settings: {
    custom_fields: any | null;
    default_payment_method: string | null;
    footer: string | null;
    rendering_options: any | null;
  };
  shipping: StripeShipping | null;
  tax_exempt: 'none' | 'exempt' | 'reverse';
  balance: number; // Amount in cents
}

export interface StripeProduct extends StripeObject {
  object: 'product';
  active: boolean;
  description: string | null;
  images: string[];
  name: string;
  url: string | null;
  type: 'service' | 'good';
  unit_label: string | null;
  default_price: StripePrice | string | null; // Can be object or ID
}

export interface StripePrice extends StripeObject {
  object: 'price';
  active: boolean;
  billing_scheme: 'per_unit' | 'tiered';
  currency: string;
  product: string | StripeProduct; // Can be object or ID
  recurring: {
    aggregate_usage: 'sum' | 'last_ever' | 'last_month' | 'last_week';
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
    usage_type: 'metered' | 'licensed';
  } | null;
  type: 'one_time' | 'recurring';
  unit_amount: number | null; // Amount in cents
  unit_amount_decimal: string | null;
}

export interface StripeSubscriptionItem extends StripeObject {
  object: 'subscription_item';
  billing_thresholds: any | null;
  price: StripePrice;
  quantity: number;
  subscription: string;
  tax_rates: any[];
}

export interface StripeSubscription extends StripeObject {
  object: 'subscription';
  customer: string | StripeCustomer; // Can be object or ID
  items: {
    data: StripeSubscriptionItem[];
    has_more: boolean;
    url: string;
  };
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'paused' | 'trialing' | 'unpaid';
  cancel_at_period_end: boolean;
  current_period_end: number;
  current_period_start: number;
  start_date: number;
  ended_at: number | null;
  trial_end: number | null;
  trial_start: number | null;
  currency: string;
  latest_invoice: string | null; // ID of an invoice
  default_payment_method: string | null; // ID of a payment method
  collection_method: 'charge_automatically' | 'send_invoice';
  billing_cycle_anchor: number;
  days_until_due: number | null;
  default_source: string | null;
  description: string | null;
  discount: any | null;
  invoice_customer_balance_settings: any | null;
  on_behalf_of: string | null;
  pause_collection: any | null;
  pending_setup_intent: string | null;
  pending_update: any | null;
  schedule: string | null;
  transfer_data: any | null;
}

export interface StripePaymentIntent extends StripeObject {
  object: 'payment_intent';
  amount: number; // Amount in cents
  currency: string;
  customer: string | StripeCustomer | null; // Can be object or ID
  description: string | null;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  capture_method: 'automatic' | 'manual';
  confirmation_method: 'automatic' | 'manual';
  client_secret: string | null;
  last_payment_error: {
    code: string;
    decline_code: string;
    doc_url: string;
    message: string;
    param: string;
    payment_method: any; // PaymentMethod object
    type: string;
  } | null;
  next_action: any | null;
  payment_method: string | null; // ID of a payment method
  receipt_email: string | null;
  setup_future_usage: 'on_session' | 'off_session' | null;
  shipping: StripeShipping | null;
  statement_descriptor: string | null;
  statement_descriptor_suffix: string | null;
  transfer_data: {
    amount: number | null;
    destination: string; // Account ID
  } | null;
  transfer_group: string | null;
}

export interface StripeInvoiceLineItem extends StripeObject {
  object: 'line_item';
  amount: number;
  currency: string;
  description: string | null;
  discount_amounts: any[];
  discountable: boolean;
  period: {
    end: number;
    start: number;
  };
  price: StripePrice | null;
  proration: boolean;
  quantity: number | null;
  subscription: string | null;
  tax_amounts: any[];
  tax_rates: any[];
  type: 'invoiceitem' | 'subscription';
  unit_amount_decimal: string | null;
}

export interface StripeInvoice extends StripeObject {
  object: 'invoice';
  customer: string | StripeCustomer; // Can be object or ID
  amount_due: number; // Amount in cents
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  charge: string | null; // ID of a charge
  collection_method: 'charge_automatically' | 'send_invoice';
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  description: string | null;
  due_date: number | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  lines: {
    data: StripeInvoiceLineItem[];
    has_more: boolean;
    url: string;
  };
  period_end: number;
  period_start: number;
  post_payment_credit_notes_amount: number;
  pre_payment_credit_notes_amount: number;
  receipt_number: string | null;
  subscription: string | null; // ID of a subscription
  total: number;
  total_discount_amounts: any[];
  total_tax_amounts: any[];
  billing_reason: 'subscription_create' | 'subscription_cycle' | 'subscription_update' | 'subscription_threshold' | 'manual' | 'upcoming_invoice';
  customer_address: StripeAddress | null;
  customer_shipping: StripeShipping | null;
  footer: string | null;
  last_finalization_error: any | null;
  next_payment_attempt: number | null;
  rendering_options: any | null;
  statement_descriptor: string | null;
  status_transitions: {
    finalized_at: number | null;
    marked_uncollectible_at: number | null;
    paid_at: number | null;
    voided_at: number | null;
  };
  tax_percent: number | null;
  total_excluding_tax: number | null;
  webhooks_delivered_at: number | null;
}

// --- Mock Data Store ---
const MOCK_DELAY = 300; // Simulate network latency

const customers: StripeCustomer[] = [];
const products: StripeProduct[] = [];
const prices: StripePrice[] = [];
const subscriptions: StripeSubscription[] = [];
const paymentIntents: StripePaymentIntent[] = [];
const invoices: StripeInvoice[] = [];

// --- Helper Functions for Mock Data Generation ---
let customerIdCounter = 1;
let productIdCounter = 1;
let priceIdCounter = 1;
let subscriptionIdCounter = 1;
let paymentIntentIdCounter = 1;
let invoiceIdCounter = 1;
let subscriptionItemIdCounter = 1;
let invoiceLineItemIdCounter = 1;

const generateId = (prefix: string, counter: number): StripeId => {
  return `${prefix}_${String(counter).padStart(8, '0')}` as StripeId;
};

const generateTimestamp = () => Math.floor(Date.now() / 1000);

const createMockCustomer = (overrides?: Partial<StripeCustomer>): StripeCustomer => {
  const id = generateId('cus', customerIdCounter++);
  return {
    id,
    object: 'customer',
    created: generateTimestamp(),
    livemode: false,
    metadata: {},
    email: `customer${customerIdCounter - 1}@example.com`,
    name: `Customer ${customerIdCounter - 1}`,
    description: `Mock customer ${customerIdCounter - 1}`,
    phone: null,
    address: {
      city: 'San Francisco',
      country: 'US',
      line1: '123 Mock St',
      line2: null,
      postal_code: '94105',
      state: 'CA',
    },
    currency: 'usd',
    default_source: null,
    delinquent: false,
    invoice_prefix: `INV-${id.substring(4, 8)}`,
    invoice_settings: {
      custom_fields: null,
      default_payment_method: null,
      footer: null,
      rendering_options: null,
    },
    shipping: null,
    tax_exempt: 'none',
    balance: 0,
    ...overrides,
  };
};

const createMockProduct = (overrides?: Partial<StripeProduct>): StripeProduct => {
  const id = generateId('prod', productIdCounter++);
  return {
    id,
    object: 'product',
    created: generateTimestamp(),
    livemode: false,
    metadata: {},
    active: true,
    description: `Description for Product ${productIdCounter - 1}`,
    images: [],
    name: `Product ${productIdCounter - 1}`,
    url: null,
    type: 'service',
    unit_label: null,
    default_price: null, // Will be set later if a price is created
    ...overrides,
  };
};

const createMockPrice = (productId: string, overrides?: Partial<StripePrice>): StripePrice => {
  const id = generateId('price', priceIdCounter++);
  return {
    id,
    object: 'price',
    created: generateTimestamp(),
    livemode: false,
    metadata: {},
    active: true,
    billing_scheme: 'per_unit',
    currency: 'usd',
    product: productId,
    recurring: {
      interval: 'month',
      interval_count: 1,
      usage_type: 'licensed',
      aggregate_usage: 'sum',
    },
    type: 'recurring',
    unit_amount: 1000, // $10.00
    unit_amount_decimal: '1000',
    ...overrides,
  };
};

const createMockSubscription = (customerId: string, price: StripePrice, overrides?: Partial<StripeSubscription>): StripeSubscription => {
  const id = generateId('sub', subscriptionIdCounter++);
  const now = generateTimestamp();
  const currentPeriodStart = now;
  const currentPeriodEnd = now + (price.recurring?.interval === 'month' ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60); // Approx 1 month or 1 week
  return {
    id,
    object: 'subscription',
    created: now,
    livemode: false,
    metadata: {},
    customer: customerId,
    items: {
      data: [{
        id: generateId('si', subscriptionItemIdCounter++),
        object: 'subscription_item',
        billing_thresholds: null,
        created: now,
        metadata: {},
        price: price,
        quantity: 1,
        subscription: id,
        tax_rates: [],
        livemode: false,
      }],
      has_more: false,
      url: `/v1/subscription_items?subscription=${id}`,
    },
    status: 'active',
    cancel_at_period_end: false,
    current_period_end: currentPeriodEnd,
    current_period_start: currentPeriodStart,
    start_date: now,
    ended_at: null,
    trial_end: null,
    trial_start: null,
    currency: 'usd',
    latest_invoice: null, // Will be set by invoice creation
    default_payment_method: null,
    collection_method: 'charge_automatically',
    billing_cycle_anchor: currentPeriodStart,
    days_until_due: null,
    default_source: null,
    description: `Subscription for ${price.product} by ${customerId}`,
    discount: null,
    invoice_customer_balance_settings: null,
    on_behalf_of: null,
    pause_collection: null,
    pending_setup_intent: null,
    pending_update: null,
    schedule: null,
    transfer_data: null,
    ...overrides,
  };
};

const createMockPaymentIntent = (customerId: string, amount: number, overrides?: Partial<StripePaymentIntent>): StripePaymentIntent => {
  const id = generateId('pi', paymentIntentIdCounter++);
  return {
    id,
    object: 'payment_intent',
    created: generateTimestamp(),
    livemode: false,
    metadata: {},
    amount: amount,
    currency: 'usd',
    customer: customerId,
    description: `Payment for customer ${customerId}`,
    status: 'succeeded', // Default to succeeded for simplicity
    capture_method: 'automatic',
    confirmation_method: 'automatic',
    client_secret: `pi_client_secret_${id}`,
    last_payment_error: null,
    next_action: null,
    payment_method: `pm_card_visa`, // Mock payment method
    receipt_email: customers.find(c => c.id === customerId)?.email || null,
    setup_future_usage: null,
    shipping: null,
    statement_descriptor: null,
    statement_descriptor_suffix: null,
    transfer_data: null,
    transfer_group: null,
    ...overrides,
  };
};

const createMockInvoice = (customerId: string, subscriptionId: string | null, amount: number, overrides?: Partial<StripeInvoice>): StripeInvoice => {
  const id = generateId('in', invoiceIdCounter++);
  const now = generateTimestamp();
  const customer = customers.find(c => c.id === customerId);
  return {
    id,
    object: 'invoice',
    created: now,
    livemode: false,
    metadata: {},
    customer: customerId,
    amount_due: amount,
    amount_paid: amount,
    amount_remaining: 0,
    currency: 'usd',
    status: 'paid',
    charge: `ch_${generateId('ch', 1)}`, // Mock charge ID
    collection_method: 'charge_automatically',
    customer_email: customer?.email || null,
    customer_name: customer?.name || null,
    customer_phone: customer?.phone || null,
    description: `Invoice for ${subscriptionId ? 'subscription' : 'one-time payment'}`,
    due_date: now + (30 * 24 * 60 * 60), // Due in 30 days
    hosted_invoice_url: `https://mock-stripe.com/invoice/${id}`,
    invoice_pdf: `https://mock-stripe.com/invoice/${id}.pdf`,
    lines: {
      data: [{
        id: generateId('il', invoiceLineItemIdCounter++),
        object: 'line_item',
        amount: amount,
        currency: 'usd',
        description: subscriptionId ? 'Subscription fee' : 'One-time charge',
        discount_amounts: [],
        discountable: true,
        livemode: false,
        metadata: {},
        period: {
          end: now,
          start: now,
        },
        price: null, // Can be populated if linked to a price
        proration: false,
        quantity: 1,
        subscription: subscriptionId,
        tax_amounts: [],
        tax_rates: [],
        type: subscriptionId ? 'subscription' : 'invoiceitem',
        unit_amount_decimal: String(amount),
      }],
      has_more: false,
      url: `/v1/invoiceitems?invoice=${id}`,
    },
    period_end: now,
    period_start: now,
    post_payment_credit_notes_amount: 0,
    pre_payment_credit_notes_amount: 0,
    receipt_number: `REC-${id.substring(4, 8)}`,
    subscription: subscriptionId,
    total: amount,
    total_discount_amounts: [],
    total_tax_amounts: [],
    billing_reason: subscriptionId ? 'subscription_cycle' : 'manual',
    customer_address: customer?.address,
    customer_shipping: customer?.shipping,
    footer: null,
    last_finalization_error: null,
    next_payment_attempt: null,
    rendering_options: null,
    statement_descriptor: null,
    status_transitions: {
      finalized_at: now,
      marked_uncollectible_at: null,
      paid_at: now,
      voided_at: null,
    },
    tax_percent: null,
    total_excluding_tax: amount,
    webhooks_delivered_at: null,
    ...overrides,
  };
};


// --- Initial Seed Data ---
const seedData = () => {
  // Customers
  const customer1 = createMockCustomer({ email: 'alice@example.com', name: 'Alice Smith' });
  const customer2 = createMockCustomer({ email: 'bob@example.com', name: 'Bob Johnson' });
  const customer3 = createMockCustomer({ email: 'charlie@example.com', name: 'Charlie Brown' });
  customers.push(customer1, customer2, customer3);

  // Products
  const productBasic = createMockProduct({ name: 'Basic Plan', description: 'Our entry-level plan.' });
  const productPro = createMockProduct({ name: 'Pro Plan', description: 'For growing businesses.' });
  const productEnterprise = createMockProduct({ name: 'Enterprise Plan', description: 'Custom solutions for large organizations.' });
  products.push(productBasic, productPro, productEnterprise);

  // Prices
  const priceBasicMonthly = createMockPrice(productBasic.id, { unit_amount: 1000, recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed', aggregate_usage: 'sum' } }); // $10/month
  const priceProMonthly = createMockPrice(productPro.id, { unit_amount: 5000, recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed', aggregate_usage: 'sum' } }); // $50/month
  const priceEnterpriseYearly = createMockPrice(productEnterprise.id, { unit_amount: 50000, recurring: { interval: 'year', interval_count: 1, usage_type: 'licensed', aggregate_usage: 'sum' } }); // $500/year
  prices.push(priceBasicMonthly, priceProMonthly, priceEnterpriseYearly);

  // Link prices to products
  productBasic.default_price = priceBasicMonthly.id;
  productPro.default_price = priceProMonthly.id;
  productEnterprise.default_price = priceEnterpriseYearly.id;

  // Subscriptions
  const sub1 = createMockSubscription(customer1.id, priceBasicMonthly, { status: 'active' });
  const sub2 = createMockSubscription(customer2.id, priceProMonthly, { status: 'active' });
  const sub3 = createMockSubscription(customer3.id, priceEnterpriseYearly, { status: 'trialing', trial_end: generateTimestamp() + (7 * 24 * 60 * 60) }); // 7-day trial
  subscriptions.push(sub1, sub2, sub3);

  // Payment Intents
  const pi1 = createMockPaymentIntent(customer1.id, 1000);
  const pi2 = createMockPaymentIntent(customer2.id, 5000);
  paymentIntents.push(pi1, pi2);

  // Invoices
  const inv1 = createMockInvoice(customer1.id, sub1.id, 1000);
  const inv2 = createMockInvoice(customer2.id, sub2.id, 5000);
  const inv3 = createMockInvoice(customer3.id, null, 2500, { description: 'One-time setup fee' }); // One-time invoice
  invoices.push(inv1, inv2, inv3);

  // Link latest invoice to subscriptions
  sub1.latest_invoice = inv1.id;
  sub2.latest_invoice = inv2.id;
};

seedData(); // Initialize mock data on load

// --- Mock API Service Layer ---

export const stripe = {
  customers: {
    list: async (params?: { email?: string; limit?: number }): Promise<{ data: StripeCustomer[]; has_more: boolean; url: string }> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      let filtered = [...customers];
      if (params?.email) {
        filtered = filtered.filter(c => c.email?.includes(params.email!));
      }
      const limit = params?.limit || 10;
      return {
        data: filtered.slice(0, limit),
        has_more: filtered.length > limit,
        url: '/v1/customers',
      };
    },
    retrieve: async (id: string): Promise<StripeCustomer | null> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const customer = customers.find(c => c.id === id);
      if (!customer) {
        // Simulate Stripe API error for not found
        throw new Error(`No such customer: ${id}`);
      }
      return customer;
    },
    create: async (data: { email: string; name?: string; description?: string; metadata?: Record<string, string> }): Promise<StripeCustomer> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const newCustomer = createMockCustomer({
        email: data.email,
        name: data.name,
        description: data.description,
        metadata: data.metadata,
      });
      customers.push(newCustomer);
      return newCustomer;
    },
    update: async (id: string, data: Partial<StripeCustomer>): Promise<StripeCustomer> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const index = customers.findIndex(c => c.id === id);
      if (index === -1) {
        throw new Error(`No such customer: ${id}`);
      }
      customers[index] = { ...customers[index], ...data };
      return customers[index];
    },
    del: async (id: string): Promise<{ id: string; object: 'customer'; deleted: boolean }> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const index = customers.findIndex(c => c.id === id);
      if (index === -1) {
        throw new Error(`No such customer: ${id}`);
      }
      customers.splice(index, 1);
      return { id, object: 'customer', deleted: true };
    },
  },
  products: {
    list: async (params?: { active?: boolean; limit?: number }): Promise<{ data: StripeProduct[]; has_more: boolean; url: string }> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      let filtered = [...products];
      if (typeof params?.active === 'boolean') {
        filtered = filtered.filter(p => p.active === params.active);
      }
      const limit = params?.limit || 10;
      return {
        data: filtered.slice(0, limit),
        has_more: filtered.length > limit,
        url: '/v1/products',
      };
    },
    retrieve: async (id: string): Promise<StripeProduct | null> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const product = products.find(p => p.id === id);
      if (!product) {
        throw new Error(`No such product: ${id}`);
      }
      return product;
    },
    create: async (data: { name: string; description?: string; active?: boolean; type?: 'service' | 'good'; metadata?: Record<string, string> }): Promise<StripeProduct> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const newProduct = createMockProduct({
        name: data.name,
        description: data.description,
        active: data.active,
        type: data.type,
        metadata: data.metadata,
      });
      products.push(newProduct);
      return newProduct;
    },
    update: async (id: string, data: Partial<StripeProduct>): Promise<StripeProduct> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const index = products.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error(`No such product: ${id}`);
      }
      products[index] = { ...products[index], ...data };
      return products[index];
    },
    del: async (id: string): Promise<{ id: string; object: 'product'; deleted: boolean }> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const index = products.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error(`No such product: ${id}`);
      }
      products.splice(index, 1);
      return { id, object: 'product', deleted: true };
    },
  },
  prices: {
    list: async (params?: { product?: string; type?: 'one_time' | 'recurring'; active?: boolean; limit?: number }): Promise<{ data: StripePrice[]; has_more: boolean; url: string }> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      let filtered = [...prices];
      if (params?.product) {
        filtered = filtered.filter(p => (typeof p.product === 'string' ? p.product : p.product.id) === params.product);
      }
      if (params?.type) {
        filtered = filtered.filter(p => p.type === params.type);
      }
      if (typeof params?.active === 'boolean') {
        filtered = filtered.filter(p => p.active === params.active);
      }
      const limit = params?.limit || 10;
      return {
        data: filtered.slice(0, limit),
        has_more: filtered.length > limit,
        url: '/v1/prices',
      };
    },
    retrieve: async (id: string): Promise<StripePrice | null> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const price = prices.find(p => p.id === id);
      if (!price) {
        throw new Error(`No such price: ${id}`);
      }
      return price;
    },
    create: async (data: {
      currency: string;
      product: string;
      unit_amount?: number;
      recurring?: { interval: 'day' | 'week' | 'month' | 'year'; interval_count?: number };
      type?: 'one_time' | 'recurring';
      metadata?: Record<string, string>;
    }): Promise<StripePrice> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const newPrice = createMockPrice(data.product, {
        currency: data.currency,
        unit_amount: data.unit_amount,
        recurring: data.recurring ? { ...data.recurring, usage_type: 'licensed', aggregate_usage: 'sum' } : null,
        type: data.recurring ? 'recurring' : 'one_time',
        metadata: data.metadata,
      });
      prices.push(newPrice);
      return newPrice;
    },
    update: async (id: string, data: Partial<StripePrice>): Promise<StripePrice> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const index = prices.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error(`No such price: ${id}`);
      }
      prices[index] = { ...prices[index], ...data };
      return prices[index];
    },
  },
  subscriptions: {
    list: async (params?: { customer?: string; status?: StripeSubscription['status']; limit?: number }): Promise<{ data: StripeSubscription[]; has_more: boolean; url: string }> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      let filtered = [...subscriptions];
      if (params?.customer) {
        filtered = filtered.filter(s => (typeof s.customer === 'string' ? s.customer : s.customer.id) === params.customer);
      }
      if (params?.status) {
        filtered = filtered.filter(s => s.status === params.status);
      }
      const limit = params?.limit || 10;
      return {
        data: filtered.slice(0, limit),
        has_more: filtered.length > limit,
        url: '/v1/subscriptions',
      };
    },
    retrieve: async (id: string): Promise<StripeSubscription | null> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const subscription = subscriptions.find(s => s.id === id);
      if (!subscription) {
        throw new Error(`No such subscription: ${id}`);
      }
      return subscription;
    },
    create: async (data: { customer: string; items: Array<{ price: string; quantity?: number }>; metadata?: Record<string, string> }): Promise<StripeSubscription> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const customer = customers.find(c => c.id === data.customer);
      if (!customer) {
        throw new Error(`Customer not found: ${data.customer}`);
      }
      const price = prices.find(p => p.id === data.items[0].price);
      if (!price) {
        throw new Error(`Price not found: ${data.items[0].price}`);
      }
      const newSubscription = createMockSubscription(data.customer, price, { metadata: data.metadata });
      subscriptions.push(newSubscription);
      return newSubscription;
    },
    update: async (id: string, data: Partial<StripeSubscription>): Promise<StripeSubscription> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const index = subscriptions.findIndex(s => s.id === id);
      if (index === -1) {
        throw new Error(`No such subscription: ${id}`);
      }
      subscriptions[index] = { ...subscriptions[index], ...data };
      return subscriptions[index];
    },
    cancel: async (id: string): Promise<StripeSubscription> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const index = subscriptions.findIndex(s => s.id === id);
      if (index === -1) {
        throw new Error(`No such subscription: ${id}`);
      }
      subscriptions[index].status = 'canceled';
      subscriptions[index].ended_at = generateTimestamp();
      return subscriptions[index];
    },
  },
  paymentIntents: {
    list: async (params?: { customer?: string; status?: StripePaymentIntent['status']; limit?: number }): Promise<{ data: StripePaymentIntent[]; has_more: boolean; url: string }> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      let filtered = [...paymentIntents];
      if (params?.customer) {
        filtered = filtered.filter(pi => (typeof pi.customer === 'string' ? pi.customer : pi.customer?.id) === params.customer);
      }
      if (params?.status) {
        filtered = filtered.filter(pi => pi.status === params.status);
      }
      const limit = params?.limit || 10;
      return {
        data: filtered.slice(0, limit),
        has_more: filtered.length > limit,
        url: '/v1/payment_intents',
      };
    },
    retrieve: async (id: string): Promise<StripePaymentIntent | null> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const paymentIntent = paymentIntents.find(pi => pi.id === id);
      if (!paymentIntent) {
        throw new Error(`No such payment intent: ${id}`);
      }
      return paymentIntent;
    },
    create: async (data: { amount: number; currency: string; customer?: string; description?: string; metadata?: Record<string, string> }): Promise<StripePaymentIntent> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      if (!data.customer) {
        throw new Error('Customer ID is required for mock PaymentIntent creation.');
      }
      const newPaymentIntent = createMockPaymentIntent(data.customer, data.amount, {
        currency: data.currency,
        description: data.description,
        metadata: data.metadata,
      });
      paymentIntents.push(newPaymentIntent);
      return newPaymentIntent;
    },
    update: async (id: string, data: Partial<StripePaymentIntent>): Promise<StripePaymentIntent> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const index = paymentIntents.findIndex(pi => pi.id === id);
      if (index === -1) {
        throw new Error(`No such payment intent: ${id}`);
      }
      paymentIntents[index] = { ...paymentIntents[index], ...data };
      return paymentIntents[index];
    },
    confirm: async (id: string): Promise<StripePaymentIntent> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const index = paymentIntents.findIndex(pi => pi.id === id);
      if (index === -1) {
        throw new Error(`No such payment intent: ${id}`);
      }
      paymentIntents[index].status = 'succeeded'; // Simulate successful confirmation
      return paymentIntents[index];
    },
  },
  invoices: {
    list: async (params?: { customer?: string; status?: StripeInvoice['status']; subscription?: string; limit?: number }): Promise<{ data: StripeInvoice[]; has_more: boolean; url: string }> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      let filtered = [...invoices];
      if (params?.customer) {
        filtered = filtered.filter(inv => (typeof inv.customer === 'string' ? inv.customer : inv.customer.id) === params.customer);
      }
      if (params?.status) {
        filtered = filtered.filter(inv => inv.status === params.status);
      }
      if (params?.subscription) {
        filtered = filtered.filter(inv => inv.subscription === params.subscription);
      }
      const limit = params?.limit || 10;
      return {
        data: filtered.slice(0, limit),
        has_more: filtered.length > limit,
        url: '/v1/invoices',
      };
    },
    retrieve: async (id: string): Promise<StripeInvoice | null> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) {
        throw new Error(`No such invoice: ${id}`);
      }
      return invoice;
    },
    create: async (data: { customer: string; subscription?: string; amount?: number; description?: string; metadata?: Record<string, string> }): Promise<StripeInvoice> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      if (!data.customer) {
        throw new Error('Customer ID is required for mock Invoice creation.');
      }
      const newInvoice = createMockInvoice(data.customer, data.subscription || null, data.amount || 0, {
        description: data.description,
        metadata: data.metadata,
        status: 'draft', // New invoices are typically draft
      });
      invoices.push(newInvoice);
      return newInvoice;
    },
    update: async (id: string, data: Partial<StripeInvoice>): Promise<StripeInvoice> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const index = invoices.findIndex(inv => inv.id === id);
      if (index === -1) {
        throw new Error(`No such invoice: ${id}`);
      }
      invoices[index] = { ...invoices[index], ...data };
      return invoices[index];
    },
    finalizeInvoice: async (id: string): Promise<StripeInvoice> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const index = invoices.findIndex(inv => inv.id === id);
      if (index === -1) {
        throw new Error(`No such invoice: ${id}`);
      }
      invoices[index].status = 'open';
      invoices[index].status_transitions.finalized_at = generateTimestamp();
      return invoices[index];
    },
    pay: async (id: string): Promise<StripeInvoice> => {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      const index = invoices.findIndex(inv => inv.id === id);
      if (index === -1) {
        throw new Error(`No such invoice: ${id}`);
      }
      invoices[index].status = 'paid';
      invoices[index].amount_paid = invoices[index].amount_due;
      invoices[index].amount_remaining = 0;
      invoices[index].status_transitions.paid_at = generateTimestamp();
      return invoices[index];
    },
  },
};

// Export types for external use
export type {
  StripeCustomer,
  StripeProduct,
  StripePrice,
  StripeSubscription,
  StripePaymentIntent,
  StripeInvoice,
  StripeSubscriptionItem,
  StripeInvoiceLineItem,
  StripeAddress,
  StripeShipping,
};