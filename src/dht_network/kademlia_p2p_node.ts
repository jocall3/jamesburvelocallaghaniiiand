import { createLibp2p } from 'libp2p';
import { TCP } from '@libp2p/tcp';
import { WebSockets } from '@libp2p/websockets';
import { WebRTCStar } from '@libp2p/webrtc-star';
import { Bootstrap } from '@libp2p/bootstrap';
import { KadDHT } from '@libp2p/kad-dht';
import { GossipSub } from '@libp2p/gossipsub';
import { mdns } from '@libp2p/mdns';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { sha256 } from 'multiformats/hashes/sha2';
import { CID } from 'multiformats/cid';
import { fromString } from 'uint8arrays/from-string';
import { toString } from 'uint8arrays/to-string';

interface KademliaNodeOptions {
  peerId?: string; // Optional: Use a specific Peer ID.  Otherwise, libp2p generates one.
  listenAddresses?: string[]; // Optional: Addresses to listen on, e.g., /ip4/0.0.0.0/tcp/0
  bootstrapPeers?: string[]; // Optional: Bootstrap nodes for initial connection.
  dht?: boolean; // Enable/disable DHT functionality. Defaults to true.
  webRTCStar?: boolean; // Enable/disable WebRTC Star functionality.  Defaults to true.
}

export class KademliaP2PNode {
  private libp2p: any;
  private kadDht: any;
  private peerId: string | undefined;
  private dataStore: Map<string, Uint8Array> = new Map();

  constructor(private options: KademliaNodeOptions = {}) {
    this.peerId = options.peerId;
  }

  async start(): Promise<void> {
    const listenAddresses = this.options.listenAddresses || ['/ip4/0.0.0.0/tcp/0', '/ip4/0.0.0.0/tcp/9090/ws'];
    const bootstrapPeers = this.options.bootstrapPeers || [];
    const enableDHT = this.options.dht !== false; // Default to true
    const enableWebRTCStar = this.options.webRTCStar !== false; // Default to true

    const bootstrapConfig: any = {
      list: bootstrapPeers,
    };

    const libp2pConfig: any = {
      peerId: this.peerId,
      addresses: {
        listen: listenAddresses,
      },
      transports: [
        new TCP(),
        new WebSockets()
      ],
      streamMuxers: [yamux()],
      connectionEncryption: [noise()],
      pubsub: GossipSub(),
      services: {},
    };

    if (enableDHT) {
        libp2pConfig.services.dht = new KadDHT({
          clientMode: false,
          kBucketSize: 20,
          providers: {
            provideTimeout: 60 * 1000,
          },
        });
    }

    if (enableWebRTCStar) {
      libp2pConfig.transports.push(new WebRTCStar());
    }

    if (bootstrapPeers.length > 0) {
      libp2pConfig.peerDiscovery = [
        new Bootstrap(bootstrapConfig)
      ];
    } else {
        libp2pConfig.peerDiscovery = [mdns()];
    }

    this.libp2p = await createLibp2p(libp2pConfig);

    this.libp2p.addEventListener('peer:discovery', (evt: any) => {
      const peerId = evt.detail.id.toString();
      console.log('Discovered peer: ', peerId);
    });

    this.libp2p.addEventListener('peer:connect', (evt: any) => {
      const peerId = evt.detail.remotePeer.toString();
      console.log('Connected to peer: ', peerId);
    });

    this.libp2p.addEventListener('peer:disconnect', (evt: any) => {
        const peerId = evt.detail.remotePeer.toString();
        console.log('Disconnected from peer: ', peerId);
    });

    await this.libp2p.start();
    console.log('Kademlia P2P Node started. Peer ID:', this.libp2p.peerId.toString());
    console.log('Listening on addresses:', this.libp2p.getMultiaddrs().map((ma: any) => ma.toString()));

    if(enableDHT && this.libp2p.dht) {
        this.kadDht = this.libp2p.dht;
    }
  }

  async stop(): Promise<void> {
    if (this.libp2p) {
      await this.libp2p.stop();
      console.log('Kademlia P2P Node stopped.');
    }
  }

  async put(key: string, value: string | Uint8Array): Promise<void> {
      if (!this.kadDht) {
          console.warn('DHT not enabled or initialized.');
          return;
      }

      const valueBytes = typeof value === 'string' ? fromString(value) : value;
      try {
          await this.kadDht.put(key, valueBytes);
          console.log(`Stored value for key "${key}"`);
      } catch (error) {
          console.error(`Error putting value for key "${key}":`, error);
      }
  }


    async get(key: string): Promise<Uint8Array | null> {
        if (!this.kadDht) {
            console.warn('DHT not enabled or initialized.');
            return null;
        }

        try {
            const result = await this.kadDht.get(key);
            if (result && result.value) {
                return result.value;
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error getting value for key "${key}":`, error);
            return null;
        }
    }


  async publish(topic: string, message: string): Promise<void> {
    if (!this.libp2p.pubsub) {
        console.warn('PubSub not initialized.');
        return;
    }

    try {
        await this.libp2p.pubsub.publish(topic, fromString(message));
        console.log(`Published to topic "${topic}": ${message}`);
    } catch (error) {
        console.error(`Error publishing to topic "${topic}":`, error);
    }
  }


  async subscribe(topic: string, handler: (message: string, from:string) => void): Promise<void> {
    if (!this.libp2p.pubsub) {
        console.warn('PubSub not initialized.');
        return;
    }

    try {
      await this.libp2p.pubsub.subscribe(topic);
      console.log(`Subscribed to topic "${topic}"`);

      this.libp2p.pubsub.addEventListener('message', (evt: any) => {
        if (evt.detail.topic === topic) {
          const message = toString(evt.detail.data);
          const from = evt.detail.from.toString();
          handler(message, from);
        }
      });
    } catch (error) {
        console.error(`Error subscribing to topic "${topic}":`, error);
    }
  }

  async getPeerId(): Promise<string> {
    if (!this.libp2p) {
      throw new Error('Libp2p node not started.');
    }
    return this.libp2p.peerId.toString();
  }
}