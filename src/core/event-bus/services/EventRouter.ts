```typescript
import { Logger } from "../../services/Logger";
import { IEventHandler } from "../interfaces/IEventHandler";
import { Event } from "../types/Event";

export class EventRouter {
  private handlers: { [key: string]: IEventHandler[] } = {};

  constructor(private readonly logger: Logger) {}

  public register(eventTypes: string[], handler: IEventHandler): void {
    eventTypes.forEach((eventType) => {
      if (!this.handlers[eventType]) {
        this.handlers[eventType] = [];
      }
      this.handlers[eventType].push(handler);
      this.logger.debug(`Registered handler ${handler.constructor.name} for event type ${eventType}`);
    });
  }

  public async route(event: Event): Promise<void> {
    const eventType = event.type;

    if (!this.handlers[eventType]) {
      this.logger.warn(`No handler registered for event type ${eventType}`);
      return;
    }

    const handlers = this.handlers[eventType];

    await Promise.all(
      handlers.map(async (handler) => {
        try {
          this.logger.debug(`Routing event ${event.id} to handler ${handler.constructor.name}`);
          await handler.handle(event);
          this.logger.debug(`Successfully processed event ${event.id} by handler ${handler.constructor.name}`);
        } catch (error: any) {
          this.logger.error(`Error handling event ${event.id} by handler ${handler.constructor.name}: ${error.message}`, error);
        }
      })
    );
  }
}
```