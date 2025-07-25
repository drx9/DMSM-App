#!/bin/bash
# Automated environment setup for Expo apps

cat <<EOT > .env
EXPO_PUBLIC_API_URL=https://dmsm-app-production-a35d.up.railway.app/api
EXPO_PUBLIC_SOCKET_URL=https://dmsm-app-production-a35d.up.railway.app
EOT

cat <<EOT > expo-env.d.ts
declare module 'react-native-dotenv' {
  export const EXPO_PUBLIC_API_URL: string;
  export const EXPO_PUBLIC_SOCKET_URL: string;
}
EOT

echo "✅ .env and expo-env.d.ts created!" 