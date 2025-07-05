const express = require('express');
const router = express.Router();
const { CartItem, Product } = require('../models');
const cartController = require('../controllers/cartController');

// Get all cart items for a user
router.get('/:userId', async (req, res) => {
    try {
        const items = await CartItem.findAll({
            where: { userId: req.params.userId },
            include: [Product],
        });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add or update a cart item
router.post('/', async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;
        let item = await CartItem.findOne({ where: { userId, productId } });
        if (item) {
            item.quantity = quantity;
            await item.save();
        } else {
            item = await CartItem.create({ userId, productId, quantity });
        }
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update quantity of a cart item
router.put('/:userId/:productId', cartController.updateCartItemQuantity);

// Remove a cart item
router.delete('/:userId/:productId', async (req, res) => {
    try {
        const { userId, productId } = req.params;
        await CartItem.destroy({ where: { userId, productId } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/count/:userId', cartController.getCartCount);

module.exports = router; 