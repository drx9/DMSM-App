import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ProfileScreen = () => {
  const router = useRouter();

  const handleLogout = () => {
    // Implement logout logic here
    console.log('Logging out...');
    // Example: redirect to login screen
    router.replace('/login');
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  scrollViewContent: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    fontSize: 16,
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
    fontSize: 16,
    color: '#CB202D', // Zomato Red
    fontWeight: 'bold',
    marginLeft: 15,
  },
});

export default ProfileScreen; 