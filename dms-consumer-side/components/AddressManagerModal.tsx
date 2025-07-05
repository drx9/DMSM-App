import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Select delivery location</Text>
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
                        <TouchableOpacity style={styles.actionItem} onPress={onRequestLocation}>
                            <View style={styles.actionIcon}>
                                <View style={styles.locationIcon}>
                                    <View style={styles.locationDot} />
                                </View>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Use current location</Text>
                                <Text style={styles.actionSubtitle}>Bamunimaidan, Lower Assam Division, Guwahati, Assam, 781021, India</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
                            <View style={styles.whatsappIcon}>
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
                                data={addresses}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <View style={styles.addressCard}>
                                        <View style={styles.addressHeader}>
                                            <View style={styles.addressTypeContainer}>
                                                <Text style={styles.homeIcon}>🏠</Text>
                                                <Text style={styles.addressType}>Home</Text>
                                                <Text style={styles.distance}>982.89 km away</Text>
                                            </View>
                                        </View>

                                        <Text style={styles.addressText}>
                                            {item.line1}, {item.city}, {item.state}
                                        </Text>
                                        <Text style={styles.phoneText}>Phone number: 9957898579</Text>

                                        <View style={styles.addressActions}>
                                            <TouchableOpacity style={styles.actionButton}>
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
                            <Ionicons name="share-outline" size={20} color="#10B981" style={styles.shareIcon} />
                            <Text style={styles.shareText}>Now share your addresses with friends and family</Text>
                        </View>
                        <TouchableOpacity style={styles.dismissButton}>
                            <Ionicons name="close" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
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
});

export default AddressManagerModal;