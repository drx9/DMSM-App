import React, { useState, useRef } from 'react';
import { signInWithPhoneNumber, signInWithCredential, PhoneAuthProvider } from 'firebase/auth';
import { firebaseAuth } from './firebaseConfig';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function PhoneAuthScreen() {
  const recaptchaVerifier = useRef(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const sendCode = async () => {
    setMessage('');
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number including country code, e.g. +91...');
      return;
    }
    setIsLoading(true);
    try {
      const confirmation = await signInWithPhoneNumber(firebaseAuth, phone, recaptchaVerifier.current!);
      setVerificationId(confirmation.verificationId);
      setMessage('OTP sent! Please check your phone.');
    } catch (err: any) {
      setMessage(err.message || 'Failed to send OTP');
    }
    setIsLoading(false);
  };

  const verifyCode = async () => {
    setMessage('');
    if (!verificationId || !code) {
      Alert.alert('Error', 'Please enter the OTP sent to your phone.');
      return;
    }
    setIsLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await signInWithCredential(firebaseAuth, credential);
      // Optionally store user info
      await AsyncStorage.setItem('userId', result.user.uid);
      setMessage('Phone authentication successful!');
      Alert.alert('Success', 'Phone authentication successful!');
      router.replace('/(tabs)');
    } catch (err: any) {
      setMessage(err.message || 'Failed to verify OTP');
      Alert.alert('Error', err.message || 'Failed to verify OTP');
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseAuth.app.options}
      />
      <Text style={styles.title}>Phone Authentication</Text>
      <Text style={styles.subtitle}>Sign in with your phone number</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone (+91...)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={sendCode}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Sending...' : 'Send OTP'}
        </Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="OTP"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={verifyCode}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
}); 