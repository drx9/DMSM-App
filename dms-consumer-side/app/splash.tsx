import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import SplashScreen from './screens/SplashScreen';

const { width } = Dimensions.get('window');

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FF6B6B', // Replace with your brand color
    borderRadius: 20,
  },
}); 