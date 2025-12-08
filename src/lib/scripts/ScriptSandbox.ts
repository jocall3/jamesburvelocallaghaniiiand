export type LogLevel = 'log' | 'info' | 'warn' | 'error';

export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: number;
}

export interface SandboxContext {
    [key: string]: any;
}

export interface SandboxResult {
    success: boolean;
    context: SandboxContext;
    logs: LogEntry[];
    error?: string;
    executionTimeMs: number;
}

export interface SandboxOptions {
    timeoutMs?: number;
}

/**
 * A secure sandbox environment for running user-defined pre/post scripts 
 * without compromising the main application.
 * 
 * Uses Web Workers to isolate execution off the main thread.
 */
export class ScriptSandbox {
    private worker: Worker | null = null;
    private pendingExecutions = new Map<string, {
        resolve: (result: SandboxResult) => void;
        timer: number | NodeJS.Timeout;
    }>();

    constructor() {
        this.initializeWorker();
    }

    /**
     * Initializes the Web Worker with the sandbox logic.
     * The worker code is inlined to ensure the class is self-contained.
     */
    private initializeWorker(): void {
        if (typeof window === 'undefined') return;

        const workerScript = `
            self.onmessage = async (e) => {
                const { id, script, context } = e.data;
                const logs = [];
                const start = performance.now();

                // Capture console logs
                const log = (level) => (...args) => {
                    const message = args.map(arg => {
                        try {
                            if (arg instanceof Error) {
                                return arg.toString();
                            }
                            if (typeof arg === 'object') {
                                return JSON.stringify(arg, null, 2);
                            }
                            return String(arg);
                        } catch (err) {
                            return '[Circular or Non-serializable]';
                        }
                    }).join(' ');
                    logs.push({ level, message, timestamp: Date.now() });
                };

                const safeConsole = {
                    log: log('log'),
                    info: log('info'),
                    warn: log('warn'),
                    error: log('error')
                };

                try {
                    // Create a function from the script string.
                    // We wrap it in an async IIFE to support 'await' at the top level of the script.
                    // The script has access to 'context' and 'console'.
                    // 'context' is mutable and returned back to the main thread.
                    
                    const executor = new Function('context', 'console', \`
                        return (async () => {
                            "use strict";
                            try {
                                \${script}
                            } catch (e) {
                                throw e;
                            }
                            return context;
                        })();
                    \`);

                    const modifiedContext = await executor(context, safeConsole);

                    self.postMessage({
                        id,
                        success: true,
                        context: modifiedContext,
                        logs,
                        executionTimeMs: performance.now() - start
                    });
                } catch (err) {
                    self.postMessage({
                        id,
                        success: false,
                        error: err instanceof Error ? err.message : String(err),
                        logs,
                        executionTimeMs: performance.now() - start
                    });
                }
            };
        `;

        const blob = new Blob([workerScript], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        this.worker = new Worker(url);
        
        this.worker.onmessage = (e: MessageEvent) => {
            const { id, success, context, logs, error, executionTimeMs } = e.data;
            const pending = this.pendingExecutions.get(id);
            
            if (pending) {
                clearTimeout(pending.timer);
                this.pendingExecutions.delete(id);
                pending.resolve({
                    success,
                    context: success ? context : {},
                    logs,
                    error,
                    executionTimeMs
                });
            }
        };

        this.worker.onerror = (e) => {
            console.error('ScriptSandbox Worker Error:', e);
        };
    }

    /**
     * Executes a script in the sandbox.
     * 
     * @param script - The JavaScript code to execute.
     * @param context - The context object exposed to the script (e.g., variables, api helpers).
     * @param options - Execution options like timeout.
     * @returns A promise resolving to the execution result including modified context and logs.
     */
    public async execute(
        script: string, 
        context: SandboxContext = {}, 
        options: SandboxOptions = {}
    ): Promise<SandboxResult> {
        if (!this.worker) {
            this.initializeWorker();
        }

        if (!this.worker) {
            return {
                success: false,
                context,
                logs: [],
                error: 'Worker initialization failed. Environment may not support Web Workers.',
                executionTimeMs: 0
            };
        }

        const id = crypto.randomUUID();
        const timeoutMs = options.timeoutMs ?? 5000; // Default 5 seconds

        return new Promise<SandboxResult>((resolve) => {
            const timer = setTimeout(() => {
                if (this.pendingExecutions.has(id)) {
                    this.pendingExecutions.delete(id);
                    this.terminate(); // Terminate worker to stop infinite loops
                    this.initializeWorker(); // Re-init for next use
                    
                    resolve({
                        success: false,
                        context,
                        logs: [{ level: 'error', message: 'Script execution timed out.', timestamp: Date.now() }],
                        error: 'Execution timed out',
                        executionTimeMs: timeoutMs
                    });
                }
            }, timeoutMs);

            this.pendingExecutions.set(id, { resolve, timer });

            // Send data to worker. Structured clone algorithm handles deep copying of data.
            this.worker!.postMessage({
                id,
                script,
                context
            });
        });
    }

    /**
     * Terminates the worker and cleans up pending requests.
     */
    public terminate(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        
        for (const [id, pending] of this.pendingExecutions) {
            clearTimeout(pending.timer);
            pending.resolve({
                success: false,
                context: {},
                logs: [],
                error: 'Sandbox terminated unexpectedly',
                executionTimeMs: 0
            });
        }
        this.pendingExecutions.clear();
    }

    /**
     * Helper to dispose of the sandbox when the component/service is destroyed.
     */
    public dispose(): void {
        this.terminate();
    }
}