const express = require('express');
const router = express.Router();
const { Order, User, OrderItem, Product } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

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

// GET /api/delivery/orders/history
// Get delivery history with statistics
router.get('/orders/history', async (req, res) => {
    try {
        const deliveryBoyId = req.user.id;
        const { period = 'week' } = req.query;
        
        let dateFilter = {};
        const now = new Date();
        
        switch (period) {
            case 'today':
                dateFilter = {
                    [Op.gte]: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                };
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                dateFilter = { [Op.gte]: weekStart };
                break;
            case 'month':
                dateFilter = {
                    [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
                };
                break;
            case 'all':
            default:
                dateFilter = {};
                break;
        }

        const orders = await Order.findAll({
            where: { 
                deliveryBoyId,
                status: 'delivered',
                ...(period !== 'all' && { updatedAt: dateFilter })
            },
            include: [
                { model: User, as: 'customer', attributes: ['name', 'phoneNumber'] },
                { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['name', 'images'] }] },
            ],
            order: [['updatedAt', 'DESC']],
        });

        // Calculate statistics
        const totalOrders = orders.length;
        const totalEarnings = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
        
        // Calculate average delivery time (simplified - using 30 minutes as default)
        const averageDeliveryTime = 30; // minutes

        res.json({
            orders: orders.map(order => ({
                id: order.id,
                status: order.status,
                totalAmount: order.totalAmount,
                shippingAddress: order.shippingAddress,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            })),
            stats: {
                totalOrders,
                totalEarnings,
                averageDeliveryTime
            }
        });
    } catch (error) {
        console.error('Error fetching delivery history:', error);
        res.status(500).json({ message: 'Error fetching delivery history' });
    }
});

// GET /api/delivery/metrics
// Get delivery boy metrics
router.get('/metrics', async (req, res) => {
    try {
        const deliveryBoyId = req.user.id;
        
        const totalOrders = await Order.count({ 
            where: { deliveryBoyId, status: 'delivered' } 
        });
        
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
        
        res.json({ 
            totalOrders, 
            totalKms, 
            payout 
        });
    } catch (error) {
        console.error('Error fetching delivery metrics:', error);
        res.status(500).json({ message: 'Error fetching delivery metrics' });
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