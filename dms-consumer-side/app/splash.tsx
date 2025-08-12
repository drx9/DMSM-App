import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, debugStorage } = useAuth();
  const { language } = useLanguage();

  // Add error state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleNavigation = async () => {
      try {
        console.log('🚀 Splash screen starting navigation logic...');
        console.log('🚀 Auth state:', { isAuthenticated, isLoading });
        
        // Debug storage contents (optional, won't crash if it fails)
        try {
          if (debugStorage) {
            await debugStorage();
          }
        } catch (debugError) {
          console.warn('⚠️ Debug storage failed, continuing...', debugError);
        }
        
        // Wait a bit for the splash screen to show
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (isLoading) {
          console.log('🚀 Still loading, waiting more...');
          // Still loading, wait more
          return;
        }

        // Check if language is selected
        let selectedLanguage;
        try {
          selectedLanguage = await AsyncStorage.getItem('appLanguage');
        } catch (storageError) {
          console.warn('⚠️ Language storage check failed:', storageError);
          selectedLanguage = null;
        }
        
        console.log('🚀 Language check:', { selectedLanguage });
        
        if (!selectedLanguage) {
          console.log('🚀 No language selected, navigating to language selection');
          router.replace('/language');
          return;
        }

        if (isAuthenticated) {
          console.log('🚀 User is authenticated, navigating to main app');
          router.replace('/(tabs)');
        } else {
          console.log('🚀 User is not authenticated, navigating to login');
          router.replace('/login');
        }
      } catch (error) {
        console.error('🚨 Critical error in splash screen navigation:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        
        // Fallback navigation to login
        try {
          router.replace('/login');
        } catch (routerError) {
          console.error('🚨 Router error, trying language selection:', routerError);
          try {
            router.replace('/language');
          } catch (finalError) {
            console.error('🚨 Final navigation fallback failed:', finalError);
          }
        }
      }
    };

    handleNavigation();
  }, [isAuthenticated, isLoading, language, router, debugStorage]);

  // Show error UI if something goes wrong
  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Image
            source={require('../assets/images/dms-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>DMS Mart</Text>
          <Text style={styles.subtitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setHasError(false);
              setErrorMessage('');
              // Retry navigation
              router.replace('/login');
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/dms-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>DMS Mart</Text>
        <Text style={styles.subtitle}>Your Local Delivery Partner</Text>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CB202D" />
          <Text style={styles.loadingText}>
            {isLoading ? 'Checking authentication...' : 'Loading...'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#CB202D',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#CB202D',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 30,
    backgroundColor: '#CB202D',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 