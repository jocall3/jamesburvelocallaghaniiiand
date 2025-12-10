export type NodeID = Uint8Array;

export interface PeerInfo {
    id: NodeID;
    address: string;
    lastSeen: number;
}

export interface KademliaRpcMessage {
    type: 'PING' | 'STORE' | 'FIND_NODE' | 'FIND_VALUE';
    sender: PeerInfo;
    requestId: string;
    payload?: any;
}

export interface KademliaRpcResponse {
    type: 'PING_RES' | 'STORE_RES' | 'FIND_NODE_RES' | 'FIND_VALUE_RES';
    sender: PeerInfo;
    requestId: string;
    success: boolean;
    payload?: any;
    error?: string;
}

export interface NetworkTransport {
    sendRpc(address: string, message: KademliaRpcMessage): Promise<KademliaRpcResponse>;
    onRpc(handler: (message: KademliaRpcMessage) => Promise<KademliaRpcResponse>): void;
    getLocalAddress(): string;
}

const K_BUCKET_SIZE = 20;
const ALPHA = 3;
const ID_BYTE_LENGTH = 20; // 160-bit SHA-1 hash

export async function generateNodeId(data: string): Promise<NodeID> {
    const textEncoder = new TextEncoder();
    const dataBuffer = textEncoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer);
    return new Uint8Array(hashBuffer);
}

export function xorDistance(id1: NodeID, id2: NodeID): Uint8Array {
    if (id1.length !== ID_BYTE_LENGTH || id2.length !== ID_BYTE_LENGTH) {
        throw new Error(`Node IDs must be ${ID_BYTE_LENGTH} bytes long.`);
    }
    const distance = new Uint8Array(ID_BYTE_LENGTH);
    for (let i = 0; i < ID_BYTE_LENGTH; i++) {
        distance[i] = id1[i] ^ id2[i];
    }
    return distance;
}

export function compareDistances(d1: Uint8Array, d2: Uint8Array): number {
    if (d1.length !== ID_BYTE_LENGTH || d2.length !== ID_BYTE_LENGTH) {
        throw new Error(`Distances must be ${ID_BYTE_LENGTH} bytes long.`);
    }
    for (let i = 0; i < ID_BYTE_LENGTH; i++) {
        if (d1[i] < d2[i]) return -1;
        if (d1[i] > d2[i]) return 1;
    }
    return 0;
}

export function nodeIdToHex(id: NodeID): string {
    return Array.from(id).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToNodeId(hex: string): NodeID {
    if (hex.length !== ID_BYTE_LENGTH * 2) {
        throw new Error(`Hex string must be ${ID_BYTE_LENGTH * 2} characters long.`);
    }
    const id = new Uint8Array(ID_BYTE_LENGTH);
    for (let i = 0; i < ID_BYTE_LENGTH; i++) {
        id[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return id;
}

class KBucket {
    private peers: PeerInfo[] = [];

    constructor(private k: number = K_BUCKET_SIZE) {}

    async addPeer(peer: PeerInfo, localNodeId: NodeID, transport: NetworkTransport): Promise<boolean> {
        const existingIndex = this.peers.findIndex(p => p.id.every((byte, i) => byte === peer.id[i]));

        if (existingIndex !== -1) {
            const existingPeer = this.peers[existingIndex];
            existingPeer.lastSeen = Date.now();
            this.peers.splice(existingIndex, 1);
            this.peers.push(existingPeer);
            return true;
        } else {
            if (this.peers.length < this.k) {
                this.peers.push({ ...peer, lastSeen: Date.now() });
                return true;
            } else {
                const oldestPeer = this.peers[0]; // Assumes peers are sorted by lastSeen, oldest first
                try {
                    const pingResponse = await transport.sendRpc(oldestPeer.address, {
                        type: 'PING',
                        sender: { id: localNodeId, address: transport.getLocalAddress(), lastSeen: Date.now() },
                        requestId: generateRequestId()
                    });

                    if (pingResponse.success) {
                        oldestPeer.lastSeen = Date.now();
                        this.peers.splice(0, 1);
                        this.peers.push(oldestPeer);
                        return false;
                    } else {
                        this.peers.splice(0, 1);
                        this.peers.push({ ...peer, lastSeen: Date.now() });
                        return true;
                    }
                } catch (e) {
                    this.peers.splice(0, 1);
                    this.peers.push({ ...peer, lastSeen: Date.now() });
                    return true;
                }
            }
        }
    }

    getPeers(count: number = this.k): PeerInfo[] {
        return this.peers.slice(-count).reverse();
    }

    getAllPeers(): PeerInfo[] {
        return [...this.peers].reverse();
    }

    removePeer(peerId: NodeID): void {
        const index = this.peers.findIndex(p => p.id.every((byte, i) => byte === peerId[i]));
        if (index !== -1) {
            this.peers.splice(index, 1);
        }
    }

    size(): number {
        return this.peers.length;
    }
}

class RoutingTable {
    private buckets: KBucket[] = [];
    private readonly localNodeId: NodeID;
    private readonly transport: NetworkTransport;

    constructor(localNodeId: NodeID, transport: NetworkTransport) {
        this.localNodeId = localNodeId;
        this.transport = transport;
        for (let i = 0; i < ID_BYTE_LENGTH * 8; i++) {
            this.buckets.push(new KBucket());
        }
    }

    private getBucketIndex(targetId: NodeID): number {
        const distance = xorDistance(this.localNodeId, targetId);
        for (let i = 0; i < ID_BYTE_LENGTH; i++) {
            if (distance[i] !== 0) {
                return (i * 8) + (Math.floor(Math.log2(distance[i])));
            }
        }
        return 0;
    }

    async addPeer(peer: PeerInfo): Promise<boolean> {
        if (peer.id.every((byte, i) => byte === this.localNodeId[i])) {
            return false;
        }
        const bucketIndex = this.getBucketIndex(peer.id);
        return await this.buckets[bucketIndex].addPeer(peer, this.localNodeId, this.transport);
    }

    removePeer(peerId: NodeID): void {
        const bucketIndex = this.getBucketIndex(peerId);
        this.buckets[bucketIndex].removePeer(peerId);
    }

    findClosestPeers(targetId: NodeID, count: number = K_BUCKET_SIZE): PeerInfo[] {
        const allKnownPeers: PeerInfo[] = [];
        for (const bucket of this.buckets) {
            allKnownPeers.push(...bucket.getAllPeers());
        }

        const peersWithDistance = allKnownPeers.map(peer => ({
            peer: peer,
            distance: xorDistance(targetId, peer.id)
        }));

        peersWithDistance.sort((a, b) => compareDistances(a.distance, b.distance));

        return peersWithDistance.slice(0, count).map(pd => pd.peer);
    }

    getAllPeers(): PeerInfo[] {
        const allPeers: PeerInfo[] = [];
        for (const bucket of this.buckets) {
            allPeers.push(...bucket.getAllPeers());
        }
        return allPeers;
    }
}

interface KademliaStore {
    [key: string]: { value: any; publisher: PeerInfo; lastPublished: number };
}

export class KademliaDHT {
    private readonly localNodeId: NodeID;
    private readonly localPeerInfo: PeerInfo;
    private readonly routingTable: RoutingTable;
    private readonly store: KademliaStore = {};
    private readonly transport: NetworkTransport;
    private rpcHandlers: Map<string, (message: KademliaRpcMessage) => Promise<KademliaRpcResponse>>;

    constructor(localNodeId: NodeID, transport: NetworkTransport) {
        this.localNodeId = localNodeId;
        this.transport = transport;
        this.localPeerInfo = {
            id: localNodeId,
            address: transport.getLocalAddress(),
            lastSeen: Date.now()
        };
        this.routingTable = new RoutingTable(localNodeId, transport);
        this.rpcHandlers = new Map();

        this.transport.onRpc(this.handleIncomingRpc.bind(this));

        this.rpcHandlers.set('PING', this.handlePing.bind(this));
        this.rpcHandlers.set('STORE', this.handleStore.bind(this));
        this.rpcHandlers.set('FIND_NODE', this.handleFindNode.bind(this));
        this.rpcHandlers.set('FIND_VALUE', this.handleFindValue.bind(this));
    }

    getLocalNodeId(): NodeID {
        return this.localNodeId;
    }

    private async handleIncomingRpc(message: KademliaRpcMessage): Promise<KademliaRpcResponse> {
        await this.routingTable.addPeer(message.sender);

        const handler = this.rpcHandlers.get(message.type);
        if (handler) {
            return handler(message);
        } else {
            console.warn(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Received unknown RPC type: ${message.type}`);
            return {
                type: `${message.type}_RES` as any,
                sender: this.localPeerInfo,
                requestId: message.requestId,
                success: false,
                error: `Unknown RPC type: ${message.type}`
            };
        }
    }

    private async handlePing(message: KademliaRpcMessage): Promise<KademliaRpcResponse> {
        console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Received PING from ${nodeIdToHex(message.sender.id).substring(0, 8)}`);
        return {
            type: 'PING_RES',
            sender: this.localPeerInfo,
            requestId: message.requestId,
            success: true
        };
    }

    private async handleStore(message: KademliaRpcMessage): Promise<KademliaRpcResponse> {
        const { key, value } = message.payload;
        if (!key || value === undefined) {
            return {
                type: 'STORE_RES',
                sender: this.localPeerInfo,
                requestId: message.requestId,
                success: false,
                error: 'Missing key or value for STORE RPC.'
            };
        }
        this.store[key] = { value, publisher: message.sender, lastPublished: Date.now() };
        console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Stored key "${key}" from ${nodeIdToHex(message.sender.id).substring(0, 8)}`);
        return {
            type: 'STORE_RES',
            sender: this.localPeerInfo,
            requestId: message.requestId,
            success: true
        };
    }

    private async handleFindNode(message: KademliaRpcMessage): Promise<KademliaRpcResponse> {
        const { targetId } = message.payload;
        if (!targetId) {
            return {
                type: 'FIND_NODE_RES',
                sender: this.localPeerInfo,
                requestId: message.requestId,
                success: false,
                error: 'Missing targetId for FIND_NODE RPC.'
            };
        }
        const targetNodeId = hexToNodeId(targetId);
        const closestPeers = this.routingTable.findClosestPeers(targetNodeId, K_BUCKET_SIZE);
        console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Responding to FIND_NODE for ${targetId.substring(0, 8)} with ${closestPeers.length} peers.`);
        return {
            type: 'FIND_NODE_RES',
            sender: this.localPeerInfo,
            requestId: message.requestId,
            success: true,
            payload: { closestPeers }
        };
    }

    private async handleFindValue(message: KademliaRpcMessage): Promise<KademliaRpcResponse> {
        const { key } = message.payload;
        if (!key) {
            return {
                type: 'FIND_VALUE_RES',
                sender: this.localPeerInfo,
                requestId: message.requestId,
                success: false,
                error: 'Missing key for FIND_VALUE RPC.'
            };
        }

        const storedData = this.store[key];
        if (storedData) {
            console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Found value for key "${key}".`);
            return {
                type: 'FIND_VALUE_RES',
                sender: this.localPeerInfo,
                requestId: message.requestId,
                success: true,
                payload: { value: storedData.value }
            };
        } else {
            const keyHash = await generateNodeId(key);
            const closestPeers = this.routingTable.findClosestPeers(keyHash, K_BUCKET_SIZE);
            console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Value for key "${key}" not found. Returning ${closestPeers.length} closest peers.`);
            return {
                type: 'FIND_VALUE_RES',
                sender: this.localPeerInfo,
                requestId: message.requestId,
                success: true,
                payload: { closestPeers }
            };
        }
    }

    async bootstrap(bootstrapPeers: PeerInfo[]): Promise<void> {
        console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Bootstrapping with ${bootstrapPeers.length} peers.`);
        for (const peer of bootstrapPeers) {
            try {
                const response = await this.transport.sendRpc(peer.address, {
                    type: 'PING',
                    sender: this.localPeerInfo,
                    requestId: generateRequestId()
                });
                if (response.success) {
                    await this.routingTable.addPeer(peer);
                    console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] PING successful to bootstrap peer ${nodeIdToHex(peer.id).substring(0, 8)}.`);
                }
            } catch (e) {
                console.warn(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Failed to PING bootstrap peer ${nodeIdToHex(peer.id).substring(0, 8)}: ${e}`);
            }
        }
        await this.findNode(this.localNodeId);
        console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Bootstrap complete. Routing table size: ${this.routingTable.getAllPeers().length}`);
    }

    async findNode(targetId: NodeID): Promise<PeerInfo[]> {
        console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Starting FIND_NODE lookup for target ${nodeIdToHex(targetId).substring(0, 8)}`);

        let closestPeers = this.routingTable.findClosestPeers(targetId, K_BUCKET_SIZE);
        const queriedPeers: Set<string> = new Set(closestPeers.map(p => nodeIdToHex(p.id)));
        const candidatePeers: PeerInfo[] = [];

        for (const peer of closestPeers) {
            candidatePeers.push(peer);
        }

        let newPeersFound = true;
        let iteration = 0;

        while (newPeersFound && iteration < 5) {
            newPeersFound = false;
            iteration++;

            const peersToQuery = candidatePeers
                .filter(p => !queriedPeers.has(nodeIdToHex(p.id)))
                .slice(0, ALPHA);

            if (peersToQuery.length === 0) {
                break;
            }

            const queryPromises: Promise<void>[] = [];

            for (const peer of peersToQuery) {
                queriedPeers.add(nodeIdToHex(peer.id));
                queryPromises.push((async () => {
                    try {
                        const response = await this.transport.sendRpc(peer.address, {
                            type: 'FIND_NODE',
                            sender: this.localPeerInfo,
                            requestId: generateRequestId(),
                            payload: { targetId: nodeIdToHex(targetId) }
                        });

                        if (response.success && response.payload && response.payload.closestPeers) {
                            for (const foundPeer of response.payload.closestPeers) {
                                await this.routingTable.addPeer(foundPeer);
                                const foundPeerIdHex = nodeIdToHex(foundPeer.id);
                                if (!candidatePeers.some(p => nodeIdToHex(p.id) === foundPeerIdHex)) {
                                    candidatePeers.push(foundPeer);
                                    newPeersFound = true;
                                }
                            }
                        } else {
                            console.warn(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] FIND_NODE to ${nodeIdToHex(peer.id).substring(0, 8)} failed: ${response.error}`);
                        }
                    } catch (e) {
                        console.warn(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Error during FIND_NODE to ${nodeIdToHex(peer.id).substring(0, 8)}: ${e}`);
                        this.routingTable.removePeer(peer.id);
                    }
                })());
            }

            await Promise.allSettled(queryPromises);

            candidatePeers.sort((a, b) => {
                const distA = xorDistance(targetId, a.id);
                const distB = xorDistance(targetId, b.id);
                return compareDistances(distA, distB);
            });
            candidatePeers.splice(K_BUCKET_SIZE);

            const currentClosestIds = new Set(closestPeers.map(p => nodeIdToHex(p.id)));
            const newClosestCandidates = candidatePeers.slice(0, K_BUCKET_SIZE);
            const newClosestIds = new Set(newClosestCandidates.map(p => nodeIdToHex(p.id)));

            const changed = newClosestCandidates.some(p => !currentClosestIds.has(nodeIdToHex(p.id))) ||
                            closestPeers.some(p => !newClosestIds.has(nodeIdToHex(p.id)));

            if (changed) {
                closestPeers = newClosestCandidates;
                newPeersFound = true;
            } else {
                newPeersFound = false;
            }
        }
        console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] FIND_NODE for ${nodeIdToHex(targetId).substring(0, 8)} finished. Found ${closestPeers.length} peers.`);
        return closestPeers;
    }

    async store(key: string, value: any): Promise<void> {
        const keyHash = await generateNodeId(key);
        const closestPeers = await this.findNode(keyHash);

        const storePromises: Promise<void>[] = [];
        for (const peer of closestPeers) {
            storePromises.push((async () => {
                try {
                    const response = await this.transport.sendRpc(peer.address, {
                        type: 'STORE',
                        sender: this.localPeerInfo,
                        requestId: generateRequestId(),
                        payload: { key, value }
                    });
                    if (response.success) {
                        console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Successfully stored key "${key}" on peer ${nodeIdToHex(peer.id).substring(0, 8)}.`);
                    } else {
                        console.warn(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Failed to store key "${key}" on peer ${nodeIdToHex(peer.id).substring(0, 8)}: ${response.error}`);
                    }
                } catch (e) {
                    console.error(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Error storing key "${key}" on peer ${nodeIdToHex(peer.id).substring(0, 8)}: ${e}`);
                    this.routingTable.removePeer(peer.id);
                }
            })());
        }
        await Promise.allSettled(storePromises);
    }

    async findValue(key: string): Promise<any | null> {
        const keyHash = await generateNodeId(key);
        console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Starting FIND_VALUE lookup for key "${key}" (hash: ${nodeIdToHex(keyHash).substring(0, 8)})`);

        if (this.store[key]) {
            console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Found key "${key}" in local store.`);
            return this.store[key].value;
        }

        let closestPeers = this.routingTable.findClosestPeers(keyHash, K_BUCKET_SIZE);
        const queriedPeers: Set<string> = new Set(closestPeers.map(p => nodeIdToHex(p.id)));
        const candidatePeers: PeerInfo[] = [];

        for (const peer of closestPeers) {
            candidatePeers.push(peer);
        }

        let newPeersFound = true;
        let iteration = 0;
        let valueFound: any | null = null;

        while (newPeersFound && valueFound === null && iteration < 5) {
            newPeersFound = false;
            iteration++;

            const peersToQuery = candidatePeers
                .filter(p => !queriedPeers.has(nodeIdToHex(p.id)))
                .slice(0, ALPHA);

            if (peersToQuery.length === 0 && iteration > 1) {
                break;
            }

            const queryPromises: Promise<void>[] = [];

            for (const peer of peersToQuery) {
                queriedPeers.add(nodeIdToHex(peer.id));
                queryPromises.push((async () => {
                    try {
                        const response = await this.transport.sendRpc(peer.address, {
                            type: 'FIND_VALUE',
                            sender: this.localPeerInfo,
                            requestId: generateRequestId(),
                            payload: { key }
                        });

                        if (response.success) {
                            if (response.payload && response.payload.value !== undefined) {
                                valueFound = response.payload.value;
                                console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Value for key "${key}" found on peer ${nodeIdToHex(peer.id).substring(0, 8)}.`);
                                const distToLocal = xorDistance(keyHash, this.localNodeId);
                                const distToFoundPeer = xorDistance(keyHash, peer.id);
                                if (compareDistances(distToLocal, distToFoundPeer) < 0) {
                                    this.store[key] = { value: valueFound, publisher: peer, lastPublished: Date.now() };
                                    console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Replicated key "${key}" locally.`);
                                }
                            } else if (response.payload && response.payload.closestPeers) {
                                for (const foundPeer of response.payload.closestPeers) {
                                    await this.routingTable.addPeer(foundPeer);
                                    const foundPeerIdHex = nodeIdToHex(foundPeer.id);
                                    if (!candidatePeers.some(p => nodeIdToHex(p.id) === foundPeerIdHex)) {
                                        candidatePeers.push(foundPeer);
                                        newPeersFound = true;
                                    }
                                }
                            }
                        } else {
                            console.warn(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] FIND_VALUE to ${nodeIdToHex(peer.id).substring(0, 8)} failed: ${response.error}`);
                        }
                    } catch (e) {
                        console.error(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] Error during FIND_VALUE to ${nodeIdToHex(peer.id).substring(0, 8)}: ${e}`);
                        this.routingTable.removePeer(peer.id);
                    }
                })());
            }

            await Promise.allSettled(queryPromises);

            if (valueFound !== null) {
                break;
            }

            candidatePeers.sort((a, b) => {
                const distA = xorDistance(keyHash, a.id);
                const distB = xorDistance(keyHash, b.id);
                return compareDistances(distA, distB);
            });
            candidatePeers.splice(K_BUCKET_SIZE);

            const currentClosestIds = new Set(closestPeers.map(p => nodeIdToHex(p.id)));
            const newClosestCandidates = candidatePeers.slice(0, K_BUCKET_SIZE);
            const newClosestIds = new Set(newClosestCandidates.map(p => nodeIdToHex(p.id)));

            const changed = newClosestCandidates.some(p => !currentClosestIds.has(nodeIdToHex(p.id))) ||
                            closestPeers.some(p => !newClosestIds.has(nodeIdToHex(p.id)));

            if (changed) {
                closestPeers = newClosestCandidates;
                newPeersFound = true;
            } else {
                newPeersFound = false;
            }
        }
        console.log(`[${nodeIdToHex(this.localNodeId).substring(0, 8)}] FIND_VALUE for key "${key}" finished. Value found: ${valueFound !== null}.`);
        return valueFound;
    }

    async publish(key: string, value: any): Promise<void> {
        return this.store(key, value);
    }
}

function generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
}