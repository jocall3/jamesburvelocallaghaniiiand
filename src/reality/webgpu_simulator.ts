interface WebGPUSimulatorOptions {
    adapterOptions?: GPURequestAdapterOptions;
    deviceOptions?: GPUDeviceDescriptor;
    canvasConfig?: GPUCanvasConfiguration;
}

/**
 * Contextual information passed to visualizations during each frame.
 */
interface FrameContext {
    device: GPUDevice;
    presentationFormat: GPUTextureFormat;
    renderTargetTexture: GPUTexture;
    renderTargetView: GPUTextureView;
    canvas: HTMLCanvasElement;
    deltaTime: number; // Time in seconds since the last frame
    elapsedTime: number; // Total time in seconds since the simulator started
    canvasWidth: number;
    canvasHeight: number;
}

/**
 * Interface for a financial visualization component that can be rendered by the simulator.
 */
interface FinancialVisualization {
    id: string; // Unique identifier for the visualization
    /**
     * Updates the data used by the visualization.
     * @param data The new data for the visualization. Structure depends on the specific visualization.
     */
    updateData(data: any): void;

    /**
     * Prepares GPU resources (e.g., updating buffers, bind groups) for rendering this visualization.
     * This is typically called once per frame before any compute or render passes.
     * @param commandEncoder The command encoder to record copy or buffer update commands.
     * @param frameContext The current frame's context.
     */
    prepareRender(commandEncoder: GPUCommandEncoder, frameContext: FrameContext): void;

    /**
     * Encodes render commands for this visualization into the given render pass.
     * @param renderPassEncoder The render pass encoder.
     * @param frameContext The current frame's context.
     */
    encodeRenderPass(renderPassEncoder: GPURenderPassEncoder, frameContext: FrameContext): void;

    /**
     * Optional: Encodes compute commands for this visualization into the given compute pass.
     * This is useful for data processing on the GPU before rendering.
     * @param computePassEncoder The compute pass encoder.
     * @param frameContext The current frame's context.
     */
    encodeComputePass?(computePassEncoder: GPUComputePassEncoder, frameContext: FrameContext): void;

    /**
     * Disposes of all GPU resources specific to this visualization.
     */
    destroy(): void;
}

/**
 * Custom WebGPU simulator for high-fidelity rendering of financial visualizations.
 * Provides a framework for managing WebGPU context, render loop, and orchestrating multiple
 * financial visualization components.
 */
class WebGPUSimulator {
    private canvas: HTMLCanvasElement;
    private adapter: GPUAdapter | null = null;
    private device: GPUDevice | null = null;
    private context: GPUCanvasContext | null = null;
    private presentationFormat: GPUTextureFormat = 'bgra8unorm'; // Default, often overridden by getPreferredCanvasFormat
    private canvasConfig: GPUCanvasConfiguration | null = null;

    private visualizations: Map<string, FinancialVisualization> = new Map();

    private animationFrameId: number | null = null;
    private lastFrameTime = 0;
    private startTime = 0;

    constructor(canvas: HTMLCanvasElement, options?: WebGPUSimulatorOptions) {
        if (!canvas) {
            throw new Error("Canvas element is required for WebGPUSimulator.");
        }
        this.canvas = canvas;

        // Initial canvas config base. Device and format will be set after initialization.
        this.canvasConfig = {
            device: undefined as any, // Placeholder, set in initialize
            format: options?.canvasConfig?.format || this.presentationFormat,
            alphaMode: options?.canvasConfig?.alphaMode || 'premultiplied',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
            viewFormats: options?.canvasConfig?.viewFormats,
            colorSpace: options?.canvasConfig?.colorSpace,
        };
    }

    /**
     * Initializes the WebGPU simulator, requesting adapter, device, and configuring the canvas context.
     * @param options Optional configuration for adapter, device, and canvas.
     */
    async initialize(options?: WebGPUSimulatorOptions): Promise<void> {
        if (!navigator.gpu) {
            throw new Error("WebGPU is not supported in this browser.");
        }

        this.adapter = await navigator.gpu.requestAdapter(options?.adapterOptions);
        if (!this.adapter) {
            throw new Error("No WebGPU adapter found.");
        }

        this.device = await this.adapter.requestDevice(options?.deviceOptions);
        if (!this.device) {
            throw new Error("No WebGPU device found.");
        }

        // Register a handler for uncaptured errors for better debugging
        this.device.onuncapturederror = (event: GPUErrorEvent) => {
            console.error("WebGPU uncaptured error:", event.error);
            // Potentially stop rendering or display an error message to the user
        };

        this.context = this.canvas.getContext("webgpu");
        if (!this.context) {
            throw new Error("Failed to get WebGPU context from canvas.");
        }

        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        this.canvasConfig = {
            ...this.canvasConfig,
            device: this.device,
            format: this.presentationFormat,
        };
        this.context.configure(this.canvasConfig);

        console.log("WebGPUSimulator initialized successfully.");
        this.startTime = performance.now();
        this.lastFrameTime = this.startTime;

        // Ensure canvas dimensions match client size initially
        this.resizeCanvasToDisplaySize();
    }

    /**
     * Adds a financial visualization component to the simulator.
     * If a visualization with the same ID already exists, it will be replaced and destroyed.
     * @param viz The visualization component to add.
     */
    addVisualization(viz: FinancialVisualization): void {
        if (this.visualizations.has(viz.id)) {
            console.warn(`Visualization with ID '${viz.id}' already exists. Overwriting.`);
            this.visualizations.get(viz.id)?.destroy(); // Clean up old one
        }
        this.visualizations.set(viz.id, viz);
    }

    /**
     * Retrieves a visualization component by its ID.
     * @param id The unique ID of the visualization.
     * @returns The FinancialVisualization component, or undefined if not found.
     */
    getVisualization(id: string): FinancialVisualization | undefined {
        return this.visualizations.get(id);
    }

    /**
     * Removes a visualization component from the simulator and disposes its resources.
     * @param id The unique ID of the visualization to remove.
     */
    removeVisualization(id: string): void {
        const viz = this.visualizations.get(id);
        if (viz) {
            viz.destroy();
            this.visualizations.delete(id);
        }
    }

    /**
     * Starts the animation frame render loop.
     * Throws an error if the simulator has not been initialized.
     */
    startRenderLoop(): void {
        if (!this.device || !this.context) {
            throw new Error("Simulator not initialized. Call initialize() first.");
        }
        if (this.animationFrameId !== null) {
            console.warn("Render loop already running.");
            return;
        }
        this.animationFrameId = requestAnimationFrame(this.renderFrameInternal.bind(this));
    }

    /**
     * Stops the animation frame render loop.
     */
    stopRenderLoop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            console.log("Render loop stopped.");
        }
    }

    /**
     * Internal render frame callback for `requestAnimationFrame`.
     * @param time The DOMHighResTimeStamp for the current frame.
     */
    private renderFrameInternal(time: DOMHighResTimeStamp): void {
        if (!this.device || !this.context) return;

        const deltaTime = (time - this.lastFrameTime) / 1000; // in seconds
        const elapsedTime = (time - this.startTime) / 1000; // in seconds
        this.lastFrameTime = time;

        try {
            this.render(deltaTime, elapsedTime);
        } catch (error) {
            console.error("Error during rendering:", error);
            this.stopRenderLoop(); // Stop the loop to prevent further errors
        }

        this.animationFrameId = requestAnimationFrame(this.renderFrameInternal.bind(this));
    }

    /**
     * The main rendering logic for a single frame.
     * @param deltaTime Time since the last frame in seconds.
     * @param elapsedTime Total time since the simulator started in seconds.
     */
    private render(deltaTime: number, elapsedTime: number): void {
        if (!this.device || !this.context || !this.canvasConfig) return;

        // Handle canvas resizing to match CSS pixels
        this.resizeCanvasToDisplaySize();

        const currentTexture = this.context.getCurrentTexture();
        const textureView = currentTexture.createView();

        const commandEncoder = this.device.createCommandEncoder({
            label: "Main Render Command Encoder",
        });

        const frameContext: FrameContext = {
            device: this.device,
            presentationFormat: this.presentationFormat,
            renderTargetTexture: currentTexture,
            renderTargetView: textureView,
            canvas: this.canvas,
            deltaTime,
            elapsedTime,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
        };

        // 1. Prepare: Allow visualizations to update their GPU-side data (buffers, bind groups)
        // This must happen before any passes are encoded that use this data.
        for (const viz of this.visualizations.values()) {
            viz.prepareRender(commandEncoder, frameContext);
        }

        // 2. Compute Pass: Run any compute shaders required by visualizations.
        // This is typically for data processing before rendering.
        const computePassEncoder = commandEncoder.beginComputePass({
            label: "Main Compute Pass",
        });
        for (const viz of this.visualizations.values()) {
            viz.encodeComputePass?.(computePassEncoder, frameContext);
        }
        computePassEncoder.end();

        // 3. Render Pass: Encode drawing commands for all visualizations.
        const renderPassEncoder = commandEncoder.beginRenderPass({
            label: "Main Render Pass",
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 }, // Clear to black by default
                loadOp: 'clear',
                storeOp: 'store',
            }],
            // Depth/Stencil attachments could be added here if needed
            // depthStencilAttachment: { ... }
        });

        // Set common viewport and scissor rect for all visualizations.
        // Visualizations can override these if they need custom viewports.
        renderPassEncoder.setViewport(0, 0, this.canvas.width, this.canvas.height, 0, 1);
        renderPassEncoder.setScissorRect(0, 0, this.canvas.width, this.canvas.height);

        for (const viz of this.visualizations.values()) {
            viz.encodeRenderPass(renderPassEncoder, frameContext);
        }

        renderPassEncoder.end();

        // Finish encoding commands and submit them to the device queue.
        this.device.queue.submit([commandEncoder.finish()]);
    }

    /**
     * Resizes the canvas's internal drawing buffer to match its CSS display size,
     * considering device pixel ratio. Also reconfigures the WebGPU context if dimensions change.
     */
    private resizeCanvasToDisplaySize(): void {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const desiredWidth = Math.floor(this.canvas.clientWidth * devicePixelRatio);
        const desiredHeight = Math.floor(this.canvas.clientHeight * devicePixelRatio);

        if (this.canvas.width !== desiredWidth || this.canvas.height !== desiredHeight) {
            this.canvas.width = desiredWidth;
            this.canvas.height = desiredHeight;
            if (this.context && this.canvasConfig) {
                // Reconfiguring the context ensures the swap chain textures are recreated with new dimensions
                this.context.configure(this.canvasConfig);
            }
            console.log(`Canvas resized to ${desiredWidth}x${desiredHeight} (CSS: ${this.canvas.clientWidth}x${this.canvas.clientHeight})`);
        }
    }

    /**
     * Helper to create a GPUShaderModule.
     * @param code The WGSL shader code.
     * @param label Optional label for debugging.
     * @returns The created GPUShaderModule or undefined if device is not available.
     */
    createShaderModule(code: string, label?: string): GPUShaderModule | undefined {
        if (!this.device) return undefined;
        return this.device.createShaderModule({ code, label });
    }

    /**
     * Helper to create a GPUBuffer.
     * @param descriptor The buffer descriptor.
     * @returns The created GPUBuffer or undefined if device is not available.
     */
    createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer | undefined {
        if (!this.device) return undefined;
        return this.device.createBuffer(descriptor);
    }

    /**
     * Helper to create a GPUTexture.
     * @param descriptor The texture descriptor.
     * @returns The created GPUTexture or undefined if device is not available.
     */
    createTexture(descriptor: GPUTextureDescriptor): GPUTexture | undefined {
        if (!this.device) return undefined;
        return this.device.createTexture(descriptor);
    }

    /**
     * Helper to create a GPURenderPipeline.
     * @param descriptor The render pipeline descriptor.
     * @returns The created GPURenderPipeline or undefined if device is not available.
     */
    createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline | undefined {
        if (!this.device) return undefined;
        return this.device.createRenderPipeline(descriptor);
    }

    /**
     * Helper to create a GPUComputePipeline.
     * @param descriptor The compute pipeline descriptor.
     * @returns The created GPUComputePipeline or undefined if device is not available.
     */
    createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline | undefined {
        if (!this.device) return undefined;
        return this.device.createComputePipeline(descriptor);
    }

    /**
     * Disposes of all resources held by the simulator and its visualizations.
     */
    destroy(): void {
        this.stopRenderLoop();
        for (const viz of this.visualizations.values()) {
            viz.destroy();
        }
        this.visualizations.clear();

        // While WebGPU devices don't have an explicit `destroy()` method,
        // it's good practice to clear references and allow garbage collection.
        // If the simulator held any specific global WebGPU resources (e.g., custom samplers),
        // they would be released here.
        this.device?.onuncapturederror = null; // Remove error handler
        this.device = null;
        this.adapter = null;
        this.context = null; // Unconfigure context? (No direct unconfigure method)

        console.log("WebGPUSimulator destroyed.");
    }
}