import {
  Kafka,
  Producer,
  Consumer,
  KafkaConfig,
  EachMessagePayload,
  logLevel,
  LogEntry,
  ProducerRecord,
} from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { MessageQueue, MessageHandler } from './MessageQueue';
import { ILogger } from '../logging/ILogger';

/**
 * A default logger implementation using the console.
 * In a real application, this should be replaced with a more robust logger
 * like Pino or Winston, passed into the constructor.
 */
const consoleLogger: ILogger = {
  info: (message: string, meta?: unknown) => console.log(`[INFO] ${message}`, meta ?? ''),
  warn: (message: string, meta?: unknown) => console.warn(`[WARN] ${message}`, meta ?? ''),
  error: (message: string, meta?: unknown) => console.error(`[ERROR] ${message}`, meta ?? ''),
  debug: (message: string, meta?: unknown) => console.debug(`[DEBUG] ${message}`, meta ?? ''),
};

/**
 * KafkaAdapter provides a Kafka-backed implementation of the MessageQueue interface.
 * It manages a single producer and multiple consumers (one per consumer group).
 *
 * @template T A map of topic names to their message payload types, for type-safe messaging.
 * e.g., `interface AppEvents { 'user.created': { userId: string; name: string }; }`
 */
export class KafkaAdapter<T extends Record<string, any>> implements MessageQueue<T> {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly consumers: Map<string, Consumer> = new Map();
  private readonly handlers: Map<string, Map<string, MessageHandler<any>>> = new Map();
  private readonly logger: ILogger;
  private isProducerConnected = false;

  /**
   * Creates an instance of KafkaAdapter.
   * @param {KafkaConfig} config - The configuration for the Kafka client (e.g., brokers, clientId).
   * @param {ILogger} [logger=consoleLogger] - An optional logger instance. Defaults to console.
   */
  constructor(config: KafkaConfig, logger: ILogger = consoleLogger) {
    this.logger = logger;

    // Custom log creator to integrate kafkajs logging with the provided ILogger instance.
    const logCreator = (level: logLevel) => (entry: LogEntry) => {
      const { label, log } = entry;
      const { message, ...extra } = log;
      const logMessage = `[kafkajs/${label}] ${message}`;

      switch (level) {
        case logLevel.ERROR:
        case logLevel.NOTHING:
          this.logger.error(logMessage, extra);
          break;
        case logLevel.WARN:
          this.logger.warn(logMessage, extra);
          break;
        case logLevel.INFO:
          this.logger.info(logMessage, extra);
          break;
        case logLevel.DEBUG:
          this.logger.debug(logMessage, extra);
          break;
      }
    };

    this.kafka = new Kafka({
      ...config,
      logLevel: logLevel.INFO, // Set the minimum log level for kafkajs
      logCreator,
    });

    this.producer = this.kafka.producer();
  }

  /**
   * Connects the Kafka producer to the brokers.
   * Consumers are connected on-demand when a subscription is made.
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting Kafka producer...');
      await this.producer.connect();
      this.isProducerConnected = true;
      this.logger.info('Kafka producer connected successfully.');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer.', { error });
      throw error;
    }
  }

  /**
   * Disconnects the producer and all active consumers.
   */
  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting Kafka adapter...');
    try {
      const disconnectPromises: Promise<void>[] = [];

      if (this.isProducerConnected) {
        disconnectPromises.push(
          this.producer.disconnect().then(() => {
            this.isProducerConnected = false;
            this.logger.info('Kafka producer disconnected.');
          })
        );
      }

      this.consumers.forEach((consumer) => {
        disconnectPromises.push(consumer.disconnect());
      });

      await Promise.all(disconnectPromises);

      this.consumers.clear();
      this.handlers.clear();
      this.logger.info('All Kafka consumers disconnected.');
    } catch (error) {
      this.logger.error('Error during Kafka disconnection.', { error });
      throw error;
    }
  }

  /**
   * Publishes a message to a specific Kafka topic.
   * @template K - The topic name, inferred from the `topic` argument.
   * @param {K} topic - The name of the topic to publish to.
   * @param {T[K]} message - The message payload. Must be JSON-serializable.
   */
  async publish<K extends keyof T>(topic: K, message: T[K]): Promise<void> {
    if (!this.isProducerConnected) {
      throw new Error('Kafka producer is not connected. Call connect() first.');
    }
    try {
      const payload: ProducerRecord = {
        topic: topic as string,
        messages: [{ value: JSON.stringify(message) }],
      };
      await this.producer.send(payload);
      this.logger.debug(`Published message to topic "${topic as string}"`, { message });
    } catch (error) {
      this.logger.error(`Failed to publish message to topic "${topic as string}"`, {
        error,
        message,
      });
      throw error;
    }
  }

  /**
   * Subscribes to a topic with a unique consumer group.
   * This is a "broadcast" pattern where each subscriber instance gets a copy of every message.
   * @template K - The topic name.
   * @param {K} topic - The topic to subscribe to.
   * @param {MessageHandler<T[K]>} handler - The async function to process incoming messages.
   */
  async subscribe<K extends keyof T>(topic: K, handler: MessageHandler<T[K]>): Promise<void> {
    const groupId = `${topic as string}-subscriber-${uuidv4()}`;
    await this.subscribeToGroup(topic, groupId, handler);
  }

  /**
   * Subscribes to a topic as part of a consumer group.
   * This is a "competing consumer" or "queue" pattern where messages are distributed
   * among all subscribers in the same group.
   * @template K - The topic name.
   * @param {K} topic - The topic to subscribe to.
   * @param {string} groupId - The identifier for the consumer group.
   * @param {MessageHandler<T[K]>} handler - The async function to process incoming messages.
   */
  async subscribeToGroup<K extends keyof T>(
    topic: K,
    groupId: string,
    handler: MessageHandler<T[K]>
  ): Promise<void> {
    const topicName = topic as string;
    let consumer = this.consumers.get(groupId);

    // Store the handler for this topic within the group
    if (!this.handlers.has(groupId)) {
      this.handlers.set(groupId, new Map());
    }
    this.handlers.get(groupId)!.set(topicName, handler);

    // If a consumer for this group doesn't exist, create and start it
    if (!consumer) {
      this.logger.info(`Creating new consumer for group "${groupId}"`);
      consumer = this.kafka.consumer({ groupId });
      this.consumers.set(groupId, consumer);

      try {
        await consumer.connect();
        this.logger.info(`Consumer for group "${groupId}" connected.`);
        await consumer.run({
          eachMessage: (payload) => this.handleMessage(groupId, payload),
        });
      } catch (error) {
        this.logger.error(`Failed to connect or run consumer for group "${groupId}"`, { error });
        this.consumers.delete(groupId);
        this.handlers.delete(groupId);
        throw error;
      }
    }

    // Subscribe the consumer to all topics registered for this group.
    // This will trigger a rebalance if new topics are added, which is expected Kafka behavior.
    try {
      const topicsForGroup = Array.from(this.handlers.get(groupId)!.keys());
      this.logger.info(`Subscribing consumer group "${groupId}" to topics: [${topicsForGroup.join(', ')}]`);
      await consumer.subscribe({ topics: topicsForGroup, fromBeginning: true });
    } catch (error) {
      this.logger.error(`Failed to subscribe consumer group "${groupId}" to topic "${topicName}"`, { error });
      throw error;
    }
  }

  /**
   * Internal message handler that deserializes the message and calls the appropriate
   * registered handler function.
   * @param {string} groupId - The consumer group ID that received the message.
   * @param {EachMessagePayload} payload - The raw message payload from kafkajs.
   */
  private async handleMessage(groupId: string, payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    this.logger.debug(`Received message from topic "${topic}" for group "${groupId}"`);

    const handler = this.handlers.get(groupId)?.get(topic);
    if (!handler) {
      this.logger.warn(`No handler found for topic "${topic}" in group "${groupId}". Skipping message.`);
      return;
    }

    try {
      if (!message.value) {
        this.logger.warn(`Received message with empty value on topic "${topic}"`, { message });
        return;
      }
      const parsedMessage = JSON.parse(message.value.toString());
      await handler(parsedMessage);
    } catch (error) {
      this.logger.error(`Error processing message from topic "${topic}" in group "${groupId}"`, {
        error,
        messageValue: message.value?.toString(),
      });
      // In a production system, you might implement a Dead Letter Queue (DLQ) mechanism here
      // to avoid losing messages that repeatedly fail processing.
    }
  }
}