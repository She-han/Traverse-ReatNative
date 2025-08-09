import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { AppNotification, NotificationType } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  // Request permissions for notifications
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  }

  // Get push token
  static async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual project ID
      });
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Schedule a local notification
  static async scheduleNotification(
    title: string,
    body: string,
    trigger: Date | { seconds: number },
    data?: any
  ): Promise<string> {
    let notificationTrigger: Notifications.NotificationTriggerInput;
    
    if (trigger instanceof Date) {
      notificationTrigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      };
    } else {
      notificationTrigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: trigger.seconds,
      };
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: notificationTrigger,
    });

    return notificationId;
  }

  // Cancel a scheduled notification
  static async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all scheduled notifications
  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Show immediate notification
  static async showNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  // Bus arrival notification
  static async scheduleBusArrivalNotification(
    routeName: string,
    stopName: string,
    minutesUntilArrival: number,
    busId: string
  ): Promise<string> {
    const triggerTime = new Date(Date.now() + (minutesUntilArrival - 2) * 60 * 1000); // 2 minutes before
    
    return this.scheduleNotification(
      `Bus Arriving Soon! 🚌`,
      `${routeName} will arrive at ${stopName} in ~2 minutes`,
      triggerTime,
      {
        type: 'bus_arrival',
        busId,
        routeName,
        stopName,
      }
    );
  }

  // Bus delay notification
  static async showBusDelayNotification(
    routeName: string,
    stopName: string,
    delayMinutes: number
  ): Promise<void> {
    await this.showNotification(
      `Bus Delayed ⏰`,
      `${routeName} at ${stopName} is delayed by ${delayMinutes} minutes`,
      {
        type: 'bus_delay',
        routeName,
        stopName,
        delayMinutes,
      }
    );
  }

  // Route update notification
  static async showRouteUpdateNotification(
    routeName: string,
    updateMessage: string
  ): Promise<void> {
    await this.showNotification(
      `Route Update 📢`,
      `${routeName}: ${updateMessage}`,
      {
        type: 'route_update',
        routeName,
        updateMessage,
      }
    );
  }

  // Achievement notification
  static async showAchievementNotification(
    achievementName: string,
    points: number
  ): Promise<void> {
    await this.showNotification(
      `Achievement Unlocked! 🏆`,
      `You earned "${achievementName}" (+${points} points)`,
      {
        type: 'achievement',
        achievementName,
        points,
      }
    );
  }

  // Listen for notification responses
  static addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Listen for received notifications (when app is in foreground)
  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(listener);
  }
}

export default NotificationService;
