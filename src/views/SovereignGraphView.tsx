import React, { useCallback, useLayoutEffect } from 'react';
import ReactFlow, {
  addEdge,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Node,
  Edge,
} from 'reactflow';
import dagre from 'dagre';

import 'reactflow/dist/style.css';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

const initialNodes: Node[] = [
  {
    id: 'idp',
    type: 'input',
    data: { label: 'Identity Provider: Google' },
    position: { x: 0, y: 0 },
     style: {
      background: '#fff3e0',
      color: '#ef6c00',
      border: '1px solid #ef6c00',
      width: nodeWidth,
      height: nodeHeight,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
  },
  {
    id: 'profile',
    data: { label: 'Sovereign Profile\nMarc Carlo' },
    position: { x: 0, y: 0 },
    style: {
      background: '#e3f2fd',
      color: '#1565c0',
      border: '1px solid #1565c0',
      width: nodeWidth,
      height: nodeHeight,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    },
  },
  {
    id: 'product-cc',
    data: { label: 'Product: Credit Card\n(...7899)' },
    position: { x: 0, y: 0 },
     style: {
      background: '#e8f5e9',
      color: '#2e7d32',
      border: '1px solid #2e7d32',
      width: nodeWidth,
      height: nodeHeight,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    },
  },
  {
    id: 'product-checking',
    data: { label: 'Product: Checking\n(...7899)' },
    position: { x: 0, y: 0 },
     style: {
      background: '#e8f5e9',
      color: '#2e7d32',
      border: '1px solid #2e7d32',
      width: nodeWidth,
      height: nodeHeight,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    },
  },
  {
    id: 'product-savings',
    data: { label: 'Product: Savings\n(...1035)' },
    position: { x: 0, y: 0 },
     style: {
      background: '#e8f5e9',
      color: '#2e7d32',
      border: '1px solid #2e7d32',
      width: nodeWidth,
      height: nodeHeight,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    },
  },
  {
    id: 'third-party-app',
    type: 'output',
    data: { label: 'Third-Party App\n(Fintech Aggregator)' },
    position: { x: 0, y: 0 },
    style: {
      background: '#f3e5f5',
      color: '#6a1b9a',
      border: '1px solid #6a1b9a',
      width: nodeWidth,
      height: nodeHeight,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    },
  },
   {
    id: 'merchant',
    type: 'output',
    data: { label: 'Partner Merchant\n(ShopWithPoints)' },
    position: { x: 0, y: 0 },
    style: {
      background: '#ffebee',
      color: '#c62828',
      border: '1px solid #c62828',
      width: nodeWidth,
      height: nodeHeight,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e-idp-profile', source: 'idp', target: 'profile', label: 'Authenticates via SAML', type: 'smoothstep', animated: true },
  { id: 'e-profile-cc', source: 'profile', target: 'product-cc', label: 'Owns', type: 'smoothstep' },
  { id: 'e-profile-checking', source: 'profile', target: 'product-checking', label: 'Owns', type: 'smoothstep' },
  { id: 'e-profile-savings', source: 'profile', target: 'product-savings', label: 'Owns', type: 'smoothstep' },
  { id: 'e-app-profile', source: 'third-party-app', target: 'profile', label: 'Accesses Profile via OAuth2', type: 'smoothstep' },
  { id: 'e-app-accounts', source: 'third-party-app', target: 'product-checking', label: 'Reads Account Details', type: 'smoothstep' },
  { id: 'e-cc-merchant', source: 'product-cc', target: 'merchant', label: 'Linked for Rewards', type: 'smoothstep' },
];


const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
  initialNodes,
  initialEdges
);

const SovereignGraphView = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onConnect = useCallback(
    (params: any) =>
      setEdges((eds) =>
        addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds)
      ),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
      >
        <Controls />
        <Background gap={16} color="#f1f1f1" />
      </ReactFlow>
    </div>
  );
};

export default SovereignGraphView;