import React from 'react';

interface StatusBadgeProps {
    accountEnabled: boolean | null;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ accountEnabled }) => {
    let statusText = 'Unknown';
    let badgeColor = 'gray';

    if (accountEnabled === true) {
        statusText = 'Enabled';
        badgeColor = 'green';
    } else if (accountEnabled === false) {
        statusText = 'Disabled';
        badgeColor = 'red';
    }

    const badgeStyle: React.CSSProperties = {
        backgroundColor: badgeColor,
        color: 'white',
        padding: '0.2em 0.6em',
        borderRadius: '0.25rem',
        fontSize: '0.75em',
        fontWeight: 'bold',
        display: 'inline-block',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        verticalAlign: 'baseline',
    };

    return (
        <span style={badgeStyle}>
            {statusText}
        </span>
    );
};

export default StatusBadge;