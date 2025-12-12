/**
 * @file Defines the abstract interface for message queue implementations.
 * This provides a consistent contract for different messaging backends like
 * RabbitMQ, Kafka, or even an in-memory queue for testing.
 */

/**
 * Represents the metadata associated with a message.
 * This information is crucial for tracing, auditing, and debugging in a distributed system.
 */
export interface MessageMetadata {
  /**
   * A unique identifier for the specific message instance.
   * Typically a UUID (v4).
   */
  readonly messageId: string;

  /**
   * The timestamp when the message was created, in ISO 8601 format (e.g., "2023-10-27T10:00:00.000Z").
   */
  readonly timestamp: string;

  /**
   * The ID of the request or event chain that this message is a part of.
   * This allows for tracing a single logical operation across multiple services.
   */
  readonly correlationId?: string;

  /**
   * The ID of the message that directly caused this message to be created.
   * Useful for tracing direct cause-and-effect relationships in a sequence of events.
   */
  readonly causationId?: string;

  /**
   * The name of the service or application that originated the message.
   */
  readonly originService?: string;

  /**
   * Any other custom headers or properties that might be needed for routing,
   * feature flags, or other contextual information.
   */
  [key: string]: unknown;
}

/**
 * Represents a standardized message structure for communication between services.
 * Using a consistent message envelope simplifies serialization, deserialization, and middleware processing.
 * @template T The type of the payload. Defaults to `unknown`.
 */
export interface Message<T = unknown> {
  /**
   * The type or name of the message, which defines its purpose and schema.
   * e.g., "UserCreatedEvent" or "ProcessPaymentCommand".
   */
  readonly type: string;

  /**
   * The data payload of the message.
   */
  readonly payload: T;

  /**
   * Metadata for tracing, auditing, and routing.
   */
  readonly metadata: MessageMetadata;
}

/**
 * A function that handles an incoming message.
 * The message queue implementation should automatically acknowledge the message if the promise resolves
 * and negatively acknowledge it (for potential redelivery) if the promise rejects.
 * @template T The type of the message payload.
 */
export type MessageHandler<T = unknown> = (message: Message<T>) => Promise<void>;

/**
 * Represents an active subscription to a queue or topic.
 * This object allows the consumer to gracefully stop listening for messages.
 */
export interface Subscription {
  /**
   * Stops the consumer from receiving new messages and cleans up any associated resources.
   * @returns {Promise<void>} A promise that resolves when the unsubscription is complete.
   */
  unsubscribe(): Promise<void>;
}

/**
 * Options for publishing a message. These can be used to control message delivery characteristics.
 */
export interface PublishOptions {
  /**
   * A routing key, used by some message brokers (like RabbitMQ with topic or direct exchanges)
   * to route the message to specific queues.
   */
  routingKey?: string;

  /**
   * If true, the broker will attempt to save the message to disk to ensure it survives a broker restart.
   * @default true
   */
  persistent?: boolean;

  /**
   * Time-to-live for the message in milliseconds. After this time, the message may be discarded
   * or sent to a dead-letter exchange.
   */
  ttl?: number;

  /**
   * Any other implementation-specific options.
   */
  [key: string]: unknown;
}

/**
 * Options for subscribing to a queue. These can be used to control consumer behavior.
 */
export interface SubscribeOptions {
  /**
   * A binding key or topic pattern (e.g., "user.*.created") used by some message brokers
   * to bind the queue to an exchange and filter which messages it receives.
   */
  bindingKey?: string;

  /**
   * The maximum number of unacknowledged messages that the broker will deliver at once.
   * This is a key setting for controlling consumer throughput and load.
   * Also known as prefetch count or Quality of Service (QoS).
   * @default 1
   */
  concurrency?: number;

  /**
   * Any other implementation-specific options.
   */
  [key: string]: unknown;
}

/**
 * Abstract interface for a message queue.
 * This defines the contract that all message queue implementations (e.g., RabbitMQ, Kafka, SQS, NATS)
 * must adhere to, ensuring interoperability and swappable infrastructure.
 */
export interface MessageQueue {
  /**
   * Establishes a connection to the message broker.
   * This method must be successfully called before any other operations can be performed.
   * @returns {Promise<void>} A promise that resolves upon successful connection.
   */
  connect(): Promise<void>;

  /**
   * Gracefully disconnects from the message broker and cleans up all associated resources,
   * such as channels and connections.
   * @returns {Promise<void>} A promise that resolves upon successful disconnection.
   */
  disconnect(): Promise<void>;

  /**
   * Publishes a message to a specific exchange or topic. The underlying implementation
   * is responsible for routing the message to the appropriate queue(s) based on broker configuration.
   *
   * @template T The type of the message payload.
   * @param {string} exchange - The name of the exchange or topic to publish to.
   * @param {Message<T>} message - The message object to be sent.
   * @param {PublishOptions} [options] - Optional parameters for publishing.
   * @returns {Promise<void>} A promise that resolves when the message has been successfully published.
   */
  publish<T>(
    exchange: string,
    message: Message<T>,
    options?: PublishOptions,
  ): Promise<void>;

  /**
   * Subscribes a handler to a specific queue to process incoming messages.
   * The implementation is responsible for asserting the queue exists and binding it to the
   * appropriate exchange(s) as needed.
   *
   * @template T The type of the message payload.
   * @param {string} queueName - The name of the queue to consume from.
   * @param {MessageHandler<T>} handler - The asynchronous function to process each message.
   * @param {SubscribeOptions} [options] - Optional parameters for the subscription.
   * @returns {Promise<Subscription>} A promise that resolves with a subscription object,
   * which contains an `unsubscribe` method to stop consumption.
   */
  subscribe<T>(
    queueName: string,
    handler: MessageHandler<T>,
    options?: SubscribeOptions,
  ): Promise<Subscription>;
}