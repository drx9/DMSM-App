import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const CustomerSupportScreen = () => (
    <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Customer Support</Text>
        <Text style={styles.info}>For help, contact us at:</Text>
        <Text style={styles.email}>support@dmsm.com</Text>
        <Text style={styles.info}>Or call: +91-12345-67890</Text>
        {/* Add more support/contact options here */}
    </SafeAreaView>
);

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    info: { fontSize: 16, marginBottom: 10 },
    email: { fontSize: 16, color: '#CB202D', marginBottom: 10 },
});

export default CustomerSupportScreen; 