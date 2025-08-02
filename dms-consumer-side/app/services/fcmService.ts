import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

class FCMService {
  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[FCM] Permission granted');
        return true;
      } else {
        console.log('[FCM] Permission denied');
        return false;
      }
    } catch (error) {
      console.error('[FCM] Permission request error:', error);
      return false;
    }
  }

  async getToken() {
    try {
      console.log('[FCM] Setting up FCM...');
      
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        console.log('[FCM] Permission not granted, cannot get token');
        return null;
      }

      const token = await messaging().getToken();
      console.log('[FCM] Token:', token);
      
      await AsyncStorage.setItem('fcmToken', token);
      return token;
    } catch (error) {
      console.error('[FCM] Error getting token:', error);
      return null;
    }
  }

  async sendTokenToBackend(userId: string, token: string) {
    try {
      console.log('[FCM] Attempting to register token for user:', userId);
      console.log('[FCM] Token length:', token.length);
      
      const response = await fetch('https://dmsm-app-production-a35d.up.railway.app/api/users/register-fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fcmToken: token,
          platform: 'firebase'
        }),
      });
      
      console.log('[FCM] Response status:', response.status);
      const responseText = await response.text();
      console.log('[FCM] Response body:', responseText);
      
      if (response.ok) {
        console.log('[FCM] Token registered successfully');
        return true;
      } else {
        console.error('[FCM] Failed to register token. Status:', response.status, 'Response:', responseText);
        return false;
      }
    } catch (error) {
      console.error('[FCM] Error registering token:', error);
      return false;
    }
  }

  setupMessageHandlers() {
    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('[FCM] Foreground message received:', remoteMessage);
      
      // Show local notification for foreground messages
      const title = remoteMessage.notification?.title || 'New Message';
      const body = remoteMessage.notification?.body || 'You have a new notification';
      
      Alert.alert(title, body, [
        { text: 'OK', onPress: () => console.log('[FCM] Foreground notification dismissed') }
      ]);
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('[FCM] Background message received:', remoteMessage);
      // Background messages are handled automatically by the system
    });

    // Handle notification open
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('[FCM] Notification opened app:', remoteMessage);
      // Handle navigation or other actions when notification is tapped
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('[FCM] App opened from notification:', remoteMessage);
          // Handle initial notification
        }
      });

    return unsubscribe;
  }
}

export const fcmService = new FCMService(); 