import React, { useState, useCallback, useMemo } from 'react';
import { useD3 } from '../../utils/useD3';
import * as d3 from 'd3';
import { select, forceSimulation, forceLink, forceManyBody, forceCenter, drag } from 'd3';

// Mock data structure for dependencies
// In a real application, this would come from state management or an API call.
const initialNodes = [
  { id: 'AssetA', group: 'Asset', name: 'Asset A', value: 10 },
  { id: 'AssetB', group: 'Asset', name: 'Asset B', value: 15 },
  { id: 'StrategyX', group: 'Strategy', name: 'Strategy X', value: 20 },
  { id: 'StrategyY', group: 'Strategy', name: 'Strategy Y', value: 25 },
  { id: 'InstrumentZ', group: 'Instrument', name: 'Instrument Z', value: 5 },
];

const initialLinks = [
  { source: 'AssetA', target: 'StrategyX', value: 3 },
  { source: 'AssetB', target: 'StrategyX', value: 4 },
  { source: 'StrategyX', target: 'StrategyY', value: 5 },
  { source: 'AssetA', target: 'InstrumentZ', value: 1 },
];

const COLOR_SCALE = d3.scaleOrdinal(d3.schemeCategory10);

/**
 * Maps node IDs to their full node objects for easier lookup in D3 force simulation.
 * @param {Array} nodes - Array of node objects.
 * @returns {Map} - Map of ID to node object.
 */
const mapNodesById = (nodes) => {
    return new Map(nodes.map(node => [node.id, node]));
};

/**
 * DependencyGraph Component
 * Visualizes dependencies using a D3 force-directed graph layout.
 */
const DependencyGraph = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [links, setLinks] = useState(initialLinks);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  const svgRef = useD3(
    (svg) => {
      const width = svg.attr('width');
      const height = svg.attr('height');

      const nodeMap = mapNodesById(nodes);

      // 1. Setup Scales and Radius
      const radiusScale = d3.scaleLinear()
        .domain([d3.min(nodes, d => d.value) || 0, d3.max(nodes, d => d.value) || 1])
        .range([8, 20]);

      // 2. Setup Links (Edges)
      const linkElements = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke-width', d => Math.sqrt(d.value))
        .attr('stroke', '#999');

      // 3. Setup Nodes (Circles)
      const nodeElements = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('r', d => radiusScale(d.value))
        .attr('fill', d => COLOR_SCALE(d.group))
        .call(drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

      // 4. Setup Node Labels
      const textElements = svg.append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(nodes)
        .join('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .text(d => d.id)
        .style('pointer-events', 'none') // Allow clicking through text to the circle
        .style('font-size', '10px');

      // 5. Setup Tooltip Handlers for Nodes
      nodeElements
        .on('mouseover', (event, d) => {
            const content = `${d.name} (${d.group}) - Value: ${d.value}`;
            setTooltip({ visible: true, x: event.pageX + 10, y: event.pageY + 10, content });
        })
        .on('mousemove', (event) => {
             setTooltip(prev => ({ ...prev, x: event.pageX + 10, y: event.pageY + 10 }));
        })
        .on('mouseout', () => {
            setTooltip({ visible: false, x: 0, y: 0, content: '' });
        });
        
      // 6. Setup Simulation
      const simulation = forceSimulation(nodes)
        .force('link', forceLink(links).id(d => d.id).distance(100))
        .force('charge', forceManyBody().strength(-500))
        .force('center', forceCenter(width / 2, height / 2));

      // 7. Tick Function (Update positions on every simulation step)
      simulation.on('tick', () => {
        linkElements
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        nodeElements
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);

        textElements
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      });

      // --- Drag Handlers ---
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      // Cleanup function (optional, but good practice if dealing with dynamic components)
      return () => {
        simulation.stop();
      };
    },
    [nodes, links] // Redraw if nodes or links change
  );

  const handleAddNode = useCallback(() => {
    const newNodeId = `NewAsset${nodes.length + 1}`;
    const newNode = { 
        id: newNodeId, 
        group: 'Asset', 
        name: `New Asset ${nodes.length + 1}`, 
        value: Math.floor(Math.random() * 30) + 5 
    };
    setNodes(prevNodes => [...prevNodes, newNode]);
    // A link might be added here in a more complex implementation
  }, [nodes.length]);

  const handleAddLink = useCallback(() => {
    if (nodes.length < 2) return;

    const sourceId = nodes[0].id;
    const targetId = nodes[Math.floor(Math.random() * (nodes.length - 1)) + 1].id;
    
    const newLink = { 
        source: sourceId, 
        target: targetId, 
        value: Math.floor(Math.random() * 5) + 1 
    };
    setLinks(prevLinks => [...prevLinks, newLink]);
  }, [nodes.length]);

  const dynamicTooltipStyle = useMemo(() => ({
    display: tooltip.visible ? 'block' : 'none',
    left: tooltip.x,
    top: tooltip.y,
  }), [tooltip]);

  return (
    <div className="dependency-graph-container" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h2>Asset & Strategy Dependency Graph</h2>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleAddNode} style={{ marginRight: '10px', padding: '5px 10px' }}>Add Node</button>
        <button onClick={handleAddLink} disabled={nodes.length < 2} style={{ padding: '5px 10px' }}>Add Link</button>
      </div>
      
      <svg ref={svgRef} width={800} height={600} style={{ border: '1px solid #eee' }}></svg>

      {/* Tooltip */}
      <div
        style={{
          ...dynamicTooltipStyle,
          position: 'absolute',
          padding: '8px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          borderRadius: '4px',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      >
        {tooltip.content}
      </div>
    </div>
  );
};

export default DependencyGraph;