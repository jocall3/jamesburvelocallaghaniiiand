```typescript
// src/kernel/virtual_file_system.ts

// --- Placeholder types for external libraries ---
// In a real project, these would be imported from 'ipfs-core-types', 'yjs', etc.
declare type IPFS = {
    add(content: Uint8Array): Promise<{ cid: CID }>;
    cat(cid: CID): AsyncGenerator<Uint8Array>;
};
declare type CID = { toString(): string; };
declare namespace Y {
    class Doc {
        getMap<T>(name: string): Map<T>;
        getText(name: string): Text;
    }
    class Map<T> {
        set(key: string, value: T): void;
        get(key: string): T | undefined;
        delete(key: string): void;
        keys(): IterableIterator<string>;
        toJSON(): Record<string, T>;
    }
    class Text {
        insert(index: number, content: string): void;
        delete(index: number, length: number): void;
        toString(): string;
        toDelta(): any[];
        length: number;
    }
}

// --- Core VFS Types ---

export type Path = string;
export type VFSNodeType = 'file' | 'directory';

/**
 * Metadata associated with a VFS node.
 */
export interface VFSNodeMetadata {
    type: VFSNodeType;
    creationTime: number;
    modificationTime: number;
    size: number; // For files, size in bytes. For directories, number of children.
    // Permissions, owner, etc. could be added here.
}

/**
 * Represents the serialized state of a node within a directory's CRDT Map.
 */
export interface SerializedVFSNode {
    type: VFSNodeType;
    backendType?: ContentBackendType; // Only for files
    handle: string; // CID string for IPFS, Yjs guid for CRDTs
    metadata: Omit<VFSNodeMetadata, 'type'>;
}


// --- Content Backends ---

export type ContentBackendType = 'ipfs-immutable' | 'yjs-text' | 'raw-bytes';

/**
 * Abstract interface for handling the content of a file.
 * This allows swapping between immutable storage like IPFS and mutable CRDTs.
 */
export interface IContentBackend<T> {
    readonly type: ContentBackendType;
    handle: T;
    read(): Promise<Uint8Array>;
    write(data: Uint8Array): Promise<void>;
    getSize(): Promise<number>;
}

/**
 * IPFS-backed content storage for immutable files.
 */
export class IPFSImmutableBackend implements IContentBackend<CID> {
    public readonly type = 'ipfs-immutable';
    public handle: CID;

    constructor(private ipfs: IPFS, handle: CID) {
        this.handle = handle;
    }

    static async create(ipfs: IPFS, data: Uint8Array): Promise<IPFSImmutableBackend> {
        const { cid } = await ipfs.add(data);
        return new IPFSImmutableBackend(ipfs, cid);
    }

    async read(): Promise<Uint8Array> {
        const chunks = [];
        for await (const chunk of this.ipfs.cat(this.handle)) {
            chunks.push(chunk);
        }
        // This is a simplified way to concat; a more robust solution would be needed for large files.
        return new Uint8Array(chunks.flatMap(chunk => [...chunk]));
    }

    async write(_data: Uint8Array): Promise<void> {
        throw new Error("Cannot write to an immutable IPFS backend.");
    }

    async getSize(): Promise<number> {
        // IPFS stat would be more efficient, but this works as a fallback
        const data = await this.read();
        return data.byteLength;
    }
}

/**
 * Yjs.Text-backed content storage for collaborative text files.
 */
export class YjsTextBackend implements IContentBackend<Y.Text> {
    public readonly type = 'yjs-text';
    public handle: Y.Text;

    constructor(handle: Y.Text) {
        this.handle = handle;
    }

    static create(doc: Y.Doc, data: Uint8Array, guid?: string): YjsTextBackend {
        const text = doc.getText(guid || `y-text-${Date.now()}-${Math.random()}`);
        const content = new TextDecoder().decode(data);
        if (text.length > 0) {
            text.delete(0, text.length);
        }
        text.insert(0, content);
        return new YjsTextBackend(text);
    }

    async read(): Promise<Uint8Array> {
        return new TextEncoder().encode(this.handle.toString());
    }

    async write(data: Uint8Array): Promise<void> {
        const content = new TextDecoder().decode(data);
        // Replace entire content for simplicity. A diffing approach would be better.
        this.handle.delete(0, this.handle.length);
        this.handle.insert(0, content);
    }

    async getSize(): Promise<number> {
        // This is char length, not byte length. For a more accurate size, encode it.
        return new TextEncoder().encode(this.handle.toString()).byteLength;
    }
}


// --- VFS Node Classes ---

/**
 * Base class for all nodes in the Virtual File System.
 */
export abstract class VFSNode {
    constructor(
        public readonly vfs: VFS,
        public readonly name: string,
        public readonly path: Path,
        public readonly metadata: VFSNodeMetadata,
    ) {}

    abstract get type(): VFSNodeType;
}

/**
 * Represents a file in the VFS.
 */
export class FileNode<T> extends VFSNode {
    public readonly type: VFSNodeType = 'file';

    constructor(
        vfs: VFS,
        name: string,
        path: Path,
        metadata: VFSNodeMetadata,
        public readonly backend: IContentBackend<T>,
    ) {
        super(vfs, name, path, metadata);
    }
}

/**
 * Represents a directory in the VFS.
 * Its contents are stored in a Y.Map to support collaborative changes.
 */
export class DirectoryNode extends VFSNode {
    public readonly type: VFSNodeType = 'directory';

    constructor(
        vfs: VFS,
        name: string,
        path: Path,
        metadata: VFSNodeMetadata,
        public readonly crdtMap: Y.Map<SerializedVFSNode>,
    ) {
        super(vfs, name, path, metadata);
    }

    /**
     * Lists the names of the children in this directory.
     */
    async ls(): Promise<string[]> {
        return Array.from(this.crdtMap.keys());
    }

    /**
     * Retrieves a child node by its name.
     * @param name - The name of the child node.
     * @returns The VFSNode if found, otherwise null.
     */
    async getChild(name: string): Promise<VFSNode | null> {
        const serializedChild = this.crdtMap.get(name);
        if (!serializedChild) {
            return null;
        }

        const childPath = this.vfs.path.join(this.path, name);
        return this.vfs.deserializeNode(name, childPath, serializedChild);
    }
}


// --- Main VFS Class ---

export class VFS {
    public readonly root: DirectoryNode;

    constructor(
        public readonly ipfs: IPFS,
        public readonly ydoc: Y.Doc
    ) {
        const rootMap = this.ydoc.getMap<SerializedVFSNode>('vfs-root');
        const rootMetadata: VFSNodeMetadata = {
            type: 'directory',
            creationTime: Date.now(),
            modificationTime: Date.now(),
            size: 0,
        };
        this.root = new DirectoryNode(this, '/', '/', rootMetadata, rootMap);
    }

    /**
     * Resolves a path to a node.
     * @param path - The path string to resolve.
     * @returns The VFSNode if the path is valid, otherwise null.
     */
    public async get(path: Path): Promise<VFSNode | null> {
        const segments = this.path.normalize(path).split('/').filter(Boolean);
        if (segments.length === 0) {
            return this.root;
        }
        let currentNode: VFSNode = this.root;

        for (const segment of segments) {
            if (currentNode.type !== 'directory') {
                return null; // Cannot traverse through a file
            }
            const dirNode = currentNode as DirectoryNode;
            const nextNode = await dirNode.getChild(segment);
            if (!nextNode) {
                return null; // Path segment not found
            }
            currentNode = nextNode;
        }
        return currentNode;
    }

    /**
     * Creates a directory at the specified path.
     */
    public async mkdir(path: Path): Promise<DirectoryNode> {
        const { parent, name } = await this._resolveParent(path);
        
        if (parent.crdtMap.get(name)) {
            throw new Error(`Path already exists: ${path}`);
        }

        const handle = `vfs-dir-${Date.now()}-${Math.random()}`;
        const newMap = this.ydoc.getMap<SerializedVFSNode>(handle);
        const now = Date.now();
        const serialized: SerializedVFSNode = {
            type: 'directory',
            handle: handle,
            metadata: {
                creationTime: now,
                modificationTime: now,
                size: 0,
            }
        };

        parent.crdtMap.set(name, serialized);
        const newPath = this.path.join(parent.path, name);
        return (await this.deserializeNode(name, newPath, serialized)) as DirectoryNode;
    }

    /**
     * Writes data to a file at the specified path, creating it if it doesn't exist.
     */
    public async writeFile(path: Path, data: Uint8Array, backendType: ContentBackendType = 'yjs-text'): Promise<FileNode<any>> {
        const { parent, name } = await this._resolveParent(path);
        
        const existingSerialized = parent.crdtMap.get(name);
        if (existingSerialized && existingSerialized.type === 'directory') {
            throw new Error(`Cannot write file over a directory: ${path}`);
        }

        const now = Date.now();
        let handle: string;
        let backend: IContentBackend<any>;

        switch(backendType) {
            case 'ipfs-immutable':
                backend = await IPFSImmutableBackend.create(this.ipfs, data);
                handle = backend.handle.toString();
                break;
            case 'yjs-text':
                const yHandle = existingSerialized?.handle || `y-text-${Date.now()}-${Math.random()}`;
                const yText = this.ydoc.getText(yHandle);
                backend = new YjsTextBackend(yText);
                await backend.write(data);
                handle = yHandle;
                break;
            default:
                throw new Error(`Unsupported backend type: ${backendType}`);
        }

        const serialized: SerializedVFSNode = {
            type: 'file',
            backendType: backend.type,
            handle: handle,
            metadata: {
                creationTime: existingSerialized?.metadata.creationTime || now,
                modificationTime: now,
                size: data.byteLength,
            }
        };

        parent.crdtMap.set(name, serialized);
        const newPath = this.path.join(parent.path, name);
        return new FileNode(this, name, newPath, { ...serialized.metadata, type: 'file' }, backend);
    }
    
    /**
     * Reads the content of a file at the specified path.
     */
    public async readFile(path: Path): Promise<Uint8Array> {
        const node = await this.get(path);
        if (!node) {
            throw new Error(`File not found: ${path}`);
        }
        if (node.type !== 'file') {
            throw new Error(`Path is not a file: ${path}`);
        }
        const fileNode = node as FileNode<any>;
        return fileNode.backend.read();
    }

    /**
     * Lists the contents of a directory.
     */
    public async ls(path: Path): Promise<string[]> {
        const node = await this.get(path);
        if (!node) {
            throw new Error(`Directory not found: ${path}`);
        }
        if (node.type !== 'directory') {
            throw new Error(`Path is not a directory: ${path}`);
        }
        return (node as DirectoryNode).ls();
    }

    /**
     * Removes a file or directory.
     */
    public async rm(path: Path): Promise<void> {
        const { parent, name } = await this._resolveParent(path);
        const target = parent.crdtMap.get(name);
        
        if (!target) {
            throw new Error(`Path not found: ${path}`);
        }
        
        // TODO: Implement recursive delete for directories.
        if (target.type === 'directory') {
            const dirNode = await this.get(path) as DirectoryNode;
            if (dirNode && (await dirNode.ls()).length > 0) {
                throw new Error(`Directory not empty: ${path}`);
            }
        }
        
        parent.crdtMap.delete(name);
    }

    /**
     * Helper to resolve the parent directory and the final path segment name.
     */
    private async _resolveParent(path: Path): Promise<{ parent: DirectoryNode, name: string }> {
        const normalized = this.path.normalize(path);
        const parentPath = this.path.dirname(normalized);
        const name = this.path.basename(normalized);

        if (name === '') {
            throw new Error("Invalid path: cannot operate on root or empty path component.");
        }

        const parentNode = await this.get(parentPath);
        if (!parentNode) {
            throw new Error(`Parent directory not found: ${parentPath}`);
        }
        if (parentNode.type !== 'directory') {
            throw new Error(`Parent path is not a directory: ${parentPath}`);
        }
        return { parent: parentNode as DirectoryNode, name };
    }


    /**
     * Deserializes a node from its stored representation in a directory's CRDT Map.
     */
    public async deserializeNode(name: string, path: Path, serialized: SerializedVFSNode): Promise<VFSNode> {
        const metadata: VFSNodeMetadata = { ...serialized.metadata, type: serialized.type };

        if (serialized.type === 'directory') {
            const map = this.ydoc.getMap<SerializedVFSNode>(serialized.handle);
            return new DirectoryNode(this, name, path, metadata, map);
        } else {
            let backend: IContentBackend<any>;
            switch (serialized.backendType) {
                case 'ipfs-immutable':
                    // This is a simplification as a CID object is not directly serializable.
                    // A real implementation would use CID.parse() from the 'multiformats' library.
                    const cid = { toString: () => serialized.handle } as CID; 
                    backend = new IPFSImmutableBackend(this.ipfs, cid);
                    break;
                case 'yjs-text':
                    const text = this.ydoc.getText(serialized.handle);
                    backend = new YjsTextBackend(text);
                    break;
                default:
                    throw new Error(`Unknown backend type during deserialization: ${serialized.backendType}`);
            }
            return new FileNode(this, name, path, metadata, backend);
        }
    }

    // Simple path manipulation utilities. A dedicated library might be better.
    public path = {
        join: (...args: string[]): string => {
            const path = '/' + args.join('/').replace(/\/+/g, '/');
            return path.length > 1 ? path.replace(/\/$/, '') : path;
        },
        dirname: (p: Path): string => {
            const lastSlash = p.lastIndexOf('/');
            if (lastSlash <= 0) return '/';
            return p.substring(0, lastSlash);
        },
        basename: (p: Path): string => {
            const lastSlash = p.lastIndexOf('/');
            return p.substring(lastSlash + 1);
        },
        normalize: (p: Path): string => {
            if (!p || p === '/') return '/';
            return this.path.join(p);
        }
    };
}
```