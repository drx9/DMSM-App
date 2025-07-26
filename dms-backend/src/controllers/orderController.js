const { Order, OrderItem, User, Product, CartItem, Address, Coupon } = require('../models');
const couponController = require('./couponController');
const { emitToUser, emitToOrder, emitToRole } = require('../socket');
const { sendPushNotification, sendNotificationWithPreferences } = require('../services/pushService');
const { ExpoPushToken } = require('../models');
const { Sequelize } = require('sequelize');

const orderController = {
    // Get all orders (for admin)
    getAllOrders: async (req, res) => {
        try {
            const { page = 1, limit = 10, sort = 'createdAt', order = 'DESC' } = req.query;
            const offset = (page - 1) * limit;

            const orders = await Order.findAndCountAll({
                include: [
                    { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
                    { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }] },
                ],
                order: [[sort, order]],
                limit: parseInt(limit),
                offset: parseInt(offset),
            });

            res.json({
                orders: orders.rows.map(order => ({
                    ...order.toJSON(),
                    deliverySlot: order.deliverySlot
                })),
                totalOrders: orders.count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(orders.count / limit),
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ message: 'Error fetching orders' });
        }
    },

    // Get a single order by ID
    getOrderById: async (req, res) => {
        console.log('getOrderById called for', req.params.id);
        try {
            const orderId = req.params.id;
            
            // Additional validation for UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(orderId)) {
                console.error('[getOrderById] Invalid UUID format:', orderId);
                return res.status(400).json({ 
                    message: 'Invalid order ID format. Expected UUID format.',
                    received: orderId 
                });
            }
            
            console.log('[getOrderById] Requested order id:', orderId);
            const order = await Order.findByPk(orderId, {
                include: [
                    { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phoneNumber'] },
                    { model: User, as: 'deliveryBoy', attributes: ['id', 'name', 'phoneNumber'] },
                    { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
                ],
            });

            if (!order) {
                console.log('[getOrderById] Order not found for id:', req.params.id);
                return res.status(404).json({ message: 'Order not found' });
            }

            console.log('[getOrderById] Raw order:', JSON.stringify(order, null, 2));
            if (!order.customer) {
                console.log('[getOrderById] Order missing customer association');
            }
            if (!order.items || !Array.isArray(order.items)) {
                console.log('[getOrderById] Order missing items association');
            } else {
                order.items.forEach((item, idx) => {
                    if (!item.product) {
                        console.log(`[getOrderById] Order item at index ${idx} missing product association`);
                    }
                });
            }

            // Defensive: ensure all associations are present
            const safeUser = order.customer || { name: 'Unknown', email: '', phoneNumber: '' };
            const safeDeliveryBoy = order.deliveryBoy || { name: '', phoneNumber: '' };
            const safeOrderItems = Array.isArray(order.items)
                ? order.items.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    product: item.product || { name: 'Unknown', price: 0, images: [] },
                }))
                : [];
            res.json({
                id: order.id,
                status: order.status,
                totalAmount: order.totalAmount,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                shippingAddress: order.shippingAddress,
                user: safeUser,
                deliveryBoy: safeDeliveryBoy,
                orderItems: safeOrderItems,
                deliverySlot: order.deliverySlot,
            });
        } catch (error) {
            console.error('[getOrderById] Error fetching order:', error);
            res.status(500).json({ message: 'Error fetching order', error: error.stack });
        }
    },

    // Update order status
    updateOrderStatus: async (req, res) => {
        try {
            const { status, deliveryKey } = req.body;
            const order = await Order.findByPk(req.params.id);

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            // If status is 'delivered', require deliveryKey
            if (status === 'delivered') {
                if (!deliveryKey || order.deliveryKey !== deliveryKey) {
                    return res.status(400).json({ message: 'Invalid delivery key' });
                }
            }

            // If status is 'shipped', reduce stock
            if (status === 'shipped' && order.status !== 'shipped') {
                const orderItems = await OrderItem.findAll({ where: { orderId: order.id } });
                for (const item of orderItems) {
                    await Product.decrement('stock', { by: item.quantity, where: { id: item.productId } });
                }
            }

            order.status = status;
            await order.save();

            // Real-time: emit to user, order, and admin
            emitToOrder(order.id, 'order_status_update', { orderId: order.id, status });
            emitToUser(order.userId, 'order_status_update', { orderId: order.id, status });
            emitToRole('admin', 'order_status_update', { orderId: order.id, status });

            // Push notification with specific messages for each status
            let notificationTitle = 'Order Update';
            let notificationBody = `Your order status is now: ${status}`;

            switch (status) {
                case 'pending':
                    notificationTitle = 'Order Placed';
                    notificationBody = 'Your order has been placed and is awaiting confirmation!';
                    break;
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

            await sendNotificationWithPreferences(order.userId, notificationTitle, notificationBody, { 
                orderId: order.id, 
                status
            }, 'order_updates');

            res.json(order);
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({ message: 'Error updating order status' });
        }
    },

    // Place order logic
    placeOrder: async (req, res) => {
        try {
            console.log('[placeOrder] Incoming body:', req.body);
            const userId = req.body.userId || req.query.userId || (req.user && req.user.id);
            const { address, cartItems, paymentMethod, total, couponCode, deliverySlot } = req.body;
            if (!userId || !address || !cartItems || !cartItems.length) {
                return res.status(400).json({ message: 'userId, address, and cartItems are required' });
            }
            // Stock validation for all cart items
            for (const item of cartItems) {
                const product = await Product.findByPk(item.id);
                if (!product) {
                    return res.status(400).json({ message: `Product with id ${item.id} not found` });
                }
                if (product.stock < item.quantity) {
                    return res.status(400).json({ message: `Not enough stock for product ${product.name}` });
                }
                if (product.isOutOfStock || product.stock === 0) {
                    return res.status(400).json({ message: `Product ${product.name} is out of stock` });
                }
            }
            // Coupon logic
            let discount = 0;
            let coupon = null;
            if (couponCode) {
                const cleanCode = couponCode.trim().toUpperCase();
                const couponRes = await Coupon.findOne({
                  where: {
                    [Sequelize.Op.and]: [
                      Sequelize.where(Sequelize.fn('upper', Sequelize.col('code')), cleanCode),
                      { isActive: true },
                    ]
                  }
                });
                if (!couponRes || couponRes.remainingUses <= 0) {
                    return res.status(400).json({ message: 'Invalid or expired coupon' });
                }
                // Only validate coupon, do not apply discount again
                coupon = couponRes;
            }
            // Generate 4-digit delivery key
            const deliveryKey = Math.floor(1000 + Math.random() * 9000).toString();
            // Log incoming total and what will be saved
            console.log(`[placeOrder] Received total from frontend:`, total);
            console.log(`[placeOrder] Coupon applied:`, couponCode ? 'Yes' : 'No');
            // Create order
            const order = await Order.create({
                userId,
                shippingAddress: address, // full address object with lat/lng
                status: 'pending',
                totalAmount: total, // Use the total sent from frontend (already includes discount)
                paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
                deliveryKey,
                deliverySlot,
            });
            // Create order items
            for (const item of cartItems) {
                await OrderItem.create({
                    orderId: order.id,
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price,
                });
            }
            // Mark coupon as used
            if (coupon && couponCode) {
                await couponController.markCouponUsed(couponCode, userId, order.id);
            }
            // Clear cart
            await CartItem.destroy({ where: { userId } });

            // Real-time: emit to user and admin
            emitToUser(userId, 'order_placed', { orderId: order.id });
            emitToRole('admin', 'order_placed', { orderId: order.id });

            // Push notification for order placement
            await sendNotificationWithPreferences(userId, 'Order Placed Successfully', 'Your order has been placed and is awaiting confirmation!', { 
                orderId: order.id,
                status: 'pending'
            }, 'order_updates');

            res.json(order);
        } catch (error) {
            console.error('[placeOrder] Error placing order:', error);
            res.status(500).json({ message: 'Error placing order', error: error.stack });
        }
    },

    // Get all orders for a specific user
    getUserOrders: async (req, res) => {
        try {
            const userId = req.params.userId;
            const orders = await Order.findAll({
                where: { userId },
                include: [
                    { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
                ],
                order: [['createdAt', 'DESC']],
            });
            // Explicitly include deliveryKey in the response
            const ordersWithDeliveryKey = orders.map(order => ({
                id: order.id,
                status: order.status,
                totalAmount: order.totalAmount,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                shippingAddress: order.shippingAddress,
                items: order.items,
                deliveryKey: order.deliveryKey,
                deliverySlot: order.deliverySlot,
            }));
            res.json(ordersWithDeliveryKey);
        } catch (error) {
            console.error('Error fetching user orders:', error);
            res.status(500).json({ message: 'Error fetching user orders' });
        }
    },

    // Bulk assign delivery boy to multiple orders
    bulkAssignDeliveryBoy: async (req, res) => {
        try {
            const { orderIds, deliveryBoyId } = req.body;
            if (!Array.isArray(orderIds) || !deliveryBoyId) {
                return res.status(400).json({ message: 'orderIds (array) and deliveryBoyId are required' });
            }
            // Check if delivery boy has any undelivered orders
            const undelivered = await Order.findOne({
                where: {
                    deliveryBoyId,
                    status: { [Order.sequelize.Op.not]: 'delivered' },
                },
            });
            if (undelivered) {
                return res.status(400).json({ message: 'This delivery boy already has undelivered orders. Complete them before assigning new ones.' });
            }
            // Assign delivery boy to all selected orders
            const updated = await Order.update(
                { deliveryBoyId, status: 'processing' },
                { where: { id: orderIds } }
            );
            const updatedOrders = await Order.findAll({ where: { id: orderIds } });

            // Real-time: emit to delivery boy and send push notification
            const { emitToUser } = require('../socket');
            
            for (const order of updatedOrders) {
                // Notify delivery boy
                emitToUser(deliveryBoyId, 'assigned_order', { orderId: order.id });
                
                // Notify customer about delivery boy assignment
                emitToUser(order.userId, 'order_status_update', { 
                    orderId: order.id, 
                    status: 'processing',
                    deliveryBoyAssigned: true 
                });
                
                // Send push notification to delivery boy
                await sendNotificationWithPreferences(deliveryBoyId, 'New Delivery Assigned', 'You have been assigned a new delivery order.', {
                    orderId: order.id
                }, 'delivery');
                
                // Send push notification to customer
                await sendNotificationWithPreferences(order.userId, 'Order Confirmed', 'Your order has been confirmed and a delivery partner has been assigned!', {
                    orderId: order.id,
                    status: 'processing'
                }, 'order_updates');
            }

            res.json({ updated: updated[0], orders: updatedOrders });
        } catch (error) {
            console.error('Error in bulkAssignDeliveryBoy:', error);
            res.status(500).json({ message: 'Failed to assign delivery boy to selected orders' });
        }
    },
};

module.exports = orderController; 