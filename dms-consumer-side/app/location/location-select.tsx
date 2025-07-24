import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LocationSelectionScreen from './LocationSelectionScreen';

export default function LocationSelectRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string | undefined;

  return (
    <LocationSelectionScreen
      userId={userId}
      savedAddress={null}
      onLocationSelected={(address: any) => {
        // Pass address back via router.replace or router.back with params
        if (params.onSelect) {
          // If a callback is passed, call it
          (params.onSelect as any)(address);
        }
        router.back();
      }}
      onBack={() => router.back()}
    />
  );
} 