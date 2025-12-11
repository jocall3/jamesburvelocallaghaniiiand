export enum AuditSeverity {
    INFO = 'INFO',
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export interface LogEntry {
    timestamp: number;
    level: string;
    source: string;
    message: string;
    metadata?: Record<string, any>;
}

export interface SuspiciousActivityAlert {
    heuristicId: string;
    severity: AuditSeverity;
    description: string;
    rawLog: string;
    timestamp: number;
}

interface HeuristicRule {
    id: string;
    pattern: RegExp;
    severity: AuditSeverity;
    description: string;
    threshold?: number; // Occurrences required to trigger
}

export class LogAnalyzer {
    private rules: HeuristicRule[];

    constructor() {
        this.rules = this.getDefaultRules();
    }

    /**
     * Analyze a batch of log entries and return a list of security alerts.
     */
    public analyzeLogs(logs: LogEntry[]): SuspiciousActivityAlert[] {
        const alerts: SuspiciousActivityAlert[] = [];

        for (const log of logs) {
            const matches = this.checkLogAgainstRules(log);
            alerts.push(...matches);
        }

        return this.prioritizeAlerts(alerts);
    }

    /**
     * Adds a custom heuristic rule to the analyzer engine.
     */
    public addRule(id: string, pattern: RegExp, severity: AuditSeverity, description: string): void {
        this.rules.push({ id, pattern, severity, description });
    }

    private checkLogAgainstRules(log: LogEntry): SuspiciousActivityAlert[] {
        const detected: SuspiciousActivityAlert[] = [];
        const logContent = `${log.source} ${log.message}`;

        for (const rule of this.rules) {
            if (rule.pattern.test(logContent)) {
                detected.push({
                    heuristicId: rule.id,
                    severity: rule.severity,
                    description: rule.description,
                    rawLog: logContent,
                    timestamp: log.timestamp
                });
            }
        }
        return detected;
    }

    private prioritizeAlerts(alerts: SuspiciousActivityAlert[]): SuspiciousActivityAlert[] {
        // Sort alerts by severity weight
        const severityWeight = {
            [AuditSeverity.CRITICAL]: 5,
            [AuditSeverity.HIGH]: 4,
            [AuditSeverity.MEDIUM]: 3,
            [AuditSeverity.LOW]: 2,
            [AuditSeverity.INFO]: 1
        };

        return alerts.sort((a, b) => {
            const weightA = severityWeight[a.severity] || 0;
            const weightB = severityWeight[b.severity] || 0;
            return weightB - weightA; // Descending order
        });
    }

    private getDefaultRules(): HeuristicRule[] {
        return [
            // Authentication & Access Control
            {
                id: 'AUTH_BRUTE_FORCE',
                pattern: /(failed login|authentication failure|bad credentials|invalid password).*(\d{1,3}\.){3}\d{1,3}/i,
                severity: AuditSeverity.HIGH,
                description: 'Repeated authentication failures detected from an IP address.'
            },
            {
                id: 'ROOT_ACCESS',
                pattern: /(sudo|su - root|uid=0)/i,
                severity: AuditSeverity.MEDIUM,
                description: 'Privileged root access command executed.'
            },
            {
                id: 'PERM_DENIED',
                pattern: /(permission denied|access denied|forbidden|403)/i,
                severity: AuditSeverity.LOW,
                description: 'Unauthorized access attempt detected.'
            },

            // Injection Attacks
            {
                id: 'SQL_INJECTION',
                pattern: /(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b.*--|\b1=1\b)/i,
                severity: AuditSeverity.CRITICAL,
                description: 'Potential SQL Injection pattern identified in log message.'
            },
            {
                id: 'CMD_INJECTION',
                pattern: /(;|\|\||&&)\s*(\/bin\/sh|\/bin\/bash|cmd\.exe|powershell)/i,
                severity: AuditSeverity.CRITICAL,
                description: 'Potential OS Command Injection attempt detected.'
            },
            {
                id: 'XSS_ATTACK',
                pattern: /(<script>|javascript:|onerror=|onload=|alert\()/i,
                severity: AuditSeverity.HIGH,
                description: 'Potential Cross-Site Scripting (XSS) payload detected.'
            },

            // System Stability & Integrity
            {
                id: 'CRITICAL_EXCEPTION',
                pattern: /(OutOfMemoryError|StackOverflowError|Segmentation fault|Kernel panic)/i,
                severity: AuditSeverity.CRITICAL,
                description: 'Critical system error indicating potential instability or denial of service.'
            },
            {
                id: 'FILE_TAMPERING',
                pattern: /(chmod 777|chown|attrib \+h)/i,
                severity: AuditSeverity.MEDIUM,
                description: 'Suspicious file permission modification detected.'
            },

            // Network & Data
            {
                id: 'DATA_EXFILTRATION',
                pattern: /(tar -czf|zip -r|scp|ftp|nc -w)/i,
                severity: AuditSeverity.HIGH,
                description: 'Potential data exfiltration command detected.'
            },
            {
                id: 'PORT_SCAN',
                pattern: /(connection refused|connection timed out).*(\d{1,3}\.){3}\d{1,3}/i,
                severity: AuditSeverity.LOW,
                description: 'Network connectivity issues possibly indicating a port scan or DOS.'
            }
        ];
    }

    /**
     * Utility to convert raw string lines into structured LogEntry objects 
     * based on common log formats (e.g., [DATE] [LEVEL] [SOURCE] MESSAGE).
     */
    public parseRawLine(line: string): LogEntry {
        const timestampMatch = line.match(/^\[(.*?)\]/);
        const levelMatch = line.match(/(INFO|WARN|ERROR|DEBUG|TRACE|FATAL)/i);
        
        const timestamp = timestampMatch ? Date.parse(timestampMatch[1]) : Date.now();
        const level = levelMatch ? levelMatch[0].toUpperCase() : 'UNKNOWN';
        
        // Naive extraction of source and message
        let message = line;
        let source = 'SYSTEM';
        
        // Remove parsed timestamp and level to clean message
        if (timestampMatch) message = message.replace(timestampMatch[0], '');
        if (levelMatch) message = message.replace(levelMatch[0], '');

        return {
            timestamp: isNaN(timestamp) ? Date.now() : timestamp,
            level: level,
            source: source,
            message: message.trim()
        };
    }
}