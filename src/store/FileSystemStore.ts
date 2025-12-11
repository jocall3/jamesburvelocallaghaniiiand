```typescript
export interface FileSystemEntry {
    path: string;
    name: string;
    type: 'file' | 'directory';
    content: string | ArrayBuffer | null;
    lastModified: number;
    size: number;
}

export class FileSystemStore {
    private dbName: string = 'VirtualFileSystem';
    private storeName: string = 'fs_entries';
    private version: number = 1;
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void>;

    constructor() {
        this.initPromise = this.openDatabase();
    }

    private openDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    // Create object store with 'path' as the key
                    db.createObjectStore(this.storeName, { keyPath: 'path' });
                }
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onerror = (event) => {
                console.error('FileSystemStore DB Error:', (event.target as IDBOpenDBRequest).error);
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    private async getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
        await this.initPromise;
        if (!this.db) {
            throw new Error('Database is not initialized.');
        }
        const transaction = this.db.transaction([this.storeName], mode);
        return transaction.objectStore(this.storeName);
    }

    private normalizePath(path: string): string {
        // Ensure path starts with / and does not end with / unless it is root
        let normalized = path.trim().replace(/\\/g, '/');
        if (!normalized.startsWith('/')) {
            normalized = '/' + normalized;
        }
        if (normalized.length > 1 && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }
        return normalized;
    }

    private getNameFromPath(path: string): string {
        if (path === '/') return 'root';
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private getParentPath(path: string): string {
        if (path === '/') return '/';
        const lastSlash = path.lastIndexOf('/');
        if (lastSlash === 0) return '/';
        return path.substring(0, lastSlash);
    }

    /**
     * Checks if a file or directory exists at the given path.
     */
    public async exists(path: string): Promise<boolean> {
        const normalizedPath = this.normalizePath(path);
        const store = await this.getStore('readonly');
        return new Promise((resolve, reject) => {
            const request = store.count(normalizedPath);
            request.onsuccess = () => resolve(request.result > 0);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Retrieves metadata and content for a specific path.
     */
    public async getEntry(path: string): Promise<FileSystemEntry | undefined> {
        const normalizedPath = this.normalizePath(path);
        const store = await this.getStore('readonly');
        return new Promise((resolve, reject) => {
            const request = store.get(normalizedPath);
            request.onsuccess = () => resolve(request.result as FileSystemEntry);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Writes a file to the virtual file system. 
     * Creates parent directories if they do not exist.
     */
    public async writeFile(path: string, content: string | ArrayBuffer): Promise<void> {
        const normalizedPath = this.normalizePath(path);
        const parentPath = this.getParentPath(normalizedPath);
        
        // Ensure parent exists
        if (parentPath !== '/' && !(await this.exists(parentPath))) {
            await this.createDirectory(parentPath);
        }

        const name = this.getNameFromPath(normalizedPath);
        const size = typeof content === 'string' ? content.length : content.byteLength;

        const entry: FileSystemEntry = {
            path: normalizedPath,
            name: name,
            type: 'file',
            content: content,
            lastModified: Date.now(),
            size: size
        };

        const store = await this.getStore('readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Creates a directory. Creates parent directories recursively if needed.
     */
    public async createDirectory(path: string): Promise<void> {
        const normalizedPath = this.normalizePath(path);
        if (await this.exists(normalizedPath)) return;

        const parentPath = this.getParentPath(normalizedPath);
        if (parentPath !== '/' && !(await this.exists(parentPath))) {
            await this.createDirectory(parentPath);
        }

        const entry: FileSystemEntry = {
            path: normalizedPath,
            name: this.getNameFromPath(normalizedPath),
            type: 'directory',
            content: null,
            lastModified: Date.now(),
            size: 0
        };

        const store = await this.getStore('readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Lists immediate children of a directory.
     */
    public async listDirectory(path: string): Promise<FileSystemEntry[]> {
        const normalizedPath = this.normalizePath(path);
        const store = await this.getStore('readonly');
        
        // Define the range for children.
        // Assuming path is "/foo", children start with "/foo/"
        const prefix = normalizedPath === '/' ? '/' : normalizedPath + '/';
        const range = IDBKeyRange.bound(prefix, prefix + '\uffff', false, false);

        return new Promise((resolve, reject) => {
            const request = store.openCursor(range);
            const children: FileSystemEntry[] = [];
            
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    const entryPath = cursor.value.path as string;
                    // Check if it is a direct child (no extra slashes after prefix)
                    const relativePath = entryPath.substring(prefix.length);
                    if (!relativePath.includes('/')) {
                        children.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(children);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Deletes a file or directory. If directory, deletes recursively.
     */
    public async delete(path: string): Promise<void> {
        const normalizedPath = this.normalizePath(path);
        const entry = await this.getEntry(normalizedPath);

        if (!entry) return;

        const store = await this.getStore('readwrite');

        if (entry.type === 'file') {
            return new Promise((resolve, reject) => {
                const request = store.delete(normalizedPath);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } else {
            // Recursive delete for directory
            const prefix = normalizedPath === '/' ? '/' : normalizedPath + '/';
            const range = IDBKeyRange.bound(normalizedPath, prefix + '\uffff', false, false);

            return new Promise((resolve, reject) => {
                const request = store.delete(range);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    /**
     * Renames or moves a file/directory.
     */
    public async move(oldPath: string, newPath: string): Promise<void> {
        const srcPath = this.normalizePath(oldPath);
        const destPath = this.normalizePath(newPath);

        const entry = await this.getEntry(srcPath);
        if (!entry) throw new Error(`Source path not found: ${srcPath}`);

        if (await this.exists(destPath)) {
            throw new Error(`Destination path already exists: ${destPath}`);
        }

        if (entry.type === 'file') {
            await this.writeFile(destPath, entry.content!);
            await this.delete(srcPath);
        } else {
            // Move directory: copy structure, then delete old
            const children = await this.getAllDescendants(srcPath);
            
            // Create new directory
            await this.createDirectory(destPath);

            // Move children
            for (const child of children) {
                const childRelPath = child.path.substring(srcPath.length);
                const newChildPath = destPath + childRelPath;
                if (child.type === 'directory') {
                    await this.createDirectory(newChildPath);
                } else {
                    await this.writeFile(newChildPath, child.content!);
                }
            }
            
            // Delete old directory tree
            await this.delete(srcPath);
        }
    }

    /**
     * Helper to get all descendants for recursive operations (like move).
     */
    private async getAllDescendants(path: string): Promise<FileSystemEntry[]> {
        const normalizedPath = this.normalizePath(path);
        const store = await this.getStore('readonly');
        const prefix = normalizedPath === '/' ? '/' : normalizedPath + '/';
        const range = IDBKeyRange.bound(prefix, prefix + '\uffff', true, false); // Exclude the directory itself

        return new Promise((resolve, reject) => {
            const request = store.getAll(range);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clears the entire file system.
     */
    public async clear(): Promise<void> {
        const store = await this.getStore('readwrite');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}
```