```typescript
import { EventEmitter } from 'events';
import { Contact, RoutingTable } from './routing_table';
import { ID } from './types';

interface KademliaOptions {
  k: number; // Concurrency parameter
  alpha: number; // Number of nodes to query in parallel
  idLength: number; // Length of node IDs in bits
  port: number; // Port to listen on
}

const defaultKademliaOptions: KademliaOptions = {
  k: 20,
  alpha: 3,
  idLength: 160,
  port: 4000,
};


export class KademliaCore extends EventEmitter {
  nodeId: ID;
  routingTable: RoutingTable;
  options: KademliaOptions;

  constructor(nodeId: ID, options?: Partial<KademliaOptions>) {
    super();
    this.nodeId = nodeId;
    this.options = { ...defaultKademliaOptions, ...options };
    this.routingTable = new RoutingTable(this.nodeId, this.options.k, this.options.idLength);
  }

  /**
   * Adds a contact to the routing table.
   * @param contact The contact to add.
   */
  addContact(contact: Contact): void {
    this.routingTable.addContact(contact);
  }

  /**
   * Removes a contact from the routing table.
   * @param contact The contact to remove.
   */
  removeContact(contact: Contact): void {
    this.routingTable.removeContact(contact);
  }

  /**
   * Finds the closest contacts to a given ID.
   * @param targetId The ID to find the closest contacts to.
   * @param count The number of contacts to return. Defaults to k.
   * @returns An array of the closest contacts.
   */
  findClosestContacts(targetId: ID, count: number = this.options.k): Contact[] {
    return this.routingTable.findClosest(targetId, count);
  }

  /**
   * Handles the FIND_NODE RPC.
   * @param targetId The ID to find nodes close to.
   * @returns An array of the closest contacts from our routing table.
   */
  handleFindNode(targetId: ID): Contact[] {
    return this.findClosestContacts(targetId);
  }

  /**
   * Handles the FIND_VALUE RPC. This is a stub. In a full implementation,
   * it would check if we have the value and return it, or otherwise return
   * the closest nodes.
   * @param key The key to find the value for.
   * @returns Either the value or an array of the closest contacts.
   */
  handleFindValue(key: ID): Contact[] | any {
    // TODO: Implement value storage and retrieval.
    // For now, just return closest nodes.
    return this.findClosestContacts(key);
  }

  /**
   * Handles the STORE RPC. This is a stub.  In a full implementation,
   * this would store the value.
   * @param key The key to store the value for.
   * @param value The value to store.
   */
  handleStore(key: ID, value: any): void {
    // TODO: Implement value storage.
    console.log(`Storing key ${key} with value ${value}`);
  }


  /**
   * Implements the Kademlia PING operation.  A simple echo.
   * @returns "pong"
   */
  handlePing(): string {
    return "pong";
  }


  // Methods for sending RPCs would go here. These are stubs for now.
  async sendFindNode(contact: Contact, targetId: ID): Promise<Contact[]> {
    console.log(`Sending FIND_NODE to ${contact.id} for ${targetId}`);
    return []; // Placeholder
  }

  async sendFindValue(contact: Contact, key: ID): Promise<Contact[] | any> {
    console.log(`Sending FIND_VALUE to ${contact.id} for ${key}`);
    return []; // Placeholder
  }

  async sendStore(contact: Contact, key: ID, value: any): Promise<void> {
    console.log(`Sending STORE to ${contact.id} for ${key} = ${value}`);
    // Placeholder
  }

  async sendPing(contact: Contact): Promise<string> {
    console.log(`Sending PING to ${contact.id}`);
    return "pong"; // Placeholder
  }

  // Kademlia core logic - FIND_NODE operation (iterative)
  async iterativeFindNode(targetId: ID): Promise<Contact[]> {
    let closestContacts = this.findClosestContacts(targetId);
    let queried: { [key: string]: boolean } = {};
    let foundCloser = true;

    while (foundCloser) {
      foundCloser = false;
      const contactsToQuery = closestContacts
        .filter(c => !queried[c.id])
        .slice(0, this.options.alpha); // Query alpha nodes in parallel

      if (contactsToQuery.length === 0) {
        break; // No more nodes to query
      }

      const promises = contactsToQuery.map(async contact => {
        queried[contact.id] = true;
        try {
          return await this.sendFindNode(contact, targetId);
        } catch (error) {
          console.error(`Error querying node ${contact.id}:`, error);
          return []; // Ignore errors and continue with other nodes.  Could be a disconnect.
        }
      });

      const results = await Promise.all(promises);

      // Merge results and update closest contacts
      let newContacts: Contact[] = [];
      results.forEach(result => {
        if (Array.isArray(result)) {
          newContacts = newContacts.concat(result);
        }
      });

      newContacts.forEach(contact => this.addContact(contact));

      const allContacts = closestContacts.concat(newContacts);
      const uniqueContacts = Array.from(new Set(allContacts.map(c => c.id))).map(id => allContacts.find(c => c.id === id)!); // Unique contacts
      const sortedContacts = uniqueContacts
        .sort((a, b) => RoutingTable.distance(targetId, a.id) - RoutingTable.distance(targetId, b.id))
        .slice(0, this.options.k);


      if (sortedContacts.length > closestContacts.length || sortedContacts.some(c => !closestContacts.map(oldC => oldC.id).includes(c.id))) {
        foundCloser = true;
      }

      closestContacts = sortedContacts;
    }

    return closestContacts;
  }



  // Kademlia core logic - FIND_VALUE operation (iterative)
  async iterativeFindValue(key: ID): Promise<any> {
      let closestContacts = this.findClosestContacts(key);
      let queried: { [key: string]: boolean } = {};
      let foundValue = false;
      let value: any = null;

      while (!foundValue) {
          const contactsToQuery = closestContacts
              .filter(c => !queried[c.id])
              .slice(0, this.options.alpha); // Query alpha nodes in parallel

          if (contactsToQuery.length === 0) {
              break; // No more nodes to query
          }

          const promises = contactsToQuery.map(async contact => {
              queried[contact.id] = true;
              try {
                  return await this.sendFindValue(contact, key);
              } catch (error) {
                  console.error(`Error querying node ${contact.id}:`, error);
                  return []; // Ignore errors and continue with other nodes
              }
          });

          const results = await Promise.all(promises);

          for (const result of results) {
              if (!Array.isArray(result)) {
                  // We found the value!
                  value = result;
                  foundValue = true;
                  break;
              } else {
                  // Merge new contacts and update the routing table
                  (result as Contact[]).forEach(contact => this.addContact(contact));
              }
          }

          if (foundValue) {
              break;
          }


          const allContacts = closestContacts.concat(...results.filter(Array.isArray).flat());
          const uniqueContacts = Array.from(new Set(allContacts.map(c => c.id))).map(id => allContacts.find(c => c.id === id)!);
          closestContacts = uniqueContacts
              .sort((a, b) => RoutingTable.distance(key, a.id) - RoutingTable.distance(key, b.id))
              .slice(0, this.options.k);


      }

      return value || closestContacts; // Return either the value or the closest contacts
  }


  // Kademlia core logic - STORE operation (iterative)
  async iterativeStore(key: ID, value: any, replicationFactor:number = this.options.k): Promise<void> {
      const closestContacts = await this.iterativeFindNode(key); // find k closest nodes

      const storePromises = closestContacts.slice(0, replicationFactor).map(contact => {
          return this.sendStore(contact, key, value);
      });

      await Promise.all(storePromises);
  }
}
```