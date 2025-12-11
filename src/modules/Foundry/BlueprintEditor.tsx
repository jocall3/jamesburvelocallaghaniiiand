import React, { useState, useCallback, useRef, DragEvent } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Node,
  Edge,
  Connection,
  Handle,
  Position,
  NodeProps,
  ReactFlowProvider,
  ReactFlowInstance,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

const nodeStyles = {
  base: {
    padding: '10px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px',
    minWidth: '180px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  header: {
    fontWeight: 'bold',
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  body: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '8px',
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '6px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box' as 'border-box',
  },
  handle: {
    width: '10px',
    height: '10px',
  },
};

const MarketDataNode: React.FC<NodeProps> = ({ data }) => (
  <div style={{ ...nodeStyles.base, borderLeft: '5px solid #4CAF50' }}>
    <div style={nodeStyles.header}>
      <span>📈</span> Market Data
    </div>
    <div style={nodeStyles.body}>
      <label style={nodeStyles.label}>
        Ticker Symbol
        <input type="text" defaultValue="AAPL" style={nodeStyles.input} />
      </label>
    </div>
    <Handle
      type="source"
      position={Position.Right}
      id="price"
      style={{ ...nodeStyles.handle, top: '50%' }}
    />
  </div>
);

const CalculationNode: React.FC<NodeProps> = ({ data }) => (
  <div style={{ ...nodeStyles.base, borderLeft: '5px solid #2196F3' }}>
    <div style={nodeStyles.header}>
      <span>🧮</span> Calculation
    </div>
    <div style={nodeStyles.body}>
      <label style={nodeStyles.label}>
        Operation
        <select style={nodeStyles.input} defaultValue="SMA">
          <option value="SMA">Simple Moving Average</option>
          <option value="EMA">Exponential Moving Average</option>
          <option value="RSI">Relative Strength Index</option>
        </select>
      </label>
      <label style={nodeStyles.label}>
        Period
        <input type="number" defaultValue="50" style={nodeStyles.input} />
      </label>
    </div>
    <Handle
      type="source"
      position={Position.Right}
      id="result"
      style={{ ...nodeStyles.handle, top: '50%' }}
    />
    <Handle
      type="target"
      position={Position.Left}
      id="input"
      style={{ ...nodeStyles.handle, top: '50%' }}
    />
  </div>
);

const DecisionNode: React.FC<NodeProps> = ({ data }) => (
  <div style={{ ...nodeStyles.base, borderLeft: '5px solid #FFC107' }}>
    <div style={nodeStyles.header}>
      <span>🚦</span> Decision
    </div>
    <div style={nodeStyles.body}>
      <label style={nodeStyles.label}>
        Condition
        <select style={nodeStyles.input} defaultValue=">">
          <option value=">">Price &gt; Value</option>
          <option value="<">Price &lt; Value</option>
          <option value="=">Price = Value</option>
        </select>
      </label>
    </div>
    <Handle
      type="target"
      position={Position.Left}
      id="price_input"
      style={{ ...nodeStyles.handle, top: '35%' }}
    />
    <Handle
      type="target"
      position={Position.Left}
      id="value_input"
      style={{ ...nodeStyles.handle, top: '65%' }}
    />
    <Handle
      type="source"
      position={Position.Right}
      id="true_output"
      style={{ ...nodeStyles.handle, top: '35%', background: '#4CAF50' }}
    />
    <Handle
      type="source"
      position={Position.Right}
      id="false_output"
      style={{ ...nodeStyles.handle, top: '65%', background: '#F44336' }}
    />
  </div>
);

const TradeExecutionNode: React.FC<NodeProps> = ({ data }) => (
  <div style={{ ...nodeStyles.base, borderLeft: '5px solid #F44336' }}>
    <div style={nodeStyles.header}>
      <span>💰</span> Execute Trade
    </div>
    <div style={nodeStyles.body}>
      <label style={nodeStyles.label}>
        Action
        <select style={nodeStyles.input} defaultValue="BUY">
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      </label>
      <label style={nodeStyles.label}>
        Quantity
        <input type="number" defaultValue="100" style={nodeStyles.input} />
      </label>
    </div>
    <Handle
      type="target"
      position={Position.Left}
      id="trigger"
      style={{ ...nodeStyles.handle, top: '50%' }}
    />
  </div>
);

const LogNode: React.FC<NodeProps> = ({ data }) => (
    <div style={{ ...nodeStyles.base, borderLeft: '5px solid #9E9E9E' }}>
      <div style={nodeStyles.header}>
        <span>📄</span> Log Output
      </div>
      <div style={nodeStyles.body}>
        <label style={nodeStyles.label}>
          Message
          <input type="text" defaultValue="Signal triggered" style={nodeStyles.input} />
        </label>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ ...nodeStyles.handle, top: '50%' }}
      />
    </div>
  );

const nodeTypes = {
  marketData: MarketDataNode,
  calculation: CalculationNode,
  decision: DecisionNode,
  tradeExecution: TradeExecutionNode,
  logOutput: LogNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'marketData',
    data: { label: 'AAPL Data' },
    position: { x: 50, y: 150 },
  },
  {
    id: '2',
    type: 'calculation',
    data: { label: '50-day SMA' },
    position: { x: 350, y: 50 },
  },
  {
    id: '3',
    type: 'decision',
    data: { label: 'Price > SMA' },
    position: { x: 650, y: 150 },
  },
  {
    id: '4',
    type: 'tradeExecution',
    data: { label: 'Execute Buy' },
    position: { x: 950, y: 100 },
  },
  {
    id: '5',
    type: 'logOutput',
    data: { label: 'Log Hold Signal' },
    position: { x: 950, y: 250 },
  },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', sourceHandle: 'price', target: '2', targetHandle: 'input', animated: true },
    { id: 'e1-3', source: '1', sourceHandle: 'price', target: '3', targetHandle: 'price_input', animated: true },
    { id: 'e2-3', source: '2', sourceHandle: 'result', target: '3', targetHandle: 'value_input' },
    { id: 'e3-4', source: '3', sourceHandle: 'true_output', target: '4', targetHandle: 'trigger', style: { stroke: '#4CAF50' } },
    { id: 'e3-5', source: '3', sourceHandle: 'false_output', target: '5', targetHandle: 'input', style: { stroke: '#F44336' } },
];

const Sidebar = () => {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const sidebarStyle: React.CSSProperties = {
    padding: '15px',
    borderRight: '1px solid #ddd',
    background: '#f7f7f7',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  };

  const nodeItemStyle: React.CSSProperties = {
    padding: '10px 15px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    background: '#fff',
    cursor: 'grab',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  return (
    <aside style={sidebarStyle}>
      <h3>Node Palette</h3>
      <div style={nodeItemStyle} onDragStart={(event) => onDragStart(event, 'marketData')} draggable>
        📈 Market Data
      </div>
      <div style={nodeItemStyle} onDragStart={(event) => onDragStart(event, 'calculation')} draggable>
        🧮 Calculation
      </div>
      <div style={nodeItemStyle} onDragStart={(event) => onDragStart(event, 'decision')} draggable>
        🚦 Decision
      </div>
      <div style={nodeItemStyle} onDragStart={(event) => onDragStart(event, 'tradeExecution')} draggable>
        💰 Execute Trade
      </div>
      <div style={nodeItemStyle} onDragStart={(event) => onDragStart(event, 'logOutput')} draggable>
        📄 Log Output
      </div>
    </aside>
  );
};

let id = 6;
const getId = () => `${id++}`;

const BlueprintEditor = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );
  
  const editorStyle = {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    flexGrow: 1
  };
  
  const flowContainerStyle = {
    flexGrow: 1,
    height: '100%',
  }

  return (
    <div style={editorStyle}>
      <ReactFlowProvider>
        <Sidebar />
        <div style={flowContainerStyle} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default BlueprintEditor;