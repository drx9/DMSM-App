import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PaymentOptionsScreen = () => (
    <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Payment Options</Text>
        
        <View style={styles.paymentMethods}>
            {/* COD - Available */}
            <View style={styles.paymentMethod}>
                <View style={styles.paymentMethodLeft}>
                    <Ionicons name="cash-outline" size={24} color="#666" />
                    <View style={styles.paymentMethodText}>
                        <Text style={styles.paymentMethodLabel}>Cash on Delivery</Text>
                        <Text style={styles.paymentMethodSubtitle}>Pay when you receive your order</Text>
                    </View>
                </View>
                <View style={styles.availableBadge}>
                    <Text style={styles.availableBadgeText}>Available</Text>
                </View>
            </View>

            {/* UPI - Coming Soon */}
            <View style={styles.paymentMethod}>
                <View style={styles.paymentMethodLeft}>
                    <Ionicons name="card-outline" size={24} color="#ccc" />
                    <View style={styles.paymentMethodText}>
                        <Text style={styles.paymentMethodLabelDisabled}>UPI</Text>
                        <Text style={styles.paymentMethodSubtitleDisabled}>Google Pay, PhonePe, and more</Text>
                    </View>
                </View>
                <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
                </View>
            </View>

            {/* Cards - Coming Soon */}
            <View style={styles.paymentMethod}>
                <View style={styles.paymentMethodLeft}>
                    <Ionicons name="card-outline" size={24} color="#ccc" />
                    <View style={styles.paymentMethodText}>
                        <Text style={styles.paymentMethodLabelDisabled}>Credit / Debit Cards</Text>
                        <Text style={styles.paymentMethodSubtitleDisabled}>Visa, Mastercard, RuPay</Text>
                    </View>
                </View>
                <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
                </View>
            </View>

            {/* Net Banking - Coming Soon */}
            <View style={styles.paymentMethod}>
                <View style={styles.paymentMethodLeft}>
                    <Ionicons name="business-outline" size={24} color="#ccc" />
                    <View style={styles.paymentMethodText}>
                        <Text style={styles.paymentMethodLabelDisabled}>Net Banking</Text>
                        <Text style={styles.paymentMethodSubtitleDisabled}>All major banks supported</Text>
                    </View>
                </View>
                <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
                </View>
            </View>

            {/* Gift Cards - Coming Soon */}
            <View style={styles.paymentMethod}>
                <View style={styles.paymentMethodLeft}>
                    <Ionicons name="gift-outline" size={24} color="#ccc" />
                    <View style={styles.paymentMethodText}>
                        <Text style={styles.paymentMethodLabelDisabled}>DMSM Gift Cards</Text>
                        <Text style={styles.paymentMethodSubtitleDisabled}>Use gift cards for payment</Text>
                    </View>
                </View>
                <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
                </View>
            </View>
        </View>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    paymentMethods: {
        marginTop: 20,
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    paymentMethodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    paymentMethodText: {
        marginLeft: 12,
        flex: 1,
    },
    paymentMethodLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        marginBottom: 4,
    },
    paymentMethodLabelDisabled: {
        fontSize: 16,
        fontWeight: '500',
        color: '#999',
        marginBottom: 4,
    },
    paymentMethodSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    paymentMethodSubtitleDisabled: {
        fontSize: 14,
        color: '#ccc',
    },
    availableBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    availableBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    comingSoonBadge: {
        backgroundColor: '#FF6B35',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    comingSoonBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default PaymentOptionsScreen; 