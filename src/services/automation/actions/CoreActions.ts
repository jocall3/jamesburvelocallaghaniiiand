```typescript
import { Action, ActionType, IActionHandler } from '../types';

export const enum CoreActionType {
  SEND_EMAIL = 'SEND_EMAIL',
  POST_TO_SLACK = 'POST_TO_SLACK',
  // Add other core actions here
}

export interface SendEmailAction extends Action {
  type: CoreActionType.SEND_EMAIL;
  payload: {
    to: string;
    subject: string;
    body: string;
  };
}

export interface PostToSlackAction extends Action {
  type: CoreActionType.POST_TO_SLACK;
  payload: {
    channel: string;
    message: string;
  };
}

// Define a type that encompasses all core actions
export type CoreAction = SendEmailAction | PostToSlackAction;

// Define action handlers.  Each core action will have an associated handler.
const sendEmailHandler: IActionHandler<SendEmailAction> = {
  type: CoreActionType.SEND_EMAIL,
  handle: async (action: SendEmailAction) => {
    // Implement email sending logic here
    console.log('Sending email:', action.payload);
    // Simulate success
    return { success: true };
  },
};

const postToSlackHandler: IActionHandler<PostToSlackAction> = {
  type: CoreActionType.POST_TO_SLACK,
  handle: async (action: PostToSlackAction) => {
    // Implement Slack posting logic here
    console.log('Posting to Slack:', action.payload);
    // Simulate success
    return { success: true };
  },
};


// Create a map of action handlers to easily look them up
const actionHandlers: { [key in CoreActionType]?: IActionHandler<CoreAction & { type: key }> } = {
  [CoreActionType.SEND_EMAIL]: sendEmailHandler,
  [CoreActionType.POST_TO_SLACK]: postToSlackHandler,
  // Add other core action handlers here
};

// Function to execute an action.
export async function executeCoreAction(action: CoreAction): Promise<{ success: boolean; [key: string]: any }> {
  const handler = actionHandlers[action.type];

  if (!handler) {
    console.error(`No handler found for action type: ${action.type}`);
    return { success: false, error: `Unknown action type: ${action.type}` };
  }

  try {
    return await handler.handle(action as any); // Cast to any since we are certain the type matches
  } catch (error: any) {
    console.error(`Error handling action ${action.type}:`, error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
```