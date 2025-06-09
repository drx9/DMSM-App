import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

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

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguage(languageId);
    setLanguage(languageId);
    setTimeout(() => {
      router.replace('/login');
    }, 500);
  };

  const handleBack = () => {
    router.replace('/splash');
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Image
          source={require('../../assets/images/dms-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  languageContainer: {
    marginTop: 20,
  },
  languageButton: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLanguage: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  languageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  languageNativeName: {
    fontSize: 16,
    color: '#666666',
  },
  selectedLanguageText: {
    color: '#FFFFFF',
  },
});

export default LanguageScreen; 