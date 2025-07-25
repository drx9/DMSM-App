import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectSocket, joinRoom, disconnectSocket, onSocketEvent, offSocketEvent } from './services/socketService';
import { registerForPushNotificationsAsync } from './services/pushService';
import { Alert } from 'react-native';

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
    // Listen for login/logout events (if you have a custom event system, add here)
  }, []);

  useEffect(() => {
    function handleOrderStatusUpdate(data: any) {
      Alert.alert('Order Update', `Your order status is now: ${data.status}`);
    }
    function handleOrderPlaced(data: any) {
      Alert.alert('Order Placed', 'Your order has been placed successfully!');
    }
    onSocketEvent('order_status_update', handleOrderStatusUpdate);
    onSocketEvent('order_placed', handleOrderPlaced);
    return () => {
      offSocketEvent('order_status_update', handleOrderStatusUpdate);
      offSocketEvent('order_placed', handleOrderPlaced);
    };
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp; 