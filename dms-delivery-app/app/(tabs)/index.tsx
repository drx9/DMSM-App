import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';
import { Link } from 'expo-router';
import { connectSocket, joinRoom, onSocketEvent, offSocketEvent } from '../services/socketService';

interface Order {
  id: string;
  customerName?: string;
  customer?: { name: string; phoneNumber: string };
  address?: string;
  status: string;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    pincode?: string;
  };
  totalAmount: number;
  products?: Array<{
    name: string;
    quantity: number;
    image?: string;
  }>;
}

const statusColors: Record<string, string> = {
  pending: '#059669',
  processing: '#059669',
  packed: '#047857',
  out_for_delivery: '#047857',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const statusLabels: Record<string, string> = {
  pending: 'PENDING',
  processing: 'PROCESSING',
  packed: 'PACKED',
  out_for_delivery: 'OUT FOR DELIVERY',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
};

export default function TabOneScreen() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/delivery/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token, fetchOrders]);

  useEffect(() => {
    if (!user) return;
    connectSocket();
    joinRoom(`user_${user.id}`);
    const handleAssignedOrder = () => {
      fetchOrders();
    };
    onSocketEvent('assigned_order', handleAssignedOrder);
    return () => {
      offSocketEvent('assigned_order', handleAssignedOrder);
    };
  }, [user, fetchOrders]);

  const getCustomerName = (order: Order) => {
    return order.customer?.name || order.customerName || 'Customer';
  };

  const getAddress = (order: Order) => {
    if (order.shippingAddress) {
      const { line1, line2, city, state, pincode } = order.shippingAddress;
      return `${line1}${line2 ? `, ${line2}` : ''}, ${city}${state ? `, ${state}` : ''}${pincode ? ` - ${pincode}` : ''}`;
    }
    return order.address || 'Address not available';
  };

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
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No orders assigned yet</Text>
          <Text style={styles.emptySubtext}>You'll see orders here once they're assigned to you</Text>
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
                    <Text style={styles.statusText}>{statusLabels[item.status] || item.status.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.customerName}>{getCustomerName(item)}</Text>

                <Text style={styles.address} numberOfLines={2}>
                  {getAddress(item)}
                </Text>

                {item.products && item.products.length > 0 && (
                  <View style={styles.productsContainer}>
                    <Text style={styles.productsLabel}>Items:</Text>
                    {item.products.slice(0, 2).map((product, index) => (
                      <Text key={index} style={styles.productItem}>
                        • {product.name} (x{product.quantity})
                      </Text>
                    ))}
                    {item.products.length > 2 && (
                      <Text style={styles.moreItems}>+{item.products.length - 2} more items</Text>
                    )}
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.amount}>₹{item.totalAmount}</Text>
                  <Text style={styles.tapHint}>Tap to view details</Text>
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
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  address: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  productsContainer: {
    marginBottom: 8,
  },
  productsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  productItem: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
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
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  emptySubtext: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
});