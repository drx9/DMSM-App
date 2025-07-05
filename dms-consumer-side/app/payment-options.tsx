import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const PaymentOptionsScreen = () => (
    <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Payment Options</Text>
        <Text style={styles.empty}>No payment methods added yet.</Text>
        {/* Render payment methods here in the future */}
    </SafeAreaView>
);

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    empty: { fontSize: 16, color: '#999', marginTop: 40, textAlign: 'center' },
});

export default PaymentOptionsScreen; 