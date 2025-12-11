```tsx
import React from 'react';
import { Handle, Position } from 'reactflow';

interface ManagedIdentityNodeProps {
  id: string;
  data: {
    displayName: string;
    appId: string;
    applicationType: string;
    createdDateTime: string;
  };
}

function ManagedIdentityNode({ id, data }: ManagedIdentityNodeProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-md p-2 shadow-md" style={{ width: '200px' }}>
      <Handle type="target" position={Position.Top} id={`${id}-top`} />
      <div className="text-sm font-semibold mb-1">{data.displayName}</div>
      <div className="text-xs text-gray-500">
        App ID: {data.appId ? data.appId.substring(0,8) : 'N/A'}...
      </div>
       <div className="text-xs text-gray-500">
        Application Type: {data.applicationType ? data.applicationType : 'N/A'}
      </div>
      <div className="text-xs text-gray-500">
        Created: {data.createdDateTime ? data.createdDateTime.substring(0,10) : 'N/A'}
      </div>
      <Handle type="source" position={Position.Bottom} id={`${id}-bottom`} />
    </div>
  );
}

export default ManagedIdentityNode;
```