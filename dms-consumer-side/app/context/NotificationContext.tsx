import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { fcmService } from '../services/fcmService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  isInitialized: boolean;
  hasPermission: boolean;
  badgeCount: number;
  initializeNotifications: (userId: string) => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
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
  const { user } = useAuth();
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
      // Initialize FCM service
      const success = await fcmService.initialize(userId);
      if (success) {
        setIsInitialized(true);
        setHasPermission(true);
        await updateBadgeCount();
        return true;
      } else {
        console.error('FCM initialization failed');
        return false;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  };

  // Auto-initialize notifications when user is available
  useEffect(() => {
    if (user && !isInitialized) {
      initializeNotifications(user.id);
    }
  }, [user, isInitialized]);

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
      await fcmService.testFCMNotification();
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const sendOrderNotification = async (orderId: string, status: string, userId: string) => {
    try {
      // Order notifications are handled by the backend FCM service
      console.log('Order notification will be sent by backend FCM service');
    } catch (error) {
      console.error('Error sending order notification:', error);
    }
  };

  const sendPromotionalNotification = async (title: string, body: string, data?: any) => {
    try {
      // Promotional notifications are handled by the backend FCM service
      console.log('Promotional notification will be sent by backend FCM service');
    } catch (error) {
      console.error('Error sending promotional notification:', error);
    }
  };

  const sendDeliveryNotification = async (orderId: string, message: string, userId: string) => {
    try {
      // Delivery notifications are handled by the backend FCM service
      console.log('Delivery notification will be sent by backend FCM service');
    } catch (error) {
      console.error('Error sending delivery notification:', error);
    }
  };

  const value: NotificationContextType = {
    isInitialized,
    hasPermission,
    badgeCount,
    initializeNotifications,
    requestPermission,
    sendTestNotification,
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