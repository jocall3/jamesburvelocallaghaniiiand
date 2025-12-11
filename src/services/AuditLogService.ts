```typescript
import { Application } from '../models/Application';
import { AuditLogEntry, AuditLogAction, AuditLogCategory } from '../models/AuditLogEntry';
import { getStorage } from '../utils/storage';

interface IAuditLogService {
    logApplicationChange(
        action: AuditLogAction,
        applicationBefore?: Partial<Application>,
        applicationAfter?: Partial<Application>
    ): Promise<void>;
}

class AuditLogService implements IAuditLogService {

    private async saveLogEntry(entry: AuditLogEntry): Promise<void> {
        try {
            const existingLogs = await getStorage<AuditLogEntry[]>('auditLogs') || [];
            existingLogs.push(entry);
            await getStorage('auditLogs', existingLogs);
        } catch (error) {
            console.error('Failed to save audit log entry:', error);
        }
    }

    async logApplicationChange(
        action: AuditLogAction,
        applicationBefore?: Partial<Application>,
        applicationAfter?: Partial<Application>
    ): Promise<void> {
        const entry: AuditLogEntry = {
            timestamp: new Date().toISOString(),
            category: AuditLogCategory.Application,
            action: action,
            details: {},
        };

        if (applicationBefore && applicationAfter) {
          const changes = this.getChanges(applicationBefore, applicationAfter);
          entry.details = { ...changes };
        } else if (applicationAfter) {
          entry.details = { ...applicationAfter };
          entry.action = AuditLogAction.Create;
        }  else if (applicationBefore) {
            entry.details = { ...applicationBefore };
            entry.action = AuditLogAction.Delete;
        }

        await this.saveLogEntry(entry);
    }

    private getChanges(
      before: Partial<Application>,
      after: Partial<Application>
    ): object {
      const changes: any = {};
      for (const key in after) {
        if (before.hasOwnProperty(key)) {
          if (after[key] !== before[key]) {
            changes[key] = {
              from: before[key],
              to: after[key],
            };
          }
        } else {
          changes[key] = {
            from: undefined,
            to: after[key],
          };
        }
      }

      for (const key in before) {
        if(!after.hasOwnProperty(key)) {
            changes[key] = {
                from: before[key],
                to: undefined
            }
        }
      }

      return changes;
    }
}

export default AuditLogService;
```