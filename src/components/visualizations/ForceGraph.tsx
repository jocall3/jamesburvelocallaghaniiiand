import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';

// Define the types for nodes and links for better type safety
interface ForceGraphNode extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    group?: string; // Optional: for grouping or coloring nodes
    color?: string; // Optional: direct color override
}

interface ForceGraphLink extends d3.SimulationLinkDatum<ForceGraphNode> {
    source: string | ForceGraphNode; // Can be ID or actual node object
    target: string | ForceGraphNode; // Can be ID or actual node object
    value?: number; // Optional: for link strength/thickness
}

interface ForceGraphProps {
    nodes: ForceGraphNode[];
    links: ForceGraphLink[];
    width?: number; // Width of the SVG container
    height?: number; // Height of the SVG container
    onNodeClick?: (node: ForceGraphNode) => void;
    selectedNodeId?: string | null;
}

/**
 * @description A specialized D3.js force-directed graph component used to visualize
 * complex relationships in the Data Mesh and Nexus. It renders nodes and links
 * and allows for interactive dragging and optional node clicking.
 */
const ForceGraph: React.FC<ForceGraphProps> = ({
    nodes,
    links,
    width = 800,
    height = 600,
    onNodeClick,
    selectedNodeId,
}) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    const linkStrength = useCallback((link: ForceGraphLink) => (link.value || 1) * 0.7, []);
    const nodeCharge = useCallback(() => -200, []); // Repulsion force

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous render

        const initialNodes: ForceGraphNode[] = nodes.map(d => ({ ...d }));
        const initialLinks: ForceGraphLink[] = links.map(d => ({ ...d }));

        const simulation = d3.forceSimulation<ForceGraphNode, ForceGraphLink>(initialNodes)
            .force('link', d3.forceLink<ForceGraphNode, ForceGraphLink>(initialLinks).id(d => d.id).strength(linkStrength))
            .force('charge', d3.forceManyBody().strength(nodeCharge))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(10)); // Prevent node overlap

        // Create container groups for better layering
        const linkGroup = svg.append('g').attr('class', 'links');
        const nodeGroup = svg.append('g').attr('class', 'nodes');

        // Draw links
        const link = linkGroup
            .selectAll('line')
            .data(initialLinks)
            .enter()
            .append('line')
            .attr('class', 'stroke-gray-600 stroke-1') // Default link style
            .attr('stroke-opacity', 0.6);

        // Draw nodes (circles with text)
        const node = nodeGroup
            .selectAll('g')
            .data(initialNodes)
            .enter()
            .append('g')
            .attr('class', 'cursor-pointer')
            .call(d3.drag<SVGCircleElement, ForceGraphNode>()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        node.append('circle')
            .attr('r', 8) // Node radius
            .attr('class', (d) => `stroke-gray-800 stroke-[1.5px] ${
                d.id === selectedNodeId ? 'fill-cyan-500' : 'fill-gray-700 hover:fill-gray-600' // Highlight selected node
            }`)
            .attr('fill', d => d.color || undefined) // Allow custom node color
            .on('click', (event, d) => {
                event.stopPropagation(); // Prevent SVG click from interfering
                if (onNodeClick) {
                    onNodeClick(d);
                }
            });

        node.append('text')
            .attr('x', 12)
            .attr('y', 3)
            .attr('class', 'text-xs fill-gray-300 pointer-events-none') // Make text non-interactive for drag
            .text(d => d.label);

        // Update positions on each tick of the simulation
        simulation.on('tick', () => {
            link
                .attr('x1', d => (d.source as ForceGraphNode).x!)
                .attr('y1', d => (d.source as ForceGraphNode).y!)
                .attr('x2', d => (d.target as ForceGraphNode).x!)
                .attr('y2', d => (d.target as ForceGraphNode).y!);

            node
                .attr('transform', d => `translate(${d.x!},${d.y!})`);
        });

        // Drag functions
        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, ForceGraphNode, any>, d: ForceGraphNode) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: d3.D3DragEvent<SVGCircleElement, ForceGraphNode, any>, d: ForceGraphNode) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event: d3.D3DragEvent<SVGCircleElement, ForceGraphNode, any>, d: ForceGraphNode) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; // Unfix node position after drag ends
            d.fy = null;
        }

        // Clean up simulation on component unmount
        return () => {
            simulation.stop();
        };
    }, [nodes, links, width, height, onNodeClick, selectedNodeId, linkStrength, nodeCharge]);

    return (
        <svg ref={svgRef} width={width} height={height} className="bg-gray-900 rounded-lg shadow-md"></svg>
    );
};

export default ForceGraph;