interface L_WebhookEvent {
  /**
   * A unique identifier for this specific webhook event.
   */
  id: string;

  /**
   * The type of the event, indicating what happened.
   * Examples: 'subscription.created', 'payment.succeeded', 'user.updated'.
   */
  type: string;

  /**
   * The data payload associated with the event.
   * This typically contains the full resource object that triggered the event,
   * or relevant details about the change.
   */
  data: Record<string, any>;

  /**
   * The timestamp when the event occurred, in ISO 8601 format.
   * Example: '2023-10-27T10:00:00Z'.
   */
  timestamp: string;
}