import Stripe from 'stripe';

/**
 * Configuration for the Stripe API client.
 */
interface StripeConfig {
  apiKey: string;
  apiVersion?: '2020-08-27' | '2022-11-15' | '2023-08-16' | '2024-04-10'; // Specify supported API versions
}

/**
 * Represents a service layer for interacting with Stripe's fraud-related APIs,
 * specifically focusing on Radar reviews, disputes, and rule configurations.
 */
export class FraudApiService {
  private stripe: Stripe;

  /**
   * Initializes the FraudApiService with a Stripe API key.
   * @param config Configuration object containing the Stripe API key and optional API version.
   */
  constructor(config: StripeConfig) {
    if (!config.apiKey) {
      throw new Error('Stripe API key is required for FraudApiService.');
    }
    this.stripe = new Stripe(config.apiKey, {
      apiVersion: config.apiVersion || '2024-04-10', // Default to the latest stable API version
      typescript: true,
    });
  }

  /**
   * Fetches a list of Radar reviews.
   * Radar reviews are created when Stripe Radar flags a payment for manual review.
   * @param params Optional parameters for listing reviews (e.g., limit, starting_after, status).
   * @returns A promise that resolves to a list of Stripe Radar reviews.
   * @see https://stripe.com/docs/api/radar/reviews/list
   */
  public async listRadarReviews(
    params?: Stripe.Radar.ReviewListParams
  ): Promise<Stripe.ApiList<Stripe.Radar.Review>> {
    try {
      return await this.stripe.radar.reviews.list(params);
    } catch (error) {
      console.error('Error fetching Radar reviews:', error);
      throw new Error(`Failed to fetch Radar reviews: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves a specific Radar review by its ID.
   * @param reviewId The ID of the Radar review to retrieve.
   * @returns A promise that resolves to the specified Stripe Radar review.
   * @see https://stripe.com/docs/api/radar/reviews/retrieve
   */
  public async retrieveRadarReview(reviewId: string): Promise<Stripe.Radar.Review> {
    try {
      return await this.stripe.radar.reviews.retrieve(reviewId);
    } catch (error) {
      console.error(`Error retrieving Radar review ${reviewId}:`, error);
      throw new Error(`Failed to retrieve Radar review ${reviewId}: ${(error as Error).message}`);
    }
  }

  /**
   * Approves a Radar review, indicating that the payment is legitimate.
   * @param reviewId The ID of the Radar review to approve.
   * @returns A promise that resolves to the updated Stripe Radar review.
   * @see https://stripe.com/docs/api/radar/reviews/approve
   */
  public async approveRadarReview(reviewId: string): Promise<Stripe.Radar.Review> {
    try {
      return await this.stripe.radar.reviews.approve(reviewId);
    } catch (error) {
      console.error(`Error approving Radar review ${reviewId}:`, error);
      throw new Error(`Failed to approve Radar review ${reviewId}: ${(error as Error).message}`);
    }
  }

  /**
   * Declines a Radar review, indicating that the payment is fraudulent.
   * @param reviewId The ID of the Radar review to decline.
   * @returns A promise that resolves to the updated Stripe Radar review.
   * @see https://stripe.com/docs/api/radar/reviews/decline
   */
  public async declineRadarReview(reviewId: string): Promise<Stripe.Radar.Review> {
    try {
      return await this.stripe.radar.reviews.decline(reviewId);
    } catch (error) {
      console.error(`Error declining Radar review ${reviewId}:`, error);
      throw new Error(`Failed to decline Radar review ${reviewId}: ${(error as Error).message}`);
    }
  }

  /**
   * Fetches a list of disputes.
   * Disputes occur when a customer challenges a payment with their bank.
   * @param params Optional parameters for listing disputes (e.g., limit, starting_after, status).
   * @returns A promise that resolves to a list of Stripe disputes.
   * @see https://stripe.com/docs/api/disputes/list
   */
  public async listDisputes(
    params?: Stripe.DisputeListParams
  ): Promise<Stripe.ApiList<Stripe.Dispute>> {
    try {
      return await this.stripe.disputes.list(params);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      throw new Error(`Failed to fetch disputes: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves a specific dispute by its ID.
   * @param disputeId The ID of the dispute to retrieve.
   * @returns A promise that resolves to the specified Stripe dispute.
   * @see https://stripe.com/docs/api/disputes/retrieve
   */
  public async retrieveDispute(disputeId: string): Promise<Stripe.Dispute> {
    try {
      return await this.stripe.disputes.retrieve(disputeId);
    } catch (error) {
      console.error(`Error retrieving dispute ${disputeId}:`, error);
      throw new Error(`Failed to retrieve dispute ${disputeId}: ${(error as Error).message}`);
    }
  }

  /**
   * Updates a dispute, typically to provide evidence.
   * @param disputeId The ID of the dispute to update.
   * @param params Parameters for updating the dispute (e.g., evidence).
   * @returns A promise that resolves to the updated Stripe dispute.
   * @see https://stripe.com/docs/api/disputes/update
   */
  public async updateDispute(
    disputeId: string,
    params: Stripe.DisputeUpdateParams
  ): Promise<Stripe.Dispute> {
    try {
      return await this.stripe.disputes.update(disputeId, params);
    } catch (error) {
      console.error(`Error updating dispute ${disputeId}:`, error);
      throw new Error(`Failed to update dispute ${disputeId}: ${(error as Error).message}`);
    }
  }

  /**
   * Closes a dispute. This can only be done if the dispute is in `needs_response` status
   * and you choose not to respond.
   * @param disputeId The ID of the dispute to close.
   * @returns A promise that resolves to the closed Stripe dispute.
   * @see https://stripe.com/docs/api/disputes/close
   */
  public async closeDispute(disputeId: string): Promise<Stripe.Dispute> {
    try {
      return await this.stripe.disputes.close(disputeId);
    } catch (error) {
      console.error(`Error closing dispute ${disputeId}:`, error);
      throw new Error(`Failed to close dispute ${disputeId}: ${(error as Error).message}`);
    }
  }

  /**
   * Fetches a list of Radar early fraud warnings.
   * Early fraud warnings are notifications from card networks about potentially fraudulent payments.
   * @param params Optional parameters for listing early fraud warnings.
   * @returns A promise that resolves to a list of Stripe Radar early fraud warnings.
   * @see https://stripe.com/docs/api/radar/early_fraud_warnings/list
   */
  public async listEarlyFraudWarnings(
    params?: Stripe.Radar.EarlyFraudWarningListParams
  ): Promise<Stripe.ApiList<Stripe.Radar.EarlyFraudWarning>> {
    try {
      return await this.stripe.radar.earlyFraudWarnings.list(params);
    } catch (error) {
      console.error('Error fetching early fraud warnings:', error);
      throw new Error(`Failed to fetch early fraud warnings: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves a specific Radar early fraud warning by its ID.
   * @param warningId The ID of the early fraud warning to retrieve.
   * @returns A promise that resolves to the specified Stripe Radar early fraud warning.
   * @see https://stripe.com/docs/api/radar/early_fraud_warnings/retrieve
   */
  public async retrieveEarlyFraudWarning(
    warningId: string
  ): Promise<Stripe.Radar.EarlyFraudWarning> {
    try {
      return await this.stripe.radar.earlyFraudWarnings.retrieve(warningId);
    } catch (error) {
      console.error(`Error retrieving early fraud warning ${warningId}:`, error);
      throw new Error(
        `Failed to retrieve early fraud warning ${warningId}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Fetches a list of Radar rule configurations.
   * Note: Stripe's API does not directly expose a public endpoint to *list* or *retrieve*
   * Radar rules themselves via the API for security and proprietary reasons.
   * This method is a placeholder or might be used if Stripe introduces such an API in the future,
   * or if there's an internal mechanism to access rule metadata.
   * For now, direct management of Radar rules is primarily done via the Stripe Dashboard.
   *
   * If the intent was to fetch *evaluations* of rules, that would typically be part of
   * a `Charge` or `PaymentIntent` object's `outcome.radar_risk_level` or `outcome.rule`.
   *
   * @returns A promise that resolves to a list of (hypothetical) Stripe Radar rule configurations.
   * @deprecated As of current Stripe API (2024-04-10), direct API access to list/retrieve Radar rules is not available.
   *             This method is included for future compatibility or if an internal/private API is used.
   */
  public async listRadarRuleConfigurations(): Promise<any[]> {
    console.warn(
      'Stripe API does not currently provide a public endpoint to list or retrieve Radar rule configurations directly.' +
        ' This method is a placeholder and will return an empty array.' +
        ' Radar rules are managed via the Stripe Dashboard.'
    );
    // In a real scenario, if there was an internal API or a future Stripe API,
    // this would make the appropriate call.
    return Promise.resolve([]);
  }

  /**
   * Retrieves a specific Radar rule configuration by its ID.
   * Similar to `listRadarRuleConfigurations`, this is a placeholder.
   * @param ruleId The ID of the Radar rule to retrieve.
   * @returns A promise that resolves to the specified (hypothetical) Stripe Radar rule configuration.
   * @deprecated As of current Stripe API (2024-04-10), direct API access to list/retrieve Radar rules is not available.
   *             This method is included for future compatibility or if an internal/private API is used.
   */
  public async retrieveRadarRuleConfiguration(ruleId: string): Promise<any> {
    console.warn(
      `Stripe API does not currently provide a public endpoint to retrieve Radar rule configuration ${ruleId} directly.` +
        ' This method is a placeholder and will return null.' +
        ' Radar rules are managed via the Stripe Dashboard.'
    );
    return Promise.resolve(null);
  }
}