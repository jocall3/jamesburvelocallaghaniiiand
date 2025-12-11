import React from 'react';

const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => {
  const spinAnimation = `
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;

  const spinnerStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '40px',
    height: '40px',
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '50%',
    borderTopColor: '#333',
    animation: 'spin 1s linear infinite',
  };

  const visuallyHiddenStyle: React.CSSProperties = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  };

  return (
    <>
      <style>{spinAnimation}</style>
      <div role="status" style={spinnerStyle} className={className}>
        <span style={visuallyHiddenStyle}>Loading...</span>
      </div>
    </>
  );
};

export default LoadingSpinner;