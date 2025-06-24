const express = require('express');
const router = express.Router();
const { Address } = require('../models');

// Get all addresses for a user
router.get('/:userId', async (req, res) => {
    try {
        const addresses = await Address.findAll({ where: { userId: req.params.userId } });
        res.json(addresses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new address
router.post('/', async (req, res) => {
    try {
        const address = await Address.create(req.body);
        res.json(address);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an address
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Address.update(req.body, { where: { id } });
        const updated = await Address.findByPk(id);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete an address
router.delete('/:id', async (req, res) => {
    try {
        await Address.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Set default address
router.post('/set-default/:id', async (req, res) => {
    try {
        const address = await Address.findByPk(req.params.id);
        if (!address) return res.status(404).json({ error: 'Address not found' });
        await Address.update({ isDefault: false }, { where: { userId: address.userId } });
        address.isDefault = true;
        await address.save();
        res.json(address);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 