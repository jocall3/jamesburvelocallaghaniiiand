```typescript
/**
 * Interface for interacting with an IPFS blockstore.
 * This interface provides a consistent way to interact with
 * different blockstore implementations (e.g., memory, IndexedDB, etc.).
 */
export interface Blockstore {
  /**
   * Retrieves a block from the blockstore by its CID.
   * @param cid The CID of the block to retrieve.
   * @returns A Promise that resolves to the block's data as a Uint8Array, or null if not found.
   */
  get(cid: string): Promise<Uint8Array | null>;

  /**
   * Stores a block in the blockstore.
   * @param cid The CID to associate with the block.
   * @param data The block's data as a Uint8Array.
   * @returns A Promise that resolves when the block is successfully stored.
   */
  put(cid: string, data: Uint8Array): Promise<void>;

  /**
   * Checks if a block exists in the blockstore.
   * @param cid The CID of the block to check.
   * @returns A Promise that resolves to true if the block exists, false otherwise.
   */
  has(cid: string): Promise<boolean>;

  /**
   * Deletes a block from the blockstore.
   * @param cid The CID of the block to delete.
   * @returns A Promise that resolves when the block is successfully deleted.
   */
  delete(cid: string): Promise<void>;

  /**
   * Lists all CIDs in the blockstore.  This can be an expensive operation,
   * especially for large blockstores.
   * @returns A Promise that resolves to an array of CIDs (as strings).
   */
  list(): Promise<string[]>;

  /**
   * Returns the total number of blocks in the blockstore.
   * This could also be an expensive operation, so use it with care.
   * @returns A Promise resolving to the number of blocks.
   */
  size(): Promise<number>;

  /**
   * Clears the entire blockstore, removing all blocks.
   * Use with extreme caution!
   * @returns A Promise that resolves when the blockstore is cleared.
   */
  clear(): Promise<void>;

  /**
   * Closes the blockstore, releasing any resources.
   * @returns A Promise that resolves when the blockstore is closed.
   */
  close(): Promise<void>;
}
```