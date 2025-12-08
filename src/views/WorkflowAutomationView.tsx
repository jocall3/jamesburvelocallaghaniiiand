import React, { useState, useCallback, useRef, DragEvent, FC } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  Button,
  IconButton,
  useColorModeValue,
  Input,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Code,
  Avatar,
  HStack,
  Spacer,
  useToast,
} from '@chakra-ui/react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Node,
  Edge,
  Connection,
  MiniMap,
  NodeProps,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import {
  FiPlay,
  FiSave,
  FiUploadCloud,
  FiDownloadCloud,
  FiZap,
  FiCode,
  FiGitBranch,
  FiDatabase,
  FiTerminal,
  FiFilter,
  FiRepeat,
} from 'react-icons/fi';
import { FaGoogle, FaGithub, FaGoogleDrive } from 'react-icons/fa';

// --- TYPES AND INTERFACES ---

type NodeDataType = {
  label: string;
  type: string;
  [key: string]: any;
};

type CustomNode = Node<NodeDataType>;

interface ApiNodeData extends NodeDataType {
  type: 'apiCall';
  operationId: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: string; // JSON string
  queryParams: string; // JSON string
  body: string; // JSON string
  preScript: string;
  postScript: string;
}

interface GoogleDriveNodeData extends NodeDataType {
  type: 'googleDrive';
  action: 'upload' | 'download' | 'list';
  filePath: string;
  fileContentVariable?: string; // Variable name holding content to upload
  destinationVariable?: string; // Variable name to store downloaded content/file list
}

interface GitHubNodeData extends NodeDataType {
    type: 'github';
    action: 'runWorkflow' | 'createIssue' | 'getRepo';
    owner: string;
    repo: string;
    workflowId?: string;
    issueTitle?: string;
    issueBody?: string;
}

interface LogicNodeData extends NodeDataType {
    type: 'logic';
    logicType: 'if' | 'loop' | 'switch';
    condition?: string; // e.g., '{{input.statusCode}} == 200'
}

// --- INITIAL DATA ---

const initialNodes: CustomNode[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Workflow Trigger', type: 'trigger' },
    position: { x: 250, y: 5 },
  },
];

const nodeTypesList = [
    { type: 'apiCall', label: 'API Call', icon: FiZap, color: 'teal.400' },
    { type: 'googleDrive', label: 'Google Drive', icon: FaGoogleDrive, color: 'green.400' },
    { type: 'github', label: 'GitHub Action', icon: FaGithub, color: 'gray.600' },
    { type: 'logic', label: 'Logic', icon: FiFilter, color: 'purple.400' },
    { type: 'script', label: 'Custom Script', icon: FiCode, color: 'orange.400' },
    { type: 'dataTransform', label: 'Data Transform', icon: FiGitBranch, color: 'blue.400' },
];


// --- CUSTOM NODES ---

const CustomNodeComponent: FC<NodeProps<NodeDataType>> = ({ data }) => {
    const nodeConfig = nodeTypesList.find(n => n.type === data.type);
    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    return (
        <Box
            padding="10px"
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            bg={bgColor}
            width="200px"
            boxShadow="md"
        >
            <Handle type="target" position={Position.Top} />
            <HStack>
                {nodeConfig && <nodeConfig.icon color={nodeConfig.color} />}
                <Text fontWeight="bold">{data.label}</Text>
            </HStack>
            {data.operationId && <Text fontSize="xs" color="gray.500" mt={1}>ID: {data.operationId}</Text>}
            <Handle type="source" position={Position.Bottom} />
        </Box>
    );
};

const nodeTypes = {
    apiCall: CustomNodeComponent,
    googleDrive: CustomNodeComponent,
    github: CustomNodeComponent,
    logic: CustomNodeComponent,
    script: CustomNodeComponent,
    dataTransform: CustomNodeComponent,
};

// --- UI COMPONENTS ---

const ToolboxPanel: FC<{ onDragStart: (event: DragEvent, nodeType: string) => void }> = ({ onDragStart }) => {
    const bgColor = useColorModeValue('gray.50', 'gray.800');
    const itemBgColor = useColorModeValue('white', 'gray.700');
    const itemHoverBgColor = useColorModeValue('gray.100', 'gray.600');

    return (
        <VStack align="stretch" p={4} bg={bgColor} spacing={3}>
            <Heading size="md" mb={2}>Toolbox</Heading>
            {nodeTypesList.map(({ type, label, icon: Icon, color }) => (
                <Flex
                    key={type}
                    p={3}
                    borderRadius="md"
                    bg={itemBgColor}
                    boxShadow="sm"
                    cursor="grab"
                    draggable
                    onDragStart={(event) => onDragStart(event, type)}
                    alignItems="center"
                    _hover={{ bg: itemHoverBgColor, boxShadow: 'md' }}
                    transition="background-color 0.2s, box-shadow 0.2s"
                >
                    <Icon color={color} mr={3} />
                    <Text>{label}</Text>
                </Flex>
            ))}
        </VStack>
    );
};

const InspectorPanel: FC<{ selectedNode: CustomNode | null; updateNodeData: (nodeId: string, data: Partial<NodeDataType>) => void }> = ({ selectedNode, updateNodeData }) => {
    const bgColor = useColorModeValue('gray.50', 'gray.800');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!selectedNode) return;
        updateNodeData(selectedNode.id, { [e.target.name]: e.target.value });
    };

    const renderNodeForm = () => {
        if (!selectedNode) {
            return <Text p={4}>Select a node to configure its properties.</Text>;
        }

        const { data } = selectedNode;

        switch (data.type) {
            case 'apiCall':
                const apiData = data as ApiNodeData;
                return (
                    <VStack spacing={4} align="stretch">
                        <FormControl>
                            <FormLabel>Operation ID</FormLabel>
                            <Input name="operationId" value={apiData.operationId || ''} onChange={handleInputChange} />
                        </FormControl>
                        <FormControl>
                            <FormLabel>HTTP Method</FormLabel>
                            <Select name="method" value={apiData.method || 'GET'} onChange={handleInputChange}>
                                <option>GET</option>
                                <option>POST</option>
                                <option>PUT</option>
                                <option>DELETE</option>
                                <option>PATCH</option>
                            </Select>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Request URL</FormLabel>
                            <Input name="url" placeholder="https://api.example.com/data" value={apiData.url || ''} onChange={handleInputChange} />
                        </FormControl>
                        <Tabs variant="enclosed">
                            <TabList>
                                <Tab>Headers</Tab>
                                <Tab>Query</Tab>
                                <Tab>Body</Tab>
                                <Tab>Pre-Script</Tab>
                                <Tab>Post-Script</Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel><Textarea name="headers" placeholder='{ "Authorization": "Bearer ..." }' value={apiData.headers || ''} onChange={handleInputChange} fontFamily="monospace" /></TabPanel>
                                <TabPanel><Textarea name="queryParams" placeholder='{ "id": "123" }' value={apiData.queryParams || ''} onChange={handleInputChange} fontFamily="monospace" /></TabPanel>
                                <TabPanel><Textarea name="body" placeholder='{ "key": "value" }' value={apiData.body || ''} onChange={handleInputChange} fontFamily="monospace" /></TabPanel>
                                <TabPanel><Textarea name="preScript" placeholder="// JS code to run before request" value={apiData.preScript || ''} onChange={handleInputChange} fontFamily="monospace" /></TabPanel>
                                <TabPanel><Textarea name="postScript" placeholder="// JS code to run after request" value={apiData.postScript || ''} onChange={handleInputChange} fontFamily="monospace" /></TabPanel>
                            </TabPanels>
                        </Tabs>
                    </VStack>
                );
            // Add cases for other node types (googleDrive, github, etc.) here
            default:
                return (
                    <VStack spacing={4} align="stretch">
                        <FormControl>
                            <FormLabel>Label</FormLabel>
                            <Input name="label" value={data.label} onChange={handleInputChange} />
                        </FormControl>
                        <Text>Node Type: <Code>{data.type}</Code></Text>
                        <Text>Node ID: <Code>{selectedNode.id}</Code></Text>
                    </VStack>
                );
        }
    };

    return (
        <Box p={4} bg={bgColor}>
            <Heading size="md" mb={4}>Inspector</Heading>
            {renderNodeForm()}
        </Box>
    );
};

const Header: FC<{ onSave: () => void; onRun: () => void; onExport: () => void }> = ({ onSave, onRun, onExport }) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    return (
        <Flex as="header" p={3} bg={bgColor} borderBottom="1px" borderColor={borderColor} alignItems="center">
            <HStack spacing={2}>
                <FiGitBranch size="24px" color="purple" />
                <Heading size="md">Universal OpenAPI Workflow Engine</Heading>
            </HStack>
            <Spacer />
            <HStack spacing={2}>
                <Button leftIcon={<FiPlay />} colorScheme="green" onClick={onRun}>Run</Button>
                <Button leftIcon={<FiSave />} colorScheme="blue" onClick={onSave}>Save</Button>
                <Button leftIcon={<FiDownloadCloud />} variant="outline" onClick={onExport}>Export OpenAPI 3.1</Button>
            </HStack>
            <Spacer />
            <HStack spacing={4}>
                <Text>user@gmail.com</Text>
                <Avatar size="sm" name="User" icon={<FaGoogle />} />
            </HStack>
        </Flex>
    );
};


// --- MAIN VIEW ---

const WorkflowAutomationView = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
    const toast = useToast();

    const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onDragOver = useCallback((event: DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: DragEvent) => {
            event.preventDefault();

            if (!reactFlowWrapper.current || !reactFlowInstance) return;

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const type = event.dataTransfer.getData('application/reactflow');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            const nodeConfig = nodeTypesList.find(n => n.type === type);
            if (!nodeConfig) return;

            let newNodeData: NodeDataType;

            // Create specific data structures for each node type
            switch (type) {
                case 'apiCall':
                    newNodeData = { type, label: 'API Call', operationId: `op_${uuidv4().slice(0, 8)}`, method: 'GET', url: '' } as ApiNodeData;
                    break;
                case 'googleDrive':
                    newNodeData = { type, label: 'Google Drive', action: 'upload', filePath: '/my-file.txt' } as GoogleDriveNodeData;
                    break;
                case 'github':
                    newNodeData = { type, label: 'GitHub', action: 'runWorkflow', owner: '', repo: '' } as GitHubNodeData;
                    break;
                case 'logic':
                    newNodeData = { type, label: 'If/Else', logicType: 'if', condition: '' } as LogicNodeData;
                    break;
                default:
                    newNodeData = { type, label: nodeConfig.label };
            }

            const newNode: CustomNode = {
                id: uuidv4(),
                type,
                position,
                data: newNodeData,
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const onDragStart = (event: DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node as CustomNode);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const updateNodeData = useCallback((nodeId: string, data: Partial<NodeDataType>) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    // Create a new data object to ensure React detects the change
                    node.data = { ...node.data, ...data };
                }
                return node;
            })
        );
        // Also update the selected node state if it's the one being edited
        if (selectedNode && selectedNode.id === nodeId) {
            setSelectedNode(prev => prev ? ({ ...prev, data: { ...prev.data, ...data } }) : null);
        }
    }, [setNodes, selectedNode]);

    const handleSave = () => {
        const workflow = {
            nodes,
            edges,
            // In a real app, you'd add more metadata here
        };
        console.log('Saving workflow:', JSON.stringify(workflow, null, 2));
        toast({
            title: 'Workflow Saved',
            description: 'Workflow state has been logged to the console.',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    const handleRun = () => {
        console.log('Running workflow...');
        toast({
            title: 'Workflow Execution Started',
            description: 'Check the console for execution logs.',
            status: 'info',
            duration: 3000,
            isClosable: true,
        });
        // Here you would implement the logic to traverse the graph (nodes and edges)
        // and execute the action defined in each node's data.
    };

    const handleExport = () => {
        // This is a simplified OpenAPI export. A real implementation would be much more complex.
        const openApiSpec = {
            openapi: '3.1.0',
            info: {
                title: 'Generated Workflow API',
                version: '1.0.0',
            },
            paths: {},
        };

        nodes.forEach(node => {
            if (node.data.type === 'apiCall') {
                const apiData = node.data as ApiNodeData;
                const path = new URL(apiData.url).pathname;
                if (!openApiSpec.paths[path]) {
                    openApiSpec.paths[path] = {};
                }
                openApiSpec.paths[path][apiData.method.toLowerCase()] = {
                    operationId: apiData.operationId,
                    summary: apiData.label,
                    responses: {
                        '200': {
                            description: 'Successful response',
                        },
                    },
                };
            }
        });

        console.log('Exporting OpenAPI 3.1.0 Spec:', JSON.stringify(openApiSpec, null, 2));
        toast({
            title: 'OpenAPI Spec Exported',
            description: 'The generated spec has been logged to the console.',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    const bgColor = useColorModeValue('white', 'gray.900');
    const minimapBgColor = useColorModeValue('#E2E8F0', '#2D3748');

    return (
        <Flex direction="column" h="100vh" bg={bgColor}>
            <Header onSave={handleSave} onRun={handleRun} onExport={handleExport} />
            <Grid
                templateAreas={`"toolbox canvas inspector"`}
                gridTemplateColumns={'250px 1fr 400px'}
                h="calc(100vh - 65px)" // Full height minus header
                gap={1}
            >
                <GridItem area={'toolbox'} overflowY="auto">
                    <ToolboxPanel onDragStart={onDragStart} />
                </GridItem>
                <GridItem area={'canvas'} ref={reactFlowWrapper}>
                    <ReactFlowProvider>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onInit={setReactFlowInstance}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onNodeClick={onNodeClick}
                            onPaneClick={onPaneClick}
                            nodeTypes={nodeTypes}
                            fitView
                        >
                            <Controls />
                            <MiniMap nodeColor={(n) => nodeTypesList.find(nt => nt.type === n.data.type)?.color || '#ddd'} style={{ backgroundColor: minimapBgColor }} />
                            <Background gap={12} size={1} />
                        </ReactFlow>
                    </ReactFlowProvider>
                </GridItem>
                <GridItem area={'inspector'} overflowY="auto">
                    <InspectorPanel selectedNode={selectedNode} updateNodeData={updateNodeData} />
                </GridItem>
            </Grid>
        </Flex>
    );
};

export default WorkflowAutomationView;