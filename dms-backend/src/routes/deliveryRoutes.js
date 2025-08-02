const express = require('express');
const router = express.Router();
const { Order, User, OrderItem, Product } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Protect all delivery routes
router.use(authenticateToken);

// GET /api/delivery/orders
// List all orders assigned to the delivery boy
router.get('/orders', async (req, res) => {
    try {
        const deliveryBoyId = req.user.id;
        const orders = await Order.findAll({
            where: { deliveryBoyId },
            include: [
                { model: User, as: 'customer', attributes: ['name', 'phoneNumber'] },
                { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['name', 'images'] }] },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json(orders.map(order => ({
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
            totalAmount: order.totalAmount,
        })));
    } catch (error) {
        console.error('Error fetching assigned orders:', error);
        res.status(500).json({ message: 'Error fetching assigned orders' });
    }
});

// GET /api/delivery/orders/:orderId
// Returns order details for the delivery boy if assigned to them
router.get('/orders/:orderId', async (req, res) => {
    try {
        const deliveryBoyId = req.user.id;
        const { orderId } = req.params;
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
            totalAmount: order.totalAmount,
        });
    } catch (error) {
        console.error('Error fetching delivery order details:', error);
        res.status(500).json({ message: 'Error fetching delivery order details' });
    }
});

// PUT /api/delivery/orders/:orderId/status
// Update status of assigned order
router.put('/orders/:orderId/status', async (req, res) => {
    try {
        const deliveryBoyId = req.user.id;
        const { orderId } = req.params;
        const { status } = req.body;
        const order = await Order.findOne({ 
            where: { id: orderId, deliveryBoyId },
            include: [{ model: User, as: 'customer', attributes: ['id', 'name'] }]
        });
        if (!order) {
            return res.status(404).json({ message: 'Order not found or not assigned to you' });
        }
        
        const oldStatus = order.status;
        order.status = status;
        await order.save();

        // Send FCM notification to customer
        const { sendFCMNotificationToUser } = require('../services/fcmService');
        const { emitToUser, emitToOrder } = require('../socket');

        // Real-time updates
        emitToUser(order.userId, 'order_status_update', { orderId: order.id, status });
        emitToOrder(order.id, 'order_status_update', { orderId: order.id, status });

        // Push notification with specific messages for each status
        let notificationTitle = 'Order Update';
        let notificationBody = `Your order status is now: ${status}`;

        switch (status) {
            case 'processing':
                notificationTitle = 'Order Confirmed';
                notificationBody = 'Your order has been confirmed and is being processed!';
                break;
            case 'shipped':
                notificationTitle = 'Order Shipped';
                notificationBody = 'Your order has been shipped and is on its way!';
                break;
            case 'out_for_delivery':
                notificationTitle = 'Out for Delivery';
                notificationBody = 'Your order is out for delivery and will arrive soon!';
                break;
            case 'delivered':
                notificationTitle = 'Order Delivered';
                notificationBody = 'Your order has been delivered successfully!';
                break;
            case 'cancelled':
                notificationTitle = 'Order Cancelled';
                notificationBody = 'Your order has been cancelled.';
                break;
        }

        await sendFCMNotificationToUser(order.userId, notificationTitle, notificationBody, { 
            orderId: order.id, 
            status
        });

        res.json({ message: 'Order status updated', status: order.status });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status' });
    }
});

module.exports = router; 