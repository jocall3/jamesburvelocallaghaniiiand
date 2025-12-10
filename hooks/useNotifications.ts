import { create } from 'zustand';

/**
 * Defines the possible types for a notification.
 */
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Represents a single notification object.
 */
export interface Notification {
  /** A unique identifier for the notification. */
  id: string;
  /** The message content of the notification. */
  message: string;
  /** The type of the notification, affecting its appearance and icon. */
  type: NotificationType;
  /** Optional duration in milliseconds after which the notification will auto-dismiss. */
  duration?: number;
}

/**
 * The shape of the notification state managed by Zustand.
 */
interface NotificationState {
  /** An array of all active notifications. */
  notifications: Notification[];
  /**
   * Adds a new notification to the store.
   * @param notification - The notification to add, without the 'id' property.
   * @returns The ID of the newly created notification.
   */
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  /**
   * Removes a notification from the store by its ID.
   * @param id - The unique identifier of the notification to remove.
   */
  removeNotification: (id: string) => void;
  /**
   * Removes all notifications from the store.
   */
  clearNotifications: () => void;
}

/**
 * Default duration for notifications in milliseconds.
 */
const DEFAULT_DURATION = 5000;

/**
 * A Zustand store for managing global notifications.
 * This is the core state management logic.
 */
const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = `${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}`;
    const newNotification: Notification = { ...notification, id };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    const duration = notification.duration ?? DEFAULT_DURATION;
    if (duration > 0) { // A duration of 0 or less means it won't auto-dismiss
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
    
    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));

/**
 * A custom React hook to access and manage application-wide notifications.
 *
 * @example
 * ```tsx
 * // In a component that displays notifications:
 * const { notifications, removeNotification } = useNotifications();
 * return (
 *   <div>
 *     {notifications.map(n => (
 *       <NotificationComponent key={n.id} notification={n} onDismiss={() => removeNotification(n.id)} />
 *     ))}
 *   </div>
 * );
 *
 * // In a component that triggers a notification:
 * const { addNotification } = useNotifications();
 * const handleClick = () => {
 *   addNotification({ message: 'Profile updated successfully!', type: 'success' });
 * };
 * ```
 */
export const useNotifications = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useNotificationStore();
  return { notifications, addNotification, removeNotification, clearNotifications };
};

/**
 * A utility object for dispatching notifications from anywhere in the application,
 * including outside of React components (e.g., in API service files).
 *
 * @example
 * ```ts
 * // In an API service file:
 * import { notify } from '@/hooks/useNotifications';
 *
 * export async function updateUser(data) {
 *   try {
 *     const response = await api.put('/user', data);
 *     notify.success('User updated successfully!');
 *     return response.data;
 *   } catch (error) {
 *     notify.error('Failed to update user.');
 *     throw error;
 *   }
 * }
 * ```
 */
export const notify = {
  success: (message: string, duration: number = 5000) =>
    useNotificationStore.getState().addNotification({ message, type: 'success', duration }),
  error: (message: string, duration: number = 7000) =>
    useNotificationStore.getState().addNotification({ message, type: 'error', duration }),
  info: (message: string, duration: number = 5000) =>
    useNotificationStore.getState().addNotification({ message, type: 'info', duration }),
  warning: (message: string, duration: number = 6000) =>
    useNotificationStore.getState().addNotification({ message, type: 'warning', duration }),
  /**
   * A generic method to add a notification.
   * @param notification - The notification object (without id).
   */
  add: (notification: Omit<Notification, 'id'>) =>
    useNotificationStore.getState().addNotification(notification),
};