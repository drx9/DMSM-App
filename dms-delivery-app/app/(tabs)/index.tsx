import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
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
  pending: '#059669', // emerald-600
  picked_up: '#047857', // emerald-700
  delivered: '#10b981', // emerald-500
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
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/dms-logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.greeting}>Hi, {user ? user.name?.split(' ')[0] : 'Driver'}!</Text>
        <Text style={styles.subtitle}>Today's Orders</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#10b981" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No orders yet</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/order/[id]', params: { id: item.id } }} asChild>
              <TouchableOpacity activeOpacity={0.8} style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.orderId}>#{item.id.slice(-4)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#10b981' }]}>
                    <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.address} numberOfLines={2}>
                  {item.shippingAddress?.line1} {item.shippingAddress?.line2}, {item.shippingAddress?.city}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.amount}>₹{item.totalAmount}</Text>
                  <Text style={styles.tapHint}>Tap to view</Text>
                </View>
              </TouchableOpacity>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#10b981',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 32,
    height: 32,
    tintColor: '#fff',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#d1fae5',
    textAlign: 'center',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  address: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  tapHint: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
});