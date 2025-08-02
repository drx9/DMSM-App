import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'product' || segments[0] === 'checkout' || segments[0] === 'my-orders' || segments[0] === 'saved-addresses' || segments[0] === 'account-details' || segments[0] === 'customer-support' || segments[0] === 'wishlist' || segments[0] === 'payment-options' || segments[0] === 'add-gift-card' || segments[0] === 'notification-settings';
    
    const isAuthPage = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'verify-otp' || segments[0] === 'language' || segments[0] === 'splash';

    if (!isAuthenticated && inAuthGroup) {
      // User is not authenticated but trying to access protected routes
      router.replace('/login');
    } else if (isAuthenticated && isAuthPage) {
      // User is authenticated but on auth pages (login, signup, etc.)
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
} 