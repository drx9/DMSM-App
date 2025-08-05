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
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from 'expo-router';
import OrderStatusBar from '../../components/OrderStatusBar';
import ErrorBoundary from '../components/ErrorBoundary';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [addressSet, setAddressSet] = useState<boolean | null>(null);
  const [hasSetAddressOnce, setHasSetAddressOnce] = useState<boolean | null>(null);
  const router = useRouter();
  const { cartCount, refreshCartFromBackend } = useCart();
  const { user } = useAuth();
  const userId = user?.id;
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  console.log('[TabLayout] cartCount:', cartCount);

  useEffect(() => {
    const checkAddressSet = async () => {
      try {
        if (!userId) {
          console.log('[TabLayout] No userId found, setting addressSet = false');
          setAddressSet(false);
          setHasSetAddressOnce(false);
          return;
        }

        // Check if user has saved addresses in AsyncStorage first
        const savedAddress = await AsyncStorage.getItem('userAddress');
        const hasSetOnce = await AsyncStorage.getItem('hasSetAddressOnce');
        
        if (savedAddress && hasSetOnce === 'true') {
          console.log('[TabLayout] User has saved address, setting addressSet = true');
          setAddressSet(true);
          setHasSetAddressOnce(true);
          return;
        }
        
        // Skip backend check to prevent crashes - just use local storage
        console.log('[TabLayout] No saved address found, setting addressSet = false');
        setAddressSet(false);
        setHasSetAddressOnce(false);
        
      } catch (error) {
        console.error('[TabLayout] Critical error in checkAddressSet:', error);
        setAddressSet(false);
        setHasSetAddressOnce(false);
      }
    };
    checkAddressSet();
  }, [userId]);

  useEffect(() => {
    AsyncStorage.getItem('hasSetAddressOnce').then(val => {
      console.log('DEBUG: hasSetAddressOnce in TabLayout:', val);
    });
    AsyncStorage.getItem('userAddress').then(val => {
      console.log('DEBUG: userAddress in TabLayout:', val);
    });
  }, [addressSet, hasSetAddressOnce]);

  useEffect(() => {
    console.log('[TabLayout] Render: addressSet =', addressSet, 'userId =', userId);
    if (addressSet === false) {
      console.log('[TabLayout] Showing location selector screen');
    }
    if (addressSet === true) {
      console.log('[TabLayout] Showing tabs');
    }
  }, [addressSet, userId]);

  // Only refresh cart when tab is focused, not on every render
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        try {
          refreshCartFromBackend();
        } catch (error) {
          console.error('[TabLayout] Error refreshing cart:', error);
          // Don't crash, just continue without cart refresh
        }
      }
    }, [userId]) // Only depend on userId, not refreshCartFromBackend
  );

  useEffect(() => {
    const fetchActiveOrder = async () => {
      if (!userId) return;
      try {
        // Skip API call for now to prevent crashes
        console.log('[TabLayout] Skipping active order fetch to prevent crashes');
        setActiveOrderId(null);
        setDestination(null);
      } catch (err) {
        setActiveOrderId(null);
        setDestination(null);
      }
    };
    fetchActiveOrder();
  }, [userId]);

  const setHasSetAddressOnceFlag = async () => {
    await AsyncStorage.setItem('hasSetAddressOnce', 'true');
    setHasSetAddressOnce(true);
  };

  // Add error boundary to prevent crashes
  if (addressSet === null || hasSetAddressOnce === null) {
    return <ActivityIndicator size="large" color="#CB202D" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />;
  }

  // Show location selector only if user has never set an address
  if (addressSet === false && hasSetAddressOnce === false) {
    return (
      <LocationSelectionScreen
        onLocationSelected={async (address: any) => {
          try {
            await AsyncStorage.setItem('userAddress', JSON.stringify(address));
            await AsyncStorage.setItem('addressSet', 'true');
            await setHasSetAddressOnceFlag();
            setAddressSet(true);
            // Skip backend call to prevent crashes
            console.log('[TabLayout] Location selected, skipping backend update');
          } catch (error) {
            console.error('[TabLayout] Error saving location:', error);
            // Don't crash, just continue
          }
        }}
        userId={userId}
        editingAddress={null}
        savedAddress={null}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <OrderStatusBar orderId={activeOrderId} destination={destination} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#CB202D',
          tabBarInactiveTintColor: '#687076',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          lazy: true,
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
          name="offers"
          options={{
            title: 'Offers',
            tabBarIcon: ({ color }) => <Ionicons name="pricetag" size={28} color={color} as const />,
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
      </View>
  );
}
