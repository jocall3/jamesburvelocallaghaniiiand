```typescript
import { createLibp2p, Libp2p, Libp2pOptions } from 'libp2p';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { webSockets } from '@libp2p/websockets';
import { webRTC } from '@libp2p/webrtc';
import { webTransport } from '@libp2p/webtransport';
import { bootstrap } from '@libp2p/bootstrap';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { kadDHT } from '@libp2p/kad-dht';
import { identify } from '@libp2p/identify';
import { autoNAT } from '@libp2p/autonat';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { PeerId } from '@libp2p/interface/peer-id';
import { createFromProtobuf, createEd25519PeerId } from '@libp2p/peer-id-factory';
import { Multiaddr } from '@multiformats/multiaddr';
import { CID } from 'multiformats/cid';
import { Stream } from '@libp2p/interface/connection';
import { Message } from '@libp2p/interface/pubsub';

// Default bootstrap nodes for connecting to the public libp2p network
const BOOTSTRAP_NODES = [
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTf5bn6E5W18iadR6OD',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
];

// Helper to persist PeerId in localStorage to avoid creating a new identity on each load
const getOrCreatePeerId = async (): Promise<PeerId> => {
  const peerIdKey = 'p2p-peer-id';
  const storedKey = localStorage.getItem(peerIdKey);

  if (storedKey) {
    try {
      const privateKeyBytes = new Uint8Array(JSON.parse(storedKey));
      return await createFromProtobuf(privateKeyBytes);
    } catch (error) {
      console.error('Failed to parse stored PeerId, creating a new one.', error);
      localStorage.removeItem(peerIdKey);
    }
  }

  const newPeerId = await createEd25519PeerId();
  const privateKeyBytes = newPeerId.privateKey;
  if (privateKeyBytes) {
      localStorage.setItem(peerIdKey, JSON.stringify(Array.from(privateKeyBytes)));
  }
  return newPeerId;
};

/**
 * Creates a libp2p node configuration tailored for browser environments.
 * @param peerId - The PeerId for this node.
 * @param bootstrapList - Optional list of bootstrap multiaddrs.
 * @returns A Libp2pOptions object.
 */
const createNodeOptions = (peerId: PeerId, bootstrapList: string[] = BOOTSTRAP_NODES): Libp2pOptions => ({
  peerId,
  addresses: {
    // Browser nodes can't listen on a stable address, they connect outbound
    listen: [],
  },
  transports: [
    webSockets(),
    webRTC(),
    webTransport(),
    circuitRelayTransport({
      discoverRelays: 1,
    }),
  ],
  connectionEncryption: [noise()],
  streamMuxers: [mplex()],
  peerDiscovery: [
    bootstrap({
      list: bootstrapList,
    }),
  ],
  services: {
    identify: identify(),
    autoNAT: autoNAT(),
    pubsub: gossipsub({
      allowPublishToZeroPeers: true,
    }),
    dht: kadDHT({
      clientMode: true, // Crucial for browser nodes
      protocol: '/ipfs/kad/1.0.0',
    }),
  },
});

/**
 * Libp2pRuntime encapsulates a client-side libp2p node, providing a high-level
 * API for peer-to-peer communication and data sharing.
 */
export class Libp2pRuntime {
  private node: Libp2p | null = null;
  private started = false;
  private pubsubHandlers = new Map<string, Set<(message: Message) => void>>();
  private isPubsubListenerActive = false;

  public static async create(options?: Partial<Libp2pOptions>): Promise<Libp2pRuntime> {
    const instance = new Libp2pRuntime();
    const peerId = await getOrCreatePeerId();
    const baseOptions = createNodeOptions(peerId, options?.peerDiscovery?.[0]?.list);
    
    // Simple merge, user options take precedence
    const finalOptions = { ...baseOptions, ...options };
    
    instance.node = await createLibp2p(finalOptions);
    return instance;
  }

  private constructor() {}

  public async start(): Promise<void> {
    if (!this.node) throw new Error('Libp2p node not initialized. Call create() first.');
    if (this.started) return;
    
    await this.node.start();
    this.attachPubsubListener();
    this.started = true;
    console.log('Libp2p node started with PeerId:', this.node.peerId.toString());
    this.node.getMultiaddrs().forEach(ma => console.log('Listening on:', ma.toString()));
  }

  public async stop(): Promise<void> {
    if (!this.node || !this.started) return;
    
    await this.node.stop();
    this.started = false;
    this.isPubsubListenerActive = false;
    console.log('Libp2p node stopped.');
  }

  public isStarted(): boolean {
    return this.started;
  }

  public getNode(): Libp2p {
    if (!this.node) throw new Error('Libp2p node not initialized.');
    return this.node;
  }

  public getPeerId(): PeerId {
      if (!this.node) throw new Error('Libp2p node not initialized.');
      return this.node.peerId;
  }
  
  public getMultiaddrs(): Multiaddr[] {
    if (!this.node) throw new Error('Libp2p node not initialized.');
    return this.node.getMultiaddrs();
  }
  
  private attachPubsubListener(): void {
    if (!this.node || this.isPubsubListenerActive) return;

    this.node.services.pubsub.addEventListener('message', (evt) => {
        const handlers = this.pubsubHandlers.get(evt.detail.topic);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(evt.detail);
                } catch(err) {
                    console.error(`Error in pubsub handler for topic ${evt.detail.topic}`, err);
                }
            }
        }
    });
    this.isPubsubListenerActive = true;
  }

  public subscribe(topic: string, handler: (message: Message) => void): () => void {
    if (!this.node || !this.started) throw new Error('Node not started.');
    
    let handlers = this.pubsubHandlers.get(topic);
    if (!handlers) {
        handlers = new Set();
        this.pubsubHandlers.set(topic, handlers);
        this.node.services.pubsub.subscribe(topic);
    }
    handlers.add(handler);
    
    return () => this.unsubscribe(topic, handler);
  }

  public unsubscribe(topic: string, handler?: (message: Message) => void): void {
    if (!this.node) return;

    const handlers = this.pubsubHandlers.get(topic);
    if (!handlers) return;

    if (handler) {
        handlers.delete(handler);
    } else {
        handlers.clear();
    }

    if (handlers.size === 0) {
        this.pubsubHandlers.delete(topic);
        if (this.started) {
            this.node.services.pubsub.unsubscribe(topic);
        }
    }
  }

  public async publish(topic: string, data: Uint8Array): Promise<void> {
    if (!this.node || !this.started) throw new Error('Node not started.');
    await this.node.services.pubsub.publish(topic, data);
  }

  public handle(protocol: string, handler: (props: { stream: Stream }) => void): Promise<void> {
    if (!this.node) throw new Error('Libp2p node not initialized.');
    return this.node.handle(protocol, handler);
  }

  public async dial(peer: PeerId | Multiaddr, protocol: string): Promise<Stream> {
    if (!this.node || !this.started) throw new Error('Node not started.');
    return this.node.dial(peer, protocol);
  }

  public async findPeer(peerId: PeerId) {
    if (!this.node || !this.started) throw new Error('Node not started.');
    return this.node.services.dht.findPeer(peerId);
  }

  public async provide(cid: CID): Promise<void> {
    if (!this.node || !this.started) throw new Error('Node not started.');
    // Browser nodes may struggle to provide content effectively due to NATs.
    // This relies heavily on circuit relays being available.
    for await (const _ of this.node.services.dht.provide(cid)) {
      // Iterating consumes the async generator, completing the operation.
    }
  }

  public findProviders(cid: CID, timeout?: number) {
    if (!this.node || !this.started) throw new Error('Node not started.');
    return this.node.services.dht.findProviders(cid, { timeout });
  }
}
```