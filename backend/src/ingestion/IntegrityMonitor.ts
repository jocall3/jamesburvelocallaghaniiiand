```typescript
import { EventEmitter } from 'events';

interface IntegrityMonitorOptions {
    errorThreshold: number; // Percentage of errors that trigger an alert
    reportingInterval: number; // Interval in milliseconds for reporting metrics
}

interface ConnectionMetrics {
    totalRequests: number;
    errorCount: number;
    errorRate: number; // Percentage of errors
    connectionName: string;
    lastCheck: Date;
}

class IntegrityMonitor extends EventEmitter {
    private options: IntegrityMonitorOptions;
    private connectionMetrics: { [connectionName: string]: ConnectionMetrics } = {};
    private monitoringInterval: NodeJS.Timeout | null = null;

    constructor(options: IntegrityMonitorOptions) {
        super();
        this.options = options;

        if (this.options.reportingInterval <= 0) {
            throw new Error("Reporting interval must be greater than zero.");
        }
    }

    public startMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval); // Clear any existing interval
        }

        this.monitoringInterval = setInterval(() => {
            this.reportMetrics();
        }, this.options.reportingInterval);

        console.log("Integrity monitor started.");
    }

    public stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log("Integrity monitor stopped.");
        }
    }


    public recordRequest(connectionName: string): void {
        if (!this.connectionMetrics[connectionName]) {
            this.initializeConnectionMetrics(connectionName);
        }
        this.connectionMetrics[connectionName].totalRequests++;
    }


    public recordError(connectionName: string): void {
        if (!this.connectionMetrics[connectionName]) {
            this.initializeConnectionMetrics(connectionName);
        }
        this.connectionMetrics[connectionName].errorCount++;
    }


    private initializeConnectionMetrics(connectionName: string): void {
        this.connectionMetrics[connectionName] = {
            totalRequests: 0,
            errorCount: 0,
            errorRate: 0,
            connectionName: connectionName,
            lastCheck: new Date()
        };
    }

    private calculateErrorRate(connectionName: string): void {
        const metrics = this.connectionMetrics[connectionName];
        if (metrics.totalRequests > 0) {
            metrics.errorRate = (metrics.errorCount / metrics.totalRequests) * 100;
        } else {
            metrics.errorRate = 0;
        }
    }

    private reportMetrics(): void {
        for (const connectionName in this.connectionMetrics) {
            if (this.connectionMetrics.hasOwnProperty(connectionName)) {
                this.calculateErrorRate(connectionName);
                const metrics = this.connectionMetrics[connectionName];
                metrics.lastCheck = new Date(); // Update the last check timestamp

                console.log(`Connection: ${connectionName} - Total Requests: ${metrics.totalRequests}, Errors: ${metrics.errorCount}, Error Rate: ${metrics.errorRate.toFixed(2)}%`);


                if (metrics.errorRate > this.options.errorThreshold) {
                    this.emit('errorThresholdExceeded', {
                        connectionName: connectionName,
                        errorRate: metrics.errorRate,
                        threshold: this.options.errorThreshold
                    });
                }
            }
        }
    }

    public getConnectionMetrics(connectionName: string): ConnectionMetrics | undefined {
        return this.connectionMetrics[connectionName];
    }

    public getAllConnectionMetrics(): { [connectionName: string]: ConnectionMetrics } {
        return this.connectionMetrics;
    }
}

export { IntegrityMonitor, IntegrityMonitorOptions, ConnectionMetrics };
```