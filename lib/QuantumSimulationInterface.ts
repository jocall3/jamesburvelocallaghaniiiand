/**
 * Represents a quantum circuit.
 * This can be a string in a standard quantum assembly language format (e.g., OpenQASM 2.0/3.0),
 * or a serialized representation of a quantum program specific to a simulator's SDK.
 */
export type QuantumCircuit = string;

/**
 * Defines options for executing a quantum simulation.
 */
export interface SimulationOptions {
  /**
   * The number of times to run the circuit (shots) for probabilistic outcomes.
   * If not provided, a state vector simulation might be performed if supported and applicable.
   */
  shots?: number;
  /**
   * Seed for the random number generator to ensure reproducibility of probabilistic simulations.
   * Applicable when `shots` are specified.
   */
  seed?: number;
  /**
   * Specifies the desired type of simulation output.
   * - 'statevector': Returns the final quantum state vector.
   * - 'counts': Returns measurement outcome counts from multiple shots.
   * - 'probabilities': Returns the probability distribution of measurement outcomes.
   * The simulator will attempt to provide the requested type, falling back to a compatible one if necessary.
   */
  simulationType?: 'statevector' | 'counts' | 'probabilities';
  /**
   * Any additional backend-specific parameters that can be passed directly to the underlying simulator.
   * This allows for fine-grained control over simulator behavior not covered by standard options.
   */
  backendParameters?: Record<string, any>;
}

/**
 * Represents the comprehensive result of a quantum simulation.
 * The available fields depend on the `simulationType` requested and the simulator's capabilities.
 */
export interface SimulationResult {
  /**
   * A map of measurement outcomes (e.g., '001', '110') to their observed frequencies/counts.
   * Typically present if `simulationType` was 'counts' or `shots` were provided.
   */
  measurementCounts?: { [outcome: string]: number };
  /**
   * The final state vector of the quantum system.
   * Represented as an array of complex numbers, where each complex number (a + bi)
   * is stored as two consecutive numbers [a, b]. For example, [re0, im0, re1, im1, ...].
   * Present if `simulationType` was 'statevector' and supported by the backend.
   */
  stateVector?: number[];
  /**
   * A map of measurement outcomes to their probabilities.
   * Typically present if `simulationType` was 'probabilities' or derived from `measurementCounts`.
   */
  probabilities?: { [outcome: string]: number };
  /**
   * The actual number of shots performed during the simulation, which might differ
   * from the requested `shots` if the simulator has internal constraints.
   */
  actualShots?: number;
  /**
   * Information about the quantum simulator backend that executed the circuit.
   */
  backendInfo?: {
    name: string;
    version?: string;
    [key: string]: any; // Allows for additional backend-specific metadata
  };
  /**
   * Any warnings or non-critical errors encountered during the simulation that did not halt execution.
   */
  warnings?: string[];
}

/**
 * Defines the capabilities and specifications of a quantum simulation backend.
 * This allows the system to query what a specific simulator can do.
 */
export interface SimulatorCapabilities {
  /**
   * The maximum number of qubits supported by the simulator for a single circuit.
   */
  maxQubits: number;
  /**
   * A list of quantum gate operations (e.g., 'h', 'cx', 'rz', 'u3') that the simulator natively supports.
   */
  supportedGates: string[];
  /**
   * Indicates whether the simulator can output the full quantum state vector.
   */
  supportsStateVector: boolean;
  /**
   * Indicates whether the simulator can directly return measurement probabilities without explicit shots.
   */
  supportsProbabilities: boolean;
  /**
   * Indicates whether the simulator supports custom noise models for simulating real-world quantum hardware.
   */
  supportsNoiseModels: boolean;
  /**
   * Other specific features or limitations of the simulator.
   */
  [key: string]: any; // Allows for additional, vendor-specific capability details
}

/**
 * Interface for integrating with specialized Quantum Simulation software.
 * This abstraction allows the core system to interact with various quantum backends
 * (e.g., Qiskit Aer, Cirq Simulator, custom simulators) without direct coupling to their specific SDKs.
 */
export interface QuantumSimulationInterface {
  /**
   * Executes a given quantum circuit on the integrated simulation software.
   * The circuit is typically provided in a standard format like OpenQASM.
   *
   * @param circuit The quantum circuit to execute.
   * @param options Optional parameters for the simulation, such as number of shots, seed, or desired output type.
   * @returns A promise that resolves with the simulation results.
   * @throws {Error} If the simulation fails due to an invalid circuit, unsupported operations,
   *                 backend errors, or other critical issues.
   */
  executeCircuit(circuit: QuantumCircuit, options?: SimulationOptions): Promise<SimulationResult>;

  /**
   * Retrieves the capabilities and specifications of the underlying quantum simulator.
   * This can include supported gates, maximum qubits, and other features, allowing the
   * system to adapt circuits or choose appropriate simulators.
   *
   * @returns A promise that resolves with the simulator's capabilities.
   */
  getCapabilities(): Promise<SimulatorCapabilities>;

  /**
   * Returns a unique identifier for this specific quantum simulation provider.
   * This helps in distinguishing between different integrated simulators.
   *
   * @returns A string identifier for the provider (e.g., "qiskit-aer-simulator", "cirq-local-simulator").
   */
  getProviderId(): string;
}