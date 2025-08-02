import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fcmService } from './services/fcmService';

export default function App() {
  useEffect(() => {
    // Auto-refresh FCM token when app starts
    const refreshFCMToken = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          console.log('[App] Auto-refreshing FCM token for user:', userId);
          
          // Initialize FCM service
          await fcmService.initialize(userId);
          
          // Force refresh token to ensure it's current
          const refreshed = await fcmService.refreshToken();
          if (refreshed) {
            console.log('[App] FCM token refreshed successfully');
          } else {
            console.log('[App] FCM token refresh failed, will retry on next login');
          }
        }
      } catch (error) {
        console.error('[App] Error refreshing FCM token:', error);
      }
    };

    refreshFCMToken();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <NotificationProvider>
          <CartProvider>
            <StatusBar style="auto" />
          </CartProvider>
        </NotificationProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
} 