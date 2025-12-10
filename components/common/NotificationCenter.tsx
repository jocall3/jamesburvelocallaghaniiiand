import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// --- 1. Interfaces and Types ---

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'default';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number; // in milliseconds, 0 for sticky
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}

// --- 2. Notification Context ---

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// --- 3. Custom Hook for Notification Management ---

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// --- 4. Notification Provider Component ---

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationIdCounter = useRef(0); // Simple counter for unique IDs

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newId = `notification-${notificationIdCounter.current++}`;
    const newNotification: Notification = {
      ...notification,
      id: newId,
      timestamp: new Date(),
      duration: notification.duration ?? 5000, // Default duration 5 seconds
    };
    setNotifications((prev) => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const contextValue = {
    notifications,
    addNotification,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// --- 5. Individual Notification Toast Component ---

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const { id, type, title, message, duration } = notification;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (duration && duration > 0) {
      timerRef.current = setTimeout(() => {
        onClose(id);
      }, duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [id, duration, onClose]);

  const getColors = (notificationType: NotificationType) => {
    switch (notificationType) {
      case 'success':
        return 'bg-green-600/80 border-green-700';
      case 'error':
        return 'bg-red-600/80 border-red-700';
      case 'warning':
        return 'bg-yellow-600/80 border-yellow-700';
      case 'info':
        return 'bg-blue-600/80 border-blue-700';
      case 'default':
      default:
        return 'bg-gray-700/80 border-gray-800';
    }
  };

  const typeColors = getColors(type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`relative p-4 rounded-lg shadow-lg flex items-start gap-3 text-white backdrop-blur-sm border ${typeColors} pointer-events-auto`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex-grow">
        {title && <h3 className="font-semibold text-lg mb-1">{title}</h3>}
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="absolute top-2 right-2 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        aria-label="Close notification"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

// --- 6. Main Notification Center Component ---

export const NotificationCenter: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-[9999] w-full max-w-sm space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- Example Usage (for demonstration, typically in App.tsx or layout) ---
/*
import React from 'react';
import { NotificationProvider, NotificationCenter, useNotification } from './components/common/NotificationCenter';

const MyComponent = () => {
  const { addNotification } = useNotification();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">App Content</h1>
      <button
        onClick={() => addNotification({ type: 'success', title: 'Success!', message: 'Your operation was successful.', duration: 3000 })}
        className="bg-green-500 text-white px-4 py-2 rounded mr-2"
      >
        Show Success
      </button>
      <button
        onClick={() => addNotification({ type: 'error', title: 'Error!', message: 'Something went wrong. Please try again.', duration: 0 })}
        className="bg-red-500 text-white px-4 py-2 rounded mr-2"
      >
        Show Error (Sticky)
      </button>
      <button
        onClick={() => addNotification({ type: 'info', message: 'Here is some information for you.' })}
        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
      >
        Show Info
      </button>
      <button
        onClick={() => addNotification({ type: 'warning', title: 'Warning!', message: 'This action might have consequences.', duration: 7000 })}
        className="bg-yellow-500 text-white px-4 py-2 rounded"
      >
        Show Warning
      </button>
    </div>
  );
};

function App() {
  return (
    <NotificationProvider>
      <MyComponent />
      <NotificationCenter />
    </NotificationProvider>
  );
}

export default App;
*/