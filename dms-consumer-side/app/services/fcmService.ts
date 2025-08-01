import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

class FCMService {
  async requestPermission() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('FCM Permission denied');
      return false;
    }
    
    console.log('FCM Permission granted');
    return true;
  }

  async getToken() {
    try {
      if (!Constants.expoConfig?.extra?.eas?.projectId) {
        console.log('No EAS project ID found, using local notifications only');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      });
      
      console.log('FCM Token:', token.data);
      await AsyncStorage.setItem('fcmToken', token.data);
      return token.data;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async sendTokenToBackend(userId: string, token: string) {
    try {
      const response = await fetch('https://dmsm-app-production-a35d.up.railway.app/api/users/register-fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fcmToken: token,
          platform: 'expo'
        }),
      });
      
      if (response.ok) {
        console.log('FCM token registered successfully');
        return true;
      } else {
        console.error('Failed to register FCM token');
        return false;
      }
    } catch (error) {
      console.error('Error registering FCM token:', error);
      return false;
    }
  }

  setupMessageHandlers() {
    // Handle notification received while app is running
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground notification received:', notification);
    });

    // Handle notification response (when user taps notification)
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
    });
  }
}

export const fcmService = new FCMService(); 