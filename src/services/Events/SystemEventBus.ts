```ts
/**
 * SystemEventBus: A simple publish/subscribe event bus for decoupling components.
 *
 * This class provides a mechanism for components to publish events and other
 * components to subscribe to those events. It's particularly useful for
 * communication between decoupled parts of the system or for plugins to
 * interact with the core application.
 */
class SystemEventBus {
  private subscriptions: { [key: string]: ((payload: any) => void)[] } = {};

  /**
   * Subscribe to an event.
   * @param event The name of the event to subscribe to.
   * @param callback The function to call when the event is published.
   * @returns A function to unsubscribe from the event.
   */
  subscribe(event: string, callback: (payload: any) => void): () => void {
    if (!this.subscriptions[event]) {
      this.subscriptions[event] = [];
    }

    this.subscriptions[event].push(callback);

    return () => {
      this.subscriptions[event] = this.subscriptions[event].filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Publish an event.
   * @param event The name of the event to publish.
   * @param payload The data to pass to the subscribers.
   */
  publish(event: string, payload?: any): void {
    if (!this.subscriptions[event]) {
      return;
    }

    this.subscriptions[event].forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Clear all subscriptions for a given event.
   * @param event The name of the event to clear subscriptions for.
   */
  clear(event: string): void {
    delete this.subscriptions[event];
  }

  /**
   * Clear all subscriptions for all events.
   */
  clearAll(): void {
    this.subscriptions = {};
  }
}

// Export a singleton instance of the event bus for global use.
export const systemEventBus = new SystemEventBus();
```