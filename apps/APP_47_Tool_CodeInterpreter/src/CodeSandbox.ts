// Copyright (c) 2024 ADP, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { CoreSDK, Logger, ConfigManager, AppError } from '@adp/core';
import Docker from 'dockerode';
import { Writable, Readable } from 'stream';

/**
 * Represents the result of a code execution within the sandbox.
 */
export interface ExecutionResult {
    /** Standard output from the executed code. */
    stdout: string;
    /** Standard error from the executed code. */
    stderr: string;
    /** The exit code of the process. 0 typically means success. */
    exitCode: number;
    /** Total execution time in milliseconds. */
    durationMs: number;
    /** Framework-level error, e.g., timeout or container creation failure. */
    error?: string;
    /** Indicates if stdout or stderr was truncated due to size limits. */
    truncated: {
        stdout: boolean;
        stderr: boolean;
    };
}

/**
 * Configuration options for a single code execution.
 * Reflects the tension between performance/capability and safety/cost.
 */
export interface ExecutionOptions {
    /** Maximum execution time in milliseconds. Defaults to 5000. */
    timeoutMs?: number;
    /** Memory limit for the container in megabytes. Defaults to 128. */
    memoryLimitMb?: number;
    /**
     * Relative CPU shares. Corresponds to Docker's --cpu-shares.
     * A higher number gives the container a higher proportion of CPU time.
     * Defaults to 1024 (Docker's default).
     */
    cpuShares?: number;
    /**
     * Network policy for the container.
     * 'none': No network access (default, safest).
     * 'host': Inherit host's network stack (less secure).
     * 'bridge': Connect to the default bridge network.
     */
    networkMode?: 'none' | 'host' | 'bridge';
    /**
     * Maximum size of stdout/stderr to capture in bytes.
     * Prevents memory exhaustion from verbose code. Defaults to 1MB.
     */
    maxOutputBytes?: number;
}

/**
 * Supported languages for code interpretation.
 */
export enum SupportedLanguage {
    PYTHON = 'python',
    JAVASCRIPT = 'javascript',
    // Extensibility hook: Add more languages here, e.g., 'typescript', 'bash'
}

/**
 * Defines the runtime environment for a supported language.
 */
interface LanguageRuntimeConfig {
    /** The Docker image to use for this language. */
    image: string;
    /**
     * A function that returns the command and arguments to execute the code.
     * The code is passed as a base64 encoded string to prevent shell injection.
     * @param encodedCode - The base64 encoded user code.
     * @returns An array of strings representing the command and its arguments.
     */
    command: (encodedCode: string) => string[];
}

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MEMORY_LIMIT_MB = 128;
const DEFAULT_CPU_SHARES = 1024; // Docker's default
const DEFAULT_MAX_OUTPUT_BYTES = 1 * 1024 * 1024; // 1 MB

/**
 * Provides a secure, containerized sandbox for executing untrusted code.
 * This class leverages a container runtime (like Docker) to achieve strong
 * isolation between the executed code and the host system.
 *
 * The core architectural tension is Speed vs. Safety. Using containers provides
 * high safety but introduces latency. The `ExecutionOptions` allow callers to
 * tune this trade-off per-request.
 */
export class CodeSandbox {
    private docker: Docker;
    private logger: Logger;
    private config: ConfigManager;
    private languageRuntimes: Map<SupportedLanguage, LanguageRuntimeConfig>;
    private isInitialized: boolean = false;

    /**
     * Creates an instance of the CodeSandbox.
     * @param core - The shared CoreSDK instance for logging and configuration.
     */
    constructor(core: CoreSDK) {
        this.logger = core.getLogger('APP_47_CodeSandbox');
        this.config = core.getConfigManager();

        try {
            this.docker = new Docker(); // Assumes Docker socket is available at default location
            this.logger.info('Docker client initialized successfully.');
        } catch (error) {
            this.logger.error('Failed to initialize Docker client. Is Docker running?', { error });
            throw new AppError('DOCKER_UNAVAILABLE', 'CodeSandbox requires a running Docker daemon.');
        }

        this.languageRuntimes = new Map();
        this.loadRuntimeConfigs();
    }

    /**
     * Loads language runtime configurations from the application config.
     * This allows for easy updates and additions of supported languages without code changes.
     */
    private loadRuntimeConfigs(): void {
        const pythonImage = this.config.get<string>('interpreter.python.image', 'python:3.11-slim');
        this.languageRuntimes.set(SupportedLanguage.PYTHON, {
            image: pythonImage,
            command: (encodedCode: string) => [
                'python',
                '-c',
                `import base64, sys; exec(base64.b64decode(sys.argv[1]))`,
                encodedCode,
            ],
        });

        const jsImage = this.config.get<string>('interpreter.javascript.image', 'node:20-alpine');
        this.languageRuntimes.set(SupportedLanguage.JAVASCRIPT, {
            image: jsImage,
            command: (encodedCode: string) => [
                'node',
                '-e',
                `eval(Buffer.from(process.argv[1], 'base64').toString())`,
                encodedCode,
            ],
        });

        this.logger.info('Loaded language runtime configurations.', {
            supportedLanguages: Array.from(this.languageRuntimes.keys()),
        });
    }

    /**
     * Pulls the required Docker images if they are not present locally.
     * This should be called during application startup to avoid cold-start delays.
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            this.logger.info('CodeSandbox already initialized.');
            return;
        }

        this.logger.info('Initializing CodeSandbox: pulling required Docker images...');
        const pullPromises: Promise<void>[] = [];

        for (const [lang, config] of this.languageRuntimes.entries()) {
            pullPromises.push(this.pullImage(config.image, lang));
        }

        await Promise.all(pullPromises);
        this.isInitialized = true;
        this.logger.info('CodeSandbox initialization complete. All images are ready.');
    }

    private async pullImage(imageName: string, language: SupportedLanguage): Promise<void> {
        this.logger.info(`Checking for ${language} image: ${imageName}`);
        try {
            const image = this.docker.getImage(imageName);
            await image.inspect();
            this.logger.info(`Image ${imageName} already exists locally.`);
        } catch (error: any) {
            if (error.statusCode === 404) {
                this.logger.info(`Image ${imageName} not found locally. Pulling from registry...`);
                return new Promise((resolve, reject) => {
                    this.docker.pull(imageName, (err: any, stream: any) => {
                        if (err) {
                            this.logger.error(`Failed to pull image ${imageName}`, { error: err });
                            return reject(new AppError('IMAGE_PULL_FAILED', `Could not pull image ${imageName}`));
                        }
                        this.docker.modem.followProgress(stream, (finErr: any, output: any) => {
                            if (finErr) {
                                this.logger.error(`Error during image pull for ${imageName}`, { error: finErr });
                                return reject(new AppError('IMAGE_PULL_FAILED', `Error during image pull for ${imageName}`));
                            }
                            this.logger.info(`Successfully pulled image ${imageName}.`);
                            resolve();
                        });
                    });
                });
            } else {
                this.logger.error(`Failed to inspect image ${imageName}`, { error });
                throw new AppError('DOCKER_ERROR', `Failed to inspect image ${imageName}`);
            }
        }
    }

    /**
     * Executes a snippet of code in a secure, isolated sandbox.
     *
     * @param language - The programming language of the code.
     * @param code - The source code to execute.
     * @param options - Configuration for the execution environment.
     * @returns A promise that resolves with the execution result.
     */
    public async execute(
        language: SupportedLanguage,
        code: string,
        options: ExecutionOptions = {}
    ): Promise<ExecutionResult> {
        const startTime = Date.now();

        const runtimeConfig = this.languageRuntimes.get(language);
        if (!runtimeConfig) {
            throw new AppError('UNSUPPORTED_LANGUAGE', `Language '${language}' is not supported.`);
        }

        const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        const memoryLimit = (options.memoryLimitMb ?? DEFAULT_MEMORY_LIMIT_MB) * 1024 * 1024;
        const cpuShares = options.cpuShares ?? DEFAULT_CPU_SHARES;
        const networkMode = options.networkMode ?? 'none';
        const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;

        const encodedCode = Buffer.from(code).toString('base64');
        const cmd = runtimeConfig.command(encodedCode);

        let container: Docker.Container | null = null;

        try {
            const containerOptions: Docker.ContainerCreateOptions = {
                Image: runtimeConfig.image,
                Cmd: cmd,
                Tty: false,
                AttachStdout: true,
                AttachStderr: true,
                HostConfig: {
                    AutoRemove: true,
                    Memory: memoryLimit,
                    CpuShares: cpuShares,
                    NetworkMode: networkMode,
                    // Security hardening
                    ReadonlyRootfs: true,
                    CapDrop: ['ALL'],
                    PidsLimit: 100, // Limit number of processes
                },
            };

            container = await this.docker.createContainer(containerOptions);

            const executionPromise = this.runContainer(container, maxOutputBytes);

            const timeoutPromise = new Promise<ExecutionResult>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), timeout)
            );

            const result = await Promise.race([executionPromise, timeoutPromise]);
            
            return {
                ...result,
                durationMs: Date.now() - startTime,
            };

        } catch (error: any) {
            this.logger.error('Code execution failed.', { language, error: error.message });
            if (container) {
                await this.cleanupContainer(container);
            }
            
            const isTimeout = error.message === 'Timeout';
            return {
                stdout: '',
                stderr: isTimeout ? `Execution timed out after ${timeout}ms.` : `Sandbox execution error: ${error.message}`,
                exitCode: -1,
                durationMs: Date.now() - startTime,
                error: isTimeout ? 'TIMEOUT' : 'SANDBOX_ERROR',
                truncated: { stdout: false, stderr: false },
            };
        }
    }

    private async runContainer(container: Docker.Container, maxOutputBytes: number): Promise<Omit<ExecutionResult, 'durationMs'>> {
        const stream = await container.attach({ stream: true, stdout: true, stderr: true });

        const { stdout, stderr, truncated } = await this.demuxAndCaptureStream(stream, maxOutputBytes);

        await container.start();
        const [result] = await container.wait();

        return {
            stdout,
            stderr,
            exitCode: result.StatusCode,
            truncated,
        };
    }

    /**
     * Demultiplexes the Docker stream into separate stdout and stderr strings.
     * Also enforces the max output size limit.
     */
    private demuxAndCaptureStream(
        stream: NodeJS.ReadableStream,
        maxOutputBytes: number
    ): Promise<{ stdout: string; stderr: string; truncated: { stdout: boolean; stderr: boolean } }> {
        return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';
            let stdoutSize = 0;
            let stderrSize = 0;
            let truncatedStdout = false;
            let truncatedStderr = false;

            stream.on('data', (chunk: Buffer) => {
                // Docker stream header: 8 bytes
                // 1 byte: stream type (1 for stdout, 2 for stderr)
                // 3 bytes: unused
                // 4 bytes: size of payload
                let offset = 0;
                while (offset < chunk.length) {
                    const type = chunk[offset];
                    const size = chunk.readUInt32BE(offset + 4);
                    offset += 8;
                    const payload = chunk.slice(offset, offset + size);
                    offset += size;

                    if (type === 1) { // stdout
                        if (!truncatedStdout) {
                            if (stdoutSize + payload.length > maxOutputBytes) {
                                const remainingSpace = maxOutputBytes - stdoutSize;
                                stdout += payload.toString('utf-8', 0, remainingSpace);
                                truncatedStdout = true;
                            } else {
                                stdout += payload.toString('utf-8');
                            }
                            stdoutSize += payload.length;
                        }
                    } else if (type === 2) { // stderr
                        if (!truncatedStderr) {
                            if (stderrSize + payload.length > maxOutputBytes) {
                                const remainingSpace = maxOutputBytes - stderrSize;
                                stderr += payload.toString('utf-8', 0, remainingSpace);
                                truncatedStderr = true;
                            } else {
                                stderr += payload.toString('utf-8');
                            }
                            stderrSize += payload.length;
                        }
                    }
                }
            });

            stream.on('end', () => {
                resolve({
                    stdout,
                    stderr,
                    truncated: { stdout: truncatedStdout, stderr: truncatedStderr },
                });
            });

            stream.on('error', (err) => {
                reject(err);
            });
        });
    }

    private async cleanupContainer(container: Docker.Container): Promise<void> {
        try {
            // Forcefully stop and remove the container
            await container.stop({ t: 0 });
        } catch (error: any) {
            // Ignore 404 (not found) or 304 (not modified), as container might already be gone.
            if (error.statusCode !== 404 && error.statusCode !== 304) {
                this.logger.warn('Failed to clean up container.', { containerId: container.id, error: error.message });
            }
        }
    }
}