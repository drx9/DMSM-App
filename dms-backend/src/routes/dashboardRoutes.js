const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { Product, User, Order } = require('../models');
const { Op } = require('sequelize');

// @route   GET /dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/stats', async (req, res) => {
    try {
        // Low stock items (stock < 10)
        const lowStockItems = await Product.findAll({ where: { stock: { [Op.lt]: 10 } }, attributes: ['id', 'name', 'stock'] });

        // Total customers (role = 'user')
        const totalCustomers = await User.count({ where: { role: 'user' } });

        // Total orders
        const totalOrders = await Order.count();

        // Total revenue (sum of all delivered orders)
        const totalRevenue = await Order.sum('totalAmount', { where: { status: 'delivered' } });

        // Orders per day for the last 7 days
        const ordersPerDay = await Order.findAll({
            attributes: [
                [Order.sequelize.fn('DATE', Order.sequelize.col('created_at')), 'date'],
                [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'count'],
            ],
            group: [Order.sequelize.fn('DATE', Order.sequelize.col('created_at'))],
            order: [[Order.sequelize.fn('DATE', Order.sequelize.col('created_at')), 'DESC']],
            limit: 7,
            raw: true,
        });

        res.json({
            lowStockItems,
            totalCustomers,
            totalOrders,
            totalRevenue,
            ordersPerDay: ordersPerDay.reverse(),
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
});

module.exports = router; 