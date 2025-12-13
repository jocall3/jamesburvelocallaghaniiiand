export interface StripeObject {
  id: string;
  object: string; // e.g., 'customer', 'charge', 'subscription'
  livemode: boolean;
  created: number; // Unix timestamp
  metadata: { [key: string]: string };
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
  address: StripeAddress | null;
  balance: number; // Current balance, in cents
  currency: string | null;
  default_source: string | null; // ID of the default payment source
  delinquent: boolean | null;
  description: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  shipping: StripeShipping | null;
  tax_exempt: 'none' | 'exempt' | 'reverse' | null;
  invoice_settings: {
    custom_fields: Array<{ name: string; value: string }> | null;
    default_payment_method: string | null; // ID of the default payment method
    footer: string | null;
    rendering_options: {
      amount_display_mode: 'auto' | 'exclude_tax' | 'include_inclusive_tax' | null;
    } | null;
  };
}

export interface StripeBillingDetails {
  address: StripeAddress | null;
  email: string | null;
  name: string | null;
  phone: string | null;
}

export interface StripeCard {
  brand: string; // e.g., 'visa', 'mastercard'
  checks: {
    address_line1_check: 'pass' | 'fail' | 'unavailable' | 'unchecked' | null;
    address_postal_code_check: 'pass' | 'fail' | 'unavailable' | 'unchecked' | null;
    cvc_check: 'pass' | 'fail' | 'unavailable' | 'unchecked' | null;
  };
  country: string | null;
  exp_month: number;
  exp_year: number;
  fingerprint: string | null;
  funding: 'credit' | 'debit' | 'prepaid' | 'unknown';
  last4: string;
  network: string | null;
  three_d_secure_usage: {
    supported: boolean;
  };
  wallet: {
    type: 'apple_pay' | 'google_pay' | 'masterpass' | 'visa_checkout' | 'amex_express_checkout' | 'discover_checkout' | 'diners_club_checkout' | 'jcb_checkout' | 'samsung_pay' | 'link' | null;
    // Other wallet details can be added here if needed
  } | null;
}

export interface StripePaymentMethod extends StripeObject {
  object: 'payment_method';
  billing_details: StripeBillingDetails;
  card: StripeCard | null; // Only if type is 'card'
  customer: string | null; // ID of the customer
  type: 'card' | 'au_becs_debit' | 'bacs_debit' | 'sepa_debit' | 'us_bank_account' | string; // Extend as needed
}

export interface StripeRefund extends StripeObject {
  object: 'refund';
  amount: number; // in cents
  balance_transaction: string | null; // ID of the balance transaction
  charge: string | StripeCharge | null; // ID or expanded Charge
  currency: string;
  description: string | null;
  failure_reason: 'expired_or_canceled_card' | 'insufficient_funds' | 'lost_or_stolen_card' | 'unknown' | null;
  payment_intent: string | StripePaymentIntent | null; // ID or expanded PaymentIntent
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | null;
  receipt_number: string | null;
  source_transfer_reversal: string | null; // ID of the transfer reversal
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  transfer_reversal: string | null; // ID of the transfer reversal
}

export interface StripeCharge extends StripeObject {
  object: 'charge';
  amount: number; // in cents
  amount_captured: number; // in cents
  amount_refunded: number; // in cents
  application: string | null; // ID of the application that created the charge
  application_fee_amount: number | null; // in cents
  balance_transaction: string | null; // ID of the balance transaction
  billing_details: StripeBillingDetails;
  captured: boolean;
  currency: string;
  customer: string | null; // ID of the customer
  description: string | null;
  dispute: string | null; // ID of the dispute
  failure_code: string | null;
  failure_message: string | null;
  invoice: string | null; // ID of the invoice
  paid: boolean;
  payment_intent: string | null; // ID of the PaymentIntent
  payment_method: string | null; // ID of the PaymentMethod
  payment_method_details: {
    card: StripeCard | null; // Detailed card info if available
    type: string; // e.g., 'card'
  } | null;
  receipt_email: string | null;
  receipt_number: string | null;
  receipt_url: string | null;
  refunded: boolean;
  refunds: {
    object: 'list';
    data: StripeRefund[];
    has_more: boolean;
    url: string;
  };
  shipping: StripeShipping | null;
  source: any; // Can be a card, bank account, etc. (deprecated, use payment_method)
  status: 'succeeded' | 'pending' | 'failed';
  transfer: string | null; // ID of the transfer
  transfer_group: string | null;
}

export interface StripePaymentIntent extends StripeObject {
  object: 'payment_intent';
  amount: number; // in cents
  amount_capturable: number; // in cents
  amount_received: number; // in cents
  application: string | null;
  application_fee_amount: number | null;
  canceled_at: number | null;
  cancellation_reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'abandoned' | 'failed_invoice' | 'void_invoice' | 'automatic' | null;
  capture_method: 'automatic' | 'manual';
  charges: {
    object: 'list';
    data: StripeCharge[];
    has_more: boolean;
    url: string;
  };
  confirmation_method: 'automatic' | 'manual';
  currency: string;
  customer: string | null; // ID of the customer
  description: string | null;
  invoice: string | null; // ID of the invoice
  last_payment_error: {
    charge: string | null; // ID of the charge
    code: string | null;
    decline_code: string | null;
    doc_url: string | null;
    message: string | null;
    param: string | null;
    payment_method: StripePaymentMethod | null;
    type: 'api_error' | 'card_error' | 'idempotency_error' | 'rate_limit_error';
  } | null;
  latest_charge: string | null; // ID of the latest charge
  next_action: {
    type: string; // e.g., 'use_stripe_sdk', 'redirect_to_url'
    redirect_to_url?: {
      return_url: string;
      url: string;
    };
    use_stripe_sdk?: {};
    // ... other action types
  } | null;
  payment_method: string | null; // ID of the PaymentMethod
  payment_method_options: {
    card?: {
      request_three_d_secure: 'any' | 'automatic' | null;
    };
    // ... other payment method options
  } | null;
  payment_method_types: string[]; // e.g., ['card']
  receipt_email: string | null;
  review: string | null; // ID of the review
  setup_future_usage: 'on_session' | 'off_session' | null;
  shipping: StripeShipping | null;
  statement_descriptor: string | null;
  statement_descriptor_suffix: string | null;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  transfer_data: {
    amount: number | null;
    destination: string; // ID of the connected account
  } | null;
  transfer_group: string | null;
}

export interface StripeProduct extends StripeObject {
  object: 'product';
  active: boolean;
  default_price: string | null; // ID of the default price
  description: string | null;
  images: string[]; // URLs of images
  name: string;
  package_dimensions: {
    height: number;
    length: number;
    weight: number;
    width: number;
  } | null;
  shippable: boolean | null;
  statement_descriptor: string | null;
  tax_code: string | null; // ID of the tax code
  unit_label: string | null;
  url: string | null;
}

export interface StripePrice extends StripeObject {
  object: 'price';
  active: boolean;
  billing_scheme: 'per_unit' | 'tiered';
  currency: string;
  product: string | StripeProduct; // Can be ID or expanded Product object
  recurring: {
    aggregate_usage: 'last_ever' | 'last_month' | 'last_week' | 'max' | null;
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
    usage_type: 'licensed' | 'metered';
  } | null;
  tax_behavior: 'exclusive' | 'inclusive' | 'unspecified' | null;
  tiers_mode: 'graduated' | 'volume' | null;
  transform_quantity: {
    divide_by: number;
    round: 'down' | 'up';
  } | null;
  type: 'one_time' | 'recurring';
  unit_amount: number | null; // in cents
  unit_amount_decimal: string | null; // decimal string
}

export interface StripeSubscriptionItem extends StripeObject {
  object: 'subscription_item';
  billing_thresholds: {
    amount_gte: number | null;
    usage_gte: number | null;
  } | null;
  price: string | StripePrice; // Can be ID or expanded Price object
  quantity: number;
  subscription: string; // ID of the subscription
  tax_rates: any[] | null; // Array of tax rate objects
}

export interface StripeSubscription extends StripeObject {
  object: 'subscription';
  application_fee_percent: number | null;
  billing_cycle_anchor: number;
  billing_thresholds: {
    amount_gte: number | null;
    reset_billing_cycle_anchor: boolean | null;
  } | null;
  cancel_at: number | null;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  collection_method: 'charge_automatically' | 'send_invoice';
  current_period_end: number;
  current_period_start: number;
  customer: string | StripeCustomer; // Can be ID or expanded Customer object
  days_until_due: number | null;
  default_payment_method: string | StripePaymentMethod | null; // ID or expanded PaymentMethod
  default_source: string | any | null; // ID or expanded Source (deprecated)
  description: string | null;
  discount: any | null; // Discount object
  ended_at: number | null;
  items: {
    object: 'list';
    data: StripeSubscriptionItem[];
    has_more: boolean;
    url: string;
  };
  latest_invoice: string | StripeInvoice | null; // ID or expanded Invoice
  next_pending_invoice_item_invoice: number | null;
  pause_collection: {
    behavior: 'keep_as_draft' | 'mark_uncollectible' | 'void';
    resumes_at: number | null;
  } | null;
  pending_setup_intent: string | null; // ID of the SetupIntent
  pending_update: {
    billing_cycle_anchor: number | null;
    expires_at: number;
    subscription_items: Array<{ id: string; price: string; quantity: number }>;
    // ... other fields
  } | null;
  schedule: string | null; // ID of the subscription schedule
  start_date: number;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'paused' | 'trialing' | 'unpaid';
  tax_percent: number | null; // deprecated
  trial_end: number | null;
  trial_start: number | null;
  // ... more fields like transfer_data, application_fee_percent
}

export interface StripeInvoiceLineItem extends StripeObject {
  object: 'line_item';
  amount: number; // in cents
  currency: string;
  description: string | null;
  discount_amounts: Array<{ amount: number; discount: string }>;
  discountable: boolean;
  livemode: boolean;
  period: {
    end: number;
    start: number;
  };
  price: StripePrice | null; // Expanded Price object
  proration: boolean;
  quantity: number | null;
  subscription: string | null; // ID of the subscription
  subscription_item: string | null; // ID of the subscription item
  tax_amounts: Array<{ amount: number; inclusive: boolean; tax_rate: any }>; // TaxRate object
  tax_rates: any[]; // Array of TaxRate objects
  type: 'invoiceitem' | 'subscription';
  unit_amount_decimal: string | null;
}

export interface StripeInvoice extends StripeObject {
  object: 'invoice';
  account_country: string | null;
  account_name: string | null;
  amount_due: number; // in cents
  amount_paid: number; // in cents
  amount_remaining: number; // in cents
  application_fee_amount: number | null; // in cents
  attempt_count: number;
  attempted: boolean;
  auto_advance: boolean;
  billing_reason: 'subscription_cycle' | 'subscription_create' | 'subscription_update' | 'subscription_threshold' | 'manual' | 'quote_accept' | null;
  charge: string | StripeCharge | null; // ID or expanded Charge
  collection_method: 'charge_automatically' | 'send_invoice';
  currency: string;
  customer: string | StripeCustomer; // ID or expanded Customer
  customer_address: StripeAddress | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_shipping: StripeShipping | null;
  customer_tax_exempt: 'none' | 'exempt' | 'reverse' | null;
  default_payment_method: string | StripePaymentMethod | null; // ID or expanded PaymentMethod
  default_source: string | any | null; // ID or expanded Source (deprecated)
  description: string | null;
  discount: any | null; // Discount object
  due_date: number | null;
  ending_balance: number | null; // in cents
  footer: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  last_finalization_error: {
    code: string;
    message: string;
    param: string;
    type: string;
  } | null;
  lines: {
    object: 'list';
    data: StripeInvoiceLineItem[];
    has_more: boolean;
    url: string;
  };
  next_payment_attempt: number | null;
  number: string | null;
  paid: boolean;
  payment_intent: string | StripePaymentIntent | null; // ID or expanded PaymentIntent
  period_end: number;
  period_start: number;
  post_payment_credit_notes_amount: number;
  pre_payment_credit_notes_amount: number;
  quote: string | null; // ID of the quote
  receipt_number: string | null;
  rendering_options: {
    amount_display_mode: 'auto' | 'exclude_tax' | 'include_inclusive_tax' | null;
  } | null;
  starting_balance: number; // in cents
  statement_descriptor: string | null;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  status_transitions: {
    finalized_at: number | null;
    marked_uncollectible_at: number | null;
    paid_at: number | null;
    voided_at: number | null;
  };
  subscription: string | StripeSubscription | null; // ID or expanded Subscription
  subtotal: number; // in cents
  tax: number | null; // deprecated
  tax_percent: number | null; // deprecated
  total: number; // in cents
  total_discount_amounts: Array<{ amount: number; discount: string }>;
  total_tax_amounts: Array<{ amount: number; inclusive: boolean }>;
  transfer_data: {
    amount: number | null;
    destination: string; // ID of the connected account
  } | null;
  webhooks_delivered_at: number | null;
}

export interface StripeWebhookEvent extends StripeObject {
  object: 'event';
  api_version: string;
  data: {
    object: StripeCustomer | StripeCharge | StripePaymentIntent | StripeSubscription | StripeInvoice | StripeRefund | any; // The actual Stripe object
    previous_attributes?: { [key: string]: any }; // Attributes that changed
  };
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  } | null;
  type: string; // e.g., 'customer.created', 'charge.succeeded', 'invoice.payment_succeeded'
}

export interface StripeList<T> {
  object: 'list';
  data: T[];
  has_more: boolean;
  url: string;
}

export type {
  StripeAddress,
  StripeShipping,
  StripeCustomer,
  StripeBillingDetails,
  StripeCard,
  StripePaymentMethod,
  StripeCharge,
  StripePaymentIntent,
  StripeProduct,
  StripePrice,
  StripeSubscriptionItem,
  StripeSubscription,
  StripeInvoiceLineItem,
  StripeInvoice,
  StripeRefund,
  StripeWebhookEvent,
  StripeList,
};