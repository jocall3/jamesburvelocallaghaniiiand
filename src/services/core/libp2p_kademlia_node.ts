import { createLibp2p, Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { mplex } from '@libp2p/mplex';
import { bootstrap } from '@libp2p/bootstrap';
import { kadDHT, KademliaDHT } from '@libp2p/kad-dht';
import { gossipsub, GossipSub } from '@chainsafe/gossipsub';
import { PeerId, createEd25519PeerId } from '@libp2p/peer-id';
import { multiaddr, Multiaddr } from '@multiformats/multiaddr';
import { CID } from 'multiformats/cid';
import { PeerInfo } from '@libp2p/interface-peer-info';
import { Uint8ArrayList } from 'uint8arraylist';

// Default bootstrap nodes for the IPFS network.
// These are used to discover other peers in the network.
const BOOTSTRAP_ADDRESSES: string[] = [
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTf5bSKpbec6u2TgmA2',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
    '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
];

export type Libp2pServices = {
    dht: KademliaDHT;
    pubsub: GossipSub;
};

/**
 * Encapsulates a full libp2p node with Kademlia DHT and GossipSub for P2P networking.
 * Provides a simplified API for starting, stopping, and interacting with the network.
 */
export class Libp2pKademliaNode {
    private node: Libp2p<Libp2pServices> | null = null;
    private _peerId: PeerId | null = null;
    private started: boolean = false;

    public get peerId(): PeerId {
        if (!this._peerId) {
            throw new Error('Node not initialized. Call start() first.');
        }
        return this._peerId;
    }

    public get multiaddrs(): Multiaddr[] {
        if (!this.node) {
            return [];
        }
        return this.node.getMultiaddrs();
    }

    /**
     * Creates and starts the libp2p node.
     * Generates a new PeerId if one is not provided.
     * @param existingPeerId - An optional existing PeerId to reuse.
     * @returns {Promise<void>}
     */
    public async start(existingPeerId?: PeerId): Promise<void> {
        if (this.started) {
            console.warn('Node already started.');
            return;
        }

        this._peerId = existingPeerId ?? (await createEd25519PeerId());
        console.log(`Initializing node with PeerId: ${this._peerId.toString()}`);

        this.node = await createLibp2p<Libp2pServices>({
            peerId: this._peerId,
            addresses: {
                listen: [
                    '/ip4/0.0.0.0/tcp/0',
                    '/ip4/0.0.0.0/tcp/0/ws', // For browser-based nodes to connect
                ],
            },
            transports: [tcp(), webSockets()],
            connectionEncryption: [noise()],
            streamMuxers: [yamux(), mplex()],
            peerDiscovery: [
                bootstrap({
                    list: BOOTSTRAP_ADDRESSES,
                    timeout: 1000, // In ms,
                    tagName: 'bootstrap',
                    tagValue: 50,
                    tagTTL: 120000, // In ms
                }),
            ],
            services: {
                dht: kadDHT({
                    protocol: '/ipfs/kad/1.0.0',
                    clientMode: false, // Set to false to act as a full DHT node
                }),
                pubsub: gossipsub({
                    emitSelf: true,
                    allowPublishToZeroPeers: true,
                }),
            },
        });

        this.addEventListeners();
        await this.node.start();
        this.started = true;
        console.log('Libp2p Kademlia node started.');
        console.log('Listening on addresses:');
        this.node.getMultiaddrs().forEach((addr) => console.log(addr.toString()));
    }

    /**
     * Stops the libp2p node and closes all connections.
     * @returns {Promise<void>}
     */
    public async stop(): Promise<void> {
        if (!this.node || !this.started) {
            console.warn('Node not started or already stopped.');
            return;
        }
        await this.node.stop();
        this.started = false;
        console.log('Libp2p Kademlia node stopped.');
    }

    private addEventListeners(): void {
        if (!this.node) return;

        this.node.addEventListener('peer:discovery', (evt) => {
            const peerInfo = evt.detail as PeerInfo;
            console.log(`Discovered peer: ${peerInfo.id.toString()}`);
        });

        this.node.addEventListener('peer:connect', (evt) => {
            const peerId = evt.detail as PeerId;
            console.log(`Connected to peer: ${peerId.toString()}`);
        });

        this.node.addEventListener('peer:disconnect', (evt) => {
            const peerId = evt.detail as PeerId;
            console.log(`Disconnected from peer: ${peerId.toString()}`);
        });
    }

    private getDHT() {
        if (!this.node || !this.started) {
            throw new Error('Node is not started.');
        }
        return this.node.services.dht;
    }

    private getPubSub() {
        if (!this.node || !this.started) {
            throw new Error('Node is not started.');
        }
        return this.node.services.pubsub;
    }

    // --- DHT Methods ---

    /**
     * Finds the network addresses of a given PeerId.
     * @param peerId - The PeerId to find.
     * @returns {Promise<PeerInfo>}
     */
    public async findPeer(peerId: PeerId): Promise<PeerInfo> {
        console.log(`Finding peer ${peerId.toString()}...`);
        return this.getDHT().findPeer(peerId);
    }

    /**
     * Stores a key-value pair in the DHT.
     * @param key - The key as a Uint8Array.
     * @param value - The value as a Uint8Array.
     * @returns {Promise<void>}
     */
    public async dhtPut(key: Uint8Array, value: Uint8Array): Promise<void> {
        console.log(`Putting value for key: ${new TextDecoder().decode(key)}`);
        await this.getDHT().put(key, value);
    }

    /**
     * Retrieves a value from the DHT by its key.
     * @param key - The key as a Uint8Array.
     * @returns {Promise<Uint8Array | undefined>} The found value or undefined.
     */
    public async dhtGet(key: Uint8Array): Promise<Uint8Array | undefined> {
        console.log(`Getting value for key: ${new TextDecoder().decode(key)}`);
        try {
            const value = await this.getDHT().get(key);
            return value;
        } catch (error) {
            console.error(`Could not get key ${new TextDecoder().decode(key)} from DHT`, error);
            return undefined;
        }
    }

    /**
     * Announces that this node can provide content for a given CID.
     * @param cid - The Content Identifier (CID) of the content.
     * @returns {Promise<void>}
     */
    public async provide(cid: CID): Promise<void> {
        console.log(`Announcing provider for CID: ${cid.toString()}`);
        const key = new Uint8ArrayList(cid.multihash.bytes);
        await this.getDHT().provide(key);
    }

    /**
     * Finds peers that are providing content for a given CID.
     * @param cid - The Content Identifier (CID) of the content.
     * @returns {AsyncGenerator<PeerInfo>} An async iterator of peers.
     */
    public findProviders(cid: CID): AsyncGenerator<PeerInfo> {
        console.log(`Finding providers for CID: ${cid.toString()}`);
        const key = new Uint8ArrayList(cid.multihash.bytes);
        return this.getDHT().findProviders(key);
    }

    // --- PubSub Methods ---

    /**
     * Subscribes to a GossipSub topic.
     * @param topic - The topic name string.
     * @param handler - A function to handle incoming messages.
     */
    public subscribe(topic: string, handler: (message: any) => void): void {
        const pubsub = this.getPubSub();
        pubsub.addEventListener('message', (evt) => {
            if (evt.detail.topic === topic) {
                handler(evt.detail);
            }
        });
        pubsub.subscribe(topic);
        console.log(`Subscribed to topic: ${topic}`);
    }

    /**
     * Unsubscribes from a GossipSub topic.
     * @param topic - The topic name string.
     */
    public unsubscribe(topic: string): void {
        this.getPubSub().unsubscribe(topic);
        console.log(`Unsubscribed from topic: ${topic}`);
    }

    /**
     * Publishes a message to a GossipSub topic.
     * @param topic - The topic name string.
     * @param message - The message to publish (string or Uint8Array).
     * @returns {Promise<void>}
     */
    public async publish(topic: string, message: string | Uint8Array): Promise<void> {
        const data = typeof message === 'string' ? new TextEncoder().encode(message) : message;
        await this.getPubSub().publish(topic, data);
        console.log(`Published message to topic '${topic}'`);
    }

    /**
     * Gets a list of topics the node is currently subscribed to.
     * @returns {string[]}
     */
    public getTopics(): string[] {
        return this.getPubSub().getTopics();
    }
}

// Export a singleton instance to be used across the application.
export const p2pNode = new Libp2pKademliaNode();
