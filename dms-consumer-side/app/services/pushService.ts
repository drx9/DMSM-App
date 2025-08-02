import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// DISABLED: Notification handler moved to _app.tsx to prevent conflicts
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

export interface NotificationData {
  type: 'order_status' | 'promotional' | 'delivery' | 'general';
  orderId?: string;
  title: string;
  body: string;
  data?: any;
}

class PushNotificationService {
  private expoPushToken: string | null = null;

  async initialize() {
    try {
      // Request permissions
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

      // Get Expo push token (only if we have a valid project ID)
      if (Device.isDevice && Constants.expoConfig?.extra?.eas?.projectId) {
        try {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig.extra.eas.projectId,
          });
          this.expoPushToken = token.data;
          console.log('Expo Push Token:', this.expoPushToken);
        } catch (tokenError) {
          console.log('Could not get Expo push token, using local notifications only:', tokenError);
          // Continue without push token - local notifications will still work
        }
      } else {
        console.log('Using local notifications only (no device or project ID)');
      }

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  private async setupAndroidChannels() {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('order-updates', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#F59E0B',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('delivery', {
      name: 'Delivery Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250, 250],
      lightColor: '#3B82F6',
      sound: 'default',
    });
  }

  private setupNotificationListeners() {
    // DISABLED: Using FCM for notifications instead
    console.log('[PushService] Notification listeners disabled - using FCM instead');
    return () => {};
  }

  private handleNotificationReceived(notification: Notifications.Notification) {
    const { title, body, data } = notification.request.content;
    console.log('Notification received:', { title, body, data });

    // Handle different notification types
    switch (data?.type) {
      case 'order_status':
        this.handleOrderStatusNotification(data);
        break;
      case 'promotional':
        this.handlePromotionalNotification(data);
        break;
      case 'delivery':
        this.handleDeliveryNotification(data);
        break;
      default:
        console.log('General notification received');
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'order_status':
        // Navigate to order details
        this.navigateToOrder(data.orderId as string);
        break;
      case 'promotional':
        // Navigate to product or category
        this.navigateToPromotion(data);
        break;
      case 'delivery':
        // Navigate to order tracking
        this.navigateToOrder(data.orderId as string);
        break;
    }
  }

  private handleOrderStatusNotification(data: any) {
    // Update local order status if needed
    console.log('Order status update:', data);
  }

  private handlePromotionalNotification(data: any) {
    // Handle promotional notification
    console.log('Promotional notification:', data);
  }

  private handleDeliveryNotification(data: any) {
    // Handle delivery notification
    console.log('Delivery notification:', data);
  }

  private navigateToOrder(orderId: string) {
    // Import and use router to navigate
    // This will be implemented in the component that uses this service
    console.log('Navigate to order:', orderId);
  }

  private navigateToPromotion(data: any) {
    // Navigate to promotion
    console.log('Navigate to promotion:', data);
  }

  async registerForPushNotifications(userId: string): Promise<boolean> {
    try {
      const isInitialized = await this.initialize();
      if (!isInitialized) {
        console.log('Push notification initialization failed, but continuing with local notifications');
        return true; // Return true to allow local notifications to work
      }

      // Only send token to backend if we have a valid token
      if (this.expoPushToken) {
        // Store tokens locally
        await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
        
        // Send tokens to backend
        await this.sendTokenToBackend(userId, this.expoPushToken);
      } else {
        console.log('No Expo push token available, using local notifications only');
      }
      
      return true;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return true; // Return true to allow local notifications to work
    }
  }

  async sendTokenToBackend(userId: string, token: string) {
    try {
      // Validate inputs
      if (!userId || !token || token.trim() === '') {
        console.log('Skipping token registration: missing userId or token');
        return false;
      }

      console.log('Sending token to backend:', { userId, token, platform: Platform.OS });
      const response = await axios.post(`${API_URL}/users/register-expo-push-token`, {
        userId,
        expoPushToken: token,
        platform: Platform.OS,
        deviceId: Device.osInternalBuildId || 'unknown'
      });
      console.log('Push token registered with backend:', response.data);
      return true;
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      return false;
    }
  }

  async scheduleLocalNotification(notification: NotificationData) {
    // DISABLED: Using FCM for notifications instead
    console.log('[PushService] Local notification disabled - using FCM instead');
    return;
  }

  private getChannelId(type: string): string {
    switch (type) {
      case 'order_status':
        return 'order-updates';
      case 'promotional':
        return 'promotions';
      case 'delivery':
        return 'delivery';
      default:
        return 'default';
    }
  }

  async sendOrderStatusNotification(orderId: string, status: string, userId: string) {
    const notification: NotificationData = {
      type: 'order_status',
      orderId,
      title: 'Order Update',
      body: `Your order #${orderId} status has been updated to: ${status}`,
      data: {
        type: 'order_status',
        orderId,
        status,
        userId
      }
    };

    await this.scheduleLocalNotification(notification);
  }

  async sendPromotionalNotification(title: string, body: string, data?: any) {
    const notification: NotificationData = {
      type: 'promotional',
      title,
      body,
      data: {
        type: 'promotional',
        ...data
      }
    };

    await this.scheduleLocalNotification(notification);
  }

  async sendDeliveryNotification(orderId: string, message: string, userId: string) {
    const notification: NotificationData = {
      type: 'delivery',
      orderId,
      title: 'Delivery Update',
      body: message,
      data: {
        type: 'delivery',
        orderId,
        userId
      }
    };

    await this.scheduleLocalNotification(notification);
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  }

  async getNotificationPermissions(): Promise<Notifications.PermissionStatus> {
    const result = await Notifications.getPermissionsAsync();
    return result.status;
  }

  async requestNotificationPermissions(): Promise<Notifications.PermissionStatus> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  }

  // Method to send test notification
  async sendTestNotification() {
    // DISABLED: Using FCM for notifications instead
    console.log('[PushService] Test notification disabled - using FCM instead');
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export individual functions for backward compatibility
export async function registerForPushNotificationsAsync(userId: string) {
  return await pushNotificationService.registerForPushNotifications(userId);
}

export async function sendTokenToBackend(userId: string, token: string) {
  return await pushNotificationService.sendTokenToBackend(userId, token);
} 