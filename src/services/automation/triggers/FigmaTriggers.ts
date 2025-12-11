```typescript
import { WebhookV2Event } from '../../types/figma';

export const FigmaTriggers: { [key in WebhookV2Event]?: string } = {
  FILE_UPDATE: 'FILE_UPDATE',
  FILE_VERSION_UPDATE: 'FILE_VERSION_UPDATE',
  FILE_DELETE: 'FILE_DELETE',
  LIBRARY_PUBLISH: 'LIBRARY_PUBLISH',
  FILE_COMMENT: 'FILE_COMMENT',
  DEV_MODE_STATUS_UPDATE: 'DEV_MODE_STATUS_UPDATE',
};
```