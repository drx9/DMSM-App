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
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7
        });
        if (!picker.canceled && picker.assets && picker.assets[0]) {
            setAvatarUploading(true);
            const uri = picker.assets[0].uri;
            const formData = new FormData();
            formData.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
            try {
                // Send file to backend for signed Cloudinary upload
                const uploadRes = await axios.post(`${API_URL}/upload-avatar`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                const { url } = uploadRes.data;
                if (!url) {
                    showMessage('Failed to upload avatar to server');
                    setAvatarUploading(false);
                    return;
                }
                try {
                    await axios.put(`${API_URL}/auth/user/${userIdRef.current}`, { photo: url });
                    showMessage('Avatar updated successfully!');
                    fetchUser();
                } catch (err) {
                    showMessage('Upload to server succeeded, but failed to update profile.');
                }
            } catch (err) {
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

    if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
    if (!user) return <Text style={styles.empty}>User info not found.</Text>;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Text style={styles.title}>Account Details</Text>
                <View style={styles.avatarRow}>
                    <Image source={user.photo
                        ? user.photo.startsWith('http')
                            ? { uri: user.photo }
                            : { uri: `${API_URL}${user.photo}` }
                        : require('../assets/images/dms-logo.png')}
                        style={styles.avatar} />
                    <TouchableOpacity style={styles.avatarBtn} onPress={handleAvatar} disabled={avatarUploading}>
                        <Text style={styles.avatarBtnText}>{avatarUploading ? 'Uploading...' : 'Change Photo'}</Text>
                    </TouchableOpacity>
                </View>
                {message && <Text style={styles.sideMessage}>{message}</Text>}
                {editMode ? (
                    <>
                        <TextInput style={styles.input} value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="Name" />
                        <TextInput style={styles.input} value={form.email} onChangeText={v => setForm({ ...form, email: v })} placeholder="Email" />
                        <TextInput style={styles.input} value={form.phoneNumber} onChangeText={v => setForm({ ...form, phoneNumber: v })} placeholder="Phone" />
                        <TextInput style={styles.input} value={form.gender} onChangeText={v => setForm({ ...form, gender: v })} placeholder="Gender" />
                        <TextInput style={styles.input} value={form.dateOfBirth} onChangeText={v => setForm({ ...form, dateOfBirth: v })} placeholder="Date of Birth (YYYY-MM-DD)" />
                        <View style={styles.rowBtns}>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditMode(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={styles.label}>Name: <Text style={styles.value}>{user.name}</Text></Text>
                        <Text style={styles.label}>Email: <Text style={styles.value}>{user.email}</Text></Text>
                        <Text style={styles.label}>Phone: <Text style={styles.value}>{user.phoneNumber || user.phone || '-'}</Text></Text>
                        <Text style={styles.label}>Gender: <Text style={styles.value}>{user.gender || '-'}</Text></Text>
                        <Text style={styles.label}>Date of Birth: <Text style={styles.value}>{user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '-'}</Text></Text>
                        <Text style={styles.label}>Role: <Text style={styles.value}>{user.role}</Text></Text>
                        <Text style={styles.label}>Verified: <Text style={styles.value}>{user.isVerified ? 'Yes' : 'No'}</Text></Text>
                        <Text style={styles.label}>Active: <Text style={styles.value}>{user.isActive ? 'Yes' : 'No'}</Text></Text>
                        <Text style={styles.label}>Joined: <Text style={styles.value}>{user.createdAt ? String(user.createdAt).slice(0, 10) : '-'}</Text></Text>
                        <View style={styles.rowBtns}>
                            <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(true)}><Text style={styles.editBtnText}>Edit</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.passBtn} onPress={() => setPasswordMode(true)}><Text style={styles.passBtnText}>Change Password</Text></TouchableOpacity>
                        </View>
                        {!user.isVerified && <TouchableOpacity style={styles.verifyBtn} onPress={handleResendVerification} disabled={verifying}><Text style={styles.verifyBtnText}>{verifying ? 'Sending...' : 'Resend Verification'}</Text></TouchableOpacity>}
                        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}><Text style={styles.deleteBtnText}>{deleting ? 'Deleting...' : 'Delete Account'}</Text></TouchableOpacity>
                    </>
                )}
                {passwordMode && (
                    <View style={styles.passModal}>
                        <TextInput style={styles.input} value={passwords.currentPassword} onChangeText={v => setPasswords({ ...passwords, currentPassword: v })} placeholder="Current Password" secureTextEntry />
                        <TextInput style={styles.input} value={passwords.newPassword} onChangeText={v => setPasswords({ ...passwords, newPassword: v })} placeholder="New Password" secureTextEntry />
                        <View style={styles.rowBtns}>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPasswordMode(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    label: { fontSize: 16, marginBottom: 10 },
    value: { fontWeight: '600' },
    empty: { flex: 1, textAlign: 'center', marginTop: 40, color: '#999' },
    avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 16, backgroundColor: '#eee' },
    avatarBtn: { backgroundColor: '#CB202D', padding: 8, borderRadius: 8 },
    avatarBtnText: { color: '#fff', fontWeight: 'bold' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10 },
    rowBtns: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
    saveBtn: { backgroundColor: '#1976D2', padding: 10, borderRadius: 8, flex: 1, marginRight: 5 },
    saveBtnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
    cancelBtn: { backgroundColor: '#eee', padding: 10, borderRadius: 8, flex: 1, marginLeft: 5 },
    cancelBtnText: { color: '#333', textAlign: 'center', fontWeight: 'bold' },
    editBtn: { backgroundColor: '#1976D2', padding: 10, borderRadius: 8, flex: 1, marginRight: 5 },
    editBtnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
    passBtn: { backgroundColor: '#CB202D', padding: 10, borderRadius: 8, flex: 1, marginLeft: 5 },
    passBtnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
    verifyBtn: { backgroundColor: '#FFD700', padding: 10, borderRadius: 8, marginVertical: 10 },
    verifyBtnText: { color: '#333', textAlign: 'center', fontWeight: 'bold' },
    deleteBtn: { backgroundColor: '#fff', borderColor: '#CB202D', borderWidth: 1, padding: 10, borderRadius: 8, marginVertical: 10 },
    deleteBtnText: { color: '#CB202D', textAlign: 'center', fontWeight: 'bold' },
    passModal: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginVertical: 20, elevation: 2 },
    sideMessage: { color: '#CB202D', marginBottom: 10, marginLeft: 10, fontWeight: 'bold' },
});

export default AccountDetailsScreen; 