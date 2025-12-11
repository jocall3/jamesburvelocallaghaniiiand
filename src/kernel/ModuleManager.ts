```typescript
import { EventEmitter } from 'events';

/**
 * Unique identifier for a module.
 */
export type ModuleId = string;

/**
 * Represents the current lifecycle state of a module.
 */
export enum ModuleState {
    UNREGISTERED = 'UNREGISTERED', // Not known to the system
    REGISTERED = 'REGISTERED',     // Manifest loaded, code not loaded
    LOADING = 'LOADING',           // Initializing resources
    LOADED = 'LOADED',             // Initialized, ready to start
    STARTING = 'STARTING',         // Start hook executing
    ACTIVE = 'ACTIVE',             // Fully running
    STOPPING = 'STOPPING',         // Stop hook executing
    UNLOADING = 'UNLOADING',       // Disposing resources
    FAILED = 'FAILED',             // Encountered a critical error
}

/**
 * Metadata describing a financial module.
 */
export interface FinancialModuleManifest {
    id: ModuleId;
    name: string;
    version: string;
    description?: string;
    author?: string;
    /** List of module IDs this module depends on. */
    dependencies?: ModuleId[];
    /** Financial context permissions required (e.g., 'READ_TRANSACTIONS'). */
    permissions?: string[];
}

/**
 * Context provided to a module upon initialization.
 */
export interface ModuleContext {
    moduleId: ModuleId;
    config: Record<string, any>;
    eventBus: EventEmitter;
    logger: Console;
}

/**
 * The interface every financial module must implement.
 */
export interface IFinancialModule {
    readonly manifest: FinancialModuleManifest;

    /**
     * Called when the module is being loaded.
     * Use this to setup configurations and inject dependencies.
     */
    initialize(context: ModuleContext): Promise<void>;

    /**
     * Called when the module is starting its execution.
     * Use this to start listeners, jobs, or UI components.
     */
    start(): Promise<void>;

    /**
     * Called when the module is stopping.
     * Stop active listeners and jobs here.
     */
    stop(): Promise<void>;

    /**
     * Called when the module is being unloaded entirely.
     * Clean up all memory and handles here.
     */
    dispose(): Promise<void>;
}

/**
 * Core logic responsible for dynamically loading, unloading, 
 * and managing the lifecycle of financial modules.
 */
export class ModuleManager extends EventEmitter {
    private modules: Map<ModuleId, IFinancialModule> = new Map();
    private moduleStates: Map<ModuleId, ModuleState> = new Map();
    private manifests: Map<ModuleId, FinancialModuleManifest> = new Map();
    private dependencyGraph: Map<ModuleId, Set<ModuleId>> = new Map();

    constructor() {
        super();
        this.setMaxListeners(0); // Unlimited listeners for kernel event bus
    }

    /**
     * Registers a module manifest without loading the code.
     * This makes the module known to the kernel.
     */
    public register(manifest: FinancialModuleManifest): void {
        if (this.manifests.has(manifest.id)) {
            console.warn(`Module ${manifest.id} is already registered. Skipping.`);
            return;
        }

        this.manifests.set(manifest.id, manifest);
        this.setModuleState(manifest.id, ModuleState.REGISTERED);

        if (manifest.dependencies) {
            this.dependencyGraph.set(manifest.id, new Set(manifest.dependencies));
        }

        this.emit('module:registered', manifest.id);
    }

    /**
     * Dynamically loads a module using a provided factory function.
     * @param moduleId The ID of the module to load.
     * @param factory An async function that returns the module instance (e.g., dynamic import).
     */
    public async load(moduleId: ModuleId, factory: () => Promise<IFinancialModule>): Promise<void> {
        try {
            this.ensureState(moduleId, ModuleState.REGISTERED);
            this.checkDependencies(moduleId);

            this.setModuleState(moduleId, ModuleState.LOADING);

            const instance = await factory();
            
            if (instance.manifest.id !== moduleId) {
                throw new Error(`Module implementation ID '${instance.manifest.id}' does not match requested ID '${moduleId}'`);
            }

            const context = this.createContext(moduleId);
            await instance.initialize(context);

            this.modules.set(moduleId, instance);
            this.setModuleState(moduleId, ModuleState.LOADED);
            
            this.emit('module:loaded', moduleId);
        } catch (error) {
            this.handleError(moduleId, error, 'load');
            throw error;
        }
    }

    /**
     * Starts a loaded module. 
     * Requires the module to be in LOADED state.
     */
    public async start(moduleId: ModuleId): Promise<void> {
        try {
            this.ensureState(moduleId, ModuleState.LOADED);
            this.setModuleState(moduleId, ModuleState.STARTING);

            const module = this.modules.get(moduleId);
            if (!module) throw new Error(`Module instance for ${moduleId} not found.`);

            await module.start();

            this.setModuleState(moduleId, ModuleState.ACTIVE);
            this.emit('module:started', moduleId);
        } catch (error) {
            this.handleError(moduleId, error, 'start');
            throw error;
        }
    }

    /**
     * Stops an ACTIVE module.
     * If the module is not active, this operation does nothing.
     */
    public async stop(moduleId: ModuleId): Promise<void> {
        const currentState = this.getModuleState(moduleId);
        if (currentState !== ModuleState.ACTIVE) {
            return; 
        }

        try {
            this.ensureNoDependentsRunning(moduleId);
            this.setModuleState(moduleId, ModuleState.STOPPING);

            const module = this.modules.get(moduleId);
            if (module) {
                await module.stop();
            }

            this.setModuleState(moduleId, ModuleState.LOADED);
            this.emit('module:stopped', moduleId);
        } catch (error) {
            this.handleError(moduleId, error, 'stop');
            throw error;
        }
    }

    /**
     * Unloads a module completely, disposing its resources.
     * If the module is running, it will be stopped first.
     */
    public async unload(moduleId: ModuleId): Promise<void> {
        try {
            const currentState = this.getModuleState(moduleId);

            if (currentState === ModuleState.ACTIVE || currentState === ModuleState.STARTING) {
                await this.stop(moduleId);
            }

            if (this.modules.has(moduleId)) {
                this.setModuleState(moduleId, ModuleState.UNLOADING);
                
                const module = this.modules.get(moduleId);
                if (module) {
                    await module.dispose();
                }

                this.modules.delete(moduleId);
                // Return to REGISTERED state so it can be reloaded if needed
                this.setModuleState(moduleId, ModuleState.REGISTERED);
                
                this.emit('module:unloaded', moduleId);
            }
        } catch (error) {
            this.handleError(moduleId, error, 'unload');
            throw error;
        }
    }

    /**
     * Convenience method to load and start a module in one go.
     */
    public async loadAndStart(moduleId: ModuleId, factory: () => Promise<IFinancialModule>): Promise<void> {
        const state = this.getModuleState(moduleId);
        if (state === ModuleState.REGISTERED) {
            await this.load(moduleId, factory);
        }
        await this.start(moduleId);
    }

    public getModuleState(moduleId: ModuleId): ModuleState {
        return this.moduleStates.get(moduleId) || ModuleState.UNREGISTERED;
    }

    public getRegisteredManifests(): FinancialModuleManifest[] {
        return Array.from(this.manifests.values());
    }

    public getActiveModules(): IFinancialModule[] {
        const active: IFinancialModule[] = [];
        this.moduleStates.forEach((state, id) => {
            if (state === ModuleState.ACTIVE) {
                const mod = this.modules.get(id);
                if (mod) active.push(mod);
            }
        });
        return active;
    }

    private createContext(moduleId: ModuleId): ModuleContext {
        return {
            moduleId,
            config: {}, // Placeholder: Should be derived from a configuration service
            eventBus: this,
            logger: console // Placeholder: Should be a scoped logger instance
        };
    }

    private setModuleState(moduleId: ModuleId, state: ModuleState): void {
        const previous = this.moduleStates.get(moduleId);
        this.moduleStates.set(moduleId, state);
        this.emit('state:change', { moduleId, previous, current: state });
    }

    private ensureState(moduleId: ModuleId, expected: ModuleState): void {
        const current = this.getModuleState(moduleId);
        if (current !== expected) {
            throw new Error(`Lifecycle Error: Module ${moduleId} is in state ${current}, expected ${expected}.`);
        }
    }

    private checkDependencies(moduleId: ModuleId): void {
        const dependencies = this.dependencyGraph.get(moduleId);
        if (!dependencies) return;

        for (const depId of dependencies) {
            const depState = this.getModuleState(depId);
            // We usually require dependencies to be ACTIVE or at least LOADED depending on architecture.
            // Here we enforce ACTIVE for strict dependency management.
            if (depState !== ModuleState.ACTIVE) {
                throw new Error(`Dependency Error: Module ${moduleId} depends on ${depId}, which is currently ${depState}.`);
            }
        }
    }

    private ensureNoDependentsRunning(moduleId: ModuleId): void {
        for (const [otherId, deps] of this.dependencyGraph.entries()) {
            if (deps.has(moduleId)) {
                const otherState = this.getModuleState(otherId);
                if (otherState === ModuleState.ACTIVE || otherState === ModuleState.STARTING) {
                    throw new Error(`Lifecycle Error: Cannot stop/unload ${moduleId} because dependent module ${otherId} is running.`);
                }
            }
        }
    }

    private handleError(moduleId: ModuleId, error: unknown, operation: string): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`ModuleManager Error [${operation}] for ${moduleId}: ${errorMessage}`);
        
        this.setModuleState(moduleId, ModuleState.FAILED);
        this.emit('module:error', { moduleId, operation, error });
    }
}
```