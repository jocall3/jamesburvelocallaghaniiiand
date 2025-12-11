```typescript
import {
  ActivityLog,
  Comment,
  CommentFragment,
  Component,
  ComponentSet,
  DevResource,
  Emoji,
  File,
  LinkAccess,
  PaymentInformation,
  PaymentStatus,
  PublishedComponent,
  PublishedComponentSet,
  PublishedStyle,
  Project,
  Reaction,
  StyleType,
  User,
  Version,
  WebhookV2,
  WebhookV2Request,
} from './figma-api-types';

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
}

export type AutomationTrigger =
  | FileUpdateTrigger
  | FileVersionUpdateTrigger
  | FileDeleteTrigger
  | LibraryPublishTrigger
  | FileCommentTrigger
  | DevModeStatusUpdateTrigger;

export interface FileUpdateTrigger {
  type: 'FILE_UPDATE';
  fileKey: string;
}

export interface FileVersionUpdateTrigger {
  type: 'FILE_VERSION_UPDATE';
  fileKey: string;
  versionName?: string;
}

export interface FileDeleteTrigger {
  type: 'FILE_DELETE';
  fileKey: string;
}

export interface LibraryPublishTrigger {
  type: 'LIBRARY_PUBLISH';
  fileKey: string;
  libraryItemType?: LibraryItemType;
}

export type LibraryItemType = 'COMPONENT' | 'STYLE' | 'VARIABLE';

export interface FileCommentTrigger {
  type: 'FILE_COMMENT';
  fileKey: string;
  commentTextIncludes?: string;
  commentAuthor?: string;
}

export interface DevModeStatusUpdateTrigger {
  type: 'DEV_MODE_STATUS_UPDATE';
  fileKey: string;
  nodeId?: string;
  status?: DevModeStatus;
}

export type DevModeStatus = 'NONE' | 'READY_FOR_DEV' | 'COMPLETED';

export type AutomationCondition =
  | FilePropertyCondition
  | CommentPropertyCondition
  | UserPropertyCondition;

export interface FilePropertyCondition {
  type: 'FILE_PROPERTY';
  fileKey: string;
  property: FileProperty;
  operator: Operator;
  value: any;
}

export type FileProperty = 'name' | 'editorType';

export interface CommentPropertyCondition {
  type: 'COMMENT_PROPERTY';
  commentId: string;
  property: CommentProperty;
  operator: Operator;
  value: any;
}

export type CommentProperty = 'message' | 'author';

export interface UserPropertyCondition {
  type: 'USER_PROPERTY';
  userId: string;
  property: UserProperty;
  operator: Operator;
  value: any;
}

export type UserProperty = 'handle';

export type Operator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'GREATER_THAN'
  | 'LESS_THAN';

export type AutomationAction =
  | SendSlackMessageAction
  | CreateJiraIssueAction;

export interface SendSlackMessageAction {
  type: 'SEND_SLACK_MESSAGE';
  message: string;
  channel: string;
}

export interface CreateJiraIssueAction {
  type: 'CREATE_JIRA_ISSUE';
  summary: string;
  description: string;
  projectKey: string;
}
```