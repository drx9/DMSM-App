import { Stack } from 'expo-router';
import LanguageProvider from './context/LanguageContext';

export default function Layout() {
  return (
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
  );
}
