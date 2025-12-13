import React, { useState, useEffect } from 'react';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // in milliseconds
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50'; // Green
      case 'error':
        return '#F44336'; // Red
      case 'warning':
        return '#FF9800'; // Orange
      case 'info':
      default:
        return '#2196F3'; // Blue
    }
  };

  const styles: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '15px 25px',
    borderRadius: '5px',
    color: 'white',
    backgroundColor: getBackgroundColor(),
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '400px',
    wordBreak: 'break-word',
  };

  const closeButtonStyle: React.CSSProperties = {
    marginLeft: '15px',
    cursor: 'pointer',
    fontSize: '1.2em',
    fontWeight: 'bold',
    border: 'none',
    background: 'none',
    color: 'white',
  };

  const handleCloseClick = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div style={styles}>
      <span>{message}</span>
      <button onClick={handleCloseClick} style={closeButtonStyle} aria-label="Close notification">
        &times;
      </button>
    </div>
  );
};

export default Notification;