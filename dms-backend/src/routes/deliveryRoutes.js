const express = require('express');
const router = express.Router();
const { Order, User, OrderItem, Product } = require('../models');

// GET /api/delivery/orders/:orderId
// Returns order details for the delivery boy if assigned to them
router.get('/orders/:orderId', async (req, res) => {
    try {
        // In a real app, get deliveryBoyId from auth token (req.user.id)
        // For now, allow passing as query param for testing
        const deliveryBoyId = req.user?.id || req.query.deliveryBoyId;
        const { orderId } = req.params;
        if (!deliveryBoyId) {
            return res.status(401).json({ message: 'Delivery boy authentication required' });
        }
        const order = await Order.findOne({
            where: { id: orderId, deliveryBoyId },
            include: [
                { model: User, as: 'customer', attributes: ['name', 'phoneNumber'] },
                { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['name', 'images'] }] },
            ],
        });
        if (!order) {
            return res.status(404).json({ message: 'Order not found or not assigned to you' });
        }
        res.json({
            id: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            customer: order.customer,
            shippingAddress: order.shippingAddress,
            products: order.items.map(item => ({
                name: item.product?.name || 'Unknown',
                quantity: item.quantity,
                image: item.product?.images?.[0] || null,
            })),
        });
    } catch (error) {
        console.error('Error fetching delivery order details:', error);
        res.status(500).json({ message: 'Error fetching delivery order details' });
    }
});

module.exports = router; 