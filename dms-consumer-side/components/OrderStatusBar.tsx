import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import io from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';

const SOCKET_URL = 'ws://localhost:5000'; // Change to your backend's WebSocket URL if needed

// You may want to get these from context or props in a real app
const ACTIVE_ORDER_ID = null; // Replace with logic to get the current active order ID
const DESTINATION = null; // Replace with logic to get the user's delivery address { latitude, longitude }

export default function OrderStatusBar({ orderId = ACTIVE_ORDER_ID, destination = DESTINATION }: { orderId?: string | null, destination?: { latitude: number; longitude: number } | null }) {
    const [show, setShow] = useState(false);
    const [status, setStatus] = useState('');
    const [eta, setEta] = useState('');
    const [deliveryLocation, setDeliveryLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [showMap, setShowMap] = useState(false);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        if (!orderId || !destination) return;
        socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
        if (socketRef.current) {
            socketRef.current.emit('subscribeOrder', { orderId });
            socketRef.current.on('orderStatus', (data: any) => {
                if (data && data.status) {
                    setStatus(data.status);
                    setShow(['out_for_delivery', 'on_the_way'].includes(data.status));
                }
                if (data && data.eta) setEta(data.eta);
            });
            socketRef.current.on('orderLocation', (data: any) => {
                if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
                    setDeliveryLocation({ latitude: data.latitude, longitude: data.longitude });
                }
            });
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.emit('unsubscribeOrder', { orderId });
                socketRef.current.disconnect();
            }
        };
    }, [orderId, destination]);

    const getStatusDisplay = () => {
        switch (status) {
            case 'pending':
                return { text: 'Confirming your order…', color: '#faad14', icon: 'time-outline' };
            case 'confirmed':
                return { text: 'Order confirmed, delivery partner assigned', color: '#52c41a', icon: 'checkmark-done-outline' };
            case 'delivery_picking_up':
                return { text: 'Delivery partner is picking up your order', color: '#1890ff', icon: 'bicycle-outline' };
            case 'picked_up':
                return { text: 'Order picked up', color: '#3b82f6', icon: 'bicycle-outline' };
            case 'out_for_delivery':
            case 'on_the_way':
                return { text: `On the way${eta ? ` • ETA: ${eta}` : ''}`, color: '#1890ff', icon: 'car-outline' };
            case 'delivered':
                return { text: 'Delivered', color: '#10b981', icon: 'checkmark-circle-outline' };
            default:
                return { text: status, color: '#888', icon: 'information-circle-outline' };
        }
    };

    const statusDisplay = getStatusDisplay();

    // Hide bar if delivered
    if (!show || status === 'delivered') return null;

    return (
        <>
            <View style={[styles.bar, { borderColor: statusDisplay.color, shadowColor: statusDisplay.color }]}>
                <View style={styles.leftSection}>
                    <Ionicons name={statusDisplay.icon as any} size={22} color={statusDisplay.color} style={{ marginRight: 8 }} />
                    <Text style={[styles.statusText, { color: statusDisplay.color }]}>{statusDisplay.text}</Text>
                </View>
                <TouchableOpacity style={styles.mapBtn} onPress={() => setShowMap(true)}>
                    <Text style={styles.mapBtnText}>Track</Text>
                </TouchableOpacity>
            </View>
            <Modal visible={showMap} animationType="slide" onRequestClose={() => setShowMap(false)}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center', marginTop: 16 }}>Track Delivery</Text>
                    <TouchableOpacity onPress={() => setShowMap(false)} style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
                        <Text style={{ color: '#1890ff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
                    </TouchableOpacity>
                    <MapView
                        style={{ flex: 1, marginTop: 40 }}
                        initialRegion={{
                            latitude: deliveryLocation?.latitude || destination?.latitude || 26.4478,
                            longitude: deliveryLocation?.longitude || destination?.longitude || 91.4411,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                    >
                        {deliveryLocation && typeof deliveryLocation.latitude === 'number' && typeof deliveryLocation.longitude === 'number' && !isNaN(deliveryLocation.latitude) && !isNaN(deliveryLocation.longitude) && (
                            <Marker
                                coordinate={deliveryLocation}
                                title="Delivery Partner"
                                pinColor="blue"
                            />
                        )}
                        {destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number' && (
                            <Marker
                                coordinate={destination}
                                title="Your Location"
                                pinColor="green"
                            />
                        )}
                        {deliveryLocation && destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number' && (
                            <Polyline
                                coordinates={[deliveryLocation, destination]}
                                strokeColor="#1890ff"
                                strokeWidth={4}
                            />
                        )}
                    </MapView>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    bar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 60, // above the tab bar
        backgroundColor: '#fff',
        borderTopWidth: 2,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100,
        elevation: 10,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 15,
        flexShrink: 1,
    },
    mapBtn: {
        backgroundColor: '#1890ff',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 22,
        marginLeft: 16,
        shadowColor: '#1890ff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    mapBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
}); 