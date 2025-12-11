```typescript
import { SpeechToTextResult } from "./SpeechToTextService";

export interface Command {
  action: string;
  payload?: any;
}

export class CommandExecutor {
  private readonly commandMap: { [key: string]: (payload?: any) => Promise<void> } = {
    "open": async (payload?: string) => {
      if (payload) {
        console.log(`Opening: ${payload}`);
        // Implement actual opening logic here
        // For example: window.open(payload, "_blank");
      } else {
        console.warn("Open command requires a target.");
      }
    },
    "close": async (payload?: string) => {
      if (payload) {
        console.log(`Closing: ${payload}`);
        //Implement closing logic
      } else {
        console.warn("Close command requires a target.");
      }
    },
    "turn on": async (payload?: string) => {
      if (payload) {
        console.log(`Turning on: ${payload}`);
      } else {
        console.warn("Turn on command requires a target");
      }
    },
    "turn off": async (payload?: string) => {
        if (payload) {
          console.log(`Turning off: ${payload}`);
        } else {
          console.warn("Turn off command requires a target.");
        }
    },
    "set volume": async (payload?: number) => {
        if (typeof payload === "number") {
          console.log(`Setting volume to: ${payload}`);
        } else {
            console.warn("Set volume command requires a numeric value.");
        }
    },
    "increase volume": async () => {
        console.log("Increasing volume");
    },
    "decrease volume": async () => {
        console.log("Decreasing volume");
    },
    // Add more commands here
  };

  public async executeCommand(command: Command): Promise<void> {
    const action = command.action.toLowerCase();
    const handler = this.commandMap[action];

    if (handler) {
      try {
        await handler(command.payload);
      } catch (error) {
        console.error(`Error executing command "${action}":`, error);
        // Optionally, provide user feedback about the error
      }
    } else {
      console.warn(`No handler found for command: ${action}`);
      // Optionally, provide user feedback about the unknown command.
    }
  }

  public async processSpeechResult(result: SpeechToTextResult): Promise<void> {
    if (!result.isFinal) {
      // Ignore intermediate results
      return;
    }

    if (result.text) {
      const command = this.parseCommand(result.text);
        if(command){
            await this.executeCommand(command);
        } else {
            console.warn(`Could not parse command from: ${result.text}`);
        }

    }
  }

  private parseCommand(text: string): Command | null {
    // Simple command parsing - extend as needed
    const lowerCaseText = text.toLowerCase();
    for (const action in this.commandMap) {
      if (lowerCaseText.includes(action)) {
        const payload = this.extractPayload(lowerCaseText, action);
        return { action: action, payload: payload };
      }
    }
    return null;
  }

  private extractPayload(text: string, action: string): any {
        const actionIndex = text.indexOf(action);
        if (actionIndex === -1) {
            return undefined; // Or null, depending on your needs
        }
        const payloadString = text.substring(actionIndex + action.length).trim();

        // Attempt to parse as a number, if possible
        const payloadAsNumber = Number(payloadString);
        if (!isNaN(payloadAsNumber)) {
            return payloadAsNumber;
        }

        // Otherwise, return as a string
        return payloadString;
  }
}
```