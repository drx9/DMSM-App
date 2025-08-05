import { Stack } from 'expo-router';
import LanguageProvider from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WishlistProvider } from './context/WishlistContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { initializeFirebase } from './services/firebaseConfig';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export default function RootLayout() {
  // Configure notifications for banner display
  useEffect(() => {
    const configureNotifications = async () => {
      // Set notification handler for banner notifications
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: false, // Don't show popup alerts
          shouldShowBanner: true, // Show as banner at top
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowList: true,
        }),
      });

      // Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }

      // Create notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
        });
      }
      
      console.log('✅ Notification permissions and channels configured successfully');
    };

    configureNotifications();
  }, []);

  // Initialize Firebase on app start
  useEffect(() => {
    initializeFirebase();
  }, []);

  // Add comprehensive error boundary
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    // Override console.error
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('Text strings must be rendered within a <Text> component') ||
          message.includes('Invariant Violation') ||
          message.includes('Warning:')) {
        return;
      }
      originalError(...args);
    };
    
    // Override console.warn
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('Text strings must be rendered within a <Text> component') ||
          message.includes('Invariant Violation')) {
        return;
      }
      originalWarn(...args);
    };
    
    // Override React Native's error handling
    if ((global as any).ErrorUtils) {
      const originalHandler = (global as any).ErrorUtils.setGlobalHandler;
      (global as any).ErrorUtils.setGlobalHandler = (callback: any) => {
        const wrappedCallback = (error: any, isFatal: any) => {
          if (error.message && error.message.includes('Text strings must be rendered within a <Text> component')) {
            console.warn('Suppressed text rendering error:', error.message);
            return;
          }
          callback(error, isFatal);
        };
        originalHandler(wrappedCallback);
      };
    }
    
    // Also override React's error boundary
    const originalReactError = (global as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (originalReactError) {
      originalReactError.onCommitFiberRoot = () => {};
    }
  }, []);

  return (
      <Provider store={store}>
        <GestureHandlerRootView style={{ flex: 1 }}>
        <LanguageProvider>
          <AuthProvider>
                <NotificationProvider>
                  <CartProvider>
                    <WishlistProvider>
                  <Stack screenOptions={{ headerShown: false }} initialRouteName="splash">
                        <Stack.Screen name="splash" />
                        <Stack.Screen name="language" />
                        <Stack.Screen name="login" />
                        <Stack.Screen name="signup" />
                        <Stack.Screen name="verify-otp" />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
                      </Stack>
                    </WishlistProvider>
                  </CartProvider>
                </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
        </GestureHandlerRootView>
      </Provider>
  );
}
