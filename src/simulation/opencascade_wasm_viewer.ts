import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Declaration for the opencascade.js WASM module factory.
 * This is a placeholder for the actual type provided by the library.
 * @param options Configuration for the WASM module initialization.
 * @returns A promise that resolves to the initialized OpenCascade API object.
 */
declare let OpenCascade: (options?: {
    locateFile: (file: string) => string;
}) => Promise<any>;

/**
 * A viewer class for rendering and interacting with CAD models
 * using a WASM-compiled OpenCascade Technology (OCCT) kernel and Three.js for rendering.
 */
export class OpenCascadeWasmViewer {
    private canvas: HTMLCanvasElement;
    private oc: any; // The initialized OpenCascade module instance
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private models: Map<string, THREE.Object3D>;

    /**
     * @param canvas The HTML canvas element to render the 3D scene into.
     */
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.models = new Map();
    }

    /**
     * Initializes the viewer by loading the OpenCascade WASM module and setting up the 3D scene.
     * This method must be called before any other operations.
     */
    public async init(): Promise<void> {
        if (this.oc) {
            console.warn("Viewer already initialized.");
            return;
        }

        try {
            this.oc = await OpenCascade({
                locateFile: (file: string) => `/wasm/occt/${file}` // Adjust this path if needed
            });
            console.log("OpenCascade.js WASM module loaded successfully.");
        } catch (error) {
            console.error("Failed to load OpenCascade.js WASM module:", error);
            throw new Error("Initialization failed: Could not load OpenCascade module.");
        }

        this.setupScene();
        this.animate();
    }

    /**
     * Sets up the Three.js scene, camera, renderer, lights, and controls.
     */
    private setupScene(): void {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1c1c24);

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
        this.camera.position.set(100, 100, 150);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
        keyLight.position.set(-1, -1, 1).normalize();
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(1, 1, 1).normalize();
        this.scene.add(fillLight);
        
        const gridHelper = new THREE.GridHelper(200, 20, 0x555555, 0x333333);
        this.scene.add(gridHelper);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    private onWindowResize(): void {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Loads a CAD model from a STEP file content.
     * @param fileContent The content of the STEP file as a string or ArrayBuffer.
     * @param modelId A unique identifier for the model.
     * @returns A promise that resolves to true if the model was loaded successfully, false otherwise.
     */
    public async loadStepFile(fileContent: ArrayBuffer, modelId: string): Promise<boolean> {
        if (!this.oc) {
            console.error("OpenCascade module not initialized. Call init() first.");
            return false;
        }
        if (this.models.has(modelId)) {
            this.removeModel(modelId);
        }

        const fileName = `${modelId}.step`;
        try {
            this.oc.FS.writeFile(fileName, new Uint8Array(fileContent));

            const reader = new this.oc.STEPControl_Reader_1();
            const readStatus = reader.ReadFile(fileName);

            if (readStatus !== this.oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
                throw new Error("Failed to read STEP file.");
            }

            reader.TransferRoots(new this.oc.Message_ProgressRange_1());
            const shape = reader.OneShape();
            reader.delete();

            if (!shape || shape.IsNull()) {
                throw new Error("No valid shape found in the STEP file.");
            }

            const mesh = this.tessellateShape(shape);
            if (!mesh) {
                shape.delete();
                throw new Error("Failed to tessellate shape.");
            }

            const material = new THREE.MeshStandardMaterial({
                color: 0xdedede,
                metalness: 0.2,
                roughness: 0.7,
                side: THREE.DoubleSide,
            });

            const threeMesh = new THREE.Mesh(mesh, material);
            threeMesh.name = modelId;
            this.scene.add(threeMesh);
            this.models.set(modelId, threeMesh);

            shape.delete();
            this.oc.FS.unlink(fileName);

            this.fitCameraToSelection(threeMesh);
            return true;
        } catch (error) {
            console.error(`Error loading STEP file for model [${modelId}]:`, error);
            if (this.oc.FS.analyzePath(fileName).exists) {
                this.oc.FS.unlink(fileName);
            }
            return false;
        }
    }

    /**
     * Converts an OpenCascade TopoDS_Shape into a Three.js BufferGeometry by tessellating it.
     * @param shape The OpenCascade shape to process.
     * @returns A Three.js BufferGeometry or null if tessellation fails.
     */
    private tessellateShape(shape: any): THREE.BufferGeometry | null {
        // Set up the mesher
        new this.oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.5, true);

        const vertices: number[] = [];
        const normals: number[] = [];
        const indices: number[] = [];
        let vertexOffset = 0;

        const explorer = new this.oc.TopExp_Explorer_1(shape, this.oc.TopAbs_ShapeEnum.TopAbs_FACE, this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE);

        while (explorer.More()) {
            const face = this.oc.TopoDS.Face_1(explorer.Current());
            const location = new this.oc.TopLoc_Location_1();
            const triangulation = this.oc.BRep_Tool.Triangulation(face, location, 0);

            if (!triangulation.IsNull()) {
                const trsf = location.Transformation();
                const faceNormal = this.getFaceNormal(face);
                const isReversed = face.Orientation_1() === this.oc.TopAbs_Orientation.TopAbs_REVERSED;

                const nodeArray = triangulation.Nodes();
                const triArray = triangulation.Triangles();

                const localVertices = [];
                for (let i = 1; i <= nodeArray.Length(); i++) {
                    const p = nodeArray.Value(i);
                    p.Transform(trsf);
                    localVertices.push(p.X(), p.Y(), p.Z());
                }

                vertices.push(...localVertices);

                // OpenCascade doesn't always provide normals per-vertex
                // We'll calculate them with Three.js later
                
                for (let i = 1; i <= triArray.Length(); i++) {
                    const tri = triArray.Value(i);
                    const triIndices = tri.Get();
                    if (isReversed) {
                        indices.push(vertexOffset + triIndices[0] - 1, vertexOffset + triIndices[2] - 1, vertexOffset + triIndices[1] - 1);
                    } else {
                        indices.push(vertexOffset + triIndices[0] - 1, vertexOffset + triIndices[1] - 1, vertexOffset + triIndices[2] - 1);
                    }
                }
                
                vertexOffset += nodeArray.Length();
                
                triangulation.delete();
            }
            face.delete();
            location.delete();
            explorer.Next();
        }
        explorer.delete();

        if (vertices.length === 0) {
            return null;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals(); // Crucial for proper lighting

        return geometry;
    }

    private getFaceNormal(face: any): THREE.Vector3 {
        const surf = this.oc.BRep_Tool.Surface_2(face);
        const props = new this.oc.GProp_GProps_1();
        this.oc.BRepGProp.SurfaceProperties_1(face, props, 1, 1e-9);
        const mass = props.Mass();
        props.delete();
        if (mass < 1e-9) {
            return new THREE.Vector3(0,0,1); // fallback
        }
        const uvs = new this.oc.gp_Pnt2d_1();
        const pnt = new this.oc.gp_Pnt_1();
        const v1 = new this.oc.gp_Vec_1();
        const v2 = new this.oc.gp_Vec_1();
        surf.D1(uvs.X(), uvs.Y(), pnt, v1, v2);
        const normal = v1.Crossed(v2);
        const dir = new this.oc.gp_Dir_2(normal);
        const vec = new THREE.Vector3(dir.X(), dir.Y(), dir.Z());
        uvs.delete(); pnt.delete(); v1.delete(); v2.delete(); normal.delete(); dir.delete();
        return vec;
    }

    /**
     * Removes a model from the scene by its ID.
     * @param modelId The ID of the model to remove.
     * @returns True if the model was found and removed, false otherwise.
     */
    public removeModel(modelId: string): boolean {
        const model = this.models.get(modelId);
        if (model) {
            this.scene.remove(model);
            if (model instanceof THREE.Mesh) {
                model.geometry.dispose();
                if (Array.isArray(model.material)) {
                    model.material.forEach(m => m.dispose());
                } else {
                    model.material.dispose();
                }
            }
            this.models.delete(modelId);
            return true;
        }
        return false;
    }

    /**
     * Adjusts the camera to fit the specified object within the viewport.
     * @param object The THREE.Object3D to frame.
     * @param offset A multiplier to control the distance from the object.
     */
    public fitCameraToSelection(object: THREE.Object3D, offset: number = 1.5): void {
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= offset;

        this.camera.position.copy(center);
        this.camera.position.z += cameraZ;
        
        this.camera.far = this.camera.position.distanceTo(center) + maxDim * 2;
        this.camera.updateProjectionMatrix();

        if (this.controls) {
            this.controls.target.copy(center);
            this.controls.update();
        }
    }

    /**
     * Cleans up resources used by the viewer.
     */
    public dispose(): void {
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.models.forEach((_, id) => this.removeModel(id));
        this.renderer.dispose();
        this.controls.dispose();
        // The WASM module itself cannot be "disposed" easily, 
        // but we can clear our reference.
        this.oc = null;
    }
}
