import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectSocket, joinRoom, disconnectSocket, onSocketEvent, offSocketEvent } from './services/socketService';
import { registerForPushNotificationsAsync } from './services/pushService';
import { fcmService } from './services/fcmService';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function MyApp({ Component, pageProps }: { Component: any; pageProps: any }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const id = await AsyncStorage.getItem('userId');
      console.log('Retrieved userId from AsyncStorage:', id);
      setUserId(id);
      
      if (id) {
        console.log('Setting up socket for userId:', id);
        const socket = connectSocket();
        console.log('Socket connected:', socket.connected);
        joinRoom(`user_${id}`);
        registerForPushNotificationsAsync(id);
        
        // Setup FCM
        const setupFCM = async () => {
          console.log('Setting up FCM...');
          await fcmService.requestPermission();
          const token = await fcmService.getToken();
          
          if (token) {
            await fcmService.sendTokenToBackend(id, token);
          }
          
          fcmService.setupMessageHandlers();
        };
        
        setupFCM();
        
        // Set up event listeners immediately
        console.log('Setting up socket event listeners immediately for user:', id);
        
        function handleOrderStatusUpdate(data: any) {
          console.log('Order status update received:', data);
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Order Update',
              body: `Your order #${data.orderId?.substring(0, 8)} status is now: ${data.status}`,
              data: { type: 'order_status', orderId: data.orderId, status: data.status },
            },
            trigger: null,
          }).then(() => {
            console.log('Notification scheduled successfully');
          }).catch((error) => {
            console.error('Error scheduling notification:', error);
          });
        }
        
        function handleOrderPlaced(data: any) {
          console.log('Order placed received:', data);
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Order Placed',
              body: 'Your order has been placed successfully!',
              data: { type: 'order_placed', orderId: data.orderId },
            },
            trigger: null,
          });
        }
        
        // Set up listeners directly on socket
        socket.on('order_status_update', handleOrderStatusUpdate);
        socket.on('order_placed', handleOrderPlaced);
        socket.on('test_event', (data) => {
          console.log('[Socket] Test event received:', data);
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Socket Test',
              body: 'Socket event received successfully!',
              data: { type: 'socket_test' },
            },
            trigger: null,
          });
        });
        
        // Simple polling for order updates - this will work immediately
        let lastOrderStatuses = new Map();
        
        const pollForOrderUpdates = async () => {
          try {
            const response = await fetch(`https://dmsm-app-production-a35d.up.railway.app/api/orders/user/${id}`);
            if (response.ok) {
              const orders = await response.json();
              
              // Check for status changes
              orders.forEach((order: any) => {
                const lastStatus = lastOrderStatuses.get(order.id);
                
                if (lastStatus && lastStatus !== order.status) {
                  // Status changed, show notification
                  Notifications.scheduleNotificationAsync({
                    content: {
                      title: 'Order Update',
                      body: `Your order #${order.id.substring(0, 8)} status is now: ${order.status}`,
                      data: { type: 'order_status', orderId: order.id, status: order.status },
                    },
                    trigger: null,
                  });
                }
                lastOrderStatuses.set(order.id, order.status);
              });
            }
          } catch (error) {
            // Silent error handling
          }
        };
        
        // Poll every 15 seconds
        const pollInterval = setInterval(pollForOrderUpdates, 15000);
        
        // Run once immediately
        pollForOrderUpdates();
        
        // Cleanup
        return () => {
          clearInterval(pollInterval);
        };
        
        console.log('Socket event listeners set up for user:', id);
      } else {
        disconnectSocket();
      }
    };
    checkUser();
  }, []);

  // Removed duplicate useEffect - event listeners are now set up in the main useEffect above

  // Expo push notification listeners
  useEffect(() => {
    const subscriptionReceived = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      console.log('Notification title:', notification.request.content.title);
      console.log('Notification body:', notification.request.content.body);
      // Remove the alert to avoid blocking notifications
      // Alert.alert('Local Notification', notification.request.content.title || 'You have a new notification');
    });
    const subscriptionResponse = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap (navigate, refresh, etc.)
    });
    return () => {
      subscriptionReceived.remove();
      subscriptionResponse.remove();
    };
  }, []);

  // Test notification function - you can call this to test if notifications work
  const testNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from DMS Mart!',
          data: { test: true },
        },
        trigger: null, // Send immediately
      });
      console.log('Test notification scheduled');
    } catch (error) {
      console.error('Error scheduling test notification:', error);
    }
  };

  // Test notification on app start (uncomment to test)
  useEffect(() => { 
    setTimeout(() => {
      console.log('Testing notification system...');
      testNotification();
    }, 5000); 
  }, []);

  // Check notification permissions
  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      console.log('Notification permission status:', status);
      
      if (status !== 'granted') {
        console.log('Requesting notification permissions...');
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        console.log('New permission status:', newStatus);
      }
    };
    
    checkPermissions();
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp; 