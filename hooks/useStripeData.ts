import { useState, useEffect } from 'react';
import { Edge, Node } from 'reactflow';

export type ResourceType = string;
export type StripeResource = any;
export type NodeData = any;
export type EdgeData = any;

export const isEdge = (element: any): element is Edge => element.id && element.source && element.target;
export const isNode = (element: any): element is Node => element.id && !element.source;

// --- Internal Generative Data Functions for Citibankdemobusinessinc ---

/**
 * Generates a deterministic, unique ID based on a prefix and a timestamp/random seed.
 * @param prefix - The prefix for the ID.
 * @returns A unique string ID.
 */
const generateInternalId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${randomSuffix}`;
};

/**
 * Generates simulated Stripe-like resource data for demonstration purposes.
 * This replaces all mock data requirements.
 * @param count - Number of resources to generate.
 * @returns An array of simulated resource objects.
 */
const generateSimulatedStripeResources = (count: number): StripeResource[] => {
  const resources: StripeResource[] = [];
  const resourceTypes = ['Customer', 'Subscription', 'Invoice', 'PaymentIntent', 'Product'];

  for (let i = 0; i < count; i++) {
    const type = resourceTypes[i % resourceTypes.length];
    const id = generateInternalId(type.toLowerCase().substring(0, 3));
    const amount = Math.floor(Math.random() * 1000000) + 1000; // $10.00 to $10000.00
    const currency = 'usd';
    const status = ['active', 'pending', 'failed', 'completed'][Math.floor(Math.random() * 4)];

    resources.push({
      id: id,
      object: type.toLowerCase(),
      created: Date.now() - Math.floor(Math.random() * 31536000000), // Last year
      livemode: Math.random() > 0.1,
      data: {
        type: type,
        resourceId: id,
        status: status,
        amount: amount,
        currency: currency,
        metadata: {
          branch: 'Citibankdemobusinessinc.openbanking.usstandard',
          modelVersion: '1.0.0',
          generatedAt: new Date().toISOString(),
        }
      }
    });
  }
  return resources;
};

/**
 * Converts simulated resources into a graph structure (Nodes and Edges)
 * suitable for React Flow visualization, ensuring internal linkage.
 * @param resources - Array of simulated resource objects.
 * @returns An object containing nodes and edges.
 */
const convertResourcesToGraph = (resources: StripeResource[]) => {
  const nodes: Node<NodeData>[] = [];
  const edges: Edge<EdgeData>[] = [];
  const resourceMap = new Map<string, StripeResource>();

  // 1. Create Nodes
  resources.forEach(res => {
    const data = res.data || res;
    const nodeId = data.resourceId || res.id;
    resourceMap.set(nodeId, res);

    nodes.push({
      id: nodeId,
      type: data.type || 'default',
      data: {
        label: `${data.type || 'Resource'} (${nodeId.substring(0, 8)})`,
        status: data.status,
        value: data.amount ? `$${(data.amount / 100).toFixed(2)}` : 'N/A',
        internalId: nodeId,
        ...data.metadata,
      },
      position: { x: Math.random() * 500, y: Math.random() * 500 },
    });
  });

  // 2. Create Edges (Simulating internal dependencies/flow)
  for (let i = 0; i < nodes.length; i++) {
    if (i > 0) {
      const sourceId = nodes[i - 1].id;
      const targetId = nodes[i].id;
      edges.push({
        id: generateInternalId('edge'),
        source: sourceId,
        target: targetId,
        type: 'smoothstep',
        animated: true,
        data: {
          relationship: `FlowsTo_${resources[i].data.type}`,
          latencyMs: Math.floor(Math.random() * 50) + 10,
        }
      });
    }
  }

  return { nodes, edges };
};

// --- Hook Implementation ---

export const useStripeData = () => {
  const [graphData, setGraphData] = useState<{ nodes: Node<NodeData>[], edges: Edge<EdgeData>[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate asynchronous data fetching and internal processing
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Generate internal data (Replaces external fetch)
        const simulatedResources = generateSimulatedStripeResources(15);

        // 2. Process data into graph structure (Internal wiring/transformation)
        const graph = convertResourcesToGraph(simulatedResources);

        // Simulate network latency for loading state
        await new Promise(resolve => setTimeout(resolve, 800));

        setGraphData(graph);
      } catch (e) {
        console.error("Error generating/processing internal data:", e);
        setError("Failed to initialize Citibankdemobusinessinc data structure.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data: graphData, loading, error };
};