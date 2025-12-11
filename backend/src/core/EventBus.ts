```typescript
/**
 * @fileoverview
 * Implements an abstraction layer for an event bus to handle asynchronous
 * communication between different microservices (Core, Chronos, Agent).
 * This allows for decoupling services and supports different underlying
 * message brokers like RabbitMQ, Kafka, or a simple in-memory bus for development.
 */

// 1. Interfaces and Types

/**
 * Defines the structure of an event that flows through the bus.
 * @template T The type of the event payload.
 */
export interface Event<T = any> {
  /** The topic or channel the event is published to. */
  topic: string;
  /** The data payload of the event. */
  payload: T;
  /** The timestamp when the event was created. */
  timestamp: Date;
  /** The name of the service that originated the event. */
  source: string;
}

/**
 * Type definition for a function that handles a received event.
 * @template T The type of the event payload.
 */
export type EventHandler<T = any> = (
  payload: T,
  event: Event<T>,
) => void | Promise<void>;

/**
 * Interface for the Event Bus. Defines the contract for all event bus implementations.
 */
export interface IEventBus {
  /** Connects to the underlying message broker. */
  connect(): Promise<void>;
  /** Disconnects from the underlying message broker. */
  disconnect(): Promise<void>;
  /**
   * Publishes an event to a specific topic.
   * @template T The type of the event payload.
   * @param event The event data to publish. The bus will add timestamp and source.
   */
  publish<T>(event: Omit<Event<T>, 'timestamp' | 'source'>): Promise<void>;
  /**
   * Subscribes to a topic to receive events.
   * @template T The type of the event payload.
   * @param topic The topic to subscribe to.
   * @param handler The function to call when an event is received.
   */
  subscribe<T>(topic: string, handler: EventHandler<T>): Promise<void>;
  /**
   * Unsubscribes from a topic.
   * @param topic The topic to unsubscribe from.
   * @param handler The specific handler to remove (optional). If not provided, all handlers for the topic are removed.
   */
  unsubscribe(topic: string, handler?: EventHandler): Promise<void>;
}

// 2. Topic Constants

/**
 * A central registry of event topics used across the application.
 * Using constants helps avoid typos and provides a single source of truth.
 */
export const TOPICS = {
  // Agent related topics
  AGENT_TASK_REQUEST: 'agent.task.request',
  AGENT_TASK_RESULT: 'agent.task.result',
  AGENT_HEARTBEAT: 'agent.heartbeat',

  // Chronos (scheduler) related topics
  CHRONOS_JOB_TRIGGER: 'chronos.job.trigger',

  // Core system topics
  CORE_NOTIFICATION: 'core.notification',
  SERVICE_STARTED: 'system.service.started',
  SERVICE_STOPPED: 'system.service.stopped',
};

// 3. In-Memory Event Bus Implementation (for development and testing)

/**
 * An in-memory implementation of the IEventBus interface.
 * It's useful for local development and testing without requiring a message broker.
 * It simulates the pub/sub pattern within the same process.
 */
class InMemoryEventBus implements IEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private isConnected: boolean = false;
  private readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn('[EventBus] In-memory event bus is already connected.');
      return;
    }
    console.log(
      `[EventBus] In-memory bus for service "${this.serviceName}" connected.`,
    );
    this.isConnected = true;
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }
    console.log('[EventBus] In-memory bus disconnected.');
    this.isConnected = false;
    this.handlers.clear();
  }

  public async publish<T>(
    eventData: Omit<Event<T>, 'timestamp' | 'source'>,
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Event bus is not connected. Cannot publish event.');
    }

    const event: Event<T> = {
      ...eventData,
      timestamp: new Date(),
      source: this.serviceName,
    };

    const topicHandlers = this.handlers.get(event.topic);
    if (topicHandlers && topicHandlers.length > 0) {
      console.log(
        `[EventBus] Publishing event to topic "${event.topic}" for ${topicHandlers.length} subscriber(s).`,
      );
      topicHandlers.forEach(handler => {
        // Asynchronously call the handler to simulate a real event bus (fire-and-forget)
        setTimeout(() => {
          try {
            Promise.resolve(handler(event.payload, event)).catch(err => {
              console.error(
                `[EventBus] Error in async event handler for topic "${event.topic}":`,
                err,
              );
            });
          } catch (err) {
            console.error(
              `[EventBus] Unhandled sync error in event handler for topic "${event.topic}":`,
              err,
            );
          }
        }, 0);
      });
    }
  }

  public async subscribe<T>(
    topic: string,
    handler: EventHandler<T>,
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Event bus is not connected. Cannot subscribe.');
    }
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    this.handlers.get(topic)!.push(handler as EventHandler);
    console.log(
      `[EventBus] Service "${this.serviceName}" subscribed to topic "${topic}".`,
    );
  }

  public async unsubscribe(topic: string, handler?: EventHandler): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    const topicHandlers = this.handlers.get(topic);
    if (!topicHandlers) {
      return;
    }

    if (handler) {
      const newHandlers = topicHandlers.filter(h => h !== handler);
      if (newHandlers.length === 0) {
        this.handlers.delete(topic);
      } else {
        this.handlers.set(topic, newHandlers);
      }
    } else {
      this.handlers.delete(topic);
    }
    console.log(`[EventBus] Unsubscribed from topic "${topic}".`);
  }
}

// 4. Event Bus Factory

/**
 * Type for event bus configuration.
 */
export interface EventBusConfig {
  serviceName: string;
  type: 'in-memory' | 'kafka' | 'rabbitmq';
  // Add other broker-specific configs here, e.g., url, credentials
}

/**
 * A factory for creating and managing a singleton IEventBus instance.
 * This ensures that the entire application uses the same event bus connection.
 */
class EventBusManager {
  private static instance: IEventBus | null = null;

  /**
   * Initializes the singleton event bus instance. Should be called once at application startup.
   * @param config The configuration for the event bus.
   * @returns The initialized event bus instance.
   */
  public static initialize(config: EventBusConfig): IEventBus {
    if (this.instance) {
      console.warn(
        '[EventBus] EventBus is already initialized. Returning existing instance.',
      );
      return this.instance;
    }

    switch (config.type) {
      case 'in-memory':
        this.instance = new InMemoryEventBus(config.serviceName);
        break;
      // Stubs for other implementations
      case 'kafka':
        // this.instance = new KafkaEventBus(config);
        throw new Error('Kafka event bus is not yet implemented.');
      case 'rabbitmq':
        // this.instance = new RabbitMQEventBus(config);
        throw new Error('RabbitMQ event bus is not yet implemented.');
      default:
        // This is a type error, but good for runtime safety
        const exhaustiveCheck: never = config.type;
        throw new Error(`Unsupported event bus type: ${exhaustiveCheck}`);
    }

    console.log(
      `[EventBus] Initialized ${config.type} event bus for service "${config.serviceName}".`,
    );
    return this.instance;
  }

  /**
   * Gets the singleton event bus instance.
   * Throws an error if the bus has not been initialized.
   * @returns The singleton IEventBus instance.
   */
  public static getInstance(): IEventBus {
    if (!this.instance) {
      throw new Error(
        'EventBus has not been initialized. Call EventBusManager.initialize() at application startup.',
      );
    }
    return this.instance;
  }
}

export default EventBusManager;
```