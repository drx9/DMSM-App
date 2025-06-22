import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, StatusBar, Animated, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  DEVICE_WIDTH, 
  DEVICE_HEIGHT, 
  getResponsiveFontSize, 
  getResponsiveWidth, 
  getResponsiveHeight,
  SAFE_AREA_TOP 
} from '../../utils/deviceUtils';

const SplashScreen = () => {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.3);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      try {
        // Always go to language selection first for proper flow
        console.log('Navigating to language selection');
        router.replace('/language');
      } catch (error) {
        console.error('Error in navigation:', error);
        // Fallback to language selection
        router.replace('/language');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
      <Image
          source={require('../../assets/images/dms-logo.png')} // Replace with your logo path
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>DMS Mart</Text>
      <Text style={styles.subtitle}>Your Local Daily Needs Partner</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    width: DEVICE_WIDTH * 0.8,
  },
  logo: {
    width: DEVICE_WIDTH * 0.5,
    height: DEVICE_WIDTH * 0.5,
    marginBottom: 20,
  },
  title: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    color: '#666666',
  },
});

export default SplashScreen;

