import React, { useState, useCallback, useRef, DragEvent, FC, memo } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  Connection,
  NodeTypes,
  Handle,
  Position,
  NodeProps,
  ReactFlowProvider,
  useReactFlow,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
} from '@xyflow/react';
import { 
  Zap, 
  Code, 
  GitFork, 
  Database, 
  Terminal, 
  FileUp, 
  Github, 
  Play,
  Settings2,
  ChevronDown
} from 'lucide-react';

import '@xyflow/react/dist/style.css';

// --- TYPES AND INTERFACES ---

// Represents the available APIs, simplified for this component
interface ApiDefinition {
  id: string;
  name: string;
  operations: {
    id: string;
    summary: string;
  }[];
}

// Base data structure for all nodes
interface BaseNodeData {
  label: string;
  description?: string;
}

// Data for a trigger node
interface TriggerNodeData extends BaseNodeData {
  triggerType: 'webhook' | 'schedule' | 'manual';
}

// Data for a generic API call node
interface ApiCallNodeData extends BaseNodeData {
  apiId?: string;
  operationId?: string;
  // In a real app, this would be a complex object for parameter mapping
  parameterMapping?: Record<string, any>; 
}

// Data for a Google Drive specific node
interface GoogleDriveNodeData extends BaseNodeData {
  action: 'upload' | 'download' | 'create_folder';
  filePath?: string;
}

// Data for a GitHub specific node
interface GitHubNodeData extends BaseNodeData {
  action: 'run_workflow' | 'create_issue' | 'get_repo';
  repository?: string;
}

// Data for a conditional logic node
interface LogicNodeData extends BaseNodeData {
    condition: string; // e.g., "input.status === 'success'"
}

type CustomNodeData = TriggerNodeData | ApiCallNodeData | GoogleDriveNodeData | GitHubNodeData | LogicNodeData;

type CustomNode = Node<CustomNodeData>;

export interface Workflow {
  nodes: CustomNode[];
  edges: Edge[];
  // Add other workflow metadata here, e.g., name, description, version
  id: string;
  name: string;
}

interface WorkflowCanvasProps {
  initialWorkflow: Workflow;
  availableApis: ApiDefinition[]; // List of all 1000+ APIs
  onWorkflowChange: (workflow: Workflow) => void;
  onRunWorkflow: (workflow: Workflow) => void;
}

// --- STYLES ---

const styles: { [key: string]: React.CSSProperties } = {
  canvasWrapper: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    fontFamily: 'sans-serif',
    backgroundColor: '#f0f2f5',
  },
  reactFlowWrapper: {
    flexGrow: 1,
    height: '100%',
  },
  sidebar: {
    width: '250px',
    borderRight: '1px solid #ddd',
    padding: '15px',
    backgroundColor: '#fff',
    boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  draggableNode: {
    padding: '10px 15px',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'grab',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    transition: 'background-color 0.2s, box-shadow 0.2s',
  },
  draggableNodeHover: {
    backgroundColor: '#eef',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  nodeIcon: {
    marginRight: '10px',
  },
  nodeBase: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
    width: 250,
  },
  nodeHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid #eee',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  nodeContent: {
    padding: '12px',
    fontSize: '12px',
  },
  nodeLabel: {
    display: 'block',
    marginBottom: '4px',
    fontWeight: 500,
    color: '#555',
  },
  nodeInput: {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    marginBottom: '10px',
  },
  nodeSelect: {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    marginBottom: '10px',
    backgroundColor: 'white',
  },
  handle: {
    width: 10,
    height: 10,
    background: '#777',
  },
  topBar: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    display: 'flex',
    gap: '10px',
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  },
  runButton: {
    backgroundColor: '#28a745',
    color: 'white',
  },
  runButtonHover: {
    backgroundColor: '#218838',
  },
};

// --- CUSTOM NODES ---

const CustomNodeWrapper: FC<NodeProps<CustomNodeData>> = ({ id, data, children }) => {
  const { setNodes } = useReactFlow();
  const onLabelChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, label: evt.target.value };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const getIcon = () => {
    if (id.startsWith('trigger')) return <Zap size={16} color="#f39c12" />;
    if (id.startsWith('apiCall')) return <Code size={16} color="#3498db" />;
    if (id.startsWith('googleDrive')) return <FileUp size={16} color="#0F9D58" />;
    if (id.startsWith('github')) return <Github size={16} color="#181717" />;
    if (id.startsWith('logic')) return <GitFork size={16} color="#9b59b6" />;
    return <Settings2 size={16} color="#7f8c8d" />;
  };

  return (
    <div style={styles.nodeBase}>
      <Handle type="target" position={Position.Left} style={styles.handle} />
      <div style={{...styles.nodeHeader, borderTopLeftRadius: '8px', borderTopRightRadius: '8px'}}>
        {getIcon()}
        <span style={{marginLeft: '8px', flexGrow: 1}}>{data.label}</span>
      </div>
      <div style={styles.nodeContent}>
        <label style={styles.nodeLabel}>Node Label</label>
        <input
          type="text"
          value={data.label}
          onChange={onLabelChange}
          style={styles.nodeInput}
        />
        {children}
      </div>
      <Handle type="source" position={Position.Right} style={styles.handle} />
    </div>
  );
};

const TriggerNode: FC<NodeProps<TriggerNodeData>> = ({ id, data }) => {
  const { setNodes } = useReactFlow();
  const onTypeChange = useCallback((evt: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = evt.target.value as TriggerNodeData['triggerType'];
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, triggerType: newType };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  return (
    <div style={styles.nodeBase}>
      <div style={{...styles.nodeHeader, backgroundColor: '#f39c12', color: 'white'}}>
        <Zap size={16} />
        <span style={{marginLeft: '8px'}}>{data.label}</span>
      </div>
      <div style={styles.nodeContent}>
        <label style={styles.nodeLabel}>Trigger Type</label>
        <select value={data.triggerType} onChange={onTypeChange} style={styles.nodeSelect}>
          <option value="webhook">Webhook</option>
          <option value="schedule">Schedule</option>
          <option value="manual">Manual</option>
        </select>
      </div>
      <Handle type="source" position={Position.Right} style={styles.handle} />
    </div>
  );
};

const ApiCallNode: FC<NodeProps<ApiCallNodeData>> = ({ id, data }) => {
    const { setNodes } = useReactFlow();
    // In a real app, this would be passed down or fetched from a context
    const availableApis: ApiDefinition[] = [
        { id: 'google-drive', name: 'Google Drive API', operations: [{id: 'files.create', summary: 'Create a file'}] },
        { id: 'github', name: 'GitHub API', operations: [{id: 'repos.create', summary: 'Create a repository'}] },
    ];

    const onApiChange = useCallback((evt: React.ChangeEvent<HTMLSelectElement>) => {
        const newApiId = evt.target.value;
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === id) {
              node.data = { ...node.data, apiId: newApiId, operationId: undefined };
            }
            return node;
          })
        );
    }, [id, setNodes]);

    const onOperationChange = useCallback((evt: React.ChangeEvent<HTMLSelectElement>) => {
        const newOperationId = evt.target.value;
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === id) {
              node.data = { ...node.data, operationId: newOperationId };
            }
            return node;
          })
        );
    }, [id, setNodes]);

    const selectedApi = availableApis.find(api => api.id === data.apiId);

    return (
        <CustomNodeWrapper id={id} data={data}>
            <label style={styles.nodeLabel}>API</label>
            <select value={data.apiId || ''} onChange={onApiChange} style={styles.nodeSelect}>
                <option value="" disabled>Select an API</option>
                {availableApis.map(api => (
                    <option key={api.id} value={api.id}>{api.name}</option>
                ))}
            </select>

            {selectedApi && (
                <>
                    <label style={styles.nodeLabel}>Operation</label>
                    <select value={data.operationId || ''} onChange={onOperationChange} style={styles.nodeSelect}>
                        <option value="" disabled>Select an Operation</option>
                        {selectedApi.operations.map(op => (
                            <option key={op.id} value={op.id}>{op.summary}</option>
                        ))}
                    </select>
                </>
            )}
            {data.operationId && <p style={{fontSize: 11, color: '#666', marginTop: 10}}>Configure parameters...</p>}
        </CustomNodeWrapper>
    );
};

const LogicNode: FC<NodeProps<LogicNodeData>> = ({ id, data }) => {
    return (
        <div style={styles.nodeBase}>
            <Handle type="target" position={Position.Left} style={styles.handle} />
            <div style={{...styles.nodeHeader, backgroundColor: '#9b59b6', color: 'white'}}>
                <GitFork size={16} />
                <span style={{marginLeft: '8px'}}>{data.label}</span>
            </div>
            <div style={styles.nodeContent}>
                <label style={styles.nodeLabel}>Condition</label>
                <input
                    type="text"
                    defaultValue={data.condition}
                    placeholder="e.g., input.status === 'success'"
                    style={styles.nodeInput}
                />
            </div>
            <Handle type="source" id="true" position={Position.Right} style={{...styles.handle, top: '35%', background: '#2ecc71'}} />
            <Handle type="source" id="false" position={Position.Right} style={{...styles.handle, top: '65%', background: '#e74c3c'}} />
        </div>
    );
};

const GoogleDriveNode: FC<NodeProps<GoogleDriveNodeData>> = ({ id, data }) => {
    return (
        <CustomNodeWrapper id={id} data={data}>
            <label style={styles.nodeLabel}>Action</label>
            <select defaultValue={data.action} style={styles.nodeSelect}>
                <option value="upload">Upload File</option>
                <option value="download">Download File</option>
                <option value="create_folder">Create Folder</option>
            </select>
            <label style={styles.nodeLabel}>File Path</label>
            <input type="text" placeholder="/my-folder/file.txt" style={styles.nodeInput} />
        </CustomNodeWrapper>
    );
};

const GitHubNode: FC<NodeProps<GitHubNodeData>> = ({ id, data }) => {
    return (
        <CustomNodeWrapper id={id} data={data}>
            <label style={styles.nodeLabel}>Action</label>
            <select defaultValue={data.action} style={styles.nodeSelect}>
                <option value="run_workflow">Run Workflow</option>
                <option value="create_issue">Create Issue</option>
                <option value="get_repo">Get Repo Info</option>
            </select>
            <label style={styles.nodeLabel}>Repository</label>
            <input type="text" placeholder="owner/repo-name" style={styles.nodeInput} />
        </CustomNodeWrapper>
    );
};

const nodeTypes: NodeTypes = {
  trigger: memo(TriggerNode),
  apiCall: memo(ApiCallNode),
  logic: memo(LogicNode),
  googleDrive: memo(GoogleDriveNode),
  github: memo(GitHubNode),
};

// --- SIDEBAR ---

interface DraggableNodeProps {
  nodeType: string;
  label: string;
  icon: React.ReactNode;
}

const DraggableNode: FC<DraggableNodeProps> = ({ nodeType, label, icon }) => {
  const [isHovered, setIsHovered] = useState(false);
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      style={{
        ...styles.draggableNode,
        ...(isHovered ? styles.draggableNodeHover : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragStart={(event) => onDragStart(event, nodeType)}
      draggable
    >
      <div style={styles.nodeIcon}>{icon}</div>
      {label}
    </div>
  );
};

const WorkflowSidebar = () => {
  return (
    <aside style={styles.sidebar}>
      <h2 style={styles.sidebarTitle}>Nodes</h2>
      <DraggableNode nodeType="trigger" label="Trigger" icon={<Zap size={20} color="#f39c12" />} />
      <DraggableNode nodeType="apiCall" label="API Call" icon={<Code size={20} color="#3498db" />} />
      <DraggableNode nodeType="logic" label="If/Else Logic" icon={<GitFork size={20} color="#9b59b6" />} />
      <h3 style={{...styles.sidebarTitle, fontSize: '16px', marginTop: '25px'}}>Integrations</h3>
      <DraggableNode nodeType="googleDrive" label="Google Drive" icon={<FileUp size={20} color="#0F9D58" />} />
      <DraggableNode nodeType="github" label="GitHub" icon={<Github size={20} color="#181717" />} />
    </aside>
  );
};

// --- MAIN CANVAS COMPONENT ---

let id = 0;
const getId = (type: string) => `${type}_${id++}`;

const WorkflowCanvasComponent: FC<WorkflowCanvasProps> = ({ initialWorkflow, onWorkflowChange, onRunWorkflow }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialWorkflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialWorkflow.edges);
  const { screenToFlowPosition } = useReactFlow();
  const [runButtonHover, setRunButtonHover] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNodeId = getId(type);
      let newNode: CustomNode;

      switch (type) {
        case 'trigger':
          newNode = {
            id: newNodeId,
            type,
            position,
            data: { label: 'Workflow Trigger', triggerType: 'webhook' },
          };
          break;
        case 'apiCall':
          newNode = {
            id: newNodeId,
            type,
            position,
            data: { label: 'API Call' },
          };
          break;
        case 'logic':
            newNode = {
                id: newNodeId,
                type,
                position,
                data: { label: 'Conditional Logic', condition: '' },
            };
            break;
        case 'googleDrive':
            newNode = {
                id: newNodeId,
                type,
                position,
                data: { label: 'Google Drive Action', action: 'upload' },
            };
            break;
        case 'github':
            newNode = {
                id: newNodeId,
                type,
                position,
                data: { label: 'GitHub Action', action: 'run_workflow' },
            };
            break;
        default:
          // Fallback for any other node type
          newNode = {
            id: newNodeId,
            type,
            position,
            data: { label: `${type} node` },
          };
      }

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const handleRunWorkflow = () => {
    const currentWorkflow: Workflow = {
        id: initialWorkflow.id,
        name: initialWorkflow.name,
        nodes,
        edges,
    };
    onRunWorkflow(currentWorkflow);
  };

  // This effect can be used to notify parent of changes
  // useEffect(() => {
  //   onWorkflowChange({ id: initialWorkflow.id, name: initialWorkflow.name, nodes, edges });
  // }, [nodes, edges, onWorkflowChange, initialWorkflow.id, initialWorkflow.name]);

  return (
    <div style={styles.canvasWrapper}>
      <WorkflowSidebar />
      <div style={styles.reactFlowWrapper} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background gap={16} />
          <div style={styles.topBar}>
            <button 
              style={{
                ...styles.button, 
                ...styles.runButton, 
                ...(runButtonHover ? styles.runButtonHover : {})
              }}
              onMouseEnter={() => setRunButtonHover(true)}
              onMouseLeave={() => setRunButtonHover(false)}
              onClick={handleRunWorkflow}
            >
              <Play size={16} />
              Run Workflow
            </button>
          </div>
        </ReactFlow>
      </div>
    </div>
  );
};

const WorkflowCanvas: FC<WorkflowCanvasProps> = (props) => (
  <ReactFlowProvider>
    <WorkflowCanvasComponent {...props} />
  </ReactFlowProvider>
);

export default WorkflowCanvas;