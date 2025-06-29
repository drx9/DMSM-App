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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    AsyncStorage.removeItem('userId');
    router.replace('/login');
  };

  const handleFeaturePress = (feature: any) => {
    if (feature.screen === 'order-updates') {
      router.push('/my-orders');
    } else if (feature.screen === 'saved-addresses') {
      router.push('/saved-addresses');
    } else {
      // Placeholder for other features
      console.log(`Navigating to ${feature.name}`);
    }
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
        {loadingAddresses ? (
          <ActivityIndicator size="small" color="#CB202D" />
        ) : addresses.length === 0 ? (
          <Text style={styles.emptyText}>No addresses found.</Text>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.addressCard}>
                <Text style={styles.addressLine}>{item.line1}, {item.city}, {item.state}, {item.postalCode}</Text>
                <Text style={styles.addressCountry}>{item.country}</Text>
                <TouchableOpacity style={styles.changeButton} onPress={() => setShowAddressModal(true)}>
                  <Text style={styles.changeButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
          />
        )}
        <TouchableOpacity style={styles.addAddressButton} onPress={() => setShowAddressModal(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#CB202D" />
          <Text style={styles.addAddressText}>Add New Address</Text>
        </TouchableOpacity>
        {/* Address Modal */}
        <Modal visible={showAddressModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Address Line 1"
                value={newAddress.line1}
                onChangeText={text => setNewAddress({ ...newAddress, line1: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="City"
                value={newAddress.city}
                onChangeText={text => setNewAddress({ ...newAddress, city: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="State"
                value={newAddress.state}
                onChangeText={text => setNewAddress({ ...newAddress, state: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Postal Code"
                value={newAddress.postalCode}
                onChangeText={text => setNewAddress({ ...newAddress, postalCode: text })}
                keyboardType="numeric"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={() => setShowAddressModal(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={handleAddAddress} disabled={addingAddress}>
                  <Text style={styles.modalButtonText}>{addingAddress ? 'Adding...' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  changeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  changeButtonText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CB202D',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 13,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#CB202D',
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
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
});

export default ProfileScreen; 