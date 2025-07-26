import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL, GOOGLE_MAPS_API_KEY } from '../app/config';

export interface Address {
    id: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    addresses: Address[];
    onSetPrimary: (id: string) => void;
    onAdd: (address: Omit<Address, 'id' | 'isDefault'>) => void;
    onEdit: (id: string, address: Omit<Address, 'id' | 'isDefault'>) => void;
    onDelete: (id: string) => void;
    loading?: boolean;
    onRequestLocation?: () => void;
}

const AddressManagerModal: React.FC<Props> = ({
    visible,
    onClose,
    addresses,
    onSetPrimary,
    onAdd,
    onEdit,
    onDelete,
    loading,
    onRequestLocation
}) => {
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ line1: '', city: '', state: '', postalCode: '', country: 'India' });
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentLocation, setCurrentLocation] = useState<string>('');
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [realAddresses, setRealAddresses] = useState<Address[]>([]);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [locationToShare, setLocationToShare] = useState<{latitude: number, longitude: number, address: string} | null>(null);

    // Fetch real saved addresses when modal opens
    useEffect(() => {
        if (visible) {
            fetchSavedAddresses();
        }
    }, [visible]);

    const fetchSavedAddresses = async () => {
        try {
            // Try to get addresses from AsyncStorage first
            const savedAddress = await AsyncStorage.getItem('userAddress');
            if (savedAddress) {
                const parsedAddress = JSON.parse(savedAddress);
                setRealAddresses([{
                    id: '1',
                    line1: parsedAddress.line1 || '',
                    city: parsedAddress.city || '',
                    state: parsedAddress.state || '',
                    postalCode: parsedAddress.postalCode || '',
                    country: parsedAddress.country || 'India',
                    isDefault: true
                }]);
            } else {
                // If no saved address, use the addresses prop
                setRealAddresses(addresses);
            }
        } catch (error) {
            console.error('Error fetching saved addresses:', error);
            setRealAddresses(addresses);
        }
    };

    const getCurrentLocation = async () => {
        setFetchingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required to use this feature. Please enable it in your device settings.'
                );
                return;
            }

            let location = await Location.getCurrentPositionAsync({ 
                accuracy: Location.Accuracy.Highest 
            });
            
            if (location) {
                const { latitude, longitude } = location.coords;
                // Reverse geocode to get address
                const address = await reverseGeocode(latitude, longitude);
                setCurrentLocation(address);
                
                // Store location data for sharing
                setLocationToShare({
                    latitude,
                    longitude,
                    address
                });
                
                // Call the onRequestLocation callback with the location data
                if (onRequestLocation) {
                    onRequestLocation();
                }
            }
        } catch (error) {
            Alert.alert(
                'Location Error',
                'Could not get your location. Please try again or check your device settings.'
            );
        } finally {
            setFetchingLocation(false);
        }
    };

    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        try {
            if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
                return 'Location fetched successfully';
            }
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
            const res = await fetch(url);
            const json = await res.json();
            if (json.results && json.results.length > 0) {
                return json.results[0].formatted_address;
            }
        } catch (err) {
            console.error('Error in reverse geocoding:', err);
        }
        return 'Location fetched successfully';
    };

    const openEdit = (address: Address) => {
        setEditId(address.id);
        setForm({
            line1: address.line1,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (editId) {
                await onEdit(editId, form);
            } else {
                await onAdd(form);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to save address.');
        } finally {
            setSubmitting(false);
        }
    };

    const shareLocation = async () => {
        if (!locationToShare) {
            Alert.alert('No Location', 'Please get your current location first.');
            return;
        }

        const { latitude, longitude, address } = locationToShare;
        const shareText = `📍 My current location:\n\n${address}\n\n📍 Coordinates: ${latitude}, ${longitude}\n\n📍 Google Maps: https://maps.google.com/?q=${latitude},${longitude}`;
        
        try {
            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            
            if (isAvailable) {
                await Sharing.shareAsync('', {
                    mimeType: 'text/plain',
                    dialogTitle: 'Share Location',
                    UTI: 'public.plain-text'
                });
            } else {
                // Fallback to intent launcher for Android
                await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
                    data: `text/plain`,
                    extra: {
                        'android.intent.extra.TEXT': shareText,
                        'android.intent.extra.SUBJECT': 'My Current Location'
                    }
                });
            }
        } catch (error) {
            console.error('Error sharing location:', error);
            Alert.alert('Error', 'Failed to share location. Please try again.');
        }
    };

    const shareWithSpecificApp = async (appType: string) => {
        if (!locationToShare) {
            Alert.alert('No Location', 'Please get your current location first.');
            return;
        }

        const { latitude, longitude, address } = locationToShare;
        const shareText = `📍 My current location:\n\n${address}\n\n📍 Coordinates: ${latitude}, ${longitude}\n\n📍 Google Maps: https://maps.google.com/?q=${latitude},${longitude}`;
        
        try {
            switch (appType) {
                case 'whatsapp':
                    await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
                        data: `text/plain`,
                        extra: {
                            'android.intent.extra.TEXT': shareText
                        }
                    });
                    break;
                case 'telegram':
                    await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
                        data: `text/plain`,
                        extra: {
                            'android.intent.extra.TEXT': shareText
                        }
                    });
                    break;
                case 'instagram':
                    await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
                        data: `text/plain`,
                        extra: {
                            'android.intent.extra.TEXT': shareText
                        }
                    });
                    break;
                case 'facebook':
                    await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
                        data: `text/plain`,
                        extra: {
                            'android.intent.extra.TEXT': shareText
                        }
                    });
                    break;
                case 'twitter':
                    await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
                        data: `text/plain`,
                        extra: {
                            'android.intent.extra.TEXT': shareText
                        }
                    });
                    break;
                case 'gmail':
                    await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
                        data: `message/rfc822`,
                        extra: {
                            'android.intent.extra.SUBJECT': 'My Current Location',
                            'android.intent.extra.TEXT': shareText
                        }
                    });
                    break;
                case 'maps':
                    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                        data: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(address)})`
                    });
                    break;
                default:
                    await shareLocation();
            }
        } catch (error) {
            console.error(`Error sharing with ${appType}:`, error);
            Alert.alert('Error', `Failed to share with ${appType}. The app might not be installed.`);
        }
    };

    const ShareOptionsModal = () => (
        <Modal visible={showShareOptions} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.shareModalContent}>
                    <View style={styles.shareHeader}>
                        <Text style={styles.shareTitle}>Share Location</Text>
                        <TouchableOpacity onPress={() => setShowShareOptions(false)} style={styles.closeButton}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.shareSubtitle}>Choose how you want to share your location</Text>
                    
                    <View style={styles.shareOptions}>
                        <TouchableOpacity 
                            style={styles.shareOption} 
                            onPress={() => shareWithSpecificApp('whatsapp')}
                        >
                            <View style={styles.shareOptionIcon}>
                                <Text style={styles.whatsappIcon}>💬</Text>
                            </View>
                            <Text style={styles.shareOptionText}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.shareOption} 
                            onPress={() => shareWithSpecificApp('telegram')}
                        >
                            <View style={styles.shareOptionIcon}>
                                <Text style={styles.telegramIcon}>📱</Text>
                            </View>
                            <Text style={styles.shareOptionText}>Telegram</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.shareOption} 
                            onPress={() => shareWithSpecificApp('instagram')}
                        >
                            <View style={styles.shareOptionIcon}>
                                <Text style={styles.instagramIcon}>📷</Text>
                            </View>
                            <Text style={styles.shareOptionText}>Instagram</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.shareOption} 
                            onPress={() => shareWithSpecificApp('facebook')}
                        >
                            <View style={styles.shareOptionIcon}>
                                <Text style={styles.facebookIcon}>📘</Text>
                            </View>
                            <Text style={styles.shareOptionText}>Facebook</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.shareOption} 
                            onPress={() => shareWithSpecificApp('twitter')}
                        >
                            <View style={styles.shareOptionIcon}>
                                <Text style={styles.twitterIcon}>🐦</Text>
                            </View>
                            <Text style={styles.shareOptionText}>Twitter</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.shareOption} 
                            onPress={() => shareWithSpecificApp('gmail')}
                        >
                            <View style={styles.shareOptionIcon}>
                                <Text style={styles.gmailIcon}>📧</Text>
                            </View>
                            <Text style={styles.shareOptionText}>Gmail</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.shareOption} 
                            onPress={() => shareWithSpecificApp('maps')}
                        >
                            <View style={styles.shareOptionIcon}>
                                <Text style={styles.mapsIcon}>🗺️</Text>
                            </View>
                            <Text style={styles.shareOptionText}>Google Maps</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.shareOption} 
                            onPress={() => {
                                shareLocation();
                                setShowShareOptions(false);
                            }}
                        >
                            <View style={styles.shareOptionIcon}>
                                <Text style={styles.moreIcon}>⋯</Text>
                            </View>
                            <Text style={styles.shareOptionText}>More Options</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <>
            <Modal visible={visible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>10.84.250.139</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search for area, street name..."
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* Quick Actions */}
                        <View style={styles.quickActions}>
                            {/* Use Current Location */}
                            <TouchableOpacity 
                                style={styles.actionItem} 
                                onPress={getCurrentLocation}
                                disabled={fetchingLocation}
                            >
                                <View style={styles.actionIcon}>
                                    <View style={styles.locationIcon}>
                                        <View style={styles.locationDot} />
                                    </View>
                                </View>
                                <View style={styles.actionContent}>
                                    <Text style={styles.actionTitle}>
                                        {fetchingLocation ? 'Getting location...' : 'Use current location'}
                                    </Text>
                                    <Text style={styles.actionSubtitle}>
                                        {currentLocation || 'Tap to get your current location'}
                                    </Text>
                                </View>
                                {fetchingLocation ? (
                                    <ActivityIndicator size="small" color="#10B981" />
                                ) : (
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                )}
                            </TouchableOpacity>

                            {/* Add New Address */}
                            <TouchableOpacity style={styles.actionItem} onPress={onRequestLocation}>
                                <View style={styles.actionIcon}>
                                    <Text style={styles.plusIcon}>+</Text>
                                </View>
                                <View style={styles.actionContent}>
                                    <Text style={styles.actionTitle}>Add new address</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>

                            {/* Request Address */}
                            <TouchableOpacity style={styles.actionItem}>
                                <View style={styles.whatsappIconContainer}>
                                    <Text style={styles.whatsappText}>💬</Text>
                                </View>
                                <View style={styles.actionContent}>
                                    <Text style={styles.actionTitle}>Request address from someone else</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>

                            {/* Import from Zomato */}
                            <TouchableOpacity style={styles.actionItem}>
                                <View style={styles.zomatoIcon}>
                                    <Text style={styles.zomatoText}>zomato</Text>
                                </View>
                                <View style={styles.actionContent}>
                                    <Text style={styles.actionTitle}>Import your addresses from Zomato</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* Saved Addresses Section */}
                        <View style={styles.savedSection}>
                            <Text style={styles.sectionTitle}>Your saved addresses</Text>

                            {loading ? (
                                <ActivityIndicator size="small" color="#10B981" style={styles.loader} />
                            ) : (
                                <FlatList
                                    data={realAddresses}
                                    keyExtractor={item => item.id}
                                    renderItem={({ item }) => (
                                        <View style={styles.addressCard}>
                                            <View style={styles.addressHeader}>
                                                <View style={styles.addressTypeContainer}>
                                                    <Text style={styles.homeIcon}>🏠</Text>
                                                    <Text style={styles.addressType}>Home</Text>
                                                    {item.isDefault && (
                                                        <Text style={styles.defaultBadge}>Default</Text>
                                                    )}
                                                </View>
                                            </View>

                                            <Text style={styles.addressText}>
                                                {item.line1}, {item.city}, {item.state}
                                            </Text>
                                            {item.postalCode && (
                                                <Text style={styles.postalText}>PIN: {item.postalCode}</Text>
                                            )}

                                            <View style={styles.addressActions}>
                                                <TouchableOpacity 
                                                    style={styles.actionButton}
                                                    onPress={() => onSetPrimary(item.id)}
                                                >
                                                    <Text style={styles.actionDots}>•••</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.actionButton}>
                                                    <Ionicons name="share-outline" size={18} color="#10B981" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                    ListEmptyComponent={
                                        <Text style={styles.emptyText}>No saved addresses found.</Text>
                                    }
                                    showsVerticalScrollIndicator={false}
                                />
                            )}
                        </View>

                        {/* Share Banner */}
                        <View style={styles.shareBanner}>
                            <View style={styles.shareContent}>
                                <View style={styles.shareIcon}>
                                    <Ionicons name="share-outline" size={20} color="#10B981" />
                                </View>
                                <Text style={styles.shareText}>Now share your addresses with friends and family</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.dismissButton}
                                onPress={() => setShowShareOptions(true)}
                            >
                                <Ionicons name="share" size={16} color="#10B981" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <ShareOptionsModal />
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        maxHeight: '90%',
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        marginHorizontal: 20,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 24,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
    },
    quickActions: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    locationIcon: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },
    plusIcon: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    whatsappIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#25D366',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    whatsappText: {
        fontSize: 20,
    },
    zomatoIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E23744',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    zomatoText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 18,
    },
    savedSection: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#9CA3AF',
        marginBottom: 16,
    },
    loader: {
        marginTop: 20,
    },
    addressCard: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    homeIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    addressType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginRight: 8,
    },
    distance: {
        fontSize: 14,
        color: '#10B981',
    },
    addressText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 4,
    },
    phoneText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    addressActions: {
        flexDirection: 'row',
        gap: 16,
    },
    actionButton: {
        padding: 4,
    },
    actionDots: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: 'bold',
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 40,
    },
    shareBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    shareContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    shareIcon: {
        marginRight: 12,
    },
    shareText: {
        fontSize: 14,
        color: '#92400E',
        flex: 1,
    },
    dismissButton: {
        padding: 4,
    },
    defaultBadge: {
        backgroundColor: '#10B981',
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: 8,
    },
    postalText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    shareHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    shareTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
    },
    shareSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    shareOptions: {
        paddingHorizontal: 20,
    },
    shareOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    shareOptionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    shareOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
    },
    whatsappIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#25D366',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },

    telegramIcon: {
        fontSize: 20,
    },
    instagramIcon: {
        fontSize: 20,
    },
    facebookIcon: {
        fontSize: 20,
    },
    twitterIcon: {
        fontSize: 20,
    },
    gmailIcon: {
        fontSize: 20,
    },
    mapsIcon: {
        fontSize: 20,
    },
    moreIcon: {
        fontSize: 20,
    },
    shareModalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        maxHeight: '90%',
        flex: 1,
    },
});

export default AddressManagerModal;