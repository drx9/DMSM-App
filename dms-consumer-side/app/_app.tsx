import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { fcmService } from './services/fcmService';
import * as Notifications from 'expo-notifications';

export default function App() {
  useEffect(() => {
    // Set up notification handler for banner notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false, // Don't show popup alerts
        shouldShowBanner: true, // Show as banner at top
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Auto-refresh FCM token when app starts
    const refreshFCMToken = async () => {
      try {
        // FCM will be initialized when user logs in or when profile screen loads
        // This prevents Firebase initialization errors on app startup
        console.log('[App] FCM will be initialized when user is authenticated');
      } catch (error) {
        console.error('[App] Error in FCM setup:', error);
      }
    };

    refreshFCMToken();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <CartProvider>
              <StatusBar style="auto" />
            </CartProvider>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
} 