import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  Connection,
  addEdge,
  useReactFlow,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css'; // Basic React Flow styles
import { useGenerativeAI } from '../../../hooks/useGenerativeAI';
import { DataLayerIcon } from '../../../constants'; // Reusing existing icon for data layer representation
import { ServerStackIcon, CircleStackIcon, Cog6ToothIcon, CubeTransparentIcon, CodeBracketIcon } from '@heroicons/react/24/outline'; // More icons for different node types

// ================================================================================================
// CUSTOM NODE COMPONENTS
// ================================================================================================
// These components provide a distinct visual identity for different elements in the data mesh.

const DataProductNode = ({ data }: { data: { label: string; type: string; status: string; description?: string } }) => (
  <div className="bg-gradient-to-br from-purple-800 to-indigo-900 border border-purple-600 rounded-lg shadow-lg p-4 w-48 text-white text-center transform hover:scale-105 transition-transform duration-200">
    <DataLayerIcon className="h-6 w-6 mx-auto mb-2 text-purple-300" />
    <div className="font-semibold text-lg">{data.label}</div>
    <div className="text-sm text-purple-200">{data.type}</div>
    <div className={`text-xs mt-1 ${data.status === 'Healthy' ? 'text-green-400' : data.status === 'Warning' ? 'text-yellow-400' : 'text-red-400'}`}>
        {data.status}
    </div>
  </div>
);

const SourceSystemNode = ({ data }: { data: { label: string; type: string; description?: string } }) => (
  <div className="bg-gradient-to-br from-green-700 to-teal-800 border border-green-500 rounded-lg shadow-lg p-4 w-48 text-white text-center transform hover:scale-105 transition-transform duration-200">
    <ServerStackIcon className="h-6 w-6 mx-auto mb-2 text-green-300" />
    <div className="font-semibold text-lg">{data.label}</div>
    <div className="text-sm text-green-200">{data.type}</div>
  </div>
);

const TransformationNode = ({ data }: { data: { label: string; type: string; description?: string } }) => (
  <div className="bg-gradient-to-br from-orange-700 to-red-800 border border-orange-500 rounded-lg shadow-lg p-4 w-48 text-white text-center transform hover:scale-105 transition-transform duration-200">
    <Cog6ToothIcon className="h-6 w-6 mx-auto mb-2 text-orange-300" />
    <div className="font-semibold text-lg">{data.label}</div>
    <div className="text-sm text-orange-200">{data.type}</div>
  </div>
);

const DataLakeNode = ({ data }: { data: { label: string; type: string; description?: string } }) => (
  <div className="bg-gradient-to-br from-blue-700 to-cyan-800 border border-blue-500 rounded-lg shadow-lg p-4 w-48 text-white text-center transform hover:scale-105 transition-transform duration-200">
    <CubeTransparentIcon className="h-6 w-6 mx-auto mb-2 text-blue-300" />
    <div className="font-semibold text-lg">{data.label}</div>
    <div className="text-sm text-blue-200">{data.type}</div>
  </div>
);

// ================================================================================================
// MOCK INITIAL DATA FOR THE DATA MESH GRAPH
// ================================================================================================

const initialNodes: Node[] = [
  { id: '1', position: { x: 50, y: 150 }, data: { label: 'CRM System', type: 'Source System', description: 'Customer Relationship Management database.' }, type: 'sourceSystem' },
  { id: '2', position: { x: 50, y: 350 }, data: { label: 'ERP Database', type: 'Source System', description: 'Enterprise Resource Planning financial database.' }, type: 'sourceSystem' },
  { id: '3', position: { x: 300, y: 250 }, data: { label: 'Data Ingestion Service', type: 'ETL Pipeline', description: 'Service responsible for extracting, transforming, and loading data.' }, type: 'transformation' },
  { id: '4', position: { x: 550, y: 250 }, data: { label: 'Raw Data Lake', type: 'Data Lake', description: 'Central repository for raw, unprocessed data.' }, type: 'dataLake' },
  { id: '5', position: { x: 800, y: 150 }, data: { label: 'Customer 360 DP', type: 'Data Product', status: 'Healthy', description: 'Aggregated view of customer data for analytics.' }, type: 'dataProduct' },
  { id: '6', position: { x: 800, y: 350 }, data: { label: 'Financial Txn DP', type: 'Data Product', status: 'Healthy', description: 'Curated data product for financial transactions.' }, type: 'dataProduct' },
  { id: '7', position: { x: 1050, y: 250 }, data: { label: 'Reporting & BI', type: 'Consumption Layer', description: 'Service for generating reports and business intelligence dashboards.' }, type: 'transformation' },
  { id: '8', position: { x: 1300, y: 250 }, data: { label: 'Analyst Dashboard', type: 'Frontend App', status: 'Healthy', description: 'User-facing dashboard for business analysts.' }, type: 'dataProduct' },
  { id: '9', position: { x: 550, y: 50 }, data: { label: 'Audit Log Stream', type: 'Data Stream', description: 'Real-time stream of audit events.', status: 'Healthy' }, type: 'dataProduct' },
  { id: '10', position: { x: 800, y: 50 }, data: { label: 'Security Anomaly DP', type: 'Data Product', status: 'Warning', description: 'Data product for detected security anomalies.' }, type: 'dataProduct' },
];

const initialEdges: Edge[] = [
  { id: 'e1-3', source: '1', target: '3', label: 'CRM Data Flow', animated: true, style: { strokeWidth: 2, stroke: '#8b5cf6' } },
  { id: 'e2-3', source: '2', target: '3', label: 'ERP Data Flow', animated: true, style: { strokeWidth: 2, stroke: '#8b5cf6' } },
  { id: 'e3-4', source: '3', target: '4', label: 'Raw Data Load', animated: true, style: { strokeWidth: 2, stroke: '#22d3ee' } },
  { id: 'e4-5', source: '4', target: '5', label: 'Transform C360', animated: true, style: { strokeWidth: 2, stroke: '#a855f7' } },
  { id: 'e4-6', source: '4', target: '6', label: 'Transform Txn', animated: true, style: { strokeWidth: 2, stroke: '#a855f7' } },
  { id: 'e5-7', source: '5', target: '7', label: 'C360 for BI', animated: true, style: { strokeWidth: 2, stroke: '#fbbf24' } },
  { id: 'e6-7', source: '6', target: '7', label: 'Txn for BI', animated: true, style: { strokeWidth: 2, stroke: '#fbbf24' } },
  { id: 'e7-8', source: '7', target: '8', label: 'Report Consumption', animated: true, style: { strokeWidth: 2, stroke: '#f472b6' } },
  { id: 'e9-4', source: '9', target: '4', label: 'Audit Log Ingestion', animated: true, style: { strokeWidth: 2, stroke: '#a855f7' } },
  { id: 'e4-10', source: '4', target: '10', label: 'Security Anomaly Detection', animated: true, style: { strokeWidth: 2, stroke: '#f472b6' } },
  { id: 'e10-8', source: '10', target: '8', label: 'Security Alerts', animated: true, style: { strokeWidth: 2, stroke: '#f472b6' } },
];

const DataMeshContent: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedElement, setSelectedElement] = useState<Node | Edge | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const { generativeModel, callGenerativeAI } = useGenerativeAI();
  const { fitView } = useReactFlow();

  const nodeTypes = useMemo(() => ({
    dataProduct: DataProductNode,
    sourceSystem: SourceSystemNode,
    transformation: TransformationNode,
    dataLake: DataLakeNode,
  }), []);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedElement(node);
    setAiResponse(''); // Clear previous AI response
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedElement(edge);
    setAiResponse(''); // Clear previous AI response
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedElement(null);
    setAiResponse('');
  }, []);

  const simulateAICall = useCallback(async (prompt: string, element: Node | Edge | null) => {
    if (!generativeModel) {
      setAiResponse("AI is not initialized. Please check your Gemini API key.");
      return;
    }
    setAiLoading(true);
    let aiInput = `You are an AI assistant for a Data Mesh platform. Your goal is to provide concise, accurate, and helpful information about data products, lineage, quality, and ownership within a complex data ecosystem.`;

    const elementDetails = element ? (
        'data' in element ? 
        `Element Type: Node (${element.type})\nLabel: ${element.data?.label || 'N/A'}\nDescription: ${element.data?.description || 'N/A'}\nID: ${element.id}` :
        `Element Type: Edge\nLabel: ${element.label || 'N/A'}\nSource: ${element.source}\nTarget: ${element.target}\nID: ${element.id}`
    ) : 'No specific element selected.';

    aiInput += `\n\nContext:\n${elementDetails}\n\nUser Query: "${prompt}"`;

    let simulatedResponse = "";
    const lowerCasePrompt = prompt.toLowerCase();

    if (lowerCasePrompt.includes("lineage")) {
        let pathDescription = "";
        if (element && 'data' in element) {
            switch (element.id) {
                case '5': pathDescription = "This data product (Customer 360) originates from the CRM System (Node 1), flows through Ingestion (Node 3), lands in the Raw Data Lake (Node 4), and is then transformed."; break;
                case '6': pathDescription = "This data product (Financial Transactions) originates from the ERP Database (Node 2), flows through Ingestion (Node 3), lands in the Raw Data Lake (Node 4), and is then transformed."; break;
                case '8': pathDescription = "This dashboard consumes from Customer 360 (Node 5) and Financial Transaction (Node 6) Data Products, which in turn originate from CRM and ERP systems."; break;
                default: pathDescription = `Lineage for ${element.data?.label || 'selected element'} is complex. It flows from multiple source systems, through the Raw Data Lake, and various transformations.`;
            }
        } else if (element && 'source' in element) {
             pathDescription = `This edge (ID: ${element.id}) represents a direct data flow from ${nodes.find(n => n.id === element.source)?.data?.label || element.source} to ${nodes.find(n => n.id === element.target)?.data?.label || element.target}.`;
        } else {
            pathDescription = "Please select a specific node or edge to trace its lineage.";
        }
        simulatedResponse = `**Data Lineage Trace:**\n${pathDescription}`;
    } else if (lowerCasePrompt.includes("quality") || lowerCasePrompt.includes("anomaly")) {
        if (element && 'data' in element) {
            const status = (element.data as any).status; // Assuming status is directly on data
            if (status === 'Healthy') {
                simulatedResponse = `**Data Quality Report:**\nData quality for '${element.data?.label || 'selected element'}' is currently **${status}**. No significant anomalies or schema drifts detected in the last 24 hours.`;
            } else if (status === 'Warning') {
                 simulatedResponse = `**Data Quality Alert (Warning):**\nAnomaly detected on '${element.data?.label || 'selected element'}'. There was a 15% drop in expected data volume from 'Audit Log Stream' (Node 9) in the last hour. Investigating potential upstream issues.`;
            } else {
                simulatedResponse = `**Data Quality Alert (Critical):**\nCritical schema mismatch detected on '${element.data?.label || 'selected element'}'. The 'Transaction Type' column is receiving unexpected string values. Immediate attention required by Data Engineering.`;
            }
        } else {
            simulatedResponse = `**Overall Data Quality Summary:**\nOne warning: 'Security Anomaly DP' (Node 10) is experiencing a moderate data latency. One critical alert: 'ERP Database' (Node 2) reported 2 hours of data ingestion failure.`;
        }
    } else if (lowerCasePrompt.includes("owner") || lowerCasePrompt.includes("steward")) {
        if (element && 'data' in element) {
            let owner = "Platform Data Governance Team";
            if (element.id === '5' || element.id === '6') owner = "Financial Data Product Team";
            else if (element.id === '1' || element.id === '2') owner = "Source System Administration";
            simulatedResponse = `**Data Ownership:**\nThe owner of '${element.data?.label || 'selected element'}' is the "${owner}". Contact 'data.governance@demobank.com' for governance inquiries.`;
        } else {
            simulatedResponse = "Please select an element to find its owner/steward.";
        }
    } else if (lowerCasePrompt.includes("description")) {
         if (element && 'data' in element && element.data?.description) {
            simulatedResponse = `**Description for ${element.data.label}:**\n${element.data.description}`;
        } else if (element && 'source' in element && element.label) {
            simulatedResponse = `**Description for Edge ${element.id}:**\nThis edge represents the data flow: "${element.label}". It connects ${nodes.find(n => n.id === element.source)?.data?.label || element.source} to ${nodes.find(n => n.id === element.target)?.data?.label || element.target}.`;
        } else {
            simulatedResponse = `**Description Request:**\nPlease select an element or be more specific in your query to get a description.`;
        }
    } else if (lowerCasePrompt.includes("discover customer data products")) {
        simulatedResponse = "**Discovered Data Products:**\n- **Customer 360 DP (Node 5):** Provides a holistic view of customer interactions.\n- **CRM System (Node 1):** Primary source of customer demographic data.";
    }
    else {
      simulatedResponse = await callGenerativeAI(aiInput); // Fallback to actual AI call
    }

    setAiResponse(simulatedResponse);
    setAiLoading(false);
  }, [generativeModel, callGenerativeAI, nodes]); // Added nodes to dependencies for pathDescription

  const handleAiSubmit = () => {
    simulateAICall(aiPrompt, selectedElement);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg shadow-xl overflow-hidden p-6">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6 flex items-center">
        <DataLayerIcon className="h-8 w-8 mr-3 text-cyan-500" />
        Data Mesh: Registrar of Data Manifestations
      </h1>
      <p className="text-gray-400 mb-6">
        Visualize the distributed data architecture, mapping data products and their flows across domains. Use AI to discover insights, trace lineage, and monitor data quality.
      </p>

      <div className="flex flex-1 gap-6">
        {/* Main React Flow Canvas */}
        <div className="flex-1 min-h-[500px] bg-gray-950 rounded-lg border border-gray-700 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            fitView
            nodeTypes={nodeTypes}
            className="react-flow-dark"
          >
            <Controls className="!bg-gray-800 !border-gray-700 [&>button]:!text-cyan-400 [&>button]:!border-b [&>button]:!border-gray-700 [&>button:hover]:!bg-gray-700" />
            <Background variant="dots" gap={12} size={1} className="bg-gray-950" />
            <Panel position="top-left" className="p-2 text-cyan-400 font-semibold bg-gray-800 bg-opacity-70 rounded-br-lg z-20">
                Data Flow Canvas
            </Panel>
            <Panel position="bottom-right" className="p-2 z-20">
                <button onClick={() => fitView()} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                    Fit View
                </button>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Sidebar for AI & Details */}
        <div className="w-1/3 flex flex-col gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md flex-1">
            <h2 className="text-xl font-semibold text-cyan-300 mb-3">
              {selectedElement ? `Details: ${'data' in selectedElement ? selectedElement.data?.label : selectedElement.id}` : 'Selected Element Details'}
            </h2>
            {selectedElement ? (
              <div className="text-sm text-gray-300 space-y-2">
                {'data' in selectedElement ? (
                  <>
                    <p><span className="font-medium">Type:</span> {selectedElement.data?.type}</p>
                    <p><span className="font-medium">Label:</span> {selectedElement.data?.label}</p>
                    {selectedElement.type === 'dataProduct' && <p><span className="font-medium">Status:</span> { (selectedElement.data as any).status }</p>}
                    {'description' in selectedElement.data && <p><span className="font-medium">Description:</span> {selectedElement.data.description}</p>}
                  </>
                ) : (
                  <>
                    <p><span className="font-medium">Flow ID:</span> {selectedElement.id}</p>
                    <p><span className="font-medium">Source Node:</span> {nodes.find(n => n.id === selectedElement.source)?.data?.label || selectedElement.source}</p>
                    <p><span className="font-medium">Target Node:</span> {nodes.find(n => n.id === selectedElement.target)?.data?.label || selectedElement.target}</p>
                    {selectedElement.label && <p><span className="font-medium">Purpose:</span> {selectedElement.label}</p>}
                  </>
                )}
                <p className="text-xs text-gray-500 mt-2">Click on any node or edge to see its properties.</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No element selected. Click a node or edge on the canvas to view its properties.</p>
            )}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md flex-1">
            <h2 className="text-xl font-semibold text-cyan-300 mb-3">AI Data Mesh Assistant</h2>
            <textarea
              className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3 text-sm"
              rows={3}
              placeholder={selectedElement ? `Ask about "${'data' in selectedElement ? selectedElement.data?.label : selectedElement.id}" (e.g., "Show lineage", "Check data quality", "Who owns this?")` : "Ask a question about the data mesh (e.g., 'Discover customer data products')."}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            ></textarea>
            <button
              onClick={handleAiSubmit}
              disabled={!aiPrompt || aiLoading}
              className={`w-full py-2 px-4 rounded-md font-semibold transition-colors duration-200 ${
                aiPrompt && !aiLoading ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {aiLoading ? 'Thinking...' : 'Ask AI'}
            </button>
            {aiResponse && (
              <div className="mt-4 p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 text-sm overflow-auto max-h-48">
                <h3 className="font-semibold text-cyan-300 mb-2">AI Insight:</h3>
                <p className="whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ReactFlowProvider is necessary for useReactFlow hook to work
const DataMeshView: React.FC = () => (
  <ReactFlowProvider>
    <DataMeshContent />
  </ReactFlowProvider>
);

export default DataMeshView;