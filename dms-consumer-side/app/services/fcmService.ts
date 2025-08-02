import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

class FCMService {
  private fcmToken: string | null = null;
  private userId: string | null = null;

  // Initialize FCM service
  async initialize(userId: string): Promise<boolean> {
    try {
      console.log('[FCM] Initializing FCM service for user:', userId);
      this.userId = userId;

      // Request permission for notifications
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[FCM] Notification permission granted');
        
        // Get FCM token
        await this.getFCMToken();
        
        // Set up message handlers
        this.setupMessageHandlers();
        
        return true;
      } else {
        console.log('[FCM] Notification permission denied');
        Alert.alert('Permission Required', 'Please enable notifications to receive order updates.');
        return false;
      }
    } catch (error) {
      console.error('[FCM] Initialization error:', error);
      return false;
    }
  }

  // Get FCM token
  async getFCMToken(): Promise<string | null> {
    try {
      console.log('[FCM] Getting FCM token...');
      
      // Get the token
      const token = await messaging().getToken();
      
      if (token) {
        console.log('[FCM] FCM Token:', token);
        this.fcmToken = token;
        
        // Store token locally
        await AsyncStorage.setItem('fcmToken', token);
        
        // Register token with backend
        await this.registerTokenWithBackend(token);
        
        return token;
      } else {
        console.error('[FCM] Failed to get FCM token');
        return null;
      }
    } catch (error) {
      console.error('[FCM] Get token error:', error);
      return null;
    }
  }

  // Register FCM token with backend
  async registerTokenWithBackend(token: string): Promise<boolean> {
    try {
      if (!this.userId) {
        console.error('[FCM] No user ID available for token registration');
        return false;
      }

      console.log('[FCM] Registering token with backend...');
      
      const response = await axios.post(`${API_URL}/users/register-fcm-token`, {
        userId: this.userId,
        fcmToken: token
      });

      if (response.data.success) {
        console.log('[FCM] Token registered successfully with backend');
        return true;
      } else {
        console.error('[FCM] Failed to register token:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('[FCM] Token registration error:', error);
      return false;
    }
  }

  // Set up message handlers
  private setupMessageHandlers(): void {
    // Handle foreground messages
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('[FCM] Foreground message received:', remoteMessage);
      
      // Show alert for foreground messages
      Alert.alert(
        remoteMessage.notification?.title || 'New Message',
        remoteMessage.notification?.body || 'You have a new notification',
        [
          {
            text: 'OK',
            onPress: () => console.log('[FCM] Foreground message acknowledged')
          }
        ]
      );
    });

    // Handle background/quit state messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[FCM] Background message received:', remoteMessage);
      
      // You can handle background messages here
      // For now, we'll just log them
      return Promise.resolve();
    });

    // Handle notification open
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[FCM] App opened from notification:', remoteMessage);
      
      // Navigate to appropriate screen based on notification
      this.handleNotificationNavigation(remoteMessage);
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[FCM] App opened from quit state notification:', remoteMessage);
          this.handleNotificationNavigation(remoteMessage);
        }
      });

    // Store unsubscribe function for cleanup
    this.unsubscribeForeground = unsubscribeForeground;
  }

  // Handle notification navigation
  private handleNotificationNavigation(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    // You can add navigation logic here based on notification type
    const data = remoteMessage.data;
    
    if (data?.type === 'order_update') {
      // Navigate to order details
      console.log('[FCM] Navigating to order:', data.orderId);
      // You can use router here if needed
    }
  }

  // Test FCM notification
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

  // Get current FCM token
  getCurrentToken(): string | null {
    return this.fcmToken;
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.userId;
  }

  // Cleanup
  cleanup(): void {
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
    }
    this.fcmToken = null;
    this.userId = null;
  }

  private unsubscribeForeground?: () => void;
}

export const fcmService = new FCMService(); 