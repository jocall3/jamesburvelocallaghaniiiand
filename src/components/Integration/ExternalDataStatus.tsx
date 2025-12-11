```tsx
import React from 'react';

interface ExternalDataStatusProps {
  feedName: string;
  isConnected: boolean;
  lastUpdated?: Date;
}

const ExternalDataStatus: React.FC<ExternalDataStatusProps> = ({ feedName, isConnected, lastUpdated }) => {
  const statusColor = isConnected ? 'green' : 'red';
  const statusText = isConnected ? 'Connected' : 'Disconnected';
  const lastUpdatedFormatted = lastUpdated ? lastUpdated.toLocaleString() : 'N/A';

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: statusColor, marginRight: '5px' }} />
      <div>
        <strong>{feedName}:</strong> {statusText}
        {lastUpdated && <span style={{ marginLeft: '10px' }}>Last Updated: {lastUpdatedFormatted}</span>}
      </div>
    </div>
  );
};

export default ExternalDataStatus;
```