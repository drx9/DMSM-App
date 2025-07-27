import { Stack } from 'expo-router';
import LanguageProvider from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WishlistProvider } from './context/WishlistContext';
import { NotificationProvider } from './context/NotificationContext';
import OrderStatusBar from '../components/OrderStatusBar';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { API_URL } from './config';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { View, Text, TouchableOpacity } from 'react-native';
import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout() {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchActiveOrder = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) return;
        
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
        console.error('[RootLayout] Error fetching active order:', err);
        setActiveOrderId(null);
        setDestination(null);
      }
    };
    fetchActiveOrder();
  }, []);

  // Global error boundary
  if (hasError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
          Something went wrong. Please restart the app.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#10B981', padding: 15, borderRadius: 8 }}
          onPress={() => setHasError(false)}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <OrderStatusBar orderId={activeOrderId} destination={destination} />
          <NotificationProvider>
            <CartProvider>
              <LanguageProvider>
                <WishlistProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                                      <Stack.Screen name="splash" />
                  <Stack.Screen name="language" />
                  <Stack.Screen name="signup" />
                  <Stack.Screen name="verify-otp" />
          
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
                  </Stack>
                </WishlistProvider>
              </LanguageProvider>
            </CartProvider>
          </NotificationProvider>
        </GestureHandlerRootView>
      </Provider>
    </ErrorBoundary>
  );
}
