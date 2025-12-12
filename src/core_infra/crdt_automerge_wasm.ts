// src/core_infra/crdt_automerge_wasm.ts
// WASM-compiled Automerge for offline-first collaborative editing.

import * as Automerge from 'automerge-wasm';

export class AutomergeWasm {
  private doc: Automerge.AutomergeDoc | null = null;
  private readonly actorId: string;

  constructor(actorId?: string) {
    this.actorId = actorId || Automerge.initActorId();
  }

  init(): void {
    this.doc = Automerge.init(this.actorId);
  }

  load(data: Uint8Array): void {
      if (!this.doc) {
        this.init();
      }
      this.doc = Automerge.load(data);
  }


  change<T>(callback: (doc: any) => void): Uint8Array {
      if (!this.doc) {
          this.init();
      }
    const [newDoc, patches] = Automerge.change(this.doc, (doc: any) => {
      callback(doc);
    });
    this.doc = newDoc;
    return Automerge.save(this.doc);
  }

  applyChanges(changes: Uint8Array[]): void {
      if (!this.doc) {
          this.init();
      }
      changes.forEach(change => {
          this.doc = Automerge.applyChanges(this.doc, [change]);
      });
  }


  save(): Uint8Array {
    if (!this.doc) {
        return new Uint8Array();
    }
    return Automerge.save(this.doc);
  }

  getChanges(otherDoc: Uint8Array): Uint8Array[] {
    if (!this.doc) {
      return [];
    }

    const changes = Automerge.getChanges(this.save(), otherDoc);
    return changes;
  }
  
  get state(): any | null {
      if (!this.doc) {
          return null;
      }
      return Automerge.view(this.doc);
  }
}