import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';
import { API_URL } from '../config';

// AuthContext for user authentication management

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  testModeLogin: () => Promise<boolean>; // Add test mode login method
  clearAllStorage: () => Promise<void>; // Add storage clearing method
  debugStorage: () => Promise<any>; // Add debug method
  forceAuthCheck: () => Promise<boolean>; // Add force auth check method
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Safe AsyncStorage wrapper functions
  const safeAsyncStorageGet = async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn(`⚠️ Failed to read ${key} from AsyncStorage:`, error);
      return null;
    }
  };

  const safeAsyncStorageSet = async (key: string, value: string): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`⚠️ Failed to write ${key} to AsyncStorage:`, error);
      return false;
    }
  };

  const safeAsyncStorageRemove = async (key: string): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`⚠️ Failed to remove ${key} from AsyncStorage:`, error);
      return false;
    }
  };

  const safeAsyncStorageMultiRemove = async (keys: string[]): Promise<boolean> => {
    try {
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.warn(`⚠️ Failed to remove multiple keys from AsyncStorage:`, error);
      return false;
    }
  };

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log('🔄 App state changed:', nextAppState);
    
    if (nextAppState === 'active') {
      console.log('🔄 App became active, re-checking auth status...');
      // Re-check authentication when app becomes active
      checkAuthStatus();
    }
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Starting authentication check...');
      
      // Check for stored user data first (prioritize persistence)
      let userData: string | null = null;
      let token: string | null = null;
      let testMode: string | null = null;
      
      userData = await safeAsyncStorageGet('user');
      token = await safeAsyncStorageGet('userToken');
      testMode = await safeAsyncStorageGet('testMode');
      
      console.log('🔍 Primary storage check:', {
        hasUserData: !!userData,
        hasToken: !!token,
        testMode: testMode,
        userDataLength: userData ? userData.length : 0
      });
      
      // If primary storage is empty, try backup storage
      if (!userData) {
        console.log('⚠️ Primary storage empty, checking backup storage...');
        userData = await safeAsyncStorageGet('backup_user');
        token = await safeAsyncStorageGet('backup_userToken');
        testMode = await safeAsyncStorageGet('testMode');
        
        console.log('🔍 Backup storage check:', {
          hasUserData: !!userData,
          hasToken: !!token,
          testMode: testMode
        });
        
        // If we found data in backup, restore it to primary storage
        if (userData && token) {
          console.log('🔄 Restoring data from backup to primary storage...');
          const userSet = await safeAsyncStorageSet('user', userData);
          const tokenSet = await safeAsyncStorageSet('userToken', token);
          const testModeSet = await safeAsyncStorageSet('testMode', testMode || 'false');
          
          if (userSet && tokenSet && testModeSet) {
            console.log('✅ Data restored to primary storage');
          } else {
            console.warn('⚠️ Failed to restore data to primary storage');
          }
        }
      }
      
      // Final check for userData after potential restoration
      if (!userData) {
        console.log('❌ No user data found in any storage');
        setIsLoading(false);
        return false;
      }
      
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser && token) {
          setUser(parsedUser);
          console.log('✅ User authenticated from storage:', parsedUser.phone);
          setIsLoading(false);
          return true;
        } else {
          console.log('❌ Invalid user data or missing token');
          // Clear corrupted data
          await safeAsyncStorageMultiRemove([
            'user', 'userToken', 'userId', 'testMode',
            'backup_user', 'backup_userToken', 'backup_userId'
          ]);
          setIsLoading(false);
          return false;
        }
      } catch (parseError) {
        console.error('❌ Error parsing user data:', parseError);
        // Clear corrupted data
        await safeAsyncStorageMultiRemove([
          'user', 'userToken', 'userId', 'testMode',
          'backup_user', 'backup_userToken', 'backup_userId'
        ]);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Critical error in checkAuthStatus:', error);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (userData: User, token?: string) => {
    try {
      setUser(userData);
      
      // Store data in multiple places for redundancy (especially important for dev builds)
      const userDataString = JSON.stringify(userData);
      
      // Primary storage
      await safeAsyncStorageSet('user', userDataString);
      if (token) {
        await safeAsyncStorageSet('userToken', token);
      }
      
      // Backup storage with different keys
      await safeAsyncStorageSet('backup_user', userDataString);
      await safeAsyncStorageSet('backup_userId', userData.id);
      if (token) {
        await safeAsyncStorageSet('backup_userToken', token);
      }
      
      // Set a timestamp for when the data was stored
      await safeAsyncStorageSet('lastLoginTime', Date.now().toString());
      
      console.log('✅ User logged in and stored in multiple locations:', userData.id);
    } catch (error) {
      console.error('❌ Error saving user to storage:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      
      // Clear all authentication-related storage
      await safeAsyncStorageMultiRemove([
        'user',
        'userToken', 
        'userId',
        'testMode',
        'lastLoginTime',
        'backup_user',
        'backup_userToken',
        'backup_userId',
        'backup_testMode'
      ]);
      
      console.log('✅ User logged out and all storage cleared');
    } catch (error) {
      console.error('Error removing user from storage:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser as User);
      await safeAsyncStorageSet('user', JSON.stringify(updatedUser));
      console.log('✅ User data updated:', updatedUser.id);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const testModeLogin = async () => {
    try {
      setIsLoading(true);
      
      console.log('🧪 Starting test mode authentication...');
      
      // Use the actual test mode authentication flow
      const response = await fetch(`${API_URL}/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: 'test_mode_token_9577122518',
          phoneNumber: '+919577122518'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Test mode authentication successful:', data);
        
        if (data.success && data.token && data.user) {
          // Store all authentication data for persistence using enhanced storage
          const userDataString = JSON.stringify(data.user);
          
          // Primary storage
          await AsyncStorage.setItem('userToken', data.token);
          await AsyncStorage.setItem('userId', data.user.id);
          await AsyncStorage.setItem('user', userDataString);
          await AsyncStorage.setItem('testMode', 'true');
          
          // Backup storage
          await AsyncStorage.setItem('backup_userToken', data.token);
          await AsyncStorage.setItem('backup_userId', data.user.id);
          await AsyncStorage.setItem('backup_user', userDataString);
          await AsyncStorage.setItem('backup_testMode', 'true');
          
          // Timestamp
          await AsyncStorage.setItem('lastLoginTime', Date.now().toString());
          
          // Set user in context
          setUser(data.user);
          console.log('✅ Test mode user authenticated and stored in multiple locations:', data.user.id);
          return true;
        } else {
          console.log('❌ Test mode authentication failed - invalid response data');
          return false;
        }
      } else {
        console.log('❌ Test mode authentication failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error during test mode authentication:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log('✅ All storage cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
    }
  };

  const debugStorage = async () => {
    try {
      console.log('🔍 Debugging AsyncStorage contents...');
      
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📋 All storage keys:', allKeys);
      
      const authKeys = ['user', 'userToken', 'userId', 'testMode', 'backup_user', 'backup_userToken', 'backup_userId'];
      const authData: any = {};
      
      for (const key of authKeys) {
        const value = await AsyncStorage.getItem(key);
        authData[key] = value;
      }
      
      console.log('🔐 Authentication data in storage:', authData);
      
      return { allKeys, authData };
    } catch (error) {
      console.error('❌ Error debugging storage:', error);
      return null;
    }
  };

  const forceAuthCheck = async () => {
    console.log('🔄 Force triggering authentication check...');
    return await checkAuthStatus();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    checkAuthStatus,
    testModeLogin,
    clearAllStorage,
    debugStorage,
    forceAuthCheck,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 