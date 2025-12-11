```typescript
import { GraphNode, GraphEdge } from '../types';

// Interface for layout strategies
export interface GraphLayoutStrategy {
  layout(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number): GraphNode[];
}

// Simple strategy: Circle Layout
export class CircleLayout implements GraphLayoutStrategy {
  layout(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number): GraphNode[] {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 50; // Adjust for padding
    const numNodes = nodes.length;

    return nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / numNodes;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { ...node, x, y };
    });
  }
}


// Force-Directed Layout (Simple Implementation) -  A basic implementation, can be optimized.
export class ForceDirectedLayout implements GraphLayoutStrategy {
    layout(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number): GraphNode[] {
        const nodeMap = new Map<string, GraphNode>(nodes.map(node => [node.id, { ...node }])); // Create a mutable copy

        // Constants
        const k = Math.sqrt((width * height) / nodes.length);  // Ideal distance between nodes
        const repulsionStrength = 1;
        const linkStrength = 0.1;
        const friction = 0.9;
        const maxDisplacement = 10; // Prevent excessive movement

        // Initialize velocities
        for (const node of nodeMap.values()) {
            node.vx = 0;
            node.vy = 0;
        }


        // Simulation steps
        for (let iteration = 0; iteration < 100; iteration++) { // Adjust iterations for better convergence
            // Calculate forces
            const forces = new Map<string, { fx: number; fy: number }>();
            for (const nodeId of nodeMap.keys()) {
                forces.set(nodeId, { fx: 0, fy: 0 }); // Initialize forces for each node
            }

            // Repulsive forces (node-node)
            for (const nodeAId of nodeMap.keys()) {
                const nodeA = nodeMap.get(nodeAId)!;
                for (const nodeBId of nodeMap.keys()) {
                    if (nodeAId === nodeBId) continue;
                    const nodeB = nodeMap.get(nodeBId)!;
                    const dx = nodeA.x - nodeB.x;
                    const dy = nodeA.y - nodeB.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance > 0) { // Avoid division by zero
                        const force = repulsionStrength * k * k / distance;
                        const fx = dx * force;
                        const fy = dy * force;

                        const existingForceA = forces.get(nodeAId)!;
                        forces.set(nodeAId, { fx: existingForceA.fx + fx, fy: existingForceA.fy + fy });
                        const existingForceB = forces.get(nodeBId)!;
                        forces.set(nodeBId, { fx: existingForceB.fx - fx, fy: existingForceB.fy - fy }); //apply the opposite force to B
                    }
                }
            }

            // Attractive forces (along edges)
            for (const edge of edges) {
                const sourceNode = nodeMap.get(edge.source)!;
                const targetNode = nodeMap.get(edge.target)!;
                const dx = sourceNode.x - targetNode.x;
                const dy = sourceNode.y - targetNode.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const force = linkStrength * distance;  //  Hooke's Law: F = kx

                const fx = dx * force;
                const fy = dy * force;
                const existingForceSource = forces.get(edge.source)!;
                forces.set(edge.source, { fx: existingForceSource.fx - fx, fy: existingForceSource.fy - fy });
                const existingForceTarget = forces.get(edge.target)!;
                forces.set(edge.target, { fx: existingForceTarget.fx + fx, fy: existingForceTarget.fy + fy });
            }


            // Apply forces and update positions and velocities
            for (const nodeId of nodeMap.keys()) {
                const node = nodeMap.get(nodeId)!;
                const force = forces.get(nodeId)!;
                node.vx = (node.vx * friction + force.fx);
                node.vy = (node.vy * friction + force.fy);
                const displacementX = Math.max(-maxDisplacement, Math.min(maxDisplacement, node.vx)); // Limit displacement
                const displacementY = Math.max(-maxDisplacement, Math.min(maxDisplacement, node.vy));
                node.x += displacementX;
                node.y += displacementY;


                // Keep nodes within bounds
                node.x = Math.max(0, Math.min(width, node.x));
                node.y = Math.max(0, Math.min(height, node.y));
            }
        }


        return Array.from(nodeMap.values()); // Return the positioned nodes
    }
}
```