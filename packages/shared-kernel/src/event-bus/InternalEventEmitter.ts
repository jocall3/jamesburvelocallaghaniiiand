/**
 * @file A robust, typed event emitter for cross-service communication within the same process.
 * @purpose Provides a type-safe mechanism for different parts of the application to communicate
 *          asynchronously without being directly coupled. This is a foundational piece of the
 *          shared kernel for implementing patterns like Domain Events or CQRS within a monolith
 *          or a single process.
 */

/**
 * A generic type representing the mapping from event names to their payload types.
 * @example
 * ```ts
 * interface AppEvents extends EventMap {
 *   'user:created': { userId: string; email: string };
 *   'order:placed': { orderId: string; amount: number };
 * }
 * ```
 */
export type EventMap = Record<string | symbol, any>;

/**
 * A utility type to extract the valid event keys (names) from an EventMap.
 */
export type EventKey<T extends EventMap> = string & keyof T;

/**
 * A generic type for an event handler (listener) function.
 * @template T The type of the event payload.
 */
export type EventHandler<T = any> = (payload: T) => void | Promise<void>;

/**
 * An interface defining the core functionality of a typed event emitter.
 */
export interface IInternalEventEmitter<T extends EventMap> {
  /**
   * Registers an event listener for a given event.
   * @param event The name of the event to listen for.
   * @param listener The callback function to execute when the event is emitted.
   * @returns A function to unsubscribe the listener.
   */
  on<K extends EventKey<T>>(event: K, listener: EventHandler<T[K]>): () => void;

  /**
   * Registers a one-time event listener for a given event.
   * The listener is invoked only the next time the event is emitted, after which it is removed.
   * @param event The name of the event to listen for.
   * @param listener The callback function to execute.
   * @returns A function to unsubscribe the listener before it has been invoked.
   */
  once<K extends EventKey<T>>(event: K, listener: EventHandler<T[K]>): () => void;

  /**
   * Removes a specific event listener for a given event.
   * @param event The name of the event.
   * @param listener The listener function to remove.
   */
  off<K extends EventKey<T>>(event: K, listener: EventHandler<T[K]>): void;

  /**
   * Emits an event, calling all registered listeners for that event with the provided payload.
   * Listeners are called synchronously in the order they were registered.
   * If a listener throws an error, it will be caught and logged, but it will not stop
   * other listeners from being executed.
   * @param event The name of the event to emit.
   * @param payload The data to pass to the event listeners.
   */
  emit<K extends EventKey<T>>(event: K, payload: T[K]): void;

  /**
   * Removes all listeners for a specific event, or all listeners for all events if no event is specified.
   * @param event The optional name of the event to remove all listeners for.
   */
  removeAllListeners<K extends EventKey<T>>(event?: K): void;

  /**
   * Returns the number of listeners for a given event.
   * @param event The name of the event.
   * @returns The number of listeners for the event.
   */
  listenerCount<K extends EventKey<T>>(event: K): number;
}

/**
 * A robust, typed event emitter for in-process communication.
 * It provides a type-safe way to publish and subscribe to events within the application.
 *
 * @template T An `EventMap` that defines the available events and their payload types.
 */
export class InternalEventEmitter<T extends EventMap> implements IInternalEventEmitter<T> {
  private listeners: Map<EventKey<T>, Set<EventHandler<any>>> = new Map();

  /**
   * Registers an event listener for a given event.
   * @param event The name of the event to listen for.
   * @param listener The callback function to execute when the event is emitted.
   * @returns A function to unsubscribe the listener.
   */
  public on<K extends EventKey<T>>(event: K, listener: EventHandler<T[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return an unsubscribe function for easy cleanup
    return () => this.off(event, listener);
  }

  /**
   * Registers a one-time event listener for a given event.
   * The listener is invoked only the next time the event is emitted, after which it is removed.
   * @param event The name of the event to listen for.
   * @param listener The callback function to execute.
   * @returns A function to unsubscribe the listener before it has been invoked.
   */
  public once<K extends EventKey<T>>(event: K, listener: EventHandler<T[K]>): () => void {
    const onceWrapper: EventHandler<T[K]> = (payload) => {
      this.off(event, onceWrapper);
      return listener(payload);
    };

    return this.on(event, onceWrapper);
  }

  /**
   * Removes a specific event listener for a given event.
   * @param event The name of the event.
   * @param listener The listener function to remove.
   */
  public off<K extends EventKey<T>>(event: K, listener: EventHandler<T[K]>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emits an event, calling all registered listeners for that event with the provided payload.
   * Listeners are called synchronously in the order they were registered.
   * If a listener returns a Promise, this method does NOT wait for it to resolve (fire-and-forget).
   * Errors thrown by listeners are caught and logged to the console to prevent them from
   * halting the execution of other listeners.
   *
   * @param event The name of the event to emit.
   * @param payload The data to pass to the event listeners.
   */
  public emit<K extends EventKey<T>>(event: K, payload: T[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // Create a copy of the set to prevent issues if a listener
      // modifies the original set (e.g., by calling off() on itself).
      const listenersToCall = new Set(eventListeners);
      listenersToCall.forEach((listener) => {
        try {
          // We don't await the result, allowing for fire-and-forget async handlers.
          // This ensures the emit call is non-blocking.
          const result = listener(payload);
          if (result instanceof Promise) {
            result.catch(error => {
              console.error(`[InternalEventEmitter] Error in async listener for event "${String(event)}":`, error);
            });
          }
        } catch (error) {
          console.error(`[InternalEventEmitter] Error in sync listener for event "${String(event)}":`, error);
        }
      });
    }
  }

  /**
   * Removes all listeners for a specific event, or all listeners for all events if no event is specified.
   * @param event The optional name of the event to remove all listeners for.
   */
  public removeAllListeners<K extends EventKey<T>>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Returns the number of listeners for a given event.
   * @param event The name of the event.
   * @returns The number of listeners for the event.
   */
  public listenerCount<K extends EventKey<T>>(event: K): number {
    return this.listeners.get(event)?.size || 0;
  }
}

/**
 * A singleton instance of the InternalEventEmitter for global, in-process events.
 * This can be used for application-wide events, but creating specific instances
 * for bounded contexts is often a better practice for separation of concerns.
 *
 * @example
 * ```ts
 * // Define your global events
 * interface GlobalEvents extends EventMap {
 *   'app:started': { startTime: Date };
 *   'app:shutdown': { reason: string };
 * }
 *
 * // Use the singleton instance with your defined types
 * const globalBus = internalEventEmitter as InternalEventEmitter<GlobalEvents>;
 *
 * globalBus.on('app:started', ({ startTime }) => {
 *   console.log(`Application started at ${startTime.toISOString()}`);
 * });
 *
 * globalBus.emit('app:started', { startTime: new Date() });
 * ```
 */
export const internalEventEmitter = new InternalEventEmitter<EventMap>();