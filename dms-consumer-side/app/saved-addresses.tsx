import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, StatusBar, TouchableOpacity, Modal, TextInput } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';
import LocationSelectionScreen from './location/LocationSelectionScreen';

const SavedAddressesScreen = () => {
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [newAddress, setNewAddress] = useState({ line1: '', city: '', state: '', postalCode: '', country: 'India' });
    const [addingAddress, setAddingAddress] = useState(false);
    const [showLocationSelector, setShowLocationSelector] = useState(false);

    useEffect(() => {
        const fetchAddresses = async () => {
            setLoading(true);
            setError(null);
            const storedUserId = await AsyncStorage.getItem('userId');
            setUserId(storedUserId);
            if (!storedUserId) {
                setError('Please log in to view your addresses.');
                setLoading(false);
                return;
            }
            try {
                const res = await axios.get(`${API_URL}/addresses/${storedUserId}`);
                setAddresses(res.data);
            } catch (err) {
                setError('Failed to fetch addresses.');
            } finally {
                setLoading(false);
            }
        };
        fetchAddresses();
    }, []);

    const handleAddAddress = async () => {
        if (!userId) return;
        setAddingAddress(true);
        try {
            const res = await axios.post(`${API_URL}/addresses`, { ...newAddress, userId });
            setAddresses(prev => [...prev, res.data]);
            await AsyncStorage.setItem('hasSetAddressOnce', 'true');
            setShowAddressModal(false);
            setNewAddress({ line1: '', city: '', state: '', postalCode: '', country: 'India' });
        } catch (err) {
            // handle error
        } finally {
            setAddingAddress(false);
        }
    };

    const handleLocationSelected = async (selectedAddress: any) => {
        if (!userId) return;
        setAddingAddress(true);
        try {
            const res = await axios.post(`${API_URL}/addresses`, { ...selectedAddress, userId });
            setAddresses(prev => [...prev, res.data]);
            await AsyncStorage.setItem('hasSetAddressOnce', 'true');
            setShowLocationSelector(false);
            setNewAddress({ line1: '', city: '', state: '', postalCode: '', country: 'India' });
        } catch (err) {
            // handle error
        } finally {
            setAddingAddress(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <Text style={styles.header}>Saved Addresses</Text>
            {loading ? (
                <ActivityIndicator size="small" color="#CB202D" />
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : addresses.length === 0 ? (
                <Text style={styles.emptyText}>No addresses found.</Text>
            ) : (
                <FlatList
                    data={addresses}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.addressCard}>
                            <Text style={styles.addressLine}>{item.line1}, {item.city}, {item.state}, {item.postalCode}</Text>
                            <Text style={styles.addressCountry}>{item.country}</Text>
                        </View>
                    )}
                />
            )}
            <TouchableOpacity style={styles.addAddressButton} onPress={() => setShowLocationSelector(true)}>
                <Ionicons name="add-circle-outline" size={20} color="#CB202D" />
                <Text style={styles.addAddressText}>Add New Address</Text>
            </TouchableOpacity>
            {showLocationSelector && (console.log('Rendering LocationSelectionScreen'), (
                <LocationSelectionScreen
                    onLocationSelected={handleLocationSelected}
                    userId={userId}
                    savedAddress={null}
                    onBack={() => setShowLocationSelector(false)}
                />
            ))}
            {/* Address Modal */}
            <Modal visible={showAddressModal && !showLocationSelector} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Address Line 1"
                            value={newAddress.line1}
                            onChangeText={text => setNewAddress({ ...newAddress, line1: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="City"
                            value={newAddress.city}
                            onChangeText={text => setNewAddress({ ...newAddress, city: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="State"
                            value={newAddress.state}
                            onChangeText={text => setNewAddress({ ...newAddress, state: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Postal Code"
                            value={newAddress.postalCode}
                            onChangeText={text => setNewAddress({ ...newAddress, postalCode: text })}
                            keyboardType="numeric"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setShowAddressModal(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={handleAddAddress} disabled={addingAddress}>
                                <Text style={styles.modalButtonText}>{addingAddress ? 'Adding...' : 'Add'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    addressCard: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        elevation: 1,
        minWidth: 220,
    },
    addressLine: {
        fontSize: 12,
        color: '#333',
    },
    addressCountry: {
        fontSize: 10,
        color: '#999',
        marginBottom: 4,
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
        alignSelf: 'center',
    },
    addAddressText: {
        color: '#CB202D',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        width: '85%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#CB202D',
        marginBottom: 16,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 6,
        padding: 10,
        marginBottom: 10,
        fontSize: 13,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        padding: 10,
        backgroundColor: '#CB202D',
        borderRadius: 6,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 13,
    },
});

export default SavedAddressesScreen; 