import { useEffect, useState, useMemo, useRef } from 'react';
import * as d3 from 'd3-force';

// Define types for nodes and links
export interface NodeData {
  id: string;
  // Add any other properties specific to your nodes if needed
  [key: string]: any;
}

export interface EdgeData {
  source: string; // ID of the source node
  target: string; // ID of the target node
  financialAffinity: number; // e.g., 0 to 1, or any range
  interactionFrequency: number; // e.g., count, or any range
  // Add any other properties specific to your edges if needed
  [key: string]: any;
}

export interface NodePosition extends NodeData, d3.SimulationNodeDatum {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface Link extends d3.SimulationLinkDatum<NodePosition> {
  source: NodePosition | string;
  target: NodePosition | string;
  // Keep original edge data for strength calculation
  financialAffinity: number;
  interactionFrequency: number;
}

interface GraphTopologyOptions {
  width?: number;
  height?: number;
  iterations?: number; // Number of simulation iterations
  linkStrengthBase?: number; // Base strength for links, minimum
  linkStrengthAffinityWeight?: number; // Weight for financialAffinity in link strength
  linkStrengthFrequencyWeight?: number; // Weight for interactionFrequency in link strength
  linkDistanceBase?: number; // Base distance for links (stronger links will have shorter distances)
  chargeStrength?: number; // Adjust overall node repulsion
  chargeDistanceMin?: number; // Minimum distance for charge force
  chargeDistanceMax?: number; // Maximum distance for charge force
  randomizeInitialPositions?: boolean; // If true, always randomize initial node positions. If false, try to preserve existing x,y or randomize if not present.
}

const defaultOptions: GraphTopologyOptions = {
  width: 1000,
  height: 800,
  iterations: 150, // A good number of iterations for a stable layout
  linkStrengthBase: 0.1, // Minimum link strength
  linkStrengthAffinityWeight: 0.5, // How much financialAffinity contributes to link strength
  linkStrengthFrequencyWeight: 0.5, // How much interactionFrequency contributes to link strength
  linkDistanceBase: 100, // Base distance for links
  chargeStrength: -200, // Default repulsion, larger negative value means more repulsion
  chargeDistanceMin: 1, // Minimum distance over which charge is applied
  chargeDistanceMax: 200, // Maximum distance over which charge is applied
  randomizeInitialPositions: false, // Default to false for layout stability
};

function useGraphTopology(
  nodesData: NodeData[],
  edgesData: EdgeData[],
  options?: GraphTopologyOptions
): NodePosition[] {
  const mergedOptions = { ...defaultOptions, ...options };
  const {
    width,
    height,
    iterations,
    linkStrengthBase,
    linkStrengthAffinityWeight,
    linkStrengthFrequencyWeight,
    linkDistanceBase,
    chargeStrength,
    chargeDistanceMin,
    chargeDistanceMax,
    randomizeInitialPositions
  } = mergedOptions;

  const [positionedNodes, setPositionedNodes] = useState<NodePosition[]>([]);

  // Memoize nodes and links for stable references within the effect
  // and to ensure D3 simulation receives fresh data only when inputs change
  const nodes = useMemo(() =>
    nodesData.map(d => ({ ...d })), [nodesData]
  );

  const links = useMemo(() =>
    edgesData.map(d => ({ ...d, source: d.source, target: d.target })), [edgesData]
  );

  // Ref to hold the simulation instance to ensure it's properly stopped and cleaned up
  const simulationRef = useRef<d3.Simulation<NodePosition, Link> | null>(null);

  useEffect(() => {
    // If no nodes or invalid dimensions, return empty array and stop any running simulation
    if (!nodes.length || !width || !height) {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      setPositionedNodes([]);
      return;
    }

    // Stop any existing simulation if the effect is re-run (e.g., dependencies change)
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Initialize node positions:
    // - If `randomizeInitialPositions` is true, assign random positions.
    // - Otherwise, try to preserve existing `x`, `y` from `nodesData` (if available),
    //   or assign random positions if `x`, `y` are undefined.
    const initialNodes: NodePosition[] = nodes.map(node => {
      const x = randomizeInitialPositions
        ? Math.random() * width
        : (node.x !== undefined ? node.x : Math.random() * width);
      const y = randomizeInitialPositions
        ? Math.random() * height
        : (node.y !== undefined ? node.y : Math.random() * height);

      return {
        ...node,
        x,
        y,
        vx: node.vx || 0, // Preserve velocity if exists, else 0
        vy: node.vy || 0, // Preserve velocity if exists, else 0
      };
    });

    // Create the D3 force simulation
    const simulation = d3.forceSimulation<NodePosition, Link>(initialNodes)
      .force("link", d3.forceLink<NodePosition, Link>(links).id((d: NodePosition) => d.id)
        .distance((link: Link) => {
          const affinity = link.financialAffinity || 0;
          const frequency = link.interactionFrequency || 0;

          // Combine affinity and frequency using weights.
          // This factor directly influences how close related nodes should be.
          const combinedFactor =
            (affinity * linkStrengthAffinityWeight!) +
            (frequency * linkStrengthFrequencyWeight!);

          // Higher combinedFactor leads to a shorter desired link distance.
          // Adding 1 to the denominator prevents division by zero and ensures distance
          // is inversely proportional to the strength, without becoming excessively large for very weak links.
          return linkDistanceBase! / (1 + combinedFactor);
        })
        .strength((link: Link) => {
          const affinity = link.financialAffinity || 0;
          const frequency = link.interactionFrequency || 0;

          // Combine affinity and frequency using weights for link strength.
          // This factor directly influences the "pull" between related nodes.
          const combinedFactor =
            (affinity * linkStrengthAffinityWeight!) +
            (frequency * linkStrengthFrequencyWeight!);

          // Clamp strength to a reasonable range (e.g., between `linkStrengthBase` and 1.0)
          // to prevent links from being too weak or overpoweringly strong.
          return Math.max(linkStrengthBase!, Math.min(1.0, combinedFactor));
        })
      )
      .force("charge", d3.forceManyBody().strength(chargeStrength!)
        .distanceMin(chargeDistanceMin!)
        .distanceMax(chargeDistanceMax!)
      )
      .force("center", d3.forceCenter(width / 2, height / 2)) // Pull all nodes towards the center of the canvas
      .force("x", d3.forceX(width / 2).strength(0.05)) // Gentle pull towards center X for stability
      .force("y", d3.forceY(height / 2).strength(0.05)); // Gentle pull towards center Y for stability

    simulationRef.current = simulation; // Store the simulation instance

    // Run the simulation synchronously for a fixed number of iterations.
    // This makes the layout deterministic and stable after the initial calculation.
    for (let i = 0; i < iterations!; ++i) {
      simulation.tick();
    }

    // Update the React state with the final calculated positions.
    // A new array must be created to ensure React detects the state change and re-renders.
    setPositionedNodes([...initialNodes]);

    // Cleanup function:
    // This runs when the component unmounts or when the dependencies of this effect change,
    // ensuring that any running simulation is stopped to prevent memory leaks or stale updates.
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };

  }, [
    nodes, // Re-run effect if memoized nodes array reference changes (due to nodesData change)
    links, // Re-run effect if memoized links array reference changes (due to edgesData change)
    width,
    height,
    iterations,
    linkStrengthBase,
    linkStrengthAffinityWeight,
    linkStrengthFrequencyWeight,
    linkDistanceBase,
    chargeStrength,
    chargeDistanceMin,
    chargeDistanceMax,
    randomizeInitialPositions
  ]);

  return positionedNodes;
}

export default useGraphTopology;