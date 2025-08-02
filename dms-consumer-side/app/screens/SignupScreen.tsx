import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import {
  useRouter,
  useLocalSearchParams
} from 'expo-router';
import axios, { AxiosError } from 'axios';
import { useLanguage } from '../context/LanguageContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { API_URL } from '../config'; // Import from central config
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

interface ApiResponse {
  success: boolean;
  message?: string;
  userId?: string;
  errors?: Array<{ msg: string; param: string }>;
}

WebBrowser.maybeCompleteAuthSession();

const SignupScreen = () => {
  const params = useLocalSearchParams();
  const {
    phoneNumber: initialPhoneNumber
  } = params;
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState((initialPhoneNumber as string) || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '875079305931-f0k3mdqqrrbj9ablfn1gdqp7rn4567iq.apps.googleusercontent.com', // Android client ID
    iosClientId: '875079305931-f0k3mdqqrrbj9ablfn1gdqp7rn4567iq.apps.googleusercontent.com', // Same for now, update when you create iOS client
    androidClientId: '875079305931-f0k3mdqqrrbj9ablfn1gdqp7rn4567iq.apps.googleusercontent.com', // Your Android client ID
    webClientId: '875079305931-f0k3mdqqrrbj9ablfn1gdqp7rn4567iq.apps.googleusercontent.com', // Same for now, update when you create web client
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        axios.post(`${API_URL}/auth/google`, { token: id_token })
          .then(async (res) => {
            if (res.data.success && res.data.token && res.data.user) {
              await AsyncStorage.setItem('userId', res.data.user.id);
              // await AsyncStorage.setItem('userToken', res.data.token);
              Alert.alert('Success', 'Logged in with Google!');
              router.replace('/(tabs)');
            } else if (res.data.redirectToRegister && res.data.email) {
              setEmail(res.data.email); // Prefill email field
            } else {
              Alert.alert('Error', res.data.message || 'Google login failed');
            }
          })
          .catch((err) => {
            console.error('Google login backend error:', err);
            Alert.alert('Error', 'Google login failed');
          });
      }
    }
  }, [response]);

  const handleSignup = async () => {
    if (!name || (!phoneNumber && !email) || !password) {
      Alert.alert(t('error'), t('pleaseFillInAllRequiredFields'));
      return;
    }

    if (phoneNumber && phoneNumber.length !== 10) {
      Alert.alert(t('error'), t('pleaseEnterAValid10DigitPhoneNumber'));
      return;
    }

    if (email && !/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      Alert.alert(t('error'), t('pleaseEnterAValidEmailAddress'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), t('passwordMustBeAtLeast6CharactersLong'));
      return;
    }

    try {
      setIsLoading(true);
      
      // Determine verification type and contact info
      const verificationType = phoneNumber ? 'phone' : 'email';
      const contactInfo = phoneNumber || email;
      
      // Prepare user data for OTP verification
      const userData = {
        name,
        password,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : undefined,
        gender: gender || undefined,
      };

      // Send OTP using Firebase
      const { firebaseAuthService } = require('../services/firebaseAuthService');
      let otpSent = false;
      
      if (verificationType === 'phone') {
        otpSent = await firebaseAuthService.sendPhoneOTP(contactInfo);
      } else {
        otpSent = await firebaseAuthService.sendEmailOTP(contactInfo);
      }

      if (otpSent) {
        // Navigate to OTP verification screen
        router.push({
          pathname: '/otp-verification',
          params: {
            type: verificationType,
            contact: contactInfo,
            userData: JSON.stringify(userData)
          }
        });
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to start registration process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/dms-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>{t('signUp')}</Text>
          <Text style={styles.subtitle}>{t('createYourAccountToContinue')}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('fullName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterYourFullName')}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('phoneNumber')}</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder={t('enterYourPhoneNumber')}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('emailOptional')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterYourEmailAddress')}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('password')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterYourPassword')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              maxLength={20}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('dateOfBirth')}</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text style={{ color: dateOfBirth ? '#1F2937' : '#9CA3AF', fontSize: 13 }}>
                {dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : t('enterDateOfBirth')}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth || new Date()}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('gender')}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={gender}
                onValueChange={(itemValue: string) => setGender(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label={t('selectGender')} value="" />
                <Picker.Item label={t('male')} value="Male" />
                <Picker.Item label={t('female')} value="Female" />
                <Picker.Item label={t('other')} value="Other" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.signupButton,
              (isLoading) && styles.signupButtonDisabled,
            ]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? t('registering') : t('register')}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('alreadyHaveAnAccount')}{' '}
              <Text style={styles.loginText} onPress={() => router.replace('/login')}>
                {t('login')}
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  countryCode: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    height: 42,
    fontSize: 13,
    color: '#1F2937',
  },
  input: {
    height: 42,
    fontSize: 13,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  signupButton: {
    backgroundColor: '#10B981',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signupButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
  },
  loginText: {
    color: '#10B981',
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 42,
    width: '100%',
    color: '#1F2937',
  },
});

export default SignupScreen;