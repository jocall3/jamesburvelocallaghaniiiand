import * as tf from '@tensorflow/tfjs';
// We need to import the WASM backend explicitly for it to be registered and available.
import '@tensorflow/tfjs-backend-wasm';

/**
 * A wrapper class for performing TensorFlow.js Graph-mode execution in the browser
 * using the WebAssembly (WASM) backend.
 *
 * This class handles initialization of the WASM backend, loading of pre-trained
 * TensorFlow.js GraphModels, and executing inference with proper input/output tensor management.
 * It aims to provide a straightforward API for common graph model usage patterns.
 */
export class TensorFlowWASMGraphExecutor {
    private model: tf.GraphModel | null = null;
    private initializedBackend = false;

    constructor() {
        // The constructor is intentionally kept simple.
        // Asynchronous initialization of the TF.js backend is handled by the `initialize()` method.
    }

    /**
     * Initializes the TensorFlow.js WASM backend.
     * This method must be called and awaited *before* any models can be loaded or inference can be run.
     * It sets WASM as the primary backend and ensures it's ready for use within the browser environment.
     *
     * @returns A Promise that resolves when the WASM backend is successfully initialized.
     * @throws An error if the WASM backend cannot be initialized, is not available, or fails during setup.
     */
    public async initialize(): Promise<void> {
        if (this.initializedBackend) {
            console.warn('TensorFlowWASMGraphExecutor: WASM backend already initialized. Skipping re-initialization.');
            return;
        }

        console.log('TensorFlowWASMGraphExecutor: Attempting to initialize WASM backend...');
        try {
            // Set WASM as the preferred backend for TensorFlow.js.
            tf.setBackend('wasm');
            // Wait for the backend to be ready. This performs essential setup and verifies support.
            await tf.ready();

            // Verify that WASM is indeed the active backend after `tf.ready()` resolves.
            if (tf.getBackend() !== 'wasm') {
                throw new Error(`Failed to set WASM backend. TensorFlow.js is currently using: ${tf.getBackend()}`);
            }

            this.initializedBackend = true;
            console.log('TensorFlowWASMGraphExecutor: WASM backend initialized successfully.');
        } catch (error) {
            this.initializedBackend = false; // Ensure the state is correctly reflected on failure.
            console.error('TensorFlowWASMGraphExecutor: Error initializing WASM backend:', error);
            throw new Error(`Failed to initialize TensorFlow.js WASM backend: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Loads a TensorFlow.js GraphModel from the specified URL.
     * If a model is already loaded when this method is called, the existing model
     * will be disposed of before attempting to load the new one, to prevent memory leaks.
     *
     * @param modelUrl The URL to the `model.json` file of the TensorFlow.js GraphModel.
     *                 This URL should be accessible by the browser (e.g., via HTTP/HTTPS).
     * @returns A Promise that resolves when the model is successfully loaded.
     * @throws An error if the WASM backend is not initialized or if the model fails to load from the URL.
     */
    public async loadModel(modelUrl: string): Promise<void> {
        if (!this.initializedBackend) {
            throw new Error('TensorFlowWASMGraphExecutor: WASM backend not initialized. Call `initialize()` first.');
        }
        if (this.model) {
            console.warn('TensorFlowWASMGraphExecutor: A model is already loaded. Disposing previous model before loading a new one.');
            this.disposeModel(); // Clean up the old model.
        }

        console.log(`TensorFlowWASMGraphExecutor: Loading GraphModel from: ${modelUrl}`);
        try {
            // Load the GraphModel using tf.loadGraphModel.
            this.model = await tf.loadGraphModel(modelUrl);
            console.log('TensorFlowWASMGraphExecutor: GraphModel loaded successfully.');
        } catch (error) {
            this.model = null; // Ensure the model reference is null if loading failed.
            console.error(`TensorFlowWASMGraphExecutor: Error loading GraphModel from ${modelUrl}:`, error);
            throw new Error(`Failed to load GraphModel from ${modelUrl}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Runs inference on the currently loaded GraphModel.
     *
     * This method expects input data as a dictionary where keys represent the input tensor names
     * of the model, and values are the corresponding input data. The data can be various types
     * that can be converted to `tf.Tensor` (e.g., `number[]`, `Float32Array`, `ImageData`).
     * If you already possess `tf.Tensor` objects, you can pass them directly.
     *
     * IMPORTANT: It is the caller's explicit responsibility to dispose of the *returned output tensors*
     * using `tf.dispose()` or by wrapping the post-prediction logic within a `tf.tidy()` block
     * to prevent memory leaks. Input tensors that are *created by this wrapper* (i.e., not
     * `tf.Tensor` instances initially provided by the caller) will be automatically disposed
     * by this method's `finally` block.
     *
     * @param inputs A dictionary mapping input node names (strings) to their corresponding data.
     *               Supported data types include raw JavaScript arrays (`number[]`), typed arrays
     *               (`Float32Array`, `Int32Array`, `Uint8Array`), `ImageData` objects, or existing `tf.Tensor` instances.
     * @returns A Promise resolving to a dictionary where keys are output node names (strings)
     *          and values are the resulting `tf.Tensor` objects.
     * @throws An error if the WASM backend is not initialized, no model is loaded, or prediction fails during execution.
     */
    public async predict(inputs: { [key: string]: any }): Promise<{ [key: string]: tf.Tensor }> {
        if (!this.initializedBackend) {
            throw new Error('TensorFlowWASMGraphExecutor: WASM backend not initialized. Call `initialize()` first.');
        }
        if (!this.model) {
            throw new Error('TensorFlowWASMGraphExecutor: No model loaded. Call `loadModel()` first.');
        }

        const inputTensors: tf.NamedTensorMap = {};
        const createdInputTensors: tf.Tensor[] = []; // List to track tensors created by this method for disposal.

        try {
            // Convert all input data to `tf.Tensor` instances if they aren't already.
            for (const name of Object.keys(inputs)) {
                const data = inputs[name];
                if (data instanceof tf.Tensor) {
                    inputTensors[name] = data; // Use existing tensor directly.
                } else {
                    let tensor: tf.Tensor;
                    if (data instanceof ImageData) {
                        // For image data, `tf.browser.fromPixels` is suitable.
                        // Further preprocessing (e.g., normalization, resizing, expanding dimensions)
                        // might be required depending on the model's specific input expectations.
                        tensor = tf.browser.fromPixels(data);
                    } else if (Array.isArray(data) || ArrayBuffer.isView(data)) {
                        // For arrays and typed arrays, create a tensor.
                        // Note: `tf.tensor()` will infer a 1D shape for flat arrays.
                        // For models expecting multi-dimensional inputs, ensure the input `data`
                        // is appropriately structured or consider adding a `shape` parameter to `predict`.
                        tensor = tf.tensor(data);
                    } else {
                        throw new Error(`Unsupported input data type for key '${name}'. Expected a tf.Tensor, ImageData, Array, or TypedArray.`);
                    }
                    inputTensors[name] = tensor;
                    createdInputTensors.push(tensor); // Mark this tensor for disposal by the wrapper.
                }
            }

            console.log('TensorFlowWASMGraphExecutor: Running inference with the loaded model...');
            // Execute the model asynchronously. `executeAsync` efficiently manages intermediate tensors.
            // By passing `this.model.outputNodes`, we request specific outputs by name.
            const output = await this.model.executeAsync(inputTensors, this.model.outputNodes);

            const result: { [key: string]: tf.Tensor } = {};
            let outputTensors: tf.Tensor[] = [];

            // `executeAsync` typically returns an array of tensors when `outputNodes` are specified.
            if (Array.isArray(output)) {
                outputTensors = output as tf.Tensor[];
            } else if (output instanceof tf.Tensor) {
                // Handle the case where there's only a single output tensor, not wrapped in an array.
                outputTensors = [output];
            } else if (typeof output === 'object' && output !== null) {
                // Fallback: If `outputNodes` were not defined or the model returns a `NamedTensorMap` directly.
                // This is less common for GraphModels when `outputNodes` are used.
                Object.assign(result, output); // Assume it's already a NamedTensorMap.
            } else {
                console.warn('TensorFlowWASMGraphExecutor: Model returned an unexpected output type (not Tensor, Tensor[], or NamedTensorMap).');
            }

            // Map the received output tensors back to their original output node names using `model.outputNodes`.
            if (this.model.outputNodes && this.model.outputNodes.length > 0) {
                if (outputTensors.length !== this.model.outputNodes.length) {
                    console.warn(`TensorFlowWASMGraphExecutor: Mismatch between expected output nodes (${this.model.outputNodes.length}) and received output tensors (${outputTensors.length}). This might indicate a model issue or lead to incorrect mapping.`);
                }
                this.model.outputNodes.forEach((nodeName, index) => {
                    if (outputTensors[index]) {
                        result[nodeName] = outputTensors[index];
                    } else {
                        console.warn(`TensorFlowWASMGraphExecutor: No tensor found for expected output node '${nodeName}' at index ${index}.`);
                    }
                });
            } else if (outputTensors.length > 0) {
                // If `model.outputNodes` are not available or couldn't be used for mapping,
                // return outputs with generic indexed names.
                outputTensors.forEach((tensor, index) => {
                    result[`output_${index}`] = tensor;
                });
                console.warn('TensorFlowWASMGraphExecutor: Model.outputNodes were not available for mapping. Returning outputs with generic names (e.g., `output_0`, `output_1`).');
            } else if (Object.keys(result).length === 0) {
                console.warn('TensorFlowWASMGraphExecutor: Inference completed but no output tensors were generated or could be mapped to the result object.');
            }

            console.log('TensorFlowWASMGraphExecutor: Inference complete.');
            return result;
        } catch (error) {
            console.error('TensorFlowWASMGraphExecutor: Error during model prediction:', error);
            throw new Error(`Model prediction failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            // Crucially, dispose of any input tensors that were created by *this wrapper*
            // to free up memory immediately after inference.
            tf.dispose(createdInputTensors);
        }
    }

    /**
     * Disposes of the currently loaded GraphModel, freeing all associated memory.
     * This method should be called when the model is no longer needed to prevent memory leaks.
     * After disposal, the model cannot be used for prediction until a new model is loaded.
     */
    public disposeModel(): void {
        if (this.model) {
            this.model.dispose();
            this.model = null;
            console.log('TensorFlowWASMGraphExecutor: GraphModel disposed successfully.');
        } else {
            console.warn('TensorFlowWASMGraphExecutor: No model currently loaded to dispose.');
        }
    }

    /**
     * Checks if the TensorFlow.js WASM backend has been successfully initialized.
     *
     * @returns `true` if the backend is initialized, `false` otherwise.
     */
    public isInitialized(): boolean {
        return this.initializedBackend;
    }

    /**
     * Checks if a TensorFlow.js GraphModel is currently loaded and ready for inference.
     *
     * @returns `true` if a model is loaded, `false` otherwise.
     */
    public isModelLoaded(): boolean {
        return this.model !== null;
    }

    /**
     * Provides direct access to the underlying `tf.GraphModel` instance.
     * This method allows advanced users to interact directly with the TensorFlow.js model object.
     *
     * Use with caution: If you perform operations directly on the model (e.g., `model.execute()`),
     * you are responsible for managing tensor memory (e.g., by wrapping operations in `tf.tidy()`
     * or manually calling `dispose()` on any tensors created).
     *
     * @returns The `tf.GraphModel` instance, or `null` if no model is currently loaded.
     */
    public getModel(): tf.GraphModel | null {
        return this.model;
    }

    /**
     * Helper function to asynchronously convert a `tf.Tensor` to a plain JavaScript `Float32Array`.
     * This is commonly used for extracting and post-processing numerical results from model outputs.
     *
     * @param tensor The TensorFlow tensor to convert.
     * @returns A Promise resolving to a `Float32Array` containing the tensor's data.
     * @throws An error if the input is not a valid `tf.Tensor`.
     */
    public async tensorToFloat32Array(tensor: tf.Tensor): Promise<Float32Array> {
        if (!tf.Tensor.isTensor(tensor)) {
            throw new Error('TensorFlowWASMGraphExecutor: Invalid input for `tensorToFloat32Array`: expected a `tf.Tensor`.');
        }
        return tensor.data() as Promise<Float32Array>;
    }

    /**
     * Helper function to asynchronously convert a scalar `tf.Tensor` (a tensor with no dimensions, e.g., `tf.tensor(5)`)
     * to a standard JavaScript `number`. This is useful for models that output single numerical values.
     *
     * @param tensor The scalar TensorFlow tensor to convert.
     * @returns A Promise resolving to a `number`.
     * @throws An error if the input is not a valid scalar `tf.Tensor`.
     */
    public async tensorToScalar(tensor: tf.Tensor): Promise<number> {
        if (!tf.Tensor.isTensor(tensor) || tensor.shape.length !== 0) {
            throw new Error('TensorFlowWASMGraphExecutor: Invalid input for `tensorToScalar`: expected a scalar `tf.Tensor` (shape `[]`).');
        }
        return tensor.data() as Promise<number>;
    }
}