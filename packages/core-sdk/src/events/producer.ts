import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import {
  CoreEvent,
  EventSchema,
  EventTopic,
  EventPayload,
  EventMetadata,
  EventSource,
  EventSeverity,
  EventStatus,
  EventCategory,
} from './types';
import { Logger } from '../logging/logger';
import { Configuration } from '../config/config';
import { CircuitBreaker } from '../resilience/circuitBreaker';
import { RetryPolicy } from '../resilience/retryPolicy';
import { AuthContext } from '../auth/authContext';
import { CommonOntology } from '../ontology/commonOntology';

/**
 * @license
 * Copyright 2024 AI Ecosystem. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * EventProducerConfig defines the configuration for the EventProducer.
 */
export interface EventProducerConfig {
  /** Kafka broker list (e.g., 'localhost:9092'). */
  brokers: string[];
  /** Client ID for the Kafka producer. */
  clientId: string;
  /** Number of retries for transient errors. */
  maxRetries?: number;
  /** Initial delay for retries in milliseconds. */
  retryDelayMs?: number;
  /** Whether to enable idempotence for the producer. */
  idempotent?: boolean;
  /** Acknowledgment level for messages ('0', '1', '-1'/'all'). */
  acks?: -1 | 0 | 1;
  /** Timeout for message production in milliseconds. */
  timeout?: number;
  /** Circuit breaker configuration. */
  circuitBreakerConfig?: {
    failureThreshold: number;
    resetTimeoutMs: number;
    openTimeoutMs: number;
  };
}

/**
 * EventProducer is a high-level wrapper for producing strongly-typed events
 * to a shared event bus (e.g., Kafka). It handles serialization, error handling,
 * retry logic, and integrates with the shared ontology and authentication context.
 */
export class EventProducer {
  private kafka: Kafka;
  private producer: Producer;
  private logger: Logger;
  private config: EventProducerConfig;
  private circuitBreaker: CircuitBreaker;
  private retryPolicy: RetryPolicy;
  private isConnected: boolean = false;

  constructor(config: EventProducerConfig) {
    // Validate essential configuration
    if (!config.brokers || config.brokers.length === 0) {
      throw new Error('EventProducer: Kafka brokers must be provided.');
    }
    if (!config.clientId) {
      throw new Error('EventProducer: Kafka client ID must be provided.');
    }

    this.config = {
      maxRetries: 5,
      retryDelayMs: 1000,
      idempotent: true,
      acks: -1, // Ensure all in-sync replicas have received the record
      timeout: 30000, // 30 seconds
      ...config,
    };

    this.logger = new Logger(`EventProducer:${this.config.clientId}`);

    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      retry: {
        initialRetryTime: this.config.retryDelayMs,
        retries: this.config.maxRetries,
        maxRetryTime: 30000, // Max 30 seconds between retries
        factor: 2, // Exponential backoff
        multiplier: 1.5, // Jitter
      },
    });

    this.producer = this.kafka.producer({
      idempotent: this.config.idempotent,
      allowAutoTopicCreation: true, // Allow Kafka to create topics if they don't exist
      transactionalId: this.config.idempotent ? `${this.config.clientId}-transactional-producer` : undefined,
    });

    this.retryPolicy = new RetryPolicy(this.config.maxRetries!, this.config.retryDelayMs!);
    this.circuitBreaker = new CircuitBreaker(
      this.config.circuitBreakerConfig?.failureThreshold || 5,
      this.config.circuitBreakerConfig?.resetTimeoutMs || 60000, // 1 minute
      this.config.circuitBreakerConfig?.openTimeoutMs || 10000, // 10 seconds
      'EventProducer'
    );

    this.setupErrorHandlers();
  }

  /**
   * Connects the Kafka producer.
   * @returns A promise that resolves when the producer is connected.
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      this.logger.warn('EventProducer already connected.');
      return;
    }
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.info('EventProducer connected successfully.');
    } catch (error) {
      this.logger.error(`Failed to connect EventProducer: ${error instanceof Error ? error.message : String(error)}`);
      this.isConnected = false;
      throw new Error(`EventProducer connection failed: ${error}`);
    }
  }

  /**
   * Disconnects the Kafka producer.
   * @returns A promise that resolves when the producer is disconnected.
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('EventProducer is not connected, skipping disconnect.');
      return;
    }
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.info('EventProducer disconnected successfully.');
    } catch (error) {
      this.logger.error(
        `Failed to disconnect EventProducer: ${error instanceof Error ? error.message : String(error)}`
      );
      // Do not rethrow, allow graceful shutdown attempts
    }
  }

  /**
   * Sets up internal error handlers for the Kafka producer.
   */
  private setupErrorHandlers(): void {
    this.producer.on('producer.connect', () => {
      this.logger.info('Kafka producer connected event received.');
      this.isConnected = true;
      this.circuitBreaker.reset(); // Reset circuit breaker on successful connection
    });

    this.producer.on('producer.disconnect', () => {
      this.logger.warn('Kafka producer disconnected event received.');
      this.isConnected = false;
      this.circuitBreaker.trip(); // Trip circuit breaker on disconnect
    });

    this.producer.on('producer.end', () => {
      this.logger.info('Kafka producer ended event received.');
      this.isConnected = false;
    });

    this.producer.on('producer.error', (error) => {
      this.logger.error(`Kafka producer error: ${error.message}`, { stack: error.stack });
      this.circuitBreaker.recordFailure();
      // Note: KafkaJS handles internal retries, this is for unrecoverable errors or connection issues.
    });

    this.producer.on('producer.network.request_timeout', (payload) => {
      this.logger.warn(`Kafka producer network request timeout: ${JSON.stringify(payload)}`);
      this.circuitBreaker.recordFailure();
    });

    this.producer.on('producer.transaction.abort', (payload) => {
      this.logger.error(`Kafka producer transaction aborted: ${JSON.stringify(payload)}`);
      this.circuitBreaker.recordFailure();
    });
  }

  /**
   * Creates a standardized CoreEvent object.
   * @param topic The event topic.
   * @param payload The event payload.
   * @param source The source application/service.
   * @param category The event category.
   * @param severity The event severity.
   * @param status The event status.
   * @param correlationId An optional correlation ID for tracing.
   * @param authContext The current authentication context.
   * @param additionalMetadata Any additional metadata to include.
   * @returns A fully formed CoreEvent object.
   */
  public createEvent<T extends EventPayload>(
    topic: EventTopic,
    payload: T,
    source: EventSource,
    category: EventCategory,
    severity: EventSeverity = EventSeverity.INFO,
    status: EventStatus = EventStatus.SUCCESS,
    correlationId?: string,
    authContext?: AuthContext,
    additionalMetadata?: Record<string, any>
  ): CoreEvent<T> {
    const eventId = uuidv4();
    const timestamp = new Date().toISOString();

    const metadata: EventMetadata = {
      eventId,
      timestamp,
      source,
      category,
      severity,
      status,
      correlationId: correlationId || uuidv4(), // Generate if not provided
      schemaVersion: EventSchema.V1, // Assuming V1 for now
      auth: authContext ? authContext.toEventMetadata() : undefined,
      ...additionalMetadata,
      // Add common ontology concepts if applicable
      ontologyConcepts: CommonOntology.getConceptsForEvent(topic, payload),
    };

    return {
      topic,
      metadata,
      payload,
    };
  }

  /**
   * Publishes a single strongly-typed event to the Kafka topic.
   * Includes retry logic and circuit breaker protection.
   *
   * @param event The CoreEvent object to publish.
   * @param key An optional key for partitioning (e.g., user ID, resource ID).
   * @returns A promise that resolves when the event is successfully sent.
   * @throws An error if the event cannot be sent after retries or if the circuit breaker is open.
   */
  public async publish<T extends EventPayload>(event: CoreEvent<T>, key?: string): Promise<void> {
    if (!this.isConnected) {
      this.logger.error(`Attempted to publish event to disconnected producer. Event: ${event.topic}`);
      throw new Error('EventProducer is not connected.');
    }

    const record: ProducerRecord = {
      topic: event.topic,
      messages: [
        {
          key: key || event.metadata.eventId, // Use eventId as default key for ordering/partitioning
          value: JSON.stringify(event),
          headers: [
            { key: 'eventId', value: event.metadata.eventId },
            { key: 'timestamp', value: event.metadata.timestamp },
            { key: 'source', value: event.metadata.source },
            { key: 'category', value: event.metadata.category },
            { key: 'severity', value: event.metadata.severity },
            { key: 'status', value: event.metadata.status },
            { key: 'correlationId', value: event.metadata.correlationId },
            { key: 'schemaVersion', value: event.metadata.schemaVersion },
            // Add auth context headers if present
            ...(event.metadata.auth
              ? [
                  { key: 'auth_userId', value: event.metadata.auth.userId || '' },
                  { key: 'auth_tenantId', value: event.metadata.auth.tenantId || '' },
                  { key: 'auth_roles', value: JSON.stringify(event.metadata.auth.roles || []) },
                ]
              : []),
          ],
        },
      ],
      acks: this.config.acks,
      timeout: this.config.timeout,
    };

    try {
      await this.circuitBreaker.execute(async () => {
        await this.retryPolicy.execute(async () => {
          this.logger.debug(`Attempting to send event to topic: ${event.topic}`, {
            eventId: event.metadata.eventId,
            correlationId: event.metadata.correlationId,
            key: record.messages[0].key,
          });
          await this.producer.send(record);
          this.logger.info(`Event published successfully to topic: ${event.topic}`, {
            eventId: event.metadata.eventId,
            correlationId: event.metadata.correlationId,
          });
        });
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish event to topic ${event.topic} after retries or due to circuit breaker.`,
        {
          eventId: event.metadata.eventId,
          correlationId: event.metadata.correlationId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }
      );
      this.circuitBreaker.recordFailure(); // Ensure circuit breaker records this failure
      throw new Error(`Event publishing failed for topic ${event.topic}: ${error}`);
    }
  }

  /**
   * Publishes multiple strongly-typed events in a single batch.
   * This method can optionally use Kafka transactions for atomicity.
   *
   * @param events An array of CoreEvent objects to publish.
   * @param transactionId An optional transaction ID for atomic batch publishing.
   * @returns A promise that resolves when all events are successfully sent.
   * @throws An error if any event cannot be sent after retries or if the circuit breaker is open.
   */
  public async publishBatch<T extends EventPayload>(
    events: Array<{ event: CoreEvent<T>; key?: string }>,
    transactionId?: string
  ): Promise<void> {
    if (!this.isConnected) {
      this.logger.error(`Attempted to publish batch to disconnected producer.`);
      throw new Error('EventProducer is not connected.');
    }

    if (events.length === 0) {
      this.logger.warn('Attempted to publish an empty event batch.');
      return;
    }

    const topicRecordsMap = new Map<EventTopic, ProducerRecord['messages']>();

    events.forEach(({ event, key }) => {
      const message = {
        key: key || event.metadata.eventId,
        value: JSON.stringify(event),
        headers: [
          { key: 'eventId', value: event.metadata.eventId },
          { key: 'timestamp', value: event.metadata.timestamp },
          { key: 'source', value: event.metadata.source },
          { key: 'category', value: event.metadata.category },
          { key: 'severity', value: event.metadata.severity },
          { key: 'status', value: event.metadata.status },
          { key: 'correlationId', value: event.metadata.correlationId },
          { key: 'schemaVersion', value: event.metadata.schemaVersion },
          ...(event.metadata.auth
            ? [
                { key: 'auth_userId', value: event.metadata.auth.userId || '' },
                { key: 'auth_tenantId', value: event.metadata.auth.tenantId || '' },
                { key: 'auth_roles', value: JSON.stringify(event.metadata.auth.roles || []) },
              ]
            : []),
        ],
      };

      if (!topicRecordsMap.has(event.topic)) {
        topicRecordsMap.set(event.topic, []);
      }
      topicRecordsMap.get(event.topic)!.push(message);
    });

    const topicMessages: ProducerRecord[] = Array.from(topicRecordsMap.entries()).map(([topic, messages]) => ({
      topic,
      messages,
      acks: this.config.acks,
      timeout: this.config.timeout,
    }));

    try {
      await this.circuitBreaker.execute(async () => {
        await this.retryPolicy.execute(async () => {
          this.logger.debug(`Attempting to send batch of ${events.length} events.`, {
            transactionId,
            topics: Array.from(topicRecordsMap.keys()),
          });

          if (transactionId && this.config.idempotent) {
            const transaction = await this.producer.transaction();
            try {
              await transaction.sendBatch(topicMessages);
              await transaction.commit();
              this.logger.info(`Batch of ${events.length} events committed in transaction: ${transactionId}`);
            } catch (txError) {
              await transaction.abort();
              this.logger.error(`Transaction ${transactionId} aborted due to error: ${txError}`);
              throw txError; // Re-throw to trigger retry policy
            }
          } else {
            await this.producer.sendBatch(topicMessages);
            this.logger.info(`Batch of ${events.length} events published successfully.`);
          }
        });
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish batch of ${events.length} events after retries or due to circuit breaker.`,
        {
          transactionId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }
      );
      this.circuitBreaker.recordFailure();
      throw new Error(`Event batch publishing failed: ${error}`);
    }
  }

  /**
   * Checks the health of the producer.
   * @returns A boolean indicating if the producer is healthy.
   */
  public isHealthy(): boolean {
    return this.isConnected && !this.circuitBreaker.isOpen();
  }

  /**
   * Exposes internal extensibility hooks.
   * This could be used for custom metrics, logging, or pre/post-processing.
   */
  public getExtensibilityHooks() {
    return {
      onBeforeSend: (event: CoreEvent<any>) => {
        // Placeholder for pre-send logic, e.g., metrics, additional validation
        this.logger.debug(`Hook: onBeforeSend for event ${event.metadata.eventId}`);
      },
      onAfterSend: (event: CoreEvent<any>, result: any) => {
        // Placeholder for post-send logic, e.g., success metrics
        this.logger.debug(`Hook: onAfterSend for event ${event.metadata.eventId}`, { result });
      },
      onError: (event: CoreEvent<any>, error: Error) => {
        // Placeholder for error handling hook, e.g., custom alerting
        this.logger.error(`Hook: onError for event ${event.metadata.eventId}: ${error.message}`);
      },
    };
  }
}