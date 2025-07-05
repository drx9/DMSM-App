import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Metrics {
  totalOrders: number;
  totalKms: number;
  payout: number;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function TabTwoScreen() {
  const { user, logout, token } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return;
      try {
        const res = await axios.get(`${API_URL}/orders/delivery-boys/${user.id}/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMetrics(res.data);
      } catch {
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };
    if (user && token) fetchMetrics();
  }, [user, token]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: 32,
          backgroundColor: '#f3f4f6',
          alignItems: 'center',
          flexGrow: 1,
        }}
      >
        <View style={styles.card}>
          {user && (
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
              </View>
            </View>
          )}
          <Text style={styles.title}>Profile</Text>
          {user && (
            <>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{user.name}</Text>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{user?.phoneNumber ? user.phoneNumber : '-'}</Text>
            </>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.card}>
          <Text style={styles.title}>Metrics</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : metrics ? (
            <>
              <View style={styles.metricRow}>
                <FontAwesome name="check-circle" size={20} color="#10b981" style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Total Deliveries</Text>
                <Text style={styles.metricValue}>{metrics.totalOrders}</Text>
              </View>
              <View style={styles.metricRow}>
                <FontAwesome name="road" size={20} color="#3b82f6" style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Total KMs</Text>
                <Text style={styles.metricValue}>{metrics.totalKms}</Text>
              </View>
              <View style={styles.metricRow}>
                <FontAwesome name="money" size={20} color="#fbbf24" style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Earnings</Text>
                <Text style={[styles.metricValue, { color: '#10b981', fontWeight: 'bold' }]}>₹{metrics.payout}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.value}>No metrics available.</Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: '#f3f4f6',
    padding: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '90%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 24,
    marginBottom: 8,
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
    color: '#222',
    textAlign: 'center',
  },
  label: {
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginVertical: 6,
  },
  metricIcon: {
    marginRight: 10,
  },
  metricLabel: {
    color: '#374151',
    fontSize: 15,
    flex: 1,
  },
  metricValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    minWidth: 40,
    textAlign: 'right',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
    width: '90%',
    maxWidth: 420,
  },
  logoutBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  divider: {
    width: '90%',
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
    borderRadius: 1,
  },
});
