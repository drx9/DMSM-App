import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

const ProfileScreen = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({ line1: '', city: '', state: '', postalCode: '', country: 'India' });
  const [addingAddress, setAddingAddress] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
      if (storedUserId) {
        fetchOrders(storedUserId);
        fetchAddresses(storedUserId);
      }
    };
    fetchUserData();
  }, []);

  const fetchOrders = async (uid: string) => {
    setLoadingOrders(true);
    try {
      const res = await axios.get(`${API_URL}/orders/user/${uid}`);
      setOrders(res.data);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAddresses = async (uid: string) => {
    setLoadingAddresses(true);
    try {
      const res = await axios.get(`${API_URL}/addresses/${uid}`);
      setAddresses(res.data);
    } catch (err) {
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddAddress = async () => {
    if (!userId) return;
    setAddingAddress(true);
    try {
      const res = await axios.post(`${API_URL}/addresses`, { ...newAddress, userId });
      setAddresses(prev => [...prev, res.data]);
      setShowAddressModal(false);
      setNewAddress({ line1: '', city: '', state: '', postalCode: '', country: 'India' });
    } catch (err) {
      // handle error
    } finally {
      setAddingAddress(false);
    }
  };

  const handleLogout = () => {
    // Implement logout logic here
    console.log('Logging out...');
    // Example: redirect to login screen
    router.replace('/login');
  };

  const handleFeaturePress = (feature: any) => {
    if (feature.screen === 'order-updates') {
      router.push('/my-orders' as any);
    } else if (feature.screen === 'saved-addresses') {
      router.push('/saved-addresses' as any);
    } else {
      // Placeholder for other features
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {profileFeatures.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.featureItem}
            onPress={() => console.log(`Navigating to ${feature.name}`)} // Replace with actual navigation
          >
            <Ionicons name={feature.icon as any} size={24} color="#333" style={styles.featureIcon} />
            <Text style={styles.featureText}>{feature.name}</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#CB202D" style={styles.featureIcon} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    fontSize: 20,
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
    color: '#333',
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
    color: '#CB202D', // Zomato Red
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