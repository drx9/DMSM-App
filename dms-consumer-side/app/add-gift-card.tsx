import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const AddGiftCardScreen = () => (
    <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Add Gift Card</Text>
        <Text style={styles.empty}>Feature coming soon.</Text>
        {/* Add gift card form here in the future */}
    </SafeAreaView>
);

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    empty: { fontSize: 16, color: '#999', marginTop: 40, textAlign: 'center' },
});

export default AddGiftCardScreen; 