const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { User, Order } = require('../models');
// const { isAdmin } = require('../middleware/auth'); // Temporarily disabled for dev
const { Op } = require('sequelize');

// Delivery Boy Management Endpoints (must come before parameterized order routes)
router.get('/delivery-boys', async (req, res) => {
    try {
        const deliveryBoys = await User.findAll({ where: { role: 'delivery' }, attributes: ['id', 'name', 'email', 'phoneNumber', 'isActive', 'createdAt'] });
        res.json(deliveryBoys);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch delivery boys' });
    }
});

router.post('/delivery-boys', async (req, res) => {
    try {
        const { name, email, phoneNumber, password } = req.body;
        const user = await User.create({ name, email, phoneNumber, password, role: 'delivery', isVerified: true, isActive: true });
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Failed to add delivery boy' });
    }
});

router.put('/delivery-boys/:id', async (req, res) => {
    try {
        const { name, email, phoneNumber, isActive } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user || user.role !== 'delivery') return res.status(404).json({ message: 'Delivery boy not found' });
        user.name = name ?? user.name;
        user.email = email ?? user.email;
        user.phoneNumber = phoneNumber ?? user.phoneNumber;
        user.isActive = isActive ?? user.isActive;
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update delivery boy' });
    }
});

router.delete('/delivery-boys/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user || user.role !== 'delivery') return res.status(404).json({ message: 'Delivery boy not found' });
        await user.destroy();
        res.json({ message: 'Delivery boy deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete delivery boy' });
    }
});

router.get('/delivery-boys/:id/metrics', async (req, res) => {
    try {
        const deliveryBoyId = req.params.id;
        const totalOrders = await Order.count({ where: { deliveryBoyId, status: 'delivered' } });
        // If you have a distance_km column in orders, sum it. Otherwise, set to 0.
        let totalKms = 0;
        if (Order.rawAttributes.distance_km) {
            const result = await Order.findOne({
                where: { deliveryBoyId, status: 'delivered' },
                attributes: [[Order.sequelize.fn('SUM', Order.sequelize.col('distance_km')), 'totalKms']],
                raw: true,
            });
            totalKms = parseFloat(result.totalKms) || 0;
        }
        const payout = totalOrders * 50; // ₹50 per delivered order
        const locations = await Order.findAll({ where: { deliveryBoyId, status: 'delivered' }, attributes: ['shippingAddress'] });
        res.json({ totalOrders, totalKms, payout, locations });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch metrics' });
    }
});

// Order endpoints (keep these after delivery boy routes)
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);
router.put('/:id/assign-delivery', async (req, res) => {
    try {
        const { deliveryBoyId } = req.body;
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        order.deliveryBoyId = deliveryBoyId;
        order.status = 'processing';
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Failed to assign delivery boy' });
    }
});

module.exports = router; 