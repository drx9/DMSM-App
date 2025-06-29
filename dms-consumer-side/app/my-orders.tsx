import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const MyOrdersScreen = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            const storedUserId = await AsyncStorage.getItem('userId');
            setUserId(storedUserId);
            if (!storedUserId) {
                setError('Please log in to view your orders.');
                setLoading(false);
                return;
            }
            try {
                const res = await axios.get(`${API_URL}/orders/user/${storedUserId}`);
                setOrders(res.data);
            } catch (err) {
                setError('Failed to fetch orders.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <Text style={styles.header}>My Orders</Text>
            {loading ? (
                <ActivityIndicator size="small" color="#CB202D" />
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
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
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#CB202D',
        marginBottom: 16,
        textAlign: 'center',
    },
    errorText: {
        color: '#CB202D',
        textAlign: 'center',
        marginTop: 20,
    },
    emptyText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
    },
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
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
});

export default MyOrdersScreen; 