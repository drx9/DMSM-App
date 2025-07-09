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

// Add or update a cart item with stock check
router.post('/', async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;
        if (quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });

        // Fetch product and check stock
        const product = await Product.findByPk(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.stock < quantity) return res.status(400).json({ error: 'Not enough stock available' });
        if (product.isOutOfStock || product.stock === 0) return res.status(400).json({ error: 'Product is out of stock' });

        let item = await CartItem.findOne({ where: { userId, productId } });
        if (item) {
            if (product.stock < quantity) return res.status(400).json({ error: 'Not enough stock available' });
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