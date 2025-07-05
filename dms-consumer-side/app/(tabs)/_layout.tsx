import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ActivityIndicator, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LocationSelectionScreen from '../location/LocationSelectionScreen';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useFocusEffect } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [addressSet, setAddressSet] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const { cartCount, refreshCartFromBackend } = useCart();
  console.log('[TabLayout] cartCount:', cartCount);

  useEffect(() => {
    const checkAddressSet = async () => {
      const uid = await AsyncStorage.getItem('userId');
      setUserId(uid);
      console.log('[TabLayout] Checking address for userId:', uid);
      // Only check backend for addresses, do not clear AsyncStorage
      if (uid) {
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
        }
      } else {
        console.log('[TabLayout] No userId found, setting addressSet = false');
        setAddressSet(false);
        return;
      }
      setAddressSet(false);
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

  if (addressSet === null) {
    return <ActivityIndicator size="large" color="#CB202D" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />;
  }

  if (addressSet === false) {
    return (
      <LocationSelectionScreen
        onLocationSelected={async (address: any) => {
          await AsyncStorage.setItem('userAddress', JSON.stringify(address));
          await AsyncStorage.setItem('addressSet', 'true');
          setAddressSet(true);
          // router.replace('/');
        }}
        userId={userId}
        editingAddress={null}
        savedAddress={null}
      />
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#CB202D',
        tabBarInactiveTintColor: '#666666',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "grid" : "grid-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "cart" : "cart-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
} 