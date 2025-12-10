```typescript
import * as Automerge from '@automerge/automerge';
import { ChangeFn } from '@automerge/automerge';
import { DocHandle, Repo } from "@automerge/automerge-repo"
import { IndexeddbPersistenceProvider } from '@automerge/automerge-repo-storage-indexeddb'

export type AutomergeDoc<T> = Automerge.Doc<T>;

export interface CRDTStore<T> {
  docHandle: DocHandle<T>;
  updateDoc: (changeFn: ChangeFn<T>) => void;
  subscribe: (callback: (doc: T) => void) => () => void;
  getDoc: () => T;
  // Optionally, methods for syncing with a remote peer
  // syncWithPeer?: (peerId: string) => void;
}


export class AutomergeCRDTStore<T extends Record<string, any>> implements CRDTStore<T> {
  private repo: Repo;
  public docHandle: DocHandle<T>;
  private subscriptions: ((doc: T) => void)[] = [];
  private doc: Automerge.Doc<T>;

  constructor(documentId: string, initialDoc?: T) {

    this.repo = new Repo({
        storage: new IndexeddbPersistenceProvider(),
        peerId: "storage-example-" + Math.round(Math.random() * 10000),
        network: [], // we'll add network adapters later
    });

    this.docHandle = this.repo.find<T>(documentId);

    this.docHandle.value.then((doc) => {
      if (!doc && initialDoc) {
        this.docHandle.change(d => Object.assign(d, initialDoc));
      }
    });

     this.docHandle.subscribe(doc => {
        this.doc = doc!;
        this.subscriptions.forEach(callback => callback(doc!));
    });


  }


  updateDoc(changeFn: ChangeFn<T>) {
    this.docHandle.change(changeFn);
  }

  subscribe(callback: (doc: T) => void): () => void {
    this.subscriptions.push(callback);
    if (this.doc) {
      callback(this.doc); // Immediately call with the current doc
    }
    return () => {
      this.subscriptions = this.subscriptions.filter(cb => cb !== callback);
    };
  }

  getDoc(): T {
    return this.doc;
  }

  // Optional: Sync with a peer (implementation depends on your networking setup)
  // syncWithPeer(peerId: string) {
  //   // Implement your syncing logic here, e.g., using Automerge Repo's network adapters.
  //   console.log(`Syncing with peer: ${peerId}`);
  // }
}
```