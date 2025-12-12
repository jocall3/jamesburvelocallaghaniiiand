import { v4 as uuidv4 } from 'uuid';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  actor: string; // User or system initiating the action
  action: string; // Description of the action performed
  resourceType: string; // Type of resource affected (e.g., 'User', 'Account', 'Policy')
  resourceId: string; // ID of the resource affected
  details: Record<string, any>; // Additional context or data related to the event
  outcome: 'success' | 'failure'; // Outcome of the action
  reason?: string; // Optional reason for failure
}

export interface AuditLogger {
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void>;
}

export class InMemoryAuditLogger implements AuditLogger {
  private logs: AuditLogEntry[] = [];

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      ...entry,
    };
    this.logs.push(logEntry);
    // In a real implementation, this would write to an immutable ledger.
    console.debug('Audit Log Entry:', logEntry); // Simulate writing to ledger
  }

  getLogs(): AuditLogEntry[] {
    return [...this.logs]; // Return a copy to prevent modification
  }
}

// Example usage (can be removed in production)
async function exampleUsage() {
  const logger = new InMemoryAuditLogger();

  await logger.log({
    actor: 'user123',
    action: 'UpdateUserProfile',
    resourceType: 'User',
    resourceId: 'user123',
    details: {
      newEmail: 'newemail@example.com',
      oldEmail: 'oldemail@example.com',
    },
    outcome: 'success',
  });

  await logger.log({
    actor: 'system_process',
    action: 'FailedLoginAttempt',
    resourceType: 'Authentication',
    resourceId: 'user456',
    details: {
      ipAddress: '192.168.1.1',
    },
    outcome: 'failure',
    reason: 'Invalid password',
  });

  const logs = logger.getLogs();
  console.log('All Logs:', logs);
}

//exampleUsage(); // Uncomment to run the example