import { apiService } from '@/shared/services';
import { ApiResponse } from '../types';

interface NotificationSubscription {
  choferId: string;
  expoNotificationToken: string;
  deviceId: string;
}

class NotificationApiService {
  async subscribeToNotifications(
    subscription: NotificationSubscription
  ): Promise<ApiResponse<null>> {
    try {
      return await apiService.post<ApiResponse<null>>(
        '/mobile/notifications/subscribe',
        subscription
      );
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    }
  }

  async unsubscribeFromNotifications(deviceId: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.post<ApiResponse<null>>('/mobile/notifications/unsubscribe', {
        deviceId,
      });
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      throw error;
    }
  }
}

export const notificationApiService = new NotificationApiService();
