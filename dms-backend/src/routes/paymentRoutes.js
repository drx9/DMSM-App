const express = require('express');
const router = express.Router();

// Payment methods with COD only available, others coming soon
const defaultPaymentMethods = [
    {
        id: 'cod',
        label: 'Cash on Delivery',
        icon: 'cash-outline',
        subtitle: 'Pay when you receive your order',
        available: true
    },
    {
        id: 'upi',
        label: 'UPI',
        icon: 'card-outline',
        subtitle: 'Coming Soon',
        available: false,
        comingSoon: true,
        subMethods: [
            { id: 'googlepay', label: 'Google Pay', icon: 'logo-google' },
            { id: 'phonepe', label: 'PhonePe', icon: 'call-outline' },
            { id: 'custom_upi', label: 'Add new UPI ID', icon: 'add-outline' }
        ]
    },
    {
        id: 'card',
        label: 'Credit / Debit / ATM Card',
        icon: 'card-outline',
        subtitle: 'Coming Soon',
        available: false,
        comingSoon: true,
        offer: '5% cashback on Axis Bank DMSM Debit Card up to ₹750'
    },
    {
        id: 'netbanking',
        label: 'Net Banking',
        icon: 'business-outline',
        subtitle: 'Coming Soon',
        available: false,
        comingSoon: true
    },
    {
        id: 'gift',
        label: 'Have a DMSM Gift Card?',
        icon: 'gift-outline',
        subtitle: 'Coming Soon',
        available: false,
        comingSoon: true,
        action: 'Add'
    }
];

router.get('/:userId', (req, res) => {
    // In the future, fetch user-specific methods from DB
    res.json(defaultPaymentMethods);
});

module.exports = router; 