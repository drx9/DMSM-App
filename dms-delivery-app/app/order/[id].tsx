import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

interface Order {
  id: string;
  customerName: string;
  address: string;
  status: string;
  items: { name: string; quantity: number }[];
  total: number;
}

const statusColors: Record<string, string> = {
  pending: '#fbbf24', // amber-400
  picked_up: '#3b82f6', // blue-500
  delivered: '#10b981', // green-500
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${API_URL}/delivery/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(response.data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchOrder();
  }, [id, token]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await axios.put(
        `${API_URL}/delivery/orders/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrder((prev) => prev && { ...prev, status: newStatus });
      Alert.alert('Success', `Order marked as ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#10b981" />
      <Text style={{ marginTop: 12, color: '#888' }}>Loading order...</Text>
    </View>
  );
  if (!order) return <Text style={styles.centered}>Order not found.</Text>;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{order.customerName}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{order.address}</Text>
        </View>
        <View style={styles.sectionRow}>
          <Text style={styles.label}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] || '#ccc' }]}> 
            <Text style={styles.statusText}>{order.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Items</Text>
          {order.items.map((item, idx) => (
            <Text key={idx} style={styles.value}>• {item.name} x{item.quantity}</Text>
          ))}
        </View>
        <View style={styles.sectionRow}>
          <Text style={styles.label}>Total</Text>
          <Text style={[styles.value, { fontWeight: 'bold', fontSize: 18 }]}>₹{order.total}</Text>
        </View>
        <View style={{ height: 24 }} />
        {order.status === 'pending' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => updateStatus('picked_up')} disabled={updating}>
            <Text style={styles.actionBtnText}>{updating ? 'Updating...' : 'Mark as Picked Up'}</Text>
          </TouchableOpacity>
        )}
        {order.status === 'picked_up' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => updateStatus('delivered')} disabled={updating}>
            <Text style={styles.actionBtnText}>{updating ? 'Updating...' : 'Mark as Delivered'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f3f4f6',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#222',
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 16,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 10,
    padding: 4,
  },
  backBtnText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
}); 