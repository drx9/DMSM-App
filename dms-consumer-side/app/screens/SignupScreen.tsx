import React, { useState } from 'react';
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
  SafeAreaView,
} from 'react-native';
import {
  useRouter,
  useLocalSearchParams
} from 'expo-router';
import axios, { AxiosError } from 'axios';
import { useLanguage } from '../context/LanguageContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { API_URL } from '../config';
import { SPACING, SAFE_AREA_TOP, getResponsiveFontSize, getResponsiveWidth } from '../../utils/deviceUtils';

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

const SignupScreen = () => {
  const params = useLocalSearchParams();
  const {
    phoneNumber: initialPhoneNumber
  } = params;
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState((initialPhoneNumber as string) || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

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
      console.log('Attempting to register with data:', {
        name,
        phoneNumber: phoneNumber || undefined,
        email: email || undefined,
        // Don't log password for security
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        postalCode: postalCode || undefined,
        country: country || undefined,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : undefined,
        gender: gender || undefined,
      });

      const response = await api.post<ApiResponse>(`${API_URL}/auth/register`, {
        name,
        phoneNumber: phoneNumber || undefined,
        email: email || undefined,
        password,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        postalCode: postalCode || undefined,
        country: country || undefined,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : undefined,
        gender: gender || undefined,
      });

      console.log('Registration response:', response.data);

      if (response.data.success) {
        Alert.alert(t('success'), response.data.message || t('registrationSuccessful'));
        router.push({
          pathname: '/verify-otp',
          params: { userId: response.data.userId }
        });
      } else {
        Alert.alert(t('error'), response.data.message || t('failedToRegister'));
      }
    } catch (error) {
      console.error('Signup error:', error);
      const axiosError = error as AxiosError<ApiResponse>;
      console.error('Detailed error:', {
        message: axiosError.message,
        code: axiosError.code,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          data: axiosError.config?.data,
          headers: axiosError.config?.headers
        }
      });

      let errorMessage = t('failedToRegister');
      if (axiosError.code === 'ECONNABORTED') {
        errorMessage = t('requestTimedOut');
      } else if (axiosError.code === 'ERR_NETWORK') {
        errorMessage = t('networkError');
      } else {
        errorMessage = axiosError.response?.data?.message ||
          axiosError.response?.data?.errors?.[0]?.msg ||
          t('failedToRegister');
      }
      Alert.alert(t('error'), errorMessage);
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
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
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
                style={styles.input}
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
            <Text style={styles.label}>{t('address')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterYourAddress')}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('city')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterYourCity')}
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('state')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterYourState')}
              value={state}
              onChangeText={setState}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('postalCode')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterYourPostalCode')}
              value={postalCode}
              onChangeText={setPostalCode}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('country')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterYourCountry')}
              value={country}
              onChangeText={setCountry}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('dateOfBirth')}</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text style={{ color: dateOfBirth ? '#1A1A1A' : '#999999' }}>
                {dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : t('enterDateOfBirth')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('gender')}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={gender}
                  onValueChange={(itemValue) => setGender(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label={t('selectGender')} value="" />
                  <Picker.Item label={t('male')} value="male" />
                  <Picker.Item label={t('female')} value="female" />
                  <Picker.Item label={t('other')} value="other" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.signupButton,
                (!name || (!phoneNumber && !email) || !password || isLoading) && styles.signupButtonDisabled,
            ]}
            onPress={handleSignup}
              disabled={!name || (!phoneNumber && !email) || !password || isLoading}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? t('registering') : t('register')}
            </Text>
          </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('alreadyHaveAnAccount')}{' '}
              <Text style={styles.loginText}>{t('login')}</Text>
            </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth || new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginTop: SAFE_AREA_TOP + SPACING.xl,
    marginBottom: SPACING.xl,
  },
  logo: {
    width: getResponsiveWidth(30),
    height: getResponsiveWidth(30),
    marginBottom: SPACING.md,
  },
  welcomeText: {
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
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: getResponsiveFontSize(14),
    color: '#666666',
    marginBottom: SPACING.sm,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
  },
  countryCode: {
    fontSize: getResponsiveFontSize(16),
    color: '#1A1A1A',
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: getResponsiveFontSize(16),
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center', // for date picker text vertical alignment
  },
  signupButton: {
    backgroundColor: '#FF6B6B',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  signupButtonDisabled: {
    backgroundColor: '#FFB6B6',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  footerText: {
    fontSize: getResponsiveFontSize(14),
    color: '#666666',
  },
  loginText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  picker: {
    height: 50,
    width: '100%',
  },
});

export default SignupScreen; 