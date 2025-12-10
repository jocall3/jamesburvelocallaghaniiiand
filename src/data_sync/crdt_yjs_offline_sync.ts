```typescript
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';

export class YjsOfflineSync {
  private doc: Y.Doc;
  private webrtcProvider?: WebrtcProvider;
  private indexeddbPersistence?: IndexeddbPersistence;
  private roomName: string;
  private peerId: string; // Unique identifier for the peer

  constructor(roomName: string, peerId: string) {
    this.doc = new Y.Doc();
    this.roomName = roomName;
    this.peerId = peerId; // Store the peerId
  }

  async initialize(): Promise<void> {
    // Configure IndexedDB persistence
    this.indexeddbPersistence = new IndexeddbPersistence(this.roomName, this.doc);
    await this.indexeddbPersistence.whenLoaded;
    console.log(`[YjsOfflineSync] IndexedDB persistence loaded for ${this.roomName}`);

    // Configure WebRTC provider (optional, for real-time sync)
    // this.webrtcProvider = new WebrtcProvider(this.roomName, this.doc, {
    //   signaling: ['ws://localhost:4444'], // Replace with your signaling server
    //   peerId: this.peerId, // Pass the peerId to the provider
    // });
    // console.log(`[YjsOfflineSync] WebRTC provider initialized for ${this.roomName}`);
  }

  getDoc(): Y.Doc {
    return this.doc;
  }

  // Example: Access a shared type (e.g., Y.Map)
  getSharedMap<T>(key: string): Y.Map<T> {
    let map = this.doc.getMap<T>(key);
    return map;
  }

  // Example: Access a shared type (e.g., Y.Array)
  getSharedArray<T>(key: string): Y.Array<T> {
    let array = this.doc.getArray<T>(key);
    return array;
  }


  // Optional: Clean up resources
  destroy(): void {
    if (this.webrtcProvider) {
      this.webrtcProvider.destroy();
    }
    this.doc.destroy();
    console.log(`[YjsOfflineSync] Yjs instance destroyed for ${this.roomName}`);
  }

  // Add a function to serialize the document for storage
  serialize(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  // Add a function to apply an update (deserialize and merge)
  applyUpdate(update: Uint8Array): void {
    Y.applyUpdate(this.doc, update);
  }

  // Helper method for debugging: Print the state
  printState() {
    console.log(`[YjsOfflineSync] Current state of ${this.roomName}:`, JSON.stringify(Y.encodeStateAsUpdate(this.doc).length));
  }
}
```