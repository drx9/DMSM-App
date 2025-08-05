import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    const handleNavigation = async () => {
      // Wait a bit for the splash screen to show
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (isLoading) {
        // Still loading, wait more
        return;
      }

      // Check if language is selected
      const selectedLanguage = await AsyncStorage.getItem('selectedLanguage');
      
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
    };

    handleNavigation();
  }, [isAuthenticated, isLoading, language, router]);

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
}); 