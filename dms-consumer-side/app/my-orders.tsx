import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, StatusBar, TouchableOpacity, Modal, TextInput } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';
import MapView, { Marker, Polyline } from 'react-native-maps';
import io from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'wss://dmsm-app-production-a35d.up.railway.app'; // Use backend's WebSocket URL

const MyOrdersScreen = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [showMapModal, setShowMapModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [deliveryLocation, setDeliveryLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [liveStatus, setLiveStatus] = useState<string | null>(null);
    const pollingRef = useRef<any>(null);
    const socketRef = useRef<any>(null);

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
                setFilteredOrders(res.data);
            } catch (err) {
                setError('Failed to fetch orders.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [searchQuery, selectedFilter, orders]);

    const filterOrders = () => {
        let filtered = orders;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(order =>
                order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.items.some((item: any) =>
                    item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        }

        // Filter by status
        if (selectedFilter !== 'all') {
            filtered = filtered.filter(order => order.status === selectedFilter);
        }

        setFilteredOrders(filtered);
    };

    useEffect(() => {
        if (showMapModal && selectedOrder) {
            socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
            socketRef.current.emit('subscribeOrder', { orderId: selectedOrder.id });
            socketRef.current.on('orderLocation', (data: any) => {
                if (data && data.latitude && data.longitude) {
                    setDeliveryLocation({ latitude: data.latitude, longitude: data.longitude });
                }
            });
            socketRef.current.on('orderStatus', (data: any) => {
                if (data && data.status) {
                    setLiveStatus(data.status);
                }
            });
            return () => {
                if (socketRef.current) {
                    socketRef.current.emit('unsubscribeOrder', { orderId: selectedOrder.id });
                    socketRef.current.disconnect();
                }
                setDeliveryLocation(null);
                setLiveStatus(null);
            };
        } else {
            setDeliveryLocation(null);
            setLiveStatus(null);
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        }
    }, [showMapModal, selectedOrder]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#FF9500';
            case 'confirmed': return '#34C759';
            case 'out_for_delivery': return '#007AFF';
            case 'delivered': return '#10B981';
            case 'cancelled': return '#FF3B30';
            default: return '#8E8E93';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Confirming';
            case 'confirmed': return 'Confirmed';
            case 'out_for_delivery': return 'On the way';
            case 'delivered': return 'Delivered';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getFullYear()}`;
    };

    const renderOrderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                    <Text style={styles.orderTitle}>
                        {item.items[0]?.product?.name || 'Order'}
                        {item.items.length > 1 && ` +${item.items.length - 1} more`}
                    </Text>
                    <Text style={styles.orderSubtitle}>
                        {getStatusText(liveStatus || item.status)} • {formatDate(item.createdAt)}
                    </Text>
                </View>
                <Text style={styles.orderAmount}>₹{item.totalAmount}</Text>
            </View>

            <View style={[styles.statusContainer, { backgroundColor: getStatusColor(liveStatus || item.status) + '15' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(liveStatus || item.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(liveStatus || item.status) }]}>
                    {getStatusText(liveStatus || item.status)}
                </Text>
                {(liveStatus || item.status) === 'out_for_delivery' && (
                    <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => { setSelectedOrder(item); setShowMapModal(true); }}
                    >
                        <Text style={styles.trackButtonText}>Track</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.orderDetails}>
                Order ID: #{item.id.slice(-8)} • {item.items.length} item{item.items.length > 1 ? 's' : ''}
            </Text>

            {item.deliveryKey && (
                <Text style={{ fontWeight: 'bold', color: '#10b981', marginTop: 4 }}>
                    Delivery Code: {item.deliveryKey}
                </Text>
            )}
        </TouchableOpacity>
    );

    const FilterModal = () => (
        <Modal visible={showFilters} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.filterModal}>
                    <View style={styles.filterHeader}>
                        <Text style={styles.filterTitle}>Filters</Text>
                        <TouchableOpacity onPress={() => setShowFilters(false)}>
                            <Text style={styles.closeButton}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.filterOptions}>
                        {[
                            { key: 'all', label: 'All Orders' },
                            { key: 'pending', label: 'Pending' },
                            { key: 'confirmed', label: 'Confirmed' },
                            { key: 'out_for_delivery', label: 'Out for Delivery' },
                            { key: 'delivered', label: 'Delivered' },
                            { key: 'cancelled', label: 'Cancelled' }
                        ].map((filter) => (
                            <TouchableOpacity
                                key={filter.key}
                                style={[styles.filterOption, selectedFilter === filter.key && styles.selectedFilter]}
                                onPress={() => setSelectedFilter(filter.key)}
                            >
                                <Text style={[styles.filterOptionText, selectedFilter === filter.key && styles.selectedFilterText]}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Orders</Text>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search your orders here"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#8E8E93"
                    />
                </View>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilters(true)}
                >
                    <Text style={styles.filterIcon}>≡</Text>
                    <Text style={styles.filterText}>Filters</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#34C759" />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : filteredOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No orders found</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={item => item.id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Map Modal */}
            <Modal visible={showMapModal} animationType="slide" onRequestClose={() => setShowMapModal(false)}>
                <View style={styles.mapModalContainer}>
                    <View style={styles.mapHeader}>
                        <Text style={styles.mapTitle}>Track Delivery</Text>
                        <TouchableOpacity onPress={() => setShowMapModal(false)}>
                            <Text style={styles.mapCloseButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: deliveryLocation?.latitude || 26.4478,
                            longitude: deliveryLocation?.longitude || 91.4411,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                    >
                        {deliveryLocation &&
                            typeof deliveryLocation.latitude === 'number' &&
                            typeof deliveryLocation.longitude === 'number' &&
                            !isNaN(deliveryLocation.latitude) &&
                            !isNaN(deliveryLocation.longitude) && (
                                <Marker
                                    coordinate={deliveryLocation}
                                    title="Delivery Partner"
                                    pinColor="blue"
                                />
                            )}
                        {selectedOrder?.shippingAddress && (
                            <Marker
                                coordinate={{
                                    latitude: selectedOrder.shippingAddress.latitude,
                                    longitude: selectedOrder.shippingAddress.longitude,
                                }}
                                title="Your Location"
                                pinColor="green"
                            />
                        )}
                        {deliveryLocation && selectedOrder?.shippingAddress && (
                            <Polyline
                                coordinates={[
                                    deliveryLocation,
                                    {
                                        latitude: selectedOrder.shippingAddress.latitude,
                                        longitude: selectedOrder.shippingAddress.longitude,
                                    },
                                ]}
                                strokeColor="#34C759"
                                strokeWidth={3}
                            />
                        )}
                    </MapView>
                </View>
            </Modal>

            <FilterModal />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1D1D1F',
        textAlign: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 36,
    },
    searchIcon: {
        fontSize: 14,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1D1D1F',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 36,
        gap: 4,
    },
    filterIcon: {
        fontSize: 16,
        color: '#007AFF',
    },
    filterText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    errorText: {
        fontSize: 14,
        color: '#FF3B30',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderInfo: {
        flex: 1,
        marginRight: 12,
    },
    orderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1D1D1F',
        marginBottom: 4,
    },
    orderSubtitle: {
        fontSize: 12,
        color: '#8E8E93',
    },
    orderAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1D1D1F',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    trackButton: {
        backgroundColor: '#34C759',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    trackButtonText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    orderDetails: {
        fontSize: 11,
        color: '#8E8E93',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    filterModal: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        maxHeight: '70%',
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    filterTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1D1D1F',
    },
    closeButton: {
        fontSize: 16,
        color: '#34C759',
        fontWeight: '500',
    },
    filterOptions: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    filterOption: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    selectedFilter: {
        backgroundColor: '#34C759' + '15',
    },
    filterOptionText: {
        fontSize: 16,
        color: '#1D1D1F',
    },
    selectedFilterText: {
        color: '#34C759',
        fontWeight: '500',
    },
    mapModalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    mapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    mapTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1D1D1F',
    },
    mapCloseButton: {
        fontSize: 18,
        color: '#8E8E93',
        fontWeight: '500',
    },
    map: {
        flex: 1,
    },
});

export default MyOrdersScreen;