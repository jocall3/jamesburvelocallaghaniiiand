import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

/**
 * Service to handle Firebase Cloud Messaging (FCM) push notifications.
 * Encapsulates permission requests, token management, and message listeners.
 */
class PushNotificationHandler {
  private static instance: PushNotificationHandler;

  private constructor() {}

  /**
   * Returns the singleton instance of the PushNotificationHandler.
   */
  public static getInstance(): PushNotificationHandler {
    if (!PushNotificationHandler.instance) {
      PushNotificationHandler.instance = new PushNotificationHandler();
    }
    return PushNotificationHandler.instance;
  }

  /**
   * Requests permission from the user to receive push notifications.
   * Particularly required for iOS.
   */
  public async requestUserPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
      return enabled;
    } else if (Platform.OS === 'android') {
        // Android 13+ requires POST_NOTIFICATIONS permission which is handled 
        // by the underlying SDK or explicitly if targeting API 33+
        const authStatus = await messaging().hasPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
    }
    return true;
  }

  /**
   * Retrieves the current FCM token for the device.
   */
  public async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error fetching FCM token:', error);
      return null;
    }
  }

  /**
   * Subscribes to token refresh events.
   * @param callback Function called when the token refreshes.
   */
  public onTokenRefresh(callback: (token: string) => void): () => void {
    return messaging().onTokenRefresh(callback);
  }

  /**
   * Handler for messages received while the application is in the foreground.
   * @param callback Function to handle the remote message.
   */
  public onForegroundMessage(
    callback: (message: FirebaseMessagingTypes.RemoteMessage) => void
  ): () => void {
    return messaging().onMessage(async (remoteMessage) => {
      console.log('A new FCM message arrived in foreground!', remoteMessage);
      callback(remoteMessage);
    });
  }

  /**
   * Handler for when the application is opened from a background state by tapping a notification.
   * @param callback Function to handle the remote message.
   */
  public onNotificationOpenedApp(
    callback: (message: FirebaseMessagingTypes.RemoteMessage) => void
  ): () => void {
    return messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      callback(remoteMessage);
    });
  }

  /**
   * Checks if the application was opened from a quit state by a notification.
   * This should be called early in the app lifecycle (e.g., App.tsx mount).
   */
  public async getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
    try {
      const remoteMessage = await messaging().getInitialNotification();
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:', remoteMessage);
      }
      return remoteMessage;
    } catch (error) {
      console.error('Error getting initial notification:', error);
      return null;
    }
  }

  /**
   * Sets the handler for background messages.
   * Note: This handler must be a function that returns a Promise and should be registered
   * early in the application lifecycle (e.g., index.js), outside of the React component tree.
   * @param handler Async function to handle the background message.
   */
  public setBackgroundMessageHandler(
    handler: (message: FirebaseMessagingTypes.RemoteMessage) => Promise<void>
  ): void {
    messaging().setBackgroundMessageHandler(handler);
  }

  /**
   * Subscribes the device to a specific topic.
   * @param topic The topic name.
   */
  public async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  /**
   * Unsubscribes the device from a specific topic.
   * @param topic The topic name.
   */
  public async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }
}

export default PushNotificationHandler.getInstance();