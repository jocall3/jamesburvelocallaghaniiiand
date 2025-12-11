```typescript
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FigmaNotificationService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Handles a Figma webhook event.
   * @param eventType The type of the Figma webhook event.
   * @param payload The payload of the Figma webhook event.
   */
  handleWebhookEvent(eventType: string, payload: any): void {
    console.log(`Received Figma webhook event: ${eventType}`);
    console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);

    // Example: Emit an event based on the webhook event type
    switch (eventType) {
      case 'FILE_UPDATE':
        this.eventEmitter.emit('figma.file.update', payload);
        break;
      case 'FILE_COMMENT':
        this.eventEmitter.emit('figma.file.comment', payload);
        break;
      // Add more cases to handle other webhook event types
      default:
        console.warn(`Unhandled Figma webhook event type: ${eventType}`);
    }
  }
}
```