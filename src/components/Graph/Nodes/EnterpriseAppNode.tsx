import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Define the interface for the data passed to this custom node
interface EnterpriseAppNodeData {
  id: string; // The object ID from the data source (Azure AD object ID)
  displayName: string;
  appId: string; // The Azure AD Application ID
  createdDateTime: string;
  applicationType: string; // Should be "Enterprise Application"
  accountEnabled: string; // "True" or "False"
  applicationVisibility: string; // "Visible" or "Hidden"
  assignmentRequired: string; // "True" or "False"
  isAppProxy: string; // "True" or "False"
}

// EnterpriseAppNode component
const EnterpriseAppNode: React.FC<NodeProps<EnterpriseAppNodeData>> = ({ data }) => {
  const isAccountEnabled = data.accountEnabled === 'True';
  const isAssignmentRequired = data.assignmentRequired === 'True';
  const isAppProxy = data.isAppProxy === 'True';
  const isVisible = data.applicationVisibility === 'Visible';

  // Basic styling for the node container
  const nodeStyle: React.CSSProperties = {
    border: '1px solid #004d99', // Dark blue border for Enterprise Apps
    borderRadius: '5px',
    padding: '10px',
    backgroundColor: '#e6f2ff', // Light blue background
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    width: '250px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    position: 'relative', // Needed for Handle positioning
  };

  // Styling for the display name header
  const headerStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '4px',
    color: '#004d99',
  };

  // Styling for detail lines
  const detailStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#555',
    marginBottom: '2px', // Reduce margin slightly for more compact display
  };

  // Styling for status indicator dots
  const statusIndicatorStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginRight: '5px',
    verticalAlign: 'middle', // Align with text
  };

  // Specific colors for boolean status indicators
  const enabledStatusStyle = { ...statusIndicatorStyle, backgroundColor: isAccountEnabled ? 'green' : 'red' };
  const visibleStatusStyle = { ...statusIndicatorStyle, backgroundColor: isVisible ? 'green' : 'red' };
  const assignmentRequiredStatusStyle = { ...statusIndicatorStyle, backgroundColor: isAssignmentRequired ? 'orange' : 'lightgray' }; // Orange for required, gray for not
  const appProxyStatusStyle = { ...statusIndicatorStyle, backgroundColor: isAppProxy ? 'darkorchid' : 'lightgray' }; // Distinct color for app proxy

  return (
    <div style={nodeStyle}>
      <Handle type="target" position={Position.Top} id="in" /> {/* Input handle at the top */}
      
      <div style={headerStyle}>{data.displayName}</div>
      <div style={detailStyle}><strong>Type:</strong> {data.applicationType}</div>
      <div style={detailStyle}><strong>Object ID:</strong> {data.id}</div>
      <div style={detailStyle}><strong>App ID:</strong> {data.appId}</div>
      
      <div style={detailStyle}>
        <span style={enabledStatusStyle}></span>
        Account Enabled: {data.accountEnabled}
      </div>
      <div style={detailStyle}>
        <span style={visibleStatusStyle}></span>
        Visibility: {data.applicationVisibility}
      </div>
      <div style={detailStyle}>
        <span style={assignmentRequiredStatusStyle}></span>
        Assignment Required: {data.assignmentRequired}
      </div>
      <div style={detailStyle}>
        <span style={appProxyStatusStyle}></span>
        App Proxy: {data.isAppProxy}
      </div>
      
      <div style={detailStyle}><strong>Created:</strong> {new Date(data.createdDateTime).toLocaleDateString()}</div>
      
      <Handle type="source" position={Position.Bottom} id="out" /> {/* Output handle at the bottom */}
    </div>
  );
};

export default EnterpriseAppNode;