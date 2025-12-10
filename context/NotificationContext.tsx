import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from 'react';

// --- 1. Define Notification Type ---
export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // in milliseconds, defaults to 5000ms
}

// --- 2. Define Context State ---
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type?: Notification['type'], duration?: number) => void;
  removeNotification: (id: string) => void;
}

// --- 3. Create Context ---
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// --- 4. Create Provider Component ---
interface NotificationProviderProps {
  children: ReactNode;
}

const DEFAULT_NOTIFICATION_DURATION = 5000; // 5 seconds

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeNotification = useCallback((id: string) => {
    setNotifications((prevNotifications) => prevNotifications.filter((n) => n.id !== id));
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const addNotification = useCallback(
    (message: string, type: Notification['type'] = 'info', duration?: number) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const newNotification: Notification = {
        id,
        message,
        type,
        duration: duration ?? DEFAULT_NOTIFICATION_DURATION,
      };

      setNotifications((prevNotifications) => [...prevNotifications, newNotification]);

      if (newNotification.duration && newNotification.duration > 0) {
        const timeout = setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
        timeoutRefs.current.set(id, timeout);
      }
    },
    [removeNotification]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    };
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

// --- 5. Create a Custom Hook ---
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};