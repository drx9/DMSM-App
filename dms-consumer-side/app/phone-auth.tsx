import React, { useState, useRef } from 'react';
// import { getAuth, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from "firebase/auth";
// import { firebaseApp } from "./firebaseConfig";
// import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { API_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// const auth = getAuth(firebaseApp);

export default function PhoneAuthScreen() {
  // const recaptchaVerifier = useRef(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  // const [verificationId, setVerificationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const sendCode = async () => {
    // Temporarily disabled Firebase functionality
    setMessage("Phone authentication temporarily disabled for build");
    Alert.alert('Info', 'Phone authentication is temporarily disabled for build testing');
  };

  const verifyCode = async () => {
    // Temporarily disabled Firebase functionality
    setMessage("Phone authentication temporarily disabled for build");
    Alert.alert('Info', 'Phone authentication is temporarily disabled for build testing');
  };

  return (
    <View style={styles.container}>
      {/* <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseApp.options}
      /> */}
      <Text style={styles.title}>Phone Authentication</Text>
      <Text style={styles.subtitle}>Temporarily disabled for build testing</Text>
      <TextInput 
        style={styles.input}
        placeholder="Phone (+91...)" 
        value={phone} 
        onChangeText={setPhone} 
      />
      <TouchableOpacity 
        style={styles.button}
        onPress={sendCode} 
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Sending..." : "Send OTP"}
        </Text>
      </TouchableOpacity>
      <TextInput 
        style={styles.input}
        placeholder="OTP" 
        value={code} 
        onChangeText={setCode} 
      />
      <TouchableOpacity 
        style={styles.button}
        onPress={verifyCode} 
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Verifying..." : "Verify OTP"}
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