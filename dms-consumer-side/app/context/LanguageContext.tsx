import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, TranslationType } from '../i18n/translations';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: keyof TranslationType) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState('en'); // Default to English

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem('appLanguage');
        if (storedLanguage) {
          setLanguageState(storedLanguage);
        }
      } catch (e) {
        console.error('Failed to load language from storage', e);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: string) => {
    try {
      await AsyncStorage.setItem('appLanguage', lang);
      setLanguageState(lang);
    } catch (e) {
      console.error('Failed to save language to storage', e);
    }
  };

  const t = (key: keyof TranslationType) => {
    return translations[language as keyof typeof translations][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export { LanguageProvider };
export default LanguageProvider; 