interface Plan {
  id: string;
  name: string;
  amount: number; // in cents
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  interval_count: number;
  description?: string;
  active: boolean;
  created: number; // Unix timestamp
  updated: number; // Unix timestamp
  metadata?: { [key: string]: string };
}

interface SubscriptionItem {
  id: string;
  plan: Plan;
  quantity: number;
  created: number; // Unix timestamp
}

interface Subscription {
  id: string;
  customer_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired';
  current_period_start: number; // Unix timestamp
  current_period_end: number; // Unix timestamp
  cancel_at_period_end: boolean;
  canceled_at?: number; // Unix timestamp
  ended_at?: number; // Unix timestamp
  items: SubscriptionItem[];
  latest_invoice?: string; // invoice ID
  metadata?: { [key: string]: string };
  created: number; // Unix timestamp
  updated: number; // Unix timestamp
}

interface CreateSubscriptionPayload {
  customer_id: string;
  plan_id: string;
  quantity?: number;
  trial_period_days?: number;
  payment_method_id?: string; // For initial payment
  coupon?: string;
  metadata?: { [key: string]: string };
}

interface UpdateSubscriptionPayload {
  plan_id?: string; // To change the plan
  quantity?: number;
  cancel_at_period_end?: boolean;
  proration_behavior?: 'always_invoice' | 'create_prorations' | 'none';
  metadata?: { [key: string]: string };
}

interface CreatePlanPayload {
  name: string;
  amount: number; // in cents
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  interval_count?: number; // e.g., 3 for 'every 3 months'
  description?: string;
  product_id?: string; // If linking to an existing product
  metadata?: { [key: string]: string };
}

interface UpdatePlanPayload {
  name?: string;
  amount?: number; // in cents
  currency?: string;
  interval?: 'day' | 'week' | 'month' | 'year';
  interval_count?: number;
  description?: string;
  active?: boolean; // To activate/deactivate the plan
  metadata?: { [key: string]: string };
}

class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// Base URL for our custom backend API that interfaces with Stripe
// In a real application, this would typically come from environment variables.
const API_BASE_URL = '/api/v1';

/**
 * Helper function for making API requests.
 * @param method HTTP method (GET, POST, PUT, DELETE).
 * @param path The API endpoint path.
 * @param data Optional request body data.
 * @returns A promise that resolves with the API response data.
 * @throws ApiError if the request fails.
 */
async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: object
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    // Add authorization headers here, e.g., 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config);

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // If response body is not JSON, use default error message
    }
    throw new ApiError(errorMessage, response.status);
  }

  // Handle cases where response might be 204 No Content
  if (response.status === 204) {
    return null as T; // Or return an empty object, depending on API contract
  }

  return response.json() as Promise<T>;
}

/**
 * `SubscriptionApiService` provides methods for interacting with subscription and plan resources
 * via a custom backend API. This service layer abstracts the underlying API calls,
 * making it easier for the frontend to manage subscriptions.
 */
class SubscriptionApiService {
  // --- Subscription Operations ---

  /**
   * Creates a new subscription for a customer.
   * @param payload The subscription creation data.
   * @returns A promise that resolves with the created subscription.
   */
  async createSubscription(payload: CreateSubscriptionPayload): Promise<Subscription> {
    return apiRequest<Subscription>('POST', '/subscriptions', payload);
  }

  /**
   * Retrieves a specific subscription by its ID.
   * @param subscriptionId The ID of the subscription to retrieve.
   * @returns A promise that resolves with the subscription details.
   */
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    return apiRequest<Subscription>('GET', `/subscriptions/${subscriptionId}`);
  }

  /**
   * Updates an existing subscription.
   * @param subscriptionId The ID of the subscription to update.
   * @param payload The subscription update data.
   * @returns A promise that resolves with the updated subscription.
   */
  async updateSubscription(subscriptionId: string, payload: UpdateSubscriptionPayload): Promise<Subscription> {
    return apiRequest<Subscription>('PUT', `/subscriptions/${subscriptionId}`, payload);
  }

  /**
   * Cancels a subscription.
   * @param subscriptionId The ID of the subscription to cancel.
   * @param atPeriodEnd If true, the subscription will be canceled at the end of the current billing period.
   *                    If false, it will be canceled immediately. Defaults to true.
   * @returns A promise that resolves with the canceled subscription.
   */
  async cancelSubscription(subscriptionId: string, atPeriodEnd: boolean = true): Promise<Subscription> {
    // Our backend might have a specific endpoint or payload for this action
    return apiRequest<Subscription>('DELETE', `/subscriptions/${subscriptionId}`, { at_period_end: atPeriodEnd });
  }

  /**
   * Lists all subscriptions, optionally filtered by customer.
   * @param customerId Optional customer ID to filter subscriptions for a specific customer.
   * @returns A promise that resolves with an array of subscriptions.
   */
  async listSubscriptions(customerId?: string): Promise<Subscription[]> {
    const query = customerId ? `?customer_id=${customerId}` : '';
    return apiRequest<Subscription[]>('GET', `/subscriptions${query}`);
  }

  // --- Plan Operations ---

  /**
   * Creates a new plan (which typically corresponds to a Stripe Price object linked to a Product).
   * @param payload The plan creation data.
   * @returns A promise that resolves with the created plan.
   */
  async createPlan(payload: CreatePlanPayload): Promise<Plan> {
    return apiRequest<Plan>('POST', '/plans', payload);
  }

  /**
   * Retrieves a specific plan by its ID.
   * @param planId The ID of the plan to retrieve.
   * @returns A promise that resolves with the plan details.
   */
  async getPlan(planId: string): Promise<Plan> {
    return apiRequest<Plan>('GET', `/plans/${planId}`);
  }

  /**
   * Updates an existing plan.
   * @param planId The ID of the plan to update.
   * @param payload The plan update data.
   * @returns A promise that resolves with the updated plan.
   */
  async updatePlan(planId: string, payload: UpdatePlanPayload): Promise<Plan> {
    return apiRequest<Plan>('PUT', `/plans/${planId}`, payload);
  }

  /**
   * Deletes a plan. In Stripe, prices are typically archived rather than permanently deleted.
   * This operation will likely deactivate the plan in our system and/or archive the corresponding
   * Stripe Price object via the backend.
   * @param planId The ID of the plan to delete.
   * @returns A promise that resolves with a confirmation object indicating deletion status.
   */
  async deletePlan(planId: string): Promise<{ id: string; deleted: boolean }> {
    return apiRequest<{ id: string; deleted: boolean }>('DELETE', `/plans/${planId}`);
  }

  /**
   * Lists all plans, optionally filtering by active status.
   * @param active If true, only active plans are returned. Defaults to true.
   * @returns A promise that resolves with an array of plans.
   */
  async listPlans(active: boolean = true): Promise<Plan[]> {
    const query = `?active=${active}`;
    return apiRequest<Plan[]>('GET', `/plans${query}`);
  }
}

// Export an instance of the service for convenient use throughout the application.
export const subscriptionApiService = new SubscriptionApiService();