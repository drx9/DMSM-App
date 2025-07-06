import { Stack } from 'expo-router';
import LanguageProvider from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WishlistProvider } from './context/WishlistContext';
import OrderStatusBar from '../components/OrderStatusBar';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { API_URL } from './config';

export default function RootLayout() {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const fetchActiveOrder = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) return;
      try {
        const res = await axios.get(`${API_URL}/orders/user/${storedUserId}`);
        const active = res.data.find((order: any) => ['out_for_delivery', 'on_the_way', 'picked_up'].includes(order.status));
        if (active) {
          setActiveOrderId(active.id);
          if (active.shippingAddress && typeof active.shippingAddress.latitude === 'number' && typeof active.shippingAddress.longitude === 'number') {
            setDestination({ latitude: active.shippingAddress.latitude, longitude: active.shippingAddress.longitude });
          }
        } else {
          setActiveOrderId(null);
          setDestination(null);
        }
      } catch (err) {
        setActiveOrderId(null);
        setDestination(null);
      }
    };
    fetchActiveOrder();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OrderStatusBar orderId={activeOrderId} destination={destination} />
      <CartProvider>
        <LanguageProvider>
          <WishlistProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="splash" />
              <Stack.Screen name="language" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="verify-otp" />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </WishlistProvider>
        </LanguageProvider>
      </CartProvider>
    </GestureHandlerRootView>
  );
}
