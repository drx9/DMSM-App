import { Stack } from 'expo-router';
import LanguageProvider from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CartProvider>
        <LanguageProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="splash" />
            <Stack.Screen name="language" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="verify-otp" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </LanguageProvider>
      </CartProvider>
    </GestureHandlerRootView>
  );
}
