import React, { useRef, useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import { getAuth, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { firebaseApp } from "./firebaseConfig";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app/api';
const auth = getAuth(firebaseApp);

export default function PhoneAuthScreen() {
  const recaptchaVerifier = useRef(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const sendCode = async () => {
    try {
      if (!recaptchaVerifier.current) throw new Error("Recaptcha not ready");
      setIsLoading(true);
      const confirmation = await signInWithPhoneNumber(auth, phone, recaptchaVerifier.current as any);
      setVerificationId(confirmation.verificationId);
      setMessage("OTP sent!");
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    try {
      if (!verificationId) throw new Error("No verificationId");
      setIsLoading(true);
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCredential = await signInWithCredential(auth, credential);
      const idToken = await userCredential.user.getIdToken();
      // Send idToken to backend
      const response = await fetch(`${API_URL}/auth/firebase-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await response.json();
      if (data.success && data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userId', data.user.id);
        setMessage("Phone verified and logged in!");
        router.replace('/(tabs)');
      } else {
        setMessage(data.error || "Login failed");
        Alert.alert('Error', data.error || "Login failed");
      }
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
      Alert.alert('Error', (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseApp.options}
      />
      <TextInput placeholder="Phone (+91...)" value={phone} onChangeText={setPhone} />
      <Button title={isLoading ? "Sending..." : "Send OTP"} onPress={sendCode} disabled={isLoading} />
      <TextInput placeholder="OTP" value={code} onChangeText={setCode} />
      <Button title={isLoading ? "Verifying..." : "Verify OTP"} onPress={verifyCode} disabled={isLoading} />
      <Text>{message}</Text>
    </View>
  );
} 