const { Order, OrderItem, User, Product, CartItem, Address } = require('../models');

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
                orders: orders.rows,
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
            console.log('[getOrderById] Requested order id:', req.params.id);
            const order = await Order.findByPk(req.params.id, {
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
            const { address, cartItems, paymentMethod, total } = req.body;
            if (!userId || !address || !cartItems || !cartItems.length) {
                return res.status(400).json({ message: 'userId, address, and cartItems are required' });
            }
            // Generate 4-digit delivery key
            const deliveryKey = Math.floor(1000 + Math.random() * 9000).toString();
            // Create order
            const order = await Order.create({
                userId,
                shippingAddress: address, // full address object with lat/lng
                status: 'pending',
                totalAmount: total,
                paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
                deliveryKey,
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
            // Clear cart
            await CartItem.destroy({ where: { userId } });
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
            res.json({ updated: updated[0], orders: updatedOrders });
        } catch (error) {
            console.error('Error in bulkAssignDeliveryBoy:', error);
            res.status(500).json({ message: 'Failed to assign delivery boy to selected orders' });
        }
    },
};

module.exports = orderController; 