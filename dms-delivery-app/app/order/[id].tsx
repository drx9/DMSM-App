import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Image, Linking, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import Modal from 'react-native-modal';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import polyline from '@mapbox/polyline';
import * as Speech from 'expo-speech';
import scootyImg from '../../assets/images/scooty.png';
import Constants from 'expo-constants';

interface Order {
  id: string;
  customerName?: string;
  customer?: { name: string };
  address?: string;
  shippingAddress?: {
    latitude: number;
    longitude: number;
    line1: string;
    city: string;
  };
  status: string;
  items?: { name?: string; product?: { name: string }; quantity: number }[];
  products?: { name?: string; product?: { name: string }; quantity: number }[];
  total?: number;
  totalAmount?: number;
}

const statusColors: Record<string, string> = {
  pending: '#059669', // emerald-600
  picked_up: '#047857', // emerald-700
  delivered: '#10b981', // emerald-500
  processing: '#059669',
  out_for_delivery: '#047857',
};

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || Constants.manifest?.extra?.GOOGLE_MAPS_API_KEY;

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [arrived, setArrived] = useState(false);
  const locationWatcher = useRef<any>(null);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [showMarkDelivered, setShowMarkDelivered] = useState(false);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [navigationReady, setNavigationReady] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [deliveryKeyInput, setDeliveryKeyInput] = useState('');

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

  const updateStatus = async (newStatus: string, deliveryKey?: string) => {
    setUpdating(true);
    try {
      await axios.put(
        `${API_URL}/delivery/orders/${id}/status`,
        deliveryKey ? { status: newStatus, deliveryKey } : { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrder((prev) => prev && { ...prev, status: newStatus });
      Alert.alert('Success', `Order marked as ${newStatus.replace('_', ' ')}`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartNavigation = async () => {
    setNavigationStarted(true);
    setShowMap(true);
    setModalVisible(false);
    setNavigationReady(false);
    let location = await getLocationSafe();
    const currentLoc = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setCurrentLocation(currentLoc);
    if (order?.shippingAddress) {
      const origin = `${currentLoc.latitude},${currentLoc.longitude}`;
      const destination = `${order.shippingAddress.latitude},${order.shippingAddress.longitude}`;
      try {
        const directionsRes = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const directionsJson = await directionsRes.json();
        if (directionsJson.routes.length) {
          const points = directionsJson.routes[0].overview_polyline.points;
          const coords = polyline.decode(points).map(([lat, lng]: [number, number]) => ({ latitude: lat, longitude: lng }));
          setRouteCoords(coords);
          const newSteps = directionsJson.routes[0].legs[0].steps.map((step: any) => step.html_instructions.replace(/<[^>]+>/g, ''));
          setSteps(newSteps);
          setEta(directionsJson.routes[0].legs[0].duration.text);
          setDistance(directionsJson.routes[0].legs[0].distance.text);
          setCurrentStepIndex(0);
          setNavigationReady(true);
          if (newSteps.length > 0) {
            Speech.speak(newSteps[0]);
          }
        } else {
          setRouteCoords([]);
          setSteps([]);
          setEta('');
          setDistance('');
          setNavigationReady(false);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch directions from Google.');
        setRouteCoords([]);
        setSteps([]);
        setEta('');
        setDistance('');
        setNavigationReady(false);
      }
    }
    if (locationWatcher.current) locationWatcher.current.remove();
    locationWatcher.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
      (loc: { coords: { latitude: number; longitude: number } }) => {
        const newLoc = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setCurrentLocation(newLoc);
        if (order?.shippingAddress) {
          const dist = getDistance(newLoc, {
            latitude: order.shippingAddress.latitude,
            longitude: order.shippingAddress.longitude,
          });
          if (dist < 30 && !arrived) {
            setArrived(true);
            setShowMarkDelivered(true);
            Alert.alert('Arrived!', 'You have reached the delivery location.');
          }
        }
        if (steps.length > 0 && navigationReady) {
          const nextStepIdx = currentStepIndex + 1;
          if (nextStepIdx < routeCoords.length) {
            const stepLoc = routeCoords[nextStepIdx];
            const distToStep = getDistance(newLoc, stepLoc);
            if (distToStep < 30) {
              setCurrentStepIndex(nextStepIdx);
              if (steps[nextStepIdx]) {
                Speech.speak(steps[nextStepIdx]);
              }
            }
          }
        }
      }
    );
  };

  const acceptOrder = async () => {
    await updateStatus('picked_up');
  };

  const markAsDelivered = async () => {
    if (!deliveryKeyInput || deliveryKeyInput.length !== 4) {
      Alert.alert('Error', 'Please enter the 4-digit delivery code from the customer.');
      return;
    }
    await updateStatus('delivered', deliveryKeyInput);
    setShowMarkDelivered(false);
    Alert.alert('Delivered!', 'Order marked as delivered.');
    router.back();
  };

  const openInGoogleMaps = () => {
    if (order?.shippingAddress?.latitude && order?.shippingAddress?.longitude) {
      const { latitude, longitude } = order.shippingAddress;
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Error', 'No delivery location found');
    }
  };

  function getDistance(loc1: { latitude: number; longitude: number }, loc2: { latitude: number; longitude: number }) {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6378137;
    const dLat = toRad(loc2.latitude - loc1.latitude);
    const dLong = toRad(loc2.longitude - loc1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(loc1.latitude)) *
      Math.cos(toRad(loc2.latitude)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }

  async function getLocationSafe() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this feature. Please enable it in your device settings.'
        );
        return null;
      }
      let location = await Location.getCurrentPositionAsync({});
      return location;
    } catch (error) {
      Alert.alert(
        'Location Error',
        'Could not get your location. Please try again or check your device settings.'
      );
      return null;
    }
  }

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="small" color="#10b981" />
      <Text style={styles.loadingText}>Loading order...</Text>
    </View>
  );
  if (!order) return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>Order not found</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Modal isVisible={modalVisible} onBackdropPress={() => setModalVisible(false)} style={styles.modal}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Order #{order.id.slice(-4)}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Customer</Text>
              <Text style={styles.infoText}>{order.customer?.name || order.customerName || 'N/A'}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <Text style={styles.infoText}>{order.shippingAddress?.line1 || order.address || 'N/A'}</Text>
              {order.shippingAddress?.city && (
                <Text style={styles.infoText}>{order.shippingAddress.city}</Text>
              )}
            </View>

            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] || '#10b981' }]}>
                <Text style={styles.statusText}>{order.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Items</Text>
              {(order.products || order.items || []).map((item: any, idx: number) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemText}>• {item.name || item.product?.name || 'Product'}</Text>
                  <Text style={styles.itemQty}>×{item.quantity}</Text>
                </View>
              ))}
            </View>

            <View style={styles.totalSection}>
              <Text style={styles.sectionTitle}>Total Amount</Text>
              <Text style={styles.totalAmount}>₹{order.totalAmount || order.total || 'N/A'}</Text>
            </View>

            <View style={styles.actionSection}>
              {(order.status === 'pending' || order.status === 'processing') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={acceptOrder}
                  disabled={updating}
                >
                  <Text style={styles.actionBtnText}>
                    {updating ? 'Accepting...' : 'Accept Order'}
                  </Text>
                </TouchableOpacity>
              )}

              {(order.status === 'picked_up' || order.status === 'out_for_delivery') && !navigationStarted && (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.navigateBtn]}
                    onPress={handleStartNavigation}
                    disabled={updating}
                  >
                    <Text style={styles.actionBtnText}>
                      {updating ? 'Starting...' : 'Start Navigation'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.gmapBtn]}
                    onPress={openInGoogleMaps}
                  >
                    <Text style={styles.actionBtnText}>Open in Google Maps</Text>
                  </TouchableOpacity>
                </>
              )}

              {(order.status === 'picked_up' || order.status === 'out_for_delivery') && (
                <View style={styles.otpRow}>
                  <TextInput
                    style={styles.otpInput}
                    value={deliveryKeyInput}
                    onChangeText={setDeliveryKeyInput}
                    maxLength={4}
                    keyboardType="number-pad"
                    placeholder="____"
                  />
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deliverBtn]}
                    onPress={markAsDelivered}
                    disabled={updating}
                  >
                    <Text style={styles.actionBtnText}>{updating ? 'Delivering...' : 'Deliver'}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {(order.status === 'picked_up' || order.status === 'out_for_delivery') && navigationStarted && (
                <View style={styles.navigationStatus}>
                  <Text style={styles.navigationText}>✓ Navigation Active</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {showMarkDelivered && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Enter 4-digit Delivery Code from Customer</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, fontSize: 18, letterSpacing: 8, textAlign: 'center', marginBottom: 8 }}
                value={deliveryKeyInput}
                onChangeText={setDeliveryKeyInput}
                maxLength={4}
                keyboardType="number-pad"
                placeholder="____"
              />
            </View>
          )}
        </View>
      </Modal>

      {!navigationReady && (
        <View style={styles.routeHeader}>
          <View style={styles.routeCard}>
            <Text style={styles.routeTitle}>
              {eta ? `${eta} (${distance})` : 'Ready to Navigate'}
            </Text>
            <Text style={styles.routeSubtitle}>Tap to start navigation</Text>
            <TouchableOpacity style={styles.startBtn} onPress={handleStartNavigation}>
              <Text style={styles.startBtnText}>Start Route</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {navigationStarted && navigationReady && (
        <View style={styles.routeHeader}>
          <View style={styles.routeCard}>
            <Text style={styles.routeTitle}>
              {eta ? `${eta} (${distance})` : 'Navigating...'}
            </Text>
            <Text style={styles.routeSubtitle}>Following route to destination</Text>
          </View>
        </View>
      )}

      {showMap && order.shippingAddress && currentLocation && (
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker coordinate={currentLocation} title="Your Location">
              <Image source={scootyImg} style={{ width: 32, height: 32 }} />
            </Marker>
            <Marker
              coordinate={{
                latitude: order.shippingAddress.latitude,
                longitude: order.shippingAddress.longitude,
              }}
              title="Delivery Address"
              pinColor="#10b981"
            />
            {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor="#10b981"
                strokeWidth={3}
              />
            )}
          </MapView>

          {steps.length > 0 && (
            <View style={styles.directionsPanel}>
              <Text style={styles.directionsTitle}>Directions</Text>
              <ScrollView style={styles.directionsScroll} showsVerticalScrollIndicator={false}>
                {steps.map((step, idx) => (
                  <Text key={idx} style={styles.directionStep}>
                    {idx + 1}. {step}
                  </Text>
                ))}
              </ScrollView>
            </View>
          )}

          {arrived && (
            <View style={styles.arrivedPanel}>
              <Text style={styles.arrivedTitle}>🎯 Arrived at Destination!</Text>
              {showMarkDelivered && (
                <TouchableOpacity style={styles.deliveredBtn} onPress={markAsDelivered}>
                  <Text style={styles.deliveredBtnText}>Mark as Delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 4,
  },
  backBtnText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  itemQty: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  totalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  actionSection: {
    gap: 12,
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#10b981',
  },
  navigateBtn: {
    backgroundColor: '#059669',
  },
  gmapBtn: {
    backgroundColor: '#4285F4',
    marginTop: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  navigationStatus: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  navigationText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
  routeHeader: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  routeSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  startBtn: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  directionsPanel: {
    backgroundColor: '#fff',
    padding: 12,
    maxHeight: 140,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  directionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  directionsScroll: {
    flex: 1,
  },
  directionStep: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 16,
  },
  arrivedPanel: {
    backgroundColor: '#d1fae5',
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#a7f3d0',
  },
  arrivedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 12,
  },
  deliveredBtn: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  deliveredBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    fontSize: 18,
    letterSpacing: 8,
    textAlign: 'center',
    width: 100,
    backgroundColor: '#f9fafb',
    marginRight: 8,
  },
  deliverBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
});