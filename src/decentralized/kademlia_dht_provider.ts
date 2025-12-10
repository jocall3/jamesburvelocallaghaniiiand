```typescript
import { Libp2p } from 'libp2p';
import { Kademlia } from '@libp2p/kad-dht';
import { PeerId } from '@libp2p/interfaces/peer-id';
import { multiaddr } from '@multiformats/multiaddr';
import { isString } from '@libp2p/interfaces/utils';

export class KademliaDHTProvider {
  private libp2p: Libp2p;
  private kad: Kademlia | null = null;
  private readonly bootstrapPeers: string[];

  constructor(libp2p: Libp2p, bootstrapPeers: string[] = []) {
    this.libp2p = libp2p;
    this.bootstrapPeers = bootstrapPeers;
  }

  async start(): Promise<void> {
    if (!this.libp2p.dht) {
      throw new Error('Libp2p instance is not configured with DHT.');
    }

    this.kad = this.libp2p.dht as Kademlia;

    try {
      if (this.bootstrapPeers.length > 0) {
        await this.bootstrap();
      }
    } catch (error) {
        console.error("Kademlia DHT bootstrap failed:", error);
    }
  }


  async bootstrap(): Promise<void> {
      if (!this.kad) {
          throw new Error('Kademlia DHT not initialized.');
      }
      try {
          const bootstrapAddresses = this.bootstrapPeers.map(addr => {
              if (isString(addr)) {
                  try {
                      return multiaddr(addr);
                  } catch (e) {
                      console.warn(`Invalid multiaddr in bootstrap peer list: ${addr}. Skipping.`);
                      return null;
                  }
              }
              return null; // Handle potential non-string addresses
          }).filter(addr => addr !== null) as any[]; // Type assertion for non-null addresses

          if (bootstrapAddresses.length === 0) {
              console.warn("No valid bootstrap addresses provided for Kademlia DHT.");
              return;
          }

          await this.kad.bootstrap({
              peerAddresses: bootstrapAddresses
          });

      } catch (error) {
          console.error("Error bootstrapping Kademlia DHT:", error);
          throw error; // Re-throw to propagate the error
      }
  }


  async put(key: string, value: Uint8Array): Promise<void> {
    if (!this.kad) {
      throw new Error('Kademlia DHT not initialized.');
    }

    try {
      await this.kad.put(key, value);
    } catch (error) {
      console.error('Error putting value in Kademlia DHT:', error);
      throw error;
    }
  }

  async get(key: string): Promise<Uint8Array | null> {
    if (!this.kad) {
      throw new Error('Kademlia DHT not initialized.');
    }

    try {
      const result = await this.kad.get(key);
      return result?.data || null;
    } catch (error) {
      console.error('Error getting value from Kademlia DHT:', error);
      throw error;
    }
  }

  async findPeer(peerId: PeerId): Promise<void> {
    if (!this.kad) {
      throw new Error('Kademlia DHT not initialized.');
    }

    try {
      await this.kad.findPeer(peerId);
    } catch (error) {
      console.error('Error finding peer in Kademlia DHT:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    // Optionally perform cleanup/shutdown tasks here
    this.kad = null;
  }
}
```