import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';

class FCMService {
  private fcmToken: string | null = null;
  private userId: string | null = null;
  private retryCount = 0;
  private maxRetries = 3;

  async initialize(userId: string): Promise<boolean> {
    try {
      console.log('[FCM] Initializing FCM for user:', userId);
      this.userId = userId;

      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('[FCM] Permission not granted');
        return false;
      }

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
    // Foreground message handler
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('[FCM] Foreground message received:', remoteMessage);
      
      // Show local notification
      Alert.alert(
        remoteMessage.notification?.title || 'New Message',
        remoteMessage.notification?.body || 'You have a new notification'
      );
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

  async testFCMNotification(): Promise<boolean> {
    try {
      if (!this.userId || !this.fcmToken) {
        console.error('[FCM] User ID or FCM token not available');
        return false;
      }
      console.log('[FCM] Testing FCM notification...');
      const response = await axios.post(`${API_URL}/users/test-fcm-notification`, {
        userId: this.userId,
        title: 'FCM Test Notification',
        message: 'This is a test FCM notification from your app!'
      });
      if (response.data.success) {
        console.log('[FCM] Test notification sent successfully');
        Alert.alert('Success', 'Test notification sent! Check your device.');
        return true;
      } else {
        console.error('[FCM] Test notification failed:', response.data.message);
        Alert.alert('Error', 'Failed to send test notification');
        return false;
      }
    } catch (error) {
      console.error('[FCM] Test notification error:', error);
      Alert.alert('Error', 'Failed to send test notification');
      return false;
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
}

export const fcmService = new FCMService();
export default fcmService; 