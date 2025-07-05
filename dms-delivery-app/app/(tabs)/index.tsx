import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';
import { Link } from 'expo-router';

interface Order {
  id: string;
  customerName: string;
  address: string;
  status: string;
  shippingAddress?: {
    line1: string;
    line2: string;
    city: string;
  };
  totalAmount: number;
}

const statusColors: Record<string, string> = {
  pending: '#fbbf24', // amber-400
  picked_up: '#3b82f6', // blue-500
  delivered: '#10b981', // green-500
};

export default function TabOneScreen() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setError(null);
        const response = await axios.get(`${API_URL}/delivery/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data);
      } catch (err) {
        setError('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchOrders();
    }
  }, [token]);

  return (
    <View style={styles.bg}>
      <View style={styles.headerCard}>
        <Image source={require('../../assets/images/dms-logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>
          Welcome, {user ? user.name : 'Delivery Hero'}!
        </Text>
        <Text style={styles.subtitle}>Your Assigned Orders</Text>
      </View>
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#10b981" /><Text style={{marginTop: 10, color: '#888'}}>Loading orders...</Text></View>
      ) : error ? (
        <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}><Text style={styles.emptyText}>No orders assigned yet.</Text></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/order/[id]', params: { id: item.id } }} asChild>
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.customerName}>Order #{item.id.slice(0, 6)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#ccc' }]}> 
                    <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.address}>
                  {item.shippingAddress?.line1} {item.shippingAddress?.line2}, {item.shippingAddress?.city}
                </Text>
                <Text style={styles.amount}>Total: ₹{item.totalAmount}</Text>
              </View>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 0,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    margin: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  customerName: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#222',
  },
  address: {
    color: '#444',
    fontSize: 15,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  amount: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 2,
  },
});
