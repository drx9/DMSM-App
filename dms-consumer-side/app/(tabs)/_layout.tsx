import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ActivityIndicator, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LocationSelectionScreen from '../location/LocationSelectionScreen';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useFocusEffect } from '@react-navigation/native';
import OrderStatusBar from '../../components/OrderStatusBar';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [addressSet, setAddressSet] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasSetAddressOnce, setHasSetAddressOnce] = useState<boolean | null>(null);
  const router = useRouter();
  const { cartCount, refreshCartFromBackend } = useCart();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  console.log('[TabLayout] cartCount:', cartCount);

  useEffect(() => {
    const checkAddressSet = async () => {
      try {
      const uid = await AsyncStorage.getItem('userId');
      setUserId(uid);
        
        if (!uid) {
          console.log('[TabLayout] No userId found, setting addressSet = false');
          setAddressSet(false);
          setHasSetAddressOnce(false);
          return;
        }

        // Check if user has ever set an address
        const hasSetOnce = await AsyncStorage.getItem('hasSetAddressOnce');
        if (hasSetOnce === 'true') {
          setHasSetAddressOnce(true);
          setAddressSet(true);
          return;
        }
        
        setHasSetAddressOnce(false);
        
      // Only check backend for addresses, do not clear AsyncStorage
        try {
          console.log('[TabLayout] Fetching addresses from backend for userId:', uid);
          const res = await axios.get(`${API_URL}/addresses/${uid}`);
          console.log('[TabLayout] Backend address response:', res.data);
          
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            await AsyncStorage.setItem('userAddress', JSON.stringify(res.data[0]));
            await AsyncStorage.setItem('addressSet', 'true');
            setAddressSet(true);
            console.log('[TabLayout] Address found, setting addressSet = true');
            return;
          } else {
            console.log('[TabLayout] No addresses found for user, setting addressSet = false');
            setAddressSet(false);
            return;
          }
        } catch (err: any) {
          console.log('[TabLayout] Error fetching addresses from backend:', err?.response?.data || err.message || err);
          // On error, assume no address is set
          setAddressSet(false);
          return;
        }
      } catch (error) {
        console.error('[TabLayout] Critical error in checkAddressSet:', error);
        setAddressSet(false);
        setHasSetAddressOnce(false);
      }
    };
    checkAddressSet();
  }, []);

  useEffect(() => {
    console.log('[TabLayout] Render: addressSet =', addressSet, 'userId =', userId);
    if (addressSet === false) {
      console.log('[TabLayout] Showing location selector screen');
    }
    if (addressSet === true) {
      console.log('[TabLayout] Showing tabs');
    }
  }, [addressSet, userId]);

  useFocusEffect(
    React.useCallback(() => {
      refreshCartFromBackend();
    }, [refreshCartFromBackend])
  );

  useEffect(() => {
    const fetchActiveOrder = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) return;
      try {
        const res = await axios.get(`${API_URL}/orders/user/${storedUserId}`);
        // Find the latest order with status 'out_for_delivery', 'on_the_way' or 'picked_up'
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
  }, [userId]);

  if (addressSet === null || hasSetAddressOnce === null) {
    return <ActivityIndicator size="large" color="#CB202D" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />;
  }

  if (addressSet === false && hasSetAddressOnce === false) {
    return (
      <LocationSelectionScreen
        onLocationSelected={async (address: any) => {
          await AsyncStorage.setItem('userAddress', JSON.stringify(address));
          await AsyncStorage.setItem('addressSet', 'true');
          await AsyncStorage.setItem('hasSetAddressOnce', 'true');
          setAddressSet(true);
          setHasSetAddressOnce(true);
          // router.replace('/');
        }}
        userId={userId}
        editingAddress={null}
        savedAddress={null}
      />
    );
  }

  return (
    <>
      <OrderStatusBar orderId={activeOrderId} destination={destination} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#CB202D',
          tabBarInactiveTintColor: '#687076',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={28} color={color} as const />,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Bag',
            tabBarIcon: ({ color }) => (
              <View>
                <Ionicons name="cart" size={28} color={color} as const />
                {cartCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    backgroundColor: 'green',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                    zIndex: 10,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{cartCount}</Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categories',
            tabBarIcon: ({ color }) => <Ionicons name="grid" size={28} color={color} as const />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Ionicons name="person" size={28} color={color} as const />,
          }}
        />
      </Tabs>
    </>
  );
}
