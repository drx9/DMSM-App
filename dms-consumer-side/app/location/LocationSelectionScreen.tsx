import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, KeyboardAvoidingView, ScrollView, FlatList, Modal, Dimensions } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

const GOOGLE_MAPS_APIKEY = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
const NALBARI_BOUNDS = {
    northeast: { lat: 26.464, lng: 91.468 },
    southwest: { lat: 26.420, lng: 91.410 },
};
const NALBARI_CENTER = { latitude: 26.444, longitude: 91.441 };

function isWithinNalbari(lat: number, lng: number) {
    return (
        lat >= NALBARI_BOUNDS.southwest.lat &&
        lat <= NALBARI_BOUNDS.northeast.lat &&
        lng >= NALBARI_BOUNDS.southwest.lng &&
        lng <= NALBARI_BOUNDS.northeast.lng
    );
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

const LocationSelectionScreen = ({ onLocationSelected, savedAddress, userId: propUserId, editingAddress, onBack }: any) => {
    const [userId, setUserId] = useState<string | null>(propUserId ?? null);
    const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
    const [manualAddress, setManualAddress] = useState('');
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [predictions, setPredictions] = useState<any[]>([]);
    const [loadingPredictions, setLoadingPredictions] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [addressDetails, setAddressDetails] = useState({ house: '', landmark: '' });
    const mapRef = useRef<MapView>(null);
    const [isEditing] = useState(!!editingAddress);
    const navigation = useNavigation();
    const [serviceableLocations, setServiceableLocations] = useState<any[]>([]);

    useEffect(() => {
        if (!userId) {
            AsyncStorage.getItem('userId').then(id => {
                if (id) setUserId(id);
            });
        }
    }, []);

    useEffect(() => {
        axios.get(`${API_URL}/serviceable-pincodes/public`)
            .then(res => setServiceableLocations(res.data))
            .catch(() => setServiceableLocations([]));
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            return () => {
                if (savedAddress) {
                    onLocationSelected(savedAddress);
                }
            };
        }, [savedAddress, onLocationSelected])
    );

    const fetchPredictions = async (input: string) => {
        if (!input) {
            setPredictions([]);
            return;
        }
        if (GOOGLE_MAPS_APIKEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
            console.warn('Google Maps API key not configured');
            setPredictions([]);
            return;
        }
        setLoadingPredictions(true);
        try {
            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_APIKEY}&components=country:in`;
            const res = await fetch(url);
            const json = await res.json();
            setPredictions(json.predictions || []);
        } catch (err) {
            console.error('Error fetching predictions:', err);
            setPredictions([]);
        }
        setLoadingPredictions(false);
    };

    const handlePredictionPress = async (item: any) => {
        setQuery(item.description);
        setPredictions([]);
        setManualAddress(item.description);
        try {
            if (GOOGLE_MAPS_APIKEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
                console.warn('Google Maps API key not configured');
                setError('Google Maps API key not configured. Please contact support.');
                return;
            }
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${GOOGLE_MAPS_APIKEY}`;
            const res = await fetch(detailsUrl);
            const details = await res.json();
            const location = details.result.geometry.location;
            setMarker({ latitude: location.lat, longitude: location.lng });
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: location.lat,
                    longitude: location.lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                });
            }
        } catch (err: any) {
            console.error('Error fetching place details:', err);
            setError('Failed to fetch place details.');
        }
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            if (GOOGLE_MAPS_APIKEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
                console.warn('Google Maps API key not configured');
                return '';
            }
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_APIKEY}`;
            const res = await fetch(url);
            const json = await res.json();
            if (json.results && json.results.length > 0) {
                return json.results[0].formatted_address;
            }
        } catch (err) {
            console.error('Error in reverse geocoding:', err);
        }
        return '';
    };

    const handleMapPress = async (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarker({ latitude, longitude });
        setError('');
        // Autofill search bar with address
        const address = await reverseGeocode(latitude, longitude);
        if (address) {
            setQuery(address);
            setManualAddress(address);
        }
    };

    const handleUseSaved = () => {
        if (savedAddress) {
            onLocationSelected(savedAddress);
        }
    };

    const handleProceed = () => {
        let lat = marker?.latitude;
        let lng = marker?.longitude;
        let addr = manualAddress;
        if (!lat || !lng || !addr) {
            setError('Please select a location on the map or via search.');
            return;
        }
        setShowDetailsModal(true);
    };

    const handleSaveDetails = async () => {
        let lat = marker?.latitude;
        let lng = marker?.longitude;
        let addr = manualAddress;
        let finalUserId = userId;
        if (!finalUserId) {
            finalUserId = await AsyncStorage.getItem('userId');
            setUserId(finalUserId);
        }
        if (!finalUserId) {
            setError('User ID not found. Please log in again.');
            return;
        }
        if (!addressDetails.house) {
            setError('Please enter your house number.');
            return;
        }
        const fullAddress = {
            line1: addr,
            city: serviceableLocations.find(l => l.latitude === lat && l.longitude === lng)?.city || '',
            state: serviceableLocations.find(l => l.latitude === lat && l.longitude === lng)?.state || '',
            country: 'India',
            postalCode: serviceableLocations.find(l => l.latitude === lat && l.longitude === lng)?.pincode || '',
            house: addressDetails.house,
            landmark: addressDetails.landmark,
            latitude: lat,
            longitude: lng,
            userId: finalUserId,
        };
        console.log('Saving address payload:', fullAddress);
        try {
            let response;
            if (isEditing && editingAddress?.id) {
                response = await axios.put(`${API_URL}/addresses/${editingAddress.id}`, fullAddress);
            } else {
                response = await axios.post(`${API_URL}/addresses`, fullAddress);
            }
            await AsyncStorage.setItem('userAddress', JSON.stringify(response.data));
            await AsyncStorage.setItem('addressSet', 'true');
            setShowDetailsModal(false);
            onLocationSelected(response.data);
        } catch (err: any) {
            console.log('Save address error:', err?.response?.data || err.message || err);
            setError('Failed to save address. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Full Screen Map */}
            <MapView
                ref={mapRef}
                style={styles.fullScreenMap}
                initialRegion={{
                    ...NALBARI_CENTER,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                onPress={handleMapPress}
            >
                {marker && <Marker coordinate={marker} draggable onDragEnd={handleMapPress} />}
            </MapView>

            {/* Header Overlay */}
            <View style={styles.headerOverlay}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            if (onBack) onBack();
                            else if (navigation.canGoBack()) navigation.goBack();
                        }}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>

                </View>
            </View>

            {/* Search Overlay */}
            <View style={styles.searchOverlay}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for a new area, locality..."
                        placeholderTextColor="#9CA3AF"
                        value={query}
                        onChangeText={text => {
                            setQuery(text);
                            fetchPredictions(text);
                        }}
                    />
                </View>

                {/* Suggestions List Overlay */}
                {(predictions.length > 0 || loadingPredictions) && (
                    <View style={styles.suggestionsContainer}>
                        {loadingPredictions && <Text style={styles.loadingText}>Loading...</Text>}
                        <FlatList
                            data={predictions}
                            keyExtractor={item => item.place_id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.suggestion}
                                    onPress={() => handlePredictionPress(item)}
                                >
                                    <Ionicons name="location-outline" size={16} color="#6B7280" style={styles.suggestionIcon} />
                                    <Text style={styles.suggestionText}>{item.description}</Text>
                                </TouchableOpacity>
                            )}
                            keyboardShouldPersistTaps="handled"
                            style={styles.suggestionsList}
                        />
                    </View>
                )}
            </View>

            {/* Map Instruction Overlay */}
            <View style={styles.mapInstructionOverlay}>
                <Text style={styles.mapInstructionText}>Move the pin to adjust your location</Text>
            </View>

            {/* Use Current Location Button */}
            <TouchableOpacity style={styles.currentLocationButton}>
                <Ionicons name="locate" size={20} color="#10B981" />
                <Text style={styles.currentLocationText}>Use current location</Text>
            </TouchableOpacity>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                <Text style={styles.deliveryTitle}>Delivering your order to</Text>

                <View style={styles.addressCard}>
                    <View style={styles.addressIcon}>
                        <View style={styles.pinIcon} />
                    </View>
                    <View style={styles.addressInfo}>
                        <Text style={styles.addressArea}>{serviceableLocations.find(l => l.latitude === marker?.latitude && l.longitude === marker?.longitude)?.area || ''}</Text>
                        <Text style={styles.addressCity}>{serviceableLocations.find(l => l.latitude === marker?.latitude && l.longitude === marker?.longitude)?.city || ''}</Text>
                    </View>
                    <TouchableOpacity>
                        <Text style={styles.changeButton}>Change</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.addDetailsButton} onPress={handleProceed}>
                    <Text style={styles.addDetailsText}>Add more address details</Text>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.requestButton}>
                    <Text style={styles.requestText}>Request address from someone else</Text>
                </TouchableOpacity>
            </View>

            {savedAddress && (
                <TouchableOpacity style={styles.savedAddress} onPress={handleUseSaved}>
                    <Text>Use Saved Address: {savedAddress.address}</Text>
                </TouchableOpacity>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Modal */}
            <Modal
                visible={showDetailsModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowDetailsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Enter complete address</Text>
                            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.orderingFor}>Who you are ordering for?</Text>

                        <View style={styles.radioGroup}>
                            <TouchableOpacity style={styles.radioOption}>
                                <View style={styles.radioSelected} />
                                <Text style={styles.radioText}>Myself</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.radioOption}>
                                <View style={styles.radioUnselected} />
                                <Text style={styles.radioText}>Someone else</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.saveAsLabel}>Save address as *</Text>

                        <View style={styles.addressTypeGroup}>
                            <TouchableOpacity style={styles.addressTypeSelected}>
                                <Text style={styles.addressTypeIcon}>🏠</Text>
                                <Text style={styles.addressTypeText}>Home</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addressType}>
                                <Text style={styles.addressTypeIcon}>🏢</Text>
                                <Text style={styles.addressTypeText}>Work</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addressType}>
                                <Text style={styles.addressTypeIcon}>🏨</Text>
                                <Text style={styles.addressTypeText}>Hotel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addressType}>
                                <Text style={styles.addressTypeIcon}>📍</Text>
                                <Text style={styles.addressTypeText}>Other</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Flat / House no / Building name *"
                            value={addressDetails.house}
                            onChangeText={text => setAddressDetails({ ...addressDetails, house: text })}
                        />

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Floor (optional)"
                            value={addressDetails.landmark}
                            onChangeText={text => setAddressDetails({ ...addressDetails, landmark: text })}
                        />

                        <View style={styles.areaSection}>
                            <Text style={styles.areaLabel}>Area / Sector / Locality *</Text>
                            <View style={styles.areaDisplay}>
                                <Text style={styles.areaText}>{serviceableLocations.find(l => l.latitude === marker?.latitude && l.longitude === marker?.longitude)?.area || ''}</Text>
                                <TouchableOpacity>
                                    <Text style={styles.changeAreaButton}>Change</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveDetails}>
                            <Text style={styles.saveButtonText}>Save address</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    fullScreenMap: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: width,
        height: height,
    },
    headerOverlay: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    headerContainer: {



    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    searchOverlay: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 110 : 90,
        left: 16,
        right: 16,
        zIndex: 1000,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        paddingVertical: 4,
    },
    suggestionsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 12,
        marginTop: 8,
        maxHeight: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    loadingText: {
        padding: 16,
        color: '#6B7280',
        fontSize: 14,
        textAlign: 'center',
    },
    suggestionsList: {
        maxHeight: 250,
    },
    suggestion: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    suggestionIcon: {
        marginRight: 12,
    },
    suggestionText: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
    },
    mapInstructionOverlay: {
        position: 'absolute',
        top: '45%',
        left: '50%',
        transform: [{ translateX: -120 }, { translateY: -20 }],
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        zIndex: 100,
    },
    mapInstructionText: {
        color: '#FFFFFF',
        fontSize: 14,
        textAlign: 'center',
    },
    currentLocationButton: {
        position: 'absolute',
        bottom: 220,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#10B981',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 100,
    },
    currentLocationText: {
        color: '#10B981',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 100,
    },
    deliveryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16,
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    addressIcon: {
        marginRight: 12,
    },
    pinIcon: {
        width: 12,
        height: 12,
        backgroundColor: '#10B981',
        borderRadius: 6,
        borderWidth: 3,
        borderColor: '#34D399',
    },
    addressInfo: {
        flex: 1,
    },
    addressArea: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    addressCity: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    changeButton: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '500',
    },
    addDetailsButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    addDetailsText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    requestButton: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    requestText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    savedAddress: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        margin: 16,
        borderRadius: 8,
        position: 'absolute',
        top: 200,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    error: {
        color: '#EF4444',
        margin: 16,
        fontSize: 14,
        position: 'absolute',
        top: 250,
        left: 0,
        right: 0,
        zIndex: 100,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
    },
    closeButton: {
        fontSize: 24,
        color: '#6B7280',
    },
    orderingFor: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 12,
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 20,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    radioSelected: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#10B981',
    },
    radioUnselected: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
    },
    radioText: {
        fontSize: 16,
        color: '#374151',
    },
    saveAsLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 12,
    },
    addressTypeGroup: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    addressTypeSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    addressType: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    addressTypeIcon: {
        fontSize: 16,
    },
    addressTypeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    modalInput: {
        height: 48,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 16,
        color: '#374151',
    },
    areaSection: {
        marginBottom: 20,
    },
    areaLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    areaDisplay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 8,
    },
    areaText: {
        fontSize: 16,
        color: '#1F2937',
    },
    changeAreaButton: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LocationSelectionScreen;