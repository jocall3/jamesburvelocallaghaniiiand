```typescript
import { randomBytes, createHash } from 'crypto';

// --- Constants ---

/**
 * The number of contacts in a k-bucket.
 * Standard value is 20.
 */
const K_BUCKET_SIZE = 20;

/**
 * The number of concurrent lookups in an iterative query.
 * Standard value is 3.
 */
const ALPHA = 3;

/**
 * The length of the node ID in bytes.
 * 20 bytes for a 160-bit ID (SHA-1).
 */
const ID_LENGTH_BYTES = 20;

/**
 * Time in milliseconds before a stored value expires.
 * Default: 24 hours.
 */
const T_EXPIRE = 86400 * 1000;

/**
 * Time in milliseconds after which the original publisher must republish a key-value pair.
 * Default: 1 hour.
 */
const T_REPUBLISH = 3600 * 1000;


// --- Types and Interfaces ---

export interface PeerInfo {
    id: Buffer;
    address: string;
    port: number;
}

export type RPCMethod = 'PING' | 'STORE' | 'FIND_NODE' | 'FIND_VALUE';

export interface RPCMessage {
    type: 'request' | 'response';
    id: string; // Unique message ID for tracking responses
    method: RPCMethod;
    sender: PeerInfo;
    payload: any;
}

/**
 * Abstract interface for the network layer. This allows Kademlia to be
 * transport-agnostic (e.g., could be implemented over WebRTC, WebSockets, etc.).
 */
export interface NetworkAdapter {
    send(peer: PeerInfo, message: RPCMessage): Promise<RPCMessage>;
    on(event: 'message', listener: (message: RPCMessage, rinfo: { address: string; port: number }) => void): this;
    start(): Promise<void>;
    stop(): Promise<void>;
    getLocalPeerInfo(): PeerInfo;
}

// --- Utility Functions ---

const xorDistance = (id1: Buffer, id2: Buffer): Buffer => {
    const length = Math.min(id1.length, id2.length);
    const result = Buffer.alloc(length);
    for (let i = 0; i < length; i++) {
        result[i] = id1[i] ^ id2[i];
    }
    return result;
};

const compareBuffers = (b1: Buffer, b2: Buffer): number => {
    return b1.compare(b2);
};

// --- Core Data Structures ---

/**
 * Represents a k-bucket, which stores a list of contacts.
 * Contacts are ordered by their last-seen time (most recent at the end).
 */
class KBucket {
    private readonly contacts: Map<string, { peer: PeerInfo, lastSeen: number }> = new Map();

    constructor(private readonly maxSize: number = K_BUCKET_SIZE) {}

    add(peer: PeerInfo): boolean {
        const key = peer.id.toString('hex');
        if (this.contacts.has(key)) {
            // Move to the end (most recently seen) by re-inserting
            const existing = this.contacts.get(key)!;
            this.contacts.delete(key);
            this.contacts.set(key, { ...existing, lastSeen: Date.now() });
            return true;
        }

        if (this.contacts.size < this.maxSize) {
            this.contacts.set(key, { peer, lastSeen: Date.now() });
            return true;
        }

        // Bucket is full. In a full implementation, we would ping the oldest contact
        // and replace it if it doesn't respond. For simplicity, we reject the new one.
        return false;
    }

    get(id: Buffer): PeerInfo | undefined {
        return this.contacts.get(id.toString('hex'))?.peer;
    }

    remove(id: Buffer): boolean {
        return this.contacts.delete(id.toString('hex'));
    }

    get size(): number {
        return this.contacts.size;
    }

    getAllPeers(): PeerInfo[] {
        return Array.from(this.contacts.values())
            .sort((a, b) => b.lastSeen - a.lastSeen) // most recently seen first
            .map(c => c.peer);
    }
}

/**
 * Manages all k-buckets for the local node.
 */
class RoutingTable {
    private readonly buckets: KBucket[];
    private readonly localNodeId: Buffer;

    constructor(localNodeId: Buffer) {
        this.localNodeId = localNodeId;
        this.buckets = Array.from({ length: ID_LENGTH_BYTES * 8 }, () => new KBucket());
    }

    getBucketIndex(remoteId: Buffer): number {
        const distance = xorDistance(this.localNodeId, remoteId);
        let prefixLength = 0;
        for (const byte of distance) {
            if (byte === 0) {
                prefixLength += 8;
            } else {
                let p = 0;
                while ((byte & (1 << (7 - p))) === 0) {
                    p++;
                }
                prefixLength += p;
                break;
            }
        }
        return (ID_LENGTH_BYTES * 8 - 1) - prefixLength;
    }

    add(peer: PeerInfo): void {
        if (this.localNodeId.equals(peer.id)) return;
        const index = this.getBucketIndex(peer.id);
        this.buckets[index].add(peer);
    }

    remove(peer: PeerInfo): void {
        const index = this.getBucketIndex(peer.id);
        this.buckets[index].remove(peer.id);
    }

    findClosest(targetId: Buffer, count: number): PeerInfo[] {
        const candidates = this.getAllPeers().map(peer => ({
            peer,
            distance: xorDistance(targetId, peer.id)
        }));

        candidates.sort((a, b) => compareBuffers(a.distance, b.distance));

        return candidates.slice(0, count).map(c => c.peer);
    }
    
    getAllPeers(): PeerInfo[] {
        return this.buckets.reduce((acc: PeerInfo[], bucket) => {
            return acc.concat(bucket.getAllPeers());
        }, []);
    }
}

// --- Main Kademlia DHT Service ---

export class KademliaDHTService {
    private readonly localPeerInfo: PeerInfo;
    private readonly routingTable: RoutingTable;
    private readonly network: NetworkAdapter;
    private readonly storage: Map<string, { value: any, originalPublisher: Buffer, expiresAt: number }>;
    private readonly pendingRequests: Map<string, (response: RPCMessage) => void> = new Map();

    constructor(networkAdapter: NetworkAdapter) {
        this.network = networkAdapter;
        this.localPeerInfo = this.network.getLocalPeerInfo();
        this.routingTable = new RoutingTable(this.localPeerInfo.id);
        this.storage = new Map();

        this.network.on('message', this.handleIncomingRPC.bind(this));
    }

    private generateMessageId(): string {
        return randomBytes(16).toString('hex');
    }

    private async handleIncomingRPC(message: RPCMessage, rinfo: { address: string; port: number }) {
        // Always update routing table for any valid incoming message
        if (message.sender?.id) {
            this.routingTable.add(message.sender);
        }

        if (message.type === 'response') {
            const handler = this.pendingRequests.get(message.id);
            if (handler) {
                handler(message);
                this.pendingRequests.delete(message.id);
            }
            return;
        }

        let responsePayload: any;
        switch (message.method) {
            case 'PING':
                responsePayload = 'PONG';
                break;
            case 'STORE':
                const { key, value, originalPublisher } = message.payload;
                const hashKey = createHash('sha1').update(key).digest().toString('hex');
                this.storage.set(hashKey, {
                    value,
                    originalPublisher: Buffer.from(originalPublisher, 'hex'),
                    expiresAt: Date.now() + T_EXPIRE
                });
                responsePayload = { status: 'OK' };
                break;
            case 'FIND_NODE':
                const { targetId } = message.payload;
                const closestNodes = this.routingTable.findClosest(Buffer.from(targetId, 'hex'), K_BUCKET_SIZE);
                responsePayload = { nodes: closestNodes };
                break;
            case 'FIND_VALUE':
                const findKey = createHash('sha1').update(message.payload.key).digest().toString('hex');
                if (this.storage.has(findKey)) {
                    responsePayload = { value: this.storage.get(findKey)!.value };
                } else {
                    const closestNodesToValue = this.routingTable.findClosest(Buffer.from(findKey, 'hex'), K_BUCKET_SIZE);
                    responsePayload = { nodes: closestNodesToValue };
                }
                break;
        }

        const response: RPCMessage = {
            type: 'response',
            id: message.id,
            method: message.method,
            sender: this.localPeerInfo,
            payload: responsePayload
        };

        // We assume the network adapter can route the response back to the sender
        await this.network.send({ ...message.sender, ...rinfo }, response);
    }
    
    private async sendRPC(peer: PeerInfo, method: RPCMethod, payload: any): Promise<RPCMessage> {
        const id = this.generateMessageId();
        const message: RPCMessage = { id, type: 'request', method, sender: this.localPeerInfo, payload };

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`RPC request to ${peer.id.toString('hex')} timed out`));
            }, 5000);

            this.pendingRequests.set(id, (response) => {
                clearTimeout(timeout);
                resolve(response);
            });

            this.network.send(peer, message).catch(err => {
                 clearTimeout(timeout);
                 this.pendingRequests.delete(id);
                 reject(err);
            });
        });
    }

    async join(bootstrapPeers: PeerInfo[]): Promise<void> {
        for (const peer of bootstrapPeers) {
            this.routingTable.add(peer);
        }
        await this.iterativeLookup(this.localPeerInfo.id, 'FIND_NODE');
        console.log(`Node ${this.localPeerInfo.id.toString('hex')} joined the DHT network.`);
    }
    
    private async iterativeLookup(targetId: Buffer, method: 'FIND_NODE' | 'FIND_VALUE', key?: string): Promise<{ value?: any; closest: PeerInfo[] }> {
        let shortlist = this.routingTable.findClosest(targetId, K_BUCKET_SIZE);
        const queried = new Set<string>([this.localPeerInfo.id.toString('hex')]);
        let closestNode = shortlist.length > 0 ? shortlist[0] : this.localPeerInfo;
        let closestDistance = xorDistance(targetId, closestNode.id);

        while (true) {
            const nodesToQuery = shortlist.filter(p => !queried.has(p.id.toString('hex'))).slice(0, ALPHA);
            if (nodesToQuery.length === 0) break;

            const promises = nodesToQuery.map(async peer => {
                queried.add(peer.id.toString('hex'));
                try {
                    const payload = method === 'FIND_NODE' ? { targetId: targetId.toString('hex') } : { key };
                    const response = await this.sendRPC(peer, method, payload);
                    this.routingTable.add(peer); // It's alive
                    return response.payload;
                } catch (err) {
                    this.routingTable.remove(peer); // It's dead
                    return null;
                }
            });

            const results = await Promise.all(promises);
            let foundNewerCloser = false;
            
            for (const payload of results) {
                if (!payload) continue;

                if (payload.value !== undefined) {
                    // Value found during FIND_VALUE lookup
                    return { value: payload.value, closest: shortlist };
                }

                if (payload.nodes) {
                    for (const peer of payload.nodes) {
                        if (!queried.has(peer.id.toString('hex')) && !shortlist.some(p => p.id.equals(peer.id))) {
                            shortlist.push(peer);
                            const distance = xorDistance(targetId, peer.id);
                            if (compareBuffers(distance, closestDistance) < 0) {
                                closestNode = peer;
                                closestDistance = distance;
                                foundNewerCloser = true;
                            }
                        }
                    }
                }
            }
            
            shortlist.sort((a, b) => compareBuffers(xorDistance(targetId, a.id), xorDistance(targetId, b.id)));
            shortlist = shortlist.slice(0, K_BUCKET_SIZE);

            if (!foundNewerCloser) break; // Converged
        }

        return { closest: shortlist };
    }

    async put(key: string, value: any): Promise<void> {
        const keyId = createHash('sha1').update(key).digest();
        const { closest } = await this.iterativeLookup(keyId, 'FIND_NODE');

        const storePayload = { key, value, originalPublisher: this.localPeerInfo.id.toString('hex') };

        const storePromises = closest.map(peer =>
            this.sendRPC(peer, 'STORE', storePayload).catch(err => {
                console.error(`Failed to store on peer ${peer.id.toString('hex')}:`, err.message);
            })
        );

        await Promise.all(storePromises);
        console.log(`Stored value for key "${key}" on up to ${closest.length} nodes.`);
    }

    async get(key: string): Promise<any | null> {
        const keyId = createHash('sha1').update(key).digest();
        const hexKey = keyId.toString('hex');
        
        if (this.storage.has(hexKey)) {
            return this.storage.get(hexKey)!.value;
        }

        const { value, closest } = await this.iterativeLookup(keyId, 'FIND_VALUE', key);

        if (value !== undefined) {
            // Cache the value on the closest node that didn't have it
            const closestPeerWithoutValue = closest[0];
            if (closestPeerWithoutValue && !this.localPeerInfo.id.equals(closestPeerWithoutValue.id)) {
                 this.sendRPC(closestPeerWithoutValue, 'STORE', { 
                    key, 
                    value: value,
                    originalPublisher: this.localPeerInfo.id.toString('hex') // Caching publisher is self
                }).catch(console.error);
            }
            return value;
        }

        return null; // Value not found in the network
    }
}
```