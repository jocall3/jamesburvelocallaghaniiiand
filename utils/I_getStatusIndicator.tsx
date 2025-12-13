import React from 'react';

interface StatusIndicatorProps {
  status: 'active' | 'inactive' | 'pending' | 'expired';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getStatusStyles = (currentStatus: string) => {
    switch (currentStatus) {
      case 'active':
        return {
          backgroundColor: '#4CAF50', // Green
          color: 'white',
          borderColor: '#388E3C',
        };
      case 'inactive':
        return {
          backgroundColor: '#f44336', // Red
          color: 'white',
          borderColor: '#D32F2F',
        };
      case 'pending':
        return {
          backgroundColor: '#FFC107', // Amber
          color: '#333',
          borderColor: '#FFA000',
        };
      case 'expired':
        return {
          backgroundColor: '#9E9E9E', // Grey
          color: 'white',
          borderColor: '#616161',
        };
      default:
        return {
          backgroundColor: '#E0E0E0', // Light Grey
          color: '#333',
          borderColor: '#BDBDBD',
        };
    }
  };

  const styles = getStatusStyles(status);

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.85em',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        border: '1px solid',
        ...styles,
      }}
    >
      {status}
    </span>
  );
};

export default StatusIndicator;