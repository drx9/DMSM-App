import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { pushNotificationService, NotificationData } from '../services/pushService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

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
      const permission = await pushNotificationService.getNotificationPermissions();
      setHasPermission(permission === 'granted');
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
      const success = await pushNotificationService.registerForPushNotifications(userId);
      if (success) {
        setIsInitialized(true);
        setHasPermission(true);
        await updateBadgeCount();
      }
      return success;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const status = await pushNotificationService.requestNotificationPermissions();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        Alert.alert(
          'Notifications Enabled',
          'You will now receive notifications for order updates and promotions!'
        );
      } else {
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications in your device settings to stay updated with your orders.'
        );
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const updateBadgeCount = async () => {
    try {
      const count = await pushNotificationService.getBadgeCount();
      setBadgeCount(count);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  };

  const clearBadge = async () => {
    try {
      await pushNotificationService.setBadgeCount(0);
      setBadgeCount(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      await pushNotificationService.sendTestNotification();
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const sendOrderNotification = async (orderId: string, status: string, userId: string) => {
    try {
      await pushNotificationService.sendOrderStatusNotification(orderId, status, userId);
    } catch (error) {
      console.error('Error sending order notification:', error);
    }
  };

  const sendPromotionalNotification = async (title: string, body: string, data?: any) => {
    try {
      await pushNotificationService.sendPromotionalNotification(title, body, data);
    } catch (error) {
      console.error('Error sending promotional notification:', error);
    }
  };

  const sendDeliveryNotification = async (orderId: string, message: string, userId: string) => {
    try {
      await pushNotificationService.sendDeliveryNotification(orderId, message, userId);
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