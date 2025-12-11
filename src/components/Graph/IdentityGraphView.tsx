```tsx
import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  NodeTypes,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { getIdentityData } from '../../services/graphService';

import {
  NodeData,
  EdgeData,
  Node as IdentityNode,
  Edge as IdentityEdge,
} from '../../types';

const nodeTypes: NodeTypes = {
  custom: ({ data, isConnectable }) => (
    <>
      <div className="custom-node">
        <div className="node-header">{data.label}</div>
        <div className="node-content">
          {Object.entries(data.properties).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>
      </div>
      {isConnectable && (
        <Handle
          type="source"
          position="right"
          id="a"
          style={{ background: '#555' }}
        />
      )}
      {isConnectable && (
        <Handle
          type="target"
          position="left"
          id="b"
          style={{ background: '#555' }}
        />
      )}
    </>
  ),
};

const handleStyle = { width: 10, height: 10 };

const IdentityGraphView: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeData>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIdentityData();
      if (!data) {
        throw new Error('Failed to fetch identity data');
      }

      const newNodes: NodeData[] = data.nodes.map((node: IdentityNode) => ({
        id: node.id,
        position: { x: Math.random() * 800, y: Math.random() * 400 },
        data: {
          label: node.displayName,
          properties: {
            appId: node.appId,
            applicationType: node.applicationType,
            createdDateTime: node.createdDateTime,
            accountEnabled: node.accountEnabled.toString(),
            applicationVisibility: node.applicationVisibility,
            assignmentRequired: node.assignmentRequired.toString(),
            isAppProxy: node.isAppProxy.toString(),
          },
        },
        type: 'custom',
      }));

      const newEdges: EdgeData[] = data.edges.map((edge: IdentityEdge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
      }));

      setNodes(newNodes);
      setEdges(newEdges);
      fitView();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ width: '100%', height: 800 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

const WrappedIdentityGraphView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <IdentityGraphView />
    </ReactFlowProvider>
  );
};

export default WrappedIdentityGraphView;
```