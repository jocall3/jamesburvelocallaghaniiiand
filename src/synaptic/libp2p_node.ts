import { createLibp2p, Libp2pOptions } from 'libp2p';
import type { Libp2p } from '@libp2p/interface';
import { peerIdFromString, generatePeerId } from '@libp2p/peer-id';
import type { PeerId } from '@libp2p/interface/peer-id';

// Transports
import { webSockets } from '@libp2p/websockets';
import { webRTC } from '@libp2p/webrtc'; // Crucial for browser-to-browser
import { circuitRelayTransport } from '@libp2p/circuit-relay'; // Useful for NAT traversal through relays

// Stream Multiplexers
import { mplex } from '@libp2p/mplex';

// Connection Encryptors
import { noise } from '@chainsafe/libp2p-noise';

// Services
import { identifyService } from 'libp2p/identify';
import { kadDHT } from '@libp2p/kad-dht';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { mdns } from '@libp2p/mdns'; // Local peer discovery (primarily for Node.js, not browser)
import { autoNATService } from 'libp2p/autonat';
import { upnpService } from 'libp2p/upnp'; // Primarily for Node.js, not browser

// Multiaddrs
import { multiaddr } from '@multiformats/multiaddr';

/**
 * Configuration options for the Synaptic libp2p node.
 */
export interface SynapticLibp2pNodeConfig {
  /**
   * An optional PeerId instance or string to use. If not provided, a new one will be generated.
   */
  peerId?: PeerId | string;
  /**
   * Optional multiaddr strings for the node to advertise or listen on.
   * For browser nodes, these primarily include WebRTC signaling servers.
   * Examples: '/ip4/0.0.0.0/tcp/0/ws', '/dns4/wrtc-star.online/tcp/443/wss/p2p-webrtc-star'
   */
  listenAddrs?: string[];
  /**
   * Optional list of multiaddr strings for bootstrap peers to connect to the DHT.
   * These are essential for connecting to the wider libp2p network.
   * Example: ['/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/Qm...']
   */
  bootstrapPeers?: string[];
  /**
   * Whether the Kademlia DHT should run in client mode (default) or server mode.
   * Setting to `false` makes it a full DHT node, supporting "full authoritative mode".
   * In a browser, running a full DHT node can be resource-intensive, but possible.
   */
  dhtClientMode?: boolean;
}

/**
 * Initializes and configures a libp2p node for the Synaptic decentralized network.
 * This function sets up transports, services, and discovery mechanisms tailored
 * for a project with strong browser/WASM focus, including Kademlia DHT and Gossipsub.
 *
 * @param config Configuration options for the node.
 * @returns A promise that resolves to a configured libp2p node instance.
 */
export async function createSynapticLibp2pNode(config: SynapticLibp2pNodeConfig): Promise<Libp2p> {
  let peerId: PeerId;
  if (config.peerId) {
    peerId = typeof config.peerId === 'string' ? peerIdFromString(config.peerId) : config.peerId;
  } else {
    peerId = await generatePeerId();
  }

  // Default listening addresses for both browser and Node.js environments.
  // Browsers primarily rely on WebRTC signalling servers for "listening".
  const listenAddrs = config.listenAddrs || [
    // For Node.js instances (if any, typically for testing/relays)
    '/ip4/0.0.0.0/tcp/0/ws',
    // For browser instances, connect to WebRTC signaling servers
    '/dns4/wrtc-star.online/tcp/443/wss/p2p-webrtc-star',
    // Add more WebRTC signalling servers as needed for redundancy/decentralization
    // '/dns4/example-wrtc-star.com/tcp/443/wss/p2p-webrtc-star',
  ];

  const bootstrapPeers = config.bootstrapPeers || [
    // Official libp2p bootstrap nodes (replace with custom ones for a private network)
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMSRcSs2RT',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXUEQLBNwcxHm',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6oJYbftLgrAkieZr8eWcMwNtrag',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxuqThzCuGxWNqWTihoFhS7Zf4mC3cAxF7fUuonak',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmY7 nanotkP7d2x3fW8RzM4C9jGjV6SgNf6ZgVb1FpX4rB2',
    // Add custom bootstrap peers specific to your network if available
  ];

  if (bootstrapPeers.length === 0) {
    console.warn('No bootstrap peers provided. Node might have difficulty finding peers without a DHT entry point.');
  }

  const libp2pOptions: Libp2pOptions = {
    peerId,
    addresses: {
      listen: listenAddrs,
    },
    transports: [
      webSockets(), // Essential for browser-based nodes to connect to servers/relays
      webRTC(), // Crucial for direct browser-to-browser connections
      circuitRelayTransport(), // Allows connections through relays, useful for NAT traversal
    ],
    connectionEncryption: [noise()], // Secure connection encryption
    streamMuxers: [mplex()], // Efficient stream multiplexing
    peerDiscovery: [
      // mDNS for local network discovery (primarily effective in Node.js/LAN environments)
      mdns({
        interval: 2000,
        enabled: true,
      }),
      // Kademlia DHT also acts as a peer discovery mechanism when configured with bootstrap peers.
    ],
    services: {
      identify: identifyService(), // Exchange peer info with connected peers
      dht: kadDHT({
        isClient: config.dhtClientMode ?? false, // Default to client mode, but allow full node for "authoritative mode"
        // Configure DHT with bootstrap peers for initial network entry
        bootstrap: {
          list: bootstrapPeers.map((addr) => multiaddr(addr)),
        },
      }),
      pubsub: gossipsub({
        allowPublishToZeroPeers: true, // Allow publishing even if no direct subscribers are known yet
        // Default settings for gossipsub generally provide good "gossip control".
        // Further fine-tuning (`D`, `D_HIGH`, `heartbeatInterval`, etc.) can be done here if needed.
      }),
      autoNAT: autoNATService(), // Automatic NAT traversal (useful for browser/Node.js)
      upnp: upnpService(), // Universal Plug and Play for port forwarding (primarily Node.js/router interaction)
    },
  };

  const node = await createLibp2p(libp2pOptions);

  // Add event listeners for important lifecycle events
  node.addEventListener('peer:discovery', (evt) => {
    const peerId = evt.detail.id;
    const multiaddrs = evt.detail.multiaddrs;
    console.log(`[libp2p] Discovered peer ${peerId.toString()} with addresses ${multiaddrs.map(ma => ma.toString())}`);
  });

  node.addEventListener('peer:connect', (evt) => {
    console.log(`[libp2p] Connected to peer ${evt.detail.toString()}`);
  });

  node.addEventListener('peer:disconnect', (evt) => {
    console.log(`[libp2p] Disconnected from peer ${evt.detail.toString()}`);
  });

  node.addEventListener('connection:open', (evt) => {
    const remotePeer = evt.detail.remoteAddr.getPeerId();
    if (remotePeer) {
        console.log(`[libp2p] New connection established to ${remotePeer.toString()}`);
    }
  });

  node.addEventListener('connection:close', (evt) => {
    const remotePeer = evt.detail.remoteAddr.getPeerId();
    if (remotePeer) {
        console.log(`[libp2p] Connection to ${remotePeer.toString()} closed`);
    }
  });

  // Start the libp2p node
  await node.start();
  console.log(`[libp2p] Node started with Peer ID: ${node.peerId.toString()}`);
  console.log('[libp2p] Listening on addresses:');
  node.getMultiaddrs().forEach((addr) => console.log(`  ${addr.toString()}`));

  return node;
}