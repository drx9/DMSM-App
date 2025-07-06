import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TextInput, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from './config';

const CLOUDINARY_CLOUD_NAME = 'dpdlmdl5x';
const CLOUDINARY_UPLOAD_PRESET = 'dmsmart';

const AccountDetailsScreen = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState<any>({});
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [passwordMode, setPasswordMode] = useState(false);
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
    const [deleting, setDeleting] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const userIdRef = useRef<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const showMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 2500);
    };

    const fetchUser = async () => {
        setLoading(true);
        const userId = await AsyncStorage.getItem('userId');
        userIdRef.current = userId;
        if (userId) {
            try {
                const res = await axios.get(`${API_URL}/auth/user/${userId}`);
                setUser(res.data);
                setForm({
                    name: res.data.name,
                    email: res.data.email,
                    phoneNumber: res.data.phoneNumber || '',
                    gender: res.data.gender || '',
                    dateOfBirth: res.data.dateOfBirth || '',
                });
            } catch (err) {
                setUser(null);
            }
        }
        setLoading(false);
    };

    useEffect(() => { fetchUser(); }, []);

    const handleSave = async () => {
        if (!userIdRef.current) return;
        try {
            const res = await axios.put(`${API_URL}/auth/user/${userIdRef.current}`, form);
            setUser(res.data);
            setEditMode(false);
            showMessage('Profile updated');
        } catch (err) {
            showMessage('Failed to update profile');
        }
    };

    const handleAvatar = async () => {
        if (!userIdRef.current) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showMessage('Permission to access media library is required!');
            return;
        }
        const picker = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            quality: 0.7
        });
        if (!picker.canceled && picker.assets && picker.assets[0]) {
            setAvatarUploading(true);
            const uri = picker.assets[0].uri;
            const formData = new FormData();
            formData.append('avatar', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
            try {
                // Send file to backend for Cloudinary upload
                const uploadRes = await axios.post(`${API_URL}/auth/user/${userIdRef.current}/avatar`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                const { photo } = uploadRes.data;
                if (!photo) {
                    showMessage('Failed to upload avatar to server');
                    setAvatarUploading(false);
                    return;
                }
                showMessage('Avatar updated successfully!');
                fetchUser();
            } catch (err) {
                console.error('Avatar upload error:', err);
                showMessage('Failed to upload avatar');
            }
            setAvatarUploading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!userIdRef.current) return;
        try {
            await axios.post(`${API_URL}/auth/user/${userIdRef.current}/change-password`, passwords);
            showMessage('Password changed');
            setPasswordMode(false);
            setPasswords({ currentPassword: '', newPassword: '' });
        } catch (err) {
            showMessage('Failed to change password');
        }
    };

    const handleDelete = async () => {
        if (!userIdRef.current) return;
        Alert.alert('Delete Account', 'Are you sure? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    setDeleting(true);
                    try {
                        await axios.delete(`${API_URL}/auth/user/${userIdRef.current}`);
                        showMessage('Account deleted');
                        await AsyncStorage.clear();
                        // Optionally, navigate to login or splash
                    } catch (err) {
                        showMessage('Failed to delete account');
                    }
                    setDeleting(false);
                }
            }
        ]);
    };

    const handleResendVerification = async () => {
        if (!userIdRef.current) return;
        setVerifying(true);
        try {
            await axios.post(`${API_URL}/auth/resend-otp`, { userId: userIdRef.current });
            showMessage('Verification sent');
        } catch (err) {
            showMessage('Failed to resend verification');
        }
        setVerifying(false);
    };

    if (loading) return (
        <SafeAreaView style={styles.container}>
            <ActivityIndicator size="small" color="#22C55E" style={styles.loader} />
        </SafeAreaView>
    );

    if (!user) return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.empty}>User info not found.</Text>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Account</Text>
                </View>

                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={user.photo
                                ? user.photo.startsWith('http')
                                    ? { uri: user.photo }
                                    : { uri: `${API_URL}${user.photo}` }
                                : require('../assets/images/dms-logo.png')}
                            style={styles.avatar}
                        />
                        <TouchableOpacity
                            style={styles.avatarBtn}
                            onPress={handleAvatar}
                            disabled={avatarUploading}
                        >
                            <Text style={styles.avatarBtnText}>
                                {avatarUploading ? 'Uploading...' : 'Edit'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <View style={styles.statusContainer}>
                            <View style={[styles.statusBadge, user.isVerified ? styles.verified : styles.unverified]}>
                                <Text style={[styles.statusText, user.isVerified ? styles.verifiedText : styles.unverifiedText]}>
                                    {user.isVerified ? 'Verified' : 'Unverified'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {message && (
                    <View style={styles.messageContainer}>
                        <Text style={styles.messageText}>{message}</Text>
                    </View>
                )}

                {/* Content Section */}
                <View style={styles.contentSection}>
                    {editMode ? (
                        <View style={styles.editForm}>
                            <Text style={styles.sectionTitle}>Edit Profile</Text>
                            <TextInput
                                style={styles.input}
                                value={form.name}
                                onChangeText={v => setForm({ ...form, name: v })}
                                placeholder="Full Name"
                                placeholderTextColor="#94A3B8"
                            />
                            <TextInput
                                style={styles.input}
                                value={form.email}
                                onChangeText={v => setForm({ ...form, email: v })}
                                placeholder="Email Address"
                                placeholderTextColor="#94A3B8"
                            />
                            <TextInput
                                style={styles.input}
                                value={form.phoneNumber}
                                onChangeText={v => setForm({ ...form, phoneNumber: v })}
                                placeholder="Phone Number"
                                placeholderTextColor="#94A3B8"
                            />
                            <TextInput
                                style={styles.input}
                                value={form.gender}
                                onChangeText={v => setForm({ ...form, gender: v })}
                                placeholder="Gender"
                                placeholderTextColor="#94A3B8"
                            />
                            <TextInput
                                style={styles.input}
                                value={form.dateOfBirth}
                                onChangeText={v => setForm({ ...form, dateOfBirth: v })}
                                placeholder="Date of Birth (YYYY-MM-DD)"
                                placeholderTextColor="#94A3B8"
                            />
                            <View style={styles.formButtons}>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditMode(false)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.detailsContainer}>
                            <Text style={styles.sectionTitle}>Personal Details</Text>
                            <View style={styles.detailsGrid}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Phone</Text>
                                    <Text style={styles.detailValue}>{user.phoneNumber || user.phone || 'Not provided'}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Gender</Text>
                                    <Text style={styles.detailValue}>{user.gender || 'Not provided'}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Date of Birth</Text>
                                    <Text style={styles.detailValue}>{user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : 'Not provided'}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Role</Text>
                                    <Text style={styles.detailValue}>{user.role}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Member Since</Text>
                                    <Text style={styles.detailValue}>{user.createdAt ? String(user.createdAt).slice(0, 10) : 'Unknown'}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Status</Text>
                                    <Text style={styles.detailValue}>{user.isActive ? 'Active' : 'Inactive'}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Actions Section */}
                {!editMode && (
                    <View style={styles.actionsSection}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => setEditMode(true)}>
                            <Text style={styles.actionBtnText}>Edit Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => setPasswordMode(true)}>
                            <Text style={styles.actionBtnText}>Change Password</Text>
                        </TouchableOpacity>
                        {!user.isVerified && (
                            <TouchableOpacity
                                style={styles.verifyBtn}
                                onPress={handleResendVerification}
                                disabled={verifying}
                            >
                                <Text style={styles.verifyBtnText}>
                                    {verifying ? 'Sending...' : 'Resend Verification'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={handleDelete}
                            disabled={deleting}
                        >
                            <Text style={styles.deleteBtnText}>
                                {deleting ? 'Deleting...' : 'Delete Account'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Password Change Modal */}
                {passwordMode && (
                    <View style={styles.passwordModal}>
                        <Text style={styles.sectionTitle}>Change Password</Text>
                        <TextInput
                            style={styles.input}
                            value={passwords.currentPassword}
                            onChangeText={v => setPasswords({ ...passwords, currentPassword: v })}
                            placeholder="Current Password"
                            placeholderTextColor="#94A3B8"
                            secureTextEntry
                        />
                        <TextInput
                            style={styles.input}
                            value={passwords.newPassword}
                            onChangeText={v => setPasswords({ ...passwords, newPassword: v })}
                            placeholder="New Password"
                            placeholderTextColor="#94A3B8"
                            secureTextEntry
                        />
                        <View style={styles.formButtons}>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
                                <Text style={styles.saveBtnText}>Update Password</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPasswordMode(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        flex: 1,
        textAlign: 'center',
        marginTop: 50,
        color: '#64748B',
        fontSize: 14,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    avatarContainer: {
        alignItems: 'center',
        marginRight: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E2E8F0',
        marginBottom: 6,
    },
    avatarBtn: {
        backgroundColor: '#22C55E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    avatarBtnText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '500',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 6,
    },
    statusContainer: {
        flexDirection: 'row',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    verified: {
        backgroundColor: '#DCFCE7',
    },
    unverified: {
        backgroundColor: '#FEF3C7',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '500',
    },
    verifiedText: {
        color: '#16A34A',
    },
    unverifiedText: {
        color: '#D97706',
    },
    messageContainer: {
        backgroundColor: '#DCFCE7',
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 10,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#22C55E',
    },
    messageText: {
        color: '#16A34A',
        fontSize: 12,
        fontWeight: '500',
    },
    contentSection: {
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 12,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    detailsContainer: {
        paddingBottom: 16,
    },
    detailsGrid: {
        paddingHorizontal: 16,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    detailLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 13,
        color: '#1E293B',
        fontWeight: '400',
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    editForm: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
        fontSize: 13,
        backgroundColor: '#FFFFFF',
        color: '#1E293B',
    },
    formButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    saveBtn: {
        backgroundColor: '#22C55E',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        flex: 1,
    },
    saveBtnText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '500',
    },
    cancelBtn: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        flex: 1,
    },
    cancelBtnText: {
        color: '#64748B',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '500',
    },
    actionsSection: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 8,
    },
    actionBtn: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    actionBtnText: {
        color: '#1E293B',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '500',
    },
    verifyBtn: {
        backgroundColor: '#FEF3C7',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    verifyBtnText: {
        color: '#D97706',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '500',
    },
    deleteBtn: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EF4444',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 8,
    },
    deleteBtnText: {
        color: '#EF4444',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '500',
    },
    passwordModal: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
});

export default AccountDetailsScreen;