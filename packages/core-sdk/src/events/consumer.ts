/*
 * Copyright 2024 Monitoreo.ai, Inc.
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

import { IEventBusClient, ISubscriptionHandle, Message } from './client';
import { EventEnvelope, AnyEventEnvelope, EventName, TEventEnvelope } from './events';
import { EventSchemaRegistry } from './registry';
import { getLogger, Logger } from '../logging';
import { CoreConfig } from '../config';

/**
 * A handler function for processing a specific event.
 * @template T - The specific event envelope type.
 * @param event - The strongly-typed event envelope.
 * @returns A promise that resolves when processing is complete.
 */
export type EventHandler<T extends AnyEventEnvelope> = (event: T) => Promise<void>;

/**
 * Represents an active subscription to an event topic.
 */
export interface Subscription {
  /**
   * The name of the event being subscribed to.
   */
  eventName: EventName;

  /**
   * The topic on the event bus.
   */
  topic: string;

  /**
   * The consumer group this subscription belongs to.
   */
  groupId: string;

  /**
   * Stops listening for events and cleans up resources for this subscription.
   * @returns A promise that resolves when the subscription is successfully terminated.
   */
  unsubscribe(): Promise<void>;
}

/**
 * Configuration options for the EventConsumer.
 * This configuration exposes the core tension between processing throughput and reliability.
 */
export interface ConsumerOptions {
  /**
   * A unique identifier for the consumer group. All consumers with the same
   * group ID will form a single logical consumer, and messages will be
   * distributed among them.
   */
  groupId: string;

  /**
   * Defines the message processing and acknowledgement strategy.
   * - `at-least-once` (default): High reliability. Acknowledges a message only after the handler
   *   successfully processes it. If the consumer crashes, the message will be redelivered.
   *   This can lead to lower throughput and potential duplicate processing.
   * - `at-most-once`: High throughput. Acknowledges a message as soon as it's received,
   *   before the handler is invoked. If the consumer crashes during processing, the message is lost.
   *   This is faster but offers weaker guarantees.
   */
  processingStrategy?: 'at-least-once' | 'at-most-once';

  /**
   * The maximum number of messages to process concurrently.
   * Increasing this number can improve throughput but may consume more resources and
   * complicate state management if message order is important.
   * @default 1
   */
  maxConcurrentHandlers?: number;

  /**
   * Topic for messages that fail processing after a certain number of retries.
   * If not provided, failing messages may be dropped or endlessly redelivered,
   * depending on the event bus configuration.
   */
  deadLetterTopic?: string;
}

/**
 * A high-level, strongly-typed consumer for the ecosystem's event bus.
 * It abstracts away the complexities of the underlying message broker,
 * providing a simple interface for subscribing to and handling events.
 * It handles message deserialization, validation, and routing to the
 * appropriate handler.
 */
export class EventConsumer {
  private readonly logger: Logger;
  private readonly client: IEventBusClient;
  private readonly schemaRegistry: EventSchemaRegistry;
  private readonly options: Required<ConsumerOptions>;
  private subscriptions: Map<string, Subscription> = new Map();
  private isStarted: boolean = false;

  /**
   * Creates an instance of EventConsumer.
   * @param config - The core SDK configuration.
   * @param client - An instance of an IEventBusClient implementation (e.g., NatsEventBusClient).
   * @param schemaRegistry - The registry containing all known event schemas.
   * @param options - Configuration for this consumer instance.
   */
  constructor(
    config: CoreConfig,
    client: IEventBusClient,
    schemaRegistry: EventSchemaRegistry,
    options: ConsumerOptions,
  ) {
    this.logger = getLogger(`EventConsumer[${options.groupId}]`);
    this.client = client;
    this.schemaRegistry = schemaRegistry;
    this.options = {
      processingStrategy: 'at-least-once',
      maxConcurrentHandlers: 1,
      deadLetterTopic: '',
      ...options,
    };

    if (!this.options.groupId) {
      throw new Error('ConsumerOptions must include a non-empty groupId.');
    }

    this.logger.info('EventConsumer initialized.', { options: this.options });
  }

  /**
   * Connects the underlying event bus client. Must be called before subscribing to any events.
   */
  public async start(): Promise<void> {
    if (this.isStarted) {
      this.logger.warn('Consumer has already been started.');
      return;
    }
    this.logger.info('Starting event consumer...');
    await this.client.connect();
    this.isStarted = true;
    this.logger.info('Event consumer started successfully.');
  }

  /**
   * Gracefully stops the consumer, unsubscribing from all topics and disconnecting the client.
   */
  public async stop(): Promise<void> {
    if (!this.isStarted) {
      this.logger.warn('Consumer is not running.');
      return;
    }
    this.logger.info('Stopping event consumer...');
    const unsubscribePromises = Array.from(this.subscriptions.values()).map(sub =>
      sub.unsubscribe().catch(err => {
        this.logger.error(`Error unsubscribing from ${sub.topic}`, { error: err });
      })
    );
    await Promise.all(unsubscribePromises);
    this.subscriptions.clear();
    await this.client.disconnect();
    this.isStarted = false;
    this.logger.info('Event consumer stopped successfully.');
  }

  /**
   * Subscribes to a specific event type and registers a handler for it.
   * @template E - The name of the event to subscribe to.
   * @param eventName - The name of the event.
   * @param handler - The async function to process the event.
   * @returns A promise that resolves with a Subscription object, which can be used to unsubscribe.
   */
  public async subscribe<E extends EventName>(
    eventName: E,
    handler: EventHandler<TEventEnvelope<E>>,
  ): Promise<Subscription> {
    if (!this.isStarted) {
      throw new Error('Consumer must be started with .start() before subscribing.');
    }

    const eventSchema = this.schemaRegistry.getSchema(eventName);
    if (!eventSchema) {
      const errorMsg = `Schema not found for event: ${eventName}. Ensure it is registered.`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const topic = eventSchema.topic;
    const subscriptionKey = `${topic}:${this.options.groupId}`;
    if (this.subscriptions.has(subscriptionKey)) {
      const errorMsg = `A subscription already exists for topic '${topic}' in group '${this.options.groupId}'.`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const internalHandler = this.createInternalHandler(eventName, handler);

    const subscriptionHandle = await this.client.subscribe(topic, internalHandler, {
      groupId: this.options.groupId,
      maxConcurrent: this.options.maxConcurrentHandlers,
    });

    const subscription: Subscription = {
      eventName,
      topic,
      groupId: this.options.groupId,
      unsubscribe: async () => {
        this.logger.info(`Unsubscribing from topic '${topic}'...`);
        await subscriptionHandle.unsubscribe();
        this.subscriptions.delete(subscriptionKey);
        this.logger.info(`Successfully unsubscribed from topic '${topic}'.`);
      },
    };

    this.subscriptions.set(subscriptionKey, subscription);
    this.logger.info(`Subscribed to event '${eventName}' on topic '${topic}' with group '${this.options.groupId}'.`);
    return subscription;
  }

  /**
   * Creates the internal message handler that performs deserialization, validation,
   * and invokes the user-provided handler, respecting the configured processing strategy.
   */
  private createInternalHandler<E extends EventName>(
    eventName: E,
    handler: EventHandler<TEventEnvelope<E>>,
  ): (msg: Message) => Promise<void> {
    const eventSchema = this.schemaRegistry.getSchema(eventName)!;

    return async (msg: Message) => {
      if (this.options.processingStrategy === 'at-most-once') {
        await msg.ack();
      }

      let event: TEventEnvelope<E>;
      try {
        const rawEvent = JSON.parse(msg.data.toString('utf-8'));
        const validationResult = eventSchema.safeParse(rawEvent);

        if (!validationResult.success) {
          this.logger.error('Event validation failed. Message will be rejected.', {
            eventName,
            topic: eventSchema.topic,
            errors: validationResult.error.flatten(),
            payload: rawEvent,
          });
          await this.handleFailedMessage(msg, 'validation_failed');
          return;
        }
        event = validationResult.data as TEventEnvelope<E>;
      } catch (error) {
        this.logger.error('Failed to parse or validate incoming message. Message will be rejected.', {
          eventName,
          topic: eventSchema.topic,
          error,
        });
        await this.handleFailedMessage(msg, 'parsing_failed');
        return;
      }

      try {
        await handler(event);
        if (this.options.processingStrategy === 'at-least-once') {
          await msg.ack();
        }
      } catch (error) {
        this.logger.error('Event handler threw an exception. Message will be rejected.', {
          eventName,
          eventId: event.metadata.eventId,
          error,
        });
        await this.handleFailedMessage(msg, 'handler_exception');
      }
    };
  }

  /**
   * Handles a message that could not be processed, either by moving it to a
   * dead-letter topic or by negatively acknowledging it.
   */
  private async handleFailedMessage(msg: Message, reason: string): Promise<void> {
    if (this.options.deadLetterTopic) {
      try {
        // Add metadata about the failure before publishing to DLQ
        const originalPayload = JSON.parse(msg.data.toString('utf-8'));
        const deadLetterPayload = {
          original_payload: originalPayload,
          failure_reason: reason,
          failed_at: new Date().toISOString(),
          original_topic: msg.topic,
          consumer_group: this.options.groupId,
        };
        await this.client.publish(
          this.options.deadLetterTopic,
          Buffer.from(JSON.stringify(deadLetterPayload)),
        );
        // Acknowledge the original message so it's removed from the main queue
        await msg.ack();
      } catch (dlqError) {
        this.logger.error('Failed to publish message to dead-letter topic. Message will be nacked.', {
          error: dlqError,
        });
        await msg.nack();
      }
    } else {
      // No DLQ configured, so just negatively acknowledge.
      // The broker will decide whether to redeliver or drop.
      await msg.nack();
    }
  }
}