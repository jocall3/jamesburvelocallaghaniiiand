import { v4 as uuidv4 } from 'uuid';

export enum FraudAlertStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum FraudAlertType {
  UNUSUAL_ACTIVITY = 'UNUSUAL_ACTIVITY',
  HIGH_TRANSACTION_AMOUNT = 'HIGH_TRANSACTION_AMOUNT',
  MULTIPLE_FAILED_ATTEMPTS = 'MULTIPLE_FAILED_ATTEMPTS',
  NEW_DEVICE = 'NEW_DEVICE',
  SUSPICIOUS_LOCATION = 'SUSPICIOUS_LOCATION',
  ACCOUNT_TAKEOVER = 'ACCOUNT_TAKEOVER',
  CARD_NOT_PRESENT = 'CARD_NOT_PRESENT',
  OTHER = 'OTHER',
}

export interface FraudAlert {
  id: string;
  userId: string;
  transactionId?: string;
  type: FraudAlertType;
  status: FraudAlertStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string; // User ID of the person assigned to investigate
  metadata?: Record<string, any>; // Store additional information about the alert
  priority?: number; // Numerical priority, higher is more important
  escalated?: boolean; // Flag to indicate if the alert has been escalated
  escalationReason?: string; // Reason for escalation
  relatedAlerts?: string[]; // Array of IDs of related alerts
  customerNotified?: boolean; // Flag to indicate if the customer has been notified
  customerNotificationMethod?: string; // Method used to notify the customer (e.g., email, phone)
  riskScore?: number; // Numerical risk score associated with the alert
}

export function createFraudAlert(
  userId: string,
  type: FraudAlertType,
  transactionId?: string,
  description?: string,
  metadata?: Record<string, any>,
  priority?: number,
  riskScore?: number
): FraudAlert {
  const now = new Date();
  return {
    id: uuidv4(),
    userId,
    transactionId,
    type,
    status: FraudAlertStatus.OPEN,
    description,
    createdAt: now,
    updatedAt: now,
    metadata,
    priority,
    escalated: false,
    riskScore,
  };
}