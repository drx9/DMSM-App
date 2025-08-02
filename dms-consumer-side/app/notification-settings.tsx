import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from './context/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';
import * as Notifications from 'expo-notifications';
import axios from 'axios';

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  type: 'order_updates' | 'promotions' | 'delivery' | 'general';
}

const NotificationSettingsScreen = () => {
  const router = useRouter();
  const { 
    hasPermission, 
    requestPermission, 
    sendTestNotification, 
    clearBadge,
    badgeCount 
  } = useNotifications();
  
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: '1',
      title: 'Order Updates',
      description: 'Get notified when your order status changes',
      enabled: true,
      type: 'order_updates'
    },
    {
      id: '2',
      title: 'Delivery Updates',
      description: 'Track your delivery in real-time',
      enabled: true,
      type: 'delivery'
    },
    {
      id: '3',
      title: 'Promotions & Offers',
      description: 'Receive exclusive deals and discounts',
      enabled: true,
      type: 'promotions'
    },
    {
      id: '4',
      title: 'General Updates',
      description: 'Important app updates and announcements',
      enabled: true,
      type: 'general'
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
      
      // Load saved preferences
      const savedPreferences = await AsyncStorage.getItem('notificationPreferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreference[]) => {
    try {
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handlePermissionRequest = async () => {
    setLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        Alert.alert(
          'Success',
          'Notifications enabled! You will now receive updates about your orders and promotions.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request notification permission');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting notification test...');
      console.log('User ID:', userId);
      
      // First try local test notification
      console.log('📱 Testing local notification...');
      await sendTestNotification();
      console.log('✅ Local notification sent successfully');
      
      // Then try backend test notification if user ID is available
      if (userId) {
        console.log('🌐 Testing backend notification...');
        try {
          const response = await fetch(`${API_URL}/users/test-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              title: 'Backend Test',
              message: 'This is a test notification from the backend!'
            })
          });
          
          console.log('Backend response status:', response.status);
          console.log('Backend response headers:', response.headers);
          
          const responseText = await response.text();
          console.log('Backend response text:', responseText);
          
          let responseData;
          try {
            responseData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            Alert.alert('Partial Success', `Local notification sent, but backend test failed: Invalid response format`);
            return;
          }
          
          console.log('Backend response data:', responseData);
          
          if (response.ok) {
            Alert.alert('Success', 'Both local and backend test notifications sent!');
            console.log('✅ Backend notification sent successfully');
          } else {
            Alert.alert('Partial Success', `Local notification sent, but backend test failed: ${responseData.message || 'Unknown error'}`);
            console.log('❌ Backend notification failed:', responseData);
          }
        } catch (backendError) {
          console.error('Backend test notification failed:', backendError);
          Alert.alert('Partial Success', 'Local notification sent, but backend test failed');
        }
      } else {
        Alert.alert('Success', 'Local test notification sent!');
        console.log('⚠️ No user ID found for backend test');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  const handleClearBadge = async () => {
    try {
      await clearBadge();
      Alert.alert('Success', 'Badge count cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear badge count');
    }
  };

  const togglePreference = (id: string) => {
    const newPreferences = preferences.map(pref => 
      pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
    );
    savePreferences(newPreferences);
  };

  const renderPermissionSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notification Permission</Text>
      <View style={styles.permissionCard}>
        <View style={styles.permissionInfo}>
          <Ionicons 
            name={hasPermission ? 'checkmark-circle' : 'alert-circle'} 
            size={24} 
            color={hasPermission ? '#10B981' : '#F59E0B'} 
          />
          <View style={styles.permissionText}>
            <Text style={styles.permissionTitle}>
              {hasPermission ? 'Notifications Enabled' : 'Notifications Disabled'}
            </Text>
            <Text style={styles.permissionDescription}>
              {hasPermission 
                ? 'You will receive notifications for order updates and promotions'
                : 'Enable notifications to stay updated with your orders'
              }
            </Text>
          </View>
        </View>
        {!hasPermission && (
          <TouchableOpacity 
            style={[styles.permissionButton, loading && styles.permissionButtonDisabled]}
            onPress={handlePermissionRequest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.permissionButtonText}>Enable</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPreferencesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notification Preferences</Text>
      {preferences.map((preference) => (
        <View key={preference.id} style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceTitle}>{preference.title}</Text>
            <Text style={styles.preferenceDescription}>{preference.description}</Text>
          </View>
          <Switch
            value={preference.enabled && hasPermission}
            onValueChange={() => togglePreference(preference.id)}
            disabled={!hasPermission}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            thumbColor={preference.enabled && hasPermission ? '#FFFFFF' : '#F3F4F6'}
          />
        </View>
      ))}
    </View>
  );

  const renderDebugSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Debug Info</Text>
      <View style={styles.debugCard}>
        <View style={styles.debugItem}>
          <Text style={styles.debugLabel}>Permission:</Text>
          <Text style={[styles.debugValue, { color: hasPermission ? '#10B981' : '#EF4444' }]}>
            {hasPermission ? 'Granted' : 'Denied'}
          </Text>
        </View>
        <View style={styles.debugItem}>
          <Text style={styles.debugLabel}>User ID:</Text>
          <Text style={styles.debugValue}>{userId || 'Not found'}</Text>
        </View>
        <View style={styles.debugItem}>
          <Text style={styles.debugLabel}>Badge Count:</Text>
          <Text style={styles.debugValue}>{badgeCount}</Text>
        </View>
      </View>
    </View>
  );

  const renderActionsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Actions</Text>
      
      <TouchableOpacity 
        style={[styles.actionButton, !hasPermission && styles.actionButtonDisabled]}
        onPress={handleTestNotification}
        disabled={!hasPermission || loading}
      >
        <Ionicons name="notifications-outline" size={20} color="#10B981" />
        <Text style={styles.actionButtonText}>Send Test Notification</Text>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </TouchableOpacity>



      <TouchableOpacity 
        style={[styles.actionButton, badgeCount === 0 && styles.actionButtonDisabled]}
        onPress={handleClearBadge}
        disabled={badgeCount === 0}
      >
        <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
        <Text style={styles.actionButtonText}>
          Clear Badge Count {badgeCount > 0 && `(${badgeCount})`}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderPermissionSection()}
        {renderDebugSection()}
        {renderPreferencesSection()}
        {renderActionsSection()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  permissionText: {
    flex: 1,
    marginLeft: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  preferenceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
  },
  debugCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  debugItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  debugLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  debugValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
});

export default NotificationSettingsScreen; 