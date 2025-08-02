import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import * as Notifications from 'expo-notifications';

class FCMService {
  private fcmToken: string | null = null;
  private userId: string | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private isInitialized = false;
  private messageHandlerCount = 0;
  private lastMessageId: string | null = null;
  private unsubscribeForeground: (() => void) | null = null;

  async initialize(userId: string): Promise<boolean> {
    try {
      // Prevent multiple initializations
      if (this.isInitialized) {
        return true;
      }
      
      console.log('[FCM] Initializing FCM for user:', userId);
      this.userId = userId;

      // Request permission
      const authStatus = await messaging().requestPermission();
      console.log('[FCM] Permission status:', authStatus);
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('[FCM] Permission not granted');
        return false;
      }
      console.log('[FCM] Permission granted');

      // Get FCM token with retry logic
      const token = await this.getFCMTokenWithRetry();
      if (!token) {
        console.log('[FCM] Failed to get FCM token after retries');
        return false;
      }

      // Register token with backend with retry logic
      const registered = await this.registerTokenWithRetry(token);
      if (!registered) {
        console.log('[FCM] Failed to register token with backend after retries');
        // Don't return false here - continue with message handlers
      }

      // Setup message handlers
      this.setupMessageHandlers();

      this.isInitialized = true;
      console.log('[FCM] FCM initialized successfully');
      return true;
    } catch (error) {
      console.error('[FCM] Initialization error:', error);
      return false;
    }
  }

  async getFCMTokenWithRetry(): Promise<string | null> {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const token = await messaging().getToken();
        if (token) {
          this.fcmToken = token;
          console.log('[FCM] FCM token obtained:', token.substring(0, 20) + '...');
          return token;
        }
      } catch (error) {
        console.error(`[FCM] Attempt ${i + 1} failed to get token:`, error);
        if (i === this.maxRetries - 1) {
          console.error('[FCM] All attempts to get FCM token failed');
          return null;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return null;
  }

  async registerTokenWithRetry(token: string): Promise<boolean> {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const success = await this.registerTokenWithBackend(token);
        if (success) {
          console.log('[FCM] Token registered successfully on attempt', i + 1);
          return true;
        }
      } catch (error) {
        console.error(`[FCM] Attempt ${i + 1} failed to register token:`, error);
        if (i === this.maxRetries - 1) {
          console.error('[FCM] All attempts to register token failed');
          return false;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return false;
  }

  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      console.log('[FCM] FCM token obtained:', token ? token.substring(0, 20) + '...' : 'null');
      return token;
    } catch (error) {
      console.error('[FCM] Error getting FCM token:', error);
      return null;
    }
  }

  async registerTokenWithBackend(token: string): Promise<boolean> {
    try {
      if (!this.userId) {
        console.error('[FCM] No user ID available for token registration');
        return false;
      }

      console.log('[FCM] Registering FCM token with backend for user:', this.userId);
      
      const response = await axios.post(`${API_URL}/users/register-fcm-token`, {
        userId: this.userId,
        fcmToken: token,
        platform: 'android'
      });

      if (response.data.success) {
        console.log('[FCM] FCM token registered successfully with backend');
        return true;
      } else {
        console.error('[FCM] Backend registration failed:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('[FCM] Error registering token with backend:', error);
      return false;
    }
  }

  setupMessageHandlers(): void {
    // Unsubscribe from previous foreground handler if exists
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
    }

    // Foreground message handler - ENABLED to show notifications when app is in foreground
    this.unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      this.messageHandlerCount++;

      // Prevent duplicate notifications by checking message ID
      if (this.lastMessageId === remoteMessage.messageId) {
        return;
      }
      this.lastMessageId = remoteMessage.messageId || null;

      // Show notification banner using Expo Notifications
      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification?.title || 'Notification',
            body: remoteMessage.notification?.body || 'You have a new notification',
            data: remoteMessage.data || {},
          },
          trigger: null, // Show immediately
        });
      } catch (error) {
        console.error('[FCM] Error scheduling notification:', error);
        // Fallback: try to show alert
        Alert.alert(
          remoteMessage.notification?.title || 'Notification',
          remoteMessage.notification?.body || 'You have a new notification'
        );
      }
    });

    // Background message handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('[FCM] Background message received:', remoteMessage);
    });

    // App opened from notification
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('[FCM] App opened from notification:', remoteMessage);
    });

    // Check if app was opened from notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('[FCM] App opened from quit state:', remoteMessage);
        }
      });
  }

  // Test FCM notification (for debugging)
  static async testNotification(userId: string) {
    try {
      if (!userId) {
        throw new Error('User ID is required for test notification');
      }

      const response = await axios.post(`${API_URL}/users/${userId}/test-fcm`, {
        title: 'Test Notification',
        body: 'This is a test notification from FCM',
        data: { type: 'test', timestamp: Date.now() }
      });

      if (response.data.success) {
        Alert.alert('Success', 'Test notification sent successfully');
      } else {
        throw new Error(response.data.message || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('FCM test notification error:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  }

  // Force refresh token and re-register
  async refreshToken(): Promise<boolean> {
    try {
      console.log('[FCM] Refreshing FCM token...');
      
      // Delete current token
      await messaging().deleteToken();
      
      // Get new token
      const newToken = await this.getFCMToken();
      if (!newToken) {
        return false;
      }

      // Re-register with backend
      return await this.registerTokenWithBackend(newToken);
    } catch (error) {
      console.error('[FCM] Error refreshing token:', error);
      return false;
    }
  }

  // Get current token
  getCurrentToken(): string | null {
    return this.fcmToken;
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.userId;
  }



  // Force re-register token (useful for debugging)
  async forceReRegister(): Promise<boolean> {
    if (!this.fcmToken || !this.userId) {
      console.error('[FCM] No token or user ID available for re-registration');
      return false;
    }
    
    console.log('[FCM] Force re-registering FCM token...');
    return await this.registerTokenWithBackend(this.fcmToken);
  }





  // Reset duplicate prevention
  resetDuplicatePrevention(): void {
    this.lastMessageId = null;
    this.messageHandlerCount = 0;
  }

  // Cleanup method to unsubscribe from handlers
  cleanup(): void {
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
      this.unsubscribeForeground = null;
    }
    this.isInitialized = false;
  }
}

export const fcmService = new FCMService();
export default fcmService; 