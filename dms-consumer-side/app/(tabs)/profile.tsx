'use client'
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
import AddressManagerModal, { Address } from '../../components/AddressManagerModal';
import LocationSelectionScreen from '../location/LocationSelectionScreen';
import { ActivityIndicator } from 'react-native';
import { FlatList } from 'react-native';

const ProfileScreen = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [primaryAddress, setPrimaryAddress] = useState<Address | null>(null);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

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
      router.push('/my-orders' as any);
    } else if (feature.screen === 'saved-addresses') {
      router.push('/saved-addresses' as any);
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {/* Orders Section */}
        <Text style={styles.sectionTitle}>My Orders</Text>
        {loadingOrders ? (
          <ActivityIndicator size="small" color="#CB202D" />
        ) : orders.length === 0 ? (
          <Text style={styles.emptyText}>No orders found.</Text>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.orderCard}>
                <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
                <Text style={styles.orderStatus}>Status: {item.status}</Text>
                <Text style={styles.orderTotal}>Total: ₹{item.totalAmount}</Text>
                <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                <Text style={styles.orderItemsTitle}>Items:</Text>
                {item.items.map((orderItem: any) => (
                  <Text key={orderItem.id} style={styles.orderItemText}>
                    {orderItem.product?.name} x {orderItem.quantity}
                  </Text>
                ))}
              </View>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
          />
        )}
        {/* Addresses Section */}
        <Text style={styles.sectionTitle}>Saved Addresses</Text>
        <TouchableOpacity style={styles.addAddressButton} onPress={() => setShowAddressManager(true)}>
          <Ionicons name="location-outline" size={20} color="#CB202D" />
          <Text style={styles.addAddressText}>Manage Addresses</Text>
        </TouchableOpacity>
        <FlatList
          data={addresses}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.addressCard}>
              <Text style={styles.addressLine}>{item.line1}, {item.city}, {item.state}, {item.postalCode}</Text>
              <Text style={styles.addressCountry}>{item.country}</Text>
              {item.isDefault && <Text style={styles.primaryLabel}>Primary</Text>}
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        />
        <AddressManagerModal
          visible={showAddressManager}
          onClose={() => setShowAddressManager(false)}
          addresses={addresses}
          onSetPrimary={handleSetPrimary}
          onAdd={handleAddAddress}
          onEdit={handleEditAddress}
          onDelete={handleDeleteAddress}
          loading={loadingAddresses}
          onRequestLocation={handleRequestLocation}
        />
        {/* Profile Features */}
        <Text style={styles.sectionTitle}>Account</Text>
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