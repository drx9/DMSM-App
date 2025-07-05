import { Stack } from 'expo-router';
import LanguageProvider from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WishlistProvider } from './context/WishlistContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
