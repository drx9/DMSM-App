import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectSocket, joinRoom, disconnectSocket, onSocketEvent, offSocketEvent } from './services/socketService';
import { registerForPushNotificationsAsync } from './services/pushService';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

function MyApp({ Component, pageProps }: { Component: any; pageProps: any }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
      if (id) {
        connectSocket();
        joinRoom(`user_${id}`);
        registerForPushNotificationsAsync(id);
      } else {
        disconnectSocket();
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    function handleOrderStatusUpdate(data: any) {
      Alert.alert('Order Update', `Order status is now: ${data.status}`);
    }
    function handleOrderPlaced(data: any) {
      Alert.alert('Order Placed', 'A new order has been placed!');
    }
    function handleAssignedOrder(data: any) {
      Alert.alert('New Delivery Assigned', `You have been assigned a new delivery! Order ID: ${data.orderId}`);
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Delivery Assigned',
          body: `Order ID: ${data.orderId}`,
          sound: true,
        },
        trigger: null,
      });
    }
    onSocketEvent('order_status_update', handleOrderStatusUpdate);
    onSocketEvent('order_placed', handleOrderPlaced);
    onSocketEvent('assigned_order', handleAssignedOrder);
    return () => {
      offSocketEvent('order_status_update', handleOrderStatusUpdate);
      offSocketEvent('order_placed', handleOrderPlaced);
      offSocketEvent('assigned_order', handleAssignedOrder);
    };
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp; 