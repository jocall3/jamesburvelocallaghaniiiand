/**
 * Base interface for all events.  All events MUST extend this interface.
 */
export interface BaseEvent {
  /**
   * The name of the event.  This should be a unique string that identifies the event type.
   * Convention:  Use PascalCase and end with "Event".  Example: UserCreatedEvent
   */
  eventName: string;

  /**
   * A unique identifier for this specific event instance.  Useful for tracing and debugging.
   */
  eventId: string;

  /**
   * The timestamp of when the event was created.  Use ISO 8601 format (e.g., 2023-10-27T10:00:00.000Z).
   */
  occurredAt: string; // ISO 8601 timestamp
}

/**
 * Example event definition.  Replace this with your actual event definitions.
 */
export interface UserCreatedEvent extends BaseEvent {
  eventName: 'UserCreatedEvent';
  userId: string;
  email: string;
  username: string;
}

/**
 * Example event definition.
 */
export interface ProductAddedEvent extends BaseEvent {
  eventName: 'ProductAddedEvent';
  productId: string;
  productName: string;
  price: number;
}

/**
 * Example event definition.
 */
export interface OrderCreatedEvent extends BaseEvent {
  eventName: 'OrderCreatedEvent';
  orderId: string;
  customerId: string;
  totalAmount: number;
}

/**
 * Union type of all possible events.  This is used to ensure type safety when publishing and subscribing to events.
 */
export type DomainEvent =
  | UserCreatedEvent
  | ProductAddedEvent
  | OrderCreatedEvent;