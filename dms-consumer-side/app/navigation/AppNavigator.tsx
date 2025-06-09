import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import  SplashScreen  from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen'; // Create a placeholder if not done yet

// 📝 Step 1: Define the type for your navigation params
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
};

// 🏗️ Step 2: Create the stack navigator with type
const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
