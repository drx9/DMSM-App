const express = require('express');
const router = express.Router();

// Dummy data for now
const defaultPaymentMethods = [
    {
        id: 'upi',
        label: 'UPI',
        icon: 'card-outline',
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
        subtitle: 'Add and secure cards as per RBI guidelines',
        offer: '5% cashback on Axis Bank DMSM Debit Card up to ₹750'
    },
    {
        id: 'netbanking',
        label: 'Net Banking',
        icon: 'business-outline'
    },
    {
        id: 'cod',
        label: 'Cash on Delivery',
        icon: 'cash-outline'
    },
    {
        id: 'gift',
        label: 'Have a DMSM Gift Card?',
        icon: 'gift-outline',
        action: 'Add'
    }
];

router.get('/:userId', (req, res) => {
    // In the future, fetch user-specific methods from DB
    res.json(defaultPaymentMethods);
});

module.exports = router; 