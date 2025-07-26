import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, KeyboardAvoidingView, ScrollView, FlatList, Modal, Dimensions } from 'react-native';
import MapView, { Marker, Polygon, Region } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL, GOOGLE_MAPS_API_KEY } from '../config';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

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

// Improved helper to parse city, state, postalCode, and country from address string
function parseAddressParts(address: string) {
  const parts = address.split(',').map(s => s.trim());
  let city = '';
  let state = '';
  let postalCode = '';
  let country = '';

  // Try to find a 6-digit postal code
  const postalMatch = address.match(/\b\d{6}\b/);
  if (postalMatch) {
    postalCode = postalMatch[0];
  }

  // Assume last part is country, second last is state, third last is city
  if (parts.length >= 3) {
    country = parts[parts.length - 1];
    state = parts[parts.length - 2];
    city = parts[parts.length - 3];
  } else if (parts.length === 2) {
    state = parts[parts.length - 2];
    country = parts[parts.length - 1];
  } else if (parts.length === 1) {
    country = parts[0];
  }

  return { city, state, postalCode, country };
}

// Helper to extract city, state, postalCode, country from address_components
function extractAddressParts(components: any[]): { city: string; state: string; postalCode: string; country: string } {
  let city = '';
  let state = '';
  let postalCode = '';
  let country = '';
  for (const comp of components) {
    if (comp.types.includes('locality')) city = comp.long_name;
    if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
    if (comp.types.includes('postal_code')) postalCode = comp.long_name;
    if (comp.types.includes('country')) country = comp.long_name;
  }
  return { city, state, postalCode, country };
}

const LocationSelectionScreen = ({ onLocationSelected, savedAddress, userId: propUserId, editingAddress, onBack }: any) => {
    const [userId, setUserId] = useState<string | null>(propUserId ?? null);
    const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
    const [manualAddress, setManualAddress] = useState('');
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [predictions, setPredictions] = useState<any[]>([]);
    const [loadingPredictions, setLoadingPredictions] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [addressDetails, setAddressDetails] = useState({ house: '', landmark: '', locality: '' });
    const mapRef = useRef<MapView>(null);
    const [isEditing] = useState(!!editingAddress);
    const navigation = useNavigation();
    const [serviceableLocations, setServiceableLocations] = useState<any[]>([]);
    const [region, setRegion] = useState<Region | null>(null);
    const [currentAddress, setCurrentAddress] = useState('');
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [currentAddressComponents, setCurrentAddressComponents] = useState<any[]>([]);
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [savedAddressDisplay, setSavedAddressDisplay] = useState<any>(null);

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

    useEffect(() => {
      (async () => {
        setLoadingLocation(true);
        const location = await getLocationSafe();
        if (location) {
          const { latitude, longitude } = location.coords;
          setRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          const addrObj = await reverseGeocode(latitude, longitude);
          setCurrentAddress(addrObj.formatted_address);
          setCurrentAddressComponents(addrObj.address_components);
        } else {
          setRegion({ ...NALBARI_CENTER, latitudeDelta: 0.01, longitudeDelta: 0.01 });
          const addrObj = await reverseGeocode(NALBARI_CENTER.latitude, NALBARI_CENTER.longitude);
          setCurrentAddress(addrObj.formatted_address);
          setCurrentAddressComponents(addrObj.address_components);
        }
        setLoadingLocation(false);
      })();
    }, []);

    // Debounced search function
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                fetchPredictions(searchQuery.trim());
            } else {
                setPredictions([]);
                setShowSearchSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Fetch saved address from AsyncStorage when modal opens
    useEffect(() => {
        if (showDetailsModal) {
            AsyncStorage.getItem('userAddress').then(addr => {
                if (addr) {
                    try {
                        setSavedAddressDisplay(JSON.parse(addr));
                    } catch {
                        setSavedAddressDisplay(null);
                    }
                } else {
                    setSavedAddressDisplay(null);
                }
            });
            
            // Pre-fill address fields with location data
            if (currentAddressComponents.length > 0) {
                const parsed = extractAddressParts(currentAddressComponents);
                setAddressDetails(prev => ({
                    ...prev,
                    locality: parsed.city || '',
                    // Keep existing house and landmark if user already entered them
                }));
            }
        }
    }, [showDetailsModal, currentAddressComponents]);

    const fetchPredictions = async (input: string) => {
        if (!input || input.length < 2) {
            setPredictions([]);
            setShowSearchSuggestions(false);
            return;
        }
        if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
            setPredictions([]);
            setShowSearchSuggestions(false);
            setError('Google Maps API key not configured. Please contact support.');
            return;
        }
        setLoadingPredictions(true);
        try {
            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&components=country:in&location=${NALBARI_CENTER.latitude},${NALBARI_CENTER.longitude}&radius=50000`;
            const res = await fetch(url);
            const json = await res.json();
            if (json.status === 'REQUEST_DENIED') {
                setError('Search service temporarily unavailable. Please try again.');
                setPredictions([]);
                setShowSearchSuggestions(false);
            } else if (json.status === 'OK') {
                setPredictions(json.predictions || []);
                setShowSearchSuggestions(true);
                setError(''); // Clear any previous errors
            } else {
                setPredictions([]);
                setShowSearchSuggestions(false);
            }
        } catch (err) {
            setPredictions([]);
            setShowSearchSuggestions(false);
            setError('Network error. Please check your connection and try again.');
        }
        setLoadingPredictions(false);
    };

    const handlePredictionPress = async (item: any) => {
        setSearchQuery(item.description);
        setPredictions([]);
        setShowSearchSuggestions(false);
        setManualAddress(item.description);
        try {
            if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
                setError('Google Maps API key not configured. Please contact support.');
                return;
            }
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${GOOGLE_MAPS_API_KEY}`;
            const res = await fetch(detailsUrl);
            const details = await res.json();
            const location = details.result.geometry.location;
            const newRegion = {
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            };
            setRegion(newRegion);
            setMarker({ latitude: location.lat, longitude: location.lng });
            if (mapRef.current) {
                mapRef.current.animateToRegion(newRegion, 500);
            }
            // Update address
            const addrObj = await reverseGeocode(location.lat, location.lng);
            setCurrentAddress(addrObj.formatted_address);
            setCurrentAddressComponents(addrObj.address_components);
            
            // Automatically trigger confirm location
            setTimeout(() => {
                handleConfirmLocation();
            }, 1000); // Small delay to let map animation complete
        } catch (err: any) {
            setError('Failed to fetch place details.');
        }
    };

    // Update reverseGeocode to return both formatted_address and address_components
    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
          return { formatted_address: '', address_components: [] };
        }
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.results && json.results.length > 0) {
          return {
            formatted_address: json.results[0].formatted_address,
            address_components: json.results[0].address_components || [],
          };
        }
      } catch (err) {
        // Silent fail for reverse geocoding
      }
      return { formatted_address: '', address_components: [] };
    };

    const handleRegionChangeComplete = async (reg: Region) => {
      setRegion(reg);
      const addrObj = await reverseGeocode(reg.latitude, reg.longitude);
      setCurrentAddress(addrObj.formatted_address);
      setCurrentAddressComponents(addrObj.address_components);
    };

    const handleMapDragStart = () => {
      setIsDragging(true);
    };

    const handleMapDragEnd = async (reg: Region) => {
      setIsDragging(false);
      // Don't call reverseGeocode here as it's already handled in handleRegionChangeComplete
    };

    const handleUseCurrentLocation = async () => {
        setLoadingLocation(true);
        // Always fetch the latest device location
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required to use this feature. Please enable it in your device settings.'
                );
                setLoadingLocation(false);
                return;
            }
            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
            if (location) {
                const { latitude, longitude } = location.coords;
                const newRegion = {
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                };
                setRegion(newRegion);
                setMarker({ latitude, longitude });
                const addrObj = await reverseGeocode(latitude, longitude);
                setCurrentAddress(addrObj.formatted_address);
                setCurrentAddressComponents(addrObj.address_components);
                if (mapRef.current) mapRef.current.animateToRegion(newRegion, 500);
                
                // Automatically trigger confirm location
                setTimeout(() => {
                    handleConfirmLocation();
                }, 1000); // Small delay to let map animation complete
            }
        } catch (error) {
            Alert.alert('Location Error', 'Could not get your location. Please try again or check your device settings.');
        }
        setLoadingLocation(false);
    };

    const handleConfirmLocation = () => {
        if (!region) return;
        
        // Check if within service area
        if (!isWithinNalbari(region.latitude, region.longitude)) {
            // If outside service area, still allow but show warning
            Alert.alert(
                'Outside Service Area',
                'This location is outside our current delivery area. You can still save this address for future use.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Continue', onPress: () => setShowDetailsModal(true) }
                ]
            );
            return;
        }
        
        setError('');
        setShowDetailsModal(true);
    };

    const handleUseSaved = () => {
        if (savedAddress) {
            onLocationSelected(savedAddress);
        }
    };

    const handleProceed = () => {
        let lat = region?.latitude;
        let lng = region?.longitude;
        let addr = currentAddress;
        if (!lat || !lng || !addr) {
            setError('Please select a location on the map or via search.');
            return;
        }
        setShowDetailsModal(true);
    };

    const handleSaveDetails = async () => {
        let lat = region?.latitude;
        let lng = region?.longitude;
        let addr = currentAddress;
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
        // Enforce Nalbari bounds check
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            setError('Please select a valid location on the map.');
            return;
        }
        
        const parsed = extractAddressParts(currentAddressComponents);
        const fullAddress = {
            line1: `${addressDetails.house}, ${addressDetails.landmark}, ${addressDetails.locality}`.replace(/^[,\s]+|[,\s]+$/g, ''),
            city: addressDetails.locality || parsed.city, // use user input or parsed
            state: parsed.state,
            country: parsed.country,
            postalCode: parsed.postalCode,
            house: addressDetails.house,
            landmark: addressDetails.landmark,
            locality: addressDetails.locality || parsed.city,
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

    const renderSearchSuggestion = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handlePredictionPress(item)}
        >
            <Ionicons name="location" size={20} color="#6B7280" style={styles.suggestionIcon} />
            <View style={styles.suggestionTextContainer}>
                <Text style={styles.suggestionMainText} numberOfLines={1}>
                    {item.structured_formatting?.main_text || item.description}
                </Text>
                <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                    {item.structured_formatting?.secondary_text || ''}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerOverlay}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Select Location</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchOverlay}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for a location..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => {
                            if (predictions.length > 0) setShowSearchSuggestions(true);
                        }}
                        onBlur={() => {
                            // Delay hiding suggestions to allow for taps
                            setTimeout(() => setShowSearchSuggestions(false), 200);
                        }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Search Suggestions */}
                {showSearchSuggestions && (predictions.length > 0 || loadingPredictions) && (
                    <View style={styles.suggestionsContainer}>
                        {loadingPredictions ? (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>Searching...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={predictions}
                                renderItem={renderSearchSuggestion}
                                keyExtractor={(item) => item.place_id}
                                style={styles.suggestionsList}
                                keyboardShouldPersistTaps="handled"
                            />
                        )}
                    </View>
                )}
            </View>

            {/* Full Screen Map */}
            <MapView
                ref={mapRef}
                style={styles.fullScreenMap}
                initialRegion={region || { ...NALBARI_CENTER, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                region={region || undefined}
                onRegionChangeComplete={handleRegionChangeComplete}
                onPanDrag={handleMapDragStart}
            >
                {/* Service area polygon border */}
                <Polygon
                    coordinates={[
                        { latitude: NALBARI_BOUNDS.northeast.lat, longitude: NALBARI_BOUNDS.southwest.lng },
                        { latitude: NALBARI_BOUNDS.northeast.lat, longitude: NALBARI_BOUNDS.northeast.lng },
                        { latitude: NALBARI_BOUNDS.southwest.lat, longitude: NALBARI_BOUNDS.northeast.lng },
                        { latitude: NALBARI_BOUNDS.southwest.lat, longitude: NALBARI_BOUNDS.southwest.lng },
                    ]}
                    strokeColor="#10B981"
                    fillColor="rgba(16,185,129,0.08)"
                    strokeWidth={3}
                />
            </MapView>

            {/* Fixed Pin Overlay */}
            <View pointerEvents="none" style={styles.pinContainer}>
                <View style={styles.pinShadow} />
                <View style={styles.pinBody}>
                    <View style={styles.pinInner} />
                </View>
                <View style={styles.pinTip} />
            </View>

            {/* Map Instructions */}
            {!searchQuery && predictions.length === 0 && (
                <View style={styles.mapInstructionOverlay}>
                    <Text style={styles.mapInstructionText}>
                        {isDragging ? 'Release to set location' : 'Drag map or search for location'}
                    </Text>
                </View>
            )}

            {/* Use Current Location Button */}
            <TouchableOpacity style={styles.currentLocationButton} onPress={handleUseCurrentLocation}>
                <Ionicons name="locate" size={20} color="#10B981" />
                <Text style={styles.currentLocationText}>Use current location</Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Details Modal (unchanged) */}
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

                        {/* Selected Location Display */}
                        {currentAddress && (
                            <View style={styles.selectedLocationContainer}>
                                <Text style={styles.selectedLocationTitle}>Selected Location:</Text>
                                <Text style={styles.selectedLocationText}>{currentAddress}</Text>
                            </View>
                        )}

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

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Area / Sector / Locality *"
                            value={addressDetails.locality || ''}
                            onChangeText={text => setAddressDetails({ ...addressDetails, locality: text })}
                        />

                        {savedAddressDisplay && (
  <View style={{ marginBottom: 16, backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8 }}>
    <Text style={{ fontWeight: 'bold', color: '#374151' }}>Your Saved Address:</Text>
    <Text style={{ color: '#374151' }}>{savedAddressDisplay.line1}</Text>
    <Text style={{ color: '#6B7280' }}>{savedAddressDisplay.city}, {savedAddressDisplay.state} {savedAddressDisplay.postalCode}</Text>
    <Text style={{ color: '#6B7280' }}>{savedAddressDisplay.country}</Text>
  </View>
)}

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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
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
    loadingContainer: {
        padding: 16,
        alignItems: 'center',
    },
    loadingText: {
        color: '#6B7280',
        fontSize: 14,
    },
    suggestionsList: {
        maxHeight: 250,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    suggestionIcon: {
        marginRight: 12,
    },
    suggestionTextContainer: {
        flex: 1,
    },
    suggestionMainText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    suggestionSecondaryText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
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
    pinContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -15 }, { translateY: -30 }],
        zIndex: 10,
        alignItems: 'center',
    },
    pinShadow: {
        width: 30,
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 15,
        marginTop: 25,
    },
    pinBody: {
        width: 30,
        height: 30,
        backgroundColor: '#10B981',
        borderRadius: 15,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinInner: {
        width: 12,
        height: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
    },
    pinTip: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#10B981',
        marginTop: -2,
    },
    addressDisplay: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 150 : 130,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 100,
    },
    addressText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    confirmButton: {
        position: 'absolute',
        bottom: 160,
        left: 20,
        right: 20,
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 100,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    selectedLocationContainer: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    selectedLocationTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 4,
    },
    selectedLocationText: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
    },
});

export default LocationSelectionScreen;