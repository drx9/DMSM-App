'use client'
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import AddressManagerModal, { Address } from '../../components/AddressManagerModal';
import LocationSelectionScreen from '../location/LocationSelectionScreen';

const ProfileScreen = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [primaryAddress, setPrimaryAddress] = useState<Address | null>(null);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
      if (storedUserId) {
        fetchUser(storedUserId);
        fetchOrders(storedUserId);
        fetchAddresses(storedUserId);
      }
    };
    fetchUserData();
  }, []);

  const fetchUser = async (uid: string) => {
    setLoadingUser(true);
    try {
      const res = await axios.get(`${API_URL}/auth/user/${uid}`);
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

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
      const primary = res.data.find((a: Address) => a.isDefault) || res.data[0] || null;
      setPrimaryAddress(primary);
      if (primary) await AsyncStorage.setItem('userAddress', JSON.stringify(primary));
    } catch (err) {
      setAddresses([]);
      setPrimaryAddress(null);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await axios.post(`${API_URL}/addresses/set-default/${id}`);
      const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
      setAddresses(updated);
      const primary = updated.find(a => a.isDefault) || updated[0] || null;
      setPrimaryAddress(primary);
      if (primary) await AsyncStorage.setItem('userAddress', JSON.stringify(primary));
    } catch (err) {
      // handle error
    }
  };

  const handleAddAddress = async (address: Omit<Address, 'id' | 'isDefault'>) => {
    try {
      const uid = userId || (await AsyncStorage.getItem('userId'));
      const res = await axios.post(`${API_URL}/addresses`, { ...address, userId: uid });
      setAddresses(prev => [...prev, res.data]);
      if (addresses.length === 0) {
        // If first address, set as primary
        await handleSetPrimary(res.data.id);
      }
    } catch (err) {
      // handle error
    }
  };

  const handleEditAddress = async (id: string, address: Omit<Address, 'id' | 'isDefault'>) => {
    try {
      await axios.put(`${API_URL}/addresses/${id}`, address);
      setAddresses(prev => prev.map(a => (a.id === id ? { ...a, ...address } : a)));
    } catch (err) {
      // handle error
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/addresses/${id}`);
      const updated = addresses.filter(a => a.id !== id);
      setAddresses(updated);
      if (primaryAddress?.id === id) {
        const newPrimary = updated[0] || null;
        setPrimaryAddress(newPrimary);
        if (newPrimary) await handleSetPrimary(newPrimary.id);
        else await AsyncStorage.removeItem('userAddress');
      }
    } catch (err) {
      // handle error
    }
  };

  const handleLogout = async () => {
    // Clear all user-specific data
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('cartItems');
    await AsyncStorage.removeItem('userAddress');
    await AsyncStorage.removeItem('addressSet');
    // Optionally, clear any other user-specific keys here
    router.replace('/login');
  };

  const handleFeaturePress = (feature: any) => {
    if (feature.screen === 'order-updates') {
      router.push('/my-orders');
    } else if (feature.screen === 'saved-addresses') {
      router.push('/saved-addresses');
    } else if (feature.screen === 'account-details') {
      router.push('/account-details');
    } else if (feature.screen === 'customer-support') {
      router.push('/customer-support');
    } else if (feature.screen === 'wishlist') {
      router.push('/wishlist');
    } else if (feature.screen === 'payment-options') {
      router.push('/payment-options');
    } else if (feature.screen === 'add-gift-card') {
      router.push('/add-gift-card');
    } else {
      // Placeholder for other features
      console.log(`Navigating to ${feature.name}`);
    }
  };

  const handleRequestLocation = () => {
    setShowAddressManager(false);
    setShowLocationSelector(true);
  };

  const handleLocationSelected = async (address: any) => {
    setShowLocationSelector(false);
    await handleAddAddress(address);
    // Optionally, refresh addresses
    if (userId) fetchAddresses(userId);
  };

  const profileFeatures = [
    { id: 1, name: 'Account Details', icon: 'person-outline', screen: 'account-details' },
    { id: 2, name: 'Order Updates', icon: 'receipt-outline', screen: 'order-updates' },
    { id: 3, name: 'Customer Support', icon: 'headset-outline', screen: 'customer-support' },
    { id: 4, name: 'Saved Addresses', icon: 'location-outline', screen: 'saved-addresses' },
    { id: 5, name: 'Wishlist', icon: 'heart-outline', screen: 'wishlist' },
    { id: 6, name: 'Payment Options', icon: 'card-outline', screen: 'payment-options' },
    { id: 7, name: 'Add Gift Card', icon: 'gift-outline', screen: 'add-gift-card' },
  ];

  if (showLocationSelector) {
    return (
      <LocationSelectionScreen
        onLocationSelected={handleLocationSelected}
        userId={userId}
        onBack={() => setShowLocationSelector(false)}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { flex: 1, paddingTop: 16 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {/* User Profile Section */}
        {!loadingUser && user && (
          <View style={styles.userProfileSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={user.photo
                  ? { uri: user.photo }
                  : require('../../assets/images/dms-logo.png')}
                style={styles.avatar}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email || user.phoneNumber}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, user.isVerified ? styles.verified : styles.unverified]}>
                  <Text style={[styles.statusText, user.isVerified ? styles.verifiedText : styles.unverifiedText]}>
                    {user.isVerified ? 'Verified' : 'Unverified'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Profile Features */}
        <Text style={styles.sectionTitle}>Account</Text>
        {profileFeatures.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.featureItem}
            onPress={() => handleFeaturePress(feature)}
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  scrollViewContent: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CB202D',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    marginBottom: 8,
    elevation: 1,
    minWidth: 220,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
  },
  orderStatus: {
    fontSize: 12,
    color: '#1976D2',
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
  orderDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  orderItemsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 6,
    color: '#333',
  },
  orderItemText: {
    fontSize: 10,
    color: '#666',
  },
  addressCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    marginBottom: 8,
    elevation: 1,
    minWidth: 220,
  },
  addressLine: {
    fontSize: 12,
    color: '#333',
  },
  addressCountry: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  addAddressText: {
    color: '#CB202D',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  primaryLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  featureIcon: {
    marginRight: 15,
  },
  featureText: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  logoutButtonText: {
    fontSize: 12,
    color: '#CB202D',
    fontWeight: 'bold',
    marginLeft: 15,
  },
  userProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verified: {
    backgroundColor: '#E8F5E8',
  },
  unverified: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  verifiedText: {
    color: '#2E7D32',
  },
  unverifiedText: {
    color: '#F57C00',
  },
});

export default ProfileScreen; 