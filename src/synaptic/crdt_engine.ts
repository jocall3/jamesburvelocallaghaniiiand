import * as Y from 'yjs';
import * as Automerge from '@automerge/automerge';
import { EventEmitter } from 'events';

// --- Common Interfaces and Types ---

/**
 * Represents the type of CRDT engine to use.
 */
export type CrdtEngineType = 'yjs' | 'automerge';

/**
 * Represents a generic CRDT document provider.
 * This abstracts away the differences between Yjs and Automerge.
 */
interface CrdtProvider<T> {
    /**
     * Initializes the CRDT document.
     * @param docId A unique identifier for the document.
     * @param initialData Optional initial data to populate the document.
     */
    init(docId: string, initialData?: T): void;

    /**
     * Returns the current state of the document as a plain JavaScript object.
     */
    getState(): T;

    /**
     * Applies a binary update received from a remote source.
     * @param update The binary update payload.
     * @param origin An optional string to identify the source of the update (e.g., 'server', 'peer').
     */
    applyUpdate(update: Uint8Array, origin?: string): void;

    /**
     * Generates a binary update representing the changes that need to be sent to a remote source.
     * This method might also update internal sync state for providers like Automerge.
     */
    generateUpdate(): Uint8Array;

    /**
     * Applies a local change to the document.
     * This method ensures the change is correctly integrated into the CRDT structure
     * and triggers necessary events for state changes.
     * @param fn A function that receives the mutable document/root object to apply changes.
     * @param origin An optional string to identify the source of the change (e.g., 'local').
     */
    applyLocalChange(fn: (doc: T) => void, origin?: string): void;

    /**
     * Adds an event listener for document changes.
     * @param event The event name (e.g., 'update', 'change').
     * @param listener The callback function.
     */
    on(event: string, listener: (...args: any[]) => void): void;

    /**
     * Removes an event listener.
     * @param event The event name.
     * @param listener The callback function.
     */
    off(event: string, listener: (...args: any[]) => void): void;
}

// --- Yjs Provider Implementation ---

class YjsProvider<T extends Record<string, any>> extends EventEmitter implements CrdtProvider<T> {
    private doc!: Y.Doc;
    private docId!: string;

    constructor() {
        super();
        this.setMaxListeners(0); // Set max listeners to 0 for unlimited listeners
    }

    init(docId: string, initialData?: T): void {
        if (this.doc) {
            this.doc.destroy();
        }
        this.docId = docId;
        this.doc = new Y.Doc({ guid: docId });

        if (initialData) {
            this.doc.transact(() => {
                const rootMap = this.doc.getMap('root');
                for (const key in initialData) {
                    if (Object.prototype.hasOwnProperty.call(initialData, key)) {
                        this.assignToYMap(rootMap, key, initialData[key]);
                    }
                }
            }, 'initialization');
        }

        // Listen for all Yjs updates (local or remote)
        this.doc.on('updateV2', (update: Uint8Array, origin: any) => {
            const source = origin === 'local' || origin === 'initialization' ? 'local' : 'remote';
            this.emit('update', update, source);
            // Also emit a general change event with the current state for UI updates
            this.emit('change', this.getState(), this.docId, source);
        });
    }

    getState(): T {
        return this.yjsToJs(this.doc.getMap('root')) as T;
    }

    applyUpdate(update: Uint8Array, origin?: string): void {
        Y.applyUpdateV2(this.doc, update, origin || 'remote');
    }

    generateUpdate(): Uint8Array {
        // Generates an update containing all changes since the beginning of time.
        // For more efficient sync (diffs), one would typically use `Y.encodeStateAsUpdateV2(doc, stateVector)`
        // where `stateVector` is the last known state of the remote peer.
        // In authoritative mode, client might send full state or just incremental changes.
        // For simplicity, this provides a full state update.
        return Y.encodeStateAsUpdateV2(this.doc);
    }

    applyLocalChange(fn: (doc: T) => void, origin?: string): void {
        this.doc.transact(() => {
            const proxyDoc: T = this.createYjsProxy(this.doc.getMap('root'));
            fn(proxyDoc);
        }, origin || 'local');
    }

    // --- Yjs Helper and Proxy Methods ---

    /**
     * Recursively converts a Yjs type (Y.Map, Y.Array, Y.Text) to a plain JavaScript object/array/string.
     */
    private yjsToJs(ytype: Y.Map<any> | Y.Array<any> | Y.Text | any): any {
        if (ytype instanceof Y.Map) {
            const obj: Record<string, any> = {};
            ytype.forEach((value, key) => {
                obj[key] = this.yjsToJs(value);
            });
            return obj;
        } else if (ytype instanceof Y.Array) {
            return ytype.map(item => this.yjsToJs(item));
        } else if (ytype instanceof Y.Text) {
            return ytype.toString();
        } else {
            return ytype;
        }
    }

    /**
     * Recursively assigns a plain JS object/array to a Y.Map/Y.Array.
     */
    private assignToYMap(ymap: Y.Map<any>, key: string, value: any): void {
        if (Array.isArray(value)) {
            let yarray = ymap.get(key);
            if (!(yarray instanceof Y.Array)) {
                yarray = new Y.Array();
                ymap.set(key, yarray);
            } else {
                yarray.delete(0, yarray.length); // Clear existing array
            }
            value.forEach(item => yarray.push([this.convertToYjsType(item)]));
        } else if (typeof value === 'object' && value !== null) {
            if (value.constructor === Object) { // Only process plain objects
                let subMap = ymap.get(key);
                if (!(subMap instanceof Y.Map)) {
                    subMap = new Y.Map();
                    ymap.set(key, subMap);
                }
                for (const subKey in value) {
                    if (Object.prototype.hasOwnProperty.call(value, subKey)) {
                        this.assignToYMap(subMap, subKey, (value as any)[subKey]);
                    }
                }
            } else {
                ymap.set(key, value); // Store other object types directly
            }
        } else {
            ymap.set(key, value);
        }
    }

    /**
     * Converts a plain JS value to its Yjs equivalent for setting within Y.Map/Y.Array.
     * This is used by the proxies to ensure correct Yjs types are stored.
     */
    private convertToYjsType(value: any): any {
        if (Array.isArray(value)) {
            const yarray = new Y.Array();
            value.forEach(item => yarray.push([this.convertToYjsType(item)]));
            return yarray;
        } else if (typeof value === 'object' && value !== null) {
            if (value.constructor === Object) {
                const ymap = new Y.Map();
                for (const key in value) {
                    if (Object.prototype.hasOwnProperty.call(value, key)) {
                        ymap.set(key, this.convertToYjsType((value as any)[key]));
                    }
                }
                return ymap;
            }
        }
        return value;
    }

    /**
     * Creates a proxy around a Y.Map to make it behave more like a plain JavaScript object.
     * This allows for object property access, assignment, and deletion.
     */
    private createYjsProxy(ymap: Y.Map<any>): T {
        const self = this;
        const proxyHandler: ProxyHandler<Y.Map<any>> = {
            get: (target, prop, receiver) => {
                if (typeof prop === 'string') {
                    const value = target.get(prop);
                    if (value instanceof Y.Map) {
                        return self.createYjsMapProxy(value);
                    }
                    if (value instanceof Y.Array) {
                        return self.createYjsArrayProxy(value);
                    }
                    return value;
                }
                return Reflect.get(target, prop, receiver);
            },
            set: (target, prop, value, receiver) => {
                if (typeof prop === 'string') {
                    // Smart conversion: if existing Y.Map/Y.Array, try to merge/update
                    // otherwise, create new Y.Map/Y.Array or set primitive.
                    if (Array.isArray(value)) {
                        let yarray = target.get(prop);
                        if (!(yarray instanceof Y.Array)) {
                            yarray = new Y.Array();
                            target.set(prop, yarray);
                        } else {
                            yarray.delete(0, yarray.length); // Clear existing
                        }
                        value.forEach(item => yarray.push([self.convertToYjsType(item)]));
                    } else if (typeof value === 'object' && value !== null && value.constructor === Object) {
                        let ymapChild = target.get(prop);
                        if (!(ymapChild instanceof Y.Map)) {
                            ymapChild = new Y.Map();
                            target.set(prop, ymapChild);
                        }
                        // Simple merge for objects - iterate and set. Existing keys will be overwritten. New keys added.
                        // Missing keys in new value that exist in ymapChild are NOT deleted here for simplicity.
                        for (const key in value) {
                            if (Object.prototype.hasOwnProperty.call(value, key)) {
                                (self as any).assignToYMap(ymapChild, key, (value as any)[key]);
                            }
                        }
                    } else {
                        target.set(prop, self.convertToYjsType(value));
                    }
                    return true;
                }
                return Reflect.set(target, prop, value, receiver);
            },
            deleteProperty: (target, prop) => {
                if (typeof prop === 'string') {
                    target.delete(prop);
                    return true;
                }
                return Reflect.deleteProperty(target, prop);
            },
            has: (target, prop) => typeof prop === 'string' ? target.has(prop) : Reflect.has(target, prop),
            ownKeys: (target) => Array.from(target.keys()),
            getOwnPropertyDescriptor: (target, prop) => {
                if (typeof prop === 'string' && target.has(prop)) {
                    return { value: target.get(prop), writable: true, enumerable: true, configurable: true };
                }
                return undefined;
            }
        };
        return new Proxy(ymap, proxyHandler) as T;
    }

    /**
     * Creates a proxy around a nested Y.Map.
     */
    private createYjsMapProxy(ymap: Y.Map<any>): any {
        return this.createYjsProxy(ymap); // Reuse the same logic for nested maps
    }

    /**
     * Creates a proxy around a Y.Array to make it behave more like a plain JavaScript array.
     * This intercepts array methods like push, pop, splice, and direct index access.
     */
    private createYjsArrayProxy(yarray: Y.Array<any>): any {
        const self = this;
        const proxyHandler: ProxyHandler<Y.Array<any>> = {
            get: (target, prop, receiver) => {
                if (typeof prop === 'string') {
                    const numProp = Number(prop);
                    if (!isNaN(numProp) && String(numProp) === prop) { // Is a numeric index
                        const value = target.get(numProp);
                        if (value instanceof Y.Map) return self.createYjsMapProxy(value);
                        if (value instanceof Y.Array) return self.createYjsArrayProxy(value);
                        return value;
                    }

                    // Intercept common array methods
                    switch (prop) {
                        case 'push': return (...args: any[]) => target.push(args.map(item => self.convertToYjsType(item)));
                        case 'pop': return () => target.pop();
                        case 'unshift': return (...args: any[]) => target.unshift(args.map(item => self.convertToYjsType(item)));
                        case 'shift': return () => target.shift();
                        case 'splice': return (index: number, deleteCount: number, ...items: any[]) =>
                            target.splice(index, deleteCount, items.map(item => self.convertToYjsType(item)));
                        case 'insert': return (index: number, items: any[]) => // Yjs specific
                            target.insert(index, items.map(item => self.convertToYjsType(item)));
                        case 'length': return target.length;
                        case 'toJSON': return () => self.yjsToJs(target); // For easier serialization
                        // For other methods that might return new arrays (map, filter),
                        // convert the Y.Array to a JS array first, then apply the method
                        case 'map':
                        case 'filter':
                        case 'reduce':
                        case 'forEach':
                            const jsArray = self.yjsToJs(target);
                            return (...args: any[]) => (jsArray as any)[prop](...args);
                    }
                }
                // Fallback for other properties, including native array methods not overridden
                const originalMethod = Reflect.get(target, prop, receiver);
                if (typeof originalMethod === 'function') {
                    return originalMethod.bind(target);
                }
                return originalMethod;
            },
            set: (target, prop, value, receiver) => {
                if (typeof prop === 'string' && !isNaN(Number(prop)) && String(Number(prop)) === prop) {
                    const index = Number(prop);
                    if (index >= 0 && index <= target.length) {
                        if (index < target.length) {
                            target.delete(index, 1);
                        }
                        target.insert(index, [self.convertToYjsType(value)]);
                        return true;
                    }
                    console.warn(`Attempted to set Y.Array element at index ${index} out of bounds.`);
                    return false;
                }
                return Reflect.set(target, prop, value, receiver);
            },
            deleteProperty: (target, prop) => {
                if (typeof prop === 'string' && !isNaN(Number(prop)) && String(Number(prop)) === prop) {
                    const index = Number(prop);
                    if (index >= 0 && index < target.length) {
                        target.delete(index, 1);
                        return true;
                    }
                    return false;
                }
                return Reflect.deleteProperty(target, prop);
            },
            has: (target, prop) => typeof prop === 'string' && !isNaN(Number(prop)) ? Number(prop) >= 0 && Number(prop) < target.length : Reflect.has(target, prop),
            ownKeys: (target) => {
                const keys: (string | symbol)[] = [];
                for (let i = 0; i < target.length; i++) {
                    keys.push(String(i));
                }
                return keys;
            },
            getOwnPropertyDescriptor: (target, prop) => {
                if (typeof prop === 'string' && !isNaN(Number(prop)) && String(Number(prop)) === prop) {
                    const index = Number(prop);
                    if (index >= 0 && index < target.length) {
                        return { value: target.get(index), writable: true, enumerable: true, configurable: true };
                    }
                }
                return undefined;
            }
        };
        return new Proxy(yarray, proxyHandler);
    }
}

// --- Automerge Provider Implementation ---

class AutomergeProvider<T extends Record<string, any>> extends EventEmitter implements CrdtProvider<T> {
    private doc!: Automerge.Doc<T>;
    private docId!: string;
    private syncState!: Automerge.SyncState; // Client's SyncState with the server

    constructor() {
        super();
        this.setMaxListeners(0);
    }

    init(docId: string, initialData?: T): void {
        this.docId = docId;
        this.doc = Automerge.from<T>(initialData || {} as T);
        this.syncState = Automerge.initSyncState(); // Initialize client's sync state

        // Emit initial state
        this.emit('change', this.getState(), this.docId, 'initialization');
    }

    getState(): T {
        return this.doc; // Automerge doc is directly accessible as a plain JS object
    }

    applyUpdate(update: Uint8Array, origin?: string): void {
        const oldDoc = this.doc;
        // Automerge.receiveSyncMessage returns a tuple: [newDoc, newSyncState, patch]
        const [newDoc, newSyncState, patch] = Automerge.receiveSyncMessage(this.doc, this.syncState, update);

        // Update the document and sync state
        this.doc = newDoc;
        this.syncState = newSyncState;

        if (this.doc !== oldDoc) { // Check if the document reference actually changed (indicating modification)
            this.emit('update', update, origin || 'remote');
            this.emit('change', this.getState(), this.docId, origin || 'remote');
        }
    }

    generateUpdate(): Uint8Array {
        // Generates a sync message to send to the server.
        // It updates the client's sync state based on what it's generating.
        const [newSyncState, message] = Automerge.generateSyncMessage(this.syncState, this.doc);
        this.syncState = newSyncState; // Update client's sync state after generating message
        return message || new Uint8Array(); // message can be null if no changes to send
    }

    applyLocalChange(fn: (doc: T) => void, origin?: string): void {
        const oldDoc = this.doc;
        // Automerge.change ensures immutability; a new doc is returned if changes are made.
        this.doc = Automerge.change(this.doc, origin || 'local', fn);

        if (this.doc !== oldDoc) { // If a change actually occurred
            // A local change happened. The CrdtEngine will call getLocalUpdate()
            // when it's time to send these changes. For now, we only emit the 'change' event for UI updates.
            this.emit('change', this.getState(), this.docId, origin || 'local');
            // An 'update' event (binary payload) for local changes will be explicitly
            // triggered when `CrdtEngine.getLocalUpdate()` is called by the application.
            // This aligns with "authoritative mode" where updates are sent on demand.
        }
    }
}


// --- Main CRDT Engine ---

/**
 * The CrdtEngine provides an abstraction layer over different CRDT implementations
 * (Yjs, Automerge) for managing shared document states in an authoritative sync model.
 */
export class CrdtEngine<T extends Record<string, any>> extends EventEmitter {
    private provider!: CrdtProvider<T>;
    public readonly docId: string;
    public readonly type: CrdtEngineType;

    /**
     * Creates an instance of CrdtEngine.
     * @param docId A unique identifier for the CRDT document.
     * @param type The type of CRDT engine to use ('yjs' or 'automerge').
     * @param initialData Optional initial data to populate the document.
     */
    constructor(docId: string, type: CrdtEngineType, initialData?: T) {
        super();
        this.setMaxListeners(0); // Unlimited listeners
        this.docId = docId;
        this.type = type;

        switch (type) {
            case 'yjs':
                this.provider = new YjsProvider<T>();
                break;
            case 'automerge':
                this.provider = new AutomergeProvider<T>();
                break;
            default:
                throw new Error(`Unsupported CRDT engine type: ${type}`);
        }

        this.provider.init(docId, initialData);

        // Forward events from the provider
        this.provider.on('update', (update: Uint8Array, origin: 'local' | 'remote') => {
            /**
             * Emitted when a binary update is generated or applied.
             * This update should be sent to or received from the authoritative server.
             * @event CrdtEngine#update
             * @type {object}
             * @property {Uint8Array} update The binary CRDT update.
             * @property {'local' | 'remote' | 'initialization'} origin Indicates if the update originated locally or was applied from a remote source.
             */
            this.emit('update', update, origin);
        });

        this.provider.on('change', (newState: T, docId: string, origin?: string) => {
             /**
             * Emitted when the document's state has visually changed, suitable for UI updates.
             * This provides the full current state of the document.
             * @event CrdtEngine#synced-state
             * @type {object}
             * @property {T} state The full current state of the document.
             * @property {string} docId The ID of the document.
             * @property {'local' | 'remote' | 'initialization' | undefined} origin Indicates if the change originated locally or was applied from a remote source.
             */
            this.emit('synced-state', newState, docId, origin);
        });
    }

    /**
     * Gets the current, immutable state of the CRDT document.
     * For Yjs, this involves a conversion to a plain JS object.
     * For Automerge, the doc is already a plain JS object.
     * @returns {T} The current state of the document.
     */
    getState(): T {
        return this.provider.getState();
    }

    /**
     * Applies a binary update received from an authoritative source (e.g., a server).
     * This method marks the update as 'remote'.
     * @param update The binary update payload.
     */
    applyAuthoritativeUpdate(update: Uint8Array): void {
        this.provider.applyUpdate(update, 'remote');
    }

    /**
     * Generates a binary update representing the changes made locally
     * that need to be sent to the authoritative source.
     * This method also internally updates the CRDT provider's sync state (if applicable).
     * @returns {Uint8Array} The binary update to send. Returns an empty Uint8Array if no changes to send.
     */
    getLocalUpdate(): Uint8Array {
        const update = this.provider.generateUpdate();
        if (update.length > 0) {
            // Explicitly emit the update for local changes when requested by the application
            // This ensures consistency with the 'update' event for remote changes.
            this.emit('update', update, 'local');
        }
        return update;
    }

    /**
     * Applies a local change to the document. This method should be used
     * by the application to modify the document state.
     * The changes will trigger a 'synced-state' event. The binary 'update'
     * for these local changes will be generated when `getLocalUpdate()` is called.
     * @param fn A function that receives the mutable document/root object to apply changes.
     *           For Yjs, this will be a proxy object behaving like a plain JS object.
     *           For Automerge, it's the doc itself, which is already a mutable plain JS object.
     */
    applyLocalChange(fn: (doc: T) => void): void {
        this.provider.applyLocalChange(fn, 'local');
    }
}