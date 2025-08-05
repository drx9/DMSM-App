import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { fcmService } from '../services/fcmService';
import * as Notifications from 'expo-notifications';

interface NotificationContextType {
  isInitialized: boolean;
  hasPermission: boolean;
  badgeCount: number;
  initializeNotifications: (userId: string) => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
  testOrderNotification: () => Promise<void>;
  clearBadge: () => Promise<void>;
  sendOrderNotification: (orderId: string, status: string, userId: string) => Promise<void>;
  sendPromotionalNotification: (title: string, body: string, data?: any) => Promise<void>;
  sendDeliveryNotification: (orderId: string, message: string, userId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const router = useRouter();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    checkInitialPermission();
    setupNotificationListeners();
    
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const checkInitialPermission = async () => {
    try {
      // FCM permissions are handled by the FCM service
      setHasPermission(true);
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Listen for notification received while app is running
    // The setupNotificationListeners method is private, so we'll handle it differently
    // The push service already sets up listeners in its initialize method
  };

  const initializeNotifications = async (userId: string): Promise<boolean> => {
    try {
      // FCM is already initialized in _app.tsx, just mark as initialized
      setIsInitialized(true);
      setHasPermission(true);
      await updateBadgeCount();
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      // FCM permissions are handled by the FCM service
      setHasPermission(true);
      Alert.alert(
        'Notifications Enabled',
        'You will now receive notifications for order updates and promotions!'
      );
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const updateBadgeCount = async () => {
    try {
      // FCM doesn't have badge count functionality, set to 0
      setBadgeCount(0);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  };

  const clearBadge = async () => {
    try {
      // FCM doesn't have badge count functionality
      setBadgeCount(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      console.log('📱 Testing local banner notification...');
      
      // Test local banner notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Banner Notification',
          body: 'This should appear as a banner at the top!',
          data: { type: 'test' },
          sound: true,
          priority: 'high',
        },
        trigger: null, // Show immediately
      });
      
      console.log('✅ Local banner notification sent successfully');
      Alert.alert('Success', 'Test banner notification sent! Check for banner at the top of screen.');
      
      // Also test FCM notification
      await fcmService.testFCMNotification();
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  // Add a simple test function for order notifications
  const testOrderNotification = async () => {
    try {
      console.log('📱 Testing order notification...');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Order Placed',
          body: 'Your order #12345 has been placed successfully!',
          data: { 
            type: 'order', 
            orderId: '12345', 
            status: 'placed' 
          },
          sound: true,
          priority: 'high',
        },
        trigger: null, // Show immediately
      });
      
      console.log('✅ Order notification test sent successfully');
      Alert.alert('Success', 'Order notification test sent!');
    } catch (error) {
      console.error('Error sending order notification test:', error);
      Alert.alert('Error', 'Failed to send order notification test');
    }
  };

  const sendOrderNotification = async (orderId: string, status: string, userId: string) => {
    try {
      console.log('📱 Sending order notification:', orderId, status);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Order ${status}`,
          body: `Your order #${orderId} has been ${status.toLowerCase()}`,
          data: { 
            type: 'order', 
            orderId, 
            status,
            userId 
          },
          sound: true,
          priority: 'high',
        },
        trigger: null, // Show immediately
      });
      
      console.log('✅ Order notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending order notification:', error);
    }
  };

  const sendPromotionalNotification = async (title: string, body: string, data?: any) => {
    try {
      console.log('📱 Sending promotional notification:', title);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            type: 'promotional',
            ...data 
          },
          sound: true,
          priority: 'default',
        },
        trigger: null, // Show immediately
      });
      
      console.log('✅ Promotional notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending promotional notification:', error);
    }
  };

  const sendDeliveryNotification = async (orderId: string, message: string, userId: string) => {
    try {
      console.log('📱 Sending delivery notification:', orderId);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Delivery Update',
          body: message,
          data: { 
            type: 'delivery', 
            orderId,
            userId 
          },
          sound: true,
          priority: 'high',
        },
        trigger: null, // Show immediately
      });
      
      console.log('✅ Delivery notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending delivery notification:', error);
    }
  };

  const value: NotificationContextType = {
    isInitialized,
    hasPermission,
    badgeCount,
    initializeNotifications,
    requestPermission,
    sendTestNotification,
    testOrderNotification,
    clearBadge,
    sendOrderNotification,
    sendPromotionalNotification,
    sendDeliveryNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 