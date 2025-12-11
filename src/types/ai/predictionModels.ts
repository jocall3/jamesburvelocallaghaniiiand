/**
 * Represents the priority level for a recommended action.
 */
export type ActionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Defines a recommended action to be taken based on an AI prediction.
 */
export interface RecommendedAction {
  /**
   * A unique identifier for the action.
   * e.g., 'BLOCK_TRANSACTION', 'FLAG_FOR_REVIEW', 'SEND_PROMOTIONAL_EMAIL'
   */
  actionId: string;

  /**
   * A human-readable description of the recommended action.
   */
  description: string;

  /**
   * The priority level of the action, indicating its urgency.
   */
  priority: ActionPriority;

  /**
   * Optional metadata associated with the action, providing additional context
   * or parameters needed to execute the action.
   */
  metadata?: Record<string, any>;
}

/**
 * Represents a single prediction from an AI model.
 */
export interface Prediction {
  /**
   * The predicted label or value.
   * e.g., 'FRAUD', 'NOT_FRAUD', 'CUSTOMER_CHURN'
   */
  label: string;

  /**
   * The confidence score of the prediction, typically a value between 0 and 1.
   */
  confidence: number;
}

/**
 * Defines the overall structure of a response from an AI prediction service.
 */
export interface AIPredictionResponse {
  /**
   * A unique identifier for the prediction request, useful for logging and traceability.
   */
  requestId: string;

  /**
   * The identifier of the model that generated the prediction.
   */
  modelId: string;

  /**
   * The version of the AI model used for this prediction.
   */
  modelVersion: string;

  /**
   * The ISO 8601 timestamp of when the prediction was made.
   */
  timestamp: string;

  /**
   * An array of predictions. For single-label classification, this may contain one item.
   * For multi-label or if returning top-k predictions, it may contain multiple items.
   */
  predictions: Prediction[];

  /**
   * An array of recommended actions based on the prediction outcomes.
   * This may be empty if no specific actions are recommended.
   */
  recommendedActions: RecommendedAction[];

  /**
   * Any additional metadata or explanation from the model (e.g., feature importance).
   */
  explanation?: Record<string, any>;
}