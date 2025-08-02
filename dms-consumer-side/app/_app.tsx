import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fcmService } from './services/fcmService';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

function AppContent() {
  // Set up notification handler immediately (synchronous)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  useEffect(() => {
    // Set up notification channels for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
      });
    }

    // Initialize FCM when app starts
    const initializeFCM = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          await fcmService.initialize(userId);
        }
      } catch (error) {
        console.error('[App] Error initializing FCM:', error);
      }
    };

    initializeFCM();
  }, []);

  return <StatusBar style="auto" />;
}

export default function App() {
  return <StatusBar style="auto" />;
} 