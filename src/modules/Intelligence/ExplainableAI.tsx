import React, { useEffect, useState, useCallback } from 'react';

// --- Interfaces ---
interface ChildLink {
  label: string; // Label for the edge, e.g., "Yes", "No", "High", "Low"
  node: DecisionNode;
  isHighlighted?: boolean; // To highlight the edge
}

interface DecisionNode {
  id: string;
  label: string;
  type: 'decision' | 'recommendation'; // 'decision' node has children, 'recommendation' is a leaf
  children?: ChildLink[];
  isHighlighted?: boolean; // To highlight the node
  x?: number; // Calculated x-coordinate for rendering
  y?: number; // Calculated y-coordinate for rendering
}

interface ExplainableAIProps {
  decisionTreeData: DecisionNode;
  recommendationPath?: string[]; // Array of node IDs representing the path to highlight
  width?: number; // Width of the SVG canvas
  height?: number; // Height of the SVG canvas
}

// --- Constants for Layout ---
const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;
const H_SPACING = 50; // Horizontal spacing between nodes
const V_SPACING = 80; // Vertical spacing between levels

// --- Utility Functions ---

/**
 * Deep clones an object to prevent direct mutation of props.
 * Assumes a data structure that is safely serializable to JSON.
 * @param obj The object to clone.
 * @returns A deep copy of the object.
 */
const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Calculates the layout (x, y coordinates) for each node in the decision tree.
 * Uses a modified Reingold-Tilford algorithm for a clean hierarchical layout.
 * @param root The root node of the decision tree.
 * @param svgWidth The width of the SVG canvas.
 * @returns The root node with calculated x and y coordinates.
 */
const calculateLayout = (root: DecisionNode, svgWidth: number): DecisionNode => {
  if (!root) return root;

  // First pass: Assign depth (y-coordinate) and initialize temporary properties like highlight status
  const assignDepthAndInit = (node: DecisionNode, depth: number) => {
    node.y = depth * (NODE_HEIGHT + V_SPACING);
    node.isHighlighted = false; // Reset highlight status for nodes
    node.children?.forEach(childLink => {
      childLink.isHighlighted = false; // Reset highlight status for edges
      assignDepthAndInit(childLink.node, depth + 1);
    });
  };
  assignDepthAndInit(root, 0);

  // Second pass: Calculate x-coordinates using a post-order traversal (children first).
  // This ensures leaf nodes are positioned first, and internal nodes are centered relative to their children.
  let currentLeafX = 0; // Tracks the next available x-position for a leaf node

  const assignX = (node: DecisionNode): number => {
    if (!node.children || node.children.length === 0) {
      // Leaf node: assign x and increment leaf counter
      node.x = currentLeafX * (NODE_WIDTH + H_SPACING);
      currentLeafX++;
      return node.x;
    } else {
      // Internal node: x is the average of its children's x-coordinates
      const childXs = node.children.map(childLink => assignX(childLink.node));
      node.x = childXs.reduce((sum, x) => sum + x, 0) / childXs.length;
      return node.x;
    }
  };
  assignX(root);

  // Third pass: Adjust all x-coordinates to center the entire tree horizontally within the SVG.
  let minX = root.x || 0;
  let maxX = root.x || 0;

  const findMinMaxX = (node: DecisionNode) => {
    if (node.x !== undefined) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
    }
    node.children?.forEach(childLink => findMinMaxX(childLink.node));
  };
  findMinMaxX(root);

  const treeWidth = maxX - minX + NODE_WIDTH;
  const offsetX = (svgWidth - treeWidth) / 2 - minX;

  const applyOffsetX = (node: DecisionNode) => {
    if (node.x !== undefined) {
      node.x += offsetX;
    }
    node.children?.forEach(childLink => applyOffsetX(childLink.node));
  };
  applyOffsetX(root);

  return root;
};

/**
 * Highlights a specific path within the decision tree by setting the `isHighlighted` flag on nodes and edges.
 * @param root The root node of the decision tree.
 * @param path An array of node IDs representing the sequence of nodes in the path to highlight.
 */
const highlightPath = (root: DecisionNode, path: string[]) => {
  if (!root || path.length === 0) return;

  let currentNode: DecisionNode | undefined = root;
  let currentPathIndex = 0;

  while (currentNode && currentPathIndex < path.length) {
    // Check if the current node matches the next node in the path
    if (currentNode.id === path[currentPathIndex]) {
      currentNode.isHighlighted = true;
    } else {
      // If the current node doesn't match, the path is broken, stop highlighting
      break;
    }

    // If there are more nodes in the path and the current node has children
    if (currentPathIndex < path.length - 1 && currentNode.children) {
      const nextNodeIdInPath = path[currentPathIndex + 1];
      let foundNext = false;

      // Find the child link that leads to the next node in the path
      for (const childLink of currentNode.children) {
        if (childLink.node.id === nextNodeIdInPath) {
          childLink.isHighlighted = true; // Highlight the edge
          currentNode = childLink.node; // Move to the next node
          foundNext = true;
          break;
        }
      }

      if (!foundNext) {
        // Next node in path not found among children, path is broken
        currentNode = undefined;
      }
    } else {
      // End of the path or no children to follow
      currentNode = undefined;
    }
    currentPathIndex++;
  }
};

// --- React Component ---
const ExplainableAI: React.FC<ExplainableAIProps> = ({
  decisionTreeData,
  recommendationPath = [],
  width = 800,
  height = 600,
}) => {
  const [layoutTree, setLayoutTree] = useState<DecisionNode | null>(null);

  useEffect(() => {
    if (decisionTreeData) {
      const clonedTree = deepClone(decisionTreeData);
      const laidOutTree = calculateLayout(clonedTree, width);
      highlightPath(laidOutTree, recommendationPath);
      setLayoutTree(laidOutTree);
    } else {
      setLayoutTree(null);
    }
  }, [decisionTreeData, recommendationPath, width, height]);

  /**
   * Recursively renders the SVG elements (nodes, edges, labels) for the decision tree.
   * @param node The current node to render.
   * @param renderedElements An array to accumulate all generated JSX SVG elements.
   */
  const renderTreeElements = useCallback((node: DecisionNode, renderedElements: JSX.Element[]) => {
    if (!node.x || !node.y) return; // Node must have calculated coordinates

    const nodeX = node.x - NODE_WIDTH / 2; // Adjust x to center the rectangle
    const nodeY = node.y;

    // Render node rectangle
    renderedElements.push(
      <rect
        key={`node-rect-${node.id}`}
        x={nodeX}
        y={nodeY}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={5}
        ry={5}
        stroke={node.isHighlighted ? '#1E88E5' : '#757575'} // Blue for highlighted, gray for normal
        strokeWidth={node.isHighlighted ? 3 : 1}
        fill={node.isHighlighted ? '#E3F2FD' : '#FFFFFF'} // Light blue for highlighted fill
      />
    );

    // Render node label text
    renderedElements.push(
      <text
        key={`node-text-${node.id}`}
        x={nodeX + NODE_WIDTH / 2}
        y={nodeY + NODE_HEIGHT / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="12px"
        fontWeight={node.isHighlighted ? 'bold' : 'normal'}
        fill="#212121"
      >
        {node.label}
      </text>
    );

    // Recursively render children and their connecting edges
    if (node.children) {
      node.children.forEach(childLink => {
        const childNode = childLink.node;
        if (!childNode.x || !childNode.y) return;

        const lineX1 = node.x;
        const lineY1 = node.y + NODE_HEIGHT;
        const lineX2 = childNode.x;
        const lineY2 = childNode.y;

        // Render line (edge)
        renderedElements.push(
          <line
            key={`edge-line-${node.id}-${childNode.id}`}
            x1={lineX1}
            y1={lineY1}
            x2={lineX2}
            y2={lineY2}
            stroke={childLink.isHighlighted ? '#1E88E5' : '#9E9E9E'} // Blue for highlighted, darker gray for normal
            strokeWidth={childLink.isHighlighted ? 3 : 1}
            markerEnd={childLink.isHighlighted ? 'url(#arrowheadHighlighted)' : 'url(#arrowhead)'}
          />
        );

        // Render edge label text
        const midX = (lineX1 + lineX2) / 2;
        const midY = (lineY1 + lineY2) / 2;
        renderedElements.push(
          <text
            key={`edge-text-${node.id}-${childNode.id}`}
            x={midX}
            y={midY - 5} // Position slightly above the midpoint of the line
            textAnchor="middle"
            fontSize="10px"
            fill={childLink.isHighlighted ? '#1E88E5' : '#616161'} // Blue for highlighted, even darker gray for normal
          >
            {childLink.label}
          </text>
        );

        renderTreeElements(childNode, renderedElements); // Recurse for child node
      });
    }
  }, []); // Dependencies for useCallback. The component state (layoutTree) will trigger re-render, so no external deps needed here for renderTreeElements itself.

  const allElements: JSX.Element[] = [];
  if (layoutTree) {
    renderTreeElements(layoutTree, allElements);
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        {/* SVG Marker for normal arrowheads */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10" // Tip of the arrow
          refY="3.5" // Center of the arrow vertically
          orient="auto"
          fill="#9E9E9E" // Normal arrow color
        >
          <polygon points="0 0, 10 3.5, 0 7" />
        </marker>
        {/* SVG Marker for highlighted arrowheads */}
        <marker
          id="arrowheadHighlighted"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
          fill="#1E88E5" // Highlighted arrow color
        >
          <polygon points="0 0, 10 3.5, 0 7" />
        </marker>
      </defs>
      {allElements}
    </svg>
  );
};

export default ExplainableAI;