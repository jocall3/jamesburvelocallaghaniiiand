```tsx
import React from 'react';
import { Tooltip } from 'react-tooltip';

interface NodeTooltipProps {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: string;
  applicationType: string;
  accountEnabled: boolean;
  applicationVisibility: string;
  assignmentRequired: boolean;
  isAppProxy: boolean;
}

const NodeTooltip: React.FC<NodeTooltipProps> = ({
  id,
  displayName,
  appId,
  createdDateTime,
  applicationType,
  accountEnabled,
  applicationVisibility,
  assignmentRequired,
  isAppProxy,
}) => {
  return (
    <Tooltip id={id}>
      <div>
        <strong>Display Name:</strong> {displayName}
        <br />
        <strong>Application ID:</strong> {appId}
        <br />
        <strong>Created Date:</strong> {createdDateTime}
        <br />
        <strong>Application Type:</strong> {applicationType}
        <br />
        <strong>Account Enabled:</strong> {accountEnabled ? 'Yes' : 'No'}
        <br />
        <strong>Visibility:</strong> {applicationVisibility}
        <br />
        <strong>Assignment Required:</strong> {assignmentRequired ? 'Yes' : 'No'}
         <br />
        <strong>Is App Proxy:</strong> {isAppProxy ? 'Yes' : 'No'}
      </div>
    </Tooltip>
  );
};

export default NodeTooltip;
```