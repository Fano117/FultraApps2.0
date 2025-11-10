import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationApiService } from '../api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationData {
  [key: string]: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async registerForPushNotifications(choferId: string, deviceId: string): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id',
      });

      this.expoPushToken = token.data;

      await notificationApiService.subscribeToNotifications({
        choferId,
        expoNotificationToken: token.data,
        deviceId,
      });

      console.log('Push notifications registered:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async unregisterPushNotifications(deviceId: string): Promise<void> {
    try {
      await notificationApiService.unsubscribeFromNotifications(deviceId);
      this.expoPushToken = null;
      console.log('Push notifications unregistered');
    } catch (error) {
      console.error('Error unregistering push notifications:', error);
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    triggerSeconds: number = 0
  ): Promise<string> {
    try {
      const trigger = triggerSeconds > 0 ? { seconds: triggerSeconds } : null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async notifyDeliveryApproaching(clientName: string, distance: number): Promise<void> {
    await this.scheduleLocalNotification(
      'Llegando a destino',
      `Estás a ${Math.round(distance)}m de la entrega para ${clientName}`,
      { type: 'delivery_approaching' }
    );
  }

  async notifyDeliveryArrived(clientName: string): Promise<void> {
    await this.scheduleLocalNotification(
      'Has llegado',
      `Puedes confirmar la entrega para ${clientName}`,
      { type: 'delivery_arrived' }
    );
  }

  async notifyDeliveryCompleted(orderNumber: string): Promise<void> {
    await this.scheduleLocalNotification(
      'Entrega completada',
      `La entrega ${orderNumber} ha sido registrada exitosamente`,
      { type: 'delivery_completed' }
    );
  }

  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
