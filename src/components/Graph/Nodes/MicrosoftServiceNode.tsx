import React from 'react';
import { Handle, Position } from 'reactflow';

interface MicrosoftServiceNodeProps {
  data: {
    id: string;
    displayName: string;
    appId: string;
    createdDateTime: string;
    applicationType?: string;
    accountEnabled?: boolean;
    applicationVisibility?: string;
    assignmentRequired?: boolean;
    isAppProxy?: boolean;
  };
}

function MicrosoftServiceNode({ data }: MicrosoftServiceNodeProps) {
  return (
    <div className="microsoft-service-node" style={{ border: '1px solid #228be6', padding: '10px', borderRadius: '4px', backgroundColor: '#fff', textAlign: 'center', width: '200px' }}>
      <Handle type="target" position={Position.Top} id="a" />
      <div style={{ fontWeight: 'bold' }}>{data.displayName}</div>
      <div>
        <small>App ID: {data.appId}</small>
      </div>
      <div>
        <small>Created: {new Date(data.createdDateTime).toLocaleDateString()}</small>
      </div>
      <Handle type="source" position={Position.Bottom} id="b" />
    </div>
  );
}

export default MicrosoftServiceNode;