export interface HardwareCapabilities {
    /** The type of accelerator available, e.g., 'GPU', 'TPU', 'QUANTUM_PROCESSOR', 'FPGA'. */
    acceleratorType?: string;
    /** Available memory in MB. */
    memoryMB?: number;
    /** List of computational task types this hardware can support. */
    supportedTaskTypes: string[];
    /** Optional: Specific features or versions, e.g., 'CUDA_11.8', 'Qiskit_0.45'. */
    features?: string[];
    /** Optional: Number of processing units (cores, qubits, etc.). */
    processingUnits?: number;
}

export interface ComputationalTask<TInput = any, TOutput = any> {
    /** A unique identifier for the task. */
    id: string;
    /** The type of computation, e.g., 'ML_INFERENCE', 'QUANTUM_SIMULATION', 'DATA_PROCESSING', 'FHE_OPERATION'. */
    type: string;
    /** The actual data or parameters required for the task. */
    payload: TInput;
    /** Optional: Specific hardware requirements for the task. */
    requirements?: {
        minMemoryMB?: number;
        acceleratorType?: string;
        requiredFeatures?: string[];
        minProcessingUnits?: number;
        // Add other specific requirements as needed
    };
    /** Optional: Metadata for logging, tracing, or context. */
    metadata?: Record<string, any>;
}

/**
 * Interface for a hardware adapter, abstracting the execution details of a specific hardware type.
 */
export interface IHardwareAdapter {
    /** A unique identifier for this specific hardware instance (e.g., 'gpu-nvidia-001'). */
    id: string;
    /** A human-readable name for the adapter (e.g., 'NVIDIA RTX 3080 GPU'). */
    name: string;
    /** The general type of hardware, e.g., 'CPU', 'GPU', 'EDGE_DEVICE', 'QUANTUM_SIMULATOR'. */
    type: string;
    /** The capabilities of this hardware adapter. */
    capabilities: HardwareCapabilities;

    /**
     * Checks if this adapter can execute the given task based on its type and requirements.
     * @param task The computational task to check.
     * @returns True if the adapter can execute the task, false otherwise.
     */
    canExecute<TInput, TOutput>(task: ComputationalTask<TInput, TOutput>): boolean;

    /**
     * Executes the given computational task on the underlying hardware.
     * @param task The computational task to execute.
     * @returns A promise that resolves with the task's output.
     * @throws Error if execution fails or is not supported by the adapter.
     */
    execute<TInput, TOutput>(task: ComputationalTask<TInput, TOutput>): Promise<TOutput>;
}

/**
 * The core executor for hardware-agnostic computational tasks.
 * It manages various hardware adapters and dispatches tasks to the most suitable one.
 */
export class HardwareAgnosticExecutor {
    private adapters: Map<string, IHardwareAdapter> = new Map();

    constructor() {
        console.log("HardwareAgnosticExecutor initialized. Ready to register adapters.");
    }

    /**
     * Registers a hardware adapter with the executor.
     * @param adapter The hardware adapter to register.
     * @throws Error if an adapter with the same ID is already registered.
     */
    public registerAdapter(adapter: IHardwareAdapter): void {
        if (this.adapters.has(adapter.id)) {
            throw new Error(`Adapter with ID '${adapter.id}' already registered.`);
        }
        this.adapters.set(adapter.id, adapter);
        console.log(`Registered hardware adapter: ${adapter.name} (ID: ${adapter.id}, Type: ${adapter.type})`);
    }

    /**
     * Unregisters a hardware adapter.
     * @param adapterId The ID of the adapter to unregister.
     * @returns True if the adapter was unregistered, false if not found.
     */
    public unregisterAdapter(adapterId: string): boolean {
        if (this.adapters.delete(adapterId)) {
            console.log(`Unregistered hardware adapter: ${adapterId}`);
            return true;
        }
        console.warn(`Attempted to unregister non-existent adapter: ${adapterId}`);
        return false;
    }

    /**
     * Executes a computational task on the most suitable available hardware adapter.
     * The current strategy is to pick the first adapter that declares it can execute the task.
     * Future enhancements could include load balancing, cost optimization, or performance-based selection.
     *
     * @param task The computational task to execute.
     * @returns A promise that resolves with the task's output.
     * @throws Error if no suitable adapter is found or if execution fails on the chosen adapter.
     */
    public async executeTask<TInput, TOutput>(task: ComputationalTask<TInput, TOutput>): Promise<TOutput> {
        console.log(`[Executor] Attempting to execute task '${task.id}' (Type: ${task.type})...`);

        const suitableAdapters: IHardwareAdapter[] = [];
        for (const adapter of this.adapters.values()) {
            if (adapter.canExecute(task)) {
                suitableAdapters.push(adapter);
            }
        }

        if (suitableAdapters.length === 0) {
            throw new Error(`No suitable hardware adapter found for task '${task.id}' (Type: ${task.type}) with requirements: ${JSON.stringify(task.requirements || {})}`);
        }

        // For simplicity, pick the first suitable adapter.
        // In a production system, this would involve more sophisticated scheduling.
        const chosenAdapter = suitableAdapters[0];
        console.log(`[Executor] Dispatching task '${task.id}' to adapter: ${chosenAdapter.name} (ID: ${chosenAdapter.id})`);

        try {
            const result = await chosenAdapter.execute(task);
            console.log(`[Executor] Task '${task.id}' completed successfully on ${chosenAdapter.name}.`);
            return result;
        } catch (error) {
            console.error(`[Executor] Error executing task '${task.id}' on adapter '${chosenAdapter.name}':`, error);
            throw new Error(`Failed to execute task '${task.id}' on adapter '${chosenAdapter.name}': ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Lists all currently registered hardware adapters.
     * @returns An array of registered hardware adapters.
     */
    public listAdapters(): IHardwareAdapter[] {
        return Array.from(this.adapters.values());
    }
}

// --- Example Hardware Adapters (for demonstration purposes) ---

/**
 * Represents a generic CPU for general-purpose computation and basic ML inference.
 */
export class CPUAdapter implements IHardwareAdapter {
    public id: string;
    public name: string;
    public type: string = 'CPU';
    public capabilities: HardwareCapabilities;

    constructor(id: string = 'cpu-default', name: string = 'Standard CPU Processor', memoryMB: number = 8192) {
        this.id = id;
        this.name = name;
        this.capabilities = {
            acceleratorType: undefined,
            memoryMB: memoryMB,
            supportedTaskTypes: ['DATA_PROCESSING', 'ML_INFERENCE', 'GENERAL_COMPUTATION', 'FHE_OPERATION']
        };
    }

    public canExecute<TInput, TOutput>(task: ComputationalTask<TInput, TOutput>): boolean {
        const meetsType = this.capabilities.supportedTaskTypes.includes(task.type);
        const meetsMemory = !task.requirements?.minMemoryMB || (this.capabilities.memoryMB >= task.requirements.minMemoryMB);
        // CPU can execute if no specific accelerator is required, or if it's a general computation
        const noAcceleratorRequired = !task.requirements?.acceleratorType || task.requirements.acceleratorType === 'CPU';
        return meetsType && meetsMemory && noAcceleratorRequired;
    }

    public async execute<TInput, TOutput>(task: ComputationalTask<TInput, TOutput>): Promise<TOutput> {
        console.log(`[${this.name}] Executing task '${task.id}' (Type: ${task.type})...`);
        // Simulate computation time
        await new Promise(resolve => setTimeout(Math.random() * 500 + 100, resolve));
        // In a real scenario, this would invoke a CPU-optimized library or function
        return `Processed by ${this.name}: ${JSON.stringify(task.payload)}` as TOutput;
    }
}

/**
 * Represents a GPU for accelerated ML inference and parallel computation.
 */
export class GPUAdapter implements IHardwareAdapter {
    public id: string;
    public name: string;
    public type: string = 'GPU';
    public capabilities: HardwareCapabilities;

    constructor(id: string = 'gpu-default', name: string = 'Generic GPU Accelerator', memoryMB: number = 16384, features: string[] = ['CUDA']) {
        this.id = id;
        this.name = name;
        this.capabilities = {
            acceleratorType: 'GPU',
            memoryMB: memoryMB,
            supportedTaskTypes: ['ML_INFERENCE', 'GRAPHICS_RENDERING', 'PARALLEL_COMPUTATION'],
            features: features
        };
    }

    public canExecute<TInput, TOutput>(task: ComputationalTask<TInput, TOutput>): boolean {
        const meetsType = this.capabilities.supportedTaskTypes.includes(task.type);
        const meetsMemory = !task.requirements?.minMemoryMB || (this.capabilities.memoryMB >= task.requirements.minMemoryMB);
        const acceleratorMatch = !task.requirements?.acceleratorType || task.requirements.acceleratorType === 'GPU';
        const meetsFeatures = !task.requirements?.requiredFeatures || task.requirements.requiredFeatures.every(f => this.capabilities.features?.includes(f));
        return meetsType && meetsMemory && acceleratorMatch && meetsFeatures;
    }

    public async execute<TInput, TOutput>(task: ComputationalTask<TInput, TOutput>): Promise<TOutput> {
        console.log(`[${this.name}] Executing task '${task.id}' (Type: ${task.type})...`);
        // Simulate accelerated computation time
        await new Promise(resolve => setTimeout(Math.random() * 200 + 50, resolve));
        // In a real scenario, this would invoke a GPU-accelerated library (e.g., TensorFlow.js, WebGPU, native CUDA calls)
        return `Accelerated by ${this.name}: ${JSON.stringify(task.payload)}` as TOutput;
    }
}

/**
 * Represents a Quantum Simulator for quantum computing primitives and FHE key management.
 */
export class QuantumSimulatorAdapter implements IHardwareAdapter {
    public id: string;
    public name: string;
    public type: string = 'QUANTUM_SIMULATOR';
    public capabilities: HardwareCapabilities;

    constructor(id: string = 'quantum-sim-default', name: string = 'Qiskit Quantum Simulator', qubits: number = 20) {
        this.id = id;
        this.name = name;
        this.capabilities = {
            acceleratorType: 'QUANTUM_PROCESSOR',
            memoryMB: 4096, // Quantum simulations can be memory intensive
            supportedTaskTypes: ['QUANTUM_SIMULATION', 'FHE_KEY_MANAGEMENT'],
            processingUnits: qubits,
            features: ['Qiskit', 'FHE_SUPPORT']
        };
    }

    public canExecute<TInput, TOutput>(task: ComputationalTask<TInput, TOutput>): boolean {
        const meetsType = this.capabilities.supportedTaskTypes.includes(task.type);
        const acceleratorMatch = task.requirements?.acceleratorType === 'QUANTUM_PROCESSOR' || meetsType;
        const meetsQubits = !task.requirements?.minProcessingUnits || (this.capabilities.processingUnits >= task.requirements.minProcessingUnits);
        const meetsFeatures = !task.requirements?.requiredFeatures || task.requirements.requiredFeatures.every(f => this.capabilities.features?.includes(f));
        return meetsType && acceleratorMatch && meetsQubits && meetsFeatures;
    }

    public async execute<TInput, TOutput>(task: ComputationalTask<TInput, TOutput>): Promise<TOutput> {
        console.log(`[${this.name}] Executing task '${task.id}' (Type: ${task.type})...`);
        // Simulate quantum computation time
        await new Promise(resolve => setTimeout(Math.random() * 1500 + 500, resolve));
        // In a real scenario, this would interface with a quantum SDK (e.g., Qiskit, Cirq)
        return `Quantum result from ${this.name} for: ${JSON.stringify(task.payload)}` as TOutput;
    }
}

/**
 * Represents an Edge Device for localized inference or data processing.
 */
export class EdgeDeviceAdapter implements IHardwareAdapter {
    public id: string;
    public name: string;
    public type: string = 'EDGE_DEVICE';
    public capabilities: HardwareCapabilities;

    constructor(id: string = 'edge-device-001', name: string = 'Raspberry Pi 4 Edge', memoryMB: number = 4096) {
        this.id = id;
        this.name = name;
        this.capabilities = {
            acceleratorType: 'NPU', // Example: Neural Processing Unit on edge
            memoryMB: memoryMB,
            supportedTaskTypes: ['ML_INFERENCE_EDGE', 'DATA_PROCESSING_LOCAL'],
            features: ['LOW_POWER', 'OFFLINE_CAPABLE']
        };
    }

    public canExecute<TInput, TOutput>(task: ComputationalTask<TInput, TOutput>): boolean {
        const meetsType = this.capabilities.supportedTaskTypes.includes(task.type);
        const meetsMemory = !task.requirements?.minMemoryMB || (this.capabilities.memoryMB >= task.requirements.minMemoryMB);
        const acceleratorMatch = !task.requirements?.acceleratorType || task.requirements.acceleratorType === 'NPU' || task.requirements.acceleratorType === 'CPU'; // Edge devices often have a CPU or NPU
        const meetsFeatures = !task.requirements?.requiredFeatures || task.requirements.requiredFeatures.every(f => this.capabilities.features?.includes(f));
        return meetsType && meetsMemory && acceleratorMatch && meetsFeatures;
    }

    public async execute<TInput, TOutput>(task: ComputationalTask<TInput, TOutput>): Promise<TOutput> {
        console.log(`[${this.name}] Executing task '${task.id}' (Type: ${task.type})...`);
        // Simulate edge computation time
        await new Promise(resolve => setTimeout(Math.random() * 800 + 200, resolve));
        // In a real scenario, this would involve local execution on the edge device
        return `Processed by ${this.name} (Edge): ${JSON.stringify(task.payload)}` as TOutput;
    }
}