import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { 
  getResponsiveFontSize, 
  getResponsiveWidth, 
  getResponsiveHeight,
  SAFE_AREA_TOP,
  SPACING 
} from '../../utils/deviceUtils';

const languages = [
  { id: 'en', name: 'English', nativeName: 'English' },
  { id: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
];

const LanguageScreen = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const { setLanguage, t } = useLanguage();

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLanguageSelect = async (languageId: string) => {
    setSelectedLanguage(languageId);
    setLanguage(languageId);
    
    // Always go to login for proper authentication flow
    try {
      console.log('LanguageScreen: Navigating to login');
      
      setTimeout(() => {
        router.replace('/login');
      }, 500);
    } catch (error) {
      console.error('LanguageScreen: Error in navigation:', error);
      // Fallback to login
      setTimeout(() => {
        router.replace('/login');
      }, 500);
    }
  };

  const handleBack = () => {
    router.replace('/splash');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#CB202D" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/dms-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>{t('chooseYourLanguage')}</Text>
          <Text style={styles.subtitle}>{t('selectYourLanguage')}</Text>
        </View>

        <View style={styles.languageContainer}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.languageButton,
                selectedLanguage === language.id && styles.selectedLanguage,
              ]}
              onPress={() => handleLanguageSelect(language.id)}
            >
              <View style={styles.languageContent}>
                <Text style={[
                  styles.languageName,
                  selectedLanguage === language.id && styles.selectedLanguageText,
                ]}>
                  {language.id === 'en' ? t('english') : language.id === 'as' ? t('assamese') : t('hindi')}
                </Text>
                <Text style={[
                  styles.languageNativeName,
                  selectedLanguage === language.id && styles.selectedLanguageText,
                ]}>
                  {language.nativeName}
                </Text>
              </View>
              {selectedLanguage === language.id && (
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  backButton: {
    position: 'absolute',
    top: SAFE_AREA_TOP + SPACING.sm,
    left: SPACING.md,
    zIndex: 1,
    padding: SPACING.sm,
  },
  header: {
    alignItems: 'center',
    marginTop: SAFE_AREA_TOP + SPACING.xl,
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: getResponsiveWidth(30),
    height: getResponsiveWidth(30),
    marginBottom: SPACING.md,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    color: '#666666',
    textAlign: 'center',
  },
  languageContainer: {
    marginTop: SPACING.md,
  },
  languageButton: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedLanguage: {
    backgroundColor: '#CB202D',
    borderColor: '#CB202D',
  },
  languageContent: {
    flex: 1,
  },
  languageName: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  languageNativeName: {
    fontSize: getResponsiveFontSize(16),
    color: '#666666',
  },
  selectedLanguageText: {
    color: '#FFFFFF',
  },
});

export default LanguageScreen; 