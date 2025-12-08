import { createContext, Script, Context } from 'vm';
import * as crypto from 'crypto';
import * as util from 'util';
import { URL } from 'url';

/**
 * Interface representing the HTTP request context available to the pre-script.
 * Scripts can modify these properties to inject headers, change the body, or update query parameters.
 */
export interface RequestContext {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
    query: Record<string, string>;
    params: Record<string, string>;
}

/**
 * Interface representing the complete context data passed to the pre-script runner.
 */
export interface PreScriptContextData {
    /** The HTTP request object to be sent. */
    request: RequestContext;
    /** Workflow variables that can be read or modified. */
    variables: Record<string, any>;
    /** Environment variables (read-only recommended, but mutable in sandbox). */
    environment: Record<string, string>;
    /** Secure secrets (read-only). */
    secrets: Record<string, string>;
}

/**
 * Configuration options for the script execution.
 */
export interface PreScriptOptions {
    /** Maximum execution time in milliseconds. Default: 5000ms. */
    timeout?: number;
}

/**
 * Executes JavaScript/TypeScript code *before* an API call or workflow step.
 * 
 * This runner uses the Node.js `vm` module to create a sandboxed environment.
 * It provides access to cryptographic primitives and request manipulation capabilities,
 * essential for tasks like HMAC signature generation, timestamp injection, and dynamic payload construction.
 */
export class PreScriptRunner {
    private static readonly DEFAULT_TIMEOUT_MS = 5000;

    /**
     * Executes the provided script code within a secure sandbox.
     * 
     * @param scriptCode - The raw JavaScript code to execute.
     * @param data - The context data containing the request, variables, and environment.
     * @param options - Execution options.
     * @returns A Promise that resolves to the modified context data.
     */
    public async execute(
        scriptCode: string,
        data: PreScriptContextData,
        options: PreScriptOptions = {}
    ): Promise<PreScriptContextData> {
        if (!scriptCode || scriptCode.trim().length === 0) {
            return data;
        }

        const timeout = options.timeout || PreScriptRunner.DEFAULT_TIMEOUT_MS;
        const sandbox = this.createSandbox(data);
        const context = createContext(sandbox);

        try {
            // Create the script object
            const script = new Script(scriptCode);

            // Execute the script in the context
            // Note: vm.runInContext is synchronous. If async/await support is needed in the future,
            // the script code would need to be wrapped in an async IIFE and the promise handled here.
            script.runInContext(context, {
                displayErrors: true,
                timeout: timeout,
                breakOnSigint: true,
            });

            // The script modifies the objects passed by reference (request, variables).
            // We return the original data structure which now reflects these mutations.
            return data;

        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // We wrap the error to provide context about where it happened
            throw new Error(`Pre-script execution failed: ${errorMessage}`);
        }
    }

    /**
     * Constructs the sandbox environment, exposing safe globals and utility libraries.
     * 
     * @param data - The context data to expose to the script.
     */
    private createSandbox(data: PreScriptContextData): Context {
        return {
            // 1. Data Access
            request: data.request,
            variables: data.variables,
            environment: data.environment,
            secrets: data.secrets,

            // 2. Console (for debugging scripts)
            console: {
                log: (...args: any[]) => console.log('[PreScript]', ...args),
                info: (...args: any[]) => console.info('[PreScript]', ...args),
                warn: (...args: any[]) => console.warn('[PreScript]', ...args),
                error: (...args: any[]) => console.error('[PreScript]', ...args),
            },

            // 3. Cryptography (Essential for API signatures)
            crypto: {
                createHmac: crypto.createHmac,
                createHash: crypto.createHash,
                randomBytes: crypto.randomBytes,
                randomUUID: crypto.randomUUID,
                timingSafeEqual: crypto.timingSafeEqual,
                createSign: crypto.createSign,
                createVerify: crypto.createVerify,
                constants: crypto.constants,
            },

            // 4. Encoding/Decoding Utilities
            Buffer: Buffer,
            atob: (str: string) => Buffer.from(str, 'base64').toString('binary'),
            btoa: (str: string) => Buffer.from(str, 'binary').toString('base64'),
            TextEncoder: util.TextEncoder,
            TextDecoder: util.TextDecoder,

            // 5. URL Handling
            URL: URL,
            URLSearchParams: URLSearchParams,
            encodeURIComponent: encodeURIComponent,
            decodeURIComponent: decodeURIComponent,

            // 6. Helper Functions for Workflow State
            setVariable: (key: string, value: any) => {
                data.variables[key] = value;
            },
            getVariable: (key: string) => {
                return data.variables[key];
            },
            clearVariable: (key: string) => {
                delete data.variables[key];
            },
            
            // 7. Date/Time utilities (often needed for timestamps/nonces)
            Date: Date,
            setTimeout: setTimeout, // Be careful with timeouts in VM, but often needed for slight delays
            clearTimeout: clearTimeout,
        };
    }
}