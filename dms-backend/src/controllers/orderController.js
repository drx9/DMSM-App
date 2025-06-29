const { Order, OrderItem, User, Product } = require('../models');

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
};

module.exports = orderController; 