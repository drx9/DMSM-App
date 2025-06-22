import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

const ProfileScreen = () => {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear the authentication token
              await AsyncStorage.removeItem('userToken');
              console.log('Logged out successfully');
              // Navigate to login screen
              router.replace('/login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleFeaturePress = (feature: any) => {
    switch (feature.screen) {
      case 'account-details':
        router.push('/account-details');
        break;
      case 'order-updates':
        // TODO: Navigate to order updates
        console.log('Navigate to order updates');
        break;
      case 'customer-support':
        // TODO: Navigate to customer support
        console.log('Navigate to customer support');
        break;
      case 'saved-addresses':
        // TODO: Navigate to saved addresses
        console.log('Navigate to saved addresses');
        break;
      case 'wishlist':
        // TODO: Navigate to wishlist
        console.log('Navigate to wishlist');
        break;
      case 'payment-options':
        // TODO: Navigate to payment options
        console.log('Navigate to payment options');
        break;
      case 'add-gift-card':
        // TODO: Navigate to add gift card
        console.log('Navigate to add gift card');
        break;
      default:
        console.log(`Navigating to ${feature.name}`);
    }
  };

  const profileFeatures = [
    { id: 1, name: 'Account Details', icon: 'person-outline', screen: 'account-details', color: '#CB202D' },
    { id: 2, name: 'My Orders', icon: 'receipt-outline', screen: 'order-updates', color: '#FF6B35' },
    { id: 3, name: 'Customer Support', icon: 'headset-outline', screen: 'customer-support', color: '#4CAF50' },
    { id: 4, name: 'Saved Addresses', icon: 'location-outline', screen: 'saved-addresses', color: '#2196F3' },
    { id: 5, name: 'Wishlist', icon: 'heart-outline', screen: 'wishlist', color: '#E91E63' },
    { id: 6, name: 'Payment Options', icon: 'card-outline', screen: 'payment-options', color: '#9C27B0' },
    { id: 7, name: 'Gift Cards', icon: 'gift-outline', screen: 'add-gift-card', color: '#FF9800' },
    { id: 8, name: 'Notifications', icon: 'notifications-outline', screen: 'notifications', color: '#607D8B' },
    { id: 9, name: 'Help & FAQ', icon: 'help-circle-outline', screen: 'help', color: '#795548' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      {/* Top SafeArea for header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#CB202D', flex: 0 }}>
        <StatusBar barStyle="light-content" backgroundColor="#CB202D" />
        <View style={[styles.header, { backgroundColor: '#CB202D' }]}> 
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
      </SafeAreaView>
      {/* Main content */}
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={40} color="#FFFFFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Welcome User</Text>
            <Text style={styles.userEmail}>user@example.com</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={20} color="#CB202D" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickActionCard}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="receipt" size={24} color="#CB202D" />
                </View>
                <Text style={styles.quickActionText}>My Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="heart" size={24} color="#CB202D" />
                </View>
                <Text style={styles.quickActionText}>Wishlist</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="location" size={24} color="#CB202D" />
                </View>
                <Text style={styles.quickActionText}>Addresses</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="card" size={24} color="#CB202D" />
                </View>
                <Text style={styles.quickActionText}>Payments</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Profile Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            {profileFeatures.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={styles.featureItem}
                onPress={() => handleFeaturePress(feature)}
              >
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}> 
                  <Ionicons name={feature.icon as any} size={20} color={feature.color} />
                </View>
                <Text style={styles.featureText}>{feature.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
              </TouchableOpacity>
            ))}
          </View>
          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#CB202D" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>DMS Mart v1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#CB202D',
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#CB202D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
  },
  editButton: {
    padding: 8,
  },
  scrollViewContent: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickActionCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#CB202D',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999999',
  },
});

export default ProfileScreen; 