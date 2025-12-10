```typescript
import * as Automerge from '@automerge/automerge';

/**
 * Represents an incremental, binary-encoded change in an Automerge document.
 */
export type AutomergeChange = Uint8Array;

/**
 * A function that modifies an Automerge document within a `change` block.
 * @template T The type of the document.
 * @param doc A mutable proxy of the document.
 */
export type AutomergeChangeFn<T> = (doc: T) => void;

/**
 * Manages an Automerge document on a central, authoritative server.
 *
 * In this model, clients do not merge changes peer-to-peer. Instead, they
 * submit proposed changes (or intents) to the server. The server validates and
 * applies these changes to its single source-of-truth document, and then
 * broadcasts the resulting incremental updates to all connected clients.
 *
 * This approach ensures data consistency and allows for server-side validation,
 * access control, and business logic execution before a change is accepted. It
 * combines the benefits of CRDTs (offline-first capabilities, rich merge
 * semantics) with the control of a traditional client-server architecture.
 *
 * @template T The type of the document structure.
 *
 * @example
 * // Server-side initialization
 * interface MyDoc { count: number; items: string[]; }
 * const serverEngine = AuthoritativeAutomerge.init<MyDoc>({ count: 0, items: [] });
 *
 * // A client action triggers a change on the server.
 * const changesToBroadcast = serverEngine.applyChange(doc => {
 *   doc.count++;
 *   doc.items.push(`Item ${doc.count}`);
 * }, "Increment count and add item");
 *
 * // The server broadcasts `changesToBroadcast` (a Uint8Array[]) to all clients.
 *
 * // A new client connects and needs the full document state.
 * const bootstrapChanges = serverEngine.getAllChanges();
 * // The server sends `bootstrapChanges` to the new client.
 *
 * // Client-side logic for a new client:
 * // let clientDoc = Automerge.init<MyDoc>();
 * // [clientDoc] = Automerge.applyChanges(clientDoc, bootstrapChanges);
 * // console.log(clientDoc.count); // 1
 *
 * // Client-side logic for an existing client receiving an update:
 * // [existingClientDoc] = Automerge.applyChanges(existingClientDoc, changesToBroadcast);
 */
export class AuthoritativeAutomerge<T> {
    private doc: Automerge.Doc<T>;

    /**
     * Private constructor to enforce initialization via static factory methods.
     * @param doc The initial Automerge document.
     */
    private constructor(doc: Automerge.Doc<T>) {
        this.doc = doc;
    }

    /**
     * Creates a new authoritative document from an initial state.
     * @template T The type of the document.
     * @param initialState The initial plain JavaScript object for the document.
     * @returns A new instance of `AuthoritativeAutomerge`.
     */
    public static init<T>(initialState: T): AuthoritativeAutomerge<T> {
        const doc = Automerge.from(initialState);
        return new AuthoritativeAutomerge(doc);
    }

    /**
     * Loads an authoritative document from its binary representation.
     * @template T The type of the document.
     * @param data The binary data of a saved Automerge document.
     * @returns A new instance of `AuthoritativeAutomerge`.
     */
    public static load<T>(data: Uint8Array): AuthoritativeAutomerge<T> {
        const doc = Automerge.load<T>(data);
        return new AuthoritativeAutomerge(doc);
    }

    /**
     * Saves the current state of the document to a binary representation.
     * This can be used for persistence (e.g., writing to a database or file).
     * @returns The document as a `Uint8Array`.
     */
    public save(): Uint8Array {
        return Automerge.save(this.doc);
    }

    /**
     * Returns a readonly version of the current document state.
     * The returned object is deeply frozen and should not be mutated.
     * @returns The current document state.
     */
    public getDocumentState(): Readonly<Automerge.Doc<T>> {
        return this.doc;
    }

    /**
     * Applies a change function to the authoritative document.
     * This is the primary method for mutation on the server. It takes a
     * function that describes the change, applies it, and calculates the
     * incremental binary changes that clients need to sync.
     *
     * @param changeFn A function that mutates the document proxy.
     * @param message An optional descriptive message for the change metadata.
     * @returns An array of binary changes (`AutomergeChange[]`) to be broadcasted
     * to clients. Returns an empty array if the `changeFn` did not alter the document.
     */
    public applyChange(changeFn: AutomergeChangeFn<T>, message?: string): AutomergeChange[] {
        const oldDoc = this.doc;
        const newDoc = Automerge.change(oldDoc, { message }, changeFn);

        const changes = Automerge.getChanges(oldDoc, newDoc);
        this.doc = newDoc;
        
        return changes;
    }

    /**
     * Merges an array of external changes into the authoritative document.
     * This can be used for server-to-server federation or for applying changes
     * that were generated on a client and sent to the server.
     *
     * @param changes An array of binary changes from another Automerge document.
     * @returns The incremental changes generated by this merge operation, which should
     * also be broadcasted to all clients to ensure they converge.
     */
    public mergeExternalChanges(changes: AutomergeChange[]): AutomergeChange[] {
        if (changes.length === 0) {
            return [];
        }

        const oldDoc = this.doc;
        // Automerge.applyChanges returns a tuple: [newDoc, patch]
        const [newDoc] = Automerge.applyChanges(oldDoc, changes);

        const resultingChanges = Automerge.getChanges(oldDoc, newDoc);
        this.doc = newDoc;

        return resultingChanges;
    }

    /**
     * Generates all changes needed to bring a new client from an empty state
     * up to the current document state.
     *
     * This is the recommended way to bootstrap a new client, as it allows the
     * client to reconstruct the document's full history.
     *
     * @returns An array of all binary changes that constitute the document's history.
     */
    public getAllChanges(): AutomergeChange[] {
        return Automerge.getAllChanges(this.doc);
    }
}
```