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
        try {
            const order = await Order.findByPk(req.params.id, {
                include: [
                    { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phoneNumber'] },
                    { model: User, as: 'deliveryBoy', attributes: ['id', 'name', 'phoneNumber'] },
                    { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
                ],
            });

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json(order);
        } catch (error) {
            console.error('Error fetching order:', error);
            res.status(500).json({ message: 'Error fetching order' });
        }
    },

    // Update order status
    updateOrderStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const order = await Order.findByPk(req.params.id);

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
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
            const userId = req.query.userId || req.body.userId || (req.user && req.user.id);
            const { addressId, paymentMethod } = req.body;
            if (!userId || !addressId) {
                return res.status(400).json({ message: 'userId and addressId are required' });
            }
            // Fetch address
            const address = await Address.findByPk(addressId);
            if (!address) {
                return res.status(404).json({ message: 'Address not found' });
            }
            // Find cart items for the user
            const cartItems = await CartItem.findAll({ where: { userId } });
            if (!cartItems.length) {
                return res.status(400).json({ message: 'Cart is empty' });
            }
            // Calculate total
            let totalAmount = 0;
            for (const cartItem of cartItems) {
                const product = await Product.findByPk(cartItem.productId);
                totalAmount += (product.price * cartItem.quantity);
            }
            // Create order
            const order = await Order.create({
                userId,
                shippingAddress: address.toJSON(),
                status: 'pending',
                totalAmount,
                paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
            });
            // Move cart items to order items
            for (const cartItem of cartItems) {
                await OrderItem.create({
                    orderId: order.id,
                    productId: cartItem.productId,
                    quantity: cartItem.quantity,
                    price: (await Product.findByPk(cartItem.productId)).price,
                });
            }
            // Clear cart
            await CartItem.destroy({ where: { userId } });
            res.json(order);
        } catch (error) {
            console.error('Error placing order:', error);
            res.status(500).json({ message: 'Error placing order' });
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
            res.json(orders);
        } catch (error) {
            console.error('Error fetching user orders:', error);
            res.status(500).json({ message: 'Error fetching user orders' });
        }
    },
};

module.exports = orderController; 